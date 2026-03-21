# Refactor Roadmap

## Goal

Reduce change risk by shrinking the biggest runtime hotspots without destabilizing the product.

## Highest-Priority Targets

### 1. `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js`

Why first:

- It is now the largest gameplay runtime file in the repo at about 18,071 lines.
- It owns the main Word Quest UI orchestration after bootstrap was moved out of `js/app.js`.
- Most future game regressions and maintenance cost now concentrate here.

Recommended extraction order:

1. Word and curriculum helpers
2. Score, streak, and stats tracking
3. Keep `js/ui.js` as the rendering layer unless a future slice is clearly DOM-safe and worth moving
4. Extract only validation-style helpers from input handling
5. Keep game flow orchestration in `js/word-quest-runtime.js`
6. Audio and accessibility helpers

Important coupling notes:

- Keep telemetry emission in `js/word-quest-runtime.js` even when score and metrics helpers move out.
- Treat round-tracking cleanup as part of game-flow orchestration, not as a standalone helper extraction.
- Keep the duplicate-letter toast in `js/word-quest-runtime.js` for now. It is small, low-value to extract early, and sits on the path from input handling to UI feedback.
- Treat `js/ui.js` as the current Module 3 boundary. It is already the clean UI layer.
- Do not extract the main `handleKey()` flow early. If Module 4 moves at all, move pure helpers like validation and feedback utilities.
- Treat Module 5 as the orchestrator. Do not extract `newGame()` or round-complete control flow unless a future slice is mostly pure helper logic.

### 2. `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.js`

Why second:

- It is large enough to carry meaningful regression risk on every hub change.
- The hub is operationally important and recently had a boot-blocking syntax issue.

Recommended extraction order:

1. Data loading and initialization
2. Sidebar/list rendering
3. Modal and workspace state
4. Tour/help behavior
5. Sync/integration helpers

### 3. `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css`

Why third:

- It is one of the largest style files and likely central to layout regressions.
- Visual work is harder to reason about when one stylesheet owns too many regions.

Recommended extraction order:

1. Shell/layout primitives
2. Sidebar and list styles
3. Modal styles
4. Card/panel variants
5. Responsive overrides

### 4. `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.js`

Why fourth:

- It is large enough to benefit from extraction but likely lower deployment risk than the landing and teacher surfaces above.

### 5. `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js`

Why fifth:

- This file is no longer a refactor hotspot. It is now the small bootstrap entry at about 184 lines.
- Keep it small and stable. Changes here should stay limited to startup wiring, data loading, and handoff into `js/word-quest-runtime.js`.

## Refactor Rules

1. Do not combine refactoring with major UI redesign.
2. Extract one responsibility at a time.
3. Add or run route-appropriate checks after each extraction.
4. Prefer moving code into adjacent feature folders instead of creating a new generic utilities graveyard.
5. Keep public behavior unchanged until the file boundaries are stable.

## Definition Of A Good Refactor Slice

A slice is good if:

- it has one clear ownership boundary,
- it can be verified with an existing test or smoke command,
- it reduces the amount of unrelated code touched in future edits.

## Suggested First Slice

Start with `js/word-quest-runtime.js` word and curriculum helpers, then score and stats tracking. Those are still the best low-risk extractions now that bootstrap, runtime helpers, and Phonics Clue have already been pulled out. Use `docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md` when doing the actual extraction work.

## Current Runtime Reality

These Word Quest files are already split and should be treated as the current source of truth:

- `js/app.js`: bootstrap and data-load handoff
- `js/word-quest-runtime.js`: main Word Quest runtime and gameplay UI orchestration
- `js/app-runtime-helpers.js`: runtime helpers, demo/route support, diagnostics helpers
- `js/app-phonics-clue.js`: extracted Phonics Clue Sprint module

## Recommended Next Step

Use `docs/GAMEPLAY_CORE_ANALYSIS.md` as the primary roadmap for `js/word-quest-runtime.js` extraction order, use `docs/GAMEPLAY_MODULES_DEEP_DIVE.md` for implementation detail, use `docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md` for exact Module 1 and Module 2 extraction steps, and use `docs/MODULES_3_4_5_EXTRACTION_PLAYBOOK.md` when touching Modules 3, 4, or 5. Treat `docs/REFACTORING_DEPENDENCY_MAP.md` as historical context unless it is refreshed to match the current split runtime.
