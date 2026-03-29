/**
 * AI Controller - Uses OpenAI first for resume analysis/tailoring,
 * with Python FastAPI fallback for continuity.
 */
const axios = require('axios');
const OpenAI = require('openai');
const pdfParseLib = require('pdf-parse');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { generateResumePDF } = require('../utils/pdfGenerator');
const { STRICT_LATEX_TEMPLATE } = require('../templates/strictResumeTemplate');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8001';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const openai =
  process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key')
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const normalizeStringArray = (value, maxItems = 8) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems);
};

const dedupeStrings = (items, maxItems = 15) => {
  const seen = new Set();
  const out = [];

  for (const raw of items || []) {
    const val = String(raw || '').trim();
    if (!val) continue;
    const key = val.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(val);
    if (out.length >= maxItems) break;
  }

  return out;
};

const COMMON_SKILL_PATTERNS = [
  [/\bjavascript\b/i, 'JavaScript'],
  [/\btypescript\b/i, 'TypeScript'],
  [/\bpython\b/i, 'Python'],
  [/\bjava\b/i, 'Java'],
  [/\bc\+\+\b/i, 'C++'],
  [/\bc#\b/i, 'C#'],
  [/\bgo(lang)?\b/i, 'Go'],
  [/\brust\b/i, 'Rust'],
  [/\bphp\b/i, 'PHP'],
  [/\breact(\.js)?\b/i, 'React'],
  [/\bnext\.?js\b/i, 'Next.js'],
  [/\bvue(\.js)?\b/i, 'Vue.js'],
  [/\bangular\b/i, 'Angular'],
  [/\bnode\.?js\b/i, 'Node.js'],
  [/\bexpress\.?js\b/i, 'Express.js'],
  [/\bfastapi\b/i, 'FastAPI'],
  [/\bdjango\b/i, 'Django'],
  [/\bflask\b/i, 'Flask'],
  [/\bspring\s*boot\b/i, 'Spring Boot'],
  [/\bhtml5?\b/i, 'HTML'],
  [/\bcss3?\b/i, 'CSS'],
  [/\btailwind\s*css\b/i, 'Tailwind CSS'],
  [/\bbootstrap\b/i, 'Bootstrap'],
  [/\bmaterial\s*ui\b|\bmui\b/i, 'Material UI'],
  [/\bmongodb\b/i, 'MongoDB'],
  [/\bpostgres(ql)?\b/i, 'PostgreSQL'],
  [/\bmysql\b/i, 'MySQL'],
  [/\bredis\b/i, 'Redis'],
  [/\bsql\b/i, 'SQL'],
  [/\bgraphql\b/i, 'GraphQL'],
  [/\brest(ful)?\s*api\b|\bapi\s*development\b/i, 'REST APIs'],
  [/\bdocker\b/i, 'Docker'],
  [/\bkubernetes\b|\bk8s\b/i, 'Kubernetes'],
  [/\baws\b|\bamazon\s+web\s+services\b/i, 'AWS'],
  [/\bazure\b/i, 'Azure'],
  [/\bgcp\b|\bgoogle\s+cloud\b/i, 'GCP'],
  [/\bgit\b/i, 'Git'],
  [/\bgithub\b/i, 'GitHub'],
  [/\bci\/cd\b|\bcontinuous\s+integration\b/i, 'CI/CD'],
  [/\bjenkins\b/i, 'Jenkins'],
  [/\bterraform\b/i, 'Terraform'],
  [/\banaconda\b/i, 'Anaconda'],
  [/\bnumpy\b/i, 'NumPy'],
  [/\bpandas\b/i, 'Pandas'],
  [/\bscikit[-\s]?learn\b/i, 'Scikit-learn'],
  [/\btensorflow\b/i, 'TensorFlow'],
  [/\bpytorch\b/i, 'PyTorch'],
  [/\bmachine\s+learning\b/i, 'Machine Learning'],
  [/\bdeep\s+learning\b/i, 'Deep Learning'],
  [/\bnlp\b|\bnatural\s+language\s+processing\b/i, 'NLP'],
  [/\bcomputer\s+vision\b/i, 'Computer Vision'],
  [/\bpower\s*bi\b/i, 'Power BI'],
  [/\btableau\b/i, 'Tableau'],
  [/\bexcel\b/i, 'Excel'],
  [/\bagile\b/i, 'Agile'],
  [/\bscrum\b/i, 'Scrum'],
];

const cleanupSkillCandidate = (value) => {
  return String(value || '')
    .replace(/[|•]/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-:;,.\s]+|[-:;,.\s]+$/g, '');
};

