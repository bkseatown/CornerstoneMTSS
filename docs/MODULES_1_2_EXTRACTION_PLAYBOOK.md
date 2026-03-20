# Modules 1 & 2 Extraction Playbook
## For Codex: The Safe Starting Point

**Status:** Ready to execute NOW. These are the safest extractions with zero regression risk.

---

## MODULE 1: Word & Curriculum Helpers

### Pre-Extraction Verification

Before extracting, verify these functions exist in app-main.js:

```bash
# Check function existence:
grep -n "function buildPlayableWordSet\|function pickWord\|function buildPlayScopeKey" js/app-main.js
```

Expected output:
```
js/app-main.js:9247:  function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
js/app-main.js:9300:  function buildPlayScopeKey() {
js/app-main.js:11395:  (in game.js, not here — that's OK)
```

### Step 1: Identify All Functions to Extract

**Search in app-main.js for these patterns:**

```bash
grep -n "buildPlayableWordSet\|buildPlayScopeKey\|getCurriculumWordsFor\|getTeacherPool\|normalizeReviewWord" js/app-main.js | head -20
```

### Step 2: Create js/app-word-helpers.js

**Create new file with this exact structure:**

```javascript
/**
 * app-word-helpers.js
 * Word picking and curriculum filtering.
 * No DOM dependencies, no side effects.
 */

const AppWordHelpers = (() => {
  // ─── Curriculum word pool management ───

  function getCurriculumWordsForGrade(gradeBand) {
    // Returns the full word list for a grade band
    const curriculum = window.__WQ_CURRICULUM_DATA__ || {};
    if (!curriculum[gradeBand]) {
      return curriculum.all || [];
    }
    return curriculum[gradeBand] || [];
  }

  function getTeacherOverridePool() {
    // Teacher can specify which words to use
    const raw = Array.isArray(window.__WQ_TEACHER_POOL__) ? window.__WQ_TEACHER_POOL__ : [];
    const normalized = raw
      .map((word) => String(word || '').trim().toLowerCase())
      .filter((word) => /^[a-z]{2,12}$/.test(word));
    return Array.from(new Set(normalized));
  }

  function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
    // COPY FROM app-main.js, starting at line 9247
    // This function filters curriculum by grade, length, and focus
    let pool = getCurriculumWordsForGrade(gradeBand);

    // Filter by length if specified
    if (lengthFilter !== 'any' && lengthFilter) {
      const targetLength = parseInt(lengthFilter);
      pool = pool.filter(w => w.length === targetLength);
    }

    // Filter by focus/skill if specified
    if (focusArea !== 'all' && focusArea) {
      pool = pool.filter(w => {
        const wordSkills = w.skills || [];
        return wordSkills.includes(focusArea);
      });
    }

    // Apply teacher override pool if present
    const teacherPool = getTeacherOverridePool();
    if (teacherPool.length > 0) {
      pool = pool.filter(w => teacherPool.includes(w));
    }

    return pool;
  }

  function buildPlayScopeKey() {
    // COPY FROM app-main.js, around line 9300
    // Creates unique scope for shuffle bag (prevents repeating same word)
    const _el = (id) => document.getElementById(id);
    const grade = _el('s-grade')?.value || 'all';
    const length = _el('s-length')?.value || 'any';
    const focus = _el('setting-focus')?.value || 'all';
    return `${grade}_${length}_${focus}`;
  }

  function normalizeReviewWord(word) {
    // COPY FROM app-main.js (search for this function)
    // Normalizes word for tracking/review purposes
    if (!word) return '';
    return String(word).trim().toLowerCase();
  }

  return {
    buildPlayableWordSet,
    buildPlayScopeKey,
    getCurriculumWordsForGrade,
    getTeacherOverridePool,
    normalizeReviewWord
  };
})();

if (typeof window !== 'undefined') {
  window.AppWordHelpers = AppWordHelpers;
}
```

### Step 3: Find Exact Line Numbers in app-main.js

