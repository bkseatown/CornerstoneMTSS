# Module 5: Game Flow & State Machine (Deep Dive)

**Status:** Comprehensive architecture guide for extracting the game orchestration layer from app-main.js

---

## Executive Summary

Module 5 is the **orchestration and state machine** that coordinates rounds from word load through reveal. It's the most complex extraction because:

1. **Branching state paths** — 8+ different round outcomes (win, loss, hint, reveal, skip, quit, timeout)
2. **Animation timing coupling** — Round transitions depend on animation callbacks
3. **Telemetry + side effects** — Must emit in exact order; miss one and metrics are wrong
4. **Input validation coupling** — Keyboard input is valid only in specific round phases
5. **Recovery paths** — Failed rounds must rewind cleanly or advance to next round

---

## Current Architecture (in app-main.js)

### Round State Structure

```javascript
// Primary round state (managed by WQGame)
{
  word: "STRING",           // The target word (uppercase)
  wordLength: 5,            // Length of word
  maxGuesses: 6,            // Max attempts allowed
  guesses: ["GUESS1", "GUESS2"],  // Array of attempts (uppercase)
  correct: "ST---",         // Current board state (revealed correct letters)
  won: false,               // Did the player win?
  hintTaken: false,         // Was a hint used?
  revealStartTime: 0,       // Timestamp when reveal modal opened
  revealed: false           // Is the answer revealed?
}
```

### Round Lifecycle (8 Branching Paths)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INIT: Load word → build board → set up input handlers   │
│    ↓ (Phase: "playing")                                     │
├─────────────────────────────────────────────────────────────┤
│ 2. PLAY LOOP: Listen for keyboard/button input              │
│    ├─→ PATH A: Valid guess                                  │
│    │    ├─→ Mark letters on board                           │
│    │    ├─→ Update guesses array                            │
│    │    ├─→ Check win condition                             │
│    │    │    ├─→ YES: WIN path (→ 3a)                       │
│    │    │    └─→ NO: Continue or loss? (→ 3b/c)             │
│    │    └─→ Emit telemetry (guess, score, etc)              │
│    │                                                         │
│    ├─→ PATH B: Invalid guess (duplicate, wrong format)      │
│    │    ├─→ Show toast "Already tested X"                   │
│    │    └─→ Stay in play loop                               │
│    │                                                         │
│    ├─→ PATH C: Hint requested                               │
│    │    ├─→ Check hint eligibility                          │
│    │    ├─→ Reveal hint tile                                │
│    │    ├─→ Mark hintTaken = true                           │
│    │    └─→ Emit hint telemetry                             │
│    │                                                         │
│    ├─→ PATH D: Skip/Quit                                    │
│    │    ├─→ Clear play state                                │
│    │    ├─→ Advance to next round                           │
│    │    └─→ Emit skip telemetry                             │
│    │                                                         │
│    └─→ PATH E: Timeout (team mode timer expires)            │
│         ├─→ Force turn end                                  │
│         ├─→ Switch team                                     │
│         └─→ Emit timeout telemetry                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 3. REVEAL: Open modal → show definition → wait/auto-next    │
│    ├─→ 3a: WIN reveal                                       │
│    │    ├─→ Play win animation                              │
│    │    ├─→ Show feedback ("Great job!")                    │
│    │    ├─→ Update score (correct guesses bonus)            │
│    │    └─→ Schedule auto-advance                           │
│    │                                                         │
│    └─→ 3b: LOSS reveal                                      │
│         ├─→ Play loss animation                             │
│         ├─→ Reveal correct answer                           │
│         ├─→ Show feedback ("Keep trying")                   │
│         ├─→ Update score (penalty)                          │
│         └─→ Schedule auto-advance                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 4. ROUND CLEANUP: (Happens AFTER reveal modal closes)       │
│    ├─→ Clear board state                                    │
│    ├─→ Clear keyboard state                                 │
│    ├─→ Update session summary                               │
│    ├─→ Reset input handlers                                 │
│    ├─→ Emit round-complete telemetry (with final score)     │
│    └─→ Ready for next round                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Functions to Extract

### Orchestration Layer (stays in app-main.js for now)

These coordinate the round but depend on external modules:

- `newGame()` — Initialize next round (MUST stay in app-main.js for now)
  - Calls Module 1 (word selection)
  - Calls Module 3 (board rendering)
  - Calls Module 4 (input setup)
  - Emits telemetry

