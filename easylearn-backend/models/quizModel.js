const db = require('../config/db');

// ===== Quiz Questions =====

// Save generated questions for a topic (called once, first time a quiz is requested)
exports.createQuestions = async (topicId, questions) => {
  const insertedIds = [];
  for (const q of questions) {
    const [result] = await db.query(
      'INSERT INTO quiz_questions (topic_id, question_text, model_answer) VALUES (?, ?, ?)',
      [topicId, q.question_text, q.model_answer]
    );
    insertedIds.push(result.insertId);
  }
  return insertedIds;
};

// Fetch existing questions for a topic (reused across attempts, not regenerated)
exports.getQuestionsByTopic = async (topicId) => {
  const [rows] = await db.query(
    'SELECT * FROM quiz_questions WHERE topic_id = ?',
    [topicId]
  );
  return rows;
};

// ===== Quiz Attempts =====

// Log a single answer attempt
exports.logAttempt = async (userId, topicId, questionId, studentAnswer, isCorrect, feedback) => {
  await db.query(
    `INSERT INTO quiz_attempts (user_id, topic_id, question_id, student_answer, is_correct, feedback)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, topicId, questionId, studentAnswer, isCorrect, feedback]
  );
};

// ===== Topic Progress =====

// Get (or implicitly create) a student's progress on a topic
exports.getProgress = async (userId, topicId) => {
  const [rows] = await db.query(
    'SELECT * FROM topic_progress WHERE user_id = ? AND topic_id = ?',
    [userId, topicId]
  );
  return rows[0] || null;
};

// Mark a topic as in_progress (first time a student opens its quiz) or completed (on success),
// incrementing the attempt counter each time this is called.
exports.upsertProgress = async (userId, topicId, status) => {
  await db.query(
    `INSERT INTO topic_progress (user_id, topic_id, status, attempts)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE status = VALUES(status), attempts = attempts + 1`,
    [userId, topicId, status]
  );
};

// Get progress for every topic in a document, for one student
// (used to determine which topics are locked/unlocked in the UI later)
exports.getProgressForDocument = async (userId, documentId) => {
  const [rows] = await db.query(
    `SELECT t.topic_id, t.title, t.order_index,
            COALESCE(tp.status, 'locked') AS status,
            COALESCE(tp.attempts, 0) AS attempts
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id = t.topic_id AND tp.user_id = ?
     WHERE t.document_id = ?
     ORDER BY t.order_index ASC`,
    [userId, documentId]
  );
  return rows;
};


// Aggregated per-topic stats for a document — used by lecturers to see
// where students are struggling, without exposing individual student data.
exports.getAggregatedProgress = async (documentId) => {
  const [rows] = await db.query(
    `SELECT
        t.topic_id,
        t.title,
        t.order_index,
        COUNT(DISTINCT tp.user_id) AS students_attempted,
        SUM(CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END) AS students_completed,
        ROUND(AVG(tp.attempts), 1) AS avg_attempts,
        (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.topic_id = t.topic_id AND qa.is_correct = false) AS total_wrong_answers
     FROM topics t
     LEFT JOIN topic_progress tp ON tp.topic_id = t.topic_id
     WHERE t.document_id = ?
     GROUP BY t.topic_id, t.title, t.order_index
     ORDER BY t.order_index ASC`,
    [documentId]
  );
  return rows;
};