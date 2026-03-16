# Color Palette Implementation — Grays, Orange, Neon Action Green

**Direction:** Mix grays + orange + neon action green into current blue palette

---

## Color Palette Definition

### Gray Scale (Sophistication & Balance)
```
--gray-50:  #f9fafb  (Very light, near-white)
--gray-100: #f3f4f6  (Light backgrounds)
--gray-200: #e5e7eb  (Subtle dividers)
--gray-300: #d1d5db  (Borders, disabled states)
--gray-400: #9ca3af  (Body text, secondary)
--gray-500: #6b7280  (Muted text)
--gray-600: #4b5563  (Primary text, headings)
--gray-700: #374151  (Strong text, accents)
--gray-800: #1f2937  (Dark text)
--gray-900: #111827  (Darkest)
```

### Orange Accent (Warm, Call-to-Action)
```
--orange-100: #fff7ed  (Very light background)
--orange-200: #fed7aa  (Hover states)
--orange-300: #fdba74  (Light accent)
--orange-400: #fb923c  (Primary orange)
--orange-500: #f97316  ← Main CTA Orange
--orange-600: #ea580c  (Darker orange)
--orange-700: #c2410c  (Darkest orange)
```

### Neon Action Green (High-Energy)
```
--green-100:  #f0fdf4  (Background)
--green-200:  #dcfce7  (Light accent)
--green-300:  #bbf7d0  (Medium green)
--green-400:  #86efac  (Bright green)
--green-500:  #22c55e  ← Primary Neon Green
--green-600:  #16a34a  (Darker green)
--green-700:  #15803d  (Darkest green)
--green-neon: #39ff14  ← Ultra-bright neon (for special highlights)
```

### Blue Base (Existing, Keep But Tone Down)
```
--blue-50:   #eff6ff  (Very light)
--blue-100:  #dbeafe  (Light)
--blue-200:  #bfdbfe  (Soft)
--blue-400:  #60a5fa  (Medium)
--blue-500:  #3b82f6  (Primary blue)
--blue-600:  #2563eb  (Darker blue)
--blue-700:  #1d4ed8  (Dark blue)
--blue-900:  #1e3a8a  (Very dark blue)
```

---

## Where Each Color Goes

### Game Platform Layout

```
┌─────────────────────────────────────────────────────┐
│ FLAGSHIP ROUTINES (Teal-Blue gradient background) │
│ Pick a routine. Start fast. (Gray-600 text)        │
├─────────────────────────────────────────────────────┤
│ ✅ READY IN ONE CLICK (Orange accent)              │
│ ✅ LESSON-LINKED (Green accent)                    │
│ ✅ SMALL-GROUP FRIENDLY (Gray accent)              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BEST NEXT MOVE (Green-gradient background)         │
│ Use one clear game for one clear purpose.           │
├─────────────────────────────────────────────────────┤
│ [Card with ORANGE accent stripe] [Card GREEN stripe] │
│ [Card with ORANGE accent stripe]                     │
│ [Card with GRAY accent stripe]                       │
└─────────────────────────────────────────────────────┘

│ GRADE  [Dropdown]    SUBJECT  [Dropdown]
└─────────────────────────────────────────────────────┘
```

### Specific Color Assignments

