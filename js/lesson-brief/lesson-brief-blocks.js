/**
 * Lesson Brief Panel - Block Management
 *
 * Manages schedule blocks (class periods) and student assignment.
 * Handles CRUD operations for instructional blocks.
 *
 * @module js/lesson-brief/lesson-brief-blocks
 */

/**
 * Normalize block data structure
 * Ensures consistent block object shape across different sources
 * @param {Object} block - Raw block data
 * @param {Object} deps - Dependencies {TeacherStorage, programById}
 * @returns {Object} Normalized block
 * @private
 */
function normalizeBlock(block, deps) {
  const { TeacherStorage, programById } = deps;

  const profile = TeacherStorage && typeof TeacherStorage.loadTeacherProfile === 'function'
    ? TeacherStorage.loadTeacherProfile()
    : { name: '' };

  const area = inferAreaFromBlock(block);
  const programId = String(block && block.programId || '');
  const program = programById(programId);

  return {
    id: String(block && block.id || 'blk-' + Date.now()),
    label: String(block && block.label || '').trim(),
    timeLabel: String(block && block.timeLabel || '').trim(),
    supportType: String(block && block.supportType || 'push-in'),
    area: area || 'ela',
    programId: programId,
    subject: String(block && block.subject || block && block.area || area || 'ela').trim(),
    teacher: String(block && block.teacher || profile.name || '').trim(),
    curriculum: String(block && block.curriculum || program && program.label || '').trim(),
    lesson: String(block && block.lesson || '').trim(),
    classSection: String(block && block.classSection || block && block.label || '').trim(),
    notes: String(block && block.notes || '').trim(),
    studentIds: [],
    rosterRefs: []
  };
}

/**
 * Infer area from block data
 * Guesses content area from block properties
 * @param {Object} block - Block data
 * @returns {string} Area code (ela, math, writing, etc)
 * @private
 */
function inferAreaFromBlock(block) {
  const explicit = String(block && block.area || '').trim();
  if (explicit) return explicit;

  const subject = String(block && block.subject || '').trim();
  const curriculum = String(block && block.curriculum || '').trim();
  const classSection = String(block && block.classSection || '').trim();
  const label = String(block && block.label || '').trim();

  const text = [subject, curriculum, classSection, label].join(' ').toLowerCase();

  if (text.indexOf('math') >= 0 || text.indexOf('bridges') >= 0 || text.indexOf('numeracy') >= 0) return 'math';
  if (text.indexOf('writing') >= 0 || text.indexOf('step up') >= 0) return 'writing';
  if (text.indexOf('humanities') >= 0 || text.indexOf('history') >= 0) return 'humanities';
  if (text.indexOf('fundations') >= 0 || text.indexOf('just words') >= 0 || text.indexOf('ufli') >= 0
    || text.indexOf('heggerty') >= 0 || text.indexOf('pullout') >= 0 || text.indexOf('intervention') >= 0) {
    return 'intervention';
  }

  return 'ela';
}

// ============================================================================
// Block Loading & Saving
// ============================================================================

/**
 * Get all blocks for today
 * @param {Object} deps - Dependencies {TeacherStorage, readStorage, todayStamp, normalizeBlock}
 * @returns {Array} Array of block objects
 */
export function getBlocks(deps) {
  const { TeacherStorage, readStorage, todayStamp } = deps;

  if (TeacherStorage && typeof TeacherStorage.loadScheduleBlocks === 'function') {
    const blocks = TeacherStorage.loadScheduleBlocks(todayStamp());
    return Array.isArray(blocks) ? blocks.map(b => normalizeBlock(b, deps)) : [];
  }

  const legacyMap = readStorage('cs.lessonBrief.blocks.v1', {});
  const rows = legacyMap && Array.isArray(legacyMap[todayStamp()]) ? legacyMap[todayStamp()] : [];
  return rows.map(b => normalizeBlock(b, deps));
}

/**
 * Save blocks for today
 * @param {Array} rows - Block objects to save
 * @param {Object} deps - Dependencies {TeacherStorage, writeStorage, todayStamp, normalizeBlock}
 */
export function saveBlocks(rows, deps) {
  const { TeacherStorage, writeStorage, todayStamp } = deps;

  const normalized = Array.isArray(rows) ? rows.map(b => normalizeBlock(b, deps)) : [];

  if (TeacherStorage && typeof TeacherStorage.saveScheduleBlocks === 'function') {
    TeacherStorage.saveScheduleBlocks(todayStamp(), normalized);
    return;
  }

  const legacyMap = readStorage('cs.lessonBrief.blocks.v1', {});
  legacyMap[todayStamp()] = normalized;
  writeStorage('cs.lessonBrief.blocks.v1', legacyMap);
}

// ============================================================================
// Block Operations
// ============================================================================

/**
 * Get current selected block
 * @param {Array} blocks - All blocks
 * @param {string} blockId - Selected block ID
 * @returns {Object|null} Block object or null
 */
export function getBlockById(blocks, blockId) {
  if (!blocks || !blockId) return null;
  return blocks.find(b => b.id === blockId) || null;
}

/**
 * Create a new block
 * @param {Object} data - Block data
 * @param {Object} deps - Dependencies {normalizeBlock, programById, TeacherStorage, readStorage}
 * @returns {Object} New normalized block
 */
export function createBlock(data, deps) {
  const block = {
    ...data,
    id: data.id || 'blk-' + Date.now(),
    studentIds: data.studentIds || []
  };

  return normalizeBlock(block, deps);
}

