# Reveal Modal & Modal UI Restoration Plan

> Historical planning doc: use for background context only. Do not treat this file as the current source of truth. Start with `README.md`, `QUICK_START.md`, and `docs/PROJECT_STATUS.md`.

**Status**: Ready for Week 2 Polish Phase
**Priority**: CRITICAL - Current reveal experience is a significant regression
**Estimated Time**: 4-5 hours
**Target**: Restore celebratory, educational reveal flow with proper modal positioning

---

## Executive Summary

The current reveal modal experience is a **regression** from the previous version. Key celebrations and educational elements have been lost:

❌ **Missing**: Confetti animation
❌ **Missing**: Fun reveal card animations with variety
❌ **Missing**: Phonics rule display
❌ **Missing**: Ava narration with prosody
❌ **Missing**: Proper modal positioning (covers game board)
❌ **Missing**: Ability to click out of modal
❌ **Added (unwanted)**: "Round Readout" and "Next Move" sections

✅ **What's New**: Keyboard navigation (spacebar, escape) - excellent additions

---

## Part 1: Reveal Modal Content & Animations

### Current State (Regression)
```
┌─────────────────────────────┐
│  [ROUND READOUT] (empty)    │
│  [NEXT MOVE] (empty)        │
│  🔊 Word  📚 Meaning        │
│  [Play Again →]             │
└─────────────────────────────┘
```

### Target State (Restored)
```
[CONFETTI RAIN ANIMATION]

┌─────────────────────────────┐
│    [Reveal Card Animation]  │
│         G R A S S           │  ← All green letters
│     (phonics rule here)     │  ← "Short vowel pattern"
│                             │
│  🔊 [Hear Word]             │
│  📚 [Hear Definition]       │
│  [Play Again] or [click me] │
└─────────────────────────────┘

[Ava reading word with prosody + definition with prosody plays]
```

### Implementation Details

#### 1. Confetti Animation (30 minutes)
**Location**: Trigger when word is correct (game state = gameOver && !hint)

```javascript
function playConfettiAnimation() {
  // Confetti parameters:
  // - Duration: 2-3 seconds
  // - Colors: Match game theme accent colors
  // - Density: Medium (not overwhelming)
  // - Direction: Top-to-bottom rain effect
  // - Physics: Slight horizontal drift, gravity

  // Use existing confetti library or CSS animation
  // Consider: https://www.npmjs.com/package/canvas-confetti
}
```

**CSS Alternative** (if avoiding external lib):
- CSS keyframes animation
- Radial gradient pseudo-elements
- Staggered animation timing

#### 2. Reveal Card Animation (45 minutes)
**Location**: Show reveal modal with animation

**Multiple Animation Styles** (cycle through for variety):

**Style A: Flip Reveal**
```
Card starts face-down, flips with 3D rotation to reveal:
- Word (green letters)
- Phonics rule
- Audio buttons
```

**Style B: Slide & Fade**
```
Card slides up from bottom while fading in
Content appears in sequence (word → phonics rule → buttons)
```

**Style C: Scale Bloom**
```
Card starts small (0.8x) at center, scales to 1.0x with spring easing
Feels celebratory and growth-oriented
```

**Style D: Swipe Reveal**
```
Vertical swipe animation reveals content top-to-bottom
Content "wipes in" sequentially
```

**Implementation**:
```javascript
const REVEAL_ANIMATIONS = ['flip', 'slide-fade', 'scale-bloom', 'swipe'];
let nextAnimationIndex = 0;

function showRevealCard(animationStyle) {
  const modal = _el('end-modal');
  const style = animationStyle || REVEAL_ANIMATIONS[nextAnimationIndex];
  nextAnimationIndex = (nextAnimationIndex + 1) % REVEAL_ANIMATIONS.length;

  modal.classList.add(`reveal-${style}`);
  modal.classList.remove('hidden');
}
```

