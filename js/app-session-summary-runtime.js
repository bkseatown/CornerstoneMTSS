/**
 * app-session-summary-runtime.js
 * Session summary rendering and mission-lab summary helpers.
 */

function createSessionSummaryRuntimeModule(deps) {
  const {
    challengeReflectionKey = '',
    challengeStrongScoreMin = 75,
    challengeTaskFlow = Object.freeze(['listen', 'analyze', 'create']),
    deepDiveBuilders = null,
    deepDiveState = null,
    el = () => null,
    gameplaySupport = null,
    getActiveStudentLabel = () => 'Class',
    getSessionSummary = () => ({}),
    getTopMasteryEntry = () => null,
    getWQGameState = () => null,
    localStorageRef = null,
    gameplayStats = null,
    renderAdoptionHealthPanel = () => {},
    renderMasteryTable = () => {},
    renderMiniLessonPanel = () => {},
    renderProbePanel = () => {},
    renderTelemetryDashboards = () => {},
    saveSessionSummaryState = () => {},
    setSessionSummary = () => {},
    syncRoundTrackingLocals = () => {}
  } = deps || {};

  function getMissionLabRecords(options = {}) {
    const newestFirst = options.newestFirst !== false;
    const sessionOnly = !!options.sessionOnly;
    const sessionSummary = getSessionSummary();
    const startedAt = Math.max(0, Number(options.startedAt || sessionSummary?.startedAt || 0));
    const studentFilterRaw = String(options.student || '').trim();
    const studentFilter = studentFilterRaw && studentFilterRaw !== 'Class' ? studentFilterRaw : '';
    let records = [];
    try {
      const raw = JSON.parse(localStorageRef?.getItem?.(challengeReflectionKey) || '[]');
      records = Array.isArray(raw) ? raw : [];
    } catch {
      records = [];
    }
    const normalized = records
      .filter((record) => record && typeof record === 'object')
      .map((record) => {
        const tasks = record.tasks && typeof record.tasks === 'object' ? record.tasks : {};
        const taskOutcomesRaw = Array.isArray(record.taskOutcomes) ? record.taskOutcomes : [];
        const taskOutcomesByTask = taskOutcomesRaw.reduce((map, row) => {
          const key = String(row?.task || '').trim();
          if (!key) return map;
          map[key] = row;
          return map;
        }, Object.create(null));
        const taskOutcomes = challengeTaskFlow.map((task) => {
          const row = taskOutcomesByTask[task];
          return {
            task,
            complete: typeof row?.complete === 'boolean' ? !!row.complete : !!tasks?.[task],
            attempts: Math.max(0, Number(row?.attempts) || 0)
          };
        });
        const score = Math.max(0, Number(record.score) || 0);
        const doneCount = ['listen', 'analyze', 'create']
          .reduce((count, task) => count + (taskOutcomes.find((row) => row.task === task)?.complete ? 1 : 0), 0);
        const attemptTotal = taskOutcomes.reduce((sum, row) => sum + row.attempts, 0);
        const completed = typeof record.completed === 'boolean'
          ? !!record.completed
          : doneCount >= 2;
        const onTime = completed
          ? (typeof record.onTime === 'boolean' ? !!record.onTime : false)
          : false;
        return {
          attemptId: String(record.attemptId || '').trim(),
          source: String(record.source || 'reveal').trim() || 'reveal',
          student: String(record.student || 'Class').trim() || 'Class',
          ts: Math.max(0, Number(record.ts) || 0),
          word: String(record.word || '').trim().toUpperCase(),
          topic: String(record.topic || '').trim(),
          grade: String(record.grade || '').trim(),
          level: deepDiveBuilders?.normalizeThinkingLevel?.(record.level, 'apply') || 'apply',
          score,
          scoreBand: String(record.scoreBand || (deepDiveState?.resolveMissionScoreBand?.(score) || 'Launch')).trim() || (deepDiveState?.resolveMissionScoreBand?.(score) || 'Launch'),
          clarity: Math.max(0, Number(record.clarity) || 0),
          evidence: Math.max(0, Number(record.evidence) || 0),
          vocabulary: Math.max(0, Number(record.vocabulary) || 0),
          completed,
          onTime,
          secondsLeft: Math.max(0, Number(record.secondsLeft) || 0),
          analyze: String(record.analyze || '').trim(),
          create: String(record.create || '').trim(),
          tasks: {
            listen: !!taskOutcomes.find((row) => row.task === 'listen')?.complete,
            analyze: !!taskOutcomes.find((row) => row.task === 'analyze')?.complete,
            create: !!taskOutcomes.find((row) => row.task === 'create')?.complete
          },
          taskOutcomes,
          attemptTotal,
          avgAttemptsPerStation: attemptTotal / challengeTaskFlow.length
        };
      })
      .filter((record) => record.ts > 0);
    const sessionScoped = sessionOnly && startedAt > 0
      ? normalized.filter((record) => record.ts >= startedAt)
      : normalized;
    const studentScoped = studentFilter
      ? sessionScoped.filter((record) => record.student === studentFilter)
      : sessionScoped;
    studentScoped.sort((a, b) => newestFirst ? (b.ts - a.ts) : (a.ts - b.ts));
    return studentScoped;
  }

  function buildMissionSummaryStats(options = {}) {
    const records = getMissionLabRecords(options);
    if (!records.length) {
      return {
        records,
        count: 0,
        avgScore: 0,
        avgAttemptsPerStation: 0,
        completionRate: 0,
        completedCount: 0,
        onTimeRate: 0,
        strongRate: 0,
        topLevel: '',
        topLevelLabel: '--'
      };
    }
    const totalScore = records.reduce((sum, record) => sum + Math.max(0, Number(record.score) || 0), 0);
    const completedCount = records.reduce((count, record) => count + (record.completed ? 1 : 0), 0);
    const onTimeCount = records.reduce((count, record) => count + (record.completed && record.onTime ? 1 : 0), 0);
    const totalAttempts = records.reduce((sum, record) => sum + Math.max(0, Number(record.attemptTotal) || 0), 0);
    const strongCount = records.reduce((count, record) => (
      count + (record.score >= challengeStrongScoreMin ? 1 : 0)
    ), 0);
    const levelCounts = records.reduce((map, record) => {
      const level = deepDiveBuilders?.normalizeThinkingLevel?.(record.level, '') || '';
      if (!level) return map;
      map[level] = (map[level] || 0) + 1;
      return map;
    }, Object.create(null));
    const topLevel = Object.entries(levelCounts)
      .sort((a, b) => (b[1] - a[1]) || String(a[0]).localeCompare(String(b[0])))
      .map(([level]) => level)[0] || '';
    return {
      records,
      count: records.length,
      avgScore: totalScore / records.length,
      avgAttemptsPerStation: (totalAttempts / records.length) / challengeTaskFlow.length,
      completionRate: completedCount / records.length,
      completedCount,
      onTimeRate: completedCount ? (onTimeCount / completedCount) : 0,
      strongRate: strongCount / records.length,
      topLevel,
      topLevelLabel: topLevel ? (deepDiveBuilders?.getChallengeLevelDisplay?.(topLevel) || topLevel) : '--'
    };
  }

  function renderSessionSummary() {
    const sessionSummary = getSessionSummary();
    const roundsEl = el('session-rounds');
    const winRateEl = el('session-win-rate');
    const hintRoundsEl = el('session-hint-rounds');
    const voiceAttemptsEl = el('session-voice-attempts');
    const topSkillEl = el('session-top-skill');
    const masteryRateEl = el('session-mastery-rate');
    const avgGuessesEl = el('session-avg-guesses');
    const avgTimeEl = el('session-avg-time');
    const topErrorEl = el('session-top-error');
    const nextStepEl = el('session-next-step');
    const studentEl = el('session-active-student');
    const missionCountEl = el('session-mission-count');
    const missionScoreEl = el('session-mission-score');
    const missionCompletionEl = el('session-mission-complete');
    const missionLevelEl = el('session-mission-level');

    if (roundsEl) roundsEl.textContent = `Rounds: ${sessionSummary.rounds}`;
    if (winRateEl) {
      const winRate = sessionSummary.rounds
        ? `${Math.round((sessionSummary.wins / sessionSummary.rounds) * 100)}%`
        : '--';
      winRateEl.textContent = `Win Rate: ${winRate}`;
    }
    if (hintRoundsEl) hintRoundsEl.textContent = `Hint Rounds: ${sessionSummary.hintRounds}`;
    if (voiceAttemptsEl) voiceAttemptsEl.textContent = `Voice Attempts: ${sessionSummary.voiceAttempts}`;
    if (studentEl) studentEl.textContent = `Student: ${getActiveStudentLabel()}`;

    const topSkill = getTopMasteryEntry();
    const avgGuesses = sessionSummary.rounds
      ? (sessionSummary.totalGuesses / sessionSummary.rounds).toFixed(1)
      : '--';
    const avgTime = sessionSummary.rounds
      ? (gameplaySupport?.formatDurationLabel?.(sessionSummary.totalDurationMs / sessionSummary.rounds) || '0s')
      : '--';
    if (topSkillEl) topSkillEl.textContent = `Top Skill: ${topSkill?.label || '--'}`;
    if (masteryRateEl) {
      const masteryRate = topSkill?.accuracyLabel || '--';
      masteryRateEl.textContent = `Mastery: ${masteryRate}`;
    }
    if (avgGuessesEl) avgGuessesEl.textContent = `Avg Guesses: ${avgGuesses}`;
    if (avgTimeEl) avgTimeEl.textContent = `Avg Time: ${avgTime}`;
    if (topErrorEl) topErrorEl.textContent = `Top Error: ${gameplaySupport?.getTopErrorLabel?.(sessionSummary.errorTotals) || '--'}`;
    if (nextStepEl) {
      const chipLabel = gameplaySupport?.getInstructionalNextStepChip?.(sessionSummary.errorTotals) || 'Stay Current Target';
      const nextStep = gameplaySupport?.getInstructionalNextStep?.(sessionSummary.errorTotals) || 'Continue current lesson target.';
      nextStepEl.textContent = `Next Step: ${chipLabel}`;
      nextStepEl.setAttribute('title', nextStep);
    }
    const activeStudent = getActiveStudentLabel();
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    if (missionCountEl) missionCountEl.textContent = `Deep Dive Rounds: ${missionStats.count}`;
    if (missionScoreEl) {
      missionScoreEl.textContent = missionStats.count
        ? `Deep Dive Avg Score: ${Math.round(missionStats.avgScore)}/100 · Strong+ ${Math.round(missionStats.strongRate * 100)}%`
        : 'Deep Dive Avg Score: --';
    }
    if (missionCompletionEl) {
      missionCompletionEl.textContent = missionStats.count
        ? `Deep Dive Completion: ${Math.round(missionStats.completionRate * 100)}% · Avg Attempts ${missionStats.avgAttemptsPerStation.toFixed(1)}/station`
        : 'Deep Dive Completion: --';
    }
    if (missionLevelEl) {
      missionLevelEl.textContent = `Deep Dive Top Level: ${missionStats.topLevelLabel} · On-time ${missionStats.completedCount ? `${Math.round(missionStats.onTimeRate * 100)}%` : '--'}`;
    }
    renderAdoptionHealthPanel();
    renderTelemetryDashboards();
    renderMasteryTable();
    renderMiniLessonPanel();
  }

  function resetSessionSummary() {
    setSessionSummary({
      rounds: 0,
      wins: 0,
      hintRounds: 0,
      voiceAttempts: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      errorTotals: Object.create(null),
      masteryBySkill: Object.create(null),
      startedAt: Date.now()
    });
    saveSessionSummaryState();
    renderSessionSummary();
    renderProbePanel();
  }

  function recordSessionRound(result, roundMetrics = {}) {
    const sessionSummary = getSessionSummary();
    sessionSummary.rounds += 1;
    if (result?.won) sessionSummary.wins += 1;
    if (roundMetrics.hintRequested) sessionSummary.hintRounds += 1;
    sessionSummary.voiceAttempts += Math.max(0, Number(roundMetrics.voiceAttempts) || 0);
    sessionSummary.totalGuesses += Math.max(0, Number(roundMetrics.guessesUsed) || 0);
    sessionSummary.totalDurationMs += Math.max(0, Number(roundMetrics.durationMs) || 0);
    gameplaySupport?.mergeCounterMaps?.(sessionSummary.errorTotals, roundMetrics.errorCounts);

    const skillKey = String(roundMetrics.skillKey || 'classic:all').trim();
    const prior = sessionSummary.masteryBySkill[skillKey] || {
      label: String(roundMetrics.skillLabel || 'Classic mixed practice'),
      rounds: 0,
      wins: 0,
      hintRounds: 0,
      voiceAttempts: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      errorCounts: Object.create(null)
    };
    prior.label = String(roundMetrics.skillLabel || prior.label || skillKey);
    prior.rounds += 1;
    if (result?.won) prior.wins += 1;
    if (roundMetrics.hintRequested) prior.hintRounds += 1;
    prior.voiceAttempts += Math.max(0, Number(roundMetrics.voiceAttempts) || 0);
    prior.totalGuesses += Math.max(0, Number(roundMetrics.guessesUsed) || 0);
    prior.totalDurationMs += Math.max(0, Number(roundMetrics.durationMs) || 0);
    prior.errorCounts = gameplaySupport?.mergeCounterMaps?.(prior.errorCounts || Object.create(null), roundMetrics.errorCounts)
      || (prior.errorCounts || Object.create(null));
    sessionSummary.masteryBySkill[skillKey] = prior;

    saveSessionSummaryState();
    renderSessionSummary();
  }

  function recordVoiceAttempt() {
    const state = getWQGameState();
    if (state?.word && !state?.gameOver) {
      gameplayStats?.incrementVoiceAttempts?.();
      syncRoundTrackingLocals();
    } else {
      const sessionSummary = getSessionSummary();
      sessionSummary.voiceAttempts += 1;
      saveSessionSummaryState();
      renderSessionSummary();
    }
  }

  return Object.freeze({
    buildMissionSummaryStats,
    getMissionLabRecords,
    recordSessionRound,
    recordVoiceAttempt,
    renderSessionSummary,
    resetSessionSummary
  });
}

window.createSessionSummaryRuntimeModule = createSessionSummaryRuntimeModule;
