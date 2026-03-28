/**
 * AI Controller - Updated to call the Python FastAPI Engine.
 * Instead of calling OpenAI directly, it now proxies requests
 * to the Python CrewAI agents running on port 8001.
 */
const axios = require('axios');
const pdfParse = require('pdf-parse');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { generateResumePDF } = require('../utils/pdfGenerator');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8001';

// ---- 1. Extract Resume Text from PDF Upload ----
const extractResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text ? pdfData.text.trim() : '';

    if (!text) {
      return res.status(400).json({ error: 'No text could be extracted from this PDF. Ensure it is not a scanned image.' });
    }

    // Save the master resume text to the user's profile
    if (req.user) {
      await User.findByIdAndUpdate(req.user, { masterResumeText: text });
    }

    // Save as a master resume in the Resume collection
    const resume = await Resume.create({
      user: req.user,
      filename: req.file.originalname,
      extractedText: text,
      isMaster: true,
    });

    let skills = [];
    let suggestedRoles = [];
    try {
      const analyzeResponse = await axios.post(`${PYTHON_API_URL}/api/analyze-resume`, {
        resume_text: text,
      }, { timeout: 120000 });
      skills = analyzeResponse.data.skills || [];
      suggestedRoles = analyzeResponse.data.suggested_roles || [];
    } catch (err) {
      console.warn('AI Analyze failed, using defaults', err.message);
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      resumeId: resume._id,
      textPreview: text.substring(0, 500) + '...',
      fullText: text,
      skills,
      suggestedRoles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---- 2. Trigger the Job Scout Agent (calls Python API) ----
const scoutJobs = async (req, res) => {
  try {
    const { targetRole, location } = req.body;

    if (!targetRole) return res.status(400).json({ error: 'targetRole is required' });
    if (!location) return res.status(400).json({ error: 'location is required' });

    // Update user preferences
    if (req.user) {
      await User.findByIdAndUpdate(req.user, { targetRole, location });
    }

    // Call the Python AI Engine
    const response = await axios.post(`${PYTHON_API_URL}/api/start-scout`, {
      target_role: targetRole,
      location: location,
    }, { timeout: 120000 }); // 2 min timeout for AI processing

    const { jobs } = response.data;

    // Save each job to MongoDB
    const savedJobs = [];
    for (const job of jobs) {
      const savedJob = await Job.create({
        title: job.title,
        company: job.company || 'Unknown',
        location: job.location || location,
        description: job.description || '',
        url: job.url || '',
        scrapedFrom: job.scrapedFrom || 'Exa Search',
        status: 'active',
      });
      savedJobs.push(savedJob);
    }

    res.json({
      success: true,
      count: savedJobs.length,
      jobs: savedJobs,
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Python AI Engine is not running. Start it with: cd python_ai && python main.py',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// ---- 3. Trigger the Resume Tailor Agent (calls Python API) ----
const tailorResume = async (req, res) => {
  try {
    const { jobId, resumeText } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    // Get the job description from MongoDB
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Determine resume text: use directly provided text, or lookup from user profile
    let masterResumeText = resumeText || '';

    if (!masterResumeText && req.user) {
      const user = await User.findById(req.user);
      if (user && user.masterResumeText) {
        masterResumeText = user.masterResumeText;
      }
    }

    // Also try resume collection as last fallback
    if (!masterResumeText && req.user) {
      const storedResume = await Resume.findOne({ user: req.user, isMaster: true });
      if (storedResume && storedResume.extractedText) {
        masterResumeText = storedResume.extractedText;
      }
    }

    if (!masterResumeText) {
      return res.status(400).json({ error: 'No resume found. Please paste your resume text or upload your resume first.' });
    }

    // Call the Python AI Engine
    const response = await axios.post(`${PYTHON_API_URL}/api/tailor-resume`, {
      master_resume: masterResumeText,
      job_description: job.description,
      job_title: job.title,
    }, { timeout: 180000 });

    const { tailored_resume } = response.data;

    // Save the tailored resume to MongoDB (only if user is authenticated)
    let savedResumeId = null;
    if (req.user) {
      const masterResume = await Resume.findOne({ user: req.user, isMaster: true });
      const savedResume = await Resume.create({
        user: req.user,
        filename: `tailored_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
        markdownContent: tailored_resume,
        isMaster: false,
        job: job._id,
        originalResume: masterResume ? masterResume._id : null,
      });
      savedResumeId = savedResume._id;
    }

    res.json({
      success: true,
      resumeId: savedResumeId,
      tailoredResume: tailored_resume,
      jobTitle: job.title,
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Python AI Engine is not running. Start it with: cd python_ai && python main.py',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// ---- 4. Download tailored resume as PDF ----
const downloadResumePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.markdownContent) {
      return res.status(400).json({ error: 'This resume has no tailored content yet' });
    }

    const pdfBuffer = await generateResumePDF(resume.markdownContent, 'Resume');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resume.filename.replace('.md', '.pdf')}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---- 5. Get all jobs from DB ----
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' }).sort({ dateScraped: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---- 6. Get all tailored resumes for the user ----
const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user })
      .populate('job', 'title company')
      .sort({ createdAt: -1 });
    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  extractResume,
  scoutJobs,
  tailorResume,
  downloadResumePDF,
  getJobs,
  getUserResumes,
};
