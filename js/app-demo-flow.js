/**
 * app-demo-flow.js
 * Demo routing, overlays, coach flow, and playback helpers.
 */

function createDemoFlowModule(deps) {
  const {
    demoDebugMode = false,
    demoDebugRuntime = { getLabel: () => null, setLabel: () => {} },
    demoMode = false,
    demoOverlaySelectors = [],
    demoSetTimeoutRef = setTimeout,
    el = () => null,
    getDemoState = () => ({ active: false, started: false, step: 0 }),
    getDemoTargetWord = () => '',
    getGameState = () => null,
    handleInputUnit = () => {},
    hideDemoCoachUi = () => {},
    normalizePageMode = (mode) => mode,
    onCloseDemoEndOverlay = () => {},
    onDemoCompleted = () => {},
    onResetDemoUi = () => {},
    onShowDemoLine = () => {},
    renderDemoDebugReadout = () => {},
    removeDemoTimer = () => {},
    setPageMode = () => {},
    setDemoAutoplayTimer = () => {},
    showDemoCoachUi = () => {},
    stopDemoAutoplayTimer = () => {},
    stopDemoAudioTimers = () => {},
    stopDemoCoachReadyLoop = () => {},
    stopDemoKeyPulse = () => {},
    syncHeaderControlsVisibility = () => {}
  } = deps || {};

  function ensureDemoParam(url) {
    const next = new URL(url || window.location.href, window.location.href);
    next.searchParams.set('demo', '1');
    next.searchParams.set('page', 'word-quest');
    next.searchParams.delete('mode');
    return next.toString();
  }

  function removeDemoParams(url) {
    const next = new URL(url || window.location.href, window.location.href);
    next.searchParams.delete('demo');
    next.searchParams.delete('mode');
    return next.toString();
  }

  function exitDemoModeToPlay() {
    if (!demoMode) return;
    try {
      const state = getDemoState();
      state.active = false;
    } catch {}
    stopDemoAudioTimers();
    const next = new URL(removeDemoParams(window.location.href), window.location.href);
    next.searchParams.set('play', '1');
    next.searchParams.set('page', 'word-quest');
    window.location.replace(next.toString());
  }

  function listOpenOverlays() {
    return demoOverlaySelectors
      .map((selector) => (document.querySelector(selector) ? selector : ''))
      .filter(Boolean);
  }

  function closeAllOverlaysForDemo() {
    if (!demoMode) return true;
    document.querySelector('#focus-inline-results')?.classList.add('hidden');
    document.querySelector('#settings-panel')?.classList.add('hidden');
    document.querySelector('#teacher-panel')?.classList.add('hidden');
    document.querySelector('#modal-overlay')?.classList.add('hidden');
    document.querySelector('#challenge-modal')?.classList.add('hidden');
    document.querySelector('#phonics-clue-modal')?.classList.add('hidden');
    document.querySelector('#listening-mode-overlay')?.classList.add('hidden');
    document.querySelector('#first-run-setup-modal')?.classList.add('hidden');
    document.querySelector('#end-modal')?.classList.add('hidden');
    document.querySelector('#modal-challenge-launch')?.classList.add('hidden');
    document.documentElement.setAttribute('data-focus-search-open', 'false');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    setPageMode('word-quest', { force: true, skipUrl: true });
    syncHeaderControlsVisibility();
    renderDemoDebugReadout();
    return listOpenOverlays().length === 0;
  }

  function pulseDemoKey(letter) {
    const key = document.querySelector(`.key[data-key="${String(letter || '').toLowerCase()}"]`);
    if (!(key instanceof HTMLElement)) return;
    key.classList.remove('wq-demo-key-pulse');
    void key.offsetWidth;
    key.classList.add('wq-demo-key-pulse');
  }

  function startDemoKeyPulse(word, demoState, clearKeyPulse) {
    clearKeyPulse();
    const letters = String(word || '').toLowerCase().replace(/[^a-z]/g, '').split('');
    if (!letters.length) return;
    const pulseOnce = () => {
      pulseDemoKey(letters[demoState.keyPulseIndex % letters.length]);
      demoState.keyPulseIndex += 1;
      if (demoState.keyPulseIndex >= letters.length) {
        clearKeyPulse();
      } else {
        demoState.keyPulseTimer = demoSetTimeoutRef(pulseOnce, 320);
      }
    };
    demoState.keyPulseIndex = 0;
    pulseOnce();
  }

  function applySuggestedDemoWord(word) {
    const normalizedWord = String(word || '').trim().toLowerCase();
    const current = getGameState() || {};
    if (!normalizedWord || !current.wordLength || normalizedWord.length !== current.wordLength) return false;
    let clears = 0;
    while ((getGameState()?.guess || '').length > 0 && clears < 8) {
      handleInputUnit('Backspace');
      clears += 1;
    }
    for (const letter of normalizedWord) handleInputUnit(letter);
    handleInputUnit('Enter');
    return true;
  }

  function showDemoCoach(config, demoState, clearKeyPulse) {
    if (!demoMode) return;
    const runtime = getDemoState();
    if (!runtime.active) return;
    const nextStepId = String(config?.id || '').trim() || 'unknown';
    if (demoState.lastCoachStepId === nextStepId) return;
    demoState.lastCoachStepId = nextStepId;

    let stateKey = 'preRound';
    if (nextStepId === 'after_guess_1' || nextStepId === 'after_guess_2') stateKey = 'afterFirstGuess';
    else if (nextStepId === 'hint') stateKey = 'idle20s';
    else if (nextStepId === 'completed') stateKey = 'completed';

    if (config?.overrideLine) onShowDemoLine(String(config.overrideLine), { literal: true });
    else onShowDemoLine(stateKey);

    const suggestedWord = String(config?.suggestedWord || '').trim().toLowerCase();
    if (suggestedWord) startDemoKeyPulse(suggestedWord, demoState, clearKeyPulse);
    else clearKeyPulse();
    showDemoCoachUi();
  }

  function resetDemoScriptState(demoState, clearCoachReadyLoop, clearAutoplayTimer, clearKeyPulse, clearUiTimers) {
    const runtime = getDemoState();
    runtime.step = 0;
    runtime.active = true;
    runtime.started = false;
    demoState.step = 0;
    demoState.guessCount = 0;
    demoState.discoveredCore = new Set();
    demoState.hintUsed = false;
    demoState.overlaysClosed = false;
    demoState.coachMounted = false;
    demoState.lastCoachStepId = '';
    demoState.handledGuessCounts = new Set();
    clearCoachReadyLoop();
    clearAutoplayTimer();
    clearUiTimers();
    clearKeyPulse();
    hideDemoCoachUi();
    onResetDemoUi();
    renderDemoDebugReadout();
  }

  function runBoardOnlyDemoPlayback(clearAutoplayTimer, demoAutoplayRef) {
    if (!demoMode) return;
    const runtime = getDemoState();
    if (!runtime.active) return;
    const script = ['slate', 'plain', getDemoTargetWord()];
    const typeDelayMs = 260;
    const betweenGuessesMs = 2200;

    clearAutoplayTimer();

    const clearCurrentGuess = () => {
      const state = getGameState();
      const guess = String(state?.guess || '');
      for (let i = 0; i < guess.length; i += 1) handleInputUnit('Backspace');
    };

    const typeGuessAt = (index) => {
      const state = getGameState();
      if (!state || state.gameOver || !runtime.active) return;
      if (index >= script.length) return;
      const guessWord = String(script[index] || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, Number(state.wordLength) || 5);
      if (!guessWord) return;
      clearCurrentGuess();
      let letterIdx = 0;

      const typeNextLetter = () => {
        const live = getGameState();
        if (!live || live.gameOver || !runtime.active) return;
        if (letterIdx < guessWord.length) {
          handleInputUnit(guessWord[letterIdx]);
          letterIdx += 1;
          demoAutoplayRef.set(demoSetTimeoutRef(typeNextLetter, typeDelayMs));
          return;
        }
        handleInputUnit('Enter');
        demoAutoplayRef.set(demoSetTimeoutRef(() => typeGuessAt(index + 1), betweenGuessesMs));
      };

      demoAutoplayRef.set(demoSetTimeoutRef(typeNextLetter, 500));
    };

    typeGuessAt(0);
  }

  function runDemoCoachForStart(clearAutoplayTimer, demoAutoplayRef, demoState, clearCoachReadyLoop, clearKeyPulse, clearUiTimers) {
    if (!demoMode) return;
    const runtime = getDemoState();
    if (!runtime.active || runtime.started) return;
    runtime.started = true;
    runtime.step = 1;
    closeAllOverlaysForDemo();
    hideDemoCoachUi();
    runBoardOnlyDemoPlayback(clearAutoplayTimer, demoAutoplayRef, demoState, clearCoachReadyLoop, clearKeyPulse, clearUiTimers);
  }

  function updateDemoDiscovered(result, demoState) {
    const guess = String(result?.guess || '').toUpperCase();
    const statuses = Array.isArray(result?.result) ? result.result : [];
    ['P', 'L', 'A'].forEach((targetLetter) => {
      for (let i = 0; i < guess.length; i += 1) {
        if (guess[i] !== targetLetter) continue;
        if (statuses[i] === 'correct' || statuses[i] === 'present') {
          demoState.discoveredCore.add(targetLetter);
          return;
        }
      }
    });
  }

  function runDemoCoachAfterGuess(result, demoState) {
    if (!demoMode || !result || result.error || result.won || result.lost) return;
    const runtime = getDemoState();
    if (!runtime.active) return;
    demoState.guessCount = Math.max(0, Number(result.guesses?.length || 0));
    runtime.step = demoState.guessCount + 1;
  }

  function clearDemoKeyPulseTimer(demoState) {
    if (!demoState?.keyPulseTimer) return;
    clearTimeout(demoState.keyPulseTimer);
    demoState.keyPulseTimer = 0;
  }

  function stopDemoCoachReadyTimer(timerId, setTimerId) {
    if (!timerId) return;
    clearTimeout(timerId);
    removeDemoTimer(timerId);
    setTimerId(0);
  }

  function stopDemoAutoplayTimerById(timerId, setTimerId) {
    if (!timerId) return;
    clearTimeout(timerId);
    removeDemoTimer(timerId);
    setTimerId(0);
  }

  function renderDemoDebugOverlay(demoState) {
    if (!demoMode || !demoDebugMode) return;
    let label = demoDebugRuntime.getLabel?.() || null;
    if (!(label instanceof HTMLElement)) {
      label = document.createElement('div');
      label.id = 'wq-demo-debug';
      label.className = 'wq-demo-debug';
      document.body.appendChild(label);
      demoDebugRuntime.setLabel?.(label);
    }
    const overlaysOpen = listOpenOverlays().length === 0 ? 'true' : 'false';
    const coachMounted = demoState?.coachMounted ? 'true' : 'false';
    label.textContent = `demo:1 overlaysClosed:${overlaysOpen} coachMounted:${coachMounted}`;
  }

  function closeDemoEndOverlay() {
    hideDemoCoachUi();
    onCloseDemoEndOverlay();
  }

  function showDemoEndOverlay(clearUiTimers, clearCoachReadyLoop, clearKeyPulse) {
    if (!demoMode) return;
    const runtime = getDemoState();
    runtime.active = false;
    clearUiTimers();
    clearCoachReadyLoop();
    clearKeyPulse();
    hideDemoCoachUi();
    onDemoCompleted();
  }

  return {
    applySuggestedDemoWord,
    clearDemoKeyPulseTimer,
    closeAllOverlaysForDemo,
    closeDemoEndOverlay,
    ensureDemoParam,
    exitDemoModeToPlay,
    listOpenOverlays,
    removeDemoParams,
    renderDemoDebugOverlay,
    resetDemoScriptState,
    runBoardOnlyDemoPlayback,
    runDemoCoachAfterGuess,
    runDemoCoachForStart,
    showDemoCoach,
    showDemoEndOverlay,
    stopDemoAutoplayTimerById,
    stopDemoCoachReadyTimer,
    updateDemoDiscovered
  };
}
