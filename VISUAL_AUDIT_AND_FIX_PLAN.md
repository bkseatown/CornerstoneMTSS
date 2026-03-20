# CORNERSTONE MTSS — COMPLETE VISUAL AUDIT & FIX PLAN

> Historical planning doc: use for background context only. Do not treat this file as the current source of truth. Start with `README.md`, `QUICK_START.md`, and `docs/PROJECT_STATUS.md`.

**Date:** March 17, 2026
**Status:** Comprehensive Issues Identified + Fix Strategy Ready

---

## CRITICAL ISSUES FOUND

### Issue #1: Theme Panel Color Mismatch (HIGH PRIORITY)

**Problem:** Game cards have nearly white/very light backgrounds with dark text, making them **unreadable**.

**Root Cause:** Light themes (OCEAN, SUNSET) have inverted panel colors:
- Panel background: Nearly white `rgba(226, 244, 250, 0.9)`
- Text color: Dark `#103149`
- **Result:** Light text on light background = invisible

**Current Theme Colors:**
```
DARK theme:      Dark panels (#1a1f3d) + Light text (#f0f4ff) = ✓ Good contrast
OCEAN theme:     Light panels (rgba(226,244,250)) + Dark text (#103149) = ✗ Bad contrast
SUNSET theme:    Light panels (rgba(255,245,247)) + Dark text (#43263f) = ✗ Bad contrast
FOREST theme:    Dark panels (#0d2318) + Light text (#ecfdf5) = ✓ Good contrast
```

**Impact:** Game gallery, all game cards, ALL card-based components are broken in OCEAN and SUNSET themes

---

### Issue #2: No Professional Themes

**Problem:** Current themes are too game-focused (colorful, playful).
**Need:** Seahawks (navy/green), Starbucks (green), Huskies (purple/gold) themes for professional context.

---

### Issue #3: Visual Hierarchy Problems

**Problem:** Throughout the platform:
- Typography hierarchy is flat (headers don't visually stand out)
- Spacing is inconsistent
- Component groups aren't clearly defined
- Color emphasis is missing (vibrant accent colors underutilized)

---

### Issue #4: Component Visibility Issues

**Problem Areas:**
- Game cards: Tiles/content barely visible
- Buttons: Text contrast may be poor on light backgrounds
- Grade/Subject filter: Low visibility against backgrounds
- Form inputs: Unclear when active vs inactive
- Message/notification areas: Hard to differentiate states

---

## COMPREHENSIVE FIX STRATEGY

### Phase 1: Fix Theme System (CRITICAL)
1. **Audit all 4 theme definitions** in game-theme.css
2. **Fix panel backgrounds** for light themes:
   - Make panels darker OR
   - Create separate "surface" tokens for cards vs backgrounds
3. **Ensure text contrast** meets WCAG AA minimum (4.5:1)
4. **Add new professional themes** (Seahawks, Starbucks, Huskies)
5. **Test all themes** for readability

### Phase 2: Visual Hierarchy Improvements
1. **Typography:** Increase header font sizes, bolder weights
2. **Spacing:** Add consistent gap tokens for component grouping
3. **Color emphasis:** Use vibrant accent colors (emerald, coral, purple) strategically
4. **Shadows:** Improve depth with better shadow hierarchy

### Phase 3: Component Fixes
1. **Game cards:** Ensure tiles/content visible at all zoom levels
2. **Buttons:** Verify contrast on all background colors
3. **Forms:** Clear active/inactive states
4. **Navigation:** Better visual grouping and hierarchy
5. **Status indicators:** Use color + symbols (not color alone)

### Phase 4: Platform-Wide Improvements
1. **Consistent spacing** (use token-based spacing)
2. **Better visual grouping** (cards, sections, related elements)
3. **Improved readability** (font sizes, line-height, letter-spacing)
4. **Responsive design** (test on mobile, tablet, desktop)

---

## PAGES TO FIX (Priority Order)

1. **game-platform.html** (HIGHEST) — Game cards broken in light themes
2. **index.html** (HIGH) — Home page visual polish
3. **word-quest.html** (HIGH) — Flagship game, must look great
4. **typing-quest.html** (HIGH) — Flagship game
5. **reading-lab.html** (MEDIUM) — Tool page
6. **reports.html** (MEDIUM) — Teacher dashboard
7. **teacher-hub-v2.html** (MEDIUM) — Specialist hub
8. **student-profile.html** (LOW) — Detail page

---

## IMPLEMENTATION PLAN

### Step 1: Fix Theme System
- Update game-theme.css with corrected panel colors for light themes
- Create new Seahawks, Starbucks, Huskies theme definitions
- Test contrast ratios with accessibility tools

### Step 2: Create Theme-Safe Component Styles
- Define "card-surface" tokens for cards that work in both light and dark themes
- Define "elevated-surface" for panels that need higher contrast
- Update game-shell.css to use these new tokens

### Step 3: Improve Game Card Rendering
- Fix tile visibility on all backgrounds
- Improve text contrast
- Better spacing and visual hierarchy within cards

### Step 4: Typography & Spacing
- Increase header sizes (H1: 32px → 36px, H2: 24px → 28px)
- Improve line-height for readability (1.4 → 1.6)
- Use spacing tokens consistently (gap: var(--sp-3) instead of hardcoded px)

### Step 5: Test & Validate
- Screenshot all pages in all 4 themes
- Test contrast ratios (WCAG AA minimum: 4.5:1)
- Mobile/tablet/desktop responsive check
- Color blind simulation (deuteranopia, protanopia, tritanopia)

---

## FILES TO MODIFY

Primary:
- `games/ui/game-theme.css` — Theme color definitions (CRITICAL)
- `games/ui/game-shell.css` — Card and component styles
- `style/tokens.css` — Token definitions

Secondary:
- `home-v3.css` — Home page styling
- `style/platform-hero.css` — Hero section
- All game-specific CSS files

---

## SUCCESS CRITERIA

✓ All themes have readable text (minimum 4.5:1 contrast)
✓ Game cards are visible and well-designed in all themes
✓ Professional themes (Seahawks, Starbucks, Huskies) available
✓ Typography hierarchy is clear (headers visually prominent)
✓ Consistent spacing throughout platform
✓ All pages pass WCAG AA accessibility
✓ Color-blind friendly (symbols + text, not color alone)
✓ Responsive on mobile, tablet, desktop

---

## NEXT STEPS

1. **Acknowledge this plan** (or request modifications)
2. I implement Phase 1 (theme fixes) immediately
3. Show before/after for critical pages
4. Continue with Phases 2-4
5. Full feature integration (Phases 2-6) after visual foundation is solid

Ready to proceed?
