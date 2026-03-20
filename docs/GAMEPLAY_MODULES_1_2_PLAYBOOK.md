# Gameplay Modules 1 and 2 Playbook

## Purpose

This is the current execution playbook for the safest `js/app-main.js` reductions.

Use it when extracting:

- Module 1: word and curriculum helpers
- Module 2: score, streak, and round-stats helpers

This document is intentionally mechanical: exact file anchors, exact dependencies, exact edit sequence, and exact checks.

## Current Reality

- `js/app.js` is already the small bootstrapper.
- `js/ui.js` is already the rendering layer and is not the next extraction target.
- `js/app-gameplay-stats.js` already owns part of Module 2.
- `js/app-main.js` still contains the main Module 1 logic and the remaining Module 2 call sites.

## Current File Anchors

### Module 1: Word and Curriculum Helpers

Primary current anchors in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js`:

- `buildPlayableWordSet()` at line 5569
- `countDueReviewWords()` at line 5580
- `peekDueReviewItemForPool()` at line 5586
- `consumeReviewItem()` at line 5594
- `scheduleReviewWord()` at line 5606
- `trackRoundForReview()` at line 5627

Likely callers:

- round-complete flow at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15310`
- due-count refresh at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15322`

### Module 2: Score, Streak, and Round Stats

Already extracted to `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-gameplay-stats.js`:

- `loadStreak()` at line 27
- `saveStreak()` at line 35
- `incrementStreak()` at line 41
- `beginRound()` at line 47
- `resetRoundTracking()` at line 66
- `setHintRequested()` at line 76
- `setStarterWordsShown()` at line 80
- `setVoiceAttempts()` at line 84
- `incrementVoiceAttempts()` at line 88
- `classifyRoundErrorPattern()` at line 93
- `recordRoundError()` at line 114
- `buildRoundMetrics()` at line 121
- `getRoundState()` at line 139

Remaining Module 2-adjacent helpers still in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js`:

- `renderSafeStreak()` at line 555
- `loadMidgameBoostState()` at line 11445
- `saveMidgameBoostState()` at line 11463
- `nextMidgameBoostCard()` at line 11469
- `showMidgameBoost()` at line 11517
- `syncRoundTrackingLocals()` at line 11738
- `resetRoundTracking()` bridge at line 11750
- `buildRoundMetrics()` bridge at line 11759
- `classifyRoundErrorPattern()` bridge at line 11773
- `maybeShowErrorCoach()` at line 11777

Main round-complete call sites:

- win streak update at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15267`
- midgame boost trigger at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15255`
- round metrics + telemetry at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15289`

## Blocking Note Before Any Edits

Do not start Module 1 or Module 2 extraction from memory.

Open these first:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_QUICK_REFERENCE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_3_4_5_DEEP_DIVE.md`

Those three docs give the current data shapes, timing constraints, and orchestration boundaries.

## Recommended Extraction Order

1. Finish Module 2 first where the boundary already exists.
2. Then extract Module 1 review and playable-word helpers.
3. Leave Module 4 and Module 5 orchestration in `js/app-main.js`.

## Module 2 Playbook

### Slice 2A: Keep Using `js/app-gameplay-stats.js` as the Stats Boundary

Goal:

- Extend the existing factory module instead of creating a second overlapping stats module.

Safe candidates to move next:

- `loadMidgameBoostState()`
- `saveMidgameBoostState()`
- `nextMidgameBoostCard()`

Only move them if the new module stays DOM-free. Do not move:

- `showMidgameBoost()` yet, because it writes DOM, binds handlers, and owns presentation.
- `maybeShowErrorCoach()` yet, because it still sits in orchestration flow.

Dependencies required for a DOM-free Module 2 extension:

- `storage`
- `clock`
- `normalizeCounterMap`
- `getSkillDescriptorForRound`
- `normalizeReviewWord`
- `emitTelemetry`
- `midgameBoostKey`
- `midgameBoostPool`
- `buildMidgameBoostState`

Good module shape:

```js
function createGameplayStatsModule(deps) {
  return {
    loadStreak,
    saveStreak,
    incrementStreak,
    beginRound,
    resetRoundTracking,
    buildRoundMetrics,
    classifyRoundErrorPattern,
    recordRoundError,
    loadMidgameBoostState,
    saveMidgameBoostState,
    nextMidgameBoostCard,
    getRoundState
  };
}
```

