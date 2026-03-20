# Modules 3, 4, 5 Deep Dive: UI Rendering, Input Handling, Game Flow

## STATUS: Autonomous Exploration Document
This document is compiled from detailed code analysis to guide Codex when Modules 3, 4, 5 are ready for extraction. **Do not implement yet** — this is reference material for when the groundwork (Modules 1 & 2) is stable.

---

## CRITICAL INSIGHT: The Architecture Split

The Word Quest UI is already split into three clean layers:

```
┌─────────────────────────────────────────────┐
│  js/app-main.js (18,071 lines)              │
│  INPUT HANDLERS + GAME FLOW ORCHESTRATION   │
│  (Modules 4 & 5 live here)                  │
└────────────┬────────────────────────────────┘
             │
             ├─ Calls WQUI methods
             ├─ Reads WQGame state
             └─ Coordinates side effects
             │
┌────────────v────────────────────────────────┐
│  js/ui.js (552 lines)                       │
│  PURE UI RENDERING LAYER (Module 3)         │
│  - WQUI.updateCurrentRow()                  │
│  - WQUI.revealRow()                         │
│  - WQUI.updateKeyboard()                    │
│  - WQUI.buildBoard()                        │
└─────────────────────────────────────────────┘
             │
             ├─ Receives game state
             ├─ Updates DOM
             └─ Returns timing callbacks
             │
┌────────────v────────────────────────────────┐
│  js/game.js (260 lines)                     │
│  PURE GAME STATE (Already extracted)        │
│  - WQGame.startGame()                       │
│  - WQGame.submitGuess()                     │
│  - WQGame.addLetter()                       │
└─────────────────────────────────────────────┘
```

**This split is GOOD.** Module 3 extraction is safe because WQUI doesn't depend on app-main.js—it's already isolated.

---

## MODULE 3: UI Rendering Layer (js/ui.js — Already Separated!)

### Current Status
**WQUI is already a well-separated module.** It has:
- ✅ Clear public API (14 exported functions)
- ✅ No dependencies on app-main.js
- ✅ Self-contained animation timing
- ✅ No global state (besides DOM)

### WQUI Public API (Complete List)

```javascript
return {
  // Initialization
  init,                  // Setup dom references
  calcLayout,           // Calculate --playfield-width token

  // Board operations
  buildBoard,           // Create tiles for wordLength × maxGuesses
  updateCurrentRow,     // Update active input row (animated jiggle)
  revealRow,           // Flip-reveal row with staggered timing
  shakeRow,            // Shake animation on invalid guess
  celebrateWinRow,     // Confetti/celebration on win

  // Keyboard operations
  buildKeyboard,       // Create keyboard UI
  clearKeyboard,       // Reset keyboard state
  updateKeyboard,      // Mark keys correct/present/absent
  pulseDupeKey,       // Pulse animation on duplicate letter

  // Modal + Toast
  showModal,           // Show game-over modal
  hideModal,           // Hide modal
  showToast,           // Show temporary message

  // Settings
  getSettings,         // Read board size, max guesses, length filter
  setCaseMode,         // 'upper' or 'lower' for display
};
```

### Key Implementation Detail: Animation Choreography

WQUI uses **callback-based timing** to coordinate animations with app-main.js:

```javascript
// From app-main.js line 15260:
WQUI.revealRow(result.guess, result.result, row, s.wordLength, () => {
  // This callback fires AFTER the row flip animation completes
  // (~520ms later with staggered tiles)

  WQUI.updateKeyboard(result.result, result.guess);  // Update keyboard
  checkDuplicates(result);                            // Show duplicate toast

  if (result.won || result.lost) {
    // THEN show game-over modal
    setTimeout(() => {
      WQUI.showModal(result);  // Show results after animation
      _el('new-game-btn')?.classList.add('pulse');
    }, 520);
  }
});
```

**Critical Timing Constants (from js/ui.js):**
```javascript
const STAGGER = 285;        // Delay between each tile flip
const FLIP_SETTLE = 335;    // Time for flip animation to complete
const REVEAL_FINISH = 340;  // Extra padding after last tile
```

Total delay for 5-letter word: `(4 * 285) + 335 + 340 = 2120ms`

### Data Structures WQUI Expects