**CSS Animations** (examples):
```css
#end-modal.reveal-flip {
  animation: revealFlip 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  perspective: 1000px;
}

@keyframes revealFlip {
  0% { transform: rotateY(90deg); opacity: 0; }
  100% { transform: rotateY(0deg); opacity: 1; }
}

#end-modal.reveal-scale-bloom {
  animation: revealBloom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes revealBloom {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

#### 3. Phonics Rule Display (20 minutes)
**Location**: Below word in reveal modal

```html
<div id="modal-word"></div>           <!-- "GRASS" in green -->
<div id="modal-phonics-rule"></div>   <!-- "Short vowel + double consonant" -->
```

**Content Rules**:
- Display the linguistic pattern: e.g., "Short vowel pattern", "Consonant blend", "Silent E rule"
- Source: From word metadata (already in WQData)
- Font: Smaller than word, muted color (#5a7d8f or var(--text-secondary))
- Styling: Italic, centered

**Implementation**:
```javascript
function displayPhonicsRule(word, entry) {
  const ruleEl = _el('modal-phonics-rule');
  const rule = entry?.phonicsPattern || entry?.rule || '';

  if (ruleEl && rule) {
    ruleEl.textContent = rule;
    ruleEl.classList.remove('hidden');
  }
}
```

#### 4. Ava Narration with Prosody (1 hour)
**Location**: Auto-play after reveal animation (or on demand)

**Current State**: Likely using standard text-to-speech
**Target State**: Ava with prosody (natural pacing, intonation, emphasis)

**Implementation**:
```javascript
function playRevealNarration(word, definition) {
  // Use WQAudio.playWord() with prosody settings
  // Then play definition with prosody

  const wordAudio = WQAudio.playWord(word, {
    rate: 0.95,           // Slightly slower for emphasis
    pitch: 1.0,
    prosody: true,        // Enable prosodic features
    emphasis: 'strong'    // Emphasize the word
  });

  // After word finishes, play definition
  wordAudio.onended = () => {
    WQAudio.playDefinition(definition, {
      rate: 1.0,
      prosody: true,
      naturalPacing: true  // Use natural sentence pacing
    });
  };
}
```

**Prosody Features**:
- **Emphasis**: Word pronounced with natural stress
- **Pacing**: Definition read at conversational speed (not rushed)
- **Intonation**: Natural rise/fall for sentence structure
- **Pause**: Breath pause before definition

**Optional Enhancement**: Show animated "Ava is speaking" indicator (waveform, lips, etc.)

---

## Part 2: Modal Positioning & Layout

### Current Problem
- Modal covers game board completely
- Takes up full screen
- No context for what was just completed
- Blocks view of GRASS in the grid

### Target: Responsive Modal Positioning

#### Mobile/Narrow View (<768px)
```
┌──────────────────┐
│   Game Board     │
│   (visible)      │
│   G R A S S      │
│                  │
├──────────────────┤  ← Modal appears ABOVE board
│ [Reveal Card]    │
│ G R A S S        │
│ (phonics rule)   │
│ [Buttons]        │
└──────────────────┘
```

**Implementation**:
```css
@media (max-width: 767px) {
  #modal-overlay {
    /* Allow board to be visible above modal */
    display: flex;
    flex-direction: column-reverse; /* Modal at bottom */
  }

  #end-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
    overflow-y: auto;
    border-radius: 20px 20px 0 0;
    width: 100%;
  }
}
```

#### Desktop/Wide View (≥768px)
```
┌─────────────────┬──────────────────┐
│                 │  [Reveal Card]   │
│  Game Board     │  G R A S S       │
│  G R A S S      │  (phonics rule)  │
│                 │  [Buttons]       │
│                 │                  │
└─────────────────┴──────────────────┘
```

**Implementation**:
```css
@media (min-width: 768px) {
  #modal-overlay {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 20px;
    padding: 20px;
  }

  #end-modal {
    position: relative;
    width: 400px;
    max-height: none;
    /* Side-by-side with game board */
  }
}
```

### Modal Styling
```css
#end-modal {
  background: var(--panel-bg); /* Light panel color */
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  font-family: var(--font);
  color: var(--text-primary);
}

