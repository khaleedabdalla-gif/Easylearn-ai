const documentModel = require('../models/documentModel');
const topicModel = require('../models/topicModel');
const terminologyModel = require('../models/terminologyModel');
const summarizeTopic = require('../utils/summarizeTopic');

exports.summarizeDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    // 1. Get the document's extracted text
    const textRow = await documentModel.getExtractedText(documentId);
    if (!textRow || !textRow.extracted_text) {
      return res.status(400).json({
        message: 'This document has no extracted text yet, so it cannot be summarized.',
      });
    }

    // 2. Get the document's topics (must be segmented first)
    const topics = await topicModel.findByDocument(documentId);
    if (!topics || topics.length === 0) {
      return res.status(400).json({
        message: 'This document has no topics yet. Run /segment first before summarizing.',
      });
    }

    // 3. Get the document's glossary (may be empty, that's fine)
    const glossary = await terminologyModel.findByDocument(documentId);

    // 4. Generate a summary for each topic, one at a time
    const results = [];
    for (const topic of topics) {
      try {
        const summary = await summarizeTopic(textRow.extracted_text, topic.title, glossary);
        await topicModel.updateSummary(topic.topic_id, summary);
        results.push({ topic_id: topic.topic_id, title: topic.title, status: 'summarized' });
      } catch (err) {
        console.error(`Summarization failed for topic ${topic.topic_id}:`, err.message);
        results.push({ topic_id: topic.topic_id, title: topic.title, status: 'failed', error: err.message });
      }
    }

    return res.status(200).json({
      message: `Summarized ${results.filter(r => r.status === 'summarized').length} of ${topics.length} topic(s)`,
      results,
    });
  } catch (err) {
    console.error('Summarization error:', err.message);
    return res.status(500).json({ message: 'Server error during summarization', error: err.message });
  }
};