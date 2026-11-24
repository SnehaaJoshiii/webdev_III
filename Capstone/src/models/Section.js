const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  room: { type: String, trim: true },
  schedule: { type: String, trim: true },
  academicYear: { type: String, required: true }
}, { timestamps: true });

sectionSchema.index({ course: 1, name: 1 }, { unique: true });
sectionSchema.index({ faculty: 1, course: 1 });
module.exports = mongoose.model('Section', sectionSchema);
