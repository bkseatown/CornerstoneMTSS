# Cornerstone MTSS — Comprehensive Design Elevation

> Historical planning doc: use for background context only. Do not treat this file as the current source of truth. Start with `README.md`, `QUICK_START.md`, and `docs/PROJECT_STATUS.md`.

**Target:** Exceptional, premium, polished across all surfaces  
**Date:** 2026-03-20

---

## DESIGN ELEVATION STRATEGY

### Phase 1: Text Hierarchy & Headings (High Impact)
- Remove all redundant kicker+heading patterns
- Establish clean 3-level heading system (H1 page context, H2 sections, H3 subsections)
- Use single, strong headings instead of kicker+heading pairs
- Apply consistent font sizing: H2=24px, H3=18px, body=14px
- Increase line-height for readability: 1.6 for headings, 1.5 for body

### Phase 2: Spacing & Layout (High Impact)
- Audit all padding/margin against 8px/16px token system
- Implement consistent spacing rhythm:
  - Sections: 32px vertical gap
  - Cards: 24px internal padding
  - Text blocks: 16px margins
  - Elements: 8px micro-spacing
- Tighten dense areas (reports.html main content, profile details)
- Add visual breathing room between major sections

### Phase 3: CTA & Interactive Elements (Medium Impact)
- Audit button prominence across all pages
- Primary actions: brighter, larger, more assertive
- Secondary actions: muted but clearly clickable
- Form inputs: consistent padding, focus states
- Hover states: subtle but responsive

### Phase 4: Card & Surface Design (Medium Impact)
- Consistent shadow depths:
  - Level 1 (subtle): 0 2px 4px rgba(0,0,0,0.08)
  - Level 2 (medium): 0 4px 8px rgba(0,0,0,0.12)
  - Level 3 (prominent): 0 8px 16px rgba(0,0,0,0.16)
- Consistent border radius: 12px for major elements, 8px for smaller
- Consistent padding: 24px for large cards, 16px for medium, 12px for small
- Visual hierarchy through color and weight, not just size

### Phase 5: Typography Refinement (Medium Impact)
- Font weights: Regular (400), Medium (500), Semibold (600), Bold (700)
- Heading application: Bold (700) for H2, Semibold (600) for H3
- Body text: Regular (400), with Medium (500) for emphasis
- Small caps: Only for subtle context labels, never immediately before headings
- Increased letter-spacing on small caps for legibility

### Phase 6: Color & Contrast (Medium Impact)
- Audit text contrast (WCAG AA minimum: 4.5:1)
- Strengthen visual hierarchy through color weight
- Ensure inactive/secondary elements are visually distinct
- Review muted colors - may need to increase saturation

### Phase 7: Consistency Pass (Low Impact)
- Audit all 6 major surfaces for consistent treatment
- Ensure mobile responsiveness maintained
- Verify dark mode support (if applicable)
- Polish micro-interactions (transitions, focus states)

---

## SPECIFIC PAGE FIXES

### reports.html (Highest Priority)
**Issues:**
- 3+ kicker+heading pairs (FIXED in phase 1)
- Dense main content area
- Pilot Evaluation section feels orphaned
- Student buttons lack visual distinction

**Fixes:**
- Remove kickers (done)
- Increase content padding 12px → 20px
- Add 32px margin above Pilot Evaluation
- Strengthen student button hover states
- Consistent 24px spacing between major sections

### teacher-hub-v2.html (High Priority)
**Issues:**
- Schedule sidebar scrolls unnecessarily
- Multiple stacked section labels
- Class detail cards could be tighter

**Fixes:**
- Remove schedule scroll (change overflow-y: auto → visible, adjust flex)
- Consolidate section labels (DAY OVERVIEW redundant with "What changes today")
- Tighten card spacing 20px → 16px
- Increase visual separation between student cards

### student-profile.html (Medium Priority)
**Issues:**
- Good structure but could be more polished
- Card borders subtle, might need emphasis

**Fixes:**
- Increase card shadow to Level 2
- Tighten internal padding on detail cards
- Strengthen typography hierarchy

### game-platform.html (Low Priority)
**Issues:**
- Generally good but could use polish

**Fixes:**
- Consistent card spacing
- Stronger focus states on game cards

### word-quest.html (Low Priority)
- Generally polished, minimal changes needed

### index.html (Low Priority)
- Good baseline, enhance typography

---

## EXECUTION CHECKLIST

- [ ] Phase 1: Heading hierarchy (all pages)
- [ ] Phase 2: Spacing audit & tightening
- [ ] Phase 3: CTA prominence review
- [ ] Phase 4: Card/shadow system
- [ ] Phase 5: Typography application
- [ ] Phase 6: Color/contrast audit
- [ ] Phase 7: Cross-page consistency
- [ ] Testing on desktop, tablet, mobile
- [ ] Screenshot validation before/after
- [ ] Git commit with comprehensive message

---

## SUCCESS CRITERIA

✨ **Exceptional** = Premium feel, professional polish
- [ ] No visual clutter or redundant elements
- [ ] Consistent 8px/16px spacing rhythm throughout
- [ ] Clear heading hierarchy (no double headings)
- [ ] CTAs are prominent and unmissable
- [ ] Cards have appropriate shadow/depth
- [ ] Typography is refined and readable
- [ ] Every surface feels intentional, not accidental
- [ ] User can navigate intuitively without confusion
