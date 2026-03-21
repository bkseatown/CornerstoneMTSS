/**
 * app-quest-runtime.js
 * Quest progression, share actions, and signal publishing helpers.
 */

function createQuestRuntimeModule(deps) {
  const {
    defaultPrefs = {},
    demoMode = false,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getActiveMaxGuesses = () => 6,
    getLocationSearch = () => '',
    getState = () => ({}),
    localStorageRef = localStorage,
    locationRef = window.location,
    navigatorRef = navigator,
    onSavedSessionId = () => {},
    recordProbeRound = () => {},
    recordSessionRound = () => {},
    refreshStandaloneMissionLabHub = () => {},
    renderMiniLessonPanel = () => {},
    renderPlaylistControls = () => {},
    renderProbePanel = () => {},
    renderRosterControls = () => {},
    renderSessionSummary = () => {},
    setPref = () => {},
    maybeApplyStudentPlanForActiveStudent = () => {},
    normalizeProbeRounds = (value) => value,
    prefs = {},
    showToast = () => {},
    windowRef = window
  } = deps || {};

  const QUEST_LOOP_KEY = 'wq_v2_quest_loop_v1';
  const QUEST_TIERS = Object.freeze([
    Object.freeze({ id: 'rookie', label: 'Rookie', minXp: 0, reward: 'Bronze chest unlocked' }),
    Object.freeze({ id: 'allstar', label: 'All-Star', minXp: 220, reward: 'Silver spotlight unlocked' }),
    Object.freeze({ id: 'legend', label: 'Legend', minXp: 520, reward: 'Gold crown unlocked' })
  ]);

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isConsecutiveDay(prevDay, nextDay) {
    if (!prevDay || !nextDay) return false;
    const prev = new Date(`${prevDay}T12:00:00`);
    const next = new Date(`${nextDay}T12:00:00`);
    if (Number.isNaN(prev.getTime()) || Number.isNaN(next.getTime())) return false;
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000);
    return diffDays === 1;
  }

  function resolveQuestTier(xpValue) {
    const xp = Math.max(0, Number(xpValue) || 0);
    let active = QUEST_TIERS[0];
    QUEST_TIERS.forEach((tier) => {
      if (xp >= tier.minXp) active = tier;
    });
    return active;
  }

  function loadQuestLoopState() {
    const fallback = {
      xp: 0,
      rounds: 0,
      wins: 0,
      dailyStreak: 0,
      lastWinDay: ''
    };

    try {
      const parsed = JSON.parse(localStorageRef.getItem(QUEST_LOOP_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        xp: Math.max(0, Math.floor(Number(parsed.xp) || 0)),
        rounds: Math.max(0, Math.floor(Number(parsed.rounds) || 0)),
        wins: Math.max(0, Math.floor(Number(parsed.wins) || 0)),
        dailyStreak: Math.max(0, Math.floor(Number(parsed.dailyStreak) || 0)),
        lastWinDay: typeof parsed.lastWinDay === 'string' ? parsed.lastWinDay : ''
      };
    } catch {
      return fallback;
    }
  }

  function saveQuestLoopState(state) {
    try {
      localStorageRef.setItem(QUEST_LOOP_KEY, JSON.stringify(state));
    } catch {}
  }

  function getQuestTierProgress(xpValue) {
    const xp = Math.max(0, Number(xpValue) || 0);
    const tier = resolveQuestTier(xp);
    const tierIndex = QUEST_TIERS.findIndex((item) => item.id === tier.id);
    const nextTier = QUEST_TIERS[tierIndex + 1] || null;
    if (!nextTier) return { percent: 100, nextTier: null, remainingXp: 0 };
    const span = Math.max(1, nextTier.minXp - tier.minXp);
    const progressed = Math.max(0, Math.min(span, xp - tier.minXp));
    return {
      percent: Math.round((progressed / span) * 100),
      nextTier,
      remainingXp: Math.max(0, nextTier.minXp - xp)
    };
  }

  function renderQuestLoop(state) {
    const tier = resolveQuestTier(state.xp);
    const progress = getQuestTierProgress(state.xp);
    const tierChip = el('quest-tier-chip');
    const xpLabel = el('quest-xp');
    const streakLabel = el('quest-streak');
    const progressEl = el('quest-progress');
    const progressFill = el('quest-progress-fill');
    const nextLabel = el('quest-next');

    if (tierChip) tierChip.textContent = `Tier: ${tier.label}`;
    if (xpLabel) xpLabel.textContent = `${state.xp} XP`;
    if (streakLabel) {
      const suffix = state.dailyStreak === 1 ? 'day' : 'days';
      streakLabel.textContent = `Streak: ${state.dailyStreak} ${suffix}`;
    }
    if (progressFill) progressFill.style.width = `${progress.percent}%`;
    if (progressEl) {
      progressEl.setAttribute('aria-valuenow', String(progress.percent));
      progressEl.setAttribute(
        'aria-valuetext',
        progress.nextTier ? `${progress.percent}% to ${progress.nextTier.label}` : 'Top tier complete'
      );
    }
    if (nextLabel) {
      nextLabel.textContent = progress.nextTier
        ? `Next reward: ${progress.nextTier.reward} in ${progress.remainingXp} XP.`
        : `Top reward unlocked: ${tier.reward}.`;
    }

    documentRef.querySelectorAll('#quest-track .quest-node').forEach((node) => {
      const nodeTierId = node.getAttribute('data-tier');
      const nodeTier = QUEST_TIERS.find((item) => item.id === nodeTierId);
      if (!nodeTier) return;
      const unlocked = state.xp >= nodeTier.minXp;
      const current = nodeTier.id === tier.id;
      node.classList.toggle('is-unlocked', unlocked);
      node.classList.toggle('is-current', current);
    });
  }

  function initQuestLoop() {
    renderQuestLoop(loadQuestLoopState());
    const probeSelect = el('s-probe-rounds');
    if (probeSelect) {
      const normalized = normalizeProbeRounds(prefs.probeRounds || defaultPrefs.probeRounds);
      probeSelect.value = normalized;
      if (prefs.probeRounds !== normalized) setPref('probeRounds', normalized);
    }
    renderRosterControls();
    renderPlaylistControls();
    renderSessionSummary();
    renderProbePanel();
    renderMiniLessonPanel();
    maybeApplyStudentPlanForActiveStudent();
    refreshStandaloneMissionLabHub();
  }

  function awardQuestProgress(result, roundMetrics = {}) {
    const state = loadQuestLoopState();
    const beforeTier = resolveQuestTier(state.xp);
    const maxGuesses = Math.max(1, Number(getState()?.maxGuesses || getActiveMaxGuesses() || 6));
    const guessesUsed = Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : maxGuesses);

    if (result?.won) {
      const today = localDayKey();
      if (state.lastWinDay !== today) {
        state.dailyStreak = isConsecutiveDay(state.lastWinDay, today) ? state.dailyStreak + 1 : 1;
        state.lastWinDay = today;
      }
    }

    let xpEarned = result?.won ? 20 : 6;
    if (result?.won) {
      const efficiencyBonus = Math.max(0, maxGuesses - guessesUsed) * 4;
      const streakBonus = Math.min(12, Math.max(0, state.dailyStreak - 1) * 2);
      xpEarned += efficiencyBonus + streakBonus;
    }

    state.xp += xpEarned;
    state.rounds += 1;
    if (result?.won) state.wins += 1;
    recordSessionRound(result, roundMetrics);
    recordProbeRound(result, roundMetrics);

    const afterTier = resolveQuestTier(state.xp);
    const tierUp = afterTier.id !== beforeTier.id;

    saveQuestLoopState(state);
    renderQuestLoop(state);
    return { state, tierUp, beforeTier, afterTier, xpEarned };
  }

  function getActiveSignalStudentId() {
    try {
      const params = new URLSearchParams(getLocationSearch());
      const fromQuery = String(params.get('student') || params.get('studentId') || '').trim();
      if (fromQuery) return fromQuery;
    } catch {}
    try {
      const fromStorage = String(localStorageRef.getItem('cs_active_student_id') || '').trim();
      if (fromStorage) return fromStorage;
    } catch {}
    return '';
  }

  function mapGuessFeedbackToSignalStates(states) {
    return (Array.isArray(states) ? states : []).map((state) => {
      if (state === 'correct') return 'green';
      if (state === 'present') return 'yellow';
      return 'gray';
    });
  }

  function getOutcomeBand(signals) {
    if (!signals || typeof signals !== 'object') return 'stuck';
    if (signals.solved) return 'solved';
    const respect = Number(signals.updateRespect || 0);
    const guesses = Number(signals.guesses || 0);
    if (respect >= 0.6 && guesses >= 3) return 'close';
    return 'stuck';
  }

  function toThreeBand(value, strongMin, developingMin, inverse) {
    const n = Number(value || 0);
    if (inverse) {
      if (n <= strongMin) return 'Strong';
      if (n <= developingMin) return 'Developing';
      return 'Emerging';
    }
    if (n >= strongMin) return 'Strong';
    if (n >= developingMin) return 'Developing';
    return 'Emerging';
  }

  function updateWordQuestShareButton(sessionId) {
    const btn = el('wq-share-result-btn');
    const bundleBtn = el('wq-share-bundle-btn');
    if (!btn && !bundleBtn) return;
    const show = !!sessionId && !demoMode;
    if (btn) {
      btn.classList.toggle('hidden', !show);
      btn.dataset.sessionId = show ? String(sessionId) : '';
    }
    if (bundleBtn) bundleBtn.classList.toggle('hidden', !show);
  }

  async function shareWordQuestSessionById(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id || !windowRef.CSCornerstoneStore || typeof windowRef.CSCornerstoneStore.listSessions !== 'function') return;
    const sessions = windowRef.CSCornerstoneStore.listSessions({});
    const row = sessions.find((session) => String(session?.sessionId || '') === id);
    if (!row) return;
    const filename = `cornerstone-session-${id}.json`;
    const json = JSON.stringify(row, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'application/json' }) : null;
    try {
      if (navigatorRef.share) {
        const payload = file ? { files: [file], title: 'Cornerstone Session', text: 'Cornerstone MTSS session export' } : { title: 'Cornerstone Session', text: json };
        await navigatorRef.share(payload);
        showToast('Session shared.');
        return true;
      }
    } catch {}
    if (typeof windowRef.CSCornerstoneStore.downloadBlob === 'function') {
      windowRef.CSCornerstoneStore.downloadBlob(blob, filename);
      showToast('Session file downloaded.');
      return true;
    }
    return false;
  }

  async function shareWordQuestBundle() {
    if (!windowRef.CSCornerstoneStore) return false;
    const studentCode = typeof windowRef.CSCornerstoneStore.getStudentCode === 'function'
      ? windowRef.CSCornerstoneStore.getStudentCode()
      : null;
    const blob = windowRef.CSCornerstoneStore.exportSessions({ studentCode: studentCode || undefined });
    const suffix = studentCode ? String(studentCode).toLowerCase() : 'device';
    const filename = `cornerstone-sessions-${suffix}.json`;
    const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'application/json' }) : null;
    try {
      if (navigatorRef.share && file) {
        await navigatorRef.share({
          files: [file],
          title: 'Cornerstone Sessions',
          text: 'Cornerstone MTSS session bundle'
        });
        showToast('Session bundle shared.');
        return true;
      }
    } catch {}
    if (typeof windowRef.CSCornerstoneStore.downloadBlob === 'function') {
      windowRef.CSCornerstoneStore.downloadBlob(blob, filename);
      showToast('Session bundle downloaded.');
      return true;
    }
    return false;
  }

  function persistWordQuestCornerstoneSession(signals, meta) {
    if (!windowRef.CSCornerstoneSignals || !windowRef.CSCornerstoneStore) return null;
    const studentCode = typeof windowRef.CSCornerstoneStore.getStudentCode === 'function'
      ? windowRef.CSCornerstoneStore.getStudentCode()
      : null;
    const repeatRate = Number(signals.repetitionPenalty || 0);
    const tier = Number(signals.updateRespect || 0) < 0.55 || repeatRate > 0.18 ? 'tier3' : 'tier2';
    const session = windowRef.CSCornerstoneSignals.normalizeSignal({
      engine: 'wordquest',
      studentCode,
      durationMs: Math.max(0, Number(signals.durSec || 0) * 1000),
      metrics: {
        guessesCount: Math.max(0, Number(signals.guesses || 0)),
        uniqueVowelsTried: Math.max(0, Number(signals.uniqueVowels || 0)),
        repeatGuessRate: +repeatRate.toFixed(3),
        constraintRespect: +Number(signals.updateRespect || 0).toFixed(3),
        timeToFirstGuessMs: Math.max(0, Number(signals.timeToFirstGuessSec || 0) * 1000),
        helpUsed: !!(meta && meta.helpUsed),
        outcomeBand: getOutcomeBand(signals)
      },
      derived: {
        vowelExploration: toThreeBand(Number(signals.uniqueVowels || 0), 4, 2, false),
        strategyEfficiency: toThreeBand(Number(signals.updateRespect || 0), 0.75, 0.55, false),
        repetitionRisk: toThreeBand(repeatRate, 0.08, 0.18, true)
      },
      tier,
      nextMove: {
        title: String(signals.nextStep || 'Run one coached strategy round and debrief the clue update pattern.'),
        steps: [
          'Model one think-aloud round (greens stay, yellows move, grays avoid).',
          'Run one independent 90-second probe.'
        ],
        estMinutes: 10
      },
      privacy: { containsText: false, containsAudio: false }
    });
    return windowRef.CSCornerstoneStore.appendSession(session) || null;
  }

  function publishWordQuestSignals(signals, meta) {
    const isDemo = demoMode || (new URLSearchParams(getLocationSearch())).get('demo') === '1';
    if (isDemo || !signals || typeof signals !== 'object') return null;
    const studentId = getActiveSignalStudentId() || 'demo-student';
    const payloadMeta = meta && typeof meta === 'object' ? meta : {};

    try {
      if (windowRef.CSAnalyticsEngine && typeof windowRef.CSAnalyticsEngine.appendWordQuestSignals === 'function') {
        windowRef.CSAnalyticsEngine.appendWordQuestSignals(signals, { ...payloadMeta, studentId });
      } else {
        const key = 'cs_progress_history';
        const raw = localStorageRef.getItem(key);
        const obj = raw ? JSON.parse(raw) : {};
        obj.wordQuestSignals = Array.isArray(obj.wordQuestSignals) ? obj.wordQuestSignals : [];
        const guessCount = Math.max(0, Number(signals.guesses || 0));
        const timeToFirstGuess = Math.max(0, Number(signals.timeToFirstGuessSec || 0));
        const patternAdherence = Math.max(0, Math.min(1, Number(signals.updateRespect || 0)));
        const repeatedInvalidLetterPlacementCount = Math.max(0, Math.round((1 - patternAdherence) * guessCount));
        const vowelSwapRate = guessCount > 0 ? Math.max(0, Math.min(1, Number(signals.uniqueVowels || 0) / guessCount)) : 0;
        const clueUtilization = payloadMeta.helpUsed ? 0.8 : 0.25;
        obj.wordQuestSignals.push({
          t: Date.now(),
          studentId,
          guessCount,
          timeToFirstGuess,
          vowelSwapRate: Number(vowelSwapRate.toFixed(3)),
          repeatedInvalidLetterPlacementCount,
          patternAdherence: Number(patternAdherence.toFixed(3)),
          clueUtilization: Number(clueUtilization.toFixed(3)),
          guesses: signals.guesses,
          durSec: signals.durSec,
          solved: !!signals.solved,
          guessesPerMin: Number(signals.guessesPerMin || 0),
          uniqueVowels: Number(signals.uniqueVowels || 0),
          vowelRatio: Number(signals.vowelRatio || 0),
          updateRespect: Number(signals.updateRespect || 0),
          repetitionPenalty: Number(signals.repetitionPenalty || 0),
          affixAttempts: Number(signals.affixAttempts || 0),
          focusTag: String(signals.focusTag || ''),
          nextStep: String(signals.nextStep || ''),
          soft: !!payloadMeta.soft
        });
        if (obj.wordQuestSignals.length > 200) obj.wordQuestSignals = obj.wordQuestSignals.slice(-200);
        localStorageRef.setItem(key, JSON.stringify(obj));
      }
    } catch {}

    try {
      const guessCount = Math.max(0, Number(signals.guesses || 0));
      const timeToFirstGuess = Math.max(0, Number(signals.timeToFirstGuessSec || 0));
      const patternAdherence = Math.max(0, Math.min(1, Number(signals.updateRespect || 0)));
      const repeatedInvalidLetterPlacementCount = Math.max(0, Math.round((1 - patternAdherence) * guessCount));
      const vowelSwapCount = Math.max(0, Number(signals.uniqueVowels || 0));
      if (windowRef.CSEvidence && typeof windowRef.CSEvidence.appendSession === 'function') {
        windowRef.CSEvidence.appendSession(studentId, 'wordquest', {
          totalGuesses: guessCount,
          solveSuccess: !!signals.solved,
          timeToFirstCorrectLetter: timeToFirstGuess,
          firstMissAt: Number(signals.firstMissAtSec || 0),
          hintsUsed: payloadMeta.helpUsed ? 1 : 0,
          idleEvents: Number(signals.idleEvents || 0),
          vowelAttemptRatio: Number(signals.vowelRatio || 0),
          vowelConfusionProxy: Number((1 - Math.min(1, Number(signals.vowelRatio || 0))).toFixed(3)),
          wrongSlotRepeat: repeatedInvalidLetterPlacementCount,
          newInfoPerGuess: Number(patternAdherence.toFixed(3)),
          streaks: Number(signals.streak || 0)
        });
      }
      if (windowRef.CSEvidence && typeof windowRef.CSEvidence.addSession === 'function') {
        const durationSec = Math.max(0, Number(signals.durSec || 0));
        const avgGuessLatencyMs = guessCount > 0 ? Math.round((durationSec * 1000) / guessCount) : 0;
        const misplaceRate = Math.max(0, Math.min(1, Number(signals.repetitionPenalty || 0) * 1.2));
        const absentRate = Math.max(0, Math.min(1, 1 - patternAdherence));
        windowRef.CSEvidence.addSession(studentId, {
          id: deps.getActiveEvidenceSessionId?.() || undefined,
          createdAt: new Date().toISOString(),
          activity: 'wordquest',
          durationSec,
          signals: {
            guessCount,
            avgGuessLatencyMs,
            misplaceRate: Number(misplaceRate.toFixed(3)),
            absentRate: Number(absentRate.toFixed(3)),
            repeatSameBadSlotCount: repeatedInvalidLetterPlacementCount,
            vowelSwapCount,
            constraintViolations: repeatedInvalidLetterPlacementCount
          },
          outcomes: {
            solved: !!signals.solved,
            attemptsUsed: Math.max(0, Number(signals.guesses || 0))
          }
        });
      }
      if (windowRef.CSSupportStore && typeof windowRef.CSSupportStore.addEvidencePoint === 'function') {
        windowRef.CSSupportStore.addEvidencePoint(studentId, {
          module: 'wordquest',
          domain: 'literacy.decoding',
          metrics: {
            attempts: guessCount,
            timeOnTaskSec: Math.max(0, Number(signals.durSec || 0)),
            success: !!signals.solved,
            letterPositionConflicts: repeatedInvalidLetterPlacementCount,
            vowelChangeFrequency: Number(vowelSwapCount || 0)
          },
          chips: [
            'Attempts ' + guessCount,
            (signals.solved ? 'Solved' : 'Not solved'),
            'Vowel shifts ' + Number(vowelSwapCount || 0)
          ]
        });
      }
      if (
        windowRef.CSSkillMapper &&
        typeof windowRef.CSSkillMapper.mapWQSignalsToSkillEvidence === 'function' &&
        windowRef.CSEvidence &&
        typeof windowRef.CSEvidence.applySkillEvidence === 'function'
      ) {
        const evidencePatch = windowRef.CSSkillMapper.mapWQSignalsToSkillEvidence({
          session: {
            studentId,
            createdAt: new Date().toISOString(),
            activity: 'wordquest',
            durationSec: Math.max(0, Number(signals.durSec || 0))
          },
          events: payloadMeta.events || [],
          result: {
            solved: !!signals.solved,
            guesses: guessCount,
            patternAdherence,
            repetitionPenalty: Number(signals.repetitionPenalty || 0),
            uniqueVowels: Number(signals.uniqueVowels || 0),
            vowelRatio: Number(signals.vowelRatio || 0),
            helpUsed: !!payloadMeta.helpUsed,
            hintUsed: Number(signals.hintsUsed || 0),
            affixAttempts: Number(signals.affixAttempts || 0),
            orthographicPatternMiss: Number(signals.orthographicPatternMiss || 0)
          }
        });
        if (evidencePatch && evidencePatch.skillDelta) {
          windowRef.CSEvidence.applySkillEvidence(studentId, evidencePatch);
        }
      }
    } catch {}

    try {
      if (windowRef.CSCornerstoneEngine && typeof windowRef.CSCornerstoneEngine.appendSignal === 'function') {
        windowRef.CSCornerstoneEngine.appendSignal(signals, {
          module: 'wordquest',
          studentId
        });
      }
    } catch {}

    try {
      const savedSession = persistWordQuestCornerstoneSession(signals, meta);
      if (savedSession?.sessionId) {
        const savedId = String(savedSession.sessionId);
        onSavedSessionId(savedId);
        updateWordQuestShareButton(savedId);
        return savedId;
      }
    } catch {}
    return null;
  }

  return {
    awardQuestProgress,
    initQuestLoop,
    mapGuessFeedbackToSignalStates,
    publishWordQuestSignals,
    shareWordQuestBundle,
    shareWordQuestSessionById,
    updateWordQuestShareButton
  };
}

window.createQuestRuntimeModule = createQuestRuntimeModule;
