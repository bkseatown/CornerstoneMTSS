# Common Gotchas & Anti-Patterns: What Goes Wrong

## GOTCHA 1: Load Order Mistakes

### The Problem
```html
<!-- ❌ WRONG: app-main loads before modules -->
<script src="js/app-main.js"></script>
<script src="js/app-word-helpers.js"></script>
```

When app-main.js loads, it tries to call `AppWordHelpers.buildPlayableWordSet()` but the module doesn't exist yet.

### Result
```
ReferenceError: AppWordHelpers is not defined
At: js/app-main.js:15034
```

### The Fix
```html
<!-- ✅ CORRECT: Modules load FIRST -->
<script src="js/game.js"></script>
<script src="js/app-word-helpers.js"></script>
<script src="js/app-score-tracking.js"></script>
<script src="js/app-input-validators.js"></script>
<script src="js/ui.js"></script>
<script src="js/app-main.js"></script>
<script src="js/app.js"></script>
```

### Preventive Check
```bash
# Verify load order in HTML
grep -n "<script src=" word-quest.html | grep -E "app-word|app-score|app-input|app-main"
# Should show: app-word < app-score < app-input < app-main
```

---

## GOTCHA 2: Missing window Export

### The Problem
You create a module but forget to attach it to `window`:

```javascript
// ❌ WRONG: Module defined but not exported
const AppWordHelpers = (() => {
  return { buildPlayableWordSet, ... };
})();
// Missing: if (typeof window !== 'undefined') { window.AppWordHelpers = AppWordHelpers; }
```

### Result
```
ReferenceError: AppWordHelpers is not defined
At: js/app-main.js:15034
```

Looks the same as load order error, but it's actually a missing export.

### The Fix
```javascript
// ✅ CORRECT: Always export to window
const AppWordHelpers = (() => {
  return { buildPlayableWordSet, ... };
})();

if (typeof window !== 'undefined') {
  window.AppWordHelpers = AppWordHelpers;
}
```

### Preventive Check
```bash
# Search for exports in module
grep -n "window\.AppWordHelpers\|window\.AppScoreTracking\|window\.InputValidators" js/app-word-helpers.js js/app-score-tracking.js js/app-input-validators.js
# Should return 3 lines (one per module)
```

---

## GOTCHA 3: Stale Function Names in app-main.js

### The Problem
You extract `buildPlayableWordSet()` into a module, but forget to update all call sites in app-main.js:

```javascript
// ❌ WRONG: Still calling old function name
const playableSet = buildPlayableWordSet(grade, length, focus);
// buildPlayableWordSet is now undefined (it's in the module now)
```

### Result
```
ReferenceError: buildPlayableWordSet is not a function
At: js/app-main.js:15034
```

### The Fix
```javascript
// ✅ CORRECT: Call via module namespace
const playableSet = AppWordHelpers.buildPlayableWordSet(grade, length, focus);
```

### Preventive Check
```bash
# Find all remaining old calls
grep -n "buildPlayableWordSet()\|buildPlayScopeKey()\|incrementStreak()\|calculateScore(" js/app-main.js | grep -v "AppWordHelpers\|AppScoreTracking"
# Should return 0 matches (no old calls remaining)
```

### Bulk Replace (Be Careful!)
```bash
# Only safe if function name is unique:
sed -i '' 's/buildPlayableWordSet(/AppWordHelpers.buildPlayableWordSet(/g' js/app-main.js
sed -i '' 's/buildPlayScopeKey(/AppWordHelpers.buildPlayScopeKey(/g' js/app-main.js
sed -i '' 's/incrementStreak()/AppScoreTracking.incrementStreak()/g' js/app-main.js

# THEN verify with grep (check for false positives)
grep -n "AppWordHelpers\." js/app-main.js | head -10
```

---

## GOTCHA 4: Breaking localStorage

### The Problem
You extract score tracking but break the localStorage calls:

```javascript
// ❌ WRONG: localStorage key changed during refactoring
function saveStreakToStorage() {
  localStorage.setItem('wq_streaks_new', JSON.stringify(...));  // Wrong key!
  // Old code used 'wq_v2_streaks'
}
```

When user refreshes page, their streak is gone because it was saved under wrong key.

### Result
- User's streak disappears after refresh
- Data saved in one key, read from another
- Silent failure (no error, just data loss)