const extractSkillsFromSkillsSection = (resumeText) => {
  const lines = String(resumeText || '')
    .split(/\r?\n/)
    .map((line) => line.trim());

  const directMatches = [];
  for (const line of lines) {
    const match = line.match(/^(technical\s+)?skills?\s*[:\-]\s*(.+)$/i);
    if (match && match[2]) {
      directMatches.push(...match[2].split(/[,/;]|\s\|\s/));
    }
  }

  let blockStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^(technical\s+)?skills?(\s*&\s*tools)?\s*:?$/i.test(lines[i])) {
      blockStart = i;
      break;
    }
  }

  const blockItems = [];
  if (blockStart !== -1) {
    for (let i = blockStart + 1; i < Math.min(lines.length, blockStart + 14); i += 1) {
      const line = lines[i];
      if (!line) break;
      if (/^[A-Z][A-Za-z\s/&-]{2,40}:?$/.test(line) && !line.includes(',')) break;
      blockItems.push(...line.split(/[,/;]|\s\|\s/));
    }
  }

  return dedupeStrings(
    [...directMatches, ...blockItems]
      .map(cleanupSkillCandidate)
      .filter((v) => v.length >= 2 && v.length <= 40)
      .filter((v) => !/^(skills?|tools?|technologies)$/i.test(v)),
    20
  );
};

const extractSkillsHeuristic = (resumeText) => {
  const text = String(resumeText || '');
  const fromSection = extractSkillsFromSkillsSection(text);

  const fromPatterns = [];
  for (const [pattern, skill] of COMMON_SKILL_PATTERNS) {
    if (pattern.test(text)) fromPatterns.push(skill);
  }

  return dedupeStrings([...fromSection, ...fromPatterns], 15);
};

const inferRolesFromSkills = (skills, resumeText) => {
  const lowerText = String(resumeText || '').toLowerCase();
  const lowerSkills = new Set((skills || []).map((s) => s.toLowerCase()));
  const roles = [];

  const hasAny = (names) => names.some((n) => lowerSkills.has(n.toLowerCase()));

  if (hasAny(['React', 'Node.js', 'MongoDB', 'Express.js'])) roles.push('Full Stack Developer');
  if (hasAny(['React', 'TypeScript', 'JavaScript', 'Tailwind CSS'])) roles.push('Frontend Developer');
  if (hasAny(['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB'])) roles.push('Backend Developer');
  if (hasAny(['Python', 'Pandas', 'Scikit-learn', 'Machine Learning'])) roles.push('Machine Learning Engineer');
  if (hasAny(['Power BI', 'Tableau', 'SQL', 'Excel'])) roles.push('Data Analyst');
  if (hasAny(['AWS', 'Docker', 'Kubernetes', 'Terraform'])) roles.push('DevOps Engineer');
  if (hasAny(['Java', 'Spring Boot', 'SQL'])) roles.push('Java Developer');

  if (roles.length === 0) {
    if (lowerText.includes('intern')) roles.push('Software Engineering Intern');
    else roles.push('Software Engineer');
  }

  return dedupeStrings(roles, 4);
};

