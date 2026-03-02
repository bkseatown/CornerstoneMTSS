(function sessionPlannerModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSSessionPlanner = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function clampInt(value, min, max, fallback) {
    var n = Math.round(Number(value));
    if (!Number.isFinite(n)) n = Number(fallback || min);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function looksWeak(skillId) {
    var id = String(skillId || "");
    return {
      decoding: /^decoding\./.test(id),
      orthography: /^orthography\./.test(id),
      morphology: /^morphology\./.test(id),
      fluency: /^fluency\./.test(id),
      sentence: /^sentence\./.test(id),
      writing: /^writing\./.test(id),
      numeracy: /^numeracy\./.test(id)
    };
  }

  function pushPlan(rows, item, budget) {
    if (!item || budget.remaining <= 0) return;
    var minutes = clampInt(item.minutes, 3, 10, 5);
    if (minutes > budget.remaining) minutes = budget.remaining;
    if (minutes <= 0) return;
    rows.push({
      activityId: item.activityId,
      title: item.title,
      focusSkillId: item.focusSkillId,
      minutes: minutes,
      href: item.href
    });
    budget.remaining -= minutes;
  }

  function buildDailyPlan(input) {
    var args = input && typeof input === "object" ? input : {};
    var topNeeds = Array.isArray(args.topNeeds) ? args.topNeeds : [];
    var budgetStart = clampInt(args.timeBudgetMin, 10, 45, 20);
    var budget = { remaining: budgetStart };
    var rows = [];
    var weakFlags = {};

    topNeeds.slice(0, 5).forEach(function (need) {
      var flags = looksWeak(need && need.skillId);
      Object.keys(flags).forEach(function (k) {
        if (flags[k]) weakFlags[k] = true;
      });
    });

    if (weakFlags.decoding || weakFlags.orthography || weakFlags.morphology || !topNeeds.length) {
      pushPlan(rows, {
        activityId: "word-quest",
        title: "Word Quest Quick Check",
        focusSkillId: weakFlags.morphology ? "morphology.inflectional" : "decoding.short_vowels",
        minutes: 7,
        href: "word-quest.html?quick=1"
      }, budget);
    }
    if (weakFlags.fluency) {
      pushPlan(rows, {
        activityId: "reading-lab",
        title: "Reading Lab Fluency Sprint",
        focusSkillId: "fluency.pacing",
        minutes: 7,
        href: "reading-lab.html"
      }, budget);
    }
    if (weakFlags.sentence || weakFlags.writing || rows.length < 2) {
      pushPlan(rows, {
        activityId: weakFlags.writing ? "writing-studio" : "sentence-surgery",
        title: weakFlags.writing ? "Writing Studio Precision" : "Sentence Surgery Repair",
        focusSkillId: weakFlags.writing ? "writing.elaboration" : "sentence.syntax_clarity",
        minutes: 6,
        href: weakFlags.writing ? "writing-studio.html" : "sentence-surgery.html"
      }, budget);
    }
    if (weakFlags.numeracy && budget.remaining >= 5) {
      pushPlan(rows, {
        activityId: "numeracy",
        title: "Numeracy Boost",
        focusSkillId: "numeracy.fact_fluency",
        minutes: 6,
        href: "numeracy.html"
      }, budget);
    }

    while (budget.remaining > 0 && rows.length < 4) {
      pushPlan(rows, {
        activityId: "word-quest",
        title: "Word Quest Reinforcement",
        focusSkillId: "orthography.pattern_control",
        minutes: Math.min(5, budget.remaining),
        href: "word-quest.html?quick=1"
      }, budget);
    }

    return rows.slice(0, budgetStart <= 20 ? 3 : 4);
  }

  return {
    buildDailyPlan: buildDailyPlan
  };
});
