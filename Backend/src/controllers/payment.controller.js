const db = require('../models');
const { validationResult, body, query } = require('express-validator');
const paymentService = require('../services/payment.service');
const emailService = require('../services/emailService');
const axios = require('axios');

const initializeValidation = [
  body('amount').isNumeric().withMessage('amount must be a number'),
  body('user_id').optional().isString(),
];

const verifyValidation = [
  query('tx_ref').isString().notEmpty().withMessage('tx_ref is required')
];

function extractChapaStatus(chapaVerifyResponse) {
  const top = chapaVerifyResponse || {};
  const data = top.data || {};
  const status = String(data.status || top.status || '').toLowerCase();
  return status;
}

async function initializePayment(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ message: 'Payment gateway is not configured' });
    }

    // Validate User Data Before Payment to avoid Chapa rejection
    if (!req.user.email || !req.user.username) {
      return res.status(400).json({ 
        message: 'Incomplete user profile. Email and username are required for payment.' 
      });
    }

    const currentUser = await db.User.findByPk(userId);
    if (currentUser && currentUser.subscription_status === 'premium' && currentUser.subscription_end_date && new Date() < currentUser.subscription_end_date) {
      return res.status(403).json({ message: 'You already have an active premium subscription' });
    }

    const rawAmount = req.body?.amount;
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }
    
    // Generate unique transaction reference
    const tx_ref = paymentService.generateTxRef();

    // Create a pending transaction record with defensive wrapping
    try {
      await db.Transaction.create({
        user_id: userId,
        tx_ref,
        amount,
        status: 'pending'
      });
    } catch (dbError) {
      console.error("TRANSACTION CREATE ERROR:", dbError);
      if (dbError && (dbError.name === 'SequelizeUniqueConstraintError' || dbError.name === 'SequelizeValidationError')) {
        return res.status(409).json({ message: 'Transaction could not be created', error: dbError.message });
      }
      return res.status(500).json({ message: 'Database error while initiating transaction' });
    }

    console.log(`[LOG payment_init] ========= Initializing payment for User: ${userId}, Amount: ${amount}`);

    const chapaPayload = {
      amount, // Chapa prefers Number type
      currency: "ETB",
      email: req.user.email,
      first_name: req.user.username,
      last_name: "User",
      tx_ref: tx_ref,
      callback_url: "https://unihub-callback.vercel.app/api/payment/webhook", // Use a placeholder for cloud
      return_url: `http://localhost:3000/payment/success?tx_ref=${tx_ref}`
    };

    console.log("[LOG payment_init] ========= CHAPA PAYLOAD:", JSON.stringify(chapaPayload, null, 2));

    let chapaResponse;
    try {
      chapaResponse = await axios.post("https://api.chapa.co/v1/transaction/initialize", chapaPayload, {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
    } catch (chapaApiError) {
      const status = chapaApiError.response?.status;
      const errorData = chapaApiError.response?.data;

      console.error("[LOG payment_init ERROR] ========= CHAPA API REJECTION:", {
        tx_ref,
        status,
        code: chapaApiError.code,
        message: chapaApiError.message,
        response: errorData
      });

      return res.status(status || 500).json({
        message: 'Payment initialization failed at Chapa Gateway',
        tx_ref,
        error: errorData || chapaApiError.message
      });
    }

    console.log("[LOG payment_init] ========= CHAPA RESPONSE SUCCESS:", chapaResponse.data);

    const checkout_url = chapaResponse.data?.data?.checkout_url;
    if (!checkout_url) {
      return res.status(502).json({ message: 'Missing checkout_url from Chapa', chapa: chapaResponse.data });
    }

    return res.json({ checkout_url });
  } catch (error) {
    console.error("[LOG payment_init FATAL] ========= Unexpected error:", error);
    return res.status(500).json({ 
      message: 'Payment initialization failed internally', 
      error: error.message 
    });
  }
}

