# Continuity Playbook (Main-Only)

This file is the operational contract for any agent or human taking over work in this repo.

## 1) Branching And Push Model
- Default branch: `main`
- No feature-branch-only delivery unless explicitly requested
- Every work batch should end with:
  1. local verification
  2. commit on `main`
  3. push to `origin/main`
  4. live-build or fresh-cache verification

## 2) Non-Negotiable Invariants
- Preserve no-scroll contract on teacher dashboard.
- Preserve no-scroll-by-default behavior on major desktop first screens unless the viewport is genuinely too small.
- Preserve escape navigation.
- Preserve build visibility (`build.json`, `build-stamp.js`, `js/build-badge.js`).
- Do not silently change evidence schema (`cs.evidence.v2`) without explicit migration.
- Preserve same-tab navigation and `?student=` propagation.
- Preserve one layout owner per page family.

## 3) Required Verification Per Change Batch
- `npm run audit:ui`
- `npm run audit:ui:html:firefox`
- Targeted runtime smoke for touched modules when relevant
- For premium UI work, inspect the actual rendered route with a fresh cache-busted URL before declaring success

## 4) Pre-Push Checklist
- `git status --short` reviewed
- console errors checked on changed pages
- routes/links verified from live navigation
- changed scripts/styles verified to load without 404
- visible build/version marker is fresh enough to trust the review

## 5) Post-Push Live Check
- confirm `build.json` changed when expected
- confirm key page includes stamp + badge scripts
- confirm target route reflects the intended change after cache-busted reload

## 6) Handoff Log Protocol
Update `/docs/SESSION_LOG.md` at the end of each implementation block with:
- date/time
- scope done
- files changed
- commands run + pass/fail
- known risks/regressions
- next intended step

## 7) Stop Conditions
Stop and report before continuing if:
- runtime console errors appear on the target page
- a required gate fails repeatedly
- no-scroll contract regresses
- live page serves 404 for required assets
- a touched route still has visible overlap, duplicate ownership, or obviously stale build/version markers
