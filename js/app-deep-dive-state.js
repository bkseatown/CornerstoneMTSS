/**
 * app-deep-dive-state.js
 * Persistence and helper utilities for Deep Dive state.
 */

function createDeepDiveStateModule(deps) {
  const {
    challengeDraftKey = '',
    challengeOnboardingKey = '',
    challengeOnboardingMaxViews = 0,
    challengeProgressKey = '',
    challengeRanks = [],
    challengeScaffoldProfile = {},
    challengeStrongScoreMin = 80,
    el = () => null,
    getChallengeOnboardingState = () => ({ seenCount: 0, dismissed: false }),
    localStorageRef = localStorage,
    setChallengeOnboardingState = () => {}
  } = deps || {};

  function loadChallengeProgress() {
    try {
      const raw = JSON.parse(localStorageRef.getItem(challengeProgressKey) || '{}');
      return {
        points: Math.max(0, Number(raw?.points) || 0),
        streak: Math.max(0, Number(raw?.streak) || 0),
        lastWinDay: String(raw?.lastWinDay || '').trim()
      };
    } catch {
      return { points: 0, streak: 0, lastWinDay: '' };
    }
  }

  function saveChallengeProgress(progress) {
    try {
      localStorageRef.setItem(challengeProgressKey, JSON.stringify({
        points: Math.max(0, Number(progress?.points) || 0),
        streak: Math.max(0, Number(progress?.streak) || 0),
        lastWinDay: String(progress?.lastWinDay || '').trim()
      }));
    } catch {}
  }

  function resolveChallengeRank(points) {
    const total = Math.max(0, Number(points) || 0);
    let active = challengeRanks[0];
    challengeRanks.forEach((rank) => {
      if (total >= rank.minPoints) active = rank;
    });
    return active || challengeRanks[0];
  }

  function loadChallengeOnboardingState() {
    try {
      const raw = JSON.parse(localStorageRef.getItem(challengeOnboardingKey) || '{}');
      return {
        seenCount: Math.max(0, Number(raw?.seenCount) || 0),
        dismissed: !!raw?.dismissed
      };
    } catch {
      return { seenCount: 0, dismissed: false };
    }
  }

  function saveChallengeOnboardingState(nextState) {
    const normalized = {
      seenCount: Math.max(0, Number(nextState?.seenCount) || 0),
      dismissed: !!nextState?.dismissed
    };
    setChallengeOnboardingState(normalized);
    try {
      localStorageRef.setItem(challengeOnboardingKey, JSON.stringify(normalized));
    } catch {}
  }

  function resolveChallengeGradeTier(gradeLabel) {
    const value = String(gradeLabel || '').toUpperCase().replace(/\s+/g, '');
    if (!value) return 'g35';
    if (value.includes('K-2') || value.includes('K2')) return 'k2';
    if (value.includes('G3-5') || value.includes('3-5')) return 'g35';
    return 'older';
  }

  function getChallengeScaffoldProfile(state = null) {
    const tier = resolveChallengeGradeTier(state?.grade || '');
    return challengeScaffoldProfile[tier] || challengeScaffoldProfile.g35;
  }

  function buildChallengeQuickstartCopy(state = null) {
    const source = String(state?.source || '').trim().toLowerCase();
    const launchHint = source === 'standalone'
      ? 'You launched from Activities.'
      : 'You launched from the end-of-round card.';
    return `Quick start: finish Sound, Meaning, and Context in order. ${launchHint}`;
  }

  function syncChallengeQuickstartCard(state = null) {
    const wrap = el('challenge-quickstart');
    const copy = el('challenge-quickstart-copy');
    if (!wrap || !copy || !state) return;
    const onboardingState = getChallengeOnboardingState();
    const shouldShow = !onboardingState.dismissed && onboardingState.seenCount < challengeOnboardingMaxViews;
    if (!shouldShow) {
      wrap.classList.add('hidden');
      return;
    }
    copy.textContent = buildChallengeQuickstartCopy(state);
    wrap.classList.remove('hidden');
    saveChallengeOnboardingState({
      seenCount: onboardingState.seenCount + 1,
      dismissed: false
    });
  }

  function createMissionAttemptId() {
    const stamp = Date.now().toString(36);
    const token = Math.random().toString(36).slice(2, 8);
    return `mission-${stamp}-${token}`;
  }

  function resolveMissionScoreBand(scoreTotal) {
    const score = Math.max(0, Number(scoreTotal) || 0);
    if (score >= 90) return 'Spotlight';
    if (score >= challengeStrongScoreMin) return 'Strong';
    if (score >= 55) return 'Growing';
    return 'Launch';
  }

  function getChallengeDraftStorage() {
    try {
      const raw = JSON.parse(localStorageRef.getItem(challengeDraftKey) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch {
      return {};
    }
  }

  function setChallengeDraftStorage(storage) {
    const next = storage && typeof storage === 'object' ? storage : {};
    const entries = Object.entries(next)
      .filter(([, value]) => value && typeof value === 'object')
      .sort((a, b) => (Number(b[1]?.updatedAt) || 0) - (Number(a[1]?.updatedAt) || 0))
      .slice(0, 48);
    const trimmed = Object.create(null);
    entries.forEach(([key, value]) => {
      trimmed[key] = value;
    });
    try {
      localStorageRef.setItem(challengeDraftKey, JSON.stringify(trimmed));
    } catch {}
  }

  function getChallengeDraftKey(state) {
    if (!state) return '';
    const word = String(state.word || '').trim().toLowerCase();
    const topic = String(state.topic || '').trim().toLowerCase();
    if (!word) return '';
    return `${word}::${topic}`;
  }

  function loadChallengeDraft(state) {
    const key = getChallengeDraftKey(state);
    if (!key) return null;
    const storage = getChallengeDraftStorage();
    const draft = storage[key];
    if (!draft || typeof draft !== 'object') return null;
    const updatedAt = Math.max(0, Number(draft.updatedAt) || 0);
    const maxAgeMs = 1000 * 60 * 60 * 24 * 21;
    if (!updatedAt || Date.now() - updatedAt > maxAgeMs) return null;
    return {
      responses: {
        analyze: String(draft.responses?.analyze || ''),
        create: String(draft.responses?.create || '')
      },
      tasks: {
        listen: !!draft.tasks?.listen,
        analyze: !!draft.tasks?.analyze,
        create: !!draft.tasks?.create
      }
    };
  }

  function saveChallengeDraft(state) {
    const key = getChallengeDraftKey(state);
    if (!key) return;
    const storage = getChallengeDraftStorage();
    storage[key] = {
      updatedAt: Date.now(),
      responses: {
        analyze: String(state?.responses?.analyze || ''),
        create: String(state?.responses?.create || '')
      },
      tasks: {
        listen: !!state?.tasks?.listen,
        analyze: !!state?.tasks?.analyze,
        create: !!state?.tasks?.create
      }
    };
    setChallengeDraftStorage(storage);
  }

  function clearChallengeDraft(state) {
    const key = getChallengeDraftKey(state);
    if (!key) return;
    const storage = getChallengeDraftStorage();
    if (!Object.prototype.hasOwnProperty.call(storage, key)) return;
    delete storage[key];
    setChallengeDraftStorage(storage);
  }

  return {
    buildChallengeQuickstartCopy,
    clearChallengeDraft,
    createMissionAttemptId,
    getChallengeDraftKey,
    getChallengeDraftStorage,
    getChallengeScaffoldProfile,
    loadChallengeDraft,
    loadChallengeOnboardingState,
    loadChallengeProgress,
    resolveChallengeGradeTier,
    resolveChallengeRank,
    resolveMissionScoreBand,
    saveChallengeDraft,
    saveChallengeOnboardingState,
    saveChallengeProgress,
    setChallengeDraftStorage,
    syncChallengeQuickstartCard
  };
}