async function verifyPayment(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const tx_ref = req.query.tx_ref;

    const transaction = await db.Transaction.findOne({ where: { tx_ref, user_id: userId } });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Idempotency: Don't re-ping Chapa if already successfully completed
    if (transaction.status === 'success') {
      return res.json({ status: 'success' });
    }

    let chapaResponse;
    try {
      chapaResponse = await paymentService.verifyTransaction({ tx_ref });
    } catch (chapaErr) {
      // Chapa throws HTTP 404 or 400 when transactions are unpaid/failed.
      // This MUST NOT crash our server with 500. We intercept and properly mark it failed natively.
      console.log('CHAPA API EXCEPTION:', chapaErr.response || chapaErr.message);
      return res.json({ status: 'pending' });
    }
    
    console.log("VERIFY RESPONSE:", chapaResponse);
    
    // Fix Chapa response parsing intelligently allowing inner structural variations
    const status = String(chapaResponse?.data?.status || chapaResponse?.status || 'unknown').toLowerCase();

    if (status === 'success') {
      // Immediate transaction status update for idempotency
      await db.Transaction.update(
        { status: 'success' },
        { where: { tx_ref } }
      );
      
      // Fetch fresh user data for fair stacking logic
      const user = await db.User.findByPk(transaction.user_id);
      
      const now = new Date();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      
      const oldEndDate = user.subscription_end_date;
      let newEndDate;
      
      // Fair Stacking Logic
      if (user.subscription_status === 'premium' && oldEndDate && new Date(oldEndDate) > now) {
        newEndDate = new Date(new Date(oldEndDate).getTime() + thirtyDaysInMs);
      } else {
        newEndDate = new Date(now.getTime() + thirtyDaysInMs);
      }

      await user.update({ 
        subscription_status: 'premium',
        subscription_start_date: now,
        subscription_end_date: newEndDate 
      });

      // Structured Audit Logging
      console.log(JSON.stringify({
        event: "PAYMENT_SUCCESS_VERIFIED",
        tx_ref: tx_ref,
        user_id: transaction.user_id,
        old_subscription_end_date: oldEndDate,
        new_subscription_end_date: newEndDate,
        transaction_status: "success"
      }));

      // Send Payment Success Email asynchronously (don't await so we don't delay the response)
      if (user.email) {
        emailService.sendPaymentSuccessEmail(user.email, user.username, transaction.amount, newEndDate)
          .catch(err => console.error('[LOG payment_verify] Failed to send success email:', err.message));
      }

    } else if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
      await db.Transaction.update(
        { status: 'failed' },
        { where: { tx_ref } }
      );
    }

    return res.json({ status });
  } catch (error) {
    console.error('[LOG payment_verify] ========= Error:', error);
    return res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
}

async function webhook(req, res) {
  try {
    const secret = paymentService.getWebhookSecret();
    if (!secret) {
      return res.status(500).json({ message: 'Webhook secret is not configured' });
    }

    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});

    const headerChapaSignature = req.headers['chapa-signature'] || req.headers['Chapa-Signature'];
    const headerXChapaSignature = req.headers['x-chapa-signature'];

    const expectedX = paymentService.computeHmacSha256Hex(secret, raw);
    const expectedChapa = paymentService.computeHmacSha256Hex(secret, secret);

    const isXValid = headerXChapaSignature && paymentService.safeEqualHex(String(headerXChapaSignature), expectedX);
    const isChapaValid = headerChapaSignature && paymentService.safeEqualHex(String(headerChapaSignature), expectedChapa);

    if (!isXValid && !isChapaValid) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    const tx_ref = payload.tx_ref || payload.reference || payload.data?.tx_ref || payload.data?.reference;
    const status = String(payload.status || payload.data?.status || '').toLowerCase();

    if (!tx_ref) {
      return res.status(400).json({ message: 'tx_ref missing in webhook payload' });
    }

    const transaction = await db.Transaction.findOne({ where: { tx_ref } });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Idempotency: Only process if not success
    if (transaction.status === 'success') {
      console.log(`[WEBHOOK] Transaction ${tx_ref} already processed as success.`);
      return res.status(200).json({ received: true, already_processed: true });
    }

    if (status === 'success') {
      // Option A: webhook ONLY logs incoming data (NO DB updates)
      console.log(JSON.stringify({
        event: "WEBHOOK_PAYMENT_SUCCESS_RECEIVED",
        tx_ref: tx_ref,
        user_id: transaction.user_id,
        transaction_status: "success",
        note: "Database updates are handled exclusively by verifyPayment."
      }));
    } else if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
      console.log(`[WEBHOOK] Received failed/cancelled status for tx_ref ${tx_ref}. No DB updates performed.`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[LOG payment_webhook] ========= Error:', error);
    return res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
}

module.exports = {
  initializePayment,
  verifyPayment,
  webhook,
  initializeValidation,
  verifyValidation
};
