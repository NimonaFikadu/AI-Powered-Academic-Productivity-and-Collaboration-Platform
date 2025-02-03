// Entry point for cPanel
// This file simply imports the app from src/app.js

// Set NODE_ENV to production and disable database sync
process.env.NODE_ENV = 'production';
process.env.DISABLE_DB_SYNC = 'true'; // Custom env var to prevent sync
process.env.CPANEL = 'true';

// Import and export the app
const app = require('./src/app');

// Start the server if not using a reverse proxy
if (!process.env.USING_PROXY) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[LOG server] ========= Server started on port ${PORT}`);
  });
}

module.exports = app; 