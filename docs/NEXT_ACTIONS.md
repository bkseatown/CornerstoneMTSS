# Cornerstone Next Actions
**Last Updated:** March 9, 2026
**Purpose:** Concrete implementation backlog to move Cornerstone from the current audit score (`76/100`) into the mid-80s as fast as possible.

## Baseline
Current evidence used for this backlog:
- Teacher workflow audit: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/teacher-reality-pass/teacher-reality-pass.json](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/teacher-reality-pass/teacher-reality-pass.json)
- UX task benchmark: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/ux-task-benchmark/ux-task-benchmark.json](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/ux-task-benchmark/ux-task-benchmark.json)
- Design audit outputs: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/design-audit](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/.artifacts/design-audit)
- Accessibility spec used: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/a11y-audit.spec.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/a11y-audit.spec.js)
- Performance spec used: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/perf-web-vitals.spec.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/perf-web-vitals.spec.js)
- Runtime guard used: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/runtime-guards.spec.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/runtime-guards.spec.js)
- UI route audit used: [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/audit-pages.spec.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/tests/audit-pages.spec.js)

Primary score gaps:
- Accessibility failures on literacy, numeracy, teacher dashboard, and Word Quest
- Specialist workflow failures in reports/teacher dashboard
- Teacher dashboard CLS over budget
- Weak dominant-stage hierarchy in the design audit
- Mobile overflow still present on literacy and numeracy

## Priority Order
1. Accessibility hard blockers
2. Specialist workflow restoration
3. Dashboard hierarchy + CLS stabilization
4. Mobile hub overflow cleanup
5. Committee / admin proof layer
6. Audit runner stabilization

---

[P1] Accessibility hard blockers
Outcome:
- Remove the current critical/serious issues blocking a strong UDL and MTSS claim.

Why this batch first:
- Fastest trust gain with specialists, admin, and hiring committee.
- Raises Accessibility, UDL, and Committee Readiness at the same time.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/build-badge.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/build-badge.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/ui.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/ui.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/literacy.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/literacy.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy.html)

Focus:
- Fix build badge contrast on literacy and numeracy
- Fix low-contrast stat denominator / label text on teacher dashboard
- Add accessible name to Word Quest backspace key
- Re-check any icon-only buttons in Word Quest header and floating panels

Checks:
- `npm run audit:a11y`
- `BASE_URL=http://127.0.0.1:4173 npx playwright test tests/a11y-audit.spec.js --project=chromium --reporter=line`

Done when:
- `tests/a11y-audit.spec.js` passes on all core routes
- No `critical` or `serious` axe violations on:
  - `literacy.html`
  - `numeracy.html`
  - `reports.html`
  - `word-quest.html`
- Backspace key in Word Quest has a clear accessible name

Expected score lift:
- Overall: `+4 to +5`

---

[P1] Specialist workflow restoration
Outcome:
- Make the core specialist flow reliable and fast: select student, switch mode, start recommended session, open meeting prep.

Why this batch second:
- Current audit failures are directly on the path a specialist would use first.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/js/app.js)

Focus:
- Restore visibility/clickability of `#td-focus-start-btn`
- Restore reliable switching of:
  - `#td-mode-classroom`
  - `#td-mode-daily`
- Make classroom launch path visible and actionable after mode switch
- Ensure meeting workspace remains fast and stable
- Remove hidden-state mismatches between DOM and CSS mode strips

Checks:
- `npm run audit:teacher:reality`
- `npm run audit:ux:tasks`
- `npm run smoke:teacher-daily-flow`

Done when:
- Teacher reality pass reaches at least `13/14`
- UX benchmark passes all 6 tasks
- `Start Recommended Session` passes under the current 9s benchmark
- No specialist flow step times out due to hidden or non-visible controls

Expected score lift:
- Overall: `+3 to +4`

---

[P1] Dashboard hierarchy + CLS stabilization
Outcome:
- Make the teacher dashboard feel more decisive above the fold and remove visual shift that weakens polish.

Why this batch third:
- This is the fastest way to raise “hiring committee / admin impression” after the workflow is fixed.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/nav-shell.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/nav-shell.css)

Focus:
- Reduce teacher dashboard CLS below `0.1`
- Give the dashboard one dominant “do next” stage
- Reduce above-the-fold competition in reports mode
- Make priority hero, launch actions, and meeting prep visually clearer than secondary analytics blocks

Checks:
- `npm run audit:performance`
- `node scripts/design-audit.js`
- `BASE_URL=http://127.0.0.1:4173 npx playwright test tests/perf-web-vitals.spec.js --project=chromium --reporter=line`

