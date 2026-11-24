const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, enum: ['academic', 'event', 'general', 'urgent'], default: 'general' },
  audience: {
    type: { type: String, enum: ['university', 'section', 'course'], default: 'university' },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ 'audience.type': 1, 'audience.section': 1 });
announcementSchema.index({ 'audience.course': 1, createdAt: -1 });
module.exports = mongoose.model('Announcement', announcementSchema);
