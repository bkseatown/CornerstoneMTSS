# CLAUDE.md — Agent Operating Instructions

This file defines how Claude should operate in this codebase. Read this before starting any task.

## Philosophy

Cornerstone MTSS is a **premium, specialist-facing instructional platform** built on Science of Reading principles. Quality > speed. Screenshot verification > code-read claims.

See `VISION.md` for product constitution. This file covers how AI agents work here.

---

## Primary Operating Rules

### 1. Source of Truth (In Order)
1. **Live code** — Always read files before proposing changes
2. **ENHANCEMENT_LOG.md** — Current feature status, what's done/in progress
3. **docs/HANDOVER.md** — Known issues, regression hotspots, next moves
4. **memory/** — User preferences, feedback from prior sessions
5. **VISION.md** — Non-negotiable product principles
6. **docs/CODEX_*.md** — Technical deep-dives (gameplay modules, architecture)

### 2. Work Flow
- ✅ **Autonomous execution** for clean, scoped tasks (code changes, bug fixes, tests)
- ✅ **Verify before claiming done** — screenshot proof or test output, not code-read confidence
- ⚠️ **Ask first** for risky actions (force-push, breaking API changes, deleting files)
- ✅ **Document progress** in ENHANCEMENT_LOG.md after each autonomous enhancement

### 3. Quality Guardrails (Non-Negotiable)
**Before ANY commit, ALL must pass:**
```bash
npm run audit:ui         # Zero console errors, no-scroll verified
npm run release:check    # All contracts (audio, offline, grade-band, visual, telemetry, etc)
npm run test             # All tests pass (failures block commits)
```

**Other required checks:**
- Viewport tested: mobile (375px), tablet (768px), desktop (1280px)
- Dark mode tested (both light & dark themes)
- No `!important` added without justification
- Backwards compatible (no breaking API changes)
- Screenshot proof provided if visual change

### 4. Code Standards
- ✅ Use: ES6 modules, token-first CSS, namespace-manager, Vitest, try/catch
- ❌ Avoid: jQuery, global `window.` vars (except approved modules), circular deps, `!important`, localStorage without error handling
- ✅ Approved libraries: GSAP (animation), Howler.js (audio), Chart.js (data viz), Vitest (tests)

### 5. When Blocked
1. Diagnose root cause (don't retry blindly)
2. Fix underlying issue
3. Run checks again
4. Document blocker in ENHANCEMENT_LOG.md
5. Report to user with clear next step

**Never:** commit with failing tests, skip hooks, use `--no-verify`, or force-push.

---

## File Organization

### Root Level
- `CLAUDE.md` — This file (agent instructions)
- `VISION.md` — Product constitution, design philosophy
- `progress.md` — Session history, feature log
- `ENHANCEMENT_LOG.md` — Status of Tier 1/2/3 enhancements
- `ENHANCEMENT_STANDARDS.md` — Quality bar, library standards, blocked patterns
- `package.json` — npm scripts (100+ scripts covering tests, audits, regressions)

### docs/
- `HANDOVER.md` — Current state snapshot, known issues, next moves
- `CODEX_QUICK_REFERENCE.md` — Gameplay module signatures, data structures
- `CODEX_COMMON_GOTCHAS.md` — Common mistakes (load order, missing exports, etc)
- `CODEX_DEEP_DIVE_*.md` — Module-by-module breakdowns
- `ARCHITECTURE_MAP.md` — System architecture
- `DEPLOYMENT_GUIDE.md` — GitHub Pages deployment

### Live Pages (Per HANDOVER.md)
- `index.html` — Landing/dashboard shell (CSS: `home-v3.css`)
- `game-platform.html` — Game gallery + shared play shell
- `word-quest.html` — Flagship game
- `typing-quest.html` — Fluency-focused game
- `teacher-hub-v2.html` — Specialist workflow hub (v2 is current; v1 is legacy)
- `reports.html` — Analytics + workroom
- Plus: `student-profile.html`, `activities/decoding-diagnostic.html`, tool surfaces, etc.

### Key Systems
- **Tokens**: `style/tokens.css` → `style/generated-color-tokens.css` (23 themes, OKLCH-based)
- **Game Shell**: `games/ui/game-shell.js` + `game-shell.css` (shared across all game platforms)
- **Curriculum**: `js/curriculum-truth.js`, `js/lesson-brief-panel.js` (SSoR scope)
- **Build**: `build.json`, `build-stamp.js`, versioning via cache-busting timestamps
- **Offline**: `sw.js`, `sw-runtime.js` (14,524 audio files tracked in manifest)

---

## Known Hotspots (Regressions Reoccur Here)

From `docs/HANDOVER.md`:

| Hotspot | Issue | How to Verify |
|---------|-------|---------------|
| **Typing Quest** | Duplicate welcome/layout logic recurs | Screenshot both light & dark modes |
| **Word Quest** | Decorative overlays + translucent boxes creep back | Verify board is crisp, no overlays obscure letters |
| **Game Shell** | One passing theme ≠ done (must test all states) | Check default, dark, and open/play states |
| **Cache Drift** | Build badge stale = false fix claims | Run `npm run audit:ui` & verify fresh build ID |

---

## Quality Bar

- ✅ No-scroll first screen at typical laptop height (1440×900)
- ✅ All guardrails passing (`audit:ui`, `release:check`, `test`)
- ✅ Figma-eye audit passing (see `docs/FIGMA_AUDIT_SCORECARD.md`)
- ✅ Screenshot-validated changes only (not code-read confidence)
- ✅ 242/254 tests passing (12 failures = Playwright infrastructure, not test logic)

---

## Enhancement System

### Autonomous Enhancement Workflow
1. **Pick task** from ENHANCEMENT_LOG.md (Tier 1/2/3)
2. **Code + verify** (pass all guardrails)
3. **Screenshot proof** (visual confirmation)
4. **Commit** (no flags, message includes closed issues)
5. **Update ENHANCEMENT_LOG.md** (mark as complete)

### Tier Levels
- **Tier 1**: Game platforms (Word Quest, Typing Quest, Precision Play, Reading Lab)
- **Tier 2**: Teacher dashboards (Reports, Hub, Case Management)
- **Tier 3**: Support pages (Student Profile, Lesson Brief, Writing Studio)

### Definition of Done
- ✅ All guardrails pass
- ✅ Tested on 3 viewports + dark mode
- ✅ Backwards compatible
- ✅ Screenshot proof provided
- ✅ ENHANCEMENT_LOG.md updated

---

## Deployment

- **Target**: GitHub Pages (`https://bkseatown.github.io/CornerstoneMTSS`)
- **Trigger**: Push to `main` branch
- **Local Dev**: `python3 -m http.server 4174` → `http://127.0.0.1:4174/index.html`
- **Monitor**: `.github/workflows/deploy-pages.yml`, `pages-freshness.yml`

---

## User Preferences

- ✅ Wants honest assessments (not defensive "it's fine")
- ✅ Prefers autonomous execution for scoped tasks
- ✅ Uses doc infrastructure as source of truth (HANDOVER, AGENT_CONTINUITY)
- ✅ Values screenshot proof over code-read claims
- ✅ Expects transparency when blocked
- ✅ Wants terse responses with no trailing summaries

---

## Memory System

Persistent memory lives in `/Users/robertwilliamknaus/.claude/projects/.../memory/`.

- **user_*.md** — User role, expertise, preferences
- **feedback_*.md** — Standing instructions from prior sessions
- **project_*.md** — Current initiatives, blockers, deadlines
- **reference_*.md** — External systems (Linear, Slack, docs)

Check memory before starting. Update memory after learning new patterns.

---

## Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Tests fail randomly | Run `npm run test` again (flaky Playwright) |
| Build badge stale | Kill dev server, restart, run `npm run audit:ui` |
| Component not showing | Check load order in HTML + window exports |
| Theme looks wrong | Run `npm run hud:check`, verify tokens in `js/theme-registry.js` |
| Audio not playing | Check `js/audio.js` path resolution + audio manifest |
| Cache issue | Clear browser DevTools cache, reload with Cmd+Shift+R |

---

## Getting Help

- **For codebase questions**: Check `docs/CODEX_*.md` first (technical deep-dives)
- **For product questions**: Check `VISION.md` (non-negotiables)
- **For current status**: Check `progress.md` and `ENHANCEMENT_LOG.md`
- **For known issues**: Check `docs/HANDOVER.md`
- **For user feedback**: Check `memory/` (prior session notes)

---

Last updated: 2026-03-22
