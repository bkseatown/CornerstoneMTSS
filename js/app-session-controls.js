/**
 * app-session-controls.js
 * Teacher/report/session UI binding layer for exports, probes, playlists, roster, goals, and onboarding reruns.
 */

function createSessionControlsModule(deps) {
  const {
    WQTeacherAssignmentsFeature = null,
    buildCurrentCurriculumSnapshot = () => ({}),
    clearGoalForStudent = () => false,
    clearRosterStudents = () => {},
    contract = null,
    copyDiagnosticsSummary = async () => {},
    copyFamilyHandout = async () => {},
    copyMasterySummary = async () => {},
    copyMasterySummaryCsv = async () => {},
    copyMiniLessonPlan = async () => {},
    copyMissionSummary = async () => {},
    copyMissionSummaryCsv = async () => {},
    copyMtssIepNote = async () => {},
    copyProbeSummary = async () => {},
    copyProbeSummaryCsv = async () => {},
    copyReviewLink = async () => {},
    copySessionOutcomesSummary = async () => {},
    copySessionSummary = async () => {},
    deleteSelectedPlaylist = () => false,
    documentRef = document,
    downloadClassRollupCsv = () => {},
    downloadCsvBundle = () => {},
    downloadFamilyHandout = () => {},
    el = (id) => documentRef.getElementById(id),
    emitTelemetry = () => {},
    finishWeeklyProbe = () => {},
    getActiveStudentLabel = () => 'Student',
    maybeApplyStudentPlanForActiveStudent = () => {},
    normalizeGoalAccuracy = (value) => value,
    normalizeGoalGuesses = (value) => value,
    normalizeLessonPackId = (value) => value,
    normalizeLessonTargetId = (_pack, value) => value,
    onSetActiveMiniLessonKey = () => {},
    populateTargetSelectForPack = () => 'custom',
    removeActiveRosterStudent = () => false,
    renderDiagnosticsPanel = async () => {},
    renderGroupBuilderPanel = () => {},
    renderMiniLessonPanel = () => {},
    renderProbePanel = () => {},
    renderRosterControls = () => {},
    renderSessionSummary = () => {},
    renderStudentGoalPanel = () => {},
    renderStudentLockPanel = () => {},
    rerunOnboardingSetup = () => {},
    saveCurrentTargetToPlaylist = () => false,
    saveGroupPlanState = () => {},
    saveRosterState = () => {},
    setGoalForStudent = () => {},
    setSelectedGroupPlanId = () => {},
    setSelectedPlaylistId = () => {},
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    startWeeklyProbe = () => {},
    teacherAssignmentsFeature = null,
    isAssessmentRoundLocked = () => false,
    windowRef = window
  } = deps || {};

  function bindExportControls() {
    el('diag-refresh-btn')?.addEventListener('click', () => {
      void renderDiagnosticsPanel();
    });
    el('diag-copy-btn')?.addEventListener('click', () => {
      void copyDiagnosticsSummary();
    });
    el('diag-copy-review-link-btn')?.addEventListener('click', () => {
      void copyReviewLink();
    });
    el('session-copy-btn')?.addEventListener('click', () => {
      void copySessionSummary();
    });
    el('session-copy-mastery-btn')?.addEventListener('click', () => {
      void copyMasterySummary();
    });
    el('session-copy-mastery-csv-btn')?.addEventListener('click', () => {
      void copyMasterySummaryCsv();
    });
    el('session-copy-mission-btn')?.addEventListener('click', () => {
      void copyMissionSummary();
    });
    el('session-copy-mission-csv-btn')?.addEventListener('click', () => {
      void copyMissionSummaryCsv();
    });
    el('session-copy-mtss-note-btn')?.addEventListener('click', () => {
      void copyMtssIepNote();
    });
    el('session-copy-family-handout-btn')?.addEventListener('click', () => {
      void copyFamilyHandout();
    });
    el('session-download-family-handout-btn')?.addEventListener('click', () => {
      downloadFamilyHandout();
    });
    el('session-download-csv-bundle-btn')?.addEventListener('click', () => {
      downloadCsvBundle();
    });
    el('session-download-class-rollup-btn')?.addEventListener('click', () => {
      downloadClassRollupCsv();
    });
    el('session-copy-outcomes-btn')?.addEventListener('click', () => {
      void copySessionOutcomesSummary();
    });
    el('session-copy-probe-export-btn')?.addEventListener('click', () => {
      void copyProbeSummary();
    });
    el('session-copy-probe-csv-export-btn')?.addEventListener('click', () => {
      void copyProbeSummaryCsv();
    });
  }

  function bindProbeControls() {
    el('session-reset-btn')?.addEventListener('click', () => {
      deps.resetSessionSummary?.();
      emitTelemetry('wq_funnel_reset_used', { source: 'teacher_session' });
      showToast('Teacher session summary reset.');
    });
    el('session-probe-start-btn')?.addEventListener('click', () => {
      startWeeklyProbe();
    });
    el('session-probe-stop-btn')?.addEventListener('click', () => {
      finishWeeklyProbe();
    });
    el('session-probe-copy-btn')?.addEventListener('click', () => {
      void copyProbeSummary();
    });
    el('session-probe-copy-csv-btn')?.addEventListener('click', () => {
      void copyProbeSummaryCsv();
    });
  }

  function bindPlaylistControls() {
    el('s-playlist-select')?.addEventListener('change', (event) => {
      setSelectedPlaylistId(event.target?.value || '');
      deps.renderPlaylistControls?.();
    });
    el('s-playlist-name')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      el('session-playlist-save-btn')?.click();
    });
    el('session-playlist-save-btn')?.addEventListener('click', () => {
      if (!saveCurrentTargetToPlaylist()) {
        showToast('Could not save the current target.');
        return;
      }
      showToast('Current target saved to playlist.');
    });
    el('session-playlist-assign-btn')?.addEventListener('click', () => {
      if (!deps.assignSelectedPlaylistToActiveStudent?.()) {
        showToast('Select a playlist first.');
        return;
      }
      showToast(`Assigned playlist to ${getActiveStudentLabel()}.`);
    });
    el('session-playlist-apply-btn')?.addEventListener('click', () => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Finish this round before applying assigned playlists.');
        return;
      }
      if (!deps.applyAssignedPlaylistForActiveStudent?.()) {
        showToast('No assigned playlist for this student.');
      }
    });
    el('session-playlist-delete-btn')?.addEventListener('click', () => {
      if (!deleteSelectedPlaylist()) {
        showToast('Select a playlist to delete.');
        return;
      }
      showToast('Playlist deleted.');
    });
  }

  function bindMiniLessonControls() {
    el('session-mini-lesson-top-btn')?.addEventListener('click', () => {
      onSetActiveMiniLessonKey('top');
      renderMiniLessonPanel();
      showToast('Loaded mini-lesson from top error.');
    });
    el('session-mini-lesson-vowel-btn')?.addEventListener('click', () => {
      onSetActiveMiniLessonKey('vowel_pattern');
      renderMiniLessonPanel();
    });
    el('session-mini-lesson-blend-btn')?.addEventListener('click', () => {
      onSetActiveMiniLessonKey('blend_position');
      renderMiniLessonPanel();
    });
    el('session-mini-lesson-morpheme-btn')?.addEventListener('click', () => {
      onSetActiveMiniLessonKey('morpheme_ending');
      renderMiniLessonPanel();
    });
    el('session-mini-lesson-context-btn')?.addEventListener('click', () => {
      onSetActiveMiniLessonKey('context_strategy');
      renderMiniLessonPanel();
    });
    el('session-mini-lesson-copy-btn')?.addEventListener('click', () => {
      void copyMiniLessonPlan();
    });
  }

  function bindRosterControls() {
    el('s-roster-student')?.addEventListener('change', (event) => {
      const next = String(event.target?.value || '').trim();
      deps.setRosterActive?.(next);
      saveRosterState();
      renderRosterControls();
      maybeApplyStudentPlanForActiveStudent();
      renderSessionSummary();
      renderProbePanel();
    });
    el('session-roster-add-btn')?.addEventListener('click', () => {
      const input = el('s-roster-name');
      const nextName = String(input?.value || '').trim();
      if (!nextName) {
        showToast('Enter a student name first.');
        return;
      }
      if (deps.addRosterStudent?.(nextName)) {
        if (input) input.value = '';
        renderSessionSummary();
        renderProbePanel();
        showToast('Student added to roster.');
        return;
      }
      showToast('Could not add student name.');
    });
    el('s-roster-name')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      el('session-roster-add-btn')?.click();
    });
    el('session-roster-remove-btn')?.addEventListener('click', () => {
      if (!removeActiveRosterStudent()) {
        showToast('Select a student to remove.');
        return;
      }
      renderSessionSummary();
      renderProbePanel();
      showToast('Student removed from roster.');
    });
    el('session-roster-clear-btn')?.addEventListener('click', () => {
      clearRosterStudents();
      renderSessionSummary();
      renderProbePanel();
      showToast('Roster cleared for this device.');
    });
  }

  function bindTeacherAssignments() {
    WQTeacherAssignmentsFeature?.bindUI?.({
      contract,
      el,
      toast: (message) => showToast(message),
      normalizeLessonPackId,
      normalizeLessonTargetId,
      populateTargetSelectForPack: (...args) => populateTargetSelectForPack(...args),
      buildCurrentCurriculumSnapshot,
      getActiveStudentLabel,
      getGroupPlanCount: () => teacherAssignmentsFeature?.getGroupPlanCount?.() || 0,
      addGroupPlanEntry: (entry) => teacherAssignmentsFeature?.addGroupPlanEntry?.(entry),
      removeGroupPlanById: (id) => teacherAssignmentsFeature?.removeGroupPlanById?.(id),
      getFirstGroupPlanId: () => teacherAssignmentsFeature?.getFirstGroupPlanId?.() || '',
      getSelectedGroupPlan: () => teacherAssignmentsFeature?.getSelectedGroupPlan?.() || null,
      setSelectedGroupPlanId: (id) => setSelectedGroupPlanId(id),
      saveGroupPlanState: () => saveGroupPlanState(),
      renderGroupBuilderPanel,
      setStudentTargetLock: (student, payload) => teacherAssignmentsFeature?.setStudentTargetLock?.(student, payload) || false,
      clearStudentTargetLock: (student) => teacherAssignmentsFeature?.clearStudentTargetLock?.(student) || false,
      renderStudentLockPanel,
      maybeApplyStudentPlanForActiveStudent
    });
  }

  function bindGoalControls() {
    el('session-goal-save-btn')?.addEventListener('click', () => {
      const student = getActiveStudentLabel();
      const accuracyInput = el('s-goal-accuracy');
      const guessesInput = el('s-goal-guesses');
      const accuracyTarget = normalizeGoalAccuracy(accuracyInput?.value);
      const avgGuessesTarget = normalizeGoalGuesses(guessesInput?.value);
      if (accuracyInput) accuracyInput.value = String(accuracyTarget);
      if (guessesInput) guessesInput.value = String(avgGuessesTarget);
      setGoalForStudent(student, {
        accuracyTarget,
        avgGuessesTarget,
        updatedAt: Date.now()
      });
      renderStudentGoalPanel();
      showToast(`Goal saved for ${student}.`);
    });
    el('session-goal-clear-btn')?.addEventListener('click', () => {
      const student = getActiveStudentLabel();
      if (!clearGoalForStudent(student)) {
        showToast('No saved goal to clear.');
        renderStudentGoalPanel();
        return;
      }
      renderStudentGoalPanel();
      showToast(`Goal cleared for ${student}.`);
    });
  }

  function bindOnboardingControl() {
    el('session-rerun-onboarding-btn')?.addEventListener('click', () => {
      rerunOnboardingSetup();
    });
  }

  function init() {
    if (documentRef.body?.dataset.wqSessionControlsBound === '1') return;
    bindExportControls();
    bindProbeControls();
    bindPlaylistControls();
    bindMiniLessonControls();
    bindRosterControls();
    bindTeacherAssignments();
    bindGoalControls();
    bindOnboardingControl();
    documentRef.body.dataset.wqSessionControlsBound = '1';
  }

  return Object.freeze({ init });
}

window.createSessionControlsModule = createSessionControlsModule;
