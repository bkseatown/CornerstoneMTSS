/**
 * Error Boundary Module
 *
 * Provides production-grade error handling:
 * - Uncaught exception logging
 * - Graceful degradation
 * - User-friendly error messages
 * - Error recovery patterns
 *
 * @module js/error-boundary
 */

/**
 * Error handler configuration
 */
const config = {
  logToServer: false, // Set to true for production logging
  serverUrl: '/api/logs/errors',
  showUserMessages: true,
  enableRecovery: true,
  maxErrorLogs: 50
};

/**
 * Error log storage (in-memory, limited to prevent memory leaks)
 */
const errorLogs = [];

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log an error with context
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Additional context
 * @param {string} [level='error'] - Log level
 */
export function logError(error, context = {}, level = 'error') {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';

  const entry = {
    timestamp,
    level,
    message,
    stack,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // Add to in-memory log (with limit)
  errorLogs.push(entry);
  if (errorLogs.length > config.maxErrorLogs) {
    errorLogs.shift();
  }

  // Console output
  console[level]('[ErrorBoundary]', message, context);

  // Server logging (if enabled)
  if (config.logToServer) {
    sendErrorToServer(entry);
  }

  return entry;
}

/**
 * Send error to server
 * @param {Object} entry - Error log entry
 */
async function sendErrorToServer(entry) {
  if (!config.serverUrl) return;

  try {
    await fetch(config.serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  } catch (e) {
    // Silently fail to avoid recursive errors
    console.warn('[ErrorBoundary] Failed to send error to server:', e.message);
  }
}

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Set up global error handlers
 */
export function installGlobalHandlers() {
  // Uncaught exceptions
  window.addEventListener('error', event => {
    logError(event.error || new Error(event.message), {
      type: 'uncaught-exception',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });

    // Prevent default error handling (log it, don't crash the page)
    event.preventDefault();
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    logError(event.reason, {
      type: 'unhandled-promise-rejection'
    });

    // Prevent page crash
    event.preventDefault();
  });

  // Resource loading errors
  window.addEventListener('error', event => {
    if (event.target !== window) {
      logError(new Error('Resource loading failed: ' + (event.target?.src || event.target?.href || 'unknown')), {
        type: 'resource-error',
        target: event.target?.tagName
      });
    }
  }, true); // Use capture phase for resource errors
}

// ============================================================================
// Safe Execution
// ============================================================================

/**
 * Execute function with error handling
 * @param {Function} fn - Function to execute
 * @param {Object} [context={}] - Error context
 * @param {*} [fallback] - Fallback return value
 * @returns {*} Function result or fallback
 */
export function tryCatch(fn, context = {}, fallback = null) {
  try {
    const result = fn();
    return result;
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Execute async function with error handling
 * @param {Function} fn - Async function to execute
 * @param {Object} [context={}] - Error context
 * @param {*} [fallback] - Fallback return value
 * @returns {Promise} Result or fallback
 */
export async function tryCatchAsync(fn, context = {}, fallback = null) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Wrap a function with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} [label=''] - Function label for logging
 * @returns {Function} Wrapped function
 */
export function errorBoundary(fn, label = '') {
  return function wrapped(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      logError(error, {
        type: 'wrapped-function',
        label: label || fn.name || 'anonymous',
        args: args.length
      });
      // Gracefully continue
      return null;
    }
  };
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} [label=''] - Function label for logging
 * @returns {Function} Wrapped async function
 */
export function errorBoundaryAsync(fn, label = '') {
  return async function wrapped(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      logError(error, {
        type: 'wrapped-async-function',
        label: label || fn.name || 'anonymous',
        args: args.length
      });
      return null;
    }
  };
}

// ============================================================================
// DOM Error Handling
// ============================================================================

/**
 * Safe DOM element access
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} Element or null
 */
export function safeQuerySelector(selector) {
  try {
    return document.querySelector(selector);
  } catch (error) {
    logError(error, { type: 'query-selector', selector });
    return null;
  }
}

/**
 * Safe DOM element updates
 * @param {string} selector - CSS selector
 * @param {Function} updateFn - Function to update element
 * @returns {boolean} Success flag
 */
export function safeUpdateElement(selector, updateFn) {
  const element = safeQuerySelector(selector);
  if (!element) return false;

  try {
    updateFn(element);
    return true;
  } catch (error) {
    logError(error, { type: 'element-update', selector });
    return false;
  }
}

/**
 * Safe event listener attachment
 * @param {HTMLElement|string} target - Element or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {boolean} Success flag
 */
export function safeAddEventListener(target, event, handler) {
  try {
    const element = typeof target === 'string' ? safeQuerySelector(target) : target;
    if (!element) return false;

    element.addEventListener(event, handler);
    return true;
  } catch (error) {
    logError(error, { type: 'event-listener', event });
    return false;
  }
}

// ============================================================================
// Storage Error Handling
// ============================================================================

/**
 * Safe localStorage read
 * @param {string} key - Storage key
 * @param {*} [fallback=null] - Fallback value
 * @returns {*} Stored value or fallback
 */
export function safeGetStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (error) {
    logError(error, { type: 'storage-read', key });
    return fallback;
  }
}

