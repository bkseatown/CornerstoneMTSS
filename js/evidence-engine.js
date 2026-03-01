(function initEvidenceEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CSEvidenceEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function factory() {
  'use strict';

  var STORAGE_KEY = 'cs.evidence.v2';
  var WINDOW_N = 5;

  var DEFAULT_MAPPING = {
    modules: {
      wordquest: {
        primary: ['LIT.DEC.PHG', 'LIT.DEC.SYL', 'LIT.DEC.IRREG'],
        secondary: ['LIT.LANG.VOC'],
        evidence: ['accuracy', 'error_pattern', 'latency', 'retrieval_strength']
      },
      readinglab: {
        primary: ['LIT.FLU.ACC', 'LIT.FLU.PRO'],
        secondary: ['LIT.LANG.SYN'],
        evidence: ['wcpm', 'error_rate', 'self_correction', 'prosody_rating']
      },
      sentencesurgery: {
        primary: ['LIT.LANG.SYN'],
        secondary: ['LIT.LANG.VOC', 'LIT.WRITE.SENT'],
        evidence: ['sentence_repair', 'cloze', 'grammar_events']
      },
      writingstudio: {
        primary: ['LIT.WRITE.SENT', 'LIT.WRITE.PAR'],
        secondary: ['LIT.LANG.VOC'],
        evidence: ['sentence_quality', 'cohesion_events']
      }
    }
  };

  var mappingConfig = DEFAULT_MAPPING;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce(function (sum, v) { return sum + v; }, 0) / values.length;
  }

  function nowTs() {
    return Date.now();
  }

  function toMs(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    var parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function daysSince(ts) {
    if (!ts) return 365;
    return Math.max(0, Math.floor((nowTs() - ts) / 86400000));
  }

  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return fallback;
    }
  }

  function readStore() {
    if (typeof localStorage === 'undefined') {
      return { students: {} };
    }
    var parsed = safeParse(localStorage.getItem(STORAGE_KEY), { students: {} });
    if (!parsed || typeof parsed !== 'object') return { students: {} };
    if (!parsed.students || typeof parsed.students !== 'object') parsed.students = {};
    return parsed;
  }

  function writeStore(store) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function normalizeModule(moduleName) {
    return String(moduleName || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  function inferTargets(event) {
    var mod = normalizeModule(event.module);
    var fromMap = mappingConfig.modules[mod];
    if (fromMap && Array.isArray(fromMap.primary) && fromMap.primary.length) {
      return fromMap.primary.slice(0, 2);
    }
    return [];
  }

  function normalizeAccuracy(result) {
    if (!result || typeof result !== 'object') return null;
    if (Number.isFinite(Number(result.accuracy))) {
      var raw = Number(result.accuracy);
      if (raw > 1) return clamp(raw / 100, 0, 1);
      return clamp(raw, 0, 1);
    }
    if (Number.isFinite(Number(result.wcpm))) {
      return clamp(Number(result.wcpm) / 150, 0, 1);
    }
    if (Number.isFinite(Number(result.attempts)) && result.attempts > 0) {
      return clamp(1 - (Number(result.errorCount || 0) / Number(result.attempts)), 0, 1);
    }
    return null;
  }

  function ensureStudent(store, studentId) {
    var sid = String(studentId || '');
    if (!sid) return null;
    if (!store.students[sid]) {
      store.students[sid] = {
        records: []
      };
    }
    return sid;
  }

  function recordEvidence(event) {
    var store = readStore();
    var sid = ensureStudent(store, event && event.studentId);
    if (!sid) return null;

    var normalized = {
      studentId: sid,
      timestamp: event.timestamp || new Date().toISOString(),
      module: String(event.module || 'wordquest'),
      activityId: String(event.activityId || ''),
      targets: Array.isArray(event.targets) && event.targets.length ? event.targets.slice(0, 4) : inferTargets(event || {}),
      tier: event.tier === 'T3' ? 'T3' : 'T2',
      doseMin: Number(event.doseMin || 0),
      result: event.result && typeof event.result === 'object' ? event.result : {},
      confidence: Number.isFinite(Number(event.confidence)) ? clamp(Number(event.confidence), 0, 1) : 0.5
    };

    store.students[sid].records.push(normalized);
    if (store.students[sid].records.length > 400) {
      store.students[sid].records = store.students[sid].records.slice(-400);
    }
    writeStore(store);
    return normalized;
  }

  function getStudentRecords(studentId) {
    var store = readStore();
    var sid = String(studentId || '');
    var rows = (store.students[sid] && store.students[sid].records) || [];
    return rows.slice().sort(function (a, b) {
      return toMs(a.timestamp) - toMs(b.timestamp);
    });
  }

  function getStudentSkillSnapshot(studentId) {
    var records = getStudentRecords(studentId);
    var bySkill = {};

    records.forEach(function (row) {
      var targets = Array.isArray(row.targets) ? row.targets : [];
      if (!targets.length) return;
      var acc = normalizeAccuracy(row.result);
      targets.forEach(function (skillId) {
        if (!bySkill[skillId]) bySkill[skillId] = [];
        bySkill[skillId].push({
          ts: toMs(row.timestamp),
          tier: row.tier === 'T3' ? 'T3' : 'T2',
          confidence: Number.isFinite(Number(row.confidence)) ? clamp(Number(row.confidence), 0, 1) : 0.5,
          masteryPoint: acc
        });
      });
    });

    var skills = Object.keys(bySkill).map(function (skillId) {
      var rows = bySkill[skillId].slice(-WINDOW_N);
      var masteryValues = rows
        .map(function (r) { return r.masteryPoint; })
        .filter(function (v) { return Number.isFinite(v); });
      var mastery = masteryValues.length ? mean(masteryValues) : 0.5;
      var last = rows[rows.length - 1] || {};
      return {
        skillId: skillId,
        records: rows.length,
        mastery: clamp(mastery, 0, 1),
        tier: last.tier || 'T2',
        confidence: Number.isFinite(Number(last.confidence)) ? clamp(Number(last.confidence), 0, 1) : 0.5,
        lastSeenTs: last.ts || 0,
        stalenessDays: daysSince(last.ts || 0)
      };
    });

    return {
      studentId: String(studentId || ''),
      updatedAt: new Date().toISOString(),
      skills: skills
    };
  }

  function computePriority(studentId) {
    var snapshot = getStudentSkillSnapshot(studentId);
    var topSkills = snapshot.skills.map(function (skill) {
      var need = 1 - skill.mastery;
      var staleness = skill.stalenessDays;
      var tierWeight = skill.tier === 'T3' ? 1.2 : 1.0;
      var confidence = Number.isFinite(Number(skill.confidence)) ? skill.confidence : 0.5;
      var priority =
        (need * 0.5) +
        (staleness * 0.2) +
        (tierWeight * 0.2) -
        (confidence * 0.1);
      return {
        skillId: skill.skillId,
        priorityScore: Number(priority.toFixed(4)),
        need: Number(need.toFixed(4)),
        stalenessDays: staleness,
        tierWeight: tierWeight,
        confidence: confidence,
        rationale: 'Priority: ' + skill.skillId + ' — low mastery + ' + staleness + ' days stale'
      };
    }).sort(function (a, b) {
      return b.priorityScore - a.priorityScore;
    });

    var overall = topSkills.length ? mean(topSkills.map(function (s) { return s.priorityScore; })) : 0;

    return {
      studentId: String(studentId || ''),
      topSkills: topSkills.slice(0, 3),
      overallPriority: Number(overall.toFixed(4))
    };
  }

  function setMapping(nextMapping) {
    if (nextMapping && typeof nextMapping === 'object' && nextMapping.modules) {
      mappingConfig = nextMapping;
    }
  }

  function _clearAll() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    recordEvidence: recordEvidence,
    getStudentSkillSnapshot: getStudentSkillSnapshot,
    computePriority: computePriority,
    setMapping: setMapping,
    _clearAll: _clearAll
  };
}));
