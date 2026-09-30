const documentModel = require('../models/documentModel');
const topicModel = require('../models/topicModel');
const segmentTopics = require('../utils/segmentTopics');

exports.segmentDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    // 1. Check the document has extracted text to work with
    const textRow = await documentModel.getExtractedText(documentId);
    if (!textRow || !textRow.extracted_text) {
      return res.status(400).json({
        message: 'This document has no extracted text yet, so it cannot be segmented into topics.',
      });
    }

    // 2. Prevent duplicate segmentation unless explicitly forced
    const alreadySegmented = await topicModel.existsForDocument(documentId);
    if (alreadySegmented && req.query.force !== 'true') {
      return res.status(409).json({
        message: 'This document has already been segmented into topics. Pass ?force=true to re-segment.',
      });
    }

    // 3. Call the AI to segment the text
    const topics = await segmentTopics(textRow.extracted_text);

    // 4. If re-segmenting, clear old topics first
    if (alreadySegmented) {
      await topicModel.deleteByDocument(documentId);
    }

    // 5. Save the new topics
    const insertedIds = await topicModel.createMany(documentId, topics);

    return res.status(201).json({
      message: `Document segmented into ${topics.length} topic(s)`,
      topic_ids: insertedIds,
      topics: topics.map((t, i) => ({ topic_id: insertedIds[i], ...t })),
    });
  } catch (err) {
    console.error('Segmentation error:', err.message);
    return res.status(500).json({ message: 'Server error during topic segmentation', error: err.message });
  }
};

exports.getTopics = async (req, res) => {
  try {
    const documentId = req.params.id;
    const topics = await topicModel.findByDocument(documentId);
    return res.status(200).json({ topics });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching topics' });
  }
};

exports.getTopicById = async (req, res) => {
  try {
    const topic = await topicModel.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    return res.status(200).json({ topic });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching topic' });
  }
};