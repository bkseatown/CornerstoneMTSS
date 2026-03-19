/**
 * Error Boundary - Unit Tests
 *
 * Tests for js/error-boundary.js error handling and recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as errorBoundary from '../js/error-boundary.js';

describe('Error Boundary', () => {
  // ========================================================================
  // Error Logging
  // ========================================================================

  describe('logError()', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const result = errorBoundary.logError(error, { test: true });

      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.context.test).toBe(true);
    });

    it('should handle string errors', () => {
      const result = errorBoundary.logError('String error', {});

      expect(result.message).toBe('String error');
    });

    it('should capture stack traces', () => {
      const error = new Error('Test error');
      const result = errorBoundary.logError(error);

      expect(result.stack).toBeDefined();
      expect(result.stack.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Safe Execution
  // ========================================================================

  describe('tryCatch()', () => {
    it('should execute function and return result', () => {
      const result = errorBoundary.tryCatch(() => 'success');
      expect(result).toBe('success');
    });

    it('should return fallback on error', () => {
      const result = errorBoundary.tryCatch(
        () => {
          throw new Error('Failed');
        },
        {},
        'fallback'
      );

      expect(result).toBe('fallback');
    });

    it('should log error context', () => {
      const context = { source: 'test' };
      errorBoundary.tryCatch(
        () => {
          throw new Error('Test');
        },
        context
      );

      const logs = errorBoundary.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].context.source).toBe('test');
    });
  });

  describe('tryCatchAsync()', () => {
    it('should execute async function and return result', async () => {
      const result = await errorBoundary.tryCatchAsync(async () => 'async success');
      expect(result).toBe('async success');
    });

    it('should return fallback on async error', async () => {
      const result = await errorBoundary.tryCatchAsync(
        async () => {
          throw new Error('Async failed');
        },
        {},
        'async fallback'
      );

      expect(result).toBe('async fallback');
    });
  });

  // ========================================================================
  // Function Wrapping
  // ========================================================================

  describe('errorBoundary()', () => {
    it('should wrap function and catch errors', () => {
      const failingFn = () => {
        throw new Error('Wrapped error');
      };

      const wrapped = errorBoundary.errorBoundary(failingFn, 'test-func');
      const result = wrapped();

      expect(result).toBeNull();
      const logs = errorBoundary.getErrorLogs();
      expect(logs[logs.length - 1].context.label).toBe('test-func');
    });

    it('should return null on error', () => {
      const wrapped = errorBoundary.errorBoundary(() => {
        throw new Error('Test');
      });

      expect(wrapped()).toBeNull();
    });

    it('should work with successful functions', () => {
      const successFn = () => 'success';
      const wrapped = errorBoundary.errorBoundary(successFn);

      expect(wrapped()).toBe('success');
    });
  });

  // ========================================================================
  // DOM Helpers
  // ========================================================================

  describe('safeQuerySelector()', () => {
    it('should find element by selector', () => {
      const div = document.createElement('div');
      div.id = 'test-element';
      document.body.appendChild(div);

      const found = errorBoundary.safeQuerySelector('#test-element');
      expect(found).toBe(div);

      document.body.removeChild(div);
    });

    it('should return null for invalid selector', () => {
      const found = errorBoundary.safeQuerySelector('{{invalid}}');
      expect(found).toBeNull();
    });

    it('should return null for non-existent element', () => {
      const found = errorBoundary.safeQuerySelector('#nonexistent-element');
      expect(found).toBeNull();
    });
  });

  describe('safeUpdateElement()', () => {
    it('should update element safely', () => {
      const div = document.createElement('div');
      div.id = 'test-update';
      document.body.appendChild(div);

      const success = errorBoundary.safeUpdateElement('#test-update', (el) => {
        el.textContent = 'Updated';
      });

      expect(success).toBe(true);
      expect(div.textContent).toBe('Updated');

      document.body.removeChild(div);
    });

    it('should handle errors during update', () => {
      const div = document.createElement('div');
      div.id = 'test-error-update';
      document.body.appendChild(div);

      const success = errorBoundary.safeUpdateElement('#test-error-update', (el) => {
        throw new Error('Update failed');
      });

      expect(success).toBe(false);

      document.body.removeChild(div);
    });

    it('should return false if element not found', () => {
      const success = errorBoundary.safeUpdateElement('#nonexistent', (el) => {
        el.textContent = 'text';
      });

      expect(success).toBe(false);
    });
  });

  // ========================================================================
  // Storage Helpers
  // ========================================================================

  describe('safeGetStorage()', () => {
    it('should retrieve stored JSON value', () => {
      localStorage.setItem('test-key', JSON.stringify({ value: 'test' }));
      const result = errorBoundary.safeGetStorage('test-key');

      expect(result.value).toBe('test');
      localStorage.clear();
    });

    it('should return fallback for non-existent key', () => {
      const result = errorBoundary.safeGetStorage('nonexistent', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('invalid', 'not-json');
      const result = errorBoundary.safeGetStorage('invalid', 'fallback');

      expect(result).toBe('fallback');
      localStorage.clear();
    });
  });

  describe('safeSetStorage()', () => {
    it('should store JSON value', () => {
      const success = errorBoundary.safeSetStorage('test', { data: 'value' });
      expect(success).toBe(true);

      const retrieved = JSON.parse(localStorage.getItem('test'));
      expect(retrieved.data).toBe('value');
      localStorage.clear();
    });
  });

  // ========================================================================
  // Diagnostics
  // ========================================================================

  describe('Error Log Management', () => {
    beforeEach(() => {
      errorBoundary.clearErrorLogs();
    });

    it('should track error logs', () => {
      errorBoundary.logError('Error 1', {});
      errorBoundary.logError('Error 2', {});

      const logs = errorBoundary.getErrorLogs();
      expect(logs.length).toBe(2);
    });

    it('should get error summary', () => {
      errorBoundary.logError('Error', {}, 'error');
      errorBoundary.logError('Warning', {}, 'warn');

      const summary = errorBoundary.getErrorSummary();
      expect(summary.total).toBeGreaterThanOrEqual(2);
    });

    it('should export error logs as JSON', () => {
      errorBoundary.logError('Test', {});
      const exported = errorBoundary.exportErrorLogs();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should clear error logs', () => {
      errorBoundary.logError('Test', {});
      expect(errorBoundary.getErrorLogs().length).toBeGreaterThan(0);

      errorBoundary.clearErrorLogs();
      expect(errorBoundary.getErrorLogs().length).toBe(0);
    });
  });
});
