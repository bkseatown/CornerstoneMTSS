/**
 * app.js — Word Quest v2
 * Entry point. Wires all modules together.
 * Features: theme, projector mode, reduced motion, voice picker,
 * dismissible duplicate-letter toast, confetti, "Hear Word/Sentence"
 * during gameplay.
 */

(async () => {
  const FEATURES = Object.freeze({
    tileFlipAnimation: true,
    streakSystem: true,
    adaptiveDifficulty: true
  });
  window.WQSafeFeatures = FEATURES;
  const DEMO_WORDS = Object.freeze(['plant', 'crane', 'shine', 'brave', 'grasp']);
  const DEMO_TARGET_WORD = DEMO_WORDS[0];
  function detectDemoMode() {
    let fromQuery = false;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const demoParam = String(params.get('demo') || '').trim().toLowerCase();
      const modeParam = String(params.get('mode') || '').trim().toLowerCase();
      fromQuery = demoParam === '1' || demoParam === 'true' || modeParam === 'demo';
    } catch {}
    return fromQuery || window.WQ_DEMO === true;
  }
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
  const DEMO_DEBUG_MODE = (() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return String(params.get('debug') || '').trim() === '1';
    } catch {
      return false;
    }
  })();

  function mountTeacherReturnButton() {
    let params;
    try { params = new URLSearchParams(window.location.search || ''); } catch (_e) { params = null; }
    if (!params || params.get('from') !== 'teacher') return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Back to Hub';
    btn.setAttribute('aria-label', 'Back to Hub');
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.left = '10px';
    btn.style.zIndex = '200';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '10px';
    btn.style.border = '1px solid rgba(255,255,255,0.3)';
    btn.style.background = 'rgba(15, 27, 43, 0.86)';
    btn.style.color = '#e9f2fb';
    btn.style.fontWeight = '700';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      window.location.href = withAppBase('teacher-hub-v2.html');
    });
    document.body.appendChild(btn);
  }

  function appBasePath() {
    var path = String((window.location && window.location.pathname) || '');
    var markers = ['/WordQuest/', '/Cornerstone%20MTSS/', '/Cornerstone MTSS/'];
    for (var i = 0; i < markers.length; i += 1) {
      var marker = markers[i];
      var idx = path.indexOf(marker);
      if (idx >= 0) return path.slice(0, idx + marker.length - 1);
    }
    try {
      var baseEl = document.querySelector('base[href]');
      if (baseEl) {
        var baseUrl = new URL(baseEl.getAttribute('href'), window.location.href);
        var basePath = String(baseUrl.pathname || '').replace(/\/+$/, '');
        if (basePath && basePath !== '/') return basePath;
      }
    } catch (_e) {}
    return '';
  }

  function withAppBase(path) {
    var clean = String(path || '').replace(/^\.?\//, '');
    return appBasePath() + '/' + clean;
  }

  function collectOverflowDiagnostics(limit = 10) {
    const viewportH = document.documentElement.clientHeight || window.innerHeight || 0;
    const viewportW = document.documentElement.clientWidth || window.innerWidth || 0;
    const nodes = Array.from(document.body ? document.body.querySelectorAll('*') : []);
    const offenders = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!el || !el.getBoundingClientRect) continue;
      const style = getComputedStyle(el);
      if (!style || style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.position === 'fixed') continue;
      const rect = el.getBoundingClientRect();
      if (!Number.isFinite(rect.bottom) || rect.height <= 0) continue;
      if (rect.right <= 0 || rect.left >= viewportW) continue;
      offenders.push({
        tag: el.tagName ? el.tagName.toLowerCase() : 'node',
        id: el.id || '',
        className: typeof el.className === 'string'
          ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')
          : '',
        bottom: Math.round(rect.bottom * 100) / 100,
        top: Math.round(rect.top * 100) / 100,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom
      });
    }
    offenders.sort((a, b) => b.bottom - a.bottom);
    return offenders.slice(0, Math.max(1, limit));
  }

  function logOverflowDiagnostics(tag) {
    if (!isDevModeEnabled()) return;
    requestAnimationFrame(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const viewportH = docEl ? docEl.clientHeight : window.innerHeight;
      const metrics = {
        tag: String(tag || 'runtime'),
        homeMode: document.documentElement.getAttribute('data-home-mode') || 'n/a',
        pageMode: document.documentElement.getAttribute('data-page-mode') || 'n/a',
        viewport: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`,
        docScrollHeight: docEl ? docEl.scrollHeight : 0,
        docClientHeight: docEl ? docEl.clientHeight : 0,
        bodyScrollHeight: body ? body.scrollHeight : 0,
        bodyClientHeight: body ? body.clientHeight : 0
      };
      const overflow = Math.max(
        metrics.docScrollHeight - metrics.docClientHeight,
        metrics.bodyScrollHeight - metrics.bodyClientHeight
      );
      if (overflow <= 0) {
        console.info('[WQ Overflow Diagnostics]', metrics, 'overflow=0');
        return;
      }
      const offenders = collectOverflowDiagnostics(8).filter((entry) => entry.bottom > viewportH - 1);
      console.groupCollapsed(`[WQ Overflow Diagnostics] ${metrics.tag} overflow=${overflow}px`);
      console.table(metrics);
      if (offenders.length) {
        console.table(offenders);
      } else {
        console.info('No visible non-fixed offenders exceeded viewport bottom.');
      }
      console.groupEnd();
    });
  }

  function assertHomeNoScrollDev() {
    if (!isDevModeEnabled()) return;
    if (document.documentElement.getAttribute('data-home-mode') !== 'home') return;
    requestAnimationFrame(() => {
      const root = document.documentElement;
      const scrollH = Number(root?.scrollHeight || 0);
      const clientH = Number(root?.clientHeight || 0);
      if (scrollH <= clientH) return;
      const overflow = collectOverflowDiagnostics(16).filter((entry) => entry.bottom > clientH - 1).slice(0, 5);
      console.warn('[WQ Home Overflow]', {
        scrollHeight: scrollH,
        clientHeight: clientH,
        overflowPx: scrollH - clientH,
        offenders: overflow
      });
    });
  }

  mountTeacherReturnButton();
  if (DEMO_MODE) {
    // Mark demo initialization; do not early-return the app bootstrap.
    window.__CS_DEMO_INIT_DONE = true;
    window.WQ_DEMO = true;
    document.documentElement.setAttribute('data-wq-demo', 'on');
    window.__CS_DEMO_STATE = window.__CS_DEMO_STATE || {
      step: 0,
      active: true,
      started: false
    };
    window.__CS_DEMO_TIMERS = window.__CS_DEMO_TIMERS || new Set();
  }

  function normalizeDemoRoute() {
    if (!DEMO_MODE) return false;
    try {
      const url = new URL(window.location.href);
      const pageParam = String(url.searchParams.get('page') || '').trim().toLowerCase();
      const demoParam = String(url.searchParams.get('demo') || '').trim().toLowerCase();
      const modeParam = String(url.searchParams.get('mode') || '').trim().toLowerCase();
      const needsFix =
        pageParam !== 'wordquest' ||
        (demoParam !== '1' && demoParam !== 'true') ||
        modeParam === 'demo';
      if (!needsFix) return false;
      url.searchParams.set('page', 'wordquest');
      url.searchParams.set('demo', '1');
      url.searchParams.delete('mode');
      window.location.replace(url.toString());
      return true;
    } catch {
      return false;
    }
  }
  if (normalizeDemoRoute()) return;

  function getDemoState() {
    if (!window.__CS_DEMO_STATE) {
      window.__CS_DEMO_STATE = { step: 0, active: true, started: false };
    }
    return window.__CS_DEMO_STATE;
  }

  function demoSetTimeout(callback, ms) {
    const timers = window.__CS_DEMO_TIMERS || (window.__CS_DEMO_TIMERS = new Set());
    const id = window.setTimeout(() => {
      timers.delete(id);
      callback();
    }, ms);
    timers.add(id);
    return id;
  }

  function demoClearTimers() {
    const timers = window.__CS_DEMO_TIMERS || (window.__CS_DEMO_TIMERS = new Set());
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  }

  function installDemoStorageGuard() {
    if (!DEMO_MODE || window.__WQ_DEMO_STORAGE_GUARD__) return;
    window.__WQ_DEMO_STORAGE_GUARD__ = true;
    const noop = () => {};
    try { localStorage.setItem = noop; } catch {}
    try { localStorage.removeItem = noop; } catch {}
    try { localStorage.clear = noop; } catch {}
    try {
      const storageProto = Object.getPrototypeOf(localStorage);
      if (storageProto) {
        storageProto.setItem = noop;
        storageProto.removeItem = noop;
        storageProto.clear = noop;
      }
    } catch {}
  }

  function installDemoFetchGuard() {
    if (!DEMO_MODE || window.__WQ_DEMO_FETCH_GUARD__ || typeof window.fetch !== 'function') return;
    window.__WQ_DEMO_FETCH_GUARD__ = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      const method = String(init?.method || 'GET').trim().toUpperCase() || 'GET';
      let targetUrl = '';
      try {
        targetUrl = String(input?.url || input || '');
      } catch {
        targetUrl = '';
      }
      let isSameOrigin = true;
      try {
        const parsed = new URL(targetUrl, window.location.href);
        isSameOrigin = parsed.origin === window.location.origin;
      } catch {}
      if (method !== 'GET' || !isSameOrigin) {
        return Promise.resolve(new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }));
      }
      return nativeFetch(input, init);
    };
  }

  installDemoStorageGuard();
  installDemoFetchGuard();

  // ─── Module initialization ─────────────────────────────────

  // Import all 11 modules
  try {
    const { loadData } = await import('./modules/app-data.js');
    const { initUI } = await import('./modules/app-ui.js');
    const { applyThemeBundle } = await import('./modules/app-theme.js');
    const { initSettings } = await import('./modules/app-settings.js');
    const { initFocus } = await import('./modules/app-focus.js');
    const { initGame, newGame } = await import('./modules/app-game.js');
    const { initInput } = await import('./modules/app-input.js');
    const { initAudio } = await import('./modules/app-audio.js');
    const { initToast } = await import('./modules/app-toast.js');

    console.info('[WordQuest] All modules imported successfully');

    // Initialize modules in order
    console.info('[WordQuest] Starting module initialization...');

    await loadData();
    console.info('[WordQuest] Data loaded');

    await initUI();
    console.info('[WordQuest] UI initialized');

    applyThemeBundle();
    console.info('[WordQuest] Theme applied');

    initSettings();
    console.info('[WordQuest] Settings initialized');

    initFocus();
    console.info('[WordQuest] Focus initialized');

    initGame();
    console.info('[WordQuest] Game initialized');

    initInput();
    console.info('[WordQuest] Input initialized');

    initAudio();
    console.info('[WordQuest] Audio initialized');

    initToast();
    console.info('[WordQuest] Toast initialized');

    console.info('[WordQuest] All modules initialized successfully');

    // Start the game
    newGame({ launchMissionLab: false });
    console.info('[WordQuest] Game started');

    logOverflowDiagnostics('app-startup');
    assertHomeNoScrollDev();
  } catch (err) {
    console.error('[WordQuest] Module initialization failed:', err);
    throw err;
  }

})();
