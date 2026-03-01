'use strict';

const assert = require('assert');
const engine = require('../js/evidence-engine.js');

global.localStorage = {
  _store: {},
  getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
  setItem(key, value) { this._store[key] = String(value); },
  removeItem(key) { delete this._store[key]; }
};

engine._clearAll();

engine.recordEvidence({
  studentId: 'stu-1',
  timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  module: 'wordquest',
  targets: ['LIT.DEC.SYL'],
  tier: 'T3',
  result: { accuracy: 0.42 },
  confidence: 0.6
});

engine.recordEvidence({
  studentId: 'stu-1',
  timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
  module: 'wordquest',
  targets: ['LIT.DEC.SYL'],
  tier: 'T3',
  result: { accuracy: 0.54 },
  confidence: 0.7
});

const snapshot = engine.getStudentSkillSnapshot('stu-1');
assert(snapshot.skills.length > 0, 'Expected at least one skill snapshot');
const syllable = snapshot.skills.find((s) => s.skillId === 'LIT.DEC.SYL');
assert(syllable, 'Expected LIT.DEC.SYL in snapshot');
assert(syllable.mastery > 0 && syllable.mastery < 1, 'Mastery should be normalized');

const priority = engine.computePriority('stu-1');
assert(priority.topSkills.length > 0, 'Expected priority ranking');
assert(priority.topSkills[0].skillId === 'LIT.DEC.SYL', 'Expected top skill to match evidence');
assert(typeof priority.overallPriority === 'number', 'Expected numeric overallPriority');

console.log('test-evidence-engine: ok');
