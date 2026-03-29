/**
 * PDF Generator Utility
 * Generates resume PDFs.
 * - If content is LaTeX, compile with a local LaTeX engine for exact template fidelity.
 * - Otherwise render as plain text via Puppeteer.
 */
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const puppeteer = require('puppeteer');

const execFileAsync = promisify(execFile);
const LATEX_ENGINES = ['pdflatex', 'xelatex', 'lualatex'];

const getLatexEngineCandidates = () => {
  const localProgramFiles = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || '';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || '';

  const miktexCandidates = [
    path.join(localProgramFiles, 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', 'pdflatex.exe'),
    path.join(localProgramFiles, 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', 'xelatex.exe'),
    path.join(localProgramFiles, 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', 'lualatex.exe'),
    path.join(programFiles, 'MiKTeX', 'miktex', 'bin', 'x64', 'pdflatex.exe'),
    path.join(programFiles, 'MiKTeX', 'miktex', 'bin', 'x64', 'xelatex.exe'),
    path.join(programFiles, 'MiKTeX', 'miktex', 'bin', 'x64', 'lualatex.exe'),
    path.join(programFilesX86, 'MiKTeX', 'miktex', 'bin', 'pdflatex.exe'),
    path.join(programFilesX86, 'MiKTeX', 'miktex', 'bin', 'xelatex.exe'),
    path.join(programFilesX86, 'MiKTeX', 'miktex', 'bin', 'lualatex.exe'),
  ];

  return [...LATEX_ENGINES, ...miktexCandidates];
};

const isLatexDocument = (content) => /^\s*\\documentclass/.test(String(content || ''));

const getLatexEngine = async () => {
  for (const engine of getLatexEngineCandidates()) {
    try {
      await execFileAsync(engine, ['--version'], { timeout: 8000 });
      return engine;
    } catch {
      // try next
    }
  }
  return null;
};

const compileLatexToPdf = async (latexContent) => {
  const engine = await getLatexEngine();
  if (!engine) {
    const error = new Error('LaTeX engine not found in PATH (pdflatex/xelatex/lualatex).');
    error.code = 'LATEX_ENGINE_MISSING';
    throw error;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-latex-'));
  const texPath = path.join(tempDir, 'resume.tex');
  const pdfPath = path.join(tempDir, 'resume.pdf');

  try {
    await fs.writeFile(texPath, String(latexContent || ''), 'utf8');

    await execFileAsync(
      engine,
      ['-interaction=nonstopmode', '-halt-on-error', 'resume.tex'],
      { cwd: tempDir, timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
    );

    const pdfBuffer = await fs.readFile(pdfPath);
    return pdfBuffer;
  } catch (err) {
    let logTail = '';
    try {
      const logText = await fs.readFile(path.join(tempDir, 'resume.log'), 'utf8');
      logTail = logText.slice(-2500);
    } catch {
      // ignore
    }

    const compileError = new Error(
      `LaTeX compilation failed. ${err.message}${logTail ? ` | log: ${logTail}` : ''}`
    );
    compileError.code = 'LATEX_COMPILE_FAILED';
    throw compileError;
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup issues
    }
  }
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Convert resume text to a layout-preserving PDF buffer.
 * @param {string} resumeContent - The tailored resume text.
 * @param {string} candidateName - Name for the PDF header.
 * @returns {Promise<Buffer>} - The PDF file as a buffer.
 */
async function generateResumePDF(resumeContent, candidateName = 'Candidate') {
  if (isLatexDocument(resumeContent)) {
    return compileLatexToPdf(resumeContent);
  }

  const safeResumeText = escapeHtml(String(resumeContent || '').trim());
  const safeName = escapeHtml(candidateName);

  // Plain-text HTML template to preserve source layout and spacing.
  const fullHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.35;
        color: #1a1a1a;
        padding: 26px 28px;
      }

      .name {
        font-size: 0;
      }

      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.35;
        color: #1a1a1a;
      }
    </style>
  </head>
  <body>
    <div class="name">${safeName}</div>
    <pre>${safeResumeText}</pre>
  </body>
  </html>
  `;

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer;
}

module.exports = { generateResumePDF };
