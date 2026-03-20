# Ship And Debug Checklist

## Purpose

This is the current "how to ship" and "how to debug safely" checklist for the checked-in Cornerstone MTSS repo.

## Before You Start

1. Read `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/README.md`.
2. Read `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/QUICK_START.md`.
3. Read `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`.
4. Confirm you are working from `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS`.

## Local Run

1. Run `npm install` if dependencies are missing.
2. Start a local static server with `python3 -m http.server 4173`.
3. Open `http://127.0.0.1:4173/index.html`.

## Debug Checklist

Use these in order when something looks broken:

1. Hard refresh the page with `Cmd+Shift+R`.
2. Run `npm run guard:runtime`.
3. Run `npm run hud:check`.
4. Run `npm run dom:hooks:check`.
5. If the issue is visual or layout-related, run `npm run test:visual:regression`.
6. If the issue is accessibility-related, run `npm run audit:a11y`.
7. If the issue may involve deploy drift, run `npm run check:live`.

## Pre-Ship Checklist

Run these before pushing a production change:

1. `npm run guard:runtime`
2. `npm run hud:check`
3. `npm run dom:hooks:check`
4. `npm run release:check`

Recommended when the change affects layout, styling, or user-facing behavior:

1. `npm run test:visual:regression`
2. `npm run audit:a11y`
3. `npm run audit:performance`

## Ship Order

When you are ready to ship:

1. Make sure the worktree is clean except for the intended changes.
2. Run the pre-ship checklist above.
3. Review the specific changed files for scope creep.
4. Commit the change.
5. Push to `main` or merge into `main` through your normal workflow.
6. Confirm GitHub Pages deploys successfully via `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.github/workflows/deploy-pages.yml`.
7. Run `npm run check:live` if you want a local confirmation against the deployed site.

## If Shipping Fails

1. Check the GitHub Actions run for `Deploy GitHub Pages`.
2. Check the scheduled/live freshness workflow at `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.github/workflows/pages-freshness.yml`.
3. Re-run the local commands in this order:
   - `npm run guard:runtime`
   - `npm run hud:check`
   - `npm run dom:hooks:check`
   - `npm run release:check`
4. If the deployed site looks stale, compare the live `build.json` with the local one using `npm run check:live`.

## Fast Triage Hints

- Runtime or missing element issue: start with `guard:runtime`
- Token/theme/HUD issue: start with `hud:check`
- Missing selector or stale hook issue: start with `dom:hooks:check`
- Layout regression: start with `test:visual:regression`
- Production drift: start with `check:live`
