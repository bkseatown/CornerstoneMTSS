# app.js Modularization & Extraction Plan

**Status**: In Progress
**Current Size**: 18,700 lines
**Target Size**: <8,000 lines (guardrail)
**Reduction Target**: ~10,700 lines (57%)

---

## Overview

`app.js` is a monolithic file containing 12 major sections with significant interdependencies. This plan outlines a phased extraction strategy to break it into focused modules while maintaining functionality and respecting the CODE_HEALTH_GUARDRAILS.

### Current Section Breakdown

| Section | Lines | Description | Status |
|---------|-------|-------------|--------|
| 1. Load data | 86 | WQData initialization | ✓ Base |
| 2. Init UI | 139 | DOM setup, element IDs | ✓ Base |
| 3. Preferences | 2,751 | User settings panel | ⚙️ Target |
| 4. Theme/projector/motion | 2,631 | Theme switching, motion controls | ⚙️ Target |
| 5. Settings panel wiring | 3,632 | Settings event handlers | ⚙️ Target |
| 6. Focus + grade alignment | 2,139 | Grade band filtering logic | ⚙️ Target |
| 7. New game | 3,740 | Game initialization, reveal flow | ⚙️ Target |
| 8. Input handling | 579 | Event listener wiring | ✓ Base |
| 9. Gameplay audio buttons | 2,525 | Deep Dive, Phonics Clue, narration | 🔄 In Progress |
| 10. Duplicate toast | 74 | Duplicate letter notification | ✓ Base |
| 11. Confetti | 65 | Celebration animation | ✓ Base |
| 12. Start | 45 | Initialization sequence | ✓ Base |

---

## Extraction Phases

### Phase 1: Phonics Clue Sprint (In Progress)

**Module**: `app-phonics-clue.js`
**Lines**: 456 (17956-18411)
**Dependencies**: `_el()`, `WQUI.showToast()`
**Complexity**: Low-Medium

**Completed**:
- ✅ Created `app-phonics-clue.js` factory function module
- ✅ Added module script to `word-quest.html` (line 1370)
- ✅ Module tested in isolation; dependency injection working

**TODO**:
- [ ] Initialize module in app.js (line ~18656)
- [ ] Update event listeners in Section 8 (lines 15862-15903) to call module methods
- [ ] Remove original Phonics Clue code from Section 9 (lines 17956-18411)
- [ ] Test all UI interactions work correctly
- [ ] Verify guardrail compliance

**Event Listener Updates Required**:
```javascript
// Current (in app.js)
_el('phonics-clue-start-btn')?.addEventListener('click', () => {
  void startPhonicsClueDeck();
});

// After integration
_el('phonics-clue-start-btn')?.addEventListener('click', () => {
  void phonicsClueModule.startDeck();
});

// Line 15877 also accesses phonicsClueState directly:
if (phonicsClueState.started && phonicsClueState.current) {
  startPhonicsClueTurnTimer();
}

// Will become:
if (phonicsClueModule.phonicsClueState.started && phonicsClueModule.phonicsClueState.current) {
  phonicsClueModule.startTurnTimer();
}
```

**Risk Level**: 🟡 Medium (event handler logic)

---

### Phase 2: Deep Dive Challenge (Planned)

**Module**: `app-challenges.js`
**Lines**: 1,964 (15992-17955)
**Dependencies**: HIGH - 15+ external functions and 5+ global objects
**Complexity**: HIGH

**Challenge**: This section is heavily interdependent with:
- `_el()` - DOM queries
- `prefs` - User preferences object
- `WQGame` - Global game state
- `WQData` - Word data lookups
- `WQAudio` - Audio playback
- `WQUI` - UI notifications
- `emitTelemetry()` - Analytics
- Multiple validation/normalization functions from other sections
- Global state variables (challengeModalReturnFocusEl, revealChallengeState, etc.)

**Approach**:
1. Create factory function accepting dependency object
2. Encapsulate state within module closure
3. Return object with public methods for modal management
4. Gradually migrate event listener calls (Section 8, lines 15905-15914)

**Risk Level**: 🔴 High (extensive interdependencies)

---

### Phase 3: Settings Panel Wiring (Planned)

