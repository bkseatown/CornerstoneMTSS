# Gameplay Core Analysis: app-main.js (18,071 lines)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         word-quest.html                 │
│        (HTML + CSS + tokens)            │
└──────────────┬──────────────────────────┘
               │
               ├─► js/app-runtime-helpers.js (setup + routes)
               ├─► js/app.js (orchestrator + bootstrap)
               │
               └─► js/app-main.js (UI LAYER — 18,071 lines) ◄─── THE PROBLEM
                       ├─► js/game.js (pure game state — 260 lines) ✓ Already clean
                       ├─► js/curriculum-truth.js (word pools)
                       ├─► js/lesson-brief-panel.js (curriculum UI)
                       └─► DOM APIs + localStorage
```

**Key Insight:** game.js is clean and tiny (260 lines). app-main.js is the bloat because it's the UI orchestrator for 10,000+ gameplay states, interactions, and visual transitions.

---

## Current Structure of app-main.js

| Section | Lines | Purpose |
|---------|-------|---------|
| **3. Preferences** | 22–268 | Settings storage, defaults, migrations |
| **4. Theme/projector/motion** | 2806–5204 | Theme wiring, dark mode, animations |
| **5. Settings panel** | 5489–9246 | Preferences UI (voice, hints, board size) |
| **6. Focus + grade alignment** | 9247–11394 | Curriculum filtering, lesson alignment |
| **7. New game** | 11395–15142 | Game initialization, word picking, midgame boosts |
| **8. Input handling** | 15143–15819 | Keyboard + on-screen button input |
| **9. Gameplay audio buttons** | 15820–17887 | "Listen to Word" / "Listen to Definition" |
| **10. Duplicate-letter toast** | 17888–18024 | Toast for duplicate letter feedback |
| **11. Music catalog** | 18025–18071 | Music track definitions |

---

## The Real Coupling Problem

**app-main.js is not 18K lines because the logic is complex.** It's 18K lines because:

1. **Every UI update is a separate function** — When a guess is made, there are 10+ DOM updates, each in its own function
2. **Every interaction has side-effects** — Clicking a hint button also: hides other UI, updates stats, triggers toast, syncs music, logs telemetry, updates localStorage
3. **Feature interactions are ad-hoc** — Theme changes must also update music colors; voice mode changes must update button labels; etc.

### Example: What Happens When User Makes a Guess

```javascript
// One user action → 15 DOM updates + 5 state mutations + 3 async calls
WQGame.addLetter('a');
WQUI.updateCurrentRow(guess, wordLength, guessCount);           // DOM update 1
if (guess.length === wordLength) {
  const result = WQGame.submitGuess();
  WQUI.updateAllPastRows(guesses);                              // DOM update 2
  updateScore(result);                                           // DOM update 3
  if (result.won) showCelebration();                             // DOM update 4
  syncTeacherRoster(studentProgress);                            // async call
  syncTelemetry(guess, result);                                 // async call
  closeDemoToast();                                              // DOM update 5
  closeQuickPopover('music');                                   // DOM update 6
  // ... 10 more DOM/state mutations
}
```

This pattern repeats 100+ times in app-main.js.

---

## Proposed Module Breakdown for app-main.js

### EXTRACTION ORDER: Safest to Riskiest

---

## GAMEPLAY MODULE 1: Word & Curriculum Helpers

**Target Lines:** ~200 functions scattered across sections 6 & 7
**Risk:** Low — Mostly pure functions

### What to Extract
```javascript
// Word picking
pickWordForScopeCached()
pickWordForCurrentSettings()
getStudentWordPool()
getTeacherOverridePool()

// Curriculum filtering
filterLessonsByCriteria()
getAvailableLessons()
getCurrentLessonBrief()
getWordCulprit() // fetch word definition

// Progress & history
getStudentProgressForWord()
recordWordAttempt()
updateStudentStats()
```

### Dependencies
```
IMPORTS FROM app-main.js:
  - WQGame (core game state) ✓ imported from game.js
  - window.__WQ_CURRICULUM_DATA__ (global word pools)
  - window.__WQ_TEACHER_POOL__ (teacher overrides)
  - localStorage for progress tracking

CALLED BY:
  - Game initialization (section 7)
  - Grade/focus selectors (section 6)
  - Resume/new game flows
```

### Why Extract First
✅ Pure functions with obvious inputs/outputs
✅ No DOM dependencies
✅ No event listeners
✅ Can be tested independently

---

## GAMEPLAY MODULE 2: Score, Streak & Stats Tracking

**Target Lines:** ~150 functions in section 7
**Risk:** Low — Pure state mutations

### What to Extract
```javascript
// Scoring
calculateScore(guessCount, wordLength)
applyStreak(won, guessCount)
applyDifficultyMultiplier(baseScore)
getPowerupBonusMultiplier()

// Progress
incrementWordsSolved()
incrementWordsPlayed()
resetStreakIfNeeded()
getLifetimeStats()

