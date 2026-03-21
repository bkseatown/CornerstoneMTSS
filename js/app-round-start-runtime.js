/**
 * app-round-start-runtime.js
 * Owns round-start and next-word setup while app-main keeps core input orchestration.
 */

function createRoundStartRuntimeModule(deps) {
  const {
    DEMO_MODE = false,
    DEMO_TARGET_WORD = '',
    WQGame = null,
    WQUI = null,
    buildPlayableWordSet = () => new Set(),
    cancelRevealNarration = () => {},
    clearClassroomTurnTimer = () => {},
    clearRevealAutoAdvanceTimer = () => {},
    clearSupportModalTimer = () => {},
    clearVoiceClip = () => {},
    closeRevealChallengeModal = () => {},
    demoFlow = null,
    demoState = null,
    demoUi = null,
    demoHelpers = {},
    diagnostics = {},
    drawWaveform = () => {},
    el = () => null,
    emitTelemetry = () => {},
    getEffectiveGameplayGradeBand = (gradeBand) => gradeBand,
    getFocusLabel = (value) => String(value || ''),
    getFirstRunSetupPending = () => false,
    getFocusSupportState = () => ({}),
    getPrefs = () => ({}),
    getVoicePracticeMode = () => 'off',
    getVoiceState = () => ({}),
    hideInformantHintCard = () => {},
    hideMidgameBoost = () => {},
    hideStarterWordCard = () => {},
    hideSupportChoiceCard = () => {},
    isMissionLabStandaloneMode = () => false,
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    onRoundDiagnosticsStart = () => {},
    refreshStandaloneMissionLabHub = () => {},
    resetRoundTracking = () => {},
    scheduleFocusSupportUnlock = () => {},
    scheduleStarterCoachHint = () => {},
    setAvaRuntimeState = () => {},
    setEvidenceSessionId = () => {},
    setFocusSupportState = () => {},
    setGameStartedAt = () => {},
    setMidgameBoostShown = () => {},
    setRuntimeDiagnosticsState = () => {},
    setVoiceState = () => {},
    setWordQuestCoachState = () => {},
    startAvaWordQuestIdleWatcher = () => {},
    startStandaloneMissionLab = () => {},
    stopVoiceCaptureNow = () => {},
    supportUi = {},
    syncAssessmentLockRuntime = () => {},
    syncClassroomTurnRuntime = () => {},
    syncFocusSupportRuntimeState = () => {},
    syncHeaderClueLauncherUI = () => {},
    syncHeaderControlsVisibility = () => {},
    syncKeyboardInputLocks = () => {},
    syncStarterWordLauncherUI = () => {},
    updateFocusHint = () => {},
    updateNextActionLine = () => {},
    updateVoicePracticePanel = () => {},
    updateWordQuestShareButton = () => {},
    wordReview = null,
    windowRef = window
  } = deps || {};

  function newGame(options = {}) {
    if (DEMO_MODE && demoHelpers.getDemoRoundComplete?.() && !options.forceDemoReplay) {
      demoFlow?.showDemoEndOverlay?.(
        demoHelpers.clearTimers,
        demoHelpers.stopCoachReadyLoop,
        demoHelpers.stopKeyPulse
      );
      return;
    }
    if (DEMO_MODE) {
      demoFlow?.closeDemoEndOverlay?.();
      if (options.forceDemoReplay) {
        demoFlow?.resetDemoScriptState?.(
          demoState,
          demoHelpers.stopCoachReadyLoop,
          demoHelpers.clearAutoplayTimer,
          demoHelpers.stopKeyPulse,
          demoHelpers.clearTimers
        );
      }
    }

    setWordQuestCoachState('before_guess');
    emitTelemetry('wq_new_word_click', {
      source: options.launchMissionLab ? 'mission_lab_new' : 'word-quest_new'
    });

    const roundStartedAt = Date.now();
    setFocusSupportState({
      unlockedByMiss: false,
      unlockAt: roundStartedAt + 20000,
      promptShown: false,
      eligibleAt: 0
    });
    setGameStartedAt(roundStartedAt);
    syncFocusSupportRuntimeState();
    clearSupportModalTimer();
    scheduleFocusSupportUnlock();

    hideInformantHintCard();
    hideStarterWordCard();
    hideSupportChoiceCard();
    closeRevealChallengeModal({ silent: true });
    clearClassroomTurnTimer();
    resetRoundTracking();
    setEvidenceSessionId(`sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`);

    if (getFirstRunSetupPending() && !el('first-run-setup-modal')?.classList.contains('hidden')) {
      WQUI?.showToast?.('Pick a setup style or skip for now.');
      return;
    }

    if (isMissionLabStandaloneMode()) {
      if (options.launchMissionLab === false) {
        refreshStandaloneMissionLabHub();
        return;
      }
      startStandaloneMissionLab();
      return;
    }

    if (
      getVoicePracticeMode() === 'required' &&
      !el('modal-overlay')?.classList.contains('hidden') &&
      !getVoiceState().voiceTakeComplete
    ) {
      WQUI?.showToast?.('Record your voice before starting the next word.');
      return;
    }

    clearRevealAutoAdvanceTimer();
    cancelRevealNarration();
    stopVoiceCaptureNow();

    const voiceState = getVoiceState();
    if (voiceState.voicePreviewAudio) {
      voiceState.voicePreviewAudio.pause();
      setVoiceState({ voicePreviewAudio: null });
    }
    clearVoiceClip();
    setVoiceState({ voiceTakeComplete: false });
    drawWaveform();
    hideMidgameBoost();
    setMidgameBoostShown(false);
    setRuntimeDiagnosticsState({
      diagTimer: 0,
      diagSession: null,
      latestSavedSessionId: ''
    });
    updateWordQuestShareButton('');
    setAvaRuntimeState({
      idleFiredThisRound: false,
      lastActionAt: Date.now(),
      lastIdleEmitAt: 0
    });

    const prefs = getPrefs();
    const s = WQUI?.getSettings?.() || {};
    if (DEMO_MODE) {
      s.length = '5';
      s.maxGuesses = 6;
      s.focus = 'all';
    }
    const focus = DEMO_MODE ? 'all' : (el('setting-focus')?.value || prefs.focus || 'all');
    const effectiveGradeBand = getEffectiveGameplayGradeBand(s.gradeBand || 'all', focus);
    const playableSet = buildPlayableWordSet(effectiveGradeBand, s.length, focus);

    const result = WQGame?.startGame?.({
      ...s,
      gradeBand: effectiveGradeBand,
      focus,
      phonics: focus,
      fixedWord: DEMO_MODE ? DEMO_TARGET_WORD : '',
      disableProgress: DEMO_MODE
    });

    if (!result) {
      const startError = typeof WQGame?.getLastStartError === 'function'
        ? WQGame.getLastStartError()
        : null;
      if (startError?.code === 'EMPTY_FILTERED_POOL') {
        const pieces = [];
        if (startError.gradeBand && startError.gradeBand !== 'all') pieces.push(`grade ${startError.gradeBand}`);
        if (startError.phonics && startError.phonics !== 'all') pieces.push(`focus ${getFocusLabel(startError.phonics)}`);
        if (startError.length && startError.length !== 'any') pieces.push(`${startError.length}-letter words`);
        const detail = pieces.length ? ` for ${pieces.join(', ')}` : '';
        WQUI?.showToast?.(`No words available${detail}. Adjust filters or pick Classic.`);
      } else {
        WQUI?.showToast?.('No words found — try Classic focus or adjust filters');
      }
      updateNextActionLine({ dueCount: wordReview?.countDueReviewWords?.(playableSet) || 0 });
      syncHeaderClueLauncherUI();
      syncStarterWordLauncherUI();
      syncClassroomTurnRuntime({ resetTurn: true });
      syncAssessmentLockRuntime();
      return;
    }

    resetRoundTracking(result);
    const startedWord = normalizeReviewWord(result.word);
    const matchedDueReview = wordReview?.findMatchingDueReview?.(startedWord) || null;
    if (matchedDueReview) wordReview?.consumeReviewItem?.(matchedDueReview);

    WQUI?.calcLayout?.(result.wordLength, result.maxGuesses);
    WQUI?.buildBoard?.(result.wordLength, result.maxGuesses);
    WQUI?.buildKeyboard?.();
    syncKeyboardInputLocks(WQGame?.getState?.() || {});
    WQUI?.hideModal?.();
    el('new-game-btn')?.classList.remove('pulse');
    el('settings-panel')?.classList.add('hidden');
    syncClassroomTurnRuntime({ resetTurn: true });
    syncHeaderControlsVisibility();
    supportUi.removeDupeToast?.();
    updateVoicePracticePanel(WQGame?.getState?.());
    updateFocusHint();
    updateNextActionLine({ dueCount: wordReview?.countDueReviewWords?.(playableSet) || 0 });
    syncHeaderClueLauncherUI();
    syncStarterWordLauncherUI();
    scheduleStarterCoachHint();
    syncAssessmentLockRuntime();
    startAvaWordQuestIdleWatcher();
    onRoundDiagnosticsStart(result);

    if (DEMO_MODE) {
      demoFlow?.runDemoCoachForStart?.(
        demoHelpers.clearAutoplayTimer,
        { set: demoHelpers.setAutoplayTimer },
        demoState,
        demoHelpers.stopCoachReadyLoop,
        demoHelpers.stopKeyPulse,
        demoHelpers.clearTimers
      );
    }
    if (!DEMO_MODE) demoUi?.positionDemoLaunchButton?.();

    const gameBoard = el('game-board');
    if (gameBoard && typeof gameBoard.focus === 'function') {
      windowRef.setTimeout(() => gameBoard.focus(), 50);
    }
  }

  return {
    newGame
  };
}

window.createRoundStartRuntimeModule = createRoundStartRuntimeModule;
