# CODE HEALTH GUARDRAILS
## Preventing Bloat, Maintaining Quality, Scaling Responsibly

**Effective Date:** 2026-03-16 | **Owner:** Engineering Lead | **Review Cycle:** Quarterly

---

## PROBLEM STATEMENT

**Audit Finding:** Cornerstone MTSS CSS bloated 44.6% above optimal (36K vs. 20K lines). Root causes:
1. No file size enforcement (game-shell.css grew to 11.4K unchecked)
2. Cascade battles fought 20+ times instead of solved once (!important count: 796)
3. Dated patches accumulated (2026-03-10 through 2026-03-15 = daily band-aids)
4. No token compliance linting (211 hardcoded colors, 93 arbitrary font sizes)
5. No architecture registry → Modules tangled, dead code invisible

**Impact:**
- CSS parsing overhead 5% wasted on duplicate selectors
- Maintenance burden: High risk of regressions on every change
- New features delayed by cascade debugging
- Dark mode impossible (requires 300+ manual color overrides)
- Developer confusion: "Where does this rule come from?"

**This document prevents recurrence.**

---

## PART 1: SIZE & COMPLEXITY GUARDRAILS

### Rule 1.1: File Size Limits

| File Type | Limit | Trigger |
|-----------|-------|---------|
| **CSS** | 4,000 lines | Modularize |
| **JS** | 8,000 lines | Break into modules |
| **HTML** | 500 lines | Extract components |

**Rationale:**
- CSS: Beyond 4K lines, cascade complexity becomes unmanageable
- JS: Beyond 8K lines, dead code detection impossible
- HTML: Beyond 500 lines, markup becomes unmaintainable

**Enforcement:**

```javascript
// scripts/lint-file-size.js (CI integration)
const fs = require('fs');
const path = require('path');

const LIMITS = {
  '.css': 4000,
  '.js': 8000,
  '.html': 500,
};

function checkFile(filePath) {
  const ext = path.extname(filePath);
  const limit = LIMITS[ext];
  if (!limit) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;

  if (lines > limit) {
    console.error(`❌ ${filePath}: ${lines} lines exceeds limit of ${limit}`);
    console.error(`   → Modularize and re-run lint`);
    process.exit(1);
  }
}

// Run on changed files only
const changedFiles = require('child_process')
  .execSync('git diff --name-only --staged')
  .toString()
  .split('\n')
  .filter(f => f);

changedFiles.forEach(checkFile);
```

**Implementation:** Add to `.husky/pre-commit` hook

**Exception Process:**
- File exceeds limit? Create RFC ticket explaining architecture
- Approval required from 2 senior engineers + architect
- Exception granted for max 6 months (then mandatory refactor)

---

### Rule 1.2: !important Limit

**Rule:** ≤10 !important declarations per file (except utilities)

**Files ALLOWED to exceed:**
- `style/utilities.css` (for utility classes like `.m-0`, `.hidden`)
- `games/ui/game-feedback.css` (animation overrides need priority)

**Files BANNED from !important:**
- `style/components.css` (means specificity war → bad architecture)
- `style/themes.css` (tokens should flow cleanly, no battles)
- `home-v3.css` (landing page should be clean)

**Enforcement:**

```bash
# scripts/lint-important.sh (CI)
#!/bin/bash

for file in $(git diff --name-only --staged | grep '\.css$'); do
  count=$(grep -o '!important' "$file" | wc -l)
  max=10

  # Exception list
  if [[ "$file" == *"utilities"* ]] || [[ "$file" == *"feedback"* ]]; then
    max=50
  fi

  if [ "$count" -gt "$max" ]; then
    echo "❌ $file: ${count}x !important exceeds limit ${max}"
    exit 1
  fi
done
```

**When !important is Needed:**
1. Utility classes (e.g., `.hidden { display: none !important; }`)
2. Animation overrides that must punch through game-state CSS
3. Theme resets (e.g., dark mode color swap)

**When !important is ABUSE:**
- Applying to layout properties (display, grid-template-rows, width, height)
- Applying to all properties in a rule block (sign of cascade failure)
- Applying to compensate for low specificity elsewhere (fix specificity instead)

---

### Rule 1.3: Selector Deduplication

**Rule:** No selector appears >1 time in the same file (except @media queries)

