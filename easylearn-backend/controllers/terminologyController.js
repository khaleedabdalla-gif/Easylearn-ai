const documentModel = require('../models/documentModel');
const terminologyModel = require('../models/terminologyModel');
const extractTerminology = require('../utils/extractTerminology');

exports.extractDocumentTerminology = async (req, res) => {
  try {
    const documentId = req.params.id;

    // 1. Check the document has extracted text to work with
    const textRow = await documentModel.getExtractedText(documentId);
    if (!textRow || !textRow.extracted_text) {
      return res.status(400).json({
        message: 'This document has no extracted text yet, so terminology cannot be extracted.',
      });
    }

    // 2. Prevent duplicate extraction unless explicitly forced
    const alreadyExtracted = await terminologyModel.existsForDocument(documentId);
    if (alreadyExtracted && req.query.force !== 'true') {
      return res.status(409).json({
        message: 'This document already has a terminology glossary. Pass ?force=true to re-extract.',
      });
    }

    // 3. Call the AI to extract terminology
    const terms = await extractTerminology(textRow.extracted_text);

    // 4. If re-extracting, clear old terms first
    if (alreadyExtracted) {
      await terminologyModel.deleteByDocument(documentId);
    }

    // 5. Save the new terms (if any were found)
    let insertedIds = [];
    if (terms.length > 0) {
      insertedIds = await terminologyModel.createMany(documentId, terms);
    }

    return res.status(201).json({
      message: `Extracted ${terms.length} term(s) from this document`,
      term_ids: insertedIds,
      terms: terms.map((t, i) => ({ term_id: insertedIds[i], ...t })),
    });
  } catch (err) {
    console.error('Terminology extraction error:', err.message);
    return res.status(500).json({ message: 'Server error during terminology extraction', error: err.message });
  }
};

exports.getTerminology = async (req, res) => {
  try {
    const documentId = req.params.id;
    const terms = await terminologyModel.findByDocument(documentId);
    return res.status(200).json({ terms });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching terminology' });
  }
};