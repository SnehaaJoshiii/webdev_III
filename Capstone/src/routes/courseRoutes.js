const router = require('express').Router();
const controller = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, controller.list);
router.get('/:id', protect, controller.get);
router.post('/', protect, authorize('admin'), controller.create);
router.patch('/:id', protect, authorize('admin'), controller.update);
router.delete('/:id', protect, authorize('admin'), controller.remove);

module.exports = router;
