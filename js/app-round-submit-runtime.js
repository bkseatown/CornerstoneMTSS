/**
 * app-round-submit-runtime.js
 * Owns guess submission, reveal callbacks, and round-complete transitions.
 */

function createRoundSubmitRuntimeModule(deps) {
  const {
    DEMO_MODE = false,
    FEATURES = {},
    MIDGAME_BOOST_ENABLED = false,
    WQGame = null,
    WQUI = null,
    applyTheme = () => {},
    awardQuestProgress = () => {},
    buildPlayableWordSet = () => new Set(),
    buildRoundMetrics = () => ({}),
    clearClassroomTurnTimer = () => {},
    clearFocusSupportUnlockTimer = () => {},
    closeRevealChallengeModal = () => {},
    demoFlow = null,
    demoSetTimeoutRef = setTimeout,
    demoState = null,
    demoUi = null,
    el = () => null,
    emitTelemetry = () => {},
    getActiveDiagnosticsSession = () => null,
    getCurrentRoundFlags = () => ({}),
    getCurrentTheme = () => '',
    getDiagnosticsApi = () => null,
    getDiagnosticsTimer = () => 0,
    getEffectiveGameplayGradeBand = (value) => value,
    getGameplayPrefs = () => ({}),
    getMidgameBoostShown = () => false,
    getThemeFallback = () => 'seahawks',
    getWrongStreakMeta = () => ({}),
    hideDemoCoach = () => {},
    hideMidgameBoost = () => {},
    maybeAutoShowStarterWords = () => {},
    maybeShowErrorCoach = () => {},
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    onDemoReplayRequested = () => {},
    onGuessAccepted = () => {},
    onGuessTooShort = () => {},
    onRevealContinue = () => {},
    onRevealLostOrWon = () => {},
    publishWordQuestSignals = () => {},
    recordAvaWordQuestEvent = () => {},
    refreshStarterSuggestionsIfOpen = () => {},
    renderSafeStreak = () => {},
    revealFlowSupport = null,
    setAvaStreakState = () => {},
    setDiagnosticsState = () => {},
    setFocusSupportState = () => {},
    setMidgameBoostShown = () => {},
    setWordQuestCoachState = () => {},
    showMidgameBoost = () => {},
    speakAvaWordQuestAdaptive = () => {},
    startNewGame = () => {},
    stopAvaWordQuestIdleWatcher = () => {},
    syncAssessmentLockRuntime = () => {},
    syncFocusSupportRuntimeState = () => {},
    syncHeaderClueLauncherUI = () => {},
    syncKeyboardInputLocks = () => {},
    syncStarterWordLauncherUI = () => {},
    updateClassroomTurnLine = () => {},
    updateNextActionLine = () => {},
    wordReview = null
  } = deps || {};

  function submitCurrentGuess(state) {
    const themeAtSubmit = getCurrentTheme();
    const result = WQGame?.submitGuess?.();
    if (!result) return false;

    emitTelemetry('wq_guess_submit', {
      guess_index: (Array.isArray(result?.guesses) ? result.guesses.length : 0) || 0,
      guess_length: String(result?.guess || '').length,
      submit_result: result.error ? String(result.error) : 'accepted'
    });

    if (result.error === 'too_short') {
      onGuessTooShort(state);
      return true;
    }

    try {
      const diagSession = getActiveDiagnosticsSession();
      const diagnosticsApi = getDiagnosticsApi();
      if (diagSession && diagnosticsApi && typeof diagnosticsApi.addGuess === 'function') {
        diagnosticsApi.addGuess(
          diagSession,
          result.guess,
          deps.mapGuessFeedbackToSignalStates?.(result.result) || []
        );
      }
    } catch {}

    if (!result.won) {
      const wrongMeta = getWrongStreakMeta();
      const nextWrongStreak = (Number(wrongMeta.wrongStreak) || 0) + 1;
      setAvaStreakState({
        wrongStreak: nextWrongStreak,
        correctStreak: 0,
        totalWrong: (Number(wrongMeta.totalWrong) || 0) + 1
      });
      recordAvaWordQuestEvent('wrong_guess');
      setFocusSupportState({
        unlockedByMiss: true,
        eligibleAt: Date.now() + 30000
      });
      syncFocusSupportRuntimeState();
      clearFocusSupportUnlockTimer();
      deps.scheduleSupportModalTimer?.();
      syncHeaderClueLauncherUI();
      syncStarterWordLauncherUI();
      if (!result.lost && Number(result.guesses?.length || 0) === 1) {
        setWordQuestCoachState('after_first_miss');
        speakAvaWordQuestAdaptive('after_first_miss');
      } else if (!result.lost && Number(result.guesses?.length || 0) === 2) {
        speakAvaWordQuestAdaptive('after_second_miss');
      }
      if (!result.lost && nextWrongStreak >= 3 && Number(wrongMeta.rapidEventsLength || 0) >= 6) {
        speakAvaWordQuestAdaptive('rapid_wrong_streak');
      }
    } else {
      const wrongMeta = getWrongStreakMeta();
      const nextCorrectStreak = (Number(wrongMeta.correctStreak) || 0) + 1;
      setAvaStreakState({
        correctStreak: nextCorrectStreak,
        wrongStreak: 0,
        totalCorrect: (Number(wrongMeta.totalCorrect) || 0) + 1
      });
      recordAvaWordQuestEvent('correct_guess');
      speakAvaWordQuestAdaptive(nextCorrectStreak >= 2 ? 'streak_three_correct' : 'near_solve');
    }

    const row = result.guesses.length - 1;
    WQUI?.revealRow?.(result.guess, result.result, row, state.wordLength, () => {
      if (getCurrentTheme() !== themeAtSubmit) applyTheme(themeAtSubmit);
      WQUI?.updateKeyboard?.(result.result, result.guess);
      syncKeyboardInputLocks(WQGame?.getState?.() || {});
      revealFlowSupport?.checkDuplicates?.(result);

      if (
        MIDGAME_BOOST_ENABLED &&
        !result.won &&
        !result.lost &&
        !getMidgameBoostShown() &&
        result.guesses.length === (deps.midgameBoostTriggerGuess || 3)
      ) {
        setMidgameBoostShown(true);
        showMidgameBoost();
      }

      if (result.won || result.lost) {
        if (result.won) {
          if (FEATURES.streakSystem) {
            deps.incrementStreak?.();
            renderSafeStreak();
          }
          WQUI?.celebrateWinRow?.(row, state.wordLength);
        }
        stopAvaWordQuestIdleWatcher('round complete');
        try {
          const timer = getDiagnosticsTimer();
          if (timer) clearTimeout(timer);
          const diagSession = getActiveDiagnosticsSession();
          const diagnosticsApi = getDiagnosticsApi();
          if (diagSession && diagnosticsApi && typeof diagnosticsApi.endSession === 'function') {
            const wqSignals = diagnosticsApi.endSession(diagSession, !!result.won);
            setDiagnosticsState({ timer: 0, session: null });
            if (wqSignals) {
              const flags = getCurrentRoundFlags();
              publishWordQuestSignals(wqSignals, {
                soft: false,
                helpUsed: !!flags.hintRequested || !!flags.starterWordsShown
              });
            }
          } else {
            setDiagnosticsState({ timer: 0 });
          }
        } catch {}
        if (result.won) setWordQuestCoachState('after_correct');
        const roundMetrics = buildRoundMetrics(result, state.maxGuesses);
        const guessesUsed = Math.max(1, Number(roundMetrics.guessesUsed) || 1);
        const zpdInBand = Boolean(
          (result.won && guessesUsed >= 3 && guessesUsed <= 5) ||
          (!result.won && result.lost && guessesUsed >= 5 && !!roundMetrics.hintRequested)
        );
        emitTelemetry('wq_round_complete', {
          word_id: normalizeReviewWord(result.word),
          won: !!result.won,
          lost: !!result.lost,
          guesses_used: guessesUsed,
          max_guesses: Number(state.maxGuesses) || null,
          hint_used: !!roundMetrics.hintRequested,
          voice_attempts: Math.max(0, Number(roundMetrics.voiceAttempts) || 0),
          duration_ms: Math.max(0, Number(roundMetrics.durationMs) || 0),
          skill_key: roundMetrics.skillKey,
          skill_label: roundMetrics.skillLabel,
          zpd_in_band: zpdInBand
        });
        clearClassroomTurnTimer();
        updateClassroomTurnLine();
        if (!DEMO_MODE) {
          awardQuestProgress(result, roundMetrics);
          wordReview?.trackRoundForReview?.(result, state.maxGuesses, roundMetrics);
        }
        onRevealLostOrWon(result);
        hideMidgameBoost();
        setMidgameBoostShown(false);
        syncAssessmentLockRuntime();
        const prefs = getGameplayPrefs();
        const focusNow = el('setting-focus')?.value || prefs.focus || 'all';
        const activeGradeBand = getEffectiveGameplayGradeBand(el('s-grade')?.value || 'all', focusNow);
        const dueCountNow = wordReview?.countDueReviewWords?.(
          buildPlayableWordSet(activeGradeBand, el('s-length')?.value || 'any', focusNow)
        ) || 0;
        updateNextActionLine({ dueCount: dueCountNow });
        setTimeout(() => {
          if (DEMO_MODE) {
            WQUI?.hideModal?.();
            closeRevealChallengeModal({ silent: true });
            hideDemoCoach();
            el('new-game-btn')?.classList.remove('pulse');
            const timerId = demoSetTimeoutRef(() => {
              onDemoReplayRequested();
              startNewGame({ forceDemoReplay: true });
            }, 2800);
            deps.setDemoAutoplayTimer?.(timerId);
          } else {
            WQUI?.showModal?.(result);
            el('new-game-btn')?.classList.add('pulse');
          }
          if (getCurrentTheme() !== themeAtSubmit) applyTheme(themeAtSubmit);
        }, 520);
      } else {
        if (DEMO_MODE) demoFlow?.runDemoCoachAfterGuess?.(result, demoState);
        maybeShowErrorCoach(result);
        maybeAutoShowStarterWords(result);
        deps.advanceTeamTurn?.();
        updateNextActionLine();
        if (!DEMO_MODE) demoUi?.positionDemoLaunchButton?.();
        refreshStarterSuggestionsIfOpen();
        onRevealContinue(result);
      }
    });

    onGuessAccepted(result);
    return true;
  }

  return {
    submitCurrentGuess
  };
}

window.createRoundSubmitRuntimeModule = createRoundSubmitRuntimeModule;