**Allowed:**
```css
.button { padding: 10px; }
@media (max-width: 768px) {
  .button { padding: 5px; }
}
```

**Forbidden:**
```css
.button { padding: 10px; }
.button { color: blue; }  /* ← Duplicate selector; merge above */
```

**Enforcement:**

```javascript
// scripts/lint-duplicates.js (CI)
const postcss = require('postcss');

function checkDuplicates(filePath) {
  const css = fs.readFileSync(filePath, 'utf-8');
  const root = postcss.parse(css);
  const selectors = new Map(); // selector -> [lines]

  root.each(rule => {
    if (rule.type === 'rule') {
      const sel = rule.selector;
      if (!selectors.has(sel)) {
        selectors.set(sel, []);
      }
      selectors.get(sel).push(rule.source.start.line);
    }
  });

  for (const [sel, lines] of selectors.entries()) {
    if (lines.length > 1) {
      console.error(`❌ Duplicate selector "${sel}" at lines: ${lines.join(', ')}`);
      console.error(`   → Merge rules into single block`);
      process.exit(1);
    }
  }
}
```

**How to Merge:**
```css
/* Before */
.button { padding: 10px; }
.button { color: blue; }
.button { border-radius: 4px; }

/* After */
.button {
  padding: 10px;
  color: blue;
  border-radius: 4px;
}
```

---

## PART 2: DESIGN SYSTEM COMPLIANCE

### Rule 2.1: Token-First Design

**Rule:** ALL values must come from CSS tokens. Zero hardcoded colors, fonts, spacing.

**Token Categories:**

| Category | Source | Examples |
|----------|--------|----------|
| **Colors** | `style/tokens.css`, `style/themes.css` | `var(--text-primary)`, `var(--brand-teal)` |
| **Fonts** | `style/tokens.css` | `var(--fs-h1)`, `var(--fw-bold)` |
| **Spacing** | `style/tokens.css` | `var(--space-1)` through `var(--space-8)` |
| **Radius** | `style/tokens.css` | `var(--radius-sm)`, `var(--radius-lg)` |
| **Shadows** | `style/tokens.css` | `var(--shadow-soft)`, `var(--shadow-strong)` |

**Enforcement:**

```javascript
// scripts/lint-tokens.js (PostCSS plugin)
module.exports = {
  postcssPlugin: 'lint-tokens',
  Once(root) {
    root.walkDecls((decl) => {
      const value = decl.value;

      // Check for hardcoded colors
      if (/#[0-9a-f]{6}|rgb\(|hsl\(/.test(value) && !value.includes('var(')) {
        throw decl.error(`❌ Hardcoded color "${value}". Use var(--color-*)`);
      }

      // Check for hardcoded font sizes (px without clamp)
      if (/\d+px/.test(value) && decl.prop === 'font-size' && !value.includes('clamp')) {
        throw decl.error(`❌ Hardcoded font-size "${value}". Use var(--fs-*)`);
      }

      // Check for hardcoded margins/padding
      if (/\d+px/.test(value) &&
          (decl.prop.includes('margin') || decl.prop.includes('padding')) &&
          !value.includes('var(')) {
        throw decl.error(`❌ Hardcoded spacing "${value}". Use var(--space-*)`);
      }
    });
  }
};
```

**Common Replacement Patterns:**

```css
/* ❌ BEFORE */
color: #12304f;
font-size: 14px;
margin: 10px;
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);

/* ✓ AFTER */
color: var(--text-primary);
font-size: var(--fs-body);
margin: var(--space-2);
border-radius: var(--radius-sm);
box-shadow: var(--shadow-soft);
```

**Token Creation Process:**

1. **Identify need:** "I need a color that's 'muted secondary text'"
2. **Check tokens.css:** Does `--text-secondary-muted` exist?
3. **If no:** Create it in `style/tokens.css` (or `style/themes.css` for theme-specific)
4. **If yes:** Use existing token
5. **Document:** Add comment explaining intent

```css
/* style/tokens.css */
--text-secondary-muted: color-mix(in oklab, var(--text-secondary) 60%, transparent);
```

---

### Rule 2.2: Color Palette Adherence

