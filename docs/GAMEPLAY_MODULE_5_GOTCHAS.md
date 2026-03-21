# Module 5: Common Gotchas & Failure Patterns

**Status:** Reference guide for debugging during extraction

---

## Gotcha 1: Timer References Become Stale

### The Problem
When you extract timer-related functions, timer variables must stay accessible to the functions that check/clear them.

### Real Scenario
```javascript
// app-main.js
var revealAutoAdvanceTimer = 0;
var revealAutoCountdownTimer = 0;

// Extracted to app-game-flow-ui.js
export function clearRevealAutoAdvanceTimer() {
  // ❌ PROBLEM: Can't access revealAutoAdvanceTimer from app-main.js
  clearTimeout(revealAutoAdvanceTimer);  // undefined!
}
```

### Solution
**Option A (Recommended for now):** Keep timer management in app-main.js
```javascript
// app-main.js - KEEP THIS HERE
function clearRevealAutoAdvanceTimer() {
  if (revealAutoAdvanceTimer) clearTimeout(revealAutoAdvanceTimer);
  if (revealAutoCountdownTimer) clearInterval(revealAutoCountdownTimer);
  revealAutoAdvanceEndsAt = 0;
  const banner = _el('modal-auto-next-banner');
  if (banner) banner.classList.add('hidden');
}
```

**Option B (Later refactor):** Pass timer manager as dependency
```javascript
// app-game-flow-ui.js
export function clearRevealAutoAdvanceTimer(timerManager) {
  timerManager.clear();  // Delegate to manager
}

// app-main.js
const timerManager = {
  revealAutoAdvanceTimer: 0,
  revealAutoCountdownTimer: 0,
  clear() {
    if (this.revealAutoAdvanceTimer) clearTimeout(this.revealAutoAdvanceTimer);
    if (this.revealAutoCountdownTimer) clearInterval(this.revealAutoCountdownTimer);
  }
};
```

### Prevention
- Keep timer variables in same file as functions that modify them
- If splitting across files, use a "timer manager" object that both can access
- Add comments: `// ⚠️ revealAutoAdvanceTimer is in app-main.js, not exported`

---

## Gotcha 2: Animation Callback Timing

### The Problem
When Module 3 (UI) is extracted, animation timing callbacks might not fire in the right order.

### Real Scenario
```javascript
// Module 5 in app-main.js
function newGame() {
  WQUI.revealBoard({ animation: true });  // Starts 400ms animation
  openRevealModal();  // ❌ WRONG: Opens immediately, animation is behind
}

// Correct way:
function newGame() {
  WQUI.revealBoard({
    animation: true,
    onComplete: () => {
      openRevealModal();  // ✅ RIGHT: Opens after animation
    }
  });
}
```

### Solution
Before extracting Module 3, ensure all animation functions export `onComplete` callbacks:

```javascript
// Module 3: app-game-ui.js
export function revealBoard(options = {}) {
  const { animation = true, onComplete = () => {} } = options;

  if (animation) {
    // Start animation, then call callback
    animateBoardReveal(() => {
      onComplete();
    });
  } else {
    onComplete();  // Call immediately if no animation
  }
}
```

Then Module 5 can use it safely:
```javascript
// Module 5 waiting for callback
revealBoard({
  animation: true,
  onComplete: () => {
    // Safe to advance now
    newGame();
  }
});
```

### Prevention
- Every WQUI animation call must have `onComplete` callback
- Document which functions are async (animation)
- Add comments: `// Waits for board reveal animation before continuing`

---

## Gotcha 3: Telemetry Emission Order

### The Problem
If you extract functions that emit telemetry but call them in the wrong order, metrics will be wrong.

### Real Scenario
```javascript
// ❌ WRONG ORDER:
emitTelemetry('wq_round_end', { guesses: 3 });  // Round ends FIRST
updateScore(result);  // THEN update score

// Teacher sees: "Round ended with 3 guesses" but score wasn't actually updated yet
// Report shows: Round completed but final score is missing
```

### Correct Order (Must Stay in app-main.js)
```javascript
// ✅ CORRECT:
1. Guess made → emitTelemetry('wq_round_guess', { guess: 'S', correct: true });
2. Board updated → WQUI.updateBoard();
3. Check win → if (isWon) emitTelemetry('wq_round_end', { won: true });
4. Score updated → updateScore(result);
5. Session summary → emitTelemetry('wq_session_complete', { totalScore: 150 });
```

### Solution
**Keep all round orchestration + telemetry in app-main.js for Phase 1 & 2**