const buildFormatBlueprint = (resumeText) => {
  const lines = String(resumeText || '').split(/\r?\n/);
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);

  const headings = nonEmpty
    .filter(
      (line) =>
        /^#{1,6}\s+/.test(line) ||
        (/^[A-Z][A-Za-z\s/&-]{2,40}:?$/.test(line) && line.length <= 45) ||
        /^[A-Z\s/&-]{4,45}$/.test(line)
    )
    .slice(0, 16);

  const bulletSamples = nonEmpty
    .filter((line) => /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line))
    .slice(0, 14);

  const totalLines = lines.length;
  const nonEmptyLines = nonEmpty.length;

  return [
    `Total lines: ${totalLines}`,
    `Non-empty lines: ${nonEmptyLines}`,
    `Detected headings (keep in same order and text):`,
    ...headings.map((h, i) => `${i + 1}. ${h}`),
    `Bullet style samples (preserve bullet symbols and style):`,
    ...bulletSamples.map((b, i) => `${i + 1}. ${b}`),
  ].join('\n');
};

const stripMarkdownFence = (text) => {
  let out = String(text || '').trim();
  if (out.startsWith('```markdown')) out = out.slice('```markdown'.length).trim();
  if (out.startsWith('```text')) out = out.slice('```text'.length).trim();
  if (out.startsWith('```')) out = out.slice(3).trim();
  if (out.endsWith('```')) out = out.slice(0, -3).trim();
  return out;
};

const isLatexDocument = (text) => /^\s*\\documentclass/.test(String(text || ''));

const getLockedTemplateBase = (masterResumeText) =>
  isLatexDocument(masterResumeText) ? String(masterResumeText) : STRICT_LATEX_TEMPLATE;

const isLatexTemplateCompatible = (templateText, candidateText) => {
  const template = String(templateText || '');
  const candidate = String(candidateText || '');

  if (!isLatexDocument(candidate)) return false;
  if (!candidate.includes('\\begin{document}') || !candidate.includes('\\end{document}')) return false;

  const templateSections = template.match(/\\section\{[^}]+\}/g) || [];
  const candidateSections = candidate.match(/\\section\{[^}]+\}/g) || [];

  if (templateSections.length) {
    if (templateSections.length !== candidateSections.length) return false;
    for (let i = 0; i < templateSections.length; i += 1) {
      if (templateSections[i] !== candidateSections[i]) return false;
    }
  }

  const requiredTokens = [
    '\\documentclass[10pt, letterpaper]{article}',
    '\\begin{header}',
    '\\section{Career Objective}',
    '\\section{Experience}',
    '\\section{Education}',
    '\\section{Projects}',
    '\\section{Technical Skills}',
    '\\section{Certifications}',
    '\\section{Achievements \\& Extra Curricular Activities}',
    '\\end{document}',
  ];

  for (const token of requiredTokens) {
    if (!candidate.includes(token)) return false;
  }

  const templateLines = template.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
  const candidateLines = candidate.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;
  const maxAllowedDiff = Math.max(15, Math.floor(templateLines * 0.15));
  if (Math.abs(candidateLines - templateLines) > maxAllowedDiff) return false;

  return true;
};

const normalizeHeading = (line) =>
  String(line || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/:$/, '')
    .trim()
    .toLowerCase();

const isHeadingLine = (line) => {
  const v = String(line || '').trim();
  return (
    /^#{1,6}\s+/.test(v) ||
    (/^[A-Z][A-Za-z\s/&-]{2,40}:?$/.test(v) && v.length <= 45) ||
    /^[A-Z\s/&-]{4,45}$/.test(v)
  );
};

const getBulletMarker = (line) => {
  const v = String(line || '').trim();
  const m = v.match(/^([-*•]|\d+[.)])\s+/);
  if (!m) return null;
  return /\d/.test(m[1]) ? '#.' : m[1];
};

