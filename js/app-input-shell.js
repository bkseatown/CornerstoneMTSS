/**
 * app-input-shell.js
 * Global input shell and surface event wiring around the gameplay core.
 */

function createInputShellModule(deps) {
  const {
    closePhonicsClueModal = () => {},
    closeQuickPopover = () => {},
    demoFlow = null,
    demoState = null,
    demoUi = null,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getDemoMode = () => false,
    getDemoToastAutoCollapsedByPlay = () => false,
    getDemoToastElements = () => ({ toast: null, chip: null }),
    getFirstRunSetupPending = () => false,
    getFocusSearchOpen = () => false,
    getGameState = () => null,
    getHelpModalOpen = () => false,
    getMissionLabStandaloneMode = () => false,
    getMusicPopoverOpen = () => false,
    getPhonicsClueOpen = () => false,
    getQuickPopoverThemeOpen = () => false,
    getRevealChallengeOpen = () => false,
    getStarterWordOpen = () => false,
    getSupportChoiceOpen = () => false,
    handleInputUnit = () => {},
    handleKey = () => {},
    hideListeningModeExplainer = () => {},
    hideStarterWordCard = () => {},
    hideSupportChoiceCard = () => {},
    isEditableTarget = () => false,
    isMissionLabStandaloneMode = () => false,
    isPlayMode = () => true,
    onGameplayInteraction = () => {},
    onSetDemoToastAutoCollapsedByPlay = () => {},
    onVisibilityResume = () => {},
    onVisibilitySuspend = () => {},
    openVoicePracticeAndRecord = () => {},
    positionDemoLaunchButton = () => {},
    setChallengeFeedback = () => {},
    setQuestValue = () => {},
    showInformantHintToast = () => {},
    showSupportChoiceCard = () => {},
    showStarterWordCard = () => {},
    startStandaloneMissionLab = () => {},
    updatePhonicsClueControlsFromUI = () => {},
    renderPhonicsCluePanel = () => {},
    startPhonicsClueDeck = async () => {},
    awardPhonicsClueGuessPoint = () => {},
    awardPhonicsClueBonusPoint = () => {},
    advancePhonicsClueCard = () => {},
    skipPhonicsClueCard = () => {},
    togglePhonicsClueTargetVisibility = () => {},
    refreshStandaloneMissionLabHub = () => {},
    windowRef = window
  } = deps || {};

  function initGlobalKeydown() {
    documentRef.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      onGameplayInteraction();
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const demoMode = getDemoMode();
      const { toast: demoToastEl, chip: demoToastChipEl } = getDemoToastElements();
      if (demoMode && event.key === 'Escape' && demoToastEl && !demoToastEl.classList.contains('hidden')) {
        event.preventDefault();
        demoUi?.collapseDemoToast?.();
        return;
      }
      if (getHelpModalOpen()) {
        if (event.key === 'Escape') hideListeningModeExplainer();
        return;
      }
      if (getPhonicsClueOpen()) {
        if (event.key === 'Escape') closePhonicsClueModal();
        return;
      }
      if (getRevealChallengeOpen()) {
        if (event.key === 'Escape') {
          event.preventDefault();
          deps.deepDiveModal?.closeRevealChallengeModal?.();
        } else if (event.key === 'Tab') {
          deps.deepDiveModal?.trapChallengeModalTab?.(event);
        }
        return;
      }
      const endModalOpen = !(el('end-modal')?.classList.contains('hidden'));
      if (endModalOpen) {
        if (event.key === ' ' || event.code === 'Space') {
          event.preventDefault();
          el('new-game-btn')?.click();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          el('new-game-btn')?.click();
          return;
        }
      }
      if (getQuickPopoverThemeOpen() || getMusicPopoverOpen()) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeQuickPopover('all');
          return;
        }
        if (getQuickPopoverThemeOpen() && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
          const direction = (event.key === 'ArrowLeft' || event.key === 'ArrowUp') ? -1 : 1;
          if (windowRef.WQThemeNav && typeof windowRef.WQThemeNav.cycleTheme === 'function') {
            event.preventDefault();
            windowRef.WQThemeNav.cycleTheme(direction);
          }
          return;
        }
        if (!(getMusicPopoverOpen() && (/^[a-zA-Z]$/.test(event.key) || event.key === 'Enter' || event.key === 'Backspace'))) {
          return;
        }
      }
      if (getStarterWordOpen() && event.key === 'Escape') {
        event.preventDefault();
        hideStarterWordCard();
        return;
      }
      if (getMissionLabStandaloneMode() || isMissionLabStandaloneMode()) return;
      const activeEl = documentRef.activeElement;
      const shouldReleaseThemeNavFocus =
        activeEl?.closest?.('#wq-theme-nav') &&
        (event.key === 'Enter' || event.key === 'Backspace' || /^[a-zA-Z]$/.test(event.key));
      if (shouldReleaseThemeNavFocus) {
        activeEl.blur();
        event.preventDefault();
      } else if (isEditableTarget(event.target)) {
        return;
      }
      if (getFocusSearchOpen()) return;
      const nextKey = event.key === 'Backspace' ? 'Backspace' : event.key;
      const isGameplayKey = nextKey === 'Enter' || nextKey === 'Backspace' || /^[a-zA-Z]$/.test(nextKey);
      if (isGameplayKey) event.preventDefault();
      handleInputUnit(nextKey);
      if (/^[a-zA-Z]$/.test(event.key)) {
        const btn = documentRef.querySelector(`.key[data-key="${event.key.toLowerCase()}"]`);
        if (btn) {
          btn.classList.add('wq-press');
          setTimeout(() => btn.classList.remove('wq-press'), 220);
        }
      }
    });
  }

  function initPointerShell() {
    documentRef.addEventListener('pointerdown', (event) => {
      onGameplayInteraction();
      const demoMode = getDemoMode();
      const { toast: demoToastEl, chip: demoToastChipEl } = getDemoToastElements();
      if (!demoMode || !(demoToastEl instanceof HTMLElement)) return;
      if (demoToastEl.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (demoToastEl.contains(target)) return;
      if (demoToastChipEl instanceof HTMLElement && demoToastChipEl.contains(target)) return;
      demoUi?.collapseDemoToast?.();
    }, { passive: true });

    documentRef.addEventListener('pointerdown', (event) => {
      const card = el('starter-word-card');
      if (!card || card.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (card.contains(target)) return;
      if (target instanceof Element && target.closest('#starter-word-open-btn')) return;
      hideStarterWordCard();
    }, { passive: true });

    documentRef.addEventListener('pointerdown', (event) => {
      const card = el('support-choice-card');
      if (!card || card.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (card.contains(target)) return;
      if (target instanceof Element && target.closest('#starter-word-open-btn, #phonics-clue-open-btn, #focus-help-btn')) return;
      hideSupportChoiceCard();
    }, { passive: true });
  }

  function initVisibilityShell() {
    documentRef.addEventListener('visibilitychange', () => {
      if (documentRef.hidden) {
        onVisibilitySuspend();
        return;
      }
      if (isPlayMode()) onVisibilityResume();
    });
  }

  function initKeyboardSurface() {
    el('keyboard')?.addEventListener('click', (event) => {
      const btn = event.target.closest('.key');
      if (!btn) return;
      btn.classList.add('wq-press');
      setTimeout(() => btn.classList.remove('wq-press'), 220);
      const unit = btn.dataset.seq || btn.dataset.key;
      handleInputUnit(unit);
    });
  }

  function initButtons() {
    el('new-game-btn')?.addEventListener('click', deps.newGame);
    el('play-again-btn')?.addEventListener('click', deps.newGame);
    el('phonics-clue-open-btn')?.addEventListener('click', () => {
      const playStyle = String(el('s-play-style')?.value || 'detective').toLowerCase();
      const state = deps.getGameState?.() || null;
      if (playStyle === 'detective' && state?.word && !state.gameOver) {
        showSupportChoiceCard(state);
        return;
      }
      showInformantHintToast();
    });
    el('focus-help-btn')?.addEventListener('click', () => {
      if (getSupportChoiceOpen()) {
        hideSupportChoiceCard();
        return;
      }
      showSupportChoiceCard();
    });
    el('starter-word-open-btn')?.addEventListener('click', () => {
      if (getStarterWordOpen()) {
        hideStarterWordCard();
        return;
      }
      showStarterWordCard({ source: 'manual' });
    });
    el('starter-word-refresh-btn')?.addEventListener('click', () => showStarterWordCard({ source: 'manual' }));
    el('starter-word-close-btn')?.addEventListener('click', () => hideStarterWordCard());
    el('starter-word-close-icon')?.addEventListener('click', () => hideStarterWordCard());
    el('support-choice-suggestion')?.addEventListener('click', () => {
      const never = el('support-choice-never');
      if (never?.checked) deps.setSupportPromptMode?.('off');
      hideSupportChoiceCard();
      showStarterWordCard({ source: 'manual' });
    });
    el('support-choice-clue')?.addEventListener('click', () => {
      const never = el('support-choice-never');
      if (never?.checked) deps.setSupportPromptMode?.('off');
      hideSupportChoiceCard();
      showInformantHintToast({ force: true });
    });
    el('support-choice-close')?.addEventListener('click', () => {
      const never = el('support-choice-never');
      if (never?.checked) deps.setSupportPromptMode?.('off');
      hideSupportChoiceCard();
    });
    el('listening-mode-close')?.addEventListener('click', () => hideListeningModeExplainer());
    el('listening-mode-overlay')?.addEventListener('pointerdown', (event) => {
      if (event.target?.id !== 'listening-mode-overlay') return;
      hideListeningModeExplainer();
    });
    el('phonics-clue-close')?.addEventListener('click', () => closePhonicsClueModal());
    el('phonics-clue-modal')?.addEventListener('pointerdown', (event) => {
      if (event.target?.id !== 'phonics-clue-modal') return;
      closePhonicsClueModal();
    });
    el('phonics-clue-deck-select')?.addEventListener('change', () => {
      updatePhonicsClueControlsFromUI();
      renderPhonicsCluePanel();
    });
    el('phonics-clue-context-select')?.addEventListener('change', () => {
      updatePhonicsClueControlsFromUI();
      renderPhonicsCluePanel();
    });
    el('phonics-clue-timer-select')?.addEventListener('change', () => {
      updatePhonicsClueControlsFromUI();
      if (deps.getPhonicsClueStarted?.() && deps.getPhonicsClueCurrent?.()) {
        deps.startPhonicsClueTurnTimer?.();
      } else {
        renderPhonicsCluePanel();
      }
    });
    el('phonics-clue-bonus-select')?.addEventListener('change', () => {
      updatePhonicsClueControlsFromUI();
      renderPhonicsCluePanel();
    });
    el('phonics-clue-start-btn')?.addEventListener('click', () => { void startPhonicsClueDeck(); });
    el('phonics-clue-guess-btn')?.addEventListener('click', () => awardPhonicsClueGuessPoint());
    el('phonics-clue-bonus-btn')?.addEventListener('click', () => awardPhonicsClueBonusPoint());
    el('phonics-clue-next-btn')?.addEventListener('click', () => advancePhonicsClueCard());
    el('phonics-clue-skip-btn')?.addEventListener('click', () => skipPhonicsClueCard());
    el('phonics-clue-hide-btn')?.addEventListener('click', () => togglePhonicsClueTargetVisibility());
    el('mission-lab-start-btn')?.addEventListener('click', () => startStandaloneMissionLab());
    el('mission-lab-word-select')?.addEventListener('change', () => refreshStandaloneMissionLabHub());
    el('mission-lab-level-select')?.addEventListener('change', () => {
      const note = el('mission-lab-hub-note');
      const level = deps.normalizeThinkingLevel?.(el('mission-lab-level-select')?.value || '', '') || '';
      if (!note || !level) return;
      note.textContent = `Selected thinking target: ${deps.getChallengeLevelDisplay?.(level) || level}. Start Deep Dive when ready.`;
    });
    el('modal-auto-next-cancel')?.addEventListener('click', () => {
      deps.clearRevealAutoAdvanceTimer?.();
      deps.showToast?.('Auto next canceled for this reveal.');
    });
    el('modal-overlay')?.addEventListener('pointerdown', (event) => {
      if (event.target?.id !== 'modal-overlay') return;
      deps.newGame?.();
    });
    el('modal-open-challenge')?.addEventListener('click', () => deps.deepDiveModal?.openRevealChallengeModal?.());
    el('challenge-modal-close')?.addEventListener('click', () => deps.deepDiveModal?.closeRevealChallengeModal?.());
    el('challenge-modal')?.addEventListener('pointerdown', (event) => {
      if (event.target?.id !== 'challenge-modal') return;
      deps.deepDiveModal?.closeRevealChallengeModal?.();
    });
    el('challenge-modal')?.addEventListener('click', (event) => {
      const button = event.target?.closest?.('button[data-challenge-choice-task]');
      if (!button) return;
      const task = String(button.dataset.challengeChoiceTask || '').trim();
      const choiceId = String(button.dataset.choiceId || '').trim();
      if (!task || !choiceId) return;
      deps.deepDiveUi?.handleChallengeChoiceSelection?.(task, choiceId);
    });
    el('challenge-station-progress')?.addEventListener('click', (event) => {
      const pill = event.target?.closest?.('button[data-challenge-station]');
      if (!pill || !deps.getRevealChallengeState?.()) return;
      const task = String(pill.dataset.challengeStation || '').trim();
      if (!deps.challengeTaskFlow?.includes?.(task)) return;
      const firstIncomplete = deps.deepDiveUi?.getFirstIncompleteChallengeTask?.(deps.getRevealChallengeState()) || '';
      const lockedIndex = deps.challengeTaskFlow.indexOf(firstIncomplete);
      const requestedIndex = deps.challengeTaskFlow.indexOf(task);
      if (lockedIndex >= 0 && requestedIndex > lockedIndex) {
        setChallengeFeedback('Finish this step first.', 'warn');
        return;
      }
      deps.setRevealChallengeActiveTask?.(task);
      deps.deepDiveModal?.renderRevealChallengeModal?.();
    });
    el('challenge-next-station')?.addEventListener('click', () => {
      const state = deps.getRevealChallengeState?.();
      if (!state || state.completedAt) return;
      const nextTask = deps.deepDiveUi?.getNextChallengeTask?.(state, state.activeTask) || '';
      if (!nextTask) return;
      deps.setRevealChallengeActiveTask?.(nextTask);
      deps.deepDiveModal?.renderRevealChallengeModal?.();
      setChallengeFeedback('Next step is ready.', 'default');
    });
    el('challenge-hear-word')?.addEventListener('click', () => deps.playChallengeWord?.());
    el('challenge-hear-sentence')?.addEventListener('click', () => deps.playChallengeSentence?.());
    el('challenge-open-practice')?.addEventListener('click', () => {
      deps.deepDiveModal?.closeRevealChallengeModal?.({ silent: true, restoreFocus: false });
      openVoicePracticeAndRecord({ autoStart: true });
    });
    el('challenge-save-reflection')?.addEventListener('click', () => deps.deepDiveSession?.saveRevealChallengeResponses?.());
    el('challenge-quickstart-dismiss')?.addEventListener('click', () => deps.dismissChallengeQuickstart?.());
    el('challenge-finish-btn')?.addEventListener('click', () => deps.deepDiveSession?.finishRevealChallenge?.());
  }

  function init() {
    initGlobalKeydown();
    initPointerShell();
    initVisibilityShell();
    initKeyboardSurface();
    initButtons();
  }

  return { init };
}

window.createInputShellModule = createInputShellModule;
