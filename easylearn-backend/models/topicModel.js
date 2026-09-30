const db = require('../config/db');

// Insert multiple topics for a document in one go (used right after segmentation)
exports.createMany = async (documentId, topics) => {
  const insertedIds = [];

  for (const topic of topics) {
    const [result] = await db.query(
      'INSERT INTO topics (document_id, title, order_index) VALUES (?, ?, ?)',
      [documentId, topic.title, topic.order_index]
    );
    insertedIds.push(result.insertId);
  }

  return insertedIds;
};

// Fetch all topics for a document, in order
exports.findByDocument = async (documentId) => {
  const [rows] = await db.query(
    'SELECT * FROM topics WHERE document_id = ? ORDER BY order_index ASC',
    [documentId]
  );
  return rows;
};

// Check if a document has already been segmented (avoid duplicate topic sets)
exports.existsForDocument = async (documentId) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM topics WHERE document_id = ?',
    [documentId]
  );
  return rows[0].total > 0;
};

// Delete all topics for a document (used before re-segmenting with ?force=true)
exports.deleteByDocument = async (documentId) => {
  await db.query('DELETE FROM topics WHERE document_id = ?', [documentId]);
};



// Save the generated summary text for a specific topic
exports.updateSummary = async (topicId, summaryText) => {
  await db.query(
    'UPDATE topics SET summary_text = ? WHERE topic_id = ?',
    [summaryText, topicId]
  );
};

exports.findById = async (topicId) => {
  const [rows] = await db.query('SELECT * FROM topics WHERE topic_id = ?', [topicId]);
  return rows[0] || null;
};
