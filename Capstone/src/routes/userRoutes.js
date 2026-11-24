const router = require('express').Router();
const controller = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, controller.me);
router.patch('/me', protect, controller.updateMe);
router.get('/', protect, authorize('admin'), controller.listUsers);
router.post('/', protect, authorize('admin'), controller.createUser);
router.patch('/:id', protect, authorize('admin'), controller.updateUser);
router.delete('/:id', protect, authorize('admin'), controller.deleteUser);

module.exports = router;
