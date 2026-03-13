# Regression Guardrails & AI Drift Prevention
**Last Updated:** March 13, 2026

This document exists to prevent regressions when multiple agents or future threads contribute to the same repo.

## Executive Summary
The biggest current regression risks are no longer just syntax errors.
They are:
- stale cache/build markers
- duplicate layout owners on one page
- CSS cascade drift from older and newer systems coexisting
- decorative UI layers making pages look broken
- text-heavy first screens that force scroll and weaken product clarity

## Current High-Risk Areas

### 1. Typing Quest duplicate-owner risk
Typing Quest has repeatedly suffered from multiple generations of welcome/course UI living at once.

Symptoms:
- overlapping panels
- giant translucent sections
- hero + starter rail + placement stack all competing
- page feels like a curriculum document instead of a launch screen

Guardrail:
- only one welcome owner may render on the Typing Quest entry screen
- remove older markup/rules instead of restyling both systems

### 2. Word Quest overlay risk
Word Quest has repeatedly regressed when decorative stage wrappers were added around an already-working play stack.

Symptoms:
- translucent boxes behind the board
- keyboard tray chrome that adds noise
- oversized coach/support surfaces

Guardrail:
- board and keyboard stay primary
- remove decorative wrappers that do not add gameplay clarity
- shorter support text is usually safer than more support text

### 3. Cache/version drift risk
Fresh code can appear stale if HTML asset query strings and build markers drift apart.

Guardrail:
- if a UI change is claimed, verify:
  - asset query strings were bumped where needed
  - visible build marker changed when appropriate
  - `build.json` agrees with the current build story

### 4. Scroll as design smell
Unexpected scroll on a normal laptop viewport is usually a sign of layout/content hierarchy failure.

Guardrail:
- before accepting scroll, ask:
  - are we showing too many sections at once?
  - are we explaining too much instead of showing?
  - did a second layout owner reappear?

## Layer 1: Syntax & Parsing Validation

### JavaScript
Run:
```bash
node --check games/ui/game-shell.js
node --check js/app.js
```

For broader changes, also run repo-standard checks as available.

### CSS
If CSS changes are broad, audit the touched route visually at real viewport sizes.
For this repo, CSS regressions are often cascade/ownership problems rather than raw syntax problems.

## Layer 2: Runtime Verification

### Required route checks
For touched pages:
- open the real route
- inspect actual rendered layout
- check console errors
- verify no required asset 404s

### Required viewport mindset
Audit at standard laptop-scale view first.
This repo has a strong no-scroll-by-default expectation on major first screens.

## Layer 3: Layout Ownership
Source of truth:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_LAYOUT_OWNERS.md`

Rules:
- change the owner first
- avoid inline layout fixes unless neutralizing legacy behavior
- many `!important` rules are a warning sign that older ownership needs deletion

## Layer 4: Product Identity Guardrails

### Shared shell
Good:
- shared polish
- shared standards
- shared control language

Bad:
- same layout, same tone, same artifact, different accent color

### Show vs tell
If a screen is too tall, too cluttered, or too bland:
- remove copy first
- increase meaningful visual cues second
- only then add text if still necessary

## Layer 5: Handoff Discipline
Every meaningful UI block should leave behind:
- updated `progress.md`
- accurate cache-buster/build context
- enough documentation for a fresh thread to continue without chat history
