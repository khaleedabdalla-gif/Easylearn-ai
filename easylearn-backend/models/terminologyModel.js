const db = require('../config/db');

// Insert multiple terms for a document in one go
exports.createMany = async (documentId, terms) => {
  const insertedIds = [];

  for (const item of terms) {
    const [result] = await db.query(
      'INSERT INTO terminology_glossary (document_id, term, lecturer_definition) VALUES (?, ?, ?)',
      [documentId, item.term, item.lecturer_definition]
    );
    insertedIds.push(result.insertId);
  }

  return insertedIds;
};

// Fetch the full glossary for a document
exports.findByDocument = async (documentId) => {
  const [rows] = await db.query(
    'SELECT * FROM terminology_glossary WHERE document_id = ? ORDER BY term ASC',
    [documentId]
  );
  return rows;
};

// Check if a document already has a glossary (avoid duplicate extraction)
exports.existsForDocument = async (documentId) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM terminology_glossary WHERE document_id = ?',
    [documentId]
  );
  return rows[0].total > 0;
};

// Delete all terms for a document (used before re-extracting with ?force=true)
exports.deleteByDocument = async (documentId) => {
  await db.query('DELETE FROM terminology_glossary WHERE document_id = ?', [documentId]);
};