# Codex Quick Reference: Extraction at a Glance

## Data Structures

### Game State (from WQGame.getState())
```javascript
{
  gameOver: boolean,
  won: boolean,
  lost: boolean,
  word: 'string',              // Target word
  guess: 'h_llo',              // Current incomplete guess
  guesses: ['arr', 'of', 'past'],
  result: ['correct', 'present', 'absent', ...],  // Per-letter feedback
  maxGuesses: 6,
  wordLength: 5,
  error: null || 'too_short',
  lastStartError: null
}
```

### Guess Result (from WQGame.submitGuess())
```javascript
{
  guess: 'hello',
  word: 'hello',
  won: true,
  lost: false,
  result: ['correct', 'correct', 'correct', 'correct', 'correct'],
  guesses: [['h','i','','',''], ['h','e','l','l','o']],
  error: null
}
```

### Round Metrics (Module 2)
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

## Module Locations & Functions

### Module 1: Word Helpers (js/app-word-helpers.js)
```javascript
AppWordHelpers.buildPlayableWordSet(grade, length, focus)
  → Returns: Array<string> of playable words

AppWordHelpers.buildPlayScopeKey()
  → Returns: 'grade_length_focus' (for shuffle bag)

AppWordHelpers.getCurriculumWordsForGrade(gradeBand)
  → Returns: Array<string> of all words for grade

AppWordHelpers.getTeacherOverridePool()
  → Returns: Array<string> (teacher's word selection)

AppWordHelpers.normalizeReviewWord(word)
  → Returns: 'normalized_word_string'
```

### Module 2: Score Tracking (js/app-score-tracking.js)
```javascript
AppScoreTracking.calculateScore(guesses, wordLength, multipliers)
  → Returns: number (points earned)

AppScoreTracking.buildRoundMetrics(result, maxGuesses, startTime)
  → Returns: metrics object

AppScoreTracking.incrementStreak()
  → Returns: { current, longest }
  → Side effect: updates localStorage

AppScoreTracking.getStreakState()
  → Returns: { current, longest }

AppScoreTracking.recordRoundCompletion(word, won, guessCount)
  → Returns: today's stats object
  → Side effect: updates localStorage

AppScoreTracking.getPlayerStats()
  → Returns: lifetime stats object
```

### Module 3: UI Rendering (js/ui.js)
```javascript
WQUI.init()
  → Initialize DOM references

WQUI.buildBoard(wordLength, maxGuesses)
  → Create tile elements

WQUI.updateCurrentRow(guess, wordLength, activeRow)
  → Update active row (jiggle animation on new letter)

WQUI.revealRow(guess, result, row, wordLength, callback)
  → Flip tiles with ~520ms total delay
  → Calls callback when animation completes

WQUI.updateKeyboard(result, guess)
  → Mark keys correct/present/absent

WQUI.buildKeyboard()
  → Create keyboard UI

WQUI.clearKeyboard()
  → Reset keyboard state

WQUI.showToast(message, duration)
  → Show temporary message

WQUI.showModal(result)
  → Show game-over modal

WQUI.hideModal()
  → Hide modal

WQUI.celebrateWinRow(row, wordLength)
  → Win celebration animation

WQUI.setCaseMode('upper' | 'lower')
  → Set letter display case

WQUI.getSettings()
  → Returns: { length, maxGuesses, gradeBand, ... }
```

### Module 4: Input Helpers (js/app-input-validators.js)
```javascript
InputValidators.checkLetterEntryConstraints(letter, state, wordState)
  → Returns: { ok: true } or { ok: false, reason: '...', focusLabel: '...' }

InputValidators.validateGuessCompleteness(guess, wordLength)
  → Returns: { valid: true } or { valid: false, error: 'too_short', message: '...' }

InputValidators.pulseDupeKey(letter)
  → Side effect: animates duplicate letter key
  → Returns: undefined
```

### Module 5: Core Game (js/game.js)
```javascript
WQGame.startGame({ word, maxGuesses, wordLength, ... })
  → Returns: game state object or null
  → Side effect: initializes game

WQGame.addLetter(letter)
  → Side effect: adds letter to current guess
  → Returns: undefined

WQGame.deleteLetter()
  → Side effect: removes last letter from guess
  → Returns: undefined

WQGame.submitGuess()
  → Returns: guess result object or null
  → Side effect: checks if won/lost, advances game state

WQGame.getState()
  → Returns: current game state object

WQGame.getLastStartError()
  → Returns: error object or null
```

---

## Load Order in word-quest.html

**CRITICAL ORDER:**
```html
<!-- 1. Core game logic (no dependencies) -->
<script src="js/game.js"></script>

<!-- 2. Pure helper modules (no app-main dependencies) -->
<script src="js/app-word-helpers.js"></script>
<script src="js/app-score-tracking.js"></script>
<script src="js/app-input-validators.js"></script>

<!-- 3. UI module (no game-specific dependencies) -->
<script src="js/ui.js"></script>

<!-- 4. Main orchestrator (uses everything above) -->
<script src="js/app-main.js"></script>

<!-- 5. Bootstrap -->
<script src="js/app.js"></script>
```

