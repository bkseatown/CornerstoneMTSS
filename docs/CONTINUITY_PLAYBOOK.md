# Continuity Playbook (Main-Only)

This file is the operational contract for any agent/human taking over work in this repo.

## 1) Branching And Push Model
- Default working branch: `main`
- No feature-branch-only delivery unless explicitly requested.
- Every work batch must end with:
  1. local verification
  2. commit on `main`
  3. push to `origin/main`
  4. live build verification

## 2) Non-Negotiable Invariants
- Preserve no-scroll contract on teacher dashboard (document delta = 0 at audited viewports).
- Preserve escape navigation (brand home, Home, Activities).
- Preserve build visibility (`build.json`, `build-stamp.js`, `js/build-badge.js`).
- Do not silently change evidence schema (`cs.evidence.v2`) without explicit migration.
- Same-tab navigation and `?student=` propagation.

## 3) Required Verification Per Change Batch
- `npm run audit:ui`
- `npm run audit:ui:html:firefox` (visual evidence gate)
- If touching game runtime: targeted smoke for that module (Word Quest, Writing Studio, etc.)
- If touching taxonomy/alignment: `npm run taxonomy:audit` when available

## 4) Pre-Push Checklist (Must Be Explicit)
- `git status --short` reviewed (no accidental files).
- Console errors checked on changed pages.
- New links/routes verified from live navigation.
- If any script/style path changed: verify 200 (no 404) from served site.

## 5) Post-Push Live Check
- Confirm `build.json` `buildId` changed.
- Confirm key page includes stamp+badge scripts.
- Confirm critical assets return correct content-type.
- Confirm target flow works in browser after hard reload.

## 6) Handoff Log Protocol
Update `/docs/SESSION_LOG.md` at end of each implementation block with:
- Date/time
- Scope done
- Files changed
- Commands run + pass/fail
- Known risks/regressions
- Next intended step

## 7) Stop Conditions
Stop and report before continuing if:
- Runtime console errors appear on target page.
- A main workflow gate fails repeatedly.
- No-scroll contract regresses.
- Live page serves 404 for required assets.

