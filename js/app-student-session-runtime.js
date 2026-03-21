/**
 * app-student-session-runtime.js
 * Student/session target application, goal state, and roster summary coordination.
 */

function createStudentSessionRuntimeModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQUI = null,
    el = (id) => document.getElementById(id),
    formatGradeBandLabel = (value) => String(value || ''),
    formatLengthPrefLabel = (value) => String(value || ''),
    getActiveStudentLabel = () => 'Class',
    getEffectiveGameplayGradeBand = (gradeBand) => gradeBand,
    getFocusLabel = (value) => String(value || ''),
    getGoalState = () => Object.create(null),
    getLessonPackDefinition = () => ({ label: 'Pack' }),
    getLessonPackSelectElements = () => [],
    getLessonTarget = () => ({ label: 'Target' }),
    getLessonTargetSelectElements = () => [],
    getPrefs = () => ({}),
    getRosterState = () => ({ students: [], active: '' }),
    normalizeGoalEntry = (value) => value,
    normalizeLessonPackId = (value) => String(value || 'custom'),
    normalizeLessonTargetId = (_packId, value) => String(value || 'custom'),
    populateLessonTargetSelect = (_packId, targetId) => targetId,
    saveGoalState = () => {},
    setLessonPackApplying = () => {},
    setLessonPackPrefs = () => {},
    setPref = () => {},
    syncLessonPackControlsFromPrefs = () => {},
    updateFocusGradeNote = () => {},
    updateFocusSummaryLabel = () => {},
    updateGradeTargetInline = () => {},
    updateLessonPackNote = () => {},
    applyLessonTargetConfig = () => false,
    renderPlaylistControls = () => {},
    renderGroupBuilderPanel = () => {},
    renderStudentLockPanel = () => {},
    renderSessionSummary = () => {},
    recordSessionRound = () => {},
    recordVoiceAttempt = () => {},
    getMissionLabRecords = () => [],
    buildMissionSummaryStats = () => null,
    resetSessionSummary = () => {}
  } = deps || {};

  function buildCurrentTargetSnapshot() {
    const prefs = getPrefs();
    const packId = normalizeLessonPackId(
      prefs.lessonPack || el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack
    );
    const targetId = normalizeLessonTargetId(
      packId,
      prefs.lessonTarget || el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
    );
    const focus = el('setting-focus')?.value || prefs.focus || 'all';
    const gradeBand = getEffectiveGameplayGradeBand(el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade, focus);
    const length = String(el('s-length')?.value || prefs.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;
    let label = '';
    if (packId !== 'custom' && targetId !== 'custom') {
      const pack = getLessonPackDefinition(packId);
      const target = getLessonTarget(packId, targetId);
      label = target ? `${pack.label} · ${target.label}` : `${pack.label} · Target`;
    } else {
      const focusLabel = getFocusLabel(focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
      label = `${focusLabel || 'Classic'} · ${formatGradeBandLabel(gradeBand)} · ${formatLengthPrefLabel(length)}`;
    }
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      packId,
      targetId,
      focus,
      gradeBand,
      length,
      label,
      createdAt: Date.now()
    };
  }

  function applySnapshotToSettings(snapshot, options = {}) {
    if (!snapshot) return false;
    const packId = normalizeLessonPackId(snapshot.packId || 'custom');
    const targetId = normalizeLessonTargetId(packId, snapshot.targetId || 'custom');
    const focusValue = String(snapshot.focus || 'all').trim() || 'all';
    const gradeBand = String(snapshot.gradeBand || '').trim() || DEFAULT_PREFS.grade;
    const lengthValue = String(snapshot.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;

    if (packId !== 'custom' && targetId !== 'custom') {
      getLessonPackSelectElements().forEach((select) => { select.value = packId; });
      const normalizedTarget = populateLessonTargetSelect(packId, targetId);
      getLessonTargetSelectElements().forEach((select) => { select.value = normalizedTarget; });
      setLessonPackPrefs(packId, normalizedTarget);
      updateLessonPackNote(packId, normalizedTarget);
      applyLessonTargetConfig(packId, normalizedTarget, { toast: false });
      if (options.toast) WQUI?.showToast?.('Assigned playlist target applied.');
      return true;
    }

    setLessonPackApplying(true);
    try {
      getLessonPackSelectElements().forEach((select) => { select.value = 'custom'; });
      populateLessonTargetSelect('custom', 'custom');
      setLessonPackPrefs('custom', 'custom');
      const focusSelect = el('setting-focus');
      if (focusSelect && Array.from(focusSelect.options).some((option) => option.value === focusValue)) {
        focusSelect.value = focusValue;
        focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const gradeSelect = el('s-grade');
      if (gradeSelect && gradeSelect.value !== gradeBand) {
        gradeSelect.value = gradeBand;
        setPref('grade', gradeBand);
      }
      const lengthSelect = el('s-length');
      if (lengthSelect && lengthSelect.value !== lengthValue) {
        lengthSelect.value = lengthValue;
        setPref('length', lengthValue);
      }
    } finally {
      setLessonPackApplying(false);
    }
    updateLessonPackNote('custom', 'custom');
    updateFocusGradeNote();
    updateGradeTargetInline();
    updateFocusSummaryLabel();
    if (options.toast) WQUI?.showToast?.('Assigned playlist target applied.');
    return true;
  }

  function getGoalKeyForStudent(name) {
    const label = String(name || '').trim();
    return label || 'Class';
  }

  function getGoalForStudent(name) {
    const key = getGoalKeyForStudent(name);
    return normalizeGoalEntry(getGoalState()[key]);
  }

  function setGoalForStudent(name, goal) {
    const goalState = getGoalState();
    const key = getGoalKeyForStudent(name);
    const entry = normalizeGoalEntry(goal);
    if (!entry) return false;
    goalState[key] = entry;
    saveGoalState();
    return true;
  }

  function clearGoalForStudent(name) {
    const goalState = getGoalState();
    const key = getGoalKeyForStudent(name);
    if (!Object.prototype.hasOwnProperty.call(goalState, key)) return false;
    delete goalState[key];
    saveGoalState();
    return true;
  }

  function renderRosterControls() {
    const select = el('s-roster-student');
    if (!select) return;
    const rosterState = getRosterState();
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No student selected';
    select.appendChild(none);
    rosterState.students.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = rosterState.active || '';
    const chip = el('session-active-student');
    if (chip) chip.textContent = `Student: ${getActiveStudentLabel()}`;
    renderPlaylistControls();
    renderGroupBuilderPanel();
    renderStudentLockPanel();
  }

  return Object.freeze({
    applySnapshotToSettings,
    buildCurrentTargetSnapshot,
    buildMissionSummaryStats,
    clearGoalForStudent,
    getGoalForStudent,
    getGoalKeyForStudent,
    getMissionLabRecords,
    recordSessionRound,
    recordVoiceAttempt,
    renderRosterControls,
    renderSessionSummary,
    resetSessionSummary,
    setGoalForStudent
  });
}

window.createStudentSessionRuntimeModule = createStudentSessionRuntimeModule;
