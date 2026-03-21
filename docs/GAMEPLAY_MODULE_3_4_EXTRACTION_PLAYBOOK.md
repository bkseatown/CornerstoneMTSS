# Modules 3 & 4 Extraction Playbook

**Status:** Ready for implementation after Modules 1-2 pass guardrails

**Timeline:** 6-8 hours total (3-4 hours per module)

---

## Module 3: UI Rendering (Board & Keyboard)

### Phase 3.1: Board Creation (1-2 hours)

**Files to create:**
- `js/app-game-ui-board.js` — Board initialization and layout

**Step 1: Extract buildBoard()**
```javascript
// js/app-game-ui-board.js
export function buildBoard(wordLength, maxGuesses) {
  const board = document.createElement('div');
  board.className = 'board';

  for (let r = 0; r < maxGuesses; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('data-row', r);

    for (let c = 0; c < wordLength; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile tile-empty';
      tile.setAttribute('data-col', c);
      row.appendChild(tile);
    }
    board.appendChild(row);
  }

  return board;
}
```

**Update app-main.js:**
```javascript
import { buildBoard } from './app-game-ui-board.js';

// Replace: function buildBoard(wordLength, maxGuesses) { ... }
// With: Import above
```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Play game, board displays correctly
- [ ] Different word lengths display correctly (5-letter, 7-letter, etc.)

**Step 2: Extract calcLayout()**
```javascript
// Add to js/app-game-ui-board.js
export function calcLayout(wordLength, maxGuesses) {
  const boardZone = document.getElementById('game-board');
  if (!boardZone) return;

  // Calculate responsive sizing
  const tilesPerRow = wordLength;
  const gapSize = 4;  // pixels
  const tileSize = Math.max(30, Math.min(60, (100 / tilesPerRow) * 0.8));

  boardZone.style.setProperty('--tile-size', `${tileSize}px`);
  boardZone.style.setProperty('--gap-size', `${gapSize}px`);
}
```

**Update app-main.js:**
- Add to import from board file
- Remove function definition

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Board resizes for different word lengths
- [ ] Layout doesn't break on mobile (check with Chrome DevTools responsive mode)

---

### Phase 3.2: Tile Updates (1-2 hours)

**Files to create:**
- `js/app-game-ui-tiles.js` — Tile updates and state

**Step 1: Extract updateTile()**
```javascript
// js/app-game-ui-tiles.js
export function updateTile(rowIdx, colIdx, letter, state = 'empty') {
  const board = document.getElementById('game-board');
  if (!board) return;

  const tile = board.querySelector(`[data-row="${rowIdx}"][data-col="${colIdx}"]`);
  if (!tile) return;

  tile.textContent = letter || '';
  tile.className = `tile tile-${state}`;
  tile.setAttribute('data-state', state);
}
```

**Step 2: Extract updateCurrentRow()**
```javascript
// Add to js/app-game-ui-tiles.js
export function updateCurrentRow(guess = '', wordLength = 5, guessCount = 0) {
  const board = document.getElementById('game-board');
  if (!board || guessCount < 1) return;

  const rowIdx = guessCount - 1;  // Current row (0-indexed)
  const guessLetters = String(guess || '').toUpperCase().split('');

  for (let col = 0; col < wordLength; col++) {
    const letter = guessLetters[col] || '';
    updateTile(rowIdx, col, letter, letter ? 'guessed' : 'empty');
  }
}
```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Guesses appear on board
- [ ] Tile states update correctly (empty, guessed, correct, wrong)

---

### Phase 3.3: Animations (2-3 hours)

**Files to create:**
- `js/app-game-ui-animations.js` — All animation functions

**Step 1: Extract revealBoard()**
```javascript
// js/app-game-ui-animations.js
export function revealBoard(options = {}) {
  const { animation = true, onComplete = () => {} } = options;
  const board = document.getElementById('game-board');
  if (!board) {
    onComplete();
    return;
  }

  if (!animation) {
    board.classList.add('revealed');
    onComplete();
    return;
  }

  // Stagger tile reveals
  const tiles = board.querySelectorAll('.tile:not(.tile-empty)');
  let completed = 0;

  tiles.forEach((tile, idx) => {
    setTimeout(() => {
      tile.classList.add('revealing');
      completed++;
      if (completed === tiles.length) {
        onComplete();
      }
    }, idx * 50);  // 50ms stagger
  });
}
```

