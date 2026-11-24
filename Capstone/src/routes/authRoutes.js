const router = require('express').Router();
const controller = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', protect, controller.logout);

module.exports = router;
