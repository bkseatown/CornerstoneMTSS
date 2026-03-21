/**
 * app-demo-ui.js
 * Demo toast, chip, and launch-button UI helpers.
 */

function createDemoUiModule(deps) {
  const {
    defaultDurationMs = 90000,
    demoMode = false,
    dwellMs = 3200,
    getDemoState = () => ({ active: false }),
    getLaunchAnchorRect = () => null,
    handleRestart = () => {},
    handleSkip = () => {},
    isTeacherToolsNode = () => false,
    onCloseToast = () => {},
    onOpenToast = () => {},
    positionLaunchButtonLater = () => {},
    resolveDemoUrl = (url) => url,
    runtime = {},
    stopCoachReadyLoop = () => {},
    stopDemoAutoplayTimer = () => {},
    stopDemoAudio = () => {},
    stopDemoKeyPulse = () => {},
    stopDemoTimers = () => {},
    textForStep = () => 'Live demo: try one round.'
  } = deps || {};

  function stopDemoToastProgress() {
    if (!runtime.demoToastProgressTimer) return;
    clearInterval(runtime.demoToastProgressTimer);
    runtime.demoToastProgressTimer = 0;
  }

  function clearDemoToastMessageTimer() {
    if (runtime.demoToastMessageTimer) {
      clearTimeout(runtime.demoToastMessageTimer);
      runtime.demoToastMessageTimer = 0;
    }
    runtime.demoToastPendingKey = '';
  }

  function renderDemoToastProgress(forcePct) {
    if (!(runtime.demoToastBarFillEl instanceof HTMLElement)) return;
    let pct = Number(forcePct);
    if (!Number.isFinite(pct)) {
      if (!runtime.demoToastStartedAt || !runtime.demoToastDurationMs) pct = 0;
      else pct = ((Date.now() - runtime.demoToastStartedAt) / runtime.demoToastDurationMs) * 100;
    }
    const clamped = Math.max(0, Math.min(100, pct));
    runtime.demoToastBarFillEl.style.width = `${clamped}%`;
  }

  function startDemoToastProgress(durationMs = defaultDurationMs) {
    runtime.demoToastDurationMs = Math.max(5000, Number(durationMs) || defaultDurationMs);
    runtime.demoToastStartedAt = Date.now();
    renderDemoToastProgress(0);
    stopDemoToastProgress();
    runtime.demoToastProgressTimer = setInterval(() => {
      renderDemoToastProgress();
      if (Date.now() - runtime.demoToastStartedAt >= runtime.demoToastDurationMs) {
        stopDemoToastProgress();
      }
    }, 160);
  }

  function setDemoToastText(stepKey, options = {}) {
    if (!(runtime.demoToastTextEl instanceof HTMLElement)) return;
    const nextLine = textForStep(stepKey);
    const force = !!options.force;
    if (!nextLine || runtime.demoToastTextEl.textContent === nextLine) {
      runtime.demoToastPendingKey = '';
      return;
    }
    const now = Date.now();
    const elapsed = now - runtime.demoToastLastMessageAt;
    const needsDelay = !force && runtime.demoToastLastMessageAt > 0 && elapsed < dwellMs;
    if (needsDelay) {
      runtime.demoToastPendingKey = stepKey;
      if (runtime.demoToastMessageTimer) return;
      runtime.demoToastMessageTimer = window.setTimeout(() => {
        runtime.demoToastMessageTimer = 0;
        const pending = runtime.demoToastPendingKey;
        runtime.demoToastPendingKey = '';
        if (!pending) return;
        setDemoToastText(pending, { force: true });
      }, Math.max(120, dwellMs - elapsed));
      return;
    }
    if (runtime.demoToastMessageTimer) clearDemoToastMessageTimer();
    runtime.demoToastTextEl.textContent = nextLine;
    runtime.demoToastLastMessageAt = now;
  }

  function setDemoToastTextLiteral(line, options = {}) {
    if (!(runtime.demoToastTextEl instanceof HTMLElement)) return;
    const nextLine = String(line || '').trim();
    if (!nextLine) return;
    const force = !!options.force;
    const now = Date.now();
    const elapsed = now - runtime.demoToastLastMessageAt;
    const needsDelay = !force && runtime.demoToastLastMessageAt > 0 && elapsed < dwellMs;
    if (needsDelay) {
      runtime.demoToastPendingKey = '';
      if (runtime.demoToastMessageTimer) return;
      runtime.demoToastMessageTimer = window.setTimeout(() => {
        runtime.demoToastMessageTimer = 0;
        setDemoToastTextLiteral(nextLine, { force: true });
      }, Math.max(120, dwellMs - elapsed));
      return;
    }
    if (runtime.demoToastMessageTimer) clearDemoToastMessageTimer();
    runtime.demoToastTextEl.textContent = nextLine;
    runtime.demoToastLastMessageAt = now;
  }

  function collapseDemoToast() {
    runtime.demoToastCollapsed = true;
    runtime.demoToastEl?.classList.add('hidden');
    runtime.demoToastChipEl?.classList.remove('hidden');
    onCloseToast();
  }

  function showDemoToast(forceOpen = false) {
    if (!(runtime.demoToastEl instanceof HTMLElement)) return;
    if (forceOpen || !runtime.demoToastCollapsed) {
      runtime.demoToastEl.classList.remove('hidden');
      runtime.demoToastChipEl?.classList.add('hidden');
      runtime.demoToastCollapsed = false;
      onOpenToast();
    }
  }

  function createDemoBanner() {
    if (!demoMode || document.getElementById('cs-demo-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'cs-demo-toast';
    toast.className = 'cs-demo-toast hidden';
    toast.setAttribute('role', 'region');
    toast.setAttribute('aria-label', 'Live demo');
    toast.innerHTML =
      '<div class="cs-demo-toast__row">' +
        '<div class="cs-demo-toast__badge" aria-hidden="true">DEMO</div>' +
        '<div class="cs-demo-toast__text" aria-live="polite" id="cs-demo-toast-text">Live demo: try one round.</div>' +
        '<div class="cs-demo-toast__actions">' +
          '<button class="cs-btn cs-btn--ghost" id="cs-demo-skip" type="button">Skip</button>' +
          '<button class="cs-btn cs-btn--primary" id="cs-demo-restart" type="button">Restart</button>' +
          '<button class="cs-btn cs-btn--icon" id="cs-demo-close" type="button" aria-label="Hide demo banner">×</button>' +
        '</div>' +
      '</div>' +
      '<div class="cs-demo-toast__bar"><div class="cs-demo-toast__barFill" id="cs-demo-toast-bar"></div></div>';
    document.body.appendChild(toast);
    const chip = document.createElement('button');
    chip.id = 'cs-demo-chip';
    chip.className = 'cs-demo-chip hidden';
    chip.type = 'button';
    chip.setAttribute('aria-label', 'Show demo banner');
    chip.textContent = 'DEMO';
    document.body.appendChild(chip);
    runtime.demoBannerEl = toast;
    runtime.demoToastEl = toast;
    runtime.demoToastTextEl = document.getElementById('cs-demo-toast-text');
    runtime.demoToastBarFillEl = document.getElementById('cs-demo-toast-bar');
    runtime.demoToastChipEl = chip;
    showDemoToast(true);
    setDemoToastText('preRound', { force: true });
    startDemoToastProgress(defaultDurationMs);
    document.getElementById('cs-demo-skip')?.addEventListener('click', () => {
      const state = getDemoState();
      state.active = false;
      clearDemoToastMessageTimer();
      stopDemoToastProgress();
      stopDemoTimers();
      stopCoachReadyLoop();
      stopDemoKeyPulse();
      stopDemoAudio();
      handleSkip();
    });
    document.getElementById('cs-demo-restart')?.addEventListener('click', () => {
      handleRestart();
      showDemoToast(true);
      setDemoToastText('preRound', { force: true });
      startDemoToastProgress(defaultDurationMs);
    });
    document.getElementById('cs-demo-close')?.addEventListener('click', () => collapseDemoToast());
    chip.addEventListener('click', () => showDemoToast(true));
  }

  function positionDemoLaunchButton() {
    if (demoMode || !(runtime.demoLaunchBtnEl instanceof HTMLElement)) return;
    const rect = getLaunchAnchorRect();
    if (!rect) {
      runtime.demoLaunchBtnEl.style.top = '';
      runtime.demoLaunchBtnEl.style.left = '';
      return;
    }
    const buttonWidth = Math.max(220, runtime.demoLaunchBtnEl.offsetWidth || 220);
    const maxLeft = Math.max(8, window.innerWidth - buttonWidth - 8);
    const targetCenterX = rect.left + (rect.width / 2);
    const nextLeft = Math.min(maxLeft, Math.max(8, Math.round(targetCenterX - (buttonWidth / 2))));
    const topFromTiles = Math.round(rect.top - 52);
    const topFromKeyboard = Math.round(rect.top - 48);
    const nextTop = Math.max(72, Math.min(window.innerHeight - 56, Math.max(topFromTiles, topFromKeyboard)));
    runtime.demoLaunchBtnEl.style.left = `${nextLeft}px`;
    runtime.demoLaunchBtnEl.style.top = `${nextTop}px`;
  }

  function createHomeDemoLaunchButton() {
    let allowDemoChip = false;
    try {
      const params = new URLSearchParams(window.location.search || '');
      allowDemoChip = params.get('democta') === '1';
    } catch {
      allowDemoChip = false;
    }
    if (!allowDemoChip) {
      const stale = document.getElementById('wq-demo-launch-btn');
      if (stale) stale.remove();
      runtime.demoLaunchBtnEl = null;
      return;
    }
    if (demoMode || document.getElementById('wq-demo-launch-btn')) return;
    const button = document.createElement('button');
    button.id = 'wq-demo-launch-btn';
    button.className = 'wq-demo-launch-btn';
    button.type = 'button';
    button.textContent = 'Try a live round (60 sec)';
    button.addEventListener('click', () => {
      window.location.href = resolveDemoUrl(window.location.href);
    });
    document.body.appendChild(button);
    runtime.demoLaunchBtnEl = button;
    positionDemoLaunchButton();
    window.addEventListener('resize', positionDemoLaunchButton, { passive: true });
    window.addEventListener('scroll', positionDemoLaunchButton, { passive: true });
    positionLaunchButtonLater();
  }

  function setDemoControlsDisabled() {
    if (!demoMode) return;
    document.body.classList.add('wq-demo');
    const focusInput = document.getElementById('focus-inline-search');
    const focusSelect = document.getElementById('setting-focus');
    const lengthSelect = document.getElementById('s-length');
    const guessesSelect = document.getElementById('s-guesses');
    if (focusSelect) focusSelect.value = 'all';
    if (lengthSelect) lengthSelect.value = '5';
    if (guessesSelect) guessesSelect.value = '6';
    if (focusInput) {
      focusInput.value = 'Classic (Demo Locked)';
      focusInput.setAttribute('readonly', 'true');
      focusInput.setAttribute('aria-readonly', 'true');
      focusInput.setAttribute('tabindex', '-1');
    }
    const targets = [focusSelect, lengthSelect, guessesSelect, focusInput, document.getElementById('wq-teacher-words')];
    targets.forEach((node) => {
      if (!node) return;
      node.setAttribute('disabled', 'true');
      node.setAttribute('aria-disabled', 'true');
      node.setAttribute('title', 'Disabled in Live Demo');
    });
    document.querySelectorAll('#challenge-modal input, #challenge-modal textarea').forEach((node) => {
      node.setAttribute('disabled', 'true');
      node.setAttribute('aria-disabled', 'true');
      node.setAttribute('title', 'Disabled in Live Demo');
    });
    const teacherTools = document.getElementById('wq-teacher-tools');
    if (isTeacherToolsNode(teacherTools)) teacherTools.classList.add('hidden');
  }

  return {
    clearDemoToastMessageTimer,
    collapseDemoToast,
    createDemoBanner,
    createHomeDemoLaunchButton,
    positionDemoLaunchButton,
    renderDemoToastProgress,
    setDemoControlsDisabled,
    setDemoToastText,
    setDemoToastTextLiteral,
    showDemoToast,
    startDemoToastProgress,
    stopDemoToastProgress
  };
}
