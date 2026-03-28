const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String },
  location: { type: String },
  description: { type: String },
  requiredSkills: [{ type: String }],
  similarityEmbedding: { type: [Number] }, // For future vector search compatibility
  url: { type: String },
  jobType: { type: String }, // e.g., Full-time, Contract
  scrapedFrom: { type: String }, // e.g., LinkedIn, Indeed
  dateScraped: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }
});

module.exports = mongoose.model('Job', jobSchema);
