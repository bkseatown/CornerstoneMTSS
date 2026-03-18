(function interventionPlannerModule() {
  "use strict";

  function normalizeTier(rawTier) {
    var t = String(rawTier || "Tier 2").toLowerCase();
    if (t.indexOf("3") >= 0) return "Tier 3";
    if (t.indexOf("1") >= 0) return "Tier 1";
    return "Tier 2";
  }

  function skillLabel(skill) {
    if (skill === "verb_precision") return "verb precision";
    return String(skill || "reasoning").replace(/_/g, " ");
  }

  function basePlan(skill) {
    var s = skillLabel(skill);
    return {
      warmup: "3 min: quick retrieval drill on " + s + " examples.",
      directInstruction: "5 min: explicit model and think-aloud for " + s + ".",
      guidedPractice: "5 min: teacher-guided revision with one focused prompt.",
      independentPractice: "5 min: students revise one sentence and one support line.",
      exitTicket: "2 min: submit one sentence demonstrating " + s + "."
    };
  }

  function generateSessionPlan(input) {
    var src = input && typeof input === "object" ? input : {};
    var tier = normalizeTier(src.tierLevel || src.tier);
    var deficit = String(src.primaryDeficitSkill || "reasoning");
    var plan = basePlan(deficit);

    if (tier === "Tier 3") {
      plan.directInstruction = "5 min: model " + skillLabel(deficit) + " with explicit sentence decomposition.";
      plan.guidedPractice = "5 min: co-construct two examples using sentence stems and immediate correction.";
      plan.independentPractice = "5 min: complete scaffolded stem frames, then produce one independent line.";
    } else if (tier === "Tier 1") {
      plan.guidedPractice = "5 min: guided refinement with precision and nuance checks.";
      plan.independentPractice = "5 min: extension challenge using multi-clause complexity.";
      plan.exitTicket = "2 min: produce one advanced sentence with contrast or qualification.";
    }

    return plan;
  }

  window.CSInterventionPlanner = {
    generateSessionPlan: generateSessionPlan
  };
})();
