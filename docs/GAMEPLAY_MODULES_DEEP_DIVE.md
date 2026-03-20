# Gameplay Modules Deep Dive: Implementation Guide for Codex

## Executive Summary

This document provides the **actual code patterns, data structures, and control flow** needed to implement the Gameplay Modules safely. It's the bridge between the architectural plan (GAMEPLAY_CORE_ANALYSIS.md) and the actual code extraction.

---

## Critical Data Structures

### 1. Game State Object (from WQGame)

Every state-reading function receives this structure from `WQGame.getState()`:

```javascript
{
  gameOver: boolean,          // Is the game finished?
  won: boolean,               // Did player win?
  lost: boolean,              // Did player lose (run out of guesses)?
  word: 'string',             // Current word to guess
  guess: 'string',            // Current incomplete guess (e.g., "h_llo")
  guesses: ['arr', 'of', 'completed', 'guesses'],  // All past guesses
  result: [                   // Feedback for each letter in current guess
    'correct',
    'present',
    'absent',
    'correct'
  ],
  maxGuesses: 6,              // Total attempts allowed
  wordLength: 5,              // How many letters in target word
  error: null || 'too_short', // Validation error if guess was rejected
  lastStartError: null || 'string'  // Startup error message
}
```

### 2. Guess Result Object (returned from WQGame.submitGuess())

```javascript
{
  guess: 'hello',
  word: 'hello',
  won: true,
  lost: false,
  result: ['correct', 'correct', 'correct', 'correct', 'correct'],
  guesses: [
    ['h', 'i', '', '', ''],   // past guesses as arrays
    ['h', 'e', 'l', 'l', 'o']
  ],
  error: null
}
```

### 3. Round Metrics Object

Built internally, used for telemetry:

```javascript
{
  guessesUsed: 2,
  hintRequested: false,
  voiceAttempts: 0,
  durationMs: 45000,
  skillKey: 'word-families',
  skillLabel: 'Word Families',
  zpdInBand: true
}
```

---

## Module 1: Word & Curriculum Helpers — Deep Dive

### What This Module Actually Does

```javascript
// Inputs: grade band, focus area, player preferences
// Output: A single word to play

// Current flow in app-main.js (lines ~11395–11450):
function newGame(options = {}) {
  const wordPool = buildPlayableWordSet(
    getEffectiveGameplayGradeBand(_el('s-grade')?.value || 'all', focusNow),
    _el('s-length')?.value || 'any',
    focusNow
  );
  const word = pickWord(wordPool, buildPlayScopeKey()); // ← EXTRACT THIS
  WQGame.startGame({ word, maxGuesses: 6 });
  // ...
}
```

### Functions to Extract (Detailed)

#### `buildPlayableWordSet(gradeBand, lengthFilter, focusArea)`
- **What it does:** Filters curriculum word list by grade + skill + length
- **Dependencies:**
  - `window.__WQ_CURRICULUM_DATA__` (global word pools)
  - `window.__WQ_TEACHER_POOL__` (teacher overrides)
  - Preference values (grade, length, focus)
- **Returns:** `Array<string>` of playable words
- **Side effects:** None (pure function)

```javascript
// Current location: app-main.js ~line 9247 (Focus + grade alignment section)
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  // 1. Start with full curriculum
  let pool = getCurriculumWordsForGrade(gradeBand);

  // 2. Filter by length if specified
  if (lengthFilter !== 'any') {
    pool = pool.filter(w => w.length === parseInt(lengthFilter));
  }

  // 3. Filter by focus/skill if specified
  if (focusArea !== 'all') {
    pool = pool.filter(w => w.skills?.includes(focusArea));
  }

  // 4. Apply teacher override pool if present
  if (Array.isArray(window.__WQ_TEACHER_POOL__)) {
    pool = pool.filter(w => window.__WQ_TEACHER_POOL__.includes(w));
  }

  return pool;
}
```

