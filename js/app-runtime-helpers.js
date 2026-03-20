(function initCSAppRuntimeHelpers(global) {
  function detectDemoMode() {
    let fromQuery = false;
    try {
      const params = new URLSearchParams(global.location.search || '');
      const demoParam = String(params.get('demo') || '').trim().toLowerCase();
      const modeParam = String(params.get('mode') || '').trim().toLowerCase();
      fromQuery = demoParam === '1' || demoParam === 'true' || modeParam === 'demo';
    } catch {}
    return fromQuery || global.WQ_DEMO === true;
  }

  function detectDemoDebugMode() {
    try {
      const params = new URLSearchParams(global.location.search || '');
      return String(params.get('debug') || '').trim() === '1';
    } catch {
      return false;
    }
  }

  function appBasePath() {
    const path = String((global.location && global.location.pathname) || '');
    const markers = ['/WordQuest/', '/CornerstoneMTSS/', '/Cornerstone%20MTSS/', '/Cornerstone MTSS/'];
    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const idx = path.indexOf(marker);
      if (idx >= 0) return path.slice(0, idx + marker.length - 1);
    }
    try {
      const baseEl = global.document.querySelector('base[href]');
      if (baseEl) {
        const baseUrl = new URL(baseEl.getAttribute('href'), global.location.href);
        const basePath = String(baseUrl.pathname || '').replace(/\/+$/, '');
        if (basePath && basePath !== '/') return basePath;
      }
    } catch {}
    return '';
  }

  function withAppBase(path) {
    const clean = String(path || '').replace(/^\.?\//, '');
    return `${appBasePath()}/${clean}`;
  }

  function mountTeacherReturnButton() {
    let params;
    try {
      params = new URLSearchParams(global.location.search || '');
    } catch {
      params = null;
    }
    if (!params || params.get('from') !== 'teacher') return;
    const btn = global.document.createElement('button');
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
      global.location.href = withAppBase('teacher-hub-v2.html');
    });
    global.document.body.appendChild(btn);
  }

  function collectOverflowDiagnostics(limit = 10) {
    const viewportH = global.document.documentElement.clientHeight || global.innerHeight || 0;
    const viewportW = global.document.documentElement.clientWidth || global.innerWidth || 0;
    const nodes = Array.from(global.document.body ? global.document.body.querySelectorAll('*') : []);
    const offenders = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!el || !el.getBoundingClientRect) continue;
      const style = global.getComputedStyle(el);
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

  function logOverflowDiagnostics(tag, isDevModeEnabled) {
    if (typeof isDevModeEnabled === 'function' && !isDevModeEnabled()) return;
    global.requestAnimationFrame(() => {
      const docEl = global.document.documentElement;
      const body = global.document.body;
      const viewportH = docEl ? docEl.clientHeight : global.innerHeight;
      const metrics = {
        tag: String(tag || 'runtime'),
        homeMode: global.document.documentElement.getAttribute('data-home-mode') || 'n/a',
        pageMode: global.document.documentElement.getAttribute('data-page-mode') || 'n/a',
        viewport: `${Math.round(global.innerWidth)}x${Math.round(global.innerHeight)}`,
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
        global.console.info('[WQ Overflow Diagnostics]', metrics, 'overflow=0');
        return;
      }
      const offenders = collectOverflowDiagnostics(8).filter((entry) => entry.bottom > viewportH - 1);
      global.console.groupCollapsed(`[WQ Overflow Diagnostics] ${metrics.tag} overflow=${overflow}px`);
      global.console.table(metrics);
      if (offenders.length) {
        global.console.table(offenders);
      } else {
        global.console.info('No visible non-fixed offenders exceeded viewport bottom.');
      }
      global.console.groupEnd();
    });
  }

  function assertHomeNoScrollDev(isDevModeEnabled) {
    if (typeof isDevModeEnabled === 'function' && !isDevModeEnabled()) return;
    if (global.document.documentElement.getAttribute('data-home-mode') !== 'home') return;
    global.requestAnimationFrame(() => {
      const root = global.document.documentElement;
      const scrollH = Number(root?.scrollHeight || 0);
      const clientH = Number(root?.clientHeight || 0);
      if (scrollH <= clientH) return;
      const overflow = collectOverflowDiagnostics(16)
        .filter((entry) => entry.bottom > clientH - 1)
        .slice(0, 5);
      global.console.warn('[WQ Home Overflow]', {
        scrollHeight: scrollH,
        clientHeight: clientH,
        overflowPx: scrollH - clientH,
        offenders: overflow
      });
    });
  }

  function initializeDemoGlobals(enabled) {
    if (!enabled) return;
    global.__CS_DEMO_INIT_DONE = true;
    global.WQ_DEMO = true;
    global.document.documentElement.setAttribute('data-wq-demo', 'on');
    global.__CS_DEMO_STATE = global.__CS_DEMO_STATE || {
      step: 0,
      active: true,
      started: false
    };
    global.__CS_DEMO_TIMERS = global.__CS_DEMO_TIMERS || new Set();
  }

  function normalizeDemoRoute(enabled) {
    if (!enabled) return false;
    try {
      const url = new URL(global.location.href);
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
      global.location.replace(url.toString());
      return true;
    } catch {
      return false;
    }
  }

  function getDemoState() {
    if (!global.__CS_DEMO_STATE) {
      global.__CS_DEMO_STATE = { step: 0, active: true, started: false };
    }
    return global.__CS_DEMO_STATE;
  }

  function demoSetTimeout(callback, ms) {
    const timers = global.__CS_DEMO_TIMERS || (global.__CS_DEMO_TIMERS = new Set());
    const id = global.setTimeout(() => {
      timers.delete(id);
      callback();
    }, ms);
    timers.add(id);
    return id;
  }

  function demoClearTimers() {
    const timers = global.__CS_DEMO_TIMERS || (global.__CS_DEMO_TIMERS = new Set());
    timers.forEach((id) => global.clearTimeout(id));
    timers.clear();
  }

  function installDemoStorageGuard(enabled) {
    if (!enabled || global.__WQ_DEMO_STORAGE_GUARD__) return;
    global.__WQ_DEMO_STORAGE_GUARD__ = true;
    const noop = () => {};
    try { global.localStorage.setItem = noop; } catch {}
    try { global.localStorage.removeItem = noop; } catch {}
    try { global.localStorage.clear = noop; } catch {}
    try {
      const storageProto = Object.getPrototypeOf(global.localStorage);
      if (storageProto) {
        storageProto.setItem = noop;
        storageProto.removeItem = noop;
        storageProto.clear = noop;
      }
    } catch {}
  }

  function installDemoFetchGuard(enabled) {
    if (!enabled || global.__WQ_DEMO_FETCH_GUARD__ || typeof global.fetch !== 'function') return;
    global.__WQ_DEMO_FETCH_GUARD__ = true;
    const nativeFetch = global.fetch.bind(global);
    global.fetch = (input, init = {}) => {
      const method = String(init?.method || 'GET').trim().toUpperCase() || 'GET';
      let targetUrl = '';
      try {
        targetUrl = String(input?.url || input || '');
      } catch {
        targetUrl = '';
      }
      let isSameOrigin = true;
      try {
        const parsed = new URL(targetUrl, global.location.href);
        isSameOrigin = parsed.origin === global.location.origin;
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

  global.CSAppRuntimeHelpers = {
    appBasePath,
    assertHomeNoScrollDev,
    collectOverflowDiagnostics,
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
  };
})(window);
