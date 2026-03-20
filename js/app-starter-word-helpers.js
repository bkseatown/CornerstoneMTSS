/**
 * app-starter-word-helpers.js
 * Pure helper utilities for starter word suggestions.
 */

function createStarterWordHelpers() {
  function buildStarterWordConstraint(state, deriveWordState) {
    const wordState = deriveWordState(state);
    const fixedLetters = Array.from({ length: wordState.length }, (_, index) => (
      wordState.correctPositions[index] || ''
    ));
    return {
      length: wordState.length,
      guessCount: wordState.guessCount,
      fixedLetters,
      excludedByPosition: wordState.forbiddenByPosition,
      minCounts: wordState.minCounts,
      maxCounts: wordState.maxCounts,
      absentLetters: wordState.absentLetters,
      guessedLetters: wordState.guessedLetters,
      wordState
    };
  }

  function wordMatchesStarterConstraint(word, constraint, normalizeReviewWord, options = {}) {
    const normalizedWord = normalizeReviewWord(word);
    const length = Math.max(1, Number(constraint?.length || 0));
    if (!normalizedWord || normalizedWord.length !== length) return false;
    const enforceMaxCounts = options.enforceMaxCounts !== false;
    const letterCounts = {};
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] !== letter) return false;
      if (constraint.excludedByPosition[index]?.has(letter)) return false;
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    for (const letter of constraint.absentLetters) {
      if ((letterCounts[letter] || 0) > 0) return false;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) return false;
    }
    if (enforceMaxCounts) {
      for (const [letter, maximum] of Object.entries(constraint.maxCounts || {})) {
        if ((letterCounts[letter] || 0) > maximum) return false;
      }
    }
    return true;
  }

  function scoreStarterWordCandidate(word, constraint, normalizeReviewWord) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord) return 0;
    let score = 0;
    const letterCounts = {};
    for (const ch of normalizedWord) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    const counted = new Set();
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] === letter) score += 4;
      if (!constraint.guessedLetters.has(letter) && !counted.has(letter)) {
        score += 2;
        counted.add(letter);
      }
      if ((constraint.minCounts[letter] || 0) > 0) score += 1;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) score -= 14;
      else score += 6;
    }
    for (const letter of constraint.absentLetters || []) {
      if ((letterCounts[letter] || 0) > 0) score -= 18;
    }
    return score;
  }

  function formatStarterPattern(constraint) {
    if (!constraint || !Array.isArray(constraint.fixedLetters)) return '';
    const token = constraint.fixedLetters.map((letter) => (letter ? letter.toUpperCase() : '_')).join('');
    return token.includes('_') ? token : '';
  }

  return {
    buildStarterWordConstraint,
    formatStarterPattern,
    scoreStarterWordCandidate,
    wordMatchesStarterConstraint
  };
}
