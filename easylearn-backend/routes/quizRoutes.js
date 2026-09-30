const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');
const brainstormController = require('../controllers/brainstormController');
const topicController = require('../controllers/topicController');

router.get('/:topicId', authMiddleware, topicController.getTopicById);
router.get('/:topicId/quiz', authMiddleware, quizController.getQuiz);
router.post('/:topicId/answer', authMiddleware, quizController.submitAnswer);
router.post('/:topicId/brainstorm', authMiddleware, brainstormController.getBrainstormHelp);

module.exports = router;