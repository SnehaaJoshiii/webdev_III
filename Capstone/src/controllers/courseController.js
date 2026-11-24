const Course = require('../models/Course');

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const filter = {};
    if (req.query.department) filter.department = new RegExp(req.query.department, 'i');
    if (req.query.search) filter.title = new RegExp(req.query.search, 'i');
    const [data, total] = await Promise.all([
      Course.find(filter).sort({ code: 1 }).skip((page - 1) * limit).limit(limit),
      Course.countDocuments(filter)
    ]);
    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};
exports.get = async (req, res, next) => {
  try {
    const item = await Course.findById(req.params.id);
    if (!item) { const error = new Error('Course not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await Course.create(req.body) }); }
  catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    const item = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) { const error = new Error('Course not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    const item = await Course.findByIdAndDelete(req.params.id);
    if (!item) { const error = new Error('Course not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) { next(error); }
};
