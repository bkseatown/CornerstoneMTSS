/**
 * Lesson Brief Panel - Core Coordinator
 *
 * Main module that orchestrates all lesson-brief sub-modules.
 * Provides the public API: open, close, toggle, setContext
 * Coordinates state, events, rendering, and curriculum builders.
 *
 * @module js/lesson-brief/lesson-brief-core
 */

import {
  STORAGE_KEYS,
  DOM_IDS,
  SUPPORT_TYPES,
  AREAS,
  PROGRAMS,
  FUNDATIONS_LEVELS,
  JUST_WORDS_UNITS,
  HEGGERTY_ROUTINES,
  BRIDGES_COMPONENTS,
  STEP_UP_GENRES,
  STEP_UP_STAGES
} from './lesson-brief-constants.js';

import {
  loadSelection,
  saveSelection,
  getSelection,
  updateSelection,
  setContext,
  getContext,
  setStudent,
  setCaseload,
  setRoster,
  getGoogleState,
  setGoogleStatus,
  setGoogleBusy,
  getData,
  setData,
  getFishtankUnits,
  setFishtankUnits,
  getCurriculumMeta,
  setCurriculumMeta
} from './lesson-brief-state.js';

import {
  el,
  escapeHtml,
  normalizeGrade,
  formatGradeLabel,
  buildFishtankGradeLink
} from './lesson-brief-utils.js';

import {
  buildIllustrativeBrief,
  buildFishtankBrief,
  buildElBrief,
  buildUfliBrief,
  buildFundationsBrief,
  buildJustWordsBrief,
  buildHeggertybBrief,
  buildBridgesBrief,
  buildStepUpBrief,
  buildHumanitiesBrief
} from './lesson-brief-curriculum.js';

import {
  getBlocks,
  saveBlocks,
  getBlockById,
  saveDailySelection,
  loadDailySelection
} from './lesson-brief-blocks.js';

import {
  handleChange,
  handleInput,
  handleClick
} from './lesson-brief-events.js';

import {
  buildPanel,
  renderBlockList,
  renderRoster,
  renderRecents,
  renderBrief,
  updatePanelBody
} from './lesson-brief-ui.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current selected block
 * @returns {Object|null} Current block
 */
function currentBlock() {
  const blocks = getBlocks({ TeacherStorage: window.CSTeacherStorage, readStorage });
  const selection = getSelection();
  return getBlockById(blocks, selection.blockId);
}

/**
 * Get current selected student
 * @returns {Object|null} Current student
 */
function currentStudent() {
  const context = getContext();
  const selection = getSelection();
  const caseload = Array.isArray(context.caseload) ? context.caseload : [];
  return caseload.find(s => String(s.id || '') === String(selection.studentId || '')) || null;
}

/**
 * Ensure selection is valid
 * Adjusts selection based on current state
 */
function ensureSelectionValid() {
  const selection = getSelection();
  const blocks = getBlocks({ TeacherStorage: window.CSTeacherStorage, readStorage });
  const block = getBlockById(blocks, selection.blockId);

  // Validate/adjust program based on available programs
  const availablePrograms = PROGRAMS.filter(p =>
    (!selection.area || p.area === selection.area) &&
    (!selection.grade || !p.grades || p.grades.includes(selection.grade))
  );

  if (selection.programId && !availablePrograms.find(p => p.id === selection.programId)) {
    if (availablePrograms.length) {
      updateSelection({ programId: availablePrograms[0].id });
    }
  }

  saveSelection();
}

/**
 * Build complete brief based on selection
 * @returns {Object|null} Brief object or null
 */
function currentBrief() {
  const data = getData();
  if (!data) return null;

  ensureSelectionValid();
  const selection = getSelection();
  const block = currentBlock();
  const student = currentStudent();

  // Find program
  const program = PROGRAMS.find(p => p.id === selection.programId) || null;
  if (!program) return null;

  // Prepare dependencies for builders
  const deps = {
    selection,
    currentBlock: block,
    data,
    CurriculumTruth: window.CSCurriculumTruth,
    supportTypes: SUPPORT_TYPES
  };

  // Route to appropriate builder
  if (program.id === 'illustrative-math') return buildIllustrativeBrief(deps);
  if (program.id === 'fishtank-ela') {
    const unit = (data.fishtankUnits || []).find(u => u.id === selection.unitId);
    return buildFishtankBrief({ ...deps, unit, lessonNumber: selection.lesson });
  }
  if (program.id === 'el-education') {
    // Would need to find units/modules from data
    return buildElBrief({ ...deps, unit: null, module: null, grade: selection.grade });
  }
  if (program.id === 'ufli') return buildUfliBrief(deps);
  if (program.id === 'fundations') return buildFundationsBrief(deps);
  if (program.id === 'just-words') return buildJustWordsBrief(deps);
  if (program.id === 'haggerty') return buildHeggertybBrief(deps);
  if (program.id === 'bridges-math') return buildBridgesBrief(deps);
  if (program.id === 'step-up-writing') return buildStepUpBrief(deps);
  if (program.id === 'sas-humanities-9') return buildHumanitiesBrief(deps);

  return null;
}

