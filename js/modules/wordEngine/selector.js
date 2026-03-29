/**
 * js/modules/wordEngine/selector.js — ES module version of WQSelector
 *
 * Adaptive word selection. Identical logic to js/wordEngine/selector.js (IIFE)
 * but imports WQData as a proper ES module dependency.
 */

import WQData from '../data.js';

const PROFICIENCY_TO_TIER = {
  1: ['Tier 1'],
  2: ['Tier 1'],
  3: ['Tier 1', 'Tier 2'],
  4: ['Tier 2', 'Tier 3'],
  5: ['Tier 2', 'Tier 3'],
};

const GRADE_TO_BAND = (grade) => {
  if (grade <= 2) return 'K-2';
  if (grade <= 5) return 'G3-5';
  if (grade <= 8) return 'G6-8';
  return 'G9-12';
};

function ensureDataLoaded() {
  if (!WQData.isLoaded()) {
    console.warn('[WQSelector] Data not loaded yet');
    return false;
  }
  return true;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getComplexity(entry) {
  let score = 1;
  if (entry.syllables && entry.syllables.includes('•')) {
    if (entry.syllables.split('•').length > 2) score++;
  }
  if (entry.tier === 'Tier 3') score++;
  if (entry.definition && entry.definition.length > 60) score++;
  return Math.min(score, 5);
}

function selectWords({ grade = 3, proficiency = 3, limit = 50, preferDecodable = false } = {}) {
  if (!ensureDataLoaded()) return [];
  const gradeBand = GRADE_TO_BAND(grade);
  const allowedTiers = PROFICIENCY_TO_TIER[proficiency] || ['Tier 1', 'Tier 2'];

  let pool = WQData.getPlayableWords({ gradeBand })
    .map(w => WQData.getEntry(w))
    .filter(Boolean);

  pool = pool.filter(entry => {
    const tierOK = allowedTiers.includes(entry.tier);
    const newcomerOverride = proficiency <= 2 && getComplexity(entry) <= 2;
    return tierOK || newcomerOverride;
  });

  if (preferDecodable) pool = pool.filter(e => e.tier === 'Tier 1');
  return shuffle(pool).slice(0, limit);
}

function getRandomWord(context = {}) {
  const words = selectWords({ ...context, limit: 1 });
  return words[0]?.word || null;
}

function generateTabooList(targetWord, context = {}) {
  if (!ensureDataLoaded()) return [];
  const pool = selectWords({ ...context, limit: 200 });
  const targetEntry = pool.find(w => w.word === targetWord);
  if (!targetEntry) return [];
  const related = pool.filter(w => {
    if (!w.definition || !targetEntry.definition) return false;
    return (
      w.tier === targetEntry.tier ||
      w.definition.split(' ').some(word => targetEntry.definition.includes(word))
    );
  });
  return shuffle(related).slice(0, 3).map(w => w.word);
}

export default { selectWords, getRandomWord, generateTabooList };
