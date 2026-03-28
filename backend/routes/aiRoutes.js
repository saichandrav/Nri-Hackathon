const express = require('express');
const router = express.Router();
const {
  extractResume,
  scoutJobs,
  tailorResume,
  downloadResumePDF,
  getJobs,
  getUserResumes,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Upload master resume (extracts text from PDF)
router.post('/extract-resume', protect, upload.single('file'), extractResume);

// Trigger the Job Scout agent
router.post('/scout-jobs', protect, scoutJobs);

// Trigger the Resume Tailor agent
router.post('/tailor-resume', protect, tailorResume);

// Download a tailored resume as PDF
router.get('/resumes/download/:id', protect, downloadResumePDF);

// Get all scouted jobs
router.get('/jobs', protect, getJobs);

// Get all user's resumes
router.get('/resumes', protect, getUserResumes);

module.exports = router;
