/**
 * app-play-settings-runtime.js
 * Theme, reveal, hint, and play-style settings runtime for the play surface.
 */

function createPlaySettingsRuntimeModule(deps) {
  const {
    defaultPrefs = {},
    documentRef = null,
    el = () => null,
    emitTelemetry = () => {},
    getHintUnlockCopy = () => ({ message: '' }),
    getThemeDisplayLabel = (value) => String(value || ''),
    getThemeFallback = () => 'default',
    getVoicePracticeMode = () => 'optional',
    hideInformantHintCard = () => {},
    hideStarterWordCard = () => {},
    isMissionLabStandaloneMode = () => false,
    normalizePlayStyle = (value) => value,
    normalizeReportCompactMode = (value) => value,
    normalizeRevealAutoNext = (value) => value,
    normalizeRevealPacing = (value) => value,
    normalizeStarterWordMode = (value) => value,
    normalizeTheme = (value) => value,
    normalizeUiSkin = (value) => value,
    prefs = {},
    setHoverNoteForElement = () => {},
    setPref = () => {},
    showToast = () => {},
    syncHeaderControlsVisibility = () => {},
    syncMusicForTheme = () => {},
    syncSettingsModeCards = () => {},
    syncStarterWordLauncher = () => {},
    syncThemePreviewStripVisibility = () => {},
    updateFocusHint = () => {},
    updateNextActionLine = () => {},
    windowRef = null,
    WQGame = null
  } = deps || {};

  let lastAssessmentLockNoticeAt = 0;
  let focusSupportUnlockTimer = 0;
  let supportModalTimer = 0;

  function syncSettingsThemeName(themeId) {
    const labelEl = el('settings-theme-name');
    if (!labelEl) return;
    const normalized = normalizeTheme(themeId || documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    labelEl.textContent = getThemeDisplayLabel(normalized);
    labelEl.title = `Current theme: ${getThemeDisplayLabel(normalized)}`;
  }

  function syncBannerThemeName(themeId) {
    const themeIndicator = el('theme-name-indicator');
    if (!themeIndicator) return;
    const normalized = normalizeTheme(themeId || documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    const displayLabel = getThemeDisplayLabel(normalized);
    themeIndicator.textContent = displayLabel;
    themeIndicator.title = `Current theme: ${displayLabel}. Click to change theme or use Settings.`;
  }

  function syncWordQuestRootThemeClass(themeId) {
    const root = documentRef.body;
    if (!(root instanceof HTMLElement)) return;
    const normalized = normalizeTheme(themeId || documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    const themeClasses = Array.from(root.classList).filter((name) => name.startsWith('theme-'));
    themeClasses.forEach((name) => root.classList.remove(name));
    root.classList.add(`theme-${normalized}`);
  }

  function applyTheme(name) {
    const normalized = normalizeTheme(name, getThemeFallback());
    documentRef.documentElement.setAttribute('data-theme', normalized);
    syncSettingsThemeName(normalized);
    syncBannerThemeName(normalized);
    syncWordQuestRootThemeClass(normalized);
    syncMusicForTheme();
    return normalized;
  }

  function applyProjector(mode) {
    documentRef.documentElement.setAttribute('data-projector', mode);
  }

  function applyUiSkin(mode, options = {}) {
    const normalized = normalizeUiSkin(mode);
    documentRef.documentElement.setAttribute('data-ui-skin', normalized);
    const select = el('s-ui-skin');
    if (select && select.value !== normalized) select.value = normalized;
    if (options.persist !== false) setPref('uiSkin', normalized);
    return normalized;
  }

  function applyMotion(mode) {
    documentRef.documentElement.setAttribute('data-motion', mode);
  }

  function applyHint(mode) {
    documentRef.documentElement.setAttribute('data-hint', mode);
  }

  function applyReportCompactMode(mode, options = {}) {
    const normalized = normalizeReportCompactMode(mode);
    const enabled = normalized === 'on';
    const panel = el('teacher-session-panel');
    if (panel) panel.classList.toggle('is-compact-report', enabled);
    const toggle = el('s-report-compact');
    if (toggle) toggle.checked = enabled;
    if (options.persist !== false) setPref('reportCompact', normalized);
    return normalized;
  }

  function getRevealFocusMode() {
    const mode = String(el('s-reveal-focus')?.value || prefs.revealFocus || defaultPrefs.revealFocus).toLowerCase();
    return mode === 'off' ? 'off' : 'on';
  }

  function getRevealPacingMode() {
    return normalizeRevealPacing(el('s-reveal-pacing')?.value || prefs.revealPacing || defaultPrefs.revealPacing);
  }

  function getRevealAutoNextSeconds() {
    const mode = normalizeRevealAutoNext(el('s-reveal-auto-next')?.value || prefs.revealAutoNext || defaultPrefs.revealAutoNext);
    if (mode === 'off') return 0;
    return Number.parseInt(mode, 10) || 0;
  }

  function syncRevealFocusModalSections() {
    const focusMode = getRevealFocusMode();
    const practiceDetails = el('modal-practice-details');
    if (practiceDetails && !practiceDetails.classList.contains('hidden')) {
      const requiredPractice = getVoicePracticeMode() === 'required' && !windowRef.voiceTakeComplete;
      practiceDetails.open = requiredPractice || focusMode === 'off';
    }
    const details = el('modal-more-details');
    if (details && !details.classList.contains('hidden')) details.open = focusMode === 'off';
  }

  function applyRevealFocusMode(mode, options = {}) {
    const normalized = mode === 'off' ? 'off' : 'on';
    const select = el('s-reveal-focus');
    if (select && select.value !== normalized) select.value = normalized;
    documentRef.documentElement.setAttribute('data-reveal-focus', normalized);
    if (options.persist !== false) setPref('revealFocus', normalized);
    if (!(el('modal-overlay')?.classList.contains('hidden'))) syncRevealFocusModalSections();
    return normalized;
  }

  function isAssessmentLockEnabled() {
    const toggle = el('s-assessment-lock');
    if (toggle) return !!toggle.checked;
    return (prefs.assessmentLock || defaultPrefs.assessmentLock) === 'on';
  }

  function isAssessmentRoundLocked() {
    if (!isAssessmentLockEnabled()) return false;
    const state = WQGame?.getState?.();
    return Boolean(state?.word && !state?.gameOver);
  }

  function showAssessmentLockNotice(message = 'Assessment lock is on until this round ends.') {
    const now = Date.now();
    if (now - lastAssessmentLockNoticeAt < 1200) return;
    lastAssessmentLockNoticeAt = now;
    showToast(message);
  }

  function syncAssessmentLockRuntime(options = {}) {
    const locked = isAssessmentRoundLocked();
    const settingsBtn = el('settings-btn');
    if (settingsBtn) {
      settingsBtn.classList.toggle('is-locked', locked);
      settingsBtn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      setHoverNoteForElement(settingsBtn, locked ? 'Assessment lock: settings unavailable until round ends.' : 'Settings');
    }
    if (locked) {
      el('settings-panel')?.classList.add('hidden');
      if (options.closeFocus !== false) deps.closeFocusSearchList?.();
      syncHeaderControlsVisibility();
    } else {
      syncThemePreviewStripVisibility();
    }
  }

  function getHintMode() {
    const mode = String(el('s-hint')?.value || prefs.hint || defaultPrefs.hint).toLowerCase();
    return mode === 'off' ? 'off' : 'on';
  }

  function isConfidenceCoachingEnabled() {
    const toggle = el('s-confidence-coaching');
    if (toggle) return !!toggle.checked;
    return String(prefs.confidenceCoaching || defaultPrefs.confidenceCoaching).toLowerCase() !== 'off';
  }

  function setConfidenceCoachingMode(enabled, options = {}) {
    const normalized = enabled ? 'on' : 'off';
    const toggle = el('s-confidence-coaching');
    if (toggle) toggle.checked = normalized === 'on';
    setPref('confidenceCoaching', normalized);
    if (normalized === 'off') hideInformantHintCard();
    updateNextActionLine();
    if (options.toast) showToast(normalized === 'on' ? 'Confidence coaching is on.' : 'Confidence coaching is off.');
  }

  function syncHintToggleUI(mode = getHintMode()) {
    const toggle = el('focus-hint-toggle');
    if (!toggle) return;
    const enabled = mode !== 'off';
    const playStyle = normalizePlayStyle(el('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle);
    const listening = playStyle === 'listening';
    const state = WQGame?.getState?.() || {};
    const minimumGuesses = deps.getHintUnlockMinimum?.(playStyle) || 1;
    const guessNoun = minimumGuesses === 1 ? 'guess' : 'guesses';
    toggle.textContent = listening ? 'Need Sound?' : 'Need Hint?';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', listening ? 'Open optional sound help for listening and spelling' : 'Open optional clue hint');
    toggle.setAttribute('title', listening ? 'Need help hearing the word or meaning?' : 'Need a clue for this word?');
    setHoverNoteForElement(toggle, enabled ? (listening ? `Optional sound support. Unlocks after ${minimumGuesses} submitted ${guessNoun}.` : `Optional clue support. Unlocks after ${minimumGuesses} submitted ${guessNoun}.`) : 'Hint cues are off in settings, but you can still ask for support');
    toggle.classList.toggle('is-off', !enabled);
  }

  function setHintMode(mode, options = {}) {
    const normalized = mode === 'off' ? 'off' : 'on';
    const select = el('s-hint');
    if (select && select.value !== normalized) select.value = normalized;
    setPref('hint', normalized);
    applyHint(normalized);
    syncHintToggleUI(normalized);
    updateFocusHint();
    const state = WQGame?.getState?.();
    if (state?.wordLength && state?.maxGuesses && typeof WQUI?.calcLayout === 'function') WQUI.calcLayout(state.wordLength, state.maxGuesses);
    if (options.toast) showToast(normalized === 'off' ? 'Hint cues are off.' : 'Hint cues are on.');
    updateNextActionLine();
  }

  function syncPlayStyleToggleUI(mode = normalizePlayStyle(el('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle)) {
    const toggle = el('play-style-toggle');
    if (!toggle) return;
    const listening = mode === 'listening';
    const gradeLabel = deps.formatGradeBandInlineLabel?.(el('s-grade')?.value || prefs.grade || defaultPrefs.grade) || '';
    const themeLabel = getThemeDisplayLabel(documentRef.documentElement.getAttribute('data-theme'));
    toggle.innerHTML = `<span class="play-style-toggle-label">Game Mode</span><span class="play-style-toggle-pills" aria-hidden="true"><span class="play-style-pill is-meta">${gradeLabel}</span><span class="play-style-pill ${listening ? 'is-active' : ''}">${listening ? 'Listen & Spell' : 'Guess & Check'}</span><span class="play-style-pill is-meta">${themeLabel}</span></span>`;
    toggle.setAttribute('aria-pressed', listening ? 'true' : 'false');
    toggle.classList.toggle('is-listening', listening);
    toggle.setAttribute('aria-label', listening ? `Game mode. Grade ${gradeLabel}, Listen and Spell mode, theme ${themeLabel}.` : `Game mode. Grade ${gradeLabel}, Guess and Check mode, theme ${themeLabel}.`);
    setHoverNoteForElement(toggle, 'Switch between Guess & Check and Listen & Spell.');
  }

  function syncSettingsModeCardsLocal(mode = normalizePlayStyle(el('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle)) {
    documentRef.querySelectorAll('[data-settings-play-style-choice]').forEach((button) => {
      const active = button.getAttribute('data-settings-play-style-choice') === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function clearFocusSupportUnlockTimer() {
    if (!focusSupportUnlockTimer) return;
    window.clearTimeout(focusSupportUnlockTimer);
    focusSupportUnlockTimer = 0;
  }

  function scheduleFocusSupportUnlock() {
    clearFocusSupportUnlockTimer();
    if (windowRef.focusSupportUnlockedByMiss) return;
    const waitMs = Math.max(0, windowRef.focusSupportUnlockAt - Date.now());
    focusSupportUnlockTimer = window.setTimeout(() => {
      syncHeaderClueLauncherUI();
      syncStarterWordLauncher();
    }, waitMs + 40);
  }

  function areFocusSupportsUnlocked() {
    if (windowRef.focusSupportUnlockedByMiss) return true;
    const state = WQGame?.getState?.() || {};
    if (!state.word || state.gameOver) return true;
    return Date.now() >= windowRef.focusSupportUnlockAt;
  }

  function clearSupportModalTimer() {
    if (supportModalTimer) {
      window.clearTimeout(supportModalTimer);
      supportModalTimer = 0;
    }
  }

  function scheduleSupportModalTimer() {
    clearSupportModalTimer();
    const waitMs = Math.max(0, Number(windowRef.focusSupportEligibleAt || 0) - Date.now());
    supportModalTimer = window.setTimeout(() => {
      if (windowRef.focusSupportUnlockedByMiss && !windowRef.currentRoundSupportPromptShown) deps.showSupportChoiceCard?.();
    }, waitMs);
  }

  function syncHeaderClueLauncherUI(mode = normalizePlayStyle(el('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle)) {
    const button = el('phonics-clue-open-btn');
    const focusButton = el('focus-help-btn');
    if (!button) return;
    const listening = mode === 'listening';
    const helpSuppressed = deps.isHelpSuppressedForTeamMode?.();
    button.innerHTML = `<span class="quick-btn-label">Clue</span>${deps.getHeaderIconMarkup?.('puzzle') || ''}`;
    setHoverNoteForElement(button, helpSuppressed ? 'Clue support is off during team mode.' : listening ? 'Open listening coach support.' : 'Open Clue Sprint for detective-style clue practice.');
    button.setAttribute('aria-label', listening ? 'Open listening coach support' : 'Open Clue Sprint for detective clue practice');
    button.classList.remove('hidden');
    if (helpSuppressed) button.classList.add('hidden');
    if (focusButton) {
      const missionMode = deps.isMissionLabStandaloneMode?.();
      const unlocked = areFocusSupportsUnlocked();
      const state = WQGame?.getState?.() || {};
      const unlockCopy = getHintUnlockCopy(mode, Array.isArray(state.guesses) ? state.guesses.length : 0);
      focusButton.classList.toggle('hidden', missionMode);
      const disabled = helpSuppressed || !unlocked;
      focusButton.disabled = disabled;
      focusButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      focusButton.classList.toggle('is-locked', disabled);
      focusButton.setAttribute('aria-label', 'Open help options');
      focusButton.setAttribute('title', helpSuppressed ? 'Help options are off during team mode.' : !unlocked ? (unlockCopy.message || 'Help options unlock after a miss.') : 'Open clue and starter help options.');
      setHoverNoteForElement(focusButton, helpSuppressed ? 'Help options are off during team mode.' : !unlocked ? (unlockCopy.message || 'Help options unlock after a miss.') : 'Open clue and starter help options.');
    }
  }

  function getStarterWordMode() {
    return 'on_demand';
  }

  function getStarterWordAutoThreshold(mode = getStarterWordMode()) {
    if (mode === 'after_2') return 2;
    if (mode === 'after_3') return 3;
    return 0;
  }

  function syncStarterWordLauncherUI(mode = getStarterWordMode()) {
    const button = el('starter-word-open-btn');
    const focusButton = el('focus-help-btn');
    if (!button) return;
    button.innerHTML = `<span class="quick-btn-label">Need Ideas</span>${deps.getHeaderIconMarkup?.('bulb') || ''}`;
    const normalized = deps.normalizeStarterWordMode?.(mode) || 'on_demand';
    const missionMode = deps.isMissionLabStandaloneMode?.();
    const helpSuppressed = deps.isHelpSuppressedForTeamMode?.();
    const hidden = normalized === 'off' || missionMode;
    const unlocked = areFocusSupportsUnlocked();
    button.classList.add('hidden');
    if (focusButton) {
      focusButton.classList.toggle('hidden', hidden);
      const disabled = hidden ? true : (helpSuppressed || !unlocked);
      focusButton.disabled = disabled;
      focusButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      focusButton.classList.toggle('is-locked', !hidden && disabled);
    }
  }

  function applyStarterWordMode(mode, options = {}) {
    const normalized = normalizeStarterWordMode(mode);
    const select = el('s-starter-words');
    if (select && select.value !== normalized) select.value = normalized;
    if (options.persist !== false) setPref('starterWords', normalized);
    syncStarterWordLauncherUI(normalized);
    if (normalized === 'off') hideStarterWordCard();
    return normalized;
  }

  function hideListeningModeExplainer() {
    el('listening-mode-overlay')?.classList.add('hidden');
  }

  function showListeningModeExplainer() {
    hideListeningModeExplainer();
  }

  function syncGameplayAudioStrip(mode = normalizePlayStyle(el('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle)) {
    const gameplayAudio = documentRef.querySelector('.gameplay-audio');
    const listeningMode = mode === 'listening' && !isMissionLabStandaloneMode();
    const modeBanner = el('play-style-banner');
    if (modeBanner) {
      modeBanner.textContent = '';
      modeBanner.classList.add('hidden');
      modeBanner.setAttribute('aria-hidden', 'true');
    }
    const hearWordBtn = el('g-hear-word');
    const hearWordLabel = el('g-hear-word-label');
    if (hearWordLabel) hearWordLabel.textContent = listeningMode ? 'Listen to Word' : 'Hear Word';
    if (hearWordBtn) {
      hearWordBtn.setAttribute('title', listeningMode ? 'Listen to the target word audio' : 'Hear target word audio');
      hearWordBtn.setAttribute('aria-label', listeningMode ? 'Listen to the target word audio' : 'Hear target word audio');
    }
    const hearDefBtn = el('g-hear-def');
    const hearDefLabel = el('g-hear-def-label');
    if (hearDefLabel) hearDefLabel.textContent = 'Listen to Definition';
    if (hearDefBtn) {
      if (listeningMode) {
        hearDefBtn.classList.remove('hidden');
        hearDefBtn.style.display = '';
      } else {
        hearDefBtn.classList.add('hidden');
        hearDefBtn.style.display = 'none';
      }
      hearDefBtn.setAttribute('title', 'Listen to the definition audio');
      hearDefBtn.setAttribute('aria-label', 'Listen to the definition audio');
    }
    const focusHintToggle = el('focus-hint-toggle');
    if (focusHintToggle) focusHintToggle.classList.toggle('hidden', listeningMode);
    if (!gameplayAudio) {
      syncHintToggleUI(getHintMode());
      return;
    }
    gameplayAudio.classList.toggle('hidden', !listeningMode);
    gameplayAudio.setAttribute('aria-hidden', listeningMode ? 'false' : 'true');
    syncHintToggleUI(getHintMode());
  }

  function applyPlayStyle(mode, options = {}) {
    const beforeMode = normalizePlayStyle(documentRef.documentElement.getAttribute('data-play-style') || prefs.playStyle || defaultPrefs.playStyle);
    const normalized = normalizePlayStyle(mode);
    documentRef.documentElement.setAttribute('data-play-style', normalized);
    const select = el('s-play-style');
    if (select && select.value !== normalized) select.value = normalized;
    syncPlayStyleToggleUI(normalized);
    syncSettingsModeCardsLocal(normalized);
    syncHeaderClueLauncherUI(normalized);
    syncStarterWordLauncherUI();
    syncGameplayAudioStrip(normalized);
    if (options.persist !== false) setPref('playStyle', normalized);
    if (beforeMode !== normalized) {
      emitTelemetry('wq_mode_change', {
        from_mode: beforeMode,
        to_mode: normalized
      });
      if (normalized === 'listening') showListeningModeExplainer();
      else hideListeningModeExplainer();
    }
    updateNextActionLine();
    return normalized;
  }

  return Object.freeze({
    applyHint,
    applyMotion,
    applyPlayStyle,
    applyProjector,
    applyReportCompactMode,
    applyRevealFocusMode,
    applyStarterWordMode,
    applyTheme,
    applyUiSkin,
    clearFocusSupportUnlockTimer,
    clearSupportModalTimer,
    getHintMode,
    getRevealAutoNextSeconds,
    getRevealFocusMode,
    getRevealPacingMode,
    isAssessmentLockEnabled,
    isAssessmentRoundLocked,
    isConfidenceCoachingEnabled,
    scheduleFocusSupportUnlock,
    scheduleSupportModalTimer,
    setConfidenceCoachingMode,
    setHintMode,
    showAssessmentLockNotice,
    syncAssessmentLockRuntime,
    syncBannerThemeName,
    syncGameplayAudioStrip,
    syncHeaderClueLauncherUI,
    syncHintToggleUI,
    syncPlayStyleToggleUI,
    syncRevealFocusModalSections,
    syncSettingsModeCardsLocal,
    syncSettingsThemeName,
    syncStarterWordLauncherUI,
    syncWordQuestRootThemeClass
  });
}

window.createPlaySettingsRuntimeModule = createPlaySettingsRuntimeModule;
