(function initPathwayEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CSPathwayEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function factory() {
  'use strict';

  function mapPathway(skillId) {
    var id = String(skillId || '');
    if (id.indexOf('LIT.DEC') === 0) return 'Decoding';
    if (id.indexOf('LIT.LANG') === 0) return 'Language';
    if (id.indexOf('LIT.WRITE') === 0) return 'Writing';
    if (id.indexOf('LIT.FLU') === 0) return 'Fluency';
    return 'Foundational';
  }

  function detectPrimaryPathway(skillSnapshot) {
    var rows = Array.isArray(skillSnapshot && skillSnapshot.topSkills) ? skillSnapshot.topSkills : [];
    if (!rows.length) return { pathway: 'Foundational', confidenceScore: 0 };
    var counts = {};
    rows.forEach(function (row) {
      var p = mapPathway(row && row.skillId);
      counts[p] = (counts[p] || 0) + 1;
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
    return {
      pathway: top,
      confidenceScore: Number((counts[top] / rows.length).toFixed(3))
    };
  }

  return {
    detectPrimaryPathway: detectPrimaryPathway
  };
}));
