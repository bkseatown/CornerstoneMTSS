(function initExportNotes(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CSExportNotes = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function factory() {
  'use strict';

  function pct(value) {
    if (!Number.isFinite(Number(value))) return '--';
    var n = Number(value);
    if (n <= 1) n *= 100;
    return Math.round(n) + '%';
  }

  function dateLine() {
    return new Date().toLocaleString();
  }

  function buildSessionNote(payload) {
    var p = payload || {};
    var student = p.student || {};
    var skills = Array.isArray(p.topSkills) ? p.topSkills : [];
    var evidence = p.evidenceSummary || {};
    var skillLine = skills.length ? skills.slice(0, 2).join(', ') : 'Baseline collection';
    var nextStep = p.nextStep || 'Continue Tier 2 targeted practice';
    var minutes = Number(p.minutes || 20);

    return [
      'Cornerstone MTSS Session Note',
      'Date: ' + dateLine(),
      'Student: ' + (student.name || 'Student') + (student.id ? (' (' + student.id + ')') : ''),
      'Session: ' + minutes + ' minutes targeted support',
      'Focus Skills: ' + skillLine,
      'Evidence: accuracy ' + pct(evidence.accuracy) + '; last checked ' + (evidence.lastChecked || 'today'),
      'What we did: quick check + guided practice with explicit feedback.',
      'Next Step: ' + nextStep
    ].join('\n');
  }

  function buildFamilyNote(payload) {
    var p = payload || {};
    var student = p.student || {};
    var skills = Array.isArray(p.topSkills) ? p.topSkills : [];
    var firstSkill = skills[0] || 'reading strategy';
    var nextStep = p.nextStep || 'short guided reading practice';

    return [
      'Family Update',
      'Date: ' + dateLine(),
      'Student: ' + (student.name || 'Student'),
      'Today we practiced: ' + firstSkill + '.',
      'Progress signal: steady effort and improving accuracy on the target pattern.',
      'Next at school: ' + nextStep + '.',
      'At home (optional): read a short passage and ask your child to explain one tricky word.'
    ].join('\n');
  }

  return {
    buildSessionNote: buildSessionNote,
    buildFamilyNote: buildFamilyNote
  };
}));
