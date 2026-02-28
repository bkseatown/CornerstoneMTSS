/* js/wq-diagnostics.js */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CSWQDiagnostics = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);
  var COMMON_AFFIXES = [
    "ING", "ED", "ER", "EST", "LY", "TION", "SION", "MENT", "NESS", "FUL", "LESS", "ABLE", "IBLE", "OUS", "IVE", "AL", "IC", "IST", "ISM", "PRE", "RE", "UN", "DIS", "MIS", "NON", "OVER", "UNDER", "SUB", "TRANS", "INTER", "SUPER"
  ];

  function upper(s) { return (s || "").toString().toUpperCase(); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function guessHasAffixGuess(guess) {
    var g = upper(guess);
    for (var i = 0; i < COMMON_AFFIXES.length; i += 1) {
      if (g.indexOf(COMMON_AFFIXES[i]) >= 0) return COMMON_AFFIXES[i];
    }
    return null;
  }

  function buildConstraintsFromFeedback(history) {
    var mustPos = {};
    var notPos = {};
    var avoid = new Set();
    var include = new Set();

    function ensureNotPos(pos) {
      if (!notPos[pos]) notPos[pos] = new Set();
      return notPos[pos];
    }

    for (var hIndex = 0; hIndex < history.length; hIndex += 1) {
      var h = history[hIndex] || {};
      var g = upper(h.guess);
      var fb = Array.isArray(h.feedback) ? h.feedback : [];
      var len = Math.min(g.length, fb.length);
      for (var i = 0; i < len; i += 1) {
        var ch = g[i];
        var s = fb[i];
        if (s === "green") {
          mustPos[i] = ch;
          include.add(ch);
        } else if (s === "yellow") {
          ensureNotPos(i).add(ch);
          include.add(ch);
        } else if (s === "gray") {
          if (!include.has(ch)) avoid.add(ch);
        }
      }
    }

    return { mustPos: mustPos, notPos: notPos, avoid: avoid, include: include };
  }

  function evaluateConstraintRespect(guess, constraints) {
    var g = upper(guess);
    var violations = 0;
    var checks = 0;
    var k;

    for (k in constraints.mustPos) {
      if (!Object.prototype.hasOwnProperty.call(constraints.mustPos, k)) continue;
      var pos = parseInt(k, 10);
      checks += 1;
      if (g[pos] !== constraints.mustPos[pos]) violations += 1;
    }

    for (var i = 0; i < g.length; i += 1) {
      var ch = g[i];
      if (constraints.avoid.has(ch)) {
        checks += 1;
        violations += 1;
      }
    }

    for (k in constraints.notPos) {
      if (!Object.prototype.hasOwnProperty.call(constraints.notPos, k)) continue;
      var nPos = parseInt(k, 10);
      var banned = constraints.notPos[nPos];
      var guessCh = g[nPos];
      if (banned && banned.has(guessCh)) {
        checks += 1;
        violations += 1;
      }
    }

    var respect = checks === 0 ? 1 : 1 - (violations / checks);
    return clamp(respect, 0, 1);
  }

  function computeSignals(session) {
    var startedAt = Number(session && session.startedAtMs) || Date.now();
    var endedAt = Number(session && session.endedAtMs) || Date.now();
    var durSec = Math.max(1, Math.round((endedAt - startedAt) / 1000));
    var history = Array.isArray(session && session.history) ? session.history.slice() : [];
    var guesses = history.length;

    var guessesPerMin = guesses / (durSec / 60);
    var solved = !!(session && session.solved);
    var timeToFirstGuessSec = guesses ? Math.round(((history[0].tMs || startedAt) - startedAt) / 1000) : durSec;

    var vowelLettersTried = new Set();
    var vowelPlacements = 0;
    var totalLetters = 0;
    for (var hIndex = 0; hIndex < history.length; hIndex += 1) {
      var h = history[hIndex] || {};
      var g = upper(h.guess);
      totalLetters += g.length;
      for (var i = 0; i < g.length; i += 1) {
        var ch = g[i];
        if (VOWELS.has(ch)) {
          vowelLettersTried.add(ch);
          vowelPlacements += 1;
        }
      }
    }

    var uniqueVowels = vowelLettersTried.size;
    var vowelRatio = totalLetters ? (vowelPlacements / totalLetters) : 0;

    var respectSum = 0;
    var respectN = 0;
    for (var idx = 1; idx < history.length; idx += 1) {
      var prevHist = history.slice(0, idx);
      var constraints = buildConstraintsFromFeedback(prevHist);
      var respect = evaluateConstraintRespect(history[idx].guess, constraints);
      respectSum += respect;
      respectN += 1;
    }
    var updateRespect = respectN ? (respectSum / respectN) : 1;

    var uniqLetters = new Set();
    var repeatedRejectedLetters = 0;
    var rejected = new Set();
    var included = new Set();

    for (var hi = 0; hi < history.length; hi += 1) {
      var row = history[hi] || {};
      var rowGuess = upper(row.guess);
      var fb = Array.isArray(row.feedback) ? row.feedback : [];
      for (var ri = 0; ri < rowGuess.length; ri += 1) {
        var rowCh = rowGuess[ri];
        uniqLetters.add(rowCh);
        if (fb[ri] === "green" || fb[ri] === "yellow") included.add(rowCh);
      }
      for (var rj = 0; rj < rowGuess.length; rj += 1) {
        var rowCh2 = rowGuess[rj];
        if (fb[rj] === "gray" && !included.has(rowCh2)) rejected.add(rowCh2);
      }
      for (var rk = 0; rk < rowGuess.length; rk += 1) {
        if (rejected.has(rowGuess[rk])) repeatedRejectedLetters += 1;
      }
    }

    var uniqLetterCount = uniqLetters.size;
    var repetitionPenalty = totalLetters ? (repeatedRejectedLetters / totalLetters) : 0;

    var affixAttempts = 0;
    var affixTypes = new Set();
    for (var aj = 0; aj < history.length; aj += 1) {
      var ax = guessHasAffixGuess(history[aj].guess);
      if (ax) {
        affixAttempts += 1;
        affixTypes.add(ax);
      }
    }

    var nextStep = "Next step: Run Sentence Surgery focusing on because/although to strengthen reasoning + sentence control.";
    var focusTag = "writing_reasoning";

    if (updateRespect < 0.55) {
      nextStep = "Next step: Teach feedback-use strategy (greens stay, yellows move, grays avoid). Do 2 coached rounds with think-aloud.";
      focusTag = "strategy_feedback_use";
    } else if (uniqueVowels <= 2 && guesses >= 3) {
      nextStep = "Next step: Target vowel patterns. Do a 3-minute vowel-swap mini-set (short/long, vowel teams) before next round.";
      focusTag = "decoding_vowels";
    } else if (repetitionPenalty > 0.18) {
      nextStep = "Next step: Improve letter elimination and working memory. Use a 'banned letters' tracker + one deliberate elimination guess.";
      focusTag = "executive_functioning_working_memory";
    } else if (affixAttempts === 0 && guesses >= 4) {
      nextStep = "Next step: Add morphology. Practice spotting common suffixes/prefixes (re-, un-, -tion, -ing) for smarter hypotheses.";
      focusTag = "morphology_awareness";
    }

    return {
      kind: "wq_signals_v1",
      durSec: durSec,
      solved: solved,
      guesses: guesses,
      guessesPerMin: +guessesPerMin.toFixed(2),
      timeToFirstGuessSec: timeToFirstGuessSec,
      uniqueVowels: uniqueVowels,
      vowelRatio: +vowelRatio.toFixed(3),
      updateRespect: +updateRespect.toFixed(3),
      uniqLetterCount: uniqLetterCount,
      repetitionPenalty: +repetitionPenalty.toFixed(3),
      affixAttempts: affixAttempts,
      affixTypes: Array.from(affixTypes).slice(0, 6),
      nextStep: nextStep,
      focusTag: focusTag
    };
  }

  function createSession(wordLength) {
    var now = Date.now();
    return {
      startedAtMs: now,
      endedAtMs: null,
      wordLength: wordLength || 5,
      solved: false,
      history: []
    };
  }

  function addGuess(session, guess, feedback) {
    if (!session) return;
    session.history.push({
      guess: upper(guess),
      feedback: Array.isArray(feedback) ? feedback.slice() : [],
      tMs: Date.now()
    });
  }

  function endSession(session, solved) {
    if (!session) return null;
    session.endedAtMs = Date.now();
    session.solved = !!solved;
    return computeSignals(session);
  }

  return {
    createSession: createSession,
    addGuess: addGuess,
    endSession: endSession,
    computeSignals: computeSignals
  };
});
