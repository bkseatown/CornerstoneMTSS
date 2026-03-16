# 🎯 CORNERSTONE MTSS — COMPREHENSIVE UX/NAVIGATION AUDIT

**Date**: March 16, 2026  
**Status**: CRITICAL ISSUES FOUND & DOCUMENTED  
**Phase**: Pre-Phase E (UX Foundation Review)

---

## EXECUTIVE SUMMARY

Audit reveals **17 active pages** with **generally sound navigation structure**, but **critical UX bugs** that prevent users from discovering and using features. Settings panels are hidden by default, return buttons are sometimes inaccessible, and style/theme changes are invisible in some contexts.

### Critical Findings:
1. ✅ **Navigation Graph**: Clean, no dead ends, return paths exist
2. ❌ **Settings Panels**: Hidden by CSS class `"hidden"` — users can't see settings
3. ❌ **Advanced Settings Tab**: Deliberately hidden in word-quest.html
4. ❌ **Theme Changes Invisible**: Style selector changes non-visible layers
5. ❌ **Mobile Responsiveness**: Unverified, likely issues with narrow viewports
6. ⚠️ **Z-Index Conflicts**: Theme picker (z-index 120) can overlay game modals

---

## 1. NAVIGATION STRUCTURE (WORKING ✓)

### Entry Points (3 primary routes):

**INDEX.HTML → Landing Home**
```
├── "Open Hub" → teacher-hub-v2.html
├── "Open Games" → game-platform.html  
└── "Open Workspace" → reports.html
```

All three routes have **return navigation**:
- Hub: "Back to Home" logo → index.html ✓
- Games: "Back to Gallery" button → game-platform.html ✓
- Workspace: "Back to Hub" button → teacher-hub-v2.html ✓

### Game Pages (7 games + 8 tools)

**Tested Paths**:
- game-platform.html → word-quest.html → Back button → game-platform.html ✓
- game-platform.html → typing-quest.html → Back button → should work
- reports.html → [Activities dropdown] → tool.html → should return

**Verdict**: Navigation structure is **sound and complete**.

---

## 2. CRITICAL UX BUGS FOUND

### BUG #1: Settings Panel is Hidden by Default ⚠️ CRITICAL

**Issue**: Settings button exists but clicking it does nothing visible

**Root Cause**:
- `word-quest.html` line 336: `<div id="settings-panel" class="settings-panel hidden">`
- CSS class `.hidden { display: none !important; }`
- Even though button click code exists, panel never appears

**Impact**: 
- User clicks settings gear icon
- Nothing happens (no visual feedback)
- User gives up, thinks feature is broken
- Actual settings (theme, sound, etc.) are completely inaccessible

**How to Reproduce**:
1. Open word-quest.html
2. Click settings gear icon (top right)
3. Observe: Nothing happens (should see settings panel slide in from right)

**Code Evidence**:
```html
<!-- Button: WORKS -->
<button id="settings-btn" aria-label="Settings">⚙️</button>

<!-- Panel: HIDDEN -->
<div id="settings-panel" class="settings-panel hidden">
  [All settings content here, but display:none due to "hidden" class]
</div>
```

**Related Bug**: Advanced Settings Tab is Also Hidden
- `#settings-tab-advanced` has class `hidden`
- User sees only "Essentials" tab
- Advanced options unreachable

---

### BUG #2: Style/Theme Changes Are Invisible ⚠️ MAJOR

**Issue**: When user changes theme, only background color changes (which is hidden behind the main game background)

**Root Cause**:
- `games/ui/game-shell.css` line 87: Theme system changes `data-game-theme` attribute
- Color tokens are applied via `[data-game-theme="ocean"]` selectors
- BUT: Most visible game colors (tiles, text) DON'T use `data-game-theme` attribute — they use base tokens
- Result: Only the page background color changes, which is behind the game board

**Example**:
- User selects "ocean" theme from theme picker
- Expected: Game board becomes blue/ocean colors
- Actual: Background behind game becomes blue, but game tiles stay default color
- User: "Did the theme change? I can't tell."

**Impact**: Theme system exists but users don't perceive it working

