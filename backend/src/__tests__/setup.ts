// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '5001'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any