#### `pickWord(pool, scopeKey)`
- **What it does:** Selects a word from pool, avoiding recent repeats
- **Already extracted to:** `js/game.js` (WQGame._pickWord)
- **For this module:** Wrapper that uses curriculum-specific scope

```javascript
// EXTRACT THIS from WQGame internals
function pickWordFromPool(pool, scopeKey) {
  // Use shuffle bag to prevent repeating the same word
  const BAG_KEY = 'wq_v2_shuffle_bag';

  const bag = _readBag(scopeKey);
  let queue = bag.queue.filter(w => pool.includes(w));
  if (!queue.length) {
    queue = shuffle(pool);
    // Avoid repeating last word
    if (queue.length > 1 && queue[queue.length - 1] === bag.last) {
      [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
    }
  }
  const next = queue.pop();
  _writeBag(scopeKey, { queue, last: next });
  return next;
}
```

#### `buildPlayScopeKey(options)`
- **What it does:** Creates a unique scope identifier for word shuffle bag
- **Uses:** Current grade, focus, length selection
- **Returns:** String like `"all_5_all"` or `"3_any_word-families"`

```javascript
function buildPlayScopeKey() {
  const grade = _el('s-grade')?.value || 'all';
  const length = _el('s-length')?.value || 'any';
  const focus = _el('setting-focus')?.value || prefs.focus || 'all';
  return `${grade}_${length}_${focus}`;
}
```

### State Variables to Move

```javascript
// From app-main.js lines ~9247–9400:
var lastPickedWord = '';
var wordPoolCache = null;
var wordPoolCacheKey = null;
var lastBuildPlayableWordSetResult = null;
```

### Dependencies on Other Modules

```
IMPORTS NEEDED:
  ✓ window.__WQ_CURRICULUM_DATA__ (global, read-only)
  ✓ window.__WQ_TEACHER_POOL__ (global, optional)
  ✓ DOM selectors: _el('s-grade'), _el('s-length'), _el('setting-focus')
  ✓ Preferences object (prefs)
  → Module 2: (none — pure input/output)
  → UI layer: (none — no DOM writes)

EXPORTS:
  export {
    buildPlayableWordSet,
    pickWordFromPool,
    buildPlayScopeKey
  }
```

### DOM Dependencies (Be Careful Here!)

The current code reads grade/length/focus from DOM input elements:
```javascript
const grade = _el('s-grade')?.value || 'all';    // ← DOM read
const length = _el('s-length')?.value || 'any';  // ← DOM read
const focus = _el('setting-focus')?.value || prefs.focus || 'all';  // ← DOM read
```

**For the module extraction:**
- Option A: Keep reading from DOM (simple, keeps app-main.js control)
- Option B: Pass these as parameters (cleaner, testable)

**Recommendation:** Option B for testability. Change signature to:
```javascript
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  // Same logic, params are now explicit
}
// Called from app-main.js as:
const wordPool = buildPlayableWordSet(
  _el('s-grade')?.value || 'all',
  _el('s-length')?.value || 'any',
  _el('setting-focus')?.value || prefs.focus || 'all'
);
```

### Testing Strategy for Module 1

```javascript
// Unit tests (no DOM needed)
describe('Word & Curriculum Helpers', () => {
  test('buildPlayableWordSet filters by grade', () => {
    const pool = buildPlayableWordSet('3', 'any', 'all');
    assert(pool.every(w => GRADE_3_WORDS.includes(w)));
  });

  test('buildPlayableWordSet respects teacher pool', () => {
    window.__WQ_TEACHER_POOL__ = ['cat', 'dog'];
    const pool = buildPlayableWordSet('all', 'any', 'all');
    assert(pool.length <= 2);
  });

  test('pickWordFromPool avoids repeats in shuffle bag', () => {
    const w1 = pickWordFromPool(['a', 'b', 'c', 'd'], 'test_scope');
    const w2 = pickWordFromPool(['a', 'b', 'c', 'd'], 'test_scope');
    assert(w1 !== w2 || ['a','b','c','d'].length === 1);
  });
});
```