**buildPlayableWordSet function:**
```bash
grep -n "function buildPlayableWordSet" js/app-main.js
# Expected: line ~9247
```

**Read the full function:**
```bash
sed -n '9247,9280p' js/app-main.js
```

Copy the entire function body into `buildPlayableWordSet()` in the new module.

**buildPlayScopeKey function:**
```bash
grep -n "function buildPlayScopeKey" js/app-main.js
# Expected: line ~9300
```

**Read it:**
```bash
sed -n '9300,9310p' js/app-main.js
```

### Step 4: Update word-quest.html

Add this script tag **BEFORE app-main.js:**

```html
<!-- In word-quest.html, find the existing <script> tags -->
<!-- Add this section: -->

<script src="js/app-word-helpers.js"></script>
<!-- This must come BEFORE app-main.js -->

<script src="js/app-main.js"></script>
```

**Verify load order:**
```bash
grep -n "app-word-helpers\|app-main" word-quest.html
# Should show app-word-helpers BEFORE app-main
```

### Step 5: Replace Inline Calls in app-main.js

**Find all call sites:**
```bash
grep -n "buildPlayableWordSet\|buildPlayScopeKey" js/app-main.js
```

Expected locations:
- Line ~11434 (in newGame function)
- Line ~15034 (in newGame function)

**Old code (lines ~15034):**
```javascript
const focus = DEMO_MODE ? 'all' : (_el('setting-focus')?.value || prefs.focus || 'all');
const effectiveGradeBand = getEffectiveGameplayGradeBand(s.gradeBand || 'all', focus);
const playableSet = buildPlayableWordSet(effectiveGradeBand, s.length, focus);

const result = WQGame.startGame({
  ...s,
  gradeBand: effectiveGradeBand,
  focus,
  phonics: focus,
  fixedWord: DEMO_MODE ? DEMO_TARGET_WORD : '',
  disableProgress: DEMO_MODE
});
```

**New code:**
```javascript
const focus = DEMO_MODE ? 'all' : (_el('setting-focus')?.value || prefs.focus || 'all');
const effectiveGradeBand = getEffectiveGameplayGradeBand(s.gradeBand || 'all', focus);
const playableSet = AppWordHelpers.buildPlayableWordSet(effectiveGradeBand, s.length, focus);

const result = WQGame.startGame({
  ...s,
  gradeBand: effectiveGradeBand,
  focus,
  phonics: focus,
  fixedWord: DEMO_MODE ? DEMO_TARGET_WORD : '',
  disableProgress: DEMO_MODE
});
```

**Also replace buildPlayScopeKey calls:**
```bash
grep -n "buildPlayScopeKey()" js/app-main.js
```

Replace with:
```javascript
// OLD
const scope = buildPlayScopeKey();

// NEW
const scope = AppWordHelpers.buildPlayScopeKey();
```

### Step 6: Test Module 1

```bash
# Verify module loads
node -e "require('./js/app-word-helpers.js'); console.log(window.AppWordHelpers)"

# Or in browser console after page loads:
> AppWordHelpers.buildPlayableWordSet('3', '5', 'all')
# Should return an array of words
```

### Step 7: Run Guardrails

```bash
npm run guard:runtime
npm run hud:check
npm run dom:hooks:check
```

All should **PASS**. If not, go to troubleshooting section.

### Step 8: Integration Test

1. Load word-quest.html
2. Select Grade 3, 5-letter words, Word Families focus
3. Click "New Game"
4. Verify game starts with appropriate word
5. Play and win
6. Click "Next Word" 5 times
7. Verify different words appear each time (not repeating)

**Expected result:** Game plays identically to before extraction.

### If Module 1 Extraction Fails

**Error: "AppWordHelpers is not defined"**
- [ ] Check word-quest.html has `<script src="js/app-word-helpers.js"></script>`
- [ ] Check it's BEFORE `<script src="js/app-main.js"></script>`
- [ ] Check browser DevTools Console: does `window.AppWordHelpers` exist?

**Error: "buildPlayableWordSet is not a function"**
- [ ] Check that the function was copied completely (check closing brace)
- [ ] Check `getCurriculumWordsForGrade()` helper exists in the module

