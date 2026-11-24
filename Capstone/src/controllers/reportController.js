const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Section = require('../models/Section');
const Setting = require('../models/Setting');
const AttendanceAudit = require('../models/AttendanceAudit');

exports.attendanceSummary = async (req, res, next) => {
  try {
    const configured = await Setting.findOne({ key: 'attendanceThreshold' });
    const threshold = Math.max(parseInt(req.query.threshold) || (configured?.value ?? 75), 0);
    const data = await Attendance.aggregate([
      { $unwind: '$records' },
      { $match: { 'records.status': { $in: ['present', 'absent', 'late'] } } },
      { $group: {
        _id: { student: '$records.student', course: '$course' },
        total: { $sum: 1 },
        attended: { $sum: { $cond: [{ $ne: ['$records.status', 'absent'] }, 1, 0] } }
      } },
      { $project: {
        student: '$_id.student',
        course: '$_id.course',
        total: 1,
        attended: 1,
        percentage: { $round: [{ $multiply: [{ $divide: ['$attended', '$total'] }, 100] }, 1] }
      } },
      { $match: { percentage: { $lt: threshold } } },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $unwind: '$studentInfo' },
      { $unwind: '$courseInfo' },
      { $project: {
        _id: 0,
        studentId: '$studentInfo._id',
        studentName: '$studentInfo.name',
        studentNumber: '$studentInfo.studentId',
        courseCode: '$courseInfo.code',
        courseTitle: '$courseInfo.title',
        total: 1,
        attended: 1,
        percentage: 1
      } },
      { $sort: { percentage: 1 } }
    ]);
    res.json({ success: true, threshold, data });
  } catch (error) { next(error); }
};

exports.enrolmentSummary = async (req, res, next) => {
  try {
    const data = await Section.aggregate([
      { $project: {
        name: 1,
        course: 1,
        faculty: 1,
        academicYear: 1,
        enrolmentCount: { $size: { $ifNull: ['$students', []] } }
      } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $lookup: { from: 'users', localField: 'faculty', foreignField: '_id', as: 'facultyInfo' } },
      { $unwind: '$courseInfo' },
      { $unwind: '$facultyInfo' },
      { $project: {
        _id: 0,
        section: '$name',
        academicYear: 1,
        courseCode: '$courseInfo.code',
        courseTitle: '$courseInfo.title',
        faculty: '$facultyInfo.name',
        enrolmentCount: 1
      } },
      { $sort: { courseCode: 1, section: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.dashboard = async (req, res, next) => {
  try {
    const [students, faculty, sections, recentAttendance] = await Promise.all([
      mongoose.model('User').countDocuments({ role: 'student', isActive: true }),
      mongoose.model('User').countDocuments({ role: 'faculty', isActive: true }),
      Section.countDocuments(),
      Attendance.countDocuments()
    ]);
    res.json({ success: true, data: { students, faculty, sections, attendanceSessions: recentAttendance } });
  } catch (error) { next(error); }
};