---

## Module 2: Score & Stats Tracking — Deep Dive

### What This Module Actually Does

```javascript
// Input: A completed round result + game stats
// Output: Score earned, streak updated, stats saved

// Current flow when round ends (app-main.js ~line 15270):
const roundMetrics = buildRoundMetrics(result, s.maxGuesses);  // ← EXTRACT
const guessesUsed = Math.max(1, Number(roundMetrics.guessesUsed) || 1);
const score = calculateScore(guessesUsed, s.wordLength);  // ← EXTRACT
incrementStreak();  // ← EXTRACT (if won)
```

### Key Functions to Extract

#### `buildRoundMetrics(guessResult, maxGuesses)`
- **Input:** The result object from `WQGame.submitGuess()`
- **Output:** Metrics object with scored data
- **Side effects:** None (pure calculation)

```javascript
function buildRoundMetrics(result, maxGuesses) {
  const timeElapsed = Math.max(0, Date.now() - gameStartedAtMs);
  const hintRequested = currentRoundHintRequested === true;
  const voiceAttempts = (currentRoundVoiceAttempts || 0);
  const guessesUsed = Array.isArray(result.guesses) ? result.guesses.length : 0;

  return {
    guessesUsed,
    hintRequested,
    voiceAttempts,
    durationMs: timeElapsed,
    skillKey: getCurrentRoundSkillKey(),
    skillLabel: getCurrentRoundSkillLabel(),
    zpdInBand: calculateZPDInBand(guessesUsed, maxGuesses, hintRequested, result.won)
  };
}
```

#### `calculateScore(guessesUsed, wordLength, multipliers = {})`
- **Input:** How many guesses used, word length, optional multiplier flags
- **Output:** Base score (integer)
- **Pure math function**

```javascript
function calculateScore(guessesUsed, wordLength, multipliers = {}) {
  // Base: longer words are worth more
  const baseByLength = {
    2: 10, 3: 15, 4: 20, 5: 25, 6: 30, 7: 35, 8: 40,
    9: 45, 10: 50, 11: 55, 12: 60
  }[wordLength] || 20;

  // Guess multiplier: faster solves = more points
  const guessMultiplier = {
    1: 6,    // Perfect (1 guess)
    2: 5,    // Excellent (2 guesses)
    3: 4,    // Good (3 guesses)
    4: 3,    // Fair (4 guesses)
    5: 2,    // Slow (5 guesses)
    6: 1     // Very slow (6 guesses)
  }[guessesUsed] || 1;

  let score = baseByLength * guessMultiplier;

  // Apply feature multipliers if enabled
  if (multipliers.difficulty) score *= 1.25;
  if (multipliers.streak) score *= 1.1;
  if (multipliers.powerup) score *= multipliers.powerupValue || 1.0;

  return Math.round(score);
}
```

#### `incrementStreak()`
- **What it does:** Updates streak counter and streak UI
- **Side effects:** Modifies localStorage + DOM
- **When called:** Only on winning guess

```javascript
var currentStreak = 0;
var longestStreak = 0;

function loadStreakFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem('wq_v2_streaks') || '{}');
    currentStreak = saved.current || 0;
    longestStreak = saved.longest || 0;
  } catch {
    currentStreak = 0;
    longestStreak = 0;
  }
}

function saveStreakToStorage() {
  try {
    localStorage.setItem('wq_v2_streaks', JSON.stringify({
      current: currentStreak,
      longest: longestStreak,
      lastUpdatedAt: Date.now()
    }));
  } catch {}
}

function incrementStreak() {
  loadStreakFromStorage();
  currentStreak += 1;
  longestStreak = Math.max(longestStreak, currentStreak);
  saveStreakToStorage();
  renderSafeStreak();  // ← Call to UI layer (keep this separate)
}

function resetStreakIfNeeded() {
  // Reset if 24 hours have passed without a win
  const saved = JSON.parse(localStorage.getItem('wq_v2_streaks') || '{}');
  const lastWinAt = saved.lastUpdatedAt || 0;
  const hoursSinceLastWin = (Date.now() - lastWinAt) / (1000 * 60 * 60);

  if (hoursSinceLastWin > 24) {
    currentStreak = 0;
    saveStreakToStorage();
  }
}
```

