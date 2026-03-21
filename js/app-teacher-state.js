/**
 * app-teacher-state.js
 * Persistence and normalization helpers for teacher/session state.
 */

function createTeacherStateModule(deps) {
  const {
    defaultPrefs = {},
    gameplaySupport = null,
    loadSessionStorage = () => null,
    loadLocalStorage = () => null,
    normalizeLessonPackId = (value) => value,
    normalizeLessonTargetId = (_packId, value) => value,
    prefs = {},
    probeHistoryKeys = []
  } = deps || {};

  function loadSessionSummaryState(sessionSummaryKey) {
    const fallback = {
      rounds: 0,
      wins: 0,
      hintRounds: 0,
      voiceAttempts: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      errorTotals: Object.create(null),
      masteryBySkill: Object.create(null),
      startedAt: Date.now()
    };
    try {
      const parsed = JSON.parse(loadSessionStorage(sessionSummaryKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const masteryBySkill = Object.create(null);
      const rawMastery = parsed.masteryBySkill && typeof parsed.masteryBySkill === 'object'
        ? parsed.masteryBySkill
        : {};
      Object.entries(rawMastery).forEach(([skillKey, row]) => {
        const key = String(skillKey || '').trim();
        if (!key || !row || typeof row !== 'object') return;
        masteryBySkill[key] = {
          label: String(row.label || key).trim(),
          rounds: Math.max(0, Math.floor(Number(row.rounds) || 0)),
          wins: Math.max(0, Math.floor(Number(row.wins) || 0)),
          hintRounds: Math.max(0, Math.floor(Number(row.hintRounds) || 0)),
          voiceAttempts: Math.max(0, Math.floor(Number(row.voiceAttempts) || 0)),
          totalGuesses: Math.max(0, Math.floor(Number(row.totalGuesses) || 0)),
          totalDurationMs: Math.max(0, Math.floor(Number(row.totalDurationMs) || 0)),
          errorCounts: gameplaySupport?.normalizeCounterMap?.(row.errorCounts) || Object.create(null)
        };
      });
      return {
        rounds: Math.max(0, Math.floor(Number(parsed.rounds) || 0)),
        wins: Math.max(0, Math.floor(Number(parsed.wins) || 0)),
        hintRounds: Math.max(0, Math.floor(Number(parsed.hintRounds) || 0)),
        voiceAttempts: Math.max(0, Math.floor(Number(parsed.voiceAttempts) || 0)),
        totalGuesses: Math.max(0, Math.floor(Number(parsed.totalGuesses) || 0)),
        totalDurationMs: Math.max(0, Math.floor(Number(parsed.totalDurationMs) || 0)),
        errorTotals: gameplaySupport?.normalizeCounterMap?.(parsed.errorTotals) || Object.create(null),
        masteryBySkill,
        startedAt: Math.max(0, Number(parsed.startedAt) || Date.now())
      };
    } catch {
      return fallback;
    }
  }

  function loadRosterState(rosterStateKey) {
    const fallback = { students: [], active: '' };
    try {
      const parsed = JSON.parse(loadLocalStorage(rosterStateKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const students = Array.isArray(parsed.students)
        ? parsed.students
          .map((name) => String(name || '').trim().replace(/\s+/g, ' '))
          .filter((name) => name.length > 0)
          .slice(0, 30)
        : [];
      const uniqueStudents = Array.from(new Set(students));
      const active = uniqueStudents.includes(String(parsed.active || '').trim())
        ? String(parsed.active || '').trim()
        : '';
      return { students: uniqueStudents, active };
    } catch {
      return fallback;
    }
  }

  function loadProbeHistory() {
    try {
      let parsed = null;
      for (const key of probeHistoryKeys) {
        const raw = loadLocalStorage(key);
        if (!raw) continue;
        try {
          parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) break;
        } catch {
          parsed = null;
        }
      }
      if (parsed == null) parsed = [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((row) => ({
        startedAt: Math.max(0, Number(row?.startedAt) || Date.now()),
        completedAt: Math.max(0, Number(row?.completedAt) || Date.now()),
        roundsTarget: Math.max(1, Math.floor(Number(row?.roundsTarget) || 3)),
        roundsDone: Math.max(0, Math.floor(Number(row?.roundsDone) || 0)),
        wins: Math.max(0, Math.floor(Number(row?.wins) || 0)),
        totalGuesses: Math.max(0, Math.floor(Number(row?.totalGuesses) || 0)),
        totalDurationMs: Math.max(0, Math.floor(Number(row?.totalDurationMs) || 0)),
        hintRounds: Math.max(0, Math.floor(Number(row?.hintRounds) || 0)),
        focusLabel: String(row?.focusLabel || '').trim(),
        gradeLabel: String(row?.gradeLabel || '').trim(),
        student: String(row?.student || '').trim()
      })).slice(0, 24);
    } catch {
      return [];
    }
  }

  function normalizeGoalAccuracy(value) {
    const parsed = Math.round(Number(value) || 0);
    if (!Number.isFinite(parsed) || parsed <= 0) return 80;
    return Math.max(50, Math.min(100, parsed));
  }

  function normalizeGoalGuesses(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 4;
    return Number(Math.max(1, Math.min(8, parsed)).toFixed(1));
  }

  function normalizeGoalEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
      accuracyTarget: normalizeGoalAccuracy(raw.accuracyTarget),
      avgGuessesTarget: normalizeGoalGuesses(raw.avgGuessesTarget),
      updatedAt: Math.max(0, Number(raw.updatedAt) || Date.now())
    };
  }

  function loadStudentGoalState(studentGoalsKey) {
    try {
      const parsed = JSON.parse(loadLocalStorage(studentGoalsKey) || '{}');
      if (!parsed || typeof parsed !== 'object') return Object.create(null);
      const normalized = Object.create(null);
      Object.entries(parsed).forEach(([key, value]) => {
        const goalKey = String(key || '').trim();
        if (!goalKey) return;
        const goalEntry = normalizeGoalEntry(value);
        if (!goalEntry) return;
        normalized[goalKey] = goalEntry;
      });
      return normalized;
    } catch {
      return Object.create(null);
    }
  }

  function normalizePlaylistItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const focus = String(raw.focus || '').trim() || 'all';
    const gradeBand = String(raw.gradeBand || '').trim() || 'k-2';
    const length = String(raw.length || '').trim() || defaultPrefs.length;
    const packId = normalizeLessonPackId(raw.packId || 'custom');
    const targetId = normalizeLessonTargetId(packId, raw.targetId || 'custom');
    const label = String(raw.label || '').trim() || 'Saved target';
    return {
      id: String(raw.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`).trim(),
      packId,
      targetId,
      focus,
      gradeBand,
      length,
      label,
      createdAt: Math.max(0, Number(raw.createdAt) || Date.now())
    };
  }

  function normalizePlaylistEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    if (!id) return null;
    const name = String(raw.name || '').trim() || 'Untitled Playlist';
    const items = Array.isArray(raw.items)
      ? raw.items.map((item) => normalizePlaylistItem(item)).filter(Boolean).slice(0, 20)
      : [];
    return {
      id,
      name,
      items,
      createdAt: Math.max(0, Number(raw.createdAt) || Date.now()),
      updatedAt: Math.max(0, Number(raw.updatedAt) || Date.now())
    };
  }

  function createEmptyPlaylistState() {
    return { playlists: [], assignments: Object.create(null), progress: Object.create(null), selectedId: '' };
  }

  function loadPlaylistState(playlistStateKey) {
    const fallback = createEmptyPlaylistState();
    try {
      const parsed = JSON.parse(loadLocalStorage(playlistStateKey) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const playlists = Array.isArray(parsed.playlists)
        ? parsed.playlists.map((entry) => normalizePlaylistEntry(entry)).filter(Boolean).slice(0, 40)
        : [];
      const assignments = Object.create(null);
      const assignmentRaw = parsed.assignments && typeof parsed.assignments === 'object' ? parsed.assignments : {};
      Object.entries(assignmentRaw).forEach(([assigneeKey, playlistId]) => {
        const key = String(assigneeKey || '').trim();
        const value = String(playlistId || '').trim();
        if (!key || !value) return;
        if (!playlists.some((entry) => entry.id === value)) return;
        assignments[key] = value;
      });
      const progress = Object.create(null);
      const progressRaw = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {};
      Object.entries(progressRaw).forEach(([assigneeKey, index]) => {
        const key = String(assigneeKey || '').trim();
        if (!key) return;
        const playlistId = String(assignments[key] || '').trim();
        if (!playlistId) return;
        const playlist = playlists.find((entry) => entry.id === playlistId);
        const itemCount = Math.max(1, playlist?.items?.length || 1);
        progress[key] = Math.max(0, Math.floor(Number(index) || 0) % itemCount);
      });
      const selectedId = String(parsed.selectedId || '').trim();
      return {
        playlists,
        assignments,
        progress,
        selectedId: playlists.some((entry) => entry.id === selectedId) ? selectedId : (playlists[0]?.id || '')
      };
    } catch {
      return fallback;
    }
  }

  function normalizeProbeRounds(value) {
    const parsed = Math.max(1, Math.floor(Number(value) || 3));
    if (parsed <= 3) return '3';
    if (parsed <= 5) return '5';
    return '8';
  }

  function createEmptyProbeState() {
    return {
      active: false,
      startedAt: 0,
      roundsTarget: Number.parseInt(normalizeProbeRounds(prefs.probeRounds || defaultPrefs.probeRounds), 10),
      roundsDone: 0,
      wins: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      hintRounds: 0,
      focusLabel: '',
      gradeLabel: '',
      student: ''
    };
  }

  function saveProbeHistory(probeHistoryKey, history) {
    const payload = JSON.stringify((Array.isArray(history) ? history : []).slice(0, 24));
    try {
      localStorage.setItem(probeHistoryKey, payload);
      probeHistoryKeys.filter((key) => key !== probeHistoryKey).forEach((key) => {
        localStorage.setItem(key, payload);
      });
    } catch {}
  }

  function saveStudentGoalState(studentGoalsKey, state) {
    try {
      localStorage.setItem(studentGoalsKey, JSON.stringify(state));
    } catch {}
  }

  function savePlaylistState(playlistStateKey, state) {
    try {
      localStorage.setItem(playlistStateKey, JSON.stringify(state));
    } catch {}
  }

  function saveSessionSummaryState(sessionSummaryKey, summary) {
    try {
      sessionStorage.setItem(sessionSummaryKey, JSON.stringify(summary));
    } catch {}
  }

  function saveRosterState(rosterStateKey, state) {
    try {
      localStorage.setItem(rosterStateKey, JSON.stringify(state));
    } catch {}
  }

  return {
    createEmptyProbeState,
    loadPlaylistState,
    loadProbeHistory,
    loadRosterState,
    loadSessionSummaryState,
    loadStudentGoalState,
    normalizeGoalAccuracy,
    normalizeGoalEntry,
    normalizeGoalGuesses,
    normalizeProbeRounds,
    savePlaylistState,
    saveProbeHistory,
    saveRosterState,
    saveSessionSummaryState,
    saveStudentGoalState
  };
}

window.createTeacherStateModule = createTeacherStateModule;
