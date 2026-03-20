# Game State Machine: Round Lifecycle

## Full Round Flow Diagram

```
USER STARTS GAME
      ↓
[newGame() called]
      ↓
CHECKPOINT 1: Can we start?
  ├─ Demo mode complete? → Show end screen → EXIT
  ├─ First run setup pending? → Show toast → EXIT
  ├─ Mission Lab mode? → Launch mission lab → EXIT
  ├─ Voice practice required? → Show message → EXIT
  └─ All checks pass? → Continue
      ↓
INITIALIZE GAME STATE
  ├─ gameStartedAt = Date.now()
  ├─ focusSupportEligibleAt = now + 30000ms
  ├─ resetRoundTracking() [clear hint/voice counters]
  ├─ hideMidgameBoost()
  ├─ Clear all timers
  └─ Emit telemetry('wq_new_word_click')
      ↓
BUILD WORD POOL (Module 1)
  ├─ Get grade band, length, focus from settings
  ├─ buildPlayableWordSet() → Array<word>
  ├─ CHECKPOINT: Pool empty? → Show error toast → EXIT
  └─ Continue
      ↓
START GAME (Module 5: game.js)
  ├─ WQGame.startGame({ word, maxGuesses, ... })
  ├─ Select random word from pool
  ├─ Initialize: guess='', guesses=[], gameOver=false
  └─ RETURN: { word, wordLength, maxGuesses, ... }
      ↓
BUILD UI (Module 3)
  ├─ WQUI.calcLayout(wordLength, maxGuesses)
  ├─ WQUI.buildBoard(wordLength, maxGuesses)
  ├─ WQUI.buildKeyboard()
  ├─ syncKeyboardInputLocks(state)
  ├─ updateVoicePracticePanel()
  ├─ syncHeaderClueLauncherUI()
  ├─ syncStarterWordLauncherUI()
  ├─ WQUI.hideModal()
  └─ Auto-focus board for immediate typing
      ↓
START ASSISTANTS
  ├─ scheduleStarterCoachHint() [30-second timer]
  ├─ startAvaWordQuestIdleWatcher() [track inactivity]
  ├─ Create diagnostics session (90-second timeout)
  └─ Setup demo coach (if DEMO_MODE)
      ↓
🎮 READY FOR GAMEPLAY 🎮
      ↓
USER TYPES LETTERS
      ↓
[handleKey() called for each letter]
      ↓
LETTER INPUT PROCESSING (Module 4)
  ├─ avaWqLastActionAt = Date.now() [reset idle timer]
  ├─ Check constraints: checkLetterEntryConstraints()
  │  ├─ Is board full? → Ignore
  │  ├─ Letter blocked by phonics? → Pulse key, show error
  │  └─ OK → Continue
  ├─ WQGame.addLetter(letter)
  ├─ Get new game state
  ├─ WQUI.updateCurrentRow(guess, wordLength, row) [jiggle animation]
  ├─ syncKeyboardInputLocks(state)
  └─ Check for starter suggestions
      ↓
USER PRESSES ENTER
      ↓
[handleKey('Enter') called]
      ↓
GUESS SUBMISSION CHECKPOINT
  ├─ Validate: validateGuessCompleteness()
  │  ├─ Guess too short? → Show toast, shake board → RETURN TO INPUT
  │  └─ Complete? → Continue
  ├─ WQGame.submitGuess()
  │  ├─ Evaluate guess vs word
  │  ├─ Return: { guess, result, won, lost, guesses, ... }
  └─ Emit telemetry('wq_guess_submit')
      ↓
POST-GUESS STATE UPDATE
  ├─ Check diagnostics (if available)
  ├─ Emit win/loss telemetry (if needed)
  ├─ Update Ava character state (right/wrong)
  ├─ Track wrong streak for adaptive coaching
  └─ Close overlay cards (hint, starter, etc.)
      ↓
START REVEAL ANIMATION
  ├─ themeAtSubmit = get current theme [prevent theme-switch glitch]
  ├─ WQUI.revealRow(
  │    guess,
  │    result,
  │    row,
  │    wordLength,
  │    onDone callback [fires ~520ms later]
  │  )
  ├─ Tiles flip with staggered timing (285ms between each)
  └─ RETURN CONTROL while animation plays
      ↓
      ⏱️  ~520ms passes (tiles flip in staggered order)
      ↓
REVEAL CALLBACK FIRES
  ├─ Check if theme changed during animation → Reapply if needed
  ├─ WQUI.updateKeyboard(result.result, guess) [mark keys]
  ├─ syncKeyboardInputLocks(new state)
  ├─ Check for duplicate letters → Show duplicate toast
  └─ Continue to next checkpoint
      ↓
CHECKPOINT: Game continuing or finished?
  ├─ if (result.won || result.lost) → GO TO GAME OVER
  └─ else → GO TO CONTINUE PLAYING
      ↓
CONTINUE PLAYING BRANCH
  ├─ Update Ava coach state (after 1st miss, after 2nd miss, etc.)
  ├─ Show support modal if 30 seconds elapsed
  ├─ Show error coach if inappropriate letter combo
  ├─ Show starter word suggestions if 2nd miss
  ├─ Advance team turn (if in team mode)
  ├─ Update header status line
  ├─ Check if we should show midgame boost (3rd guess)
  │  ├─ if (guesses.length == 3 && !won && !lost) → showMidgameBoost()
  │  └─ continue
  └─ LOOP BACK TO "USER TYPES LETTERS" (wait for next input)
      ↓
GAME OVER BRANCH
  ├─ stopAvaWordQuestIdleWatcher()
  ├─ End diagnostics session (if active)
  ├─ CHECKPOINT: Won or lost?
  │  ├─ if (won):
  │  │  ├─ Increment streak (Module 2) → AppScoreTracking.incrementStreak()
  │  │  ├─ Render streak in UI
  │  │  ├─ WQUI.celebrateWinRow(row) [confetti animation]
  │  │  └─ Ava coach says "Nice!" or "Great job!"
  │  ├─ else:
  │  │  ├─ Reset streak to 0 (Module 2)
  │  │  └─ Ava coach says "Better luck next time"
  │  └─ Continue
  ├─ buildRoundMetrics(result, maxGuesses) [Module 2]
  │  ├─ guessesUsed, hintRequested, durationMs, zpdInBand
  │  └─ Calc score: calculateScore(guesses, wordLength) [Module 2]
  ├─ Emit telemetry('wq_round_complete')
  ├─ Sync teacher integration (if not demo):
  │  ├─ awardQuestProgress(result, metrics)
  │  ├─ trackRoundForReview(result) [spaced repetition]
  │  └─ syncAssessmentLockRuntime()
  ├─ Reset all round-specific state:
  │  ├─ hideMidgameBoost()
  │  ├─ resetRoundTracking()
  │  └─ Clear all modal/support timers
  ├─ Update next-action line (with review queue info)
  └─ Schedule modal display (wait for animations to settle)
      ↓
SCHEDULE GAME-OVER MODAL
  ├─ setTimeout(520ms) [wait for celebration animation to settle]
  ├─ If DEMO_MODE:
  │  ├─ Hide modal, mark demoRoundComplete=true
  │  ├─ Schedule auto-next-game (2.8 seconds)
  │  └─ Auto-play → LOOP BACK TO newGame()
  ├─ Else:
  │  ├─ WQUI.showModal(result) [show game-over screen]
  │  ├─ Pulse "Next Word" button
  │  └─ Wait for user to click
      ↓
USER CLICKS "NEXT WORD"
      ↓
[newGame() called again]
      ↓
🔄 REPEAT FROM START 🔄
```

