/**
 * Legacy Namespace Migration Layer
 *
 * Bridges old window.CS* globals to new namespace-manager system.
 * Allows gradual migration without breaking existing code.
 *
 * OLD (deprecated):
 *   window.CSEvidence.listCaseload()
 *   window.CSTeacherStorage.loadScheduleBlocks()
 *
 * NEW (preferred):
 *   namespace.getModule('evidence').listCaseload()
 *   namespace.getModule('teacher-storage').loadScheduleBlocks()
 *
 * This file maintains BOTH for backward compatibility during migration.
 *
 * @module js/legacy-namespace-migration
 */

import namespaceManager from './namespace-manager.js';

/**
 * Initialize legacy namespace migration
 * Call this on app startup to bridge old and new systems
 */
export function initializeLegacyNamespace() {
  console.log('[legacy-namespace] Initializing migration bridge');

  // Migrate existing window.CS* globals to namespace
  const legacyGlobals = [
    'CSEvidence',
    'CSTeacherStorage',
    'CSCurriculumTruth',
    'CSAvaCoach',
    'CSSupportStore',
    'CSCaseloadStore',
    'CSThemeNav',
    'CSLessonBriefPanel',
    'CSGameShell',
    'CSReadingLab',
    'CSOnboardingTour',
    'CSAuthState',
    'CSAnalytics'
  ];

  legacyGlobals.forEach(globalName => {
    if (typeof window[globalName] !== 'undefined') {
      // Convert CSEvidence -> evidence, CSTeacherStorage -> teacher-storage
      const moduleName = globalName
        .replace(/^CS/, '') // Remove CS prefix
        .replace(/([A-Z])/g, '-$1') // Add dashes before caps
        .toLowerCase()
        .replace(/^-/, ''); // Remove leading dash

      try {
        namespaceManager.registerModule(moduleName, window[globalName]);
        console.log(`[legacy-namespace] ✓ Migrated ${globalName} → namespace.getModule('${moduleName}')`);
      } catch (e) {
        console.warn(`[legacy-namespace] Failed to migrate ${globalName}:`, e.message);
      }
    }
  });

  // Create proxy layer for backward compatibility
  createProxyLayer();
}

/**
 * Create proxy objects that redirect to namespace
 * Maintains old code functionality while using new system
 */
function createProxyLayer() {
  const moduleNames = [
    'evidence',
    'teacher-storage',
    'curriculum-truth',
    'ava-coach',
    'support-store',
    'caseload-store',
    'theme-nav',
    'lesson-brief-panel',
    'game-shell',
    'reading-lab',
    'onboarding-tour',
    'auth-state',
    'analytics'
  ];

  moduleNames.forEach(name => {
    try {
      const module = namespaceManager.getModule(name);
      if (module) {
        // Module exists, ready to use via namespace
        console.log(`[legacy-namespace] Proxy ready for ${name}`);
      }
    } catch (e) {
      // Module not yet registered, will be available when loaded
      console.debug(`[legacy-namespace] Module not yet available: ${name}`);
    }
  });
}

/**
 * Get a module by old global name
 * Usage: getLegacyModule('CSEvidence') → returns evidence module
 * @param {string} globalName - Old global name (e.g., 'CSEvidence')
 * @returns {Object|null} Module or null
 */
export function getLegacyModule(globalName) {
  const moduleName = globalName
    .replace(/^CS/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  try {
    return namespaceManager.getModule(moduleName);
  } catch (e) {
    console.warn(`[legacy-namespace] Module not found: ${globalName}`);
    return window[globalName] || null; // Fallback to old global
  }
}

/**
 * Convert old code to new namespace calls
 * @param {string} oldCode - Old code using window.CS*
 * @returns {string} New code using namespace
 * @example
 * migrateCodeExample('window.CSEvidence.listCaseload()')
 * // Returns: 'namespace.getModule("evidence").listCaseload()'
 */
export function migrateCodeExample(oldCode) {
  let newCode = oldCode;

  const replacements = [
    ['window.CSEvidence', 'namespace.getModule("evidence")'],
    ['window.CSTeacherStorage', 'namespace.getModule("teacher-storage")'],
    ['window.CSCurriculumTruth', 'namespace.getModule("curriculum-truth")'],
    ['window.CSAvaCoach', 'namespace.getModule("ava-coach")'],
    ['window.CSSupportStore', 'namespace.getModule("support-store")'],
    ['window.CSCaseloadStore', 'namespace.getModule("caseload-store")'],
    ['window.CSThemeNav', 'namespace.getModule("theme-nav")'],
    ['window.CSLessonBriefPanel', 'namespace.getModule("lesson-brief-panel")'],
    ['window.CSGameShell', 'namespace.getModule("game-shell")'],
    ['window.CSReadingLab', 'namespace.getModule("reading-lab")']
  ];

  replacements.forEach(([oldPattern, newPattern]) => {
    newCode = newCode.replaceAll(oldPattern, newPattern);
  });

  return newCode;
}

/**
 * Get migration status
 * Shows which modules have been migrated
 * @returns {Object} Migration status
 */
export function getMigrationStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    legacyGlobals: [],
    migratedModules: [],
    pending: []
  };

  const legacyGlobals = [
    'CSEvidence',
    'CSTeacherStorage',
    'CSCurriculumTruth',
    'CSAvaCoach',
    'CSSupportStore',
    'CSCaseloadStore',
    'CSThemeNav',
    'CSLessonBriefPanel',
    'CSGameShell',
    'CSReadingLab',
    'CSOnboardingTour',
    'CSAuthState',
    'CSAnalytics'
  ];

  legacyGlobals.forEach(name => {
    if (typeof window[name] !== 'undefined') {
      status.legacyGlobals.push(name);

      const moduleName = name
        .replace(/^CS/, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');

      try {
        namespaceManager.getModule(moduleName);
        status.migratedModules.push({ global: name, module: moduleName });
      } catch (e) {
        status.pending.push({ global: name, module: moduleName });
      }
    }
  });

  return status;
}

/**
 * Log migration status
 */
export function logMigrationStatus() {
  const status = getMigrationStatus();
  console.group('[legacy-namespace] Migration Status');
  console.log('Legacy globals found:', status.legacyGlobals.length);
  console.log('Migrated to namespace:', status.migratedModules.length);
  console.log('Pending migration:', status.pending.length);
  console.table(status.migratedModules);
  console.groupEnd();
}

export default {
  initializeLegacyNamespace,
  getLegacyModule,
  migrateCodeExample,
  getMigrationStatus,
  logMigrationStatus
};
