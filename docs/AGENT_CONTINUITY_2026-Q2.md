# AGENT CONTINUITY & OPERATIONAL CONTINUITY 2026-Q2
**For Claude, Codex, Gemini, and any AI agent working on this codebase**

---

## EXECUTIVE BRIEF: What Changed March 16, 2026

### What Happened
- Code bloat audit revealed 44.6% CSS bloat (36K vs 20K optimal)
- Root cause: **No enforcement mechanisms** (scripts, CI, hooks) preventing accumulation
- User decision: **Guardrails-first** + **Strategic blueprint for next phase**

### What You Must Know Before Starting Work
1. **CODE_HEALTH_GUARDRAILS.md** - The rulebook. Violations cause commit failure.
2. **STRATEGIC_BLUEPRINT_2026-Q2.md** - The vision for next 16 weeks (4 phases)
3. **This document** - How to keep guardrails alive as you work

### Where These Documents Live
```
docs/
  ├─ CODE_HEALTH_GUARDRAILS.md (Enforcement rules + CI scripts)
  ├─ STRATEGIC_BLUEPRINT_2026-Q2.md (Vision + 4-phase roadmap)
  ├─ AGENT_CONTINUITY_2026-Q2.md (This file - HOW to operate)
  ├─ HANDOVER.md (Day-to-day reference)
  └─ MEMORY.md (project context in /Users/robertwilliamknaus/.claude/projects/)
```

---

## PART 1: GUARDRAILS ENFORCEMENT (Active as of March 16, 2026)

### What Happens When You Commit
The `.husky/pre-commit` hook runs 4 guardrail checks:

```bash
npm run lint:sizes       # CSS ≤4K, JS ≤8K, HTML ≤500 lines
npm run lint:important   # ≤10 !important per file (exceptions exist)
npm run lint:tokens      # All colors/fonts from tokens (0 hardcoded values)
npm run lint:duplicates  # No duplicate selectors (cascade battles)
```

**If any check fails, your commit is BLOCKED.** You must fix before pushing.

### The 4 Guardrails

#### Guardrail 1: File Size Limits
| Type | Limit | Trigger | Why |
|------|-------|---------|-----|
| **CSS** | 4,000 lines | Modularize | Beyond 4K, cascade complexity unmanageable |
| **JS** | 8,000 lines | Break into modules | Dead code invisible in 8K+ files |
| **HTML** | 500 lines | Extract components | Unmaintainable markup beyond 500 lines |

**If you hit a limit:**
1. Split the file into focused modules
2. Reference STRATEGIC_BLUEPRINT_2026-Q2.md Part 5 for module boundaries
3. If truly unfeasible, create RFC ticket (exceptions granted for max 6 months)

#### Guardrail 2: !important Limit (≤10 per file)
**Why:** More than 10 `!important` declarations = cascade war (unresolved specificity problems)

**Allowed to exceed:**
- `style/utilities.css` (utility classes need priority)
- `games/ui/game-feedback.css` (animation overrides)

**Banned from !important:**
- `style/components.css` (means specificity failure)
- `style/themes.css` (tokens should flow, not fight)
- `home-v3.css` (landing page should be clean)

**If you use !important, ask yourself:**
- Is this a utility class? (allowed)
- Is this an animation override? (allowed)
- Am I compensating for low specificity elsewhere? (NOT allowed - fix specificity)
- Am I applying to layout properties? (NOT allowed - use different approach)

#### Guardrail 3: Token-First Design (0 hardcoded colors/fonts/spacing)
**Rule:** ALL values come from tokens. Zero exceptions.

**Violations that block commits:**
```css
/* ❌ ILLEGAL */
color: #fff;                    /* Hardcoded color */
font-size: 14px;                /* Hardcoded font */
margin: 16px;                   /* Hardcoded spacing */

/* ✓ CORRECT */
color: var(--color-white);
font-size: var(--fs-body);
margin: var(--space-2);
```

**Why:** Without token compliance:
- Dark mode requires 300+ manual overrides
- New themes are impossible
- Consistency breaks on every color/size change

**Available tokens:**
- Colors: 162 tokens in `style/tokens.css`
- Font sizes: 10-tier scale (`--fs-xs`, `--fs-sm`, ..., `--fs-display`)
- Spacing: `--space-0` through `--space-6` (0px, 4px, 8px, 12px, 16px, 24px, 32px)

