# Refactoring Dependency Map for Legacy app.js / Early Split Runtime

## Status

This document is now partly historical context.

- The large runtime described here no longer lives in `js/app.js`.
- Bootstrap handoff now lives in `js/app.js`.
- The main Word Quest runtime now lives in `js/app-main.js`.
- Parts of this plan have already been executed through `js/app-runtime-helpers.js` and `js/app-phonics-clue.js`.

Use `docs/GAMEPLAY_CORE_ANALYSIS.md` and `docs/REFACTOR_ROADMAP.md` as the current source of truth for next extraction order.

## Overview
This document provides **detailed dependency analysis** from the earlier monolithic `app.js` phase. Each slice is listed in extraction order (safest first), with concrete function lists, state mappings, and cross-module dependencies.

---

## SLICE 1: Demo Mode Helpers (Safest — Extract First)

**Lines in app.js:** ~764–1600 (≈837 lines)
**Risk level:** Low — Self-contained, only called during demo gameplay

### Functions to Extract (20 total)
```
enforceLockedDemoDefaults()
getDemoToastLine()
stopDemoToastProgress()
clearDemoToastMessageTimer()
renderDemoToastProgress()
startDemoToastProgress()
setDemoToastText()
setDemoToastTextLiteral()
collapseDemoToast()
showDemoToast()
createDemoBanner()
getDemoLaunchAnchorRect()
positionDemoLaunchButton()
createHomeDemoLaunchButton()
setDemoControlsDisabled()
ensureDemoParam()
removeDemoParams()
exitDemoModeToPlay()
pulseDemoKey()
startDemoKeyPulse()
applySuggestedDemoWord()
ensureDemoCoach()
hideDemoCoach()
positionDemoCoach()
showDemoCoach()
resetDemoScriptState()
runBoardOnlyDemoPlayback()
runDemoCoachForStart()
updateDemoDiscovered()
runDemoCoachAfterGuess()
closeDemoEndOverlay()
showDemoEndOverlay()
```

### State to Move (19 variables)
```
var demoRoundComplete = false;
var demoEndOverlayEl = null;
var demoBannerEl = null;
var demoLaunchBtnEl = null;
var demoCoachEl = null;
var demoCoachReadyTimer = 0;
var demoAutoplayTimer = 0;
var demoDebugLabelEl = null;
var demoToastEl = null;
var demoToastTextEl = null;
var demoToastBarFillEl = null;
var demoToastChipEl = null;
var demoToastProgressTimer = 0;
var demoToastStartedAt = 0;
var demoToastDurationMs = 90000;
var demoToastCollapsed = false;
var demoToastAutoCollapsedByPlay = false;
var demoToastMessageTimer = 0;
var demoToastLastMessageAt = 0;
var demoToastPendingKey = '';
```

### Constants to Move
```
DEMO_WORDS (line 32)
DEMO_TARGET_WORD (line 33)
DEMO_TOAST_DEFAULT_DURATION_MS (line 858)
DEMO_TOAST_MIN_DWELL_MS (line 859)
DEMO_COACH_READY_MAX_TRIES (line 867)
DEMO_COACH_READY_DELAY_MS (line 868)
DEMO_OVERLAY_SELECTORS (line 882)
DEMO_STEP_MESSAGES (dict)
```

### Dependencies (What It Needs From app.js)
```
IMPORTS FROM app.js:
  - DEMO_MODE (boolean flag, passed in or imported)
  - getThemeFamily() [for styling coach/toast in themes]
  - document.querySelector() + DOM APIs [native browser]
  - window event listeners [native browser]

CALLED BY (must remain in app.js):
  - Line 15367: if (DEMO_MODE) runDemoCoachForStart();
  - Line 15630: if (DEMO_MODE) runDemoCoachAfterGuess(result);
  - Line 1162: window.addEventListener('resize', positionDemoLaunchButton);
  - Initialization: createHomeDemoLaunchButton() (line 1137)
```

### Export Surface
```
// js/app-demo-helpers.js should export:
export {
  // Startup
  createHomeDemoLaunchButton,
  // Coach/toast UI
  showDemoCoach,
  runDemoCoachForStart,
  runDemoCoachAfterGuess,
  closeDemoEndOverlay,
  // Toast messaging
  setDemoToastText,
  showDemoToast,
  // Cleanup
  clearDemoAutoplayTimer,
  stopDemoCoachReadyLoop,
  resetDemoScriptState,
  // Debug
  renderDemoDebugReadout
}
```

### Why This Slice First
- ✅ Completely isolated from gameplay loop (called only at boundaries)
- ✅ No dependencies on board state, scoring, or word logic
- ✅ Self-contained DOM and timer management
- ✅ Easy to test: inputs are constants + DEMO_MODE flag

---