/**
 * Load curriculum data
 * Fetches lesson-briefs.json and curriculum-extended.json
 * @returns {Promise<boolean>} Success flag
 */
function loadData() {
  return Promise.all([
    fetch('./data/lesson-briefs.json?v=20260316a').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('./data/curriculum-extended.json?v=20260316a').then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([briefData, currData]) => {
    setData(briefData || {});
    setFishtankUnits((currData && currData.fishtankUnits) || []);

    if (currData && Array.isArray(currData.curricula)) {
      const meta = {};
      currData.curricula.forEach(row => {
        meta[String(row.id || '')] = row;
      });
      setCurriculumMeta(meta);
    }

    ensureSelectionValid();
    return true;
  });
}

/**
 * Main render function
 * Updates panel body with current state
 */
function render() {
  const selection = getSelection();
  const context = getContext();
  const blocks = getBlocks({ TeacherStorage: window.CSTeacherStorage, readStorage });
  const caseload = context.caseload || [];

  let html = '<div class="cs-brief-tabs">';

  // Blocks tab
  html += '<div class="cs-brief-tab-pane">';
  html += '<h3>Today\'s Blocks</h3>';
  html += renderBlockList(blocks);
  html += '</div>';

  // Roster tab
  html += '<div class="cs-brief-tab-pane">';
  html += '<h3>Caseload</h3>';
  html += renderRoster(caseload, selection.studentId);
  html += '</div>';

  // Recents tab
  html += '<div class="cs-brief-tab-pane">';
  html += '<h3>Recent Selections</h3>';
  html += renderRecents(loadRecents());
  html += '</div>';

  // Brief tab
  html += '<div class="cs-brief-tab-pane">';
  const brief = currentBrief();
  html += renderBrief(brief, {
    noteForKey: (b) => getNoteForKey(noteKeyForBrief(b)),
    getNoteMap: getNoteMap
  });
  html += '</div>';

  html += '</div>';

  updatePanelBody(html);
}

// ============================================================================
// Note Management
// ============================================================================

/**
 * Get notes map from storage
 * @returns {Object} Notes keyed by brief key
 */
function getNoteMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Get key for note storage
 * @param {Object} brief - Brief object
 * @returns {string} Note key
 */
function noteKeyForBrief(brief) {
  const selection = getSelection();
  return [brief.key, selection.blockId || 'no-block', selection.studentId || 'no-student'].join(':');
}

/**
 * Get note for brief
 * @param {string} key - Note key
 * @returns {string} Note text
 */
function getNoteForKey(key) {
  const map = getNoteMap();
  return map && map[key] ? String(map[key]) : '';
}

/**
 * Get recents from storage
 * @returns {Array} Recent selections
 */
function loadRecents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================================================
// Helper Stubs
// ============================================================================

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write storage:', key, e);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Open the lesson brief panel
 * @param {Object} context - Optional context {caseload, roster, studentId, blockId, etc}
 */
export function open(context) {
  buildPanel({
    PANEL_ID: DOM_IDS.PANEL,
    OVERLAY_ID: DOM_IDS.OVERLAY,
    BODY_ID: DOM_IDS.BODY,
    close,
    handleClick,
    handleChange,
    handleInput
  });

  // Apply context if provided
  if (context) {
    setContext(context);
  }

  // Load data if needed
  const data = getData();
  if (!data) {
    loadData().then(() => {
      ensureSelectionValid();
      render();
      show();
    });
  } else {
    ensureSelectionValid();
    render();
    show();
  }
}

/**
 * Close the lesson brief panel
 */
export function close() {
  hide();
}

/**
 * Toggle panel visibility
 */
export function toggle() {
  const panel = el(DOM_IDS.PANEL);
  if (panel && panel.style.display === 'none') {
    open();
  } else {
    close();
  }
}

/**
 * Set context (caseload, roster, student, etc)
 * @param {Object} context - Context object
 */
export function setContextData(context) {
  if (!context) return;

  if (Array.isArray(context.caseload)) setCaseload(context.caseload);
  if (Array.isArray(context.roster)) setRoster(context.roster);
  if (context.studentId) setStudent(context.studentId, context.studentName);

  setContext(context);
  ensureSelectionValid();
}

// ============================================================================
// Internal Helpers
// ============================================================================

function show() {
  const panel = el(DOM_IDS.PANEL);
  if (panel) panel.style.display = 'block';

  const overlay = el(DOM_IDS.OVERLAY);
  if (overlay) overlay.style.display = 'block';
}

function hide() {
  const panel = el(DOM_IDS.PANEL);
  if (panel) panel.style.display = 'none';

  const overlay = el(DOM_IDS.OVERLAY);
  if (overlay) overlay.style.display = 'none';
}

export default {
  open,
  close,
  toggle,
  setContextData
};