// Engagement (midgame boosts)
showMidgameBoost(guessCount)
recordBoostSeen()
loadMidgameBoostState()
saveMidgameBoostState()
```

### Dependencies
```
IMPORTS FROM app-main.js:
  - WQGame.getState() (guess count, word length)
  - localStorage (stats persistence)
  - FEATURES (feature flags)

CALLED BY:
  - Input handling (when guess submitted)
  - New game flow
  - Stats display
```

### Why Extract Early
✅ Scoring is self-contained business logic
✅ Doesn't touch DOM
✅ Easy to test (unit tests can verify math)
✅ Changes here are isolated (low regression risk)

---

## GAMEPLAY MODULE 3: UI Rendering & DOM Helpers

**Target Lines:** ~400 functions scattered across all sections
**Risk:** Medium — Many DOM dependencies, but localized

### What to Extract
```javascript
// Board rendering
updateCurrentRow(guess, wordLength)
updatePastRows(allGuesses, results)
highlightTileAtPosition(row, col, status)
renderLetterTile(letter, status)

// Keyboard rendering
renderKeyboardRow(letters)
updateKeyboardKey(letter, status)
highlightKey(letter)
disableKey(letter)

// UI state
hideHintCard()
showHintCard()
closeDemoToast()
closeQuickPopover()
showSupportChoice()
```

### Dependencies
```
IMPORTS FROM app-main.js:
  - DOM selectors (_el(), querySelector)
  - CSS class names (classList.add/remove)
  - transition/animation constants

CALLED BY:
  - Input handlers (after each guess)
  - Game state changes
  - Settings changes (when board size changes, etc.)

EXPORTS:
  - Render functions (should be idempotent)
  - Update functions (should be safe to call multiple times)
```

### Why Extract After Score Module
✅ Score changes drive most UI updates
✅ Can depend on scoring module
✅ DOM operations are mostly side-effects (safe to isolate)
⚠️ Many call sites (need careful testing)

---

## GAMEPLAY MODULE 4: Input & Event Handling

**Target Lines:** ~100+ functions in section 8
**Risk:** Medium — Event listeners, but logic is straightforward

### What to Extract
```javascript
// Keyboard input
handleKey(key)
handleInputUnit(rawUnit)
insertSequenceIntoGuess(sequence)

// On-screen buttons
handleTileClick(letter)
handleKeyboardKeyClick(letter)
handleEnterClick()
handleBackspaceClick()

// Gesture handlers
handleBoardDragStart()
handleBoardDragEnd()

// Event setup
attachKeyboardListeners()
attachButtonListeners()
detachAllListeners()
```

### Dependencies
```
IMPORTS FROM app-main.js:
  - WQGame (to submit letters/guesses)
  - DOM element refs
  - Input validation rules

CALLED BY:
  - Initialization (setup listeners)
  - Cleanup (remove listeners)
  - Directly called by event handlers in HTML

EXPORTS:
  - Handler functions (keypressed, click, drag, etc.)
  - Setup/teardown functions
```

### Dependency Note: Duplicate-Letter Toast

The duplicate-letter toast in section 10 should stay in `js/app-main.js` for now.

- It triggers after guess submission and depends on the completed guess result.
- It sits downstream of input handling and UI updates.
- It is small enough that extracting it early adds more coordination than value.

Working dependency path:

`Module 4 (Input Handlers) -> Module 3 (UI Rendering) -> duplicate toast handler in app-main.js`

### Why Extract After UI Module
✅ Input handlers call into UI renderer (dependency)
✅ Self-contained event management
⚠️ Must coordinate with theme system (for keyboard highlighting)

---

## GAMEPLAY MODULE 5: Game Flow & State Machine

**Target Lines:** ~500+ lines across sections
**Risk:** High — Orchestrates all other modules

### What to Extract
```javascript
// New game setup
initializeNewGame()
selectGameType(grade, focus)
pickStartingWord()
setupBoardDimensions()
resetGameUI()

// Game progress
handleGameOver(won)
declareVictory()
showGameOverScreen()
offerNextGame()

// Round flow
startNewRound()
finishRound(result)
recordAndSync(result)
```

### Dependencies
```
IMPORTS FROM other modules:
  - WORD_HELPERS.pickWord()
  - SCORE_MODULE.calculateScore()
  - UI_RENDERER.updateCurrentRow()
  - INPUT_HANDLERS.attachListeners()
  - WQGame (core state machine)

EXPORTS:
  - initializeNewGame()
  - startGame()
  - endGame()
  - resumeGame()
```

### Why Extract Last Among Gameplay
✅ Depends on all other gameplay modules (natural boundary)
✅ Orchestrates turn-by-turn flow
⚠️ High complexity — needs careful testing
⚠️ Any bug here breaks the entire game flow

---

## GAMEPLAY MODULE 6: Audio & Accessibility

**Target Lines:** Section 9 (~67 lines) + scattered audio calls
**Risk:** Medium — DOM dependencies + audio APIs

### What to Extract
```javascript
// Listen buttons
handleListenToWordClick()
handleListenToDefinitionClick()
playWordAudio()
playDefinitionAudio()

