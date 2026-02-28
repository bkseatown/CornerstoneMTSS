(function evidenceStoreModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  var api = factory();
  root.CSEvidence = api;
  // Backward compat for existing hooks.
  root.CSEvidenceStore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "cs_evidence_v1";
  var VERSION = 1;
  var MAX_SPARK = 7;
  var warnedCorrupt = false;
  var warnedStorage = false;

  var DOMAIN_ALLOWLIST = {
    wordquest: [
      "guessCount",
      "timeToFirstGuess",
      "avgGuessLatency",
      "constraintHonorRate",
      "vowelChurnDelta",
      "repeatedLetterErrors",
      "correctLettersCount",
      "contradictionRate",
      "clueUseScore",
      "statusLabel"
    ],
    reading: ["orfEstimate", "accuracyPct", "punctuationRespect", "prosodyCueScore", "selfCorrections", "statusLabel"],
    sentence: ["revisionCount", "reasoningSlotUsed", "clarityDelta", "structureComplete", "statusLabel"],
    writing: ["revisionCount", "reasoningSlotUsed", "clarityDelta", "structureComplete", "statusLabel"]
  };

  function now() { return Date.now(); }

  function safeParse(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function emptyDomain() {
    return { signals: {}, spark: [], last: {}, updatedAt: now() };
  }

  function emptyStudent(meta) {
    return {
      meta: {
        id: String(meta && meta.id || ""),
        name: String(meta && meta.name || ""),
        tier: String(meta && meta.tier || "")
      },
      updatedAt: now(),
      domains: {
        wordquest: emptyDomain(),
        reading: emptyDomain(),
        sentence: emptyDomain(),
        writing: emptyDomain()
      }
    };
  }

  function emptyState() {
    return {
      version: VERSION,
      updatedAt: now(),
      students: {}
    };
  }

  function sanitizePayload(domain, payload) {
    var src = payload && typeof payload === "object" ? payload : {};
    var allow = DOMAIN_ALLOWLIST[domain] || [];
    var out = {};
    allow.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) return;
      var value = src[key];
      if (typeof value === "number") {
        out[key] = Number.isFinite(value) ? value : 0;
      } else if (typeof value === "boolean") {
        out[key] = value;
      } else if (typeof value === "string") {
        out[key] = String(value).slice(0, 120);
      }
    });
    return out;
  }

  function ensureSchema(state) {
    if (!state || typeof state !== "object") return emptyState();
    if (Number(state.version || 0) !== VERSION) return emptyState();
    if (!state.students || typeof state.students !== "object") state.students = {};
    Object.keys(state.students).forEach(function (studentId) {
      var row = state.students[studentId];
      if (!row || typeof row !== "object") {
        state.students[studentId] = emptyStudent({ id: studentId });
        return;
      }
      if (!row.meta || typeof row.meta !== "object") row.meta = { id: studentId, name: "", tier: "" };
      if (!row.domains || typeof row.domains !== "object") row.domains = {};
      ["wordquest", "reading", "sentence", "writing"].forEach(function (domain) {
        if (!row.domains[domain] || typeof row.domains[domain] !== "object") row.domains[domain] = emptyDomain();
        if (!row.domains[domain].signals || typeof row.domains[domain].signals !== "object") row.domains[domain].signals = {};
        if (!Array.isArray(row.domains[domain].spark)) row.domains[domain].spark = [];
        if (!row.domains[domain].last || typeof row.domains[domain].last !== "object") row.domains[domain].last = {};
      });
    });
    return state;
  }

  function load() {
    try {
      var parsed = safeParse(localStorage.getItem(KEY));
      if (!parsed) return emptyState();
      return ensureSchema(parsed);
    } catch (_err) {
      if (!warnedCorrupt) {
        warnedCorrupt = true;
        console.warn("[CSEvidence] Evidence storage unavailable/corrupt; resetting");
      }
      return emptyState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (_err) {
      if (!warnedStorage) {
        warnedStorage = true;
        console.warn("[CSEvidence] Failed to persist evidence payload");
      }
      return false;
    }
  }

  function ensureStudent(studentId, meta) {
    var sid = String(studentId || "").trim() || "demo-student";
    var state = load();
    if (!state.students[sid]) state.students[sid] = emptyStudent({ id: sid });
    if (meta && typeof meta === "object") {
      if (meta.name) state.students[sid].meta.name = String(meta.name);
      if (meta.tier) state.students[sid].meta.tier = String(meta.tier);
    }
    state.students[sid].updatedAt = now();
    state.updatedAt = now();
    save(state);
    return state.students[sid];
  }

  function appendSignal(studentId, domain, signalObj, opts) {
    var normalizedDomain = String(domain || "").toLowerCase();
    if (!DOMAIN_ALLOWLIST[normalizedDomain]) return null;

    var sid = String(studentId || "").trim() || "demo-student";
    var state = load();
    if (!state.students[sid]) state.students[sid] = emptyStudent({ id: sid });

    var row = state.students[sid].domains[normalizedDomain];
    var payload = sanitizePayload(normalizedDomain, signalObj);
    Object.keys(payload).forEach(function (key) {
      row.last[key] = payload[key];
      row.signals[key] = payload[key];
    });

    var sparkKey = opts && opts.sparkKey ? String(opts.sparkKey) : "";
    if (sparkKey && Object.prototype.hasOwnProperty.call(payload, sparkKey)) {
      var point = Math.max(0, Math.min(100, Math.round(Number(payload[sparkKey]) || 0)));
      row.spark.push(point);
      if (row.spark.length > MAX_SPARK) row.spark = row.spark.slice(-MAX_SPARK);
    }

    row.updatedAt = now();
    state.students[sid].updatedAt = now();
    state.updatedAt = now();
    save(state);
    return row;
  }

  function toAvg(list) {
    if (!Array.isArray(list) || !list.length) return 0;
    return Math.round(list.reduce(function (sum, value) { return sum + Number(value || 0); }, 0) / list.length);
  }

  function computeChips(studentId) {
    var sid = String(studentId || "").trim() || "demo-student";
    var state = load();
    var student = state.students[sid];
    if (!student) return { topNeeds: [], strengths: [], tierHint: "Tier 2" };

    var scored = ["wordquest", "reading", "sentence", "writing"].map(function (domain) {
      return { domain: domain, score: toAvg(student.domains[domain].spark) };
    }).sort(function (a, b) { return a.score - b.score; });

    var topNeeds = scored.slice(0, 2).map(function (d) {
      if (d.domain === "wordquest") return "Decoding precision";
      if (d.domain === "reading") return "Fluency + ORF";
      if (d.domain === "sentence") return "Sentence clarity";
      return "Writing structure";
    });

    var strengths = scored.slice(-2).reverse().map(function (d) {
      if (d.domain === "wordquest") return "Constraint tracking";
      if (d.domain === "reading") return "Reading momentum";
      if (d.domain === "sentence") return "Reasoning sentence moves";
      return "Paragraph organization";
    });

    var lowest = scored[0] ? scored[0].score : 0;
    var tierHint = lowest < 45 ? "Tier 3" : (lowest < 70 ? "Tier 2" : "Tier 1");
    return { topNeeds: topNeeds, strengths: strengths, tierHint: tierHint };
  }

  function computeNextBestAction(studentId) {
    var sid = String(studentId || "").trim() || "demo-student";
    var state = load();
    var student = state.students[sid];
    if (!student) {
      return {
        title: "Collect baseline signals",
        why: "No recent evidence for this student.",
        buttonLabel: "Open Word Quest",
        href: "word-quest.html?studentId=" + encodeURIComponent(sid) + "&from=teacher"
      };
    }

    var scored = ["wordquest", "reading", "sentence", "writing"].map(function (domain) {
      return { domain: domain, score: toAvg(student.domains[domain].spark) };
    }).sort(function (a, b) { return a.score - b.score; });

    var weakest = scored[0] && scored[0].domain || "wordquest";
    if (weakest === "wordquest") {
      return {
        title: "Run vowel sweep mini-lesson",
        why: "Word study signals suggest unstable constraint use.",
        buttonLabel: "Launch Word Quest",
        href: "word-quest.html?studentId=" + encodeURIComponent(sid) + "&from=teacher"
      };
    }
    if (weakest === "reading") {
      return {
        title: "Run 3-minute ORF check",
        why: "Fluency trend is trailing the other domains.",
        buttonLabel: "Launch Reading Lab",
        href: "reading-lab.html?studentId=" + encodeURIComponent(sid) + "&from=teacher"
      };
    }
    if (weakest === "sentence") {
      return {
        title: "Run sentence reasoning prompt",
        why: "Sentence revision signals are below target.",
        buttonLabel: "Launch Sentence Surgery",
        href: "sentence-surgery.html?studentId=" + encodeURIComponent(sid) + "&from=teacher"
      };
    }
    return {
      title: "Run writing structure sprint",
      why: "Writing structure signal needs a fresh sample.",
      buttonLabel: "Launch Writing Studio",
      href: "writing-studio.html?studentId=" + encodeURIComponent(sid) + "&from=teacher"
    };
  }

  function exportStudentSnapshot(studentId) {
    var sid = String(studentId || "").trim() || "demo-student";
    var state = load();
    var student = state.students[sid] || emptyStudent({ id: sid });
    var json = {
      version: VERSION,
      exportedAt: now(),
      studentId: sid,
      meta: student.meta,
      domains: student.domains
    };

    var csvRows = [
      ["studentId", "domain", "score", "signals", "spark"].join(",")
    ];
    ["wordquest", "reading", "sentence", "writing"].forEach(function (domain) {
      var row = student.domains[domain] || emptyDomain();
      var score = toAvg(row.spark);
      var signals = Object.keys(row.signals || {}).slice(0, 4).join("|");
      var spark = (row.spark || []).join("|");
      csvRows.push([sid, domain, score, signals, spark].map(csvEscape).join(","));
    });

    return {
      json: json,
      csvRows: csvRows
    };
  }

  function csvEscape(value) {
    var text = String(value == null ? "" : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function init() {
    var state = load();
    save(state);
    return state;
  }

  return {
    KEY: KEY,
    load: load,
    save: save,
    init: init,
    ensureStudent: ensureStudent,
    appendSignal: appendSignal,
    computeChips: computeChips,
    exportStudentSnapshot: exportStudentSnapshot,
    computeNextBestAction: computeNextBestAction,
    // Backward-compatible alias
    record: appendSignal
  };
});
