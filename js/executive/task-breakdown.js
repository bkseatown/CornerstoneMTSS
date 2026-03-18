(function taskBreakdownModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSTaskBreakdown = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createTaskBreakdown() {
  "use strict";

  var KEY = "cs.executive.task-breakdown.v1";

  function safeParse(raw, fallback) {
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function load(studentId) {
    var sid = String(studentId || "").trim() || "demo";
    var all = safeParse(localStorage.getItem(KEY), {});
    return all[sid] || { assignmentName: "", steps: [], timerMinutes: 10, updatedAt: null };
  }

  function save(studentId, payload) {
    var sid = String(studentId || "").trim() || "demo";
    var all = safeParse(localStorage.getItem(KEY), {});
    var row = payload && typeof payload === "object" ? payload : {};
    all[sid] = {
      assignmentName: String(row.assignmentName || "").slice(0, 200),
      steps: Array.isArray(row.steps) ? row.steps.slice(0, 12).map(function (step) {
        var s = step && typeof step === "object" ? step : {};
        return {
          name: String(s.name || "").slice(0, 160),
          minutes: Math.max(1, Math.min(120, Number(s.minutes || 10) || 10))
        };
      }) : [],
      timerMinutes: Math.max(1, Math.min(120, Number(row.timerMinutes || 10) || 10)),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify(all));
    return all[sid];
  }

  return {
    load: load,
    save: save
  };
});
