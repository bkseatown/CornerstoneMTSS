# Module 4: Input Handling & Validation (Deep Dive)

**Status:** Comprehensive architecture guide for extracting input handlers from app-main.js

---

## Executive Summary

Module 4 is the **input layer** that captures keyboard/button events, validates guesses, and routes them to the game logic. It's complex because:

1. **Multiple input sources** — Physical keyboard + button clicks + game menu clicks
2. **Validation complexity** — Check duplicates, format, board state, phase
3. **Event coupling** — Handlers depend on game state and round phase
4. **Animation triggers** — Invalid guesses trigger shake animation
5. **Accessibility** — Keyboard focus management and tab order

**Extraction difficulty:** High (similar to Module 5, tied with game logic)

---

## Current Architecture

### Input Event Flow

```
Player Action
├─ Physical keyboard (keydown event)
│  ├─ Letter key (A-Z, a-z)
│  │  └─→ validateGuess() → updateBoard() → checkWin()
│  ├─ Backspace
│  │  └─→ removeLastLetter() → updateBoard()
│  ├─ Enter
│  │  └─→ submitGuess() → validation → updateBoard() or shakeRow()
│  └─ Function keys (F7-F12)
│     └─→ musicPlayer controls, etc.
│
├─ Button clicks
│  ├─ .keyboard-key (visual keyboard)
│  │  └─→ Simulate keypress → same flow as physical keyboard
│  ├─ #hint-button
│  │  └─→ revealHint() → updateBoard()
│  ├─ #skip-button
│  │  └─→ skipWord() → newGame()
│  └─ #next-word (in reveal modal)
│     └─→ newGame()
│
└─ Game state changes
   ├─ Word loaded
   │  └─→ focusKeyboard(), updateKeyboardLayout()
   └─ Settings changed
      └─→ updateKeyboardLayout(), rebuildKeyboard()
```

### Validation Pipeline

```
keydown event "S"
  ↓
1. FILTER: Is this a letter? (A-Z)
   ├─ YES → continue
   └─ NO (punctuation, symbols) → ignore
  ↓
2. NORMALIZE: Convert to uppercase
   ├─ "s" → "S"
  ↓
3. STATE CHECK: Is a round actively playing?
   ├─ NO (reveal modal open, no game) → ignore/show toast
   └─ YES → continue
  ↓
4. DUPLICATE CHECK: Has "S" already been tested?
   ├─ YES → showToast("Already tested S") → shakeRow()
   └─ NO → continue
  ↓
5. FORMAT CHECK: Is "S" valid (not punctuation)?
   ├─ NO → ignore
   └─ YES → continue
  ↓
6. ACCEPT: Add "S" to guesses
   ├─→ updateBoard("S")
   ├─→ checkWin()
   ├─→ emitTelemetry('wq_guess', { guess: 'S', correct: inWord })
  ↓
7. DISPLAY: Update keyboard highlighting
   ├─→ updateKeyboard()
  ↓
DONE
```

---

## Key Functions to Extract

### Validation Helpers (LOW RISK)

- `isValidLetter(char)` — Check if character is A-Z
  - Pure function, no side effects
  - Safe to extract ✅

- `normalizeLetter(char)` — Convert to uppercase
  - Pure function
  - Safe to extract ✅

- `isDuplicateLetter(letter, guessesArray)` — Check if already tested
  - Pure function (reads array, returns boolean)
  - Safe to extract ✅

- `isLetterInWord(letter, word)` — Check if letter exists in target
  - Pure function
  - Safe to extract ✅

- `getLetterState(letter, guesses, word)` — Determine visual state
  - Pure function
  - Returns: 'correct', 'wrong', 'tested', 'empty'
  - Safe to extract ✅

### Event Handlers (HIGH RISK)

- `handleKeyDown(event)` — Main keyboard event listener
  - **Coupling:** Reads game state, decides what to do
  - **Coupling:** Calls multiple functions (validateGuess, updateBoard, shake, etc.)
  - **Critical:** Must check round phase before processing
  - Hard to extract (orchestrates multiple steps) ⚠️⚠️⚠️

- `handleKeyboardClick(event)` — Simulate keyboard from button click
  - Depends on: Physical keyboard layout preference
  - Routes to: `handleKeyDown()` logic
  - Medium risk ⚠️

- `handleHintClick()` — Hint button click
  - Depends on: Game state (hints remaining)
  - Calls: Hint reveal logic
  - Medium risk ⚠️

- `handleSkipClick()` — Skip button click
  - Calls: newGame() (in app-main.js)
  - Low risk ✅

