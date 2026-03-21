module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],
  testMatch: ['**/test/**/*.test.js', '**/__tests__/**/*.test.js', '**/*.spec.js'],
  collectCoverageFrom: [
    'specialist-hub-*.js',
    'landing-auth.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
