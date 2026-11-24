const mongoose = require('mongoose');

const attendanceAuditSchema = new mongoose.Schema({
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true, index: true },
  record: { type: mongoose.Schema.Types.ObjectId, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previousStatus: { type: String, enum: ['present', 'absent', 'late'], required: true },
  newStatus: { type: String, enum: ['present', 'absent', 'late'], required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true });

attendanceAuditSchema.index({ student: 1, attendance: 1, createdAt: -1 });
module.exports = mongoose.model('AttendanceAudit', attendanceAuditSchema);
