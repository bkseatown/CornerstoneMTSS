# Starting Prompt for Next Thread — March 16, 2026 Evening

## Context Summary

Cornerstone MTSS is a specialist-facing MTSS instructional platform with:
- Premium game family (Word Quest flagship, Typing Quest, Off Limits, Build the Word)
- Specialist Hub for intervention planning & progress tracking
- Reports & student profile management
- Design token system with 23 theme variations

**Current Session (March 16 evening):** Fixed 5 Word Quest visual regressions:
1. ✅ Keyboard keys: Changed from circular (12px) to proper rounded squares (5px)
2. ✅ Game board tiles: Increased from 62px to 72px for better visibility
3. ✅ Key spacing: Added proper gap between keys (6px → 9px)
4. ✅ Letter padding: Added breathing room around text (6px × 8px)
5. ✅ Help button: Reduced size to 37px across all themes

All fixes screenshot-verified and committed. Word Quest is now stable.

---

## Current State

### ✅ Complete & Stable
- **Word Quest:** Premium gameplay with proper visual design (rounded squares, proper spacing, scaled tiles)
- **Phase 0 & A (Curriculum Architecture):** Full pipeline from curriculum → competency → intervention recommendations
- **Design System:** Token-first CSS with 0 hardcoded colors in new work, design tokens for all colors/spacing/shadows
- **Code Health:** Pre-commit guardrails (file size, !important, token compliance, selector deduplication) actively preventing bloat

### 🟡 In Progress
- **Phase 1B (Token Adoption):** ~1% complete (49 of 5,390+ colors converted). Blocked on manual effort vs. automation decision
- **Visual Polish:** 20 pages average 71/100 Figma quality score (target: 90+/100)

### 🔴 Not Started
- **Phase 1E (Shared Controls):** Music/theme controls only in Word Quest; need to propagate to all games
- **Progress Visualization:** Student profile needs learning curve graphs
- **Responsive Validation:** Test all 20 pages at 375px, 768px, 1440px, 2560px viewports

---

## Recommended Next Steps (Prioritized)

### High Priority — Visual Polish & Feature Completion

**1. Extend Shared Controls (4-6 hours)**
   - Extract music/theme controls from Word Quest into GameShellControls API
   - Propagate to: game-platform, typing-quest, precision-play, and 7+ other activities
   - Impact: All games jump 8-15 quality points for feature parity
   - **Related doc:** `docs/ARCHITECTURAL_UNIFICATION_PLAN.md`

**2. Add Progress Visualization (2-3 hours)**
   - Student Profile: Add "games attempted," "mastery %," "trend" graphs
   - Show learning curve over time
   - Impact: Student Profile jumps from 74/100 to 85+/100

**3. Platform Visual Audit & Polish (6-8 hours)**
   - Complete Figma-style audit of all 20 pages
   - Implement visual refinements (shadows, hover states, animations, color consistency)
   - Target: All pages 85+/100, Tier 1 (Word Quest, Hub, Gallery) 92+/100
   - **Related doc:** `docs/FIGMA_VISUAL_AUDIT_2026-03-16.md`

### Medium Priority — Code Quality & Consistency

**4. Complete Phase 1B (Token Adoption) — Decision Needed**
   - Option A: Continue manual (21.5 hours, likely too long)
   - Option B: Build automation script (2 hrs build + 6 hrs batch process = 8 hrs total)
   - **Related doc:** `docs/IMPLEMENTATION_STATUS.md`

**5. Responsive Design Validation (4-5 hours)**
   - Test all 20 pages at 375px (mobile), 768px (tablet), 1440px (desktop), 2560px (ultrawide)
   - Fix any clipping, overflow, or layout breaking
   - Run `npm run audit:ui` for automated screenshot capture

---

## Key Files to Know

**Architecture & Planning:**
- `docs/HANDOVER.md` — Current state, phases, critical rules
- `docs/VISION.md` — Product intention and non-negotiables
- `docs/ARCHITECTURAL_UNIFICATION_PLAN.md` — How to propagate shared controls
- `docs/FIGMA_VISUAL_AUDIT_2026-03-16.md` — Visual quality audit with per-page scores

