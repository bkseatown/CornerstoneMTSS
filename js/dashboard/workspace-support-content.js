(function workspaceSupportContentModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSWorkspaceSupportContent = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createWorkspaceSupportContent() {
  "use strict";

  function buildShareSummaryText(options) {
    var config = options && typeof options === "object" ? options : {};
    var summary = config.summary || null;
    var sessions = Array.isArray(config.sessions) ? config.sessions : [];
    if (!summary) return "";
    var row = sessions[0] || {};
    var sig = row.signals || {};
    var recommendation = config.recommendation || { bullets: [summary.nextMove && summary.nextMove.line || "Continue focused support."] };
    return [
      "Student: " + summary.student.name + " (" + summary.student.id + ")",
      "Date: " + new Date().toISOString().slice(0, 10),
      "Activity: Word Quest (90s)",
      "Observed:",
      "- Attempts: " + (row.outcomes && row.outcomes.attemptsUsed != null ? row.outcomes.attemptsUsed : "--"),
      "- Vowel swaps: " + (sig.vowelSwapCount != null ? sig.vowelSwapCount : "--"),
      "- Repeat same slot: " + (sig.repeatSameBadSlotCount != null ? sig.repeatSameBadSlotCount : "--"),
      "Next step (Tier 2):",
      "- " + (recommendation.bullets && recommendation.bullets[0] ? recommendation.bullets[0] : (summary.nextMove && summary.nextMove.line || "")),
      "Progress note:",
      "- " + (summary.nextMove && summary.nextMove.line || "")
    ].join("\n");
  }

  function buildSharePayload(options) {
    var config = options && typeof options === "object" ? options : {};
    var sid = String(config.studentId || "");
    var summary = config.summary || null;
    if (!summary) {
      return { text: "", json: {}, csv: "" };
    }
    var model = config.model || { studentId: sid, mastery: {}, topNeeds: [] };
    var recentSessions = Array.isArray(config.recentSessions) ? config.recentSessions : [];
    var plan = Array.isArray(config.plan) ? config.plan : [];
    var teacherNotes = String(config.teacherNotes || "");
    if (config.ShareSummaryAPI && typeof config.ShareSummaryAPI.buildShareSummary === "function") {
      return config.ShareSummaryAPI.buildShareSummary({
        studentId: sid,
        studentProfile: summary.student,
        skillModel: model,
        recentSessions: recentSessions,
        plan: plan,
        teacherNotes: teacherNotes
      });
    }
    var fallbackText = buildShareSummaryText({
      summary: summary,
      sessions: recentSessions,
      recommendation: config.recommendation
    });
    return {
      text: fallbackText,
      json: {
        studentId: sid,
        student: summary.student,
        topNeeds: model.topNeeds || [],
        skillModel: model,
        recentSessions: recentSessions,
        plan: plan,
        teacherNotes: teacherNotes
      },
      csv: "studentId,summary\\n\"" + sid + "\",\"" + fallbackText.replace(/\"/g, '""') + "\""
    };
  }

  return {
    buildShareSummaryText: buildShareSummaryText,
    buildSharePayload: buildSharePayload
  };
});
