const db = require('../config/db');

// Count how many documents this user currently has (for the 300 cap)
exports.countByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM documents WHERE user_id = ?',
    [userId]
  );
  return rows[0].total;
};

// Insert metadata for a single uploaded file
exports.create = async (userId, filename, originalName, fileType, fileSize) => {
  const [result] = await db.query(
    `INSERT INTO documents (user_id, filename, original_name, file_type, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, filename, originalName, fileType, fileSize]
  );
  return result.insertId;
};

// Insert metadata for a whole batch at once (used by the controller)
exports.createMany = async (userId, files) => {
  const insertedIds = [];
  for (const file of files) {
    const id = await exports.create(
      userId,
      file.filename,
      file.originalname,
      file.mimetype,
      file.size
    );
    insertedIds.push(id);
  }
  return insertedIds;
};

// Fetch all documents belonging to a user (useful later for a dashboard/library view)
exports.findByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC',
    [userId]
  );
  return rows;
};

// Insert or update the extracted text for a document (one row per document_id)
exports.saveExtractedText = async (documentId, text) => {
  await db.query(
    `INSERT INTO document_text (document_id, extracted_text)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE extracted_text = VALUES(extracted_text), extracted_at = CURRENT_TIMESTAMP`,
    [documentId, text]
  );
};

// Fetch the extracted text for a single document
exports.getExtractedText = async (documentId) => {
  const [rows] = await db.query(
    'SELECT extracted_text, extracted_at FROM document_text WHERE document_id = ?',
    [documentId]
  );
  return rows[0] || null;
};