const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const calendarController = require('../controllers/calendar.controller');

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar events management
 */

/**
 * @swagger
 * /calendar/events:
 *   get:
 *     summary: Get all calendar events
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [personal, tutoring, study_group]
 *     responses:
 *       200:
 *         description: List of calendar events
 */
router.get('/events', auth, calendarController.getEvents);

/**
 * @swagger
 * /calendar/events/{id}:
 *   get:
 *     summary: Get calendar event by ID
 *     tags: [Calendar]
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
 *         description: Calendar event details
 *       404:
 *         description: Event not found
 */
router.get('/events/:id', auth, calendarController.getEvent);

/**
 * @swagger
 * /calendar/events:
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
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
 *               - startTime
 *               - endTime
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [personal, tutoring, study_group]
 *               location:
 *                 type: string
 *               isOnline:
 *                 type: boolean
 *                 default: false
 *               meetingLink:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post(
  '/events',
  [
    auth,
    body('title').trim().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('type').isIn(['personal', 'tutoring', 'study_group']),
    body('location').optional().trim(),
    body('isOnline').optional().isBoolean(),
    body('meetingLink').optional().custom(value => {
      // Allow null/empty meeting links
      if (value === null || value === '') {
        return true;
      }
      // Otherwise validate as URL
      if (!/^(https?:\/\/)/.test(value)) {
        throw new Error('Meeting link must be a valid URL starting with http:// or https://');
      }
      return true;
    }),
    body('participants').optional().isArray(),
    validate
  ],
  calendarController.createEvent
);

/**
 * @swagger
 * /calendar/events/{id}:
 *   put:
 *     summary: Update a calendar event
 *     tags: [Calendar]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               isOnline:
 *                 type: boolean
 *               meetingLink:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 */
router.put(
  '/events/:id',
  [
    auth,
    body('title').optional().trim().notEmpty(),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
    body('location').optional().trim(),
    body('isOnline').optional().isBoolean(),
    body('meetingLink').optional().custom(value => {
      // Allow null/empty meeting links
      if (value === null || value === '') {
        return true;
      }
      // Otherwise validate as URL
      if (!/^(https?:\/\/)/.test(value)) {
        throw new Error('Meeting link must be a valid URL starting with http:// or https://');
      }
      return true;
    }),
    body('participants').optional().isArray(),
    validate
  ],
  calendarController.updateEvent
);

/**
 * @swagger
 * /calendar/events/{id}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
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
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.delete('/events/:id', auth, calendarController.deleteEvent);

module.exports = router; 