---

## Common Call Patterns

### Starting a Game
```javascript
// 1. Get word pool (Module 1)
const pool = AppWordHelpers.buildPlayableWordSet(grade, length, focus);

// 2. Start game (Module 5: game.js)
const result = WQGame.startGame({
  word: pickFromPool(pool),
  maxGuesses: 6,
  wordLength: 5
});

// 3. Build UI (Module 3)
WQUI.buildBoard(result.wordLength, result.maxGuesses);
WQUI.buildKeyboard();
```

### Processing a Guess
```javascript
// 1. User presses Enter
// 2. Validate (Module 4)
const check = InputValidators.validateGuessCompleteness(guess, wordLength);
if (!check.valid) {
  WQUI.showToast(check.message);
  return;
}

// 3. Submit guess (Module 5: game.js)
const result = WQGame.submitGuess();

// 4. Update UI (Module 3)
WQUI.revealRow(result.guess, result.result, row, wordLength, () => {
  // Animation complete (~520ms later)
  WQUI.updateKeyboard(result.result, result.guess);

  if (result.won) {
    // 5. Track score (Module 2)
    AppScoreTracking.incrementStreak();

    // 6. Show results
    WQUI.showModal(result);
  }
});
```

---

## Animation Timing (Critical!)

```javascript
// These constants in js/ui.js MUST NOT CHANGE:
const STAGGER = 285;        // ms between each tile flip
const FLIP_SETTLE = 335;    // ms for flip animation
const REVEAL_FINISH = 340;  // ms extra padding

// Total reveal time calculation:
// total = (wordLength - 1) * STAGGER + FLIP_SETTLE + REVEAL_FINISH
// Example: 5-letter word = (4 * 285) + 335 + 340 = 2120ms
```

**Key Point:** When WQUI.revealRow() calls the callback, ~520ms have passed. Use this time for:
- Keyboard updates
- Duplicate checking
- Midgame boost display
- Game-over modal (add another 400ms setTimeout)

---

## Dependency Graph

```
game.js (260 lines)
  ↑
  ├─ app-word-helpers.js
  │   └─ calls: WQGame.startGame()
  │
  ├─ app-score-tracking.js
  │   └─ calls: localStorage only
  │
  ├─ app-input-validators.js
  │   └─ calls: DOM queries only
  │
  ├─ ui.js
  │   └─ calls: DOM APIs only
  │
  └─ app-main.js
      └─ calls: ALL above modules
      └─ orchestrates: game flow, state, side effects
      └─ emits: telemetry
      └─ manages: timers, coaching, integration
```

---

## localStorage Keys Used

```javascript
// Module 1 (Word Helpers)
'wq_v2_shuffle_bag'              // Shuffle bag per scope

// Module 2 (Score Tracking)
'wq_v2_streaks'                  // { current, longest, lastUpdatedAt }
'wq_v2_progress'                 // { YYYY-MM-DD: { wins, total, words } }

// Module 5 (Game.js)
(Various diagnostic keys)
```

**DO NOT hardcode key names** — extract to constants.

---

## Error Messages & Meanings

### From Guardrails
```
ReferenceError: AppWordHelpers is not defined
  → js/app-word-helpers.js not loaded
  → Check word-quest.html load order

ReferenceError: Cannot find module 'app-word-helpers'
  → Missing window.AppWordHelpers export
  → Check module has: if (typeof window !== 'undefined') { window.AppWordHelpers = AppWordHelpers; }

TypeError: WQUI.revealRow is not a function
  → js/ui.js not loaded before app-main.js
  → Check word-quest.html load order

SyntaxError in js/app-word-helpers.js:42:
  → Missing closing brace or semicolon
  → Run: node -c js/app-word-helpers.js
```

### From Gameplay
```
"Fill in all the letters first"
  → User pressed Enter with incomplete guess
  → Expected — InputValidators.validateGuessCompleteness() is working

"No words available"
  → buildPlayableWordSet() returned empty array
  → Check: teacher pool, curriculum data, grade/length/focus filters

Game board doesn't render
  → WQUI.buildBoard() called but DOM elements not found
  → Check: #game-board, #keyboard exist in word-quest.html
```

---

## Debugging Checklist

```bash
# 1. Module loads?
grep -n "window.AppWordHelpers =" js/app-word-helpers.js

# 2. HTML load order correct?
grep -n "app-word\|app-score\|app-input\|ui.js\|app-main" word-quest.html

# 3. Function called with right name?
grep -n "AppWordHelpers.buildPlayableWordSet\|AppScoreTracking.incrementStreak" js/app-main.js

# 4. Guardrails pass?
npm run guard:runtime 2>&1 | head -30

# 5. Browser console has modules?
# Open DevTools, console:
> typeof AppWordHelpers  # Should be 'object'
> typeof AppScoreTracking  # Should be 'object'
> typeof InputValidators  # Should be 'object'
> typeof WQUI  # Should be 'object'
```