---

## State Mutations by Module

### Module 1 (Word Helpers)
```
buildPlayableWordSet() → Array<word>
  (no state mutations, pure function)

buildPlayScopeKey() → string
  (reads DOM, no state mutations)

(Shuffle bag mutations happen in game.js, not here)
```

### Module 2 (Score Tracking)
```
incrementStreak()
  ✓ currentStreak += 1
  ✓ longestStreak = max(longestStreak, currentStreak)
  ✓ localStorage.setItem('wq_v2_streaks', ...)

recordRoundCompletion()
  ✓ localStorage.setItem('wq_v2_progress', ...)

resetStreakIfNeeded()
  ✓ If >24 hours: currentStreak = 0
  ✓ localStorage.setItem('wq_v2_streaks', ...)
```

### Module 3 (UI Rendering)
```
buildBoard() → DOM mutations
  ✓ Create tile elements

updateCurrentRow() → DOM mutations + animation
  ✓ Update tile text
  ✓ Add 'filled' class
  ✓ Trigger 'just-typed' animation

revealRow() → DOM mutations + animation
  ✓ Add 'correct'/'present'/'absent' classes
  ✓ Trigger flip animation
  ✓ Fire callback after ~520ms

updateKeyboard() → DOM mutations
  ✓ Add status classes to keyboard keys
```

