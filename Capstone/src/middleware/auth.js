const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      const error = new Error('Authentication token required');
      error.statusCode = 401;
      throw error;
    }
    const payload = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user || !user.isActive) {
      const error = new Error('User account is unavailable');
      error.statusCode = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : error.statusCode;
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error('Insufficient role permissions');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

module.exports = { protect, authorize };
