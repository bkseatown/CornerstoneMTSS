# Modules 3, 4, 5 Extraction Playbook
## For Codex: The Harder Extractions

**Status:** Ready to execute AFTER Modules 1 & 2 are stable and guardrails pass.

---

## CRITICAL DISCLAIMER

**DO NOT START THESE EXTRACTIONS UNTIL:**
- ✅ Modules 1 & 2 are extracted and guardrails pass
- ✅ `npm run guard:runtime` passes clean
- ✅ Game plays identically before/after Module 1 & 2 extraction
- ✅ All word-picking, scoring, and stats logic works correctly

**If you violate this sequence, you will create cascading failures that are hard to debug.**

---

## Extraction Strategy Overview

| Module | Approach | Risk | Effort |
|--------|----------|------|--------|
| **3: UI Rendering** | ✅ FULL EXTRACTION | 🟢 Low | 2-3 hours |
| **4: Input Handling** | ⚠️ PARTIAL EXTRACTION | 🟡 Medium | 4-6 hours |
| **5: Game Flow** | ❌ STAY IN app-main.js | 🔴 High | N/A — don't extract |

**Key Decision:** Modules 4 & 5 are too tightly coupled for full extraction. Extract only the safe helpers; keep the orchestration in place.

---

## MODULE 3: UI Rendering (FULL EXTRACTION)

### Status: WQUI Already Separated

Good news: `js/ui.js` is already isolated. This extraction is **proof of concept** that the architecture works.

### Pre-Extraction Verification Checklist

