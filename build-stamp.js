(function buildStampGlobal() {
  var buildId = "20260301y";
  var gitSha = "";
  var time = "2026-03-01T03:01:51.239Z";
  var payload = { buildId: buildId, stamp: buildId, version: buildId, gitSha: gitSha, sha: gitSha, time: time, builtAt: time };
  if (typeof window !== "undefined") {
    window.__BUILD__ = payload;
    window.CS_BUILD = Object.assign({}, window.CS_BUILD || {}, payload);
  }
  if (typeof self !== "undefined") self.__CS_BUILD__ = payload;
})();
