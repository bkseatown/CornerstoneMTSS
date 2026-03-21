# Enhancement Standards for Cornerstone MTSS

Quality bar for autonomous feature additions across the application.

## Pages & Enhancement Priority

### Tier 1: Game Platforms (Highest Impact)
- **Word Quest** (word-quest.html) — flagship game
- **Typing Quest** (typing-quest.html) — fluency-focused game
- **Precision Play** (precision-play.html) — intervention game
- **Reading Lab** (reading-lab.html) — comprehension tool

**Goal**: GSAP animations, Howler.js audio, haptic feedback, celebration states

### Tier 2: Teacher Dashboards (High Impact)
- **Reports Hub** (reports.html) — analytics + insights
- **Teacher Hub v2** (teacher-hub-v2.html) — workflow hub
- **Case Management** (case-management.html) — caseload tracking

**Goal**: Chart.js visualizations, real-time updates, animated transitions, micro-interactions

### Tier 3: Support & Profile Pages (Medium Impact)
- **Student Profile** (student-profile.html) — learner snapshots
- **Lesson Brief Panel** (js/lesson-brief-panel.js overlay) — instructional prep
- **Session Runner** (session-runner.html) — activity sequencing
- **Writing Studio** (writing-studio.html) — composition tool

**Goal**: Animated progress indicators, achievement badges, skeleton screens, accessibility polish

---

## Required Quality Checklist

**Before ANY commit, all must pass:**

- [ ] **No console errors** — run `npm run audit:ui`, zero errors allowed
- [ ] **Guardrails passing** — `npm run release:check` succeeds
- [ ] **Tests pass** — `npm run test` (existing + new tests)
- [ ] **Viewport tested** — verified on mobile (375px), tablet (768px), desktop (1280px)
- [ ] **Dark mode tested** — works in both light and dark themes
- [ ] **Accessibility** — keyboard navigation functional, ARIA labels present where needed
- [ ] **Performance** — LCP still <2.5s, FID <100ms, no new layout shifts
- [ ] **Backwards compatible** — no breaking changes to public APIs
- [ ] **Screenshot proof** — visual confirmation of enhancement working

---

## Design Philosophy

### Animation Principles
- Microinteractions responsive: <100ms perceived delay
- Use transform/opacity only (no layout-triggering properties)
- Respect `prefers-reduced-motion` media query
- Provide feedback for all user actions (hover, click, loading)

### Game Enhancements
- Celebrate wins: confetti, sound effects, haptic buzz
- Smooth wrong-answer feedback (no jarring colors, fade transitions)
- Progress visualization: animated bars, milestone markers
- Sound design layered: background music + SFX + voice cues

### Dashboard Enhancements
- Charts animated on load (staggered bar reveals, line draws)
- Data updates smoothly (no jarring refreshes)
- Loading states: skeleton screens, spinners, progress indicators
- Filters/sorts with smooth transitions

### Accessibility Standards
- All interactive elements keyboard-focusable
- Focus rings visible and animated
- Color not sole conveyor of info (use icons, text, patterns)
- Touch targets minimum 44px × 44px
- Reduced motion: disable animations if `prefers-reduced-motion: reduce`

---

## Blocked Patterns

❌ **Do NOT use these:**
- jQuery (we use vanilla ES6)
- Global `window.` variables (use namespace-manager)
- Circular module dependencies
- CSS with `!important` >10 declarations
- Breaking changes to game-shell or lesson-brief APIs
- Unminified external libraries in source (use npm)
- localStorage without error handling
- Event handlers not cleaned up (memory leaks)

✅ **DO use these:**
- ES6 modules with explicit imports
- namespace-manager for module registration
- Vitest for unit tests
- Try/catch with proper error logging
- Data attributes for event delegation
- CSS custom properties (tokens)
- Progressive enhancement (works without JS)

---

## Library Standards

### Approved Libraries (Already Available)
- **GSAP** (animations) — use for all page transitions + game effects
- **Howler.js** (audio) — layered sound design
- **Chart.js** (visualization) — reports and dashboards
- **Vitest** (testing) — unit + integration tests

### Before Adding New Library
- Check bundle impact (npm install && npm run audit:ui)
- Verify tree-shaking compatibility
- Confirm no conflicts with existing deps
- Test in all supported browsers

---

## Testing Requirements

- Unit tests for new functions (vitest)
- Integration tests for user flows
- Visual regression: screenshot on key pages
- Accessibility: keyboard nav + screen reader tested
- Performance: Lighthouse audit ≥90

---

## Commit Message Format

```
feat(word-quest): add GSAP win-state animations

- Particle burst effect on correct answer
- Scale-up celebration animation
- Sound effects via Howler.js
- Haptic feedback on mobile
- Tests added for animation triggers
- Screenshot: [verified on 375px, 1280px]

Closes #[issue] if applicable
```

---

## When Blocked

If guardrails fail or tests break:
1. Diagnose root cause (don't just retry)
2. Fix underlying issue
3. Run checks again
4. Document blocker in ENHANCEMENT_LOG.md
5. Report to user with clear next step

**Never**: commit with failing tests, skip hooks, or use --no-verify.

---

## Success Criteria

After each enhancement:
- ✅ Code is cleaner/more maintainable
- ✅ User experience measurably improved
- ✅ Teachable moment added to future agents (via memory)
- ✅ No technical debt introduced
- ✅ All guardrails pass
- ✅ User can see it working (screenshot proof)