### Module 2 Exact Edit Order

1. Open `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-gameplay-stats.js`.
2. Add only DOM-free helpers to the factory return.
3. Keep `js/app-main.js` wrappers intact.
4. Replace inline helper bodies in `js/app-main.js` with module delegation only after the new factory exports exist.
5. Do not move `showMidgameBoost()` or reveal-callback logic.

### Module 2 Copy Pattern

Old pattern in `js/app-main.js`:

```js
function someHelper(args) {
  // logic here
}
```

New pattern in `js/app-gameplay-stats.js`:

```js
function someHelper(args) {
  // same logic here
}

return {
  // existing exports...
  someHelper
};
```

Then replace in `js/app-main.js` with:

```js
function someHelper(args) {
  return gameplayStats?.someHelper?.(args);
}
```

### Slice 2B: Preserve the Thin Bridge in `js/app-main.js`

Keep these wrappers in place even after more Module 2 extraction:

- `renderSafeStreak()`
- `syncRoundTrackingLocals()`
- `resetRoundTracking()`
- `buildRoundMetrics()`
- `classifyRoundErrorPattern()`

Why:

- They protect the rest of `js/app-main.js` from a large call-site rewrite.
- They keep the orchestration layer readable.
- They make regressions easier to isolate.

### Module 2 Before/After Checklist

Before:

- Confirm the moved helpers do not call `_el()`, `WQUI`, or `document`.
- Confirm telemetry still emits from orchestration or from the existing module boundary only.
- Confirm storage keys are still initialized before module creation.

After:

- `node --check js/app-gameplay-stats.js`
- `node --check js/app-main.js`
- `npm run hud:check`
- `npm run guard:runtime`

Manual spot checks:

- win one round and confirm streak still increments
- lose a round and confirm round-complete telemetry path still finishes cleanly
- reach guess three and confirm the midgame boost still appears
- use a hint and confirm round metrics still reflect hint usage

## Module 1 Playbook

### Scope to Extract

The best current Module 1 extraction is the review-and-word-selection cluster around line 5569 in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js`.

Recommended first batch:

- `buildPlayableWordSet()`
- `countDueReviewWords()`
- `peekDueReviewItemForPool()`
- `consumeReviewItem()`
- `scheduleReviewWord()`
- `trackRoundForReview()`

Recommended destination:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-word-review.js`

Why this batch:

- The functions already form a coherent cluster.
- They depend on data and storage, not on rendering.
- Their main call sites are narrow and easy to verify.

### Dependencies to Pass In

Do not let the extracted module reach broadly into global scope. Pass what it needs:

- `storage`
- `now`
- `getPlayableWords`
- `normalizeReviewWord`
- `getEffectiveGameplayGradeBand`
- `shouldExpandGradeBandForFocus`
- `getTopErrorKey`
- `reviewQueueKey`
- `reviewQueueMaxItems`

Good factory shape:

```js
function createWordReviewModule(deps) {
  return {
    buildPlayableWordSet,
    countDueReviewWords,
    peekDueReviewItemForPool,
    consumeReviewItem,
    scheduleReviewWord,
    trackRoundForReview,
    loadReviewQueueState,
    saveReviewQueueState,
    getReviewQueueState
  };
}
```

### Module 1 Exact Edit Order

1. Create `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-word-review.js`.
2. Move the review-queue ownership into that file first:
   - `loadReviewQueueState`
   - internal `reviewQueueState`
   - `saveReviewQueueState`
3. Move the read-only helpers next:
   - `buildPlayableWordSet`
   - `countDueReviewWords`
   - `peekDueReviewItemForPool`
4. Move the queue mutation helpers next:
   - `consumeReviewItem`
   - `scheduleReviewWord`
   - `trackRoundForReview`
5. Add one small helper for current direct state access:
   - `findMatchingDueReview(word)`
6. Add the script to `word-quest.html` before `js/app-main.js`.
7. Instantiate the module in `js/app-main.js`.
8. Replace the old function bodies with wrappers.
9. Replace direct `reviewQueueState` access with `findMatchingDueReview()` or `getReviewQueueState()`.

### Module 1 Copy Pattern

Old cluster in `js/app-main.js`:

