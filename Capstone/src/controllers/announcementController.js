const Announcement = require('../models/Announcement');
const Section = require('../models/Section');
const { appEvents, EVENTS } = require('../events/appEvents');

exports.create = async (req, res, next) => {
  try {
    const audience = req.body.audience || { type: 'university' };
    if (audience.type === 'section') {
      const section = await Section.findById(audience.section);
      if (!section) { const error = new Error('Section reference is invalid'); error.statusCode = 400; throw error; }
      if (req.user.role === 'faculty' && !section.faculty.equals(req.user._id)) {
        const error = new Error('You are not assigned to this section'); error.statusCode = 403; throw error;
      }
    }
    const announcement = await Announcement.create({ ...req.body, audience, createdBy: req.user._id });
    const populated = await announcement.populate('createdBy', 'name role');
    appEvents.emit(EVENTS.ANNOUNCEMENT_CREATED, populated);
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const filter = { $or: [{ 'audience.type': 'university' }, { 'audience.type': { $exists: false } }] };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.section) filter.$or.push({ 'audience.type': 'section', 'audience.section': req.query.section });
    if (req.query.course) filter.$or.push({ 'audience.type': 'course', 'audience.course': req.query.course });
    if (req.user.role === 'student') {
      const Section = require('../models/Section');
      const sections = await Section.find({ students: req.user._id }).select('_id course');
      const sectionIds = sections.map((section) => section._id);
      const courseIds = sections.map((section) => section.course);
      filter.$or.push(
        { 'audience.type': 'section', 'audience.section': { $in: sectionIds } },
        { 'audience.type': 'course', 'audience.course': { $in: courseIds } }
      );
    }
    if (req.user.role === 'faculty') {
      const Section = require('../models/Section');
      const sections = await Section.find({ faculty: req.user._id }).select('_id course');
      filter.$or.push(
        { 'audience.type': 'section', 'audience.section': { $in: sections.map((section) => section._id) } },
        { 'audience.type': 'course', 'audience.course': { $in: sections.map((section) => section.course) } }
      );
    }
    const [data, total] = await Promise.all([
      Announcement.find(filter).populate('createdBy', 'name role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Announcement.countDocuments(filter)
    ]);
    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) { const error = new Error('Announcement not found'); error.statusCode = 404; throw error; }
    if (req.user.role !== 'admin' && !announcement.createdBy.equals(req.user._id)) {
      const error = new Error('You cannot delete this announcement'); error.statusCode = 403; throw error;
    }
    await announcement.deleteOne();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) { next(error); }
};
