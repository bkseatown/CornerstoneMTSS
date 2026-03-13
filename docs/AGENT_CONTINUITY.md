# Agent Continuity Contract

This contract is mandatory for any agent working in this repository.

## Operating Mode
- Work from `main` unless explicitly told otherwise.
- Keep changes small and scoped.
- Do not proceed after a failed core gate without reporting.
- Do not assume a fresh Codex thread can read previous conversation history, even in the same worktree.
- Treat repo documents as the durable memory layer.

## Never Regress
- No-scroll contract on teacher dashboard.
- No-scroll-by-default behavior on major desktop first screens unless the viewport is genuinely too small.
- Escape navigation remains available.
- Build visibility (`build.json`, `build-stamp.js`, `js/build-badge.js`) remains intact.
- Existing evidence schema compatibility (`cs.evidence.v2`) remains intact.
- Same-tab navigation and `?student=` propagation remain intact.
- One layout owner per page family.
- No duplicate hero/welcome/starter systems on the same route.
- Shared shell consistency must not flatten game identity into recolored clones.

## Required Checks Per Implementation Block
1. `npm run audit:ui`
2. `npm run audit:ui:html:firefox`
3. Targeted runtime smoke for touched module(s) if applicable.
4. For major UI routes, verify the real rendered page with a fresh cache-busted URL.

## Blockers (Stop Immediately)
- Console runtime errors on touched pages.
- 404 for required scripts/styles on touched routes.
- Audit/no-scroll regression.
- Broken core route navigation.
- Stale build/version markers after a claimed update.
- Visible overlap, duplicate ownership, or obvious formatting breakage on the touched route.

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
- Any cache-buster/build marker a reviewer should use to see the fresh page
