/**
 * app-deep-dive-session.js
 * Deep Dive session lifecycle helpers: build, launch sync, save, and finish.
 */

function createDeepDiveSessionModule(deps) {
  const {
    challengeCompleteLines = [],
    challengeRanks = [],
    challengeReflectionKey = '',
    challengeTaskFlow = [],
    closeRevealChallengeModal = () => {},
    deepDiveBuilders = null,
    deepDiveState = null,
    deepDiveUi = null,
    el = () => null,
    emitTelemetry = () => {},
    getActiveStudentLabel = () => '',
    getChallengeGradeLabel = () => '',
    getChallengeTopicLabel = () => '',
    getRevealChallengeState = () => null,
    isConsecutiveDay = () => false,
    isMissionLabEnabled = () => false,
    isMissionLabStandaloneMode = () => false,
    localDayKey = () => '',
    localStorageRef = null,
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    pickRandom = () => '',
    renderSessionSummary = () => {},
    setChallengeFeedback = () => {},
    setRevealChallengeState = () => {},
    setTimeoutRef = setTimeout,
    setWrapText = () => {},
    syncUi = () => {},
    buildThinkingChallenge = () => null
  } = deps || {};

  function persistRevealChallengeRecord(record) {
    if (!record || typeof record !== 'object' || !localStorageRef) return false;
    try {
      const prior = JSON.parse(localStorageRef.getItem(challengeReflectionKey) || '[]');
      const rows = Array.isArray(prior) ? prior : [];
      const attemptId = String(record.attemptId || '').trim();
      if (attemptId) {
        const existingIndex = rows.findIndex((row) => String(row?.attemptId || '').trim() === attemptId);
        if (existingIndex >= 0) rows.splice(existingIndex, 1);
      }
      const duplicate = rows.find((row, index) => {
        if (index > 4) return false;
        if (!row || typeof row !== 'object') return false;
        if (Math.abs((Number(row.ts) || 0) - (Number(record.ts) || 0)) > 1400) return false;
        return String(row.word || '') === String(record.word || '') &&
          String(row.level || '') === String(record.level || '') &&
          String(row.analyze || '') === String(record.analyze || '') &&
          String(row.create || '') === String(record.create || '');
      });
      if (duplicate) return false;
      rows.unshift(record);
      localStorageRef.setItem(challengeReflectionKey, JSON.stringify(rows.slice(0, 80)));
      return true;
    } catch {
      return false;
    }
  }

  function buildRevealChallengeState(result, options = {}) {
    if (!result?.word) return null;
    const challenge = buildThinkingChallenge(result, {
      level: options.level
    });
    if (!challenge) return null;
    const word = String(result.word || '').trim().toUpperCase();
    const state = {
      attemptId: deepDiveState?.createMissionAttemptId?.() || `mission-${Date.now().toString(36)}-fallback`,
      result,
      word,
      topic: getChallengeTopicLabel(result),
      grade: getChallengeGradeLabel(result),
      source: String(options.source || 'reveal').trim() || 'reveal',
      challenge,
      tasks: { listen: false, analyze: false, create: false },
      activeTask: challengeTaskFlow[0],
      responses: { analyze: '', create: '' },
      deepDive: deepDiveBuilders?.buildDeepDiveState?.(result),
      pacing: { task: challengeTaskFlow[0], startedAt: Date.now(), nudged: false },
      score: { clarity: 0, evidence: 0, vocabulary: 0, total: 0 },
      completedAt: 0
    };
    deepDiveUi?.syncChallengeResponseSummary?.(state);
    return state;
  }

  function syncRevealChallengeLaunch(result) {
    const wrap = el('modal-challenge-launch');
    const meta = el('modal-challenge-launch-meta');
    const helper = el('modal-challenge-launch-helper');
    if (!wrap || !meta) return;

    if (!isMissionLabEnabled() || !isMissionLabStandaloneMode()) {
      setRevealChallengeState(null);
      meta.textContent = '';
      setWrapText(helper, '');
      wrap.classList.add('hidden');
      syncUi();
      return;
    }

    const next = buildRevealChallengeState(result);
    setRevealChallengeState(next);
    if (!next) {
      meta.textContent = '';
      setWrapText(helper, '');
      wrap.classList.add('hidden');
      syncUi();
      return;
    }

    meta.textContent = `${next.topic} · Grade ${next.grade} · ${challengeTaskFlow.length} steps`;
    setWrapText(helper, 'Optional extension: finish 3 steps in order. You can also launch from Activities > Deep Dive.');
    wrap.classList.remove('hidden');
    setChallengeFeedback('');
    syncUi();
  }

  function saveRevealChallengeResponses(options = {}) {
    const state = getRevealChallengeState();
    if (!state) return false;
    const requireProgress = options.requireText !== false;
    const silent = !!options.silent;
    deepDiveUi?.syncChallengeResponseSummary?.(state);
    const analyzeText = String(state.responses.analyze || '').trim();
    const createText = String(state.responses.create || '').trim();
    const doneCount = deepDiveUi?.getChallengeDoneCount?.(state) || 0;
    if (requireProgress && doneCount <= 0) {
      setChallengeFeedback('Complete at least one step before saving.', 'warn');
      return false;
    }
    const score = deepDiveUi?.computeChallengeScore?.(state) || { total: 0, clarity: 0, evidence: 0, vocabulary: 0 };
    const scoreBand = deepDiveState?.resolveMissionScoreBand?.(score.total) || 'Launch';
    const saveTs = Date.now();
    const completedAt = Math.max(0, Number(state.completedAt) || 0);
    const completed = completedAt > 0 || doneCount >= challengeTaskFlow.length;
    const completionTs = completedAt || saveTs;
    const record = {
      attemptId: String(state.attemptId || ''),
      source: String(state.source || 'reveal').trim() || 'reveal',
      deepDiveVersion: '1.1.0',
      deepDiveSchemaVersion: 1,
      student: getActiveStudentLabel(),
      ts: completionTs,
      word: state.word,
      topic: state.topic,
      grade: state.grade,
      level: state.challenge.level,
      score: score.total,
      scoreBand,
      clarity: score.clarity,
      evidence: score.evidence,
      vocabulary: score.vocabulary,
      completed,
      onTime: completed,
      secondsLeft: 0,
      analyze: analyzeText,
      create: createText,
      tasks: { ...state.tasks },
      taskOutcomes: challengeTaskFlow.map((task) => ({
        task,
        complete: !!state.tasks?.[task],
        attempts: Math.max(0, Number(state.deepDive?.attempts?.[task]) || 0)
      }))
    };
    persistRevealChallengeRecord(record);
    deepDiveState?.saveChallengeDraft?.(state);
    renderSessionSummary();
    if (!silent) setChallengeFeedback('Deep Dive saved on this device.', 'good');
    return true;
  }

  function finishRevealChallenge() {
    const state = getRevealChallengeState();
    if (!state || state.completedAt) return;
    const doneCount = deepDiveUi?.getChallengeDoneCount?.(state) || 0;
    if (doneCount < challengeTaskFlow.length) {
      setChallengeFeedback(`Finish all ${challengeTaskFlow.length} steps first.`, 'warn');
      return;
    }
    const finishBtn = el('challenge-finish-btn');
    if (finishBtn) finishBtn.disabled = true;
    state.completedAt = Date.now();
    saveRevealChallengeResponses({ requireText: false, silent: true });
    const score = deepDiveUi?.computeChallengeScore?.(state) || { total: 0, clarity: 0, evidence: 0, vocabulary: 0 };
    const pointsEarned = Math.max(8, Math.round(score.total / 10) + (doneCount * 3));
    const progress = deepDiveState?.loadChallengeProgress?.() || { points: 0, streak: 0, lastWinDay: '' };
    progress.points += pointsEarned;
    const today = localDayKey();
    if (progress.lastWinDay !== today) {
      progress.streak = isConsecutiveDay(progress.lastWinDay, today) ? progress.streak + 1 : 1;
      progress.lastWinDay = today;
    }
    deepDiveState?.saveChallengeProgress?.(progress);
    const rank = deepDiveState?.resolveChallengeRank?.(progress.points) || challengeRanks[0];
    const line = pickRandom(challengeCompleteLines) || 'Deep Dive complete.';
    setChallengeFeedback(`${line} +${pointsEarned} points · Rank ${rank?.label || ''}.`, 'good');
    emitTelemetry('wq_deep_dive_complete', {
      source: state.source || 'reveal',
      word_id: normalizeReviewWord(state.word),
      level: state.challenge?.level || '',
      done_count: doneCount,
      completion_rate: Number((doneCount / challengeTaskFlow.length).toFixed(2)),
      score: Number(score.total) || 0,
      score_total: Number(score.total) || 0,
      points_earned: pointsEarned,
      rank: rank?.label || ''
    });
    emitTelemetry('wq_funnel_deep_dive_completed', {
      source: state.source || 'reveal',
      word_id: normalizeReviewWord(state.word),
      level: state.challenge?.level || '',
      completion_rate: Number((doneCount / challengeTaskFlow.length).toFixed(2))
    });
    deepDiveState?.clearChallengeDraft?.(state);
    renderSessionSummary();
    setTimeoutRef(() => {
      closeRevealChallengeModal({ silent: true });
    }, 900);
  }

  return {
    buildRevealChallengeState,
    finishRevealChallenge,
    saveRevealChallengeResponses,
    syncRevealChallengeLaunch
  };
}
