const topicModel = require('../models/topicModel');
const terminologyModel = require('../models/terminologyModel');
const brainstormHelp = require('../utils/brainstormHelp');

exports.getBrainstormHelp = async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const { request } = req.body;

    if (!request || request.trim().length === 0) {
      return res.status(400).json({ message: 'A "request" field is required, e.g. "give me an example"' });
    }

    const topic = await topicModel.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (!topic.summary_text) {
      return res.status(400).json({ message: 'This topic has no summary yet. Run /summarize first.' });
    }

    // Note: deliberately NO unlock check here — brainstorm help is
    // available regardless of the student's quiz-gate progress on this topic.
    const glossary = await terminologyModel.findByDocument(topic.document_id);
    const response = await brainstormHelp(topic.title, topic.summary_text, glossary, request);

    return res.status(200).json({ topic_id: topicId, request, response });
  } catch (err) {
    console.error('Brainstorm error:', err.message);
    return res.status(500).json({ message: 'Server error generating brainstorm help', error: err.message });
  }
};