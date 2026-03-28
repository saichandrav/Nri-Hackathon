/**
 * PDF Generator Utility
 * Converts Markdown resume content into a professional PDF file.
 * Uses Puppeteer (already installed) to render styled HTML to PDF.
 */
const puppeteer = require('puppeteer');
const { marked } = require('marked');

/**
 * Convert a Markdown string to a styled PDF buffer.
 * @param {string} markdownContent - The tailored resume in Markdown format.
 * @param {string} candidateName - Name for the PDF header.
 * @returns {Promise<Buffer>} - The PDF file as a buffer.
 */
async function generateResumePDF(markdownContent, candidateName = 'Candidate') {
  // Convert Markdown to HTML
  const htmlBody = marked(markdownContent);

  // Professional resume HTML template
  const fullHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
        padding: 40px 50px;
        max-width: 800px;
        margin: 0 auto;
      }

      h1 {
        font-size: 22pt;
        font-weight: 700;
        color: #111827;
        margin-bottom: 4px;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 8px;
      }

      h2 {
        font-size: 13pt;
        font-weight: 600;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 18px;
        margin-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 4px;
      }

      h3 {
        font-size: 11.5pt;
        font-weight: 600;
        color: #1f2937;
        margin-top: 10px;
        margin-bottom: 2px;
      }

      p {
        margin-bottom: 6px;
        color: #374151;
      }

      ul {
        margin-left: 18px;
        margin-bottom: 8px;
      }

      li {
        margin-bottom: 4px;
        color: #374151;
      }

      strong { font-weight: 600; color: #111827; }
      em { font-style: italic; color: #4b5563; }

      a {
        color: #2563eb;
        text-decoration: none;
      }

      /* Skills tags inline */
      code {
        background: #eff6ff;
        color: #1d4ed8;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 10pt;
        font-family: 'Inter', sans-serif;
      }
    </style>
  </head>
  <body>
    ${htmlBody}
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
