const router = require('express').Router();
const controller = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.list);
router.post('/', protect, authorize('admin'), controller.create);
router.patch('/:id', protect, authorize('admin'), controller.update);
router.delete('/:id', protect, authorize('admin'), controller.remove);
router.post('/:id/enroll', protect, authorize('admin'), controller.enroll);

module.exports = router;
