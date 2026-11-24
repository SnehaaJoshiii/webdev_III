const router = require('express').Router();
const controller = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const AttendanceAudit = require('../models/AttendanceAudit');

router.get('/dashboard', protect, controller.dashboard);
router.get('/attendance/low', protect, authorize('admin', 'faculty'), controller.attendanceSummary);
router.get('/enrolments', protect, authorize('admin', 'faculty'), controller.enrolmentSummary);
router.get('/attendance/csv', protect, authorize('admin', 'faculty'), async (req, res, next) => {
  try {
    const attendance = await Attendance.find({})
      .populate('course', 'code title')
      .populate('section', 'name')
      .populate('records.student', 'name studentId')
      .sort({ classDate: -1 });
    const rows = [['Date', 'Course', 'Section', 'Student ID', 'Student', 'Status']];
    attendance.forEach((session) => session.records.forEach((record) => {
      rows.push([
        session.classDate.toISOString().slice(0, 10),
        session.course?.code || '',
        session.section?.name || '',
        record.student?.studentId || '',
        record.student?.name || '',
        record.status
      ]);
    }));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    res.send(csv);
  } catch (error) { next(error); }
});
router.get('/settings/attendance-threshold', protect, authorize('admin'), async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'attendanceThreshold' });
    res.json({ success: true, data: { threshold: setting?.value ?? 75 } });
  } catch (error) { next(error); }
});
router.put('/settings/attendance-threshold', protect, authorize('admin'), async (req, res, next) => {
  try {
    const threshold = Number(req.body.threshold);
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
      const error = new Error('Threshold must be an integer from 0 to 100');
      error.statusCode = 400;
      throw error;
    }
    await Setting.findOneAndUpdate(
      { key: 'attendanceThreshold' },
      { key: 'attendanceThreshold', value: threshold },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: { threshold } });
  } catch (error) { next(error); }
});
router.get('/attendance/audit', protect, authorize('admin', 'faculty'), async (req, res, next) => {
  try {
    const audits = await AttendanceAudit.find()
      .populate('student', 'name studentId')
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: audits });
  } catch (error) { next(error); }
});

module.exports = router;
