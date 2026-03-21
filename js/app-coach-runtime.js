/**
 * app-coach-runtime.js
 * Coach ribbons and idle coaching runtime.
 */

function createCoachRuntimeModule(deps) {
  const {
    demoMode = false,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getGameState = () => ({}),
    getHomeMode = () => 'home',
    isDevModeEnabled = () => false,
    localStorageRef = localStorage,
    setWordQuestCoachKey = () => {},
    windowRef = window
  } = deps || {};

  const runtime = {
    homeCoachRibbon: null,
    wordQuestCoachRibbon: null,
    wrongStreak: 0,
    correctStreak: 0,
    totalWrong: 0,
    totalCorrect: 0,
    rapidEvents: [],
    lastActionAt: Date.now(),
    lastIdleEmitAt: 0,
    idleTimer: 0,
    idleFiredThisRound: false
  };

  function logAvaIdleDev(message, detail) {
    if (!isDevModeEnabled()) return;
    try {
      console.debug('[AvaIdle]', message, detail || '');
    } catch {}
  }

  function isPlayMode() {
    return documentRef.documentElement.getAttribute('data-home-mode') === 'play';
  }

  function isWordQuestActiveRound() {
    const state = getGameState();
    return !!(state && state.word && !state.gameOver);
  }

  function isCoachEnabled() {
    try {
      return localStorageRef.getItem('cs_coach_voice_enabled') === 'true';
    } catch {
      return false;
    }
  }

  function isAnyOverlayOpen() {
    const selectors = [
      '#modal-overlay:not(.hidden)',
      '#challenge-modal:not(.hidden)',
      '#phonics-clue-modal:not(.hidden)',
      '#listening-mode-overlay:not(.hidden)',
      '#first-run-setup-modal:not(.hidden)',
      '#end-modal:not(.hidden)',
      '#modal-challenge-launch:not(.hidden)',
      '#voice-help-modal:not(.hidden)',
      '#settings-panel:not(.hidden)',
      '#teacher-panel:not(.hidden)',
      '#play-tools-drawer:not(.hidden)',
      '#theme-preview-strip:not(.hidden)',
      '#quick-music-strip:not(.hidden)'
    ];
    for (const selector of selectors) {
      if (documentRef.querySelector(selector)) return true;
    }
    return false;
  }

  function isTextCompositionFocusActive() {
    const active = documentRef.activeElement;
    if (!(active instanceof HTMLElement)) return false;
    if (active.closest('#challenge-modal, #teacher-panel, #settings-panel, #modal-overlay, #voice-help-modal')) {
      return true;
    }
    const tag = String(active.tagName || '').toLowerCase();
    if (active.isContentEditable) return true;
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function canRunAvaIdleCoaching() {
    if (demoMode) return false;
    if (documentRef.hidden) return false;
    if (!isPlayMode()) return false;
    if (!isWordQuestActiveRound()) return false;
    if (!isCoachEnabled()) return false;
    if (isAnyOverlayOpen()) return false;
    if (isTextCompositionFocusActive()) return false;
    return true;
  }

  function initCoachRibbons() {
    const ribbonMod = windowRef.CSCoachRibbon;
    if (!ribbonMod || typeof ribbonMod.initCoachRibbon !== 'function') return;
    if (!runtime.homeCoachRibbon) {
      const mount = el('home-coach-ribbon');
      if (mount) {
        runtime.homeCoachRibbon = ribbonMod.initCoachRibbon({
          mountEl: mount,
          getMessageFn: () => {
            const toolsVisible = !el('home-tools-section')?.classList.contains('hidden');
            return {
              key: toolsVisible ? 'home.tools' : 'home.default',
              text: toolsVisible
                ? 'Pick a tool; everything is scaffolded for Tier 2/3.'
                : 'Try a 60-second round to see decoding + feedback.'
            };
          }
        });
      }
    }
    if (!runtime.wordQuestCoachRibbon) {
      const mount = el('wq-coach-ribbon');
      if (mount) {
        runtime.wordQuestCoachRibbon = ribbonMod.initCoachRibbon({
          mountEl: mount,
          getMessageFn: () => ({ key: 'wq.beforeFirstGuess', text: '' })
        });
      }
    }
  }

  function updateHomeCoachRibbon() {
    if (!runtime.homeCoachRibbon || typeof runtime.homeCoachRibbon.update !== 'function') return;
    runtime.homeCoachRibbon.update({});
  }

  function recordAvaWordQuestEvent(type) {
    const ts = Date.now();
    runtime.rapidEvents.push({ type: String(type || 'event'), ts });
    runtime.rapidEvents = runtime.rapidEvents.filter((evt) => (ts - Number(evt.ts || 0)) <= 10000);
    runtime.lastActionAt = ts;
  }

  function speakAvaWordQuestAdaptive(eventKey, overrides = {}) {
    if (demoMode) return;
    if (!isPlayMode()) return;
    if (!isWordQuestActiveRound()) return;
    if (!isCoachEnabled()) return;
    if (documentRef.hidden) return;
    if (isAnyOverlayOpen()) return;
    if (isTextCompositionFocusActive()) return;
    if (typeof windowRef.CSEmitAva !== 'function') return;
    const state = getGameState();
    const tierRaw = String(localStorageRef.getItem('cs_tier_level') || '').trim();
    const tier = Number(tierRaw || 2) === 3 ? 3 : 2;
    const baseContext = {
      module: 'word-quest',
      event: String(eventKey || '').trim(),
      tier,
      demo: !!demoMode,
      streakCorrect: runtime.correctStreak,
      streakWrong: runtime.wrongStreak,
      idleMs: Math.max(0, Date.now() - runtime.lastActionAt),
      rapidActions: runtime.rapidEvents.length,
      backspaceBurst: 0,
      selfCorrects: 0,
      accuracyPct: null,
      punctuationScore: null,
      remainingGuesses: Math.max(0, Number(state?.maxGuesses || 0) - Number(state?.guesses?.length || 0)),
      lastEvents: runtime.rapidEvents.slice(-12)
    };
    void windowRef.CSEmitAva(Object.assign(baseContext, overrides)).catch(() => {});
  }

  function startAvaWordQuestIdleWatcher() {
    if (demoMode) {
      logAvaIdleDev('watcher not started (demo mode)');
      return;
    }
    if (runtime.idleTimer) return;
    if (!isPlayMode()) {
      logAvaIdleDev('watcher not started (not play mode)');
      return;
    }
    logAvaIdleDev('watcher started');
    runtime.idleTimer = windowRef.setInterval(() => {
      if (!canRunAvaIdleCoaching()) return;
      if (runtime.idleFiredThisRound) return;
      const idleMs = Math.max(0, Date.now() - runtime.lastActionAt);
      if (idleMs < 20000) return;
      if ((Date.now() - runtime.lastIdleEmitAt) < 20000) return;
      runtime.lastIdleEmitAt = Date.now();
      runtime.idleFiredThisRound = true;
      logAvaIdleDev('idle_20s fired', { idleMs });
      speakAvaWordQuestAdaptive('idle_20s', { idleMs });
    }, 1000);
  }

  function stopAvaWordQuestIdleWatcher(reason) {
    if (runtime.idleTimer) {
      clearInterval(runtime.idleTimer);
      runtime.idleTimer = 0;
      logAvaIdleDev('watcher stopped', reason || '');
    }
  }

  function setWordQuestCoachState(key) {
    const nextKey = String(key || '').trim() || 'before_guess';
    setWordQuestCoachKey(nextKey);
    if (!runtime.wordQuestCoachRibbon || typeof runtime.wordQuestCoachRibbon.set !== 'function') return;
    const mount = el('wq-coach-ribbon');
    if (!(mount instanceof HTMLElement)) return;
    if (getHomeMode() !== 'play' || demoMode) {
      mount.classList.add('hidden');
      return;
    }
    mount.classList.remove('hidden');
    const map = {
      before_guess: { key: 'wq.beforeFirstGuess', text: 'Start with one strong test word. The tile colors will show what to keep, move, or drop.' },
      after_first_miss: { key: 'wq.afterFirstMiss', text: 'Read the color pattern carefully, then make the next guess more precise instead of wider.' },
      after_correct: { key: 'wq.correct', text: 'Solved. Tap Next Word to keep the momentum going or replay the pattern for fluency.' }
    };
    runtime.wordQuestCoachRibbon.set(map[nextKey] || map.before_guess);
  }

  return {
    get runtime() { return runtime; },
    initCoachRibbons,
    recordAvaWordQuestEvent,
    setWordQuestCoachState,
    speakAvaWordQuestAdaptive,
    startAvaWordQuestIdleWatcher,
    stopAvaWordQuestIdleWatcher,
    updateHomeCoachRibbon
  };
}

window.createCoachRuntimeModule = createCoachRuntimeModule;
