/**
 * app-startup-runtime.js
 * Startup helpers for page mode, theme normalization, and initial settings sync.
 */

function createStartupRuntimeModule(deps) {
  const {
    appRuntimeConfig = {},
    applyDevOnlyVisibility = () => {},
    applyFeedback = () => {},
    applyAtmosphere = () => {},
    applyBoardStyle = () => {},
    applyHint = () => {},
    applyKeyStyle = () => {},
    applyKeyboardLayout = () => {},
    applyMotion = () => {},
    applyPlayStyle = () => {},
    applyProjector = () => {},
    applyReportCompactMode = () => {},
    applyRevealFocusMode = () => {},
    applyStarterWordMode = () => {},
    applyTextSize = () => {},
    applyTheme = () => 'seahawks',
    applyUiSkin = () => {},
    documentRef = document,
    defaultPrefs = {},
    el = () => null,
    emitTelemetry = () => {},
    getHintMode = () => 'on',
    initHoverNoteToasts = () => {},
    installBuildConsistencyHeartbeat = () => {},
    loadSavedPreference = () => null,
    logRuntimeBuildDiagnostics = () => Promise.resolve(),
    missionLabEnabled = false,
    normalizeCuratedMusicMode = (mode) => mode,
    normalizeHeaderControlLayout = () => {},
    normalizeMasteryFilter = (value) => value,
    normalizeMasterySort = (value) => value,
    normalizeReportCompactMode = (value) => value,
    normalizeRevealAutoNext = (value) => value,
    normalizeRevealPacing = (value) => value,
    normalizeTeamCount = (value) => value,
    normalizeTeamMode = (value) => value,
    normalizeTeamSet = (value) => value,
    normalizeTurnTimer = (value) => value,
    normalizeVoiceMode = (value) => value,
    pageModeKey = 'wq_page_mode',
    populateVoiceSelector = () => {},
    prefs = {},
    runAutoCacheRepairForBuild = () => Promise.resolve(),
    runRemoteBuildConsistencyCheck = () => Promise.resolve(),
    savePrefs = () => {},
    setPref = () => {},
    shouldPersistTheme = () => true,
    syncBuildBadge = () => {},
    syncCaseToggleUI = () => {},
    syncHeaderStaticIcons = () => {},
    syncHintToggleUI = () => {},
    syncQuickMusicVolume = () => {},
    syncQuickSetupControls = () => {},
    syncPersistentVersionChip = () => {},
    updateWilsonModeToggle = () => {},
    themeRegistry = null,
    windowRef = window,
    WQUI = null
  } = deps || {};

  function resolveThemeRegistry() {
    if (typeof themeRegistry === 'function') {
      try {
        return themeRegistry() || null;
      } catch {
        return null;
      }
    }
    return themeRegistry || null;
  }

  const themeFamilyById = (() => {
    const map = new Map();
    const registry = resolveThemeRegistry();
    const themes = Array.isArray(registry?.themes) ? registry.themes : [];
    themes.forEach((theme) => {
      if (!theme || !theme.id) return;
      map.set(String(theme.id), String(theme.family || 'core'));
    });
    return map;
  })();

  function isMissionLabEnabled() {
    return !!missionLabEnabled;
  }

  function normalizePageMode(mode) {
    if (!isMissionLabEnabled()) return 'wordquest';
    return String(mode || '').trim().toLowerCase() === 'mission-lab'
      ? 'mission-lab'
      : 'wordquest';
  }

  function readPageModeFromQuery() {
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      const raw = params.get('page') || params.get('mode') || '';
      return normalizePageMode(raw);
    } catch {
      return 'wordquest';
    }
  }

  function loadStoredPageMode() {
    try {
      return normalizePageMode(windowRef.localStorage?.getItem(pageModeKey) || 'wordquest');
    } catch {
      return 'wordquest';
    }
  }

  function persistPageMode(mode) {
    try {
      windowRef.localStorage?.setItem(pageModeKey, normalizePageMode(mode));
    } catch {}
  }

  function getThemeFamily(themeId) {
    return themeFamilyById.get(String(themeId || '').toLowerCase()) || 'core';
  }

  function getThemeFallback() {
    return 'seahawks';
  }

  function normalizeTheme(theme, fallback = getThemeFallback()) {
    const registry = resolveThemeRegistry();
    if (registry && typeof registry.normalizeTheme === 'function') {
      return registry.normalizeTheme(theme, fallback);
    }
    return theme || fallback;
  }

  function readThemeFromQuery() {
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      const raw = params.get('theme') || '';
      const normalized = String(raw || '').trim();
      if (!normalized) return '';
      return normalizeTheme(normalized, getThemeFallback());
    } catch {
      return '';
    }
  }

  function initializeStartupPreferences() {
    const prefSelects = {
      'setting-focus': 'focus',
      's-lesson-pack': 'lessonPack',
      's-theme-save': 'themeSave',
      's-board-style': 'boardStyle',
      's-key-style': 'keyStyle',
      's-keyboard-layout': 'keyboardLayout',
      's-text-size': 'textSize',
      's-chunk-tabs': 'chunkTabs',
      's-atmosphere': 'atmosphere',
      's-ui-skin': 'uiSkin',
      's-reveal-focus': 'revealFocus',
      's-play-style': 'playStyle',
      's-reveal-pacing': 'revealPacing',
      's-reveal-auto-next': 'revealAutoNext',
      's-voice-task': 'voicePractice',
      's-team-mode': 'teamMode',
      's-team-count': 'teamCount',
      's-team-set': 'teamSet',
      's-turn-timer': 'turnTimer',
      's-probe-rounds': 'probeRounds',
      's-boost-popups': 'boostPopups',
      's-starter-words': 'starterWords',
      's-grade': 'grade',
      's-length': 'length',
      's-guesses': 'guesses',
      's-case': 'caseMode',
      's-hint': 'hint',
      's-smart-key-lock': 'smartKeyLock',
      's-dupe': 'dupe',
      's-confetti': 'confetti',
      's-projector': 'projector',
      's-motion': 'motion'
    };
    Object.entries(prefSelects).forEach(([id, key]) => {
      const element = el(id);
      if (!element) return;
      const next = prefs[key] !== undefined ? prefs[key] : defaultPrefs[key];
      if (next !== undefined) element.value = next;
    });

    const meaningPlusFunToggle = el('s-meaning-fun-link');
    if (meaningPlusFunToggle) {
      meaningPlusFunToggle.checked = (prefs.meaningPlusFun || defaultPrefs.meaningPlusFun) === 'on';
    }
    const sorNotationToggle = el('s-sor-notation');
    if (sorNotationToggle) {
      sorNotationToggle.checked = (prefs.sorNotation || defaultPrefs.sorNotation) === 'on';
    }
    const assessmentLockToggle = el('s-assessment-lock');
    if (assessmentLockToggle) {
      assessmentLockToggle.checked = (prefs.assessmentLock || defaultPrefs.assessmentLock) === 'on';
    }
    const reportCompactToggle = el('s-report-compact');
    if (reportCompactToggle) {
      reportCompactToggle.checked = normalizeReportCompactMode(prefs.reportCompact || defaultPrefs.reportCompact) === 'on';
    }
    const confidenceCoachingToggle = el('s-confidence-coaching');
    if (confidenceCoachingToggle) {
      confidenceCoachingToggle.checked = String(prefs.confidenceCoaching || defaultPrefs.confidenceCoaching).toLowerCase() !== 'off';
    }

    const masterySortSelect = el('s-mastery-sort');
    if (masterySortSelect) masterySortSelect.value = normalizeMasterySort(masterySortSelect.value || 'attempts_desc');
    const masteryFilterSelect = el('s-mastery-filter');
    if (masteryFilterSelect) masteryFilterSelect.value = normalizeMasteryFilter(masteryFilterSelect.value || 'all');

    const musicSelect = el('s-music');
    if (musicSelect) {
      const selectedMusic = normalizeCuratedMusicMode(prefs.music || defaultPrefs.music);
      musicSelect.value = selectedMusic;
      if (prefs.music !== selectedMusic) setPref('music', selectedMusic);
    }
    const musicVolInput = el('s-music-vol');
    if (musicVolInput) {
      musicVolInput.value = String(prefs.musicVol ?? defaultPrefs.musicVol);
      syncQuickMusicVolume(musicVolInput.value);
    } else {
      syncQuickMusicVolume(prefs.musicVol ?? defaultPrefs.musicVol);
    }

    const voiceSelect = el('s-voice');
    if (voiceSelect) {
      const selectedVoice = normalizeVoiceMode(prefs.voice || defaultPrefs.voice);
      voiceSelect.value = selectedVoice;
      if (prefs.voice !== selectedVoice) setPref('voice', selectedVoice);
    }
    const revealPacingSelect = el('s-reveal-pacing');
    if (revealPacingSelect) {
      const selectedPacing = normalizeRevealPacing(prefs.revealPacing || defaultPrefs.revealPacing);
      revealPacingSelect.value = selectedPacing;
      if (prefs.revealPacing !== selectedPacing) setPref('revealPacing', selectedPacing);
    }
    const revealAutoNextSelect = el('s-reveal-auto-next');
    if (revealAutoNextSelect) {
      const selectedAutoNext = normalizeRevealAutoNext(prefs.revealAutoNext || defaultPrefs.revealAutoNext);
      revealAutoNextSelect.value = selectedAutoNext;
      if (prefs.revealAutoNext !== selectedAutoNext) setPref('revealAutoNext', selectedAutoNext);
    }
    const teamModeSelect = el('s-team-mode');
    if (teamModeSelect) {
      const selectedTeamMode = normalizeTeamMode(prefs.teamMode || defaultPrefs.teamMode);
      teamModeSelect.value = selectedTeamMode;
      if (prefs.teamMode !== selectedTeamMode) setPref('teamMode', selectedTeamMode);
    }
    const teamCountSelect = el('s-team-count');
    if (teamCountSelect) {
      const selectedTeamCount = normalizeTeamCount(prefs.teamCount || defaultPrefs.teamCount);
      teamCountSelect.value = selectedTeamCount;
      if (prefs.teamCount !== selectedTeamCount) setPref('teamCount', selectedTeamCount);
    }
    const teamSetSelect = el('s-team-set');
    if (teamSetSelect) {
      const selectedTeamSet = normalizeTeamSet(prefs.teamSet || defaultPrefs.teamSet);
      teamSetSelect.value = selectedTeamSet;
      if (prefs.teamSet !== selectedTeamSet) setPref('teamSet', selectedTeamSet);
    }
    const turnTimerSelect = el('s-turn-timer');
    if (turnTimerSelect) {
      const selectedTurnTimer = normalizeTurnTimer(prefs.turnTimer || defaultPrefs.turnTimer);
      turnTimerSelect.value = selectedTurnTimer;
      if (prefs.turnTimer !== selectedTurnTimer) setPref('turnTimer', selectedTurnTimer);
    }

    syncBuildBadge();
    syncPersistentVersionChip();
    windowRef.addEventListener('cs-build-health', () => {
      syncBuildBadge();
      syncPersistentVersionChip();
    });
    applyDevOnlyVisibility();
    void runAutoCacheRepairForBuild();
    void runRemoteBuildConsistencyCheck();
    installBuildConsistencyHeartbeat();
    void logRuntimeBuildDiagnostics();

    const themeSelect = el('s-theme');
    const queryTheme = readThemeFromQuery();
    const initialThemeSelection = queryTheme || (shouldPersistTheme() ? prefs.theme : getThemeFallback());
    if (themeSelect && themeRegistry && typeof themeRegistry.renderThemeOptions === 'function') {
      themeRegistry.renderThemeOptions(themeSelect, initialThemeSelection || getThemeFallback());
    } else if (themeSelect && initialThemeSelection) {
      themeSelect.value = initialThemeSelection;
    }

    normalizeHeaderControlLayout();
    syncHeaderStaticIcons();
    initHoverNoteToasts();
    emitTelemetry('wq_session_start', { source: 'app_init' });
    emitTelemetry('wq_funnel_session_start', { source: 'app_init' });

    applyUiSkin(prefs.uiSkin || defaultPrefs.uiSkin, { persist: false });
    const initialTheme = applyTheme(initialThemeSelection || getThemeFallback());
    if (shouldPersistTheme()) {
      if (prefs.theme !== initialTheme) setPref('theme', initialTheme);
    } else if (prefs.theme !== undefined) {
      delete prefs.theme;
      savePrefs(prefs);
    }
    applyProjector(prefs.projector || defaultPrefs.projector);
    applyMotion(prefs.motion || defaultPrefs.motion);
    applyHint(getHintMode());
    applyPlayStyle(prefs.playStyle || defaultPrefs.playStyle, { persist: false });
    applyStarterWordMode(prefs.starterWords || defaultPrefs.starterWords, { persist: false });
    applyRevealFocusMode(prefs.revealFocus || defaultPrefs.revealFocus, { persist: false });
    applyFeedback(prefs.feedback || defaultPrefs.feedback);
    applyBoardStyle(prefs.boardStyle || defaultPrefs.boardStyle);
    applyKeyStyle(prefs.keyStyle || defaultPrefs.keyStyle);
    applyKeyboardLayout(prefs.keyboardLayout || defaultPrefs.keyboardLayout);
    applyTextSize(prefs.textSize || defaultPrefs.textSize);
    applyAtmosphere(prefs.atmosphere || defaultPrefs.atmosphere);
    WQUI?.setCaseMode?.(prefs.caseMode || defaultPrefs.caseMode);
    syncCaseToggleUI();
    updateWilsonModeToggle();
    syncHintToggleUI();
    syncQuickSetupControls();
    applyReportCompactMode(prefs.reportCompact || defaultPrefs.reportCompact, { persist: false });

    windowRef.setTimeout(populateVoiceSelector, 700);
    if (windowRef.speechSynthesis) {
      const priorVoicesChanged = windowRef.speechSynthesis.onvoiceschanged;
      windowRef.speechSynthesis.onvoiceschanged = (...args) => {
        if (typeof priorVoicesChanged === 'function') {
          try {
            priorVoicesChanged.apply(windowRef.speechSynthesis, args);
          } catch {}
        }
        populateVoiceSelector();
      };
    }
  }

  return {
    getThemeFamily,
    getThemeFallback,
    initializeStartupPreferences,
    isMissionLabEnabled,
    loadStoredPageMode,
    normalizePageMode,
    normalizeTheme,
    persistPageMode,
    readPageModeFromQuery,
    readThemeFromQuery
  };
}

window.createStartupRuntimeModule = createStartupRuntimeModule;