**Module**: `app-settings-wiring.js`
**Lines**: 3,632 (5902-9533)
**Dependencies**: Medium - mostly internal to this section
**Complexity**: Medium

**Opportunity**: This section is relatively self-contained event handler wiring. Many functions depend only on global objects that can be injected.

**Approach**:
1. Extract all `addEventListener` calls
2. Move internal helper functions
3. Pass in required dependencies via factory function
4. Leave core settings state in app.js initially

**Risk Level**: 🟡 Medium

---

### Phase 4: Theme / Projector / Motion (Planned)

**Module**: `app-theme.js`
**Lines**: 2,631 (3271-5901)
**Dependencies**: Medium - `_el()`, CSS custom properties, DOM manipulation
**Complexity**: Medium

**Approach**:
1. Extract theme switching logic
2. Create factory function for theme management
3. Expose public methods: `setTheme()`, `toggleDarkMode()`, etc.
4. Return theme state observer

**Risk Level**: 🟡 Medium

---

### Phase 5: Preferences (Planned)

**Module**: `app-preferences.js`
**Lines**: 2,751 (520-3270)
**Dependencies**: Medium - accesses `prefs` object, localStorage
**Complexity**: Medium-High

**Approach**:
1. Extract preference validation/normalization functions
2. Create factory for preference UI building
3. Keep global `prefs` object but encapsulate mutations
4. Return UI builder and getter/setter methods

**Risk Level**: 🟡 Medium

---

### Phase 6: Focus + Grade Alignment (Planned)

**Module**: `app-grade-focus.js`
**Lines**: 2,139 (9534-11672)
**Dependencies**: Low-Medium - mostly self-contained
**Complexity**: Low

**Approach**:
1. Extract all grade band filtering logic
2. Create lookup functions for grade-to-band conversion
3. Pass in `WQData` as dependency for word pool lookups
4. Return pure utility functions

**Risk Level**: 🟢 Low

---

### Phase 7: New Game Initialization (Planned)

**Module**: `app-new-game.js`
**Lines**: 3,740 (11673-15412)
**Dependencies**: HIGH - calls into nearly everything
**Complexity**: HIGH

**Challenge**: Orchestrates game initialization, depends on:
- Theme system
- Grade/focus alignment
- Preferences loading
- WQData lookups
- Audio initialization
- UI rendering
- Telemetry

**Approach**:
1. Create factory function accepting all dependencies
2. Build in phases (theme → grade → prefs → data → UI → audio)
3. Return `newGame()` and related functions
4. Maintain call order and timing

**Risk Level**: 🔴 High (orchestration complexity)

---

## Extraction Patterns & Best Practices

### Pattern: Factory Function with Dependency Injection

```javascript
// Module definition
function createModuleName(deps) {
  const { _el, WQData, WQUI, ... } = deps;

  // Private state
  let privateState = { ... };

  // Private functions
  function helper() { ... }

  // Public methods
  function publicMethod() { ... }

  // Return public API
  return {
    publicMethod,
    getState: () => privateState
  };
}

// In app.js initialization
const moduleName = createModuleName({
  _el,
  WQData,
  WQUI,
  // ... other deps
});
```

### Pattern: Gradual Migration

When integrating a new module:
1. **Create module file** with full implementation
2. **Add script tag** to HTML
3. **Initialize in app.js** (late, after dependencies are ready)
4. **Update event listeners** to call module methods
5. **Remove original code** only after verification

### Dependency Injection Best Practices

✅ **DO**:
- Pass dependencies explicitly via factory function parameters
- Return plain objects with public methods
- Encapsulate state within module closure
- Use consistent naming patterns (e.g., `create*Module`)

❌ **DON'T**:
- Create new global variables
- Access global functions not in deps object
- Expose internal state unnecessarily
- Break existing function signatures

---

## Guardrail Compliance Strategy

### lint-sizes.js
- **Current**: 18,700 lines (app.js alone)
- **Target**: <8,000 lines (app.js after all extractions)
- **Exemptions**: None for app.js
- **Action**: Extract aggressively; modules with <400 lines ideal

### lint-important.js
- **Current status**: Monitor during extraction
- **Action**: Track `!important` declarations in new modules
- **Set exemption limits** if inherited from app.js

