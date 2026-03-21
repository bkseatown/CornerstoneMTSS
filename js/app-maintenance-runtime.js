/**
 * app-maintenance-runtime.js
 * App reset/update maintenance flow and review shuffle-bag helpers.
 */

function createMaintenanceRuntimeModule(deps) {
  const {
    appPrefKey = 'wordquest_prefs_v2',
    cachesRef = null,
    cancelRevealNarration = () => {},
    copyTextToClipboard = async () => {},
    defaultPrefs = {},
    demoMode = false,
    diagnosticsLastResetKey = 'wq_diag_last_reset',
    documentRef = document,
    emitTelemetry = () => {},
    fetchImpl = (...args) => fetch(...args),
    firstRunSetupKey = 'wq_first_run_setup',
    getThemeFallback = () => 'seahawks',
    locationRef = location,
    localStorageRef = localStorage,
    markDiagnosticsReset = () => ({ ts: Date.now(), reason: 'maintenance' }),
    navigatorRef = navigator,
    normalizeReviewWord = (word) => String(word || '').trim().toLowerCase().replace(/[^a-z]/g, ''),
    openFirstRunSetupModal = () => {},
    pageReload = (url) => location.replace(url),
    persistTheme = () => true,
    prefs = {},
    resolveBuildLabel = () => '',
    reviewQueueKey = 'wq_review_queue',
    reviewQueueMaxItems = 24,
    savePrefs = () => {},
    sessionStorageRef = null,
    setFirstRunSetupPending = () => {},
    setPref = () => {},
    setTimeoutRef = setTimeout,
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

  function buildStableShareLinkUrl() {
    const url = new URL(windowRef.location.href);
    url.searchParams.delete('cb');
    return url.toString();
  }

  async function copyReviewLink() {
    await copyTextToClipboard(
      buildStableShareLinkUrl(),
      'Share link copied. This link always points to the latest deployed version.',
      'Could not copy share link on this device.'
    );
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

  async function runAutoCacheRepairForBuild() {
    if (demoMode) return;
    const cacheRepairBuildKey = 'wq_v2_cache_repair_build_v1';
    const buildLabel = resolveBuildLabel();
    if (!buildLabel) return;
    let priorBuild = '';
    try {
      priorBuild = String(localStorageRef?.getItem(cacheRepairBuildKey) || '');
      localStorageRef?.setItem?.(cacheRepairBuildKey, buildLabel);
    } catch {
      priorBuild = '';
    }
    if (priorBuild === buildLabel) return;
    if (!('caches' in windowRef)) return;
    try {
      const names = await windowRef.caches.keys();
      const targets = names.filter((name) => String(name || '').startsWith('wq-'));
      if (targets.length) await Promise.all(targets.map((name) => windowRef.caches.delete(name)));
    } catch {}
    if ('serviceWorker' in navigatorRef) {
      try {
        const registrations = await navigatorRef.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
      } catch {}
    }
  }

  async function runRemoteBuildConsistencyCheck() {
    if (demoMode) return;
    if (new URLSearchParams(locationRef.search || '').get('audit') === '1') return;
    const buildRemoteCheckKey = 'wq_v2_build_remote_check_v1';
    const currentBuild = resolveBuildLabel();
    if (!currentBuild) return;

    const checkMarker = `${locationRef.pathname}::${currentBuild}`;
    try {
      if (sessionStorageRef?.getItem(buildRemoteCheckKey) === checkMarker) return;
      sessionStorageRef?.setItem?.(buildRemoteCheckKey, checkMarker);
    } catch {}

    try {
      const probeUrl = `./index.html?cb=build-check-${Date.now()}`;
      const response = await fetchImpl(probeUrl, { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const match = html.match(/js\/app\.js\?v=([^"'&#]+)/i);
      const deployedBuild = match?.[1] ? decodeURIComponent(match[1]).trim() : '';
      if (!deployedBuild || deployedBuild === currentBuild) return;

      if ('caches' in windowRef) {
        try {
          const names = await windowRef.caches.keys();
          const targets = names.filter((name) => String(name || '').startsWith('wq-'));
          if (targets.length) await Promise.all(targets.map((name) => windowRef.caches.delete(name)));
        } catch {}
      }

      if ('serviceWorker' in navigatorRef) {
        try {
          const registrations = await navigatorRef.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(async (registration) => {
            registration.waiting?.postMessage({ type: 'WQ_SKIP_WAITING' });
            await registration.update().catch(() => {});
          }));
        } catch {}
      }

      const reloadKey = 'wq_v2_build_sync_once_v1';
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorageRef?.getItem(reloadKey) === deployedBuild;
      } catch {}
      if (alreadyReloaded) return;
      try {
        sessionStorageRef?.setItem?.(reloadKey, deployedBuild);
      } catch {}

      showToast('Update available. Refreshing...');
      const params = new URLSearchParams(locationRef.search || '');
      params.set('cb', `build-sync-${deployedBuild}-${Date.now()}`);
      const nextUrl = `${locationRef.pathname}${params.toString() ? `?${params.toString()}` : ''}${locationRef.hash || ''}`;
      setTimeoutRef(() => locationRef.replace(nextUrl), 380);
    } catch {}
  }

  function installBuildConsistencyHeartbeat() {
    if (demoMode) return;
    const heartbeatMs = 5 * 60 * 1000;
    setInterval(() => { void runRemoteBuildConsistencyCheck(); }, heartbeatMs);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void runRemoteBuildConsistencyCheck();
      }
    });
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
    buildStableShareLinkUrl,
    copyReviewLink,
    forceUpdateNow,
    installBuildConsistencyHeartbeat,
    primeShuffleBagWithWord,
    resetAppearanceAndCache,
    runAutoCacheRepairForBuild,
    runRemoteBuildConsistencyCheck,
    runForceUpdateNow
  };
}

window.createMaintenanceRuntimeModule = createMaintenanceRuntimeModule;
