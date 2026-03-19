/**
 * Global Namespace Manager
 *
 * Manages and reduces global namespace pollution.
 * Provides a controlled interface for cross-module communication.
 *
 * Instead of:
 *   window.CSEvidence = { ... }
 *   window.WQGame = { ... }
 *
 * Use:
 *   registerModule('evidence', { ... })
 *   getModule('evidence')
 *
 * @module js/namespace-manager
 */

const NAMESPACE = 'Cornerstone';
const modules = new Map();
const events = new Map();

/**
 * Initialize the global namespace (called once on app startup)
 * @param {string} [namespaceName='Cornerstone'] - Global namespace name
 */
export function initializeNamespace(namespaceName = NAMESPACE) {
  if (!window[namespaceName]) {
    window[namespaceName] = {
      modules: {},
      events: {},
      version: '2.0.0'
    };
  }
  return window[namespaceName];
}

/**
 * Register a module in the namespace
 * @param {string} name - Module name
 * @param {Object} moduleExports - Module exports object
 * @throws {Error} If module already registered
 */
export function registerModule(name, moduleExports) {
  if (modules.has(name)) {
    throw new Error(`Module "${name}" is already registered`);
  }

  if (typeof moduleExports !== 'object' || moduleExports === null) {
    throw new Error(`Module "${name}" must export an object`);
  }

  modules.set(name, moduleExports);

  // Also register on window for legacy access
  const ns = initializeNamespace();
  ns.modules[name] = moduleExports;

  // Create legacy global (deprecated but supported)
  const legacyName = createLegacyName(name);
  if (typeof window[legacyName] === 'undefined') {
    window[legacyName] = moduleExports;
  }

  console.log(`[namespace] Registered module: ${name}`);
}

/**
 * Get a registered module
 * @param {string} name - Module name
 * @returns {Object} Module exports
 * @throws {Error} If module not found
 */
export function getModule(name) {
  if (!modules.has(name)) {
    throw new Error(`Module "${name}" not found`);
  }
  return modules.get(name);
}

/**
 * Check if module is registered
 * @param {string} name - Module name
 * @returns {boolean} True if registered
 */
export function hasModule(name) {
  return modules.has(name);
}

/**
 * Unregister a module (for testing/cleanup)
 * @param {string} name - Module name
 */
export function unregisterModule(name) {
  modules.delete(name);
  const ns = initializeNamespace();
  delete ns.modules[name];
}

// ============================================================================
// Event Bus
// ============================================================================

/**
 * Register event listener
 * @param {string} eventName - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Unsubscribe function
 */
export function on(eventName, handler) {
  if (!events.has(eventName)) {
    events.set(eventName, []);
  }

  const handlers = events.get(eventName);
  handlers.push(handler);

  // Return unsubscribe function
  return () => {
    const index = handlers.indexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  };
}

/**
 * Unregister event listener
 * @param {string} eventName - Event name
 * @param {Function} handler - Event handler
 */
export function off(eventName, handler) {
  if (!events.has(eventName)) return;

  const handlers = events.get(eventName);
  const index = handlers.indexOf(handler);
  if (index >= 0) {
    handlers.splice(index, 1);
  }
}

/**
 * Emit event
 * @param {string} eventName - Event name
 * @param {*} data - Event data
 */
export function emit(eventName, data) {
  if (!events.has(eventName)) return;

  const handlers = events.get(eventName);
  handlers.forEach(handler => {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in event handler for "${eventName}":`, error);
    }
  });
}

/**
 * Register one-time event listener
 * @param {string} eventName - Event name
 * @param {Function} handler - Event handler
 */
export function once(eventName, handler) {
  const unsubscribe = on(eventName, (data) => {
    unsubscribe();
    handler(data);
  });

  return unsubscribe;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create legacy global name from module name
 * @param {string} moduleName - Module name
 * @returns {string} Legacy global name
 * @private
 */
function createLegacyName(moduleName) {
  // evidence -> CSEvidence
  // game -> WQGame
  // etc.
  const parts = moduleName.split('-');
  return 'CS' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

/**
 * Get all registered modules
 * @returns {Object} Map of module names to exports
 */
export function getAllModules() {
  const result = {};
  modules.forEach((exports, name) => {
    result[name] = exports;
  });
  return result;
}

/**
 * Get all event listeners
 * @returns {Object} Map of event names to handler counts
 */
export function getAllListeners() {
  const result = {};
  events.forEach((handlers, name) => {
    result[name] = handlers.length;
  });
  return result;
}

/**
 * Clear all registered modules and events (for testing)
 */
export function clearNamespace() {
  modules.clear();
  events.clear();
}

/**
 * Get namespace statistics
 * @returns {Object} Statistics object
 */
export function getStats() {
  return {
    modulesRegistered: modules.size,
    eventsRegistered: events.size,
    totalListeners: Array.from(events.values()).reduce((sum, h) => sum + h.length, 0),
    modules: Array.from(modules.keys()),
    events: Array.from(events.keys())
  };
}

/**
 * Log namespace state (for debugging)
 */
export function logState() {
  const stats = getStats();
  console.group('[namespace] State');
  console.log('Modules:', stats.modules);
  console.log('Events:', stats.events);
  console.log('Stats:', stats);
  console.groupEnd();
}

// ============================================================================
// Legacy Support
// ============================================================================

/**
 * Migrate legacy global to namespace
 * @deprecated Use registerModule instead
 * @param {string} legacyName - Old global variable name
 * @param {string} newName - New module name
 */
export function migrateLegacyGlobal(legacyName, newName) {
  if (typeof window[legacyName] !== 'undefined') {
    registerModule(newName, window[legacyName]);
    console.warn(`[namespace] Migrated ${legacyName} -> ${newName}`);
  }
}

// ============================================================================
// Initialization
// ============================================================================

// Auto-initialize namespace on module load
if (typeof window !== 'undefined') {
  initializeNamespace();
  console.log('[namespace] Initialized');
}

export default {
  initializeNamespace,
  registerModule,
  getModule,
  hasModule,
  unregisterModule,
  on,
  off,
  emit,
  once,
  getAllModules,
  getAllListeners,
  clearNamespace,
  getStats,
  logState,
  migrateLegacyGlobal
};