Only extract:
- Pure query functions (don't emit telemetry)
- UI helper functions (don't emit telemetry)
- Score calculations (return values, don't emit directly)

Keep in app-main.js:
- All `emitTelemetry()` calls
- Order of operations for round flow
- Decision points (win/loss/hint/skip)

### Prevention
- Add comments marking telemetry dependencies:
  ```javascript
  // ⚠️ TELEMETRY: This must emit BEFORE score is updated
  emitTelemetry('wq_round_guess', { guess: currentGuess, correct: isCorrect });
  ```
- Use a checklist before extracting:
  - [ ] Function contains `emitTelemetry()`? → Keep in app-main.js
  - [ ] Function depends on `emitTelemetry()` call order? → Keep in app-main.js
  - [ ] Function is pure (input → output)? → Can extract

---

## Gotcha 4: Voice Recording Blocks Auto-Advance

### The Problem
When you extract reveal auto-advance logic, the voice recording check might be lost.

### Real Scenario
```javascript
// Extracted to app-game-flow-ui.js
export function scheduleRevealAutoAdvance() {
  setTimeout(() => {
    newGame();  // ❌ WRONG: Doesn't check voiceIsRecording
  }, 3000);
}

// Teacher is recording a pronunciation check
// Auto-advance cuts off the recording mid-word
```

### Correct Way
```javascript
// app-main.js - KEEP HERE
function scheduleRevealAutoAdvance() {
  const tryAdvance = () => {
    if (voiceIsRecording) {
      // Retry in 900ms
      revealAutoAdvanceTimer = setTimeout(tryAdvance, 900);
      return;
    }
    // Safe to advance
    newGame();
  };

  revealAutoAdvanceTimer = setTimeout(tryAdvance, getRevealAutoNextSeconds() * 1000);
}
```

### Solution
**Keep `scheduleRevealAutoAdvance()` in app-main.js** where it can directly access `voiceIsRecording` flag.

If you must extract it later:
```javascript
// Module 5: app-game-flow.js
export function scheduleRevealAutoAdvance(options = {}) {
  const {
    getVoiceState = () => false,  // Caller provides voice state getter
    onAdvance = () => {},  // Caller provides callback
    delayMs = 3000
  } = options;

  const tryAdvance = () => {
    if (getVoiceState()) {
      // Still recording, retry
      return setTimeout(tryAdvance, 900);
    }
    onAdvance();  // Advance when safe
  };

  return setTimeout(tryAdvance, delayMs);
}

// app-main.js usage
revealAutoAdvanceTimer = scheduleRevealAutoAdvance({
  getVoiceState: () => voiceIsRecording,
  onAdvance: () => newGame(),
  delayMs: getRevealAutoNextSeconds() * 1000
});
```

### Prevention
- Document dependencies on global state:
  ```javascript
  // ⚠️ Depends on global: voiceIsRecording, revealAutoAdvanceTimer
  function scheduleRevealAutoAdvance() { ... }
  ```
- If you see "global variable check", it usually can't be extracted easily

---

## Gotcha 5: DOM Element IDs Change or Don't Exist

### The Problem
When you extract DOM-manipulation functions, element IDs might not exist in all contexts (e.g., during tests or on different pages).

### Real Scenario
```javascript
// Module 5: app-game-flow-ui.js
export function syncRevealMeaningHighlight(entry) {
  const wrap = document.getElementById('modal-meaning-highlight');
  const lineEl = document.getElementById('modal-meaning-highlight-line');

  if (!wrap || !lineEl) return;  // ✅ Good: Silent fail
  lineEl.textContent = entry.definition;
}

// Test runs, elements don't exist → function silently returns
// On different page, element ID is different → function silently returns
// Real bug goes unnoticed for weeks
```

### Solution
**Always check element existence before accessing:**
```javascript
export function syncRevealMeaningHighlight(entry) {
  const wrap = document.getElementById('modal-meaning-highlight');
  if (!wrap) {
    console.warn('Modal meaning highlight container not found');
    return;
  }

  const lineEl = wrap.querySelector('.meaning-line');
  if (!lineEl) {
    console.warn('Meaning line element not found inside container');
    return;
  }

  lineEl.textContent = entry.definition || '';
}
```

**Better yet, pass elements as parameters:**
```javascript
export function syncRevealMeaningHighlight(entry, containerEl = null) {
  if (!containerEl) {
    containerEl = document.getElementById('modal-meaning-highlight');
  }
  if (!containerEl) return;

  const lineEl = containerEl.querySelector('.meaning-line');
  if (!lineEl) return;

  lineEl.textContent = entry.definition || '';
}

// app-main.js usage
const modalWrap = _el('modal-meaning-highlight');
syncRevealMeaningHighlight(entry, modalWrap);
```

### Prevention
- Add safety comments:
  ```javascript
  // ⚠️ DOM: Requires modal-meaning-highlight and modal-meaning-highlight-line to exist
  ```
- Always: `if (!element) return;` before using elements
- Consider: Accept elements as parameters instead of querying inside function

---

## Gotcha 6: State Queries Return Stale Data

### The Problem
When you extract state query functions, the underlying state might change while the function reads it.

### Real Scenario
```javascript
// Module 5: app-game-flow-queries.js
export function getActiveMaxGuesses() {
  // ❌ PROBLEM: What if game state changes between reading state and reading pref?
  const stateMax = WQGame.getState()?.maxGuesses;
  const prefMax = prefs.guesses;

  // Race condition: stateMax is from 2 rounds ago
  return stateMax || prefMax;
}
```

### Solution
**For query functions, this is usually not a problem** because they're called immediately before use:

```javascript
// ✅ RIGHT: Called immediately when needed
const maxGuesses = getActiveMaxGuesses();
WQUI.updateMaxGuessesDisplay(maxGuesses);

// ❌ WRONG: Query result stored in variable, then used later
const maxGuesses = getActiveMaxGuesses();
// ... 3 seconds later ...
validateGuess(maxGuesses);  // stateMax might have changed!
```

### Solution: Query on-demand
```javascript
// Module 5: app-game-flow-queries.js
export function getActiveMaxGuesses() {
  // Always read current state
  const stateMax = WQGame.getState()?.maxGuesses;
  const prefMax = prefs.guesses;
  return stateMax || prefMax;
}

// app-main.js: Call every time you need the value
function handleGuess(guess) {
  const maxGuesses = getActiveMaxGuesses();  // Fresh read
  if (guessCount >= maxGuesses) {
    // Loss condition
  }
}
```

### Prevention
- Document that queries return point-in-time snapshots:
  ```javascript
  // Returns current max guesses (from game state or prefs, whichever is set)
  // Call every time you need the value — don't cache results
  export function getActiveMaxGuesses() { ... }
  ```

---

## Gotcha 7: Missing Module Exports

### The Problem
When you extract functions into new modules, you forget to export them or forget to import them in app-main.js.

### Real Scenario
```javascript
// js/app-game-flow-queries.js
function getActiveMaxGuesses() { ... }  // ❌ NOT exported

// app-main.js
import { getActiveMaxGuesses } from './app-game-flow-queries.js';  // ❌ Fails: not exported
// Error: SyntaxError: The requested module does not provide an export named 'getActiveMaxGuesses'
```

### Solution
**Always export extracted functions:**
```javascript
// js/app-game-flow-queries.js
export function getActiveMaxGuesses() { ... }  // ✅ Exported

// app-main.js
import { getActiveMaxGuesses } from './app-game-flow-queries.js';  // ✅ Works
```

### Prevention
- Checklist before extracting:
  - [ ] Copied function to new file?
  - [ ] Added `export` keyword?
  - [ ] Added import statement in app-main.js?
  - [ ] Removed original function from app-main.js?
  - [ ] Ran `npm run guard:runtime`?

---

## Checklist: Before Extracting Any Module 5 Function

- [ ] Function is pure (no side effects)?
- [ ] Function doesn't emit telemetry?
- [ ] Function doesn't depend on global state (except reads)?
- [ ] Function doesn't create timers that others must check?
- [ ] All DOM elements are checked for existence?
- [ ] Function is exported with `export` keyword?
- [ ] Function is imported in app-main.js?
- [ ] All call sites updated to use imported function?
- [ ] `npm run guard:runtime` passes?
- [ ] Manual browser test passes (if DOM-related)?

---

## Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Cannot find name 'functionName'` | Function not exported | Add `export` keyword |
| `Module not found` | Wrong import path | Check file path spelling |
| `undefined is not a function` | Function not imported | Add import statement |
| Element not updating | DOM element doesn't exist | Add existence check |
| Auto-advance hangs | `voiceIsRecording` not checked | Keep in app-main.js |
| Telemetry metrics wrong | Emission order changed | Keep orchestration in app-main.js |
| Feedback text not showing | `revealText` module not loaded | Load module before app-main |
| Animation timing broken | Missing `onComplete` callback | Add callbacks to WQUI functions |
| Timer keeps running | Timer ref not cleared | Keep timer logic in app-main.js |

---

*Last updated: 2026-03-20 by Claude during autonomous Module 5 analysis*
