(function buildStampGlobal() {
  var fallbackBuildId = "20260319a";
  var fallbackGitSha = "local-dev";
  var fallbackTime = "2026-03-19T00:00:00.000Z";

  function normalizeBuildPayload(source) {
    if (!source || typeof source !== "object") return null;
    var buildId = String(source.buildId || source.build || source.version || "").trim();
    if (!buildId) return null;
    var gitSha = String(source.gitSha || source.sha || "").trim();
    var time = String(source.time || source.timestamp || source.builtAt || "").trim();
    return {
      buildId: buildId,
      build: buildId,
      stamp: buildId,
      version: buildId,
      gitSha: gitSha,
      sha: gitSha,
      time: time,
      builtAt: time
    };
  }

  function publishBuildPayload(payload) {
    if (!payload) return;
    if (typeof window !== "undefined") {
      window.__BUILD__ = payload;
      window.CS_BUILD = Object.assign({}, window.CS_BUILD || {}, payload);
      try {
        window.dispatchEvent(new CustomEvent("cs:build-update", { detail: Object.assign({}, payload) }));
      } catch (_e) {}
    }
    if (typeof self !== "undefined") self.__CS_BUILD__ = payload;
  }

  function resolveBuildJsonUrl() {
    try {
      return new URL("./build.json", document.baseURI || window.location.href).toString();
    } catch (_e) {
      try {
        return new URL("build.json", window.location.href).toString();
      } catch (_e2) {
        return "./build.json";
      }
    }
  }

  var payload = normalizeBuildPayload(
    (typeof window !== "undefined" && (window.__CS_LIVE_BUILD__ || window.CS_BUILD)) || null
  ) || {
    buildId: fallbackBuildId,
    build: fallbackBuildId,
    stamp: fallbackBuildId,
    version: fallbackBuildId,
    gitSha: fallbackGitSha,
    sha: fallbackGitSha,
    time: fallbackTime,
    builtAt: fallbackTime
  };
  publishBuildPayload(payload);

  if (typeof window !== "undefined" && typeof fetch === "function") {
    fetch(resolveBuildJsonUrl() + "?_ts=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (json) {
        var nextPayload = normalizeBuildPayload(json);
        if (nextPayload) publishBuildPayload(nextPayload);
      })
      .catch(function () {});
  }
})();