Before touching Module 3, verify:
- [ ] `js/ui.js` exists and is 552 lines
- [ ] WQUI is defined as `const WQUI = (() => { ... return { ... }; })()`
- [ ] word-quest.html loads `<script src="js/ui.js"></script>` BEFORE `<script src="js/app-main.js"></script>`
- [ ] app-main.js references WQUI functions (WQUI.updateCurrentRow, etc.)
- [ ] No circular dependencies (ui.js doesn't import from app-main.js)

### Step 1: Verify WQUI Public API

```javascript
// From js/ui.js line ~546:
const WQUI_PUBLIC_API = [
  'init',                 // Initialize DOM references
  'buildBoard',          // Create tiles
  'updateCurrentRow',    // Update active row (with jiggle animation)
  'revealRow',           // Flip-reveal with staggered timing + callback
  'shakeRow',            // Shake animation on invalid
  'celebrateWinRow',     // Win celebration (confetti?)
  'buildKeyboard',       // Create keyboard UI
  'clearKeyboard',       // Reset keyboard state
  'updateKeyboard',      // Mark keys correct/present/absent
  'pulseDupeKey',        // Pulse duplicate letter key
  'showModal',           // Show game-over modal
  'hideModal',           // Hide modal
  'showToast',           // Show toast message
  'getSettings',         // Read board settings
  'setCaseMode',         // Set upper/lower case
  'calcLayout',          // Calculate responsive layout
  'animateTile',         // Animate single tile
];
```

**Verification Command:**
```bash
grep -c "^  function\|^  const.*= " js/ui.js  # Should match API count
```

### Step 2: Identify All DOM Dependencies

WQUI reads from these DOM elements. Verify they exist in word-quest.html:

```javascript
const DOM_DEPENDENCIES = [
  '#game-board',         // Main board container
  '#keyboard',           // Keyboard container
  '#modal-overlay',      // Game-over modal
  '#toast',              // Toast message container
  '#setting-focus',      // Focus selector (read by WQUI.getSettings)
  // ... any others?
];
```

**Verification Command:**
```bash
grep -E "getElementById|querySelector|data-id" js/ui.js | head -30
```

### Step 3: Check Animation Timing Constants

These MUST NOT change — they're critical for coordination:

```javascript
// From js/ui.js:
const STAGGER = 285;        // Delay between tile flips (ms)
const FLIP_SETTLE = 335;    // Flip animation duration (ms)
const REVEAL_FINISH = 340;  // Extra padding (ms)

// Calculated total reveal time for N-letter word:
// total = (N-1) * STAGGER + FLIP_SETTLE + REVEAL_FINISH
// Example (5-letter): (4 * 285) + 335 + 340 = 2120ms
```

**Document these in code comments** — future maintainers will need them.

### Step 4: Map All Call Sites in app-main.js

Search for every place WQUI is called:

```bash
grep -n "WQUI\." js/app-main.js | head -50
```

Expected high-hit functions:
- `WQUI.updateCurrentRow()` — after every letter input
- `WQUI.revealRow()` — after guess submission
- `WQUI.updateKeyboard()` — in revealRow callback
- `WQUI.buildBoard()` — at game start
- `WQUI.buildKeyboard()` — at game start
- `WQUI.showModal()` — at game end

**Create a call-site map:**
```
WQUI.updateCurrentRow:
  Line 15400 (letter input)
  Line 15520 (backspace)

WQUI.revealRow:
  Line 15260 (main guess handler)
  Callback: updates keyboard, shows modal

WQUI.showModal:
  Line 15295 (game-over screen)
  Line 15340 (error cases)
```

### Step 5: Test WQUI in Isolation

Create a minimal test page:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="word-quest.html">
</head>
<body>
  <div id="game-board"></div>
  <div id="keyboard"></div>
  <div id="modal-overlay"></div>
  <div id="toast"></div>

  <script src="js/ui.js"></script>
  <script>
    WQUI.init();
    WQUI.buildBoard(5, 6);
    WQUI.buildKeyboard();
    WQUI.updateCurrentRow('hel', 5, 0);

    // Test reveal callback
    WQUI.revealRow(
      'hello',
      ['correct', 'correct', 'correct', 'correct', 'correct'],
      0,
      5,
      () => {
        console.log('Reveal callback fired!');
      }
    );

    setTimeout(() => {
      console.log('Game board HTML:', document.getElementById('game-board').innerHTML);
    }, 2200);
  </script>
</body>
</html>
```

**Run this test page in browser and verify:**
- [ ] Board renders with correct number of tiles (30 for 5x6)
- [ ] Keyboard renders
- [ ] Typing in guess updates tiles
- [ ] Reveal animation triggers callback after ~520ms
- [ ] Callback fires at correct timing

### Step 6: Verify No Hidden Dependencies

Check if WQUI references these (it shouldn't):
```bash
grep -E "WQGame\.|localStorage\.|emit|telemetry" js/ui.js
# Should return NO matches
```

### Step 7: Documentation Pass

Add code comments to js/ui.js explaining:
1. Animation timing constants and why they matter
2. Which app-main.js functions call each WQUI function
3. What DOM elements are required
4. What the callback patterns are

### Step 8: Load Module in word-quest.html

Verify load order in word-quest.html:

```html
<!-- CORRECT ORDER: -->
<script src="js/ui.js"></script>           <!-- FIRST (defines WQUI) -->
<script src="js/app-main.js"></script>     <!-- SECOND (uses WQUI) -->
<script src="js/app.js"></script>          <!-- THIRD (orchestrator) -->
```

### Step 9: Run Guardrails

```bash
npm run guard:runtime    # Should pass
npm run hud:check        # Should pass
npm run dom:hooks:check  # Should pass
```

### Step 10: Integration Test

1. Load word-quest.html in browser
2. Click "New Game"
3. Make a guess (letter input)
   - [ ] Tile should jiggle
   - [ ] Keyboard should update after submission
4. Win a round
   - [ ] Tiles should flip with stagger
   - [ ] Callback should fire
   - [ ] Keyboard should highlight
   - [ ] Modal should show

### If WQUI Extraction Fails

Most likely issues:
1. **DOM element missing** → Add to word-quest.html
2. **Animation timing off** → Don't change STAGGER/FLIP_SETTLE/REVEAL_FINISH
3. **Callback not firing** → Check browser devtools, verify js/ui.js is loaded
4. **Keyboard not updating** → Verify updateKeyboard is called in callback

---

## MODULE 4: Input Handling (PARTIAL EXTRACTION)

### Extraction Strategy: Extract Helpers, Keep Flow

**Do NOT extract:**
- `handleKey()` main function
- `handleInputUnit()` main entry
- Event listener attachment

**DO extract these helpers:**
1. `checkLetterEntryConstraints()`
2. `validateGuessCompleteness()`
3. `pulseDupeKey()`
4. Keyboard event listener setup

### Why Partial Extraction?

The Enter key handler has **animation checkpoint logic** that must stay in app-main.js:

```javascript
// This MUST stay in app-main.js because:
// 1. It submits guess (WQGame.submitGuess)
// 2. It emits telemetry (tracking)
// 3. It calls WQUI.revealRow with callback
// 4. In callback, it coordinates: keyboard update, duplicate check, game-over
// 5. Timing is critical (~520ms checkpoint)

const result = WQGame.submitGuess();
emitTelemetry('wq_guess_submit', {...});  // ← Can't move, coupling

WQUI.revealRow(result.guess, result.result, row, s.wordLength, () => {
  // Callback at ~520ms
  WQUI.updateKeyboard();
  checkDuplicates();
  if (result.won || result.lost) {
    // ...show modal...
  }
});
```

### Step 1: Extract checkLetterEntryConstraints()

**Location in app-main.js:** Line ~15395

**What it does:** Validates letter against phonics constraints

```javascript
// CREATE: js/app-input-validators.js
export function checkLetterEntryConstraints(letter, state, wordState) {
  const focusValue = String(_el('setting-focus')?.value || 'all').toLowerCase();
  const focusInfo = PHONICS_RULES[focusValue] || null;

  if (!focusInfo?.blockedLetters?.includes(letter)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: 'not_in_focus',
    focusLabel: FOCUS_LABELS[focusValue],
    blockedLetters: focusInfo.blockedLetters
  };
}
```

**Dependencies:**
- `_el()` helper (from app-main.js) — import or pass
- `PHONICS_RULES` object (from app-main.js) — import or pass
- `FOCUS_LABELS` object (from app-main.js) — import or pass

**Call site in app-main.js (line ~15390):**
```javascript
const check = checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
```

**Change to:**
```javascript
const check = InputValidators.checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
```

### Step 2: Extract validateGuessCompleteness()

**Helper for Enter key handler**

```javascript
// ADD TO: js/app-input-validators.js
export function validateGuessCompleteness(guess, wordLength) {
  if (guess.length < wordLength) {
    return {
      valid: false,
      error: 'too_short',
      message: 'Fill in all the letters first'
    };
  }
  return { valid: true };
}
```

**Call site in app-main.js (line ~15207):**
```javascript
// Current:
const result = WQGame.submitGuess();
if (!result) return;
if (result.error === 'too_short') {
  WQUI.showToast('Fill in all the letters first');
  return;
}

// After extraction:
const check = InputValidators.validateGuessCompleteness(s.guess, s.wordLength);
if (!check.valid) {
  WQUI.showToast(check.message);
  return;
}
const result = WQGame.submitGuess();
```

### Step 3: Extract pulseDupeKey()

**Visual feedback for duplicate letter**

```javascript
// ADD TO: js/app-input-validators.js
export function pulseDupeKey(letter) {
  const key = _el(`key-${letter.toLowerCase()}`);
  if (!key) return;

  key.classList.remove('pulse');
  void key.offsetWidth;  // Trigger reflow
  key.classList.add('pulse');

  setTimeout(() => key.classList.remove('pulse'), 400);
}
```

### Step 4: Create Input Validators Module

**File: js/app-input-validators.js**

```javascript
/**
 * Input Validators & Helpers
 * Pure validation functions for the game input layer.
 */

const InputValidators = (() => {
  // Helper ref (same as app-main.js)
  const _el = (id) => document.getElementById(id);

  // Import from app-main.js or define locally
  // For now, assume these are passed in or globally available
  const PHONICS_RULES = window.PHONICS_RULES || {};
  const FOCUS_LABELS = window.FOCUS_LABELS || {};

  function checkLetterEntryConstraints(letter, state, wordState) {
    const focusValue = String(_el('setting-focus')?.value || 'all').toLowerCase();
    const focusInfo = PHONICS_RULES[focusValue] || null;

    if (!focusInfo?.blockedLetters?.includes(letter)) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: 'not_in_focus',
      focusLabel: FOCUS_LABELS[focusValue] || focusValue,
      blockedLetters: focusInfo.blockedLetters
    };
  }

  function validateGuessCompleteness(guess, wordLength) {
    if (guess.length < wordLength) {
      return {
        valid: false,
        error: 'too_short',
        message: 'Fill in all the letters first'
      };
    }
    return { valid: true };
  }

  function pulseDupeKey(letter) {
    const key = _el(`key-${letter.toLowerCase()}`);
    if (!key) return;

    key.classList.remove('pulse');
    void key.offsetWidth;  // Trigger reflow to restart animation
    key.classList.add('pulse');

    setTimeout(() => key.classList.remove('pulse'), 400);
  }

  return {
    checkLetterEntryConstraints,
    validateGuessCompleteness,
    pulseDupeKey
  };
})();