Done when:
- Teacher dashboard CLS is `<= 0.1`
- Teacher dashboard passes performance budgets
- Design audit shows reduced above-fold clutter on `teacher-dashboard`
- Reports mode has a clear primary CTA and primary status surface

Expected score lift:
- Overall: `+2 to +3`

---

[P2] Mobile hub overflow cleanup
Outcome:
- Remove overflow and crowding on literacy and numeracy so the whole shell feels equally intentional outside Word Quest.

Why this batch fourth:
- It improves overall quality perception and keeps the system from feeling like one polished game plus unfinished supporting routes.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/literacy.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/literacy.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/numeracy.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/hub.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/hub.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/nav-shell.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/nav-shell.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/style/components.css)

Focus:
- Eliminate mobile overflow on literacy and numeracy
- Keep navigation stable and readable on small screens
- Preserve top-level route parity with Word Quest quality

Checks:
- `node scripts/design-audit.js`
- `npm run audit:ui`
- Manual check at `390x844` and `834x1112`

Done when:
- Design audit reports no mobile overflow on literacy and numeracy
- Core hub actions remain visible and clickable without clipping
- No double-scroll or footer overlap at mobile widths

Expected score lift:
- Overall: `+1 to +2`

---

[P2] Committee / admin proof layer
Outcome:
- Make the system easier to “read” as a serious MTSS / RTI / UDL platform during a short demo.

Why this batch fifth:
- Once reliability is fixed, this is the layer that turns competence into persuasion.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/reports.html)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/teacher-dashboard.css)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ADOPTION_SCORECARD_AND_ANALYTICS_SPEC.md](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ADOPTION_SCORECARD_AND_ANALYTICS_SPEC.md)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/NONCODER_OPERATING_MANUAL.md](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/NONCODER_OPERATING_MANUAL.md)

Focus:
- Add clearer MTSS lane language to teacher-facing surfaces
- Make Tier 1 / Tier 2 / Tier 3 supports and accommodations easier to interpret quickly
- Make meeting prep, share summary, and referral/export feel like one coherent support pathway
- Tighten microcopy to explicitly signal UDL structure without sounding academic or bureaucratic

Checks:
- Manual 3-5 minute admin walkthrough
- `npm run audit:teacher:reality`
- `npm run audit:ux:tasks`

Done when:
- A specialist can explain the dashboard in one pass without narration from the builder
- An admin can see assessment -> support -> meeting -> export continuity clearly
- MTSS / RTI / UDL language is visible but not jargon-heavy

Expected score lift:
- Overall: `+1 to +2`

---

[P2] Audit runner stabilization
Outcome:
- Make the audit stack dependable so regressions can be caught cleanly before demos and pushes.

Why this batch matters:
- Current `audit:ui` and `guard:runtime` runs can fail on Playwright artifact cleanup even when route checks mostly succeed.

Files:
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/package.json](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/package.json)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/playwright.config.js](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/playwright.config.js)
- [/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/REGRESSION_GUARDRAILS.md](/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/REGRESSION_GUARDRAILS.md)

Focus:
- Remove false negatives caused by trace/artifact cleanup
- Make local audit commands work consistently under the current environment
- Document any required `--trace=off` or local-server constraints

Checks:
- `npm run guard:runtime`
- `npm run audit:ui`
- `npm run audit:performance`
- `npm run audit:a11y`

Done when:
- The standard audit commands complete without Playwright artifact ENOENT failures
- Audit output reflects product issues, not runner noise

Expected score lift:
- Overall: `+0 to +1`
- Important for confidence, release discipline, and demo prep

---

## Definition Of Success
Target state for the next major review:
- Overall score: `84-86`
- Accessibility: `78+`
- Specialist workflow: `88+`
- UDL structure: `82+`
- Hiring committee / admin impression: `86+`
- Performance: `90` or close

## Recommended Execution Sequence
1. `[P1] Accessibility hard blockers`
2. `[P1] Specialist workflow restoration`
3. `[P1] Dashboard hierarchy + CLS stabilization`
4. `[P2] Mobile hub overflow cleanup`
5. `[P2] Committee / admin proof layer`
6. `[P2] Audit runner stabilization`

## Minimal Re-Score Gate
Do not re-score the platform until these are all true:
- `npm run audit:a11y` passes
- `npm run audit:teacher:reality` reaches at least `13/14`
- `npm run audit:ux:tasks` passes all task checks
- `npm run audit:performance` passes on teacher dashboard
- literacy and numeracy no longer show mobile overflow in the design audit
