(function executiveProfileModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSExecutiveProfile = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createExecutiveProfile() {
  "use strict";

  function n(value, fallback) {
    var out = Number(value);
    return Number.isFinite(out) ? out : Number(fallback || 0);
  }

  function t(value, fallback) {
    var out = String(value == null ? "" : value).trim();
    return out || String(fallback || "");
  }

  function pickBarrier(src) {
    var hint = t(src.teacherObservations, "").toLowerCase();
    if (/initiat|start/.test(hint)) return "Initiation";
    if (/organiz|materials|folder|missing/.test(hint)) return "Organization";
    if (/time|late|deadline/.test(hint)) return "Time";
    if (/plan|sequence|steps/.test(hint)) return "Planning";
    if (/focus|attention|distract/.test(hint)) return "Attention";

    if (n(src.initiationDelay, 0) >= 10) return "Initiation";
    if (n(src.assignmentMissingCount, 0) >= 4) return "Organization";
    if (n(src.taskCompletionRate, 0.8) < 0.6) return "Planning";
    return "Attention";
  }

  function buildSupports(risk, barrier) {
    var supports = [];
    if (barrier === "Initiation") {
      supports.push("Use a 2-minute launch routine with first-step prompt.");
      supports.push("Start tasks with teacher check-in and visible countdown.");
    } else if (barrier === "Organization") {
      supports.push("Use a daily materials checklist and end-of-class reset.");
      supports.push("Provide visual organizer for assignment tracking.");
    } else if (barrier === "Time") {
      supports.push("Apply extended-time option for multi-step tasks.");
      supports.push("Chunk tasks with interim completion checkpoints.");
    } else if (barrier === "Planning") {
      supports.push("Require step-by-step planning template before work.");
      supports.push("Model sequencing language for independent planning.");
    } else {
      supports.push("Use brief check-ins every 8-10 minutes.");
      supports.push("Provide low-distraction seating and visual cues.");
    }

    if (risk === "HIGH") supports.push("Log daily implementation data with fidelity check.");
    else if (risk === "MODERATE") supports.push("Review support usage twice weekly.");
    else supports.push("Monitor weekly and reinforce independent routines.");
    return supports;
  }

  function generateExecutiveProfile(input) {
    var src = input && typeof input === "object" ? input : {};
    var completion = n(src.taskCompletionRate, 0.75);
    if (completion > 1) completion = completion / 100;
    completion = Math.max(0, Math.min(1, completion));
    var missing = Math.max(0, Math.round(n(src.assignmentMissingCount, 0)));
    var delay = Math.max(0, Math.round(n(src.initiationDelay, 0)));

    var riskScore = 0;
    if (completion < 0.6) riskScore += 2;
    else if (completion < 0.75) riskScore += 1;
    if (missing >= 5) riskScore += 2;
    else if (missing >= 3) riskScore += 1;
    if (delay >= 10) riskScore += 2;
    else if (delay >= 5) riskScore += 1;

    var executiveRiskLevel = riskScore >= 5 ? "HIGH" : (riskScore >= 3 ? "MODERATE" : "LOW");
    var primaryBarrier = pickBarrier(src);
    var suggestedSupports = buildSupports(executiveRiskLevel, primaryBarrier);

    return {
      executiveRiskLevel: executiveRiskLevel,
      primaryBarrier: primaryBarrier,
      suggestedSupports: suggestedSupports
    };
  }

  return {
    generateExecutiveProfile: generateExecutiveProfile
  };
});
