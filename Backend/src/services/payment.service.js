const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

function getChapaSecretKey() {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) {
    const err = new Error('CHAPA_SECRET_KEY is not configured');
    err.code = 'CHAPA_SECRET_KEY_MISSING';
    throw err;
  }
  return key;
}

function getWebhookSecret() {
  return process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
}

function generateTxRef() {
  const ts = Date.now();
  const rand = uuidv4().replace(/-/g, '').slice(0, 12);
  return `tx_${ts}_${rand}`;
}

function requestJson({ method, url, headers, body }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const req = https.request(
      {
        method,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          const contentType = String(res.headers['content-type'] || '');
          const isJson = contentType.includes('application/json');
          let parsedBody = data;

          if (isJson) {
            try {
              parsedBody = data ? JSON.parse(data) : {};
            } catch (e) {
              // keep raw
            }
          }

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            return resolve({ statusCode: res.statusCode, body: parsedBody });
          }

          const error = new Error('Chapa request failed');
          error.statusCode = res.statusCode;
          error.response = parsedBody;
          return reject(error);
        });
      }
    );

    req.on('error', reject);

    if (body !== undefined) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function initializeTransaction({ amount, email, tx_ref, callback_url, return_url, currency = 'ETB' }) {
  const secretKey = getChapaSecretKey();

  const { body } = await requestJson({
    method: 'POST',
    url: `${CHAPA_BASE_URL}/transaction/initialize`,
    headers: {
      Authorization: `Bearer ${secretKey}`
    },
    body: {
      amount,
      currency,
      email,
      tx_ref,
      callback_url,
      return_url
    }
  });

  return body;
}

async function verifyTransaction({ tx_ref }) {
  const secretKey = getChapaSecretKey();

  const { body } = await requestJson({
    method: 'GET',
    url: `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(tx_ref)}`,
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  });

  return body;
}

function computeHmacSha256Hex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = {
  generateTxRef,
  initializeTransaction,
  verifyTransaction,
  computeHmacSha256Hex,
  safeEqualHex,
  getWebhookSecret
};