### The Fix
```javascript
// ✅ CORRECT: Use exact same keys
const STREAK_KEY = 'wq_v2_streaks';

function saveStreakToStorage() {
  localStorage.setItem(STREAK_KEY, JSON.stringify(...));
}

function loadStreakFromStorage() {
  const saved = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
  // ...
}
```

### Preventive Check
```bash
# Find all localStorage keys in original code
grep -n "localStorage.setItem\|localStorage.getItem" js/app-main.js | grep -oE "'[^']*'" | sort | uniq
# Document these keys, verify they match in extracted module
```

**Before extraction, list all keys:**
- `wq_v2_shuffle_bag` → Module 1
- `wq_v2_streaks` → Module 2
- `wq_v2_progress` → Module 2

---

## GOTCHA 5: DOM Queries Before Init

### The Problem
Module tries to read DOM before `WQUI.init()` is called:

```javascript
// ❌ WRONG: DOM references read at module load time
const _el = (id) => document.getElementById(id);

function buildPlayableWordSet(...) {
  const grade = _el('s-grade')?.value || 'all';  // Called at function runtime
  // ... OK if WQUI.init() has already run
}

// But if called during page load before init:
const gradeSelect = _el('s-grade');  // May be null!
```

### Result
```
TypeError: Cannot read property 'value' of null
At: js/app-word-helpers.js:42
```

Happens if module tries to read DOM before page is fully loaded.

### The Fix
```javascript
// ✅ CORRECT: Delay DOM reads until runtime
function buildPlayableWordSet(...) {
  const _el = (id) => document.getElementById(id);
  const gradeSelect = _el('s-grade');

  if (!gradeSelect) {
    console.warn('Grade select not found');
    return [];
  }

  const grade = gradeSelect.value || 'all';
  // ...
}
```

Or pass DOM values as parameters:
```javascript
// ✅ EVEN BETTER: No DOM reads in module
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  // All parameters passed in, no DOM queries
  // ...
}

// Called from app-main.js (which knows DOM is ready):
const grade = _el('s-grade')?.value || 'all';
const playableSet = AppWordHelpers.buildPlayableWordSet(grade, length, focus);
```

### Preventive Check
```bash
# Find all DOM queries in extracted modules
grep -n "document.getElementById\|querySelector\|_el(" js/app-word-helpers.js
# These are OK at runtime, but watch for early init calls
```

---

## GOTCHA 6: Animation Timing Constants Changed

### The Problem
You find the animation timing constants in ui.js and think they're too slow:

```javascript
// ❌ WRONG: "Let me speed this up"
const STAGGER = 100;  // Was 285, I made it faster!
const FLIP_SETTLE = 100;  // Was 335
const REVEAL_FINISH = 100;  // Was 340
```

App-main.js relies on exact timing when it does:
```javascript
WQUI.revealRow(..., () => {
  // Callback should fire ~520ms later
  // But if constants changed, callback timing is off
});
```

### Result
```
// Tiles flip too fast, callback fires before animation completes
// UI updates happen while tiles are still animating
// Flashing, visual glitches, inconsistent behavior
```

### The Fix
```javascript
// ✅ CORRECT: Never change animation constants
const STAGGER = 285;        // DO NOT CHANGE
const FLIP_SETTLE = 335;    // DO NOT CHANGE
const REVEAL_FINISH = 340;  // DO NOT CHANGE

// Document why they're exact:
// Total time for N-letter word: (N-1)*STAGGER + FLIP_SETTLE + REVEAL_FINISH
// Example: 5-letter = 1140 + 335 + 340 = 1815ms? No, let me recalculate...
// Actually: (4*285) + 335 + 340 = 1815ms
// Callback fires at: FLIP_SETTLE + min(STAGGER * (N-1)) = ~520ms
```

### Preventive Check
```bash
# Search for animation constants in ui.js
grep -n "STAGGER\|FLIP_SETTLE\|REVEAL_FINISH" js/ui.js
# Values should be: 285, 335, 340 respectively

# If changed, verify the exact timing math in app-main.js
grep -n "setTimeout.*revealRow\|revealRow.*callback\|520\|1\d\d\d" js/app-main.js | head -5
```

---

## GOTCHA 7: Callback Timing Off