#### Guardrail 4: No Duplicate Selectors
**Rule:** Each CSS selector appears ONCE per file (except in @media queries)

**Why:** Duplicates = cascade battles = unresolved conflicts

**Example of what blocks:**
```css
/* Line 500 */
.button { padding: 10px; }

/* Line 1200 */
.button { padding: 5px; }  /* ❌ DUPLICATE: contradictory rules */
```

**Solution:** Find the authoritative rule, update it, delete the duplicate.

---

## PART 2: STRATEGIC ROADMAP (March 16 – June 30, 2026)

### Phase A: Foundation (Weeks 1–4, March 16–April 6) ← **START HERE NOW**

**What to build:**
1. `curriculum/curriculum-engine.js` — Single source for lesson-unit-standard mapping
2. `evidence/competency-mapper.js` — Infer student competency from game performance
3. `interventions/intervention-recommender.js` — Context-aware suggestion engine
4. Database/storage layer — Persist curriculum syncs, evidence, teacher actions

**Success metric:** Core query latency <200ms: "What standards does lesson X address?"

**Files to create/modify:**
- NEW: `js/curriculum/curriculum-engine.js`
- NEW: `js/evidence/competency-mapper.js`
- NEW: `js/interventions/intervention-recommender.js`
- NEW: `js/db/curriculum-sync-store.js` (or similar storage)
- UPDATE: `docs/ARCHITECTURE_REGISTRY.md` (track module map)

### Phase B: Daily Dashboard (Weeks 5–8, April 7–May 4)

**What to build:**
1. `dashboard/daily-dashboard.js` — Teacher-day snapshot
2. `dashboard/daily-dashboard.html` + CSS — UI
3. Student prioritization algorithm — Rank by urgency
4. Action synthesis — "What should teacher do?"

### Phase C: Validation Loop (Weeks 9–12, May 5–June 1)

**What to build:**
1. Action logger — Track if teacher implemented recommendations
2. Intervention impact report — Show which interventions worked
3. Feedback loop — Recommender learns from outcomes

### Phase D: Scaling & Optimization (Weeks 13–16, June 2–30)

**What to build:**
1. Multi-class support
2. Mobile-optimized dashboard
3. Push notifications
4. Batch curriculum sync optimization

---

## PART 3: HOW TO OPERATE (Rules for Any Agent)

### Before You Start Work
1. **Read docs in this order:**
   - MEMORY.md (project context)
   - HANDOVER.md (day-to-day reference)
   - CODE_HEALTH_GUARDRAILS.md (the rules)
   - STRATEGIC_BLUEPRINT_2026-Q2.md (the vision)

2. **Check current phase:**
   - What phase was last worked on? (search git log)
   - What blockers exist? (search `TODO`, `FIXME`, `@blockers`)
   - What tests exist for this phase? (check `tests/` folder)

3. **Run guardrails check:**
   ```bash
   npm run lint:guardrails
   ```
   If anything fails, fix before starting.

### During Implementation

#### Rule 1: Understand Module Boundaries
Before writing code, read `docs/ARCHITECTURE_REGISTRY.md`:
- What modules exist?
- What do they own?
- What APIs do they export?
- Can you add to an existing module, or must you create new?

#### Rule 2: Test as You Build
Each module should have unit tests:
```javascript
// tests/curriculum-engine.spec.js
describe('CurriculumEngine', () => {
  it('should return standards for lesson', async () => {
    const engine = new CurriculumEngine();
    const standards = await engine.getStandardsForLesson('L001', '3-5', 'Reading');
    expect(standards).toHaveLength(3);
    expect(standards[0].id).toBe('3.RF.3');
  });
});
```

#### Rule 3: Use Guardrail Scripts Before Committing
```bash
npm run lint:guardrails   # Run all 4 checks
```

If any fail:
- Fix the violation
- Re-run the check
- Only commit when all pass

#### Rule 4: Update Architecture Registry
If you create a new module, add it to `docs/ARCHITECTURE_REGISTRY.md`:

```markdown
| curriculum-engine | 1.2K | Core | Lesson-unit-standard mapping | Reads: none. Exports: getStandardsForLesson() |
```

This helps next agent understand what exists.