const isTemplateCompatible = (templateText, candidateText) => {
  const templateLines = String(templateText || '').split(/\r?\n/);
  const candidateLines = String(candidateText || '').split(/\r?\n/);

  const templateNonEmpty = templateLines.map((l) => l.trim()).filter(Boolean);
  const candidateNonEmpty = candidateLines.map((l) => l.trim()).filter(Boolean);

  if (!candidateNonEmpty.length) return false;

  const maxAllowedDiff = Math.max(4, Math.floor(templateNonEmpty.length * 0.12));
  if (Math.abs(candidateNonEmpty.length - templateNonEmpty.length) > maxAllowedDiff) {
    return false;
  }

  const templateHeadings = templateNonEmpty.filter(isHeadingLine).map(normalizeHeading);
  const candidateHeadings = candidateNonEmpty.filter(isHeadingLine).map(normalizeHeading);

  if (templateHeadings.length) {
    if (candidateHeadings.length !== templateHeadings.length) return false;
    for (let i = 0; i < templateHeadings.length; i += 1) {
      if (templateHeadings[i] !== candidateHeadings[i]) return false;
    }
  }

  const templateMarkers = new Set(
    templateNonEmpty.map(getBulletMarker).filter(Boolean)
  );
  const candidateMarkers = new Set(
    candidateNonEmpty.map(getBulletMarker).filter(Boolean)
  );

  for (const marker of candidateMarkers) {
    if (!templateMarkers.has(marker)) return false;
  }

  return true;
};

const parseJsonSafe = (jsonText) => {
  try {
    return JSON.parse(jsonText);
  } catch {
    return {};
  }
};

const extractPdfText = async (buffer) => {
  // pdf-parse v1 style (function export)
  if (typeof pdfParseLib === 'function') {
    const out = await pdfParseLib(buffer);
    return String(out?.text || '').trim();
  }

  // Some bundlers expose default function
  if (typeof pdfParseLib?.default === 'function') {
    const out = await pdfParseLib.default(buffer);
    return String(out?.text || '').trim();
  }

  // pdf-parse v2+ style (class export)
  if (typeof pdfParseLib?.PDFParse === 'function') {
    const parser = new pdfParseLib.PDFParse({ data: buffer });
    try {
      const out = await parser.getText();
      return String(out?.text || '').trim();
    } finally {
      try {
        await parser.destroy();
      } catch {
        // no-op on cleanup failure
      }
    }
  }

  throw new Error('Unsupported pdf-parse module shape');
};

const analyzeResumeWithOpenAI = async (resumeText) => {
  if (!openai) return { skills: [], suggestedRoles: [] };

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extract top professional skills and suggested target roles from a resume. Return valid JSON only with keys: skills (string[]) and suggestedRoles (string[]).',
      },
      {
        role: 'user',
        content: `Resume text:\n\n${resumeText.slice(0, 24000)}`,
      },
    ],
  });

  const payload = parseJsonSafe(completion.choices?.[0]?.message?.content || '{}');
  return {
    skills: normalizeStringArray(payload.skills, 10),
    suggestedRoles: normalizeStringArray(payload.suggestedRoles, 6),
  };
};

const analyzeResumeWithPython = async (resumeText) => {
  const response = await axios.post(
    `${PYTHON_API_URL}/api/analyze-resume`,
    { resume_text: resumeText },
    { timeout: 120000 }
  );

  return {
    skills: normalizeStringArray(response.data.skills, 10),
    suggestedRoles: normalizeStringArray(response.data.suggested_roles, 6),
  };
};

const tailorResumeWithOpenAI = async ({ baseTemplate, sourceResumeText, jobDescription, jobTitle }) => {
  if (!openai) return '';

  const formatBlueprint = buildFormatBlueprint(baseTemplate);

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.12,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert ATS resume tailoring assistant. You must output a full LaTeX document that keeps the template structure EXACTLY unchanged: same commands, environments, section order, heading names, and layout commands. You are allowed to change only human-readable text content inside the existing template fields. Never add/remove sections or LaTeX blocks. Never invent experience, projects, dates, or skills. Output only valid LaTeX source.',
      },
      {
        role: 'user',
        content: `Target job title: ${jobTitle || 'N/A'}\n\nJob description:\n${jobDescription || ''}\n\nSOURCE RESUME FACTS (for content grounding):\n${sourceResumeText || ''}\n\nFORMAT BLUEPRINT (MANDATORY):\n${formatBlueprint}\n\nLOCKED LATEX TEMPLATE (DO NOT CHANGE STRUCTURE):\n${baseTemplate}`,
      },
    ],
  });

  return stripMarkdownFence(String(completion.choices?.[0]?.message?.content || '').trim());
};

