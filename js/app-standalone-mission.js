/**
 * app-standalone-mission.js
 * Standalone Deep Dive helper logic for level choice and word-pool selection.
 */

function createStandaloneMissionModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQData = null,
    WQGame = null,
    WQUI = null,
    challengeModalReturnFocusRef = { get: () => null, set: () => {} },
    clearClassroomTurnTimer = () => {},
    deepDiveBuilders = null,
    deepDiveModal = null,
    deepDiveSession = null,
    deepDiveState = null,
    demoUi = null,
    documentRef = document,
    el = (id) => document.getElementById(id),
    emitTelemetry = () => {},
    finishWeeklyProbe = () => {},
    formatGradeBandLabel = (gradeBand) => String(gradeBand || ''),
    getFocusLabel = (focus) => String(focus || ''),
    getEffectiveGameplayGradeBand = (grade, _focus) => grade,
    logOverflow = () => {},
    normalizeReviewWord = (word) => String(word || '').trim().toLowerCase(),
    pickRandom = () => '',
    prefs = {},
    positionHintClueCard = () => {},
    positionStarterWordCard = () => {},
    positionSupportChoiceCard = () => {},
    revealChallengeStateRef = { get: () => null, set: () => {} },
    shouldExpandGradeBandForFocus = () => false
    ,
    stopAvaWordQuestIdleWatcher = () => {},
    stopVoiceCaptureNow = () => {},
    telemetrySessionStartedAtRef = () => 0,
    windowRef = window,
    wqDiagTimerRef = { get: () => 0, set: () => {} }
  } = deps || {};

  function resolveStandaloneAutoChallengeLevel(entry) {
    const band = String(entry?.grade_band || '').trim().toUpperCase();
    if (band === 'K-2') {
      return pickRandom(['remember', 'understand', 'apply']) || 'apply';
    }
    if (band === 'G3-5') {
      return pickRandom(['understand', 'apply', 'analyze']) || 'apply';
    }
    if (band === 'G6-8') {
      return pickRandom(['apply', 'analyze', 'evaluate']) || 'analyze';
    }
    return pickRandom(['analyze', 'evaluate', 'create']) || 'evaluate';
  }

  function getStandaloneMissionWordPool() {
    const focus = el('setting-focus')?.value || prefs.focus || 'all';
    const selectedGrade = el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade;
    const gradeBand = getEffectiveGameplayGradeBand(selectedGrade, focus);
    const includeLowerBands = shouldExpandGradeBandForFocus(focus);
    const length = String(el('s-length')?.value || prefs.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;
    let pool = WQData.getPlayableWords({
      gradeBand,
      length,
      phonics: focus,
      includeLowerBands
    });
    if (!pool.length && length !== 'any') {
      pool = WQData.getPlayableWords({
        gradeBand,
        length: 'any',
        phonics: focus,
        includeLowerBands
      });
    }
    if (!pool.length) {
      pool = WQData.getPlayableWords({
        gradeBand,
        length: 'any',
        phonics: 'all'
      });
    }
    return {
      pool: Array.isArray(pool) ? pool : [],
      focus,
      gradeBand,
      length
    };
  }

  function refreshStandaloneMissionLabHub() {
    const select = el('mission-lab-word-select');
    const note = el('mission-lab-hub-note');
    const meta = el('mission-lab-hub-meta');
    if (!select && !note && !meta) return;

    const { pool, focus, gradeBand, length } = getStandaloneMissionWordPool();
    const rawFocusLabel = getFocusLabel(focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    const focusLabel = focus === 'all'
      ? 'Track: Core Vocabulary'
      : `Track: ${rawFocusLabel || 'Targeted Skill'}`;
    const gradeLabel = formatGradeBandLabel(gradeBand);
    const lengthLabel = String(length || '').toLowerCase() === 'any'
      ? 'Any word length'
      : `${String(length)}-letter words`;

    if (select) {
      const previous = normalizeReviewWord(select.value);
      select.innerHTML = '';
      const autoOption = documentRef.createElement('option');
      autoOption.value = '';
      autoOption.textContent = 'Auto-pick from current filters';
      select.appendChild(autoOption);
      pool
        .slice()
        .sort((a, b) => String(a).localeCompare(String(b)))
        .slice(0, 200)
        .forEach((word) => {
          const option = documentRef.createElement('option');
          const normalizedWord = normalizeReviewWord(word);
          option.value = normalizedWord;
          option.textContent = normalizedWord.toUpperCase();
          select.appendChild(option);
        });
      if (previous && pool.includes(previous)) {
        select.value = previous;
      } else {
        select.value = '';
      }
    }

    if (meta) {
      meta.textContent = `${focusLabel} · Grade ${gradeLabel} · ${lengthLabel}`;
    }
    if (note) {
      note.textContent = pool.length
        ? `${pool.length} ready words. Start now, or choose a word + level below.`
        : 'No words match this filter yet. Change quest focus or grade, then try again.';
    }
  }

  function startStandaloneMissionLab(options = {}) {
    const { pool } = getStandaloneMissionWordPool();
    if (!pool.length) {
      WQUI?.showToast?.('No words match this Deep Dive filter. Adjust grade, quest, or word length.');
      refreshStandaloneMissionLabHub();
      return false;
    }

    const selectedWord = normalizeReviewWord(
      options.word ||
      el('mission-lab-word-select')?.value ||
      ''
    );
    const fallbackWord = normalizeReviewWord(pickRandom(pool) || pool[0] || '');
    const word = (selectedWord && pool.includes(selectedWord)) ? selectedWord : fallbackWord;
    if (!word) {
      WQUI?.showToast?.('Could not pick a Deep Dive word. Try again.');
      return false;
    }

    const entryData = WQData?.getEntry?.(word);
    if (!entryData) {
      WQUI?.showToast?.('Deep Dive word data is missing. Pick another word.');
      return false;
    }

    const requestedLevel = deepDiveBuilders?.normalizeThinkingLevel?.(
      options.level ||
      el('mission-lab-level-select')?.value ||
      '',
      ''
    ) || '';
    const level = requestedLevel || resolveStandaloneAutoChallengeLevel(entryData);
    const result = {
      word: word.toUpperCase(),
      entry: entryData,
      guesses: [word],
      won: true
    };
    const nextState = deepDiveSession?.buildRevealChallengeState?.(result, {
      source: 'standalone',
      level
    }) || null;
    if (!nextState) {
      WQUI?.showToast?.('Deep Dive could not start with this word.');
      return false;
    }

    revealChallengeStateRef.set(nextState);
    const activeElement = documentRef.activeElement;
    challengeModalReturnFocusRef.set(
      activeElement instanceof HTMLElement && activeElement !== documentRef.body
        ? activeElement
        : null
    );
    deepDiveModal?.renderRevealChallengeModal?.();
    el('challenge-modal')?.classList.remove('hidden');
    deepDiveState?.syncChallengeQuickstartCard?.(revealChallengeStateRef.get());
    deepDiveModal?.focusChallengeModalStart?.();
    emitTelemetry('wq_deep_dive_start', {
      source: 'standalone',
      word_id: normalizeReviewWord(word),
      level: level || ''
    });
    emitTelemetry('wq_funnel_deep_dive_started', {
      source: 'standalone',
      word_id: normalizeReviewWord(word),
      level: level || ''
    });
    return true;
  }

  function reflowLayout() {
    const state = WQGame?.getState?.();
    if (state?.word) WQUI?.calcLayout?.(state.wordLength, state.maxGuesses);
    if (el('hint-clue-card') && !el('hint-clue-card')?.classList.contains('hidden')) {
      positionHintClueCard();
    }
    if (el('starter-word-card') && !el('starter-word-card')?.classList.contains('hidden')) {
      positionStarterWordCard();
    }
    if (el('support-choice-card') && !el('support-choice-card')?.classList.contains('hidden')) {
      positionSupportChoiceCard();
    }
    logOverflow('reflowLayout');
  }

  function handleBeforeUnload() {
    stopAvaWordQuestIdleWatcher('beforeunload');
    demoUi?.stopDemoToastProgress?.();
    const timer = wqDiagTimerRef.get();
    if (timer) {
      clearTimeout(timer);
      wqDiagTimerRef.set(null);
    }
    emitTelemetry('wq_session_end', {
      duration_ms: Math.max(0, Date.now() - telemetrySessionStartedAtRef()),
      reason: 'beforeunload'
    });
    stopVoiceCaptureNow();
    clearClassroomTurnTimer();
    finishWeeklyProbe({ silent: true });
  }

  function bindWindowLifecycle() {
    windowRef.addEventListener('resize', reflowLayout);
    windowRef.visualViewport?.addEventListener('resize', reflowLayout);
    windowRef.addEventListener('beforeunload', handleBeforeUnload);
  }

  return Object.freeze({
    getStandaloneMissionWordPool,
    bindWindowLifecycle,
    refreshStandaloneMissionLabHub,
    reflowLayout,
    resolveStandaloneAutoChallengeLevel,
    startStandaloneMissionLab
  });
}

window.createStandaloneMissionModule = createStandaloneMissionModule;