window.InputValidators = InputValidators;
```

### Step 5: Update word-quest.html Load Order

```html
<!-- Add this BEFORE app-main.js: -->
<script src="js/app-input-validators.js"></script>
```

### Step 6: Update app-main.js

Replace inline calls:

```javascript
// OLD (line ~15395):
const check = checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
if (!check.ok) {
  pulseBlockedLetterKey(normalizedLetter);
  maybeShowConstraintToast(check, normalizedLetter);

// NEW:
const check = InputValidators.checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
if (!check.ok) {
  InputValidators.pulseDupeKey(normalizedLetter);
  maybeShowConstraintToast(check, normalizedLetter);
```

### Step 7: Run Guardrails

```bash
npm run guard:runtime
npm run hud:check
npm run dom:hooks:check
```

### Step 8: Integration Test

1. Type invalid letter (if phonics constraints enabled) → Should pulse
2. Fill board → Type letter beyond word length → Should reject
3. Clear letter with backspace → Should work
4. Submit incomplete guess → Should show "Fill in all the letters"

### If Module 4 Extraction Fails

**Most likely issues:**
1. **pulseBlockedLetterKey doesn't exist** → Use InputValidators.pulseDupeKey instead
2. **PHONICS_RULES not found** → Make it global in app-main.js or import it
3. **DOM elements not found** → Verify keyboard HTML has correct ID scheme

---

## MODULE 5: Game Flow (DO NOT EXTRACT)

### Why NOT to Extract Module 5

Module 5 (`newGame()` function) is the **orchestrator**. Extracting it causes:

1. **Breaking the call chain:**
   ```
   User clicks "New Game"
     → newGame()
     → buildPlayableWordSet() [Module 1]
     → WQGame.startGame()
     → WQUI.buildBoard() [Module 3]
     → WQUI.buildKeyboard() [Module 3]
     → ... 15 more setup calls
   ```
   If `newGame()` is in a different module, all these calls require params/returns.

2. **Scattering the control flow:**
   The function has 5 bailout paths:
   ```
   if (DEMO_MODE && demoRoundComplete) return;
   if (firstRunSetupPending) return;
   if (isMissionLabStandaloneMode()) return;
   if (voicePracticeRequired) return;
   // ... happy path
   ```
   Moving this makes the logic flow hard to follow.

3. **Coordination overhead:**
   Every side effect (clear timers, reset state, init UI) must be coordinated with other modules. The monolithic function is actually the RIGHT design here.

### What CAN be extracted from Module 5

Extract these **pure helpers**:

```javascript
// js/app-game-flow-helpers.js
export function buildNewGameOptions(demoMode, forceDemoReplay) {
  return {
    isDemoMode: demoMode,
    forceDemoReplay: forceDemoReplay,
    timestamp: Date.now()
  };
}

export function validateGameStartable(settings) {
  // Check if first-run pending, voice required, etc.
  return { canStart: true, blockers: [] };
}

export function deriveGameStartSettings(uiSettings, demoMode, focus) {
  // Extract grade band, effective settings, etc.
  return { gradeBand: 'all', length: '5', ... };
}
```

### DO NOT Extract:

❌ `newGame()` function itself
❌ The round-complete callback chain
❌ State machine state (gameStartedAt, currentRoundHintRequested, etc.)
❌ Timer coordination (support modal, idle watcher, coach)

### If You're Tempted to Extract More from Module 5

**Ask yourself:**
- "Does this function call more than 2 other functions in app-main.js?"
  - If YES → Probably needs to stay
- "Does this function have multiple return paths (>3)?"
  - If YES → Probably needs to stay
- "Would extracting this require passing >5 parameters?"
  - If YES → Probably needs to stay

If any answer is YES, **leave it in app-main.js.**

---

## Final Verification Checklist

After all Module 3 & 4 extractions are complete:

### Before Running Guardrails

- [ ] `js/ui.js` is loaded in word-quest.html BEFORE app-main.js
- [ ] `js/app-input-validators.js` is loaded BEFORE app-main.js
- [ ] `js/app-word-helpers.js` is loaded BEFORE app-main.js
- [ ] `js/app-score-tracking.js` is loaded BEFORE app-main.js
- [ ] All `import` or `window.` references are correct
- [ ] No circular dependencies (validate with `grep`)
- [ ] All extracted functions are called via module namespace (e.g., `InputValidators.checkLetterEntryConstraints`)

### Guardrails Commands

```bash
npm run guard:runtime      # Must pass
npm run hud:check          # Must pass
npm run dom:hooks:check    # Must pass
```

### Manual Testing (10 minutes)

1. **Game Start**
   - [ ] Click "New Game"
   - [ ] Board renders correctly
   - [ ] Keyboard appears
   - [ ] Word is selected

2. **Letter Input**
   - [ ] Type letters → tiles fill
   - [ ] Backspace → tiles clear
   - [ ] Type beyond word length → ignored

3. **Guess Submission**
   - [ ] Press Enter → tiles flip
   - [ ] Wait ~520ms → callback fires
   - [ ] Keyboard updates with feedback

4. **Win Round**
   - [ ] 5-letter word in 1-2 guesses
   - [ ] Tiles flip in staggered pattern
   - [ ] Streak increments (Module 2)
   - [ ] Game-over modal appears
   - [ ] "Next Word" button pulsates

5. **Lose Round**
   - [ ] Make 6 wrong guesses
   - [ ] 6th row flips
   - [ ] Modal shows "You lost"
   - [ ] Stats update

6. **Theme Changes**
   - [ ] Change theme → board redraws correctly
   - [ ] Light/dark mode → tiles visible
   - [ ] Keyboard visible in all themes

### If Guardrails Fail

```bash
# Check what failed:
npm run guard:runtime 2>&1 | head -50

# Common failures:
# - ReferenceError: WQUI not defined
#   → Check word-quest.html load order
# - ReferenceError: InputValidators not defined
#   → Check js/app-input-validators.js is loaded
# - Syntax error in app-main.js
#   → Check for missing semicolons after extraction

# Debug in browser:
# Open DevTools Console
# > WQUI  # Should return object with 14 methods
# > InputValidators  # Should return object with 3 methods
```

### If Game Behavior Changes

Compare before/after:
```bash
# Word selection should be identical
# Scoring should be identical
# UI animations should be identical (same timings)
# No new console errors

# If tiles animate differently:
#   → Check STAGGER/FLIP_SETTLE constants
# If keyboard doesn't update after guess:
#   → Check revealRow callback is firing (add console.log)
# If modal doesn't show:
#   → Check Modal is being called after WQUI.revealRow callback
```

---

## Success Criteria

After Module 3 & 4 extraction:

✅ **Code Quality**
- No circular dependencies
- All modules load in correct order
- No "undefined" references

✅ **Functionality**
- Game plays identically
- All animations work
- All user interactions work
- All themes work
- Demo mode works
- Teacher integration works

✅ **Maintainability**
- Modules are <500 lines each
- Each module has one clear responsibility
- Dependencies are explicit (imports at top)
- App-main.js is now <18K lines (if Module 1, 2 already extracted)

✅ **Verification**
- `npm run guard:runtime` passes
- `npm run hud:check` passes
- `npm run dom:hooks:check` passes
- Manual gameplay test: win, lose, theme change, input validation

---

## When in Doubt

Ask these questions in order:

1. **Is this a pure function?** (no DOM writes, no side effects)
   - YES → Extract it
   - NO → Go to #2

2. **Does it only read/write one concern?** (only scoring, only board, only input validation)
   - YES → Extract it (if <200 lines)
   - NO → Go to #3

3. **Does it coordinate between 2+ modules?** (game state + UI + telemetry)
   - YES → Keep in app-main.js
   - NO → You're probably safe to extract

4. **Is app-main.js still >8K lines after extraction?**
   - YES → Look for more candidates
   - NO → Stop extracting, focus on verification