#### Board Update Input (from updateCurrentRow)
```javascript
WQUI.updateCurrentRow(
  guess,           // 'hel' (incomplete guess)
  wordLength,      // 5
  activeRow        // 0 (which row is active)
)
```

#### Reveal Input (from revealRow)
```javascript
WQUI.revealRow(
  guess,           // 'hello' (completed guess)
  result,          // ['correct', 'present', 'absent', 'correct', 'correct']
  row,             // 0 (row index)
  wordLength,      // 5
  onDone           // callback() when animation completes
)
```

#### Keyboard Update Input (from updateKeyboard)
```javascript
WQUI.updateKeyboard(
  result,          // ['correct', 'correct', 'correct', 'correct', 'correct']
  guess            // 'hello'
)
// Updates the on-screen keyboard to show which letters are
// correct (green), present (yellow), or absent (gray)
```

### What WQUI Does NOT Do

❌ Does NOT call WQGame
❌ Does NOT emit telemetry
❌ Does NOT read localStorage
❌ Does NOT coordinate with theme system (app-main.js handles that)
❌ Does NOT show hints/clues (app-main.js handles that)

**This means:** WQUI can be extracted/tested independently without touching game logic or app state.

### Testing Strategy for Module 3

Since WQUI is already separate, testing is straightforward:

```javascript
describe('WQUI Rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="game-board"></div>
      <div id="keyboard"></div>
      <div id="modal-overlay"></div>
      <div id="toast"></div>
    `;
    WQUI.init();  // Load DOM references
  });

  test('buildBoard creates correct number of tiles', () => {
    WQUI.buildBoard(5, 6);  // 5-letter word, 6 guesses
    assert.equal(document.querySelectorAll('.tile').length, 30);
  });

  test('updateCurrentRow animates on new letter input', (done) => {
    WQUI.buildBoard(5, 6);
    WQUI.updateCurrentRow('h', 5, 0);
    // Tile should have 'filled' class
    const tile = document.getElementById('tile-0');
    assert(tile.classList.contains('filled'));
    // Animation should trigger
    assert(tile.classList.contains('just-typed'));
    done();
  });

  test('revealRow triggers callback after animation', (done) => {
    WQUI.buildBoard(5, 6);
    const result = ['correct', 'correct', 'correct', 'correct', 'correct'];
    let callbackFired = false;
    WQUI.revealRow('hello', result, 0, 5, () => {
      callbackFired = true;
    });
    // Callback should fire ~520ms later
    setTimeout(() => {
      assert(callbackFired);
      done();
    }, 550);
  });

  test('updateKeyboard marks keys with correct status', () => {
    WQUI.buildKeyboard();
    WQUI.updateKeyboard(
      ['correct', 'present', 'absent', 'correct', 'correct'],
      'hello'
    );
    // 'h' key should have 'correct' class
    // 'e' key should have 'present' class
    // etc.
  });
});
```

---

## MODULE 4: Input & Event Handling

### Current Structure (app-main.js lines 15143–15819)

Input handling is **already fairly modular** — it sits between WQUI and WQGame:

```
User Types 'a'
    ↓
handleKey('a')  ← Entry point
    ↓
Validation checks:
  - Is game over?
  - Is this letter valid (phonics constraints)?
  - Is board full?
    ↓
WQGame.addLetter('a')  ← Update state
    ↓
WQUI.updateCurrentRow(guess, wordLength, row)  ← Update UI
    ↓
syncKeyboardInputLocks(state)  ← Visual feedback on keyboard
```

### Functions to Extract (Module 4)

```javascript
// Entry point
function handleKey(key) { }

// Input processing
function handleInputUnit(rawUnit) { }
function insertSequenceIntoGuess(sequence) { }

// Letter validation
function checkLetterEntryConstraints(letter, state, wordState) { }

// Visual feedback
function pulseBlockedLetterKey(letter) { }
function syncKeyboardInputLocks(state, wordState) { }
function maybeShowConstraintToast(constraint, letter) { }

