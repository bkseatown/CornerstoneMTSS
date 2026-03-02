(function alignmentLoaderModule(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root || globalThis);
    return;
  }
  root.CSAlignmentLoader = factory(root || globalThis);
})(typeof window !== 'undefined' ? window : globalThis, function buildAlignmentLoader(root) {
  'use strict';

  var cache = null;

  function normalizeSkillId(skillId) {
    return String(skillId || '').trim().toUpperCase();
  }

  function loadMapSync() {
    if (cache) return cache;
    cache = {};
    try {
      var req = new XMLHttpRequest();
      req.open('GET', './data/alignment.map.json', false);
      req.send(null);
      if (req.status >= 200 && req.status < 300 && req.responseText) {
        var parsed = JSON.parse(req.responseText);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          cache = parsed;
        }
      }
    } catch (_e) {}
    return cache;
  }

  function getAlignmentForSkill(skillId) {
    var key = normalizeSkillId(skillId);
    if (!key) return null;
    var map = loadMapSync();
    var row = map[key];
    return row && typeof row === 'object' ? row : null;
  }

  return {
    getAlignmentForSkill: getAlignmentForSkill
  };
});