### The Problem
You call `WQUI.revealRow()` expecting callback at ~520ms, but don't account for stagger:

```javascript
// ❌ WRONG: Assuming fixed 500ms callback
WQUI.revealRow(guess, result, row, 5, () => {
  // Assuming callback fires at 500ms
  // But actual time = (5-1)*285 + 335 = 1475ms!
  WQUI.showModal(result);  // Shows too early if word is 7 letters
});
```

### Result
- Modal appears while tiles are still flipping
- Visual glitch: tiles flip behind modal
- Looks broken, even though code is technically correct

### The Fix
```javascript
// ✅ CORRECT: Account for word length in timing
const calculateRevealTime = (wordLength) => {
  const STAGGER = 285;
  const FLIP_SETTLE = 335;
  return (wordLength - 1) * STAGGER + FLIP_SETTLE;
};

const revealTime = calculateRevealTime(result.wordLength);

WQUI.revealRow(guess, result, row, result.wordLength, () => {
  // Callback fires at revealTime
  WQUI.updateKeyboard(result.result, result.guess);

  if (result.won || result.lost) {
    // Add extra delay before modal (allow staggered animation to complete)
    setTimeout(() => {
      WQUI.showModal(result);
    }, 400);  // Approximately revealTime + buffer
  }
});
```

### Preventive Check
```bash
# Verify callback timing math in app-main.js
grep -n "revealRow.*() {" -A 20 js/app-main.js | grep -E "setTimeout|showModal|ms"
# Should see: setTimeout(..., 400-600ms) BEFORE showModal
```

---

## GOTCHA 8: State Variables Not Initialized

### The Problem
You extract state variables but forget to initialize them:

```javascript
// ❌ WRONG: Variable declared but never initialized
const AppScoreTracking = (() => {
  let currentStreak = undefined;  // Oops!
  let longestStreak;               // Never set

  function incrementStreak() {
    currentStreak += 1;  // NaN! undefined + 1 = NaN
  }
})();
```

### Result
```
NaN errors when incrementing streak
Math.max(NaN, 5) = NaN
Streak display shows "NaN" or "undefined"
```

### The Fix
```javascript
// ✅ CORRECT: Always initialize variables
const AppScoreTracking = (() => {
  let currentStreak = 0;      // Initialized!
  let longestStreak = 0;      // Initialized!

  function incrementStreak() {
    currentStreak += 1;  // Works correctly
  }
})();
```

### Preventive Check
```bash
# Find all variable declarations in modules
grep -n "^[[:space:]]*let \|^[[:space:]]*var " js/app-word-helpers.js js/app-score-tracking.js js/app-input-validators.js
# Each line should have an = assignment (initialization)

# Test in console:
> AppScoreTracking.incrementStreak()
# Should return { current: 1, longest: 1 }, not NaN
```

---

## GOTCHA 9: Circular Dependencies

### The Problem
Module A imports from Module B, which imports from Module A:

```javascript
// app-word-helpers.js
import { someScoreFunction } from './app-score-tracking.js';  // ❌ Circular!

// app-score-tracking.js
import { buildPlayableWordSet } from './app-word-helpers.js';  // ❌ Circular!
```

### Result
```
Module loading fails
Undefined functions/variables
Hard to debug (not a clear error message)
```

### The Fix
```javascript
// ✅ CORRECT: No circular dependencies
// app-word-helpers.js — NO imports
// app-score-tracking.js — NO imports
// Both are passed dependencies they need

// Called from app-main.js:
const playableSet = AppWordHelpers.buildPlayableWordSet(...);
const metrics = AppScoreTracking.buildRoundMetrics(...);
```

### Preventive Check
```bash
# Search for imports in modules (should find none for Modules 1 & 2)
grep -n "import\|require" js/app-word-helpers.js js/app-score-tracking.js js/app-input-validators.js
# Should return 0 matches (modules are self-contained)
```

---

## GOTCHA 10: Comparing Old vs New Behavior

### The Problem
After extraction, you test and think something broke because it looks different:

```javascript
// ❌ WRONG: Comparing casual observation
// Before: "Streak showed as '1' after win"
// After: "Streak is still '0' after win"
// "It must be broken!"

// Actually: User didn't wait for state to update
// Or renderSafeStreak() wasn't called
```

