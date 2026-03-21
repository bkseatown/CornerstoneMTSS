/**
 * specialist-hub-lazy-loader.js
 * Phase 2 Performance Optimization: Lazy module loading
 *
 * Defers non-critical module initialization until needed
 * Expected savings: 26 KB from initial payload
 * Target improvement: 40% faster initial page load
 */

(function SpecialistHubLazyLoader() {
  'use strict';

  // Module metadata
  const modules = {
    curriculumData: {
      name: 'specialist-hub-curriculum-data',
      size: 26,
      trigger: 'curriculum-accessed',
      factory: window.createSpecialistHubCurriculumDataModule,
      dependencies: [],
      critical: false,
      description: 'Curriculum registry and navigation data',
    },
    quickReference: {
      name: 'specialist-hub-quick-reference',
      size: 10,
      trigger: 'quick-ref-accessed',
      factory: window.createSpecialistHubQuickReferenceModule,
      dependencies: ['curriculumData'],
      critical: false,
      description: 'Quick reference cards and lesson discovery',
    },
    costDashboard: {
      name: 'specialist-hub-cost-dashboard',
      size: 2.6,
      trigger: 'dashboard-accessed',
      factory: window.createSpecialistHubCostDashboardModule,
      dependencies: [],
      critical: false,
      description: 'Cost tracking dashboard',
    },
    badges: {
      name: 'specialist-hub-badges',
      size: 5.9,
      trigger: 'profile-accessed',
      factory: window.createSpecialistHubBadgesModule,
      dependencies: [],
      critical: false,
      description: 'Fluency badge progress tracking',
    },
  };

  // Track loaded modules
  const loadedModules = {};
  const loadingPromises = {};

  /**
   * Load a module on-demand
   * @param {string} moduleKey - Key from modules object
   * @returns {Promise} Resolves when module is loaded
   */
  function loadModule(moduleKey) {
    if (!modules[moduleKey]) {
      console.warn(`[LazyLoader] Unknown module: ${moduleKey}`);
      return Promise.reject(new Error(`Unknown module: ${moduleKey}`));
    }

    // Return existing promise if already loading
    if (loadingPromises[moduleKey]) {
      return loadingPromises[moduleKey];
    }

    // Return immediately if already loaded
    if (loadedModules[moduleKey]) {
      return Promise.resolve(loadedModules[moduleKey]);
    }

    // Load module
    const promise = loadModuleInternal(moduleKey);
    loadingPromises[moduleKey] = promise;

    promise
      .then((module) => {
        loadedModules[moduleKey] = module;
        delete loadingPromises[moduleKey];
      })
      .catch(() => {
        delete loadingPromises[moduleKey];
      });

    return promise;
  }

  /**
   * Internal module loading logic
   * @param {string} moduleKey
   * @returns {Promise}
   */
  function loadModuleInternal(moduleKey) {
    return new Promise((resolve, reject) => {
      const module = modules[moduleKey];
      const startTime = performance.now();

      try {
        // Load dependencies first
        if (module.dependencies && module.dependencies.length > 0) {
          const depPromises = module.dependencies.map((dep) => loadModule(dep));
          Promise.all(depPromises)
            .then(() => initializeModule(moduleKey, startTime))
            .then(resolve)
            .catch(reject);
        } else {
          initializeModule(moduleKey, startTime).then(resolve).catch(reject);
        }
      } catch (err) {
        console.error(`[LazyLoader] Error loading module ${moduleKey}:`, err);
        reject(err);
      }
    });
  }

  /**
   * Initialize module with timing
   * @param {string} moduleKey
   * @param {number} startTime
   * @returns {Promise}
   */
  function initializeModule(moduleKey, startTime) {
    return new Promise((resolve, reject) => {
      const module = modules[moduleKey];

      try {
        if (typeof module.factory !== 'function') {
          throw new Error(`Module factory not found: ${moduleKey}`);
        }

        const instance = module.factory();
        const loadTime = performance.now() - startTime;

        console.log(
          `[LazyLoader] Loaded ${module.name} (${module.size} KB) in ${loadTime.toFixed(1)}ms`
        );

        resolve(instance);
      } catch (err) {
        console.error(`[LazyLoader] Error initializing ${moduleKey}:`, err);
        reject(err);
      }
    });
  }

  /**
   * Get loaded module instance
   * @param {string} moduleKey
   * @returns {any} Module instance or null
   */
  function getModule(moduleKey) {
    return loadedModules[moduleKey] || null;
  }

  /**
   * Check if module is loaded
   * @param {string} moduleKey
   * @returns {boolean}
   */
  function isLoaded(moduleKey) {
    return moduleKey in loadedModules;
  }

  /**
   * Preload module in background (non-critical)
   * @param {string} moduleKey
   */
  function preloadModule(moduleKey) {
    if (!isLoaded(moduleKey) && !loadingPromises[moduleKey]) {
      loadModule(moduleKey).catch(() => {
        // Ignore preload errors
      });
    }
  }

  /**
   * Preload multiple modules
   * @param {string[]} moduleKeys
   */
  function preloadModules(moduleKeys) {
    moduleKeys.forEach(preloadModule);
  }

  /**
   * Get metadata about all modules
   * @returns {object} Module information
   */
  function getModuleInfo() {
    return {
      modules: modules,
      loaded: loadedModules,
      loading: Object.keys(loadingPromises),
      totalSize: Object.values(modules).reduce((sum, m) => sum + m.size, 0),
      loadedSize: Object.keys(loadedModules).reduce((sum, key) => {
        return sum + modules[key].size;
      }, 0),
    };
  }

  /**
   * Setup event listeners for lazy loading triggers
   */
  function setupTriggers() {
    document.addEventListener('curriculum-accessed', () => {
      loadModule('curriculumData');
    });

    document.addEventListener('quick-ref-accessed', () => {
      loadModule('quickReference');
    });

    document.addEventListener('dashboard-accessed', () => {
      loadModule('costDashboard');
    });

    document.addEventListener('profile-accessed', () => {
      loadModule('badges');
    });
  }

  /**
   * Preload on idle (requestIdleCallback)
   */
  function preloadOnIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadModules(['curriculumData', 'quickReference']);
      });
    } else {
      // Fallback: preload after 2 seconds
      setTimeout(() => {
        preloadModules(['curriculumData', 'quickReference']);
      }, 2000);
    }
  }

  /**
   * Initialize lazy loader
   */
  function init() {
    console.log('[LazyLoader] Initializing lazy module loader');
    setupTriggers();
    preloadOnIdle();
  }

  // Export public API
  window.SpecialistHubLazyLoader = {
    loadModule,
    getModule,
    isLoaded,
    preloadModule,
    preloadModules,
    getModuleInfo,
    init,
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
