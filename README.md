# Cornerstone MTSS

Cornerstone MTSS is a specialist-facing instructional support platform with a clear top-level structure: Main Landing Page, Specialist Hub, My Students, My Workspace, My Activities, and Student Profiles.

My Workspace is the planning and reporting surface that contains the specialist's full data view: reports, meeting prep, exports, cross-student planning, and related documentation.
Student Profiles are the per-student detail surfaces for individual progress reporting, meeting notes, and support history.

Canonical surface routes now match the product language:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-students.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/student-profile.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`

Canonical activity routes now include:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reading-lab.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sentence-studio.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/number-lab.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/number-lab/index.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/typing-quest.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/precision-play.html`

Legacy routes like `teacher-hub-v2.html`, `case-management.html`, `reports.html`, `game-platform.html`, `sentence-surgery.html`, `numeracy.html`, and `numeracy/index.html` are now compatibility shims or redirects and should not be treated as canonical names.

Canonical naming is now complete across the active platform layer:
- visible surface/page names
- activity routes and launcher labels
- active Word Quest control IDs and page markers
- canonical activity IDs in the launcher/runtime layer
- evidence/reporting names for active writes
- Word Quest page-mode, planner launch, export-prefix, and telemetry labels now write `word-quest`

Remaining old names are intentionally compatibility-only or deeper internal taxonomy/data domains, not the primary product language.

## Source Of Truth
- Primary working folder: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS`
- Treat this folder as canonical.
- Keep `.zip` files as read-only backups, not as active dev sources.
- Product direction and requirements baseline:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/VISION.md`
- Current continuity docs:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DOCS_INDEX.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/SHIP_AND_DEBUG_CHECKLIST.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ARCHITECTURE_MAP.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_CORE_ANALYSIS.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_QUICK_REFERENCE.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/MODULES_3_4_5_EXTRACTION_PLAYBOOK.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/progress.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/QUICK_START.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DEPLOYMENT_GUIDE.md`

Supplemental refactor notes that may describe target-state module names rather than current checked-in files:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/MODULES_1_2_EXTRACTION_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/CODEX_QUICK_REFERENCE.md`

## Quick Start
1. Install dependencies:
   - `cd /Users/robertwilliamknaus/Desktop/Cornerstone MTSS`
   - `npm install`
2. Run local server:
   - `python3 -m http.server 4173`
3. Open:
   - `http://127.0.0.1:4173/index.html`
4. Hard refresh when needed:
   - `Cmd+Shift+R`

## What This Repo Is Building
- A full specialist/intervention platform, not only a word game.
- A shared premium game family with distinct identities:
  - Word Quest
  - Don't Say It!
  - Typing Quest
  - Sentence Studio
  - Reading Lab
  - Writing Studio
  - Number Lab
- A no-scroll-by-default desktop product surface where pages should fit cleanly unless the viewport is truly small.
- A visually advanced but readable interface with strong contrast, EAL-friendly support, and adaptive scaffolding.

## Important Note For New Codex Threads
A new Codex thread in this same worktree should not be assumed to know prior or archived conversation history.
Use the repo docs as the durable memory layer:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DOCS_INDEX.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/SHIP_AND_DEBUG_CHECKLIST.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/progress.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/QUICK_START.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DEPLOYMENT_GUIDE.md`

## HUD Guardrails
- Run contract checks:
  - `npm run hud:check`
- Run offline/audio checks:
  - `npm run audio:manifest`
  - `npm run audio:manifest:check`
  - `npm run offline:check`
- Run pre-deploy gate:
  - `npm run release:check`
- Run file-scope safety checks:
  - `npm run scope:view`
  - `npm run scope:check`
  - `npm run scope:strict`
- Main docs:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DOCS_INDEX.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/SHIP_AND_DEBUG_CHECKLIST.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ARCHITECTURE_MAP.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/REFACTOR_ROADMAP.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/QUICK_START.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DEPLOYMENT_GUIDE.md`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/progress.md`

## Key Architecture Files
- Entry/UI wiring:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-runtime-helpers.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-phonics-clue.js`
- Shared game platform:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/precision-play.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/ui/game-shell.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/ui/game-shell.css`
- Theme system:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-registry.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-nav.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/themes.css`
- HUD styles/motion:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/modes.css`
- Contract tooling:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/scripts/check-hud-contract.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/scripts/build-audio-manifest.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/scripts/check-audio-manifest-sync.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/scripts/check-offline-contract.js`