**Code Health:**
- `docs/CODE_HEALTH_GUARDRAILS.md` — File size, !important, token, selector limits
- `.husky/pre-commit` — Automated checks that block commits violating guardrails
- `scripts/lint-file-size.js`, `lint-token-compliance.js`, etc. — Validation tools

**Live Surfaces:**
- `word-quest.html` — Flagship game (currently: 82/100 quality) ✅ Stable
- `game-platform.html` — Shared game gallery (68/100) — needs visual polish
- `typing-quest.html` — Typing game (71/100) — needs identity & controls
- `teacher-hub-v2.html` — Specialist hub (78/100) — solid, needs refinement
- `student-profile.html` — Student detail (74/100) — needs progress graphs
- `reports.html` — Reports engine (72/100) — needs subtraction-first pass

**CSS System:**
- `style/tokens.css` — Design tokens (colors, spacing, shadows, motion)
- `style/components.css` — Component styles (10,255 lines — needs restructure eventually)
- `games/ui/game-shell.css` — Shared game shell styles (11,146 lines)
- `style/themes.css` — 23 theme definitions (verified all working after regression fix)

---

## Screenshot Baseline (March 16 After Fixes)

After this session's Word Quest fixes, the baseline is:
- Game board tiles: Large, visible, proper spacing (72px)
- Keyboard keys: Rounded squares (5px), not circular, proper letter spacing
- Help button: Compact size (37px), properly proportioned
- All visual feedback states working correctly

**Recommendation for next session:**
Start by taking fresh screenshots of Word Quest and comparing to these fixes to verify stability. Then move to visual polish of game-platform and other surfaces.

---

## Decision Points Requiring Your Input

**1. Token Adoption Strategy**
   - Should we build automation script for Phase 1B (9 hours total) or continue manual (21.5 hours)?
   - **Recommendation:** Automation. Will unblock color refinement work and prevent future color regressions.

**2. Shared Controls Priority**
   - Should we extract music/theme to all games (Phase 1E) before or after visual polish?
   - **Recommendation:** Before. Adds feature parity to all games, boosts quality scores 8-15 points each.

**3. Responsive Testing Scope**
   - Test all 20 pages or focus on Tier 1 first (Word Quest, Hub, Gallery)?
   - **Recommendation:** Tier 1 first (6 hours), then remaining pages (3-4 hours).

---

## Quick Command Reference

```bash
# Check code health
npm run lint:sizes          # File size compliance
npm run hud:check          # Pre-commit checks
npm run release:check      # Full release validation

# Take screenshots for audit
npm run audit:ui           # Capture all 20 pages at multiple viewports

# Run dev server
python3 -m http.server 4174  # Start local dev server
# Then visit: http://127.0.0.1:4174/word-quest?play=1

# View version status
cat build.json             # Current build version
grep -n "?v=" word-quest.html | head -5  # CSS version refs
```

---

## What Success Looks Like

**By end of next thread:**
- [ ] Word Quest remains stable (screenshot verify)
- [ ] 1-2 high-priority features complete (shared controls OR progress graphs)
- [ ] Visual quality scores trend toward 85+/100 average
- [ ] No new regressions introduced
- [ ] All commits passing guardrail checks

**By end of week 2:**
- [ ] All 20 pages 85+/100 minimum
- [ ] Tier 1 pages 92+/100
- [ ] All games have shared controls (music, theme, settings)
- [ ] Student profile has progress visualization
- [ ] Responsive validated at 375px, 768px, 1440px, 2560px

---

## Start Here

1. **Verify stability:** Take fresh screenshot of Word Quest at `?play=1` in Seahawks theme. Compare keyboard keys (should be rounded squares, not circles), game board tiles (72px), help button (37px). Confirm all three visual fixes are present.

2. **Choose first task:** Pick one of the three high-priority items:
   - Extend shared controls (most impactful for feature parity)
   - Add progress graphs (student engagement signal)
   - Visual polish pass (overall quality jump)

3. **Use the guardrails:** Every commit will auto-check file sizes, !important flags, token usage, selector duplication. If you hit a limit, the pre-commit hook will explain why and suggest a fix.

4. **Reference the docs:** This README, HANDOVER, and the phase-specific docs are your source of truth. If something is unclear, check those first.

---

Good luck! The platform is in solid shape. Focus on one high-impact area, and you'll move the needle significantly. 🚀
