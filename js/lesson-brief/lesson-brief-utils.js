/**
 * Lesson Brief Panel - Utility Functions
 *
 * Extracted from lesson-brief-panel.js to improve maintainability.
 * Contains DOM helpers, formatting functions, and integration utilities.
 *
 * @module js/lesson-brief/lesson-brief-utils
 */

// ============================================================================
// DOM Helpers
// ============================================================================

/**
 * Get DOM element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} DOM element or null
 */
export function el(id) {
  return document.getElementById(id);
}

/**
 * Escape HTML special characters
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
export function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}

/**
 * Clear element's children
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

/**
 * Set element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} visible - Visibility flag
 */
export function setVisible(element, visible) {
  if (element) {
    element.style.display = visible ? '' : 'none';
  }
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Pad number to 2 digits
 * @param {number} value - Value to pad
 * @returns {string} Padded string
 */
export function pad2(value) {
  return String(value || 0).padStart(2, '0');
}

/**
 * Get today's date stamp (YYYY-MM-DD)
 * @returns {string} Date stamp
 */
export function todayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/**
 * Normalize grade string
 * @param {string} raw - Raw grade input
 * @returns {string} Normalized grade
 */
export function normalizeGrade(raw) {
  const text = String(raw || '').trim().toLowerCase();
  if (text.match(/^k|kindergarten/)) return 'K';
  const match = text.match(/(\d+)/);
  return match ? String(parseInt(match[1], 10)) : '';
}

/**
 * Format grade label
 * @param {string} grade - Grade code
 * @returns {string} Formatted label
 */
export function formatGradeLabel(grade) {
  if (!grade) return '';
  if (grade === 'K') return 'Kindergarten';
  const num = parseInt(grade, 10);
  if (num === 1) return '1st Grade';
  if (num === 2) return '2nd Grade';
  if (num === 3) return '3rd Grade';
  return num + 'th Grade';
}

/**
 * Generate range of grades
 * @returns {Array} Array of grade objects
 */
export function rangeGrades() {
  const grades = [
    { id: 'K', label: 'Kindergarten' },
    { id: '1', label: '1st Grade' },
    { id: '2', label: '2nd Grade' },
    { id: '3', label: '3rd Grade' },
    { id: '4', label: '4th Grade' },
    { id: '5', label: '5th Grade' },
    { id: '6', label: '6th Grade' }
  ];
  return grades;
}

// ============================================================================
// Curriculum Integration
// ============================================================================

/**
 * Get Fishtank curriculum link for grade
 * @param {Object} unit - Unit object
 * @returns {string} Fishtank URL
 */
export function buildFishtankGradeLink(unit) {
  const gradeSlug = String(unit && unit.gradeSlug || '').trim();
  if (!gradeSlug) return 'https://www.fishtanklearning.org/curriculum/ela/';
  return 'https://www.fishtanklearning.org/curriculum/ela/' + gradeSlug + '/';
}

/**
 * Get EL Education curriculum links
 * @param {string} grade - Grade
 * @param {Object} module - Module object
 * @param {Object} unit - Unit object
 * @returns {Object} Links object {moduleHref, unitHref}
 */
export function buildElModuleLinks(grade, module, unit) {
  const gradeText = String(grade || '').trim();
  const moduleId = String(module && module.id || '').trim();
  const unitId = String(unit && unit.id || '').trim();
  const gradeNum = gradeText.replace(/[^\d]/g, '');
  const moduleNumMatch = moduleId.match(/m(\d+)/i);
  const unitNumMatch = unitId.match(/u(\d+)/i);

  if (!gradeNum || !moduleNumMatch) {
    return {
      moduleHref: 'https://curriculum.eleducation.org/',
      unitHref: 'https://curriculum.eleducation.org/'
    };
  }

  const moduleHref = 'https://curriculum.eleducation.org/curriculum/ela/2019/grade-' +
    gradeNum + '/module-' + moduleNumMatch[1];

  return {
    moduleHref: moduleHref,
    unitHref: unitNumMatch ? (moduleHref + '/unit-' + unitNumMatch[1]) : moduleHref
  };
}

// ============================================================================
// Program Utilities
// ============================================================================

/**
 * Find program by ID
 * @param {Array} programs - Programs array
 * @param {string} programId - Program ID
 * @returns {Object|null} Program object or null
 */
export function findProgram(programs, programId) {
  return programs.find(p => p.id === programId) || null;
}

/**
 * Check if program supports grade
 * @param {Object} program - Program object
 * @param {string} grade - Grade code
 * @returns {boolean} True if grade is supported
 */
export function programSupportsGrade(program, grade) {
  if (!program || !program.grades) return true; // Default: all grades supported
  return program.grades.includes(String(grade || ''));
}

/**
 * Get programs for area
 * @param {Array} programs - All programs
 * @param {string} areaId - Area ID
 * @returns {Array} Filtered programs
 */
export function getProgramsByArea(programs, areaId) {
  return programs.filter(p => p.area === areaId);
}

// ============================================================================
// Logging & Debugging
// ============================================================================

/**
 * Format value for logging
 * @param {*} value - Value to format
 * @returns {string} Formatted string
 */
export function formatForLog(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Log with prefix
 * @param {string} prefix - Log prefix
 * @param {*} message - Message
 * @param {*} [data] - Optional data
 */
export function logPrefixed(prefix, message, data) {
  const msg = '[' + prefix + '] ' + message;
  if (data !== undefined) {
    console.log(msg, data);
  } else {
    console.log(msg);
  }
}

/**
 * Log warning with prefix
 * @param {string} prefix - Log prefix
 * @param {*} message - Message
 * @param {*} [data] - Optional data
 */
export function warnPrefixed(prefix, message, data) {
  const msg = '[' + prefix + '] ' + message;
  if (data !== undefined) {
    console.warn(msg, data);
  } else {
    console.warn(msg);
  }
}