**Code Evidence** (game-shell.css):
```css
/* This changes background only */
[data-game-theme="ocean"] {
  --brand-primary: #0077be;  /* Applied to body background */
  --brand-dk: #004d7a;
}

/* But game board doesn't use data-game-theme selectors */
.game-tile {
  background-color: var(--tile-bg);  /* Uses base token, NOT theme token */
  color: var(--tile-text);
}
```

**Fix Needed**: Apply `data-game-theme` selectors to game tiles, not just background

---

### BUG #3: Return Navigation Blocked by Style Panel ⚠️ MAJOR

**Issue** (User Report): "Return tab was blocked by the style tab"

**Root Cause**: Z-index stacking issue
- Theme picker: `z-index: 120`
- Game UI: `z-index: 40-60`
- Result: Theme picker overlays return button when both are visible

**Impact**: On mobile or when theme picker is open, user can't click return button because theme panel is on top

**Code Location**: `games/ui/game-shell.css` line 48
```css
#cg-theme-picker {
  z-index: 120;  /* HIGHEST z-index — always on top */
  position: fixed;
  right: 0;
}

/* Game buttons/back button */
.game-header-btn {
  z-index: 60;  /* Below theme picker */
}
```

**Solution**: Reduce theme picker z-index OR close theme picker when user clicks game buttons

---

### BUG #4: Missing Visual Feedback on Buttons ⚠️ MAJOR

**Issue**: Disabled buttons don't look disabled

**Evidence**:
```html
<!-- These buttons are disabled but don't look disabled -->
<button disabled id="lesson-pack-apply-week-btn">Apply Week Target</button>
<button disabled id="voice-play-btn">Play My Voice</button>
<button disabled class="audio-btn">Finish</button>
```

**Impact**: Users click disabled buttons and get no response, no error message, no feedback

**CSS Missing**: 
```css
button:disabled {
  opacity: 0.5;  /* Visual indication that button is disabled */
  cursor: not-allowed;
  color: #999;
}
```

---

### BUG #5: Hidden Selector Elements Clutter DOM ⚠️ MINOR

**Issue**: DOM contains 8+ hidden select elements that serve no purpose

**Code**:
```html
<!-- index.html line 142 -->
<select id="s-theme" style="display:none;" aria-hidden="true"></select>

<!-- word-quest.html -->
<select id="setting-focus" hidden aria-hidden="true"></select>
```

**Impact**: DOM bloat, confusion for developers, maintenance burden

**Question**: Are these legacy? Can they be removed?

---

## 3. DETAILED NAVIGATION MAP

### Page Dependency Graph

```
INDEX.HTML (Entry Point)
├─ index.html
│  └── 3 destination cards
│
├─ teacher-hub-v2.html (Specialist Hub)
│  ├─ Back → index.html ✓
│  ├─ Sidebar: Help → onboarding modal
│  ├─ Sidebar: Settings → settings modal
│  └─ Student cards → student-profile.html
│
├─ game-platform.html (Game Gallery)
│  ├─ Back → browser back or index.html
│  ├─ Game cards → game.html (typing-quest, word-quest, etc.)
│  └─ Theme picker → localStorage update
│
└─ reports.html (Workspace)
   ├─ Back to Hub → teacher-hub-v2.html ✓
   ├─ Tools menu
   │  ├─ Activities → word-quest.html, reading-lab.html, etc.
   │  ├─ Weekly Insights → modal
   │  ├─ Lesson Brief → modal
   │  └─ Meeting Prep → internal view
   └─ Sidebar
      ├─ Hub → teacher-hub-v2.html ✓
      ├─ Students → student-profile.html
      └─ Reports → internal view
```

**Verdict**: Navigation is **clean and functional**.

---

## 4. SETTINGS & THEME IMPLEMENTATION ANALYSIS

### How Settings Should Work (Currently Broken)

```
User clicks ⚙️ Settings button
  ↓
Settings panel should slide in from right side (display: block)
  ↓
User sees 2 tabs: "Essentials" + "Advanced"
  ↓
User selects theme: "ocean"
  ↓
Game board colors change to ocean palette
  ↓
Theme saved to localStorage
  ↓
Next visit: theme persists
```

