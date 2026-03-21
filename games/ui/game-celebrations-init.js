(function gameCelebrationsInitModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSGameCelebrationsInit = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createGameCelebrationsInit() {
  "use strict";

  /**
   * Initialize celebration wiring for game engines
   * Hooks into engine state changes to trigger celebrations
   */

  function initWithEngine(engine, celebrations, config) {
    if (!engine || !celebrations) return;

    var cfg = config && typeof config === "object" ? config : {};
    var supportedGames = Array.isArray(cfg.supportedGames) ? cfg.supportedGames : ["typing-quest"];

    var previousState = null;
    var lastRoundId = "";
    var lastOutcomeId = "";
    var unsubscribe = null;

    /**
     * Subscribe to engine state changes
     */
    if (typeof engine.subscribe === "function") {
      unsubscribe = engine.subscribe(function (state) {
        if (!state) return;

        // Only handle supported games
        if (supportedGames.indexOf(state.selectedGameId) === -1) {
          return;
        }

        // Detect new round - reset celebrations
        if (state.round && state.round.id !== lastRoundId) {
          lastRoundId = state.round.id || "";
          lastOutcomeId = "";
          celebrations.reset();
        }

        // Handle answer submissions (both correct and incorrect)
        if (state.lastOutcome) {
          var outcomeKey = getOutcomeId(state);
          if (outcomeKey && outcomeKey !== lastOutcomeId) {
            lastOutcomeId = outcomeKey;

            if (state.lastOutcome.correct) {
              // Correct answer
              var points = state.lastPoints || 0;
              var streak = state.streak || 0;
              var totalCorrect = (state.metrics && state.metrics.correct || 0);
              var totalAnswered = (state.metrics && (state.metrics.correct + state.metrics.incorrect + state.metrics.nearMiss) || 0);

              celebrations.onAnswerCorrect(points, streak, totalCorrect, totalAnswered, null);
            } else {
              // Incorrect answer
              celebrations.onAnswerIncorrect();
            }
          }
        }

        // Handle session complete - show mastery badges
        if (state.status === "round-summary" && previousState && previousState.status !== "round-summary") {
          var sessionData = {
            accuracy: calculateAccuracy(state),
            maxStreak: getMaxStreak(state),
            durationSeconds: getDurationSeconds(state),
            previousAccuracy: 0
          };

          var badges = celebrations.calculateMasteryBadges(sessionData);
          celebrations.renderMasteryBadges(badges);
        }

        previousState = state;
      });
    }

    // Return cleanup function to prevent memory leaks
    return {
      unsubscribe: function () {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      }
    };
  }

  /**
   * Extract outcome identifier from state
   */
  function getOutcomeId(state) {
    if (!state.lastOutcome) return null;
    return [
      String(state.roundIndex || 0),
      String(state.lastOutcome.correct ? "correct" : "incorrect"),
      String(state.score || 0)
    ].join(":");
  }

  /**
   * Calculate accuracy from state
   */
  function calculateAccuracy(state) {
    var metrics = state && state.metrics || {};
    var correct = Number(metrics.correct || 0);
    var total = correct + Number(metrics.incorrect || 0) + Number(metrics.nearMiss || 0);
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Get max streak from history
   */
  function getMaxStreak(state) {
    var history = Array.isArray(state && state.history) ? state.history : [];
    return history.reduce(function (max, r) {
      return Math.max(max, Number(r.streak || 0));
    }, 0);
  }

  /**
   * Calculate duration in seconds
   */
  function getDurationSeconds(state) {
    // This would need to track elapsed time - for now return 0
    return 0;
  }

  return {
    initWithEngine: initWithEngine
  };
});
