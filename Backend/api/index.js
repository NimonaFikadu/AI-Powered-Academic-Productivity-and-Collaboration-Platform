// Vercel serverless function entry point
try {
  // Import app with error catching
  const app = require('../src/app');
  
  // Export the Express app as the serverless function handler
  module.exports = app;
} catch (error) {
  // Create a basic app if there was an error loading the main app
  const express = require('express');
  const fallbackApp = express();
  
  // Log the error details
  // console.error('Error loading main application:', error);
  
  // Basic routes
  fallbackApp.get('/', (req, res) => {
    res.status(500).json({
      error: 'Failed to load application',
      message: error.message,
      stack: error.stack
    });
  });
  
  fallbackApp.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Failed to load application', 
      path: req.path 
    });
  });
  
  module.exports = fallbackApp;
} 