### Input State Management (MEDIUM RISK)

- `getCurrentGuess()` — Get current row's incomplete guess
  - Reads: DOM tiles in current row
  - Returns: String like "ST-"
  - Medium risk ⚠️

- `getCurrentRowIndex()` — Get which row we're on
  - Reads: guesses array length
  - Returns: Number
  - Pure function ✅

- `canMakeGuess(letter, gameState)` — Check if guess is allowed
  - Pure function
  - Checks: Phase, duplicates, letter validity
  - Safe to extract ✅

- `clearCurrentRow()` — Reset current row display
  - DOM manipulation, no side effects
  - Safe to extract ✅

---

## Critical Coupling Points (DO NOT BREAK)

### 1. Input Must Check Round Phase

**Requirement:** Input handlers must not accept guesses when game isn't actively playing.

**Current implementation:**
```javascript
function handleKeyDown(event) {
  // ✅ CHECK PHASE FIRST
  if (!isRoundActive()) {
    // Ignore input if reveal modal is open, no game loaded, etc.
    return;
  }

  const letter = normalizeLetter(event.key);
  if (!isValidLetter(letter)) return;

  // Continue with validation...
}

function isRoundActive() {
  const state = WQGame.getState();
  return !!(state && !state.revealed);  // Only valid when round isn't revealed
}
```

**If phase check is removed:**
- Player can type during reveal modal (adds letters to old board)
- Input appears to work but doesn't update the modal
- Player gets confused about game state

**Extraction rule:** `isRoundActive()` or equivalent must be called first in all event handlers

### 2. Validation Order Matters

**Requirement:** Validation checks must happen in exact order, or false negatives occur.

**Correct order:**
```
1. Is letter?        ← Filters 99% of invalid input fast
2. Duplicate?        ← Most common error (show toast)
3. In word?          ← Categorizes correct vs wrong
4. Format valid?     ← Security check
```

**If order changes:**
```javascript
// ❌ WRONG ORDER:
1. Is in word?       ← Requires knowing the word (secret leak risk?)
2. Format valid?     ← Slow security check first
3. Is letter?        ← Should be first (fastest)
4. Duplicate?        ← Should be before categorizing
```

**Extraction rule:** Keep validation order as documented

### 3. Input Must Not Touch Game State Directly

**Requirement:** Input handlers call game logic but don't modify state themselves.

**Current (correct):**
```javascript
// Module 4 (Input)
function handleGuess(letter) {
  // Validation only
  if (isDuplicate(letter)) return { valid: false, reason: 'duplicate' };

  // Return validated guess
  return { valid: true, letter };
}

// Module 5 (Game Logic) - handles the actual state update
function processGuess(validatedGuess) {
  state.guesses.push(validatedGuess.letter);  // Game updates state
  // ...
}
```

**If input tries to update state:**
```javascript
// ❌ WRONG:
function handleGuess(letter) {
  state.guesses.push(letter);  // ❌ Input shouldn't touch state
  // ...
}
```

**Why this matters:**
- Telemetry order depends on state updates happening in game logic, not input
- Testing becomes impossible (input + game logic mixed)
- Debugging is hard (who modified state?)

**Extraction rule:** Module 4 validates and notifies; Module 5/game logic updates state

### 4. Shake Animation Timing Couples Input to UI

**Requirement:** When invalid guess is detected, shake animation must play immediately.

**Current coupling:**
```javascript
function handleKeyDown(event) {
  const letter = normalizeLetter(event.key);

  if (isDuplicate(letter)) {
    // ✅ Show toast AND trigger animation
    showToast(`Already tested ${letter}`);
    WQUI.shakeRow(getCurrentRowIndex(), () => {
      // Shake complete
    });
    return;
  }

  // Continue with valid guess...
}
```

**If shake is removed:**
- Invalid guess just disappears silently
- Player doesn't get feedback
- Looks like input is broken

**If shake is delayed:**
- Animation feels sluggish
- Player types another letter before shake starts

**Extraction rule:** Shake animation must fire immediately on invalid guess

### 5. Keyboard Layout Preference Affects Input

**Requirement:** Input handlers must respect keyboard layout preference (QWERTY vs Alphabet).

**Current coupling:**
```javascript
function buildKeyboard() {
  const layout = normalizeKeyboardLayout(prefs.keyboardLayout);
  // QWERTY: A-Z in qwerty order
  // Alphabet: A-Z in alphabetical order
}

// When player clicks keyboard button:
function handleKeyboardClick(event) {
  const letter = event.target.getAttribute('data-key');
  // Works same regardless of layout
}
```

