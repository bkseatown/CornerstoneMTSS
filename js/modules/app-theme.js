/**
 * app-theme.js
 * Theme, projector, motion, hint cards, keyboard sync
 */

import { prefs, setPref } from './app-prefs.js';
import { DEFAULT_PREFS } from './app-constants.js';

  // ─── 4. Theme / projector / motion helpers ──────────
  function getThemeDisplayLabel(themeId) {
    const normalized = normalizeTheme(themeId, getThemeFallback());
    if (ThemeRegistry && typeof ThemeRegistry.getLabel === 'function') {
      return ThemeRegistry.getLabel(normalized);
    }
    return normalized;
  }

  function syncSettingsThemeName(themeId) {
    const labelEl = _el('settings-theme-name');
    if (!labelEl) return;
    const normalized = normalizeTheme(themeId || document.documentElement.getAttribute('data-theme'), getThemeFallback());
    labelEl.textContent = getThemeDisplayLabel(normalized);
    labelEl.title = `Current theme: ${getThemeDisplayLabel(normalized)}`;
  }

  function syncBannerThemeName(themeId) {
    const themeIndicator = _el('theme-name-indicator');
    if (!themeIndicator) return;
    const normalized = normalizeTheme(themeId || document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const displayLabel = getThemeDisplayLabel(normalized);
    themeIndicator.textContent = displayLabel;
    themeIndicator.title = `Current theme: ${displayLabel}. Click to change theme or use Settings.`;
  }

  function syncWordQuestRootThemeClass(themeId) {
    const root = document.body;
    if (!(root instanceof HTMLElement)) return;
    const normalized = normalizeTheme(themeId || document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const themeClasses = Array.from(root.classList).filter((name) => name.startsWith('theme-'));
    themeClasses.forEach((name) => root.classList.remove(name));
    root.classList.add(`theme-${normalized}`);
  }

  function applyTheme(name) {
    const normalized = normalizeTheme(name, getThemeFallback());
    const beforeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    document.documentElement.setAttribute('data-theme', normalized);
    document.documentElement.setAttribute('data-theme-family', getThemeFamily(normalized));
    const select = _el('s-theme');
    if (select && select.value !== normalized) select.value = normalized;
    syncSettingsThemeName(normalized);
    syncBannerThemeName(normalized);
    syncWordQuestRootThemeClass(normalized);
    syncMusicForTheme();
    if (beforeTheme !== normalized) {
      emitTelemetry('wq_theme_change', {
        from_theme: beforeTheme,
        to_theme: normalized
      });
    }
    return normalized;
  }

  function applyProjector(mode) {
    document.documentElement.setAttribute('data-projector', mode);
  }

  function applyUiSkin(mode, options = {}) {
    const normalized = normalizeUiSkin(mode);
    document.documentElement.setAttribute('data-ui-skin', normalized);
    const select = _el('s-ui-skin');
    if (select && select.value !== normalized) select.value = normalized;
    if (options.persist !== false) setPref('uiSkin', normalized);
    return normalized;
  }

  function applyMotion(mode) {
    document.documentElement.setAttribute('data-motion', mode);
  }

  function applyHint(mode) {
    document.documentElement.setAttribute('data-hint', mode);
  }

  function applyReportCompactMode(mode, options = {}) {
    const normalized = normalizeReportCompactMode(mode);
    const enabled = normalized === 'on';
    const panel = _el('teacher-session-panel');
    if (panel) panel.classList.toggle('is-compact-report', enabled);
    const toggle = _el('s-report-compact');
    if (toggle) toggle.checked = enabled;
    if (options.persist !== false) setPref('reportCompact', normalized);
    return normalized;
  }

  function getRevealFocusMode() {
    const mode = String(_el('s-reveal-focus')?.value || prefs.revealFocus || DEFAULT_PREFS.revealFocus).toLowerCase();
    return mode === 'off' ? 'off' : 'on';
  }

  function getRevealPacingMode() {
    return normalizeRevealPacing(_el('s-reveal-pacing')?.value || prefs.revealPacing || DEFAULT_PREFS.revealPacing);
  }

  function getRevealAutoNextSeconds() {
    const mode = normalizeRevealAutoNext(_el('s-reveal-auto-next')?.value || prefs.revealAutoNext || DEFAULT_PREFS.revealAutoNext);
    if (mode === 'off') return 0;
    return Number.parseInt(mode, 10) || 0;
  }

  function syncRevealFocusModalSections() {
    const focusMode = getRevealFocusMode();
    const practiceDetails = _el('modal-practice-details');
    if (practiceDetails && !practiceDetails.classList.contains('hidden')) {
      const requiredPractice = getVoicePracticeMode() === 'required' && !voiceTakeComplete;
      practiceDetails.open = requiredPractice || focusMode === 'off';
    }
    const details = _el('modal-more-details');
    if (details && !details.classList.contains('hidden')) {
      details.open = focusMode === 'off';
    }
  }

  function applyRevealFocusMode(mode, options = {}) {
    const normalized = mode === 'off' ? 'off' : 'on';
    const select = _el('s-reveal-focus');
    if (select && select.value !== normalized) select.value = normalized;
    document.documentElement.setAttribute('data-reveal-focus', normalized);
    if (options.persist !== false) setPref('revealFocus', normalized);
    if (!(_el('modal-overlay')?.classList.contains('hidden'))) {
      syncRevealFocusModalSections();
    }
    return normalized;
  }

  var lastAssessmentLockNoticeAt = 0;

  function isAssessmentLockEnabled() {
    const toggle = _el('s-assessment-lock');
    if (toggle) return !!toggle.checked;
    return (prefs.assessmentLock || DEFAULT_PREFS.assessmentLock) === 'on';
  }

  function isAssessmentRoundLocked() {
    if (!isAssessmentLockEnabled()) return false;
    const state = WQGame.getState?.();
    return Boolean(state?.word && !state?.gameOver);
  }

  function showAssessmentLockNotice(message = 'Assessment lock is on until this round ends.') {
    const now = Date.now();
    if (now - lastAssessmentLockNoticeAt < 1200) return;
    lastAssessmentLockNoticeAt = now;
    WQUI.showToast(message);
  }

  function syncAssessmentLockRuntime(options = {}) {
    const locked = isAssessmentRoundLocked();
    const settingsBtn = _el('settings-btn');
    if (settingsBtn) {
      settingsBtn.classList.toggle('is-locked', locked);
      settingsBtn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      setHoverNoteForElement(
        settingsBtn,
        locked
          ? 'Assessment lock: settings unavailable until round ends.'
          : 'Settings'
      );
    }
    if (locked) {
      _el('settings-panel')?.classList.add('hidden');
      if (options.closeFocus !== false) closeFocusSearchList();
      syncHeaderControlsVisibility();
    } else {
      syncThemePreviewStripVisibility();
    }
  }

  function getHintMode() {
    const mode = String(_el('s-hint')?.value || prefs.hint || DEFAULT_PREFS.hint).toLowerCase();
    return mode === 'off' ? 'off' : 'on';
  }

  function isConfidenceCoachingEnabled() {
    const toggle = _el('s-confidence-coaching');
    if (toggle) return !!toggle.checked;
    return String(prefs.confidenceCoaching || DEFAULT_PREFS.confidenceCoaching).toLowerCase() !== 'off';
  }

  function setConfidenceCoachingMode(enabled, options = {}) {
    const normalized = enabled ? 'on' : 'off';
    const toggle = _el('s-confidence-coaching');
    if (toggle) toggle.checked = normalized === 'on';
    setPref('confidenceCoaching', normalized);
    if (normalized === 'off') hideInformantHintCard();
    updateNextActionLine();
    if (options.toast) {
      WQUI.showToast(normalized === 'on'
        ? 'Confidence coaching is on.'
        : 'Confidence coaching is off.');
    }
  }

  function syncHintToggleUI(mode = getHintMode()) {
    const toggle = _el('focus-hint-toggle');
    if (!toggle) return;
    const enabled = mode !== 'off';
    const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const listening = playStyle === 'listening';
    const minimumGuesses = getHintUnlockMinimum(playStyle);
    const guessNoun = minimumGuesses === 1 ? 'guess' : 'guesses';
    toggle.textContent = listening ? 'Need Sound?' : 'Need Hint?';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', listening
      ? 'Open optional sound help for listening and spelling'
      : 'Open optional clue hint');
    toggle.setAttribute('title', listening
      ? 'Need help hearing the word or meaning?'
      : 'Need a clue for this word?');
    setHoverNoteForElement(
      toggle,
      enabled
        ? (listening
            ? `Optional sound support. Unlocks after ${minimumGuesses} submitted ${guessNoun}.`
            : `Optional clue support. Unlocks after ${minimumGuesses} submitted ${guessNoun}.`)
        : 'Hint cues are off in settings, but you can still ask for support'
    );
    toggle.classList.toggle('is-off', !enabled);
  }

  function setHintMode(mode, options = {}) {
    const normalized = mode === 'off' ? 'off' : 'on';
    const select = _el('s-hint');
    if (select && select.value !== normalized) select.value = normalized;
    setPref('hint', normalized);
    applyHint(normalized);
    syncHintToggleUI(normalized);
    updateFocusHint();
    const state = WQGame.getState?.();
    if (state?.wordLength && state?.maxGuesses && typeof WQUI.calcLayout === 'function') {
      WQUI.calcLayout(state.wordLength, state.maxGuesses);
    }
    if (options.toast) {
      WQUI.showToast(normalized === 'off' ? 'Hint cues are off.' : 'Hint cues are on.');
    }
    updateNextActionLine();
  }

  function normalizePlayStyle(mode) {
    return String(mode || '').toLowerCase() === 'listening' ? 'listening' : 'detective';
  }

  function syncPlayStyleToggleUI(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    const toggle = _el('play-style-toggle');
    if (!toggle) return;
    const listening = mode === 'listening';
    const gradeLabel = formatGradeBandInlineLabel(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade);
    const themeLabel = getThemeDisplayLabel(document.documentElement.getAttribute('data-theme'));
    toggle.innerHTML = `
      <span class="play-style-toggle-label">Game Mode</span>
      <span class="play-style-toggle-pills" aria-hidden="true">
        <span class="play-style-pill is-meta">${gradeLabel}</span>
        <span class="play-style-pill ${listening ? 'is-active' : ''}">${listening ? 'Listen & Spell' : 'Guess & Check'}</span>
        <span class="play-style-pill is-meta">${themeLabel}</span>
      </span>
    `;
    toggle.setAttribute('aria-pressed', listening ? 'true' : 'false');
    toggle.classList.toggle('is-listening', listening);
    toggle.setAttribute('aria-label', listening
      ? `Game mode. Grade ${gradeLabel}, Listen and Spell mode, theme ${themeLabel}.`
      : `Game mode. Grade ${gradeLabel}, Guess and Check mode, theme ${themeLabel}.`);
    setHoverNoteForElement(
      toggle,
      'Switch between Guess & Check and Listen & Spell.'
    );
  }

  function syncSettingsModeCards(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    document.querySelectorAll('[data-settings-play-style-choice]').forEach((button) => {
      const active = button.getAttribute('data-settings-play-style-choice') === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function clearFocusSupportUnlockTimer() {
    if (!focusSupportUnlockTimer) return;
    clearTimeout(focusSupportUnlockTimer);
    focusSupportUnlockTimer = 0;
  }

  function scheduleFocusSupportUnlock() {
    clearFocusSupportUnlockTimer();
    if (focusSupportUnlockedByMiss) return;
    const waitMs = Math.max(0, focusSupportUnlockAt - Date.now());
    focusSupportUnlockTimer = setTimeout(() => {
      syncHeaderClueLauncherUI();
      syncStarterWordLauncherUI();
    }, waitMs + 40);
  }

  function areFocusSupportsUnlocked() {
    if (focusSupportUnlockedByMiss) return true;
    const state = WQGame.getState?.() || {};
    if (!state.word || state.gameOver) return true;
    return Date.now() >= focusSupportUnlockAt;
  }

  function clearSupportModalTimer() {
    if (supportModalTimer) {
      clearTimeout(supportModalTimer);
      supportModalTimer = 0;
    }
  }

  function scheduleSupportModalTimer() {
    clearSupportModalTimer();
    // Show support modal 30 seconds after game starts, but only if a wrong guess has been made
    const waitMs = Math.max(0, (gameStartedAt + 30000) - Date.now());
    supportModalTimer = setTimeout(() => {
      if (focusSupportUnlockedByMiss && !currentRoundSupportPromptShown) {
        showSupportChoiceCard();
      }
    }, waitMs);
  }

  function syncHeaderClueLauncherUI(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    const button = _el('phonics-clue-open-btn');
    const focusButton = _el('focus-help-btn');
    if (!button) return;
    const listening = mode === 'listening';
    const helpSuppressed = isHelpSuppressedForTeamMode();
    button.innerHTML = `<span class="quick-btn-label">Clue</span>${getHeaderIconMarkup('puzzle')}`;
    setHoverNoteForElement(
      button,
      helpSuppressed
        ? 'Clue support is off during team mode.'
        : listening
        ? 'Open listening coach support.'
        : 'Open Clue Sprint for detective-style clue practice.'
    );
    button.setAttribute('aria-label', listening
      ? 'Open listening coach support'
      : 'Open Clue Sprint for detective clue practice');
    // Show clue button unless help is suppressed (e.g., during team mode)
    button.classList.remove('hidden');  // Always show the button by default
    if (helpSuppressed) {
      button.classList.add('hidden');
    }
    if (focusButton) {
      const missionMode = isMissionLabStandaloneMode();
      const unlocked = areFocusSupportsUnlocked();
      const state = WQGame.getState?.() || {};
      const unlockCopy = getHintUnlockCopy(mode, Array.isArray(state.guesses) ? state.guesses.length : 0);
      focusButton.classList.toggle('hidden', missionMode);
      const disabled = helpSuppressed || !unlocked;
      focusButton.disabled = disabled;
      focusButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      focusButton.classList.toggle('is-locked', disabled);
      focusButton.setAttribute('aria-label', 'Open help options');
      focusButton.setAttribute(
        'title',
        helpSuppressed
          ? 'Help options are off during team mode.'
          : !unlocked
          ? (unlockCopy.message || 'Help options unlock after a miss.')
          : 'Open clue and starter help options.'
      );
      setHoverNoteForElement(
        focusButton,
        helpSuppressed
          ? 'Help options are off during team mode.'
          : !unlocked
          ? (unlockCopy.message || 'Help options unlock after a miss.')
          : 'Open clue and starter help options.'
      );
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
    const button = _el('starter-word-open-btn');
    const focusButton = _el('focus-help-btn');
    if (!button) return;
    button.innerHTML = `<span class="quick-btn-label">Need Ideas</span>${getHeaderIconMarkup('bulb')}`;
    const normalized = normalizeStarterWordMode(mode);
    const missionMode = isMissionLabStandaloneMode();
    const helpSuppressed = isHelpSuppressedForTeamMode();
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
    if (hidden) return;
    button.setAttribute('aria-label', 'Show try these words list');
    button.title = 'Show starter word ideas.';
    setHoverNoteForElement(
      button,
      helpSuppressed
        ? 'Starter ideas are off during team mode.'
        : 'Starter words are available on demand.'
    );
    if (focusButton) {
      focusButton.setAttribute('aria-label', 'Open help options');
      const state = WQGame.getState?.() || {};
      const unlockCopy = getHintUnlockCopy(
        normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle),
        Array.isArray(state.guesses) ? state.guesses.length : 0
      );
      focusButton.setAttribute(
        'title',
        helpSuppressed
          ? 'Help options are off during team mode.'
          : !unlocked
          ? (unlockCopy.message || 'Help options unlock after a miss.')
          : 'Open clue and starter help options.'
      );
      setHoverNoteForElement(
        focusButton,
        helpSuppressed
          ? 'Help options are off during team mode.'
          : !unlocked
          ? (unlockCopy.message || 'Help options unlock after a miss.')
          : 'Open clue and starter help options.'
      );
    }
  }

  function applyStarterWordMode(mode, options = {}) {
    const normalized = normalizeStarterWordMode(mode);
    const select = _el('s-starter-words');
    if (select && select.value !== normalized) select.value = normalized;
    if (options.persist !== false) setPref('starterWords', normalized);
    syncStarterWordLauncherUI(normalized);
    if (normalized === 'off') hideStarterWordCard();
    return normalized;
  }

  function hideListeningModeExplainer() {
    _el('listening-mode-overlay')?.classList.add('hidden');
  }

  function showListeningModeExplainer() {
    // Disabled by request: avoid interruptive explainer popup.
    hideListeningModeExplainer();
  }

  function syncGameplayAudioStrip(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    const gameplayAudio = document.querySelector('.gameplay-audio');
    const listeningMode = mode === 'listening' && !isMissionLabStandaloneMode();
    const modeBanner = _el('play-style-banner');
    if (modeBanner) {
      modeBanner.textContent = '';
      modeBanner.classList.add('hidden');
      modeBanner.setAttribute('aria-hidden', 'true');
    }
    const hearWordBtn = _el('g-hear-word');
    const hearWordLabel = _el('g-hear-word-label');
    if (hearWordLabel) hearWordLabel.textContent = listeningMode ? 'Listen to Word' : 'Hear Word';
    if (hearWordBtn) {
      hearWordBtn.setAttribute('title', listeningMode ? 'Listen to the target word audio' : 'Hear target word audio');
      hearWordBtn.setAttribute('aria-label', listeningMode ? 'Listen to the target word audio' : 'Hear target word audio');
    }
    const hearDefBtn = _el('g-hear-def');
    const hearDefLabel = _el('g-hear-def-label');
    if (hearDefLabel) hearDefLabel.textContent = 'Listen to Definition';
    if (hearDefBtn) {
      // Ensure button is visible in listening/spelling mode
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
    const focusHintToggle = _el('focus-hint-toggle');
    if (focusHintToggle) {
      focusHintToggle.classList.toggle('hidden', listeningMode);
    }
    if (!gameplayAudio) {
      syncHintToggleUI(getHintMode());
      return;
    }
    gameplayAudio.classList.toggle('hidden', !listeningMode);
    gameplayAudio.setAttribute('aria-hidden', listeningMode ? 'false' : 'true');
    syncHintToggleUI(getHintMode());
  }

  function applyPlayStyle(mode, options = {}) {
    const beforeMode = normalizePlayStyle(document.documentElement.getAttribute('data-play-style') || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const normalized = normalizePlayStyle(mode);
    document.documentElement.setAttribute('data-play-style', normalized);
    const select = _el('s-play-style');
    if (select && select.value !== normalized) select.value = normalized;
    syncPlayStyleToggleUI(normalized);
    syncSettingsModeCards(normalized);
    syncHeaderClueLauncherUI(normalized);
    syncStarterWordLauncherUI();
    syncGameplayAudioStrip(normalized);
    if (options.persist !== false) setPref('playStyle', normalized);
    if (beforeMode !== normalized) {
      emitTelemetry('wq_mode_change', {
        from_mode: beforeMode,
        to_mode: normalized
      });
      if (normalized === 'listening') {
        showListeningModeExplainer();
      } else {
        hideListeningModeExplainer();
      }
    }
    updateNextActionLine();
    return normalized;
  }

  function isAnyOverlayModalOpen() {
    const revealOpen = !_el('modal-overlay')?.classList.contains('hidden');
    const missionOpen = !_el('challenge-modal')?.classList.contains('hidden');
    const setupOpen = !_el('first-run-setup-modal')?.classList.contains('hidden');
    const listeningOpen = !_el('listening-mode-overlay')?.classList.contains('hidden');
    return !!(revealOpen || missionOpen || setupOpen || listeningOpen);
  }

  function hideInformantHintCard() {
    clearStarterCoachTimer();
    clearInformantHintHideTimer();
    const card = _el('hint-clue-card');
    if (!card) return;
    _el('hint-clue-sentence-btn')?.classList.remove('hidden');
    card.classList.remove('visible');
    card.classList.add('hidden');
  }

  var starterCoachTimer = 0;
  var informantHintHideTimer = 0;

  const SOR_HINT_PROFILES = Object.freeze({
    initial_blend: Object.freeze({
      catchphrase: 'Blend Builders',
      concept: 'Initial blend focus',
      rule: 'Your word contains an initial blend. Two consonants sit together, and you hear both sounds.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b', mark: 'letter' }),
            Object.freeze({ text: 'r', mark: 'letter' }),
            Object.freeze({ text: 'ing' })
          ]),
          note: 'Each consonant keeps its own sound: /b/ + /r/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 's', mark: 'letter' }),
            Object.freeze({ text: 't', mark: 'letter' }),
            Object.freeze({ text: 'op' })
          ]),
          note: 'Read both consonants quickly, then slide to the vowel.'
        })
      ])
    }),
    final_blend: Object.freeze({
      catchphrase: 'Blend Builders',
      concept: 'Final blend focus',
      rule: 'Your word contains a final blend. The ending has two consonants, and you hear both sounds.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ca' }),
            Object.freeze({ text: 'm', mark: 'letter' }),
            Object.freeze({ text: 'p', mark: 'letter' })
          ]),
          note: 'Say the ending /m/ + /p/ clearly.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ne' }),
            Object.freeze({ text: 's', mark: 'letter' }),
            Object.freeze({ text: 't', mark: 'letter' })
          ]),
          note: 'Hold both ending consonants without dropping one.'
        })
      ])
    }),
    digraph: Object.freeze({
      catchphrase: 'Sound Buddies',
      concept: 'Digraph focus',
      rule: 'Your word has a digraph. Two letters work together to make one sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sh', mark: 'team' }),
            Object.freeze({ text: 'ip' })
          ]),
          note: 'Keep the two letters locked as one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'th', mark: 'team' }),
            Object.freeze({ text: 'in' })
          ]),
          note: 'Read the digraph first, then finish the word.'
        })
      ])
    }),
    trigraph: Object.freeze({
      catchphrase: 'Three-Letter Team',
      concept: 'Trigraph focus',
      rule: 'Your word includes a three-letter sound team. Read the chunk first before adding other letters.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'l' }),
            Object.freeze({ text: 'igh', mark: 'team' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Treat igh as one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ma' }),
            Object.freeze({ text: 'tch', mark: 'team' })
          ]),
          note: 'Keep tch together at the end.'
        })
      ])
    }),
    cvc: Object.freeze({
      catchphrase: 'Sound Steps',
      concept: 'CVC short-vowel focus',
      rule: 'Your word follows a consonant-vowel-consonant pattern with a short vowel in the middle.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'a', mark: 'letter' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Tap each sound: /c/ /a/ /t/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'd' }),
            Object.freeze({ text: 'o', mark: 'letter' }),
            Object.freeze({ text: 'g' })
          ]),
          note: 'Keep the center vowel short and crisp.'
        })
      ])
    }),
    cvce: Object.freeze({
      catchphrase: 'Magic E',
      concept: 'CVCe focus',
      rule: 'Your word uses silent e. The ending e is quiet and makes the vowel say its name.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'a', mark: 'letter' }),
            Object.freeze({ text: 'p' }),
            Object.freeze({ text: 'e', mark: 'silent' })
          ]),
          note: 'The silent e changes cap to cape.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'k' }),
            Object.freeze({ text: 'i', mark: 'letter' }),
            Object.freeze({ text: 't' }),
            Object.freeze({ text: 'e', mark: 'silent' })
          ]),
          note: 'The vowel says its name in kite.'
        })
      ])
    }),
    vowel_team: Object.freeze({
      catchphrase: 'Vowel Team Detectives',
      concept: 'Vowel team focus',
      rule: 'Your word has a vowel team. Two vowels work together to carry one main sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'r' }),
            Object.freeze({ text: 'ai', mark: 'team' }),
            Object.freeze({ text: 'n' })
          ]),
          note: 'Read ai as one chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b' }),
            Object.freeze({ text: 'oa', mark: 'team' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Read oa as one chunk.'
        })
      ])
    }),
    r_controlled: Object.freeze({
      catchphrase: 'Bossy R',
      concept: 'R-controlled vowel focus',
      rule: 'Your word contains an r-controlled vowel. The r changes the vowel sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'ar', mark: 'team' })
          ]),
          note: 'Read ar as one sound pattern.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'h' }),
            Object.freeze({ text: 'er', mark: 'team' })
          ]),
          note: 'Read er as one sound pattern.'
        })
      ])
    }),
    diphthong: Object.freeze({
      catchphrase: 'Glide Team',
      concept: 'Diphthong focus',
      rule: 'Your word contains a diphthong. The vowel sound glides as your mouth moves.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'oi', mark: 'team' }),
            Object.freeze({ text: 'n' })
          ]),
          note: 'The oi glide is one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'cl' }),
            Object.freeze({ text: 'ou', mark: 'team' }),
            Object.freeze({ text: 'd' })
          ]),
          note: 'The ou glide is one sound chunk.'
        })
      ])
    }),
    welded: Object.freeze({
      catchphrase: 'Welded Sounds',
      concept: 'Welded sound focus',
      rule: 'Your word has a welded sound chunk. Keep the vowel plus ending consonants together.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b' }),
            Object.freeze({ text: 'ang', mark: 'team' })
          ]),
          note: 'Read ang as one welded unit.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'r' }),
            Object.freeze({ text: 'ing', mark: 'team' })
          ]),
          note: 'Read ing as one welded unit.'
        })
      ])
    }),
    floss: Object.freeze({
      catchphrase: 'FLOSS Rule',
      concept: 'Double ending focus',
      rule: 'Your word may end with doubled f, l, s, or z after a short vowel in a one-syllable word.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'be' }),
            Object.freeze({ text: 'll', mark: 'team' })
          ]),
          note: 'll is doubled after a short vowel sound.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'o' }),
            Object.freeze({ text: 'ff', mark: 'team' })
          ]),
          note: 'ff is doubled after a short vowel sound.'
        })
      ])
    }),
    schwa: Object.freeze({
      catchphrase: 'Schwa Spotter',
      concept: 'Schwa focus',
      rule: 'Your word has a schwa sound. The vowel is unstressed and sounds like /uh/.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'a', mark: 'schwa' }),
            Object.freeze({ text: 'bout' })
          ]),
          note: 'The a is unstressed and says /uh/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sof' }),
            Object.freeze({ text: 'a', mark: 'schwa' })
          ]),
          note: 'The final a is unstressed and says /uh/.'
        })
      ])
    }),
    prefix: Object.freeze({
      catchphrase: 'Prefix Power',
      concept: 'Prefix focus',
      rule: 'Your word starts with a prefix. Read the prefix chunk first, then the base word.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 're', mark: 'affix' }),
            Object.freeze({ text: 'play' })
          ]),
          note: 'Read re- first, then the base word.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'un', mark: 'affix' }),
            Object.freeze({ text: 'lock' })
          ]),
          note: 'Read un- first, then the base word.'
        })
      ])
    }),
    suffix: Object.freeze({
      catchphrase: 'Suffix Power',
      concept: 'Suffix focus',
      rule: 'Your word ends with a suffix. Read the base word first, then attach the ending.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'jump' }),
            Object.freeze({ text: 'ed', mark: 'affix' })
          ]),
          note: 'Read base + suffix: jump + ed.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'run' }),
            Object.freeze({ text: 'ning', mark: 'affix' })
          ]),
          note: 'Read base + suffix: run + ning.'
        })
      ])
    }),
    multisyllable: Object.freeze({
      catchphrase: 'Syllable Strategy',
      concept: 'Multisyllable focus',
      rule: 'Your word has more than one syllable. Chunk it into syllables before spelling.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sun' }),
            Object.freeze({ text: '-' }),
            Object.freeze({ text: 'set' })
          ]),
          note: 'Read each syllable chunk, then blend.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'com' }),
            Object.freeze({ text: '-' }),
            Object.freeze({ text: 'plete' })
          ]),
          note: 'Read each syllable chunk, then blend.'
        })
      ])
    }),
    compound: Object.freeze({
      catchphrase: 'Word Builders',
      concept: 'Compound word focus',
      rule: 'Your word joins two smaller words. Find each part first, then combine.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sun' }),
            Object.freeze({ text: 'flower' })
          ]),
          note: 'sun + flower = sunflower'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'rain' }),
            Object.freeze({ text: 'coat' })
          ]),
          note: 'rain + coat = raincoat'
        })
      ])
    }),
    subject: Object.freeze({
      catchphrase: 'Context Detectives',
      concept: 'Vocabulary-in-context focus',
      rule: 'Use the sentence clue first to identify meaning, then map the sounds and spell.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([Object.freeze({ text: 'Use sentence meaning first.' })]),
          note: 'Then spell using the sounds you hear.'
        })
      ])
    }),
    general: Object.freeze({
      catchphrase: 'Pattern Detectives',
      concept: 'Phonics focus',
      rule: 'Use one clear sound pattern clue, then confirm with the sentence.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([Object.freeze({ text: 'Check beginning + middle + ending.' })]),
          note: 'Then use color feedback to refine the next guess.'
        })
      ])
    })
  });

  function clearStarterCoachTimer() {
    if (!starterCoachTimer) return;
    clearTimeout(starterCoachTimer);
    starterCoachTimer = 0;
  }

  function clearInformantHintHideTimer() {
    if (!informantHintHideTimer) return;
    clearTimeout(informantHintHideTimer);
    informantHintHideTimer = 0;
  }

  function normalizeHintCategoryFromFocusTag(focusValue, phonicsTag) {
    const focus = String(focusValue || '').trim().toLowerCase();
    const tag = String(phonicsTag || '').trim().toLowerCase();

    if (focus === 'ccvc') return 'initial_blend';
    if (focus === 'cvcc') return 'final_blend';
    if (focus === 'digraph' || /digraph/.test(tag)) return 'digraph';
    if (focus === 'trigraph' || /trigraph/.test(tag)) return 'trigraph';
    if (focus === 'cvc' || /(^|[^a-z])cvc([^a-z]|$)|closed[\s-]*syllable|short[\s-]*vowel/.test(tag)) return 'cvc';
    if (focus === 'cvce' || /silent[\s-]*e|magic[\s-]*e|cvce/.test(tag)) return 'cvce';
    if (focus === 'vowel_team' || /vowel[\s_-]*team/.test(tag)) return 'vowel_team';
    if (focus === 'r_controlled' || /r[\s_-]*controlled/.test(tag)) return 'r_controlled';
    if (focus === 'diphthong' || /diphthong/.test(tag)) return 'diphthong';
    if (focus === 'welded' || /welded/.test(tag)) return 'welded';
    if (focus === 'floss' || /floss/.test(tag)) return 'floss';
    if (focus === 'schwa' || /schwa/.test(tag)) return 'schwa';
    if (focus === 'prefix' || /prefix/.test(tag)) return 'prefix';
    if (focus === 'suffix' || /suffix/.test(tag)) return 'suffix';
    if (focus === 'multisyllable' || /multisyll/.test(tag)) return 'multisyllable';
    if (focus === 'compound' || /compound/.test(tag)) return 'compound';
    if (/blend/.test(tag)) {
      if (/final|\(-/.test(tag)) return 'final_blend';
      return 'initial_blend';
    }
    return 'general';
  }

  function detectHintCategoryFromWord(wordValue) {
    const word = String(wordValue || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 'cvc';
    if (/(tch|dge|igh)/.test(word)) return 'trigraph';
    if (/^(sh|ch|th|wh|ph)/.test(word) || /(sh|ch|th|wh|ph|ck|ng)/.test(word)) return 'digraph';
    if (/(oi|oy|ou|ow|au|aw)/.test(word)) return 'diphthong';
    if (/(ai|ay|ea|ee|oa|oe|ie|ue|ui)/.test(word)) return 'vowel_team';
    if (/(ar|or|er|ir|ur)/.test(word)) return 'r_controlled';
    if (/(ang|ing|ong|ung|ank|ink|onk|unk)$/.test(word)) return 'welded';
    if (/(ff|ll|ss|zz)$/.test(word)) return 'floss';
    if (/^[a-z]{3}$/.test(word) && /^[^aeiou][aeiou][^aeiou]$/.test(word)) return 'cvc';
    if (/^[a-z]{4,}$/.test(word) && /[^aeiou][aeiou][^aeiou]e$/.test(word)) return 'cvce';
    if (/^[bcdfghjklmnpqrstvwxyz]{2}/.test(word)) return 'initial_blend';
    if (/[bcdfghjklmnpqrstvwxyz]{2}$/.test(word)) return 'final_blend';
    if (word.length >= 7 || /[aeiou].*[aeiou].*[aeiou]/.test(word)) return 'multisyllable';
    return 'cvc';
  }

  function buildMarkedHintParts(word, start, end, mark) {
    const upper = String(word || '').toUpperCase();
    const left = upper.slice(0, Math.max(0, start));
    const middle = upper.slice(Math.max(0, start), Math.max(start, end));
    const right = upper.slice(Math.max(start, end));
    const parts = [];
    if (left) parts.push(Object.freeze({ text: left }));
    if (middle) parts.push(Object.freeze({ text: middle, mark: mark || 'letter' }));
    if (right) parts.push(Object.freeze({ text: right }));
    return Object.freeze(parts);
  }

  function buildLiveHintExample(wordValue, category) {
    const word = String(wordValue || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return null;

    const teamMatch = word.match(/(ai|ay|ea|ee|oa|oe|ie|ue|ui|oo|oi|oy|ou|ow|au|aw|ew)/);
    const digraphMatch = word.match(/(sh|ch|th|wh|ph|ck|ng|qu)/);
    const rControlledMatch = word.match(/(ar|or|er|ir|ur)/);
    const prefixMatch = word.match(/^(un|re|pre|dis|mis|non|sub|inter|trans|over|under|anti|de)/);
    const suffixMatch = word.match(/(ing|ed|er|est|ly|tion|sion|ment|ness|less|ful|able|ible|ous|ive|al|y)$/);

    if (category === 'vowel_team' && teamMatch?.[0]) {
      const start = teamMatch.index || 0;
      const end = start + teamMatch[0].length;
      return Object.freeze({
        parts: buildMarkedHintParts(word, start, end, 'team'),
        note: 'Vowel team clue: these letters share one vowel sound.'
      });
    }

    if ((category === 'digraph' || category === 'trigraph' || category === 'welded') && digraphMatch?.[0]) {
      const start = digraphMatch.index || 0;
      const end = start + digraphMatch[0].length;
      return Object.freeze({
        parts: buildMarkedHintParts(word, start, end, 'team'),
        note: 'Sound team clue: these letters work together as one sound.'
      });
    }

    if (category === 'r_controlled' && rControlledMatch?.[0]) {
      const start = rControlledMatch.index || 0;
      const end = start + rControlledMatch[0].length;
      return Object.freeze({
        parts: buildMarkedHintParts(word, start, end, 'team'),
        note: 'Bossy R clue: the vowel + r shifts the vowel sound.'
      });
    }

    if (category === 'prefix' && prefixMatch?.[0]) {
      return Object.freeze({
        parts: buildMarkedHintParts(word, 0, prefixMatch[0].length, 'affix'),
        note: 'Prefix clue: read the beginning chunk first.'
      });
    }

    if (category === 'suffix' && suffixMatch?.[0]) {
      const end = word.length;
      const start = end - suffixMatch[0].length;
      return Object.freeze({
        parts: buildMarkedHintParts(word, start, end, 'affix'),
        note: 'Suffix clue: lock in the ending chunk.'
      });
    }

    if (category === 'cvce' && /[^aeiou][aeiou][^aeiou]e$/.test(word)) {
      return Object.freeze({
        parts: Object.freeze([
          Object.freeze({ text: word.slice(0, -1).toUpperCase() }),
          Object.freeze({ text: 'E', mark: 'silent' })
        ]),
        note: 'Magic E clue: the final e is silent and changes the vowel sound.'
      });
    }

    return null;
  }

  function buildFriendlyHintMessage(category, sourceLabel) {
    const cleanSource = String(sourceLabel || '').replace(/\s+/g, ' ').trim();
    const focusText = cleanSource ? `Focus: ${cleanSource}. ` : '';
    const ruleByCategory = Object.freeze({
      cvc: 'Say the sounds: first, middle, last.',
      digraph: 'Find the 2-letter sound team first.',
      trigraph: 'Find the 3-letter sound team first.',
      cvce: 'Look for magic e at the end.',
      vowel_team: 'Find the vowel team and keep it together.',
      r_controlled: 'Find the vowel + r chunk and say it as one sound.',
      diphthong: 'Listen for the sliding vowel sound.',
      welded: 'Read the welded chunk as one unit.',
      floss: 'Short vowel + doubled ending letters.',
      prefix: 'Read the beginning chunk, then the base word.',
      suffix: 'Read the base word, then add the ending.',
      multisyllable: 'Chunk it, then blend it.',
      compound: 'Find two small words and join them.',
      subject: 'Use meaning first, then spell by sound.',
      general: 'Try one sound clue, then adjust.'
    });
    const rule = ruleByCategory[category] || ruleByCategory.general;
    return `${focusText}${rule} The sentence clue uses the secret word.`;
  }

  function getHintUnlockMinimum(playStyle) {
    return playStyle === 'listening' ? 1 : 2;
  }

  function getHintUnlockCopy(playStyle, guessCount) {
    const mode = playStyle === 'listening' ? 'listening' : 'detective';
    const minimum = getHintUnlockMinimum(mode);
    const count = Math.max(0, Number(guessCount) || 0);
    const remaining = Math.max(0, minimum - count);
    if (remaining <= 0) {
      return {
        unlocked: true,
        minimum,
        message: ''
      };
    }
    const guessWord = remaining === 1 ? 'guess' : 'guesses';
    return {
      unlocked: false,
      minimum,
      message: mode === 'listening'
        ? `Try ${remaining} more ${guessWord} to unlock Sound Help.`
        : `Try ${remaining} more ${guessWord} to unlock a Clue Hint.`
    };
  }

  function buildInformantHintPayload(state) {
    const entry = state?.entry || null;
    const activeWord = String(state?.word || entry?.word || '').trim();
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const phonicsTag = String(entry?.phonics || '').trim();
    let category = preset.kind === 'subject'
      ? 'subject'
      : normalizeHintCategoryFromFocusTag(focusValue, phonicsTag);
    if (category === 'general') {
      category = detectHintCategoryFromWord(activeWord);
    }
    const profile = SOR_HINT_PROFILES[category] || SOR_HINT_PROFILES.general;
    const sourceLabel = phonicsTag && phonicsTag.toLowerCase() !== 'all'
      ? phonicsTag
      : preset.kind === 'phonics'
        ? getFocusLabel(preset.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim()
        : '';
    const liveExample = buildLiveHintExample(activeWord, category);
    const profileExamples = Array.isArray(profile.examples) ? profile.examples : [];
    const examples = liveExample ? [liveExample, ...profileExamples] : profileExamples;
    const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    let message = buildFriendlyHintMessage(category, sourceLabel);
    if (playStyle === 'listening') {
      message = sourceLabel
        ? `Focus: ${sourceLabel}. Listen to the word and definition, tap sounds, then spell. The sentence clue uses the secret word.`
        : 'Listen to the word and definition, tap sounds, then spell. The sentence clue uses the secret word.';
    }
    const actionMode = playStyle === 'detective' && !!entry?.sentence
      ? 'sentence'
      : playStyle === 'listening' && !!entry
        ? 'word-meaning'
        : 'none';
    return {
      title: playStyle === 'listening' ? '🎧 Listening Coach' : `✨ ${profile.catchphrase || 'Clue Coach'}`,
      message,
      examples,
      actionMode
    };
  }

  function renderHintExamples(examples) {
    const wrap = _el('hint-clue-examples');
    if (!wrap) return;
    wrap.innerHTML = '';
    const rows = Array.isArray(examples) ? examples.slice(0, 2) : [];
    if (!rows.length) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    rows.forEach((example) => {
      const row = document.createElement('div');
      row.className = 'hint-example';

      const word = document.createElement('div');
      word.className = 'hint-example-word';
      (Array.isArray(example?.parts) ? example.parts : []).forEach((part) => {
        const segment = document.createElement('span');
        segment.textContent = String(part?.text || '');
        const mark = String(part?.mark || '').trim();
        if (mark) segment.classList.add(`hint-mark-${mark}`);
        word.appendChild(segment);
      });
      row.appendChild(word);

      const note = String(example?.note || '').trim();
      if (note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'hint-example-note';
        noteEl.textContent = note;
        row.appendChild(noteEl);
      }
      wrap.appendChild(row);
    });
  }

  function scheduleStarterCoachHint() {
    clearStarterCoachTimer();
  }

  function showInformantHintCard(payload) {
    const card = _el('hint-clue-card');
    if (!card) return;
    const normalized = (payload && typeof payload === 'object')
      ? payload
      : { title: '🔎 Clue Coach', message: String(payload || '').trim(), examples: [], actionMode: 'none' };
    const title = String(normalized.title || '🔎 Clue Coach').trim() || '🔎 Clue Coach';
    const text = String(normalized.message || '').trim();
    if (!text) return;
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return;
    const titleEl = _el('hint-clue-title');
    const messageEl = _el('hint-clue-message');
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = text;
    renderHintExamples(normalized.examples);
    const hasExamples = Array.isArray(normalized.examples) && normalized.examples.length > 0;
    const sentenceBtn = _el('hint-clue-sentence-btn');
    let showAction = false;
    if (sentenceBtn) {
      const actionMode = String(normalized.actionMode || '').trim().toLowerCase();
      showAction = actionMode === 'sentence' || actionMode === 'word-meaning';
      sentenceBtn.dataset.mode = actionMode || 'none';
      sentenceBtn.textContent = actionMode === 'word-meaning' ? 'Hear Word + Meaning' : 'Hear Sentence (contains word)';
      sentenceBtn.classList.toggle('hidden', !showAction);
    }
    card.classList.toggle('is-compact', !hasExamples && !showAction);
    clearInformantHintHideTimer();
    card.classList.remove('hidden');
    positionHintClueCard();
    requestAnimationFrame(() => {
      card.classList.add('visible');
    });
  }

  function showInformantHintToast() {
    if (isHelpSuppressedForTeamMode()) return false;
    hideStarterWordCard();
    const card = _el('hint-clue-card');
    if (card && !card.classList.contains('hidden')) {
      hideInformantHintCard();
      return false;
    }
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;

    const state = WQGame.getState?.() || {};
    if (!state?.word) {
      showInformantHintCard({
        title: '🔎 Clue Coach',
        message: 'Tap Next Word first, then tap Clue for one quick sound hint.',
        examples: [],
        actionMode: 'none'
      });
      return true;
    }
    if (!state.entry) state.entry = WQData.getEntry(state.word) || null;
    const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const guessCount = Array.isArray(state?.guesses) ? state.guesses.length : 0;
    const unlock = getHintUnlockCopy(playStyle, guessCount);
    if (!unlock.unlocked) {
      showInformantHintCard({
        title: playStyle === 'listening' ? '🎧 Almost Ready' : '🔎 Almost Ready',
        message: `${unlock.message} The sentence clue uses the secret word.`,
        examples: [],
        actionMode: 'none'
      });
      return true;
    }
    if (playStyle === 'listening' && currentRoundHintRequested) {
      showInformantHintCard({
        title: '🎧 Listening Coach',
        message: 'Phonics Hint is one-time per word in Listening mode. Use Listen to Word + Listen to Definition to keep mapping sounds and spelling.',
        examples: [],
        actionMode: state.entry ? 'word-meaning' : 'none'
      });
      return true;
    }
    currentRoundHintRequested = true;
    emitTelemetry('wq_support_used', {
      support_type: playStyle === 'listening' ? 'listening_sound_help' : 'phonics_clue',
      guess_count: guessCount
    });
    showInformantHintCard(buildInformantHintPayload(state));
    return true;
  }

  function hideStarterWordCard() {
    const card = _el('starter-word-card');
    if (!card) return;
    card.classList.remove('visible');
    card.classList.add('hidden');
  }

  function hideSupportChoiceCard() {
    _el('support-choice-card')?.classList.add('hidden');
  }

  function positionHintClueCard() {
    const card = _el('hint-clue-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';
    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    if (!boardRect || window.innerWidth < 980) {
      card.style.left = '50%';
      card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
      card.style.transform = 'translateX(-50%)';
      return;
    }
    const roomRight = window.innerWidth - boardRect.right - 18;
    const top = Math.max(Math.round(boardRect.top + 8), Math.round((headerRect?.bottom || 82) + 12));
    if (roomRight >= 300) {
      card.style.left = `${Math.max(8, Math.round(boardRect.right + 18))}px`;
      card.style.top = `${top}px`;
      return;
    }
    card.style.left = `${Math.max(8, Math.round(boardRect.left - 330))}px`;
    card.style.top = `${top}px`;
  }

  function positionSupportChoiceCard() {
    const card = _el('support-choice-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';
    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    const top = Math.max(Math.round(boardRect?.top || 100) + 8, Math.round((headerRect?.bottom || 82) + 12));
    // Always try to position to the right side; only use left side if not enough room
    const roomRight = window.innerWidth - (boardRect?.right || 400) - 18;
    if (roomRight >= 200) {
      // Position to the right of board
      card.style.right = `${Math.max(8, 18)}px`;
      card.style.top = `${top}px`;
      return;
    }
    // Not enough room on right; position on left side instead
    const roomLeft = (boardRect?.left || 0) - 18;
    if (roomLeft >= 200) {
      card.style.left = `${Math.max(8, Math.round(boardRect?.left || 0) - 200)}px`;
      card.style.top = `${top}px`;
      return;
    }
    // Neither side has enough room; position at top right as fallback
    card.style.right = '8px';
    card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
  }

  function showSupportChoiceCard(state) {
    if (isHelpSuppressedForTeamMode()) return false;
    if (getSupportPromptMode() === 'off') return false;
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;
    const card = _el('support-choice-card');
    if (!card) return false;
    const liveState = state || (WQGame.getState?.() || {});
    if (!liveState?.word || liveState.gameOver) return false;
    // Only show help after first attempt AND 30 seconds have elapsed
    const guessCount = Array.isArray(liveState.guesses) ? liveState.guesses.length : 0;
    const timeElapsed = Date.now() - gameStartedAt;
    const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const isDetectiveMode = playStyle !== 'listening';
    // In detective mode, show every 30 seconds after first guess; in listening mode, show once
    const timeSinceLastPrompt = Date.now() - lastSupportPromptShownAt;
    const shouldShowAgain = isDetectiveMode && timeSinceLastPrompt >= 30000;
    // Must have at least 1 guess AND wait 30 seconds before showing for first time
    if (!currentRoundSupportPromptShown && (guessCount < 1 || timeElapsed < 30000)) return false;
    if (currentRoundSupportPromptShown && !isDetectiveMode) return false;  // Don't show repeatedly in listening mode
    if (currentRoundSupportPromptShown && !shouldShowAgain) return false;  // In detective, only every 30s
    const suggestionBtn = _el('support-choice-suggestion');
    const suggestionCount = pickStarterWordsForRound(liveState, 9).length;
    if (suggestionBtn) {
      const enabled = suggestionCount >= 4;
      if (enabled) {
        suggestionBtn.classList.remove('hidden');
        suggestionBtn.disabled = false;
        suggestionBtn.setAttribute('aria-disabled', 'false');
      } else {
        suggestionBtn.classList.add('hidden');
        suggestionBtn.disabled = true;
        suggestionBtn.setAttribute('aria-disabled', 'true');
      }
      suggestionBtn.textContent = '💡 Ideas';
    }
    const neverToggle = _el('support-choice-never');
    if (neverToggle) neverToggle.checked = false;
    positionSupportChoiceCard();
    card.classList.remove('hidden');
    currentRoundSupportPromptShown = true;
    lastSupportPromptShownAt = Date.now();  // Track when help was shown for repeat display
    return true;
  }

  function enableDraggableSupportChoiceCard() {
    const card = _el('support-choice-card');
    const handle = card?.querySelector('.support-choice-head');
    if (!(card instanceof HTMLElement) || !(handle instanceof HTMLElement) || card.dataset.dragBound === '1') return;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const stopDragging = () => {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const left = Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, event.clientX - offsetX));
      const top = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, event.clientY - offsetY));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.transform = 'none';
    };
    handle.addEventListener('pointerdown', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('#support-choice-close')) return;
      dragging = true;
      const rect = card.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
    });
    card.dataset.dragBound = '1';
  }

  function positionStarterWordCard() {
    const card = _el('starter-word-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';

    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    const margin = 18;
    const cardWidth = Math.min(320, Math.max(280, Math.round(window.innerWidth * 0.24)));
    card.style.width = `${Math.min(cardWidth, window.innerWidth - 24)}px`;

    if (!boardRect || window.innerWidth < 980) {
      card.style.left = '50%';
      card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
      card.style.transform = 'translateX(-50%)';
      return;
    }

    const roomRight = window.innerWidth - boardRect.right - margin;
    const top = Math.max(
      Math.round((headerRect?.bottom || 82) + 14),
      Math.round(boardRect.top + 8)
    );

    if (roomRight >= card.offsetWidth - 12 || roomRight >= 280) {
      card.style.left = `${Math.max(8, Math.round(boardRect.right + margin))}px`;
      card.style.top = `${top}px`;
      card.style.transform = 'none';
      return;
    }

    card.style.left = `${Math.max(8, Math.round(boardRect.left - card.offsetWidth - margin))}px`;
    card.style.top = `${top}px`;
    card.style.transform = 'none';
  }

  function replaceCurrentGuessWithWord(word) {
    const normalizedWord = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    const state = WQGame.getState?.();
    if (!state?.word || state.gameOver) return false;
    if (normalizedWord.length !== Number(state.wordLength || 0)) return false;
    while ((WQGame.getState?.()?.guess || '').length > 0) {
      WQGame.deleteLetter();
    }
    for (const letter of normalizedWord) WQGame.addLetter(letter);
    const next = WQGame.getState?.();
    if (next) WQUI.updateCurrentRow(next.guess, next.wordLength, next.guesses.length);
    return true;
  }

  function evaluateGuessPattern(guess, target) {
    const safeGuess = String(guess || '').toLowerCase().replace(/[^a-z]/g, '');
    const safeTarget = String(target || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!safeGuess || !safeTarget || safeGuess.length !== safeTarget.length) return [];
    const result = Array(safeTarget.length).fill('absent');
    const targetLetters = safeTarget.split('');
    const guessLetters = safeGuess.split('');
    for (let index = 0; index < guessLetters.length; index += 1) {
      if (guessLetters[index] === targetLetters[index]) {
        result[index] = 'correct';
        targetLetters[index] = null;
        guessLetters[index] = null;
      }
    }
    for (let index = 0; index < guessLetters.length; index += 1) {
      const letter = guessLetters[index];
      if (!letter) continue;
      const foundAt = targetLetters.indexOf(letter);
      if (foundAt >= 0) {
        result[index] = 'present';
        targetLetters[foundAt] = null;
      }
    }
    return result;
  }

  function deriveWordState(state) {
    const wordLength = Math.max(1, Number(state?.wordLength || state?.word?.length || 0));
    const target = normalizeReviewWord(state?.word || '');
    const guesses = Array.isArray(state?.guesses)
      ? state.guesses.map((guess) => normalizeReviewWord(guess)).filter((guess) => guess.length === wordLength)
      : [];
    const correctPositions = {};
    const lockedPositions = {};
    const forbiddenByPosition = Array.from({ length: wordLength }, () => new Set());
    const presentLetters = new Set();
    const absentLetters = new Set();
    const guessedLetters = new Set();
    const minCounts = {};
    const maxCounts = {};
    const usedLetters = {};
    const statusRank = { neutral: 0, absent: 1, present: 2, correct: 3 };

    const setUsedStatus = (letter, status) => {
      if (!/^[a-z]$/.test(letter)) return;
      const next = String(status || 'neutral').toLowerCase();
      const prev = String(usedLetters[letter] || 'neutral').toLowerCase();
      if ((statusRank[next] || 0) >= (statusRank[prev] || 0)) {
        usedLetters[letter] = next;
      }
    };

    guesses.forEach((guessWord) => {
      const marks = evaluateGuessPattern(guessWord, target);
      const rowGuessCounts = {};
      const rowPositiveCounts = {};
      for (let index = 0; index < guessWord.length; index += 1) {
        const letter = guessWord[index];
        const mark = marks[index] || 'absent';
        if (!/^[a-z]$/.test(letter)) continue;
        guessedLetters.add(letter);
        rowGuessCounts[letter] = (rowGuessCounts[letter] || 0) + 1;

        if (mark === 'correct') {
          correctPositions[index] = letter;
          lockedPositions[index] = letter;
          presentLetters.add(letter);
          rowPositiveCounts[letter] = (rowPositiveCounts[letter] || 0) + 1;
          setUsedStatus(letter, 'correct');
        } else if (mark === 'present') {
          forbiddenByPosition[index].add(letter);
          presentLetters.add(letter);
          rowPositiveCounts[letter] = (rowPositiveCounts[letter] || 0) + 1;
          setUsedStatus(letter, 'present');
        } else {
          if (!correctPositions[index]) forbiddenByPosition[index].add(letter);
          setUsedStatus(letter, 'absent');
        }
      }

      Object.entries(rowPositiveCounts).forEach(([letter, count]) => {
        minCounts[letter] = Math.max(Number(minCounts[letter] || 0), Number(count || 0));
      });
      Object.entries(rowGuessCounts).forEach(([letter, count]) => {
        const positiveCount = Number(rowPositiveCounts[letter] || 0);
        if (positiveCount < Number(count || 0)) {
          if (maxCounts[letter] === undefined) maxCounts[letter] = positiveCount;
          else maxCounts[letter] = Math.min(Number(maxCounts[letter]), positiveCount);
        }
      });
    });

    guessedLetters.forEach((letter) => {
      if (!presentLetters.has(letter)) absentLetters.add(letter);
    });
    absentLetters.forEach((letter) => {
      if (!presentLetters.has(letter)) {
        setUsedStatus(letter, 'absent');
      }
    });

    return {
      correctPositions,
      presentLetters,
      absentLetters,
      lockedPositions,
      forbiddenByPosition,
      usedLetters,
      minCounts,
      maxCounts,
      guessCount: guesses.length,
      guessedLetters,
      length: wordLength,
      mode: normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle),
      theme: normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback())
    };
  }

  function buildStarterWordConstraint(state) {
    const wordState = deriveWordState(state);
    const fixedLetters = Array.from({ length: wordState.length }, (_, index) => (
      wordState.correctPositions[index] || ''
    ));
    return {
      length: wordState.length,
      guessCount: wordState.guessCount,
      fixedLetters,
      excludedByPosition: wordState.forbiddenByPosition,
      minCounts: wordState.minCounts,
      maxCounts: wordState.maxCounts,
      absentLetters: wordState.absentLetters,
      guessedLetters: wordState.guessedLetters,
      wordState
    };
  }

  function wordMatchesStarterConstraint(word, constraint, options = {}) {
    const normalizedWord = normalizeReviewWord(word);
    const length = Math.max(1, Number(constraint?.length || 0));
    if (!normalizedWord || normalizedWord.length !== length) return false;
    const enforceMaxCounts = options.enforceMaxCounts !== false;
    const letterCounts = {};
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] !== letter) return false;
      if (constraint.excludedByPosition[index]?.has(letter)) return false;
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    for (const letter of constraint.absentLetters) {
      if ((letterCounts[letter] || 0) > 0) return false;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) return false;
    }
    if (enforceMaxCounts) {
      for (const [letter, maximum] of Object.entries(constraint.maxCounts || {})) {
        if ((letterCounts[letter] || 0) > maximum) return false;
      }
    }
    return true;
  }

  function scoreStarterWordCandidate(word, constraint) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord) return 0;
    let score = 0;
    const letterCounts = {};
    for (const ch of normalizedWord) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    const counted = new Set();
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] === letter) score += 4;
      if (!constraint.guessedLetters.has(letter) && !counted.has(letter)) {
        score += 2;
        counted.add(letter);
      }
      if ((constraint.minCounts[letter] || 0) > 0) score += 1;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) score -= 14;
      else score += 6;
    }
    for (const letter of constraint.absentLetters || []) {
      if ((letterCounts[letter] || 0) > 0) score -= 18;
    }
    return score;
  }

  function formatStarterPattern(constraint) {
    if (!constraint || !Array.isArray(constraint.fixedLetters)) return '';
    const token = constraint.fixedLetters.map((letter) => (letter ? letter.toUpperCase() : '_')).join('');
    return token.includes('_') ? token : '';
  }

  function pickStarterWordsForRound(state, limit = 9) {
    if (!state?.word || state.gameOver) return [];
    const focus = _el('setting-focus')?.value || prefs.focus || 'all';
    const selectedGrade = _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade;
    const gradeBand = getEffectiveGameplayGradeBand(selectedGrade, focus);
    const includeLowerBands = shouldExpandGradeBandForFocus(focus);
    const length = String(Math.max(1, Number(state.wordLength) || 0));
    const guessedWords = new Set((state.guesses || []).map((guess) => normalizeReviewWord(guess)));
    const targetWord = normalizeReviewWord(state.word);
    const addWords = (pool, bucket) => {
      if (!Array.isArray(pool)) return;
      pool.forEach((rawWord) => {
        const normalized = normalizeReviewWord(rawWord);
        if (!normalized || normalized.length !== Number(state.wordLength || 0)) return;
        if (guessedWords.has(normalized)) return;
        bucket.add(normalized);
      });
    };

    const prioritized = new Set();
    addWords(WQData.getPlayableWords({
      gradeBand,
      length,
      phonics: focus,
      includeLowerBands
    }), prioritized);

    if (prioritized.size < 6 && state.entry?.phonics) {
      addWords(WQData.getPlayableWords({
        gradeBand,
        length,
        phonics: String(state.entry.phonics || '').toLowerCase(),
        includeLowerBands
      }), prioritized);
    }

    if (prioritized.size < 6) {
      addWords(WQData.getPlayableWords({
        gradeBand,
        length,
        phonics: 'all',
        includeLowerBands
      }), prioritized);
    }

    const constraint = buildStarterWordConstraint(state);
    const candidates = Array.from(prioritized);
    let filtered = candidates;
    if (constraint.guessCount >= 1) {
      const strict = candidates.filter((word) => wordMatchesStarterConstraint(word, constraint, { enforceMaxCounts: true }));
      filtered = strict;
      if (
        targetWord &&
        wordMatchesStarterConstraint(targetWord, constraint, { enforceMaxCounts: true }) &&
        !filtered.includes(targetWord)
      ) {
        filtered.unshift(targetWord);
      }
    }

    const ranked = shuffleList(filtered).sort((left, right) => (
      scoreStarterWordCandidate(right, constraint) - scoreStarterWordCandidate(left, constraint)
    ));
    return ranked.slice(0, Math.max(3, Math.min(12, Number(limit) || 9)));
  }

  function getConstraintSafeCoachSuggestion(state) {
    if (!state || !state.word || state.gameOver) return '';
    const constraint = buildStarterWordConstraint(state);
    if (!constraint.guessCount) return '';
    const pool = pickStarterWordsForRound(state, 24);
    const tried = new Set((state.guesses || []).join('').toLowerCase().split(''));
    let best = '';
    let bestScore = -Infinity;
    for (const row of pool) {
      const word = normalizeReviewWord(row);
      if (!wordMatchesStarterConstraint(word, constraint, { enforceMaxCounts: true })) continue;
      const uniq = new Set(word.split(''));
      let score = 0;
      uniq.forEach((ch) => {
        if (!tried.has(ch)) score += 3;
        if ('aeiou'.includes(ch)) score += 0.5;
      });
      if (score > bestScore) {
        best = word;
        bestScore = score;
      }
    }
    return best;
  }

  function renderStarterWordList(words) {
    const list = _el('starter-word-list');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(words) || !words.length) {
      const empty = document.createElement('div');
      empty.className = 'starter-word-message';
      empty.textContent = 'No starter words found for this filter yet. Try switching focus or word length.';
      list.appendChild(empty);
      return;
    }
    words.forEach((word) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'starter-word-chip';
      chip.textContent = String(word || '').toUpperCase();
      chip.setAttribute('aria-label', `Use ${String(word || '').toUpperCase()} as next guess`);
      chip.addEventListener('click', () => {
        const applied = replaceCurrentGuessWithWord(word);
        if (applied) {
          hideStarterWordCard();
          updateNextActionLine();
          WQUI.showToast(`Try this: ${String(word || '').toUpperCase()}`);
        }
      });
      list.appendChild(chip);
    });
  }

  function showStarterWordCard(options = {}) {
    if (isHelpSuppressedForTeamMode()) return false;
    const card = _el('starter-word-card');
    if (!card) return false;
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;
    hideInformantHintCard();

    const state = WQGame.getState?.() || {};
    const titleEl = _el('starter-word-title');
    const messageEl = _el('starter-word-message');
    const guessCount = Array.isArray(state.guesses) ? state.guesses.length : 0;
    const source = String(options.source || 'manual').toLowerCase();
    const constraint = buildStarterWordConstraint(state);
    const knownPattern = formatStarterPattern(constraint);

    if (!state.word || state.gameOver) {
      if (titleEl) titleEl.textContent = 'Try a Starter Word';
      if (messageEl) messageEl.textContent = 'Start a round first, then open this for starter ideas.';
      renderStarterWordList([]);
      card.classList.remove('hidden');
      card.classList.add('visible');
      return true;
    }

    const words = pickStarterWordsForRound(state, 9);
    if (guessCount >= 1 && words.length <= 3) {
      if (source !== 'auto') {
        WQUI.showToast('Pattern Match only opens when there are 4 or more strong matches.');
      }
      hideStarterWordCard();
      return false;
    }
    currentRoundStarterWordsShown = true;
    if (titleEl) titleEl.textContent = guessCount >= 1 ? 'Try a Pattern Match' : (source === 'auto' ? 'Try a Starter Word' : 'Need Ideas? Try a Starter Word');
    if (messageEl) {
      if (guessCount >= 1) {
        const patternHint = knownPattern ? ` Pattern: ${knownPattern}.` : '';
        messageEl.textContent = `These options fit your green/yellow/gray clues.${patternHint} Pick one to test next.`;
      } else {
        messageEl.textContent = source === 'auto'
          ? `You are ${guessCount} guesses in. Pick one idea to keep momentum.`
          : 'Pick one to test your next guess.';
      }
    }
    renderStarterWordList(words);
    card.classList.remove('hidden');
    positionStarterWordCard();
    card.classList.add('visible');
    emitTelemetry('wq_support_used', {
      support_type: 'starter_word_list',
      guess_count: guessCount,
      source
    });
    return true;
  }

  let starterWordDragBound = false;
  function initializeStarterWordCardDrag() {
    if (starterWordDragBound) return;
    const card = _el('starter-word-card');
    const head = card?.querySelector('.starter-word-head');
    if (!(card instanceof HTMLElement) || !(head instanceof HTMLElement)) return;
    starterWordDragBound = true;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    const getPoint = (event) => {
      if (event.touches && event.touches[0]) return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      return { x: event.clientX, y: event.clientY };
    };

    const onMove = (event) => {
      if (!dragging) return;
      const point = getPoint(event);
      const nextLeft = originLeft + (point.x - startX);
      const nextTop = originTop + (point.y - startY);
      card.style.left = `${Math.max(8, nextLeft)}px`;
      card.style.top = `${Math.max(8, nextTop)}px`;
      card.style.transform = 'none';
      event.preventDefault();
    };

    const onUp = () => {
      dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    const onDown = (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('button')) return;
      const point = getPoint(event);
      const rect = card.getBoundingClientRect();
      dragging = true;
      startX = point.x;
      startY = point.y;
      originLeft = rect.left;
      originTop = rect.top;
      card.style.left = `${rect.left}px`;
      card.style.top = `${rect.top}px`;
      card.style.transform = 'none';
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp, { passive: true });
      event.preventDefault();
    };

    head.addEventListener('mousedown', onDown);
    head.addEventListener('touchstart', onDown, { passive: false });
  }

  function maybeAutoShowStarterWords(state) {
    if (!focusSupportUnlockedByMiss) return;
    if (currentRoundStarterWordsShown) return;
    showSupportChoiceCard(state);
  }

  function applyFeedback(mode) {
    const normalized = mode === 'classic' ? 'classic' : 'themed';
    document.documentElement.setAttribute('data-feedback', normalized);
    const select = _el('s-feedback');
    if (select && select.value !== normalized) select.value = normalized;
  }

  function applyBoardStyle(mode) {
    const allowed = new Set(['clean', 'card', 'patterned', 'soundcard']);
    const normalized = allowed.has(mode) ? mode : DEFAULT_PREFS.boardStyle;
    document.documentElement.setAttribute('data-board-style', normalized);
    const select = _el('s-board-style');
    if (select && select.value !== normalized) select.value = normalized;
    updateWilsonModeToggle();
    return normalized;
  }

  function applyKeyStyle(mode) {
    const normalized = DEFAULT_PREFS.keyStyle;
    document.documentElement.setAttribute('data-key-style', normalized);
    const select = _el('s-key-style');
    if (select && select.value !== normalized) select.value = normalized;
    updateWilsonModeToggle();
    return normalized;
  }

  function normalizeHeaderControlLayout() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    const iconIds = ['theme-dock-toggle-btn', 'music-dock-toggle-btn', 'teacher-panel-btn', 'case-toggle-btn', 'keyboard-layout-toggle', 'mission-lab-nav-btn', 'settings-btn', 'play-tools-btn'];
    const quickIds = ['play-style-toggle', 'phonics-clue-open-btn', 'starter-word-open-btn', 'writing-studio-btn', 'sentence-surgery-btn', 'reading-lab-btn', 'new-game-btn'];

    let iconGroup = headerRight.querySelector('.header-icon-controls');
    if (!iconGroup) {
      iconGroup = document.createElement('div');
      iconGroup.className = 'header-icon-controls';
    }

    let quickGroup = headerRight.querySelector('.header-quick-controls');
    if (!quickGroup) {
      quickGroup = document.createElement('div');
      quickGroup.className = 'header-quick-controls';
    }

    iconIds.forEach((id) => {
      const node = _el(id);
      if (node) iconGroup.appendChild(node);
    });
    quickIds.forEach((id) => {
      const node = _el(id);
      if (node) quickGroup.appendChild(node);
    });

    if (iconGroup.parentElement !== headerRight) headerRight.appendChild(iconGroup);
    if (quickGroup.parentElement !== headerRight) headerRight.appendChild(quickGroup);
    if (headerRight.firstElementChild !== iconGroup) headerRight.insertBefore(iconGroup, headerRight.firstChild);
    if (iconGroup.nextElementSibling !== quickGroup) headerRight.insertBefore(quickGroup, iconGroup.nextElementSibling);
  }

  function syncWritingStudioAvailability() {
    const writingBtn = _el('writing-studio-btn');
    if (!writingBtn) return;
    if (WRITING_STUDIO_ENABLED) {
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
    if (kind === 'puzzle') {
      return '<svg class="icon-glyph icon-glyph-puzzle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19.2 12.2a2 2 0 1 0 0-4h-.8V5.8a1.8 1.8 0 0 0-1.8-1.8h-2.4v.8a2 2 0 1 1-4 0V4H7.8A1.8 1.8 0 0 0 6 5.8v2.4h-.8a2 2 0 1 0 0 4H6v2.4a1.8 1.8 0 0 0 1.8 1.8h2.4v-.8a2 2 0 1 1 4 0v.8h2.4a1.8 1.8 0 0 0 1.8-1.8v-2.4Z"></path></svg>';
    }
    if (kind === 'bulb') {
      return '<svg class="icon-glyph icon-glyph-bulb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 18h6"></path><path d="M10 21h4"></path><path d="M8.4 14.8h7.2"></path><path d="M12 3.8a5.4 5.4 0 0 0-3.55 9.48c.78.66 1.25 1.29 1.46 2.02h4.18c.21-.73.68-1.36 1.46-2.02A5.4 5.4 0 0 0 12 3.8Z"></path></svg>';
    }
    return '';
  }

  function syncHeaderStaticIcons() {
    const teacherBtn = _el('teacher-panel-btn');
    if (teacherBtn) {
      teacherBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">👩‍🏫</span>';
      setHoverNoteForElement(teacherBtn, 'Specialist tools: add your own words or word list.');
    }
    const themeBtn = _el('theme-dock-toggle-btn');
    if (themeBtn) themeBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">🎨</span>';
    setHoverNoteForElement(themeBtn, 'Open style picker.');
    const musicBtn = _el('music-dock-toggle-btn');
    if (musicBtn) musicBtn.innerHTML = '<span class="icon-emoji" aria-hidden="true">🎵</span>';
    setHoverNoteForElement(musicBtn, 'Open music controls.');
    const settingsBtn = _el('settings-btn');
    if (settingsBtn) {
      settingsBtn.innerHTML = getHeaderIconMarkup('settings');
      setHoverNoteForElement(settingsBtn, 'Open settings.');
    }
    const playToolsBtn = _el('play-tools-btn');
    if (playToolsBtn) setHoverNoteForElement(playToolsBtn, 'Open activity tools.');
    const writingBtn = _el('writing-studio-btn');
    if (WRITING_STUDIO_ENABLED) setHoverNoteForElement(writingBtn, 'Open Writing Studio.');
    const surgeryBtn = _el('sentence-surgery-btn');
    if (surgeryBtn) setHoverNoteForElement(surgeryBtn, 'Open Sentence Studio.');
    const readingBtn = _el('reading-lab-btn');
    if (readingBtn) setHoverNoteForElement(readingBtn, 'Open Reading Lab.');
    syncWritingStudioAvailability();
  }

  function applyKeyboardLayout(mode) {
    const normalized = normalizeKeyboardLayout(mode);
    document.documentElement.setAttribute('data-keyboard-layout', normalized);
    const select = _el('s-keyboard-layout');
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
    let boardStyle = document.documentElement.getAttribute('data-board-style') || prefs.boardStyle || DEFAULT_PREFS.boardStyle;
    // Keep board tiles less rounded when using the oval keyboard option.
    if (preset.keyStyle === 'pebble') {
      boardStyle = applyBoardStyle('card');
    }
    if (options.persist !== false) {
      setPref('keyboardLayout', layout);
      setPref('keyStyle', keyStyle);
      if (preset.keyStyle === 'pebble') setPref('boardStyle', boardStyle);
    }
    updateWilsonModeToggle();
    return Object.freeze({
      id: normalized,
      label: preset.label,
      layout,
      keyStyle,
      boardStyle
    });
  }

  function syncKeyboardLayoutToggle() {
    normalizeHeaderControlLayout();
    const toggle = _el('keyboard-layout-toggle');
    if (!toggle) return;
    const layout = normalizeKeyboardLayout(document.documentElement.getAttribute('data-keyboard-layout') || 'standard');
    const next = getNextKeyboardLayout(layout);
    const keyboardHint = `${getKeyboardLayoutLabel(layout)} keys ready. Tap to try ${getKeyboardLayoutLabel(next)}.`;
    toggle.innerHTML = getHeaderIconMarkup('keyboard');
    toggle.setAttribute('aria-pressed', layout === 'alphabet' ? 'true' : 'false');
    toggle.setAttribute('aria-label', keyboardHint);
    toggle.dataset.hint = keyboardHint;
    setHoverNoteForElement(toggle, keyboardHint);
    toggle.classList.toggle('is-wilson', false);
  }

  function syncCaseToggleUI() {
    normalizeHeaderControlLayout();
    const toggle = _el('case-toggle-btn');
    if (!toggle) return;
    const mode = String(document.documentElement.getAttribute('data-case') || prefs.caseMode || DEFAULT_PREFS.caseMode).toLowerCase();
    const isUpper = mode === 'upper';
    const caseHint = isUpper
      ? 'Uppercase letters are on. Tap for lowercase.'
      : 'Lowercase letters are on. Tap for uppercase.';
    toggle.innerHTML = '<span class="case-toggle-glyph" aria-hidden="true">Aa</span>';
    toggle.setAttribute('aria-pressed', isUpper ? 'true' : 'false');
    toggle.setAttribute('aria-label', caseHint);
    toggle.dataset.hint = caseHint;
    setHoverNoteForElement(toggle, caseHint);
  }

  function applyChunkTabsMode(mode) {
    const normalized = mode === 'on' || mode === 'off' ? mode : 'auto';
    const select = _el('s-chunk-tabs');
    if (select && select.value !== normalized) select.value = normalized;
    document.documentElement.setAttribute('data-chunk-tabs-mode', normalized);
    return normalized;
  }

  function applyAtmosphere(mode) {
    const allowed = new Set(['minimal', 'glow', 'spark']);
    const normalized = allowed.has(mode) ? mode : DEFAULT_PREFS.atmosphere;
    document.documentElement.setAttribute('data-atmosphere', normalized);
    const select = _el('s-atmosphere');
    if (select && select.value !== normalized) select.value = normalized;
    return normalized;
  }

  function applyTextSize(mode) {
    const normalized = normalizeTextSize(mode);
    document.documentElement.setAttribute('data-text-size', normalized);
    const select = _el('s-text-size');
    if (select && select.value !== normalized) select.value = normalized;
    return normalized;
  }

  function updateWilsonModeToggle() {
    const checkbox = _el('s-wilson-mode');
    if (!checkbox) return;
    const boardStyle = document.documentElement.getAttribute('data-board-style');
    const keyStyle = document.documentElement.getAttribute('data-key-style');
    const keyboardLayout = document.documentElement.getAttribute('data-keyboard-layout') || 'standard';
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
    const toggle = _el('s-sor-notation');
    if (toggle) return !!toggle.checked;
    return (prefs.sorNotation || DEFAULT_PREFS.sorNotation) === 'on';
  }

  function normalizeVoicePracticeMode(mode) {
    const next = String(mode || '').toLowerCase();
    if (next === 'off' || next === 'required') return next;
    return 'optional';
  }

  function getVoicePracticeMode() {
    if (!STUDENT_RECORDING_ENABLED) return 'off';
    return normalizeVoicePracticeMode(_el('s-voice-task')?.value || prefs.voicePractice || DEFAULT_PREFS.voicePractice);
  }

  function setVoicePracticeMode(mode, options = {}) {
    const normalized = STUDENT_RECORDING_ENABLED
      ? normalizeVoicePracticeMode(mode)
      : 'off';
    const select = _el('s-voice-task');
    if (select && select.value !== normalized) select.value = normalized;
    if (select) {
      select.disabled = !STUDENT_RECORDING_ENABLED;
      select.setAttribute('aria-disabled', STUDENT_RECORDING_ENABLED ? 'false' : 'true');
      if (!STUDENT_RECORDING_ENABLED) {
        select.title = 'Student recording is temporarily turned off.';
      } else {
        select.removeAttribute('title');
      }
    }
    setPref('voicePractice', normalized);
    if (!(_el('modal-overlay')?.classList.contains('hidden'))) {
      updateVoicePracticePanel(WQGame.getState());
      syncRevealFocusModalSections();
    }
    syncTeacherPresetButtons();
    if (options.toast) {
      WQUI.showToast(normalized === 'required'
        ? 'Voice practice is required before moving on.'
        : normalized === 'off'
          ? 'Voice practice is off.'
          : 'Voice practice is optional for this round.'
      );
    }
    return normalized;
  }

  function areBoostPopupsEnabled() {
    if (!MIDGAME_BOOST_ENABLED) return false;
    const select = _el('s-boost-popups');
    const value = String(select?.value || prefs.boostPopups || DEFAULT_PREFS.boostPopups).toLowerCase();
    return value !== 'off';
  }

  const TEACHER_PRESETS = Object.freeze({
    guided: Object.freeze({
      hint: 'on',
      confidenceCoaching: 'on',
      revealFocus: 'on',
      voicePractice: 'required',
      voice: 'recorded',
      assessmentLock: 'off',
      boostPopups: 'on',
      confetti: 'on'
    }),
    independent: Object.freeze({
      hint: 'off',
      confidenceCoaching: 'off',
      revealFocus: 'on',
      voicePractice: 'optional',
      voice: 'recorded',
      assessmentLock: 'off',
      boostPopups: 'on',
      confetti: 'on'
    }),
    assessment: Object.freeze({
      hint: 'off',
      confidenceCoaching: 'off',
      revealFocus: 'on',
      voicePractice: 'off',
      voice: 'off',
      assessmentLock: 'on',
      boostPopups: 'off',
      confetti: 'off'
    }),
    'k2-phonics': Object.freeze({
      hint: 'on',
      confidenceCoaching: 'on',
      revealFocus: 'on',
      voicePractice: 'required',
      voice: 'recorded',
      assessmentLock: 'off',
      boostPopups: 'on',
      confetti: 'on',
      focus: 'cvc',
      grade: 'K-2',
      lessonPack: 'custom'
    }),
    '35-vocab': Object.freeze({
      hint: 'on',
      confidenceCoaching: 'off',
      revealFocus: 'on',
      voicePractice: 'optional',
      voice: 'recorded',
      assessmentLock: 'off',
      boostPopups: 'on',
      confetti: 'on',
      focus: 'vocab-ela-35',
      grade: 'G3-5',
      lessonPack: 'custom'
    }),
    intervention: Object.freeze({
      hint: 'on',
      confidenceCoaching: 'on',
      revealFocus: 'on',
      voicePractice: 'required',
      voice: 'recorded',
      assessmentLock: 'on',
      boostPopups: 'off',
      confetti: 'off',
      focus: 'digraph',
      grade: 'K-2',
      lessonPack: 'custom'
    })
  });

  function detectTeacherPreset() {
    const current = {
      hint: getHintMode(),
      confidenceCoaching: isConfidenceCoachingEnabled() ? 'on' : 'off',
      revealFocus: getRevealFocusMode(),
      voicePractice: getVoicePracticeMode(),
      voice: normalizeVoiceMode(_el('s-voice')?.value || prefs.voice || DEFAULT_PREFS.voice),
      assessmentLock: isAssessmentLockEnabled() ? 'on' : 'off',
      boostPopups: areBoostPopupsEnabled() ? 'on' : 'off',
      confetti: String(_el('s-confetti')?.value || prefs.confetti || DEFAULT_PREFS.confetti).toLowerCase() === 'off'
        ? 'off'
        : 'on',
      focus: String(_el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus).trim() || DEFAULT_PREFS.focus,
      grade: String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade).trim() || DEFAULT_PREFS.grade,
      lessonPack: normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack)
    };
    return Object.entries(TEACHER_PRESETS).find(([, preset]) =>
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

  function syncTeacherPresetButtons(activePreset = detectTeacherPreset()) {
    document.querySelectorAll('[data-teacher-preset]').forEach((btn) => {
      const isActive = btn.getAttribute('data-teacher-preset') === activePreset;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function applyTeacherPreset(mode) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return false;
    }
    const preset = TEACHER_PRESETS[mode];
    if (!preset) return false;
    setHintMode(preset.hint);
    setConfidenceCoachingMode(preset.confidenceCoaching === 'on');
    applyRevealFocusMode(preset.revealFocus);

    setVoicePracticeMode(preset.voicePractice, { toast: false });

    const voiceSelect = _el('s-voice');
    if (voiceSelect) voiceSelect.value = preset.voice;
    WQAudio.setVoiceMode(preset.voice);
    setPref('voice', preset.voice);

    const assessmentLockToggle = _el('s-assessment-lock');
    if (assessmentLockToggle) assessmentLockToggle.checked = preset.assessmentLock === 'on';
    setPref('assessmentLock', preset.assessmentLock);

    const boostSelect = _el('s-boost-popups');
    if (boostSelect) boostSelect.value = preset.boostPopups;
    setPref('boostPopups', preset.boostPopups);
    if (preset.boostPopups === 'off') hideMidgameBoost();

    const confettiSelect = _el('s-confetti');
    if (confettiSelect) confettiSelect.value = preset.confetti;
    setPref('confetti', preset.confetti);

    if (preset.lessonPack) {
      handleLessonPackSelectionChange(preset.lessonPack);
    }
    if (preset.grade) {
      const gradeSelect = _el('s-grade');
      if (gradeSelect) {
        gradeSelect.value = preset.grade;
        gradeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (preset.focus) {
      setFocusValue(preset.focus, { force: true });
    }

    if (preset.voice === 'off') cancelRevealNarration();
    updateVoicePracticePanel(WQGame.getState());
    syncRevealFocusModalSections();
    syncAssessmentLockRuntime();
    syncTeacherPresetButtons(mode);
    WQUI.showToast(`Preset applied: ${mode}.`);
    return true;
  }

  function markFirstRunSetupDone() {
    try { localStorage.setItem(FIRST_RUN_SETUP_KEY, 'done'); } catch {}
  }

  function clearFirstRunSetupPreference() {
    try { localStorage.removeItem(FIRST_RUN_SETUP_KEY); } catch {}
  }

  function hasCompletedFirstRunSetup() {
    try { return localStorage.getItem(FIRST_RUN_SETUP_KEY) === 'done'; } catch { return false; }
  }

  function launchedFromGameGallery() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return String(params.get('from') || '').trim().toLowerCase() === 'game-platform';
    } catch {
      return false;
    }
  }

  const shouldOfferStartupPreset = !hasCompletedFirstRunSetup() && !launchedFromGameGallery();
  firstRunSetupPending = shouldOfferStartupPreset;

  function closeFirstRunSetupModal() {
    _el('first-run-setup-modal')?.classList.add('hidden');
  }

  function getFirstRunModeHelpText(mode) {
    return mode === 'listening'
      ? 'Listening mode: hear the word and meaning first, then spell what you hear.'
      : 'Classic mode: use color feedback and clue support.';
  }

  function setFirstRunModeChoice(mode) {
    const normalized = normalizePlayStyle(mode);
    document.querySelectorAll('[data-play-style-choice]').forEach((button) => {
      const active = button.getAttribute('data-play-style-choice') === normalized;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const help = _el('first-run-mode-help');
    if (help) help.textContent = getFirstRunModeHelpText(normalized);
  }

  function syncFirstRunGradeSelectFromPrefs() {
    return;
  }

  function syncFirstRunSetupControlsFromPrefs() {
    const skipBtn = _el('first-run-skip-btn');
    if (skipBtn) {
      skipBtn.disabled = !!firstRunSetupPending;
      skipBtn.classList.toggle('hidden', !!firstRunSetupPending);
      skipBtn.setAttribute('aria-hidden', firstRunSetupPending ? 'true' : 'false');
    }
    const hideAgainToggle = _el('first-run-hide-again');
    if (hideAgainToggle) hideAgainToggle.checked = true;
  }

  function applyFirstRunGradeSelection() {
    return;
  }

  function applyFirstRunPlayStyleSelection() {
    return;
  }

  function openFirstRunSetupModal() {
    const modal = _el('first-run-setup-modal');
    if (!modal) return;
    syncFirstRunSetupControlsFromPrefs();
    modal.classList.remove('hidden');
    _el('settings-panel')?.classList.add('hidden');
    _el('teacher-panel')?.classList.add('hidden');
    syncHeaderControlsVisibility();
  }

  function bindFirstRunSetupModal() {
    if (document.body.dataset.wqFirstRunSetupBound === '1') return;
    const closeTutorial = () => {
      if (_el('first-run-hide-again')?.checked) markFirstRunSetupDone();
      else clearFirstRunSetupPreference();
      firstRunSetupPending = false;
      closeFirstRunSetupModal();
      const state = WQGame.getState?.() || {};
      if (!state.word || state.gameOver) {
        newGame({ launchMissionLab: !isMissionLabStandaloneMode() });
      }
      updateNextActionLine();
    };
    _el('first-run-skip-btn')?.addEventListener('click', closeTutorial);
    _el('first-run-start-btn')?.addEventListener('click', closeTutorial);
    _el('first-run-setup-modal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'first-run-setup-modal') {
        closeTutorial();
      }
    });
    document.body.dataset.wqFirstRunSetupBound = '1';
  }

  function bindSettingsModeCards() {
    if (document.body.dataset.wqSettingsModeCardsBound === '1') return;
    document.querySelectorAll('[data-settings-play-style-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = normalizePlayStyle(button.getAttribute('data-settings-play-style-choice') || 'detective');
        const select = _el('s-play-style');
        if (!select) return;
        select.value = next;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    document.body.dataset.wqSettingsModeCardsBound = '1';
  }

  function markDiagnosticsReset(reason = 'maintenance') {
    const row = {
      ts: Date.now(),
      reason: String(reason || 'maintenance').trim() || 'maintenance',
      build: resolveBuildLabel() || 'local'
    };
    try { localStorage.setItem(DIAGNOSTICS_LAST_RESET_KEY, JSON.stringify(row)); } catch {}
    return row;
  }

  async function resetAppearanceAndCache() {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round first, then reset appearance.');
      return;
    }

    cancelRevealNarration();
    stopVoiceCaptureNow();

    // Hard-reset appearance prefs first so stale keyboard/layout values cannot survive.
    try {
      localStorage.removeItem(PREF_KEY);
    } catch {}
    Object.keys(prefs).forEach((key) => { delete prefs[key]; });

    const fallbackTheme = getThemeFallback();
    const normalizedTheme = applyTheme(fallbackTheme);
    delete prefs.theme;
    setPref('themeSave', DEFAULT_PREFS.themeSave);
    setPref('boardStyle', applyBoardStyle(DEFAULT_PREFS.boardStyle));
    setPref('keyStyle', applyKeyStyle(DEFAULT_PREFS.keyStyle));
    setPref('keyboardLayout', applyKeyboardLayout(DEFAULT_PREFS.keyboardLayout));
    setPref('chunkTabs', applyChunkTabsMode(DEFAULT_PREFS.chunkTabs));
    syncChunkTabsVisibility();
    setPref('atmosphere', applyAtmosphere(DEFAULT_PREFS.atmosphere));
    setPref('textSize', applyTextSize(DEFAULT_PREFS.textSize));
    setPref('uiSkin', applyUiSkin(DEFAULT_PREFS.uiSkin, { persist: false }));
    setPref('motion', DEFAULT_PREFS.motion);
    setPref('feedback', DEFAULT_PREFS.feedback);
    setPref('projector', DEFAULT_PREFS.projector);
    setPref('caseMode', DEFAULT_PREFS.caseMode);
    setPref('playStyle', applyPlayStyle(DEFAULT_PREFS.playStyle));
    setPref('revealPacing', DEFAULT_PREFS.revealPacing);
    setPref('revealAutoNext', DEFAULT_PREFS.revealAutoNext);
    setPref('teamMode', DEFAULT_PREFS.teamMode);
    setPref('teamCount', DEFAULT_PREFS.teamCount);
    setPref('teamSet', DEFAULT_PREFS.teamSet);
    setPref('turnTimer', DEFAULT_PREFS.turnTimer);
    setPref('smartKeyLock', DEFAULT_PREFS.smartKeyLock);
    setPref('confidenceCoaching', DEFAULT_PREFS.confidenceCoaching);

    _el('s-theme-save').value = DEFAULT_PREFS.themeSave;
    _el('s-ui-skin').value = DEFAULT_PREFS.uiSkin;
    _el('s-motion').value = DEFAULT_PREFS.motion;
    _el('s-text-size').value = DEFAULT_PREFS.textSize;
    _el('s-feedback').value = DEFAULT_PREFS.feedback;
    _el('s-projector').value = DEFAULT_PREFS.projector;
    _el('s-case').value = DEFAULT_PREFS.caseMode;
    _el('s-play-style').value = DEFAULT_PREFS.playStyle;
    _el('s-reveal-pacing').value = DEFAULT_PREFS.revealPacing;
    _el('s-reveal-auto-next').value = DEFAULT_PREFS.revealAutoNext;
    _el('s-team-mode').value = DEFAULT_PREFS.teamMode;
    _el('s-team-count').value = DEFAULT_PREFS.teamCount;
    _el('s-team-set').value = DEFAULT_PREFS.teamSet;
    _el('s-turn-timer').value = DEFAULT_PREFS.turnTimer;
    _el('s-smart-key-lock').value = DEFAULT_PREFS.smartKeyLock;
    const confidenceToggle = _el('s-confidence-coaching');
    if (confidenceToggle) confidenceToggle.checked = DEFAULT_PREFS.confidenceCoaching === 'on';

    applyProjector(DEFAULT_PREFS.projector);
    applyUiSkin(DEFAULT_PREFS.uiSkin, { persist: false });
    applyMotion(DEFAULT_PREFS.motion);
    applyTextSize(DEFAULT_PREFS.textSize);
    applyFeedback(DEFAULT_PREFS.feedback);
    WQUI.setCaseMode(DEFAULT_PREFS.caseMode);
    syncClassroomTurnRuntime({ resetTurn: true });
    updateWilsonModeToggle();
    syncTeacherPresetButtons();
    syncHeaderControlsVisibility();

    try { sessionStorage.removeItem('wq_sw_controller_reloaded'); } catch {}
    markDiagnosticsReset('appearance_reset');
    emitTelemetry('wq_funnel_reset_used', { source: 'settings' });

    let clearedCaches = 0;
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        const targets = names.filter((name) => name.startsWith('wq-'));
        await Promise.all(targets.map((name) => caches.delete(name)));
        clearedCaches = targets.length;
      } catch {}
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(async (registration) => {
          try {
            registration.waiting?.postMessage({ type: 'WQ_SKIP_WAITING' });
            await registration.update();
          } catch {}
        }));
      } catch {}
    }

    WQUI.showToast(clearedCaches
      ? `Appearance reset. Cleared ${clearedCaches} cache bucket(s). Refreshing...`
      : 'Appearance reset. Refreshing...');

    const resetUrl = `${location.pathname}?cb=appearance-reset-${Date.now()}`;
    setTimeout(() => { location.replace(resetUrl); }, 460);

    if (shouldPersistTheme()) {
      setPref('theme', normalizedTheme);
    } else if (prefs.theme !== undefined) {
      delete prefs.theme;
      savePrefs(prefs);
    }
  }

  async function runForceUpdateNow(options = {}) {
    cancelRevealNarration();
    stopVoiceCaptureNow();

    try { sessionStorage.removeItem('wq_sw_controller_reloaded'); } catch {}
    try { sessionStorage.removeItem('wq_v2_build_remote_check_v1'); } catch {}
    try { localStorage.removeItem('wq_v2_cache_repair_build_v1'); } catch {}
    markDiagnosticsReset('force_update');
    emitTelemetry('wq_funnel_force_update_used', { source: 'settings' });

    let clearedCaches = 0;
    if ('caches' in window) {
      try {
        const names = await caches.keys();
        const targets = names.filter((name) => String(name || '').startsWith('wq-'));
        if (targets.length) {
          await Promise.all(targets.map((name) => caches.delete(name)));
          clearedCaches = targets.length;
        }
      } catch {}
    }

    let unregistered = 0;
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length) {
          const results = await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
          unregistered = results.filter(Boolean).length;
        }
      } catch {}
    }

    if (!options.silentToast) {
      WQUI.showToast(`Refreshing to load the latest update (${clearedCaches} cache bucket(s), ${unregistered} service worker reset).`);
    }
    const nextUrl = `${location.pathname}?cb=force-update-${Date.now()}${location.hash || ''}`;
    setTimeout(() => { location.replace(nextUrl); }, 280);
  }

  async function forceUpdateNow() {
    if (!window.confirm('Force update now? This clears offline cache and reloads the latest build.')) return;
    await runForceUpdateNow();
  }

  function initRefreshLatestBanner() {
    const banner = _el('refresh-latest-banner');
    if (!banner) return;
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
  }

  function rerunOnboardingSetup() {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before re-running setup.');
      return;
    }
    try { localStorage.removeItem(FIRST_RUN_SETUP_KEY); } catch {}
    firstRunSetupPending = true;
    closeFocusSearchList();
    openFirstRunSetupModal();
    WQUI.showToast('How-to card reopened.');
  }

  function populateVoiceSelector() {
    // Voice selection is handled by WQAudio internals
    // This can be expanded if you want a dropdown UI later
  }


function applyThemeBundle() { applyTheme(prefs.theme); applyProjector(); applyMotion(); }

export { applyTheme, applyProjector, applyMotion, applyThemeBundle };
