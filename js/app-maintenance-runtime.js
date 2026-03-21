/**
 * app-maintenance-runtime.js
 * App reset/update maintenance flow and review shuffle-bag helpers.
 */

function createMaintenanceRuntimeModule(deps) {
  const {
    appPrefKey = 'wordquest_prefs_v2',
    cachesRef = null,
    cancelRevealNarration = () => {},
    defaultPrefs = {},
    diagnosticsLastResetKey = 'wq_diag_last_reset',
    documentRef = document,
    emitTelemetry = () => {},
    firstRunSetupKey = 'wq_first_run_setup',
    getThemeFallback = () => 'seahawks',
    locationRef = location,
    localStorageRef = localStorage,
    markDiagnosticsReset = () => ({ ts: Date.now(), reason: 'maintenance' }),
    normalizeReviewWord = (word) => String(word || '').trim().toLowerCase().replace(/[^a-z]/g, ''),
    openFirstRunSetupModal = () => {},
    pageReload = (url) => location.replace(url),
    persistTheme = () => true,
    prefs = {},
    reviewQueueKey = 'wq_review_queue',
    reviewQueueMaxItems = 24,
    savePrefs = () => {},
    setFirstRunSetupPending = () => {},
    setPref = () => {},
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    stopVoiceCaptureNow = () => {},
    syncAssessmentLockRuntime = () => {},
    syncClassroomTurnRuntime = () => {},
    syncHeaderControlsVisibility = () => {},
    syncTeacherPresetButtons = () => {},
    uiApply = {},
    updateWilsonModeToggle = () => {},
    waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    windowRef = window
  } = deps || {};

  function buildShuffleBagKey(scope) {
    return `${reviewQueueKey}:${scope}`;
  }

  function primeShuffleBagWithWord(scope, word) {
    const normalizedWord = normalizeReviewWord(word);
    if (!scope || !normalizedWord) return;
    const bagKey = buildShuffleBagKey(scope);
    let prior = { queue: [], last: '' };
    try {
      const parsed = JSON.parse(localStorageRef.getItem(bagKey) || 'null');
      if (parsed && Array.isArray(parsed.queue)) prior = parsed;
    } catch {}
    const cleanedQueue = prior.queue
      .map((item) => normalizeReviewWord(item))
      .filter((item) => item && item !== normalizedWord)
      .slice(-Math.max(0, reviewQueueMaxItems - 1));
    cleanedQueue.push(normalizedWord);
    try {
      localStorageRef.setItem(bagKey, JSON.stringify({
        queue: cleanedQueue,
        last: normalizeReviewWord(prior.last)
      }));
    } catch {}
  }

  async function resetAppearanceAndCache(options = {}) {
    if (options.isAssessmentRoundLocked?.()) {
      showAssessmentLockNotice('Finish this round first, then reset appearance.');
      return;
    }

    cancelRevealNarration();
    stopVoiceCaptureNow();

    try { localStorageRef.removeItem(appPrefKey); } catch {}
    Object.keys(prefs).forEach((key) => { delete prefs[key]; });

    const fallbackTheme = getThemeFallback();
    const normalizedTheme = options.applyTheme?.(fallbackTheme) || fallbackTheme;
    delete prefs.theme;
    setPref('themeSave', defaultPrefs.themeSave);
    setPref('boardStyle', uiApply.applyBoardStyle?.(defaultPrefs.boardStyle) || defaultPrefs.boardStyle);
    setPref('keyStyle', uiApply.applyKeyStyle?.(defaultPrefs.keyStyle) || defaultPrefs.keyStyle);
    setPref('keyboardLayout', uiApply.applyKeyboardLayout?.(defaultPrefs.keyboardLayout) || defaultPrefs.keyboardLayout);
    setPref('chunkTabs', uiApply.applyChunkTabsMode?.(defaultPrefs.chunkTabs) || defaultPrefs.chunkTabs);
    options.syncChunkTabsVisibility?.();
    setPref('atmosphere', uiApply.applyAtmosphere?.(defaultPrefs.atmosphere) || defaultPrefs.atmosphere);
    setPref('textSize', uiApply.applyTextSize?.(defaultPrefs.textSize) || defaultPrefs.textSize);
    setPref('uiSkin', options.applyUiSkin?.(defaultPrefs.uiSkin, { persist: false }) || defaultPrefs.uiSkin);
    setPref('motion', defaultPrefs.motion);
    setPref('feedback', defaultPrefs.feedback);
    setPref('projector', defaultPrefs.projector);
    setPref('caseMode', defaultPrefs.caseMode);
    setPref('playStyle', options.applyPlayStyle?.(defaultPrefs.playStyle) || defaultPrefs.playStyle);
    setPref('revealPacing', defaultPrefs.revealPacing);
    setPref('revealAutoNext', defaultPrefs.revealAutoNext);
    setPref('teamMode', defaultPrefs.teamMode);
    setPref('teamCount', defaultPrefs.teamCount);
    setPref('teamSet', defaultPrefs.teamSet);
    setPref('turnTimer', defaultPrefs.turnTimer);
    setPref('smartKeyLock', defaultPrefs.smartKeyLock);
    setPref('confidenceCoaching', defaultPrefs.confidenceCoaching);

    const valueMap = {
      's-theme-save': defaultPrefs.themeSave,
      's-ui-skin': defaultPrefs.uiSkin,
      's-motion': defaultPrefs.motion,
      's-text-size': defaultPrefs.textSize,
      's-feedback': defaultPrefs.feedback,
      's-projector': defaultPrefs.projector,
      's-case': defaultPrefs.caseMode,
      's-play-style': defaultPrefs.playStyle,
      's-reveal-pacing': defaultPrefs.revealPacing,
      's-reveal-auto-next': defaultPrefs.revealAutoNext,
      's-team-mode': defaultPrefs.teamMode,
      's-team-count': defaultPrefs.teamCount,
      's-team-set': defaultPrefs.teamSet,
      's-turn-timer': defaultPrefs.turnTimer,
      's-smart-key-lock': defaultPrefs.smartKeyLock
    };
    Object.entries(valueMap).forEach(([id, value]) => {
      const node = documentRef.getElementById(id);
      if (node) node.value = value;
    });
    const confidenceToggle = documentRef.getElementById('s-confidence-coaching');
    if (confidenceToggle) confidenceToggle.checked = defaultPrefs.confidenceCoaching === 'on';

    options.applyProjector?.(defaultPrefs.projector);
    options.applyUiSkin?.(defaultPrefs.uiSkin, { persist: false });
    options.applyMotion?.(defaultPrefs.motion);
    uiApply.applyTextSize?.(defaultPrefs.textSize);
    uiApply.applyFeedback?.(defaultPrefs.feedback);
    deps.WQUI?.setCaseMode?.(defaultPrefs.caseMode);
    syncClassroomTurnRuntime({ resetTurn: true });
    updateWilsonModeToggle();
    syncTeacherPresetButtons();
    syncHeaderControlsVisibility();

    try { windowRef.sessionStorage?.removeItem('wq_sw_controller_reloaded'); } catch {}
    markDiagnosticsReset('appearance_reset');
    emitTelemetry('wq_funnel_reset_used', { source: 'settings' });

    let clearedCaches = 0;
    if (cachesRef && 'keys' in cachesRef) {
      try {
        const names = await cachesRef.keys();
        const targets = names.filter((name) => name.startsWith('wq-'));
        await Promise.all(targets.map((name) => cachesRef.delete(name)));
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

    showToast(clearedCaches
      ? `Appearance reset. Cleared ${clearedCaches} cache bucket(s). Refreshing...`
      : 'Appearance reset. Refreshing...');

    const resetUrl = `${locationRef.pathname}?cb=appearance-reset-${Date.now()}`;
    setTimeout(() => { pageReload(resetUrl); }, 460);

    if (persistTheme()) {
      setPref('theme', normalizedTheme);
    } else if (prefs.theme !== undefined) {
      delete prefs.theme;
      savePrefs(prefs);
    }
  }

  async function runForceUpdateNow(options = {}) {
    cancelRevealNarration();
    stopVoiceCaptureNow();

    try { windowRef.sessionStorage?.removeItem('wq_sw_controller_reloaded'); } catch {}
    try { windowRef.sessionStorage?.removeItem('wq_v2_build_remote_check_v1'); } catch {}
    try { localStorageRef.removeItem('wq_v2_cache_repair_build_v1'); } catch {}
    markDiagnosticsReset('force_update');
    emitTelemetry('wq_funnel_force_update_used', { source: 'settings' });

    let clearedCaches = 0;
    if (cachesRef && 'keys' in cachesRef) {
      try {
        const names = await cachesRef.keys();
        const targets = names.filter((name) => String(name || '').startsWith('wq-'));
        if (targets.length) {
          await Promise.all(targets.map((name) => cachesRef.delete(name)));
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
      showToast(`Refreshing to load the latest update (${clearedCaches} cache bucket(s), ${unregistered} service worker reset).`);
    }
    const nextUrl = `${locationRef.pathname}?cb=force-update-${Date.now()}${locationRef.hash || ''}`;
    setTimeout(() => { pageReload(nextUrl); }, 280);
  }

  async function forceUpdateNow() {
    if (!windowRef.confirm('Force update now? This clears offline cache and reloads the latest build.')) return;
    await runForceUpdateNow();
  }

  return {
    forceUpdateNow,
    primeShuffleBagWithWord,
    resetAppearanceAndCache,
    runForceUpdateNow
  };
}

window.createMaintenanceRuntimeModule = createMaintenanceRuntimeModule;
