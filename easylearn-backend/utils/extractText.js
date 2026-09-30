const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from a PDF, DOCX, or TXT file on disk.
 * PPTX is not yet supported here — see the note below.
 *
 * @param {string} filePath - full path to the file on disk
 * @param {string} originalName - original filename (used to check extension)
 * @returns {Promise<string>} extracted plain text
 */
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text;
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // .pptx isn't handled by pdf-parse or mammoth — needs a separate library
  // (e.g. "node-pptx-parser" or similar). Left as a stub for now so the
  // upload flow doesn't crash on a pptx file, it just won't have text yet.
  if (ext === '.pptx') {
    console.warn(`PPTX text extraction not yet implemented for ${originalName}`);
    return '';
  }

  throw new Error(`Unsupported file extension for extraction: ${ext}`);
}

module.exports = extractText;