/**
 * Safe localStorage write
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success flag
 */
export function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logError(error, { type: 'storage-write', key });
    return false;
  }
}

// ============================================================================
// Recovery Utilities
// ============================================================================

/**
 * Show user-friendly error message
 * @param {string} message - User message
 * @param {string} [title='Error'] - Dialog title
 */
export function showErrorMessage(message, title = 'Error') {
  if (!config.showUserMessages) return;

  const html = `
    <div role="alertdialog" aria-labelledby="error-title" class="error-boundary-dialog">
      <div class="error-boundary-content">
        <h2 id="error-title">${title}</h2>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    </div>
  `;

  const dialog = document.createElement('div');
  dialog.innerHTML = html;
  document.body.appendChild(dialog);
}

/**
 * Attempt recovery from error
 * @param {Function} recoveryFn - Recovery function
 * @returns {Promise<boolean>} Success flag
 */
export async function attemptRecovery(recoveryFn) {
  if (!config.enableRecovery) return false;

  try {
    await recoveryFn();
    return true;
  } catch (error) {
    logError(error, { type: 'recovery-failed' });
    return false;
  }
}

/**
 * Reload page with delay (for recovery)
 * @param {number} [delayMs=3000] - Delay before reload
 */
export function schedulePageReload(delayMs = 3000) {
  setTimeout(() => {
    window.location.reload();
  }, delayMs);
}

// ============================================================================
// Diagnostics
// ============================================================================

/**
 * Get all error logs
 * @returns {Array} Error log array
 */
export function getErrorLogs() {
  return [...errorLogs];
}

/**
 * Clear error logs
 */
export function clearErrorLogs() {
  errorLogs.length = 0;
}

/**
 * Export error logs as JSON
 * @returns {string} JSON string
 */
export function exportErrorLogs() {
  return JSON.stringify(errorLogs, null, 2);
}

/**
 * Get error summary
 * @returns {Object} Summary statistics
 */
export function getErrorSummary() {
  return {
    total: errorLogs.length,
    byLevel: {
      error: errorLogs.filter(e => e.level === 'error').length,
      warn: errorLogs.filter(e => e.level === 'warn').length,
      info: errorLogs.filter(e => e.level === 'info').length
    },
    recent: errorLogs.slice(-5)
  };
}

// ============================================================================
// Initialization
// ============================================================================

// Auto-install on module load
if (typeof window !== 'undefined') {
  installGlobalHandlers();
}

export default {
  logError,
  installGlobalHandlers,
  tryCatch,
  tryCatchAsync,
  errorBoundary,
  errorBoundaryAsync,
  safeQuerySelector,
  safeUpdateElement,
  safeAddEventListener,
  safeGetStorage,
  safeSetStorage,
  showErrorMessage,
  attemptRecovery,
  schedulePageReload,
  getErrorLogs,
  clearErrorLogs,
  exportErrorLogs,
  getErrorSummary
};
