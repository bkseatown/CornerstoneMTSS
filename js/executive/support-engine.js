(function executiveSupportEngineModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSExecutiveSupportEngine = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createExecutiveSupportEngine() {
  "use strict";

  function t(value, fallback) {
    var out = String(value == null ? "" : value).trim();
    return out || String(fallback || "");
  }

  function barrierActions(barrier) {
    if (barrier === "Initiation") return [
      "Use start cue and first-step card at task launch.",
      "Confirm first response within first 2 minutes.",
      "Use timer to support launch consistency."
    ];
    if (barrier === "Organization") return [
      "Run materials check at start and end of class.",
      "Use assignment tracker with due-date highlighting.",
      "Color-code task folders by subject."
    ];
    if (barrier === "Time") return [
      "Provide extended time for independent tasks.",
      "Break tasks into 10-15 minute chunks.",
      "Use time checkpoints before transitions."
    ];
    if (barrier === "Planning") return [
      "Complete planning template before independent work.",
      "Model sequence: plan, do, review.",
      "Require step completion check before next step."
    ];
    return [
      "Use low-distraction workspace and visual focus cue.",
      "Schedule short check-ins every 8-10 minutes.",
      "Prompt self-monitoring with simple rubric."
    ];
  }

  function generateExecutiveSupportPlan(input) {
    var src = input && typeof input === "object" ? input : {};
    var risk = t(src.executiveRiskLevel, "MODERATE").toUpperCase();
    var barrier = t(src.primaryBarrier, "Attention");
    var gradeBand = t(src.gradeBand, "G5");

    var dailySupportActions = barrierActions(barrier);
    var weeklyGoal = risk === "HIGH"
      ? "Complete 4 of 5 tasks with documented scaffold usage."
      : (risk === "MODERATE"
        ? "Complete 4 tasks with reduced prompt dependency."
        : "Sustain independent completion with one check-in support.");

    return {
      dailySupportActions: dailySupportActions,
      weeklyGoal: weeklyGoal,
      teacherScaffold: "Use explicit prompt->practice->release sequence; fade prompts when completion stabilizes.",
      studentFacingPrompt: "Start with step one now. Check off each step as you finish.",
      progressMetric: "Task completion with scaffold fidelity by week (" + gradeBand + ")"
    };
  }

  return {
    generateExecutiveSupportPlan: generateExecutiveSupportPlan
  };
});
