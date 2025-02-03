const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

router.post(
  '/initialize',
  auth,
  paymentController.initializeValidation,
  paymentController.initializePayment
);

router.get(
  '/verify',
  auth,
  paymentController.verifyValidation,
  paymentController.verifyPayment
);

// Webhook is not authenticated with JWT; it is verified via Chapa signature headers.
router.post('/webhook', paymentController.webhook);

module.exports = router;
