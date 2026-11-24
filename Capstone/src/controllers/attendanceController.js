const Attendance = require('../models/Attendance');
const Section = require('../models/Section');
const { appEvents, EVENTS } = require('../events/appEvents');
const AttendanceAudit = require('../models/AttendanceAudit');

exports.mark = async (req, res, next) => {
  try {
    const { sectionId, classDate, topic, records } = req.body;
    const section = await Section.findById(sectionId).populate('students course');
    if (!section) { const error = new Error('Section not found'); error.statusCode = 404; throw error; }
    if (req.user.role !== 'admin' && !section.faculty.equals(req.user._id)) {
      const error = new Error('You are not assigned to this section'); error.statusCode = 403; throw error;
    }
    if (!Array.isArray(records) || records.length === 0) { const error = new Error('Attendance records are required'); error.statusCode = 400; throw error; }
    const studentIds = records.map((record) => record.student);
    const invalid = studentIds.some((id) => !section.students.some((student) => student.equals(id)));
    if (invalid) { const error = new Error('One or more students are not enrolled in this section'); error.statusCode = 400; throw error; }
    if (new Set(studentIds.map(String)).size !== studentIds.length) { const error = new Error('Duplicate student attendance is not allowed'); error.statusCode = 409; throw error; }

    const date = new Date(classDate);
    date.setUTCHours(0, 0, 0, 0);
    const attendance = await Attendance.create({
      course: section.course._id,
      section: section._id,
      markedBy: req.user._id,
      classDate: date,
      topic,
      records
    });
    const payload = { section: String(section._id), course: section.course.code, classDate: date, records: records.length };
    appEvents.emit(EVENTS.ATTENDANCE_MARKED, payload);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) { next(error); }
};

exports.correct = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('section');
    if (!attendance) { const error = new Error('Attendance record not found'); error.statusCode = 404; throw error; }
    if (req.user.role !== 'admin' && !attendance.section.faculty.equals(req.user._id)) {
      const error = new Error('You are not assigned to this section'); error.statusCode = 403; throw error;
    }
    const record = attendance.records.id(req.body.recordId);
    if (!record) { const error = new Error('Student attendance record not found'); error.statusCode = 404; throw error; }
    if (!req.body.status || !['present', 'absent', 'late'].includes(req.body.status)) {
      const error = new Error('A valid attendance status is required'); error.statusCode = 400; throw error;
    }
    const previousStatus = record.status;
    record.status = req.body.status;
    record.correctedBy = req.user._id;
    record.correctionReason = req.body.reason || 'Correction by authorized faculty';
    await attendance.save();
    await AttendanceAudit.create({
      attendance: attendance._id,
      record: record._id,
      student: record.student,
      previousStatus,
      newStatus: record.status,
      changedBy: req.user._id,
      reason: record.correctionReason
    });
    appEvents.emit(EVENTS.ATTENDANCE_CORRECTED, { attendanceId: attendance._id });
    res.json({ success: true, data: attendance });
  } catch (error) { next(error); }
};

exports.myAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.params.studentId;
    if (!studentId) { const error = new Error('Student ID required'); error.statusCode = 400; throw error; }
    if (req.user.role === 'student' && String(studentId) !== String(req.user._id)) {
      const error = new Error('Students cannot view another student attendance'); error.statusCode = 403; throw error;
    }
    const data = await Attendance.find({ 'records.student': studentId })
      .populate('course', 'code title')
      .populate('section', 'name')
      .sort({ classDate: -1 });
    const summary = {};
    data.forEach((session) => {
      const record = session.records.find((item) => String(item.student) === String(studentId));
      const key = session.course.code;
      if (!summary[key]) summary[key] = { course: session.course, total: 0, attended: 0 };
      summary[key].total++;
      if (record && record.status !== 'absent') summary[key].attended++;
    });
    Object.values(summary).forEach((item) => { item.percentage = item.total ? Math.round(item.attended / item.total * 100) : 0; });
    res.json({ success: true, data: { sessions: data, summary: Object.values(summary) } });
  } catch (error) { next(error); }
};
