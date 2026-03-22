module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.js'],
  testMatch: ['**/test/**/*.test.js', '**/__tests__/**/*.test.js', '**/*.spec.js'],
  testPathIgnorePatterns: [
    '<rootDir>/tests/a11y-audit.spec.js',  // Playwright test
    '<rootDir>/tests/audit-pages.spec.js',  // Playwright test
    '<rootDir>/tests/e2e-auth-flow.spec.js',  // Playwright test
    '<rootDir>/tests/nav-integrity.spec.js',  // Playwright test
    '<rootDir>/tests/perf-web-vitals.spec.js',  // Playwright test
    '<rootDir>/tests/runtime-guards.spec.js',  // Playwright test
    '<rootDir>/tests/visual-regression.spec.js',  // Playwright test
  ],
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
