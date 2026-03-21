/**
 * app.js — Word Quest v2
 * Bootstrap entry point. Loads data, initializes runtime helpers,
 * and hands off the main experience to word-quest-runtime.js.
 */

(async () => {
  const runtimeHelpers = window.CSAppRuntimeHelpers || {};
  const {
    assertHomeNoScrollDev,
    demoClearTimers,
    demoSetTimeout,
    detectDemoDebugMode,
    detectDemoMode,
    getDemoState,
    initializeDemoGlobals,
    installDemoFetchGuard,
    installDemoStorageGuard,
    logOverflowDiagnostics,
    mountTeacherReturnButton,
    normalizeDemoRoute,
    withAppBase
  } = runtimeHelpers;
  const FEATURES = Object.freeze({
    tileFlipAnimation: true,
    streakSystem: true,
    adaptiveDifficulty: true
  });
  window.WQSafeFeatures = FEATURES;
  const DEMO_WORDS = Object.freeze(['plant', 'crane', 'shine', 'brave', 'grasp']);
  const DEMO_TARGET_WORD = DEMO_WORDS[0];
  const DEMO_MODE = detectDemoMode();
  const isDevModeEnabled = (() => {
    const fallback = () => {
      try {
        const params = new URLSearchParams(window.location.search || '');
        if (String(params.get('env') || '').toLowerCase() === 'dev') return true;
      } catch {}
      try {
        return localStorage.getItem('cs_allow_dev') === '1';
      } catch {
        return false;
      }
    };
    if (window.CSAppMode && typeof window.CSAppMode.isDevMode === 'function') {
      return () => !!window.CSAppMode.isDevMode();
    }
    return fallback;
  })();
  const DEMO_DEBUG_MODE = detectDemoDebugMode();
  const logOverflow = (tag) => logOverflowDiagnostics(tag, isDevModeEnabled);
  const assertHomeNoScroll = () => assertHomeNoScrollDev(isDevModeEnabled);

  mountTeacherReturnButton();
  initializeDemoGlobals(DEMO_MODE);
  if (normalizeDemoRoute(DEMO_MODE)) return;
  installDemoStorageGuard(DEMO_MODE);
  installDemoFetchGuard(DEMO_MODE);

  // ─── 1. Load data ──────────────────────────────────
  const loadingEl = document.getElementById('loading-screen');
  const LOADING_WATCHDOG_MS = 18000;
  var loadingRecoveryShown = false;

  function buildCacheBustedUrl() {
    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set('cb', String(Date.now()));
    return nextUrl.toString();
  }

  async function clearRuntimeCacheAndReload() {
    if (typeof window !== 'undefined') window.__WQ_LOADING_RECOVERY_RUNNING__ = true;
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        const targets = names.filter((name) => String(name || '').startsWith('wq-'));
        if (targets.length) await Promise.all(targets.map((name) => caches.delete(name)));
      }
    } catch {}
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length) {
          await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
        }
      }
    } catch {}
    try { sessionStorage.removeItem('wq_sw_controller_reloaded'); } catch {}
    location.replace(buildCacheBustedUrl());
  }

  function showLoadingRecovery(message) {
    if (!loadingEl || loadingRecoveryShown) return;
    loadingRecoveryShown = true;
    const label = loadingEl.querySelector('span');
    if (label) label.textContent = String(message || 'Still loading...');
    const panel = document.createElement('div');
    panel.className = 'loading-recovery-panel';

    const detail = document.createElement('p');
    detail.className = 'loading-recovery-text';
    detail.textContent = 'This tab may be on an older cached build.';
    panel.appendChild(detail);

    const actions = document.createElement('div');
    actions.className = 'loading-recovery-actions';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'loading-recovery-btn loading-recovery-btn-primary';
    resetBtn.textContent = 'Reset App Cache';
    resetBtn.addEventListener('click', async () => {
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetting...';
      await clearRuntimeCacheAndReload();
    });
    actions.appendChild(resetBtn);

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'loading-recovery-btn';
    retryBtn.textContent = 'Reload';
    retryBtn.addEventListener('click', () => {
      location.replace(buildCacheBustedUrl());
    });
    actions.appendChild(retryBtn);
    panel.appendChild(actions);
    loadingEl.appendChild(panel);
  }

  loadingEl?.classList.remove('hidden');
  const loadingWatchdog = setTimeout(() => {
    showLoadingRecovery('Still loading. You can repair this tab.');
  }, LOADING_WATCHDOG_MS);
  try {
    await WQData.load();
    clearTimeout(loadingWatchdog);
  } catch (error) {
    clearTimeout(loadingWatchdog);
    console.warn('[WordQuest] Data load failed:', error?.message || error);
    showLoadingRecovery('Load failed. Repair cache and retry.');
    return;
  }
  loadingEl?.classList.add('hidden');

  // ─── 2. Init UI ────────────────────────────────────
  WQUI.init();

  const APP_SEMVER = '1.0.0';
  const SW_RUNTIME_VERSION = '20260302-v1';
  function resolveSwRuntimeVersion() {
    try {
      const payload = window.CS_BUILD || window.__BUILD__ || window.__CS_BUILD__ || {};
      const buildId = String(payload.buildId || payload.stamp || payload.version || '').trim();
      if (buildId) return buildId;
    } catch {}
    try {
      const qp = String(new URLSearchParams(window.location.search || '').get('v') || '').trim();
      if (qp) return qp;
    } catch {}
    return SW_RUNTIME_VERSION;
  }
  const SW_RUNTIME_RESOLVED_VERSION = resolveSwRuntimeVersion();

  if (typeof window.runWordQuestMain !== 'function') {
    throw new Error('Word Quest main runtime is unavailable: window.runWordQuestMain is not loaded.');
  }

  await window.runWordQuestMain({
    APP_SEMVER,
    DEMO_DEBUG_MODE,
    DEMO_MODE,
    DEMO_TARGET_WORD,
    FEATURES,
    SW_RUNTIME_RESOLVED_VERSION,
    assertHomeNoScroll,
    demoClearTimers,
    demoSetTimeout,
    getDemoState,
    isDevModeEnabled,
    logOverflow,
    withAppBase
  });
})();
