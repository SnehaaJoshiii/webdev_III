const Section = require('../models/Section');
const Course = require('../models/Course');
const User = require('../models/User');

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'faculty') filter.faculty = req.user._id;
    if (req.user.role === 'student') filter.students = req.user._id;
    if (req.query.course) filter.course = req.query.course;
    const data = await Section.find(filter).populate('course faculty', 'code title name employeeId').populate('students', 'name email studentId');
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
exports.create = async (req, res, next) => {
  try {
    const [course, faculty] = await Promise.all([Course.findById(req.body.course), User.findById(req.body.faculty)]);
    if (!course) { const error = new Error('Course reference is invalid'); error.statusCode = 400; throw error; }
    if (!faculty || faculty.role !== 'faculty') { const error = new Error('Faculty reference is invalid'); error.statusCode = 400; throw error; }
    const section = await Section.create(req.body);
    res.status(201).json({ success: true, data: await section.populate('course faculty', 'code title name') });
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    if (req.body.faculty) {
      const faculty = await User.findById(req.body.faculty);
      if (!faculty || faculty.role !== 'faculty') { const error = new Error('Faculty reference is invalid'); error.statusCode = 400; throw error; }
    }
    const item = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('course faculty', 'code title name');
    if (!item) { const error = new Error('Section not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    const item = await Section.findByIdAndDelete(req.params.id);
    if (!item) { const error = new Error('Section not found'); error.statusCode = 404; throw error; }
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) { next(error); }
};
exports.enroll = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) { const error = new Error('Section not found'); error.statusCode = 404; throw error; }
    const student = await User.findOne({ _id: req.body.studentId, role: 'student' });
    if (!student) { const error = new Error('Valid student reference required'); error.statusCode = 400; throw error; }
    if (section.students.some((id) => id.equals(student._id))) { const error = new Error('Student is already enrolled'); error.statusCode = 409; throw error; }
    section.students.push(student._id);
    await section.save();
    res.json({ success: true, data: await section.populate('students', 'name email studentId') });
  } catch (error) { next(error); }
};
