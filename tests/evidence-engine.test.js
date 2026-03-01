'use strict';

const assert = require('assert');

global.localStorage = {
  _store: {},
  getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
  setItem(key, value) { this._store[key] = String(value); },
  removeItem(key) { delete this._store[key]; }
};

const engine = require('../js/evidence-engine.js');

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function run() {
  engine._clearAll();

  // recordEvidence appends + persists
  engine.recordEvidence({
    studentId: 'stu-a',
    timestamp: isoDaysAgo(2),
    module: 'wordquest',
    activityId: 'wq-1',
    targets: ['LIT.DEC.SYL'],
    tier: 'T2',
    result: { accuracy: 0.6 },
    confidence: 0.7
  });
  let store = JSON.parse(localStorage.getItem(engine.STORAGE_KEY));
  assert(store.students['stu-a'].skills['LIT.DEC.SYL'].records.length === 1, 'stores first record');

  // rolling window N=5 per (student,skill)
  for (let i = 0; i < 7; i += 1) {
    engine.recordEvidence({
      studentId: 'stu-a',
      timestamp: isoDaysAgo(1),
      module: 'wordquest',
      activityId: `wq-${i + 2}`,
      targets: ['LIT.DEC.SYL'],
      tier: 'T2',
      result: { accuracy: 0.5 + (i * 0.01) },
      confidence: 0.6
    });
  }
  store = JSON.parse(localStorage.getItem(engine.STORAGE_KEY));
  assert.strictEqual(store.students['stu-a'].skills['LIT.DEC.SYL'].records.length, 5, 'keeps last 5 records');

  // snapshot mastery + staleness
  const snapshot = engine.getStudentSkillSnapshot('stu-a');
  assert(snapshot.skills['LIT.DEC.SYL'], 'has skill snapshot');
  assert(typeof snapshot.skills['LIT.DEC.SYL'].mastery === 'number', 'has mastery');
  assert(typeof snapshot.skills['LIT.DEC.SYL'].lastTs === 'number', 'has lastTs');
  assert(typeof snapshot.skills['LIT.DEC.SYL'].stalenessDays === 'number', 'has stalenessDays');

  // computePriority sorted + numeric overall
  const pr = engine.computePriority('stu-a');
  assert(Array.isArray(pr.topSkills), 'topSkills array');
  assert(typeof pr.overallPriority === 'number', 'overallPriority number');
  for (let i = 1; i < pr.topSkills.length; i += 1) {
    assert(pr.topSkills[i - 1].priorityScore >= pr.topSkills[i].priorityScore, 'priority sorted desc');
  }

  // confidence lowers priority (same evidence)
  engine.recordEvidence({
    studentId: 'conf-hi',
    timestamp: isoDaysAgo(5),
    module: 'wordquest',
    targets: ['LIT.DEC.PHG'],
    tier: 'T2',
    result: { accuracy: 0.5 },
    confidence: 0.9
  });
  engine.recordEvidence({
    studentId: 'conf-lo',
    timestamp: isoDaysAgo(5),
    module: 'wordquest',
    targets: ['LIT.DEC.PHG'],
    tier: 'T2',
    result: { accuracy: 0.5 },
    confidence: 0.2
  });
  const hi = engine.computePriority('conf-hi').overallPriority;
  const lo = engine.computePriority('conf-lo').overallPriority;
  assert(lo > hi, 'lower confidence increases urgency');

  // missing evidence fallback
  const missing = engine.computePriority('nobody');
  assert(missing.topSkills.length > 0, 'missing evidence still returns topSkills');
  assert(missing.topSkills[0].skillId === 'MISSING_EVIDENCE', 'missing evidence sentinel');

  console.log('evidence-engine.test: ok');
}

run();
