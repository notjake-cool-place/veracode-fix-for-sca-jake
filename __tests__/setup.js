/**
 * Test setup and mock utilities
 * Provides mocks for @actions/core and other GitHub Actions APIs
 */

// Mock @actions/core
const mockCore = {
  getInput: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  saveState: jest.fn(),
};

// Mock @actions/exec
const mockExec = {
  exec: jest.fn(),
};

// Setup all mocks before running tests
beforeEach(() => {
  // Clear all mock call histories before each test
  jest.clearAllMocks();

  // Reset getInput to return empty string by default
  mockCore.getInput.mockReturnValue('');
});

module.exports = {
  mockCore,
  mockExec,
};