const tailorResumeWithPython = async ({ baseTemplate, sourceResumeText, jobDescription, jobTitle }) => {
  const templatePayload = [
    '[TEMPLATE_START]',
    baseTemplate,
    '[TEMPLATE_END]',
    '[SOURCE_RESUME_START]',
    sourceResumeText || '',
    '[SOURCE_RESUME_END]',
  ].join('\n');

  const response = await axios.post(
    `${PYTHON_API_URL}/api/tailor-resume`,
    {
      master_resume: templatePayload,
      job_description: jobDescription,
      job_title: jobTitle,
    },
    { timeout: 180000 }
  );

  return stripMarkdownFence(String(response.data.tailored_resume || '').trim());
};

// ---- 1. Extract Resume Text from PDF Upload ----
const extractResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let text = '';
    try {
      text = await extractPdfText(req.file.buffer);
    } catch (e) {
      return res.status(400).json({ error: `Unable to read PDF. ${e.message}` });
    }

    if (!text) {
      return res.status(400).json({
        error:
          'No text could be extracted from this PDF. If it is a scanned image PDF, use the paste box after OCR conversion.',
      });
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user, { masterResumeText: text });
    }

    const resume = await Resume.create({
      user: req.user,
      filename: req.file.originalname,
      extractedText: text,
      isMaster: true,
    });

    let skills = [];
    let suggestedRoles = [];
    let aiProvider = 'none';

    if (openai) {
      try {
        const openaiResult = await analyzeResumeWithOpenAI(text);
        skills = openaiResult.skills;
        suggestedRoles = openaiResult.suggestedRoles;
        aiProvider = 'openai';
      } catch (err) {
        console.warn('OpenAI Analyze failed, trying Python fallback:', err.message);
      }
    }

    if ((!skills.length && !suggestedRoles.length) || aiProvider === 'none') {
      try {
        const pythonResult = await analyzeResumeWithPython(text);
        skills = pythonResult.skills;
        suggestedRoles = pythonResult.suggestedRoles;
        aiProvider = 'python';
      } catch (err) {
        console.warn('Python Analyze failed, returning extracted text only:', err.message);
      }
    }

    const heuristicSkills = extractSkillsHeuristic(text);
    const mergedSkills = dedupeStrings([...(skills || []), ...heuristicSkills], 15);
    const finalRoles = suggestedRoles.length
      ? dedupeStrings(suggestedRoles, 4)
      : inferRolesFromSkills(mergedSkills, text);

    return res.json({
      success: true,
      filename: req.file.originalname,
      resumeId: resume._id,
      textPreview: text.substring(0, 500) + '...',
      fullText: text,
      skills: mergedSkills,
      suggestedRoles: finalRoles,
      aiProvider,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ---- 2. Trigger the Job Scout Agent (calls Python API) ----
const scoutJobs = async (req, res) => {
  try {
    const { targetRole, location } = req.body;

    if (!targetRole) return res.status(400).json({ error: 'targetRole is required' });
    if (!location) return res.status(400).json({ error: 'location is required' });

    if (req.user) {
      await User.findByIdAndUpdate(req.user, { targetRole, location });
    }

    const response = await axios.post(
      `${PYTHON_API_URL}/api/start-scout`,
      {
        target_role: targetRole,
        location,
      },
      { timeout: 240000 }
    );

    const { jobs } = response.data;

    const savedJobs = [];
    for (const job of jobs) {
      const savedJob = await Job.create({
        title: job.title,
        company: job.company || 'Unknown',
        location: job.location || location,
        description: job.description || '',
        url: job.url || '',
        scrapedFrom: job.scrapedFrom || 'Scraper Pipeline',
        status: 'active',
      });
      savedJobs.push(savedJob);
    }

    return res.json({
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
    return res.status(500).json({
      error: `Scout failed. The scraper pipeline can take 20-40 seconds for some sources. Details: ${error.message}`,
    });
  }
};

// ---- 3. Trigger the Resume Tailor Agent (OpenAI first, Python fallback) ----
const tailorResume = async (req, res) => {
  try {
    const { jobId, resumeText } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    let masterResumeText = resumeText || '';

    if (!masterResumeText && req.user) {
      const user = await User.findById(req.user);
      if (user && user.masterResumeText) {
        masterResumeText = user.masterResumeText;
      }
    }

    if (!masterResumeText && req.user) {
      const storedResume = await Resume.findOne({ user: req.user, isMaster: true });
      if (storedResume && storedResume.extractedText) {
        masterResumeText = storedResume.extractedText;
      }
    }

    if (!masterResumeText) {
      return res.status(400).json({ error: 'No resume found. Please paste your resume text or upload your resume first.' });
    }

    const baseTemplate = getLockedTemplateBase(masterResumeText);
    const sourceResumeText = masterResumeText;

    let tailoredResume = '';
    let aiProvider = 'none';

    if (openai) {
      try {
        tailoredResume = await tailorResumeWithOpenAI({
          baseTemplate,
          sourceResumeText,
          jobDescription: job.description,
          jobTitle: job.title,
        });
        aiProvider = 'openai';
      } catch (err) {
        console.warn('OpenAI Tailor failed, trying Python fallback:', err.message);
      }
    }

    if (!tailoredResume) {
      try {
        tailoredResume = await tailorResumeWithPython({
          baseTemplate,
          sourceResumeText,
          jobDescription: job.description,
          jobTitle: job.title,
        });
        aiProvider = 'python';
      } catch (err) {
        console.warn('Python Tailor failed:', err.message);
      }
    }

    if (tailoredResume && !isLatexTemplateCompatible(baseTemplate, tailoredResume)) {
      tailoredResume = baseTemplate;
      aiProvider = 'original-template';
    }

    if (!tailoredResume) {
      tailoredResume = baseTemplate;
      aiProvider = 'original-template';
    }

    let savedResumeId = null;
    if (req.user) {
      const masterResume = await Resume.findOne({ user: req.user, isMaster: true });
      const fileExt = isLatexDocument(tailoredResume) ? 'tex' : 'md';
      const savedResume = await Resume.create({
        user: req.user,
        filename: `tailored_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`,
        markdownContent: tailoredResume,
        isMaster: false,
        job: job._id,
        originalResume: masterResume ? masterResume._id : null,
      });
      savedResumeId = savedResume._id;
    }

    return res.json({
      success: true,
      resumeId: savedResumeId,
      tailoredResume,
      jobTitle: job.title,
      aiProvider,
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Python AI Engine is not running. Start it with: cd python_ai && python main.py',
      });
    }
    return res.status(500).json({ error: error.message });
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
    const pdfFilename = resume.filename.replace(/\.(md|tex)$/i, '.pdf');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdfFilename}"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    if (error.code === 'LATEX_ENGINE_MISSING') {
      return res.status(501).json({
        error:
          'Exact template PDF generation requires a LaTeX engine (MiKTeX/TeX Live). Install pdflatex and retry download.',
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

// ---- 5. Get all jobs from DB ----
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' }).sort({ dateScraped: -1 });
    return res.json({ success: true, jobs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ---- 6. Get all tailored resumes for the user ----
const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user })
      .populate('job', 'title company')
      .sort({ createdAt: -1 });
    return res.json({ success: true, resumes });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
