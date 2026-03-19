/**
 * Vitest Configuration
 *
 * Lightweight unit test runner for Cornerstone MTSS.
 * Supports ES6 modules, async tests, and code coverage.
 *
 * Usage:
 *   npm test              - Run all tests
 *   npm test -- --ui      - Run with UI
 *   npm test -- --coverage - Generate coverage report
 *   npm test -- --watch   - Watch mode
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.js',
        '**/*.test.js',
        '**/dist/**',
        '**/build/**'
      ],
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60
    },

    // Test file patterns
    include: ['**/*.{test,spec}.js'],
    exclude: ['node_modules', 'dist', 'build'],

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Reporters
    reporters: ['verbose'],

    // Timeout
    testTimeout: 10000,

    // Globals
    globals: true,

    // Config
    alias: {
      '@js': path.resolve(__dirname, './js'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },

  resolve: {
    alias: {
      '@js': path.resolve(__dirname, './js'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
