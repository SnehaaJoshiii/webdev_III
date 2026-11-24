const User = require('../models/User');

exports.me = async (req, res) => res.json({ success: true, data: req.user });

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'department', 'phone', 'avatar'];
    const update = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = new RegExp(req.query.department, 'i');
    if (req.query.search) filter.name = new RegExp(req.query.search, 'i');
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: await User.findById(user._id) });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const forbidden = ['password', 'refreshTokens'];
    forbidden.forEach((key) => delete req.body[key]);
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) { const error = new Error('User not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { const error = new Error('User not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};
