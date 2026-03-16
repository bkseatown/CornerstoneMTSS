# Accessibility Variants Integration Guide

## Phase 5 Complete: Dyslexia, High Contrast, Color Blind, Low Vision Modes

### Quick Start (5 minutes)

Add to your HTML `<head>`:

```html
<!-- A11y stylesheets -->
<link rel="stylesheet" href="/style/a11y-dyslexia.css">
<link rel="stylesheet" href="/style/a11y-high-contrast.css">
<link rel="stylesheet" href="/style/a11y-color-blind.css">
<link rel="stylesheet" href="/style/a11y-low-vision.css">
<link rel="stylesheet" href="/style/a11y-controls.css">

<!-- A11y JavaScript -->
<script src="/js/settings/a11y-settings.js"></script>
<script src="/js/settings/a11y-controls.js"></script>
```

Add to your HTML `<body>` (typically in header or settings area):

```html
<!-- Accessibility controls panel -->
<div id="a11y-panel"></div>

<script>
  // Render accessibility controls on page load
  document.addEventListener('DOMContentLoaded', () => {
    A11yControls.render('#a11y-panel');
  });
</script>
```

**That's it.** Settings will persist across sessions via localStorage.

---

## Modes Explained

### 1. **Dyslexia-Friendly Mode**
- **Font:** OpenDyslexia (research-backed)
- **Spacing:** Increased letter & word spacing (0.15em, 0.2em)
- **Line Height:** 1.8 (much more relaxed)
- **Background:** Warm off-white (#fffbf0) instead of harsh white
- **Best For:** Students with dyslexia or reading fluency issues

**CSS:** `style/a11y-dyslexia.css`

### 2. **High Contrast Mode**
- **Colors:** Black text on white background (7:1+ WCAG AAA contrast)
- **Borders:** All elements get 2-3px borders for clarity
- **Removal:** Shadows, gradients, decorative elements
- **Status:** Uses symbols (✓, ◐, ✗) + color for redundancy
- **Best For:** Low vision users, general readability

**CSS:** `style/a11y-high-contrast.css`

### 3. **Color Blind Modes**
Three specific types supported:
- **Deuteranopia** (red-green, ~1% of men): Uses blue, orange, purple palette
- **Protanopia** (red-green, ~0.5% of men): Similar with adjusted hues
- **Tritanopia** (blue-yellow, ~0.001%): Uses red, green, orange palette

**Feature:** Adds symbols + text labels to all status indicators
- ✓ = success/correct
- ◐ = developing/warning
- ✗ = error/alert

**CSS:** `style/a11y-color-blind.css`

### 4. **Low Vision Mode**
- **Font Scaling:** Respects `--a11y-font-scale` variable (1.0 = 100%, 2.0 = 200%)
- **Touch Targets:** Minimum 44px × 44px
- **Spacing:** Increased margins/padding throughout
- **Focus Indicators:** Large, clear outlines
- **Line Height:** 1.8 for readability

**CSS:** `style/a11y-low-vision.css`

---

## Architecture

### JavaScript Files

**`js/settings/a11y-settings.js`**
- Manages accessibility settings (mode, font scale, color blind type)
- Persists to localStorage
- Emits change events

**Methods:**
```javascript
A11ySettings.setMode('dyslexia');           // Set mode
A11ySettings.setFontScale(1.5);             // Set font scale (1.0-2.0)
A11ySettings.setColorBlindType('deuteranopia'); // Set color blind filter
A11ySettings.getSettings();                 // Get current settings
A11ySettings.increaseFontSize();            // Increase by 0.25x
A11ySettings.decreaseFontSize();            // Decrease by 0.25x
A11ySettings.reset();                       // Reset to defaults
```

**`js/settings/a11y-controls.js`**
- Renders UI controls for accessibility settings
- Attaches event listeners
- Updates display on settings change

**Methods:**
```javascript
A11yControls.render('#container-id');       // Render controls panel
A11yControls.updateDisplay();               // Update UI to reflect current settings
```

### CSS Files

All CSS uses data attributes for mode selection:
- `[data-a11y="dyslexia"]` for dyslexia mode
- `[data-a11y="high-contrast"]` for high contrast
- `[data-a11y="low-vision"]` for low vision
- `[data-color-blind="deuteranopia"]` for color blind filters

CSS custom properties available:
```css
--a11y-font-scale        /* 1.0 - 2.0, set by JS */
--letter-spacing-dyslexia
--word-spacing-dyslexia
--line-height-dyslexia
--bg-warmth
```

---

## Integration Points

### 1. **Game Shells**
Add to `games/ui/game-shell.js`:
```javascript
// On page load
document.addEventListener('DOMContentLoaded', () => {
  A11ySettings.init();
  A11yControls.render('#a11y-panel-container');
});
```

### 2. **Teacher Hub / Reports**
In header or navigation:
```html
<div id="a11y-control-area"></div>
<script>
  A11yControls.render('#a11y-control-area', {position: 'sidebar'});
</script>
```

### 3. **Settings Page**
Create dedicated accessibility section:
```html
<section class="settings-section">
  <h2>Accessibility</h2>
  <div id="a11y-settings-full"></div>
</section>

<script>
  A11yControls.render('#a11y-settings-full');
</script>
```

### 4. **Mobile Considerations**
CSS is responsive. On mobile (`< 480px`), controls panel goes full-screen.

---

## Testing Checklist

### Dyslexia Mode
- [ ] OpenDyslexia font loads (check network tab)
- [ ] Letter spacing increases to 0.15em
- [ ] Word spacing increases to 0.2em
- [ ] Background is warm off-white (#fffbf0)
- [ ] Reading speed improves for dyslexic students (informal observation)

### High Contrast Mode
- [ ] Text is black on white (RGB: 0,0,0 on 255,255,255)
- [ ] All borders are 2-3px
- [ ] No shadows or gradients visible
- [ ] Contrast ratio >= 7:1 (WCAG AAA)
- [ ] Focus indicators are clear and large
- [ ] Test with: WebAIM Contrast Checker

### Color Blind Mode
- [ ] Deuteranopia: Uses blue (#0173b2), orange (#de8f05), purple (#cc78bc)
- [ ] Protanopia: Uses darker blue (#005f8e), warm orange (#e67f0d), purple
- [ ] Tritanopia: Uses green (#00a651), red (#d62828), orange (#f77f00)
- [ ] Symbols appear (✓, ◐, ✗) before status text
- [ ] Test with: ColorBrewer, CBSim simulator

### Low Vision Mode
- [ ] Font scales: 100% → 200%
- [ ] All buttons >= 44px × 44px
- [ ] Touch targets have 44px minimum
- [ ] Focus outlines are 4px + offset
- [ ] Line height >= 1.8
- [ ] No information conveyed by color alone

---

## Advanced Customization

### Change Default Mode
In `a11y-settings.js`, update the initial setup:
```javascript
const DEFAULT_MODE = 'dyslexia'; // Change this
```

### Add Custom Color Blind Palette
In `a11y-color-blind.css`, add new selector:
```css
[data-color-blind="custom-type"] {
  --status-secure: #your-color;
  --status-developing: #your-color;
  --status-intensify: #your-color;
}
```

Then update controls in `a11y-controls.js`:
```javascript
<button class="a11y-cb-btn" data-type="custom-type">Custom Type</button>
```

### Adjust Font Scaling Range
In `a11y-settings.js`:
```javascript
const clampedScale = Math.max(0.8, Math.min(3.0, scale)); // Change bounds
```

### Add More Modes
1. Create new CSS file: `style/a11y-mymode.css`
2. Use data attribute: `[data-a11y="mymode"]`
3. Add button to controls in `a11y-controls.js`
4. Update validation in `a11y-settings.js`:
   ```javascript
   const validModes = ['default', 'dyslexia', 'high-contrast', 'low-vision', 'mymode'];
   ```

---

## Keyboard Shortcuts

- **Alt + A** (Windows) or **Ctrl + A** (Mac): Toggle accessibility panel visibility
- **Tab**: Navigate through controls
- **Space/Enter**: Activate buttons

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Variables | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |
| OpenDyslexia Font | ✅ | ✅ | ✅ | ✅ |
| CSS color-mix() | ✅ 111+ | ✅ 130+ | ✅ 16.4+ | ✅ 111+ |

**Fallback:** If `color-mix()` not supported, use `rgba()` or solid colors instead.

---

## Performance Notes

- JavaScript: ~8KB (a11y-settings.js + a11y-controls.js)
- CSS: ~15KB total (all 4 files + controls)
- Font: OpenDyslexia ~15KB (loaded on demand via Google Fonts)
- **localStorage:** ~500 bytes per user

**Impact:** Negligible on page load. Settings apply instantly on page init.

---

## Accessibility of the Accessibility Controls

The controls themselves are accessible:
- ✅ Semantic HTML (`<label>`, `<button>`, roles)
- ✅ WCAG AA compliant (4.5:1 contrast)
- ✅ Keyboard navigable
- ✅ Screen reader support (ARIA labels)
- ✅ Touch friendly (44px+ touch targets)
- ✅ Reduced motion support

---

## Troubleshooting

**Settings not persisting?**
- Check browser localStorage is enabled
- Check STORAGE_KEY matches in both files: `'cornerstone-a11y-mode'`

**Font not loading?**
- Check Google Fonts CDN: `fonts.googleapis.com`
- Falls back to monospace if unavailable

**Colors look wrong in color blind mode?**
- Verify browser is modern (Chrome 111+, Firefox 130+, Safari 16.4+)
- `color-mix()` is required; older browsers won't have correct colors

**Controls not showing?**
- Verify both JS files are loaded
- Check console for errors
- Verify container element exists: `<div id="a11y-panel"></div>`

---

## Future Enhancements

1. **AI-Recommended Mode:** Suggest mode based on student performance patterns
2. **Voice Control:** "Turn on dyslexia mode" via voice
3. **Parent Communication:** Email parent a report of accessibility settings used
4. **Data Tracking:** Which modes are most used, by which grade levels
5. **Quick Presets:** "ADHD-Friendly" (reduced animations + high contrast)
6. **Font Family Options:** Not just OpenDyslexia (Atkinson Hyperlegible, Comic Sans, etc.)

---

## Resources

- [Dyslexia-Friendly Resources](http://www.dyslexiafont.com/)
- [WCAG AA Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ColorBrewer](https://colorbrewer2.org/) (color blind palettes)
- [CBSim - Color Blind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [MDN: WCAG Compliance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/WCAG_overview)
