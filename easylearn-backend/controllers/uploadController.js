const documentModel = require('../models/documentModel');
const extractText = require('../utils/extractText');
const fs = require('fs');
const path = require('path');

const MAX_BATCH = 30;
const MAX_TOTAL = 300;

exports.uploadDocuments = async (req, res) => {
  try {
    const files = req.files; // populated by multer's upload.array('documents', 30)

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    // 1. Enforce per-batch limit
    if (files.length > MAX_BATCH) {
      cleanupFiles(files);
      return res.status(400).json({
        message: `You can upload a maximum of ${MAX_BATCH} documents per batch`,
      });
    }

    // 2. Enforce total-per-user limit
    const currentCount = await documentModel.countByUser(req.user.user_id);
    if (currentCount + files.length > MAX_TOTAL) {
      cleanupFiles(files);
      return res.status(400).json({
        message: `This upload would exceed your ${MAX_TOTAL}-document limit. You currently have ${currentCount} documents. Please delete some before uploading more.`,
      });
    }

    // 3. Save metadata for each file
    const insertedIds = await documentModel.createMany(req.user.user_id, files);

    // 4. Extract text for each file and save it
    //    (runs after metadata is saved, so we have document_ids to attach text to)
    const extractionResults = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentId = insertedIds[i];

      try {
        const text = await extractText(file.path, file.originalname);
        await documentModel.saveExtractedText(documentId, text);
        extractionResults.push({ document_id: documentId, status: 'extracted' });
      } catch (extractErr) {
        // Don't fail the whole upload if one file's extraction breaks —
        // log it and let the user know that specific file needs attention.
        console.error(`Extraction failed for document ${documentId}:`, extractErr.message);
        extractionResults.push({ document_id: documentId, status: 'extraction_failed', error: extractErr.message });
      }
    }

    return res.status(201).json({
      message: `${files.length} document(s) uploaded successfully`,
      document_ids: insertedIds,
      total_documents: currentCount + files.length,
      extraction: extractionResults,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during upload' });
  }
};

function cleanupFiles(files) {
  files.forEach((file) => {
    fs.unlink(file.path, (err) => {
      if (err) console.error(`Failed to delete ${file.path}:`, err.message);
    });
  });
}

exports.getMyDocuments = async (req, res) => {
  try {
    const docs = await documentModel.findByUser(req.user.user_id);
    return res.status(200).json({ documents: docs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching documents' });
  }
};

// New: fetch a single document's extracted text
exports.getDocumentText = async (req, res) => {
  try {
    const documentId = req.params.id;
    const textRow = await documentModel.getExtractedText(documentId);

    if (!textRow) {
      return res.status(404).json({ message: 'No extracted text found for this document' });
    }

    return res.status(200).json(textRow);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching document text' });
  }
};