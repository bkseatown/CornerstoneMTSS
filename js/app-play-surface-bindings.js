/**
 * app-play-surface-bindings.js
 * Play-surface settings and support control event wiring.
 */

function createPlaySurfaceBindingsModule(deps) {
  const {
    WQAudio = null,
    WQGame = null,
    WQUI = null,
    applyFeedback = () => {},
    applyPlayStyle = (value) => value,
    applyReportCompactMode = (value) => value,
    applyRevealFocusMode = (value) => value,
    cancelRevealNarration = () => {},
    clearRevealAutoAdvanceTimer = () => {},
    defaultPrefs = {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    forceUpdateNow = async () => {},
    getPrefs = () => ({}),
    hideInformantHintCard = () => {},
    hideMidgameBoost = () => {},
    normalizeMasteryFilter = (value) => value,
    normalizeMasterySort = (value) => value,
    normalizePlayStyle = (value) => value,
    normalizeProbeRounds = (value) => value,
    normalizeRevealAutoNext = (value) => value,
    normalizeRevealPacing = (value) => value,
    normalizeTeamCount = (value) => value,
    normalizeTeamMode = (value) => value,
    normalizeTeamSet = (value) => value,
    normalizeTurnTimer = (value) => value,
    normalizeVoiceMode = (value) => value,
    recordAvaWordQuestEvent = () => {},
    renderMasteryTable = () => {},
    resetAppearanceAndCache = async () => {},
    runRevealNarration = async () => {},
    setHintMode = () => {},
    setPref = () => {},
    setVoicePracticeMode = () => {},
    showInformantHintToast = () => {},
    speakAvaWordQuestAdaptive = () => {},
    syncAssessmentLockRuntime = () => {},
    syncClassroomTurnRuntime = () => {},
    syncHeaderClueLauncherUI = () => {},
    syncKeyboardInputLocks = () => {},
    syncQuickSetupControls = () => {},
    syncStarterWordLauncherUI = () => {},
    syncTeacherPresetButtons = () => {},
    syncRevealMeaningHighlight = () => {},
    updateNextActionLine = () => {},
    updateRevealSorBadge = () => {},
    windowRef = window
  } = deps || {};

  function bindSupportCloseButton(id) {
    el(id)?.addEventListener('click', (event) => {
      event.preventDefault();
      hideInformantHintCard();
    });
  }

  function init() {
    if (documentRef.body?.dataset?.wqPlaySurfaceBindingsBound === '1') return;

    el('s-team-mode')?.addEventListener('change', (event) => {
      const normalized = normalizeTeamMode(event.target.value);
      event.target.value = normalized;
      setPref('teamMode', normalized);
      if (normalized === 'on') hideInformantHintCard();
      syncHeaderClueLauncherUI();
      syncStarterWordLauncherUI();
      syncClassroomTurnRuntime({ resetTurn: true });
      updateNextActionLine();
      WQUI?.showToast(normalized === 'on' ? 'Team turns are on.' : 'Team turns are off.');
    });

    el('s-team-count')?.addEventListener('change', (event) => {
      const normalized = normalizeTeamCount(event.target.value);
      event.target.value = normalized;
      setPref('teamCount', normalized);
      syncClassroomTurnRuntime({ resetTurn: true });
      updateNextActionLine();
      WQUI?.showToast(`${normalized} team${normalized === '1' ? '' : 's'} ready.`);
    });

    el('s-team-set')?.addEventListener('change', (event) => {
      const normalized = normalizeTeamSet(event.target.value);
      event.target.value = normalized;
      setPref('teamSet', normalized);
      deps.updateClassroomTurnLine?.();
      WQUI?.showToast(`Team names: ${normalized}.`);
    });

    el('s-turn-timer')?.addEventListener('change', (event) => {
      const normalized = normalizeTurnTimer(event.target.value);
      event.target.value = normalized;
      setPref('turnTimer', normalized);
      syncClassroomTurnRuntime();
      updateNextActionLine();
      WQUI?.showToast(normalized === 'off' ? 'Team turn timer is off.' : `Team turn timer: ${normalized} seconds.`);
    });

    el('s-smart-key-lock')?.addEventListener('change', (event) => {
      const normalized = String(event.target?.value || defaultPrefs.smartKeyLock).toLowerCase() === 'on' ? 'on' : 'off';
      event.target.value = normalized;
      setPref('smartKeyLock', normalized);
      syncKeyboardInputLocks(WQGame?.getState?.() || {});
      WQUI?.showToast(normalized === 'on' ? 'Smart Key Guard is on.' : 'Smart Key Guard is off.');
    });

    el('s-probe-rounds')?.addEventListener('change', (event) => {
      const normalized = normalizeProbeRounds(event.target.value);
      event.target.value = normalized;
      setPref('probeRounds', normalized);
    });

    el('s-report-compact')?.addEventListener('change', (event) => {
      const normalized = applyReportCompactMode(event.target?.checked ? 'on' : 'off');
      WQUI?.showToast(normalized === 'on' ? 'Compact report mode is on.' : 'Compact report mode is off.');
    });

    el('s-mastery-sort')?.addEventListener('change', (event) => {
      const normalized = normalizeMasterySort(event.target.value);
      event.target.value = normalized;
      renderMasteryTable();
    });

    el('s-mastery-filter')?.addEventListener('change', (event) => {
      const normalized = normalizeMasteryFilter(event.target.value);
      event.target.value = normalized;
      renderMasteryTable();
    });

    el('s-hint')?.addEventListener('change', (event) => {
      setHintMode(event.target.value);
      syncTeacherPresetButtons();
    });

    el('s-play-style')?.addEventListener('change', (event) => {
      const next = applyPlayStyle(event.target.value);
      syncQuickSetupControls();
      WQUI?.showToast(next === 'listening' ? 'Spelling Mode on: hear word + meaning, then spell.' : 'Detective Mode on: use tile colors and clues.');
    });

    el('s-reveal-focus')?.addEventListener('change', (event) => {
      const next = applyRevealFocusMode(event.target.value);
      WQUI?.showToast(next === 'on' ? 'Reveal focus is on: word + meaning first.' : 'Reveal focus is off: full detail layout.');
      syncTeacherPresetButtons();
    });

    el('s-reveal-pacing')?.addEventListener('change', (event) => {
      const next = normalizeRevealPacing(event.target.value);
      event.target.value = next;
      setPref('revealPacing', next);
      WQUI?.showToast(next === 'quick' ? 'Reveal pacing: quick.' : next === 'slow' ? 'Reveal pacing: slow.' : 'Reveal pacing: guided.');
    });

    el('s-reveal-auto-next')?.addEventListener('change', (event) => {
      const next = normalizeRevealAutoNext(event.target.value);
      event.target.value = next;
      setPref('revealAutoNext', next);
      if (next === 'off') {
        clearRevealAutoAdvanceTimer();
        WQUI?.showToast('Auto next word is off.');
        return;
      }
      WQUI?.showToast(`Auto next word: ${next} seconds.`);
    });

    el('focus-hint-toggle')?.addEventListener('click', () => {
      recordAvaWordQuestEvent('hint_open');
      showInformantHintToast();
      speakAvaWordQuestAdaptive('hint_open');
    });

    bindSupportCloseButton('hint-clue-close-btn');
    bindSupportCloseButton('hint-clue-close-icon');

    el('hint-clue-sentence-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = WQGame?.getState?.()?.entry;
      const mode = String(event.currentTarget?.dataset?.mode || 'none').trim().toLowerCase();
      cancelRevealNarration();
      if (mode === 'word-meaning') {
        if (!current) {
          WQUI?.showToast('Start a word first.');
          return;
        }
        void (async () => {
          await WQAudio?.playWord?.(current);
          await WQAudio?.playDef?.(current);
        })();
        return;
      }
      WQUI?.showToast('Sentence playback is off for detective clue cards.');
    });

    el('play-style-toggle')?.addEventListener('click', () => {
      const modeSelect = el('s-play-style');
      const prefs = getPrefs();
      if (!(modeSelect instanceof HTMLSelectElement)) return;
      const current = normalizePlayStyle(modeSelect.value || prefs.playStyle || defaultPrefs.playStyle);
      const next = current === 'listening' ? 'detective' : 'listening';
      modeSelect.value = next;
      modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    el('s-dupe')?.addEventListener('change', (event) => setPref('dupe', event.target.value));
    el('s-confetti')?.addEventListener('change', (event) => {
      setPref('confetti', event.target.value);
      syncTeacherPresetButtons();
    });
    el('s-assessment-lock')?.addEventListener('change', (event) => {
      const enabled = !!event.target.checked;
      setPref('assessmentLock', enabled ? 'on' : 'off');
      syncAssessmentLockRuntime();
      syncTeacherPresetButtons();
      WQUI?.showToast(enabled ? 'Assessment lock is on for active rounds.' : 'Assessment lock is off.');
    });
    el('s-feedback')?.addEventListener('change', (event) => {
      applyFeedback(event.target.value);
      setPref('feedback', event.target.value);
    });
    el('s-meaning-fun-link')?.addEventListener('change', (event) => {
      const enabled = !!event.target.checked;
      setPref('meaningPlusFun', enabled ? 'on' : 'off');
      WQUI?.showToast(enabled ? 'Extended definition add-on is on.' : 'Extended definition add-on is off.');
      if (!(el('modal-overlay')?.classList.contains('hidden'))) {
        syncRevealMeaningHighlight(WQGame?.getState?.()?.entry);
      }
    });
    el('s-sor-notation')?.addEventListener('change', (event) => {
      const enabled = !!event.target.checked;
      setPref('sorNotation', enabled ? 'on' : 'off');
      WQUI?.showToast(enabled ? 'SoR notation will show during reveal.' : 'SoR notation is hidden during reveal.');
      if (!(el('modal-overlay')?.classList.contains('hidden'))) {
        updateRevealSorBadge(WQGame?.getState?.()?.entry);
      }
    });
    el('s-voice-task')?.addEventListener('change', (event) => {
      setVoicePracticeMode(event.target.value, { toast: true });
    });
    el('s-boost-popups')?.addEventListener('change', (event) => {
      const normalized = event.target.value === 'off' ? 'off' : 'on';
      setPref('boostPopups', normalized);
      if (normalized === 'off') hideMidgameBoost();
      syncTeacherPresetButtons();
      WQUI?.showToast(normalized === 'off' ? 'Engagement popups are off.' : 'Engagement popups are on.');
    });
    el('s-reset-look-cache')?.addEventListener('click', () => {
      void resetAppearanceAndCache();
    });
    el('s-force-update-now')?.addEventListener('click', () => {
      void forceUpdateNow();
    });
    el('s-force-update-now-top')?.addEventListener('click', () => {
      void forceUpdateNow();
    });
    el('s-voice')?.addEventListener('change', (event) => {
      const normalized = normalizeVoiceMode(event.target.value);
      event.target.value = normalized;
      WQAudio?.setVoiceMode?.(normalized);
      setPref('voice', normalized);
      const modalOpen = !(el('modal-overlay')?.classList.contains('hidden'));
      if (normalized === 'off') {
        cancelRevealNarration();
        syncTeacherPresetButtons();
        WQUI?.showToast('Voice read-aloud is off.');
        return;
      }
      if (modalOpen) void runRevealNarration(WQGame?.getState?.());
      syncTeacherPresetButtons();
      WQUI?.showToast('Voice read-aloud is on.');
    });

    documentRef.body.dataset.wqPlaySurfaceBindingsBound = '1';
  }

  return { init };
}

window.createPlaySurfaceBindingsModule = createPlaySurfaceBindingsModule;
