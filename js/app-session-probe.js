/**
 * app-session-probe.js
 * Weekly probe panel, recency/risk chips, and probe state progression helpers.
 */

function createSessionProbeModule(deps) {
  const {
    applyChipTone = () => {},
    buildProbeSummary = () => ({}),
    createEmptyProbeState = () => ({}),
    defaultPrefs = {},
    el = () => null,
    formatGradeBandLabel = (value) => String(value || ''),
    formatSignedDelta = (value) => String(value),
    getActiveStudentLabel = () => 'Class',
    getComparableProbeTrend = () => ({ current: null, previous: null, activeMatches: false }),
    getFocusLabel = () => '',
    getGoalEval = () => ({ statusLabel: 'Not set', progressLabel: 'Set accuracy + guesses target.' }),
    getLatestProbeSourceForStudent = () => null,
    matchesProbeRecordStudent = () => false,
    normalizeProbeRounds = (value) => value,
    onRenderStudentGoalPanel = () => {},
    prefs = {},
    probeHistoryRef = null,
    probeStateRef = null,
    saveProbeHistory = () => {},
    setPref = () => {},
    showToast = () => {}
  } = deps || {};

  function getLatestProbePerformance(studentLabel) {
    const trend = getComparableProbeTrend(studentLabel);
    return trend.current || null;
  }

  function getProbeRecencyMeta(studentLabel) {
    const probeState = probeStateRef?.get?.() || {};
    if (probeState.active && matchesProbeRecordStudent(probeState.student, studentLabel)) {
      return {
        label: 'Probe Recency: In progress',
        detail: 'Current probe is active for this student.',
        tone: ''
      };
    }
    const source = getLatestProbeSourceForStudent(studentLabel);
    if (!source) {
      return {
        label: 'Probe Recency: No baseline',
        detail: 'No probe has been recorded for this student yet.',
        tone: 'warn'
      };
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const completedAt = Math.max(0, Number(source.completedAt || source.startedAt || Date.now()));
    const sourceDate = new Date(completedAt);
    const sourceDay = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate()).getTime();
    const now = new Date();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysAgo = Math.max(0, Math.floor((nowDay - sourceDay) / dayMs));
    if (daysAgo <= 7) {
      return { label: `Probe Recency: ${daysAgo}d ago`, detail: 'Probe baseline is current (within 7 days).', tone: 'good' };
    }
    if (daysAgo <= 14) {
      return { label: `Probe Recency: ${daysAgo}d ago`, detail: 'Probe baseline is aging (8-14 days old).', tone: '' };
    }
    return { label: `Probe Recency: ${daysAgo}d ago`, detail: 'Probe baseline is overdue (>14 days old).', tone: 'warn' };
  }

  function getSupportFlagMeta(studentLabel) {
    const current = getLatestProbePerformance(studentLabel);
    if (!current || current.roundsDone <= 0) {
      return {
        label: 'Support Flag: Collect baseline',
        detail: 'Run at least one probe to determine risk band.',
        tone: ''
      };
    }
    const accuracyPct = Math.round(current.accuracyRate * 100);
    const hintPct = Math.round(current.hintRate * 100);
    const avgGuesses = Number(current.avgGuesses.toFixed(1));
    if (accuracyPct < 65 || hintPct >= 60 || avgGuesses >= 5.5) {
      return { label: 'Support Flag: Intensive check-in', detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`, tone: 'warn' };
    }
    if (accuracyPct < 80 || hintPct >= 40 || avgGuesses >= 4.5) {
      return { label: 'Support Flag: Targeted reteach', detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`, tone: 'warn' };
    }
    if (accuracyPct >= 92 && hintPct <= 20 && avgGuesses <= 3) {
      return { label: 'Support Flag: Ready to stretch', detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`, tone: 'good' };
    }
    return { label: 'Support Flag: On track', detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`, tone: '' };
  }

  function renderProbeSupportChips(studentLabel) {
    const recencyEl = el('probe-recency-chip');
    const riskEl = el('session-risk-chip');
    const recency = getProbeRecencyMeta(studentLabel);
    const risk = getSupportFlagMeta(studentLabel);
    if (recencyEl) {
      recencyEl.textContent = recency.label;
      recencyEl.setAttribute('title', recency.detail);
      applyChipTone(recencyEl, recency.tone);
    }
    if (riskEl) {
      riskEl.textContent = risk.label;
      riskEl.setAttribute('title', risk.detail);
      applyChipTone(riskEl, risk.tone);
    }
  }

  function renderProbePanel() {
    const statusEl = el('probe-status');
    const accuracyEl = el('probe-accuracy');
    const avgGuessesEl = el('probe-avg-guesses');
    const avgTimeEl = el('probe-avg-time');
    const hintRateEl = el('probe-hint-rate');
    const trendLabelEl = el('probe-trend-label');
    const trendAccuracyEl = el('probe-trend-accuracy');
    const trendGuessesEl = el('probe-trend-guesses');
    const trendTimeEl = el('probe-trend-time');
    const activeStudent = getActiveStudentLabel();
    const source = getLatestProbeSourceForStudent(activeStudent);
    const summary = buildProbeSummary(source || {});
    const trend = getComparableProbeTrend(activeStudent);
    const probeState = probeStateRef?.get?.() || {};

    renderProbeSupportChips(activeStudent);
    if (statusEl) {
      if (probeState.active && matchesProbeRecordStudent(probeState.student, activeStudent)) {
        statusEl.textContent = `Probe: Active (${probeState.roundsDone}/${probeState.roundsTarget})`;
      } else if (source) {
        const when = new Date(source.completedAt || source.startedAt || Date.now());
        statusEl.textContent = `Probe: Last ${when.toLocaleDateString()}`;
      } else {
        statusEl.textContent = 'Probe: Inactive';
      }
    }
    if (accuracyEl) accuracyEl.textContent = `Accuracy: ${summary.accuracy}`;
    if (avgGuessesEl) avgGuessesEl.textContent = `Avg Guesses: ${summary.avgGuesses}`;
    if (avgTimeEl) avgTimeEl.textContent = `Avg Time: ${summary.avgTime}`;
    if (hintRateEl) hintRateEl.textContent = `Hint Rate: ${summary.hintRate}`;

    if (!trend.current || trend.current.roundsDone <= 0) {
      if (trendLabelEl) {
        trendLabelEl.textContent = 'Trend: Waiting for baseline';
        trendLabelEl.setAttribute('title', 'Complete at least one probe to start trend deltas.');
      }
      if (trendAccuracyEl) trendAccuracyEl.textContent = 'Accuracy Δ: --';
      if (trendGuessesEl) trendGuessesEl.textContent = 'Avg Guesses Δ: --';
      if (trendTimeEl) trendTimeEl.textContent = 'Avg Time Δ: --';
      [trendLabelEl, trendAccuracyEl, trendGuessesEl, trendTimeEl].forEach((node) => applyChipTone(node, ''));
      onRenderStudentGoalPanel();
      return;
    }

    if (!trend.previous || trend.previous.roundsDone <= 0) {
      if (trendLabelEl) {
        trendLabelEl.textContent = trend.activeMatches ? 'Trend: In-progress baseline' : 'Trend: First baseline';
        trendLabelEl.setAttribute('title', 'Need one more probe for week-over-week delta.');
      }
      if (trendAccuracyEl) trendAccuracyEl.textContent = 'Accuracy Δ: baseline';
      if (trendGuessesEl) trendGuessesEl.textContent = 'Avg Guesses Δ: baseline';
      if (trendTimeEl) trendTimeEl.textContent = 'Avg Time Δ: baseline';
      [trendLabelEl, trendAccuracyEl, trendGuessesEl, trendTimeEl].forEach((node) => applyChipTone(node, ''));
      onRenderStudentGoalPanel();
      return;
    }

    const accuracyDeltaPts = (trend.current.accuracyRate - trend.previous.accuracyRate) * 100;
    const guessesDelta = trend.current.avgGuesses - trend.previous.avgGuesses;
    const timeDeltaSec = trend.current.avgTimeSeconds - trend.previous.avgTimeSeconds;

    if (trendLabelEl) {
      trendLabelEl.textContent = trend.activeMatches ? 'Trend: Live vs last probe' : 'Trend: Week-over-week';
      trendLabelEl.setAttribute('title', 'Compares current probe results to the previous probe for this student.');
    }
    if (trendAccuracyEl) {
      trendAccuracyEl.textContent = `Accuracy Δ: ${formatSignedDelta(accuracyDeltaPts)} pts`;
      applyChipTone(trendAccuracyEl, accuracyDeltaPts > 0 ? 'good' : accuracyDeltaPts < 0 ? 'warn' : '');
    }
    if (trendGuessesEl) {
      trendGuessesEl.textContent = `Avg Guesses Δ: ${formatSignedDelta(guessesDelta)}`;
      applyChipTone(trendGuessesEl, guessesDelta < 0 ? 'good' : guessesDelta > 0 ? 'warn' : '');
    }
    if (trendTimeEl) {
      trendTimeEl.textContent = `Avg Time Δ: ${formatSignedDelta(timeDeltaSec)}s`;
      applyChipTone(trendTimeEl, timeDeltaSec < 0 ? 'good' : timeDeltaSec > 0 ? 'warn' : '');
    }
    applyChipTone(trendLabelEl, '');
    onRenderStudentGoalPanel();
  }

  function startWeeklyProbe() {
    const probeState = probeStateRef?.get?.() || {};
    if (probeState.active) {
      showToast('Weekly probe is already active.');
      return;
    }
    const targetSelect = el('s-probe-rounds');
    const normalizedRounds = normalizeProbeRounds(targetSelect?.value || prefs.probeRounds || defaultPrefs.probeRounds);
    if (targetSelect) targetSelect.value = normalizedRounds;
    setPref('probeRounds', normalizedRounds);
    probeStateRef?.set?.({
      active: true,
      startedAt: Date.now(),
      roundsTarget: Number.parseInt(normalizedRounds, 10),
      roundsDone: 0,
      wins: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      hintRounds: 0,
      focusLabel: getFocusLabel(el('setting-focus')?.value || prefs.focus || 'all').replace(/[—]/g, '').trim(),
      gradeLabel: formatGradeBandLabel(el('s-grade')?.value || prefs.grade || defaultPrefs.grade),
      student: getActiveStudentLabel()
    });
    renderProbePanel();
    showToast(`Weekly probe started (${probeStateRef?.get?.().roundsTarget || normalizedRounds} rounds).`);
  }

  function finishWeeklyProbe(options = {}) {
    const silent = !!options.silent;
    const probeState = probeStateRef?.get?.() || {};
    if (!probeState.active) {
      if (!silent) showToast('No active probe to stop.');
      return;
    }
    const record = {
      startedAt: probeState.startedAt,
      completedAt: Date.now(),
      roundsTarget: probeState.roundsTarget,
      roundsDone: probeState.roundsDone,
      wins: probeState.wins,
      totalGuesses: probeState.totalGuesses,
      totalDurationMs: probeState.totalDurationMs,
      hintRounds: probeState.hintRounds,
      focusLabel: probeState.focusLabel,
      gradeLabel: probeState.gradeLabel,
      student: probeState.student
    };
    const probeHistory = Array.isArray(probeHistoryRef?.get?.()) ? probeHistoryRef.get() : [];
    probeHistory.unshift(record);
    probeHistoryRef?.set?.(probeHistory.slice(0, 24));
    saveProbeHistory();
    probeStateRef?.set?.(createEmptyProbeState());
    renderProbePanel();
    if (!silent) {
      const summary = buildProbeSummary(record);
      showToast(`Probe saved: ${summary.accuracy} accuracy across ${record.roundsDone} rounds.`);
    }
  }

  function recordProbeRound(result, roundMetrics) {
    const probeState = probeStateRef?.get?.() || {};
    if (!probeState.active) return;
    const nextState = {
      ...probeState,
      roundsDone: probeState.roundsDone + 1,
      wins: probeState.wins + (result?.won ? 1 : 0),
      totalGuesses: probeState.totalGuesses + Math.max(0, Number(roundMetrics?.guessesUsed) || 0),
      totalDurationMs: probeState.totalDurationMs + Math.max(0, Number(roundMetrics?.durationMs) || 0),
      hintRounds: probeState.hintRounds + (roundMetrics?.hintRequested ? 1 : 0)
    };
    probeStateRef?.set?.(nextState);
    if (nextState.roundsDone >= nextState.roundsTarget) {
      finishWeeklyProbe();
      return;
    }
    renderProbePanel();
  }

  function buildProbeSummaryText(options = {}) {
    const studentLabel = String(options.student || getActiveStudentLabel()).trim() || 'Class';
    const source = getLatestProbeSourceForStudent(studentLabel);
    if (!source) return 'No weekly probe results yet.';
    const summary = buildProbeSummary(source);
    const startedAt = new Date(source.startedAt || Date.now());
    const completedAt = source.completedAt ? new Date(source.completedAt) : null;
    return [
      'WordQuest Weekly Probe Summary',
      `Student: ${source.student || studentLabel || 'Class'}`,
      `Focus: ${source.focusLabel || 'Mixed'}`,
      `Grade: ${source.gradeLabel || 'All'}`,
      `Started: ${startedAt.toLocaleString()}`,
      completedAt ? `Completed: ${completedAt.toLocaleString()}` : 'Completed: In progress',
      `Rounds: ${source.roundsDone}/${source.roundsTarget}`,
      `Accuracy: ${summary.accuracy}`,
      `Avg Guesses: ${summary.avgGuesses}`,
      `Avg Time: ${summary.avgTime}`,
      `Hint Rate: ${summary.hintRate}`
    ].filter(Boolean).join('\n');
  }

  return {
    buildProbeSummaryText,
    finishWeeklyProbe,
    getLatestProbePerformance,
    getProbeRecencyMeta,
    getSupportFlagMeta,
    recordProbeRound,
    renderProbePanel,
    renderProbeSupportChips,
    startWeeklyProbe
  };
}

window.createSessionProbeModule = createSessionProbeModule;
