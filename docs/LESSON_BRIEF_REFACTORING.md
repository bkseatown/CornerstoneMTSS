# Lesson Brief Panel - Comprehensive Refactoring Plan

**Current State:** 2,698 LOC, 129 functions in single IIFE module
**Target State:** 6 focused modules + thin coordinator = ~350 LOC main file
**Goal:** 10/10 maintainability, clear responsibilities, testable units

## Module Breakdown

### 1. `lesson-brief-constants.js` (DONE ✅)
**Responsibility:** Static data, lookup tables, constants
**Functions:** ~15 constants, lookup functions
**LOC Reduction:** ~300 LOC from main file

### 2. `lesson-brief-state.js` (DONE ✅)
**Responsibility:** Selection persistence, context, Google state
**Functions:** loadSelection, saveSelection, getSelection, updateSelection, state getters/setters
**LOC Reduction:** ~250 LOC from main file

### 3. `lesson-brief-utils.js` (DONE ✅)
**Responsibility:** DOM helpers, formatting, logging, program utilities
**Functions:** el, escapeHtml, formatGradeLabel, normalizeGrade, buildFishtankGradeLink, etc.
**LOC Reduction:** ~200 LOC from main file

### 4. `lesson-brief-curriculum.js` (IN PROGRESS)
**Responsibility:** All curriculum builders
**Functions:** 10 builders (buildIllustrativeBrief, buildFishtankBrief, buildElBrief, etc.)
**LOC Reduction:** ~600 LOC from main file
**Status:** Self-contained, low coupling

### 5. `lesson-brief-blocks.js` (PENDING)
**Responsibility:** Block/schedule management
**Functions:** getBlocks, saveBlocks, selectBlock, deleteBlock, assignStudentToBlock, etc.
**LOC Reduction:** ~300 LOC from main file

### 6. `lesson-brief-google.js` (PENDING)
**Responsibility:** Google Workspace integration
**Functions:** ensureGoogleConnection, searchGoogleDrive, searchGoogleYouTube, createGoogleFile, etc.
**LOC Reduction:** ~200 LOC from main file

### 7. `lesson-brief-core.js` (PENDING)
**Responsibility:** Main API, event handling, rendering coordinator
**Functions:** open, close, toggle, render, setContext, main event handlers
**LOC Reduction:** Main file becomes thin facade (~300 LOC)

## Implementation Strategy

### Phase 1: Extract self-contained modules ✅ COMPLETE
- [x] lesson-brief-constants.js
- [x] lesson-brief-state.js
- [x] lesson-brief-utils.js

### Phase 2: Extract curriculum builders (HIGH IMPACT)
- [ ] Create lesson-brief-curriculum.js
- [ ] Extract all 10 curriculum builders
- [ ] Extract parseIllustrativeReference, currentBrief, syncLiveFields
- [ ] Update main file to import and delegate

**Estimated Impact:** -600 LOC from main file

### Phase 3: Extract block management
- [ ] Create lesson-brief-blocks.js
- [ ] Move: getBlocks, saveBlocks, selectBlock, deleteBlock, assignStudentToBlock, etc.
- [ ] Update main file

**Estimated Impact:** -300 LOC from main file

### Phase 4: Extract Google integration
- [ ] Create lesson-brief-google.js
- [ ] Move: ensureGoogleConnection, searchGoogleDrive, searchGoogleYouTube, createGoogleFile, importGoogleCalendarBlocks
- [ ] Handle Google API state management

**Estimated Impact:** -200 LOC from main file

### Phase 5: Extract UI rendering
- [ ] Create lesson-brief-ui.js
- [ ] Move: render(), renderOption(), renderList(), renderGoogleWorkspaceCard(), etc.
- [ ] Keep render() as thin dispatcher

**Estimated Impact:** -250 LOC from main file

### Phase 6: Create coordinator (lesson-brief-core.js)
- [ ] Keep open(), close(), toggle(), setContext(), main event handlers
- [ ] Main file becomes ES6 module wrapper
- [ ] All imports from sub-modules

**Final Result:** Main file ~200-300 LOC

## Dependencies

```
lesson-brief-panel.js (facade)
  ├── lesson-brief-core.js (coordinator)
  │   ├── lesson-brief-curriculum.js (builders)
  │   ├── lesson-brief-blocks.js (schedule)
  │   ├── lesson-brief-google.js (Google API)
  │   ├── lesson-brief-ui.js (rendering)
  │   ├── lesson-brief-utils.js (helpers)
  │   └── lesson-brief-state.js (state)
  │       └── lesson-brief-constants.js (constants)
```

## Migration Plan

1. Create each module in isolation
2. Update imports/references in main file incrementally
3. Test after each module extraction
4. Verify browser console for ReferenceErrors
5. Run `npm run module-test` to validate ES6 imports
6. Commit after each major extraction

## Testing Strategy

- [ ] Manual: Open index.html, teacher-hub-v2.html, check console for errors
- [ ] Module test: `npm run audit:ui` to check HUD/navigation
- [ ] Integration: `npm run smoke:teacher-daily-flow` for end-to-end
- [ ] Browser: Load lesson-brief panel, create brief, copy to clipboard
- [ ] No ReferenceErrors in console after each phase

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Main file LOC | 2,698 | ~300 |
| Main file Functions | 129 | ~10 |
| Cyclomatic Complexity | Very High | Low |
| Testability | Poor | Excellent |
| Reusability | Low | High |
| Maintainability | 6/10 | 9/10 |

## Timeline Estimate

- Phase 2 (Curriculum): 45 minutes
- Phase 3 (Blocks): 30 minutes
- Phase 4 (Google): 20 minutes
- Phase 5 (UI): 40 minutes
- Phase 6 (Coordinator): 20 minutes
- **Total: ~2.5 hours** for complete refactor

## Success Criteria

- [ ] All 129 functions accounted for in modules
- [ ] Zero ReferenceErrors in browser console
- [ ] All tests passing (`npm run audit:ui`, `npm run smoke:*`)
- [ ] Main file < 350 LOC
- [ ] Each module < 500 LOC (except curriculum builder)
- [ ] All modules have JSDoc headers
- [ ] No circular dependencies
- [ ] Functionality identical to original

## Rollback Plan

If something breaks:
1. Revert to commit before refactoring started
2. Identify the breaking change
3. Fix in isolation
4. Re-test before proceeding

## Notes

- Each module is independent and can be extracted separately
- Constants module is already extracted ✅
- State management module is already extracted ✅
- Utilities module is already extracted ✅
- Focus next on curriculum builders (highest LOC reduction)
- Lesson-brief-panel.js will become a thin ES6 wrapper
