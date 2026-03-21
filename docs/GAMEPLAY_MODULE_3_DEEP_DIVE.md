# Module 3: UI Rendering & Board Management (Deep Dive)

**Status:** Comprehensive architecture guide for extracting WQUI and board rendering from app-main.js

---

## Executive Summary

Module 3 is the **visual layer** that renders the game board, updates tiles, plays animations, and manages keyboard display. It's moderately complex because:

1. **Animation callback timing** — Tile reveals must complete before modal opens
2. **DOM state coupling** — Board HTML structure reflects game state
3. **Responsive layout** — Board dimensions depend on word length + max guesses
4. **Theme integration** — Colors and styles flow from theme system
5. **Accessibility** — Keyboard order and focus management are critical

**Extraction difficulty:** Medium (lower than Module 5, higher than Modules 1-2)

---

## Current Architecture

### WQUI Object Structure

The `WQUI` object in app-main.js contains all board/keyboard UI functions:

```javascript
window.WQUI = {
  // Board initialization
  buildBoard(wordLength, maxGuesses),
  calcLayout(wordLength, maxGuesses),

  // Tile updates
  updateCurrentRow(guess, wordLength, guessCount),
  updateTile(rowIdx, colIdx, letter, state),
  revealTile(rowIdx, colIdx, correctLetter, guessedLetter),

  // Board animations
  revealBoard({ animation, onComplete }),
  shakeRow(rowIdx, onComplete),
  pulseCorrectTiles(tiles, onComplete),

  // Keyboard
  buildKeyboard(),
  updateKeyboard(result, guess),
  setCaseMode(mode),

  // Utilities
  showToast(message),
  calcLayout(wordLength, maxGuesses),
  highlightLetter(letter, state)
};
```

### Board HTML Structure

```html
<div class="board-zone" id="game-board">
  <div class="board">
    <div class="row" data-row="0">
      <div class="tile tile-empty" data-col="0"></div>
      <div class="tile tile-empty" data-col="1"></div>
      <!-- ... more tiles ... -->
    </div>
    <!-- ... more rows ... -->
  </div>
</div>
```

### State -> DOM Flow

```
Game State (app-main.js)
  ↓
  guess: "STAR"
  wordLength: 5
  guesses: ["S", "T", "A", "R"]
  correct: "ST---"
  ↓
Module 3 (UI Rendering)
  ↓
  WQUI.updateCurrentRow("STAR", 5, 1)
    ├─→ Find row DOM element (data-row="1")
    ├─→ For each letter in "STAR":
    │   ├─→ Find tile DOM (data-col)
    │   ├─→ Set tile.textContent = letter
    │   ├─→ Set tile.classList = "tile-correct" (if in correct positions)
    │   └─→ Trigger reveal animation
    └─→ Emit onRevealComplete callback
  ↓
Visual Output (Browser)
  ↓
  Tiles display "S T A R" with animations
```

---

## Key Functions to Extract

### Board Initialization (Low Risk)

- `buildBoard(wordLength, maxGuesses)` — Create empty board structure
  - Pure DOM creation, no state dependencies
  - Returns: board element
  - Safe to extract ✅

- `calcLayout(wordLength, maxGuesses)` — Calculate responsive sizing
  - Pure calculation based on word/guess counts
  - Updates CSS custom properties for responsive layout
  - Safe to extract ✅

### Board Updates (Medium Risk)

- `updateCurrentRow(guess, wordLength, guessCount)` — Add letters to current row
  - Depends on: Game state (guess array, word length)
  - Updates: DOM tiles and keyboard
  - **Coupling:** Must know which row is "current"
  - Caution: Updates keyboard as side effect ⚠️

- `updateTile(rowIdx, colIdx, letter, state)` — Update single tile
  - Depends on: Tile element existence (by row/col)
  - Updates: Tile text + classes (correct/wrong/hint)
  - Safe to extract ✅

### Board Animations (High Risk)

- `revealBoard({ animation, onComplete })` — Animate board reveal
  - **Critical:** Must emit `onComplete` callback when animation finishes
  - Timing: ~400ms total (staggered tile reveals)
  - **Coupling:** Module 5 waits for this callback before advancing

- `shakeRow(rowIdx, onComplete)` — Animate invalid guess shake
  - **Critical:** Must emit callback when shake completes
  - Timing: ~300ms shake animation
  - Used by: Module 4 (input validation)

- `pulseCorrectTiles(tiles, onComplete)` — Pulse animation on correct guesses
  - **Critical:** Must emit callback
  - Timing: ~200ms pulse
  - Used by: Module 5 (reveal feedback)

### Keyboard Rendering (Medium Risk)

- `buildKeyboard()` — Create keyboard layout
  - Depends on: Keyboard layout preference (QWERTY vs alphabet)
  - Depends on: Case mode (uppercase/lowercase)
  - Safe to extract ✅

