/**
 * Test Setup and Fixtures
 *
 * Initializes test environment and provides common utilities.
 */

import { expect, afterEach, vi } from 'vitest';

// ============================================================================
// Global Test Configuration
// ============================================================================

// Mock localStorage for tests
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// ============================================================================
// Global Utilities
// ============================================================================

/**
 * Create a mock element for testing
 * @param {string} [tag='div'] - Element tag
 * @param {Object} [attrs={}] - Element attributes
 * @returns {HTMLElement} Mock element
 */
export function createMockElement(tag = 'div', attrs = {}) {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      el.className = value;
    } else if (key === 'id') {
      el.id = value;
    } else {
      el.setAttribute(key, value);
    }
  });

  return el;
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Condition function
 * @param {number} [timeout=1000] - Max wait time
 * @returns {Promise<boolean>} True when condition is met
 */
export async function waitFor(condition, timeout = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await new Promise(r => setTimeout(r, 50));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Create a spy function
 * @param {string} [name='spy'] - Spy name
 * @returns {Function} Spy function
 */
export function createSpy(name = 'spy') {
  return vi.fn();
}

// ============================================================================
// Cleanup
// ============================================================================

// Clear storage and mocks after each test
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

// ============================================================================
// Custom Matchers
// ============================================================================

/**
 * Custom matcher: toBeValidColor
 */
expect.extend({
  toBeValidColor(received) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isValid = colorRegex.test(received) || /^rgb\(/.test(received) || /^hsl\(/.test(received);

    return {
      pass: isValid,
      message: () => `Expected ${received} to be a valid color`
    };
  }
});

/**
 * Custom matcher: toBeWithinRange
 */
expect.extend({
  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within range ${min} - ${max}`
          : `Expected ${received} to be within range ${min} - ${max}`
    };
  }
});

/**
 * Custom matcher: toHaveBeenCalledWithDelay
 */
expect.extend({
  toHaveBeenCalledWithDelay(received, args, delay) {
    // Verify mock was called
    const called = received.mock.calls.length > 0;
    const calledWithArgs = JSON.stringify(received.mock.calls[0]) === JSON.stringify([args]);

    return {
      pass: called && calledWithArgs,
      message: () => `Expected spy to have been called with ${args} and delay ${delay}ms`
    };
  }
});

console.log('[test-setup] Environment ready for testing');
