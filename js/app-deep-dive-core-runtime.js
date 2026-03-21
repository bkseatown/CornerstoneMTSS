/**
 * app-deep-dive-core-runtime.js
 * Deep Dive task-state and reveal narration glue that can live outside app-main.
 */

function createDeepDiveCoreRuntimeModule(deps) {
  const {
    WQAudio = null,
    WQUI = null,
    challengeTaskLabels = {},
    deepDiveBuilders = null,
    deepDiveModal = null,
    deepDiveState = null,
    deepDiveUi = null,
    documentRef = document,
    el = (id) => document.getElementById(id),
    getDoneCount = () => 0,
    getRevealChallengeState = () => null,
    getStateWord = () => '',
    getRevealPacingPreset = () => ({ introDelay: 260, betweenDelay: 140, postMeaningDelay: 200 }),
    focusReturnState = {
      get: () => null,
      set: () => {}
    },
    hideInformantHintCard = () => {},
    isConfettiEnabled = () => true,
    isMissionLabEnabled = () => false,
    isMissionLabStandaloneMode = () => false,
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    playMeaningWithFun = async () => {},
    promptLearnerAfterReveal = () => {},
    renderRevealChallengeModal = () => {},
    revealEffects = null,
    runKaraokeGuide = () => {},
    setChallengeFeedback = () => {},
    setRevealChallengeState = () => {},
    startStandaloneMissionLab = () => {},
    shouldNarrateReveal = () => true,
    syncRevealChallengeLaunch = () => {},
    syncRevealMeaningHighlight = () => {},
    uiScaffoldFallback = {},
    waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  } = deps || {};

  let revealNarrationToken = 0;
  let lastModalCelebrateAt = 0;

  function renderRevealChallengeModalOwned() {
    const state = getRevealChallengeState();
    if (!state) return;
    const challenge = state.challenge;
    if (!challenge) return;

    const levelChip = el('challenge-level-chip');
    const wordChip = el('challenge-word-chip');
    const topicChip = el('challenge-topic-chip');
    const gradeChip = el('challenge-grade-chip');
    const roleChip = el('challenge-role-chip');
    const listenTitle = el('challenge-listen-title');
    const analyzeTitle = el('challenge-analyze-title');
    const createTitle = el('challenge-create-title');
    const listenPrompt = el('challenge-listen-prompt');
    const analyzePrompt = el('challenge-analyze-prompt');
    const createPrompt = el('challenge-create-prompt');
    const listenHelper = el('challenge-listen-helper');
    const analyzeHelper = el('challenge-analyze-helper');
    const createHelper = el('challenge-create-helper');
    const teacherLens = el('challenge-teacher-lens');
    const deepDive = state.deepDive || deepDiveBuilders?.buildDeepDiveState?.(state.result);
    const scaffold = deepDiveState?.getChallengeScaffoldProfile?.(state) || uiScaffoldFallback;
    state.deepDive = deepDive;

    if (levelChip) levelChip.textContent = deepDiveBuilders?.getChallengeLevelDisplay?.(challenge.level) || challenge.level;
    if (wordChip) wordChip.textContent = `Word: ${state.word}`;
    if (topicChip) topicChip.textContent = `Quest focus: ${state.topic}`;
    if (gradeChip) gradeChip.textContent = `Grade: ${state.grade}`;
    if (roleChip) roleChip.textContent = `Word type: ${deepDive?.role?.label || 'Target Word'} (${deepDive?.role?.kidLabel || 'word'})`;
    if (listenTitle) listenTitle.textContent = deepDive?.titles?.listen || `1. ${challengeTaskLabels.listen}`;
    if (analyzeTitle) analyzeTitle.textContent = deepDive?.titles?.analyze || `2. ${challengeTaskLabels.analyze}`;
    if (createTitle) createTitle.textContent = deepDive?.titles?.create || `3. ${challengeTaskLabels.create}`;
    if (listenPrompt) listenPrompt.textContent = deepDive?.prompts?.listen || `Tap the key sound chunk in "${state.word}".`;
    if (analyzePrompt) analyzePrompt.textContent = deepDive?.prompts?.analyze || `Pick the best meaning for "${state.word}".`;
    if (createPrompt) createPrompt.textContent = deepDive?.prompts?.create || `Choose the sentence that uses "${state.word}" correctly.`;
    if (listenHelper) listenHelper.textContent = `${deepDive?.helpers?.listen || ''} ${scaffold.listen || ''}`.trim();
    if (analyzeHelper) analyzeHelper.textContent = `${deepDive?.helpers?.analyze || ''} ${scaffold.analyze || ''}`.trim();
    if (createHelper) createHelper.textContent = `${deepDive?.helpers?.create || ''} ${scaffold.create || ''}`.trim();
    if (teacherLens) teacherLens.textContent = `${challenge.teacher} Score updates appear in Specialist Hub.`;

    deepDiveUi?.renderChallengeChoiceButtons?.('challenge-pattern-options', 'listen');
    deepDiveUi?.renderChallengeChoiceButtons?.('challenge-meaning-options', 'analyze');
    deepDiveUi?.renderChallengeChoiceButtons?.('challenge-syntax-options', 'create');
    deepDiveUi?.syncChallengeResponseSummary?.(state);

    setChallengeTaskComplete('listen', !!state.tasks.listen);
    setChallengeTaskComplete('analyze', !!state.tasks.analyze);
    setChallengeTaskComplete('create', !!state.tasks.create);
    const feedbackText = String(el('challenge-live-feedback')?.textContent || '').trim();
    if (!feedbackText) {
      setChallengeFeedback(deepDiveUi?.getChallengeInstructionText?.(state) || '', 'default');
    }
    deepDiveUi?.updateChallengeProgressUI?.();
    deepDiveUi?.syncChallengePacingTimer?.(state);
  }

  function getChallengeModalFocusableElements() {
    const modal = el('challenge-modal');
    if (!modal || modal.classList.contains('hidden')) return [];
    return Array.from(
      modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    )
      .filter((node) => node instanceof HTMLElement)
      .filter((node) => node.getAttribute('aria-hidden') !== 'true')
      .filter((node) => node.getClientRects().length > 0);
  }

  function focusChallengeModalStart() {
    const closeBtn = el('challenge-modal-close');
    const focusTarget = closeBtn || getChallengeModalFocusableElements()[0] || null;
    if (!focusTarget || typeof focusTarget.focus !== 'function') return;
    try {
      focusTarget.focus({ preventScroll: true });
    } catch {
      focusTarget.focus();
    }
  }

  function trapChallengeModalTab(event) {
    const focusables = getChallengeModalFocusableElements();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const currentIndex = focusables.indexOf(active);
    if (event.shiftKey) {
      if (currentIndex <= 0) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (currentIndex === -1 || currentIndex >= focusables.length - 1) {
      event.preventDefault();
      first.focus();
    }
  }

  function openRevealChallengeModal() {
    if (!isMissionLabEnabled()) return;
    const state = getRevealChallengeState();
    if (!state) {
      if (isMissionLabStandaloneMode()) {
        startStandaloneMissionLab();
        return;
      }
      WQUI?.showToast?.('Solve a word first to unlock Deep Dive Quest.');
      return;
    }
    const activeElement = document.activeElement;
    focusReturnState.set(activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null);
    hideInformantHintCard();
    renderRevealChallengeModalOwned();
    el('challenge-modal')?.classList.remove('hidden');
    deepDiveState?.syncChallengeQuickstartCard?.(state);
    focusChallengeModalStart();
    deps.emitTelemetry?.('wq_deep_dive_open', {
      source: state.source || 'reveal'
    });
    deps.emitTelemetry?.('wq_funnel_deep_dive_started', {
      source: state.source || 'reveal',
      word_id: normalizeReviewWord(getStateWord() || state.word),
      level: state.challenge?.level || ''
    });
  }

  function closeRevealChallengeModal(options = {}) {
    const modal = el('challenge-modal');
    const wasOpen = !!modal && !modal.classList.contains('hidden');
    modal?.classList.add('hidden');
    el('challenge-quickstart')?.classList.add('hidden');
    const returnFocusEl = focusReturnState.get();
    focusReturnState.set(null);
    if (wasOpen && options.restoreFocus !== false && returnFocusEl && document.contains(returnFocusEl)) {
      if (typeof returnFocusEl.focus === 'function') {
        try {
          returnFocusEl.focus({ preventScroll: true });
        } catch {
          returnFocusEl.focus();
        }
      }
    }
    if (!options.preserveFeedback) setChallengeFeedback('');
  }

  function cancelRevealNarration() {
    revealNarrationToken += 1;
    WQAudio?.stop?.();
  }

  function setChallengeTaskComplete(task, complete) {
    const revealChallengeState = getRevealChallengeState();
    if (!revealChallengeState || !Object.prototype.hasOwnProperty.call(revealChallengeState.tasks, task)) return;
    const normalized = !!complete;
    const wasComplete = !!revealChallengeState.tasks[task];
    revealChallengeState.tasks[task] = normalized;
    const card = documentRef.querySelector(`[data-challenge-task="${task}"]`);
    const statusChip = el(`challenge-status-${task}`);
    if (card) card.classList.toggle('is-complete', normalized);
    if (statusChip) {
      statusChip.textContent = normalized ? 'Completed' : 'Pending';
      statusChip.classList.toggle('is-complete', normalized);
    }
    if (normalized !== wasComplete) {
      if (normalized) {
        setChallengeFeedback(`${challengeTaskLabels[task] || 'Step'} complete.`, 'good');
      } else {
        setChallengeFeedback(`${challengeTaskLabels[task] || 'Step'} needs one more try.`, 'warn');
      }
    }
    deepDiveState?.saveChallengeDraft?.(revealChallengeState);
    deepDiveUi?.updateChallengeProgressUI?.();
    setRevealChallengeState(revealChallengeState);
  }

  function initDeepDiveCoreFeature(contract) {
    const feature = window.WQDeepDiveCoreFeature?.createFeature?.({
      contract,
      el,
      getRevealChallengeState,
      getDoneCount: (state) => getDoneCount(state),
      setTaskComplete: setChallengeTaskComplete,
      setFeedback: setChallengeFeedback,
      renderModal: (...args) => renderRevealChallengeModal(...args)
    }) || null;
    feature?.publishBridge?.();
    feature?.bindEvents?.();
    return feature;
  }

  async function runRevealNarration(result) {
    if (!result?.entry) return;
    cancelRevealNarration();
    const token = revealNarrationToken;
    const pacing = getRevealPacingPreset();
    syncRevealMeaningHighlight(result.entry);
    syncRevealChallengeLaunch(result);
    if (!shouldNarrateReveal()) {
      await waitMs(Math.min(220, pacing.postMeaningDelay));
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
      return;
    }
    await waitMs(pacing.introDelay);
    if (token !== revealNarrationToken) return;
    try {
      runKaraokeGuide(result.entry);
      await WQAudio?.playWord?.(result.entry);
      if (token !== revealNarrationToken) return;
      await waitMs(pacing.betweenDelay);
      if (token !== revealNarrationToken) return;
      await playMeaningWithFun(result.entry);
      if (token !== revealNarrationToken) return;
      await waitMs(pacing.postMeaningDelay);
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
    } catch {
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
    }
  }

  function bindRevealAudioButtons(entryRef) {
    el('g-hear-word')?.addEventListener('click', () => {
      cancelRevealNarration();
      void WQAudio?.playWord?.(entryRef());
    });
    el('g-hear-def')?.addEventListener('click', () => {
      cancelRevealNarration();
      void playMeaningWithFun(entryRef());
    });
    el('hear-word-btn')?.addEventListener('click', () => {
      cancelRevealNarration();
      void WQAudio?.playWord?.(entryRef());
    });
    el('hear-def-btn')?.addEventListener('click', () => {
      cancelRevealNarration();
      void playMeaningWithFun(entryRef());
    });
    el('hear-sentence-btn')?.addEventListener('click', () => {
      cancelRevealNarration();
      void WQAudio?.playSentence?.(entryRef());
    });
  }

  function bindResultModalCelebration() {
    window.addEventListener('wq:result-modal-open', (event) => {
      const won = !!event?.detail?.won;
      if (!won) return;
      if (!isConfettiEnabled()) return;
      const now = Date.now();
      if (now - lastModalCelebrateAt < 700) return;
      lastModalCelebrateAt = now;
      revealEffects?.launchConfetti?.();
      revealEffects?.launchStars?.();
    });
  }

  function initSupportChoiceCardDrag() {
    const card = el('support-choice-card');
    if (!card) return;
    const handle = card.querySelector('.support-choice-head');
    if (!handle) return;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;
      isDragging = true;
      const rect = card.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      handle.style.cursor = 'grabbing';
    });
    documentRef.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      const maxX = window.innerWidth - card.offsetWidth;
      const maxY = window.innerHeight - card.offsetHeight;
      const x = Math.max(0, Math.min(newX, maxX));
      const y = Math.max(0, Math.min(newY, maxY));
      card.style.left = x + 'px';
      card.style.right = 'auto';
      card.style.top = y + 'px';
    });
    documentRef.addEventListener('pointerup', () => {
      isDragging = false;
      handle.style.cursor = 'grab';
    });
  }

  return Object.freeze({
    bindRevealAudioButtons,
    bindResultModalCelebration,
    cancelRevealNarration,
    closeRevealChallengeModal,
    focusChallengeModalStart,
    getChallengeModalFocusableElements,
    initDeepDiveCoreFeature,
    initSupportChoiceCardDrag,
    openRevealChallengeModal,
    renderRevealChallengeModal: renderRevealChallengeModalOwned,
    runRevealNarration,
    setChallengeTaskComplete
    ,
    trapChallengeModalTab
  });
}

window.createDeepDiveCoreRuntimeModule = createDeepDiveCoreRuntimeModule;
