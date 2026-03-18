# Cleanup Candidates Report (2026-03-19)

## Scope

This report classifies cleanup targets by observed evidence in the repo:

- direct HTML includes
- `package.json` scripts
- Playwright/Jest-style tests in `tests/`
- GitHub workflow references
- backend/frontend linkage
- docs-only references

This is a deletion-planning document only. No files were removed.

## Summary

The repo does contain likely legacy and low-value files, but a large amount of code that looks old is still directly wired into shipped HTML pages or CI checks. The highest-confidence cleanup opportunities are:

- generated artifact directories
- one-off debug/screenshot helper scripts with no code references
- staged collaboration frontend/backend files that appear disconnected from shipped pages

The highest-risk area is shared frontend runtime code. Many standalone pages still load direct script chains instead of going through a bundler, so seemingly isolated files can still be page-critical.

## Clearly Active

These are poor cleanup targets right now because there is direct evidence they are in use.

### Frontend entry pages

- `index.html`
- `teacher-hub-v2.html`
- `reports.html`
- `game-platform.html`
- `word-quest.html`
- `reading-lab.html`
- `writing-studio.html`
- `sentence-surgery.html`
- `precision-play.html`
- `paragraph-builder.html`
- `session-runner.html`
- `case-management.html`
- `numeracy.html`
- `literacy.html`
- `activities/decoding-diagnostic.html`

Reason:

- loaded directly in navigation flow, page markup, tests, service worker/runtime lists, or workflow-facing checks

### Shared runtime helpers

- `js/nav-shell.js`
- `js/build-badge.js`
- `build-stamp.js`
- `js/backup-manager.js`
- `js/hub-back-nav.js`

Reason:

- direct HTML includes on multiple pages
- `tests/runtime-guards.spec.js`, `tests/audit-pages.spec.js`, and `tests/visual-regression.spec.js` reference build badge/stamp expectations

### Main quality pipeline

- `playwright.config.js`
- `tests/audit-pages.spec.js`
- `tests/runtime-guards.spec.js`
- `tests/a11y-audit.spec.js`
- `tests/perf-web-vitals.spec.js`
- `tests/visual-regression.spec.js`
- script files referenced by `package.json` and `.github/workflows/*`

Reason:

- directly invoked by CI and local release gates

### Special-case active legacy file

- `fixChaosGame.js`

Reason:

- dynamically loaded from `sentence-surgery.js`

## Probably Optional Or Staged

These are the strongest cleanup candidates, but they should be removed in a dedicated batch with a narrow verification pass.

### Collaboration frontend files

- `js/collab/session-sync.js`
- `js/collab/decision-log.js`
- `games/ui/collab-overlay.js`
- `style/collab-overlay.css`

Observed evidence:

- zero direct HTML includes found
- referenced heavily in docs such as `docs/COLLAB_INTEGRATION_GUIDE.md` and `docs/INTEGRATION_EXAMPLES.md`
- backend protocol appears mismatched with the browser client design

Interpretation:

- this looks staged, docs-driven, or partially integrated rather than live

### Collaboration backend stack

- `server/collab-server.js`
- `server/package.json`
- `server/database/init-db.js`
- `server/database/schema-mongodb.js`
- `server/database/schema-postgresql.sql`
- `server/README.md`
- `server/database/README.md`
- `server/database/DATABASE_SETUP_GUIDE.md`

Observed evidence:

- no frontend HTML page includes or calls found
- main frontend/test flows use static hosting only
- most references are docs or server-local package scripts

Interpretation:

- likely optional for normal frontend development
- possibly safe to move out of the main repo path or archive, but not safe to delete blindly if collaboration work is expected later

### Root-level helper scripts with no meaningful inbound references

- `take-screenshot.js`
- `take-screenshot-wait.js`
- `take-screenshot-zoomed.js`
- `fresh-screenshot.js`
- `screenshot-full.js`
- `debug-body-styles.js`
- `debug-styles.js`
- `check-body-class.js`
- `test-modules.js`
- `test-themes.js`

Observed evidence:

- no HTML includes
- no `package.json` script references found
- little or no repo references beyond self-reference or docs mention

Interpretation:

- strong candidates to move into a `tools/legacy/` or `scripts/manual/` bucket first
- after that, remove if nobody depends on them for ad hoc debugging

## Risky To Remove Without More Proof

These areas still need a deeper dependency pass before deletion.

### Standalone tool pages and their page-specific scripts

