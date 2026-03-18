# Canonical Reset Plan

Date: 2026-03-19

## Goal

Define the smallest trustworthy repository shape for the current Cornerstone MTSS app so future cleanup and history reset work from a keep-set instead of guesswork.

This plan is for a fresh-history canonical branch built from the current known-good app state, not a force-rewrite of `main` yet.

## What Counts As Canonical

The canonical repo should keep only the code and project files required to:

- run the current teacher-facing app locally
- deploy GitHub Pages successfully
- preserve the current local-storage + backup workflow
- run the guard/audit checks the team actually relies on

## Confirmed Live Surface

These pages are clearly part of the current live app or test/deploy contract:

- `index.html`
- `teacher-hub-v2.html`
- `reports.html`
- `teacher-dashboard.html`
- `student-profile.html`
- `case-management.html`
- `game-platform.html`
- `word-quest.html`
- `reading-lab.html`
- `sentence-surgery.html`
- `writing-studio.html`
- `numeracy.html`
- `precision-play.html`
- `literacy.html`

These are still referenced by code, tests, or workflow checks and should stay in the canonical branch unless replaced deliberately.

## Keep Directories

These top-level directories are part of the current app/runtime/deploy surface:

- `.github`
- `js`
- `style`
- `css`
- `games`
- `data`
- `audio`
- `assets`
- `scripts`
- `tests`

These top-level docs are still useful for repo operation, but should be thinned aggressively:

- `docs`

## Keep Root Files

These root files should stay in the canonical branch:

- `package.json`
- `playwright.config.js`
- `build.json`
- `build-stamp.js`
- `config.js`
- `storage-schema.js`
- `sw-runtime.js`
- `server.js`
- `favicon.ico`
- `hero-v2.css`
- `hero-v2.js`
- `home-v3.css`
- `teacher-dashboard.css`
- `teacher-dashboard.js`
- `teacher-hub-v2.css`
- `teacher-hub-v2.js`
- `student-profile.css`
- `student-profile.js`
- `word-quest-preview.js`
- `precision-play.css`
- `precision-play.js`
- `reading-lab.css`
- `sentenceEngine.js`
- `sentence-surgery.css`
- `sentence-surgery.js`
- `writing-studio.css`
- `writing-studio.js`
- `numeracy.css`
- `numeracy.js`

## Keep For Deploy Contract

The GitHub Pages workflow currently requires these deploy-critical paths:

- `dist/index.html`
- `dist/js/app.js`
- `dist/js/evidence-store.js`
- `dist/js/ava-intensity.js`
- `dist/js/wq-diagnostics.js`
- `dist/js/build-badge.js`
- `dist/build-stamp.js`
- `dist/style/tokens.css`
- `dist/sw-runtime.js`
- `dist/build.json`
- `dist/data/ava-persona.json`
- `dist/data/ava-event-matrix.json`
- `dist/audio/ava/current/manifest.json`

That means the source canonical repo must keep the corresponding source files and generation inputs.

## Keep For Data + Backup

These are part of the current data persistence story and should stay:

- `js/teacher/teacher-storage.js`
- `js/caseload-store.js`
- `js/teacher-runtime-state.js`
- `js/backup-manager.js`
- `js/auth/google-auth.js`
- `js/auth/google-workspace.js`
- `js/google-auth-config.js`

## Remove From Canonical Branch

These should not be carried into the fresh-history canonical branch:

- old one-off debug helpers already removed from the working tree
- staged collaboration code now archived under `archive/collab-staged/`
- tracked artifact/report folders that are not required to run or deploy the app
- obsolete docs that describe non-live features or outdated process
- duplicate screenshots, audit leftovers, and exploratory scripts

## High-Risk Files To Keep For Now

These are large or messy, but still active and should not be dropped during the canonical reset:

- `js/app.js`
- `teacher-dashboard.js`
- `teacher-hub-v2.js`
- `style/components.css`
- `js/nav-shell.js`

## Recommended Canonical Strategy

Use a fresh-history branch built from the current known-good tree.

Recommended flow:

1. Finish stabilizing the current working tree.
2. Create a dedicated prep branch.
3. Remove non-canonical docs/artifacts from the prep branch only.
4. Run key checks:
   - `npm run guard:runtime`
   - `npm run audit:ui`
   - `npm run audit:a11y`
   - `npm run release:check`
5. Create a fresh-history branch from the validated prep branch.
6. Verify GitHub Pages deploy from that clean branch before replacing `main`.

## Important Caveat

This plan does not rewrite history yet.

It prepares the keep-set and branch strategy so the next reset is intentional and reproducible instead of another partial cleanup layered on top of old history.
