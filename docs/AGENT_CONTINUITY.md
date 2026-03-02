# Agent Continuity Contract

This contract is mandatory for any agent working in this repository.

## Operating Mode
- Work from `main` unless explicitly told otherwise.
- Keep changes small and scoped.
- Do not proceed after a failed core gate without reporting.

## Never Regress
- No-scroll contract on teacher dashboard.
- Escape navigation (Brand/Home/Activities) remains available.
- Build visibility (`build.json`, `build-stamp.js`, `js/build-badge.js`) remains intact.
- Existing evidence schema compatibility (`cs.evidence.v2`) remains intact.
- Same-tab navigation and `?student=` propagation remain intact.

## Required Checks Per Implementation Block
1. `npm run audit:ui`
2. `npm run audit:ui:html:firefox`
3. Targeted runtime smoke for touched module(s) if applicable.

## Blockers (Stop Immediately)
- Console runtime errors on touched pages.
- 404 for required scripts/styles on touched routes.
- Audit/no-scroll regression.
- Broken core route navigation.

## Delivery Record (Required)
At the end of each block, append to `/docs/SESSION_LOG.md`:
- Scope completed
- Files changed
- Commands run + pass/fail
- Regressions found/fixed
- Remaining risks
- Next step

## Handoff Minimum
Any handoff message must include:
- Current branch
- Current `git status` summary
- Last passing gates
- Known failing gates (if any)
- Exact next action