#modal-word {
  font-size: 3rem;
  font-weight: 900;
  color: var(--success-green, #22c55e);
  text-align: center;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

#modal-phonics-rule {
  font-size: 1rem;
  color: var(--text-secondary, #5a7d8f);
  font-style: italic;
  text-align: center;
  margin-bottom: 24px;
}
```

### Click-Out Functionality
```javascript
document.addEventListener('click', (e) => {
  const modal = _el('end-modal');
  if (!modal || modal.classList.contains('hidden')) return;

  // Close if clicking outside modal (on overlay)
  if (e.target === _el('modal-overlay')) {
    _el('new-game-btn')?.click(); // Advance to next game
  }
});
```

---

## Part 3: Quest Help Modal Improvements

### Current Problem
- Full-screen modal
- Large block of text
- Covers game board
- Feels overwhelming on first interaction

### Target: Friendly, Concise Card

#### Mobile View
```
┌──────────────────┐
│  Game Board      │
├──────────────────┤
│ Need help?       │
│ 💡 Clue Card     │
│ ✨ Suggestion    │
│ [No thanks]      │
└──────────────────┘
```

#### Desktop View
```
┌─────────────────┬──────────┐
│                 │ Need     │
│  Game Board     │ help?    │
│                 │ 💡 Clue  │
│                 │ ✨ Sugg  │
│                 │ No thks  │
└─────────────────┴──────────┘
```

**Implementation**:
```html
<div id="quest-help-modal" class="quest-help-card hidden" role="dialog">
  <h3>Need help?</h3>
  <button class="quest-help-option">💡 Get a clue</button>
  <button class="quest-help-option">✨ Get a hint</button>
  <button class="quest-help-option">No thanks</button>
</div>
```

**CSS**:
```css
.quest-help-card {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 16px;
  font-size: 0.9rem;
  max-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quest-help-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  transition: background 0.2s;
}

.quest-help-option:hover {
  background: var(--accent-light, rgba(34, 197, 94, 0.1));
}
```

---

## Timeline & Effort Breakdown

| Task | Time | Difficulty |
|------|------|-----------|
| Confetti animation | 30 min | Low |
| Reveal card animations (4 styles) | 45 min | Medium |
| Phonics rule display | 20 min | Low |
| Ava narration with prosody | 1 hour | Medium |
| Modal positioning (mobile/desktop) | 1 hour | Medium |
| Quest Help redesign | 30 min | Low |
| Testing all flows | 1 hour | Medium |
| **TOTAL** | **~4.5 hours** | — |

---

## Testing Checklist

### Reveal Modal
- [ ] Confetti plays for 2-3 seconds
- [ ] Reveal animation alternates between styles
- [ ] Word displays in green letters
- [ ] Phonics rule displays below word
- [ ] Ava reads word with natural prosody
- [ ] Definition reads with natural pacing
- [ ] Hear Word button works
- [ ] Hear Definition button works
- [ ] Spacebar advances to next game
- [ ] Escape advances to next game
- [ ] Click outside modal advances to next game
- [ ] Modal positioned above board on mobile
- [ ] Modal positioned to side on desktop
- [ ] No board coverage on any viewport

### Quest Help Modal
- [ ] Modal appears on first guess/hint
- [ ] Concise, friendly text
- [ ] Positioned above (mobile) or side (desktop)
- [ ] Doesn't cover game board
- [ ] All buttons functional
- [ ] Closes without clicking

---

## Files to Modify

1. **js/app.js**
   - Add confetti animation function
   - Add reveal card animation logic with cycling
   - Wire Ava narration to reveal modal
   - Update modal positioning logic
   - Update Quest Help modal display

2. **style/components.css** or new **style/reveal-modal.css**
   - Confetti keyframes
   - Reveal animation styles
   - Modal positioning (flex/grid)
   - Responsive breakpoints

3. **word-quest.html**
   - Update modal HTML structure (if needed)
   - Remove unnecessary "Round Readout" / "Next Move" sections

---

## Success Criteria

✅ Reveal experience feels **celebratory** (confetti + animations)
✅ Reveal experience is **educational** (phonics rule + prosodic narration)
✅ Modal **doesn't cover game board** (positioned above/side)
✅ Modal is **compact and friendly** (not a wall of text)
✅ All **keyboard shortcuts work** (spacebar, escape, click-out)
✅ **Responsive on all devices** (mobile, tablet, desktop)

---

## Notes

- This restoration brings the reveal experience from a **regression (6/10)** back to **professional (9.5/10)**
- The confetti and animations are key to making Word Quest feel like a **celebration of learning**
- Phonics display reinforces the educational mission
- Ava's prosody makes narration sound **human and encouraging**
- Proper modal positioning respects the game board as the **primary focus**

**Priority**: This is **more important than** additional polish features. Restore these core elements first.
