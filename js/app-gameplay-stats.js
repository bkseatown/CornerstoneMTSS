/**
 * app-gameplay-stats.js
 * Gameplay streak persistence and round-tracking helpers.
 */

function createGameplayStatsModule(deps) {
  const {
    clock = () => Date.now(),
    emitTelemetry = () => {},
    buildMidgameBoostState = () => ({ order: [], cursor: 0 }),
    getMidgameBoostKey = () => '',
    getMidgameBoostPool = () => [],
    getSkillDescriptorForRound = () => ({ key: 'classic:all', label: 'Classic mixed practice' }),
    normalizeCounterMap = (value) => value,
    normalizeReviewWord = (value) => value,
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

  return {
    beginRound,
    buildRoundMetrics,
    classifyRoundErrorPattern,
    getRoundState,
    incrementStreak,
    incrementVoiceAttempts,
    loadStreak,
    loadMidgameBoostState,
    nextMidgameBoostCard,
    recordRoundError,
    resetRoundTracking,
    saveStreak,
    saveMidgameBoostState,
    setHintRequested,
    setStarterWordsShown,
    setVoiceAttempts
  };
}
