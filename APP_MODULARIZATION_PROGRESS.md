# app.js Modularization Progress Report

**Date**: March 17, 2026
**Session Focus**: app.js Section 9 (Gameplay Audio Buttons) Analysis & Phonics Clue Module Extraction
**Status**: 🔄 In Progress (Foundation Established)

---

## Executive Summary

Initiated comprehensive app.js modularization to address CODE_HEALTH_GUARDRAILS violations:
- **app.js**: 18,701 lines (limit 8,000) — **10,701 lines over**
- **word-quest.html**: 1,413 lines (limit 500) — **913 lines over**

**Completed**:
- ✅ Created modular extraction framework
- ✅ Extracted Phonics Clue Sprint module (app-phonics-clue.js)
- ✅ Documented comprehensive 7-phase extraction plan
- ✅ Identified interdependencies and risk levels

**Progress**: 1 of 7 modules created (14% complete) — Ready for Phase 2

---

## Guardrail Check Results

```
✓ 2 file(s) within size limits

❌ File Size Limit Violations (CODE_HEALTH_GUARDRAILS.md Rule 1.1):

❌ js/app.js: 18701 lines exceeds limit of 8000
   Limit: 8000 lines | Current: 18701 lines
   → Split into modules and re-run lint

❌ word-quest.html: 1413 lines exceeds limit of 500
   Limit: 500 lines | Current: 1413 lines
   → Split into modules and re-run lint
```

**Implications**:
- Both files require RFC exception (currently valid under exception process)
- Mandatory refactor required within 6 months
- Current work implements mandatory refactor proactively

---

## What Was Done This Session

### 1. Analyzed Section 9: Gameplay Audio Buttons (2,525 lines)

Discovered this section contains THREE distinct subsystems:

| Subsystem | Lines | Complexity | Status |
|-----------|-------|-----------|--------|
| **Phonics Clue Sprint** | 456 | Low-Medium | ✅ Extracted |
| **Deep Dive Challenge** | 1,964 | High | 🔄 Analyzed |
| **Audio Playback Integration** | 103 | Low | 📋 Documented |

**Key Finding**: Section 9 is not monolithic—it contains loosely-coupled game modes that can be extracted independently.

### 2. Created app-phonics-clue.js Module (456 lines)

**File**: `js/app-phonics-clue.js`
**Pattern**: Factory function with dependency injection
**Status**: Ready for integration

```javascript
// Public API
const module = createPhonicsClueModule({ _el, WQUI });

// Available methods
module.openModal();
module.closeModal();
module.startDeck();
module.advanceCard();
module.skipCard();
module.awardGuessPoint();
module.awardBonusPoint();
module.toggleTargetVisibility();
module.renderPanel();
// ... more methods
```

**Dependencies**: Minimal (2 external functions)
- `_el()` — DOM element getter
- `WQUI.showToast()` — Toast notifications

**Encapsulated State**:
- `phonicsClueDeckMap` — Deck data cache
- `phonicsClueState` — Game state
- `phonicsClueDeckPromise` — Async loading promise

### 3. Updated word-quest.html

**Change**: Added script tag for app-phonics-clue module
```html
<script src="js/app-music.js?v=20260317a"></script>
<script src="js/app-phonics-clue.js?v=20260317a"></script>
<script src="js/app.js?v=20260317a"></script>
```

**Effect**: Module available for integration but not yet wired into event handlers

### 4. Created Comprehensive Extraction Plan (EXTRACTION_PLAN.md)

**Document**: Outlines strategy for all 7 modules
**Sections**:
- Current section breakdown with line counts and complexity
- 7 extraction phases with risk assessment
- Factory function pattern documentation
- Guardrail compliance strategy
- Safe extraction order (recommended sequence)
- Timeline and effort estimates (21 hours total)
- Testing checklist for each phase

**Key Recommendations**:
1. **Extract Phonics Clue first** ← Current phase
2. Grade/Focus alignment (lowest complexity)
3. Theme system (self-contained styling)
4. Settings wiring (isolated event handlers)
5. Preferences (complex but self-contained)
6. Deep Dive Challenge (highest complexity)
7. New Game initialization (orchestration logic)

---

## Technical Analysis: Section 9 Breakdown

### Phonics Clue Sprint (Lines 17956-18411, 456 lines)

**Status**: ✅ **READY FOR INTEGRATION**

**What it does**: Game mode where students guess words based on clues (avoiding taboo words). Includes:
- Deck loading and card shuffling
- Timer management
- Points/scoring system
- Modal UI rendering
- Settings synchronization

**Dependencies**:
- `_el()` — Get DOM elements
- `WQUI.showToast()` — Show feedback messages

**Event Listeners** (in app.js Section 8, lines 15862-15903):
- phonics-clue-start-btn → `startPhonicsClueDeck()`
- phonics-clue-guess-btn → `awardPhonicsClueGuessPoint()`
- phonics-clue-bonus-btn → `awardPhonicsClueBonusPoint()`
- phonics-clue-next-btn → `advancePhonicsClueCard()`
- phonics-clue-skip-btn → `skipPhonicsClueCard()`
- phonics-clue-hide-btn → `togglePhonicsClueTargetVisibility()`
- Plus 4 dropdown change handlers

