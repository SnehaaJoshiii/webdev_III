const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const accessToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' }
);

const refreshToken = (user) => jwt.sign(
  { id: user._id, role: user.role, nonce: crypto.randomBytes(16).toString('hex') },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d' }
);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { accessToken, refreshToken, hashToken };
