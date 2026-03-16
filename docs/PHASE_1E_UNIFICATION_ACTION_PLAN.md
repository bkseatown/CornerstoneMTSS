# Phase 1E: Unified Game Controls — Action Plan

**User Request:** "I want this available throughout the platform"
**Reference:** Music (♪), themes (🎨), settings (⚙️) from Word Quest

**Status:** Ready to execute
**Estimated Work:** 12 hours (can do 3-4 today + remaining tomorrow)

---

## What "This" Means

### Currently Available (Word Quest Only)
```
✅ Music controls (♪) — Toggle background music on/off
   - Visual indicator when enabled
   - Persistent preference (localStorage)
   - Volume control

✅ Theme controls (🎨) — 23 theme variations
   - Compact picker shows color swatches
   - Each theme changes game appearance
   - Preference persists across sessions

✅ Settings (⚙️) — Game configuration
   - Sound effects toggle
   - Motion/animation preferences
   - Other game-specific settings

✅ Help button (?) — Quick support
   - Shows game rules/instructions
```

### Missing from Everything Else
```
❌ game-platform.html (gallery)
   ❌ No music
   ❌ Theme picker visible but needs work
   ❌ No settings access
   ❌ No help

❌ typing-quest.html
❌ precision-play.html
❌ writing-studio.html
❌ reading-lab.html
❌ session-runner.html
❌ paragraph-builder.html
❌ sentence-surgery.html
(7 other activities)

Result: Users experience feature loss when leaving Word Quest
```

---

## Solution Architecture

### Current (Siloed)
```
word-quest.html
├── Owns: Music button, theme picker, settings
├── CSS: wordquest-isolation.css (game-specific)
└── JS: js/word-quest.js (game-specific)

game-platform.html
├── Owns: Nothing (bare gallery)
└── No music, no rich settings

typing-quest.html
├── Owns: Nothing
└── Isolated from Word Quest experience
```

### Target (Unified)
```
games/ui/game-shell.js (SHARED)
├── GameShellControls.addMusicToggle(container)
├── GameShellControls.addThemeToggle(container)
├── GameShellControls.addSettingsButton(container)
├── GameShellControls.addHelpButton(container)
└── Music/theme state synced across all pages

Every game/activity
├── Inherits shared controls
├── Optional game-specific additions
├── Consistent UX everywhere
└── Music/theme preference persists
```

---

## Implementation Steps (Today + Tomorrow)

### Step 1: Extract Music Controls from Word Quest (TODAY — 1.5 hours)

**Location:** `js/word-quest.js` (find music-related code)

**What to Extract:**
1. Music toggle button logic (id="music-dock-toggle-btn")
2. Music state management (enabled/disabled)
3. Storage logic (localStorage for preference)
4. Audio playback control

**Code Pattern to Look For:**
```javascript
// In word-quest.js, find:
document.getElementById('music-dock-toggle-btn').addEventListener('click', function() {
  // Toggle music state
  // Update UI
  // Save to localStorage
})
```

**Create:** `games/ui/game-shell-music.js` with:
```javascript
GameShellMusic = {
  STORAGE_KEY: 'cs.game.music.enabled',
  
  init: function(toggleButtonSelector) {
    // Copy music toggle logic here
    // Make it work with any game
  },
  
  setEnabled: function(enabled) {
    // Control music playback
    // Update UI
    // Save preference
  },
  
  isEnabled: function() {
    // Return current state
  }
}
```

**Test:** Word Quest still works with music on/off

---

### Step 2: Create Shared Controls API in game-shell.js (TODAY — 1 hour)

**File:** `games/ui/game-shell.js`

**Add Function:**
```javascript
GameShellControls = {
  addMusicToggle: function(container) {
    // Uses GameShellMusic.init()
    // Returns button element for positioning
  },
  
  addThemeToggle: function(container) {
    // Already exists, may need adaptation
    // Uses existing theme picker logic
  },
  
  addSettingsButton: function(container) {
    // Creates generic settings button
    // Emit events that each game can listen to
  },
  
  addHelpButton: function(container) {
    // Creates help button
    // Links to game-specific help
  }
}
```

