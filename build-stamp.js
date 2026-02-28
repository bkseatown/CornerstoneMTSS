(function csBuildStampModule() {
  "use strict";

  var VERSION_URL = "./version.json";
  var VERSION_KEY = "cs_app_version";
  var RELOAD_GUARD_KEY = "cs_app_version_reloaded_once";
  var AUTO_HEAL_PREFIX = "cs_build_auto_heal_";

  function inDevMode() {
    if (window.CSAppMode && typeof window.CSAppMode.isDevMode === "function") {
      return !!window.CSAppMode.isDevMode();
    }
    return !!(window.CS_CONFIG && window.CS_CONFIG.environment === "dev");
  }

  function getCurrentPathVersion() {
    try {
      return new URLSearchParams(window.location.search || "").get("v") || "";
    } catch (_e) {
      return "";
    }
  }

  function setPathVersion(version) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("v", version);
      url.searchParams.set("cb", Date.now().toString(36));
      window.location.replace(url.toString());
    } catch (_e) {
      window.location.reload();
    }
  }

  function getRuntimeBuildLabel() {
    try {
      var meta = document.querySelector('meta[name="wq-build"]');
      var label = String(meta && meta.getAttribute("content") || "").trim();
      return label || "";
    } catch (_e) {
      return "";
    }
  }

  async function resetRuntimeCaches() {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        var regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function (reg) { return reg.unregister(); }));
      }
    } catch (_e1) {}
    try {
      if (window.caches && typeof window.caches.keys === "function") {
        var keys = await window.caches.keys();
        await Promise.all(keys.map(function (key) { return window.caches.delete(key); }));
      }
    } catch (_e2) {}
  }

  async function autoHealIfStale(version, runtimeBuild) {
    var latest = String(version || "").trim();
    var runtime = String(runtimeBuild || "").trim();
    if (!latest || !runtime || latest === runtime) return false;
    if (latest === "local" || runtime === "dev-local") return false;
    var healKey = AUTO_HEAL_PREFIX + latest;
    var alreadyHealed = "";
    try { alreadyHealed = sessionStorage.getItem(healKey) || ""; } catch (_e) { alreadyHealed = ""; }
    if (alreadyHealed === "1") return false;
    try { sessionStorage.setItem(healKey, "1"); } catch (_e1) {}
    await resetRuntimeCaches();
    setPathVersion(latest);
    return true;
  }

  function applyReloadGuard(version) {
    var prior = "";
    var reloadedOnce = "";
    try { prior = localStorage.getItem(VERSION_KEY) || ""; } catch (_e1) { prior = ""; }
    try { reloadedOnce = sessionStorage.getItem(RELOAD_GUARD_KEY) || ""; } catch (_e2) { reloadedOnce = ""; }

    if (!prior) {
      try { localStorage.setItem(VERSION_KEY, version); } catch (_e3) {}
      return;
    }

    if (prior !== version) {
      try { localStorage.setItem(VERSION_KEY, version); } catch (_e4) {}
      if (reloadedOnce !== version) {
        try { sessionStorage.setItem(RELOAD_GUARD_KEY, version); } catch (_e5) {}
        if (getCurrentPathVersion() !== version) {
          setPathVersion(version);
          return;
        }
        window.location.reload();
      }
      return;
    }

    if (reloadedOnce && reloadedOnce !== version) {
      try { sessionStorage.removeItem(RELOAD_GUARD_KEY); } catch (_e6) {}
    }
  }

  function ensureBadge(version, stale) {
    var badge = document.getElementById("cs-build-badge");
    if (!badge) {
      badge = document.createElement("button");
      badge.id = "cs-build-badge";
      badge.type = "button";
      badge.style.position = "fixed";
      badge.style.right = "10px";
      badge.style.bottom = "10px";
      badge.style.zIndex = "9999";
      badge.style.border = "1px solid rgba(255,255,255,0.25)";
      badge.style.borderRadius = "10px";
      badge.style.background = "rgba(20,30,40,0.65)";
      badge.style.color = "#d8e3ef";
      badge.style.font = "600 11px/1.2 'Atkinson Hyperlegible', sans-serif";
      badge.style.padding = "6px 8px";
      badge.style.backdropFilter = "blur(8px)";
      badge.style.cursor = "pointer";
      badge.title = "Click to copy build version";
      badge.setAttribute("aria-label", "Build version");
      var target = document.body || document.documentElement;
      if (!target || typeof target.appendChild !== "function") return;
      try {
        target.appendChild(badge);
      } catch (_eAppend) {
        return;
      }
    }

    badge.textContent = "Build " + version + (stale ? " (syncing)" : "");

    badge.onclick = function () {
      var text = String(version || "");
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
    };
  }

  function parseVersion(json) {
    if (!json || typeof json !== "object") return "local";
    var version = String(json.v || "").trim();
    return version || "local";
  }

  async function init() {
    var version = "local";
    try {
      var res = await fetch(VERSION_URL + "?cb=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        var json = await res.json();
        version = parseVersion(json);
      }
    } catch (_e) {
      version = "local";
    }

    var runtimeBuild = getRuntimeBuildLabel();
    var staleClient = !!runtimeBuild && runtimeBuild !== version && version !== "local";
    window.CS_BUILD = {
      version: version,
      runtimeBuild: runtimeBuild,
      staleClient: staleClient,
      fetchedAt: Date.now()
    };

    try {
      if (window.dispatchEvent && typeof window.CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("cs-build-health", { detail: window.CS_BUILD }));
      }
    } catch (_dispatchError) {}

    try {
      var healed = await autoHealIfStale(version, runtimeBuild);
      if (healed) return;
    } catch (_healError) {}

    try {
      applyReloadGuard(version);
    } catch (_e1) {
      // no-op
    }

    var onReady = function () {
      if (!inDevMode()) return;
      ensureBadge(version, staleClient);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady, { once: true });
    } else {
      onReady();
    }

    if (inDevMode()) {
      try { console.log("[CS BUILD]", window.CS_BUILD); } catch (_e2) {}
    }
  }

  init();
})();
