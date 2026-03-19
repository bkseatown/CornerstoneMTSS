/**
 * app-input.js
 * Keyboard, mouse, touch input handling
 */

import { prefs } from './app-prefs.js';

// DOM helper
const _el = id => document.getElementById(id);

  // ─── 8. Input handling ──────────────────────────────
  function insertSequenceIntoGuess(sequence) {
    const letters = String(sequence || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!letters) return;
    const state = WQGame.getState();
    if (state.gameOver) return;
    const remaining = Math.max(0, state.wordLength - state.guess.length);
    if (!remaining) return;
    const clipped = letters.slice(0, remaining);
    if (!clipped) return;
    for (const letter of clipped) WQGame.addLetter(letter);
    const nextState = WQGame.getState();
    WQUI.updateCurrentRow(nextState.guess, nextState.wordLength, nextState.guesses.length);
  }

  function handleInputUnit(rawUnit) {
    const unit = String(rawUnit || '');
    if (!unit) return;
    if (unit === 'Enter') {
      handleKey('Enter');
      return;
    }
    if (unit === 'Backspace' || unit === '⌫') {
      handleKey('Backspace');
      return;
    }
    if (/^[a-zA-Z]$/.test(unit)) {
      handleKey(unit);
      return;
    }
    if (/^[a-z]{2,4}$/i.test(unit)) {
      insertSequenceIntoGuess(unit);
    }
  }

  function handleKey(key) {
    avaWqLastActionAt = Date.now();
    if (DEMO_MODE && !demoToastAutoCollapsedByPlay) {
      const normalized = String(key || '');
      if (normalized === 'Enter' || normalized === 'Backspace' || /^[a-zA-Z]$/.test(normalized)) {
        demoToastAutoCollapsedByPlay = true;
        collapseDemoToast();
      }
    }
    clearStarterCoachTimer();
    if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
      hideInformantHintCard();
    }
    if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
      hideStarterWordCard();
    }
    if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
      hideSupportChoiceCard();
    }
    // Close music player when user starts typing a guess
    if (/^[a-zA-Z]$/.test(key) && !_el('quick-music-strip')?.classList.contains('hidden')) {
      closeQuickPopover('music');
    }
    if (firstRunSetupPending && !_el('first-run-setup-modal')?.classList.contains('hidden')) return;
    const s = WQGame.getState();
    if (s.gameOver) return;

    if (key === 'Enter') {
      const themeAtSubmit = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
      const result = WQGame.submitGuess();
      if (!result) return;
      emitTelemetry('wq_guess_submit', {
        guess_index: (Array.isArray(result?.guesses) ? result.guesses.length : 0) || 0,
        guess_length: String(result?.guess || '').length,
        submit_result: result.error ? String(result.error) : 'accepted'
      });
      if (result.error === 'too_short') {
        WQUI.showToast('Fill in all the letters first');
        WQUI.shakeRow(s.guesses, s.wordLength);
        updateNextActionLine();
        syncKeyboardInputLocks(WQGame.getState?.() || {});
        if (!DEMO_MODE) positionDemoLaunchButton();
        return;
      }
      try {
        if (_wqDiagSession && window.CSWQDiagnostics && typeof window.CSWQDiagnostics.addGuess === 'function') {
          window.CSWQDiagnostics.addGuess(
            _wqDiagSession,
            result.guess,
            mapGuessFeedbackToSignalStates(result.result)
          );
        }
      } catch {}

      if (!result.won) {
        avaWqWrongStreak += 1;
        avaWqCorrectStreak = 0;
        avaWqTotalWrong += 1;
        recordAvaWordQuestEvent('wrong_guess');
        focusSupportUnlockedByMiss = true;
        clearFocusSupportUnlockTimer();
        scheduleSupportModalTimer();  // Start timer for showing support modal after 30 seconds
        syncHeaderClueLauncherUI();
        syncStarterWordLauncherUI();
        if (!result.lost && Number(result.guesses?.length || 0) === 1) {
          setWordQuestCoachState('after_first_miss');
          speakAvaWordQuestAdaptive('after_first_miss');
        } else if (!result.lost && Number(result.guesses?.length || 0) === 2) {
          speakAvaWordQuestAdaptive('after_second_miss');
        }
        if (!result.lost && avaWqWrongStreak >= 3 && avaWqRapidEvents.length >= 6) {
          speakAvaWordQuestAdaptive('rapid_wrong_streak');
        }
        // Note: showSupportChoiceCard is not called here because it has a 30-second delay check.
        // The modal will appear automatically when 30 seconds have elapsed (checked via gameStartedAt timer)
      } else {
        avaWqCorrectStreak += 1;
        avaWqWrongStreak = 0;
        avaWqTotalCorrect += 1;
        recordAvaWordQuestEvent('correct_guess');
        if (avaWqCorrectStreak >= 2) {
          speakAvaWordQuestAdaptive('streak_three_correct');
        } else {
          speakAvaWordQuestAdaptive('near_solve');
        }
      }

      const row = result.guesses.length - 1;
      WQUI.revealRow(result.guess, result.result, row, s.wordLength, () => {
        if (normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()) !== themeAtSubmit) {
          applyTheme(themeAtSubmit);
        }
        WQUI.updateKeyboard(result.result, result.guess);
        syncKeyboardInputLocks(WQGame.getState?.() || {});
        checkDuplicates(result);
        if (
          MIDGAME_BOOST_ENABLED &&
          !result.won &&
          !result.lost &&
          !midgameBoostShown &&
          result.guesses.length === MIDGAME_BOOST_TRIGGER_GUESS
        ) {
          midgameBoostShown = true;
          showMidgameBoost();
        }
        if (result.won || result.lost) {
          if (result.won) {
            if (FEATURES.streakSystem) {
              incrementStreak();
              renderSafeStreak();
            }
            WQUI.celebrateWinRow?.(row, s.wordLength);
          }
          stopAvaWordQuestIdleWatcher('round complete');
          try {
            if (_wqDiagTimer) {
              clearTimeout(_wqDiagTimer);
              _wqDiagTimer = null;
            }
            if (_wqDiagSession && window.CSWQDiagnostics && typeof window.CSWQDiagnostics.endSession === 'function') {
              const wqSignals = window.CSWQDiagnostics.endSession(_wqDiagSession, !!result.won);
              _wqDiagSession = null;
              if (wqSignals) publishWordQuestSignals(wqSignals, {
                soft: false,
                helpUsed: !!currentRoundHintRequested || !!currentRoundStarterWordsShown
              });
            }
          } catch {}
          if (result.won) setWordQuestCoachState('after_correct');
          const roundMetrics = buildRoundMetrics(result, s.maxGuesses);
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
            max_guesses: Number(s.maxGuesses) || null,
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
            trackRoundForReview(result, s.maxGuesses, roundMetrics);
          }
          resetRoundTracking();
          hideMidgameBoost();
          syncAssessmentLockRuntime();
          const focusNow = _el('setting-focus')?.value || prefs.focus || 'all';
          const activeGradeBand = getEffectiveGameplayGradeBand(
            _el('s-grade')?.value || 'all',
            focusNow
          );
          const dueCountNow = countDueReviewWords(buildPlayableWordSet(
            activeGradeBand,
            _el('s-length')?.value || 'any',
            focusNow
          ));
          updateNextActionLine({ dueCount: dueCountNow });
          setTimeout(() => {
            if (DEMO_MODE) {
              demoRoundComplete = true;
              WQUI.hideModal();
              closeRevealChallengeModal({ silent: true });
              hideDemoCoach();
              _el('new-game-btn')?.classList.remove('pulse');
              demoAutoplayTimer = demoSetTimeout(() => {
                newGame({ forceDemoReplay: true });
              }, 2800);
            } else {
              WQUI.showModal(result);
              _el('new-game-btn')?.classList.add('pulse');
            }
            if (normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()) !== themeAtSubmit) {
              applyTheme(themeAtSubmit);
            }
          }, 520);
        } else {
          if (DEMO_MODE) runDemoCoachAfterGuess(result);
          maybeShowErrorCoach(result);
          maybeAutoShowStarterWords(result);
          advanceTeamTurn();
          updateNextActionLine();
          if (!DEMO_MODE) positionDemoLaunchButton();
          refreshStarterSuggestionsIfOpen();
        }
      });

    } else if (key === 'Backspace' || key === '⌫') {
      WQGame.deleteLetter();
      const s2 = WQGame.getState();
      WQUI.updateCurrentRow(s2.guess, s2.wordLength, s2.guesses.length);
      syncKeyboardInputLocks(s2);
      refreshStarterSuggestionsIfOpen();
      updateNextActionLine();
      if (!DEMO_MODE) positionDemoLaunchButton();

    } else if (/^[a-zA-Z]$/.test(key)) {
      const normalizedLetter = String(key || '').toLowerCase();
      const liveState = WQGame.getState?.() || {};
      const liveWordState = deriveWordState(liveState);
      const check = checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
      if (!check.ok) {
        pulseBlockedLetterKey(normalizedLetter);
        maybeShowConstraintToast(check, normalizedLetter);
        updateNextActionLine();
        return;
      }
      WQGame.addLetter(key);
      const s2 = WQGame.getState();
      WQUI.updateCurrentRow(s2.guess, s2.wordLength, s2.guesses.length);
      syncKeyboardInputLocks(s2, liveWordState);
      refreshStarterSuggestionsIfOpen();
      updateNextActionLine();
      if (!DEMO_MODE) positionDemoLaunchButton();
    }
  }

  function isEditableTarget(target) {
    const node = target instanceof Element ? target : null;
    if (!node) return false;
    if (node instanceof HTMLElement && node.isContentEditable) return true;
    return Boolean(node.closest('input, textarea, select, [contenteditable="true"]'));
  }

  // Physical keyboard
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented) return;
    avaWqLastActionAt = Date.now();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (DEMO_MODE && e.key === 'Escape' && demoToastEl && !demoToastEl.classList.contains('hidden')) {
      e.preventDefault();
      collapseDemoToast();
      return;
    }
    const listeningHelpOpen = !(_el('listening-mode-overlay')?.classList.contains('hidden'));
    if (listeningHelpOpen) {
      if (e.key === 'Escape') hideListeningModeExplainer();
      return;
    }
    const phonicsClueOpen = !(_el('phonics-clue-modal')?.classList.contains('hidden'));
    if (phonicsClueOpen) {
      if (e.key === 'Escape') closePhonicsClueModal();
      return;
    }
    const challengeOpen = !(_el('challenge-modal')?.classList.contains('hidden'));
    if (challengeOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRevealChallengeModal();
      } else if (e.key === 'Tab') {
        trapChallengeModalTab(e);
      }
      return;
    }
    const endModalOpen = !(_el('end-modal')?.classList.contains('hidden'));
    if (endModalOpen) {
      if (e.key === ' ' || e.code === 'Space') {
        // Spacebar advances to next word (like Wordle)
        e.preventDefault();
        _el('new-game-btn')?.click();
        return;
      } else if (e.key === 'Escape') {
        // Escape skips celebration and goes to next word
        e.preventDefault();
        _el('new-game-btn')?.click();
        return;
      }
    }
    // MacBook keyboard support: F7-F10 for music control
    if (e.key === 'F7') {
      e.preventDefault();
      _el('quick-music-prev')?.click();
      return;
    }
    if (e.key === 'F8') {
      e.preventDefault();
      _el('quick-music-toggle')?.click();
      return;
    }
    if (e.key === 'F9') {
      e.preventDefault();
      _el('quick-music-next')?.click();
      return;
    }
    if (e.key === 'F10') {
      e.preventDefault();
      _el('quick-music-shuffle')?.click();
      return;
    }
    const themePopoverOpen = !(_el('theme-preview-strip')?.classList.contains('hidden'));
    const musicPopoverOpen = !(_el('quick-music-strip')?.classList.contains('hidden'));
    if (themePopoverOpen || musicPopoverOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeQuickPopover('all');
        return;
      }
      if (themePopoverOpen && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        const direction = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1;
        if (window.WQThemeNav && typeof window.WQThemeNav.cycleTheme === 'function') {
          e.preventDefault();
          window.WQThemeNav.cycleTheme(direction);
        }
        return;
      }
      // Allow letter keys and Enter through for game input even when music popover is open
      if (musicPopoverOpen && (/^[a-zA-Z]$/.test(e.key) || e.key === 'Enter' || e.key === 'Backspace')) {
        // Don't intercept—let game input handler below process the key
      } else {
        return;
      }
    }
    const starterWordOpen = !(_el('starter-word-card')?.classList.contains('hidden'));
    if (starterWordOpen && e.key === 'Escape') {
      e.preventDefault();
      hideStarterWordCard();
      return;
    }
    if (isMissionLabStandaloneMode()) return;
    const activeEl = document.activeElement;
    const shouldReleaseThemeNavFocus =
      activeEl?.closest?.('#wq-theme-nav') &&
      (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key));
    if (shouldReleaseThemeNavFocus) {
      activeEl.blur();
      e.preventDefault();
    } else if (isEditableTarget(e.target)) {
      return;
    }
    if (document.documentElement.getAttribute('data-focus-search-open') === 'true') return;
    const nextKey = e.key === 'Backspace' ? 'Backspace' : e.key;
    const isGameplayKey = nextKey === 'Enter' || nextKey === 'Backspace' || /^[a-zA-Z]$/.test(nextKey);
    if (isGameplayKey) e.preventDefault();
    handleInputUnit(nextKey);
    if (/^[a-zA-Z]$/.test(e.key)) {
      const btn = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
      if (btn) { btn.classList.add('wq-press'); setTimeout(() => btn.classList.remove('wq-press'), 220); }
    }
  });

  document.addEventListener('pointerdown', (event) => {
    avaWqLastActionAt = Date.now();
    if (!DEMO_MODE || !(demoToastEl instanceof HTMLElement)) return;
    if (demoToastEl.classList.contains('hidden')) return;
    const target = event.target instanceof Node ? event.target : null;
    if (!target) return;
    if (demoToastEl.contains(target)) return;
    if (demoToastChipEl instanceof HTMLElement && demoToastChipEl.contains(target)) return;
    collapseDemoToast();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAvaWordQuestIdleWatcher('document hidden');
      return;
    }
    if (isPlayMode()) startAvaWordQuestIdleWatcher();
  });

  // On-screen keyboard
  _el('keyboard')?.addEventListener('click', e => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    btn.classList.add('wq-press');
    setTimeout(() => btn.classList.remove('wq-press'), 220);
    const unit = btn.dataset.seq || btn.dataset.key;
    handleInputUnit(unit);
  });

  // Buttons
  _el('new-game-btn')?.addEventListener('click', newGame);
  _el('play-again-btn')?.addEventListener('click', newGame);
  _el('phonics-clue-open-btn')?.addEventListener('click', () => {
    showInformantHintToast();
  });
  _el('focus-help-btn')?.addEventListener('click', () => {
    const card = _el('support-choice-card');
    if (card && !card.classList.contains('hidden')) {
      hideSupportChoiceCard();
      return;
    }
    showSupportChoiceCard();
  });
  _el('starter-word-open-btn')?.addEventListener('click', () => {
    const card = _el('starter-word-card');
    if (card && !card.classList.contains('hidden')) {
      hideStarterWordCard();
      return;
    }
    showStarterWordCard({ source: 'manual' });
  });
  _el('starter-word-refresh-btn')?.addEventListener('click', () => {
    showStarterWordCard({ source: 'manual' });
  });
  _el('starter-word-close-btn')?.addEventListener('click', () => {
    hideStarterWordCard();
  });
  _el('starter-word-close-icon')?.addEventListener('click', () => {
    hideStarterWordCard();
  });
  _el('support-choice-suggestion')?.addEventListener('click', () => {
    const never = _el('support-choice-never');
    if (never?.checked) setSupportPromptMode('off');
    hideSupportChoiceCard();
    showStarterWordCard({ source: 'manual' });
  });
  _el('support-choice-clue')?.addEventListener('click', () => {
    const never = _el('support-choice-never');
    if (never?.checked) setSupportPromptMode('off');
    hideSupportChoiceCard();
    showInformantHintToast();
  });
  _el('support-choice-no')?.addEventListener('click', () => {
    const never = _el('support-choice-never');
    if (never?.checked) setSupportPromptMode('off');
    hideSupportChoiceCard();
  });
  _el('support-choice-close')?.addEventListener('click', () => {
    const never = _el('support-choice-never');
    if (never?.checked) setSupportPromptMode('off');
    hideSupportChoiceCard();
  });
  // Make support-choice-card draggable
  (function setupDraggableHelpModal() {
    const card = _el('support-choice-card');
    if (!card) return;
    const handle = card.querySelector('.support-choice-head');
    if (!handle) return;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Only left-click
      if (e.target instanceof HTMLElement && e.target.closest('button')) return; // Don't drag when clicking close
      isDragging = true;
      const rect = card.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      handle.style.cursor = 'grabbing';
    });
    document.addEventListener('pointermove', (e) => {
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
    document.addEventListener('pointerup', () => {
      isDragging = false;
      handle.style.cursor = 'grab';
    });
  })();
  document.addEventListener('pointerdown', (event) => {
    const card = _el('starter-word-card');
    if (!card || card.classList.contains('hidden')) return;
    const target = event.target instanceof Node ? event.target : null;
    if (!target) return;
    if (card.contains(target)) return;
    if (target instanceof Element && target.closest('#starter-word-open-btn')) return;
    hideStarterWordCard();
  }, { passive: true });
  document.addEventListener('pointerdown', (event) => {
    const card = _el('support-choice-card');
    if (!card || card.classList.contains('hidden')) return;
    const target = event.target instanceof Node ? event.target : null;
    if (!target) return;
    if (card.contains(target)) return;
    if (target instanceof Element && target.closest('#starter-word-open-btn, #phonics-clue-open-btn, #focus-help-btn')) return;
    hideSupportChoiceCard();
  }, { passive: true });
  _el('listening-mode-close')?.addEventListener('click', () => {
    hideListeningModeExplainer();
  });
  _el('listening-mode-overlay')?.addEventListener('pointerdown', (event) => {
    if (event.target?.id !== 'listening-mode-overlay') return;
    hideListeningModeExplainer();
  });
  _el('phonics-clue-close')?.addEventListener('click', () => closePhonicsClueModal());
  _el('phonics-clue-modal')?.addEventListener('pointerdown', (event) => {
    if (event.target?.id !== 'phonics-clue-modal') return;
    closePhonicsClueModal();
  });
  _el('phonics-clue-deck-select')?.addEventListener('change', () => {
    updatePhonicsClueControlsFromUI();
    renderPhonicsCluePanel();
  });
  _el('phonics-clue-context-select')?.addEventListener('change', () => {
    updatePhonicsClueControlsFromUI();
    renderPhonicsCluePanel();
  });
  _el('phonics-clue-timer-select')?.addEventListener('change', () => {
    updatePhonicsClueControlsFromUI();
    if (phonicsClueState.started && phonicsClueState.current) {
      startPhonicsClueTurnTimer();
    } else {
      renderPhonicsCluePanel();
    }
  });
  _el('phonics-clue-bonus-select')?.addEventListener('change', () => {
    updatePhonicsClueControlsFromUI();
    renderPhonicsCluePanel();
  });
  _el('phonics-clue-start-btn')?.addEventListener('click', () => {
    void startPhonicsClueDeck();
  });
  _el('phonics-clue-guess-btn')?.addEventListener('click', () => {
    awardPhonicsClueGuessPoint();
  });
  _el('phonics-clue-bonus-btn')?.addEventListener('click', () => {
    awardPhonicsClueBonusPoint();
  });
  _el('phonics-clue-next-btn')?.addEventListener('click', () => {
    advancePhonicsClueCard();
  });
  _el('phonics-clue-skip-btn')?.addEventListener('click', () => {
    skipPhonicsClueCard();
  });
  _el('phonics-clue-hide-btn')?.addEventListener('click', () => {
    togglePhonicsClueTargetVisibility();
  });
  _el('mission-lab-start-btn')?.addEventListener('click', () => {
    startStandaloneMissionLab();
  });
  _el('mission-lab-word-select')?.addEventListener('change', () => {
    refreshStandaloneMissionLabHub();
  });
  _el('mission-lab-level-select')?.addEventListener('change', () => {
    const note = _el('mission-lab-hub-note');
    const level = normalizeThinkingLevel(_el('mission-lab-level-select')?.value || '');
    if (!note || !level) return;
    note.textContent = `Selected thinking target: ${getChallengeLevelDisplay(level)}. Start Deep Dive when ready.`;
  });
  _el('modal-auto-next-cancel')?.addEventListener('click', () => {
    clearRevealAutoAdvanceTimer();
    WQUI.showToast('Auto next canceled for this reveal.');
  });
  _el('modal-overlay')?.addEventListener('pointerdown', (event) => {
    if (event.target?.id !== 'modal-overlay') return;
    newGame();
  });
  _el('modal-open-challenge')?.addEventListener('click', () => {
    openRevealChallengeModal();
  });
  _el('challenge-modal-close')?.addEventListener('click', () => closeRevealChallengeModal());
  _el('challenge-modal')?.addEventListener('pointerdown', (event) => {
    if (event.target?.id !== 'challenge-modal') return;
    closeRevealChallengeModal();
  });
  _el('challenge-modal')?.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button[data-challenge-choice-task]');
    if (!button) return;
    const task = String(button.dataset.challengeChoiceTask || '').trim();
    const choiceId = String(button.dataset.choiceId || '').trim();
    if (!task || !choiceId) return;
    handleChallengeChoiceSelection(task, choiceId);
  });
  _el('challenge-station-progress')?.addEventListener('click', (event) => {
    const pill = event.target?.closest?.('button[data-challenge-station]');
    if (!pill || !revealChallengeState) return;
    const task = String(pill.dataset.challengeStation || '').trim();
    if (!CHALLENGE_TASK_FLOW.includes(task)) return;
    const firstIncomplete = getFirstIncompleteChallengeTask(revealChallengeState);
    const lockedIndex = CHALLENGE_TASK_FLOW.indexOf(firstIncomplete);
    const requestedIndex = CHALLENGE_TASK_FLOW.indexOf(task);
    if (lockedIndex >= 0 && requestedIndex > lockedIndex) {
      setChallengeFeedback('Finish this step first.', 'warn');
      return;
    }
    revealChallengeState.activeTask = task;
    renderRevealChallengeModal();
  });
  _el('challenge-next-station')?.addEventListener('click', () => {
    if (!revealChallengeState || revealChallengeState.completedAt) return;
    const nextTask = getNextChallengeTask(revealChallengeState, revealChallengeState.activeTask);
    if (!nextTask) return;
    revealChallengeState.activeTask = nextTask;
    renderRevealChallengeModal();
    setChallengeFeedback('Next step is ready.', 'default');
  });
  _el('challenge-hear-word')?.addEventListener('click', () => {
    cancelRevealNarration();
    const current = revealChallengeState?.result?.entry || entry();
    if (current) void WQAudio.playWord(current);
  });
  _el('challenge-hear-sentence')?.addEventListener('click', () => {
    cancelRevealNarration();
    const current = revealChallengeState?.result?.entry || entry();
    if (current) void WQAudio.playSentence(current);
  });
  _el('challenge-open-practice')?.addEventListener('click', () => {
    closeRevealChallengeModal({ silent: true, restoreFocus: false });
    openVoicePracticeAndRecord({ autoStart: true });
  });
  _el('challenge-save-reflection')?.addEventListener('click', () => {
    saveRevealChallengeResponses();
  });
  _el('challenge-quickstart-dismiss')?.addEventListener('click', () => {
    saveChallengeOnboardingState({
      seenCount: Math.max(CHALLENGE_ONBOARDING_MAX_VIEWS, challengeOnboardingState.seenCount),
      dismissed: true
    });
    _el('challenge-quickstart')?.classList.add('hidden');
  });
  _el('challenge-finish-btn')?.addEventListener('click', () => {
    finishRevealChallenge();
  });


function initInput() { /* wired in app.js */ }

export { initInput, handleKey, isEditableTarget };