## Word Quest Runtime Status
- Current checked-in split:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js` is the bootstrap entry and is intentionally small at about 184 lines.
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js` is the remaining Word Quest orchestration core and is about 4,291 lines.
- The old 18k-era `app-main.js` state is no longer current. A large amount of runtime code has already been moved into extracted modules that are loaded by `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`.
- High-value extracted runtime modules now include:
  - focus and curriculum: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-search-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-curriculum-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-grade-runtime.js`
  - support and hints: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-logic.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-ui.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-input-shell.js`
  - Deep Dive and round flow: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-builders.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-core-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-session.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-state.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-ui.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-start-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-submit-runtime.js`
  - reveal, session, and voice support: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-flow-support.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-*.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-playlist-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-student-session-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-teacher-state.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-voice-support.js`
- Current cleanup focus:
  - keep reducing `js/word-quest-runtime.js` where safe
  - remove stale inline helpers instead of leaving duplicate wrappers
  - keep canonical product names aligned across routes, activity IDs, evidence modules, and active docs
  - preserve compatibility aliases only where they protect old links or saved local data

## Deploy Target
- GitHub Pages workflow:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.github/workflows/deploy-pages.yml`
- Deployment gate:
  - `npm run release:check`
- Deploy trigger:
  - push to `main` (or run workflow manually in GitHub Actions)

## Pages Freshness Monitor
- Scheduled workflow:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.github/workflows/pages-freshness.yml`
- Schedule:
  - runs hourly (`cron: 17 * * * *`) and on manual dispatch.
- What it checks on live GitHub Pages:
  - `/CornerstoneMTSS/build.json` returns valid JSON and contains `buildId`.
  - `build.json.time` is parseable and not stale (older than 14 days).
  - `/CornerstoneMTSS/my-workspace.html` includes:
    - `build-stamp.js`
    - `js/build-badge.js`
    - `js/nav-shell.js`
  - `/CornerstoneMTSS/style/tokens.css` returns `200` and `content-type: text/css`.
- Failure behavior:
  - workflow fails and opens a GitHub issue with a link to the failed run.
- Manual run:
  1. Open GitHub Actions.
  2. Select `Pages Freshness`.
  3. Click `Run workflow` (branch `main`).
  4. Review logs and summary table.

## Collaboration Workflow (Recommended)
1. Propose a small change batch (1-3 deltas).
2. Convert request into measurable acceptance rules.
3. Implement only in scoped files.
4. Run the route-appropriate checks.
5. Verify the actual rendered page with a fresh cache-busted URL.
6. Commit only after pass/fail report is clean.

## Current Regression Themes
- Typing Quest has historically had duplicate welcome/layout owners.
- Word Quest has historically regressed through decorative overlays and excessive support chrome.
- Cache/build drift can make the browser look stale even when code changed.
- Scroll on normal desktop viewports is usually a design smell first, not a feature.

## Industry UI/UX Audit Commands
- Accessibility (serious/critical WCAG A/AA): `npm run audit:a11y`
- Core Web Vitals budget checks: `npm run audit:performance`
- Visual baseline capture: `npm run test:visual:update`
- Visual regression check: `npm run test:visual:regression`
- Cross-browser runtime + a11y matrix: `npm run audit:matrix`
- Full audit bundle: `npm run audit:industry`
- Audit stack details: [INDUSTRY_EVALUATION_STACK.md](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/INDUSTRY_EVALUATION_STACK.md)

## Request Template For Future Edits
- `Surface`:
- `Intent`:
- `Must Keep`:
- `Must Avoid`:
- `Acceptance`:

## Offline Notes
- Service worker is registered from `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js` and defined in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sw.js`.
- Audio path inventory is generated to `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/data/audio-manifest.json`.
- Full library offline is browser-storage dependent; app shell and previously used audio are prioritized.

## Music Track Pipeline
- Drop licensed or self-made files into:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/assets/music/tracks/`
- Optional filename metadata pattern:
  - `track-name__modes-focus+chill__bpm-92__energy-low.wav`
- Sync catalog + ledger:
  - `npm run music:catalog`
- Generated files:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/data/music-catalog.json`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/data/music-license-ledger.json`
- Runtime behavior:
  - File tracks are used first (by mode), with synth fallback if catalog/load/playback fails.

## Phase 15: Bug Fixes & Visual Polish (March 2026)