// Event setup/teardown
function attachKeyboardListeners() { }
function attachButtonListeners() { }
function detachAllListeners() { }
```

### The handleKey Function (Core Logic)

```javascript
function handleKey(key) {
  avaWqLastActionAt = Date.now();  // Track for idle watcher

  // ─── Collapse demo toast on first keypress ───
  if (DEMO_MODE && !demoToastAutoCollapsedByPlay) {
    const normalized = String(key || '');
    if (normalized === 'Enter' || normalized === 'Backspace' || /^[a-zA-Z]$/.test(normalized)) {
      demoToastAutoCollapsedByPlay = true;
      collapseDemoToast();
    }
  }

  // ─── Close overlay cards on letter input ───
  clearStarterCoachTimer();
  if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
    hideInformantHintCard();
  }
  if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
    hideStarterWordCard();
  }
  if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
    hideSupportChoiceCard();
  }

  // ─── Close music popover when typing ───
  if (/^[a-zA-Z]$/.test(key) && !_el('quick-music-strip')?.classList.contains('hidden')) {
    closeQuickPopover('music');
  }

  // ─── Handle Enter key ───
  if (key === 'Enter') {
    const themeAtSubmit = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const result = WQGame.submitGuess();

    if (!result) return;

    // Emit telemetry
    emitTelemetry('wq_guess_submit', {
      guess_index: result.guesses.length || 0,
      guess_length: result.guess.length,
      submit_result: result.error ? String(result.error) : 'accepted'
    });

    // ─── Handle validation errors ───
    if (result.error === 'too_short') {
      WQUI.showToast('Fill in all the letters first');
      WQUI.shakeRow(s.guesses, s.wordLength);
      updateNextActionLine();
      syncKeyboardInputLocks(WQGame.getState?.() || {});
      if (!DEMO_MODE) positionDemoLaunchButton();
      return;
    }

    // ─── Handle wrong guess ───
    if (!result.won) {
      avaWqWrongStreak += 1;
      recordAvaWordQuestEvent('wrong_guess');
      // ... more side effects
    }

    // ─── WAIT FOR ANIMATION, THEN UPDATE STATE ───
    WQUI.revealRow(result.guess, result.result, row, s.wordLength, () => {
      // Callback fires after ~520ms (tile flip animation)

      // Update keyboard after tiles flip
      WQUI.updateKeyboard(result.result, result.guess);
      syncKeyboardInputLocks(WQGame.getState?.() || {});

      // Check for duplicates
      checkDuplicates(result);

      // Show midgame boost if conditions met
      if (shouldShowMidgameBoost(result)) {
        midgameBoostShown = true;
        showMidgameBoost();
      }

      // ─── Handle game end ───
      if (result.won || result.lost) {
        // Award points, update streaks, sync teacher, etc.
        // Then show game-over modal
        setTimeout(() => {
          WQUI.showModal(result);
          _el('new-game-btn')?.classList.add('pulse');
        }, 520);
      } else {
        // Continue to next guess
        if (DEMO_MODE) runDemoCoachAfterGuess(result);
        maybeShowErrorCoach(result);
        maybeAutoShowStarterWords(result);
        advanceTeamTurn();
        updateNextActionLine();
      }
    });

    return;
  }

  // ─── Handle Backspace ───
  if (key === 'Backspace' || key === '⌫') {
    WQGame.deleteLetter();
    const s2 = WQGame.getState();
    WQUI.updateCurrentRow(s2.guess, s2.wordLength, s2.guesses.length);
    syncKeyboardInputLocks(s2);
    refreshStarterSuggestionsIfOpen();
    updateNextActionLine();
    return;
  }

  // ─── Handle letter input ───
  if (/^[a-zA-Z]$/.test(key)) {
    const normalizedLetter = String(key || '').toLowerCase();
    const liveState = WQGame.getState?.() || {};
    const liveWordState = deriveWordState(liveState);

    // Validate letter (phonics constraints, etc.)
    const check = checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
    if (!check.ok) {
      pulseBlockedLetterKey(normalizedLetter);
      maybeShowConstraintToast(check, normalizedLetter);
      updateNextActionLine();
      return;
    }

    // Add letter to game state
    WQGame.addLetter(key);

    // Update UI immediately (not animation-dependent)
    const s2 = WQGame.getState();
    WQUI.updateCurrentRow(s2.guess, s2.wordLength, s2.guesses.length);
    syncKeyboardInputLocks(s2, liveWordState);
    refreshStarterSuggestionsIfOpen();
    updateNextActionLine();
  }
}
```

### Key Insights for Module 4

#### 1. **Side Effects Are Sequential**

The order matters:
```
1. Check game state
2. Update WQGame
3. Emit telemetry
4. Update WQUI (immediate)
5. Wait for WQUI animation callback
6. Update more state (keyboard locks, etc.)
7. Coordinate with other features (demo, coach, support modals)
```

Extracting this requires careful sequencing — Module 4 can't be fully independent; it orchestrates Modules 1, 2, 3.

#### 2. **Enter Key Triggers Complex Choreography**

```
User presses Enter
    ↓
