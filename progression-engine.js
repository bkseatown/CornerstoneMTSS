(function progressionEngineModule() {
  "use strict";

  var CS_PROGRESSIONS = {
    reasoning: [
      { level: 0, description: "No reasoning present" },
      { level: 1, description: "Reason word present (because) but weak explanation" },
      { level: 2, description: "Clear causal reasoning clause" },
      { level: 3, description: "Multi-clause reasoning with nuance" }
    ],
    detail: [
      { level: 0, description: "Vague or general" },
      { level: 1, description: "One concrete detail" },
      { level: 2, description: "Specific descriptive detail" },
      { level: 3, description: "Layered or contextual detail" }
    ],
    verb_precision: [
      { level: 0, description: "Mostly vague verbs" },
      { level: 1, description: "Occasional specific verb" },
      { level: 2, description: "Frequent strong precise verbs" },
      { level: 3, description: "Consistent verb precision with tone control" }
    ],
    cohesion: [
      { level: 0, description: "Ideas are disconnected" },
      { level: 1, description: "Basic connectors used" },
      { level: 2, description: "Sentences linked logically" },
      { level: 3, description: "Smooth multi-clause flow" }
    ]
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function normPct(value) {
    var n = Number(value);
    if (Number.isNaN(n)) return 0;
    if (n <= 1) return clamp(n * 100, 0, 100);
    return clamp(n, 0, 100);
  }

  function normDetail(value) {
    var n = Number(value);
    if (Number.isNaN(n)) return 0;
    if (n <= 1) return clamp(n * 5, 0, 5);
    return clamp(n, 0, 5);
  }

  function computeSkillLevel(skillName, metrics) {
    var skill = String(skillName || "").toLowerCase();
    var m = metrics && typeof metrics === "object" ? metrics : {};

    if (skill === "reasoning") {
      var reasoningPct = normPct(m.reasoningPct !== undefined ? m.reasoningPct : m.reasoningRate);
      if (reasoningPct < 25) return 0;
      if (reasoningPct < 50) return 1;
      if (reasoningPct < 75) return 2;
      return 3;
    }

    if (skill === "detail") {
      var detail = normDetail(m.detailAvg !== undefined ? m.detailAvg : m.avgDetail);
      if (detail < 1.5) return 0;
      if (detail < 2.5) return 1;
      if (detail < 3.8) return 2;
      return 3;
    }

    if (skill === "verb_precision") {
      var verbPct = normPct(m.strongPct !== undefined ? m.strongPct : m.verbStrengthRate);
      if (verbPct < 25) return 0;
      if (verbPct < 50) return 1;
      if (verbPct < 75) return 2;
      return 3;
    }

    if (skill === "cohesion") {
      var cohesion = normDetail(m.cohesionAvg !== undefined ? m.cohesionAvg : m.avgCohesion);
      if (cohesion < 1.5) return 0;
      if (cohesion < 2.5) return 1;
      if (cohesion < 3.8) return 2;
      return 3;
    }

    return 0;
  }

  function computeStudentProgress(studentData) {
    var src = studentData && typeof studentData === "object" ? studentData : {};
    var levels = {
      reasoning: computeSkillLevel("reasoning", src),
      detail: computeSkillLevel("detail", src),
      verb_precision: computeSkillLevel("verb_precision", src),
      cohesion: computeSkillLevel("cohesion", src)
    };

    var primaryDeficit = "reasoning";
    ["detail", "verb_precision", "cohesion"].forEach(function (k) {
      if (levels[k] < levels[primaryDeficit]) primaryDeficit = k;
    });

    return {
      levels: levels,
      primaryDeficit: primaryDeficit,
      levelBadge: "Level " + String(clamp(levels[primaryDeficit] + 1, 1, 3))
    };
  }

  window.CSProgressionEngine = {
    CS_PROGRESSIONS: CS_PROGRESSIONS,
    computeSkillLevel: computeSkillLevel,
    computeStudentProgress: computeStudentProgress
  };
})();