**Integration Next Steps**:
1. Initialize module at end of app.js (after line 18655)
2. Update 10 event listener callbacks to call module methods
3. Remove original code from lines 17956-18411
4. Test Phonics Clue deck loading and gameplay

**Estimated Time**: 1-2 hours (with testing)

---

### Deep Dive Challenge (Lines 15992-17955, 1,964 lines)

**Status**: 🔄 **COMPLEX - REQUIRES CAREFUL PLANNING**

**What it does**: Extended learning mode where students complete 3 tasks (Listen/Analyze/Create) on a single word. Includes:
- Challenge state management
- Task progression tracking
- Deep Dive variant selection (chunk vs anchor, definition vs context, etc.)
- UI rendering and modal management
- Progress persistence to localStorage
- Score computation with rubric
- Telemetry emission
- Integration with WQDeepDiveCoreFeature

**Dependencies** (15+ external):
- Global objects: `prefs`, `WQGame`, `WQData`, `WQAudio`, `WQUI`
- Global functions: `emitTelemetry()`, `localDayKey()`, `isConsecutiveDay()`, etc.
- Multiple validation functions: `normalizeThinkingLevel()`, `normalizeReviewWord()`, etc.
- Global state variables: `challengeModalReturnFocusEl`, `revealChallengeState`, etc.
- Window objects: `window.WQDeepDiveCoreFeature`

**Challenge**: High interdependence requires:
- Careful dependency injection
- State encapsulation within closure
- Minimal exposure of internal functions
- Thorough testing of challenge flow

**Integration Approach**:
1. Create factory function accepting all deps object
2. Encapsulate all state within closure
3. Return object with public methods for modal management
4. Gradually migrate event listeners
5. Test all challenge flows (start → task progression → completion)

**Estimated Time**: 3-4 hours (complex, high-risk)

**Risk Level**: 🔴 **HIGH**

---

### Audio Playback Integration (Lines 18413-18515, 103 lines)

**Status**: 📋 **DOCUMENTED, LOW PRIORITY**

**What it does**: Event listeners for audio buttons:
- "Hear word" button → `WQAudio.playWord()`
- "Hear definition" button → `playMeaningWithFun()`
- "Hear sentence" button → `WQAudio.playSentence()`

**Current Implementation**:
```javascript
_el('g-hear-word')?.addEventListener('click', () => {
  cancelRevealNarration();
  void WQAudio.playWord(entry());
});
// ... similar for definition and sentence
```

**Opportunity**: Could be abstracted into audio-playback utility, but low priority (only 103 lines).

---

## Critical Dependencies Identified

### Global Functions (Appear Throughout app.js)
- `_el(elementId)` — DOM element getter (base utility)
- `newGame()` — Game initialization
- `normalizeReviewWord()` — Word validation
- `normalizeThinkingLevel()` — Level validation
- `getFocusLabel()` — UI label builder
- `formatGradeBandLabel()` — Grade display
- `getEffectiveGameplayGradeBand()` — Grade mapping
- `shouldExpandGradeBandForFocus()` — Grade expansion logic
- `isMissionLabEnabled()` — Feature flag
- `isMissionLabStandaloneMode()` — Mode check
- `getRevealPacingMode()` — Pacing preference
- `getRevealAutoNextSeconds()` — Auto-advance timing
- `getVoicePracticeMode()` — Voice mode getter
- `localDayKey()` — Date key generation
- `isConsecutiveDay()` — Date comparison
- `getActiveStudentLabel()` — Student name getter

### Global Objects (Must be Injected)
- `prefs` — User preferences (mutable)
- `WQGame` — Game state object
- `WQData` — Word/entry data access
- `WQAudio` — Audio playback control
- `WQUI` — UI utilities (toast, pulse, etc.)
- `window.WQDeepDiveCoreFeature` — External deep dive module

### Global Variables (Section 9)
- `revealNarrationToken` — Narration cancellation token
- `voiceIsRecording` — Voice practice state
- `voiceTakeComplete` — Voice practice completion flag
- `challengeModalReturnFocusEl` — Focus management
- `challengeSprintTimer` — Duplicate letter timer
- `challengePacingTimer` — Pacing nudge timer

---

## Recommended Next Steps

### Immediate (Next Session)
1. **Complete Phonics Clue Integration**
   - Initialize module in app.js
   - Update event listeners (10 locations)
   - Remove original code (456 lines)
   - Test Phonics Clue gameplay
   - Commit: "Extract Phonics Clue Sprint module"
   - **Expected result**: app.js reduced to ~18,245 lines

2. **Prepare Deep Dive Challenge Extraction**
   - Create dependency interface
   - Design factory function signature
   - Map all 15+ dependencies
   - Create test plan
   - **Output**: Design document for review

