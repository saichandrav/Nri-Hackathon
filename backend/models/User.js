const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // Email verification (OTP)
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCodeHash: { type: String },
  emailVerificationExpiresAt: { type: Date },
  emailVerificationAttempts: { type: Number, default: 0 },

  // AI Agent Data
  masterResumeText: { type: String },
  targetRole: { type: String },
  location: { type: String },
});

module.exports = mongoose.model('User', userSchema);