**Step 2: Extract shakeRow()**
```javascript
// Add to js/app-game-ui-animations.js
export function shakeRow(rowIdx, onComplete = () => {}) {
  const board = document.getElementById('game-board');
  if (!board) {
    onComplete();
    return;
  }

  const row = board.querySelector(`[data-row="${rowIdx}"]`);
  if (!row) {
    onComplete();
    return;
  }

  row.classList.add('shake');
  setTimeout(() => {
    row.classList.remove('shake');
    onComplete();
  }, 300);
}
```

**Critical:** Both must emit `onComplete()` callback after animation finishes

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Reveal animation plays when board is shown
- [ ] Shake animation plays on invalid guess
- [ ] Animations finish and callbacks fire

---

### Phase 3.4: Keyboard (1-2 hours)

**Files to create:**
- `js/app-game-ui-keyboard.js` — Keyboard rendering and updates

**Step 1: Extract buildKeyboard()**
```javascript
// js/app-game-ui-keyboard.js
export function buildKeyboard(layout = 'standard') {
  const keyboardEl = document.getElementById('keyboard');
  if (!keyboardEl) return;

  const layouts = {
    standard: [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ],
    alphabet: [
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
      ['U', 'V', 'W', 'X', 'Y', 'Z']
    ]
  };

  const rows = layouts[layout] || layouts.standard;
  keyboardEl.innerHTML = '';

  rows.forEach((rowLetters) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';

    rowLetters.forEach((letter) => {
      const btn = document.createElement('button');
      btn.className = 'keyboard-key';
      btn.setAttribute('data-key', letter);
      btn.textContent = letter;
      rowEl.appendChild(btn);
    });

    keyboardEl.appendChild(rowEl);
  });
}
```

**Step 2: Extract updateKeyboard()**
```javascript
// Add to js/app-game-ui-keyboard.js
export function updateKeyboard(result = {}, guess = '') {
  const { guess: guessLetter, correct, state } = result;
  const letter = guessLetter || guess;

  const keyBtn = document.querySelector(`[data-key="${letter}"]`);
  if (!keyBtn) return;

  keyBtn.className = `keyboard-key key-${state}`;
  keyBtn.setAttribute('data-state', state);
  keyBtn.disabled = true;  // Can't use this letter again
}
```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Keyboard displays
- [ ] Keyboard switches between QWERTY and Alphabet layouts
- [ ] Keys highlight correctly (correct/wrong states)

---

## Module 4: Input Handling

### Phase 4.1: Validation Helpers (1 hour)

**Files to create:**
- `js/app-game-input-validators.js` — All validation functions

```javascript
// js/app-game-input-validators.js

export function isValidLetter(char) {
  return /^[a-z]$/i.test(String(char));
}

export function normalizeLetter(char) {
  return String(char || '').toUpperCase();
}

export function isDuplicateLetter(letter, guesses = []) {
  return guesses.some(g => normalizeLetter(g) === normalizeLetter(letter));
}

export function isLetterInWord(letter, word = '') {
  return String(word || '').includes(normalizeLetter(letter));
}

export function canMakeGuess(letter, gameState = {}, guesses = []) {
  if (!gameState || gameState.revealed || gameState.won) return false;
  if (!isValidLetter(letter)) return false;
  if (isDuplicateLetter(letter, guesses)) return false;
  return true;
}

export function getLetterState(letter, word = '', guesses = []) {
  if (!isDuplicateLetter(letter, guesses)) return 'empty';
  if (isLetterInWord(letter, word)) return 'correct';
  return 'wrong';
}
```

**Update app-main.js:**
```javascript
import {
  isValidLetter,
  normalizeLetter,
  isDuplicateLetter,
  isLetterInWord,
  canMakeGuess,
  getLetterState
} from './app-game-input-validators.js';
```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] All validators work correctly