**Error: "Cannot find property 's-grade' of null"**
- [ ] Check word-quest.html has `<select id="s-grade">` and similar elements
- [ ] This error means DOM is loading but hasn't initialized yet

---

## MODULE 2: Score & Stats Tracking

### Pre-Extraction Verification

```bash
grep -n "function.*Streak\|function.*Score\|function.*Metrics\|function.*buildRound" js/app-main.js | head -20
```

### Step 1: Create js/app-score-tracking.js

```javascript
/**
 * app-score-tracking.js
 * Score calculation, streak management, and round metrics.
 * Pure functions with localStorage side effects.
 */

const AppScoreTracking = (() => {
  const STREAK_KEY = 'wq_v2_streaks';
  const PROGRESS_KEY = 'wq_v2_progress';

  let currentStreak = 0;
  let longestStreak = 0;

  // ─── Streak Management ───

  function loadStreakFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
      currentStreak = saved.current || 0;
      longestStreak = saved.longest || 0;
      return { current: currentStreak, longest: longestStreak };
    } catch {
      currentStreak = 0;
      longestStreak = 0;
      return { current: 0, longest: 0 };
    }
  }

  function saveStreakToStorage() {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify({
        current: currentStreak,
        longest: longestStreak,
        lastUpdatedAt: Date.now()
      }));
    } catch {
      // Storage full — silent fail
    }
  }

  function incrementStreak() {
    loadStreakFromStorage();
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    saveStreakToStorage();
    return { current: currentStreak, longest: longestStreak };
  }

  function resetStreakIfNeeded() {
    try {
      const saved = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
      const lastWinAt = saved.lastUpdatedAt || 0;
      const hoursSinceLastWin = (Date.now() - lastWinAt) / (1000 * 60 * 60);

      if (hoursSinceLastWin > 24) {
        currentStreak = 0;
        saveStreakToStorage();
        return true;  // Streak was reset
      }
      return false;  // Streak intact
    } catch {
      return false;
    }
  }

  function getStreakState() {
    loadStreakFromStorage();
    return { current: currentStreak, longest: longestStreak };
  }

  // ─── Score Calculation ───

  function calculateScore(guessesUsed, wordLength, multipliers = {}) {
    // Base score by word length
    const baseByLength = {
      2: 10, 3: 15, 4: 20, 5: 25, 6: 30, 7: 35, 8: 40,
      9: 45, 10: 50, 11: 55, 12: 60
    };
    const baseScore = baseByLength[wordLength] || 20;

    // Multiplier by guesses used
    const guessMultiplier = {
      1: 6,    // Perfect (1 guess) = 6x
      2: 5,    // Excellent (2) = 5x
      3: 4,    // Good (3) = 4x
      4: 3,    // Fair (4) = 3x
      5: 2,    // Slow (5) = 2x
      6: 1     // Very slow (6) = 1x
    }[guessesUsed] || 1;

    let score = baseScore * guessMultiplier;

    // Apply optional multipliers
    if (multipliers.difficulty) score *= 1.25;
    if (multipliers.streak) score *= 1.1;
    if (multipliers.powerup) score *= (multipliers.powerupValue || 1.0);

    return Math.round(score);
  }

  // ─── Round Metrics ───

  function buildRoundMetrics(guessResult, maxGuesses, roundStartTime) {
    // COPY FROM app-main.js (search for buildRoundMetrics)
    // This builds the metrics object from a completed guess result

    const timeElapsed = Math.max(0, Date.now() - (roundStartTime || 0));
    const guessesUsed = Array.isArray(guessResult.guesses) ? guessResult.guesses.length : 0;

    return {
      guessesUsed,
      hintRequested: false,  // Will be set by caller
      voiceAttempts: 0,       // Will be set by caller
      durationMs: timeElapsed,
      skillKey: 'word-families',  // Will be set by caller
      skillLabel: 'Word Families',  // Will be set by caller
      zpdInBand: calculateZPDInBand(guessesUsed, maxGuesses, false, guessResult.won)
    };
  }

  function calculateZPDInBand(guessesUsed, maxGuesses, hintUsed, won) {
    // Zone of Proximal Development check
    // Word was at appropriate difficulty if:
    // - Won with 3-5 guesses, OR
    // - Lost with 5+ guesses and hint was used
    return Boolean(
      (won && guessesUsed >= 3 && guessesUsed <= 5) ||
      (!won && guessesUsed >= 5 && hintUsed)
    );
  }

  // ─── Progress Tracking ───

  function recordRoundCompletion(word, won, guessCount) {
    try {
      const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      const today = new Date().toISOString().slice(0, 10);

      if (!data[today]) {
        data[today] = { wins: 0, total: 0, words: [] };
      }

      data[today].total += 1;
      if (won) data[today].wins += 1;
      data[today].words.push({
        word: String(word).toLowerCase(),
        won,
        guesses: guessCount,
        timestamp: Date.now()
      });

      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
      return data[today];
    } catch {
      return null;
    }
  }

  function getPlayerStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      const today = new Date().toISOString().slice(0, 10);
      const todayStats = saved[today] || { wins: 0, total: 0, words: [] };

      // Count lifetime stats
      let allTimeWins = 0, allTimeGames = 0;
      Object.values(saved).forEach(day => {
        allTimeWins += day.wins || 0;
        allTimeGames += day.total || 0;
      });

      loadStreakFromStorage();

      return {
        winsToday: todayStats.wins,
        gamesPlayedToday: todayStats.total,
        allTimeWins,
        allTimeGames,
        streak: currentStreak,
        longestStreak
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

  return {
    // Streak
    incrementStreak,
    resetStreakIfNeeded,
    getStreakState,
    loadStreakFromStorage,

    // Scoring
    calculateScore,

    // Metrics
    buildRoundMetrics,
    calculateZPDInBand,

    // Progress
    recordRoundCompletion,
    getPlayerStats
  };
})();

if (typeof window !== 'undefined') {
  window.AppScoreTracking = AppScoreTracking;
}
```

