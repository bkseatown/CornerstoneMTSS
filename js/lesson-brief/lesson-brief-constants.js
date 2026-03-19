/**
 * Lesson Brief Panel - Constants and Lookup Tables
 *
 * Extracted from lesson-brief-panel.js to improve maintainability
 * Contains all static configuration, lookup tables, and constants.
 *
 * @module js/lesson-brief/lesson-brief-constants
 */

// Storage Keys
export const STORAGE_KEYS = {
  RECENTS: 'cs.lessonBrief.recents.v1',
  SELECTION: 'cs.lessonBrief.selection.v2',
  DAILY: 'cs.lessonBrief.daily.v2',
  NOTES: 'cs.lessonBrief.notes.v2'
};

// DOM Element IDs
export const DOM_IDS = {
  PANEL: 'cs-brief-panel',
  OVERLAY: 'cs-brief-overlay',
  BODY: 'cs-brief-body'
};

// Support/Delivery Types
export const SUPPORT_TYPES = [
  { id: 'push-in', label: 'Push-in class support' },
  { id: 'pullout', label: 'Tier 2 / Tier 3 pullout' },
  { id: 'planning', label: 'Planning preview' }
];

// Content Areas
export const AREAS = [
  { id: 'ela', label: 'Core ELA' },
  { id: 'intervention', label: 'Literacy intervention' },
  { id: 'math', label: 'Math' },
  { id: 'writing', label: 'Writing' },
  { id: 'humanities', label: 'Humanities' }
];

// Curriculum Programs
export const PROGRAMS = [
  { id: 'wq', label: 'Word Quest', area: 'ela' },
  { id: 'rq', label: 'Reading Lab', area: 'ela' },
  { id: 'wwr', label: 'Words Their Way', area: 'ela' },
  { id: 'lw', label: 'Letterland', area: 'ela' },
  { id: 'fundations', label: 'Wilson Fundations', area: 'ela' },
  { id: 'justwords', label: 'Just Words', area: 'ela' },
  { id: 'heggerty', label: 'Heggerty Phonemic Awareness', area: 'ela' },
  { id: 'bridges', label: 'Wilson Bridge', area: 'ela' },
  { id: 'step-up', label: 'Fountas & Pinnell Step Up', area: 'ela' },
  { id: 'manual', label: 'Manual Block', area: 'ela' }
];

// Fundations Levels
export const FUNDATIONS_LEVELS = [
  { id: 'lk', label: 'Level K' },
  { id: 'l1', label: 'Level 1' },
  { id: 'l2', label: 'Level 2' }
];

// Just Words Units
export const JUST_WORDS_UNITS = [
  { id: 'jw-u1', label: 'Unit 1: Closed Syllables' }
];

// Heggerty Phonemic Awareness Routines
export const HEGGERTY_ROUTINES = [
  { id: 'heggerty-k', label: 'Kindergarten Routine' },
  { id: 'heggerty-1', label: 'Grade 1 Routine' }
];

// Wilson Bridge Components
export const BRIDGES_COMPONENTS = [
  { id: 'bridges-word', label: 'Word Work' },
  { id: 'bridges-fluency', label: 'Fluency' },
  { id: 'bridges-writing', label: 'Writing' },
  { id: 'bridges-reading', label: 'Reading' }
];

// Step Up Genres
export const STEP_UP_GENRES = [
  { id: 'step-up-narrative', label: 'Narrative' },
  { id: 'step-up-expository', label: 'Expository' },
  { id: 'step-up-poetry', label: 'Poetry' }
];

// Step Up Stages
export const STEP_UP_STAGES = [
  { id: 'step-up-baseline', label: 'Baseline Level' },
  { id: 'step-up-proficiency', label: 'Proficiency Level' },
  { id: 'step-up-advanced', label: 'Advanced Level' }
];

/**
 * Get a lookup table by ID
 * @param {string} listId - List identifier
 * @returns {Array} Lookup table array
 */
export function getLookupTable(listId) {
  const tables = {
    supportTypes: SUPPORT_TYPES,
    areas: AREAS,
    programs: PROGRAMS,
    fundationsLevels: FUNDATIONS_LEVELS,
    justWordsUnits: JUST_WORDS_UNITS,
    heggertainRoutines: HEGGERTY_ROUTINES,
    bridgesComponents: BRIDGES_COMPONENTS,
    stepUpGenres: STEP_UP_GENRES,
    stepUpStages: STEP_UP_STAGES
  };

  return tables[listId] || [];
}

/**
 * Get label for a value in a lookup table
 * @param {Array} table - Lookup table
 * @param {string} id - Item ID
 * @param {string} [defaultLabel=''] - Default if not found
 * @returns {string} Item label
 */
export function getLabelFor(table, id, defaultLabel = '') {
  const item = table.find(t => t.id === id);
  return item ? item.label : defaultLabel;
}

/**
 * Find item in table by ID
 * @param {Array} table - Lookup table
 * @param {string} id - Item ID
 * @returns {Object|null} Item object or null
 */
export function findInTable(table, id) {
  return table.find(t => t.id === id) || null;
}