// Voice synthesis
speakWithVoice(text, voiceMode)
cancelActiveAudio()
setVoiceRate(rate)
```

### Dependencies
```
IMPORTS FROM app-main.js:
  - Web Audio API
  - Speech Synthesis API
  - DOM elements

CALLED BY:
  - "Listen to Word" button
  - "Listen to Definition" button
  - Hint cards (may play hint audio)
```

---

## The Remaining ~8,000 Lines: Don't Extract (Yet)

After extracting modules 1–6, you'll still have ~8,000 lines in app-main.js. This is **settings, theme wiring, preferences UI, telemetry, teacher roster sync, etc.**

These are fine to leave in app-main.js because:
- They don't need to change frequently
- They're already behind clear feature flags (#FEATURE_FLAGS.writingStudio, etc.)
- Extracting them creates more module boundaries than value

**Exception:** If any of these become painful to work on, extract them then (follow the same playbook).

---

## Extraction Sequence (For Codex + Your Gameplay Work)

```
PHASE 1 (Codex handles the safe slices):
  ✅ Theme system (app-main.js section 4)
  ✅ Preferences (app-main.js section 3)
  ✅ Settings UI (app-main.js section 5)
  ✅ Diagnostics (app.js + app-main.js scattered)
  ✅ Bootstrap (app.js)

PHASE 2 (You + me work through gameplay):
  → Module 1: Word & Curriculum Helpers
  → Module 2: Score & Stats Tracking
  → Module 3: UI Rendering
  → Module 4: Input & Event Handling
  → Module 5: Game Flow & State Machine
  → Module 6: Audio & Accessibility

Implementation notes:
  - Use `docs/GAMEPLAY_MODULES_DEEP_DIVE.md` for the real data structures, round-metrics shape, DOM-dependency warnings, and telemetry/round-cleanup coupling.
  - Keep duplicate-letter toast logic in `app-main.js` until the higher-value gameplay slices are stable.

PHASE 3 (Optional, if time/value):
  → Refactor remaining settings/teacher sync into smaller files
```

---

## Testing Strategy for Each Module

### Module 1: Word & Curriculum Helpers
```bash
# Test with different grade/focus combos
# Verify shuffle bag prevents repeating words
# Verify teacher override pool takes precedence
# Expected: Pure function tests, no DOM needed
```

### Module 2: Score & Stats Tracking
```bash
# Test scoring for different guess counts (1-6)
# Test streak logic (win vs loss vs abandon)
# Test multiplier applications
# Expected: Math should match design doc
npm run test:score-module
```

### Module 3: UI Rendering
```bash
# Verify tiles render correct status (correct/present/absent)
# Verify keyboard highlights match board status
# Test on board size changes (5x6, 6x6, etc.)
# Test with all themes + dark mode
npm run test:ui-render
```

### Module 4: Input & Event Handling
```bash
# Type letters → verify WQGame.addLetter is called
# Press Enter → verify submit logic fires
# Click keyboard → verify same as typing
# Verify key disabling works (when board full)
npm run test:input-handlers
```

### Module 5: Game Flow
```bash
# New game → board initializes correctly
# Make guesses → state progresses
# Win condition → victory screen shows
# Lose condition → game-over screen shows
# Test all branches: normal, demo, teacher-assigned
npm run test:game-flow
```

---

## Risk Assessment

| Module | Lines | Risk | Regressions | Notes |
|--------|-------|------|-------------|-------|
| Word Helpers | 200 | 🟢 Low | 0 | Pure functions |
| Score & Stats | 150 | 🟢 Low | 0 | Math-based logic |
| UI Rendering | 400 | 🟡 Medium | Visual only | Test on all themes |
| Input Handling | 100 | 🟡 Medium | Keyboard/click | Test all input modes |
| Game Flow | 500 | 🔴 High | Complete breakage | Needs comprehensive tests |
| Audio & A11y | 100+ | 🟡 Medium | Accessibility | Test screen readers |

---

## Success Criteria (For Each Extraction)

1. ✅ **Behavior unchanged** — Game still plays identically
2. ✅ **Guardrails pass** — `npm run guard:runtime` + `npm run hud:check`
3. ✅ **No new console errors** — Clean browser devtools
4. ✅ **All themes work** — Test Light, Dark, and specialty themes
5. ✅ **Input modes work** — Keyboard, on-screen buttons, mobile keyboard
6. ✅ **Demo mode works** — If DEMO_MODE=true, game plays through to completion
7. ✅ **Teacher assignments work** — Resume/new game with teacher pool
8. ✅ **Mobile-responsive** — Works at 375px width + 812px height

---

## Quick Wins (Extract These First)

If you only have time for 2–3 modules, extract:

1. **Module 1: Word Helpers** — 200 lines, 30 min, zero risk
2. **Module 2: Score Tracking** — 150 lines, 45 min, zero risk

These two unlock the most readable gameplay code and have zero regression risk.

Then return to Codex for the UI layers.
