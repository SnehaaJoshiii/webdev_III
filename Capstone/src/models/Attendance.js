const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  correctionReason: String
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classDate: { type: Date, required: true },
  topic: { type: String, trim: true, default: '' },
  records: [recordSchema]
}, { timestamps: true });

attendanceSchema.index({ section: 1, classDate: 1 }, { unique: true });
attendanceSchema.index({ 'records.student': 1, course: 1 });
module.exports = mongoose.model('Attendance', attendanceSchema);