## SLICE 2: Overflow & Layout Diagnostics (Low Risk — Extract Second)

**Lines in app.js:** ~1873 and scattered (≈150 lines)
**Risk level:** Low — Only runs in dev/debug mode

### Functions to Extract
```
readDiagnosticsLastReset()
readOverflowState()
formatDiagnosticsReport()
assertHomeNoScroll() [wrapper]
logOverflowDiagnostics() [already in runtime-helpers, may need sync]
```

### State to Move
```
var diagnosticsLastReset = Date.now();
var overflowCheckScheduled = false;
```

### Constants to Move
```
OVERFLOW_CHECK_DEBOUNCE_MS = 500
DIAGNOSTICS_GROUP_NAME = 'Cornerstone Diagnostics'
```

### Dependencies
```
IMPORTS FROM app.js:
  - isDevModeEnabled() function
  - DEMO_DEBUG_MODE flag
  - logOverflow() wrapper function [calls logOverflowDiagnostics]

CALLED BY:
  - Development/debug paths only (conditional checks)
  - Line 53: logOverflow(tag) — wrapper that calls this module
```

### Export Surface
```
export {
  readDiagnosticsLastReset,
  readOverflowState,
  formatDiagnosticsReport,
  initDiagnosticsListeners // new function to attach resize/mutation listeners
}
```