- `updateKeyboard(result, guess)` — Update keyboard state based on guess
  - Depends on: Game result (which letters are correct/wrong)
  - Updates: Keyboard letter highlighting
  - **Coupling:** Must match Module 4 input validation
  - Caution: Updates based on guess accuracy ⚠️

- `setCaseMode(mode)` — Toggle uppercase/lowercase
  - Pure DOM update
  - Safe to extract ✅

- `highlightLetter(letter, state)` — Update single letter state
  - Depends on: Letter tile element
  - Updates: CSS classes (correct/wrong/tested)
  - Safe to extract ✅

### Utilities (Low Risk)

- `showToast(message)` — Display toast notification
  - Pure DOM creation
  - Safe to extract ✅

- `calcLayout()` — (duplicate?) Calculate layout
  - Verify if this is same as above
  - Safe to extract ✅

---

## Critical Coupling Points (DO NOT BREAK)

### 1. Animation Callbacks Must Fire

**Requirement:** Every animation function MUST emit an `onComplete` callback when animation finishes.

**Current implementation:**
```javascript
function revealBoard(options = {}) {
  const { animation = true, onComplete = () => {} } = options;

  if (!animation) {
    onComplete();
    return;
  }

  // Start animation
  animateTiles();

  // After animation completes, emit callback
  setTimeout(() => {
    onComplete();  // ✅ Callback fires after animation
  }, 400);
}
```

**If callback is missed:**
- Module 5 won't know when to open reveal modal
- Modal will open while board animation still playing
- Visual glitch: modal backdrop appears mid-animation

**Extraction rule:** Every `WQUI.*Animation` function must have `onComplete` callback export

### 2. Board State Reflects Game State Exactly

**Requirement:** DOM tiles must always match game state (guess array + correct positions).

**Coupling point:**
```javascript
// app-main.js game logic
state.guesses = ["S", "T", "A"];  // Player guessed S, T, A
state.correct = "ST---";           // S and T are in correct positions

// Module 3 must render
WQUI.updateCurrentRow("A", 5, 3);  // Update row 3 with "A"
// Result: Row shows: S(correct) T(correct) A(wrong) _(empty) _(empty)
```

**If state/DOM diverges:**
- Teacher sees board saying "S T A R" but telemetry says guesses were "S T"
- Player gets wrong feedback
- Score calculation becomes invalid

**Extraction rule:** Module 3 is a **pure receiver** of state updates. It doesn't make decisions about what to display; app-main.js tells it what to show.

### 3. Keyboard Updates Must Match Board

**Requirement:** Keyboard letter highlighting must match board correctness.

**Example:**
```javascript
// Player guesses "S T A"
state.guesses = ["S", "T", "A"];
state.correct = "ST---";  // S and T are correct

// Keyboard must show:
// - "S" as correct (green)
// - "T" as correct (green)
// - "A" as wrong (gray)

WQUI.updateKeyboard(result, "A");  // Update keyboard based on this guess
// Must highlight: S(correct), T(correct), A(wrong)
```

**If keyboard/board don't match:**
- Player sees board says "S is correct" but keyboard says "S is wrong"
- Confusion about which letters are valid
- Trust in game mechanics breaks

**Extraction rule:** `updateKeyboard()` must accept the same `result` object that the board uses

### 4. Layout Responsiveness Depends on Word Length

**Requirement:** Board dimensions must adjust based on word length and max guesses.

**Current coupling:**
```javascript
function reflowGameplayLayoutForTurnLine() {
  // Get current game state
  const state = WQGame.getState();
  if (!state?.wordLength || !state?.maxGuesses) return;

  // Calculate layout based on state
  WQUI.calcLayout(state.wordLength, state.maxGuesses);
}
```

**If layout isn't recalculated:**
- Board becomes too large or too small for new word
- Text overflows or becomes unreadable
- Mobile layouts break

**Extraction rule:** `calcLayout()` must be called whenever word length or max guesses changes

---

## Animation Timing Map

### Reveal Board Animation Sequence

```
Time    Action                      Duration    Callback
────────────────────────────────────────────────────────
0ms     ├─→ Tile 0 starts fading
        │   (opacity: 0 → 1)         100ms
        │   ├─→ Complete at 100ms
        │
50ms    ├─→ Tile 1 starts fading    (100ms)
100ms   ├─→ Tile 2 starts fading    (100ms)
        ├─→ Tile 0 complete
150ms   ├─→ Tile 3 starts fading    (100ms)
200ms   ├─→ Tile 4 starts fading    (100ms)
        ├─→ Tile 2 complete
250ms   ├─→ ... more tiles ...
300ms   ├─→ Tile N-1 starts fading  (100ms)
        ├─→ Tile N-2 complete
400ms   ├─→ Tile N complete
        │
        └─→ onComplete() callback fires ✅
```

