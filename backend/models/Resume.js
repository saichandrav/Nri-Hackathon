const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileUrl: { type: String },
  extractedText: { type: String },
  skills: [{ type: String }],
  markdownContent: { type: String }, // Tailored resume content from AI
  isMaster: { type: Boolean, default: false },
  originalResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // The job this resume was tailored for
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
