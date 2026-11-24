const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'faculty', 'student'], required: true, index: true },
  employeeId: { type: String, trim: true, sparse: true },
  studentId: { type: String, trim: true, sparse: true },
  department: { type: String, trim: true, default: 'General' },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  refreshTokens: { type: [{ tokenHash: String, expiresAt: Date }], select: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ role: 1, department: 1 });
module.exports = mongoose.model('User', userSchema);