Validate (Module 2 would use this)
    ↓
WQGame.submitGuess() → returns result object
    ↓
Emit telemetry (stays in app-main.js)
    ↓
WQUI.revealRow(..., onDone callback)  ← Start animation
    ↓
~520ms passes (tiles flip)
    ↓
onDone callback fires:
  - WQUI.updateKeyboard()
  - checkDuplicates()
  - showMidgameBoost()
  - if (won/lost): show game-over modal
  - else: continue to next guess
```

**Can't extract this cleanly without breaking the animation timing.**

#### 3. **Letter Input Is Simpler**

Letter input (non-Enter) is straightforward:
```
User types 'a'
    ↓
validateLetter(a) ← Can be extracted (Module 4 helper)
    ↓
WQGame.addLetter(a)
    ↓
WQUI.updateCurrentRow() ← Immediate update
    ↓
Done (no callback, no long-running animation)
```

#### 4. **Constraint Checking**

Some letters are blocked based on **phonics focus area**:

```javascript
const check = checkLetterEntryConstraints(letter, state, wordState);
// Returns: { ok: true/false, reason: 'wrong_digraph', ... }

function checkLetterEntryConstraints(letter, state, wordState) {
  const focusValue = String(_el('setting-focus')?.value || 'all').toLowerCase();
  const focusInfo = PHONICS_RULES[focusValue] || null;

  if (!focusInfo?.blockedLetters?.includes(letter)) return { ok: true };

  return {
    ok: false,
    reason: 'not_in_focus',
    focusLabel: FOCUS_LABELS[focusValue]
  };
}
```

### Extraction Challenges for Module 4

❌ **High Coupling to Orchestration**
- Can't extract Enter key logic without breaking animation timing
- Can't extract without Module 5 (Game Flow) since they coordinate

❌ **Mixed Concerns**
- Input validation (Module 4 responsibility)
- UI updates (Module 3)
- Game state (Module 2)
- Orchestration (Module 5)

✅ **What CAN be extracted:**
- `checkLetterEntryConstraints()` (pure validation)
- `pulseDupeKey()` (visual feedback helper)
- Keyboard/button event listener setup (attachment logic)

### Recommendation for Module 4

**Don't extract Module 4 as a standalone module.** Instead:
1. Keep the main `handleKey()` and `handleInputUnit()` in app-main.js
2. Extract **small helpers** like:
   - `checkLetterEntryConstraints()`
   - `validateGuessCompleteness()`
   - Event listener attachment logic
3. Keep orchestration in app-main.js (it's the right place for it)

This avoids over-modularization and keeps the control flow clear.

---

## MODULE 5: Game Flow & State Machine

### The Round Lifecycle

```
newGame()
    ↓
1. Clear previous round state (resetRoundTracking)
2. Build word pool (Module 1)
3. Initialize game (WQGame.startGame)
4. Build UI (WQUI.buildBoard, buildKeyboard)
5. Set up coaching/support timers
6. Set up idle watchers
    ↓
[PLAYING — user makes guesses]
    ↓
handleKey('Enter')
    ↓
1. Submit guess (WQGame.submitGuess)
2. Validate (check errors)
3. Emit telemetry
4. Update UI (WQUI.revealRow with callback)
5. In callback:
   a. Update keyboard (WQUI.updateKeyboard)
   b. Check duplicates (if enabled)
   c. Show midgame boost (if 3rd guess)
   d. If won/lost: Award points, sync teacher, show modal
   e. Else: Continue to next guess
    ↓
[GAME OVER — user has won or lost]
    ↓
