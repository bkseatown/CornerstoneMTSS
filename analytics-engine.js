(function analyticsEngineModule() {
  "use strict";

  var KEY = "cs_analytics";
  var SCHOOL_KEY = "cs_school_analytics";

  function isDemoMode() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("demo") === "1" || params.get("demo") === "true" || params.get("mode") === "demo" || window.WQ_DEMO === true;
    } catch (_e) {
      return window.WQ_DEMO === true;
    }
  }

  function defaults() {
    return {
      totalSentences: 0,
      avgDetail: 0,
      avgCohesion: 0,
      reasoningRate: 0
    };
  }

  function read() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!parsed || typeof parsed !== "object") return defaults();
      return {
        totalSentences: Number(parsed.totalSentences || 0),
        avgDetail: Number(parsed.avgDetail || 0),
        avgCohesion: Number(parsed.avgCohesion || 0),
        reasoningRate: Number(parsed.reasoningRate || 0)
      };
    } catch (_e) {
      return defaults();
    }
  }

  function write(snapshot) {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    } catch (_e) {
      // ignore storage write failures
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function updateFromAnalysis(analysis, options) {
    if (isDemoMode()) return read();
    if (!analysis || typeof analysis !== "object") return read();
    if (window.CS_CONFIG && window.CS_CONFIG.enableAnalytics === false) return read();

    var existing = read();
    var nextCount = existing.totalSentences + 1;

    var detail = clamp(Number(analysis.detail_score || 0), 0, 5);
    var reasoning = analysis.has_reasoning ? 1 : 0;

    var nextAvgDetail = ((existing.avgDetail * existing.totalSentences) + detail) / nextCount;
    var nextReasoningRate = ((existing.reasoningRate * existing.totalSentences) + reasoning) / nextCount;

    var hasCohesion = options && typeof options.cohesion === "number" && !Number.isNaN(options.cohesion);
    var nextAvgCohesion = existing.avgCohesion;
    if (hasCohesion) {
      var cohesion = clamp(Number(options.cohesion), 0, 5);
      nextAvgCohesion = ((existing.avgCohesion * existing.totalSentences) + cohesion) / nextCount;
    }

    var next = {
      totalSentences: nextCount,
      avgDetail: Number(nextAvgDetail.toFixed(3)),
      avgCohesion: Number(nextAvgCohesion.toFixed(3)),
      reasoningRate: Number(nextReasoningRate.toFixed(3))
    };

    write(next);
    return next;
  }

  function readSchoolAnalytics() {
    try {
      var parsed = JSON.parse(localStorage.getItem(SCHOOL_KEY) || "null");
      if (!parsed || typeof parsed !== "object") {
        return { classes: {}, lastUpdated: 0 };
      }
      var classes = parsed.classes && typeof parsed.classes === "object" ? parsed.classes : {};
      return {
        classes: classes,
        lastUpdated: Number(parsed.lastUpdated || 0)
      };
    } catch (_e) {
      return { classes: {}, lastUpdated: 0 };
    }
  }

  function writeSchoolAnalytics(payload) {
    try {
      localStorage.setItem(SCHOOL_KEY, JSON.stringify(payload || { classes: {}, lastUpdated: Date.now() }));
    } catch (_e) {
      // ignore storage write failures
    }
  }

  function normalizeClassId(classId) {
    var clean = String(classId || "").replace(/\s+/g, " ").trim();
    return clean || "Unassigned Class";
  }

  function updateSchoolAnalytics(classId, metrics) {
    if (isDemoMode()) return readSchoolAnalytics();
    if (!metrics || typeof metrics !== "object") return readSchoolAnalytics();
    if (window.CS_CONFIG && window.CS_CONFIG.enableAnalytics === false) return readSchoolAnalytics();

    var school = readSchoolAnalytics();
    if (!school.classes || typeof school.classes !== "object") school.classes = {};
    var key = normalizeClassId(classId);
    school.classes[key] = {
      totalSentences: Math.max(0, Number(metrics.totalSentences || 0)),
      reasoningRate: clamp(Number(metrics.reasoningRate || 0), 0, 1),
      complexRate: clamp(Number(metrics.complexRate || 0), 0, 1),
      avgDetail: clamp(Number(metrics.avgDetail || 0), 0, 5),
      avgCohesion: clamp(Number(metrics.avgCohesion || 0), 0, 5),
      verbStrengthRate: clamp(Number(metrics.verbStrengthRate || 0), 0, 1)
    };
    school.lastUpdated = Date.now();
    writeSchoolAnalytics(school);
    return school;
  }

  window.CSAnalyticsEngine = {
    KEY: KEY,
    SCHOOL_KEY: SCHOOL_KEY,
    isDemoMode: isDemoMode,
    read: read,
    write: write,
    updateFromAnalysis: updateFromAnalysis,
    readSchoolAnalytics: readSchoolAnalytics,
    writeSchoolAnalytics: writeSchoolAnalytics,
    updateSchoolAnalytics: updateSchoolAnalytics
  };
})();