### Module 5 (Game Core)
```
WQGame.startGame() → State mutations
  ✓ currentWord = selected word
  ✓ currentGuess = ''
  ✓ guesses = []
  ✓ gameOver = false
  ✓ localStorage shuffle bag mutations

WQGame.addLetter() → State mutations
  ✓ currentGuess += letter

WQGame.submitGuess() → State mutations
  ✓ Add currentGuess to guesses array
  ✓ Evaluate: set won/lost flags
  ✓ currentGuess = '' (reset)
  ✓ gameOver = true (if won/lost)
```

### app-main.js (Orchestrator)
```
newGame() → Multiple mutations
  ✓ gameStartedAt = Date.now()
  ✓ focusSupportEligibleAt = now + 30000
  ✓ Clear all timers
  ✓ Emit telemetry
  ✓ Update DOM headers
  ✓ Setup listeners

handleKey() → Multiple mutations
  ✓ avaWqLastActionAt = Date.now()
  ✓ Close overlay modals
  ✓ Call WQGame.addLetter()
  ✓ Update UI
  ✓ [On Enter] Call WQGame.submitGuess()
  ✓ Emit telemetry
  ✓ Trigger animations
```

---

## Data Flow Through a Complete Round

```
┌─────────────────────────────────────────────────────────────┐
│ USER STARTS GAME                                            │
│ Input: Grade=3, Length=5, Focus=Word Families              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 1: Word Helpers                                      │
│ buildPlayableWordSet('3', '5', 'word-families')            │
│ Output: ['about', 'after', 'again', 'study', ...]          │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 5: Game.js (Core)                                    │
│ WQGame.startGame({ word: 'study', maxGuesses: 6 })        │
│ Output: { word: 'study', wordLength: 5, gameOver: false }  │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: UI Rendering                                      │
│ WQUI.buildBoard(5, 6)  ← Creates 30 tiles                   │
│ WQUI.buildKeyboard()   ← Creates keyboard                   │
│ Output: DOM rendered                                         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
                [PLAYING GAME]
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ USER TYPES 's' 't' 'u' 'd' 'y'                             │
│ Input: Letter sequence                                      │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 4: Input Validators                                  │
│ checkLetterEntryConstraints('s', state)                    │
│ Output: { ok: true }                                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 5: Game.js                                           │
│ WQGame.addLetter('s')  ← 5 times                           │
│ Output: currentGuess = 'study'                              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: UI Rendering                                      │
│ WQUI.updateCurrentRow('study', 5, 0)  ← Update tiles       │
│ Output: Tiles show 's' 't' 'u' 'd' 'y' with jiggle         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ USER PRESSES ENTER                                          │
│ Input: Key event                                            │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 4: Input Validators                                  │
│ validateGuessCompleteness('study', 5)                      │
│ Output: { valid: true }                                    │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 5: Game.js (Core)                                    │
│ WQGame.submitGuess()                                        │
│ - Evaluate: 'study' vs 'study'                             │
│ - result: ['correct', 'correct', 'correct', 'correct', ... ]
│ Output: { guess: 'study', won: true, ... }                 │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ app-main.js: Emit Telemetry                                 │
│ Emit: 'wq_guess_submit'                                    │
│ Track: timestamp, outcome, etc.                             │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: UI Rendering (Animated)                           │
│ WQUI.revealRow('study', ['correct', ...], 0, 5, callback) │
│ - Tiles flip with staggered timing                         │
│ - Callback fires ~520ms later                              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
                ~520ms passes
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ RevealRow Callback Fires                                    │
│ WQUI.updateKeyboard(['correct', ...], 'study')            │
│ Output: Keyboard keys marked as correct/present/absent     │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 2: Score Tracking                                    │
│ AppScoreTracking.incrementStreak()                         │
│ Output: streak = 1                                         │
│ Side effect: localStorage.setItem('wq_v2_streaks', ...)   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 2: Score Tracking                                    │
│ buildRoundMetrics(result, 6)                               │
│ calculateScore(1, 5) = 150 points                          │
│ Output: { guessesUsed: 1, score: 150, zpdInBand: true }   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: UI Rendering (Celebration)                        │
│ WQUI.celebrateWinRow(0, 5)  ← Confetti animation          │
│ Output: Visual celebration                                 │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
                ~1000ms passes (confetti settles)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Module 3: UI Rendering                                      │
│ WQUI.showModal(result)                                     │
│ Output: Game-over modal with results                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ app-main.js: Sync Integration                               │
│ awardQuestProgress(result, metrics)  ← Update teacher      │
│ trackRoundForReview(result)  ← Spaced repetition           │
│ Emit: 'wq_round_complete' telemetry                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
            [ROUND COMPLETE]
                   ↓
        USER CLICKS "NEXT WORD"
                   ↓
          [newGame() called again]
                   ↓
        🔄 REPEAT FROM START 🔄
```