**Rule:** No more than 162 unique colors across codebase (the design system's semantic palette)

**Current Palette:**
- Brand (teal, secondary) — 4 colors
- Text (primary, secondary, muted, inverted) — 4 colors
- Feedback (correct, present, absent, warning) — 4 colors
- Status (error, success, pending, neutral) — 4 colors
- Surfaces (background, card, panel, overlay) — 8 colors
- Themes (seahawks, forest, ocean, sunset, etc.) — 120+ theme-specific tokens

**Audit (Quarterly):**

```bash
# scripts/audit-colors.sh
#!/bin/bash

# Extract all colors from CSS
grep -oh '#[0-9a-fA-F]\{6\}\|rgb\([^)]*\)\|hsl\([^)]*\)' $(find . -name "*.css") | sort | uniq -c

# Should be <10 hardcoded colors (all others via var())
# If >10, investigate source and replace with tokens
```

**If Color Violates Palette:**
1. Expert check: "Does this color serve a unique purpose?"
2. If yes: Add to `style/tokens.css` (new semantic token)
3. If no: Replace with nearest existing token
4. Document the exception with ticket link

---

### Rule 2.3: Font Size Scale Adherence

**Rule:** Only use these 10 font sizes. No arbitrary values.

```css
/* style/tokens.css */
--fs-0: clamp(0.54rem, 1vw, 0.75rem);     /* Tiny labels */
--fs-1: clamp(0.72rem, 1.2vw, 0.88rem);   /* Small text */
--fs-2: clamp(0.82rem, 1.5vw, 1rem);      /* Body text */
--fs-3: clamp(1rem, 2vw, 1.25rem);        /* Body large */
--fs-4: clamp(1.2rem, 2.5vw, 1.5rem);     /* Subheading */
--fs-5: clamp(1.5rem, 3vw, 2rem);         /* Heading 3 */
--fs-6: clamp(2rem, 4vw, 2.5rem);         /* Heading 2 */
--fs-7: clamp(2.5rem, 5vw, 3.2rem);       /* Heading 1 */
--fs-8: clamp(3.2rem, 6vw, 4rem);         /* Display */
--fs-9: clamp(4rem, 8vw, 5rem);           /* Hero */
```

**Audit (Quarterly):**

```bash
grep -oh 'font-size: [^;]*' $(find . -name "*.css") | sort | uniq -c | sort -rn | head -20
# Should show only var(--fs-*) values
# If hardcoded sizes appear, replace with nearest scale tier
```

---

## PART 3: ARCHITECTURE GUARDRAILS

### Rule 3.1: Module Isolation

**Rule:** Each module owns ONE data flow. No cross-module CSS styling.

**Correct:**
```javascript
// curriculum/curriculum-engine.js
export { getStandardsForLesson, getLessonsForStandard };

// evidence/competency-mapper.js
import { getStandardsForLesson } from '../curriculum/curriculum-engine.js';
// Reads curriculum, doesn't modify it
```

**Wrong:**
```javascript
// evidence/competency-mapper.js
export { getStandardsForLesson }; // ← Shouldn't export curriculum functions
```

**CSS Corollary:**

```
❌ WRONG:
// game-shell.css
.dashboard-primary-focus { ... }  /* Game shell shouldn't know about dashboard */

✓ CORRECT:
// dashboard.css
.dashboard-primary-focus { ... }  /* Dashboard owns its own styles */
```

### Rule 3.2: No Cross-Module Styling

**Rule:** CSS file `A` never styles classes defined in file `B`

**Example:**

```css
/* ❌ game-shell.css — WRONG */
.dashboard-primary-focus {
  background: var(--cg-surface);  /* Styling outside ownership */
}

/* ✓ dashboard.css — CORRECT */
.dashboard-primary-focus {
  background: var(--surface-primary);
}
```

**Enforcement:**

```bash
# scripts/lint-cross-module.sh
# For each CSS file, extract all class names it USES
# For each CSS file, extract all class names it DEFINES
# If file A uses .className but file B defines it → ERROR

for cssFile in $(find . -name "*.css"); do
  defines=$(grep -o '\.[a-z0-9_-]*' "$cssFile" | grep -v 'var\|from\|import' | sort -u)
  for className in $defines; do
    users=$(grep -l "$className" *.css | grep -v "$cssFile")
    if [ -n "$users" ]; then
      echo "⚠️ $className defined in $cssFile but used in $users"
    fi
  done
done
```

---

### Rule 3.3: Architecture Registry

**File:** `docs/ARCHITECTURE_REGISTRY.md` (updated weekly)

Maintains inventory:

```markdown
## Module Map

### Curriculum System
- **curriculum/curriculum-engine.js** (1.2K lines)
  - Exports: getStandardsForLesson, getLessonsForStandard, getInterventionForGap
  - Dependencies: [none]
  - Used by: competency-mapper, intervention-recommender, daily-dashboard
  - Status: STABLE

### Evidence System
- **evidence/evidence-store.js** (2.1K lines)
  - Exports: logGamePerformance, getRecentPerformance, getAllEvidence
  - Dependencies: curriculum-engine
  - Used by: competency-mapper, daily-dashboard
  - Status: STABLE

- **evidence/competency-mapper.js** (800 lines)
  - Exports: inferCompetency, getGaps
  - Dependencies: curriculum-engine, evidence-store
  - Used by: intervention-recommender, daily-dashboard
  - Status: STABLE

### Recommendation System
- **interventions/intervention-recommender.js** (1.5K lines)
  - Exports: recommendForGap, trackImplementation, getImpactReport
  - Dependencies: curriculum-engine, competency-mapper
  - Used by: daily-dashboard, reports
  - Status: STABLE

### Dashboard System
- **dashboard/daily-dashboard.js** (2.1K lines)
  - Exports: getTeacherView, getStudentSnapshot
  - Dependencies: All above
  - Used by: reports.html, dashboard UI
  - Status: NEW (under development)

## CSS Module Map

### Token System (STABLE)
- **style/tokens.css** (200 lines) — Platform-wide tokens
- **style/themes.css** (960 lines) — Word Quest theme tokens
- **games/ui/game-theme.css** (411 lines) — Game platform theme tokens

### Component CSS (STABLE)
- **style/components.css** (9.5K lines) → [REFACTOR PLANNED] Split into:
  - components-core.css (3K)
  - components-cards.css (2K)
  - components-forms.css (2K)
  - components-utilities.css (2.5K)

### Page-Specific CSS (STABLE)
- **home-v3.css** (1.4K lines) — Landing page
- **teacher-hub-v2.css** (8.2K lines) → [REFACTOR PLANNED Q2]
- **teacher-dashboard.css** (4.2K lines) — Reports/dashboard

### Game Shell CSS (CRITICAL)
- **games/ui/game-shell.css** (11.1K lines) → [REFACTOR IN PROGRESS]
  - Target: Split into:
    - game-shell-core.css (2K)
    - game-word-quest.css (3K)
    - game-typing-quest.css (2K)
    - game-responsive.css (1.5K)
    - game-animations.css (1.5K)
    - game-theme-overrides.css (1K)

## Refactor Tickets
- [ ] Issue #847: Split game-shell.css (2026-Q2)
- [ ] Issue #848: Split components.css (2026-Q2)
- [ ] Issue #849: Modularize app.js (2026-Q2)
- [ ] Issue #850: Remove !important patterns (2026-Q1)
```

**Update Triggers:**
- Whenever a file exceeds size limit
- Whenever a new module is created
- Whenever dependencies change
- Quarterly full inventory audit

---

## PART 4: CODE REVIEW GUARDRAILS

### Rule 4.1: PR Template

**File:** `.github/pull_request_template.md`

```markdown
## What This PR Does
[1-2 sentence summary]

## Files Changed Summary
- Lines added: ___
- Lines removed: ___
- Net change: ___

### Have you considered removing duplicate code elsewhere?
- [ ] Yes, identified and removed __ lines of similar code
- [ ] N/A, this is new functionality with no prior equivalent
- [ ] No, explain below why ↓

Explanation: ____________

## Design System Compliance
- [ ] All colors use CSS tokens (var(--...))
- [ ] All font sizes use token scale (var(--fs-*))
- [ ] All spacing uses space scale (var(--space-*))
- [ ] No hardcoded colors, fonts, or spacing (#hex, 14px, 10px, etc.)
- [ ] All selectors appear exactly once per file (merged duplicates)
- [ ] Zero !important unless in utilities/feedback/themes files
- [ ] No cross-module CSS styling

If any unchecked, explain reason:

## Testing
- [ ] Visual regression testing (screenshot comparison)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Dark mode tested (seahawks + forest themes)
- [ ] Contrast verified (WCAG AA minimum)

## Reviewer Checklist
- [ ] File sizes within limits (CSS <4K, JS <8K, HTML <500)
- [ ] Design tokens used consistently
- [ ] No cascade battles (!important count reasonable)
- [ ] Architecture registry updated if new module added
- [ ] No hardcoded values
```

### Rule 4.2: Mandatory Code Review Rules

**Blocking Issues (PR cannot merge if not resolved):**
1. Any file exceeds size limit (4K CSS, 8K JS, 500 HTML)
2. Any hardcoded color/font/spacing found
3. !important count >10 per file (except exceptions)
4. Duplicate selectors in same file
5. Cross-module CSS styling
6. Design token not used when available
7. Contrast violation found (WCAG AA)

**Nice-to-Have Issues (should fix, but not blocking):**
- Inline comments could be clearer
- Function could be more modular
- Could consolidate repeated patterns

---

### Rule 4.3: Review Template Response

**Reviewer should ask:**

```markdown
### Code Quality
- [ ] Are size limits respected? (.css files ≤4K, .js files ≤8K)
- [ ] Are design tokens used (no #hex, 14px, 10px)?
- [ ] Does this PR remove code elsewhere to compensate for additions?
- [ ] Are cascade battles avoided (!important count ≤10)?

### Architecture
- [ ] Does this follow module boundaries (no cross-module styling)?
- [ ] Is this module isolated and reusable?
- [ ] Does this maintain single responsibility?

### Testing
- [ ] Screenshot diff provided (visual changes)?
- [ ] Tested on mobile, tablet, desktop?
- [ ] Dark modes verified?
- [ ] Contrast checked (WCAG AA)?

### Specific Feedback
[If issues found, list them with line numbers and required fixes]
```

---

## PART 5: MONITORING & METRICS

### Rule 5.1: Code Metrics Dashboard

**File:** `docs/CODE_METRICS.md` (updated monthly)

```markdown
## Codebase Health (March 2026)

### File Sizes
| File | Size | Limit | Status |
|------|------|-------|--------|
| game-shell.css | 11.1K | 4K | 🔴 OVER (refactor in progress) |
| components.css | 9.5K | 4K | 🟠 OVER (split planned Q2) |
| teacher-hub-v2.css | 8.2K | 4K | 🟠 OVER (split planned Q2) |
| app.js | 19K | 8K | 🔴 OVER (refactor planned Q2) |

### Quality Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| !important count | 685 | 50 | 🔴 OVER |
| Hardcoded colors | 211 | 0 | 🔴 OVER |
| Hardcoded font sizes | 93 | 0 | 🔴 OVER |
| Duplicate selectors | 258 | 0 | 🔴 OVER |
| Cross-module CSS | 12 instances | 0 | 🟠 SOME |

### Trend (Last 3 Months)
- File sizes: ↗ (2% growth per month)
- !important: ↙ (10% decrease after guardrails added)
- Hardcoded values: → (stable, need cleanup)
- Duplicate selectors: ↙ (5% decrease after linting)

### Next 30 Days
- [ ] game-shell.css split complete
- [ ] !important reduced below 100 total
- [ ] Zero new hardcoded colors (all tokens)
```

### Rule 5.2: Automated Alerts

**CI Integration:**

```yaml
# .github/workflows/code-health-check.yml
name: Code Health Check

on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check file sizes
        run: npm run lint:sizes
      - name: Check token compliance
        run: npm run lint:tokens
      - name: Check !important usage
        run: npm run lint:important
      - name: Check duplicates
        run: npm run lint:duplicates
      - name: Report metrics
        run: npm run metrics:report
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `❌ Code health check failed. See logs above.`
            })
```

---

## PART 6: QUARTERLY AUDIT SCHEDULE

### Every 3 Months: Full Code Health Audit

**Checklist:**

```markdown
## Q2 2026 Code Health Audit (April 15, 2026)

### CSS Audit
- [ ] Run `npm run lint:sizes` — all files ≤4K lines?
- [ ] Run `npm run lint:important` — count ≤10 per file?
- [ ] Run `npm run lint:tokens` — zero hardcoded colors/fonts/spacing?
- [ ] Run `npm run lint:duplicates` — zero duplicate selectors?
- [ ] Manual review: Any cascade battles or specificity creep?
- [ ] Contrast check: All themes pass WCAG AA?
- [ ] Dark mode test: All themes readable?

### JS Audit
- [ ] Run `npm run lint:complexity` — cyclomatic complexity reasonable?
- [ ] Search console.log/warn/error — any debug code left?
- [ ] Search commented-out code — any dead blocks?
- [ ] Module dependency graph — any circular deps?
- [ ] Dead code detection (ESLint unused-vars) — any false positives to investigate?

### Architecture Audit
- [ ] Update ARCHITECTURE_REGISTRY.md
- [ ] Verify module isolation (no cross-module CSS)
- [ ] Check for file size violations (any approaching limits?)
- [ ] Review refactor tickets (any blockers?)

### Design System Audit
- [ ] Color palette: Any new colors outside 162-token palette?
- [ ] Font scale: Any new font-sizes outside 10-tier scale?
- [ ] Spacing: Any margins/padding outside 8-step scale?
- [ ] Tokens documentation: Up to date?

### Test Coverage
- [ ] Screenshot diffs on recent PRs: Any visual regressions?
- [ ] Contrast measurements: Any WCAG AA failures?
- [ ] Responsive testing: Mobile/tablet/desktop all good?

### Metrics Report
- [ ] Update CODE_METRICS.md with current numbers
- [ ] Compare to previous quarter (trends)
- [ ] Identify top 3 refactoring priorities
- [ ] Schedule refactor tickets for next quarter

### Sign-Off
- [ ] Engineering lead review: ✓
- [ ] Product lead review: ✓
- [ ] Publish audit findings
```

---

## PART 7: Preventing Recurrence

### What Failed Before (Root Cause Analysis)

| Problem | Root Cause | Guardrail Added |
|---------|-----------|-----------------|
| game-shell.css grew to 11.4K | No size enforcement | Rule 1.1: File size limits + CI check |
| 796 !important declarations | Cascade battles unfixed | Rule 1.2: !important limit + enforcement |
| 20+ dated patches (Mar 10-15) | No consolidation cadence | Rule 4.1: PR template asks "Did you remove equivalent code?" |
| 211 hardcoded colors | No token compliance | Rule 2.1: Token-first linting + CI check |
| 93 arbitrary font sizes | Design system ignored | Rule 2.3: Font scale audit quarterly |
| 258 duplicate selectors | No dedup linting | Rule 1.3: Selector dedup enforcement |
| No architecture visibility | No module registry | Rule 3.3: ARCHITECTURE_REGISTRY.md (updated weekly) |
| Dark mode broken | Design System debt ignored | Rule 2.2: Color palette audit + contrast checking quarterly |

**Every guardrail above is backed by:**
1. **Code enforcement** (CI linting)
2. **Process enforcement** (PR template, code review rules)
3. **Visibility** (metrics dashboard, architecture registry)
4. **Accountability** (quarterly audit with sign-off)

---

## APPENDIX: Quick Reference for Developers

### Before You Commit CSS:

```bash
# Run guardrail checks
npm run lint:sizes      # File size OK?
npm run lint:important  # !important count OK?
npm run lint:tokens     # All colors/fonts from tokens?
npm run lint:duplicates # No duplicate selectors?

# If any fail, fix before pushing
```

### Before You Commit JS:

```bash
npm run lint:complexity  # Complexity reasonable?
npm run lint:unused      # Dead code?
npm run lint:eslint      # Standard linting?
```

### Before You Open a PR:

✓ Design system compliance verified (checklist in PR template)
✓ Code metrics within limits
✓ Visual regression tested
✓ Considered removing code elsewhere
✓ Architecture registry updated if new module

### When Reviewing a PR:

✓ Check blocking issues first (file size, hardcoded values, !important abuse)
✓ Verify design token usage
✓ Confirm no cross-module styling
✓ Ask "Why didn't you remove code elsewhere?"
✓ Check visual diffs and contrast

---

## Final Note

**Code health is not about perfection.** It's about:
- **Clarity:** New developers can understand the system in weeks, not months
- **Confidence:** Changes don't break hidden cascade battles
- **Speed:** Refactoring takes days, not sprints
- **Scaling:** Adding features stays easy as codebase grows

These guardrails make that possible. **Use them.**

---

**Document Status:** Active Guardrails Framework
**Last Updated:** 2026-03-16
**Next Review:** 2026-06-16 (Q2 Audit)
**Owner:** Engineering Lead
