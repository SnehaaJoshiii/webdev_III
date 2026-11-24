const router = require('express').Router();
const controller = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'faculty'), controller.mark);
router.patch('/:id/correct', protect, authorize('admin', 'faculty'), controller.correct);
router.get('/me', protect, authorize('student'), controller.myAttendance);
router.get('/student/:studentId', protect, authorize('admin', 'faculty'), controller.myAttendance);

module.exports = router;
