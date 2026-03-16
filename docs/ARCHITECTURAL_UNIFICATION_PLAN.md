# Architectural Unification Plan — Unified Game Shell

**Issue:** Game controls are siloed in Word Quest; other games/activities lack music, theme, and settings access.

**User Feedback:**
> "I thought themes and music from word quest would also be available throughout the app"

This reveals the core architectural problem: **Word Quest is a premium experience with full controls, while the shared game shell (game-platform.html and other activities) is a bare-bones gallery.**

---

## Current State: Fragmented Architecture

### Word Quest (wordquest-only experience)
```
Header with:
  ✅ Music controls (♪) — music-dock-toggle-btn
  ✅ Theme controls (🎨) — theme-dock-toggle-btn
  ✅ Settings (⚙️) — settings-btn
  ✅ Help (?) — focus-help-btn
  ✅ Quest finder (search) — focus-inline-search
  ✅ Case toggle (Aa) — case-toggle-btn
  ✅ Keyboard layout toggle — keyboard-layout-toggle
  ✅ Teacher panel (👩‍🏫) — teacher-panel-btn
```

**CSS Support:** Massive header styling in `wordquest-isolation.css` (dedicated to Word Quest experience)

**JS Support:** Full header logic in `js/word-quest.js`

---

### Game Platform Gallery (game-platform.html)
```
No header at all. Has only:
  ✅ Theme picker (inline dropdown)
  ❌ No music controls
  ❌ No settings
  ❌ No help system
  ❌ No search
```

**Result:** Games look "dull" because they lack the interactive control suite. Users feel disconnected from the Word Quest experience.

---

## Solution: Unified Game Control Shell

**All games inherit shared control set:**
```
Header with:
  ✅ Logo/Back button
  ✅ Game title (center)
  ✅ Quick controls (right):
    - Help (?)
    - Music (♪) + music strip
    - Theme (🎨) + theme picker
    - Settings (⚙️)
    - Teacher/Admin toggle (👩‍🏫)
```

---

## Implementation Priority

### Phase 1E: Extract Shared Controls (3-4 hours)
1. Extract music button logic from Word Quest
2. Create GameShellControls API in games/ui/game-shell.js
3. Test in Word Quest (no visual regression)
4. Add to game-platform.html

### Phase 2: Propagate to All Activities (8 hours)
- typing-quest.html
- precision-play.html
- writing-studio.html
- reading-lab.html
- session-runner.html
- paragraph-builder.html
- sentence-surgery.html

### Phase 3: CSS Consolidation (2-3 hours)
- Extract game header styles from wordquest-isolation.css
- Create shared game-header.css component
- Ensure theme/music persist across pages

---

## Why This Matters

**User feedback:** "The games look dull" + "themes and music should be everywhere"

**Root cause:** Word Quest has visual polish (music, themes, help, search) while other games are bare galleries.

**Impact:** Platform feels disjointed. Users experience sudden feature loss when they leave Word Quest.

**Solution:** Lift shared controls into the game shell, making all activities feel premium.

**Portfolio impact:** Unification signals professional architecture and thoughtful UX.

**Estimated work:** 12 hours for complete unification

