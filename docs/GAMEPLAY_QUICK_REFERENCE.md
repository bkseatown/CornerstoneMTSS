# Gameplay Quick Reference

## Purpose

Use this as the one-page lookup card before touching `js/app-main.js`.

It answers four questions quickly:

1. What are the core data structures?
2. Where do the important functions live?
3. Which module depends on which?
4. What usually breaks first?

## Core Data Structures

### Game State

Source: `WQGame.getState()`

```js
{
  gameOver: boolean,
  won: boolean,
  lost: boolean,
  word: string,
  guess: string,
  guesses: Array,
  result: Array,
  maxGuesses: number,
  wordLength: number,
  error: null | 'too_short',
  lastStartError: null | string
}
```

### Guess Result

Source: `WQGame.submitGuess()`

```js
{
  guess: string,
  word: string,
  won: boolean,
  lost: boolean,
  result: Array,
  guesses: Array,
  error: null | string
}
```

### Round Metrics

Source: `buildRoundMetrics(result, maxGuesses)`

```js
{
  guessesUsed: number,
  hintRequested: boolean,
  voiceAttempts: number,
  durationMs: number,
  skillKey: string,
  skillLabel: string,
  errorCounts: object
}
```

### Review Queue State

Current owner: should move to Module 1 helper boundary

```js
{
  round: number,
  items: [
    {
      word: string,
      dueRound: number,
      reason: string,
      createdAt: number
    }
  ]
}
```

### Gameplay Stats State

Current owner: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-gameplay-stats.js`

```js
{
  activeRoundStartedAt: number,
  currentRoundHintRequested: boolean,
  currentRoundStarterWordsShown: boolean,
  currentRoundVoiceAttempts: number,
  currentRoundErrorCounts: object,
  currentRoundSkillKey: string,
  currentRoundSkillLabel: string
}
```

## Where Things Live

### Module 1: Word / Review Helpers

Current runtime location:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:5569`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:5627`

Key functions:

- `buildPlayableWordSet`
- `countDueReviewWords`
- `peekDueReviewItemForPool`
- `consumeReviewItem`
- `scheduleReviewWord`
- `trackRoundForReview`

### Module 2: Stats / Streak / Round Metrics

Primary module:

- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-gameplay-stats.js](/Users/robertwilliamknaus/Desktop/Cornerstone%20MTSS/js/app-gameplay-stats.js)

Key functions:

- `loadStreak`
- `saveStreak`
- `incrementStreak`
- `beginRound`
- `resetRoundTracking`
- `classifyRoundErrorPattern`
- `recordRoundError`
- `buildRoundMetrics`
- `getRoundState`

### Module 3: UI Rendering

Primary module:

- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/ui.js](/Users/robertwilliamknaus/Desktop/Cornerstone%20MTSS/js/ui.js)

Key functions:

- `buildBoard`
- `updateCurrentRow`
- `revealRow`
- `shakeRow`
- `updateKeyboard`

### Module 4: Input Handling

Current owner:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15126`

Key functions:

- `insertSequenceIntoGuess`
- `handleInputUnit`
- `handleKey`

### Module 5: Game Flow / Orchestration

Current owner:

- new game and round flow in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js`

Key functions and paths:

- `newGame`
- reveal callback after `WQUI.revealRow(...)`
- round-complete telemetry path
- win/loss modal flow

## Dependency Map

```text
WQGame (state engine)
  -> Module 1 helpers choose playable sets and review work
  -> Module 2 helpers track streaks and round metrics
  -> Module 4 input handlers submit letters/guesses
  -> Module 5 orchestrates round lifecycle

Module 4 input handlers
  -> WQGame mutations
  -> Module 3 rendering calls
  -> Module 2 metrics hooks
  -> duplicate-letter toast in app-main.js

Module 5 orchestration
  -> WQGame
  -> Module 2 metrics/streak data
  -> Module 1 review scheduling
  -> Module 3 rendering timing via reveal callback
  -> telemetry emission
```

## Common Error Patterns

### Stale Closure

Symptom:

- extracted helper keeps reading old state after round changes

Look first:

- wrapper functions in `js/app-main.js`
- any cached object returned once and reused forever

### Missing Initialization

Symptom:

- `undefined` module helpers or storage-backed values reset unexpectedly

Look first:

- script load order in `word-quest.html`
- constants defined after module creation

### Timing Bug

Symptom:

- round UI updates happen too early or duplicate

Look first:

- `WQUI.revealRow(..., callback)`
- anything moved out of the reveal callback path

### Storage Conflict

Symptom:

- streak, review queue, or settings reset or collide

Look first:

- localStorage keys
- module code writing to the wrong key

### Over-Modularization

Symptom:

- more files, but harder-to-follow control flow

Look first:

- whether the extracted code still owns DOM timing or orchestration
- whether `newGame()` or `handleKey()` got split too aggressively

## Fast Rules

- Extract pure helpers first.
- Keep `js/ui.js` as the rendering boundary.
- Keep `handleKey()` orchestration in `js/app-main.js`.
- Keep `newGame()` and round-complete orchestration in `js/app-main.js`.
- Keep telemetry on the orchestration path unless a helper already owns that boundary.

## First Commands To Run After Any Slice

- `node --check js/app-main.js`
- `node --check js/app-gameplay-stats.js`
- `npm run hud:check`
- `npm run guard:runtime`
