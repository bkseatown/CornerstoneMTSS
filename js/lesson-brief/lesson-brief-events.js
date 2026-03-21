/**
 * Lesson Brief Panel - Event Handlers
 *
 * Handles all user interactions: clicks, changes, input events
 * Processes form changes, button clicks, and student actions
 *
 * @module js/lesson-brief/lesson-brief-events
 */

/**
 * Handle form change events (select, radio)
 * Updates selection state when dropdown/radio changes
 * @param {Event} event - Change event
 * @param {Object} context - Handler context
 */
export function handleChange(event, context) {
  const {
    target,
    updateSelection,
    el,
    ensureSelectionValid,
    render,
    saveSelection
  } = context;

  if (!target) return;

  // Block time
  if (target.id === 'cs-brief-block-time') {
    updateSelection({ blockTime: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Block selection
  if (target.id === 'cs-brief-blocks') {
    const blockId = String(target.value || '');
    if (blockId) {
      context.selectBlock(blockId);
    }
    return;
  }

  // Student selection in roster
  if (target.id === 'cs-brief-roster-select') {
    updateSelection({ studentId: String(target.value || '') });
    updateSelection({ rosterCandidateId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Support type
  if (target.id === 'cs-brief-support-type') {
    updateSelection({ supportType: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Area
  if (target.id === 'cs-brief-area') {
    updateSelection({ area: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Program
  if (target.id === 'cs-brief-program') {
    updateSelection({ programId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Grade
  if (target.id === 'cs-brief-grade') {
    updateSelection({ grade: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  // Lesson/Unit-specific fields
  if (target.id === 'cs-brief-lesson') {
    updateSelection({ lesson: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-unit') {
    updateSelection({ unitId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-module') {
    updateSelection({ moduleId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-module-unit') {
    updateSelection({ moduleUnitId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-level') {
    updateSelection({ level: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-jw-unit') {
    updateSelection({ jwUnitId: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-haggerty-routine') {
    updateSelection({ haggertyRoutine: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-bridges-component') {
    updateSelection({ bridgesComponent: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-step-up-genre') {
    updateSelection({ stepUpGenre: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-step-up-stage') {
    updateSelection({ stepUpStage: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }
}

/**
 * Handle text input events
 * Updates selection for text fields
 * @param {Event} event - Input event
 * @param {Object} context - Handler context
 */
export function handleInput(event, context) {
  const { target, updateSelection, ensureSelectionValid, render } = context;

  if (!target) return;

  if (target.id === 'cs-brief-lesson-label') {
    updateSelection({ lessonLabel: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-block-label') {
    updateSelection({ blockLabel: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-custom-course') {
    updateSelection({ customCourse: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-custom-unit') {
    updateSelection({ customUnit: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }

  if (target.id === 'cs-brief-custom-text') {
    updateSelection({ customText: String(target.value || '') });
    ensureSelectionValid();
    render();
    return;
  }
}

/**
 * Handle click events
 * Delegates to handlers based on data attributes
 * @param {Event} event - Click event
 * @param {Object} context - Handler context
 */
export function handleClick(event, context) {
  const {
    target,
    el,
    updateSelection,
    selectBlock,
    deleteBlock,
    assignStudentToBlock,
    removeStudentFromBlock,
    chooseStudent,
    loadRecentSelection,
    confirmCurrentBrief,
    copyBriefToClipboard,
    saveCurrentNote,
    render,
    setGoogleStatus,
    ensureGoogleConnection,
    importGoogleCalendarBlocks,
    searchGoogleDrive,
    searchGoogleYouTube,
    createGoogleFile,
    openExternal,
    currentBrief
  } = context;

  if (!target) return;

  // Close button
  if (target.getAttribute('data-brief-close')) {
    context.close();
    return;
  }

  // Block selection from list
  if (target.getAttribute('data-brief-select-block')) {
    const blockId = target.getAttribute('data-brief-select-block');
    selectBlock(blockId);
    render();
    return;
  }

  // Delete block
  if (target.getAttribute('data-brief-delete-block')) {
    const blockId = target.getAttribute('data-brief-delete-block');
    deleteBlock(blockId);
    return;
  }

  // Add student to block
  if (target.getAttribute('data-brief-add-student')) {
    assignStudentToBlock();
    return;
  }

  // Remove student from block
  if (target.getAttribute('data-brief-remove-student')) {
    const studentId = target.getAttribute('data-brief-remove-student');
    removeStudentFromBlock(studentId);
    return;
  }

  // Choose student from display
  if (target.getAttribute('data-brief-student')) {
    const studentId = target.getAttribute('data-brief-student');
    chooseStudent(studentId);
    return;
  }

  // Load recent selection
  if (target.getAttribute('data-brief-recent')) {
    const recentKey = target.getAttribute('data-brief-recent');
    loadRecentSelection(recentKey);
    render();
    return;
  }

  // Save context
  if (target.getAttribute('data-brief-save-context')) {
    confirmCurrentBrief();
    render();
    return;
  }

  // Copy brief to clipboard
  if (target.getAttribute('data-brief-copy')) {
    const key = target.getAttribute('data-brief-copy');
    const brief = currentBrief();
    if (brief && brief.key === key) {
      confirmCurrentBrief();
      copyBriefToClipboard(brief);
    }
    return;
  }

  // Save note
  if (target.getAttribute('data-brief-save-note')) {
    const noteKey = target.getAttribute('data-brief-save-note');
    saveCurrentNote(noteKey);
    setGoogleStatus('Local note saved.');
    render();
    return;
  }

  // Google: Connect
  if (target.getAttribute('data-brief-google-connect')) {
    ensureGoogleConnection().then(() => {
      render();
    }).catch(err => {
      setGoogleStatus(err && err.message ? err.message : 'Google sign-in failed.');
      render();
    });
    return;
  }

  // Google: Open calendar
  if (target.getAttribute('data-brief-google-calendar-open')) {
    const api = context.googleWorkspaceModule && context.googleWorkspaceModule();
    openExternal(api && api.openCalendarUrl ? api.openCalendarUrl() : 'https://calendar.google.com/');
    return;
  }

  // Google: Sync calendar blocks
  if (target.getAttribute('data-brief-google-calendar-sync')) {
    importGoogleCalendarBlocks();
    return;
  }

  // Google: Create Doc
  if (target.getAttribute('data-brief-google-doc')) {
    createGoogleFile('Doc');
    return;
  }

  // Google: Create Sheet
  if (target.getAttribute('data-brief-google-sheet')) {
    createGoogleFile('Sheet');
    return;
  }

  // Google: Create Slides
  if (target.getAttribute('data-brief-google-slide')) {
    createGoogleFile('Slides');
    return;
  }

  // Google: Search Drive
  if (target.getAttribute('data-brief-google-drive')) {
    searchGoogleDrive();
    return;
  }

  // Google: Search YouTube
  if (target.getAttribute('data-brief-google-youtube')) {
    searchGoogleYouTube();
    return;
  }
}

export default {
  handleChange,
  handleInput,
  handleClick
};
