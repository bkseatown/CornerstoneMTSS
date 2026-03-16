/**
 * a11y-controls.js
 * Accessibility controls UI component
 * Renders in a modal or sidebar for easy access
 */

const A11yControls = (() => {
  let containerEl = null;

  /**
   * Render accessibility controls UI
   * @param {HTMLElement|string} selector Container for controls
   * @param {object} options Positioning and display options
   */
  function render(selector, options = {}) {
    containerEl = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!containerEl) {
      console.error('A11yControls: container not found');
      return;
    }

    const position = options.position || 'sidebar'; // 'sidebar' or 'modal'
    const html = `
      <div class="a11y-controls-panel" role="region" aria-label="Accessibility Settings">
        <div class="a11y-controls-header">
          <h3 class="a11y-controls-title">🎯 Accessibility Settings</h3>
          <button class="a11y-close-btn" aria-label="Close accessibility settings" onclick="this.parentElement.parentElement.classList.toggle('hidden')">
            ✕
          </button>
        </div>

        <div class="a11y-controls-group">
          <label class="a11y-control-label">Accessibility Mode</label>
          <div class="a11y-mode-buttons">
            <button class="a11y-mode-btn a11y-mode-default" data-mode="default" title="Default mode - standard interface">
              Standard
            </button>
            <button class="a11y-mode-btn a11y-mode-dyslexia" data-mode="dyslexia" title="Dyslexia-friendly: OpenDyslexia font, increased spacing">
              Dyslexia-Friendly
            </button>
            <button class="a11y-mode-btn a11y-mode-highcontrast" data-mode="high-contrast" title="High contrast for low vision">
              High Contrast
            </button>
            <button class="a11y-mode-btn a11y-mode-lowvision" data-mode="low-vision" title="Low vision: Larger fonts and touch targets">
              Large Text
            </button>
          </div>
        </div>

        <div class="a11y-controls-group">
          <label class="a11y-control-label">Text Size</label>
          <div class="a11y-font-size-controls">
            <button class="a11y-font-btn a11y-font-decrease" aria-label="Decrease text size" onclick="A11ySettings.decreaseFontSize()">
              A<span style="font-size: 0.8em">-</span>
            </button>
            <span class="a11y-font-display" id="font-scale-display">100%</span>
            <button class="a11y-font-btn a11y-font-increase" aria-label="Increase text size" onclick="A11ySettings.increaseFontSize()">
              A<span style="font-size: 1.2em">+</span>
            </button>
          </div>
        </div>

        <div class="a11y-controls-group">
          <label class="a11y-control-label">Color Blind Mode</label>
          <div class="a11y-colorblind-buttons">
            <button class="a11y-cb-btn a11y-cb-none" data-type="none" title="No color blind filter">
              None
            </button>
            <button class="a11y-cb-btn a11y-cb-deutan" data-type="deuteranopia" title="Red-green (most common)">
              Red-Green (Deutan)
            </button>
            <button class="a11y-cb-btn a11y-cb-protan" data-type="protanopia" title="Red-green (protanopia)">
              Red-Green (Protan)
            </button>
            <button class="a11y-cb-btn a11y-cb-tritan" data-type="tritanopia" title="Blue-yellow">
              Blue-Yellow
            </button>
          </div>
        </div>

        <div class="a11y-controls-group">
          <button class="a11y-reset-btn" onclick="A11ySettings.reset(); location.reload();">
            Reset to Defaults
          </button>
        </div>

        <div class="a11y-info">
          <small>⌨️ <strong>Tip:</strong> Press <kbd>Alt</kbd> + <kbd>A</kbd> to show/hide accessibility settings</small>
        </div>
      </div>
    `;

    containerEl.innerHTML = html;
    attachListeners();
    updateDisplay();
  }

  /**
   * Attach event listeners to controls
   */
  function attachListeners() {
    // Mode buttons
    document.querySelectorAll('.a11y-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        A11ySettings.setMode(mode);
        updateDisplay();
      });
    });

    // Color blind buttons
    document.querySelectorAll('.a11y-cb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type === 'none' ? null : e.target.dataset.type;
        A11ySettings.setColorBlindType(type);
        updateDisplay();
      });
    });

    // Listen for external changes
    window.addEventListener('a11y-mode-changed', updateDisplay);
    window.addEventListener('a11y-font-scale-changed', updateDisplay);
    window.addEventListener('a11y-color-blind-changed', updateDisplay);

    // Keyboard shortcut: Alt+A to toggle
    document.addEventListener('keydown', (e) => {
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        containerEl?.classList.toggle('a11y-controls-hidden');
      }
    });
  }

  /**
   * Update UI to reflect current settings
   */
  function updateDisplay() {
    const settings = A11ySettings.getSettings();

    // Update mode buttons
    document.querySelectorAll('.a11y-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === settings.mode);
    });

    // Update font scale display
    const fontDisplay = document.getElementById('font-scale-display');
    if (fontDisplay) {
      fontDisplay.textContent = `${Math.round(settings.fontScale * 100)}%`;
    }

    // Update color blind buttons
    document.querySelectorAll('.a11y-cb-btn').forEach(btn => {
      const type = btn.dataset.type === 'none' ? null : btn.dataset.type;
      btn.classList.toggle('active', type === settings.colorBlindType);
    });
  }

  return {
    render,
    updateDisplay
  };
})();
