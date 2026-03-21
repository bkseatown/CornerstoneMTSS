/**
 * app-preferences-runtime.js
 * Appearance, keyboard, lesson-pack, and core preference control bindings.
 */

function createPreferencesRuntimeModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQGame = null,
    WQUI = null,
    applyAllGradeLengthDefault = () => {},
    applyAtmosphere = (value) => value,
    applyBoardStyle = (value) => value,
    applyChunkTabsMode = (value) => value,
    applyKeyboardLayout = (value) => value,
    applyMotion = (value) => value,
    applyProjector = () => {},
    applyTheme = (value) => value,
    applyTextSize = (value) => value,
    applyUiSkin = (value) => value,
    applyWilsonMode = () => {},
    applyLessonTargetConfig = () => {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    formatGradeBandLabel = (value) => value,
    getCurrentWeekRecommendedLessonTarget = () => null,
    getKeyboardLayoutLabel = (value) => value,
    getNextKeyboardLayout = (value) => value,
    getThemeDisplayLabel = (value) => value,
    getThemeFallback = () => 'default',
    getLessonPackSelectElements = () => [],
    getLessonTargetSelectElements = () => [],
    isAssessmentRoundLocked = () => false,
    isFocusValueCompatibleWithGrade = () => true,
    newGame = () => {},
    normalizeKeyboardLayout = (value) => value,
    normalizeLessonPackId = (value) => value,
    normalizeLessonTargetId = (_packId, value) => value,
    populateLessonTargetSelect = () => 'custom',
    prefs = {},
    refreshStandaloneMissionLabHub = () => {},
    releaseLessonPackToManualMode = () => {},
    renderFocusSearchList = () => {},
    resolveDefaultLessonTargetId = () => 'custom',
    savePrefs = () => {},
    setConfidenceCoachingMode = () => {},
    setLessonPackPrefs = () => {},
    setPref = () => {},
    shouldPersistTheme = () => true,
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    syncCaseToggleUI = () => {},
    syncChunkTabsVisibility = () => {},
    syncHeaderControlsVisibility = () => {},
    syncKeyboardInputLocks = () => {},
    syncPlayStyleToggleUI = () => {},
    syncQuickSetupControls = () => {},
    syncLessonPackControlsFromPrefs = () => {},
    updateFocusGradeNote = () => {},
    updateGradeTargetInline = () => {},
    updateWilsonModeToggle = () => {},
    updateLessonPackNote = () => {}
  } = deps || {};

  function evaluateGuessForKeyboard(guess, targetWord) {
    const target = String(targetWord || '').toLowerCase().split('');
    const chars = String(guess || '').toLowerCase().split('');
    const result = Array(target.length).fill('absent');
    chars.forEach((ch, idx) => {
      if (ch === target[idx]) {
        result[idx] = 'correct';
        target[idx] = '';
        chars[idx] = '';
      }
    });
    chars.forEach((ch, idx) => {
      if (!ch) return;
      const foundIndex = target.indexOf(ch);
      if (foundIndex < 0) return;
      result[idx] = 'present';
      target[foundIndex] = '';
    });
    return result;
  }

  function restoreKeyboardStateFromRound(state) {
    if (!state?.word || !Array.isArray(state.guesses) || !state.guesses.length) return;
    state.guesses.forEach((guess) => {
      const result = evaluateGuessForKeyboard(guess, state.word);
      WQUI?.updateKeyboard?.(result, guess);
    });
    syncKeyboardInputLocks(state);
  }

  function refreshKeyboardLayoutPreview() {
    const state = WQGame?.getState?.();
    if (!state?.word) return;
    WQUI?.buildKeyboard?.();
    restoreKeyboardStateFromRound(state);
    if (state.guess) {
      WQUI?.updateCurrentRow?.(state.guess, state.wordLength, state.guesses.length);
    }
    if (state.wordLength && state.maxGuesses) {
      WQUI?.calcLayout?.(state.wordLength, state.maxGuesses);
    }
    syncKeyboardInputLocks(state);
  }

  function handleLessonPackSelectionChange(rawValue) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before changing lesson packs.');
      syncLessonPackControlsFromPrefs();
      return false;
    }
    const nextPack = normalizeLessonPackId(rawValue);
    const preferredTarget = nextPack === 'custom' ? 'custom' : resolveDefaultLessonTargetId(nextPack);
    let nextTarget = 'custom';
    try {
      getLessonPackSelectElements().forEach((select) => { select.value = nextPack; });
      nextTarget = populateLessonTargetSelect(nextPack, preferredTarget);
    } finally {
      // keep behavior-neutral: caller still owns broader lesson-pack runtime state
    }
    setLessonPackPrefs(nextPack, nextTarget);
    updateLessonPackNote(nextPack, nextTarget);
    refreshStandaloneMissionLabHub();
    if (nextPack !== 'custom' && nextTarget !== 'custom') {
      applyLessonTargetConfig(nextPack, nextTarget, { toast: false });
    }
    return true;
  }

  function handleLessonTargetSelectionChange(rawValue) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before changing lesson targets.');
      syncLessonPackControlsFromPrefs();
      return false;
    }
    const currentPack = normalizeLessonPackId(
      prefs.lessonPack || el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack
    );
    const nextTarget = normalizeLessonTargetId(currentPack, rawValue);
    getLessonTargetSelectElements().forEach((select) => { select.value = nextTarget; });
    setLessonPackPrefs(currentPack, nextTarget);
    updateLessonPackNote(currentPack, nextTarget);
    refreshStandaloneMissionLabHub();
    if (currentPack === 'custom' || nextTarget === 'custom') return true;
    applyLessonTargetConfig(currentPack, nextTarget, { toast: false });
    return true;
  }

  function syncFocusSearchForCurrentGrade() {
    const listEl = el('focus-inline-results');
    if (!listEl || listEl.classList.contains('hidden')) return;
    renderFocusSearchList(el('focus-inline-search')?.value || '');
  }

  function enforceFocusSelectionForGrade(selectedGradeBand, options = {}) {
    const focusSelect = el('setting-focus');
    if (!focusSelect) return false;
    const currentFocus = String(focusSelect.value || 'all').trim() || 'all';
    if (isFocusValueCompatibleWithGrade(currentFocus, selectedGradeBand)) return false;
    focusSelect.value = 'all';
    focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    if (options.toast !== false) {
      showToast(`Quest reset to Classic for grade ${formatGradeBandLabel(selectedGradeBand)}.`);
    }
    return true;
  }

  function bindThemeControls() {
    el('s-theme')?.addEventListener('change', (event) => {
      const normalized = applyTheme(event.target.value);
      if (shouldPersistTheme()) setPref('theme', normalized);
      showToast(`Theme: ${getThemeDisplayLabel(normalized)}`);
      syncQuickSetupControls();
      syncPlayStyleToggleUI();
      syncHeaderControlsVisibility();
    });
    el('s-theme')?.addEventListener('input', (event) => {
      const normalized = applyTheme(event.target.value);
      if (shouldPersistTheme()) setPref('theme', normalized);
      syncQuickSetupControls();
      syncPlayStyleToggleUI();
      syncHeaderControlsVisibility();
    });
    el('s-theme')?.addEventListener('keydown', (event) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
      const select = event.currentTarget;
      if (!(select instanceof HTMLSelectElement)) return;
      const options = Array.from(select.options).filter((option) => !option.disabled && option.value);
      if (!options.length) return;
      const currentIndex = Math.max(0, options.findIndex((option) => option.value === select.value));
      let nextIndex = currentIndex;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') nextIndex = Math.min(options.length - 1, currentIndex + 1);
      if (event.key === 'ArrowUp' || event.key === 'PageUp') nextIndex = Math.max(0, currentIndex - 1);
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = options.length - 1;
      if (nextIndex === currentIndex) return;
      event.preventDefault();
      select.value = options[nextIndex].value;
      const normalized = applyTheme(select.value);
      if (shouldPersistTheme()) setPref('theme', normalized);
      syncQuickSetupControls();
      syncPlayStyleToggleUI();
      syncHeaderControlsVisibility();
    });
    el('s-theme-save')?.addEventListener('change', (event) => {
      const next = event.target.value === 'on' ? 'on' : 'off';
      setPref('themeSave', next);
      if (next === 'on') {
        setPref('theme', deps.normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback()));
        showToast('Theme will be saved for next time.');
      } else {
        delete prefs.theme;
        savePrefs(prefs);
        showToast('Theme save is off. App will start on default theme next time.');
      }
    });
    el('s-ui-skin')?.addEventListener('change', (event) => {
      const normalized = applyUiSkin(event.target.value, { persist: true });
      showToast(`Visual skin: ${normalized === 'premium' ? 'Premium' : 'Classic'}.`);
    });
  }

  function bindKeyboardAndAppearanceControls() {
    el('s-board-style')?.addEventListener('change', (event) => {
      const next = applyBoardStyle(event.target.value);
      setPref('boardStyle', next);
      updateWilsonModeToggle();
      refreshKeyboardLayoutPreview();
    });
    el('s-key-style')?.addEventListener('change', () => {
      const next = deps.applyKeyStyle(DEFAULT_PREFS.keyStyle);
      setPref('keyStyle', next);
      updateWilsonModeToggle();
      refreshKeyboardLayoutPreview();
    });
    el('s-keyboard-layout')?.addEventListener('change', (event) => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice();
        event.target.value = normalizeKeyboardLayout(documentRef.documentElement.getAttribute('data-keyboard-layout') || DEFAULT_PREFS.keyboardLayout);
        return;
      }
      const next = applyKeyboardLayout(event.target.value);
      setPref('keyboardLayout', next);
      refreshKeyboardLayoutPreview();
      showToast(`Keyboard switched to ${getKeyboardLayoutLabel(next)}.`);
    });
    el('s-chunk-tabs')?.addEventListener('change', (event) => {
      const next = applyChunkTabsMode(event.target.value);
      setPref('chunkTabs', next);
      syncChunkTabsVisibility();
    });
    el('s-wilson-mode')?.addEventListener('change', (event) => {
      const enabled = !!event.target.checked;
      applyWilsonMode(enabled);
      refreshKeyboardLayoutPreview();
      showToast(enabled ? 'Wilson sound-card mode is on.' : 'Switched to standard keyboard + simple board.');
    });
    el('keyboard-layout-toggle')?.addEventListener('click', () => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice();
        return;
      }
      const current = normalizeKeyboardLayout(documentRef.documentElement.getAttribute('data-keyboard-layout') || 'standard');
      const next = applyKeyboardLayout(getNextKeyboardLayout(current));
      setPref('keyboardLayout', next);
      refreshKeyboardLayoutPreview();
      showToast(`Keyboard switched to ${getKeyboardLayoutLabel(next)}.`);
    });
    el('s-atmosphere')?.addEventListener('change', (event) => {
      setPref('atmosphere', applyAtmosphere(event.target.value));
    });
    el('s-text-size')?.addEventListener('change', (event) => {
      setPref('textSize', applyTextSize(event.target.value));
    });
    el('s-projector')?.addEventListener('change', (event) => {
      applyProjector(event.target.value);
      setPref('projector', event.target.value);
    });
    el('s-motion')?.addEventListener('change', (event) => {
      applyMotion(event.target.value);
      setPref('motion', event.target.value);
    });
    el('s-case')?.addEventListener('change', (event) => {
      const next = String(event.target.value || 'lower').toLowerCase() === 'upper' ? 'upper' : 'lower';
      WQUI?.setCaseMode?.(next);
      setPref('caseMode', next);
      syncCaseToggleUI();
    });
    el('case-toggle-btn')?.addEventListener('click', () => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice();
        return;
      }
      const current = String(documentRef.documentElement.getAttribute('data-case') || prefs.caseMode || DEFAULT_PREFS.caseMode).toLowerCase();
      const next = current === 'upper' ? 'lower' : 'upper';
      const select = el('s-case');
      if (select) select.value = next;
      WQUI?.setCaseMode?.(next);
      setPref('caseMode', next);
      syncCaseToggleUI();
      showToast(next === 'upper' ? 'Letter case: UPPERCASE.' : 'Letter case: lowercase.');
    });
  }

  function bindCurriculumControls() {
    el('s-lesson-pack')?.addEventListener('change', (event) => {
      handleLessonPackSelectionChange(event.target.value);
    });
    el('s-lesson-target')?.addEventListener('change', (event) => {
      handleLessonTargetSelectionChange(event.target.value);
    });
    el('lesson-pack-apply-week-btn')?.addEventListener('click', () => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Finish this round before applying pacing targets.');
        return;
      }
      const button = el('lesson-pack-apply-week-btn');
      const packId = normalizeLessonPackId(
        button?.getAttribute('data-pack-id') || prefs.lessonPack || DEFAULT_PREFS.lessonPack
      );
      const recommendation = getCurrentWeekRecommendedLessonTarget(packId);
      const targetId = recommendation?.target?.id || '';
      if (packId === 'custom' || !targetId) {
        showToast('No pacing target available to apply.');
        return;
      }
      getLessonPackSelectElements().forEach((select) => { select.value = packId; });
      getLessonTargetSelectElements().forEach((select) => { select.value = targetId; });
      setLessonPackPrefs(packId, targetId);
      updateLessonPackNote(packId, targetId);
      applyLessonTargetConfig(packId, targetId, { toast: true });
    });
  }

  function bindCorePreferenceControls() {
    el('s-grade')?.addEventListener('change', (event) => {
      const selectedGradeBand = String(event.target?.value || DEFAULT_PREFS.grade).trim() || DEFAULT_PREFS.grade;
      setPref('grade', selectedGradeBand);
      applyAllGradeLengthDefault({ toast: true });
      releaseLessonPackToManualMode();
      enforceFocusSelectionForGrade(selectedGradeBand, { toast: true });
      updateFocusGradeNote();
      updateGradeTargetInline();
      refreshStandaloneMissionLabHub();
      syncFocusSearchForCurrentGrade();
      syncQuickSetupControls();
    });
    el('s-length')?.addEventListener('change', (event) => {
      setPref('length', event.target.value);
      releaseLessonPackToManualMode();
      refreshStandaloneMissionLabHub();
    });
    el('s-guesses')?.addEventListener('change', (event) => {
      const currentState = WQGame?.getState?.() || null;
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Finish this round before changing max guesses.');
        event.target.value = String(
          Math.max(1, Number(currentState?.maxGuesses || prefs.guesses || DEFAULT_PREFS.guesses || 6))
        );
        return;
      }
      const normalized = String(
        Math.max(1, Number.parseInt(String(event.target.value || DEFAULT_PREFS.guesses), 10) || Number.parseInt(DEFAULT_PREFS.guesses, 10) || 6)
      );
      event.target.value = normalized;
      setPref('guesses', normalized);
      const hasActiveWord = Boolean(currentState?.word && !currentState?.gameOver);
      const hasProgress = Boolean(
        hasActiveWord && (((currentState?.guesses?.length || 0) > 0) || String(currentState?.guess || '').length > 0)
      );
      if (hasProgress) {
        showToast(`Max guesses set to ${normalized}. It applies next word.`);
        return;
      }
      if (hasActiveWord) {
        newGame();
        showToast(`Max guesses set to ${normalized}.`);
        return;
      }
      showToast(`Max guesses saved: ${normalized}.`);
    });
    el('s-confidence-coaching')?.addEventListener('change', (event) => {
      setConfidenceCoachingMode(!!event.target.checked, { toast: true });
    });
  }

  function init() {
    if (documentRef.body?.dataset.wqPreferencesRuntimeBound === '1') return;
    bindThemeControls();
    bindKeyboardAndAppearanceControls();
    bindCurriculumControls();
    bindCorePreferenceControls();
    documentRef.body.dataset.wqPreferencesRuntimeBound = '1';
  }

  return Object.freeze({
    enforceFocusSelectionForGrade,
    handleLessonPackSelectionChange,
    handleLessonTargetSelectionChange,
    init,
    refreshKeyboardLayoutPreview
  });
}

window.createPreferencesRuntimeModule = createPreferencesRuntimeModule;
