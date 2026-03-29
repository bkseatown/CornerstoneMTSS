/**
 * js/modules/game.js — ES module version of WQGame
 *
 * Core Word Quest game logic. Identical to js/game.js (IIFE) but imports
 * WQData and WQSelector as proper ES module dependencies.
 */

import WQData from './data.js';
import WQSelector from './wordEngine/selector.js';

const BAG_KEY = 'wq_v2_shuffle_bag';
const PROGRESS_KEY = 'wq_v2_progress';
const STUDENT_PROFICIENCY_KEY = 'wq_v2_student_proficiency_v1';

let currentWord    = '';
let currentEntry   = null;
let currentGuess   = '';
let guesses        = [];
let gameOver       = false;
let maxGuesses     = 6;
let wordLength     = 5;
let lastStartError = null;
let disableProgress = false;

function _shuffleList(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _readBag(scope) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${BAG_KEY}:${scope}`) || '{}');
    return Array.isArray(saved.queue) ? saved : { queue: [], last: '' };
  } catch { return { queue: [], last: '' }; }
}

function _writeBag(scope, state) {
  try {
    localStorage.setItem(`${BAG_KEY}:${scope}`, JSON.stringify(state));
  } catch { /* storage full */ }
}

function _pickWord(pool, scope) {
  if (!pool.length) return null;
  const state = _readBag(scope);
  let queue = state.queue.filter(w => pool.includes(w));
  if (!queue.length) {
    queue = _shuffleList(pool);
    if (queue.length > 1 && queue[queue.length - 1] === state.last) {
      [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
    }
  }
  const next = queue.pop();
  _writeBag(scope, { queue, last: next });
  return next;
}

function _getStudentProficiency(studentId) {
  if (!studentId) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(STUDENT_PROFICIENCY_KEY) || '{}');
    const val = stored[studentId];
    return (val !== undefined && val !== null) ? Number(val) : null;
  } catch { return null; }
}

function _getTeacherPool() {
  const raw = Array.isArray(window.__WQ_TEACHER_POOL__) ? window.__WQ_TEACHER_POOL__ : [];
  return [...new Set(
    raw.map(w => String(w || '').trim().toLowerCase()).filter(w => /^[a-z]{2,12}$/.test(w))
  )];
}

function _evaluate(guess, target) {
  const res  = Array(target.length).fill('absent');
  const tArr = target.split('');
  const gArr = guess.split('');
  gArr.forEach((c, i) => {
    if (c === tArr[i]) { res[i] = 'correct'; tArr[i] = null; gArr[i] = null; }
  });
  gArr.forEach((c, i) => {
    if (c && tArr.includes(c)) { res[i] = 'present'; tArr[tArr.indexOf(c)] = null; }
  });
  return res;
}

function _saveProgress(word, won, guessCount) {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    const today = new Date().toISOString().slice(0, 10);
    if (!data[today]) data[today] = { words: [], wins: 0, total: 0 };
    data[today].words.push({ word, won, guesses: guessCount, ts: Date.now() });
    data[today].total++;
    if (won) data[today].wins++;
    const keys = Object.keys(data).sort();
    while (keys.length > 90) delete data[keys.shift()];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    return data;
  } catch { return {}; }
}

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
  catch { return {}; }
}

export function startGame(opts = {}) {
  lastStartError = null;
  const gradeBand    = opts.gradeBand || localStorage.getItem('wq_v2_grade_band') || 'all';
  const lengthPref   = opts.length   || localStorage.getItem('wq_v2_length')     || 'any';
  const phonics      = opts.phonics  || 'all';
  const normalizedPhonics = String(phonics || '').trim().toLowerCase();
  const includeLowerBands = normalizedPhonics !== 'all' && !normalizedPhonics.startsWith('vocab-');
  const teacherPool  = _getTeacherPool();
  const fixedWord    = String(opts.fixedWord || '').trim().toLowerCase();
  disableProgress    = opts.disableProgress === true;

  let effectiveLengthPref = lengthPref;
  let pool = [];

  if (teacherPool.length) {
    pool = teacherPool.slice();
    effectiveLengthPref = 'teacher';
  } else {
    pool = WQData.getPlayableWords({ gradeBand, length: lengthPref, phonics, includeLowerBands });
    if (!pool.length && effectiveLengthPref !== 'any' && normalizedPhonics !== 'all') {
      const relaxed = WQData.getPlayableWords({ gradeBand, length: 'any', phonics, includeLowerBands });
      if (relaxed.length) { pool = relaxed; effectiveLengthPref = 'any'; }
    }
  }

  const scopeGrade  = includeLowerBands && gradeBand !== 'all' ? `${gradeBand}+down` : gradeBand;
  const scopePrefix = teacherPool.length ? 'teacher' : scopeGrade;
  const scope       = `${scopePrefix}:${effectiveLengthPref}:${phonics}`;

  if (!pool.length) {
    const hasFilters = gradeBand !== 'all' || lengthPref !== 'any' || phonics !== 'all';
    if (hasFilters) {
      lastStartError = { code: 'EMPTY_FILTERED_POOL', gradeBand, length: lengthPref, phonics };
      console.warn('[WQGame] Empty filtered pool — strict gate blocks fallback to all words');
      return false;
    }
    console.warn('[WQGame] Empty unfiltered pool.');
  }

  let word = fixedWord || '';
  if (word && !/^[a-z]{2,12}$/.test(word)) word = '';

  if (!word) {
    // Prefer adaptive selector when no teacher pool / phonics / length filter is active
    const useSelector = !teacherPool.length
      && (phonics === 'all' || !phonics)
      && (lengthPref === 'any' || !lengthPref);
    if (useSelector) {
      const studentId = opts.studentId || '';
      const proficiency = opts.proficiency
        || _getStudentProficiency(studentId)
        || 3;
      const gradeNum = { 'K-2': 1, 'G3-5': 4, 'G6-8': 7, 'G9-12': 10 }[gradeBand] || 3;
      word = WQSelector.getRandomWord({ grade: gradeNum, proficiency }) || '';
    }
    if (!word) word = _pickWord(pool, scope);
  }

  if (!word) {
    console.error('[WQGame] Could not pick a word');
    lastStartError = { code: 'NO_WORD_PICKED', gradeBand, length: lengthPref, phonics };
    return false;
  }

  console.log('Word Engine Active', word);
  currentWord   = word;
  currentEntry  = WQData.getEntry(word);
  currentGuess  = '';
  guesses       = [];
  gameOver      = false;
  wordLength    = word.length;
  maxGuesses    = opts.maxGuesses || 6;

  return { word, entry: currentEntry, wordLength, maxGuesses };
}

export function getLastStartError() {
  return lastStartError ? { ...lastStartError } : null;
}

export function addLetter(letter) {
  if (gameOver || currentGuess.length >= wordLength) return null;
  currentGuess += letter.toLowerCase();
  return { guess: currentGuess };
}

export function deleteLetter() {
  if (gameOver || !currentGuess.length) return null;
  currentGuess = currentGuess.slice(0, -1);
  return { guess: currentGuess };
}

export function submitGuess() {
  if (gameOver) return null;
  if (currentGuess.length !== wordLength) return { error: 'too_short' };
  const result = _evaluate(currentGuess, currentWord);
  const won    = currentGuess === currentWord;
  guesses.push(currentGuess);
  const state = {
    result, guess: currentGuess, guesses: [...guesses], won,
    lost: !won && guesses.length >= maxGuesses,
    word: currentWord, entry: currentEntry,
  };
  if (won || state.lost) {
    gameOver = true;
    if (!disableProgress) _saveProgress(currentWord, won, guesses.length);
  } else {
    currentGuess = '';
  }
  return state;
}

export function getState() {
  return { word: currentWord, entry: currentEntry, guess: currentGuess, guesses: [...guesses], gameOver, wordLength, maxGuesses };
}

export default { startGame, getLastStartError, addLetter, deleteLetter, submitGuess, getState, getProgress };