### Why This Slice Second
- ✅ Orthogonal to demo helpers (no shared state)
- ✅ Runs only in dev mode (can't break production)
- ✅ Self-contained logging and diagnostics

---

## SLICE 3: Bootstrap & Route Normalization (Medium Risk — Extract Third)

**Lines in app.js:** ~62–147 (≈85 lines)
**Risk level:** Medium — Runs at startup, failure breaks everything

### Functions to Extract
```
buildCacheBustedUrl()
clearRuntimeCacheAndReload()
showLoadingRecovery()
hideLoadingRecovery()
initializeAppState() [new wrapper]
normalizeRouteOnLoad() [wrapper for route logic]
```

### State to Move
```
var loadingRecoveryShown = false;
const LOADING_WATCHDOG_MS = 18000;
```

### Dependencies
```
IMPORTS FROM app.js:
  - loadingEl (DOM element)
  - document APIs
  - window.location + caches + serviceWorker [native APIs]

CALLED BY:
  - Main IIFE startup (line 9)
  - Watchdog timer setup
  - Must return early if normalizeDemoRoute() redirects
```

### Export Surface
```
export {
  clearRuntimeCacheAndReload,
  showLoadingRecovery,
  hideLoadingRecovery,
  initializeAppOnLoad // initialization orchestrator
}
```

### Why This Slice Third
- ✅ Isolated from gameplay logic
- ✅ Runs once at startup
- ⚠️ Must be tested carefully (affects all page loads)
- ⚠️ Failure here prevents the entire app from working

---

## SLICE 4: Theme & UI-State Wiring (Medium Risk — Extract Fourth)

**Lines in app.js:** ~2248–3100+ (≈850 lines)
**Risk level:** Medium — Many dependent surfaces, but logic is mostly pure functions

### Functions to Extract (30+ total)
```
getThemeFamily()
getThemeFallback()
normalizeTheme()
readThemeFromQuery()
syncThemeToDOM()
applyThemeTokens()
getThemeDisplayLabel()
syncSettingsThemeName()
syncBannerThemeName()
registerThemeSelector()
setupThemeListener()
syncMusicForTheme()
toggleDarkModeForReducedMotion()
readReducedMotionPreference()
readPrefersReducedMotion()
setupMotionPrefListener()
readProjectorMode()
toggleProjectorMode()
```

### State to Move
```
var activeTheme = normalizeTheme();
var activeMotionPref = readReducedMotionPreference();
var activeProjectorMode = readProjectorMode();
var themeInitialized = false;
var syncingTheme = false;
```

### Dependencies
```
IMPORTS FROM app.js:
  - FEATURES object
  - document, localStorage, CSS custom properties
  - All theme lookup tables (theme ID → colors)

CALLED BY:
  - Page load (line 148: "2. Init UI")
  - Theme selector button handlers
  - Music player (for theme-aware colors)
  - Settings/preferences UI

CALLS:
  - getThemeFallback() internally
  - DOM mutation (classList, setAttribute)
  - localStorage.setItem/getItem
```

### Export Surface
```
export {
  // Queries
  getThemeFamily,
  getThemeFallback,
  normalizeTheme,
  getThemeDisplayLabel,
  // Mutations
  syncThemeToDOM,
  applyThemeTokens,
  syncMusicForTheme,
  // Setup
  initializeThemeSystem,
  setupThemeListeners
}
```

### Why This Slice Fourth
- ✅ Mostly self-contained DOM + localStorage logic
- ✅ No dependencies on gameplay state
- ⚠️ Many call sites (theme selector, music player, settings)
- ⚠️ Requires careful testing across all surfaces

---

## SLICE 5: Preferences & Settings (Medium Risk — Extract Fifth)

**Lines in app.js:** ~287–761 (≈475 lines)
**Risk level:** Medium — Multiple surfaces depend on it

### Functions to Extract
```
initializeVoiceMode()
updateVoiceModeUI()
readVoiceSpeed()
setVoiceSpeed()
readHintLevel()
setHintLevel()
readGameBoard Size()
setGameBoardSize()
readTileAnimationPreference()
toggleTileAnimation()
... [other preference getters/setters]
```

### Dependencies
```
IMPORTS FROM app.js:
  - localStorage + DOM selectors
  - FEATURES flags

CALLED BY:
  - Preferences UI handlers (settings.html/word-quest.html)
  - Game initialization [for hint levels, voice speed]

CALLS:
  - DOM updates (classList, dataset, textContent)
  - localStorage read/write
```

### Why This Slice Fifth
- ✅ Mostly localStorage + DOM glue
- ⚠️ Gameplay init depends on these values
- ⚠️ Multiple UI surfaces call into this

---

## SLICE 6+: Gameplay Core (Highest Risk — Do Last)

**Lines in app.js:** ~15,000+ (≈10,000+ lines)
**Risk level:** Very High — Core game logic, scoring, word generation, turn state

### Why This Is Last
- ❌ Deeply interconnected game state
- ❌ High regression risk on any change
- ❌ Hard to extract until other slices are stable
- ✅ Once Slices 1–5 are out, this becomes more obvious

### Recommended Sub-Slices (In Order)
1. Word/hint generation logic → `app-word-helpers.js`
2. Scoring/streak logic → `app-scoring.js`
3. Board rendering → `app-board-renderer.js`
4. Input handling → `app-input-handlers.js`
5. Turn/game state machine → `app-game-state.js`
6. Remaining orchestration → stays in app.js

---

## Cross-Module Dependency Graph

```
app.js (orchestrator after extractions)
├── app-runtime-helpers.js (already extracted)
│   └── Basic setup: detectDemoMode, routes, path resolution
│
├── app-demo-helpers.js (SLICE 1)
│   └── Uses: DEMO_MODE flag, DOM APIs, getThemeFamily
│   └── Called by: Main game loop at boundaries
│
├── app-diagnostics.js (SLICE 2)
│   └── Uses: isDevModeEnabled, logOverflow
│   └── Called by: Development-only code paths
│
├── app-bootstrap.js (SLICE 3)
│   └── Uses: document, window APIs
│   └── Called by: Main IIFE at startup
│
├── app-theme-system.js (SLICE 4)
│   └── Uses: localStorage, CSS custom properties, DOM
│   └── Called by: UI init, music player, settings
│   └── Affects: All visual surfaces
│
├── app-preferences.js (SLICE 5)
│   └── Uses: localStorage, DOM selectors
│   └── Called by: Settings UI, game initialization
│   └── Affects: Voice, hints, board size
│
└── [Gameplay modules] (SLICE 6+)
    └── Word generation, scoring, board rendering, etc.
```

---

## Extraction Checklist For Codex

For **each slice**, follow this process:

1. **Identify functions & state** (use grep patterns provided above)
2. **Extract to new file** (`js/app-SLICE_NAME.js`)
3. **Keep local state** (don't export every variable — use module scope)
4. **Export only the public API** (functions called from outside)
5. **Import only what's needed** (DEMO_MODE, getThemeFamily, etc.)
6. **Load in HTML** before app.js:
   ```html
   <script src="js/app-slice-name.js"></script>
   <script src="js/app.js"></script>
   ```
7. **Run guardrails:**
   ```bash
   npm run guard:runtime
   npm run hud:check
   npm run dom:hooks:check
   ```
8. **Test on target routes** (demo mode for Slice 1, theme selector for Slice 4, etc.)
9. **Document the extraction** in this file's "Completed" section

---

## Completed Extractions

- [ ] SLICE 1: Demo Mode Helpers
- [ ] SLICE 2: Overflow & Diagnostics
- [ ] SLICE 3: Bootstrap & Routes
- [ ] SLICE 4: Theme & UI-State
- [ ] SLICE 5: Preferences & Settings
- [ ] SLICE 6+: Gameplay Core (sub-slices TBD)

---

## Notes for Codex

- **Don't try to be clever.** Exact copy-paste from line numbers is fine.
- **Each extraction must pass guardrails.** If tests break, revert and re-analyze.
- **Scope creep kills these.** Extract the slice, nothing more.
- **Document blockers.** If you find unexpected coupling, update this file so the next slice knows.
- **Test on the actual route** (word-quest.html for gameplay, home for demo, etc.).
