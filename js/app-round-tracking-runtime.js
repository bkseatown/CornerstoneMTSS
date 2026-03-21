/**
 * app-round-tracking-runtime.js
 * Round tracking helpers that keep gameplay stats synced with main runtime locals.
 */

function createRoundTrackingRuntimeModule(deps) {
  const {
    gameplayStats = null,
    normalizeCounterMap = (value) => value,
    getRoundLocals = () => ({
      activeRoundStartedAt: 0,
      currentRoundHintRequested: false,
      currentRoundStarterWordsShown: false,
      currentRoundVoiceAttempts: 0,
      currentRoundErrorCounts: Object.create(null),
      currentRoundSkillKey: 'classic:all',
      currentRoundSkillLabel: 'Classic mixed practice'
    }),
    setRoundLocals = () => {}
  } = deps || {};

  function syncRoundTrackingLocals() {
    const roundState = gameplayStats?.getRoundState?.();
    if (!roundState) return;
    setRoundLocals({
      activeRoundStartedAt: Number(roundState.activeRoundStartedAt) || 0,
      currentRoundHintRequested: !!roundState.currentRoundHintRequested,
      currentRoundStarterWordsShown: !!roundState.currentRoundStarterWordsShown,
      currentRoundVoiceAttempts: Math.max(0, Number(roundState.currentRoundVoiceAttempts) || 0),
      currentRoundErrorCounts: normalizeCounterMap(roundState.currentRoundErrorCounts) || Object.create(null),
      currentRoundSkillKey: String(roundState.currentRoundSkillKey || 'classic:all'),
      currentRoundSkillLabel: String(roundState.currentRoundSkillLabel || 'Classic mixed practice')
    });
  }

  function resetRoundTracking(nextResult = null) {
    if (nextResult?.word) gameplayStats?.beginRound?.(nextResult);
    else gameplayStats?.resetRoundTracking?.();
    syncRoundTrackingLocals();
  }

  function buildRoundMetrics(result, maxGuessesValue) {
    const metrics = gameplayStats?.buildRoundMetrics?.(result, maxGuessesValue);
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

  function classifyRoundErrorPattern(result) {
    return gameplayStats?.classifyRoundErrorPattern?.(result) || '';
  }

  function maybeShowErrorCoach(result) {
    if (!result || result.won || result.lost) return;
    if (!Array.isArray(result.guesses) || result.guesses.length < 2) return;
    const category = classifyRoundErrorPattern(result);
    if (!category) return;
    gameplayStats?.recordRoundError?.(category);
    syncRoundTrackingLocals();
  }

  return Object.freeze({
    buildRoundMetrics,
    classifyRoundErrorPattern,
    maybeShowErrorCoach,
    resetRoundTracking,
    syncRoundTrackingLocals
  });
}

window.createRoundTrackingRuntimeModule = createRoundTrackingRuntimeModule;
