const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
module.exports = async (req, res, next) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log("DECODED USER:", decoded);

    // Attach user to request
    req.user = decoded;
    console.log("[LOG auth] ========= Authenticated user id:", decoded?.id);

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error('[LOG auth middleware] ========= Error:', error);

    if (error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token', details: error.message });
    }

    if (error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired' });
    }

    return res.status(500).json({ 
      message: 'Authentication error', 
      error: error && error.message ? error.message : String(error)
    });
  }
}; 