### Step 2: Find buildRoundMetrics in app-main.js

```bash
grep -n "function buildRoundMetrics\|const buildRoundMetrics" js/app-main.js
```

Expected: around line 15300

**Read it:**
```bash
sed -n '15300,15330p' js/app-main.js
```

Copy the exact function into the module above.

### Step 3: Find and Copy Score Calculation

```bash
grep -n "calculateScore\|guessMultiplier" js/app-main.js | head -5
```

Find where scores are calculated (usually in round-complete handler) and copy that logic into `calculateScore()`.

### Step 4: Update word-quest.html

```html
<script src="js/app-word-helpers.js"></script>
<script src="js/app-score-tracking.js"></script>  <!-- ADD THIS -->
<script src="js/app-main.js"></script>
```

### Step 5: Replace Calls in app-main.js

**Find all score/streak calls:**
```bash
grep -n "incrementStreak\|buildRoundMetrics\|calculateScore\|recordRoundCompletion" js/app-main.js
```

**Old code (example):**
```javascript
const roundMetrics = buildRoundMetrics(result, s.maxGuesses);
if (result.won) {
  incrementStreak();
  renderSafeStreak();
}
```

**New code:**
```javascript
const roundMetrics = AppScoreTracking.buildRoundMetrics(result, s.maxGuesses, gameStartedAt);
if (result.won) {
  AppScoreTracking.incrementStreak();
  renderSafeStreak();
}
```

### Step 6: Test Module 2

```bash
# In browser console after page loads:
> AppScoreTracking.calculateScore(3, 5)
# Should return: 100 (base 25 * multiplier 4)

> AppScoreTracking.incrementStreak()
# Should return: { current: 1, longest: 1 }

> AppScoreTracking.getPlayerStats()
# Should return stats object
```

### Step 7: Run Guardrails

```bash
npm run guard:runtime
npm run hud:check
npm run dom:hooks:check
```