- `scheduleRevealAutoAdvance()` — Auto-advance to next round after reveal
  - Manages countdown timer
  - Waits for voice practice to complete
  - Calls `newGame()` when ready

- `clearRevealAutoAdvanceTimer()` — Stop auto-advance timer
  - Cleanup function, safe to extract

### Reveal & Feedback (Extract to Module 5)

- `getRevealFeedbackCopy(result)` — Get win/loss feedback text
  - Pure function, safe to extract
  - Depends on revealText module

- `getRevealPacingPreset()` — Get reveal timing config
  - Pure function, safe to extract
  - Reads prefs, returns timing object

- `syncRevealMeaningHighlight(nextEntry)` — Update meaning display
  - DOM manipulation, safe to extract
  - Depends on revealText module

- `syncRevealReadCue(nextEntry)` — Update phonetic cue display
  - DOM manipulation, safe to extract

### State Queries (Extract to Module 5)

- `getActiveMaxGuesses()` — Get current max allowed guesses
  - Pure function, depends on game state + prefs
  - Safe to extract

- `shouldIncludeFunInMeaning()` — Check if "fun" is enabled in definition
  - Pure function, reads DOM + prefs
  - Safe to extract

---

## Critical Coupling Points (DO NOT BREAK)

### 1. Telemetry Emission Must Happen in Exact Order

**Current sequence in `newGame()` and related:**
```
1. Round starts (emit: wq_round_start)
2. Guess made (emit: wq_round_guess, guess_accuracy)
3. Hint taken (emit: wq_hint_used)
4. Round ends (emit: wq_round_end, guess_count, accuracy)
5. Session summary updated (emit: wq_session_complete)
```

