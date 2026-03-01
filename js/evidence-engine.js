(function initEvidenceEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.CSEvidenceEngine = factory(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function factory(root) {
  'use strict';

  var STORAGE_KEY = 'cs.evidence.v2';
  var WINDOW_N = 5;
  var DEFAULT_CONFIDENCE = 0.5;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return fallback;
    }
  }

  function toMs(value) {
    if (!value) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function daysSince(ts) {
    if (!ts) return 0;
    var delta = Date.now() - ts;
    return Math.max(0, Math.floor(delta / 86400000));
  }

  function readStore() {
    if (typeof localStorage === 'undefined') return { version: STORAGE_KEY, students: {} };
    var parsed = safeParse(localStorage.getItem(STORAGE_KEY), { version: STORAGE_KEY, students: {} });
    if (!parsed || typeof parsed !== 'object') parsed = { version: STORAGE_KEY, students: {} };
    if (!parsed.students || typeof parsed.students !== 'object') parsed.students = {};
    if (!parsed.version) parsed.version = STORAGE_KEY;
    return parsed;
  }

  function writeStore(store) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function ensureStudent(store, studentId) {
    var sid = String(studentId || '');
    if (!sid) return null;
    if (!store.students[sid]) {
      store.students[sid] = { skills: {} };
    }
    if (!store.students[sid].skills || typeof store.students[sid].skills !== 'object') {
      store.students[sid].skills = {};
    }
    return sid;
  }

  function normalizeModuleName(value) {
    return String(value || 'wordquest').toLowerCase().replace(/[^a-z]/g, '');
  }

  function normalizeResult(result) {
    var src = result && typeof result === 'object' ? result : {};
    var out = {};
    if (Number.isFinite(Number(src.accuracy))) out.accuracy = clamp(Number(src.accuracy), 0, 1);
    if (Number.isFinite(Number(src.latencyMs))) out.latencyMs = Math.max(0, Number(src.latencyMs));
    if (Number.isFinite(Number(src.wcpm))) out.wcpm = Math.max(0, Number(src.wcpm));
    if (Number.isFinite(Number(src.attempts))) out.attempts = Math.max(0, Number(src.attempts));
    if (Number.isFinite(Number(src.errorRate))) out.errorRate = clamp(Number(src.errorRate), 0, 1);
    if (Array.isArray(src.errorPattern)) out.errorPattern = src.errorPattern.slice(0, 10);
    else if (src.errorPattern != null) out.errorPattern = [String(src.errorPattern)];
    return out;
  }

  function normalizeTargets(event) {
    var inTargets = Array.isArray(event.targets) ? event.targets : [];
    return inTargets
      .map(function (id) { return String(id || '').trim(); })
      .filter(Boolean)
      .slice(0, 8);
  }

  function normalizeEvent(event) {
    var e = event && typeof event === 'object' ? event : {};
    var ts = toMs(e.timestamp);
    var timestampIso = ts ? new Date(ts).toISOString() : new Date().toISOString();
    return {
      studentId: String(e.studentId || ''),
      timestamp: timestampIso,
      module: normalizeModuleName(e.module),
      activityId: String(e.activityId || ''),
      targets: normalizeTargets(e),
      tier: e.tier === 'T3' ? 'T3' : 'T2',
      doseMin: Math.max(0, Number(e.doseMin || 0)),
      result: normalizeResult(e.result),
      confidence: Number.isFinite(Number(e.confidence)) ? clamp(Number(e.confidence), 0, 1) : DEFAULT_CONFIDENCE,
      notes: e.notes != null ? String(e.notes) : ''
    };
  }

  function recordEvidence(event) {
    var normalized = normalizeEvent(event);
    if (!normalized.studentId || !normalized.targets.length) return null;

    var store = readStore();
    var sid = ensureStudent(store, normalized.studentId);
    if (!sid) return null;

    normalized.targets.forEach(function (targetId) {
      if (!store.students[sid].skills[targetId]) {
        store.students[sid].skills[targetId] = { records: [], lastTs: 0 };
      }
      var bucket = store.students[sid].skills[targetId];
      bucket.records.push(normalized);
      if (bucket.records.length > WINDOW_N) {
        bucket.records = bucket.records.slice(-WINDOW_N);
      }
      bucket.lastTs = toMs(normalized.timestamp);
    });

    writeStore(store);
    return normalized;
  }

  function getSkillRows(studentId, targetId) {
    var sid = String(studentId || '');
    var tid = String(targetId || '');
    if (!sid || !tid) return [];
    var store = readStore();
    var bucket = store.students[sid] && store.students[sid].skills && store.students[sid].skills[tid];
    var rows = bucket && Array.isArray(bucket.records) ? bucket.records.slice() : [];
    rows.sort(function (a, b) { return toMs(a.timestamp) - toMs(b.timestamp); });
    return rows;
  }

  function getStudentSkillSnapshot(studentId, _opts) {
    var sid = String(studentId || '');
    var store = readStore();
    var skills = {};
    var skillMap = store.students[sid] && store.students[sid].skills ? store.students[sid].skills : {};

    Object.keys(skillMap).forEach(function (targetId) {
      var rows = getSkillRows(sid, targetId).slice(-WINDOW_N);
      var lastTs = rows.length ? toMs(rows[rows.length - 1].timestamp) : 0;
      var stalenessDays = daysSince(lastTs);
      var accuracyValues = rows
        .map(function (r) { return r && r.result ? r.result.accuracy : null; })
        .filter(function (v) { return Number.isFinite(Number(v)); })
        .map(function (v) { return clamp(Number(v), 0, 1); });

      var rawMastery = accuracyValues.length
        ? accuracyValues.reduce(function (sum, v) { return sum + v; }, 0) / accuracyValues.length
        : 0.5;

      skills[targetId] = {
        n: rows.length,
        rawMastery: Number(rawMastery.toFixed(4)),
        mastery: Number(rawMastery.toFixed(4)),
        lastTs: lastTs,
        stalenessDays: stalenessDays
      };
    });

    return {
      studentId: sid,
      skills: skills
    };
  }

  function computePriority(studentId, _opts) {
    var sid = String(studentId || '');
    var snapshot = getStudentSkillSnapshot(sid);
    var rows = [];

    Object.keys(snapshot.skills).forEach(function (skillId) {
      var skill = snapshot.skills[skillId];
      var recentRows = getSkillRows(sid, skillId);
      var latest = recentRows.length ? recentRows[recentRows.length - 1] : null;
      var confidence = latest && Number.isFinite(Number(latest.confidence))
        ? clamp(Number(latest.confidence), 0, 1)
        : DEFAULT_CONFIDENCE;
      var tier = latest && latest.tier === 'T3' ? 'T3' : 'T2';
      var need = 1 - Number(skill.mastery || 0.5);
      var priorityScore = (need * 0.6) + (Number(skill.stalenessDays || 0) * 0.2) - (confidence * 0.1);
      rows.push({
        skillId: skillId,
        priorityScore: Number(priorityScore.toFixed(4)),
        need: Number(need.toFixed(4)),
        stalenessDays: Number(skill.stalenessDays || 0),
        tier: tier,
        confidence: Number(confidence.toFixed(4))
      });
    });

    rows.sort(function (a, b) { return b.priorityScore - a.priorityScore; });
    var topSkills = rows.slice(0, 3);
    var overallPriority = topSkills.reduce(function (sum, row) { return sum + Number(row.priorityScore || 0); }, 0);

    if (!topSkills.length) {
      topSkills.push({
        skillId: 'MISSING_EVIDENCE',
        priorityScore: 0.9,
        need: 0.5,
        stalenessDays: 0,
        tier: 'T2',
        confidence: DEFAULT_CONFIDENCE
      });
      overallPriority = 0.9;
    }

    return {
      studentId: sid,
      topSkills: topSkills,
      overallPriority: Number(overallPriority.toFixed(4))
    };
  }

  function _clearAll() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    WINDOW_N: WINDOW_N,
    recordEvidence: recordEvidence,
    getStudentSkillSnapshot: getStudentSkillSnapshot,
    computePriority: computePriority,
    _clearAll: _clearAll,
    _getSkillRows: getSkillRows
  };
}));