### Critical Fixes
1. **JS IIFE Syntax Error (Line 2889)**
   - **Issue:** Straight double-quotes (`””`) used in a `.showToast()` call where curly quotes were intended
   - **Effect:** Entire `specialist-hub.js` module failed to parse silently; hub did not initialize
   - **Fix:** Replaced `””` with escaped single quotes `’` in the Classroom sync toast message
   - **Impact:** Hub now boots correctly, morning brief renders, students populate sidebar

2. **Tour Auto-Launch Blocking Content**
   - **Issue:** `CSTour.init()` ran automatically with 600ms delay on every page load, triggering popup overlays that blocked the main interface
   - **Fix:** Removed auto-launch; tour now initializes lazily only when user clicks “Tour” button
   - **Impact:** Landing page and hub load cleanly without blocking popups

3. **Mobile Layout: Double Scroll & Footer Overlap**
   - **Issue:** Shell was `height: 100dvh; overflow: hidden` with two independent scroll regions (sidebar @ 42dvh, main @ remainder), causing two separate scroll bars. Footer (Curriculum/Tour/Analytics) overlapped between student list items.
   - **Root Cause:** `.th2-list { flex: 1 1 0% }` from desktop (shrink-to-fill) was collapsing list to 148px in an auto-height parent on mobile.
   - **Fixes:**
     - Changed shell to `height: auto; min-height: 100dvh; overflow: visible` for single-page scroll
     - Override list to `flex: 0 0 auto` on mobile so it sizes to natural content height (all 5 students visible)
   - **Impact:** Single unified scroll on mobile, no overlapping footer, all students visible before footer

4. **Azure Cost Dashboard Auto-Show**
   - **Issue:** Cost tracking dashboard auto-showed on localhost, blocking content
   - **Fix:** Removed auto-show logic; dashboard stays hidden until user explicitly opens it
   - **Impact:** Cleaner developer experience, no content blocked

5. **Browser Cache Preventing Updates**
   - **Issue:** Cache busters in HTML (`v=20260305a`) were static; edits to .js/.css files returned 304 Not Modified
   - **Fix:** Bumped all 33 cache buster references from `v=20260305a` → `v=20260306a`
   - **Impact:** Fresh file loads immediately in browser

### Visual Improvements

6. **Dark Background → Light Cool Gray**
   - **Before:** Dark slate gradient `#8fa3bd → #7d94b0 → #6f8ba5` (hard on eyes, high contrast)
   - **After:** Light cool gray gradient `#e8edf4 → #dce4ee → #d1dae8` (soft, calming, accessible)
   - **Sidebar:** Updated to `#f0f3f8` with `#c5cfe0` subtle borders
   - **Impact:** Better readability, reduces eye strain, professional appearance

7. **Build Badge Too Prominent**
   - **Before:** Dark pill background, green status dot, z-index 2147483600, high opacity, 11px font
   - **After:** Ghost style with opacity 0.5, 9px font, no dot, subtle gray text
   - **Impact:** Badge no longer distracts from main content while remaining available for debugging

### Browser/Cache Considerations

- **serve strips query params on redirects** — demo flag persisted to `localStorage[“cs.hub.demo”]`
- All files now properly cache-busted to force fresh loads after edits
- CSS media queries reorganized to prevent duplicate blocks (removed stale 600px duplicates)

### Testing Completed

✅ Desktop (1280px): Two-column layout, light background, all UI elements visible, no overlapping
✅ Mobile (375px): Single-page scroll, footer properly positioned below all students, no double scroll
✅ Tour: Launches only on button click, no auto-popups blocking content
✅ Cache: All files load fresh; edits immediately reflected in browser

---

## Teacher Workflow (Command Hub)
1. Open [specialist-hub.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html) — the Specialist Hub
2. **Sign in with Google** (optional) to sync roster from Google Classroom
3. View your caseload with urgency-ranked students in sidebar
4. **Morning Brief:** Rich intelligence surface showing tier distributions, top priority students, and recommended next steps
5. Click a student to see **Focus Card** with plan recommendations, support strategies, and evidence snapshots
6. Use **Curriculum panel** (📚 button) to quick-reference all 54 Fish Tank units, assessment batteries, and YouTube resources
7. Track usage with optional **Analytics panel** (📊 button)
8. Optional: Configure Azure OpenAI for AI-powered coaching narration and sub-plan generation

### Legacy Workflow Redirects
1. Older links like [teacher-dashboard.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.html), [reports.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html), [teacher-hub-v2.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.html), and [case-management.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/case-management.html) are preserved only as compatibility routes.
2. New work should use [specialist-hub.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html), [my-workspace.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html), and [my-students.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-students.html).
