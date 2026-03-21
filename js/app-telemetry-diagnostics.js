/**
 * app-telemetry-diagnostics.js
 * Telemetry queueing, build metadata, and runtime diagnostics helpers.
 */

function createTelemetryDiagnosticsModule(deps) {
  const {
    appSemver = '0.0.0',
    copyTextToClipboard = async () => {},
    defaultPrefs = {},
    demoMode = false,
    diagnosticsLastResetKey = '',
    documentRef = document,
    el = () => null,
    fetchImpl = (...args) => fetch(...args),
    getEffectiveGameplayGradeBand = () => 'all',
    getFocusValue = () => 'all',
    getGameState = () => ({}),
    getGradeValue = () => 'all',
    getLengthValue = () => '5',
    getLessonPackValue = () => 'custom',
    getLessonTargetValue = () => 'custom',
    getVoiceValue = () => 'recorded',
    isDevModeEnabled = () => false,
    localStorageRef = null,
    locationRef = location,
    navigatorRef = navigator,
    normalizeLessonPackId = (value) => String(value || '').trim() || 'custom',
    normalizeLessonTargetId = (_pack, value) => String(value || '').trim() || 'custom',
    normalizePageMode = (value) => value,
    loadStoredPageMode = () => 'word-quest',
    normalizePlayStyle = (value) => value,
    readPageModeAttr = () => '',
    prefs = {},
    swRuntimeResolvedVersion = '',
    telemetryDeviceIdKey = '',
    telemetryEnabledKey = '',
    telemetryEndpointKey = '',
    telemetryLastUploadKey = '',
    telemetryQueueKey = '',
    telemetryQueueLimit = 500,
    telemetrySessionId = '',
    windowRef = window
  } = deps || {};

  let telemetryUploadInFlight = false;
  let telemetryUploadIntervalId = 0;

  function readTelemetryEnabled() {
    try {
      const raw = String(localStorageRef?.getItem(telemetryEnabledKey) || '').trim().toLowerCase();
      if (!raw) return true;
      return raw !== 'off' && raw !== '0' && raw !== 'false';
    } catch {
      return true;
    }
  }

  function getTelemetryDeviceId() {
    let deviceId = '';
    try {
      deviceId = String(localStorageRef?.getItem(telemetryDeviceIdKey) || '').trim();
      if (!deviceId) {
        deviceId = `dev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
        localStorageRef?.setItem?.(telemetryDeviceIdKey, deviceId);
      }
    } catch {
      deviceId = `dev_mem_${Math.random().toString(36).slice(2, 10)}`;
    }
    return deviceId;
  }

  function getTelemetryQueue() {
    try {
      const parsed = JSON.parse(localStorageRef?.getItem(telemetryQueueKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setTelemetryQueue(queue) {
    try {
      localStorageRef?.setItem?.(
        telemetryQueueKey,
        JSON.stringify(Array.isArray(queue) ? queue.slice(-telemetryQueueLimit) : [])
      );
    } catch {}
  }

  function normalizeTelemetryEndpoint(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (value.startsWith('/')) return value;
    if (/^https?:\/\//i.test(value)) return value;
    return '';
  }

  function resolveTelemetryEndpoint() {
    if (demoMode) return '';
    let queryValue = '';
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      queryValue = params.get('telemetry_endpoint') || params.get('telemetryEndpoint') || '';
    } catch {}
    const queryEndpoint = normalizeTelemetryEndpoint(queryValue);
    if (queryEndpoint) {
      try { localStorageRef?.setItem?.(telemetryEndpointKey, queryEndpoint); } catch {}
      return queryEndpoint;
    }
    try {
      return normalizeTelemetryEndpoint(localStorageRef?.getItem(telemetryEndpointKey) || '');
    } catch {
      return '';
    }
  }

  function getTelemetryUploadMeta() {
    try {
      const parsed = JSON.parse(localStorageRef?.getItem(telemetryLastUploadKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        ts: Math.max(0, Number(parsed.ts) || 0),
        count: Math.max(0, Number(parsed.count) || 0),
        endpoint: normalizeTelemetryEndpoint(parsed.endpoint || '')
      };
    } catch {
      return null;
    }
  }

  function setTelemetryUploadMeta(meta) {
    const row = {
      ts: Date.now(),
      count: Math.max(0, Number(meta?.count) || 0),
      endpoint: normalizeTelemetryEndpoint(meta?.endpoint || '')
    };
    try { localStorageRef?.setItem?.(telemetryLastUploadKey, JSON.stringify(row)); } catch {}
  }

  async function uploadTelemetryQueue(reason = 'manual', options = {}) {
    if (telemetryUploadInFlight) return false;
    const endpoint = resolveTelemetryEndpoint();
    if (!endpoint || !readTelemetryEnabled()) return false;
    const queue = getTelemetryQueue();
    if (!queue.length) return true;
    telemetryUploadInFlight = true;
    try {
      const rows = queue.slice(-200);
      const payload = {
        app: 'word-quest',
        reason: String(reason || 'manual').trim() || 'manual',
        sent_at_ms: Date.now(),
        rows
      };
      const shouldUseBeacon = !!options.useBeacon;
      if (shouldUseBeacon && navigatorRef?.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigatorRef.sendBeacon(endpoint, blob);
        if (ok) {
          setTelemetryQueue([]);
          setTelemetryUploadMeta({ count: rows.length, endpoint });
          return true;
        }
      }
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: shouldUseBeacon
      });
      if (!response.ok) return false;
      setTelemetryQueue([]);
      setTelemetryUploadMeta({ count: rows.length, endpoint });
      return true;
    } catch {
      return false;
    } finally {
      telemetryUploadInFlight = false;
    }
  }

  function initTelemetryUploader() {
    if (demoMode) return;
    if (documentRef.body?.dataset.wqTelemetryUploaderBound === '1') return;
    documentRef.body.dataset.wqTelemetryUploaderBound = '1';
    if (telemetryUploadIntervalId) clearInterval(telemetryUploadIntervalId);
    telemetryUploadIntervalId = windowRef.setInterval(() => {
      void uploadTelemetryQueue('interval');
    }, 90_000);
    documentRef.addEventListener('visibilitychange', () => {
      if (documentRef.visibilityState === 'hidden') {
        void uploadTelemetryQueue('visibility_hidden', { useBeacon: true });
      }
    });
    windowRef.addEventListener('pagehide', () => {
      void uploadTelemetryQueue('pagehide', { useBeacon: true });
    });
  }

  function resolveBuildLabel() {
    const stampedBuild = String(windowRef.CS_BUILD?.version || '').trim();
    if (stampedBuild) return stampedBuild;
    const metaBuild = documentRef.querySelector('meta[name="wq-build"]')?.getAttribute('content');
    const normalizedMetaBuild = String(metaBuild || '').trim();
    if (normalizedMetaBuild) return normalizedMetaBuild;
    const appScript = Array.from(documentRef.querySelectorAll('script[src]'))
      .find((script) => /(?:^|\/)js\/app\.js(?:[?#]|$)/i.test(script.getAttribute('src') || ''));
    const src = String(appScript?.getAttribute('src') || '');
    const match = src.match(/[?&]v=([^&#]+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return '';
  }

  function getTelemetryContext() {
    const state = getGameState() || {};
    const build = resolveBuildLabel() || 'local';
    const appVersion = `v${appSemver}`;
    const focusValue = getFocusValue() || defaultPrefs.focus || 'all';
    const gradeBand = getEffectiveGameplayGradeBand(getGradeValue() || defaultPrefs.grade || 'all', focusValue);
    const lessonPackId = normalizeLessonPackId(getLessonPackValue() || defaultPrefs.lessonPack);
    const lessonTargetId = normalizeLessonTargetId(lessonPackId, getLessonTargetValue() || defaultPrefs.lessonTarget);
    return {
      ts_ms: Date.now(),
      session_id: telemetrySessionId,
      device_id_local: getTelemetryDeviceId(),
      app_version: `${appVersion}+${build}`,
      page_mode: normalizePageMode(readPageModeAttr() || loadStoredPageMode()),
      play_style: normalizePlayStyle(documentRef.documentElement.getAttribute('data-play-style') || prefs.playStyle || defaultPrefs.playStyle),
      grade_band: gradeBand,
      focus_id: String(focusValue || 'all'),
      lesson_pack_id: lessonPackId,
      lesson_target_id: lessonTargetId,
      word_length: Number(state?.wordLength || 0) || null
    };
  }

  function emitTelemetry(eventName, payload = {}) {
    if (demoMode) return;
    if (!readTelemetryEnabled()) return;
    const name = String(eventName || '').trim().toLowerCase();
    if (!name) return;
    const row = {
      event_name: name.startsWith('wq_') ? name : `wq_${name}`,
      ...getTelemetryContext(),
      ...(payload && typeof payload === 'object' ? payload : {})
    };
    const queue = getTelemetryQueue();
    queue.push(row);
    setTelemetryQueue(queue);
  }

  function resolveRuntimeChannel() {
    const host = String(locationRef.hostname || '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return 'LOCAL';
    if (host === 'bkseatown.github.io') return 'LIVE';
    if (host === 'cdn.jsdelivr.net' || host === 'htmlpreview.github.io') return 'PREVIEW';
    return 'CUSTOM';
  }

  function syncBuildBadge() {
    const badge = el('settings-build-badge');
    if (!badge) return;
    if (!isDevModeEnabled()) {
      badge.textContent = '';
      badge.classList.add('hidden');
      return;
    }
    badge.classList.remove('hidden');
    const label = resolveBuildLabel();
    const channel = resolveRuntimeChannel();
    const buildLabel = label || 'local';
    const appVersion = `v${appSemver}`;
    badge.textContent = `${channel} · ${appVersion} · Build ${buildLabel}`;
    badge.title = `${channel} source: ${locationRef.origin}${locationRef.pathname} · ${appVersion} · build ${buildLabel}`;
  }

  function syncPersistentVersionChip() {
    if (!isDevModeEnabled()) {
      el('wq-version-chip')?.classList.add('hidden');
      return;
    }
    const channel = resolveRuntimeChannel();
    const buildLabel = resolveBuildLabel() || 'local';
    const staleClient = !!windowRef.CS_BUILD?.staleClient;
    const appVersion = `v${appSemver}`;
    let chip = el('wq-version-chip');
    if (!chip) {
      chip = documentRef.createElement('div');
      chip.id = 'wq-version-chip';
      chip.className = 'wq-version-chip';
      chip.setAttribute('aria-hidden', 'true');
      documentRef.body.appendChild(chip);
    }
    chip.textContent = staleClient
      ? `${channel} · ${appVersion} · ${buildLabel} · syncing`
      : `${channel} · ${appVersion} · ${buildLabel}`;
    chip.title = staleClient
      ? `WordQuest ${appVersion} (${buildLabel}) is syncing to latest deploy`
      : `WordQuest ${appVersion} (${buildLabel})`;
    chip.classList.remove('hidden');
  }

  async function logRuntimeBuildDiagnostics() {
    if (!isDevModeEnabled()) return;
    const build = resolveBuildLabel() || 'local';
    const controlledBySw = !!(navigatorRef.serviceWorker && navigatorRef.serviceWorker.controller);
    let cacheCount = 0;
    try {
      if ('caches' in windowRef) {
        const names = await windowRef.caches.keys();
        cacheCount = names.length;
      }
    } catch {}
    console.info('[WQ Build Debug]', { build, controlledBySw, cacheCount });
  }

  function applyDevOnlyVisibility() {
    const isDev = isDevModeEnabled();
    el('settings-group-diagnostics')?.classList.toggle('hidden', !isDev);
    el('settings-group-diagnostics')?.setAttribute('aria-hidden', isDev ? 'false' : 'true');
    if (!isDev) {
      el('diag-refresh-btn')?.closest('.setting-row')?.classList.add('hidden');
    }
  }

  function formatDiagnosticDate(ts) {
    const value = Number(ts) || 0;
    if (!value) return '--';
    return new Date(value).toLocaleString();
  }

  function readDiagnosticsLastReset() {
    try {
      const parsed = JSON.parse(localStorageRef?.getItem(diagnosticsLastResetKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        ts: Math.max(0, Number(parsed.ts) || 0),
        reason: String(parsed.reason || '').trim() || 'maintenance',
        build: String(parsed.build || '').trim() || 'local'
      };
    } catch {
      return null;
    }
  }

  async function collectRuntimeDiagnostics() {
    const build = resolveBuildLabel() || 'local';
    const appVersion = `v${appSemver}`;
    const lastReset = readDiagnosticsLastReset();
    const lessonPackId = normalizeLessonPackId(getLessonPackValue() || defaultPrefs.lessonPack);
    const activePrefs = [
      `focus:${getFocusValue() || prefs.focus || defaultPrefs.focus}`,
      `grade:${getGradeValue() || prefs.grade || defaultPrefs.grade}`,
      `length:${getLengthValue() || prefs.length || defaultPrefs.length}`,
      `pack:${lessonPackId}`,
      `target:${normalizeLessonTargetId(lessonPackId, getLessonTargetValue() || prefs.lessonTarget || defaultPrefs.lessonTarget)}`,
      `voice:${getVoiceValue() || prefs.voice || defaultPrefs.voice}`
    ].join(' | ');

    let cacheBuckets = 0;
    if ('caches' in windowRef) {
      try {
        const cacheNames = await windowRef.caches.keys();
        cacheBuckets = cacheNames.filter((name) => String(name || '').startsWith('wq-')).length;
      } catch {}
    }

    let swRegistrations = 0;
    let swRuntimeVersion = swRuntimeResolvedVersion;
    if ('serviceWorker' in navigatorRef) {
      try {
        const registrations = await navigatorRef.serviceWorker.getRegistrations();
        swRegistrations = registrations.length;
        const activeScript = registrations[0]?.active?.scriptURL || '';
        if (activeScript.includes('sw-runtime.js?v=')) {
          const match = activeScript.match(/sw-runtime\.js\?v=([^&#]+)/i);
          if (match?.[1]) swRuntimeVersion = decodeURIComponent(match[1]);
        }
      } catch {}
    }

    const telemetryEndpoint = resolveTelemetryEndpoint();
    const telemetryMeta = getTelemetryUploadMeta();
    const telemetryQueueSize = getTelemetryQueue().length;

    return {
      build,
      appVersion,
      swRuntimeVersion,
      swRegistrations,
      cacheBuckets,
      activePrefs,
      lastReset,
      telemetry: {
        endpoint: telemetryEndpoint,
        queueSize: telemetryQueueSize,
        lastUpload: telemetryMeta
      }
    };
  }

  async function renderDiagnosticsPanel() {
    const buildEl = el('diag-build');
    if (!buildEl) return;
    const snapshot = await collectRuntimeDiagnostics();
    const swVersionEl = el('diag-sw-version');
    const swRegistrationsEl = el('diag-sw-registrations');
    const cacheBucketsEl = el('diag-cache-buckets');
    const telemetryEl = el('diag-telemetry');
    const activePrefsEl = el('diag-active-prefs');
    const lastResetEl = el('diag-last-reset');

    buildEl.textContent = `Build: ${snapshot.build} (${snapshot.appVersion})`;
    if (swVersionEl) swVersionEl.textContent = `SW Runtime: ${snapshot.swRuntimeVersion || '--'}`;
    if (swRegistrationsEl) swRegistrationsEl.textContent = `SW Registrations: ${snapshot.swRegistrations}`;
    if (cacheBucketsEl) cacheBucketsEl.textContent = `Cache Buckets: ${snapshot.cacheBuckets}`;
    if (telemetryEl) {
      const endpointLabel = snapshot.telemetry.endpoint || '(disabled)';
      const uploaded = snapshot.telemetry.lastUpload?.ts
        ? `last ${formatDiagnosticDate(snapshot.telemetry.lastUpload.ts)}`
        : 'never uploaded';
      telemetryEl.textContent = `Telemetry Sink: ${endpointLabel} · Queue ${snapshot.telemetry.queueSize} · ${uploaded}`;
    }
    if (activePrefsEl) activePrefsEl.textContent = `Active Prefs: ${snapshot.activePrefs}`;
    if (lastResetEl) {
      const resetLabel = snapshot.lastReset
        ? `${formatDiagnosticDate(snapshot.lastReset.ts)} (${snapshot.lastReset.reason}, ${snapshot.lastReset.build})`
        : '--';
      lastResetEl.textContent = `Last Reset: ${resetLabel}`;
    }
  }

  async function copyDiagnosticsSummary() {
    const snapshot = await collectRuntimeDiagnostics();
    const lines = [
      'WordQuest Diagnostics',
      `App Version: ${snapshot.appVersion}`,
      `Build: ${snapshot.build}`,
      `SW Runtime: ${snapshot.swRuntimeVersion || '--'}`,
      `SW Registrations: ${snapshot.swRegistrations}`,
      `Cache Buckets: ${snapshot.cacheBuckets}`,
      `Telemetry Sink: ${snapshot.telemetry.endpoint || '(disabled)'}`,
      `Telemetry Queue: ${snapshot.telemetry.queueSize}`,
      `Telemetry Last Upload: ${snapshot.telemetry.lastUpload?.ts ? formatDiagnosticDate(snapshot.telemetry.lastUpload.ts) : '--'}`,
      `Active Prefs: ${snapshot.activePrefs}`,
      `Last Reset: ${snapshot.lastReset ? `${formatDiagnosticDate(snapshot.lastReset.ts)} (${snapshot.lastReset.reason}, ${snapshot.lastReset.build})` : '--'}`
    ];
    await copyTextToClipboard(
      lines.join('\n'),
      'Diagnostics copied.',
      'Could not copy diagnostics on this device.'
    );
  }

  return {
    applyDevOnlyVisibility,
    collectRuntimeDiagnostics,
    copyDiagnosticsSummary,
    emitTelemetry,
    formatDiagnosticDate,
    flushTelemetryQueue() {
      const rows = getTelemetryQueue();
      setTelemetryQueue([]);
      return rows;
    },
    getTelemetryQueue,
    getTelemetryUploadMeta,
    initTelemetryUploader,
    isTelemetryEnabled: readTelemetryEnabled,
    logRuntimeBuildDiagnostics,
    peekTelemetry(limit = 20) {
      const count = Math.max(1, Math.min(200, Number(limit) || 20));
      return getTelemetryQueue().slice(-count);
    },
    readDiagnosticsLastReset,
    renderDiagnosticsPanel,
    resolveBuildLabel,
    resolveRuntimeChannel,
    resolveTelemetryEndpoint,
    setTelemetryEnabled(next) {
      try {
        localStorageRef?.setItem?.(telemetryEnabledKey, next ? 'on' : 'off');
      } catch {}
    },
    setTelemetryEndpoint(url) {
      const endpoint = normalizeTelemetryEndpoint(url);
      try {
        if (endpoint) localStorageRef?.setItem?.(telemetryEndpointKey, endpoint);
        else localStorageRef?.removeItem?.(telemetryEndpointKey);
      } catch {}
      return endpoint;
    },
    syncBuildBadge,
    syncPersistentVersionChip,
    uploadTelemetryQueue
  };
}

window.createTelemetryDiagnosticsModule = createTelemetryDiagnosticsModule;
