const { validationResult } = require('express-validator');

/**
 * Validate middleware
 * Checks for validation errors from express-validator and returns them
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  next();
}; 