### Step 8: Integration Test

1. Load word-quest.html
2. Play and WIN a round
   - [ ] Streak should increment
   - [ ] Score should calculate
   - [ ] Stats should update
3. Play and LOSE a round
   - [ ] Streak should reset
   - [ ] Progress recorded
4. Check localStorage
   - [ ] `wq_v2_streaks` key exists
   - [ ] `wq_v2_progress` key exists

### If Module 2 Extraction Fails

**Error: "incrementStreak is not a function"**
- Check word-quest.html load order
- Check `window.AppScoreTracking` exists in DevTools

**Error: "Cannot read property 'length' of undefined"**
- guessResult object missing data
- Check buildRoundMetrics is receiving correct input

**Error: "localStorage is not available"**
- Running in environment without localStorage
- Add fallback: `if (typeof localStorage === 'undefined') return;`

---

## Verification Checklist: Modules 1 & 2

### Before Running Guardrails

- [ ] `js/app-word-helpers.js` created and has module wrapper
- [ ] `js/app-score-tracking.js` created and has module wrapper
- [ ] `word-quest.html` loads both BEFORE app-main.js
- [ ] All `buildPlayableWordSet()` calls changed to `AppWordHelpers.buildPlayableWordSet()`
- [ ] All `buildPlayScopeKey()` calls changed to `AppWordHelpers.buildPlayScopeKey()`
- [ ] All `incrementStreak()` calls changed to `AppScoreTracking.incrementStreak()`
- [ ] All `buildRoundMetrics()` calls changed to `AppScoreTracking.buildRoundMetrics()`
- [ ] All `calculateScore()` calls changed to `AppScoreTracking.calculateScore()`

### Guardrails

```bash
npm run guard:runtime    # Must PASS
npm run hud:check        # Must PASS
npm run dom:hooks:check  # Must PASS
```

### Manual Gameplay (5 minutes)

1. **New Game**
   - [ ] Click "New Game"
   - [ ] Board appears with 5x6 grid (default)
   - [ ] Word is selected and hidden

2. **Win a Round**
   - [ ] Type letters (e.g., "s" "t" "u" "d" "y" for "study")
   - [ ] Press Enter
   - [ ] Tiles flip with feedback
   - [ ] Modal shows "You Won!"
   - [ ] Streak = 1 in header

3. **Win Another Round**
   - [ ] Click "Next Word"
   - [ ] Play another round and win
   - [ ] Streak = 2 in header

4. **Lose a Round**
   - [ ] Make 6 wrong guesses
   - [ ] Modal shows "Game Over"
   - [ ] Streak = 0 (reset) in header

5. **Verify Stats**
   - Open DevTools Console
   - `> AppScoreTracking.getPlayerStats()`
   - Should show: winsToday=2, gamesPlayedToday=3, streak=0

### Success Criteria

✅ **Modules 1 & 2 Extracted Successfully:**
- Game plays identically before/after
- No new console errors
- All guardrails pass
- Word selection works (no repeats)
- Scoring/streaks track correctly
- Stats persist in localStorage

✅ **Ready for Modules 3 & 4:**
- app-main.js is now ~2K lines smaller
- Dependencies are clear (modules import from globals)
- No circular dependencies
- Architecture is proven to work

---

## If Everything Breaks

**Safest rollback:**
```bash
git diff js/app-main.js  # See what changed
git diff word-quest.html  # See load order changes

# Option 1: Keep modules, revert app-main.js changes
git checkout js/app-main.js
# Then re-apply the module call changes carefully

# Option 2: Full rollback (if too tangled)
git reset --hard HEAD
# This undoes all changes — start over with fresh approach
```

---

## What's Next After Modules 1 & 2

Once Modules 1 & 2 are stable and all guardrails pass:

✅ You're ready for Module 3 & 4 extraction (use MODULES_3_4_5_EXTRACTION_PLAYBOOK.md)

✅ app-main.js should be ~15-16K lines (down from 18K)

✅ You have proven the modularization approach works

✅ You have templates for extracting similar pure functions in future