**Section Headers:**
- Background: Gradients (blue → teal, blue → green)
- Text: White (for contrast)
- Accent stripe: Orange (#f97316)

**Game Cards:**
- Background: Gradient (light blue → blue-100)
- Border: Gray-200 (#e5e7eb)
- Title: Gray-800 (#1f2937)
- Description: Gray-500 (#6b7280)
- Badge/Accent: Rotate through Orange / Green / Gray

**Badges (Sample/Description):**
```
[🟠 Orange] Warm, Featured game
[🟢 Green] Action, High-energy
[⚫ Gray] Neutral, Supporting
[⚫ Gray] Neutral, Supporting
```

**CTA Buttons:**
- "Open Game" button: Orange background, white text
- Hover: Darker orange (#ea580c)

**Interactive Elements:**
- Hover states: Light gray background (#f3f4f6)
- Focus states: Orange border (#f97316)
- Active states: Green background (#dcfce7)

---

## CSS Implementation Example

```css
/* Updated color tokens in tokens.css */
:root {
  /* Grays */
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;

  /* Orange */
  --orange-400: #fb923c;
  --orange-500: #f97316;
  --orange-600: #ea580c;

  /* Green (Neon) */
  --green-200: #dcfce7;
  --green-400: #86efac;
  --green-500: #22c55e;
  --green-600: #16a34a;
  --green-neon: #39ff14;

  /* Blue */
  --blue-100: #dbeafe;
  --blue-500: #3b82f6;
}

/* Game Card Styling */
.cg-game-card {
  background: linear-gradient(135deg, var(--blue-500), var(--blue-100));
  border: 1px solid var(--gray-200);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.cg-game-card h3 {
  color: var(--gray-800);
  font-size: 20px;
  font-weight: 600;
}

.cg-game-card p {
  color: var(--gray-500);
  font-size: 13px;
  line-height: 1.6;
}

/* Accent badges */
.cg-game-card[data-accent="orange"] {
  border-left: 4px solid var(--orange-500);
}

.cg-game-card[data-accent="green"] {
  border-left: 4px solid var(--green-500);
}

.cg-game-card[data-accent="gray"] {
  border-left: 4px solid var(--gray-400);
}

/* CTA Button */
.cg-btn-primary {
  background: var(--orange-500);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.cg-btn-primary:hover {
  background: var(--orange-600);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  transform: translateY(-2px);
}

/* Green Action (Premium/Feature highlight) */
.cg-action-green {
  background: var(--green-500);
  color: white;
}

.cg-action-green:hover {
  background: var(--green-600);
}

/* Neon Green (Special highlight) */
.cg-highlight-neon {
  color: var(--green-neon);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
}
```

---

## Visual Layout Example

### BEFORE (Very Blue, Very Boxy)
```
┌──────────────────────────────────┐
│ All dark blue, rectangular       │
│ [Blue Box] [Blue Box] [Blue Box] │
│ No color variation, no depth     │
└──────────────────────────────────┘
```

### AFTER (Grays, Orange, Green)
```
┌────────────────────────────────────┐
│ Blue-Teal gradient + Orange stripe │
│                                    │
│ [Card 🟠] [Card 🟢] [Card ⚫]      │
│ Orange    Green    Gray            │
│                                    │
│ [Neon] Green highlight text ✨     │
│                                    │
│ [Open Game] ← Orange CTA button   │
└────────────────────────────────────┘
```

---

## Color Usage Guide

| Element | Color | Reason |
|---------|-------|--------|
| Headings | Gray-800 | Legible, professional |
| Body text | Gray-500 | Soft, readable |
| Section headers | Blue gradient | Cohesive with existing brand |
| CTA buttons | Orange-500 | Stands out, warm, inviting |
| Active/featured | Green-500 | High-energy, action-oriented |
| Borders/dividers | Gray-200 | Subtle, sophisticated |
| Hover states | Orange-600 or Green-600 | Clear feedback |
| Special highlight | Green-neon | Premium, special treatment |

---

## Implementation Checklist

- [ ] Add color tokens to tokens.css
- [ ] Update .cg-game-card background to gradient
- [ ] Add accent stripes (border-left) per card
- [ ] Update text colors (headings → Gray-800, body → Gray-500)
- [ ] Update CTA button to Orange background
- [ ] Add hover state with color transition
- [ ] Test color contrast (WCAG AA: 4.5:1 for text)
- [ ] Screenshot and compare before/after

---

## Next Steps

**Implement Phase 2A (Colors) — Tomorrow 1-2 hours:**
1. Add color tokens to tokens.css
2. Update game-platform.html card styling
3. Apply orange to CTAs
4. Apply green to featured elements
5. Use grays for text and dividers
6. Screenshot showing color transformation

**Result:**
- Game platform jumps from "very blue" to "colorful & balanced"
- Orange CTA buttons draw attention
- Green highlights high-energy actions
- Grays add sophistication and readability
- Platform feels more premium and intentional

---

## Color Hex Reference

**Quick Copy-Paste:**
```
Grays:
#f3f4f6 (Light BG)
#e5e7eb (Borders)
#9ca3af (Disabled)
#6b7280 (Body text)
#374151 (Headings)

Orange:
#f97316 (Primary CTA)
#ea580c (Hover)

Green:
#22c55e (Action highlight)
#39ff14 (Neon special)

Blue (Existing):
#3b82f6 (Primary)
#dbeafe (Light gradient)
```