**Usage:**
```javascript
// In any game HTML/JS:
var controlsContainer = document.getElementById('game-header-controls');
GameShellControls.addMusicToggle(controlsContainer);
GameShellControls.addThemeToggle(controlsContainer);
GameShellControls.addSettingsButton(controlsContainer);
```

---

### Step 3: Add Header to game-platform.html (TODAY — 30 min)

**File:** `game-platform.html`

**Current HTML:**
```html
<main class="cg-shell">
  <div id="cg-shell"></div>
</main>
```

**Add Above <main>:**
```html
<header class="game-platform-header">
  <div class="header-left">
    <h1>Cornerstone MTSS</h1>
  </div>
  <div id="game-platform-controls" class="header-controls"></div>
</header>
```

**Add Initialization Script:**
```javascript
// After game-shell.js loads:
var controlsContainer = document.getElementById('game-platform-controls');
if (GameShellControls) {
  GameShellControls.addMusicToggle(controlsContainer);
  GameShellControls.addThemeToggle(controlsContainer);
  GameShellControls.addHelpButton(controlsContainer);
}
```

**Test:**
- [ ] Music button appears in top-right
- [ ] Theme picker shows theme swatches
- [ ] Help button works
- [ ] Music persists when switching between games

---

### Step 4: Update Word Quest (TOMORROW — 1 hour)

**File:** `word-quest.html`

**Goal:** Use shared API instead of hardcoded controls

**Remove from HTML:**
- Old music button (id="music-dock-toggle-btn")
- Old theme button (id="theme-dock-toggle-btn")

**Add to Header:**
```html
<div id="wq-controls" class="header-icon-controls"></div>
```

**Update JS to use shared API:**
```javascript
// Instead of building own controls:
var controlsContainer = document.getElementById('wq-controls');
GameShellControls.addMusicToggle(controlsContainer);
GameShellControls.addThemeToggle(controlsContainer);
GameShellControls.addSettingsButton(controlsContainer);
```

**Test:**
- [ ] Word Quest still works exactly the same
- [ ] Music on/off still works
- [ ] Themes still change colors
- [ ] Settings panel still opens

---

### Step 5: Add to Other Activities (TOMORROW — 6-8 hours)

**For Each of These Files:**
1. `typing-quest.html`
2. `precision-play.html`
3. `writing-studio.html`
4. `reading-lab.html`
5. `session-runner.html`
6. `paragraph-builder.html`
7. `sentence-surgery.html`
(+3 more if they exist)

**Changes (same for each):**

1. Add header element if missing:
```html
<header class="activity-header">
  <div id="activity-controls" class="header-controls"></div>
</header>
```

2. Add initialization:
```javascript
<script src="./games/ui/game-shell.js"></script>
<script>
  var controlsContainer = document.getElementById('activity-controls');
  if (GameShellControls) {
    GameShellControls.addMusicToggle(controlsContainer);
    GameShellControls.addThemeToggle(controlsContainer);
  }
</script>
```

3. Test: Music + themes work on each activity

---

### Step 6: CSS Unification (TOMORROW — 1.5 hours)

**Create:** `games/ui/game-shell-controls.css`

**Add Styles:**
```css
.game-shell-controls {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
}

.game-control-btn {
  --size: 44px;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--surface-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-control-btn:hover {
  background: var(--surface-3);
  border-color: var(--primary);
  transform: scale(1.05);
}

/* Music specific */
.game-music-btn.is-enabled {
  background: var(--success);
  color: white;
}

/* Theme picker */
.game-theme-picker {
  position: fixed;
  top: 60px;
  right: 14px;
  z-index: 1000;
  /* ... rest of style ... */
}
```