**If layout preference is ignored:**
- Visual keyboard shows one order, but clicking doesn't work as expected
- Confusing for young learners using alphabet layout

**Extraction rule:** Keyboard layout preference must be consistent throughout Module 4

---

## Event Handler Architecture

### Global Event Listeners

These attach to document/window and listen for all events:

```javascript
// Attach once on app init
document.addEventListener('keydown', (event) => {
  handleKeyDown(event);
});

// Keyboard button click delegation
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('key')) {
    handleKeyboardClick(event);
  }
});

// Hint button
_el('phonics-clue-open-btn')?.addEventListener('click', () => {
  handleHintClick();
});

// Skip button
_el('button-skip')?.addEventListener('click', () => {
  handleSkipClick();
});
```

### Event Delegation Pattern

Instead of adding listeners to each keyboard key individually:
```javascript
// ❌ BAD: 26 event listeners (one per letter)
letters.forEach(letter => {
  _el(`key-${letter}`)?.addEventListener('click', () => {
    handleKeyboardClick(letter);
  });
});

// ✅ GOOD: 1 listener for all (event delegation)
document.addEventListener('click', (event) => {
  if (event.target.closest('.key')) {
    handleKeyboardClick(event);
  }
});
```

**Why delegation matters:** When keyboard is rebuilt, old listeners are still attached, causing memory leaks and double-firing

---

## Data Structures

### Validation Result
```javascript
{
  valid: true,           // Is guess valid?
  letter: "S",           // The letter
  reason: null,          // If invalid, why? ("duplicate", "invalid_char", etc.)
  isCorrect: true,       // Is letter in target word?
  state: "correct"       // Visual state for keyboard
}
```

### Keyboard Layout Config
```javascript
{
  layout: "standard",     // "standard" (QWERTY) or "alphabet"
  keys: [
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
    "A", "S", "D", "F", "G", "H", "J", "K", "L",
    "Z", "X", "C", "V", "B", "N", "M"
  ],
  rows: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ]
}
```

### Keyboard State
```javascript
{
  layout: "standard",
  caseMode: "lower",     // "lower" or "upper"
  letterStates: {
    "A": "correct",      // "correct", "wrong", "tested", "empty"
    "B": "wrong",
    "C": "empty",
    ...
  }
}
```

---

## Testing Strategy

### Unit Tests (Validation)

```javascript
describe('Module 4: Input Validation', () => {
  describe('isValidLetter', () => {
    test('accepts A-Z', () => {
      expect(isValidLetter('A')).toBe(true);
      expect(isValidLetter('z')).toBe(true);
    });

    test('rejects numbers and punctuation', () => {
      expect(isValidLetter('1')).toBe(false);
      expect(isValidLetter('!')).toBe(false);
    });
  });

  describe('isDuplicateLetter', () => {
    test('detects repeated guesses', () => {
      const guesses = ['S', 'T', 'A'];
      expect(isDuplicateLetter('S', guesses)).toBe(true);
      expect(isDuplicateLetter('R', guesses)).toBe(false);
    });
  });

  describe('canMakeGuess', () => {
    test('allows valid letter in active round', () => {
      const state = { word: 'STAR', won: false, revealed: false };
      const guesses = ['S'];
      expect(canMakeGuess('T', state, guesses)).toBe(true);
    });

    test('blocks duplicate letters', () => {
      const state = { word: 'STAR', won: false, revealed: false };
      const guesses = ['S'];
      expect(canMakeGuess('S', state, guesses)).toBe(false);
    });

    test('blocks input when game isn\'t active', () => {
      const state = { word: 'STAR', won: true, revealed: true };
      const guesses = ['S', 'T', 'A', 'R'];
      expect(canMakeGuess('X', state, guesses)).toBe(false);
    });
  });
});
```

### Integration Tests (Event Flow)

```javascript
describe('Event Handling', () => {
  test('physical keyboard letter triggers guess', async () => {
    setupGameRound({ word: 'STAR' });

    const event = new KeyboardEvent('keydown', { key: 's' });
    document.dispatchEvent(event);

    await waitForAnimation();
    const state = WQGame.getState();
    expect(state.guesses).toContain('S');
  });

  test('duplicate letter shows toast and shakes row', async () => {
    setupGameRound({ word: 'STAR' });
    simulateGuess('S');  // First guess of S
    await waitForAnimation();

    simulateGuess('S');  // Try S again
    await waitForAnimation();

    expect(getLastToast()).toContain('Already tested S');
    expect(getLastAnimation()).toBe('shake');
  });

  test('skip button advances to next word', async () => {
    const initialWord = setupGameRound({ word: 'STAR' }).word;

    simulateSkipClick();
    await waitForAnimation();

    const newWord = WQGame.getState().word;
    expect(newWord).not.toBe(initialWord);
  });
});
```