1. Calculate score (Module 2)
2. Update streak (Module 2)
3. Emit round_complete telemetry
4. Sync teacher roster
5. Track for review (spaced repetition)
6. Show game-over modal
7. Offer "Next Word" button
    ↓
User clicks "Next Word"
    ↓
newGame() [cycle repeats]
```

### Key State Variables (Module 5)

```javascript
// Round lifecycle
var gameStartedAt = 0;              // Timestamp of game start
var currentRoundHintRequested = false;  // User asked for hint this round
var currentRoundVoiceAttempts = 0;  // User tried voice recording this round
var currentRoundSupportPromptShown = false;  // Support modal already shown

// Support modal timing
var focusSupportUnlockedByMiss = false;
var focusSupportUnlockAt = 0;
var focusSupportEligibleAt = 0;
var supportModalTimer = 0;

// Coaching state
var starterCoachHintTimer = 0;
var currentCoachState = 'before_guess';  // before_guess, after_first_miss, after_correct, etc.

// Demo mode state (already covered in Module 1)
var demoRoundComplete = false;

// Mid-game engagement
var midgameBoostShown = false;
var midgameBoostAutoHideTimer = 0;
```

### newGame() Detailed Flow (Lines 14956–15110)

The function has several bailout paths:

```javascript
function newGame(options = {}) {
  // ─── Path 1: Demo mode end screen ───
  if (DEMO_MODE && demoRoundComplete && !options.forceDemoReplay) {
    showDemoEndOverlay();
    return;  // Don't start new game
  }

  // ─── Setup telemetry ───
  emitTelemetry('wq_new_word_click', { source: '...' });

  // ─── Clear previous round state ───
  gameStartedAt = Date.now();
  focusSupportEligibleAt = gameStartedAt + 30000;  // 30s delay on support modal
  resetRoundTracking();  // Reset hint/voice/support counters

  // ─── Path 2: First-run setup not complete ───
  if (firstRunSetupPending && !_el('first-run-setup-modal')?.classList.contains('hidden')) {
    WQUI.showToast('Pick a setup style or skip for now.');
    return;
  }

  // ─── Path 3: Mission Lab mode ───
  if (isMissionLabStandaloneMode()) {
    startStandaloneMissionLab();
    return;
  }

  // ─── Path 4: Voice practice required ───
  if (
    getVoicePracticeMode() === 'required' &&
    !(_el('modal-overlay')?.classList.contains('hidden')) &&
    !voiceTakeComplete
  ) {
    WQUI.showToast('Record your voice before starting the next word.');
    return;
  }

  // ─── Path 5: Happy path — start new game ───

  // 1. Read settings from UI
  const s = WQUI.getSettings();
  const focus = DEMO_MODE ? 'all' : (_el('setting-focus')?.value || prefs.focus || 'all');
  const effectiveGradeBand = getEffectiveGameplayGradeBand(s.gradeBand || 'all', focus);
  const playableSet = buildPlayableWordSet(effectiveGradeBand, s.length, focus);  // Module 1

  // 2. Start game (Module 1: pick word from pool)
  const result = WQGame.startGame({
    ...s,
    gradeBand: effectiveGradeBand,
    focus,
    fixedWord: DEMO_MODE ? DEMO_TARGET_WORD : '',
    disableProgress: DEMO_MODE
  });

  // 3. Path 5a: No words available (filter error)
  if (!result) {
    const startError = WQGame.getLastStartError();
    if (startError?.code === 'EMPTY_FILTERED_POOL') {
      // Show error toast with helpful message
      WQUI.showToast(`No words available. Adjust filters...`);
    }
    // Don't proceed with game
    return;
  }

  // 4. Initialize UI
  resetRoundTracking(result);  // Reset with board dimensions
  WQUI.calcLayout(result.wordLength, result.maxGuesses);  // Set --playfield-width
  WQUI.buildBoard(result.wordLength, result.maxGuesses);  // Create tiles
  WQUI.buildKeyboard();                                    // Create keyboard
  WQUI.hideModal();                                        // Hide game-over modal from previous round

  // 5. Update all related UI
  syncKeyboardInputLocks(WQGame.getState?.() || {});
  updateVoicePracticePanel(WQGame.getState());
  updateFocusHint();
  updateNextActionLine();
  syncHeaderClueLauncherUI();
  syncStarterWordLauncherUI();

  // 6. Set up coaching (30-second timer before showing support modal)
  scheduleStarterCoachHint();

  // 7. Set up async diagnostics (90-second timeout if user doesn't finish round)
  if (window.CSWQDiagnostics && typeof window.CSWQDiagnostics.createSession === 'function') {
    _wqDiagSession = window.CSWQDiagnostics.createSession(result.wordLength || 5);
    _wqDiagTimer = setTimeout(() => {
      if (_wqDiagSession && !_wqDiagSession.endedAtMs) {
        const softSignals = window.CSWQDiagnostics.endSession(_wqDiagSession, false);
        _wqDiagSession = null;
        if (softSignals) publishWordQuestSignals(softSignals, { soft: true });
      }
    }, 90000);
  }

  // 8. Start idle watcher (track if student goes AFK)
  startAvaWordQuestIdleWatcher();

  // 9. Auto-focus board (so keyboard input works immediately)
  const gameBoard = _el('game-board');
  if (gameBoard && !window.matchMedia('(pointer:coarse)').matches) {
    gameBoard.focus();
  }
}
```

### Round Complete Flow (After revealRow callback)

```javascript
WQUI.revealRow(result.guess, result.result, row, s.wordLength, () => {
  // Animation just completed (~520ms)

  if (result.won || result.lost) {
    // ─── 1. Stop idle watcher ───
    stopAvaWordQuestIdleWatcher('round complete');

    // ─── 2. End diagnostics session ───
    if (window.CSWQDiagnostics && typeof window.CSWQDiagnostics.endSession === 'function') {
      const wqSignals = window.CSWQDiagnostics.endSession(_wqDiagSession, !!result.won);
      _wqDiagSession = null;
      if (wqSignals) publishWordQuestSignals(wqSignals, {
        soft: false,
        helpUsed: !!currentRoundHintRequested || !!currentRoundStarterWordsShown
      });
    }

    // ─── 3. Award points (Module 2) ───
    const roundMetrics = buildRoundMetrics(result, s.maxGuesses);
    if (result.won) {
      incrementStreak();  // Module 2
      renderSafeStreak();  // UI update
    }

    // ─── 4. Emit telemetry ───
    emitTelemetry('wq_round_complete', {
      word_id: normalizeReviewWord(result.word),
      won: !!result.won,
      lost: !!result.lost,
      guesses_used: roundMetrics.guessesUsed,
      hint_used: roundMetrics.hintRequested,
      // ... 10 more fields
    });

    // ─── 5. Sync teacher integration ───
    if (!DEMO_MODE) {
      awardQuestProgress(result, roundMetrics);  // Update teacher dashboard
      trackRoundForReview(result, s.maxGuesses, roundMetrics);  // Spaced repetition
    }

    // ─── 6. Reset round state ───
    resetRoundTracking();
    hideMidgameBoost();
    syncAssessmentLockRuntime();

    // ─── 7. Show game-over modal ───
    setTimeout(() => {
      if (DEMO_MODE) {
        demoRoundComplete = true;
        WQUI.hideModal();
        // Auto-play next demo word in 2.8 seconds
        demoAutoplayTimer = demoSetTimeout(() => {
          newGame({ forceDemoReplay: true });
        }, 2800);
      } else {
        WQUI.showModal(result);  // Show results screen
        _el('new-game-btn')?.classList.add('pulse');  // Pulse "Next Word" button
      }
    }, 520);
  } else {
    // ─── Round continues (user hasn't won/lost yet) ───
    if (DEMO_MODE) runDemoCoachAfterGuess(result);
    maybeShowErrorCoach(result);  // Show coaching hint
    maybeAutoShowStarterWords(result);  // Show starter words if 2nd miss
    advanceTeamTurn();  // If in team mode, advance to next student
    updateNextActionLine();  // Update header message
  }
});
```

### Extraction Recommendation for Module 5

Module 5 **should stay mostly in app-main.js** because:
- It orchestrates all other modules
- Breaking it up creates more coordination overhead than benefit
- The control flow needs to be clear to prevent bugs

**What CAN be extracted:**
```javascript
// Pure helper functions
buildRoundMetrics(result, maxGuesses)  // Already identified in Module 2
calculateRoundDifficulty(guesses, wordLength, hintUsed)
deriveRoundOutcome(won, lost, guesses)

