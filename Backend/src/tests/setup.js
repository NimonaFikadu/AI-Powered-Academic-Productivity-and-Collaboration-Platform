// Simple test setup without separate test database
require('dotenv').config();

// Mock external services for testing
jest.mock('../services/rag/utils/vectorStore', () => ({
  createCollection: jest.fn().mockResolvedValue(true),
  addDocuments: jest.fn().mockResolvedValue(true),
  search: jest.fn().mockResolvedValue([]),
  deleteCollection: jest.fn().mockResolvedValue(true)
}));

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.warn = jest.fn();
}

console.log('[LOG test_setup] ========= Simple test setup configuration loaded'); 