const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const validate = require('../middleware/validate');
const quizController = require('../controllers/quiz.controller');

/**
 * @swagger
 * tags:
 *   name: Quizzes
 *   description: Quiz management and attempts
 */

/**
 * @swagger
 * /quizzes:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of quizzes
 */
router.get('/', auth, quizController.getQuizzes);

/**
 * @swagger
 * /quizzes/topic/{topicId}:
 *   get:
 *     summary: Get all quizzes for a specific topic
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: The topic ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of quizzes for the specified topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Topic not found
 */
router.get('/topic/:topicId', auth, quizController.getQuizzesByTopic);

/**
 * @swagger
 * /quizzes/rag:
 *   post:
 *     summary: Generate a quiz using RAG (Retrieval-Augmented Generation)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - topicId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the quiz
 *               topicId:
 *                 type: string
 *                 description: ID of the topic to generate quiz for
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *                 description: Difficulty level of the quiz
 *               numQuestions:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 5
 *                 description: Number of questions to generate
 *     responses:
 *       201:
 *         description: Quiz generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 quiz:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     topic_id:
 *                       type: string
 *                     question_count:
 *                       type: integer
 *       400:
 *         description: Invalid input parameters
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Server error
 */
router.post(
  '/rag',
  [
    auth,
    requirePremium,
    body('title').notEmpty().withMessage('Title is required'),
    body('topicId').notEmpty().withMessage('Topic ID is required'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('numQuestions').optional().isInt({ min: 1, max: 20 }),
    validate
  ],
  quizController.createRagQuiz
);

/**
 * @swagger
 * /quizzes/{id}:
 *   get:
 *     summary: Get quiz by ID with questions
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details with questions
 *       404:
 *         description: Quiz not found
 */
router.get('/:id', auth, quizController.getQuiz);

/**
 * @swagger
 * /quizzes/{id}/attempts:
 *   get:
 *     summary: Get quiz attempts for a user
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quiz attempts
 */
router.get('/:id/attempts', auth, quizController.getQuizAttempts);



/**
 * @swagger
 * /quizzes/{id}/attempt:
 *   post:
 *     summary: Submit a quiz attempt
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: Quiz attempt submitted successfully
 */
router.post(
  '/:id/attempt',
  [
    auth,
    body('answers').isObject(),
    validate
  ],
  quizController.submitQuizAttempt
);

module.exports = router; 