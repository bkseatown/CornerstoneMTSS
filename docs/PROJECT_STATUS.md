# Project Status

## Snapshot

Cornerstone MTSS is currently a static-first front-end platform with multiple instructional and specialist-facing surfaces served directly from the repo root.

Current IA direction:
- Main Landing Page -> Specialist Hub
- Specialist Hub -> My Students, My Workspace, My Activities
- Student Profiles are child pages opened from My Students and other specialist workflows
- My Workspace is the full-data specialist surface for reports, meeting prep, exports, and cross-student planning

The highest-confidence entry points are:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-students.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/student-profile.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`

## How To Run It

1. From `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS`, run `npm install`.
2. Start a local static server with `python3 -m http.server 4173`.
3. Open `http://127.0.0.1:4173/index.html`.

Playwright is already configured around port `4173`.

## Current Reliable Checks

- `npm run guard:runtime`
- `npm run hud:check`
- `npm run app:factories:check`
- `npm run dom:hooks:check`
- `npm run audit:a11y`
- `npm run test:visual:regression`
- `npm run release:check`

## Repo Reality Notes

- The repo contains a root-level `server.js`, but the older docs that referenced `server/` setup, database bootstrap scripts, and WebSocket collaboration flows no longer match the current checked-in structure.
- Several historical planning and summary documents remain in the root. Treat them as context, not as guaranteed current operating instructions.
- `README.md`, `QUICK_START.md`, and this file should be the first places to check before trusting older handoff language.
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DOCS_INDEX.md` classifies which docs are current, working, or historical.

## Main Architecture Areas

- Landing and game bootstrap: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js`
- Main Word Quest runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-runtime-helpers.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-phonics-clue.js`
- My Workspace surface: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/dashboard/`
- Specialist Hub: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/teacher/`
- My Activities shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/`
- Shared themes and HUD system: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-registry.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-nav.js`

## Canonical Naming Reality

- Canonical surface routes:
  - `specialist-hub.html`
  - `my-students.html`
  - `my-workspace.html`
  - `my-activities.html`
  - `student-profile.html`
- Canonical activity routes:
  - `word-quest.html`
  - `reading-lab.html`
  - `sentence-studio.html`
  - `writing-studio.html`
  - `typing-quest.html`
  - `number-lab.html`
  - `number-lab/index.html`
  - `precision-play.html`
- Legacy names still exist only for compatibility and redirects:
  - `teacher-hub-v2.html`
  - `teacher-dashboard.html`
  - `reports.html`
  - `case-management.html`
  - `game-platform.html`
  - `sentence-surgery.html`
  - `numeracy.html`
  - `numeracy/index.html`

## Word Quest Refactor Reality

- The current checked-in Word Quest split is real, not just planned:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js` is about 184 lines.
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js` is about 4,291 lines.
- That means the old “18k app-main.js” planning state is stale. Use current file sizes and loaded modules, not the older extraction estimates, when judging progress.
- The remaining `word-quest-runtime.js` is now mostly orchestration, reveal flow, input flow, voice flow, and other tightly coupled runtime control paths.
- `word-quest.html` already loads the extracted runtime modules before `word-quest-runtime.js`; use `npm run app:factories:check` to verify expected factory coverage before trusting claims that modules are “missing from HTML.”
- The active naming cleanup is now complete at the platform/runtime layer:
  - canonical activity IDs now include `typing-quest`, `dont-say-it`, `sentence-studio`, `word-categories`, `word-quest`, `reading-lab`, and `number-lab`
  - evidence, signal, planner, export, and page-mode layers now accept legacy names but write canonical names for active flows
- Large extracted module families already in the repo include:
  - focus/curriculum/search: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-search-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-curriculum-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-grade-runtime.js`
  - support flow: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-logic.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-ui.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-input-shell.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-input-constraints.js`
  - Deep Dive: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-builders.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-core-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-session.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-state.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-ui.js`
  - round/reveal/runtime support: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-start-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-submit-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-flow-support.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-voice-support.js`
  - session/reporting/runtime support: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-analytics.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-controls.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-exports.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-mastery.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-probe.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-summary-runtime.js`, `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-student-session-runtime.js`

## Current Cleanup Focus

- Continue shrinking `js/word-quest-runtime.js` only where the extracted boundary is behavior-neutral.
- Prefer deleting stale inline helpers once a replacement module is wired, instead of leaving shadow implementations behind.
- Fix init-order regressions from the runtime split before trusting live browser verification. The current active bug-fix pattern is “lazy dependency wiring first, then live browser retest.”

## Immediate Risks

- Top-level docs can drift faster than the code unless they are updated alongside structural changes.
- A few core front-end files are still large, especially `js/word-quest-runtime.js`, `specialist-hub.js`, and `my-workspace.css`, which raises change risk.
- Some Word Quest modules were extracted faster than their initialization order was cleaned up, so startup regressions are currently a bigger risk than raw file size alone.
- Historical product naming still appears in deeper datasets, audio packs, CSS class names, and compatibility aliases, but these are no longer the canonical route/UI/runtime names.

## Recommended Next Cleanup Targets

1. Keep `docs/DOCS_INDEX.md` current whenever root-level project docs change status.
2. Use `docs/ARCHITECTURE_MAP.md` before large cross-surface edits.
3. Use `docs/GAMEPLAY_CORE_ANALYSIS.md` plus `docs/REFACTOR_ROADMAP.md` for the current `js/word-quest-runtime.js` extraction order.
4. Use `docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md` when extracting the next safe helper slices from `js/word-quest-runtime.js`.
5. Use `docs/GAMEPLAY_MODULES_3_4_5_DEEP_DIVE.md` plus `docs/MODULES_3_4_5_EXTRACTION_PLAYBOOK.md` before changing rendering, input flow, or round orchestration. The current guidance is to keep `js/ui.js` as the rendering layer, extract only helper logic from Module 4, and leave Module 5 orchestration in `js/word-quest-runtime.js`.
6. Use `docs/GAMEPLAY_QUICK_REFERENCE.md` as the fast lookup card for state shapes, module boundaries, and common failure patterns.
7. If you consult `docs/MODULES_1_2_EXTRACTION_PLAYBOOK.md` or `docs/CODEX_QUICK_REFERENCE.md`, treat them as supplemental. They contain useful tactics, but some example module names and extraction targets do not yet match the current checked-in runtime split.