```js
function buildPlayableWordSet(gradeBand, lengthPref, focusValue) {
  // logic
}

function countDueReviewWords(playableSet) {
  // logic
}
```

New module file pattern:

```js
function createWordReviewModule(deps) {
  function buildPlayableWordSet(gradeBand, lengthPref, focusValue) {
    // same logic
  }

  function countDueReviewWords(playableSet) {
    // same logic
  }

  return {
    buildPlayableWordSet,
    countDueReviewWords
  };
}
```

Replacement wrappers in `js/app-main.js`:

```js
function buildPlayableWordSet(gradeBand, lengthPref, focusValue) {
  return wordReview?.buildPlayableWordSet?.(gradeBand, lengthPref, focusValue) || new Set();
}

function countDueReviewWords(playableSet) {
  return wordReview?.countDueReviewWords?.(playableSet) || 0;
}
```

### Module 1 Extraction Notes

- Keep `reviewQueueState` owned by the new module once moved.
- Keep `trackRoundForReview()` pure with respect to UI; it should schedule data, not render feedback.
- Normalize words at the module edge, not at every caller.
- Return `Set` from `buildPlayableWordSet()` exactly as today so downstream checks stay unchanged.

### Module 1 Script Loading Order

If a new script is added, load it in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html` before `js/app-main.js` and after the lower-level helpers it depends on.

Current pattern:

1. `js/app-runtime-helpers.js`
2. `js/app-phonics-clue.js`
3. `js/app-gameplay-stats.js`
4. `js/app-main.js`
5. `js/app.js`

Recommended if Module 1 gets its own file:

1. `js/app-runtime-helpers.js`
2. `js/app-phonics-clue.js`
3. `js/app-gameplay-stats.js`
4. `js/app-word-review.js`
5. `js/app-main.js`
6. `js/app.js`

Rule:

- helper factories first
- orchestration last

### Module 1 Current Direct State Read To Replace

There is one direct review-queue lookup in the new-game flow:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js:15049`

Do not leave that as raw state access after extraction.

Replace it with one of:

```js
const matchedDueReview = wordReview?.findMatchingDueReview?.(startedWord) || null;
```

or:

```js
const matchedDueReview = (wordReview?.getReviewQueueState?.().items || []).find(...);
```

Prefer `findMatchingDueReview()` because it keeps state ownership inside the module.

### Module 1 Before/After Checklist

Before:

- Confirm all target functions are DOM-read-only or DOM-free.
- Confirm no extracted function writes to `WQUI`.
- Confirm `reviewQueueState` initialization can move without changing semantics.

After:

- `node --check js/app-word-review.js`
- `node --check js/app-main.js`
- `node --check js/app-gameplay-stats.js`
- `npm run hud:check`
- `npm run guard:runtime`

Manual spot checks:

- start a new round and confirm a playable word still loads
- finish a hard round and confirm review scheduling still happens
- finish a lost round and confirm review queue growth still behaves
- complete a round and confirm due-count refresh still updates

## Common Failure Modes

- Stale local references after extraction: wrappers in `js/app-main.js` still need to sync from the module state.
- Missing storage initialization: keys like `SAFE_STREAK_KEY` and review queue constants must exist before factory creation.
- Hidden DOM coupling: if a helper touches `_el()`, `document`, or `WQUI`, it is not ready for a pure helper module.
- Timing mistakes: keep the `WQUI.revealRow(..., callback)` flow and the 520ms reveal sequencing in `js/app-main.js`.
- Telemetry drift: `wq_round_complete` and related orchestration events should stay emitted from the round-complete path unless a module already owns that boundary.

## Success Definition

The extraction is successful if:

- `js/app-main.js` gets smaller
- no user-visible behavior changes
- guardrails still pass
- the new module owns one clear responsibility
- orchestration in `js/app-main.js` becomes easier to read, not more fragmented

## Rollback Procedure

If the extraction fails:

1. Revert only the current slice files.
2. Restore script order in `word-quest.html`.
3. Restore original inline function bodies in `js/app-main.js`.
4. Run:
   - `node --check js/app-main.js`
   - `npm run hud:check`
5. Reattempt the slice in smaller steps.

First places to inspect when guardrails fail:

- missing script include in `word-quest.html`
- helper factory created after first use
- wrapper names not matching exported names
- storage key or dependency passed as `undefined`