---

### Phase 4.2: Event Handlers (2-3 hours)

**Files to create:**
- `js/app-game-input-handlers.js` — Event handling

```javascript
// js/app-game-input-handlers.js
import { canMakeGuess, normalizeLetter, isDuplicateLetter } from './app-game-input-validators.js';
import { showToast, shakeRow, updateKeyboard } from './app-game-ui-keyboard.js';

export function setupInputHandlers(onGuess = () => {}, onHint = () => {}, onSkip = () => {}) {
  // Main keyboard handler
  document.addEventListener('keydown', (event) => {
    handleKeyDown(event, onGuess);
  });

  // Keyboard button clicks
  document.addEventListener('click', (event) => {
    if (event.target.closest('.keyboard-key')) {
      const letter = event.target.getAttribute('data-key');
      handleGuess(letter, onGuess);
    }
  });

  // Hint button
  document.getElementById('phonics-clue-open-btn')?.addEventListener('click', onHint);

  // Skip button
  document.getElementById('button-skip')?.addEventListener('click', onSkip);
}

export function handleKeyDown(event, onGuess = () => {}) {
  const char = event.key;

  // Ignore if not a letter
  if (!isValidLetter(char)) return;

  // Prevent default letter typing
  event.preventDefault();

  handleGuess(char, onGuess);
}

export function handleGuess(char, onGuess = () => {}) {
  const letter = normalizeLetter(char);
  const gameState = window.WQGame?.getState?.() || {};
  const guesses = gameState.guesses || [];

  // Check if can make guess
  if (!canMakeGuess(letter, gameState, guesses)) {
    if (isDuplicateLetter(letter, guesses)) {
      showToast(`Already tested ${letter}`);
      shakeRow(guesses.length - 1);
    }
    return;
  }

  // Emit valid guess
  onGuess({ letter, gameState });
}
```

**Update app-main.js:**
```javascript
import { setupInputHandlers } from './app-game-input-handlers.js';

// In initialization:
setupInputHandlers(
  (validGuess) => {
    // Process valid guess in app-main.js
    // This maintains game state updates in app-main
  },
  () => {
    // Hint click handler
  },
  () => {
    // Skip click handler
  }
);
```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Physical keyboard input works
- [ ] Virtual keyboard clicks work
- [ ] Duplicate letters are blocked with toast + shake
- [ ] Invalid input is ignored silently

---

## Combined Test Checklist (Modules 3 & 4)

After extracting both modules:

- [ ] `npm run guard:runtime` passes
- [ ] `npm run hud:check` passes
- [ ] Full game round completes without errors
  - [ ] Word loads → board displays
  - [ ] Player enters guesses → tiles update
  - [ ] Incorrect letter → shake animation
  - [ ] Correct letters → keyboard highlights
  - [ ] Win condition → reveal modal opens
  - [ ] Auto-advance → next word loads
- [ ] Keyboard layout switch works
- [ ] Case mode toggle works
- [ ] All animations complete and callbacks fire
- [ ] No memory leaks (Chrome DevTools memory tab)
- [ ] Mobile/tablet responsive layout works

---

## Rollback Procedures

### Module 3 specific:
- If board doesn't render: Check buildBoard() is imported and called
- If animations hang: Verify onComplete() callbacks are firing
- If keyboard missing: Check buildKeyboard() is called on init

### Module 4 specific:
- If input doesn't work: Verify event listeners are attached in setupInputHandlers()
- If duplicate check fails: Verify isDuplicateLetter() is called before onGuess()
- If shake doesn't play: Verify shakeRow() is called on invalid guess

---

## Timeline

**Module 3:** 3-4 hours
- Phase 1 (board creation): 1-2 hours
- Phase 2 (tile updates): 1 hour
- Phase 3 (animations): 1-2 hours
- Phase 4 (keyboard): 1 hour

**Module 4:** 3-4 hours
- Phase 1 (validators): 1 hour
- Phase 2 (event handlers): 2-3 hours

**Total:** 6-8 hours focused work

---

*Last updated: 2026-03-20 by Claude during autonomous Module 3 & 4 analysis*
