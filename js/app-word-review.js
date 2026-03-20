/**
 * app-word-review.js
 * Review queue and playable-word helpers for Word Quest.
 */

function createWordReviewModule(deps) {
  const {
    storage,
    now = () => Date.now(),
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    getPlayableWords = () => [],
    getEffectiveGameplayGradeBand = (gradeBand) => gradeBand,
    shouldExpandGradeBandForFocus = () => false,
    getTopErrorKey = () => '',
    reviewQueueKey = '',
    reviewQueueMaxItems = 36
  } = deps || {};

  function loadReviewQueueState() {
    const fallback = { round: 0, items: [] };
    try {
      const parsed = JSON.parse(storage?.getItem?.(reviewQueueKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const round = Math.max(0, Math.floor(Number(parsed.round) || 0));
      const items = Array.isArray(parsed.items)
        ? parsed.items
          .map((item) => ({
            word: normalizeReviewWord(item?.word),
            dueRound: Math.max(1, Math.floor(Number(item?.dueRound) || 0)),
            reason: String(item?.reason || 'review').trim().toLowerCase(),
            createdAt: Math.max(0, Number(item?.createdAt) || now())
          }))
          .filter((item) => item.word && item.dueRound > 0)
        : [];
      return { round, items };
    } catch {
      return fallback;
    }
  }

  let reviewQueueState = loadReviewQueueState();

  function saveReviewQueueState() {
    const cleanedItems = reviewQueueState.items
      .map((item) => ({
        word: normalizeReviewWord(item.word),
        dueRound: Math.max(1, Math.floor(Number(item.dueRound) || 1)),
        reason: String(item.reason || 'review').trim().toLowerCase(),
        createdAt: Math.max(0, Number(item.createdAt) || now())
      }))
      .filter((item) => item.word)
      .sort((left, right) => left.dueRound - right.dueRound || left.createdAt - right.createdAt)
      .slice(0, reviewQueueMaxItems);
    reviewQueueState = {
      round: Math.max(0, Math.floor(Number(reviewQueueState.round) || 0)),
      items: cleanedItems
    };
    try {
      storage?.setItem?.(reviewQueueKey, JSON.stringify(reviewQueueState));
    } catch {}
  }

  function buildPlayableWordSet(gradeBand, lengthPref, focusValue) {
    const effectiveGradeBand = getEffectiveGameplayGradeBand(gradeBand, focusValue);
    const pool = getPlayableWords({
      gradeBand: effectiveGradeBand,
      length: lengthPref || 'any',
      phonics: focusValue || 'all',
      includeLowerBands: shouldExpandGradeBandForFocus(focusValue)
    });
    return new Set(pool.map((word) => normalizeReviewWord(word)));
  }

  function countDueReviewWords(playableSet) {
    const due = reviewQueueState.items.filter((item) => item.dueRound <= reviewQueueState.round);
    if (!(playableSet instanceof Set)) return due.length;
    return due.filter((item) => playableSet.has(item.word)).length;
  }

  function peekDueReviewItemForPool(playableSet) {
    if (!(playableSet instanceof Set) || playableSet.size === 0) return null;
    const dueItems = reviewQueueState.items
      .filter((item) => item.dueRound <= reviewQueueState.round && playableSet.has(item.word))
      .sort((left, right) => left.dueRound - right.dueRound || left.createdAt - right.createdAt);
    return dueItems[0] || null;
  }

  function findMatchingDueReview(word) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord) return null;
    return reviewQueueState.items.find((item) => (
      item.word === normalizedWord &&
      item.dueRound <= reviewQueueState.round
    )) || null;
  }

  function consumeReviewItem(item) {
    if (!item?.word) return;
    const idx = reviewQueueState.items.findIndex((entry) => (
      entry.word === item.word &&
      entry.dueRound === item.dueRound &&
      entry.createdAt === item.createdAt
    ));
    if (idx < 0) return;
    reviewQueueState.items.splice(idx, 1);
    saveReviewQueueState();
  }

  function scheduleReviewWord(word, delays, reason) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord || !Array.isArray(delays) || !delays.length) return;
    const createdAt = now();
    delays.forEach((delay, index) => {
      const dueRound = reviewQueueState.round + Math.max(1, Math.floor(Number(delay) || 1));
      const isDuplicate = reviewQueueState.items.some((item) => (
        item.word === normalizedWord &&
        Math.abs(item.dueRound - dueRound) <= 1
      ));
      if (isDuplicate) return;
      reviewQueueState.items.push({
        word: normalizedWord,
        dueRound,
        reason: String(reason || 'review').toLowerCase(),
        createdAt: createdAt + index
      });
    });
    saveReviewQueueState();
  }

  function trackRoundForReview(result, maxGuessesValue, roundMetrics = {}) {
    const solvedWord = normalizeReviewWord(result?.word);
    if (!solvedWord) return;
    reviewQueueState.round += 1;
    const maxGuesses = Math.max(1, Number(maxGuessesValue) || 6);
    const guessesUsed = Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : maxGuesses);
    const hintRequested = !!roundMetrics.hintRequested;
    const durationMs = Math.max(0, Number(roundMetrics.durationMs) || 0);
    const topError = getTopErrorKey(roundMetrics.errorCounts || {});
    const attachReason = (base) => topError ? `${base}:${topError}` : base;
    if (result?.lost) {
      scheduleReviewWord(solvedWord, [1, 3, 7], attachReason('missed'));
      if (topError === 'vowel_pattern') scheduleReviewWord(solvedWord, [2], 'vowel-pattern');
      if (topError === 'morpheme_ending') scheduleReviewWord(solvedWord, [4], 'morpheme-ending');
      return;
    }
    const hardSolveThreshold = Math.max(4, maxGuesses - 1);
    if (guessesUsed >= hardSolveThreshold) {
      scheduleReviewWord(solvedWord, [3, 6], attachReason('hard'));
      return;
    }
    if (hintRequested) {
      scheduleReviewWord(solvedWord, [4], attachReason('hinted'));
    }
    if (topError === 'vowel_pattern') {
      scheduleReviewWord(solvedWord, [2, 5], 'vowel-pattern');
      return;
    }
    if (topError === 'blend_position') {
      scheduleReviewWord(solvedWord, [3], 'blend-position');
      return;
    }
    if (topError === 'morpheme_ending') {
      scheduleReviewWord(solvedWord, [4, 7], 'morpheme-ending');
      return;
    }
    if (durationMs >= 90000) {
      scheduleReviewWord(solvedWord, [5], 'slow-round');
      return;
    }
    saveReviewQueueState();
  }

  function getReviewQueueState() {
    return {
      round: Math.max(0, Math.floor(Number(reviewQueueState.round) || 0)),
      items: reviewQueueState.items.map((item) => ({ ...item }))
    };
  }

  return {
    buildPlayableWordSet,
    consumeReviewItem,
    countDueReviewWords,
    findMatchingDueReview,
    getReviewQueueState,
    loadReviewQueueState,
    peekDueReviewItemForPool,
    saveReviewQueueState,
    scheduleReviewWord,
    trackRoundForReview
  };
}