### Result
False alarm, but you spend hours debugging something that works

### The Fix
```javascript
// ✅ CORRECT: Test systematically
// 1. Check DevTools console for errors
// 2. Check localStorage to verify data was saved
// 3. Check that UI update function was called
// 4. Refresh page and verify data persists

// Systematic test:
const beforeWin = AppScoreTracking.getPlayerStats();
console.log('Before win:', beforeWin);

// Play a game and win...

const afterWin = AppScoreTracking.getPlayerStats();
console.log('After win:', afterWin);
// Should show: winsToday increased, streak = 1, etc.

// Refresh page:
location.reload();
const afterRefresh = AppScoreTracking.getPlayerStats();
console.log('After refresh:', afterRefresh);
// Should still show streak = 1 (persisted)
```

### Preventive Check
```bash
# Always verify three things after extraction:
# 1. Guardrails pass
npm run guard:runtime

# 2. Behavior matches before/after
# (play same game sequence, verify same result)

# 3. Data persists
# (win game, refresh page, check stats still there)
```

---

## GOTCHA 11: Copy-Paste Errors in Module Code

### The Problem
You copy code from app-main.js into a module but miss some dependencies:

```javascript
// app-main.js original:
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  // ... uses CURRICULUM_DATA from app-main.js global ...
  const pool = CURRICULUM_DATA[gradeBand].words;  // Global variable
}

// ❌ WRONG: Pasted without updating reference
// In module:
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  const pool = CURRICULUM_DATA[gradeBand].words;  // Still references global!
}
// But module doesn't have access to CURRICULUM_DATA
```

### Result
```
ReferenceError: CURRICULUM_DATA is not defined
At: js/app-word-helpers.js:52
```

### The Fix
```javascript
// ✅ CORRECT: Update references to use window globals
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea) {
  const curriculum = window.__WQ_CURRICULUM_DATA__ || {};
  const pool = curriculum[gradeBand]?.words || [];
  // ...
}

// Or better: have app-main.js pass the data in
function buildPlayableWordSet(gradeBand, lengthFilter, focusArea, curriculumData) {
  const pool = curriculumData[gradeBand]?.words || [];
  // ...
}
```

### Preventive Check
```bash
# After copying code into module, search for undefined references:
grep -n "CURRICULUM_DATA\|prefs\|_el(\|localStorage\|window\." js/app-word-helpers.js
# Each reference should be either:
# 1. window.GLOBAL_VAR (explicitly use window), or
# 2. const GLOBAL_VAR = window.GLOBAL_VAR (import at top), or
# 3. Passed as parameter (better practice)
```

---

## GOTCHA 12: Guardrails Passing But Tests Failing

### The Problem
```bash
npm run guard:runtime
# ✅ PASS

npm run hud:check
# ✅ PASS

npm run dom:hooks:check
# ✅ PASS

# But game doesn't play correctly!
```

Guardrails don't test gameplay logic, only code quality.

### Result
All automated tests pass, but manual testing fails

### The Fix
```bash
# ALWAYS do manual testing after extraction:
# 1. Load word-quest.html
# 2. Click "New Game"
# 3. Type letters → board updates
# 4. Press Enter → guess submitted
# 5. Win round → streak increases, modal shows
# 6. Refresh page → streak still there
# 7. Change theme → board redraws
# 8. Lose round → game over modal shows

# If any step fails, debug:
# - Check DevTools console for errors
# - Check localStorage for persisted data
# - Check that module functions are called (add console.log)
```

### Preventive Check
```bash
# After guardrails pass, always test:
# 1. New game
# 2. Letter input
# 3. Guess submission
# 4. Win/lose scenarios
# 5. Page refresh
# 6. Theme changes
```

---

## GOTCHA 13: Module Size Grows Too Large

### The Problem
You start extracting one function, but end up moving 10 functions into the module:

```javascript
// "Let me just move buildPlayableWordSet..."
// 30 minutes later:
// buildPlayableWordSet
// buildPlayScopeKey
// getCurriculumWordsForGrade
// getTeacherOverridePool
// normalizeReviewWord
// getCurriculumWordById
// filterByPhonicsLevel
// calculateWordDifficulty
// ... module is now 500 lines
```

Module is no longer "small and focused" — it's becoming another monolith.