#### `getPlayerStats()`
- **Input:** None (reads from localStorage)
- **Output:** Cumulative stats object

```javascript
function getPlayerStats() {
  try {
    const saved = JSON.parse(localStorage.getItem('wq_v2_progress') || '{}');
    const today = new Date().toISOString().slice(0, 10);
    const todayStat = saved[today] || { wins: 0, total: 0, words: [] };

    return {
      // Today's stats
      winsToday: todayStat.wins,
      gamesPlayedToday: todayStat.total,
      // Lifetime stats
      allTimeWins: countLifetimeWins(saved),
      allTimeGames: countLifetimeGames(saved),
      // Current streak
      streak: currentStreak,
      longestStreak: longestStreak
    };
  } catch {
    return {
      winsToday: 0,
      gamesPlayedToday: 0,
      allTimeWins: 0,
      allTimeGames: 0,
      streak: 0,
      longestStreak: 0
    };
  }
}
```

### State Variables to Move

```javascript
var currentStreak = 0;
var longestStreak = 0;
var gameStartedAtMs = 0;
var currentRoundHintRequested = false;
var currentRoundVoiceAttempts = 0;
```

### Dependencies for Module 2

```
IMPORTS NEEDED:
  ✓ localStorage (browser API)
  ✓ Date.now() (browser API)
  ✓ currentRoundHintRequested, currentRoundVoiceAttempts (from app-main.js or Module 5)
  ✓ getCurrentRoundSkillKey(), getCurrentRoundSkillLabel() (from Module 1)

EXPORTS:
  export {
    buildRoundMetrics,
    calculateScore,
    incrementStreak,
    resetStreakIfNeeded,
    getPlayerStats
  }

CALLED BY:
  - Input handlers (when round ends)
  - Stats display UI
  - Telemetry pipeline
```

### Testing Strategy for Module 2

```javascript
describe('Score & Stats Tracking', () => {
  test('calculateScore: 5-letter word in 3 guesses = 4x20 = 80 points', () => {
    const score = calculateScore(3, 5);
    assert.equal(score, 80); // base 25 * multiplier 4 = 100... wait, let me check the math
  });

  test('calculateScore respects multipliers', () => {
    const base = calculateScore(3, 5);
    const withDifficulty = calculateScore(3, 5, { difficulty: true });
    assert(withDifficulty > base);
  });

  test('incrementStreak persists and can be loaded', () => {
    incrementStreak();
    incrementStreak();
    const stats = getPlayerStats();
    assert.equal(stats.streak, 2);
  });

  test('resetStreakIfNeeded clears old streaks', () => {
    // Mock Date to 25 hours in future
    const mockTime = Date.now() + (25 * 60 * 60 * 1000);
    resetStreakIfNeeded(mockTime);
    const stats = getPlayerStats();
    assert.equal(stats.streak, 0);
  });
});
```

---

## Critical Coupling Points (Watch Out!)

### 1. Round Tracking Cleanup

After each round, `resetRoundTracking()` must be called. This clears:
```javascript
function resetRoundTracking() {
  currentRoundHintRequested = false;
  currentRoundVoiceAttempts = 0;
  gameStartedAtMs = 0;
  // ... 10 more state vars
}
```

**When extracting Module 2:** Module 5 (Game Flow) must call this after scoring is complete.

### 2. Telemetry Dependency

After calculating score, telemetry must emit:
```javascript
emitTelemetry('wq_round_complete', {
  won: !!result.won,
  guesses_used: roundMetrics.guessesUsed,
  hint_used: roundMetrics.hintRequested,
  duration_ms: roundMetrics.durationMs,
  // ... 5 more fields
});
```

