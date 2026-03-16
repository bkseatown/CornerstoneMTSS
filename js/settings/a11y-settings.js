/**
 * a11y-settings.js
 * Accessibility settings management
 * Non-negotiable for intervention educators working with diverse learners
 */

const A11ySettings = (() => {
  const STORAGE_KEY = 'cornerstone-a11y-mode';
  const STORAGE_FONT_SIZE = 'cornerstone-font-scale';
  const STORAGE_COLOR_BLIND = 'cornerstone-color-blind-type';

  let currentMode = 'default';
  let fontScale = 1.0; // 1 = normal, 1.25 = 25% larger, 1.5 = 50% larger, etc.
  let colorBlindType = null; // null, 'deuteranopia', 'protanopia', 'tritanopia'

  /**
   * Initialize accessibility settings from stored preferences
   */
  function init() {
    const stored = localStorage.getItem(STORAGE_KEY) || 'default';
    const storedFontScale = localStorage.getItem(STORAGE_FONT_SIZE) || '1.0';
    const storedColorBlind = localStorage.getItem(STORAGE_COLOR_BLIND) || null;

    setMode(stored);
    setFontScale(parseFloat(storedFontScale));
    if (storedColorBlind) setColorBlindType(storedColorBlind);

    console.log(`🎯 A11y Settings initialized: mode=${stored}, fontScale=${fontScale}, colorBlind=${colorBlindType}`);
  }

  /**
   * Set accessibility mode
   * @param {string} mode 'default' | 'dyslexia' | 'high-contrast' | 'low-vision'
   */
  function setMode(mode) {
    const validModes = ['default', 'dyslexia', 'high-contrast', 'low-vision'];
    if (!validModes.includes(mode)) {
      console.warn(`Invalid a11y mode: ${mode}`);
      return;
    }

    // Remove previous mode classes
    document.documentElement.dataset.a11y = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    currentMode = mode;

    // Apply mode-specific adjustments
    applyModeStyles(mode);

    // Emit change event
    window.dispatchEvent(new CustomEvent('a11y-mode-changed', {detail: {mode}}));
  }

  /**
   * Set font scale for low vision mode
   * @param {number} scale 1.0 (normal) to 2.0 (200% larger)
   */
  function setFontScale(scale) {
    const clampedScale = Math.max(1.0, Math.min(2.0, scale));
    fontScale = clampedScale;
    localStorage.setItem(STORAGE_FONT_SIZE, clampedScale.toString());

    // Apply CSS custom property
    document.documentElement.style.setProperty('--a11y-font-scale', clampedScale);

    window.dispatchEvent(new CustomEvent('a11y-font-scale-changed', {detail: {scale: clampedScale}}));
  }

  /**
   * Set color blind filter type
   * @param {string|null} type null | 'deuteranopia' | 'protanopia' | 'tritanopia'
   */
  function setColorBlindType(type) {
    const validTypes = [null, 'deuteranopia', 'protanopia', 'tritanopia'];
    if (!validTypes.includes(type)) {
      console.warn(`Invalid color blind type: ${type}`);
      return;
    }

    colorBlindType = type;
    if (type) {
      document.documentElement.dataset.colorBlind = type;
      localStorage.setItem(STORAGE_COLOR_BLIND, type);
    } else {
      delete document.documentElement.dataset.colorBlind;
      localStorage.removeItem(STORAGE_COLOR_BLIND);
    }

    window.dispatchEvent(new CustomEvent('a11y-color-blind-changed', {detail: {type}}));
  }

  /**
   * Apply mode-specific styling adjustments
   */
  function applyModeStyles(mode) {
    switch (mode) {
      case 'dyslexia':
        // Font already handled by CSS [data-a11y="dyslexia"]
        // Additional JS-based adjustments if needed
        setFontScale(1.1); // Slightly larger for dyslexia
        break;

      case 'high-contrast':
        // CSS handles most of it; just ensure full saturation
        document.documentElement.style.filter = 'contrast(1.2)';
        break;

      case 'low-vision':
        // Set larger default font scale
        setFontScale(1.5);
        break;

      case 'default':
        // Reset to normal
        document.documentElement.style.filter = 'none';
        setFontScale(1.0);
        break;
    }
  }

  /**
   * Get current settings
   */
  function getSettings() {
    return {
      mode: currentMode,
      fontScale: fontScale,
      colorBlindType: colorBlindType
    };
  }

  /**
   * Increase font scale (for low vision)
   */
  function increaseFontSize() {
    setFontScale(fontScale + 0.25);
  }

  /**
   * Decrease font scale (but not below 1.0)
   */
  function decreaseFontSize() {
    setFontScale(Math.max(1.0, fontScale - 0.25));
  }

  /**
   * Reset to defaults
   */
  function reset() {
    setMode('default');
    setFontScale(1.0);
    setColorBlindType(null);
  }

  return {
    init,
    setMode,
    setFontScale,
    setColorBlindType,
    getSettings,
    increaseFontSize,
    decreaseFontSize,
    reset
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => A11ySettings.init());
} else {
  A11ySettings.init();
}