**If order changes:**
- Session summary will report wrong metrics (telemetry won't match actual gameplay)
- Analytics dashboards will show incorrect stats
- Teacher reports will be unreliable

**Keep in app-main.js:** All `emitTelemetry()` calls in round orchestration

### 2. Round Cleanup Must Happen AFTER Reveal Modal Closes

**Current sequence:**
```
1. Player sees reveal modal (definition, feedback)
2. Auto-advance timer counts down (or manual next word click)
3. Modal closes
4. Board/keyboard cleared (cleanup)
5. New word loads (newGame)
```

**If cleanup happens too early:**
- Player might see old board/keyboard briefly while modal is still open
- Input handlers could fire on old state
- Animation callbacks might reference cleared DOM

**Keep in app-main.js:** Round cleanup in `newGame()` initialization

### 3. Input Validation Depends on Round Phase

Input handlers check:
- Is a round actively playing? (phase === "playing")
- Has the player already won/lost? (round.won/revealed)
- Is this guess valid? (not duplicate, correct format, etc.)

**If input handlers are extracted without phase checking:**
- Guesses after win/loss would be accepted
- Keyboard input during reveal would affect the board

**Action:** Module 4 (Input) must have reference to `WQGame.getState()` for phase validation

### 4. Voice Practice Blocks Auto-Advance

**Current coupling:**
```javascript
function scheduleRevealAutoAdvance() {
  ...
  const tryAdvance = () => {
    if (voiceIsRecording) {
      revealAutoAdvanceTimer = setTimeout(tryAdvance, 900);  // Wait 900ms, retry
      return;
    }
    newGame();  // Advance when ready
  };
}
```

**If voice check is removed:**
- Auto-advance would interrupt voice recording
- Voice audio would cut off mid-word

**Keep in app-main.js:** Voice recording checks in reveal auto-advance

---

## Animation Timing Dependencies

### Board Reveal Animation

Sequence:
1. Board tiles start hidden
2. Correct letters fade in (200ms)
3. Incorrect letters fade in (300ms)
4. Win confetti plays (if enabled, ~800ms)
5. Modal opens

**Dependency:** Module 3 (UI rendering) emits callback when animation completes
**Module 5 must wait for:** `onBoardRevealComplete` callback before moving to next round

### Hint Reveal Animation

Sequence:
1. Hint tile begins hidden
2. Hint tile fades in (150ms)
3. Player continues playing

**Dependency:** Module 3 emits `onHintTileRevealed` callback
**Module 5 must handle:** Can start input immediately after callback

### Duplicate Letter Toast

Special case: When player tries to use a letter already tested, show a toast.

**Current location:** In app-main.js (duplicate validation logic)
**Why it stays:** Couples directly to current board state + guesses array
**Extract only if:** Module 3 exposes `isLetterTested(letter)` query

---

## Data Structures to Export from Module 5

```javascript
export const GameFlowModule = {
  // State queries
  getActiveMaxGuesses,
  shouldIncludeFunInMeaning,
  getRevealPacingPreset,

  // Reveal helpers
  getRevealFeedbackCopy,
  syncRevealMeaningHighlight,
  syncRevealReadCue,

  // Cleanup
  clearRevealAutoAdvanceTimer,

  // Orchestration (stays in app-main for now)
  // newGame,
  // scheduleRevealAutoAdvance,
};
```

---

## Testing Strategy for Module 5

### Unit Tests (Focused)

```javascript
describe('GameFlowModule', () => {
  describe('getActiveMaxGuesses', () => {
    test('returns state max if state.maxGuesses is set', () => {
      WQGame.getState = () => ({ maxGuesses: 8 });
      expect(getActiveMaxGuesses()).toBe(8);
    });

    test('falls back to pref max if state max is not set', () => {
      WQGame.getState = () => ({ maxGuesses: 0 });
      expect(getActiveMaxGuesses()).toBe(6); // from prefs
    });

    test('never returns less than 1', () => {
      WQGame.getState = () => ({ maxGuesses: -5 });
      expect(getActiveMaxGuesses()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRevealFeedbackCopy', () => {
    test('returns different feedback for win vs loss', () => {
      const win = getRevealFeedbackCopy({ won: true });
      const loss = getRevealFeedbackCopy({ won: false });
      expect(win.lead).not.toEqual(loss.lead);
    });

    test('includes coaching text when available', () => {
      const feedback = getRevealFeedbackCopy({ won: false });
      expect(feedback).toHaveProperty('coach');
      expect(typeof feedback.coach).toBe('string');
    });
  });
});
```

### Integration Tests (Full Round)

These MUST run with actual DOM + actual game state:

```javascript
describe('Full Round Flow', () => {
  test('Win path: word load → guesses → win → reveal → cleanup', async () => {
    // 1. Load word
    newGame({ word: 'STAR' });
    expect(WQGame.getState().word).toBe('STAR');

    // 2. Make guess
    simulateKeyboardInput('S');
    expect(WQGame.getState().guesses).toContain('S');

    // 3. Win condition
    simulateKeyboardInput('T');
    simulateKeyboardInput('A');
    simulateKeyboardInput('R');
    expect(WQGame.getState().won).toBe(true);

    // 4. Reveal modal opens
    expect(_el('modal-overlay')).not.toHaveClass('hidden');

    // 5. Auto-advance starts
    await waitMs(100);
    expect(revealAutoAdvanceTimer).toBeGreaterThan(0);

    // 6. Cleanup happens
    await waitMs(5000); // Wait for auto-advance
    expect(WQGame.getState().word).not.toBe('STAR'); // New word loaded
  });

  test('Loss path: guesses exhausted → reveal → cleanup', async () => {
    newGame({ word: 'STAR', maxGuesses: 2 });

    // Make 2 wrong guesses
    simulateKeyboardInput('Z');
    simulateKeyboardInput('X');

    expect(WQGame.getState().won).toBe(false);
    expect(_el('modal-overlay')).not.toHaveClass('hidden'); // Reveal modal

    // Wait for cleanup
    await waitMs(5000);
    expect(WQGame.getState().word).not.toBe('STAR');
  });

  test('Hint path: hint taken mid-round, game continues', async () => {
    newGame({ word: 'STAR' });
    simulateHintClick();

    expect(WQGame.getState().hintTaken).toBe(true);
    expect(WQGame.getState().won).toBe(false); // Game didn't end

    // Can still guess
    simulateKeyboardInput('S');
    expect(WQGame.getState().guesses).toContain('S');
  });

  test('Voice blocks auto-advance in reveal', async () => {
    // ... setup win ...
    voiceIsRecording = true;
    scheduleRevealAutoAdvance();

    await waitMs(1000);
    expect(WQGame.getState().word).toBe('STAR'); // Still same word

    voiceIsRecording = false;
    await waitMs(5000);
    expect(WQGame.getState().word).not.toBe('STAR'); // Now advanced
  });
});
```

---

## Extraction Sequence (When Ready)

### Phase 1: Low-Risk State Queries
```
1. Extract: getActiveMaxGuesses
2. Extract: shouldIncludeFunInMeaning
3. Extract: getRevealPacingPreset
4. Extract: trimPromptText
5. Run: npm run guard:runtime (check for regressions)
```

### Phase 2: Reveal Helpers
```
6. Extract: getRevealFeedbackCopy
7. Extract: syncRevealMeaningHighlight
8. Extract: syncRevealReadCue
9. Extract: clearRevealAutoAdvanceTimer
10. Run: npm run guard:runtime + full round test
```

### Phase 3: Orchestration (HIGH RISK - Do Last)
```
NOT YET: newGame, scheduleRevealAutoAdvance
(These need Module 3/4 extracted first for safe refactoring)
```

---

## Gotchas & Failure Patterns

### Gotcha 1: Stale Game State References

**Problem:** If you extract a function that reads game state, and then later the state structure changes, the extracted function won't update automatically.

**Example:**
```javascript
// Extracted function
function getActiveMaxGuesses() {
  const stateMax = WQGame.getState()?.maxGuesses;  // ← Hardcoded field name
  return stateMax || DEFAULT_PREFS.guesses;
}

// Later, someone renames the field to 'maxAttempts'
// Now getActiveMaxGuesses() always returns default value (silent failure)
```

**Prevention:** Add comments marking external dependencies:
```javascript
// ⚠️ Depends on WQGame.getState().maxGuesses — update if field renamed
function getActiveMaxGuesses() { ... }
```

### Gotcha 2: Animation Callbacks Fire Asynchronously

**Problem:** If you extract UI rendering (Module 3) and forget to export callback emitters, animation timing will break.

**Example:**
```javascript
// Module 3 updates board visually
WQUI.revealBoard({ animation: true });  // Starts 400ms animation

// Module 5 tries to continue immediately
newGame();  // WRONG: Board animation still playing, modal flashes

// Correct: Wait for callback
WQUI.onBoardRevealComplete(() => { newGame(); });
```

**Prevention:** Every animation call must have a `onComplete` callback export from Module 3

### Gotcha 3: Telemetry Order Matters

**Problem:** If you split round logic across modules and emit telemetry in wrong order, metrics diverge from reality.

**Example:**
```javascript
// Module 4 emits guess telemetry
emitTelemetry('wq_guess', { guess: 'S', correct: true });

// Module 3 updates board
WQUI.updateBoard();

// Module 5 checks win condition
if (won) {
  // Oops, telemetry said "guess: S" but we already showed the win modal
  // Teacher sees guess log that doesn't match displayed board state
}
```

**Prevention:** Keep round orchestration (orchestration + telemetry emission order) in app-main.js

### Gotcha 4: Voice Recording State Lives in Multiple Places

**Problem:** `voiceIsRecording` flag is read by auto-advance logic, but voice recording state is managed elsewhere.

**If extracted incorrectly:** Auto-advance might not see voice flag updates

**Current coupling:**
```javascript
// app-main.js tracks voiceIsRecording
var voiceIsRecording = false;

// scheduleRevealAutoAdvance checks it
if (voiceIsRecording) {
  // delay auto-advance
}

// Voice module updates it
WQAudio.onRecordingStart(() => { voiceIsRecording = true; });
```

**Prevention:** Keep auto-advance in app-main.js where it can access the voice flag directly

---

## Summary: What to Extract vs What to Keep

| Code | Extract? | Why |
|------|----------|-----|
| `getActiveMaxGuesses()` | ✅ YES | Pure function, no side effects |
| `shouldIncludeFunInMeaning()` | ✅ YES | Pure function, reads DOM only |
| `getRevealFeedbackCopy()` | ✅ YES | Pure function, depends on revealText module |
| `syncRevealMeaningHighlight()` | ✅ YES | DOM helper, isolated concern |
| `getRevealPacingPreset()` | ✅ YES | Pure function, reads prefs |
| `clearRevealAutoAdvanceTimer()` | ✅ YES | Cleanup function, no dependencies |
| `scheduleRevealAutoAdvance()` | ❌ NO | Depends on voiceIsRecording flag, calls newGame() |
| `newGame()` | ❌ NO | Orchestration hub, too many dependencies |
| Round telemetry emission | ❌ NO | Order-sensitive, multi-module coordination |

---

## Next Steps

1. **Codex extracts Modules 1 & 2** (word helpers, score tracking)
2. **Review this deep-dive** with Codex when they finish Module 2
3. **Wait for Module 3 & 4 extraction** before pulling reveal orchestration
4. **Module 5 extraction is Phase 2** (after core gameplay tested with new modules)

---

*Last updated: 2026-03-20 by Claude during autonomous Module 5 analysis*
