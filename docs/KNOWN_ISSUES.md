# Known Issues — Cornerstone MTSS

## Priority Issues

### 1. Word Quest Board Initialization — GAME LOGIC
**Status:** Confirmed, needs investigation  
**Severity:** Medium (affects game UX, not critical path)  
**Description:**  
When Word Quest is loaded from the game gallery, the board sometimes initializes with pre-filled letter tiles instead of starting empty. Tiles should only appear through actual gameplay mechanics (clue reveals, hints, etc.).

**Expected Behavior:**
- Gallery card preview: Shows empty 5×3 grid ✅ (CORRECT)
- Game launch from gallery: Board initializes empty, ready for player input
- Tiles populate only through game logic: clue reveals, successful guesses, hints

**Actual Behavior:**
- Sometimes the board loads with tiles pre-filled (e.g., "CHAIR", "BLOOM" visible)
- One tile may be highlighted/selected
- Doesn't follow proper game state progression

**Root Cause:**
Unknown — requires investigation of:
- Game initialization context passing from gallery
- Round/board state creation logic (game-shell.js line ~860)
- Demo/sample data bleeding into live gameplay
- Gallery view state management

**Files to Investigate:**
- `/games/ui/game-shell.js` (createRound logic, ~line 860)
- `/game-platform.html` (gallery context passing)
- `/games/content/game-content-registry.js` (round selection)
- Game state initialization pathway

**Workaround:**
Refresh the game page to reload with correct initial state.

**Next Steps:**
1. Trace complete game initialization pathway from gallery click → board render
2. Identify where tiles are being populated vs. where they should remain empty
3. Verify context/state isn't being pre-filled from gallery preview
4. Add state validation: board should have no tiles on first render

---

### 2. Word Quest UI Styling Regressions — GAME CSS
**Status:** ✅ FIXED (2026-03-18)
**Severity:** Low (affects visual polish, not functionality)
**Description:**
Word Quest game exhibited two styling regressions from earlier color/spacing work:
1. ✅ Game board tiles and keyboard rendered too small with excessive border-radius
2. ✅ Help popup/modal was oversized and obstructed game interaction

**Fixes Applied (Commit 772a70f9):**

**Keyboard Tile Spacing (game-shell.css):**
- Increased gap between keyboard tiles from 10px to 16px
- Improves accessibility for early readers and EAL students

**Help Modal Redesign (word-quest.html, style/components.css, js/app.js):**
- Repositioned modal to right side (off to the side of gameboard)
- Reduced modal size (260px width, more compact padding)
- Updated color scheme: bright blue border with light blue background
- Increased button tap targets from 34px to 40px min-height
- Made modal draggable by header for better positioning flexibility
- Simplified text to be kid-friendly: "Need Help?" / "Try These" / "Get Clue" / "Skip"
- Added hover effects with elevation and scale transforms

---

## Completed Items

### ✅ Visual Redesign — All Non-Game Pages (2026-03-18)
- Implemented warm light theme across 8+ pages
- Updated 13 CSS files with consistent palette
- Added grade level display to schedule blocks
- Fixed accent strip spacing in lesson cards
- Validated with screenshots — all pages pass ✅

### ✅ CER Support Feature Specification (2026-03-18)
- Created `/docs/CER_SUPPORT_SPEC.md`
- Designed grade-differentiated scaffolding (Grades 4-12)
- Added subject-specific sentence starters (ELA, Science, Social Studies)
- Ready for implementation

### ✅ CER Support Phase 1 (2026-03-18)
- Added CER Writing mission button to Writing Studio
- Integrated with existing mission dispatcher pattern
- Wired to launch CER organizer mode with proper scaffolding
- Tested and validated ✅

### ✅ CER Support Phase 2 (2026-03-18)
- Added CER quick-link buttons to ELA/Science/Social Studies lesson cards
- Implemented subject-specific scaffolding modal with Claim → Evidence → Reasoning sections
- Created grade-agnostic sentence starters for 5 subject variants
- Wired click handlers in both student focus view and daily schedule view
- Modal displays correct subject title (e.g., "CER Writing: Reading")
- Footer button links to Writing Studio for extended work
- Tested end-to-end and validated ✅

---

## Future Work

- [ ] Investigate & fix Word Quest board initialization
- [ ] Fix Word Quest UI styling regressions (tile size, help popup sizing)
- [ ] Implement CER Phase 3 (grade-differentiated scaffolding display)
- [ ] Run full audit suite: `npm run audit:ui`, `npm run hud:check`, `npm run release:check`
- [ ] Address 3 pre-existing HUD architecture issues (seahawks gradient, header blocks, game-board blocks)