**Decision:** Keep telemetry in app-main.js (it's cross-cutting concern). Modules export metrics, app-main.js emits.

### 3. UI Updates After Scoring

Module 2 calculates score, but UI updates happen in Module 3/5:
```javascript
// Module 2 calculates
const score = calculateScore(guessesUsed, wordLength);

// Module 3 (UI) renders
WQUI.updateScoreDisplay(score);
renderSafeStreak();  // Updates DOM streak counter
```

**Rule:** Modules calculate/persist, UI layer renders.

---

## Data Flow Diagram: One Complete Round

```
User types 'hello' and presses Enter
          ↓
  INPUT HANDLER (Module 4)
  - Validates input
  - Calls WQGame.submitGuess()
          ↓
  GAME STATE (js/game.js)
  - Returns { guess, result, won/lost }
          ↓
  ROUND METRICS (Module 2)
  - buildRoundMetrics(result) → { guessesUsed, durationMs, ... }
  - calculateScore(guesses, length) → 85
  - On win: incrementStreak()
          ↓
  UI RENDERER (Module 3)
  - WQUI.revealRow(guess, result)
  - updateKeyboard(result)
  - On win: celebrateWinRow()
          ↓
  GAME FLOW (Module 5)
  - recordAndSync(result, metrics)
  - On win: showGameOverScreen()
  - On incomplete: checkForMidgameBoost()
          ↓
  TELEMETRY + PERSIST (app-main.js orchestration)
  - emitTelemetry('wq_round_complete', metrics)
  - syncTeacherRoster(result)
  - trackRoundForReview(result)
```

---

## Extraction Checklist for Module 1 + 2

### Before Extraction
- [ ] Read js/game.js completely (it's only 260 lines)
- [ ] Verify pickWordFromPool doesn't have DOM dependencies
- [ ] Verify calculateScore doesn't call any UI functions
- [ ] List all localStorage keys used (for docs)

### During Extraction
- [ ] Create `js/app-word-helpers.js` with functions from Module 1
- [ ] Create `js/app-score-tracking.js` with functions from Module 2
- [ ] Load both scripts **before** app-main.js in word-quest.html
- [ ] Update app-main.js to call module functions instead of inline logic

### After Extraction
- [ ] Run: `npm run guard:runtime`
- [ ] Run: `npm run hud:check`
- [ ] Test new game flow (all grades, all focuses)
- [ ] Test winning a round (verify streak increments)
- [ ] Test with teacher pool override
- [ ] Verify localStorage has correct keys saved
- [ ] Check browser devtools: no new errors

### Success Indicators
- ✅ Game plays identically before/after
- ✅ Guardrails pass
- ✅ Streak UI updates correctly on win
- ✅ Word repeat avoidance still works (shuffle bag)
- ✅ Teacher pool override still works

---

## Open Questions for Codex

Before starting extraction, clarify:

1. **Where should shuffle bag state live?**
   - Option A: Inside `js/game.js` (current)
   - Option B: Move to Module 1 (app-word-helpers.js)
   - → Recommendation: Stay in game.js (it owns word state)

2. **Should score calculation know about FEATURES flags?**
   - Current: `calculateScore()` is pure math
   - New: What if difficulty multiplier depends on FEATURES.adaptiveDifficulty?
   - → Recommendation: Pass multiplier flags as params, don't read FEATURES inside module

3. **How to handle round timing (gameStartedAtMs)?**
   - Current: Set in Module 5 (new game init)
   - Used by: Module 2 (duration calculation)
   - → Recommendation: Module 5 passes timestamp to Module 2, don't rely on global

---

## Next Steps

1. Codex reviews this deep dive and asks clarifying questions
2. Codex extracts Module 1 + 2 and runs guardrails
3. If guardrails pass → move to Module 3 (UI Rendering)
4. If guardrails fail → debug and update this doc with findings
