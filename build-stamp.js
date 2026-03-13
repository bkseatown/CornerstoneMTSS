(function buildStampGlobal() {
  var buildId = "20260313u";
  var gitSha = "a3c671b8f2f0";
  var time = "2026-03-13T10:45:00.000Z";
  var payload = { buildId: buildId, stamp: buildId, version: buildId, gitSha: gitSha, sha: gitSha, time: time, builtAt: time };
  if (typeof window !== "undefined") {
    window.__BUILD__ = payload;
    window.CS_BUILD = Object.assign({}, window.CS_BUILD || {}, payload);
  }
  if (typeof self !== "undefined") self.__CS_BUILD__ = payload;
})();
