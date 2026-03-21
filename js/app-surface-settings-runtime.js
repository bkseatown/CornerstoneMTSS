/**
 * app-surface-settings-runtime.js
 * Play-surface appearance helpers, teacher preset detection, and small setup utilities.
 */

function createSurfaceSettingsRuntimeModule(deps) {
  const {
    defaultPrefs = {},
    detectPreferredKeyboardLayout = () => 'standard',
    documentRef = document,
    el = () => null,
    getHintMode = () => 'on',
    getThemeFallback = () => 'seahawks',
    getVoicePracticeMode = () => 'optional',
    isAssessmentLockEnabled = () => false,
    isConfidenceCoachingEnabled = () => false,
    normalizeKeyboardLayout = (mode) => mode,
    normalizeKeyboardPresetId = (mode) => mode,
    normalizeTextSize = (mode) => mode,
    normalizeTheme = (theme, fallback) => theme || fallback,
    normalizeVoiceMode = (mode) => mode,
    openFirstRunSetupModal = () => {},
    prefs = {},
    setHoverNoteForElement = () => {},
    setPref = () => {},
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    syncChunkTabsVisibility = () => {},
    syncHeaderControlsVisibility = () => {},
    updateFocusHint = () => {},
    teacherPresets = {},
    writingStudioEnabled = false,
    studentRecordingEnabled = false,
    wqGame = null,
    WQUI = null
  } = deps || {};

  const KEYBOARD_PRESET_CONFIG = Object.freeze({
    'qwerty-classic': Object.freeze({ label: 'QWERTY Classic', layout: 'standard', keyStyle: 'classic' }),
    'abc-classic': Object.freeze({ label: 'ABC Classic', layout: 'alphabet', keyStyle: 'classic' }),
    'qwerty-pebble': Object.freeze({ label: 'QWERTY Pebble', layout: 'standard', keyStyle: 'pebble' }),
    'abc-pebble': Object.freeze({ label: 'ABC Pebble', layout: 'alphabet', keyStyle: 'pebble' }),
    'wilson-soundcard': Object.freeze({ label: 'Wilson Sound Cards', layout: 'wilson', keyStyle: 'soundcard' })
  });

  function applyFeedback(mode) {
    const normalized = mode === 'classic' ? 'classic' : 'themed';
    documentRef.documentElement.setAttribute('data-feedback', normalized);
    const select = el('s-feedback');
    if (select && select.value !== normalized) select.value = normalized;
  }

  function applyBoardStyle(mode) {
    const allowed = new Set(['clean', 'card', 'patterned', 'soundcard']);
    const normalized = allowed.has(mode) ? mode : defaultPrefs.boardStyle;
    documentRef.documentElement.setAttribute('data-board-style', normalized);
    const select = el('s-board-style');
    if (select && select.value !== normalized) select.value = normalized;
    updateWilsonModeToggle();
    return normalized;
  }

  function applyKeyStyle(mode) {
    const normalized = mode === 'soundcard' ? 'soundcard' : mode === 'pebble' ? 'pebble' : defaultPrefs.keyStyle;
    documentRef.documentElement.setAttribute('data-key-style', normalized);
    const select = el('s-key-style');
    if (select && select.value !== normalized) select.value = normalized;
    updateWilsonModeToggle();
    return normalized;
  }

  function normalizeHeaderControlLayout() {
    const headerRight = documentRef.querySelector('.header-right');
    if (!headerRight) return;
    const iconIds = ['theme-dock-toggle-btn', 'music-dock-toggle-btn', 'teacher-panel-btn', 'case-toggle-btn', 'keyboard-layout-toggle', 'mission-lab-nav-btn', 'settings-btn', 'play-tools-btn'];
    const quickIds = ['play-style-toggle', 'phonics-clue-open-btn', 'starter-word-open-btn', 'writing-studio-btn', 'sentence-studio-btn', 'reading-lab-btn', 'new-game-btn'];
    let iconGroup = headerRight.querySelector('.header-icon-controls');
    if (!iconGroup) {
      iconGroup = documentRef.createElement('div');
      iconGroup.className = 'header-icon-controls';
    }
    let quickGroup = headerRight.querySelector('.header-quick-controls');
    if (!quickGroup) {
      quickGroup = documentRef.createElement('div');
      quickGroup.className = 'header-quick-controls';
    }
    iconIds.forEach((id) => {
      const node = el(id);
      if (node) iconGroup.appendChild(node);
    });
    quickIds.forEach((id) => {
      const node = el(id);
      if (node) quickGroup.appendChild(node);
    });
    if (iconGroup.parentElement !== headerRight) headerRight.appendChild(iconGroup);
    if (quickGroup.parentElement !== headerRight) headerRight.appendChild(quickGroup);
    if (headerRight.firstElementChild !== iconGroup) headerRight.insertBefore(iconGroup, headerRight.firstChild);
    if (iconGroup.nextElementSibling !== quickGroup) headerRight.insertBefore(quickGroup, iconGroup.nextElementSibling);
  }

  function syncWritingStudioAvailability() {
    const writingBtn = el('writing-studio-btn');
    if (!writingBtn) return;
    if (writingStudioEnabled) {
      writingBtn.classList.remove('hidden');
      writingBtn.removeAttribute('aria-hidden');
      writingBtn.removeAttribute('tabindex');
      writingBtn.removeAttribute('disabled');
      return;
    }
    writingBtn.classList.add('hidden');
    writingBtn.setAttribute('aria-hidden', 'true');
    writingBtn.setAttribute('tabindex', '-1');
    writingBtn.setAttribute('disabled', 'true');
  }

  function getHeaderIconMarkup(kind) {
    if (kind === 'keyboard') {
      return '<svg class="icon-glyph icon-glyph-keyboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.25" y="6.25" width="17.5" height="11.5" rx="2.25"></rect><path d="M6.4 10.1h.01"></path><path d="M9.1 10.1h.01"></path><path d="M11.8 10.1h.01"></path><path d="M14.5 10.1h.01"></path><path d="M17.2 10.1h.01"></path><path d="M6.4 12.9h.01"></path><path d="M9.1 12.9h.01"></path><path d="M11.8 12.9h.01"></path><path d="M14.5 12.9h.01"></path><path d="M17.2 12.9h.01"></path><path d="M8.2 15.7h7.6"></path></svg>';
    }
    if (kind === 'settings') {
      return '<svg class="icon-glyph icon-glyph-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3.1"></circle><path d="M12 3.2v2.1"></path><path d="M12 18.7v2.1"></path><path d="m5.78 5.78 1.5 1.5"></path><path d="m16.72 16.72 1.5 1.5"></path><path d="M3.2 12h2.1"></path><path d="M18.7 12h2.1"></path><path d="m5.78 18.22 1.5-1.5"></path><path d="m16.72 7.28 1.5-1.5"></path><path d="M9.2 4.8 8.1 6.4"></path><path d="m15.9 17.6-1.1 1.6"></path><path d="m4.8 14.8 1.6-1.1"></path><path d="m17.6 9.2 1.6-1.1"></path><path d="m4.8 9.2 1.6 1.1"></path><path d="m17.6 14.8 1.6 1.1"></path><path d="m9.2 19.2-1.1-1.6"></path><path d="m15.9 6.4-1.1-1.6"></path></svg>';
    }
    return '';
  }

  function syncHeaderStaticIcons() {
    const teacherBtn = el('teacher-panel-btn');
    if (teacherBtn) {
      teacherBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">👩‍🏫</span>';
      setHoverNoteForElement(teacherBtn, 'Specialist tools: add your own words or word list.');
    }
    const themeBtn = el('theme-dock-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">🎨</span>';
      setHoverNoteForElement(themeBtn, 'Open style picker.');
    }
    const musicBtn = el('music-dock-toggle-btn');
    if (musicBtn) {
      musicBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">🎵</span>';
      setHoverNoteForElement(musicBtn, 'Open music controls.');
    }
    const settingsBtn = el('settings-btn');
    if (settingsBtn) {
      settingsBtn.innerHTML = getHeaderIconMarkup('settings');
      setHoverNoteForElement(settingsBtn, 'Open settings.');
    }
    const playToolsBtn = el('play-tools-btn');
    if (playToolsBtn) setHoverNoteForElement(playToolsBtn, 'Open activity tools.');
    const writingBtn = el('writing-studio-btn');
    if (writingStudioEnabled && writingBtn) setHoverNoteForElement(writingBtn, 'Open Writing Studio.');
    const surgeryBtn = el('sentence-studio-btn');
    if (surgeryBtn) setHoverNoteForElement(surgeryBtn, 'Open Sentence Studio.');
    const readingBtn = el('reading-lab-btn');
    if (readingBtn) setHoverNoteForElement(readingBtn, 'Open Reading Lab.');
    syncWritingStudioAvailability();
  }

  function applyKeyboardLayout(mode) {
    const normalized = normalizeKeyboardLayout(mode);
    documentRef.documentElement.setAttribute('data-keyboard-layout', normalized);
    const select = el('s-keyboard-layout');
    if (select && select.value !== normalized) select.value = normalized;
    updateWilsonModeToggle();
    syncChunkTabsVisibility();
    syncKeyboardLayoutToggle();
    return normalized;
  }

  function applyKeyboardPreset(mode, options = {}) {
    const normalized = normalizeKeyboardPresetId(mode);
    const preset = KEYBOARD_PRESET_CONFIG[normalized] || KEYBOARD_PRESET_CONFIG['qwerty-classic'];
    const layout = applyKeyboardLayout(preset.layout);
    const keyStyle = applyKeyStyle(preset.keyStyle);
    let boardStyle = documentRef.documentElement.getAttribute('data-board-style') || prefs.boardStyle || defaultPrefs.boardStyle;
    if (preset.keyStyle === 'pebble') {
      boardStyle = applyBoardStyle('card');
    }
    if (options.persist !== false) {
      setPref('keyboardLayout', layout);
      setPref('keyStyle', keyStyle);
      if (preset.keyStyle === 'pebble') setPref('boardStyle', boardStyle);
    }
    updateWilsonModeToggle();
    return Object.freeze({ id: normalized, label: preset.label, layout, keyStyle, boardStyle });
  }

  function syncKeyboardLayoutToggle() {
    normalizeHeaderControlLayout();
    const toggle = el('keyboard-layout-toggle');
    if (!toggle) return;
    const layout = normalizeKeyboardLayout(documentRef.documentElement.getAttribute('data-keyboard-layout') || detectPreferredKeyboardLayout());
    const next = layout === 'alphabet' ? 'standard' : 'alphabet';
    const label = layout === 'alphabet' ? 'ABC' : 'QWERTY';
    const nextLabel = next === 'alphabet' ? 'ABC' : 'QWERTY';
    const hint = `${label} keys ready. Tap to try ${nextLabel}.`;
    toggle.innerHTML = getHeaderIconMarkup('keyboard');
    toggle.setAttribute('aria-pressed', layout === 'alphabet' ? 'true' : 'false');
    toggle.setAttribute('aria-label', hint);
    toggle.dataset.hint = hint;
    setHoverNoteForElement(toggle, hint);
    toggle.classList.toggle('is-wilson', false);
  }

  function syncCaseToggleUI() {
    normalizeHeaderControlLayout();
    const toggle = el('case-toggle-btn');
    if (!toggle) return;
    const mode = String(documentRef.documentElement.getAttribute('data-case') || prefs.caseMode || defaultPrefs.caseMode).toLowerCase();
    const isUpper = mode === 'upper';
    const hint = isUpper ? 'Uppercase letters are on. Tap for lowercase.' : 'Lowercase letters are on. Tap for uppercase.';
    toggle.innerHTML = '<span class="case-toggle-glyph" aria-hidden="true">Aa</span>';
    toggle.setAttribute('aria-pressed', isUpper ? 'true' : 'false');
    toggle.setAttribute('aria-label', hint);
    toggle.dataset.hint = hint;
    setHoverNoteForElement(toggle, hint);
  }

  function applyChunkTabsMode(mode) {
    const normalized = mode === 'on' || mode === 'off' ? mode : 'auto';
    const select = el('s-chunk-tabs');
    if (select && select.value !== normalized) select.value = normalized;
    documentRef.documentElement.setAttribute('data-chunk-tabs-mode', normalized);
    return normalized;
  }

  function applyAtmosphere(mode) {
    const allowed = new Set(['minimal', 'glow', 'spark']);
    const normalized = allowed.has(mode) ? mode : defaultPrefs.atmosphere;
    documentRef.documentElement.setAttribute('data-atmosphere', normalized);
    const select = el('s-atmosphere');
    if (select && select.value !== normalized) select.value = normalized;
    return normalized;
  }

  function applyTextSize(mode) {
    const normalized = normalizeTextSize(mode);
    documentRef.documentElement.setAttribute('data-text-size', normalized);
    const select = el('s-text-size');
    if (select && select.value !== normalized) select.value = normalized;
    return normalized;
  }

  function updateWilsonModeToggle() {
    const checkbox = el('s-wilson-mode');
    if (!checkbox) return;
    const boardStyle = documentRef.documentElement.getAttribute('data-board-style');
    const keyStyle = documentRef.documentElement.getAttribute('data-key-style');
    const keyboardLayout = documentRef.documentElement.getAttribute('data-keyboard-layout') || 'standard';
    checkbox.checked = boardStyle === 'soundcard' && keyStyle === 'soundcard' && keyboardLayout === 'wilson';
  }

  function applyWilsonMode(enabled) {
    if (enabled) {
      const boardStyle = applyBoardStyle('soundcard');
      const keyStyle = applyKeyStyle('soundcard');
      const keyboardLayout = applyKeyboardLayout('wilson');
      setPref('boardStyle', boardStyle);
      setPref('keyStyle', keyStyle);
      setPref('keyboardLayout', keyboardLayout);
      updateWilsonModeToggle();
      return;
    }
    const boardStyle = applyBoardStyle('card');
    const keyStyle = applyKeyStyle('classic');
    const keyboardLayout = applyKeyboardLayout('standard');
    setPref('boardStyle', boardStyle);
    setPref('keyStyle', keyStyle);
    setPref('keyboardLayout', keyboardLayout);
    updateWilsonModeToggle();
  }

  function isSorNotationEnabled() {
    const toggle = el('s-sor-notation');
    if (toggle) return !!toggle.checked;
    return (prefs.sorNotation || defaultPrefs.sorNotation) === 'on';
  }

  function normalizeVoicePracticeMode(mode) {
    const next = String(mode || '').toLowerCase();
    if (next === 'off' || next === 'required') return next;
    return 'optional';
  }

  function setVoicePracticeMode(mode, options = {}) {
    const normalized = studentRecordingEnabled ? normalizeVoicePracticeMode(mode) : 'off';
    const select = el('s-voice-task');
    if (select && select.value !== normalized) select.value = normalized;
    if (select) {
      select.disabled = !studentRecordingEnabled;
      select.setAttribute('aria-disabled', studentRecordingEnabled ? 'false' : 'true');
      if (!studentRecordingEnabled) select.title = 'Student recording is temporarily turned off.';
      else select.removeAttribute('title');
    }
    setPref('voicePractice', normalized);
    if (!(el('modal-overlay')?.classList.contains('hidden'))) {
      deps.updateVoicePracticePanel?.(wqGame?.getState?.());
      deps.syncRevealFocusModalSections?.();
    }
    deps.syncTeacherPresetButtons?.();
    if (options.toast) {
      showToast(
        normalized === 'required'
          ? 'Voice practice is required before moving on.'
          : normalized === 'off'
            ? 'Voice practice is off.'
            : 'Voice practice is optional for this round.'
      );
    }
    return normalized;
  }

  function areBoostPopupsEnabled() {
    if (!deps.midgameBoostEnabled) return false;
    const select = el('s-boost-popups');
    const value = String(select?.value || prefs.boostPopups || defaultPrefs.boostPopups).toLowerCase();
    return value !== 'off';
  }

  function detectTeacherPreset() {
    const current = {
      hint: getHintMode(),
      confidenceCoaching: isConfidenceCoachingEnabled() ? 'on' : 'off',
      revealFocus: deps.getRevealFocusMode?.() || 'on',
      voicePractice: getVoicePracticeMode(),
      voice: normalizeVoiceMode(el('s-voice')?.value || prefs.voice || defaultPrefs.voice),
      assessmentLock: isAssessmentLockEnabled() ? 'on' : 'off',
      boostPopups: areBoostPopupsEnabled() ? 'on' : 'off',
      confetti: String(el('s-confetti')?.value || prefs.confetti || defaultPrefs.confetti).toLowerCase() === 'off' ? 'off' : 'on',
      focus: String(el('setting-focus')?.value || prefs.focus || defaultPrefs.focus).trim() || defaultPrefs.focus,
      grade: String(el('s-grade')?.value || prefs.grade || defaultPrefs.grade).trim() || defaultPrefs.grade,
      lessonPack: deps.normalizeLessonPackId?.(prefs.lessonPack || el('s-lesson-pack')?.value || defaultPrefs.lessonPack)
    };
    return Object.entries(teacherPresets).find(([, preset]) =>
      current.hint === preset.hint &&
      current.confidenceCoaching === preset.confidenceCoaching &&
      current.revealFocus === preset.revealFocus &&
      current.voicePractice === preset.voicePractice &&
      current.voice === preset.voice &&
      current.assessmentLock === preset.assessmentLock &&
      current.boostPopups === preset.boostPopups &&
      current.confetti === preset.confetti &&
      (preset.focus ? current.focus === preset.focus : true) &&
      (preset.grade ? current.grade === preset.grade : true) &&
      (preset.lessonPack ? current.lessonPack === preset.lessonPack : true)
    )?.[0] || '';
  }

  function syncFirstRunGradeSelectFromPrefs() { return; }
  function applyFirstRunGradeSelection() { return; }
  function applyFirstRunPlayStyleSelection() { return; }

  function markDiagnosticsReset(reason = 'maintenance') {
    const row = { ts: Date.now(), reason: String(reason || 'maintenance').trim() || 'maintenance', build: deps.resolveBuildLabel?.() || 'local' };
    try { window.localStorage.setItem(deps.diagnosticsLastResetKey, JSON.stringify(row)); } catch {}
    return row;
  }

  function initRefreshLatestBanner() {
    const banner = el('refresh-latest-banner');
    if (!banner) return;
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }

  function rerunOnboardingSetup() {
    if (deps.isAssessmentRoundLocked?.()) {
      showAssessmentLockNotice('Finish this round before re-running setup.');
      return;
    }
    try { window.localStorage.removeItem(deps.firstRunSetupKey); } catch {}
    deps.setFirstRunSetupPending?.(true);
    deps.closeFocusSearchList?.();
    openFirstRunSetupModal();
    showToast('How-to card reopened.');
  }

  function populateVoiceSelector() {
    // Voice selection is handled by WQAudio internals.
  }

  function normalizeReviewWord(word) {
    return String(word || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  }

  function isTeamModeEnabled() {
    return String(el('s-team-mode')?.value || prefs.teamMode || defaultPrefs.teamMode).toLowerCase() !== 'off';
  }

  function isHelpSuppressedForTeamMode() {
    return isTeamModeEnabled();
  }

  function syncTeamHelpSuppressionUI() {
    const disabled = isHelpSuppressedForTeamMode();
    const clueBtn = el('phonics-clue-open-btn');
    const starterBtn = el('starter-word-open-btn');
    const informantBtn = el('support-choice-btn');
    [clueBtn, starterBtn, informantBtn].forEach((button) => {
      if (!button) return;
      button.disabled = disabled;
      button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      button.classList.toggle('is-disabled', disabled);
    });
    updateFocusHint();
    syncHeaderControlsVisibility();
  }

  return {
    applyAtmosphere,
    applyBoardStyle,
    applyChunkTabsMode,
    applyFeedback,
    applyKeyStyle,
    applyKeyboardLayout,
    applyKeyboardPreset,
    applyTextSize,
    applyWilsonMode,
    areBoostPopupsEnabled,
    detectTeacherPreset,
    getHeaderIconMarkup,
    initRefreshLatestBanner,
    isHelpSuppressedForTeamMode,
    isSorNotationEnabled,
    isTeamModeEnabled,
    markDiagnosticsReset,
    normalizeHeaderControlLayout,
    normalizeReviewWord,
    normalizeVoicePracticeMode,
    populateVoiceSelector,
    rerunOnboardingSetup,
    setVoicePracticeMode,
    syncCaseToggleUI,
    syncFirstRunGradeSelectFromPrefs,
    syncHeaderStaticIcons,
    syncKeyboardLayoutToggle,
    syncTeamHelpSuppressionUI,
    syncWritingStudioAvailability,
    updateWilsonModeToggle,
    applyFirstRunGradeSelection,
    applyFirstRunPlayStyleSelection
  };
}

window.createSurfaceSettingsRuntimeModule = createSurfaceSettingsRuntimeModule;
