/**
 * app-deep-dive-core-runtime.js
 * Deep Dive task-state and reveal narration glue that can live outside app-main.
 */

function createDeepDiveCoreRuntimeModule(deps) {
  const {
    WQAudio = null,
    WQUI = null,
    challengeTaskLabels = {},
    deepDiveModal = null,
    deepDiveState = null,
    deepDiveUi = null,
    documentRef = document,
    el = (id) => document.getElementById(id),
    getDoneCount = () => 0,
    getRevealChallengeState = () => null,
    getRevealPacingPreset = () => ({ introDelay: 260, betweenDelay: 140, postMeaningDelay: 200 }),
    isConfettiEnabled = () => true,
    playMeaningWithFun = async () => {},
    promptLearnerAfterReveal = () => {},
    renderRevealChallengeModal = () => {},
    revealEffects = null,
    runKaraokeGuide = () => {},
    setChallengeFeedback = () => {},
    setRevealChallengeState = () => {},
    shouldNarrateReveal = () => true,
    syncRevealChallengeLaunch = () => {},
    syncRevealMeaningHighlight = () => {},
    waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  } = deps || {};

  let revealNarrationToken = 0;
  let lastModalCelebrateAt = 0;

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
    initDeepDiveCoreFeature,
    initSupportChoiceCardDrag,
    runRevealNarration,
    setChallengeTaskComplete
  });
}

window.createDeepDiveCoreRuntimeModule = createDeepDiveCoreRuntimeModule;
