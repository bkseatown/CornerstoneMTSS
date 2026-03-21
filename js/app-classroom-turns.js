/**
 * app-classroom-turns.js
 * Team turn timer and classroom rotation helpers.
 */

function createClassroomTurnsModule(deps) {
  const {
    TEAM_LABEL_SETS = {},
    WQUI = null,
    defaultPrefs = {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getCurrentGuessClear = () => {},
    getGameState = () => ({}),
    getHelpSuppressed = () => false,
    getTeamMode = () => 'off',
    getTeamSet = () => 'mascots',
    getTeamCount = () => 2,
    getTurnTimerSeconds = () => 0,
    positionSupportCards = () => {},
    showToast = () => {},
    syncTeamHelpSuppressionUI = () => {},
    windowRef = window
  } = deps || {};

  function resolveTeamLabelSets() {
    return typeof TEAM_LABEL_SETS === 'function' ? (TEAM_LABEL_SETS() || {}) : TEAM_LABEL_SETS;
  }

  const runtime = {
    timer: 0,
    endsAt: 0,
    remaining: 0,
    teamIndex: 0
  };

  function formatTurnClock(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function getCurrentTeamLabel() {
    const count = getTeamCount();
    const index = Math.max(0, Math.min(count - 1, runtime.teamIndex));
    const teamLabelSets = resolveTeamLabelSets();
    const labels = teamLabelSets[getTeamSet()] || teamLabelSets.mascots || [];
    return labels[index] || `Team ${index + 1}`;
  }

  function clearClassroomTurnTimer() {
    if (runtime.timer) {
      clearInterval(runtime.timer);
      runtime.timer = 0;
    }
    runtime.endsAt = 0;
    runtime.remaining = 0;
  }

  function positionClassroomTurnLine() {
    const line = el('classroom-turn-line');
    if (!(line instanceof HTMLElement) || line.classList.contains('hidden')) return;
    line.style.left = '';
    line.style.top = '';
    line.style.right = '';
    line.style.transform = '';

    const boardZone = documentRef.querySelector('.board-zone');
    const focusBar = documentRef.querySelector('.focus-bar');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const focusRect = focusBar?.getBoundingClientRect?.();
    const topFallback = Math.max(88, Math.round((focusRect?.bottom || 92) + 8));
    const lineRect = line.getBoundingClientRect();
    const desiredTop = Math.max(Math.round((boardRect?.top || topFallback) + 8), topFallback);

    if (!boardRect) {
      line.style.left = '50%';
      line.style.top = `${topFallback}px`;
      line.style.transform = 'translateX(-50%)';
      return;
    }

    if (windowRef.innerWidth < 1180) {
      const centeredLeft = Math.round(boardRect.left + (boardRect.width - lineRect.width) / 2);
      const boardSafeTop = Math.round(boardRect.top - lineRect.height - 8);
      line.style.left = `${Math.max(8, centeredLeft)}px`;
      line.style.top = `${Math.max(84, boardSafeTop)}px`;
      return;
    }

    const gutter = Math.min(28, Math.max(14, Math.round((windowRef.innerWidth - boardRect.right) * 0.22)));
    const roomRight = windowRef.innerWidth - boardRect.right - gutter;
    if (roomRight >= lineRect.width - 8) {
      line.style.left = `${Math.max(8, Math.round(boardRect.right + gutter))}px`;
      line.style.top = `${desiredTop}px`;
      return;
    }

    line.style.left = `${Math.max(8, Math.round(boardRect.left + boardRect.width - lineRect.width))}px`;
    line.style.top = `${Math.max(topFallback, Math.round(boardRect.top - lineRect.height - 12))}px`;
  }

  function updateClassroomTurnLine() {
    const line = el('classroom-turn-line');
    if (!line) return;
    const state = getGameState();
    const activeRound = Boolean(state.word && !state.gameOver);
    if (getTeamMode() !== 'on' || !activeRound) {
      line.textContent = '';
      line.classList.add('hidden');
      line.style.left = '';
      line.style.top = '';
      line.style.transform = '';
      return;
    }
    const seconds = getTurnTimerSeconds();
    const remaining = Math.max(0, runtime.remaining || seconds);
    const teamLabel = getCurrentTeamLabel();
    const urgencyClass = seconds > 0
      ? (remaining <= 10 ? 'is-critical' : (remaining <= 20 ? 'is-warning' : 'is-steady'))
      : 'is-steady';
    const progress = seconds > 0 ? Math.max(0.06, Math.min(1, remaining / Math.max(1, seconds))) : 1;
    line.className = `classroom-turn-line ${urgencyClass}`;
    line.innerHTML = `
      <div class="classroom-turn-badge">
        <div class="classroom-turn-copy">
          <span class="classroom-turn-kicker">Your turn</span>
          <span class="classroom-turn-team">${teamLabel}</span>
        </div>
        <div class="classroom-turn-clock" aria-label="${seconds > 0 ? `${formatTurnClock(remaining)} remaining` : 'Free play'}">
          <span class="classroom-turn-clock-ring" style="--turn-progress:${Math.round(progress * 100)}%"></span>
          <span class="classroom-turn-timer">${seconds > 0 ? formatTurnClock(remaining) : 'GO'}</span>
        </div>
      </div>
    `;
    line.classList.remove('hidden');
    positionClassroomTurnLine();
  }

  function reflowGameplayLayoutForTurnLine() {
    const state = getGameState();
    if (!state?.wordLength || !state?.maxGuesses || !WQUI || typeof WQUI.calcLayout !== 'function') return;
    WQUI.calcLayout(state.wordLength, state.maxGuesses);
    positionClassroomTurnLine();
    positionSupportCards();
  }

  function startClassroomTurnClock(options = {}) {
    const resetTurn = Boolean(options.resetTurn);
    if (resetTurn) runtime.teamIndex = 0;
    clearClassroomTurnTimer();

    const state = getGameState();
    const activeRound = Boolean(state.word && !state.gameOver);
    if (getTeamMode() !== 'on' || !activeRound) {
      updateClassroomTurnLine();
      reflowGameplayLayoutForTurnLine();
      return;
    }

    const seconds = getTurnTimerSeconds();
    if (seconds <= 0) {
      updateClassroomTurnLine();
      reflowGameplayLayoutForTurnLine();
      return;
    }

    runtime.remaining = seconds;
    runtime.endsAt = Date.now() + (seconds * 1000);
    updateClassroomTurnLine();
    reflowGameplayLayoutForTurnLine();

    runtime.timer = setInterval(() => {
      const round = getGameState();
      if (!round.word || round.gameOver || getTeamMode() !== 'on') {
        clearClassroomTurnTimer();
        updateClassroomTurnLine();
        reflowGameplayLayoutForTurnLine();
        return;
      }
      const remaining = Math.max(0, Math.ceil((runtime.endsAt - Date.now()) / 1000));
      if (remaining !== runtime.remaining) {
        runtime.remaining = remaining;
        updateClassroomTurnLine();
      }
      if (remaining <= 0) {
        clearClassroomTurnTimer();
        const expiringTeam = getCurrentTeamLabel();
        getCurrentGuessClear();
        runtime.teamIndex = (runtime.teamIndex + 1) % getTeamCount();
        startClassroomTurnClock();
        showToast(`${expiringTeam} ran out of time. ${getCurrentTeamLabel()} is up.`);
      }
    }, 250);
  }

  function advanceTeamTurn() {
    const state = getGameState();
    const activeRound = Boolean(state.word && !state.gameOver);
    if (getTeamMode() !== 'on' || !activeRound) {
      updateClassroomTurnLine();
      return;
    }
    runtime.teamIndex = (runtime.teamIndex + 1) % getTeamCount();
    startClassroomTurnClock();
  }

  function syncClassroomTurnRuntime(options = {}) {
    startClassroomTurnClock({ resetTurn: !!options.resetTurn });
    syncTeamHelpSuppressionUI();
  }

  return {
    advanceTeamTurn,
    clearClassroomTurnTimer,
    positionClassroomTurnLine,
    reflowGameplayLayoutForTurnLine,
    startClassroomTurnClock,
    syncClassroomTurnRuntime,
    updateClassroomTurnLine
  };
}

window.createClassroomTurnsModule = createClassroomTurnsModule;
