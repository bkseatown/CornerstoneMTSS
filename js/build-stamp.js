(function buildStampGlobal() {
  var buildId = "local-20260329";
  var gitSha = "";
  var time = "2026-03-29T11:27:14.300Z";
  var payload = { buildId: buildId, stamp: buildId, version: buildId, gitSha: gitSha, sha: gitSha, time: time, builtAt: time };
  if (typeof window !== "undefined") {
    window.__BUILD__ = payload;
    window.CS_BUILD = Object.assign({}, window.CS_BUILD || {}, payload);
  }
  if (typeof self !== "undefined") self.__CS_BUILD__ = payload;
})();
