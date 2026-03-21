/**
 * URL Utilities Module
 *
 * Centralized URL parsing, parameter extraction, and base path resolution.
 * Eliminates duplicate URL handling across 20+ files.
 *
 * @module js/utils/url-helpers
 */

/**
 * Get URLSearchParams from current location, with safe fallback
 * @returns {URLSearchParams|null} Parsed URL parameters or null if invalid
 */
export function getUrlParams() {
  try {
    return new URLSearchParams(window.location.search || '');
  } catch (e) {
    console.warn('[url-helpers] Failed to parse URL params:', e);
    return null;
  }
}

/**
 * Get a specific query parameter by key
 * @param {string} key - Parameter name
 * @param {string} [defaultValue=''] - Default value if not found
 * @returns {string} Parameter value or default
 */
export function getQueryParam(key, defaultValue = '') {
  const params = getUrlParams();
  if (!params) return defaultValue;
  return String(params.get(key) || defaultValue).trim();
}

/**
 * Get multiple query parameters as an object
 * @param {string[]} keys - Parameter names to extract
 * @returns {Object} Object with key-value pairs
 */
export function getQueryParams(keys) {
  const params = getUrlParams();
  const result = {};

  if (!params) return result;

  keys.forEach(key => {
    const value = params.get(key);
    if (value !== null) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Resolve a URL relative to the document's base or current location
 * @param {string} relativePath - Path to resolve
 * @param {string} [baseUrl] - Base URL to use (defaults to window.location.href)
 * @returns {string} Absolute URL string
 */
export function resolveUrl(relativePath, baseUrl = null) {
  try {
    const base = baseUrl || document.baseURI || window.location.href;
    return new URL(relativePath, base).toString();
  } catch (e) {
    console.warn('[url-helpers] Failed to resolve URL:', relativePath, e);
    return relativePath;
  }
}

/**
 * Get the pathname relative to the document base
 * @param {string} url - URL to parse
 * @returns {string} Pathname relative to base
 */
export function getPathname(url) {
  try {
    return new URL(url, window.location.href).pathname;
  } catch (e) {
    console.warn('[url-helpers] Failed to parse pathname:', url, e);
    return url;
  }
}

/**
 * Get the document base URL (from <base> tag or window.location)
 * @returns {URL} Base URL object
 */
export function getDocumentBase() {
  const baseEl = document.querySelector('base[href]');
  if (baseEl) {
    try {
      return new URL(baseEl.getAttribute('href'), window.location.href);
    } catch (e) {
      console.warn('[url-helpers] Invalid <base> href:', e);
    }
  }

  return new URL(window.location.href);
}

/**
 * Get the base path from document base (e.g., '/CornerstoneMTSS/')
 * @returns {string} Base path with leading/trailing slashes
 */
export function getBasePath() {
  const base = getDocumentBase();
  let path = base.pathname;

  // Ensure trailing slash
  if (!path.endsWith('/')) {
    path += '/';
  }

  return path;
}

/**
 * Normalize a path relative to the base path
 * @param {string} path - Path to normalize
 * @returns {string} Normalized path
 */
export function normalizePath(path) {
  const basePath = getBasePath();
  let normalized = path;

  // Remove leading base path if present
  if (normalized.startsWith(basePath)) {
    normalized = normalized.slice(basePath.length);
  }

  // Remove leading slash
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

/**
 * Get current page hash (fragment)
 * @returns {string} Current hash without leading '#'
 */
export function getHash() {
  return window.location.hash.slice(1);
}

/**
 * Set page hash without reloading
 * @param {string} hash - New hash value (without '#')
 */
export function setHash(hash) {
  window.location.hash = hash;
}

/**
 * Build a URL with query parameters
 * @param {string} path - Base path
 * @param {Object} params - Query parameters
 * @returns {string} URL with query string
 */
export function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Check if current page is offline (no network)
 * @returns {boolean} True if offline
 */
export function isOffline() {
  return !navigator.onLine;
}

/**
 * Get cache buster query parameter (build version)
 * @returns {string} Cache buster value (e.g., 'v=12345')
 */
export function getCacheBuster() {
  const buildVersion = getQueryParam('v', '');
  return buildVersion ? `v=${buildVersion}` : '';
}

/**
 * Format a URL for logging (safe truncation)
 * @param {string} url - URL to format
 * @param {number} [maxLen=80] - Maximum length
 * @returns {string} Formatted URL
 */
export function formatUrlForLog(url, maxLen = 80) {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}
