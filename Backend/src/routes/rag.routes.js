/**
 * RAG Routes
 * Routes for RAG (Retrieval-Augmented Generation) functionality
 */

const express = require('express');
const router = express.Router();
const ragController = require('../controllers/rag.controller');
const authMiddleware = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');
const { validationResult } = require('express-validator');
const db = require('../models');

// Apply authentication middleware to all RAG routes
router.use(authMiddleware);

// Require premium subscription for all RAG (AI) routes
router.use(requirePremium);

/**
 * @swagger
 * /rag/notes:
 *   post:
 *     summary: Generate a note using RAG
 *     tags: [RAG]
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
 *               - userGoal
 *               - topicId
 *             properties:
 *               title:
 *                 type: string
 *               userGoal:
 *                 type: string
 *               topicId:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Note generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/notes', ragController.generateNoteValidation, ragController.generateNote);

/**
 * @swagger
 * /rag/search:
 *   get:
 *     summary: Search materials for a topic
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/search', ragController.searchMaterials);

/**
 * @swagger
 * /rag/index/{topicId}:
 *   post:
 *     summary: Index materials for a topic
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Materials indexed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/index/:topicId', ragController.indexMaterials);

/**
 * @swagger
 * /rag/index/{topicId}/progress:
 *   get:
 *     summary: Get indexing progress for a topic
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *          type: string
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Indexing progress retrieved
 *       404:
 *         description: No indexing in progress or topic not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/index/:topicId/progress', ragController.getIndexingProgress);

/**
 * @swagger
 * /rag/index/{topicId}:
 *   delete:
 *     summary: Delete indexed materials for a topic
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Indexed materials deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/index/:topicId', ragController.deleteIndexedMaterials);

/**
 * @swagger
 * /rag/indexed-topics:
 *   get:
 *     summary: List all indexed topics for a user
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Indexed topics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/indexed-topics', ragController.listIndexedTopics);

/**
 * @swagger
 * /rag/extract/{materialId}:
 *   get:
 *     summary: Extract text from a material
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         schema:
 *           type: string
 *         required: true
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Text extracted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/extract/:materialId', ragController.extractTextFromMaterial);

/**
 * @swagger
 * /rag/test:
 *   get:
 *     summary: Test RAG service functionality
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RAG service is working
 *       500:
 *         description: RAG service error
 */
router.get('/test', async (req, res) => {
  try {
    console.log(`[LOG rag_routes] ========= Testing RAG service`);

    // Test vector store connection
    const collections = await require('../services/rag/utils/vectorStore').client.getCollections();

    // Test embedding generation
    const mockEmbedding = await require('../services/rag/utils/documentProcessor').generateMockEmbedding(128);

    res.json({
      status: 'success',
      message: 'RAG service is working',
      collections: collections.collections.length,
      embeddingLength: mockEmbedding.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[LOG rag_routes] ========= RAG service test error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'RAG service test failed',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /rag/status:
 *   get:
 *     summary: Check RAG service status
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RAG service status
 */
router.get('/status', async (req, res) => {
  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Get vector store status
    const vectorStore = require('../services/rag/utils/vectorStore');
    const collections = await vectorStore.client.getCollections();

    const userId = req.user.id;
    const userCollections = collections.collections
      .filter(c => c.name.startsWith(`user_${userId}`))
      .map(c => ({
        name: c.name,
        vectors: c.vectors_count
      }));

    res.json({
      status: 'running',
      collections: {
        total: collections.collections.length,
        user: userCollections.length,
        details: userCollections
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[LOG rag_routes] ========= RAG status error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get RAG service status',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /rag/notes/mock:
 *   post:
 *     summary: Generate a mock note without embeddings (faster fallback)
 *     tags: [RAG]
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
 *               - userGoal
 *               - topicId
 *             properties:
 *               title:
 *                 type: string
 *               userGoal:
 *                 type: string
 *               topicId:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Mock note generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/notes/mock', ragController.generateNoteValidation, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, userGoal, topicId, isPrivate = true } = req.body;
    const userId = req.user.id;

    // Verify topic belongs to user
    const topic = await db.Topic.findOne({ where: { id: topicId, user_id: userId } });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    console.log(`[LOG rag_routes] ========= Generating mock note for: "${title}"`);

    // Use the mock note generator directly
    const mockNote = require('../services/rag/models/noteGenerator').generateMockNote(
      title,
      userGoal,
      []  // No documents needed for mock
    );

    // Calculate reading time
    const readTime = require('../services/rag/models/noteGenerator').calculateReadTime(mockNote);

    // Generate a UUID for the note
    const noteId = require('uuid').v4();

    // Save the note to the database using the Note model
    await db.Note.create({
      id: noteId,
      title,
      content: mockNote,
      topic_id: topicId,
      user_id: userId,
      is_private: isPrivate,
      user_goal: userGoal,
      read_time: readTime
    });

    res.status(201).json({
      message: 'Mock note generated successfully',
      note: {
        id: noteId,
        title: title,
        content: mockNote,
        readTime: readTime,
        topicId: topicId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPrivate: isPrivate,
        isMock: true
      }
    });
  } catch (error) {
    console.error('[LOG rag_routes] ========= Error generating mock note:', error);
    res.status(500).json({ error: `Failed to generate mock note: ${error.message}` });
  }
});

/**
 * @swagger
 * /rag/chat:
 *   post:
 *     summary: Chat with context from topic materials or general academic chat
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *               context:
 *                 type: object
 *                 properties:
 *                   topicId:
 *                     type: string
 *                     description: Topic ID (optional - if omitted, provides general academic chat)
 *                   previousMessages:
 *                     type: array
 *                     description: Previous messages in the conversation
 *                     items:
 *                       type: object
 *                       required:
 *                         - role
 *                         - content
 *                       properties:
 *                         role:
 *                           type: string
 *                           enum: [user, assistant]
 *                           description: Role of the message sender
 *                         content:
 *                           type: string
 *                           description: Message content
 *     responses:
 *       200:
 *         description: Chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Assistant response message in markdown format
 *                 topicId:
 *                   type: string
 *                   description: Topic ID (if provided)
 *                 topicTitle:
 *                   type: string
 *                   description: Topic title (if topicId was provided)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response timestamp
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Server error
 */
router.post('/chat', ragController.chatValidation, ragController.chatWithContext);

module.exports = router; 