#### Rule 5: Document Your Assumptions
In comments at top of new files:
```javascript
/**
 * curriculum-engine.js
 *
 * SINGLE CURRICULUM SOURCE
 * - Syncs with Google Sheets (weekly)
 * - Authoritative for lesson-unit-standard mapping
 * - No external module modifies this data
 *
 * ASSUMPTIONS:
 * - Lessons always have ≥1 standard
 * - Standards are immutable (version controlled separately)
 * - Grade levels: K, 1, 2, 3, 4, 5, 6-8, 9-12
 *
 * CONSTRAINTS:
 * - API queries must complete in <200ms
 * - No I/O blocking (all data preloaded)
 * - Cannot add new properties without RFC approval
 */
```

### When You're Done With a Phase

1. **Run all guardrails:**
   ```bash
   npm run lint:guardrails
   npm run release:check    # Existing verification suite
   npm run audit:ui         # Visual regression
   ```

2. **Update docs:**
   - `docs/HANDOVER.md` — What was built, what's next
   - `docs/ARCHITECTURE_REGISTRY.md` — Module map (important!)
   - `progress.md` — Session log of work

3. **Commit with clear message:**
   ```
   feat: implement curriculum-engine (Phase A Foundation)

   - Single source for lesson-unit-standard mapping
   - Supports grade band and subject filtering
   - Query latency <200ms verified
   - Unit tests: 12 specs, all passing

   Addresses STRATEGIC_BLUEPRINT_2026-Q2 Phase A deliverable 1.
   Enforces CODE_HEALTH_GUARDRAILS.md rules 1.1-1.3.

   Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
   ```

---

## PART 4: MULTI-AGENT HANDOFF (If You're Claude and User Switches Providers)

### What You Must Do Before Handing Off

1. **Push all work to GitHub:**
   ```bash
   git push origin main
   ```

2. **Update HANDOVER.md:**
   - What you built
   - What works / what doesn't
   - Blockers preventing next phase
   - Specific instructions for next agent

3. **Pin the current phase in HANDOVER:**
   ```markdown
   ## Current Work Phase

   **Phase A: Foundation (March 16–April 6)**
   - [x] curriculum-engine.js (1.2K, latency verified)
   - [ ] competency-mapper.js (in progress - blocked by evidence-store structure)
   - [ ] intervention-recommender.js (not started)
   ```

4. **Create explicit BLOCKER document if stuck:**
   ```markdown
   ## Blockers (CRITICAL)

   **Blocker 1: evidence-store structure unclear**
   - File: js/evidence-store.js
   - Issue: No spec for evidence schema (competency-mapper needs to parse it)
   - Next agent: Check with user about evidence structure before building competency-mapper
   - Estimated impact: 2-day delay if not clarified
   ```

### What Next Agent Must Do

1. **Read in order:**
   - HANDOVER.md (top section first)
   - AGENT_CONTINUITY_2026-Q2.md (this file)
   - CODE_HEALTH_GUARDRAILS.md
   - STRATEGIC_BLUEPRINT_2026-Q2.md

2. **Check for blockers:**
   - Search HANDOVER.md for "Blocker", "CRITICAL", "blocked"
   - Ask user to clarify before proceeding

3. **Verify guardrails still work:**
   ```bash
   npm run lint:guardrails
   ```

4. **Continue from Phase A, Part 2:**
   - Don't re-do curriculum-engine
   - Start with competency-mapper (next deliverable)

---

## PART 5: Emergency Procedures

### If Guardrails Break (Lint Scripts Fail)

1. **Read the error message carefully** — it tells you exactly what's wrong
2. **Find the violating file** — specified in error
3. **Fix using reference from error message:**
   - File size? Split into modules (see STRATEGIC_BLUEPRINT_2026-Q2.md Part 5)
   - !important abuse? Replace with better specificity
   - Hardcoded color? Use `var(--color-*)` token
   - Duplicate selector? Consolidate rules

4. **Re-run lint:**
   ```bash
   npm run lint:guardrails
   ```

