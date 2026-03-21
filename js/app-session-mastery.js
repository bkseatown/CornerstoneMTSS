/**
 * app-session-mastery.js
 * Student goal state and mastery table helpers for session reporting.
 */

function createSessionMasteryModule(deps) {
  const {
    applyChipTone = () => {},
    el = () => null,
    formatSignedDelta = (value) => String(value),
    formatDurationLabel = () => '0s',
    getActiveStudentLabel = () => 'Class',
    getComparableProbeTrend = () => ({ current: null, previous: null, activeMatches: false }),
    getGoalForStudent = () => null,
    getLatestProbePerformance = () => null,
    getTopErrorKey = () => '',
    getTopErrorLabel = () => '--',
    normalizeCounterMap = () => Object.create(null),
    normalizeMasteryFilter = (value) => value,
    normalizeMasterySort = (value) => value,
    sessionSummary = {}
  } = deps || {};

  function evaluateStudentGoalState(studentLabel) {
    const goal = getGoalForStudent(studentLabel);
    if (!goal) {
      return {
        statusLabel: 'Not set',
        progressLabel: 'Set accuracy + guesses target.',
        tone: '',
        goal,
        current: null
      };
    }
    const current = getLatestProbePerformance(studentLabel);
    if (!current || current.roundsDone <= 0) {
      return {
        statusLabel: 'Waiting for probe data',
        progressLabel: `Targets ${goal.accuracyTarget}% and ${goal.avgGuessesTarget} guesses`,
        tone: '',
        goal,
        current: null
      };
    }
    const accuracyPct = Math.round(current.accuracyRate * 100);
    const avgGuess = Number(current.avgGuesses.toFixed(1));
    const accuracyMet = accuracyPct >= goal.accuracyTarget;
    const guessMet = avgGuess <= goal.avgGuessesTarget;
    let statusLabel = 'Partial';
    let tone = '';
    if (accuracyMet && guessMet) {
      statusLabel = 'On Track';
      tone = 'good';
    } else if (!accuracyMet && !guessMet) {
      statusLabel = 'Needs Support';
      tone = 'warn';
    }
    return {
      statusLabel,
      progressLabel: `${accuracyPct}%/${goal.accuracyTarget}% · ${avgGuess}/${goal.avgGuessesTarget} guesses`,
      tone,
      goal,
      current
    };
  }

  function renderStudentGoalPanel() {
    const activeStudent = getActiveStudentLabel();
    const goalEval = evaluateStudentGoalState(activeStudent);
    const goal = goalEval.goal;
    const accuracyInput = el('s-goal-accuracy');
    const guessesInput = el('s-goal-guesses');
    const statusEl = el('session-goal-status');
    const progressEl = el('session-goal-progress');

    if (accuracyInput && !accuracyInput.matches(':focus')) {
      accuracyInput.value = goal ? String(goal.accuracyTarget) : '';
    }
    if (guessesInput && !guessesInput.matches(':focus')) {
      guessesInput.value = goal ? String(goal.avgGuessesTarget) : '';
    }

    if (!statusEl || !progressEl) return;
    statusEl.textContent = `Goal: ${goalEval.statusLabel}`;
    progressEl.textContent = `Goal Progress: ${goalEval.progressLabel}`;
    statusEl.setAttribute('title', `Student goal status for ${activeStudent}.`);
    progressEl.setAttribute('title', goalEval.current
      ? `Based on latest probe (${goalEval.current.roundsDone} rounds).`
      : 'Run a weekly probe to score this goal.');
    applyChipTone(statusEl, goalEval.tone);
    applyChipTone(progressEl, goalEval.tone);
  }

  function getMasteryRowsForDisplay() {
    return Object.entries(sessionSummary.masteryBySkill || {})
      .map(([skillKey, row]) => {
        if (!row || typeof row !== 'object') return null;
        const attempts = Math.max(0, Math.floor(Number(row.rounds) || 0));
        if (!attempts) return null;
        const wins = Math.max(0, Math.floor(Number(row.wins) || 0));
        const hintRounds = Math.max(0, Math.floor(Number(row.hintRounds) || 0));
        const voiceAttempts = Math.max(0, Math.floor(Number(row.voiceAttempts) || 0));
        const totalGuesses = Math.max(0, Number(row.totalGuesses) || 0);
        const totalDurationMs = Math.max(0, Number(row.totalDurationMs) || 0);
        const accuracyRate = attempts ? wins / attempts : 0;
        const hintRate = attempts ? hintRounds / attempts : 0;
        const avgGuesses = attempts ? totalGuesses / attempts : 0;
        const avgTimeMs = attempts ? totalDurationMs / attempts : 0;
        const errorCounts = normalizeCounterMap(row.errorCounts);
        const topErrorKey = getTopErrorKey(errorCounts) || '';
        return {
          skillKey,
          label: String(row.label || skillKey).trim() || 'Skill',
          attempts,
          wins,
          hintRounds,
          voiceAttempts,
          accuracyRate,
          accuracyLabel: attempts ? `${Math.round(accuracyRate * 100)}%` : '--',
          hintRate,
          hintRateLabel: attempts ? `${Math.round(hintRate * 100)}%` : '--',
          avgGuesses,
          avgGuessesLabel: attempts ? avgGuesses.toFixed(1) : '--',
          avgTimeMs,
          avgTimeLabel: attempts ? (formatDurationLabel(avgTimeMs) || '0s') : '--',
          avgTimeSeconds: attempts ? Number((avgTimeMs / 1000).toFixed(1)) : 0,
          topErrorKey,
          topErrorLabel: getTopErrorLabel(errorCounts) || '--',
          errorCounts
        };
      })
      .filter(Boolean);
  }

  function describeMasterySortMode(mode) {
    switch (normalizeMasterySort(mode)) {
      case 'accuracy_desc': return 'accuracy (high to low)';
      case 'hint_rate_desc': return 'hint rate (high to low)';
      case 'voice_desc': return 'voice attempts (high to low)';
      case 'top_error': return 'top error pattern';
      case 'attempts_desc':
      default:
        return 'attempts (high to low)';
    }
  }

  function describeMasteryFilterMode(mode) {
    switch (normalizeMasteryFilter(mode)) {
      case 'needs_support': return 'needs support';
      case 'high_hints': return 'high hint rate';
      case 'vowel_pattern': return 'top error: vowel pattern';
      case 'blend_position': return 'top error: blend position';
      case 'morpheme_ending': return 'top error: morpheme ending';
      case 'context_strategy': return 'top error: clue strategy';
      case 'all':
      default:
        return 'all skills';
    }
  }

  function getMasterySortMode() {
    const select = el('s-mastery-sort');
    return normalizeMasterySort(select?.value || 'attempts_desc');
  }

  function getMasteryFilterMode() {
    const select = el('s-mastery-filter');
    return normalizeMasteryFilter(select?.value || 'all');
  }

  function compareMasteryRows(a, b, mode = 'attempts_desc') {
    const sortMode = normalizeMasterySort(mode);
    const alpha = (left, right) => String(left || '').localeCompare(String(right || ''));
    if (sortMode === 'accuracy_desc') {
      if (b.accuracyRate !== a.accuracyRate) return b.accuracyRate - a.accuracyRate;
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return alpha(a.label, b.label);
    }
    if (sortMode === 'hint_rate_desc') {
      if (b.hintRate !== a.hintRate) return b.hintRate - a.hintRate;
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return alpha(a.label, b.label);
    }
    if (sortMode === 'voice_desc') {
      if (b.voiceAttempts !== a.voiceAttempts) return b.voiceAttempts - a.voiceAttempts;
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return alpha(a.label, b.label);
    }
    if (sortMode === 'top_error') {
      const aErr = a.topErrorKey || 'zzzz';
      const bErr = b.topErrorKey || 'zzzz';
      if (aErr !== bErr) return alpha(aErr, bErr);
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return alpha(a.label, b.label);
    }
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    if (b.accuracyRate !== a.accuracyRate) return b.accuracyRate - a.accuracyRate;
    return alpha(a.label, b.label);
  }

  function rowMatchesMasteryFilter(row, mode = 'all') {
    const filterMode = normalizeMasteryFilter(mode);
    if (filterMode === 'all') return true;
    if (filterMode === 'needs_support') {
      return row.accuracyRate < 0.75 || row.hintRate >= 0.4 || !!row.topErrorKey;
    }
    if (filterMode === 'high_hints') {
      return row.hintRate >= 0.4;
    }
    return row.topErrorKey === filterMode;
  }

  function getVisibleMasteryRows() {
    const sortMode = getMasterySortMode();
    const filterMode = getMasteryFilterMode();
    const allRows = getMasteryRowsForDisplay();
    const rows = allRows
      .filter((row) => rowMatchesMasteryFilter(row, filterMode))
      .sort((a, b) => compareMasteryRows(a, b, sortMode));
    return { rows, allRows, sortMode, filterMode };
  }

  function getTopMasteryEntry() {
    const rows = getMasteryRowsForDisplay().sort((a, b) => compareMasteryRows(a, b, 'attempts_desc'));
    return rows[0] || null;
  }

  function renderMasteryTable() {
    const tableBody = el('session-mastery-table-body');
    if (!tableBody) return;
    const sortSelect = el('s-mastery-sort');
    const filterSelect = el('s-mastery-filter');
    const filterNote = el('session-mastery-filter-note');
    const { rows, allRows, sortMode, filterMode } = getVisibleMasteryRows();
    if (sortSelect && sortSelect.value !== sortMode) sortSelect.value = sortMode;
    if (filterSelect && filterSelect.value !== filterMode) filterSelect.value = filterMode;
    if (filterNote) {
      if (!allRows.length) {
        filterNote.textContent = 'Showing all skills.';
      } else {
        filterNote.textContent = `Showing ${rows.length} of ${allRows.length} skills · filter: ${describeMasteryFilterMode(filterMode)} · sort: ${describeMasterySortMode(sortMode)}.`;
      }
    }
    tableBody.innerHTML = '';
    if (!allRows.length || !rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.className = 'teacher-mastery-table-empty';
      td.textContent = allRows.length ? 'No skill rows match the current filter.' : 'No skill rounds yet.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const values = [
        row.label,
        row.accuracyLabel,
        String(row.attempts),
        `${row.hintRounds} (${row.hintRateLabel})`,
        String(row.voiceAttempts),
        row.avgGuessesLabel,
        row.avgTimeLabel,
        row.topErrorLabel
      ];
      values.forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });
  }

  return {
    compareMasteryRows,
    describeMasteryFilterMode,
    describeMasterySortMode,
    evaluateStudentGoalState,
    formatSignedDelta,
    getLatestProbePerformance,
    getMasteryFilterMode,
    getMasteryRowsForDisplay,
    getMasterySortMode,
    getTopMasteryEntry,
    getVisibleMasteryRows,
    renderMasteryTable,
    renderStudentGoalPanel,
    rowMatchesMasteryFilter
  };
}

window.createSessionMasteryModule = createSessionMasteryModule;
