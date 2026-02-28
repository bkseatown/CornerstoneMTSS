(function caseloadStoreModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSCaseloadStore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CASELOAD_KEY = "cs_caseload_v1";
  var SESSIONS_KEY = "cs_sessions_v1";
  var SCHEMA_VERSION = 1;
  var MAX_STUDENTS = 200;
  var MAX_SESSIONS = 500;

  function nowIso() {
    return new Date().toISOString();
  }

  function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_e) {
      return fallback;
    }
  }

  function getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }

  function setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function sanitizeTier(tier) {
    var v = String(tier || "").toLowerCase();
    if (v === "tier3" || v === "tier-3" || v === "3") return "tier3";
    if (v === "monitor") return "monitor";
    return "tier2";
  }

  function makeStudentId(name) {
    var base = String(name || "student")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "student";
    return "stu_" + base + "_" + Math.random().toString(36).slice(2, 6);
  }

  function makeSessionId() {
    return "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeStudent(student) {
    var src = student && typeof student === "object" ? student : {};
    var name = String(src.name || "Student").trim() || "Student";
    return {
      id: String(src.id || makeStudentId(name)),
      name: name,
      tier: sanitizeTier(src.tier),
      focusSkill: String(src.focusSkill || "strategy").toLowerCase(),
      notes: String(src.notes || ""),
      updatedAt: String(src.updatedAt || nowIso())
    };
  }

  function normalizeCaseload(payload) {
    var src = payload && typeof payload === "object" ? payload : {};
    var students = Array.isArray(src.students) ? src.students.map(normalizeStudent) : [];
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: String(src.updatedAt || nowIso()),
      students: students.slice(0, MAX_STUDENTS)
    };
  }

  function loadCaseload() {
    var raw = getItem(CASELOAD_KEY);
    var parsed = parseJSON(raw, null);
    if (!parsed || typeof parsed !== "object") {
      return normalizeCaseload({ students: [] });
    }
    return normalizeCaseload(parsed);
  }

  function saveCaseload(caseload) {
    var normalized = normalizeCaseload(caseload);
    normalized.updatedAt = nowIso();
    setItem(CASELOAD_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function upsertStudent(student) {
    var caseload = loadCaseload();
    var next = normalizeStudent(student);
    next.updatedAt = nowIso();
    var index = caseload.students.findIndex(function (row) {
      return String(row.id) === String(next.id);
    });
    if (index >= 0) caseload.students[index] = next;
    else caseload.students.push(next);
    saveCaseload(caseload);
    return next;
  }

  function listSessions() {
    var rows = parseJSON(getItem(SESSIONS_KEY), []);
    if (!Array.isArray(rows)) return [];
    return rows.filter(function (row) { return row && typeof row === "object"; });
  }

  function saveSessions(rows) {
    var next = Array.isArray(rows) ? rows.slice(-MAX_SESSIONS) : [];
    setItem(SESSIONS_KEY, JSON.stringify(next));
    return next;
  }

  function recordSession(studentId, sessionObj) {
    var src = sessionObj && typeof sessionObj === "object" ? sessionObj : {};
    var row = {
      schemaVersion: 1,
      sessionId: String(src.sessionId || makeSessionId()),
      studentId: String(studentId || src.studentId || ""),
      studentName: String(src.studentName || ""),
      mode: String(src.mode || "smallgroup"),
      tier: sanitizeTier(src.tier),
      focusSkill: String(src.focusSkill || "strategy"),
      startedAt: String(src.startedAt || nowIso()),
      endedAt: String(src.endedAt || nowIso()),
      durationMin: Math.max(0, Number(src.durationMin || 0)),
      blocks: Array.isArray(src.blocks) ? src.blocks : [],
      collectedSignals: src.collectedSignals && typeof src.collectedSignals === "object" ? src.collectedSignals : {},
      teacherNote: String(src.teacherNote || ""),
      parentNote: String(src.parentNote || ""),
      createdAt: nowIso(),
      source: String(src.source || "session-runner")
    };

    var rows = listSessions();
    var existing = rows.findIndex(function (item) {
      return String(item.sessionId || "") === row.sessionId;
    });
    if (existing >= 0) rows[existing] = row;
    else rows.push(row);
    saveSessions(rows);
    return row;
  }

  function computeStudentSnapshot(studentId) {
    var sid = String(studentId || "");
    var sessions = listSessions().filter(function (row) {
      return String(row.studentId || "") === sid;
    }).sort(function (a, b) {
      return Date.parse(String(b.createdAt || "")) - Date.parse(String(a.createdAt || ""));
    });

    if (!sessions.length) {
      return {
        studentId: sid,
        sessionsCount: 0,
        lastSessionAt: null,
        avgDurationMin: 0,
        dominantFocus: "strategy",
        trend: "steady"
      };
    }

    var totalDuration = sessions.reduce(function (sum, row) { return sum + Number(row.durationMin || 0); }, 0);
    var focusCounts = {};
    sessions.forEach(function (row) {
      var key = String(row.focusSkill || "strategy");
      focusCounts[key] = (focusCounts[key] || 0) + 1;
    });
    var dominantFocus = Object.keys(focusCounts).sort(function (a, b) {
      return focusCounts[b] - focusCounts[a];
    })[0] || "strategy";

    var latest = sessions[0];
    var recent = sessions.slice(0, 3);
    var recentAvg = recent.reduce(function (sum, row) {
      return sum + Number(row.collectedSignals && row.collectedSignals.sessionScore || 0);
    }, 0) / Math.max(1, recent.length);
    var trend = recentAvg >= 0.7 ? "up" : (recentAvg <= 0.45 ? "down" : "steady");

    return {
      studentId: sid,
      sessionsCount: sessions.length,
      lastSessionAt: latest.createdAt || latest.endedAt || null,
      avgDurationMin: +(totalDuration / sessions.length).toFixed(1),
      dominantFocus: dominantFocus,
      trend: trend
    };
  }

  function computeClassSnapshot() {
    var caseload = loadCaseload();
    var sessions = listSessions();
    var byTier = { tier2: 0, tier3: 0, monitor: 0 };
    caseload.students.forEach(function (student) {
      var tier = sanitizeTier(student.tier);
      byTier[tier] = (byTier[tier] || 0) + 1;
    });
    var latest = sessions.slice().sort(function (a, b) {
      return Date.parse(String(b.createdAt || "")) - Date.parse(String(a.createdAt || ""));
    })[0] || null;

    return {
      studentsCount: caseload.students.length,
      sessionsCount: sessions.length,
      byTier: byTier,
      lastSessionAt: latest ? (latest.createdAt || latest.endedAt || null) : null
    };
  }

  function exportCaseloadJSON() {
    var payload = {
      exportedAt: nowIso(),
      caseload: loadCaseload(),
      sessions: listSessions()
    };
    return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  }

  function exportSessionsCSV() {
    var rows = listSessions();
    var headers = ["sessionId", "studentId", "studentName", "mode", "tier", "focusSkill", "durationMin", "startedAt", "endedAt", "sessionScore"];
    var lines = [headers.join(",")];
    rows.forEach(function (row) {
      var values = [
        row.sessionId,
        row.studentId,
        row.studentName,
        row.mode,
        row.tier,
        row.focusSkill,
        Number(row.durationMin || 0),
        row.startedAt,
        row.endedAt,
        Number(row.collectedSignals && row.collectedSignals.sessionScore || 0)
      ].map(function (value) {
        var s = String(value == null ? "" : value).replace(/"/g, '""');
        return '"' + s + '"';
      });
      lines.push(values.join(","));
    });
    return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  }

  function downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) return false;
    if (typeof document === "undefined") return false;
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = String(filename || "export.dat");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    return true;
  }

  function shouldSeedDemo() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      if (params.get("demo") === "1") return true;
    } catch (_e) {
      // ignore
    }
    return loadCaseload().students.length === 0;
  }

  function seedDemoCaseload() {
    if (!shouldSeedDemo()) return loadCaseload();
    var seeded = normalizeCaseload({
      students: [
        { id: "stu_ava", name: "Ava", tier: "tier3", focusSkill: "decoding" },
        { id: "stu_leo", name: "Leo", tier: "tier2", focusSkill: "strategy" },
        { id: "stu_mia", name: "Mia", tier: "tier2", focusSkill: "reasoning" },
        { id: "stu_noah", name: "Noah", tier: "tier3", focusSkill: "fluency" },
        { id: "stu_iris", name: "Iris", tier: "monitor", focusSkill: "fluency" },
        { id: "stu_zane", name: "Zane", tier: "tier2", focusSkill: "strategy" }
      ]
    });
    saveCaseload(seeded);
    return seeded;
  }

  return {
    CASELOAD_KEY: CASELOAD_KEY,
    SESSIONS_KEY: SESSIONS_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    loadCaseload: loadCaseload,
    saveCaseload: saveCaseload,
    upsertStudent: upsertStudent,
    recordSession: recordSession,
    computeStudentSnapshot: computeStudentSnapshot,
    computeClassSnapshot: computeClassSnapshot,
    exportCaseloadJSON: exportCaseloadJSON,
    exportSessionsCSV: exportSessionsCSV,
    listSessions: listSessions,
    downloadBlob: downloadBlob,
    seedDemoCaseload: seedDemoCaseload,
    makeSessionId: makeSessionId
  };
});
