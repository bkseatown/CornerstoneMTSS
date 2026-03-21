// Global test setup
global.window = window;
global.document = document;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