### lint-duplicates.js
- **Current status**: Monitor CSS in extracted modules
- **Action**: Document duplicate selectors as tech debt if unavoidable
- **Approach**: Use exemption mechanism for known duplicates

### Updated lint-tokens.js Exemptions

```javascript
// Existing exemptions (game-shell extracts, teacher-hub)
// Add as modules are extracted:
// 'app-phonics-clue.js' - if it has hardcoded UI strings
// 'app-challenges.js' - if it has hardcoded challenge metadata
```

---

## Risk Mitigation

### Testing Checklist (for each module extraction)

- [ ] Module initializes without errors (check browser console)
- [ ] Module dependencies are correctly injected
- [ ] All event listeners properly wired
- [ ] Game flow: new game → reveal → challenge → toast
- [ ] Audio playback: word, definition, sentence narration
- [ ] Settings panel: update prefs, see UI changes
- [ ] Theme toggle: light/dark modes work
- [ ] Phonics Clue: start deck, advance cards, timer works
- [ ] Deep Dive: start challenge, complete steps, save progress
- [ ] No regressions in unrelated features

### Safe Extraction Order (Recommended)

1. **Phase 1** (Phonics Clue) ← **Current** 🔄
2. **Phase 6** (Grade/Focus) - lowest complexity
3. **Phase 4** (Theme) - self-contained styling logic
4. **Phase 3** (Settings Wiring) - isolated event handlers
5. **Phase 5** (Preferences) - complex but self-contained
6. **Phase 2** (Deep Dive) - highest complexity, extract last
7. **Phase 7** (New Game) - orchestration, extract after dependencies

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| app.js line count | 18,700 | <8,000 | 🔄 In Progress |
| Modules created | 1 | 7 | 🔄 1/7 |
| Guardrail compliance | N/A | 100% | 🔄 Monitoring |
| Test coverage | Manual | Automated | 🔢 Pending |

---

## Timeline & Effort Estimates

| Phase | Lines | Effort | Risk | Timeline |
|-------|-------|--------|------|----------|
| 1 - Phonics Clue | 456 | 2 hrs | 🟡 Med | **1 session** (current) |
| 2 - Deep Dive | 1,964 | 4 hrs | 🔴 High | 2 sessions |
| 3 - Settings | 3,632 | 3 hrs | 🟡 Med | 2 sessions |
| 4 - Theme | 2,631 | 3 hrs | 🟡 Med | 2 sessions |
| 5 - Preferences | 2,751 | 3 hrs | 🟡 Med | 2 sessions |
| 6 - Grade/Focus | 2,139 | 2 hrs | 🟢 Low | 1 session |
| 7 - New Game | 3,740 | 4 hrs | 🔴 High | 2 sessions |
| **TOTAL** | **18,913** | **21 hrs** | Mixed | **12 sessions** |

---

## Notes for Future Work

### Known Technical Debt
- Phonics Clue Sprint: Timer state management could be more robust
- Deep Dive Challenge: localStorage usage could be abstracted
- Settings: Some duplicate validation logic exists in prefs section

### Optimization Opportunities
1. Extract validation/normalization functions into utilities
2. Create shared helper library for string manipulation
3. Move all localStorage access behind abstraction
4. Consolidate DOM query patterns

### Architecture Improvements
1. Use event emitter pattern for state changes
2. Implement proper error boundaries for async operations
3. Add logging/debugging hooks to module initialization
4. Create module dependency graph documentation

---

## Files Modified/Created

### Created
- ✅ `js/app-phonics-clue.js` (456 lines) - Phonics Clue Sprint module

### Modified
- ✅ `word-quest.html` - Added `app-phonics-clue.js` script tag (line 1370)
- 🔄 `js/app.js` - Pending full integration (Section 9 extraction)

### Pending
- `js/app-challenges.js`
- `js/app-settings-wiring.js`
- `js/app-theme.js`
- `js/app-preferences.js`
- `js/app-grade-focus.js`
- `js/app-new-game.js`

---

## Related Documentation

- `CODE_HEALTH_GUARDRAILS.md` - Enforcement rules
- `scripts/lint-sizes.js` - Line count enforcement
- `scripts/lint-important.js` - !important declaration limits
- `scripts/lint-duplicates.js` - CSS selector deduplication
- `scripts/lint-tokens.js` - CSS token compliance