---

## Extraction Phases

### Phase 1: Validation Helpers (LOW RISK, 1 hour)

```
1. Extract: isValidLetter(char)
2. Extract: normalizeLetter(char)
3. Extract: isDuplicateLetter(letter, guesses)
4. Extract: isLetterInWord(letter, word)
5. Extract: getLetterState(letter, guesses, word)
6. Extract: canMakeGuess(letter, gameState, guesses)
7. Run: npm run guard:runtime
```

### Phase 2: Input State (MEDIUM RISK, 1 hour)

```
8. Extract: getCurrentGuess()
9. Extract: getCurrentRowIndex()
10. Extract: clearCurrentRow()
11. Extract: focusKeyboard()
12. Run: npm run guard:runtime + test keyboard focus
```

### Phase 3: Event Handlers (HIGH RISK, 2-3 hours)

```
13. Extract: handleKeyDown(event)  [MOST COMPLEX]
14. Extract: handleKeyboardClick(event)
15. Extract: handleHintClick()
16. Extract: handleSkipClick()
17. Verify all event listeners still attach correctly
18. Run: npm run guard:runtime + full input test
```

---

## Known Issues & Workarounds

### Issue 1: Event Listeners Must Reattach on Keyboard Rebuild

**Problem:** When keyboard layout changes, old listeners still exist if not cleaned up.

**Current (correct):**
```javascript
function buildKeyboard() {
  // Remove old event listener
  document.removeEventListener('click', handleKeyboardClick);

  // Rebuild keyboard HTML
  const newKeyboard = createNewKeyboard();

  // Reattach listener
  document.addEventListener('click', (event) => {
    if (event.target.closest('.key')) {
      handleKeyboardClick(event);
    }
  });
}
```

**Workaround:** Use event delegation (click on parent) instead of individual listeners

### Issue 2: Phase Check Must Be First

**Problem:** If you check duplicate before checking if round is active, you leak game state.

**Wrong order:**
```javascript
function handleKeyDown(event) {
  if (isDuplicate(letter)) {  // Reveals previous game state
    showToast('Already tested');
    return;
  }
  if (!isRoundActive()) {     // Should be first!
    return;
  }
}
```

**Correct order:**
```javascript
function handleKeyDown(event) {
  if (!isRoundActive()) {     // First check
    return;
  }
  if (isDuplicate(letter)) {  // Only then validate
    showToast('Already tested');
    return;
  }
}
```

---

## Dependency Graph

```
Module 4: Input Handling
├─ Imports
│  ├─ DOM (read/write)
│  ├─ Game state (read only - WQGame.getState())
│  └─ Module 3 (UI) → shakeRow(), showToast()
│
├─ Called by
│  └─ DOM event listeners (keydown, click)
│  └─ app-main.js (rebuild keyboard)
│
└─ Calls
   ├─ Module 3 (UI) → shakeRow(), updateKeyboard()
   └─ Module 5 (Game Logic) → processGuess() [indirect via app-main]
```

---

## Summary: Extract vs Keep

| Function | Extract? | Why |
|----------|----------|-----|
| `isValidLetter()` | ✅ YES | Pure function |
| `normalizeLetter()` | ✅ YES | Pure function |
| `isDuplicateLetter()` | ✅ YES | Pure function |
| `isLetterInWord()` | ✅ YES | Pure function |
| `getLetterState()` | ✅ YES | Pure function |
| `canMakeGuess()` | ✅ YES | Pure function with state check |
| `getCurrentGuess()` | ✅ YES | DOM read, no side effects |
| `getCurrentRowIndex()` | ✅ YES | Pure calculation |
| `clearCurrentRow()` | ✅ YES | DOM manipulation, isolated |
| `handleKeyDown()` | ✅ YES | Can extract (orchestrates but doesn't mutate state) |
| `handleKeyboardClick()` | ✅ YES | Can extract (similar to handleKeyDown) |
| `handleHintClick()` | ✅ YES | Can extract (routes to game logic) |
| `handleSkipClick()` | ✅ YES | Can extract (routes to newGame) |

**All input functions are extractable, but event handler orchestration is complex.**

---

*Last updated: 2026-03-20 by Claude during autonomous Module 3 & 4 analysis*
