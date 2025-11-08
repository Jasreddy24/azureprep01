// Test setup file
const path = require('path');
const fs = require('fs');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.PORT = 3001;

// Create test database path
const testDbPath = path.join(__dirname, '..', 'test-ecommerce.db');

module.exports = {
  testDbPath
};
