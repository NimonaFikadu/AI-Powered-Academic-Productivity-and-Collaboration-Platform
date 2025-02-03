const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const collaborationController = require('../controllers/collaboration.controller');

/**
 * @swagger
 * tags:
 *   name: Collaboration
 *   description: Collaboration and content sharing management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SharedContent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [topic, quiz]
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         url:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 *         likes:
 *           type: integer
 *         comments:
 *           type: integer
 *         isLiked:
 *           type: boolean
 *         timestamp:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /collaboration/content:
 *   get:
 *     summary: Get all shared content
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, topic, quiz]
 *           default: all
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, popular, comments]
 *           default: recent
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of shared content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SharedContent'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/content', auth, collaborationController.getSharedContent);

/**
 * @swagger
 * /collaboration/content:
 *   post:
 *     summary: Share new content
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_url
 *               - title
 *             properties:
 *               content_url:
 *                 type: string
 *                 format: uri
 *                 example: "http://localhost:3001/topics/44b416d6-ba07-49ed-b784-2ddc8cc30e15"
 *               title:
 *                 type: string
 *                 example: "Advanced React Patterns"
 *               description:
 *                 type: string
 *                 example: "Comprehensive guide covering advanced React patterns"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "JavaScript", "Frontend"]
 *     responses:
 *       201:
 *         description: Content shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SharedContent'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/content',
  [
    auth,
    body('content_url')
      .trim()
      .notEmpty()
      .withMessage('Content URL is required')
      .custom((value) => {
        // Allow full URLs, relative URLs, or paths
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
          return true;
        }
        // Also allow localhost URLs without protocol
        if (value.includes('localhost') || value.includes('127.0.0.1')) {
          return true;
        }
        throw new Error('Invalid URL format');
      }),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    validate
  ],
  collaborationController.createSharedContent
);

/**
 * @swagger
 * /collaboration/content/{id}/like:
 *   post:
 *     summary: Toggle like on shared content
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                     likesCount:
 *                       type: integer
 *       404:
 *         description: Content not found
 *       401:
 *         description: Unauthorized
 */
router.post('/content/:id/like', auth, collaborationController.toggleLike);

/**
 * @swagger
 * /collaboration/content/{id}/comments:
 *   get:
 *     summary: Get comments for shared content
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: List of comments
 *       404:
 *         description: Content not found
 *       401:
 *         description: Unauthorized
 */
router.get('/content/:id/comments', auth, collaborationController.getComments);

/**
 * @swagger
 * /collaboration/content/{id}/comments:
 *   post:
 *     summary: Add comment to shared content
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "Great content! Thanks for sharing."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Content not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/content/:id/comments',
  [
    auth,
    body('comment').trim().notEmpty().withMessage('Comment is required'),
    validate
  ],
  collaborationController.addComment
);

/**
 * @swagger
 * /collaboration/content/{id}:
 *   delete:
 *     summary: Delete shared content (only by author)
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *       403:
 *         description: Forbidden - can only delete own content
 *       404:
 *         description: Content not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/content/:id', auth, collaborationController.deleteSharedContent);

module.exports = router; 