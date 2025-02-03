const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');

const router = express.Router();

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieves comprehensive statistics for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get('/', auth, statisticsController.getUserStatistics);

/**
 * @swagger
 * /statistics/quiz-performance:
 *   get:
 *     summary: Get quiz performance statistics
 *     description: Retrieves detailed quiz performance statistics for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quiz performance statistics retrieved successfully
 */
router.get('/quiz-performance', auth, requirePremium, statisticsController.getQuizPerformance);

/**
 * @swagger
 * /statistics/note-progress:
 *   get:
 *     summary: Get note reading progress
 *     description: Retrieves note reading progress for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Note progress retrieved successfully
 */
router.get('/note-progress', auth, requirePremium, statisticsController.getNoteProgress);

/**
 * @swagger
 * /statistics/study-sessions:
 *   get:
 *     summary: Get study sessions
 *     description: Retrieves study session history for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study sessions retrieved successfully
 */
router.get('/study-sessions', auth, statisticsController.getStudySessions);

/**
 * @swagger
 * /statistics/topics:
 *   put:
 *     summary: Update topic progress
 *     description: Updates the progress for a user on a specific topic
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *               - progress
 *             properties:
 *               topicId:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               materialsCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Topic progress updated successfully
 */
router.put('/topics', auth, statisticsController.updateTopicProgress);

/**
 * @swagger
 * /statistics/quizzes:
 *   put:
 *     summary: Update quiz progress
 *     description: Updates the progress for a user on a specific quiz
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quizId
 *               - progress
 *             properties:
 *               quizId:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               score:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quiz progress updated successfully
 */
router.put('/quizzes', auth, requirePremium, statisticsController.updateQuizProgress);

/**
 * @swagger
 * /statistics/notes:
 *   put:
 *     summary: Update note progress
 *     description: Updates the progress for a user on a specific note
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteId
 *               - progress
 *             properties:
 *               noteId:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               lastReadPosition:
 *                 type: number
 *     responses:
 *       200:
 *         description: Note progress updated successfully
 */
router.put('/notes', auth, requirePremium, statisticsController.updateNoteProgress);

/**
 * @swagger
 * /statistics/study-sessions:
 *   post:
 *     summary: Log study session
 *     description: Records a study session for the authenticated user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hours
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *               productivityScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Study session logged successfully
 */
router.post('/study-sessions', auth, statisticsController.logStudySession);

module.exports = router;