### The Fix
```javascript
// ✅ CORRECT: Limit module scope
// Module 1: ONLY word picking and curriculum filtering
// - buildPlayableWordSet()
// - buildPlayScopeKey()
// - getCurriculumWordsForGrade()
// - getTeacherOverridePool()

// MOVE ELSEWHERE:
// - normalizeReviewWord() → utils or stays in app-main
// - calculateWordDifficulty() → Module 2 (score-related)

// Modules should be:
// 1. <300 lines each
// 2. One clear concern (word picking, scoring, etc.)
// 3. Callable from one or two places
```

### Preventive Check
```bash
# After extraction, check module sizes:
wc -l js/app-word-helpers.js js/app-score-tracking.js js/app-input-validators.js
# Should be: <300 lines each

# Check function count:
grep -c "^  function\|^  const.*= " js/app-word-helpers.js
# Should be: 4-6 functions max
```

---

## GOTCHA 14: Testing Only Happy Path

### The Problem
You test: "Click New Game → Make guesses → Win"

But don't test:
- Empty word pool (no words available)
- Teacher override pool with 0 words
- Refreshing page mid-game
- Changing theme mid-game
- Very long words (10+ letters)
- Invalid input

### Result
Bug appears in production that didn't show in testing

### The Fix
```javascript
// ✅ CORRECT: Test multiple scenarios

// Scenario 1: Happy path (already done)
// Click new game → win

// Scenario 2: Edge case — no words available
// Set grade to impossible filter → click new game
// Should show "No words available" toast

// Scenario 3: Persistence
// Win game → refresh page
// Should still show streak

// Scenario 4: Long words
// Set length to '12' → click new game
// Should work with 12-letter words

// Scenario 5: Teacher override
// Manually edit localStorage to set teacher pool to []
// Click new game → should error gracefully
```

### Preventive Check
```bash
# Use test checklist (from playbook):
# [ ] New game — board renders
# [ ] Letter input — tiles fill
# [ ] Guess submit — validation works
# [ ] Win scenario — streak increments
# [ ] Lose scenario — game over shows
# [ ] Page refresh — data persists
# [ ] Theme change — UI updates
# [ ] Teacher override — works
# [ ] Empty pool — error message shows
# [ ] Long word — displays correctly
```

---

## Recovery Flowchart

```
Issue occurs
    ↓
Check DevTools console
    ↓ Error message visible?
    ├─ YES → Go to "Error Messages & Meanings" in CODEX_QUICK_REFERENCE.md
    └─ NO → Go to next step
    ↓
Run guardrails
    ↓ Do they pass?
    ├─ NO → Fix syntax error first
    └─ YES → Go to next step
    ↓
Check HTML load order
    ├─ app-word-helpers.js before app-main.js?
    ├─ All modules loaded?
    └─ NO → Fix load order
    ↓
Test module in console
    > typeof AppWordHelpers  (should be 'object')
    > AppWordHelpers.buildPlayableWordSet('3', '5', 'all').length
    ├─ Function returns array → Module works
    └─ Error → Check module code
    ↓
Test gameplay manually
    ├─ Game plays? ✓ Done!
    └─ Game doesn't play → Add console.log() to trace execution
    ↓
Trace execution
    console.log('Module called with:', args);
    console.log('Module returned:', result);
    ↓
Still stuck? Last resort:
    git reset --hard HEAD
    Start fresh, slower and more careful
```

---

## Emergency Rollback Procedure

If everything is broken:

```bash
# Option 1: Keep modules, revert app-main.js
git diff js/app-main.js > /tmp/changes.patch
git checkout js/app-main.js
# Manually re-apply small, testable changes at a time

# Option 2: Full reset
git reset --hard HEAD
# Remove newly created modules
rm js/app-word-helpers.js js/app-score-tracking.js js/app-input-validators.js
# Verify game works again
npm run guard:runtime

# Option 3: Selective undo (if some modules work, some don't)
git checkout js/app-main.js
# Comment out just the Module 1 calls
# Verify Module 1 works
# Then uncomment Module 2 calls
# Verify Module 2 works
# Etc.
```

**Most important rule:** If you're stuck for >15 minutes, reset and start slower.

Better to lose 30 minutes of broken work than 2 hours of failed debugging.
