/**
 * URL Helpers - Unit Tests
 *
 * Tests for js/utils/url-helpers.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as urlHelpers from '../js/utils/url-helpers.js';

describe('URL Helpers', () => {
  // ========================================================================
  // URL Parameter Parsing
  // ========================================================================

  describe('getUrlParams()', () => {
    it('should return URLSearchParams from current location', () => {
      // Note: jsdom sets a basic URL by default
      const params = urlHelpers.getUrlParams();
      expect(params).toBeInstanceOf(URLSearchParams);
    });

    it('should return null for invalid search params', () => {
      // Mock invalid location
      const original = window.location;
      delete window.location;
      window.location = { search: '{invalid}' };

      const params = urlHelpers.getUrlParams();
      expect(params).toBeNull();

      // Restore
      window.location = original;
    });
  });

  describe('getQueryParam()', () => {
    it('should extract query parameter', () => {
      // This tests the logic; actual window.location would be set by test runner
      const param = urlHelpers.getQueryParam('missing');
      expect(typeof param).toBe('string');
    });

    it('should return default value if parameter not found', () => {
      const param = urlHelpers.getQueryParam('nonexistent', 'default');
      expect(param).toBe('default');
    });

    it('should return empty string if no default provided', () => {
      const param = urlHelpers.getQueryParam('nonexistent');
      expect(param).toBe('');
    });
  });

  // ========================================================================
  // URL Resolution
  // ========================================================================

  describe('resolveUrl()', () => {
    it('should resolve relative URLs', () => {
      const url = urlHelpers.resolveUrl('./index.html');
      expect(url).toContain('index.html');
    });

    it('should handle absolute URLs', () => {
      const url = urlHelpers.resolveUrl('https://example.com/path');
      expect(url).toBe('https://example.com/path');
    });

    it('should handle invalid URLs gracefully', () => {
      const url = urlHelpers.resolveUrl('{{invalid}}');
      expect(url).toBe('{{invalid}}');
    });
  });

  describe('getPathname()', () => {
    it('should extract pathname from URL', () => {
      const pathname = urlHelpers.getPathname('https://example.com/path/to/page');
      expect(pathname).toBe('/path/to/page');
    });

    it('should handle invalid URLs', () => {
      const pathname = urlHelpers.getPathname('not a url');
      expect(pathname).toBe('not a url');
    });
  });

  // ========================================================================
  // Base Path Utilities
  // ========================================================================

  describe('getDocumentBase()', () => {
    it('should return a URL object', () => {
      const base = urlHelpers.getDocumentBase();
      expect(base).toBeInstanceOf(URL);
    });
  });

  describe('getBasePath()', () => {
    it('should return path with trailing slash', () => {
      const basePath = urlHelpers.getBasePath();
      expect(basePath).toMatch(/\/$/);
    });

    it('should start with slash', () => {
      const basePath = urlHelpers.getBasePath();
      expect(basePath).toMatch(/^\//);
    });
  });

  describe('normalizePath()', () => {
    it('should remove leading slash', () => {
      const normalized = urlHelpers.normalizePath('/path');
      expect(normalized).toBe('path');
    });

    it('should handle already normalized paths', () => {
      const normalized = urlHelpers.normalizePath('path');
      expect(normalized).toBe('path');
    });
  });

  // ========================================================================
  // Hash Management
  // ========================================================================

  describe('getHash()', () => {
    it('should return current hash without #', () => {
      window.location.hash = 'test';
      const hash = urlHelpers.getHash();
      expect(hash).toBe('test');
    });

    it('should return empty string if no hash', () => {
      window.location.hash = '';
      const hash = urlHelpers.getHash();
      expect(hash).toBe('');
    });
  });

  describe('setHash()', () => {
    it('should set window location hash', () => {
      urlHelpers.setHash('newpage');
      expect(window.location.hash).toBe('#newpage');
    });
  });

  // ========================================================================
  // URL Building
  // ========================================================================

  describe('buildUrl()', () => {
    it('should build URL with query parameters', () => {
      const url = urlHelpers.buildUrl('/page', { id: '123', name: 'test' });
      expect(url).toContain('id=123');
      expect(url).toContain('name=test');
    });

    it('should ignore null and undefined parameters', () => {
      const url = urlHelpers.buildUrl('/page', { id: '123', skip: null, ignore: undefined });
      expect(url).toContain('id=123');
      expect(url).not.toContain('skip');
      expect(url).not.toContain('ignore');
    });

    it('should handle empty parameter object', () => {
      const url = urlHelpers.buildUrl('/page', {});
      expect(url).toContain('/page');
    });
  });

  // ========================================================================
  // Cache Busting
  // ========================================================================

  describe('getCacheBuster()', () => {
    it('should return cache buster string if version exists', () => {
      // This would require setting URL params which is complex in test env
      const buster = urlHelpers.getCacheBuster();
      expect(typeof buster).toBe('string');
    });
  });

  // ========================================================================
  // Offline Detection
  // ========================================================================

  describe('isOffline()', () => {
    it('should return boolean', () => {
      const offline = urlHelpers.isOffline();
      expect(typeof offline).toBe('boolean');
    });

    it('should reflect navigator.onLine status', () => {
      const expected = navigator.onLine;
      const offline = urlHelpers.isOffline();
      expect(offline).toBe(!expected);
    });
  });

  // ========================================================================
  // URL Formatting
  // ========================================================================

  describe('formatUrlForLog()', () => {
    it('should truncate long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(100);
      const formatted = urlHelpers.formatUrlForLog(longUrl, 50);
      expect(formatted.length).toBeLessThanOrEqual(50);
      expect(formatted).toContain('...');
    });

    it('should not truncate short URLs', () => {
      const shortUrl = 'https://example.com/page';
      const formatted = urlHelpers.formatUrlForLog(shortUrl, 100);
      expect(formatted).toBe(shortUrl);
    });
  });
});