**Total duration:** 400ms

**Critical:** Module 5 can't open modal until this completes

### Shake Animation (Invalid Guess)

```
0ms    Shake left (-5px)   + vibration
100ms  Shake right (+5px)  + vibration
200ms  Shake left (-3px)
300ms  Return to center    + shake complete
        └─→ onComplete() callback fires ✅
```

**Total duration:** 300ms

**Module 4 uses this:** When player makes invalid guess (duplicate letter, etc.)

---

## Data Structures

### Board State (from game)
```javascript
{
  word: "STAR",           // Target word
  wordLength: 5,          // Length
  maxGuesses: 6,          // Max attempts
  guesses: ["S", "T"],    // Player's guesses so far
  correct: "ST---",       // Correct position indicators
  hintUsed: false,        // Did player use hint?
  won: false,             // Did player win?
  revealed: false         // Is answer revealed?
}
```

### Result Object (from guess validation)
```javascript
{
  guess: "S",             // The letter guessed
  rowIdx: 0,              // Which row (0-indexed)
  correct: true,          // Is this letter in correct position?
  alreadyTested: false,   // Was this letter already guessed?
  inWord: true,           // Is letter in target word?
  state: "correct"        // Visual state: "correct", "wrong", "tested", "empty"
}
```

### Animation Options
```javascript
{
  animation: true,        // Play animation or instant?
  duration: 400,          // Animation duration in ms
  onComplete: () => {},   // Callback when done
  easing: 'ease-out'      // CSS easing function
}
```

---

## Testing Strategy

### Unit Tests (DOM Creation)

```javascript
describe('Module 3: UI Rendering', () => {
  describe('buildBoard', () => {
    test('creates correct number of rows', () => {
      const board = buildBoard(5, 6);  // 5 letters, 6 guesses
      expect(board.querySelectorAll('.row')).toHaveLength(6);
    });

    test('creates correct number of tiles per row', () => {
      const board = buildBoard(5, 6);
      const firstRow = board.querySelector('[data-row="0"]');
      expect(firstRow.querySelectorAll('.tile')).toHaveLength(5);
    });

    test('initializes all tiles as empty', () => {
      const board = buildBoard(5, 6);
      const tiles = board.querySelectorAll('.tile');
      tiles.forEach(tile => {
        expect(tile.classList.contains('tile-empty')).toBe(true);
      });
    });
  });

  describe('updateTile', () => {
    test('updates tile text and state', () => {
      const board = buildBoard(5, 6);
      updateTile(board, 0, 0, 'S', 'correct');

      const tile = board.querySelector('[data-row="0"][data-col="0"]');
      expect(tile.textContent).toBe('S');
      expect(tile.classList.contains('tile-correct')).toBe(true);
    });
  });

  describe('calcLayout', () => {
    test('adjusts layout for different word lengths', () => {
      calcLayout(5, 6);  // 5-letter word
      let boardWidth = getComputedStyle(document.getElementById('game-board')).width;

      calcLayout(7, 6);  // 7-letter word
      let boardWidthLonger = getComputedStyle(document.getElementById('game-board')).width;

      expect(boardWidthLonger).toBeGreaterThan(boardWidth);
    });
  });
});
```

### Integration Tests (Animation Timing)

```javascript
describe('Animation Callbacks', () => {
  test('revealBoard emits onComplete after 400ms', async () => {
    const callback = jest.fn();
    const startTime = Date.now();

    revealBoard({ animation: true, onComplete: callback });

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 450));

    expect(callback).toHaveBeenCalled();
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(400);
    expect(elapsed).toBeLessThan(500);  // Some timing tolerance
  });

  test('shakeRow emits onComplete after ~300ms', async () => {
    const callback = jest.fn();
    shakeRow(0, callback);

    await new Promise(resolve => setTimeout(resolve, 350));
    expect(callback).toHaveBeenCalled();
  });

  test('keyboard updates immediately (no animation)', () => {
    const callback = jest.fn();
    updateKeyboard(
      { guess: 'S', rowIdx: 0, correct: true, state: 'correct' },
      'S',
      callback
    );

    // Should fire immediately
    expect(callback).toHaveBeenCalled();
  });
});
```

### Visual Regression Tests (If Available)

```javascript
describe('Visual Appearance', () => {
  test('5-letter board layout matches design', () => {
    buildBoard(5, 6);
    expect(document.getElementById('game-board')).toMatchSnapshot();
  });

  test('keyboard renders all 26 letters in correct order', () => {
    buildKeyboard();
    const keys = document.querySelectorAll('[data-key]');
    expect(keys).toHaveLength(26);
  });

  test('correct tiles have green background', () => {
    const tile = document.querySelector('[data-state="correct"]');
    const style = getComputedStyle(tile);
    // Verify green color (varies by theme, but should be "correct" state)
    expect(tile.classList.contains('tile-correct')).toBe(true);
  });
});
```

