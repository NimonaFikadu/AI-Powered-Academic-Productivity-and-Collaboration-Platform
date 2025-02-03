const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');

/**
 * @swagger
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       required:
 *         - id
 *         - topic_id
 *         - file_name
 *         - uploaded_file
 *         - file_type
 *         - file_size
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the material
 *         topic_id:
 *           type: string
 *           format: uuid
 *           description: The UUID of the associated topic
 *         file_name:
 *           type: string
 *           description: Original file name
 *         uploaded_file:
 *           type: string
 *           description: Path to the stored file
 *         file_type:
 *           type: string
 *           enum: [pdf, image, ppt, docx]
 *           description: Type of the file
 *         file_size:
 *           type: integer
 *           description: Size of the file in bytes
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date the material was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: The date the material was last updated
 *         fileUrl:
 *           type: string
 *           description: URL to download the file
 */

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: API for materials management
 */

/**
 * @swagger
 * /materials/upload:
 *   post:
 *     summary: Upload a new material file
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - topicId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               topicId:
 *                 type: string
 *                 format: uuid
 *                 description: The topic ID to associate with the material
 *     responses:
 *       201:
 *         description: Material uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 material:
 *                   $ref: '#/components/schemas/Material'
 *       400:
 *         description: Bad request, invalid file or missing topic ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Server error
 */
router.post('/upload', auth, materialController.uploadMaterial);

/**
 * @swagger
 * /materials/topic/{topicId}:
 *   get:
 *     summary: Get all materials by topic ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: List of materials for the topic
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Server error
 */
router.get('/topic/:topicId', auth, materialController.getMaterialsByTopic);

/**
 * @swagger
 * /materials/topic/{topicId}:
 *   delete:
 *     summary: Delete all materials by topic ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: All materials for topic deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Topic not found
 *       500:
 *         description: Server error
 */
router.delete('/topic/:topicId', auth, materialController.deleteMaterialsByTopic);

/**
 * @swagger
 * /materials:
 *   get:
 *     summary: Get all materials
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, materialController.getAllMaterials);

/**
 * @swagger
 * /materials/{id}:
 *   get:
 *     summary: Get material by ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, materialController.getMaterialById);

/**
 * @swagger
 * /materials/{id}:
 *   delete:
 *     summary: Delete material by ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, materialController.deleteMaterial);

/**
 * @swagger
 * /materials/:userId/:filename:
 *   get:
 *     summary: Get material file (protected)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material file
 *       403:
 *         description: Forbidden
 *       404:
 *         description: File not found
 */
router.get('/:userId/:filename', auth, materialController.serveFile);

module.exports = router; 