---

## Critical Timing Checkpoints

```
T=0ms       User clicks "New Game"
T=0-100ms   Build word pool, start game, build UI
T=0-200ms   Coaching timers setup
            [User can start typing immediately]

T=X         User types letters (variable time)
            Each letter: update UI (~50ms)

T=Y         User presses Enter
T=Y+0ms     Submit guess, validate
T=Y+20ms    Emit telemetry
T=Y+50ms    WQUI.revealRow() called
            Animation begins (staggered tiles)

T=Y+50ms    First tile starts flipping
T=Y+335ms   First tile completes flip
T=Y+285ms   Second tile starts flipping
T=Y+620ms   Second tile completes flip
...continues for each tile...

T=Y+520ms   revealRow Callback fires ← CRITICAL CHECKPOINT
            - Update keyboard
            - Check duplicates
            - Decide: continue or game over?

T=Y+520ms   If game over:
T=Y+920ms   WQUI.showModal() fires (after celebration animation)
            [User sees results]

T=Y+920ms+  User can click "Next Word"
```

---

## State Consistency Rules

### Before Each Round
```
✓ gameStartedAt = Date.now()
✓ currentRoundHintRequested = false
✓ currentRoundVoiceAttempts = 0
✓ currentRoundSupportPromptShown = false
✓ All timers cleared
✓ All modals hidden
✓ Board empty
✓ Keyboard state reset
```

### After Each Guess
```
✓ If won:
  - Streak incremented
  - Score calculated
  - Progress recorded
  - Telemeetry emitted

✓ If lost:
  - Streak reset to 0
  - Telemetry emitted
  - Game marked over

✓ If continuing:
  - Keyboard locks updated
  - Next guess ready for input
```

### After Round Complete
```
✓ resetRoundTracking() called
✓ All support/hint/voice counters reset
✓ All timers cleared
✓ hideMidgameBoost() called
✓ Modal shown (after ~520ms animation delay)
✓ Data persisted to localStorage
✓ Telemetry emitted
✓ Teacher integration synced (if not demo)
```

---

## Anti-Patterns to Avoid

```
❌ Calling WQUI.showModal() before revealRow callback
   → Modal shows while tiles are animating
   → Visual glitch

❌ Changing STAGGER, FLIP_SETTLE, REVEAL_FINISH constants
   → Callback timing breaks
   → UI updates happen at wrong times

❌ Calling WQGame.startGame() twice in a row
   → Game state overwrites previous game
   → Data loss

❌ Updating DOM before revealRow callback completes
   → DOM flashing while animation plays
   → Inconsistent state

❌ Not calling resetRoundTracking() between rounds
   → Previous round's state bleeds into new round
   → Streaks/hints incorrectly preserved
```

---

## Testing the State Machine

### Unit Test: New Game
```javascript
// Verify game initializes correctly
const result = WQGame.startGame({ word: 'study', maxGuesses: 6, wordLength: 5 });
assert.equal(result.word, 'study');
assert.equal(result.guess, '');
assert.equal(result.gameOver, false);
```

### Unit Test: Add Letter
```javascript
// Verify letter addition
WQGame.startGame({ word: 'study', ... });
WQGame.addLetter('s');
const state = WQGame.getState();
assert.equal(state.guess, 's');
```

### Integration Test: Full Round
```javascript
// Simulate a complete round
WQGame.startGame({ word: 'study', ... });
WQGame.addLetter('s');
WQGame.addLetter('t');
WQGame.addLetter('u');
WQGame.addLetter('d');
WQGame.addLetter('y');
const result = WQGame.submitGuess();
assert.equal(result.won, true);
assert.equal(result.result[0], 'correct');
```

### E2E Test: UI + Game
```javascript
// Full gameplay with UI
WQUI.buildBoard(5, 6);
WQGame.startGame({ word: 'study', ... });
WQUI.updateCurrentRow('s', 5, 0);
// (assume tiles updated correctly)
const result = WQGame.submitGuess();
WQUI.revealRow(result.guess, result.result, 0, 5, () => {
  assert(true, 'Callback fired');
});
```