---

## Extraction Phases

### Phase 1: Board Creation (LOW RISK, 1-2 hours)

```
1. Extract: buildBoard(wordLength, maxGuesses)
2. Extract: calcLayout(wordLength, maxGuesses)
3. Extract: updateTile(rowIdx, colIdx, letter, state)
4. Extract: buildKeyboard()
5. Extract: setCaseMode(mode)
6. Run: npm run guard:runtime
```

**Phase 1 Result:** Static board/keyboard rendering works, no animation yet

### Phase 2: Board Updates (MEDIUM RISK, 1-2 hours)

```
7. Extract: updateCurrentRow(guess, wordLength, guessCount)
8. Extract: updateKeyboard(result, guess)
9. Extract: highlightLetter(letter, state)
10. Extract: showToast(message)
11. Run: npm run guard:runtime + full round test
```

**Phase 2 Result:** Board updates in response to guesses, keyboard highlights correctly

### Phase 3: Animations (HIGH RISK, 2-3 hours)

```
12. Extract: revealBoard({ animation, onComplete })
13. Extract: shakeRow(rowIdx, onComplete)
14. Extract: pulseCorrectTiles(tiles, onComplete)
15. Verify all callbacks fire correctly
16. Run: npm run guard:runtime + animation timing tests
```

**Phase 3 Result:** Animations play, callbacks fire, Module 5 can use them

---

## Known Issues & Workarounds

### Issue 1: WQUI Object is Monolithic

**Problem:** All UI functions are on one global `window.WQUI` object in app-main.js

**Current:**
```javascript
window.WQUI = {
  buildBoard: (...) => {},
  updateBoard: (...) => {},
  // ... 30 more functions
};
```

**After extraction:**
```javascript
// app-game-ui.js
export const GameUI = {
  buildBoard: (...) => {},
  updateBoard: (...) => {},
};

// app-main.js
import { GameUI } from './app-game-ui.js';
window.WQUI = GameUI;  // Keep global for backward compatibility
```

**Workaround:** Re-export as `window.WQUI` in app-main.js until all call sites are updated

### Issue 2: CSS Custom Properties for Theme

**Problem:** Board colors are defined via CSS custom properties (--page-bg, --text-primary, etc.)

**If extracted:** New CSS file must import theme variables from style/themes.css

**Solution:**
```css
/* In new app-game-ui.css or similar */
@import url('../style/themes.css');
@import url('../style/components.css');

.board { background-color: var(--page-bg); }
.tile { color: var(--text-primary); }
```

### Issue 3: Animation Timing Variance

**Problem:** Animation timing might vary slightly (browser rendering, system load)

**Solution in tests:** Use timing tolerance:
```javascript
const elapsed = Date.now() - start;
expect(elapsed).toBeGreaterThanOrEqual(400 - 50);  // -50ms tolerance
expect(elapsed).toBeLessThan(400 + 200);           // +200ms tolerance
```

---

## Dependency Graph

```
Module 3: UI Rendering
├─ Imports
│  ├─ DOM (read/write)
│  ├─ CSS theme variables (read)
│  ├─ Animation API (setTimeout, CSS transitions)
│  └─ (Optional) GSAP for advanced animations
│
├─ Called by
│  ├─ Module 4 (Input) → updateKeyboard(), shakeRow()
│  ├─ Module 5 (Game Flow) → revealBoard(), pulseCorrectTiles()
│  └─ app-main.js → showToast(), calcLayout()
│
└─ Calls
   └─ (Nothing - pure UI layer, no dependencies on other modules)
```

---

## Summary: Extract vs Keep

| Function | Extract? | Why |
|----------|----------|-----|
| `buildBoard()` | ✅ YES | Pure DOM creation |
| `calcLayout()` | ✅ YES | Pure calculation |
| `updateTile()` | ✅ YES | Single tile update, isolated |
| `buildKeyboard()` | ✅ YES | Pure DOM creation |
| `updateCurrentRow()` | ✅ YES | Row update, moderate coupling |
| `updateKeyboard()` | ✅ YES | Keyboard state update |
| `setCaseMode()` | ✅ YES | Simple DOM update |
| `highlightLetter()` | ✅ YES | Single letter highlight |
| `showToast()` | ✅ YES | Toast notification |
| `revealBoard()` | ✅ YES | Board animation (with callback) |
| `shakeRow()` | ✅ YES | Row shake animation |
| `pulseCorrectTiles()` | ✅ YES | Pulse animation |

**All WQUI functions are safe to extract once Module 1 & 2 are done.**

---

*Last updated: 2026-03-20 by Claude during autonomous Module 3 & 4 analysis*