**Update:** game-platform.html header CSS
**Result:** Consistent control appearance everywhere

---

## Validation Checklist

### Functional Tests
- [ ] Word Quest: Music works (on/off toggle persists)
- [ ] Word Quest: Themes work (all 23 change appearance)
- [ ] Game Platform: Music button appears, plays/stops music
- [ ] Game Platform: Theme picker shows swatches
- [ ] Typing Quest: Music works
- [ ] Typing Quest: Themes work
- [ ] (Repeat for all 7+ activities)

### UX Tests
- [ ] Controls visible on all pages
- [ ] No layout conflicts with existing UI
- [ ] Music preference persists when switching pages
- [ ] Theme preference persists across entire session
- [ ] Controls have consistent styling/positioning
- [ ] Responsive at 375px (mobile), 768px (tablet), 1440px (desktop)

### Code Quality
- [ ] No hardcoded music logic in individual game files
- [ ] All games use shared GameShellControls API
- [ ] CSS uses design tokens (no hardcoded colors)
- [ ] File sizes remain reasonable

---

## Timeline & Effort

| Step | Task | Time | Done? |
|------|------|------|-------|
| 1 | Extract music from Word Quest | 1.5 hrs | ⏳ TODAY |
| 2 | Create GameShellControls API | 1 hr | ⏳ TODAY |
| 3 | Add header to game-platform.html | 0.5 hrs | ⏳ TODAY |
| 4 | Update Word Quest | 1 hr | ⏳ TOMORROW |
| 5 | Propagate to 10 activities | 6-8 hrs | ⏳ TOMORROW |
| 6 | CSS consolidation | 1.5 hrs | ⏳ TOMORROW |
| **TOTAL** | **Unified controls throughout** | **12 hrs** | **Week 1** |

---

## Success Metrics

**Before (Today):**
- Word Quest: Premium (has music, themes, settings)
- Game Platform: Bare (no music, limited themes)
- 9 other activities: Inconsistent (mixed features)
- **User Experience:** Fragmented, feature loss when leaving Word Quest

**After (Tomorrow):**
- ✅ Word Quest: Premium (using shared API)
- ✅ Game Platform: Premium (music, themes, help)
- ✅ 9 other activities: Premium (consistent controls)
- ✅ Music preference persists across ALL pages
- ✅ Theme preference persists across ALL pages
- **User Experience:** Unified, professional, consistent

**Outcome:**
- All pages feel premium
- User feels continuity across platform
- Portfolio-ready UX consistency
- "Games look dull" → "Games look polished" ✨

---

## Blockers & Risks

### Risk: Audio Context Issues
**Problem:** Web Audio API may require user interaction to start playback
**Solution:** Music autoplay not needed; toggle button starts music on-demand

### Risk: Theme CSS Conflicts
**Problem:** Some games might have different theme variable names
**Solution:** Use consistent token names (game-shell.js ensures this)

### Risk: localStorage Conflicts
**Problem:** Multiple games writing to same key
**Solution:** Use namespaced key: `cs.game.music.enabled`, `cs.game.theme`

### Risk: File Size Overages
**Problem:** Adding more code might exceed file limits
**Solution:** Extract to separate files (game-shell-music.js, game-shell-controls.css)

---

## Next Steps (Immediate)

1. **NOW:** Review this plan with user
2. **In 15 min:** Start Step 1 (extract music from Word Quest)
3. **In 2.5 hours:** Complete Steps 1-3 (day 1 work)
4. **Tomorrow:** Complete Steps 4-6 (day 2 work)
5. **Test:** Verify all 20+ pages have working music/theme controls
6. **Celebrate:** "Unified platform with consistent premium UX" ✨

---

## Questions Before Starting?

- Confirm music/theme extraction approach?
- Approve shared API design?
- Priority: Get music working first, or parallel with theme?

Ready to proceed: **YES** / **Adjust plan first**

