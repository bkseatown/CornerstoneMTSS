# Architecture Map

## Purpose

This is a lightweight map of the current runtime so future changes can start from the right files without reverse-engineering the whole repo.

## Top-Level Surfaces

- Landing shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`
- Core game surface: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`
- Teacher workflow surface: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html`
- Specialist hub: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.html`
- Additional learning surfaces:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reading-lab.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sentence-surgery.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/precision-play.html`

## Runtime Ownership Map

### Landing And Word Quest

- Bootstrap entry/runtime wiring: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js`
- Main Word Quest runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js`
- Extracted support modules:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-runtime-helpers.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-phonics-clue.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-logic.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-support-ui.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-input-shell.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-input-constraints.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-search-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-curriculum-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-focus-grade-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-demo-flow.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-demo-ui.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-builders.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-config.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-core-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-modal.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-session.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-state.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-ui.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-flow-support.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-runtime-support.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-text.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-effects.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-timing-support.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-analytics.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-controls.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-exports.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-mastery.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-probe.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-summary-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-voice-support.js`
- Supporting preview/motion/theme files:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest-preview.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/hero-v2.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-registry.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/theme-nav.js`
- Shared style system:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/tokens.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/themes.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/modes.css`

### Teacher Dashboard / Reports

- Page shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html`
- Main dashboard runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js`
- Main dashboard styles: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css`
- Dashboard modules: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/dashboard/`
- Teacher intelligence/storage support:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/teacher/teacher-storage.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/teacher/teacher-intelligence.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/evidence-store.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/evidence-engine.js`

### Teacher Hub V2

- Page shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.html`
- Main runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.js`
- Main styles:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-main.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-sidebar.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-animations.css`

### Game Platform Components

- Shared platform shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/game-platform.html`
- Core logic: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/core/`
- Content registries: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/content/`
- Shared game UI: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/games/ui/`

## Data And Support Systems

- Static data: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/data/`
- Offline/cache support:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sw.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sw-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/cache-engine.js`
- Build/version support:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/build.json`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/build-stamp.js`

## Current Complexity Hotspots

These are the files most likely to create wide regression risk:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-main.js` about 5,954 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.js` about 7,032 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.js` about 5,143 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css` about 5,097 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js` about 2,992 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js` about 184 lines and intentionally small

## Word Quest Runtime Note

- The old 18k planning numbers for `js/app-main.js` are now historical context only.
- The remaining risk in Word Quest is less about raw file size and more about runtime coupling and init-order correctness across the extracted modules loaded in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`.
- When debugging Word Quest boot failures, check load order and lazy dependency wiring first before assuming the extracted module itself is wrong.

## Change Strategy

When making changes:

1. Identify the surface first.
2. Prefer surface-local files before touching shared runtime files.
3. If a change requires `js/app-main.js` or `teacher-hub-v2.js`, assume the blast radius is high and run the route-appropriate checks.