- `reading-lab.html` + `js/reading-lab.js`
- `writing-studio.html` + `writing-studio.js`
- `sentence-surgery.html` + `sentence-surgery.js`
- `precision-play.html` + `precision-play.js`
- `paragraph-builder.html` + `paragraph-builder.js`
- `session-runner.html` + `js/session-runner.js`
- `case-management.html` + `case-management.js`
- `numeracy.html` + `js/numeracy-quickcheck.js`

Reason:

- these are not dead; they are directly linked from navigation, reports, tests, or service-worker/runtime lists
- they may still be lower-value product surfaces, but they are active code, not safe deletions

### Word Quest runtime

- `word-quest.html`
- `js/app.js`
- `js/ui.js`
- `js/game.js`
- `word-quest-preview.js`
- `hero-v2.js`
- `hero-v2.css`

Reason:

- direct HTML loading
- runtime/test references
- likely dense legacy code, but tightly wired

### Release/contract scripts

- `scripts/check-hud-contract.js`
- `scripts/check-grade-band-contract.js`
- `scripts/check-visual-baseline.js`
- `scripts/check-offline-contract.js`
- `scripts/check-funnel-telemetry-contract.js`
- `scripts/check-telemetry-dashboard-contract.js`
- `scripts/check-dead-dom-hooks.js`
- `scripts/check-change-scope.js`

Reason:

- these are part of `release:check`, `release:gate`, or CI workflows
- some may be redundant, but they are active governance mechanisms

## Safe First Cleanup Batch

If the goal is to start cleaning with minimal product risk, the safest first batch is:

1. generated artifacts:
   - `artifacts/`
   - `playwright-report/`
   - `test-results/`

2. manual/debug helper scripts with no inbound references:
   - `take-screenshot.js`
   - `take-screenshot-wait.js`
   - `take-screenshot-zoomed.js`
   - `fresh-screenshot.js`
   - `screenshot-full.js`
   - `debug-body-styles.js`
   - `debug-styles.js`
   - `check-body-class.js`
   - `test-modules.js`
   - `test-themes.js`

These should still be removed in a small dedicated commit so the diff stays easy to verify.

## Second Cleanup Batch

After the first batch is verified, the next candidate batch is to isolate or archive the collaboration slice rather than hard-delete it:

- `js/collab/*`
- `games/ui/collab-overlay.js`
- `style/collab-overlay.css`
- `server/*`

Recommended approach:

- move to an archive folder or a separate worktree branch first
- update or archive the collaboration docs in the same change so references do not point at removed files

## Second-Pass Collaboration Findings

The collaboration slice still looks disconnected from the shipped frontend, but it is not safe to hard-delete in place yet because the repo contains substantial documentation that treats it as a deliverable.

### Browser/server mismatch

- `js/collab/session-sync.js` opens a raw `WebSocket` connection to `/collab`
- `server/collab-server.js` exposes a Socket.IO server and listens for named events like `join-session`, `annotation-added`, and `decision-logged`
- no active HTML page imports `js/collab/session-sync.js`, `js/collab/decision-log.js`, `games/ui/collab-overlay.js`, or `style/collab-overlay.css`

Interpretation:

- the collaboration code is staged or abandoned integration work, not part of the active product path
- deleting it without touching docs would leave the repo in a misleading state

### Recommended handling

If cleanup remains the priority, treat the collaboration slice as an extraction candidate:

1. move `js/collab/*`, `games/ui/collab-overlay.js`, `style/collab-overlay.css`, and `server/*` into an archive or separate package
2. update `QUICK_START.md`, `FINAL_DELIVERY_SUMMARY.md`, `docs/COLLAB_INTEGRATION_GUIDE.md`, `docs/INTEGRATION_EXAMPLES.md`, and related roadmap docs in the same change
3. only fully delete after deciding that collaboration is no longer a product goal

Current status:

- extracted to `archive/collab-staged/`
- verify that shipped pages and core tests do not regress

## Verification Checklist

After each cleanup batch, run:

- `npm run guard:runtime`
- `npm run audit:ui`
- `npm run audit:a11y`

Add when relevant:

- `npm run test:visual:regression`
- `npm run audit:performance`
- `npm run release:check`

## Recommended Next Step

Do not start by deleting shared frontend runtime files.

Start with:

- generated artifacts
- unreferenced root-level debug/screenshot helpers

Then re-run the core checks and only after that consider quarantining the collaboration stack.