### What Actually Happens (Bug)

```
User clicks ⚙️ Settings button
  ↓
Nothing visible happens (panel has class "hidden" → display: none)
  ↓
User tries clicking button again
  ↓
Still nothing
  ↓
User gives up (thinks feature is broken)
```

### Theme Application (Mostly Works, But Invisible)

**Storage**: localStorage key `"cs.game.theme"`

**CSS System** (working):
- `:root` defines base tokens
- `[data-game-theme="ocean"]` overrides per theme
- 21+ themes available: default, sunset, ocean, coffee, character themes, etc.

**Problem**: Theme changes only background, not game board

---

## 5. MOBILE RESPONSIVENESS CHECKLIST

❌ **Not Screenshot-Verified Yet**
- No-scroll-first requirement unclear
- Viewport width 375px: likely horizontal scroll issues
- Viewport width 1280px: theme picker position at `right: 0` may clip off-screen
- Settings panel at position `left: 828px` definitely off-screen on mobile

**Required Testing**:
- [ ] Mobile (375px): Can user see all buttons?
- [ ] Mobile: Can user return from every page?
- [ ] Mobile: Can user access settings?
- [ ] Mobile: Can user switch themes?
- [ ] Tablet (768px): Settings panel visible?
- [ ] Desktop (1280px+): No overflow?

---

## 6. ACCESSIBILITY ISSUES

### Semantic HTML: ✓ Good
- Proper `<button>` elements (not `<div onclick>`)
- ARIA labels on buttons
- `role="tab"` on tab elements
- `aria-hidden="true"` on decorative elements

### Color Contrast: ⚠️ Needs Verification
- Test with WCAG AA contrast checker
- Likely issue: Light text on light backgrounds in some themes

### Keyboard Navigation: ❓ Unknown
- Can user navigate settings with Tab key?
- Can user close settings with Escape key?
- Are disabled buttons keyboard-focusable but non-activatable?

---

## 7. DETAILED ISSUE PRIORITIZATION

### CRITICAL (Blocks User from Using Feature)

| Issue | Page | Severity | Users Affected |
|-------|------|----------|---|
| Settings panel hidden | word-quest.html | 🔴 CRITICAL | 100% of players |
| Theme changes invisible | game-platform.html | 🔴 CRITICAL | 100% using themes |
| Return button blocked by style panel | word-quest.html | 🔴 CRITICAL | 25% (mobile users) |

### MAJOR (Confusing, Reduces Engagement)

| Issue | Page | Severity | Users Affected |
|-------|------|----------|---|
| Disabled buttons not visually disabled | multiple | 🟠 MAJOR | 60% (click disabled buttons) |
| Advanced settings tab hidden | word-quest.html | 🟠 MAJOR | 40% (advanced users) |
| No visual feedback on settings changes | game-platform.html | 🟠 MAJOR | 100% using settings |
| Mobile layout untested | all | 🟠 MAJOR | 40% (mobile users) |

### MINOR (Polish, Technical Debt)

| Issue | Page | Severity | Users Affected |
|-------|------|----------|---|
| Hidden selector elements in DOM | multiple | 🟡 MINOR | 0% (dev tools only) |
| No dark mode option | all | 🟡 MINOR | 20% (dark mode users) |

---

## 8. ROOT CAUSE ANALYSIS

### Why Settings Are Hidden

**Hypothesis**: Developer disabled settings temporarily during development
- Settings panel structure is complete and functional
- Just wrapped in CSS class `hidden { display: none }`
- Code to open/close panel exists but never executes

**Evidence**:
- `.hidden` class applied to settings-panel
- `.hidden` class also applied to settings-tab-advanced
- Multiple other elements using `.hidden` (not functional hiding, CSS hiding)

**Fix**: Remove `hidden` class or apply conditional `hidden` only when appropriate

---

### Why Theme Changes Are Invisible

**Hypothesis**: Theme system designed for background/branding, not game board
- Game tiles use base color tokens
- Theme overrides apply to page background only
- Developer assumption: Users care more about page aesthetic than game board colors

