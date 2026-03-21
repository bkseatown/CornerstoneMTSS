# Architecture Map

## Purpose

This is a lightweight map of the current runtime so future changes can start from the right files without reverse-engineering the whole repo.

## Top-Level Surfaces

- Main Landing Page: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/index.html`
- Specialist Hub: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html`
- My Students: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-students.html`
- Student Profile: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/student-profile.html`
- My Workspace: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html`
- My Activities launcher: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`
- Core Word Quest activity: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`

Current product meaning:
- Main Landing Page opens into Specialist Hub.
- Specialist Hub is the command center and primary post-login destination.
- My Students is the student directory and access point into Student Profiles.
- Student Profiles hold one student's individual progress reporting, meeting notes, and support history.
- My Workspace holds the specialist's full data view: reports, meeting prep, exports, and cross-student planning.
- My Activities is the specialist-launched activity gallery.
- Additional learning surfaces:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reading-lab.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sentence-studio.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/typing-quest.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/number-lab.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/number-lab/index.html`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/precision-play.html`

Legacy route shims that should not be treated as canonical:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-v2.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/case-management.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/game-platform.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/sentence-surgery.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy.html`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy/index.html`

## Runtime Ownership Map

### Landing And Word Quest

- Bootstrap entry/runtime wiring: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js`
- Main Word Quest runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js`
- Extracted support modules:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-runtime-helpers.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-phonics-clue.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-start-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-round-submit-runtime.js`
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
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-core-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-session.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-state.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-deep-dive-ui.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-reveal-flow-support.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-gameplay-stats.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-runtime-config.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-startup-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-maintenance-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-analytics.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-controls.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-exports.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-mastery.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-probe.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-session-summary-runtime.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app-student-session-runtime.js`
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

### My Workspace

- Page shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.html`
- Main workspace runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.js`
- Main workspace styles: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.css`
- Dashboard modules: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/dashboard/`
- Teacher intelligence/storage support:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/teacher/teacher-storage.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/teacher/teacher-intelligence.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/evidence-store.js`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/evidence-engine.js`

### Specialist Hub

- Page shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.html`
- Main runtime: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.js`
- Main styles:
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-main.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-sidebar.css`
  - `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-hub-animations.css`

### Game Platform Components

- Shared platform shell: `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-activities.html`
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

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/word-quest-runtime.js` about 4,291 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/specialist-hub.js` about 7,032 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/writing-studio.js` about 5,143 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.css` about 5,097 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/my-workspace.js` about 2,992 lines
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js` about 184 lines and intentionally small

## Naming Cleanup Status

- Canonical product-facing activity names now in active use:
  - `Word Quest`
  - `Typing Quest`
  - `Don't Say It!`
  - `Sentence Studio`
  - `Reading Lab`
  - `Writing Studio`
  - `Number Lab`
- Canonical platform/runtime naming is now complete for:
  - active routes and page markers
  - launcher/runtime IDs
  - active evidence/reporting writes
  - Word Quest page-mode, export-prefix, planner-launch, and telemetry labels
- Remaining old names are mostly deeper internals:
  - compatibility aliases in route and runtime normalizers
  - evidence and signal backward-compat mappings
  - engine-folder names like `js/numeracy/`
  - older dataset/audio/taxonomy bucket names

## Word Quest Runtime Note

- The old 18k planning numbers for `js/app-main.js` are now historical context only.
- Several older planning docs still use the old filename and module list; trust the checked-in runtime files above over historical extraction notes.
- The remaining risk in Word Quest is less about raw file size and more about runtime coupling and init-order correctness across the extracted modules loaded in `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/word-quest.html`.
- When debugging Word Quest boot failures, check load order and lazy dependency wiring first before assuming the extracted module itself is wrong.

## Change Strategy

When making changes:

1. Identify the surface first.
2. Prefer surface-local files before touching shared runtime files.
3. If a change requires `js/word-quest-runtime.js` or `specialist-hub.js`, assume the blast radius is high and run the route-appropriate checks.