5. **If you can't fix it:**
   - Create RFC ticket (explain why guardrail doesn't fit your case)
   - Comment in code with RFC ticket number
   - Proceed **only with user approval**

### If You Break Something in Phase A Implementation

1. **Check git log:**
   ```bash
   git log --oneline -20
   ```

2. **Identify what commit broke it:**
   ```bash
   git diff <good-commit>..<bad-commit>
   ```

3. **Revert if needed:**
   ```bash
   git revert <bad-commit>
   ```

4. **Update HANDOVER.md with what you learned**

### If a Guardrail is Impossible (Honest Assessment Needed)

**Example:** "I need to create a 5K-line module, 4K limit blocks me"

1. **Document the problem:**
   ```markdown
   ## Guardrail Conflict

   File size limit (4K) prevents completion of curriculum-engine.

   Why it's hard to split:
   - curriculum-engine needs atomic access to lesson-standard mappings
   - Splitting into sub-modules creates 4 API layers (too slow, >200ms query latency)
   - User requirement: <200ms latency is hard requirement

   Options:
   A) Split and accept slower queries (violates success metric)
   B) Request 6-month exception for curriculum-engine (explain below)
   C) Redesign architecture to avoid large file (timeline impact?)

   Recommendation: Option B (exception) with refactor scheduled for Q3
   ```

2. **Ask the user** — don't assume

3. **Document the exception** — pin in HANDOVER.md

---

## PART 6: Quick Reference for Agents

### Commands You'll Run Frequently
```bash
npm run lint:guardrails              # Full guardrail check
npm run lint:sizes                   # File sizes only
npm run lint:important               # !important only
npm run lint:tokens                  # Token compliance only
npm run lint:duplicates              # Duplicate selectors only

npm run release:check                # Full release gate
npm run audit:ui                     # Visual regression
npm run test:visual:regression       # Visual snapshots

npm run hud:check                    # HUD contract
npm run scope:strict                 # Change scope validation
```

### Files You'll Reference Often
```
docs/
  ├─ MEMORY.md (← project context, READ FIRST)
  ├─ HANDOVER.md (← day-to-day reference)
  ├─ CODE_HEALTH_GUARDRAILS.md (← enforcement rules)
  ├─ STRATEGIC_BLUEPRINT_2026-Q2.md (← vision + roadmap)
  ├─ ARCHITECTURE_REGISTRY.md (← module inventory)
  └─ AGENT_CONTINUITY_2026-Q2.md (← this file)
```

### Architecture (Where Things Live)
```
js/
  ├─ curriculum/ (Phase A: curriculum-engine.js)
  ├─ evidence/ (Phase A: competency-mapper.js)
  ├─ interventions/ (Phase A: intervention-recommender.js)
  ├─ dashboard/ (Phase B: daily-dashboard.js)
  ├─ db/ (Phase A: storage layer)
  └─ [existing modules...]

games/ui/
  ├─ game-shell.js
  └─ game-shell.css

style/
  ├─ tokens.css (162 color tokens!)
  ├─ components.css
  └─ themes.css
```

---

## CRITICAL REMINDERS

### For Claude (or any agent from Anthropic):
- You have full context of MEMORY.md, guardrails docs, and strategic blueprint
- Use them. Reference them in your commits.
- When context limits hit, document clearly in HANDOVER.md what you were doing

### For Codex, Gemini, or any other provider:
- **You cannot access MEMORY.md** (project memory is Claude-Code specific)
- **READ docs/AGENT_CONTINUITY_2026-Q2.md first** — it's your instruction manual
- **Verify guardrails work before starting any work** (`npm run lint:guardrails`)
- **Ask user for clarification on anything unclear** — don't assume

### For All Agents:
- **Guardrails are not suggestions** — they're automated enforcement
- **Phase roadmap is binding** — don't skip phases, don't improvise
- **Architecture registry is truth** — update it when you create modules
- **Commit messages matter** — future agents read them to understand decisions

---

## Document Status

| Field | Value |
|-------|-------|
| **Created** | 2026-03-16 |
| **Last Updated** | 2026-03-16 |
| **Owner** | Engineering Lead |
| **Review Cycle** | Every 4 weeks (after each phase) |
| **Audience** | All AI agents working on Cornerstone MTSS |

---

## Final Word

The guardrails exist because the previous cleanup found **44.6% code bloat that accumulated slowly**. Without enforcement, it will happen again.

**Your job is to:**
1. Build amazing features (Phase A-D)
2. Keep the codebase healthy (run guardrails before every commit)
3. Document what you did (HANDOVER.md, ARCHITECTURE_REGISTRY.md)
4. Leave it better than you found it

**If you can't do all 4, ask the user. Don't compromise on guardrails.**

Good luck. 🛡️