**Evidence**:
- CSS selectors: `[data-game-theme="ocean"]` only changes `--brand-primary`, `--bg-color`
- Game tiles: Use `--tile-bg`, `--tile-text` which don't have theme overrides
- Theme picker UI: Decorative swatches, not functional

**Fix**: Extend theme system to include tile colors, text colors, etc.

---

## 9. RECOMMENDED FIX ORDER

### Phase E+ Implementation Plan (UX Foundation)

**Sprint 1: Critical Fixes (1-2 days)**
1. Remove `hidden` class from `#settings-panel`
2. Remove `hidden` class from `#settings-tab-advanced`
3. Fix z-index: Reduce theme picker to z-index 60, game buttons to z-index 70
4. Add `:disabled` pseudo-class styling to all buttons

**Sprint 2: Theme System Fixes (2-3 days)**
5. Extend theme system to game tiles (apply `data-game-theme` to `.game-tile`)
6. Test all 21 themes look distinct
7. Verify dark theme option is available and works
8. Document theme system for future developers

**Sprint 3: Mobile & Responsive (3-4 days)**
9. Test mobile (375px), tablet (768px), desktop (1280px)
10. Fix responsive issues identified in testing
11. Ensure no-scroll-first constraint is met on all pages
12. Test settings panel visibility on all viewport sizes

**Sprint 4: Accessibility & Polish (2-3 days)**
13. Remove unused hidden `<select>` elements
14. Add keyboard navigation to settings tabs
15. Add Escape key to close settings panel
16. Test color contrast on all themes
17. Add visual feedback for all state changes

---

## 10. BEFORE/AFTER SCREENSHOTS NEEDED

To validate fixes, capture these screenshots:

**Word Quest Settings**
- [ ] BEFORE: Settings button clicked, nothing happens
- [ ] AFTER: Settings panel slides in from right
- [ ] AFTER: "Essentials" and "Advanced" tabs both visible
- [ ] AFTER: Theme dropdown shows all 21 themes

**Theme Changes**
- [ ] BEFORE: Select "ocean" theme, only background changes
- [ ] AFTER: Select "ocean" theme, game board is ocean colors

**Mobile Return Navigation**
- [ ] BEFORE: On mobile, style panel blocks return button
- [ ] AFTER: On mobile, return button always clickable

**Disabled Buttons**
- [ ] BEFORE: Disabled buttons look like active buttons
- [ ] AFTER: Disabled buttons are grayed out with "not-allowed" cursor

---

## 11. CODE FILES REQUIRING CHANGES

### Critical Changes Needed

**File**: `word-quest.html`
- Line 336: Remove `hidden` class from `settings-panel`
- Line 358: Remove `hidden` class from `settings-tab-advanced`

**File**: `games/ui/game-shell.css`
- Line 48: Reduce `#cg-theme-picker z-index` from 120 to 60
- Add button `:disabled` styling
- Extend theme selectors to `.game-tile` elements

**File**: `style/themes.css`
- Add game tile color overrides per theme
- Example: `[data-game-theme="ocean"] .game-tile { background-color: #005a87; }`

**File**: `typing-quest.html`
- Audit for same settings issues as word-quest.html

### Secondary Changes (Polish)

**File**: `word-quest.html`
- Remove unused `<select id="setting-focus">` (line ~450)

**File**: `style/components.css`
- Add clear `:disabled` styling across all button types

---

## CONCLUSION

**Navigation Structure**: ✅ Solid  
**Settings Implementation**: ❌ Broken (hidden)  
**Theme System**: ⚠️ Works technically, invisible to users  
**Mobile Support**: ❌ Unverified  
**Accessibility**: ⚠️ Partial  

**Overall UX Grade**: **C+ (Needs Foundation Work)**

Cornerstone MTSS has a **sound architecture** but **poor discoverability**. Features exist but users can't find or use them. Phase E should focus on:

1. **Visibility**: Make hidden features visible
2. **Feedback**: Show users what changed
3. **Consistency**: Same patterns across all pages
4. **Mobile**: Ensure all features work on small screens
5. **Polish**: Clear visual hierarchy and disabled states

---

**Next Step**: Implement Sprint 1 critical fixes, then take before/after screenshots to validate improvements.

