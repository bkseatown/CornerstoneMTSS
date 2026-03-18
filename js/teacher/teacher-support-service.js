(function teacherSupportServiceModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSTeacherSupportService = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createTeacherSupportService() {
  "use strict";

  function getStudentSummary(studentId, options) {
    var config = options && typeof options === "object" ? options : {};
    var TeacherIntelligence = config.TeacherIntelligence || root.CSTeacherIntelligence || null;
    var Evidence = config.Evidence || root.CSEvidence || null;
    if (TeacherIntelligence && typeof TeacherIntelligence.getStudentSummary === "function") {
      return TeacherIntelligence.getStudentSummary(studentId, config.fallbackStudent || null, {
        Evidence: Evidence,
        TeacherSelectors: config.TeacherSelectors || root.CSTeacherSelectors || null
      });
    }
    if (Evidence && typeof Evidence.getStudentSummary === "function") {
      try { return Evidence.getStudentSummary(studentId); } catch (_err) {}
    }
    return null;
  }

  function getRecentSessions(studentId, query, options) {
    var config = options && typeof options === "object" ? options : {};
    var Evidence = config.Evidence || root.CSEvidence || null;
    if (!Evidence || typeof Evidence.getRecentSessions !== "function") return [];
    try {
      return Evidence.getRecentSessions(studentId, query || {}) || [];
    } catch (_err) {
      return [];
    }
  }

  function getSupportStudent(studentId, options) {
    var config = options && typeof options === "object" ? options : {};
    var SupportStore = config.SupportStore || root.CSSupportStore || null;
    if (!SupportStore || typeof SupportStore.getStudent !== "function") {
      return { goals: [], interventions: [], accommodations: [] };
    }
    try {
      return SupportStore.getStudent(studentId) || { goals: [], interventions: [], accommodations: [] };
    } catch (_err) {
      return { goals: [], interventions: [], accommodations: [] };
    }
  }

  function getExecutiveFunction(studentId, options) {
    var config = options && typeof options === "object" ? options : {};
    var SupportStore = config.SupportStore || root.CSSupportStore || null;
    if (!SupportStore || typeof SupportStore.getExecutiveFunction !== "function") {
      return { upcomingTasks: [] };
    }
    try {
      return SupportStore.getExecutiveFunction(studentId) || { upcomingTasks: [] };
    } catch (_err) {
      return { upcomingTasks: [] };
    }
  }

  function getStudentBundle(studentId, options) {
    return {
      summary: getStudentSummary(studentId, options),
      sessions: getRecentSessions(studentId, { limit: 7 }, options),
      support: getSupportStudent(studentId, options),
      executive: getExecutiveFunction(studentId, options)
    };
  }

  return {
    getStudentSummary: getStudentSummary,
    getRecentSessions: getRecentSessions,
    getSupportStudent: getSupportStudent,
    getExecutiveFunction: getExecutiveFunction,
    getStudentBundle: getStudentBundle
  };
});
