const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');
const topicController = require('../controllers/topicController');
const terminologyController = require('../controllers/terminologyController');
const summaryController = require('../controllers/summaryController');
const quizController = require('../controllers/quizController');

router.post(
  '/upload',
  authMiddleware,
  upload,
  uploadController.uploadDocuments
);

router.get('/', authMiddleware, uploadController.getMyDocuments);

// GET /api/documents/:id/text — view a single document's extracted text
router.get('/:id/text', authMiddleware, uploadController.getDocumentText);

// Topic segmentation
router.post('/:id/segment', authMiddleware, topicController.segmentDocument);
router.get('/:id/topics', authMiddleware, topicController.getTopics);

// Terminology extraction
router.post('/:id/terminology', authMiddleware, terminologyController.extractDocumentTerminology);
router.get('/:id/terminology', authMiddleware, terminologyController.getTerminology);

// Summarization
router.post('/:id/summarize', authMiddleware, summaryController.summarizeDocument);

// Progress (gated learning status per document)
router.get('/:id/progress', authMiddleware, quizController.getDocumentProgress);


router.get('/:id/progress/summary', authMiddleware, quizController.getAggregatedProgress);

module.exports = router;