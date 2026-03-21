/**
 * app-gameplay-stats.js
 * Gameplay streak persistence and round-tracking helpers.
 */

function createGameplayStatsModule(deps) {
  const {
    buildCurriculumSelectionLabel = () => '',
    buildCurrentCurriculumSnapshot = () => ({}),
    clock = () => Date.now(),
    emitTelemetry = () => {},
    buildMidgameBoostState = () => ({ order: [], cursor: 0 }),
    formatGradeBandLabel = () => '',
    getActiveStudentLabel = () => '',
    getErrorPatternLabels = () => ({}),
    getErrorNextStepCopy = () => ({}),
    getFocusLabel = () => '',
    getFocusValue = () => 'all',
    getMidgameBoostKey = () => '',
    getMidgameBoostPool = () => [],
    getPlayableWords = () => [],
    getRoundLocals = () => ({
      activeRoundStartedAt: 0,
      currentRoundHintRequested: false,
      currentRoundStarterWordsShown: false,
      currentRoundVoiceAttempts: 0,
      currentRoundErrorCounts: Object.create(null),
      currentRoundSkillKey: 'classic:all',
      currentRoundSkillLabel: 'Classic mixed practice'
    }),
    normalizeCounterMap = (value) => value,
    normalizeReviewWord = (value) => value,
    parseFocusPreset = () => ({ kind: 'classic', focus: 'all' }),
    reviewQueueKey = '',
    reviewQueueMaxItems = 36,
    shouldExpandGradeBandForFocus = () => false,
    setRoundLocals = () => {},
    storage,
    streakKey
  } = deps || {};

  const roundState = {
    activeRoundStartedAt: 0,
    currentRoundHintRequested: false,
    currentRoundStarterWordsShown: false,
    currentRoundVoiceAttempts: 0,
    currentRoundErrorCounts: Object.create(null),
    currentRoundSkillKey: 'classic:all',
    currentRoundSkillLabel: 'Classic mixed practice'
  };
  let reviewQueueState = loadReviewQueueState();

  function normalizeCounterMapLocal(raw) {
    const map = Object.create(null);
    if (!raw || typeof raw !== 'object') return map;
    Object.entries(raw).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const count = Math.max(0, Math.floor(Number(value) || 0));
      if (!count) return;
      map[normalizedKey] = count;
    });
    return map;
  }

  function mergeCounterMaps(target, additions) {
    const base = target && typeof target === 'object' ? target : Object.create(null);
    if (!additions || typeof additions !== 'object') return base;
    Object.entries(additions).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const next = Math.max(0, Math.floor(Number(value) || 0));
      if (!next) return;
      base[normalizedKey] = (base[normalizedKey] || 0) + next;
    });
    return base;
  }

  function getTopErrorKey(errorCounts) {
    const entries = Object.entries(errorCounts || {});
    if (!entries.length) return '';
    entries.sort((left, right) => right[1] - left[1]);
    return entries[0]?.[0] || '';
  }

  function getTopErrorLabel(errorCounts) {
    const errorPatternLabels = getErrorPatternLabels() || {};
    const key = getTopErrorKey(errorCounts);
    if (!key) return '--';
    return errorPatternLabels[key] || key.replace(/_/g, ' ');
  }

  function getInstructionalNextStep(errorCounts) {
    const errorNextStepCopy = getErrorNextStepCopy() || {};
    const key = getTopErrorKey(errorCounts);
    if (!key) return 'Continue current lesson target.';
    return errorNextStepCopy[key] || 'Review recent errors and provide a targeted reteach.';
  }

  function getInstructionalNextStepChip(errorCounts) {
    const key = getTopErrorKey(errorCounts);
    switch (key) {
      case 'vowel_pattern': return 'Vowel Pattern Reteach';
      case 'blend_position': return 'Blend Position Reteach';
      case 'morpheme_ending': return 'Morpheme Ending Reteach';
      case 'context_strategy': return 'Clue Strategy Reteach';
      default: return 'Stay Current Target';
    }
  }

  function resolveMiniLessonErrorKey(rawKey, fallbackCounts = null, validPlans = {}) {
    const normalized = String(rawKey || '').trim().toLowerCase();
    if (normalized === 'top' || normalized === 'auto') {
      const top = getTopErrorKey(fallbackCounts || {});
      return top || 'context_strategy';
    }
    if (validPlans[normalized]) return normalized;
    return 'context_strategy';
  }

  function buildMiniLessonPlanText(errorKey, options = {}) {
    const errorPatternLabels = getErrorPatternLabels() || {};
    const resolved = resolveMiniLessonErrorKey(errorKey, options.errorCounts, options.validPlans || {});
    const steps = (options.validPlans && options.validPlans[resolved]) || [];
    const label = errorPatternLabels[resolved] || resolved.replace(/_/g, ' ');
    const snapshot = buildCurrentCurriculumSnapshot();
    const lessonTargetLabel = snapshot.targetLabel || snapshot.packLabel || buildCurriculumSelectionLabel();
    const student = options.student || getActiveStudentLabel();
    return [
      `WordQuest Quick Mini-Lesson · ${label}`,
      `Student: ${student}`,
      `Current target: ${lessonTargetLabel}`,
      'Duration: 5 minutes',
      '',
      ...steps,
      '',
      'Materials: whiteboard or paper, 4-6 word cards, quick verbal feedback.'
    ].join('\n');
  }

  function getSkillDescriptorForRound(result) {
    const focusValue = getFocusValue();
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') {
      return {
        key: `subject:${preset.subject}:${preset.gradeBand || 'all'}`,
        label: `${preset.subject.toUpperCase()} vocab (${formatGradeBandLabel(preset.gradeBand)})`
      };
    }
    if (preset.kind === 'phonics' && preset.focus && preset.focus !== 'all') {
      const label = getFocusLabel(preset.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
      return {
        key: `phonics:${preset.focus}`,
        label: label || 'Phonics focus'
      };
    }
    const phonics = String(result?.entry?.phonics || '').trim();
    if (phonics && phonics.toLowerCase() !== 'all') {
      return {
        key: `phonics-tag:${phonics.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: phonics
      };
    }
    return { key: 'classic:all', label: 'Classic mixed practice' };
  }

  function formatDurationLabel(durationMs) {
    const ms = Math.max(0, Number(durationMs) || 0);
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${String(rem).padStart(2, '0')}s`;
  }

  function loadStreak() {
    try {
      return parseInt(storage?.getItem?.(streakKey) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveStreak(value) {
    try {
      storage?.setItem?.(streakKey, String(Math.max(0, Number(value) || 0)));
    } catch {}
  }

  function incrementStreak() {
    const next = loadStreak() + 1;
    saveStreak(next);
    return next;
  }

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
            createdAt: Math.max(0, Number(item?.createdAt) || clock())
          }))
          .filter((item) => item.word && item.dueRound > 0)
        : [];
      return { round, items };
    } catch {
      return fallback;
    }
  }

  function saveReviewQueueState() {
    const cleanedItems = reviewQueueState.items
      .map((item) => ({
        word: normalizeReviewWord(item.word),
        dueRound: Math.max(1, Math.floor(Number(item.dueRound) || 1)),
        reason: String(item.reason || 'review').trim().toLowerCase(),
        createdAt: Math.max(0, Number(item.createdAt) || clock())
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
    const createdAt = clock();
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

  function loadMidgameBoostState() {
    const midgameBoostKey = String(getMidgameBoostKey() || '');
    const midgameBoostPool = Array.isArray(getMidgameBoostPool()) ? getMidgameBoostPool() : [];
    try {
      const parsed = JSON.parse(storage?.getItem?.(midgameBoostKey) || 'null');
      if (!parsed || !Array.isArray(parsed.order) || !Number.isInteger(parsed.cursor)) {
        return buildMidgameBoostState();
      }
      const validOrder = parsed.order.every(
        (value) => Number.isInteger(value) && value >= 0 && value < midgameBoostPool.length
      );
      if (!validOrder || parsed.order.length !== midgameBoostPool.length) {
        return buildMidgameBoostState();
      }
      return parsed;
    } catch {
      return buildMidgameBoostState();
    }
  }

  function saveMidgameBoostState(state) {
    const midgameBoostKey = String(getMidgameBoostKey() || '');
    try {
      storage?.setItem?.(midgameBoostKey, JSON.stringify(state));
    } catch {}
  }

  function nextMidgameBoostCard() {
    const midgameBoostPool = Array.isArray(getMidgameBoostPool()) ? getMidgameBoostPool() : [];
    let state = loadMidgameBoostState();
    if (state.cursor >= state.order.length) {
      state = buildMidgameBoostState();
    }
    const idx = state.order[state.cursor];
    state.cursor += 1;
    saveMidgameBoostState(state);
    return midgameBoostPool[idx] || null;
  }

  function beginRound(nextResult) {
    if (!nextResult?.word) return resetRoundTracking();
    roundState.activeRoundStartedAt = clock();
    roundState.currentRoundHintRequested = false;
    roundState.currentRoundStarterWordsShown = false;
    roundState.currentRoundVoiceAttempts = 0;
    roundState.currentRoundErrorCounts = Object.create(null);
    const skill = getSkillDescriptorForRound(nextResult);
    roundState.currentRoundSkillKey = skill.key;
    roundState.currentRoundSkillLabel = skill.label;
    emitTelemetry('wq_round_start', {
      word_id: normalizeReviewWord(nextResult.word),
      word_length: Number(nextResult.wordLength) || String(nextResult.word || '').length || null,
      skill_key: roundState.currentRoundSkillKey,
      skill_label: roundState.currentRoundSkillLabel,
      source: 'new_game'
    });
  }

  function resetRoundTracking() {
    roundState.activeRoundStartedAt = 0;
    roundState.currentRoundHintRequested = false;
    roundState.currentRoundStarterWordsShown = false;
    roundState.currentRoundVoiceAttempts = 0;
    roundState.currentRoundErrorCounts = Object.create(null);
    roundState.currentRoundSkillKey = 'classic:all';
    roundState.currentRoundSkillLabel = 'Classic mixed practice';
  }

  function setHintRequested(value) {
    roundState.currentRoundHintRequested = !!value;
  }

  function setStarterWordsShown(value) {
    roundState.currentRoundStarterWordsShown = !!value;
  }

  function setVoiceAttempts(value) {
    roundState.currentRoundVoiceAttempts = Math.max(0, Number(value) || 0);
  }

  function incrementVoiceAttempts() {
    roundState.currentRoundVoiceAttempts += 1;
    return roundState.currentRoundVoiceAttempts;
  }

  function classifyRoundErrorPattern(result) {
    const guess = String(result?.guess || '').toLowerCase();
    const word = String(result?.word || '').toLowerCase();
    const statuses = Array.isArray(result?.result) ? result.result : [];
    if (!guess || !word || !statuses.length) return '';
    const correctCount = statuses.filter((state) => state === 'correct').length;
    const presentCount = statuses.filter((state) => state === 'present').length;
    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
    const targetVowels = Array.from(new Set(word.split('').filter((ch) => vowels.has(ch))));
    const guessedVowels = new Set(guess.split('').filter((ch) => vowels.has(ch)));
    const vowelOverlap = targetVowels.filter((ch) => guessedVowels.has(ch)).length;
    const phonicsTag = String(result?.entry?.phonics || '').toLowerCase();

    if (targetVowels.length >= 2 && vowelOverlap === 0) return 'vowel_pattern';
    if (presentCount >= 2 && correctCount <= 1) return 'blend_position';
    if ((/suffix|prefix|multisyll|welded/.test(phonicsTag) || word.length >= 6) && guess.slice(-2) !== word.slice(-2)) {
      return 'morpheme_ending';
    }
    return 'context_strategy';
  }

  function recordRoundError(category) {
    const normalized = String(category || '').trim().toLowerCase();
    if (!normalized) return 0;
    roundState.currentRoundErrorCounts[normalized] = (roundState.currentRoundErrorCounts[normalized] || 0) + 1;
    return roundState.currentRoundErrorCounts[normalized];
  }

  function buildRoundMetrics(result, maxGuessesValue) {
    const guessed = Math.max(
      1,
      Array.isArray(result?.guesses) ? result.guesses.length : Math.max(1, Number(maxGuessesValue) || 6)
    );
    const durationMs = roundState.activeRoundStartedAt > 0 ? Math.max(0, clock() - roundState.activeRoundStartedAt) : 0;
    const fallbackSkill = getSkillDescriptorForRound(result);
    return {
      guessesUsed: guessed,
      durationMs,
      hintRequested: !!roundState.currentRoundHintRequested,
      voiceAttempts: Math.max(0, Number(roundState.currentRoundVoiceAttempts) || 0),
      skillKey: roundState.currentRoundSkillKey || fallbackSkill.key,
      skillLabel: roundState.currentRoundSkillLabel || fallbackSkill.label,
      errorCounts: normalizeCounterMap(roundState.currentRoundErrorCounts)
    };
  }

  function getRoundState() {
    return {
      ...roundState,
      currentRoundErrorCounts: normalizeCounterMap(roundState.currentRoundErrorCounts)
    };
  }

  function syncRoundTrackingLocals() {
    const live = getRoundState();
    setRoundLocals({
      activeRoundStartedAt: Number(live.activeRoundStartedAt) || 0,
      currentRoundHintRequested: !!live.currentRoundHintRequested,
      currentRoundStarterWordsShown: !!live.currentRoundStarterWordsShown,
      currentRoundVoiceAttempts: Math.max(0, Number(live.currentRoundVoiceAttempts) || 0),
      currentRoundErrorCounts: normalizeCounterMap(live.currentRoundErrorCounts) || Object.create(null),
      currentRoundSkillKey: String(live.currentRoundSkillKey || 'classic:all'),
      currentRoundSkillLabel: String(live.currentRoundSkillLabel || 'Classic mixed practice')
    });
  }

  function resetRoundTrackingAndSync(nextResult = null) {
    if (nextResult?.word) beginRound(nextResult);
    else resetRoundTracking();
    syncRoundTrackingLocals();
  }

  function buildRoundMetricsAndSync(result, maxGuessesValue) {
    const metrics = buildRoundMetrics(result, maxGuessesValue);
    syncRoundTrackingLocals();
    if (metrics) return metrics;
    const locals = getRoundLocals();
    return {
      guessesUsed: Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : Math.max(1, Number(maxGuessesValue) || 6)),
      durationMs: 0,
      hintRequested: !!locals.currentRoundHintRequested,
      voiceAttempts: Math.max(0, Number(locals.currentRoundVoiceAttempts) || 0),
      skillKey: String(locals.currentRoundSkillKey || 'classic:all'),
      skillLabel: String(locals.currentRoundSkillLabel || 'Classic mixed practice'),
      errorCounts: normalizeCounterMap(locals.currentRoundErrorCounts) || Object.create(null)
    };
  }

  function maybeShowErrorCoach(result) {
    if (!result || result.won || result.lost) return;
    if (!Array.isArray(result.guesses) || result.guesses.length < 2) return;
    const category = classifyRoundErrorPattern(result);
    if (!category) return;
    recordRoundError(category);
    syncRoundTrackingLocals();
  }

  return {
    beginRound,
    buildPlayableWordSet,
    buildMiniLessonPlanText,
    buildRoundMetrics,
    buildRoundMetricsAndSync,
    classifyRoundErrorPattern,
    formatDurationLabel,
    getInstructionalNextStep,
    getInstructionalNextStepChip,
    getRoundState,
    getReviewQueueState,
    getSkillDescriptorForRound,
    getTopErrorKey,
    getTopErrorLabel,
    incrementStreak,
    incrementVoiceAttempts,
    loadReviewQueueState,
    loadStreak,
    loadMidgameBoostState,
    nextMidgameBoostCard,
    peekDueReviewItemForPool,
    maybeShowErrorCoach,
    mergeCounterMaps,
    normalizeCounterMap: normalizeCounterMapLocal,
    recordRoundError,
    resetRoundTracking,
    resetRoundTrackingAndSync,
    resolveMiniLessonErrorKey,
    saveReviewQueueState,
    saveStreak,
    saveMidgameBoostState,
    scheduleReviewWord,
    setHintRequested,
    setStarterWordsShown,
    setVoiceAttempts,
    syncRoundTrackingLocals,
    countDueReviewWords,
    consumeReviewItem,
    findMatchingDueReview,
    trackRoundForReview
  };
}
