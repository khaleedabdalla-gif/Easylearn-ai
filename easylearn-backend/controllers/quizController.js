const topicModel = require('../models/topicModel');
const terminologyModel = require('../models/terminologyModel');
const quizModel = require('../models/quizModel');
const generateQuizQuestions = require('../utils/generateQuizQuestions');
const gradeAnswer = require('../utils/gradeAnswer');

// Checks whether a student is allowed to access this topic:
// the first topic (order_index 1) is always open; every other topic
// requires the immediately previous topic to be marked 'completed'.
async function isTopicUnlocked(userId, topic) {
  if (topic.order_index === 1) return true;

  const [rows] = await require('../config/db').query(
    'SELECT topic_id FROM topics WHERE document_id = ? AND order_index = ?',
    [topic.document_id, topic.order_index - 1]
  );
  if (rows.length === 0) return true; // no previous topic found, don't block

  const previousTopicId = rows[0].topic_id;
  const progress = await quizModel.getProgress(userId, previousTopicId);
  return progress && progress.status === 'completed';
}

exports.getQuiz = async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const userId = req.user.user_id;

    const topic = await topicModel.findById ? await topicModel.findById(topicId) : null;
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const unlocked = await isTopicUnlocked(userId, topic);
    if (!unlocked) {
      return res.status(403).json({
        message: 'This topic is locked. Complete the previous topic first.',
      });
    }

    // Fetch existing questions, or generate them the first time this topic's quiz is requested
    let questions = await quizModel.getQuestionsByTopic(topicId);
    if (questions.length === 0) {
      if (!topic.summary_text) {
        return res.status(400).json({ message: 'This topic has no summary yet. Run /summarize first.' });
      }
      const glossary = await terminologyModel.findByDocument(topic.document_id);
      const generated = await generateQuizQuestions(topic.title, topic.summary_text, glossary);
      await quizModel.createQuestions(topicId, generated);
      questions = await quizModel.getQuestionsByTopic(topicId);
    }

    // Mark as in_progress the first time a student opens this quiz
    const existingProgress = await quizModel.getProgress(userId, topicId);
    if (!existingProgress) {
      await quizModel.upsertProgress(userId, topicId, 'in_progress');
    }

    // Never send model_answer to the client — that would let students see the answer key
    const safeQuestions = questions.map((q) => ({
      question_id: q.question_id,
      question_text: q.question_text,
    }));

    return res.status(200).json({ topic_id: topicId, title: topic.title, questions: safeQuestions });
  } catch (err) {
    console.error('Get quiz error:', err.message);
    return res.status(500).json({ message: 'Server error fetching quiz', error: err.message });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const { question_id, answer } = req.body;
    const userId = req.user.user_id;

    if (!question_id || answer === undefined) {
      return res.status(400).json({ message: 'question_id and answer are required' });
    }

    const questions = await quizModel.getQuestionsByTopic(topicId);
    const question = questions.find((q) => q.question_id === Number(question_id));
    if (!question) {
      return res.status(404).json({ message: 'Question not found for this topic' });
    }

    // Grade the answer
    const grading = await gradeAnswer(question.question_text, question.model_answer, answer);

    // Log the attempt
    await quizModel.logAttempt(userId, topicId, question.question_id, answer, grading.is_correct, grading.feedback);

    // If correct, check whether ALL of this topic's questions are now answered correctly
    // (a topic only completes once every question has been passed at least once)
    let topicCompleted = false;
    if (grading.is_correct) {
      const allAttempts = await require('../config/db').query(
        'SELECT question_id, is_correct FROM quiz_attempts WHERE user_id = ? AND topic_id = ? AND is_correct = true',
        [userId, topicId]
      );
      const correctlyAnsweredIds = new Set(allAttempts[0].map((a) => a.question_id));
      topicCompleted = questions.every((q) => correctlyAnsweredIds.has(q.question_id));

      if (topicCompleted) {
        await quizModel.upsertProgress(userId, topicId, 'completed');
      }
    }

    return res.status(200).json({
      is_correct: grading.is_correct,
      feedback: grading.feedback,
      topic_completed: topicCompleted,
    });
  } catch (err) {
    console.error('Submit answer error:', err.message);
    return res.status(500).json({ message: 'Server error grading answer', error: err.message });
  }
};

exports.getDocumentProgress = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.user_id;
    const progress = await quizModel.getProgressForDocument(userId, documentId);
    return res.status(200).json({ progress });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching progress' });
  }
};



exports.getAggregatedProgress = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userRole = req.user.role;

    if (userRole !== 'lecturer' && userRole !== 'admin') {
      return res.status(403).json({
        message: 'Only lecturers and admins can view aggregated progress data.',
      });
    }

    const summary = await quizModel.getAggregatedProgress(documentId);
    return res.status(200).json({ document_id: documentId, summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error fetching aggregated progress' });
  }
};