// State machine helpers
scheduleStarterCoachHint()
clearAllRoundTimers()
resetRoundTracking(result)
```

But keep the main `newGame()` and `handleKey('Enter')` paths in app-main.js.

---

## Cross-Module Dependencies (Complete Picture)

```
MODULE 1 (Word Helpers)
  └─ Called by: Module 5 (newGame)
  └─ Calls: WQGame.startGame
  └─ Side effects: localStorage (shuffle bag)

MODULE 2 (Score & Stats)
  └─ Called by: Module 5 (round complete)
  └─ Calls: localStorage
  └─ Side effects: streak state, DOM (streak display)

MODULE 3 (UI Rendering)
  └─ Called by: Module 4 (input handlers) and Module 5 (game flow)
  └─ Calls: WQUI functions
  └─ Dependencies: timing callbacks for animation coordination

MODULE 4 (Input Handling)
  └─ Called by: Keyboard/button event listeners
  └─ Calls: WQGame, WQUI, Module 2 (for scoring), Module 5 (for orchestration)
  └─ Challenges: Animation timing, checkpoint callbacks

MODULE 5 (Game Flow)
  └─ Called by: User clicks "New Game"
  └─ Calls: ALL other modules
  └─ Orchestrator: Coordinates timing, state machine, side effects
  └─ Dependencies: Module 1, 2, 3, 4, plus external integrations (teacher, diagnostics)
