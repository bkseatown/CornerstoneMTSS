/**
 * Lesson Brief Panel - State Management
 *
 * Extracted from lesson-brief-panel.js to improve maintainability.
 * Manages selection persistence, context tracking, and Google integration state.
 *
 * @module js/lesson-brief/lesson-brief-state
 */

import { STORAGE_KEYS } from './lesson-brief-constants.js';

// ============================================================================
// Internal State
// ============================================================================

let _selection = loadSelection();
let _context = {
  caseload: [],
  roster: [],
  studentId: '',
  studentName: '',
  grade: ''
};
let _googleState = {
  status: '',
  busy: false,
  driveResults: [],
  youtubeResults: [],
  lastCreated: null
};
let _data = null;
let _fishtankUnits = [];
let _curriculumMeta = {};
let _loadPromise = null;

// ============================================================================
// Selection (Persisted)
// ============================================================================

/**
 * Get default selection structure
 * @returns {Object} Default selection object
 */
function getDefaultSelection() {
  return {
    programId: '',
    grade: '',
    blockTime: '',
    blockDate: '',
    supportType: '',
    area: '',
    rosterCandidateId: '',
    blockTitle: '',
    students: [],
    fundationsLevel: '',
    justWordsUnit: '',
    heggertainRoutine: '',
    bridgesComponent: '',
    stepUpGenre: '',
    stepUpStage: '',
    notes: ''
  };
}

/**
 * Load selection from storage
 * @returns {Object} Selection object
 */
export function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTION);
    if (!raw) return getDefaultSelection();

    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' ? { ...getDefaultSelection(), ...parsed } : getDefaultSelection();
  } catch (e) {
    console.warn('[lesson-brief-state] Failed to load selection:', e);
    return getDefaultSelection();
  }
}

/**
 * Save selection to storage
 */
export function saveSelection() {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTION, JSON.stringify(_selection));
  } catch (e) {
    console.error('[lesson-brief-state] Failed to save selection:', e);
  }
}

/**
 * Get current selection
 * @returns {Object} Current selection
 */
export function getSelection() {
  return { ..._selection };
}

/**
 * Update selection with partial object
 * @param {Object} patch - Partial selection object
 */
export function updateSelection(patch) {
  _selection = { ..._selection, ...patch };
  saveSelection();
}

/**
 * Clear selection to defaults
 */
export function clearSelection() {
  _selection = getDefaultSelection();
  saveSelection();
}

/**
 * Merge selection with defaults
 * @param {Object} base - Base selection
 * @param {Object} patch - Patch to merge
 * @returns {Object} Merged selection
 */
export function mergeSelection(base, patch) {
  const defaults = getDefaultSelection();
  return { ...defaults, ...base, ...patch };
}

// ============================================================================
// Context (Session)
// ============================================================================

/**
 * Get current context (caseload, roster, student)
 * @returns {Object} Context object
 */
export function getContext() {
  return { ..._context };
}

/**
 * Set context
 * @param {Object} ctx - Context object
 */
export function setContext(ctx) {
  if (typeof ctx === 'object' && ctx !== null) {
    _context = { ..._context, ...ctx };
  }
}

/**
 * Set student in context
 * @param {string} studentId - Student ID
 * @param {string} [studentName=''] - Student name
 */
export function setStudent(studentId, studentName = '') {
  _context.studentId = studentId;
  _context.studentName = studentName;
}

/**
 * Set caseload
 * @param {Array} students - Student array
 */
export function setCaseload(students) {
  _context.caseload = Array.isArray(students) ? students : [];
}

/**
 * Set roster
 * @param {Array} students - Student array
 */
export function setRoster(students) {
  _context.roster = Array.isArray(students) ? students : [];
}

// ============================================================================
// Google Integration State
// ============================================================================

/**
 * Get Google integration state
 * @returns {Object} Google state
 */
export function getGoogleState() {
  return { ..._googleState };
}

/**
 * Set Google status message
 * @param {string} message - Status message
 */
export function setGoogleStatus(message) {
  _googleState.status = String(message || '');
}

/**
 * Set Google busy state
 * @param {boolean} busy - Busy flag
 */
export function setGoogleBusy(busy) {
  _googleState.busy = Boolean(busy);
}

/**
 * Set Google Drive results
 * @param {Array} results - Search results
 */
export function setGoogleDriveResults(results) {
  _googleState.driveResults = Array.isArray(results) ? results : [];
}

/**
 * Set Google YouTube results
 * @param {Array} results - Search results
 */
export function setGoogleYouTubeResults(results) {
  _googleState.youtubeResults = Array.isArray(results) ? results : [];
}

/**
 * Set last created file (for Google Drive)
 * @param {Object} file - File object
 */
export function setLastCreatedFile(file) {
  _googleState.lastCreated = file || null;
}

/**
 * Clear Google state
 */
export function clearGoogleState() {
  _googleState = {
    status: '',
    busy: false,
    driveResults: [],
    youtubeResults: [],
    lastCreated: null
  };
}

// ============================================================================
// Curriculum/Fishtank Data
// ============================================================================

/**
 * Get curriculum data
 * @returns {*} Curriculum data
 */
export function getData() {
  return _data;
}

/**
 * Set curriculum data
 * @param {*} data - Data to set
 */
export function setData(data) {
  _data = data;
}

/**
 * Get Fishtank units
 * @returns {Array} Fishtank units
 */
export function getFishtankUnits() {
  return [..._fishtankUnits];
}

/**
 * Set Fishtank units
 * @param {Array} units - Units array
 */
export function setFishtankUnits(units) {
  _fishtankUnits = Array.isArray(units) ? units : [];
}

/**
 * Get curriculum metadata
 * @returns {Object} Metadata
 */
export function getCurriculumMeta() {
  return { ..._curriculumMeta };
}

/**
 * Set curriculum metadata
 * @param {Object} meta - Metadata
 */
export function setCurriculumMeta(meta) {
  _curriculumMeta = typeof meta === 'object' ? { ..._curriculumMeta, ...meta } : {};
}

/**
 * Get/set load promise for async operations
 * @param {Promise} [promise] - Promise to set
 * @returns {Promise|null} Current promise
 */
export function loadPromise(promise) {
  if (promise instanceof Promise) {
    _loadPromise = promise;
    return _loadPromise;
  }
  return _loadPromise;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safe JSON parse with fallback
 * @param {string} raw - JSON string
 * @param {*} [fallback=null] - Fallback if parse fails
 * @returns {*} Parsed object or fallback
 */
export function safeJsonParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * Read from localStorage with fallback
 * @param {string} key - Storage key
 * @param {*} [fallback=null] - Fallback value
 * @returns {*} Stored value or fallback
 */
export function readStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return safeJsonParse(raw, fallback);
  } catch (e) {
    return fallback;
  }
}

/**
 * Write to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[lesson-brief-state] Failed to write storage:', key, e);
  }
}
