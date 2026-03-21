/**
 * app-deep-dive-modal.js
 * Deep Dive modal rendering, focus trapping, and open/close helpers.
 */

function createDeepDiveModalModule(deps) {
  const {
    challengeTaskLabels = {},
    deepDiveBuilders = null,
    deepDiveState = null,
    deepDiveUi = null,
    el = () => null,
    emitTelemetry = () => {},
    focusReturnState = {
      get: () => null,
      set: () => {}
    },
    getRevealChallengeState = () => null,
    getStateWord = () => '',
    hideInformantHintCard = () => {},
    isMissionLabEnabled = () => false,
    isMissionLabStandaloneMode = () => false,
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    setChallengeFeedback = () => {},
    setTaskComplete = () => {},
    startStandaloneMissionLab = () => {},
    uiScaffoldFallback = {}
  } = deps || {};

  function renderRevealChallengeModal() {
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

    setTaskComplete('listen', !!state.tasks.listen);
    setTaskComplete('analyze', !!state.tasks.analyze);
    setTaskComplete('create', !!state.tasks.create);
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
      window.WQUI?.showToast?.('Solve a word first to unlock Deep Dive Quest.');
      return;
    }
    const activeElement = document.activeElement;
    focusReturnState.set(activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null);
    hideInformantHintCard();
    renderRevealChallengeModal();
    el('challenge-modal')?.classList.remove('hidden');
    deepDiveState?.syncChallengeQuickstartCard?.(state);
    focusChallengeModalStart();
    emitTelemetry('wq_deep_dive_open', {
      source: state.source || 'reveal'
    });
    emitTelemetry('wq_funnel_deep_dive_started', {
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

  return {
    closeRevealChallengeModal,
    focusChallengeModalStart,
    getChallengeModalFocusableElements,
    openRevealChallengeModal,
    renderRevealChallengeModal,
    trapChallengeModalTab
  };
}