/**
 * Update an existing block
 * @param {Object} block - Block to update
 * @param {Object} patch - Properties to update
 * @param {Object} deps - Dependencies
 * @returns {Object} Updated block
 */
export function updateBlock(block, patch, deps) {
  const updated = { ...block, ...patch };
  return normalizeBlock(updated, deps);
}

/**
 * Delete a block
 * @param {Array} blocks - All blocks
 * @param {string} blockId - Block to delete
 * @returns {Array} Blocks with target removed
 */
export function deleteBlock(blocks, blockId) {
  return blocks.filter(b => b.id !== blockId);
}

// ============================================================================
// Student Assignment
// ============================================================================

/**
 * Add student to block
 * @param {Object} block - Block to update
 * @param {string} studentId - Student ID to add
 * @returns {Object} Updated block
 */
export function addStudentToBlock(block, studentId) {
  if (!block || !studentId) return block;

  const updated = { ...block };
  if (!Array.isArray(updated.studentIds)) updated.studentIds = [];

  if (updated.studentIds.indexOf(studentId) < 0) {
    updated.studentIds.push(studentId);
  }

  return updated;
}

/**
 * Remove student from block
 * @param {Object} block - Block to update
 * @param {string} studentId - Student ID to remove
 * @returns {Object} Updated block
 */
export function removeStudentFromBlock(block, studentId) {
  if (!block || !studentId) return block;

  const updated = { ...block };
  if (Array.isArray(updated.studentIds)) {
    updated.studentIds = updated.studentIds.filter(id => id !== studentId);
  }

  return updated;
}

/**
 * Get students in block
 * @param {Object} block - Block
 * @param {Array} caseload - All students
 * @returns {Array} Students in this block
 */
export function getBlockStudents(block, caseload) {
  if (!block || !caseload) return [];

  const ids = Array.isArray(block.studentIds) ? block.studentIds : [];
  return caseload.filter(student => ids.indexOf(String(student.id || '')) >= 0);
}

// ============================================================================
// Block Import/Merge
// ============================================================================

/**
 * Merge imported blocks with existing blocks
 * Updates existing blocks by time/label, adds new ones
 * @param {Array} existing - Existing blocks
 * @param {Array} imported - Imported blocks
 * @param {Object} deps - Dependencies
 * @returns {Array} Merged blocks
 */
export function mergeBlocks(existing, imported, deps) {
  const byKey = {};

  // Index existing blocks by time + label
  (existing || []).forEach(row => {
    const block = normalizeBlock(row, deps);
    const key = (block.timeLabel + '|' + block.label).toLowerCase();
    byKey[key] = block;
  });

  // Merge imported blocks
  (imported || []).forEach(row => {
    const block = normalizeBlock(row, deps);
    const key = (block.timeLabel + '|' + block.label).toLowerCase();

    if (byKey[key]) {
      // Update existing
      byKey[key].timeLabel = block.timeLabel;
      byKey[key].label = block.label;
      byKey[key].supportType = block.supportType;
      byKey[key].area = block.area;
      byKey[key].programId = block.programId;
    } else {
      // Add new
      byKey[key] = block;
    }
  });

  return Object.values(byKey);
}

// ============================================================================
// Block Validation
// ============================================================================

/**
 * Validate block has required fields
 * @param {Object} block - Block to validate
 * @returns {boolean} True if valid
 */
export function isValidBlock(block) {
  return !!(
    block &&
    block.id &&
    block.label &&
    block.timeLabel
  );
}

/**
 * Get block errors
 * @param {Object} block - Block to check
 * @returns {Array} Error messages
 */
export function getBlockErrors(block) {
  const errors = [];

  if (!block) {
    errors.push('Block is required');
    return errors;
  }

  if (!block.id) errors.push('Block ID is required');
  if (!block.label) errors.push('Block label is required');
  if (!block.timeLabel) errors.push('Block time is required');

  return errors;
}

// ============================================================================
// Daily Selection Persistence
// ============================================================================

/**
 * Save daily selection (per block/student)
 * @param {string} studentId - Student ID
 * @param {string} blockId - Block ID
 * @param {Object} selection - Selection to save
 * @param {Object} deps - Dependencies {writeStorage, readStorage, todayStamp}
 */
export function saveDailySelection(studentId, blockId, selection, deps) {
  const { writeStorage, readStorage, todayStamp } = deps;

  if (!studentId) return;

  const map = readStorage('cs.lessonBrief.daily.v2', {});
  const key = [todayStamp(), blockId || 'no-block', studentId].join(':');

  map[key] = selection;
  writeStorage('cs.lessonBrief.daily.v2', map);
}

/**
 * Load daily selection (per block/student)
 * @param {string} studentId - Student ID
 * @param {string} blockId - Block ID
 * @param {Object} deps - Dependencies {readStorage, todayStamp, mergeSelection, defaultSelection}
 * @returns {Object|null} Saved selection or null
 */
export function loadDailySelection(studentId, blockId, deps) {
  const { readStorage, todayStamp, mergeSelection, defaultSelection } = deps;

  const map = readStorage('cs.lessonBrief.daily.v2', {});
  const key = [todayStamp(), blockId || 'no-block', studentId || ''].join(':');

  if (map && map[key]) {
    return mergeSelection(defaultSelection(), map[key]);
  }

  return null;
}

export default {
  getBlocks,
  saveBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  addStudentToBlock,
  removeStudentFromBlock,
  getBlockStudents,
  mergeBlocks,
  isValidBlock,
  getBlockErrors,
  saveDailySelection,
  loadDailySelection
};
