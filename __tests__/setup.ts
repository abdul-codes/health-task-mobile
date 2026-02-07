// Test setup file
// Configure testing environment

// Mock React Native modules that aren't available in Node.js environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 33,
  },
  NativeModules: {},
}));

// Silence console warnings during tests unless explicitly testing them
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);
