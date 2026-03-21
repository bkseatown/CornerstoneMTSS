/**
 * app-deep-dive-ui.js
 * Deep Dive progress, choice, and pacing helpers.
 */

function createDeepDiveUiModule(deps) {
  const {
    challengePacingNudgeMs = 45000,
    challengeScaffoldProfile = {},
    challengeTaskFlow = [],
    challengeTaskLabels = {},
    clearIntervalRef = clearInterval,
    clearTimeoutRef = clearTimeout,
    el = () => null,
    getChallengeScaffold = () => challengeScaffoldProfile.g35 || {},
    getChallengePacingTimer = () => 0,
    getChallengeSprintTimer = () => 0,
    getRevealChallengeState = () => null,
    renderRevealChallengeModal = () => {},
    setChallengePacingTimer = () => {},
    setChallengeSprintTimer = () => {},
    setTaskComplete = () => {},
    setTimer = setTimeout
  } = deps || {};

  function setChallengeFeedback(message, tone = 'default') {
    const node = el('challenge-live-feedback');
    if (!node) return;
    const text = String(message || '').trim();
    node.textContent = text;
    node.classList.toggle('hidden', !text);
    node.classList.toggle('is-good', tone === 'good');
    node.classList.toggle('is-warn', tone === 'warn');
  }

  function clearChallengeSprintTimer() {
    const sprintTimer = Number(getChallengeSprintTimer() || 0);
    if (sprintTimer) {
      clearIntervalRef(sprintTimer);
      setChallengeSprintTimer(0);
    }
    const pacingTimer = Number(getChallengePacingTimer() || 0);
    if (pacingTimer) {
      clearTimeoutRef(pacingTimer);
      setChallengePacingTimer(0);
    }
  }

  function clearChallengePacingTimer() {
    const pacingTimer = Number(getChallengePacingTimer() || 0);
    if (!pacingTimer) return;
    clearTimeoutRef(pacingTimer);
    setChallengePacingTimer(0);
  }

  function getChallengeDoneCount(state = getRevealChallengeState()) {
    return challengeTaskFlow.reduce((count, task) => count + (state?.tasks?.[task] ? 1 : 0), 0);
  }

  function getFirstIncompleteChallengeTask(state = getRevealChallengeState()) {
    return challengeTaskFlow.find((task) => !state?.tasks?.[task]) || '';
  }

  function getNextChallengeTask(state = getRevealChallengeState(), fromTask = '') {
    if (!state) return '';
    const index = Math.max(0, challengeTaskFlow.indexOf(fromTask || state.activeTask));
    for (let i = index + 1; i < challengeTaskFlow.length; i += 1) {
      const task = challengeTaskFlow[i];
      if (!state.tasks?.[task]) return task;
    }
    for (let i = 0; i <= index; i += 1) {
      const task = challengeTaskFlow[i];
      if (!state.tasks?.[task]) return task;
    }
    return '';
  }

  function setChallengeActiveTask(task, state = getRevealChallengeState()) {
    if (!state) return '';
    const firstIncomplete = getFirstIncompleteChallengeTask(state);
    const lockIndex = challengeTaskFlow.indexOf(firstIncomplete);
    if (challengeTaskFlow.includes(task)) {
      const requestedIndex = challengeTaskFlow.indexOf(task);
      state.activeTask = (lockIndex >= 0 && requestedIndex > lockIndex) ? firstIncomplete : task;
      return state.activeTask;
    }
    const fallback = getFirstIncompleteChallengeTask(state) || challengeTaskFlow[0];
    state.activeTask = fallback;
    return fallback;
  }

  function getChallengeInstructionText(state = getRevealChallengeState()) {
    const profile = getChallengeScaffold(state);
    const doneCount = getChallengeDoneCount(state);
    if (doneCount >= challengeTaskFlow.length) return profile.instructionDone;
    const activeTask = setChallengeActiveTask(state?.activeTask, state);
    const stationIndex = Math.max(0, challengeTaskFlow.indexOf(activeTask)) + 1;
    return profile.instructionActive(stationIndex);
  }

  function syncChallengeActionButtons(state = getRevealChallengeState()) {
    const nextBtn = el('challenge-next-station');
    const saveBtn = el('challenge-save-reflection');
    const finishBtn = el('challenge-finish-btn');
    const buttons = [nextBtn, saveBtn, finishBtn].filter(Boolean);
    buttons.forEach((button) => button.classList.remove('is-primary-action'));

    if (!state) {
      if (nextBtn) {
        nextBtn.classList.remove('hidden');
        nextBtn.disabled = true;
        nextBtn.textContent = 'Next Step';
      }
      if (saveBtn) saveBtn.classList.add('hidden');
      if (finishBtn) {
        finishBtn.classList.add('hidden');
        finishBtn.disabled = true;
        finishBtn.textContent = 'Finish';
      }
      return;
    }

    const doneCount = getChallengeDoneCount(state);
    const activeTask = setChallengeActiveTask(state.activeTask, state);
    const nextTask = getNextChallengeTask(state, activeTask);
    const canAdvance = !!nextTask && !!state.tasks?.[activeTask] && !state.completedAt;

    if (nextBtn) {
      nextBtn.classList.toggle('hidden', doneCount >= challengeTaskFlow.length);
      nextBtn.disabled = !canAdvance;
      nextBtn.textContent = canAdvance ? 'Next Step' : 'Finish This Step';
      if (doneCount < challengeTaskFlow.length) nextBtn.classList.add('is-primary-action');
    }

    if (saveBtn) {
      saveBtn.classList.toggle('hidden', doneCount <= 0);
      saveBtn.textContent = doneCount >= challengeTaskFlow.length ? 'Save Progress' : 'Save Checkpoint';
    }

    if (finishBtn) {
      finishBtn.classList.toggle('hidden', doneCount < challengeTaskFlow.length);
      finishBtn.disabled = doneCount < challengeTaskFlow.length;
      finishBtn.textContent = doneCount >= challengeTaskFlow.length ? 'Finish' : `Finish (${doneCount}/${challengeTaskFlow.length})`;
      if (doneCount >= challengeTaskFlow.length) finishBtn.classList.add('is-primary-action');
    }
  }

  function updateChallengeStationUI(state = getRevealChallengeState()) {
    const instruction = el('challenge-instruction');

    if (!state) {
      document.querySelectorAll('[data-challenge-task]').forEach((panel) => {
        panel.classList.remove('is-active');
        panel.setAttribute('aria-hidden', 'true');
      });
      const first = document.querySelector('[data-challenge-task="listen"]');
      first?.classList.add('is-active');
      first?.setAttribute('aria-hidden', 'false');
      document.querySelectorAll('[data-challenge-station]').forEach((pill) => {
        pill.classList.remove('is-active', 'is-complete');
        pill.setAttribute('aria-selected', 'false');
      });
      const firstPill = document.querySelector('[data-challenge-station="listen"]');
      firstPill?.classList.add('is-active');
      firstPill?.setAttribute('aria-selected', 'true');
      if (instruction) instruction.textContent = 'One step at a time. Finish all 3 steps.';
      syncChallengeActionButtons(null);
      return;
    }

    const activeTask = setChallengeActiveTask(state.activeTask, state);
    const activeIndex = Math.max(0, challengeTaskFlow.indexOf(activeTask));
    challengeTaskFlow.forEach((task, index) => {
      const panel = document.querySelector(`[data-challenge-task="${task}"]`);
      const pill = document.querySelector(`[data-challenge-station="${task}"]`);
      const isActive = index === activeIndex;
      const isComplete = !!state.tasks?.[task];
      if (panel) {
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      }
      if (pill) {
        pill.classList.toggle('is-active', isActive);
        pill.classList.toggle('is-complete', isComplete);
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    if (instruction) instruction.textContent = getChallengeInstructionText(state);
    syncChallengeActionButtons(state);
    syncChallengePacingTimer(state);
  }

  function syncChallengePacingTimer(state = getRevealChallengeState()) {
    if (!state || state.completedAt || getChallengeDoneCount(state) >= challengeTaskFlow.length) {
      clearChallengeSprintTimer();
      return;
    }
    const modal = el('challenge-modal');
    const modalOpen = !!modal && !modal.classList.contains('hidden');
    if (!modalOpen) {
      clearChallengeSprintTimer();
      return;
    }
    const activeTask = setChallengeActiveTask(state.activeTask, state);
    if (!activeTask || state.tasks?.[activeTask]) {
      clearChallengePacingTimer();
      return;
    }
    if (!state.pacing || typeof state.pacing !== 'object') {
      state.pacing = { task: activeTask, startedAt: Date.now(), nudged: false };
    } else if (state.pacing.task !== activeTask) {
      state.pacing.task = activeTask;
      state.pacing.startedAt = Date.now();
      state.pacing.nudged = false;
    }
    if (state.pacing.nudged) {
      clearChallengePacingTimer();
      return;
    }
    const elapsed = Math.max(0, Date.now() - Math.max(1, Number(state.pacing.startedAt) || 0));
    const remainingMs = Math.max(300, challengePacingNudgeMs - elapsed);
    clearChallengePacingTimer();
    const timerId = setTimer(() => {
      const liveState = getRevealChallengeState();
      if (!liveState || liveState.completedAt || getChallengeDoneCount(liveState) >= challengeTaskFlow.length) return;
      const liveModal = el('challenge-modal');
      if (!liveModal || liveModal.classList.contains('hidden')) return;
      const currentTask = setChallengeActiveTask(liveState.activeTask, liveState);
      if (!currentTask) return;
      if (!liveState.pacing || liveState.pacing.task !== currentTask || liveState.tasks?.[currentTask] || liveState.pacing.nudged) return;
      liveState.pacing.nudged = true;
      const profile = getChallengeScaffold(liveState);
      setChallengeFeedback(profile.pace, 'default');
    }, remainingMs);
    setChallengePacingTimer(timerId);
  }

  function getChallengeChoice(task, choiceId, stateOverride = getRevealChallengeState()) {
    const state = stateOverride;
    if (!state?.deepDive?.choices) return null;
    const rows = state.deepDive.choices[task];
    if (!Array.isArray(rows)) return null;
    return rows.find((choice) => String(choice?.id || '') === String(choiceId || '')) || null;
  }

  function syncChallengeResponseSummary(state = getRevealChallengeState()) {
    if (!state || !state.deepDive) return;
    const summarize = (task) => {
      const selectedId = String(state.deepDive.selected?.[task] || '');
      if (!selectedId) return '';
      const choice = getChallengeChoice(task, selectedId, state);
      return String(choice?.label || '').replace(/\s+/g, ' ').trim();
    };
    const pattern = summarize('listen');
    const meaning = summarize('analyze');
    const syntax = summarize('create');
    state.responses.analyze = [`Pattern: ${pattern || '—'}`, `Meaning: ${meaning || '—'}`].join(' | ');
    state.responses.create = `Sentence: ${syntax || '—'}`;
  }

  function renderChallengeChoiceButtons(containerId, task) {
    const wrap = el(containerId);
    if (!wrap) return;
    const state = getRevealChallengeState();
    const deepDive = state?.deepDive;
    const choices = Array.isArray(deepDive?.choices?.[task]) ? deepDive.choices[task] : [];
    const selectedId = String(deepDive?.selected?.[task] || '');
    wrap.innerHTML = '';

    if (!choices.length) {
      const empty = document.createElement('div');
      empty.className = 'challenge-mission-helper';
      empty.textContent = 'Choices are loading for this step.';
      wrap.appendChild(empty);
      return;
    }

    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'challenge-choice-btn';
      button.dataset.challengeChoiceTask = task;
      button.dataset.choiceId = String(choice.id || '');
      button.textContent = String(choice.label || '');
      const selected = selectedId && selectedId === String(choice.id || '');
      if (selected) {
        button.classList.add('is-selected');
        button.classList.add(choice.correct ? 'is-correct' : 'is-wrong');
      }
      if (selected && choice.correct) button.disabled = true;
      wrap.appendChild(button);
    });
  }

  function handleChallengeChoiceSelection(task, choiceId) {
    const state = getRevealChallengeState();
    if (!state || !state.deepDive || state.completedAt) return;
    if (!Object.prototype.hasOwnProperty.call(state.tasks, task)) return;

    const choice = getChallengeChoice(task, choiceId);
    if (!choice) return;

    state.deepDive.selected[task] = String(choice.id || '');
    state.deepDive.attempts[task] = Math.max(0, Number(state.deepDive.attempts[task]) || 0) + 1;
    const wasComplete = !!state.tasks[task];
    setTaskComplete(task, !!choice.correct);
    syncChallengeResponseSummary(state);

    if (!choice.correct) {
      renderRevealChallengeModal();
      setChallengeFeedback('Nice try. Pick another choice.', 'warn');
      return;
    }

    if (!wasComplete) {
      const nextTask = getNextChallengeTask(state, task);
      if (nextTask) state.activeTask = nextTask;
    }
    renderRevealChallengeModal();
    const remainingTask = getFirstIncompleteChallengeTask(state);
    if (remainingTask) {
      setChallengeFeedback(`${challengeTaskLabels[task] || 'Step'} complete. Next step unlocked.`, 'good');
      return;
    }
    setChallengeFeedback('All 3 steps are done. Tap Finish.', 'good');
  }

  function computeChallengeScore(state) {
    if (!state) return { clarity: 0, evidence: 0, vocabulary: 0, total: 0 };
    const attempts = state.deepDive?.attempts || {};
    const doneCount = challengeTaskFlow.reduce((count, task) => count + (state.tasks?.[task] ? 1 : 0), 0);
    const firstTryCount = challengeTaskFlow.reduce((count, task) => (
      count + (state.tasks?.[task] && Number(attempts?.[task] || 0) <= 1 ? 1 : 0)
    ), 0);
    const extraAttempts = challengeTaskFlow.reduce((count, task) => (
      count + Math.max(0, (Number(attempts?.[task] || 0) || 0) - 1)
    ), 0);
    const penalty = Math.min(22, extraAttempts * 4);

    const clarity = Math.max(0, Math.min(100, 36 + (doneCount * 18) + (firstTryCount * 5) - penalty));
    const evidence = Math.max(0, Math.min(100, 34 + (state.tasks?.analyze ? 28 : 0) + (state.tasks?.create ? 22 : 0) + (firstTryCount * 4) - penalty));
    const vocabulary = Math.max(0, Math.min(100, 32 + (state.tasks?.listen ? 18 : 0) + (state.tasks?.analyze ? 24 : 0) + (state.tasks?.create ? 18 : 0) + (firstTryCount * 4) - penalty));
    const total = Math.round((clarity + evidence + vocabulary) / 3);
    return { clarity, evidence, vocabulary, total };
  }

  function updateChallengeScoreUI() {
    const scoreLabel = el('challenge-score-label');
    const scoreDetail = el('challenge-score-detail');
    const state = getRevealChallengeState();
    if (!scoreLabel || !scoreDetail) return;
    if (!state) {
      scoreLabel.textContent = 'Deep Dive score: --';
      scoreDetail.textContent = 'Band -- · Accuracy -- · Meaning -- · Syntax --';
      return;
    }
    const score = computeChallengeScore(state);
    state.score = score;
    const band = deps.resolveMissionScoreBand?.(score.total) || 'Launch';
    scoreLabel.textContent = `Deep Dive score: ${score.total}/100`;
    scoreDetail.textContent = `${band} band · Accuracy ${score.clarity} · Meaning ${score.evidence} · Syntax ${score.vocabulary}`;
  }

  function updateChallengeProgressUI() {
    const label = el('challenge-progress-label');
    const fill = el('challenge-progress-fill');
    const finishBtn = el('challenge-finish-btn');
    const state = getRevealChallengeState();
    if (!state) {
      if (label) label.textContent = `0 / ${challengeTaskFlow.length} steps complete`;
      if (fill) fill.style.width = '0%';
      if (finishBtn) finishBtn.disabled = true;
      if (finishBtn) finishBtn.textContent = 'Finish';
      setChallengeFeedback('');
      updateChallengeScoreUI();
      updateChallengeStationUI(null);
      return;
    }
    const doneCount = getChallengeDoneCount(state);
    if (label) label.textContent = `${doneCount} / ${challengeTaskFlow.length} steps complete`;
    if (fill) fill.style.width = `${Math.round((doneCount / challengeTaskFlow.length) * 100)}%`;
    if (finishBtn) {
      finishBtn.disabled = doneCount < challengeTaskFlow.length;
      finishBtn.textContent = doneCount >= challengeTaskFlow.length ? `Finish (${challengeTaskFlow.length}/${challengeTaskFlow.length})` : `Finish (${doneCount}/${challengeTaskFlow.length})`;
    }
    updateChallengeScoreUI();
    updateChallengeStationUI(state);
  }

  return {
    clearChallengePacingTimer,
    clearChallengeSprintTimer,
    computeChallengeScore,
    getChallengeChoice,
    getChallengeDoneCount,
    getChallengeInstructionText,
    getFirstIncompleteChallengeTask,
    getNextChallengeTask,
    handleChallengeChoiceSelection,
    renderChallengeChoiceButtons,
    setChallengeFeedback,
    setChallengeActiveTask,
    syncChallengeActionButtons,
    syncChallengePacingTimer,
    syncChallengeResponseSummary,
    updateChallengeProgressUI,
    updateChallengeScoreUI,
    updateChallengeStationUI
  };
}
