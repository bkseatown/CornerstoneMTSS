(function multiClassEngineModule() {
  "use strict";

  function isDemoMode() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("demo") === "1" || params.get("demo") === "true" || params.get("mode") === "demo" || window.WQ_DEMO === true;
    } catch (_e) {
      return window.WQ_DEMO === true;
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function toPercent(rate) {
    return Math.round(clamp(Number(rate || 0), 0, 1) * 100);
  }

  function readSchoolAnalytics() {
    if (window.CSAnalyticsEngine && typeof window.CSAnalyticsEngine.readSchoolAnalytics === "function") {
      return window.CSAnalyticsEngine.readSchoolAnalytics();
    }
    try {
      var parsed = JSON.parse(localStorage.getItem("cs_school_analytics") || "null");
      if (!parsed || typeof parsed !== "object") return { classes: {}, lastUpdated: 0 };
      return {
        classes: parsed.classes && typeof parsed.classes === "object" ? parsed.classes : {},
        lastUpdated: Number(parsed.lastUpdated || 0)
      };
    } catch (_e) {
      return { classes: {}, lastUpdated: 0 };
    }
  }

  function buildDemoSchool() {
    return {
      classes: {
        "Grade 3 - Class A": {
          totalSentences: 142,
          reasoningRate: 0.32,
          complexRate: 0.29,
          avgDetail: 2.1,
          avgCohesion: 1.8,
          verbStrengthRate: 0.28
        },
        "Grade 4 - Class B": {
          totalSentences: 188,
          reasoningRate: 0.51,
          complexRate: 0.45,
          avgDetail: 3.0,
          avgCohesion: 2.7,
          verbStrengthRate: 0.47
        },
        "Grade 5 - Class C": {
          totalSentences: 201,
          reasoningRate: 0.63,
          complexRate: 0.58,
          avgDetail: 3.6,
          avgCohesion: 3.2,
          verbStrengthRate: 0.59
        }
      },
      lastUpdated: Date.now()
    };
  }

  function classRows(school) {
    var src = school && school.classes && typeof school.classes === "object" ? school.classes : {};
    return Object.keys(src).map(function (name) {
      var row = src[name] || {};
      return {
        classId: name,
        totalSentences: Math.max(0, Number(row.totalSentences || 0)),
        reasoningRate: clamp(Number(row.reasoningRate || 0), 0, 1),
        complexRate: clamp(Number(row.complexRate || 0), 0, 1),
        avgDetail: clamp(Number(row.avgDetail || 0), 0, 5),
        avgCohesion: clamp(Number(row.avgCohesion || 0), 0, 5),
        verbStrengthRate: clamp(Number(row.verbStrengthRate || 0), 0, 1)
      };
    });
  }

  function aggregate(rows) {
    var list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      return {
        classes: 0,
        totalSentences: 0,
        reasoningRate: 0,
        complexRate: 0,
        avgDetail: 0,
        avgCohesion: 0,
        verbStrengthRate: 0
      };
    }

    var totalWeight = list.reduce(function (sum, row) {
      return sum + Math.max(1, row.totalSentences);
    }, 0);

    function weighted(field) {
      var value = list.reduce(function (sum, row) {
        var weight = Math.max(1, row.totalSentences);
        return sum + (Number(row[field] || 0) * weight);
      }, 0);
      return value / Math.max(1, totalWeight);
    }

    return {
      classes: list.length,
      totalSentences: list.reduce(function (sum, row) { return sum + row.totalSentences; }, 0),
      reasoningRate: weighted("reasoningRate"),
      complexRate: weighted("complexRate"),
      avgDetail: weighted("avgDetail"),
      avgCohesion: weighted("avgCohesion"),
      verbStrengthRate: weighted("verbStrengthRate")
    };
  }

  function trends(snapshot, rows) {
    var list = [];
    if (snapshot.reasoningRate < 0.4) {
      list.push("School-wide focus on subordinating conjunctions recommended.");
    }
    if (snapshot.avgCohesion < 2) {
      list.push("Professional development: linking ideas across sentences.");
    }
    var lowVerbClasses = rows.filter(function (row) { return row.verbStrengthRate < 0.4; }).length;
    if (rows.length && lowVerbClasses >= Math.ceil(rows.length / 2)) {
      list.push("Implement verb precision mini-lessons.");
    }
    if (!list.length) {
      list.push("Current structural trends are stable. Increase stretch writing tasks across grades.");
    }
    return list.slice(0, 3);
  }

  window.CSMultiClassEngine = {
    isDemoMode: isDemoMode,
    toPercent: toPercent,
    readSchoolAnalytics: readSchoolAnalytics,
    buildDemoSchool: buildDemoSchool,
    classRows: classRows,
    aggregate: aggregate,
    trends: trends
  };
})();
