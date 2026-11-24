const router = require('express').Router();
const controller = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.list);
router.post('/', protect, authorize('admin', 'faculty'), controller.create);
router.delete('/:id', protect, authorize('admin', 'faculty'), controller.remove);

module.exports = router;
