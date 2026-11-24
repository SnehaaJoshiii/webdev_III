const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { accessToken, refreshToken, hashToken } = require('../utils/tokens');

const issueTokens = async (user) => {
  const access = accessToken(user);
  const refresh = refreshToken(user);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    tokenHash: hashToken(refresh),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  await user.save();
  return { accessToken: access, refreshToken: refresh };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', department, studentId, employeeId } = req.body;
    if (!name || !email || !password) {
      const error = new Error('Name, email and password are required');
      error.statusCode = 400;
      throw error;
    }
    if (!['student', 'faculty'].includes(role)) {
      const error = new Error('You may only register as student or faculty');
      error.statusCode = 403;
      throw error;
    }
    const user = await User.create({ name, email, password, role, department, studentId, employeeId });
    const tokens = await issueTokens(user);
    res.status(201).json({ success: true, data: { user: await User.findById(user._id), ...tokens } });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password)) || !user.isActive) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
    const tokens = await issueTokens(user);
    res.json({ success: true, data: { user: await User.findById(user._id), ...tokens } });
  } catch (error) { next(error); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      const error = new Error('Refresh token required');
      error.statusCode = 400;
      throw error;
    }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id).select('+refreshTokens');
    const record = user?.refreshTokens.find((item) => item.tokenHash === hashToken(token) && item.expiresAt > new Date());
    if (!user || !record) {
      const error = new Error('Refresh token is invalid or expired');
      error.statusCode = 401;
      throw error;
    }
    user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== hashToken(token));
    const tokens = await issueTokens(user);
    res.json({ success: true, data: tokens });
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;
    if (token && req.user) {
      req.user.refreshTokens = (req.user.refreshTokens || []).filter((item) => item.tokenHash !== hashToken(token));
      await req.user.save();
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
};
