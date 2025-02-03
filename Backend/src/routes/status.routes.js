const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Check API and database health
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: API and database are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *       500:
 *         description: Server error
 */
router.get('', statusController.checkHealth);

/**
 * @swagger
 * /status/ai/health:
 *   get:
 *     summary: Check AI service quota/lockout health securely
 *     tags: [Status]
 */
router.get('/ai/health', statusController.checkAiHealth);

module.exports = router; 