### Short Term (Next 2-3 Sessions)
3. Extract **Grade/Focus Alignment** (2,139 lines)
   - **Expected result**: app.js reduced to ~16,106 lines
4. Extract **Theme System** (2,631 lines)
   - **Expected result**: app.js reduced to ~13,475 lines
5. Extract **Settings Wiring** (3,632 lines)
   - **Expected result**: app.js reduced to ~9,843 lines
6. Extract **Preferences** (2,751 lines)
   - **Expected result**: app.js reduced to ~7,092 lines ✅ **GOAL MET**

### Medium Term (Later)
7. Extract **Deep Dive Challenge** (1,964 lines)
   - Requires careful planning due to complexity
   - Most impactful for code quality
8. Extract **New Game Initialization** (3,740 lines)
   - Orchestration logic, high interdependence
   - Consider doing after all helpers extracted

---

## Success Criteria

### Phase 1 (Current): Phonics Clue
- [ ] Event listeners updated and tested
- [ ] Original code removed from Section 9
- [ ] Phonics Clue gameplay working in browser
- [ ] Commit passes all guardrails (lint-sizes, lint-important, lint-duplicates)
- [ ] app.js reduced to ~18,245 lines

### Overall Project
- [ ] app.js reduced to <8,000 lines (mandatory)
- [ ] word-quest.html reduced to <500 lines (high priority)
- [ ] All 7 modules created and integrated
- [ ] Guardrail compliance: 100%
- [ ] No regressions in game functionality
- [ ] Browser testing: all features work

---

## Files Modified

### Created (This Session)
- ✅ `js/app-phonics-clue.js` (456 lines) — Phonics Clue module
- ✅ `EXTRACTION_PLAN.md` (340+ lines) — Comprehensive extraction strategy
- ✅ `APP_MODULARIZATION_PROGRESS.md` (this document)

### Modified (This Session)
- 🔄 `word-quest.html` — Added app-phonics-clue.js script tag
- 📋 `js/app.js` — Only modified to add script initialization (pending)

### Pending Creation
- `js/app-challenges.js` — Deep Dive Challenge module
- `js/app-settings-wiring.js` — Settings panel event wiring
- `js/app-theme.js` — Theme system
- `js/app-preferences.js` — Preferences management
- `js/app-grade-focus.js` — Grade/focus alignment
- `js/app-new-game.js` — Game initialization

---

## Architecture Notes

### Pattern Established: Factory Functions with Dependency Injection

All extracted modules follow this pattern:
```javascript
function createModuleName(deps) {
  // Dependencies injected as parameters
  const { _el, WQData, WQUI, ... } = deps;

  // Private state encapsulated in closure
  let internalState = { ... };

  // Private helper functions
  function privateHelper() { ... }

  // Public API
  return {
    publicMethod1() { ... },
    publicMethod2() { ... },
    getState() { return internalState; }
  };
}
```

**Benefits**:
- Clear dependency declaration
- State encapsulation
- No global pollution
- Testable in isolation
- Gradual migration path (old code can coexist)

### Integration Strategy: Three-Phase

1. **Create module** with full implementation
2. **Add script tag** to HTML
3. **Initialize module** and update callers gradually
4. **Remove original code** only after verification

This approach allows parallel old/new code during transition phase.

---

## Known Issues & Workarounds

### Issue 1: Global State Mutation
**Problem**: `prefs` object is mutated throughout app.js
**Impact**: Difficult to isolate in modules
**Approach**: Accept as injected dependency, document as "mutable state"

### Issue 2: Event Listener Interdependencies
**Problem**: Multiple event listeners reference same state
**Impact**: Changing one listener requires understanding all
**Approach**: Group related listeners, provide module methods for each

### Issue 3: Async Loading (Data & Audio)
**Problem**: WQData, WQAudio initialization timing unclear
**Impact**: Modules may initialize before data is ready
**Approach**: Use factory function timing; document assumptions

---

## References

- **CODE_HEALTH_GUARDRAILS.md** — Enforcement rules and exceptions process
- **EXTRACTION_PLAN.md** — Detailed 7-phase extraction strategy
- **scripts/lint-sizes.js** — File size enforcement (8000 line limit)
- **scripts/lint-important.js** — !important declaration limits
- **scripts/lint-duplicates.js** — CSS selector deduplication
- **js/app-music.js** — Reference implementation (factory pattern)

---

## Conclusion

Foundation established for successful app.js modularization:
- ✅ Extraction pattern documented and demonstrated
- ✅ Phonics Clue module created and ready
- ✅ Comprehensive strategy mapped for remaining 6 modules
- ✅ Interdependencies identified and planned
- ✅ Timeline and effort estimates provided
- ✅ Risk levels assigned to each phase

**Next Session Focus**: Complete Phonics Clue integration (1-2 hours), then move to Grade/Focus extraction.

**Expected Outcome**: app.js reduced to <8,000 lines within 5-6 sessions (10-15 hours total effort).