```

---

## Critical Timing Considerations

### Animation Queuing

```javascript
// These are NOT instant — they take time
WQUI.revealRow(..., callback)  // ~520ms before callback fires
WQUI.celebrateWinRow(...)      // Confetti animation ~1000ms

// So the choreography is:
const startTime = performance.now();
WQUI.revealRow(..., () => {
  // ~520ms later
  WQUI.updateKeyboard();
  if (result.won) {
    WQUI.celebrateWinRow(row, wordLength);  // Starts confetti

    setTimeout(() => {
      // ~1000ms later, after confetti settles
      WQUI.showModal(result);  // Show game-over modal
    }, 1000);
  }
});
```

### Asynchronous Operations

```javascript
// Some operations are async and may take 0-2 seconds
awardQuestProgress(result, metrics)   // API call (if teacher mode)
trackRoundForReview(result)            // API call (if spaced rep enabled)
publishWordQuestSignals(signals)       // Diagnostics API

// But user can click "Next Word" immediately after modal shows
// So we DON'T wait for these; they happen in background
```

---

## Testing Strategy for Modules 3, 4, 5

### Module 3 (UI) — Unit Tests
```bash
# Test tile rendering
# Test keyboard display
# Test animation timing
npm run test:ui-module
```

### Module 4 (Input) — Integration Tests
```bash
# Test letter input → game state → UI update
# Test Enter key → validation → submit
# Test keyboard constraints
npm run test:input-handlers
```

### Module 5 (Game Flow) — End-to-End Tests
```bash
# Full round: start game → make guesses → win/lose
# Test all bailout paths (first-run, mission lab, voice required, etc.)
# Test timer coordination (support modal, idle watcher, etc.)
npm run test:game-flow
```

---

## Summary: Extraction Strategy

| Module | Size | Difficulty | Extract? | Recommendation |
|--------|------|-----------|----------|-----------------|
| **3: UI Rendering** | 552 | 🟢 Easy | ✅ Already separate | Already in js/ui.js — no work needed |
| **4: Input Handling** | 500+ | 🟡 Medium | ⚠️ Partial | Extract helpers only; keep main flow in app-main.js |
| **5: Game Flow** | 1000+ | 🔴 Hard | ❌ No | Keep in app-main.js — it's the orchestrator |

**Pragmatic approach:**
1. ✅ Module 3 (WQUI) is already good — it's a reference implementation
2. ⚠️ Module 4: Extract validation helpers, keep event flow in app-main.js
3. ❌ Module 5: Keep as-is; it's the right place for orchestration

This avoids over-modularization and keeps the control flow transparent for future maintainers.
