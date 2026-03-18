(function csConfigModule() {
  "use strict";

  var DEV_OVERRIDE_UNLOCK = false;

  var defaults = {
    environment: "prod",
    enableAI: true,
    enableAnalytics: true,
    enableDemo: true,
    aiEndpoint: null,
    storageEndpoint: null,
    storageAuthToken: null,
    requestTimeoutMs: 4000
  };

  function hasDevUnlock() {
    try {
      return localStorage.getItem("cs_allow_dev") === "1";
    } catch (_e) {
      return false;
    }
  }

  function detectDevEnvironment() {
    try {
      var host = String(window.location.hostname || "");
      return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || host === "";
    } catch (_e) {
      return false;
    }
  }

  function canUseDevOverrides(baseConfig) {
    if (DEV_OVERRIDE_UNLOCK) return true;
    return hasDevUnlock();
  }

  function parseBooleanFlag(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    var normalized = String(value).toLowerCase().trim();
    if (normalized === "1" || normalized === "true" || normalized === "on") return true;
    if (normalized === "0" || normalized === "false" || normalized === "off") return false;
    return fallback;
  }

  function parseOverrideStorage() {
    try {
      var raw = localStorage.getItem("cs_config_override");
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_e) {
      return null;
    }
  }

  function parseQueryOverrides(baseConfig) {
    if (!canUseDevOverrides(baseConfig)) return {};
    var out = {};
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (params.has("env")) out.environment = String(params.get("env") || "").trim() || baseConfig.environment;
      if (params.has("ai")) out.enableAI = parseBooleanFlag(params.get("ai"), baseConfig.enableAI);
      if (params.has("analytics")) out.enableAnalytics = parseBooleanFlag(params.get("analytics"), baseConfig.enableAnalytics);
      if (params.has("demo")) out.enableDemo = parseBooleanFlag(params.get("demo"), baseConfig.enableDemo);
      if (params.has("timeout")) {
        var timeout = Number(params.get("timeout"));
        if (!Number.isNaN(timeout) && timeout >= 1000 && timeout <= 30000) out.requestTimeoutMs = timeout;
      }
    } catch (_e) {
      return {};
    }
    return out;
  }

  function buildConfig() {
    var base = Object.assign({}, defaults, window.CS_CONFIG || {});
    var storageOverride = canUseDevOverrides(base) ? parseOverrideStorage() : null;
    if (storageOverride) base = Object.assign({}, base, storageOverride);

    var queryOverride = parseQueryOverrides(base);
    base = Object.assign({}, base, queryOverride);

    if (!["dev", "prod"].includes(String(base.environment).toLowerCase())) {
      base.environment = detectDevEnvironment() ? "dev" : "prod";
    } else {
      base.environment = String(base.environment).toLowerCase();
    }

    base.requestTimeoutMs = Number(base.requestTimeoutMs || defaults.requestTimeoutMs);
    if (Number.isNaN(base.requestTimeoutMs) || base.requestTimeoutMs < 1000) base.requestTimeoutMs = defaults.requestTimeoutMs;

    if (base.aiEndpoint !== null && typeof base.aiEndpoint !== "string") base.aiEndpoint = null;
    if (base.storageEndpoint !== null && typeof base.storageEndpoint !== "string") base.storageEndpoint = null;
    if (base.storageAuthToken !== null && typeof base.storageAuthToken !== "string") base.storageAuthToken = null;

    return base;
  }

  window.CS_CONFIG = buildConfig();
  window.CS_CONFIG.devUnlocked = hasDevUnlock();

  var BUILD_STATE_KEY = "cs_last_known_build_v1";
  var RELOAD_MARKER_KEY = "cs_build_reload_marker_v1";
  var CACHE_PREFIX_RE = /^(wq-|cs-cache-|wordquest-|cornerstone-)/i;

  function resolveBuildInfoUrl() {
    try {
      return new URL("./build.json", window.location.href).toString();
    } catch (_e) {
      return "./build.json";
    }
  }

  function normalizeBuildPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    var buildId = String(payload.buildId || payload.build || payload.version || "").trim();
    if (!buildId) return null;
    return {
      buildId: buildId,
      build: buildId,
      version: buildId,
      gitSha: String(payload.gitSha || payload.sha || "").trim(),
      time: String(payload.time || payload.timestamp || "").trim(),
      builtAt: String(payload.time || payload.timestamp || "").trim()
    };
  }

  function readStoredBuildId() {
    try {
      return String(localStorage.getItem(BUILD_STATE_KEY) || "").trim();
    } catch (_e) {
      return "";
    }
  }

  function writeStoredBuildId(buildId) {
    try { localStorage.setItem(BUILD_STATE_KEY, String(buildId || "")); } catch (_e) {}
  }

  function publishBuildPayload(payload) {
    if (!payload) return;
    window.__CS_LIVE_BUILD__ = Object.assign({}, payload);
    window.CS_BUILD = Object.assign({}, window.CS_BUILD || {}, payload);
    try {
      window.dispatchEvent(new CustomEvent("cs:build-update", { detail: Object.assign({}, payload) }));
    } catch (_e) {}
  }

  function buildReloadUrl(buildId) {
    try {
      var nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("cb", String(buildId || Date.now()));
      return nextUrl.toString();
    } catch (_e) {
      return window.location.href;
    }
  }

  function isRuntimeCacheName(name) {
    return CACHE_PREFIX_RE.test(String(name || ""));
  }

  async function clearRuntimeCaches() {
    if (!("caches" in window)) return;
    try {
      var names = await caches.keys();
      var targets = names.filter(isRuntimeCacheName);
      if (targets.length) {
        await Promise.all(targets.map(function (name) { return caches.delete(name); }));
      }
    } catch (_e) {}
  }

  async function unregisterServiceWorkers() {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) return;
    try {
      var registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length) {
        await Promise.all(registrations.map(function (registration) {
          return registration.unregister().catch(function () { return false; });
        }));
      }
    } catch (_e) {}
  }

  function shouldSkipFreshnessReload() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (params.get("audit") === "1") return true;
      if (params.get("fresh") === "0") return true;
    } catch (_e) {}
    return false;
  }

  async function enforceLatestBuild() {
    if (typeof window === "undefined" || typeof fetch !== "function") return;
    var payload = null;
    try {
      var url = resolveBuildInfoUrl();
      var response = await fetch(url + (url.indexOf("?") >= 0 ? "&" : "?") + "_ts=" + Date.now(), { cache: "no-store" });
      if (!response.ok) return;
      payload = normalizeBuildPayload(await response.json());
    } catch (_e) {
      return;
    }
    if (!payload) return;
    publishBuildPayload(payload);

    var currentBuild = payload.buildId;
    var priorBuild = readStoredBuildId();
    if (!priorBuild) {
      writeStoredBuildId(currentBuild);
      await unregisterServiceWorkers();
      return;
    }

    if (priorBuild === currentBuild) {
      await unregisterServiceWorkers();
      return;
    }

    writeStoredBuildId(currentBuild);
    await clearRuntimeCaches();
    await unregisterServiceWorkers();
    if (shouldSkipFreshnessReload()) return;

    var marker = window.location.pathname + "::" + currentBuild;
    try {
      if (sessionStorage.getItem(RELOAD_MARKER_KEY) === marker) return;
      sessionStorage.setItem(RELOAD_MARKER_KEY, marker);
    } catch (_e) {}
    window.location.replace(buildReloadUrl(currentBuild));
  }

  Promise.resolve().then(enforceLatestBuild);

  function isDevMode() {
    var hasStorageUnlock = hasDevUnlock();
    var fromQuery = false;
    try {
      fromQuery = String(new URLSearchParams(window.location.search || "").get("env") || "").toLowerCase() === "dev";
    } catch (_e) {
      fromQuery = false;
    }
    return fromQuery || hasStorageUnlock || window.CS_CONFIG.environment === "dev";
  }

  window.CSAppMode = window.CSAppMode || {};
  window.CSAppMode.isDevMode = isDevMode;
})();