---

## One-Minute Recovery for Common Failures

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Module not loading** | "AppWordHelpers is not defined" | Check word-quest.html has `<script src="js/app-word-helpers.js"></script>` |
| **Wrong function name** | "buildPlayableWordSet is not a function" | Change `buildPlayableWordSet()` to `AppWordHelpers.buildPlayableWordSet()` |
| **Animation breaks** | Tiles don't flip staggered | Don't change STAGGER/FLIP_SETTLE constants in ui.js |
| **Streak doesn't persist** | Refresh page → streak gone | Check AppScoreTracking.saveStreakToStorage() calls localStorage |
| **Word repeats** | Same word appears twice in a row | Check buildPlayScopeKey() is called (shuffle bag needs scope) |
| **Game won't start** | Click "New Game" → nothing happens | Check WQGame.startGame() returns non-null and board builds |
| **Keyboard invisible** | Board shows, keyboard missing | Check WQUI.buildKeyboard() is called after board |
| **Modal doesn't show** | Game ends but modal hidden | Check setTimeout for WQUI.showModal() is ~520ms after revealRow |

---

## Performance Targets

- **Game start:** <100ms
- **Letter input:** <50ms
- **Guess reveal:** 520ms (tile flip animation)
- **Game-over modal:** 520ms + 400ms = ~920ms total

If gameplay is sluggish, check:
1. Are CSS animations heavy? (use DevTools Performance tab)
2. Is localStorage slow? (try localStorage.clear() for test)
3. Is DOM too large? (check tile count: should be wordLength × maxGuesses)

---

## Testing Shortcuts

### Quick Sanity Check
```javascript
// In browser console:
AppWordHelpers.buildPlayableWordSet('3', '5', 'all').length  // Should be >0
AppScoreTracking.calculateScore(3, 5)  // Should be 100
AppScoreTracking.getPlayerStats()  // Should be object with stats
WQUI.getSettings()  // Should return settings object
```

### Simulate a Win
```javascript
WQGame.startGame({ word: 'hello', maxGuesses: 6, wordLength: 5 });
WQGame.addLetter('h');
WQGame.addLetter('e');
WQGame.addLetter('l');
WQGame.addLetter('l');
WQGame.addLetter('o');
const result = WQGame.submitGuess();
console.log(result.won);  // Should be true
```

---

## Files to Track

| File | Size | Purpose | Modified? |
|------|------|---------|-----------|
| js/game.js | 260 | Core game logic | ❌ NO |
| js/ui.js | 552 | UI rendering | ❌ NO |
| js/app.js | ~300 | Bootstrap | ⚠️ Maybe (load order) |
| js/app-main.js | 18K → ? | Orchestrator | ✅ YES (replace calls) |
| js/app-word-helpers.js | 250 | NEW module | ✅ CREATE |
| js/app-score-tracking.js | 300 | NEW module | ✅ CREATE |
| js/app-input-validators.js | 150 | NEW module | ✅ CREATE |
| word-quest.html | - | HTML | ✅ YES (load order) |

**After Module 1 & 2 extraction:**
- app-main.js should be ~15-16K (down from 18K)
- 3 new modules created
- Zero changes to game.js, ui.js, or word-quest core HTML

---

## Escape Hatches

If extraction goes sideways:

**Option 1: Revert specific module**
```bash
git checkout js/app-main.js  # Keep modules, undo app-main changes
# Re-apply the module call changes one by one
```

**Option 2: Full reset**
```bash
git reset --hard HEAD  # Undo all changes
# Start fresh, be more careful
```

**Option 3: Debug mode**
```bash
# Add logging to track data flow
console.log('buildPlayableWordSet result:', pool);
console.log('WQGame.startGame result:', result);
console.log('WQUI.revealRow callback timing:', Date.now());
```

---

## Quick Links to Docs

- **Detailed Architecture:** `docs/GAMEPLAY_CORE_ANALYSIS.md`
- **Data Structures & Coupling:** `docs/GAMEPLAY_MODULES_DEEP_DIVE.md`
- **Step-by-Step Extraction (1 & 2):** `docs/MODULES_1_2_EXTRACTION_PLAYBOOK.md`
- **Step-by-Step Extraction (3, 4, 5):** `docs/MODULES_3_4_5_EXTRACTION_PLAYBOOK.md`
- **Common Gotchas:** `docs/CODEX_COMMON_GOTCHAS.md`

---

## Call for Help

If something breaks and you're stuck:

1. **Check DevTools Console** — any errors?
2. **Check guardrails output** — which test failed?
3. **Check word-quest.html load order** — is it right?
4. **Check module exists** — `> typeof AppWordHelpers` in console
5. **Read the relevant playbook** — most issues are documented

If still stuck, the safest move is:
```bash
git reset --hard HEAD
# Start fresh with the playbook, slower and more careful
```

**Better 30 minutes of careful work than 2 hours of debugging tangled code.**
