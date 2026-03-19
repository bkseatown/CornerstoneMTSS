/**
 * app-audio.js
 * Audio buttons, adaptive feedback, challenge task flows
 */

import { prefs } from './app-prefs.js';
import { MISSION_LAB_ENABLED, SAFE_DEFAULT_GRADE_BAND } from './app-constants.js';
import { newGame } from './app-game.js';
import { normalizeReviewWord, setVoicePracticeFeedback, getActiveStudentLabel, isMissionLabStandaloneMode } from './app-settings.js';
import { formatGradeBandLabel, getPlayableWords } from './app-focus.js';

// DOM helper
const _el = id => document.getElementById(id);

  // ─── 9. Gameplay audio buttons ──────────────────────
  const entry = () => WQGame.getState()?.entry;

  const REVEAL_WIN_TOASTS = Object.freeze({
    lightning: Object.freeze([
      Object.freeze({ lead: 'Lightning solve!', coach: 'Stretch goal: increase word length next round.' }),
      Object.freeze({ lead: 'Perfect precision!', coach: 'Try turning hints off for a challenge.' }),
      Object.freeze({ lead: 'Elite read!', coach: 'Move to a harder focus and keep the streak.' })
    ]),
    fast: Object.freeze([
      Object.freeze({ lead: 'Sharp solve!', coach: 'Keep the same pace with a harder word set.' }),
      Object.freeze({ lead: 'Strong accuracy!', coach: 'Try reducing hints for one round.' }),
      Object.freeze({ lead: 'Quick pattern match!', coach: 'Push to one fewer guess next time.' })
    ]),
    steady: Object.freeze([
      Object.freeze({ lead: 'Great solve!', coach: 'You are tracking patterns well. Keep scanning vowels first.' }),
      Object.freeze({ lead: 'Solid work!', coach: 'Next step: lock in opening guesses with stronger coverage.' }),
      Object.freeze({ lead: 'Nice thinking!', coach: 'Focus on letter placement to shave a guess.' })
    ]),
    resilient: Object.freeze([
      Object.freeze({ lead: 'Clutch finish!', coach: 'Great persistence. Start with a wider first guess next round.' }),
      Object.freeze({ lead: 'You closed it out!', coach: 'Try checking endings early for faster lock-in.' }),
      Object.freeze({ lead: 'Strong grit!', coach: 'Use duplicate checks and vowel coverage earlier.' })
    ])
  });
  const REVEAL_LOSS_TOASTS = Object.freeze({
    close: Object.freeze([
      Object.freeze({ lead: 'So close.', coach: 'You were one step away. Keep that pattern next round.' }),
      Object.freeze({ lead: 'Almost there.', coach: 'Great narrowing. Open with broader letter coverage next time.' }),
      Object.freeze({ lead: 'Near miss.', coach: 'You found the structure. A faster vowel check will finish it.' })
    ]),
    mid: Object.freeze([
      Object.freeze({ lead: 'Good effort.', coach: 'Try balancing vowels and common endings earlier.' }),
      Object.freeze({ lead: 'You are building skill.', coach: 'Use guess two to test fresh high-value letters.' }),
      Object.freeze({ lead: 'Keep going.', coach: 'Your next win is close with one stronger opener.' })
    ]),
    early: Object.freeze([
      Object.freeze({ lead: 'Reset and go again.', coach: 'Use a starter with mixed vowels and consonants.' }),
      Object.freeze({ lead: 'Next round is yours.', coach: 'Aim to test 4-5 new letters in guess two.' }),
      Object.freeze({ lead: 'Good practice round.', coach: 'Try classic focus for one quick confidence win.' })
    ])
  });
  const THINKING_LEVEL_META = Object.freeze({
    remember: Object.freeze({
      chip: 'Say It (Remember)',
      teacher: 'Teacher lens: Thinking level Remember · SoR word recognition + retrieval.'
    }),
    understand: Object.freeze({
      chip: 'Explain It (Understand)',
      teacher: 'Teacher lens: Thinking level Understand · SoR semantics + background knowledge.'
    }),
    apply: Object.freeze({
      chip: 'Use It (Apply)',
      teacher: 'Teacher lens: Thinking level Apply · SoR syntax + semantics in context.'
    }),
    analyze: Object.freeze({
      chip: 'Compare It (Analyze)',
      teacher: 'Teacher lens: Thinking level Analyze · SoR pattern analysis + comprehension.'
    }),
    evaluate: Object.freeze({
      chip: 'Defend It (Evaluate)',
      teacher: 'Teacher lens: Thinking level Evaluate · strategy reflection + comprehension.'
    }),
    create: Object.freeze({
      chip: 'Invent It (Create)',
      teacher: 'Teacher lens: Thinking level Create · expressive language + transfer.'
    })
  });
  const CHALLENGE_REFLECTION_KEY = 'wq_v2_levelup_reflections_v1';
  const CHALLENGE_PROGRESS_KEY = 'wq_v2_mission_lab_progress_v1';
  const CHALLENGE_DRAFT_KEY = 'wq_v2_mission_lab_draft_v1';
  const CHALLENGE_ONBOARDING_KEY = 'wq_v2_deep_dive_onboarding_v1';
  const CHALLENGE_ONBOARDING_MAX_VIEWS = 2;
  const CHALLENGE_STRONG_SCORE_MIN = 75;
  const CHALLENGE_COMPLETE_LINES = Object.freeze([
    'Deep Dive complete. Pattern and meaning locked in.',
    'Deep Dive clear. You connected sound, meaning, and sentence use.',
    'Quest upgrade complete. Great transfer from decoding to comprehension.'
  ]);
  const CHALLENGE_TASK_FLOW = Object.freeze(['listen', 'analyze', 'create']);
  const CHALLENGE_TASK_LABELS = Object.freeze({
    listen: 'Sound',
    analyze: 'Meaning',
    create: 'Context'
  });
  const DEEP_DIVE_VARIANTS = Object.freeze({
    listen: Object.freeze(['chunk', 'anchor']),
    analyze: Object.freeze(['definition', 'context']),
    create: Object.freeze(['sentence_pick', 'sentence_fix'])
  });
  const CHALLENGE_PACING_NUDGE_MS = 45 * 1000;
  const CHALLENGE_WORD_ROLE_META = Object.freeze({
    noun: Object.freeze({
      label: 'Noun',
      kidLabel: 'naming word',
      meaningLead: 'Pick the meaning that matches this naming word',
      contextLead: 'Which sentence uses this naming word correctly?',
      contextHelper: 'Check that the word names a person, place, thing, or idea.'
    }),
    verb: Object.freeze({
      label: 'Verb',
      kidLabel: 'action word',
      meaningLead: 'Pick the meaning that matches this action word',
      contextLead: 'Which sentence uses this action word correctly?',
      contextHelper: 'Check that the word names an action that fits the sentence.'
    }),
    adjective: Object.freeze({
      label: 'Adjective',
      kidLabel: 'describing word',
      meaningLead: 'Pick the meaning that matches this describing word',
      contextLead: 'Which sentence uses this describing word correctly?',
      contextHelper: 'Check that the word describes a noun naturally.'
    }),
    adverb: Object.freeze({
      label: 'Adverb',
      kidLabel: 'how word',
      meaningLead: 'Pick the meaning that matches this how word',
      contextLead: 'Which sentence uses this how word correctly?',
      contextHelper: 'Check that the word tells how, when, or where an action happens.'
    }),
    general: Object.freeze({
      label: 'Target Word',
      kidLabel: 'word',
      meaningLead: 'Pick the best meaning for',
      contextLead: 'Which sentence uses this word correctly?',
      contextHelper: 'Check which sentence sounds natural and keeps the meaning right.'
    })
  });
  const CHALLENGE_RANKS = Object.freeze([
    Object.freeze({ minPoints: 0, label: 'Scout' }),
    Object.freeze({ minPoints: 40, label: 'Navigator' }),
    Object.freeze({ minPoints: 90, label: 'Analyst' }),
    Object.freeze({ minPoints: 160, label: 'Strategist' }),
    Object.freeze({ minPoints: 260, label: 'Master Sleuth' })
  ]);
  const CHALLENGE_LEVELS = Object.freeze([
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create'
  ]);
  const CHALLENGE_SCAFFOLD_PROFILE = Object.freeze({
    k2: Object.freeze({
      instructionActive: (station) => `Step ${station} of 3. Finish this step, then move on.`,
      instructionDone: 'Great work. All 3 steps are done. Tap Finish.',
      listen: 'Say the sounds as you tap.',
      analyze: 'Pick the meaning that fits best.',
      create: 'Pick the sentence that sounds right.',
      pace: 'Take about 20-45 seconds on each step, then keep moving.'
    }),
    g35: Object.freeze({
      instructionActive: (station) => `Step ${station} of 3. Finish this step, then move on.`,
      instructionDone: 'All 3 steps are complete. Tap Finish.',
      listen: 'Look for the strongest sound chunk.',
      analyze: 'Use definition and context clues together.',
      create: 'Choose the sentence with precise meaning.',
      pace: 'Aim for 30-60 seconds per step, then move on.'
    }),
    older: Object.freeze({
      instructionActive: (station) => `Step ${station} of 3. Finish this step, then move on.`,
      instructionDone: 'All 3 steps are complete. Tap Finish.',
      listen: 'Anchor your choice in the key phonics chunk.',
      analyze: 'Test meaning against both definition and sentence context.',
      create: 'Select the sentence with strongest semantic fit.',
      pace: 'Keep each step to about 30-60 seconds.'
    })
  });
  const REVEAL_PACING_PRESETS = Object.freeze({
    guided: Object.freeze({ introDelay: 260, betweenDelay: 140, postMeaningDelay: 200 }),
    quick: Object.freeze({ introDelay: 140, betweenDelay: 70, postMeaningDelay: 120 }),
    slow: Object.freeze({ introDelay: 420, betweenDelay: 220, postMeaningDelay: 320 })
  });
  var revealAutoAdvanceTimer = 0;
  var revealAutoCountdownTimer = 0;
  var revealAutoAdvanceEndsAt = 0;
  var revealChallengeState = null;
  var challengeOnboardingState = loadChallengeOnboardingState();

  function pickRandom(items) {
    if (!Array.isArray(items) || !items.length) return '';
    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }

  function clearChallengeSprintTimer() {
    if (challengeSprintTimer) {
      clearInterval(challengeSprintTimer);
      challengeSprintTimer = 0;
    }
    if (challengePacingTimer) {
      clearTimeout(challengePacingTimer);
      challengePacingTimer = 0;
    }
  }

  function clearChallengePacingTimer() {
    if (!challengePacingTimer) return;
    clearTimeout(challengePacingTimer);
    challengePacingTimer = 0;
  }

  function loadChallengeProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHALLENGE_PROGRESS_KEY) || '{}');
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
      localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify({
        points: Math.max(0, Number(progress?.points) || 0),
        streak: Math.max(0, Number(progress?.streak) || 0),
        lastWinDay: String(progress?.lastWinDay || '').trim()
      }));
    } catch {}
  }

  function resolveChallengeRank(points) {
    const total = Math.max(0, Number(points) || 0);
    let active = CHALLENGE_RANKS[0];
    CHALLENGE_RANKS.forEach((rank) => {
      if (total >= rank.minPoints) active = rank;
    });
    return active || CHALLENGE_RANKS[0];
  }

  function loadChallengeOnboardingState() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHALLENGE_ONBOARDING_KEY) || '{}');
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
    challengeOnboardingState = normalized;
    try { localStorage.setItem(CHALLENGE_ONBOARDING_KEY, JSON.stringify(normalized)); } catch {}
  }

  function resolveChallengeGradeTier(gradeLabel) {
    const value = String(gradeLabel || '').toUpperCase().replace(/\s+/g, '');
    if (!value) return 'g35';
    if (value.includes('K-2') || value.includes('K2')) return 'k2';
    if (value.includes('G3-5') || value.includes('3-5')) return 'g35';
    return 'older';
  }

  function getChallengeScaffoldProfile(state = revealChallengeState) {
    const tier = resolveChallengeGradeTier(state?.grade || '');
    return CHALLENGE_SCAFFOLD_PROFILE[tier] || CHALLENGE_SCAFFOLD_PROFILE.g35;
  }

  function buildChallengeQuickstartCopy(state = revealChallengeState) {
    const source = String(state?.source || '').trim().toLowerCase();
    const launchHint = source === 'standalone'
      ? 'You launched from Activities.'
      : 'You launched from the end-of-round card.';
    return `Quick start: finish Sound, Meaning, and Context in order. ${launchHint}`;
  }

  function syncChallengeQuickstartCard(state = revealChallengeState) {
    const wrap = _el('challenge-quickstart');
    const copy = _el('challenge-quickstart-copy');
    if (!wrap || !copy || !state) return;
    const shouldShow = !challengeOnboardingState.dismissed && challengeOnboardingState.seenCount < CHALLENGE_ONBOARDING_MAX_VIEWS;
    if (!shouldShow) {
      wrap.classList.add('hidden');
      return;
    }
    copy.textContent = buildChallengeQuickstartCopy(state);
    wrap.classList.remove('hidden');
    saveChallengeOnboardingState({
      seenCount: challengeOnboardingState.seenCount + 1,
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
    if (score >= CHALLENGE_STRONG_SCORE_MIN) return 'Strong';
    if (score >= 55) return 'Growing';
    return 'Launch';
  }

  function normalizeThinkingLevel(level, fallback = '') {
    const normalized = String(level || '').trim().toLowerCase();
    if (CHALLENGE_LEVELS.includes(normalized)) return normalized;
    return fallback;
  }

  function getChallengeLevelDisplay(level) {
    const normalized = normalizeThinkingLevel(level, 'apply');
    const meta = THINKING_LEVEL_META[normalized] || THINKING_LEVEL_META.apply;
    return String(meta?.chip || normalized).replace(/\s*\(.+\)\s*$/, '').trim();
  }

  function resolveStandaloneAutoChallengeLevel(entry) {
    const band = String(entry?.grade_band || '').trim().toUpperCase();
    if (band === 'K-2') {
      return pickRandom(['remember', 'understand', 'apply']) || 'apply';
    }
    if (band === 'G3-5') {
      return pickRandom(['understand', 'apply', 'analyze']) || 'apply';
    }
    if (band === 'G6-8') {
      return pickRandom(['apply', 'analyze', 'evaluate']) || 'analyze';
    }
    return pickRandom(['analyze', 'evaluate', 'create']) || 'evaluate';
  }

  function getStandaloneMissionWordPool() {
    const focus = _el('setting-focus')?.value || prefs.focus || 'all';
    const selectedGrade = _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade;
    const gradeBand = getEffectiveGameplayGradeBand(selectedGrade, focus);
    const includeLowerBands = shouldExpandGradeBandForFocus(focus);
    const length = String(_el('s-length')?.value || prefs.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;
    let pool = WQData.getPlayableWords({
      gradeBand,
      length,
      phonics: focus,
      includeLowerBands
    });
    if (!pool.length && length !== 'any') {
      pool = WQData.getPlayableWords({
        gradeBand,
        length: 'any',
        phonics: focus,
        includeLowerBands
      });
    }
    if (!pool.length) {
      pool = WQData.getPlayableWords({
        gradeBand,
        length: 'any',
        phonics: 'all'
      });
    }
    return {
      pool: Array.isArray(pool) ? pool : [],
      focus,
      gradeBand,
      length
    };
  }

  function refreshStandaloneMissionLabHub() {
    const select = _el('mission-lab-word-select');
    const note = _el('mission-lab-hub-note');
    const meta = _el('mission-lab-hub-meta');
    if (!select && !note && !meta) return;

    const { pool, focus, gradeBand, length } = getStandaloneMissionWordPool();
    const rawFocusLabel = getFocusLabel(focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    const focusLabel = focus === 'all'
      ? 'Track: Core Vocabulary'
      : `Track: ${rawFocusLabel || 'Targeted Skill'}`;
    const gradeLabel = formatGradeBandLabel(gradeBand);
    const lengthLabel = String(length || '').toLowerCase() === 'any'
      ? 'Any word length'
      : `${String(length)}-letter words`;

    if (select) {
      const previous = normalizeReviewWord(select.value);
      select.innerHTML = '';
      const autoOption = document.createElement('option');
      autoOption.value = '';
      autoOption.textContent = 'Auto-pick from current filters';
      select.appendChild(autoOption);
      pool
        .slice()
        .sort((a, b) => String(a).localeCompare(String(b)))
        .slice(0, 200)
        .forEach((word) => {
          const option = document.createElement('option');
          const normalizedWord = normalizeReviewWord(word);
          option.value = normalizedWord;
          option.textContent = normalizedWord.toUpperCase();
          select.appendChild(option);
        });
      if (previous && pool.includes(previous)) {
        select.value = previous;
      } else {
        select.value = '';
      }
    }

    if (meta) {
      meta.textContent = `${focusLabel} · Grade ${gradeLabel} · ${lengthLabel}`;
    }
    if (note) {
      note.textContent = pool.length
        ? `${pool.length} ready words. Start now, or choose a word + level below.`
        : 'No words match this filter yet. Change quest focus or grade, then try again.';
    }
  }

  function startStandaloneMissionLab(options = {}) {
    const { pool } = getStandaloneMissionWordPool();
    if (!pool.length) {
      WQUI.showToast('No words match this Deep Dive filter. Adjust grade, quest, or word length.');
      refreshStandaloneMissionLabHub();
      return false;
    }

    const selectedWord = normalizeReviewWord(
      options.word ||
      _el('mission-lab-word-select')?.value ||
      ''
    );
    const fallbackWord = normalizeReviewWord(pickRandom(pool) || pool[0] || '');
    const word = (selectedWord && pool.includes(selectedWord)) ? selectedWord : fallbackWord;
    if (!word) {
      WQUI.showToast('Could not pick a Deep Dive word. Try again.');
      return false;
    }

    const entryData = WQData.getEntry(word);
    if (!entryData) {
      WQUI.showToast('Deep Dive word data is missing. Pick another word.');
      return false;
    }

    const requestedLevel = normalizeThinkingLevel(
      options.level ||
      _el('mission-lab-level-select')?.value ||
      ''
    );
    const level = requestedLevel || resolveStandaloneAutoChallengeLevel(entryData);
    const result = {
      word: word.toUpperCase(),
      entry: entryData,
      guesses: [word],
      won: true
    };
    const nextState = buildRevealChallengeState(result, {
      source: 'standalone',
      level
    });
    if (!nextState) {
      WQUI.showToast('Deep Dive could not start with this word.');
      return false;
    }

    revealChallengeState = nextState;
    const activeElement = document.activeElement;
    challengeModalReturnFocusEl = activeElement instanceof HTMLElement && activeElement !== document.body
      ? activeElement
      : null;
    renderRevealChallengeModal();
    _el('challenge-modal')?.classList.remove('hidden');
    syncChallengeQuickstartCard(revealChallengeState);
    focusChallengeModalStart();
    emitTelemetry('wq_deep_dive_start', {
      source: 'standalone',
      word_id: normalizeReviewWord(word),
      level: level || ''
    });
    emitTelemetry('wq_funnel_deep_dive_started', {
      source: 'standalone',
      word_id: normalizeReviewWord(word),
      level: level || ''
    });
    return true;
  }

  function setChallengeFeedback(message, tone = 'default') {
    const el = _el('challenge-live-feedback');
    if (!el) return;
    const text = String(message || '').trim();
    el.textContent = text;
    el.classList.toggle('hidden', !text);
    el.classList.toggle('is-good', tone === 'good');
    el.classList.toggle('is-warn', tone === 'warn');
  }

  function getChallengeDraftStorage() {
    try {
      const raw = JSON.parse(localStorage.getItem(CHALLENGE_DRAFT_KEY) || '{}');
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
    entries.forEach(([key, value]) => { trimmed[key] = value; });
    try { localStorage.setItem(CHALLENGE_DRAFT_KEY, JSON.stringify(trimmed)); } catch {}
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

  function updateChallengeWordCountUI() {
    // Legacy function retained for compatibility with older save/report paths.
  }

  function shuffleList(values) {
    const list = Array.isArray(values) ? [...values] : [];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function normalizeChallengeWord(value) {
    return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  function inferChallengeWordRole(entryData, wordValue = '') {
    const word = normalizeChallengeWord(wordValue || entryData?.word || '');
    const definition = String(entryData?.definition || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const sentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim().toLowerCase();

    if (/(?:ly)$/.test(word) && !/(?:family|only|early|friendly)$/.test(word)) return 'adverb';
    if (/^to\s+[a-z]/.test(definition)) return 'verb';
    if (/\b(action|act|move|do|make|run|jump|write|read|carry|help)\b/.test(definition) && /\bto\b/.test(definition)) {
      return 'verb';
    }
    if (/\b(describing|quality|kind of|full of|having|able to|like)\b/.test(definition)) return 'adjective';
    if (/\b(person|place|thing|idea|someone|something)\b/.test(definition)) return 'noun';
    if (/\b(quickly|slowly|carefully|quietly)\b/.test(sentence)) return 'adverb';
    return 'general';
  }

  function getChallengeWordRoleMeta(entryData, wordValue = '') {
    const roleKey = inferChallengeWordRole(entryData, wordValue);
    return {
      key: roleKey,
      ...(CHALLENGE_WORD_ROLE_META[roleKey] || CHALLENGE_WORD_ROLE_META.general)
    };
  }

  function escapeForRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function fallbackPatternPieces(wordValue) {
    const word = normalizeChallengeWord(wordValue);
    if (!word) return [];
    if (word.length <= 3) {
      return word.split('');
    }
    if (word.length <= 5) {
      return [word.slice(0, 1), word.slice(1, 3), word.slice(3)].filter(Boolean);
    }
    return [word.slice(0, 2), word.slice(2, word.length - 2), word.slice(word.length - 2)].filter(Boolean);
  }

  function resolvePatternPrompt(mark, isPrefixLike, variant = 'chunk') {
    if (variant === 'anchor') {
      if (mark === 'affix') return isPrefixLike ? 'Tap the chunk at the start that guides pronunciation.' : 'Tap the chunk at the end that guides pronunciation.';
      if (mark === 'silent') return 'Tap the chunk that changes the sound without saying every letter.';
      return 'Tap the chunk that best anchors the vowel sound.';
    }
    if (mark === 'team') return 'Tap the sound team chunk.';
    if (mark === 'silent') return 'Tap the silent letter chunk.';
    if (mark === 'affix') return isPrefixLike ? 'Tap the prefix chunk.' : 'Tap the suffix chunk.';
    if (mark === 'schwa') return 'Tap the schwa vowel chunk.';
    if (mark === 'letter') return 'Tap the vowel anchor chunk.';
    return 'Tap the target sound chunk.';
  }

  function scorePatternFallbackChunk(label) {
    const chunk = String(label || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!chunk) return Number.NEGATIVE_INFINITY;
    const vowelCount = (chunk.match(/[AEIOUY]/g) || []).length;
    const hasAnchorCluster = /(AI|AY|AU|AW|EA|EE|EI|EY|IE|OA|OE|OI|OO|OU|OW|OY|UE|UI|AR|ER|IR|OR|UR|IGH|CH|SH|TH|PH|WH|TCH|DGE|CK|NG|NK)/.test(chunk);
    let score = vowelCount * 5;
    if (hasAnchorCluster) score += 3;
    if (vowelCount === 0) score -= 4;
    score += Math.min(2, chunk.length * 0.3);
    return score;
  }

  function resolveFallbackPatternChoiceIndex(choices) {
    const list = Array.isArray(choices) ? choices : [];
    if (!list.length) return 0;
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    list.forEach((choice, index) => {
      const score = scorePatternFallbackChunk(choice?.label);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0) return bestIndex;
    return Math.max(0, Math.floor((list.length - 1) / 2));
  }

  function computeWordVariantSeed(word) {
    const text = String(word || '').toLowerCase();
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) {
      seed = ((seed * 31) + text.charCodeAt(i)) % 2147483647;
    }
    seed += (Date.now() % 997);
    return Math.abs(seed);
  }

  function pickDeepDiveTaskVariant(result, task) {
    const options = DEEP_DIVE_VARIANTS[task];
    if (!Array.isArray(options) || !options.length) return '';
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim();
    const seed = computeWordVariantSeed(`${word}:${task}`);
    return options[seed % options.length] || options[0];
  }

  function buildDeepDiveVariants(result) {
    return {
      listen: pickDeepDiveTaskVariant(result, 'listen') || 'chunk',
      analyze: pickDeepDiveTaskVariant(result, 'analyze') || 'definition',
      create: pickDeepDiveTaskVariant(result, 'create') || 'sentence_pick'
    };
  }

  function buildDeepDivePatternTask(result, variant = 'chunk') {
    const entryData = result?.entry || null;
    const word = normalizeChallengeWord(result?.word || entryData?.word || '');
    if (!word) {
      return {
        prompt: 'Tap the target sound chunk.',
        helper: '',
        choices: []
      };
    }

    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const phonicsTag = String(entryData?.phonics || '').trim();
    let category = normalizeHintCategoryFromFocusTag(focusValue, phonicsTag);
    if (category === 'general') category = detectHintCategoryFromWord(word);
    const live = buildLiveHintExample(word, category);

    let choices = Array.isArray(live?.parts)
      ? live.parts
        .map((part, index) => {
          const text = String(part?.text || '').toUpperCase();
          if (!text) return null;
          const mark = String(part?.mark || '').trim().toLowerCase();
          return {
            id: `pattern-${index}`,
            label: text,
            mark,
            correct: !!mark
          };
        })
        .filter(Boolean)
      : [];

    if (!choices.length) {
      const pieces = fallbackPatternPieces(word);
      choices = pieces.map((piece, index) => ({
        id: `pattern-${index}`,
        label: String(piece || '').toUpperCase(),
        mark: '',
        correct: false
      }));
    }

    if (!choices.length) {
      choices = [{
        id: 'pattern-full',
        label: word.toUpperCase(),
        mark: '',
        correct: true
      }];
    }

    let usedFallbackAnchor = false;
    let correctChoice = choices.find((choice) => choice.correct);
    if (!correctChoice) {
      const fallbackIndex = resolveFallbackPatternChoiceIndex(choices);
      correctChoice = choices[fallbackIndex] || choices[0];
      if (correctChoice) {
        correctChoice.correct = true;
        if (!correctChoice.mark) correctChoice.mark = 'letter';
        usedFallbackAnchor = true;
      }
    }

    const prefixLike = !!correctChoice && choices[0] && correctChoice.id === choices[0].id;
    const helperNote = String(live?.note || '').trim();
    return {
      prompt: resolvePatternPrompt(correctChoice?.mark || '', prefixLike, variant),
      helper: helperNote || (usedFallbackAnchor
        ? `Look for the chunk that carries the vowel anchor in ${word.toUpperCase()}.`
        : ''),
      choices: choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        correct: !!choice.correct
      }))
    };
  }

  function buildDeepDiveMeaningTask(result, roleMeta, variant = 'definition') {
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim().toUpperCase();
    const correctDefinition = String(entryData?.definition || '').replace(/\s+/g, ' ').trim();
    const sentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim();

    const selectedGrade = _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade;
    const focus = _el('setting-focus')?.value || prefs.focus || 'all';
    const gradeBand = String(entryData?.grade_band || getEffectiveGameplayGradeBand(selectedGrade, focus)).trim() || SAFE_DEFAULT_GRADE_BAND;

    const pool = shuffleList(WQData.getPlayableWords({
      gradeBand,
      length: 'any',
      phonics: 'all'
    }));

    const distractors = [];
    const distractorWords = [];
    pool.forEach((candidateWord) => {
      if (distractors.length >= 3) return;
      const normalizedCandidate = normalizeReviewWord(candidateWord);
      if (!normalizedCandidate || normalizedCandidate === normalizeReviewWord(word)) return;
      const candidateEntry = WQData.getEntry(normalizedCandidate);
      const candidateDefinition = String(candidateEntry?.definition || '').replace(/\s+/g, ' ').trim();
      if (!candidateDefinition || candidateDefinition.toLowerCase() === correctDefinition.toLowerCase()) return;
      if (distractors.some((item) => item.toLowerCase() === candidateDefinition.toLowerCase())) return;
      distractors.push(candidateDefinition);
      distractorWords.push(normalizedCandidate.toUpperCase());
    });

    const fallbackDistractors = [
      'A quick sound warm-up pattern.',
      'A place where words are sorted.',
      'A strategy for checking letter order.'
    ];
    while (distractors.length < 3) {
      const candidate = fallbackDistractors[distractors.length] || fallbackDistractors[0];
      if (!candidate) break;
      distractors.push(candidate);
      distractorWords.push('—');
    }

    const compact = (value) => {
      const clean = String(value || '').replace(/\s+/g, ' ').trim();
      if (clean.length <= 108) return clean;
      return `${clean.slice(0, 105).trim()}...`;
    };

    const choices = shuffleList([
      { id: 'meaning-correct', label: compact(correctDefinition || `${word} is the target word for this round.`), correct: true },
      ...distractors.slice(0, 3).map((label, index) => ({
        id: `meaning-${index + 1}`,
        label: compact(label),
        correct: false
      }))
    ]);

    let prompt = `Pick the meaning that matches this ${roleMeta?.kidLabel || 'word'}: "${word}".`;
    if (variant === 'context' && sentence) {
      prompt = `Use the sentence clue to choose the best meaning for "${word}": ${compact(sentence)}`;
    }

    return {
      prompt,
      choices,
      distractorWords
    };
  }

  function buildDeepDiveSyntaxTask(result, meaningTask, roleMeta, variant = 'sentence_pick') {
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim().toUpperCase();
    const normalizedWord = normalizeChallengeWord(word);
    const rawSentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim();

    const fallbackSentence = `${word} fits in this sentence because the meaning matches the context.`;
    const correctSentence = rawSentence || fallbackSentence;

    const distractorWord = normalizeChallengeWord(meaningTask?.distractorWords?.[0] || '')
      || normalizeChallengeWord(pickRandom(WQData.getPlayableWords({ gradeBand: SAFE_DEFAULT_GRADE_BAND, length: 'any', phonics: 'all' })))
      || 'banana';

    let wrongSentence = correctSentence;
    if (normalizedWord && new RegExp(`\\b${escapeForRegExp(normalizedWord)}\\b`, 'i').test(correctSentence)) {
      wrongSentence = correctSentence.replace(
        new RegExp(`\\b${escapeForRegExp(normalizedWord)}\\b`, 'i'),
        distractorWord.toLowerCase()
      );
    } else {
      wrongSentence = `Because ${normalizedWord || 'word'} the students quickly.`;
    }

    const compact = (value) => {
      const clean = String(value || '').replace(/\s+/g, ' ').trim();
      if (clean.length <= 120) return clean;
      return `${clean.slice(0, 117).trim()}...`;
    };

    const prompt = variant === 'sentence_fix'
      ? `Which sentence needs "${word}" to make sense?`
      : `Which sentence uses this ${roleMeta?.kidLabel || 'word'} correctly: "${word}"?`;
    const wrongLabel = variant === 'sentence_fix'
      ? compact(`The class planned to ${distractorWord.toLowerCase()} the story during lunch.`)
      : compact(wrongSentence);

    return {
      prompt,
      choices: shuffleList([
        { id: 'syntax-correct', label: compact(correctSentence), correct: true },
        { id: 'syntax-wrong', label: wrongLabel, correct: false }
      ])
    };
  }

  function buildDeepDiveState(result) {
    const entryData = result?.entry || null;
    const roleMeta = getChallengeWordRoleMeta(entryData, result?.word || entryData?.word || '');
    const variants = buildDeepDiveVariants(result);
    const patternTask = buildDeepDivePatternTask(result, variants.listen);
    const meaningTask = buildDeepDiveMeaningTask(result, roleMeta, variants.analyze);
    const syntaxTask = buildDeepDiveSyntaxTask(result, meaningTask, roleMeta, variants.create);
    const analyzeHelper = variants.analyze === 'context'
      ? `Use context clues first, then confirm the definition for this ${roleMeta.kidLabel}.`
      : `Choose the definition that fits this ${roleMeta.kidLabel}.`;
    const createHelper = variants.create === 'sentence_fix'
      ? 'Find the sentence where the target word makes the meaning sound right.'
      : (roleMeta.contextHelper || 'Pick the sentence where the word fits naturally.');
    return {
      role: roleMeta,
      variants,
      titles: {
        listen: `1. ${CHALLENGE_TASK_LABELS.listen}`,
        analyze: `2. ${CHALLENGE_TASK_LABELS.analyze}`,
        create: `3. ${CHALLENGE_TASK_LABELS.create}`
      },
      prompts: {
        listen: patternTask.prompt,
        analyze: meaningTask.prompt,
        create: syntaxTask.prompt
      },
      helpers: {
        listen: patternTask.helper || 'Find the chunk that carries the key sound.',
        analyze: analyzeHelper,
        create: createHelper
      },
      choices: {
        listen: patternTask.choices,
        analyze: meaningTask.choices,
        create: syntaxTask.choices
      },
      selected: {
        listen: '',
        analyze: '',
        create: ''
      },
      attempts: {
        listen: 0,
        analyze: 0,
        create: 0
      }
    };
  }

  function getChallengeDoneCount(state = revealChallengeState) {
    return CHALLENGE_TASK_FLOW
      .reduce((count, task) => count + (state?.tasks?.[task] ? 1 : 0), 0);
  }

  function getFirstIncompleteChallengeTask(state = revealChallengeState) {
    return CHALLENGE_TASK_FLOW.find((task) => !state?.tasks?.[task]) || '';
  }

  function getNextChallengeTask(state = revealChallengeState, fromTask = '') {
    if (!state) return '';
    const index = Math.max(0, CHALLENGE_TASK_FLOW.indexOf(fromTask || state.activeTask));
    for (let i = index + 1; i < CHALLENGE_TASK_FLOW.length; i += 1) {
      const task = CHALLENGE_TASK_FLOW[i];
      if (!state.tasks?.[task]) return task;
    }
    for (let i = 0; i <= index; i += 1) {
      const task = CHALLENGE_TASK_FLOW[i];
      if (!state.tasks?.[task]) return task;
    }
    return '';
  }

  function setChallengeActiveTask(task, state = revealChallengeState) {
    if (!state) return '';
    const firstIncomplete = getFirstIncompleteChallengeTask(state);
    const lockIndex = CHALLENGE_TASK_FLOW.indexOf(firstIncomplete);
    if (CHALLENGE_TASK_FLOW.includes(task)) {
      const requestedIndex = CHALLENGE_TASK_FLOW.indexOf(task);
      state.activeTask = (lockIndex >= 0 && requestedIndex > lockIndex)
        ? firstIncomplete
        : task;
      return state.activeTask;
    }
    const fallback = getFirstIncompleteChallengeTask(state) || CHALLENGE_TASK_FLOW[0];
    state.activeTask = fallback;
    return fallback;
  }

  function getChallengeInstructionText(state = revealChallengeState) {
    const profile = getChallengeScaffoldProfile(state);
    const doneCount = getChallengeDoneCount(state);
    if (doneCount >= 3) return profile.instructionDone;
    const activeTask = setChallengeActiveTask(state?.activeTask, state);
    const stationIndex = Math.max(0, CHALLENGE_TASK_FLOW.indexOf(activeTask)) + 1;
    return profile.instructionActive(stationIndex);
  }

  function syncChallengeActionButtons(state = revealChallengeState) {
    const nextBtn = _el('challenge-next-station');
    const saveBtn = _el('challenge-save-reflection');
    const finishBtn = _el('challenge-finish-btn');
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
      nextBtn.classList.toggle('hidden', doneCount >= 3);
      nextBtn.disabled = !canAdvance;
      nextBtn.textContent = canAdvance ? 'Next Step' : 'Finish This Step';
      if (doneCount < 3) nextBtn.classList.add('is-primary-action');
    }

    if (saveBtn) {
      saveBtn.classList.toggle('hidden', doneCount <= 0);
      saveBtn.textContent = doneCount >= 3 ? 'Save Progress' : 'Save Checkpoint';
    }

    if (finishBtn) {
      finishBtn.classList.toggle('hidden', doneCount < 3);
      finishBtn.disabled = doneCount < 3;
      finishBtn.textContent = doneCount >= 3 ? 'Finish' : `Finish (${doneCount}/3)`;
      if (doneCount >= 3) finishBtn.classList.add('is-primary-action');
    }
  }

  function updateChallengeStationUI(state = revealChallengeState) {
    const instruction = _el('challenge-instruction');

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
    const activeIndex = Math.max(0, CHALLENGE_TASK_FLOW.indexOf(activeTask));
    CHALLENGE_TASK_FLOW.forEach((task, index) => {
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

  function syncChallengePacingTimer(state = revealChallengeState) {
    if (!state || state.completedAt || getChallengeDoneCount(state) >= CHALLENGE_TASK_FLOW.length) {
      clearChallengeSprintTimer();
      return;
    }
    const modal = _el('challenge-modal');
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
    const startedAt = Math.max(0, Number(state.pacing.startedAt) || 0);
    if (!startedAt) {
      state.pacing.startedAt = Date.now();
    }
    const elapsed = Math.max(0, Date.now() - Math.max(1, Number(state.pacing.startedAt) || 0));
    const remainingMs = Math.max(300, CHALLENGE_PACING_NUDGE_MS - elapsed);
    clearChallengePacingTimer();
    challengePacingTimer = setTimeout(() => {
      challengePacingTimer = 0;
      if (!revealChallengeState || revealChallengeState.completedAt || getChallengeDoneCount(revealChallengeState) >= CHALLENGE_TASK_FLOW.length) return;
      const liveModal = _el('challenge-modal');
      if (!liveModal || liveModal.classList.contains('hidden')) return;
      const currentTask = setChallengeActiveTask(revealChallengeState.activeTask, revealChallengeState);
      if (!currentTask) return;
      if (!revealChallengeState.pacing || typeof revealChallengeState.pacing !== 'object') return;
      if (revealChallengeState.pacing.task !== currentTask) return;
      if (revealChallengeState.tasks?.[currentTask]) return;
      if (revealChallengeState.pacing.nudged) return;
      revealChallengeState.pacing.nudged = true;
      const profile = getChallengeScaffoldProfile(revealChallengeState);
      setChallengeFeedback(profile.pace, 'default');
    }, remainingMs);
  }

  function getChallengeChoice(task, choiceId, stateOverride = revealChallengeState) {
    const state = stateOverride;
    if (!state?.deepDive?.choices) return null;
    const rows = state.deepDive.choices[task];
    if (!Array.isArray(rows)) return null;
    return rows.find((choice) => String(choice?.id || '') === String(choiceId || '')) || null;
  }

  function syncChallengeResponseSummary(state = revealChallengeState) {
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
    const wrap = _el(containerId);
    if (!wrap) return;
    const state = revealChallengeState;
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
    const state = revealChallengeState;
    if (!state || !state.deepDive || state.completedAt) return;
    if (!Object.prototype.hasOwnProperty.call(state.tasks, task)) return;

    const choice = getChallengeChoice(task, choiceId);
    if (!choice) return;

    state.deepDive.selected[task] = String(choice.id || '');
    state.deepDive.attempts[task] = Math.max(0, Number(state.deepDive.attempts[task]) || 0) + 1;
    const wasComplete = !!state.tasks[task];
    setChallengeTaskComplete(task, !!choice.correct);
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
      setChallengeFeedback(`${CHALLENGE_TASK_LABELS[task] || 'Step'} complete. Next step unlocked.`, 'good');
      return;
    }
    setChallengeFeedback('All 3 steps are done. Tap Finish.', 'good');
  }

  function computeChallengeScore(state) {
    if (!state) return { clarity: 0, evidence: 0, vocabulary: 0, total: 0 };
    const attempts = state.deepDive?.attempts || {};
    const taskList = CHALLENGE_TASK_FLOW;
    const doneCount = taskList.reduce((count, task) => count + (state.tasks?.[task] ? 1 : 0), 0);
    const firstTryCount = taskList.reduce((count, task) => (
      count + (state.tasks?.[task] && Number(attempts?.[task] || 0) <= 1 ? 1 : 0)
    ), 0);
    const extraAttempts = taskList.reduce((count, task) => (
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
    const scoreLabel = _el('challenge-score-label');
    const scoreDetail = _el('challenge-score-detail');
    if (!scoreLabel || !scoreDetail) return;
    if (!revealChallengeState) {
      scoreLabel.textContent = 'Deep Dive score: --';
      scoreDetail.textContent = 'Band -- · Accuracy -- · Meaning -- · Syntax --';
      return;
    }
    const score = computeChallengeScore(revealChallengeState);
    const band = resolveMissionScoreBand(score.total);
    revealChallengeState.score = score;
    scoreLabel.textContent = `Deep Dive score: ${score.total}/100`;
    scoreDetail.textContent = `${band} band · Accuracy ${score.clarity} · Meaning ${score.evidence} · Syntax ${score.vocabulary}`;
  }

  function clearRevealAutoAdvanceTimer() {
    if (revealAutoAdvanceTimer) {
      clearTimeout(revealAutoAdvanceTimer);
      revealAutoAdvanceTimer = 0;
    }
    if (revealAutoCountdownTimer) {
      clearInterval(revealAutoCountdownTimer);
      revealAutoCountdownTimer = 0;
    }
    revealAutoAdvanceEndsAt = 0;
    _el('modal-auto-next-banner')?.classList.add('hidden');
  }

  function showModalAutoNextBanner(message) {
    const banner = _el('modal-auto-next-banner');
    const label = _el('modal-auto-next-countdown');
    if (!banner || !label) return;
    label.textContent = message;
    banner.classList.remove('hidden');
  }

  function waitMs(ms) {
    const delay = Math.max(0, Number(ms) || 0);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  function getRevealPacingPreset() {
    const mode = getRevealPacingMode();
    return REVEAL_PACING_PRESETS[mode] || REVEAL_PACING_PRESETS.guided;
  }

  function scheduleRevealAutoAdvance() {
    clearRevealAutoAdvanceTimer();
    const seconds = getRevealAutoNextSeconds();
    if (seconds <= 0) return;
    if (getVoicePracticeMode() === 'required') return;
    if (_el('modal-overlay')?.classList.contains('hidden')) return;
    revealAutoAdvanceEndsAt = Date.now() + (seconds * 1000);

    const tickCountdown = () => {
      if (_el('modal-overlay')?.classList.contains('hidden')) {
        clearRevealAutoAdvanceTimer();
        return;
      }
      if (voiceIsRecording) {
        showModalAutoNextBanner('Auto next waits for recording to finish...');
        return;
      }
      const remaining = Math.max(0, Math.ceil((revealAutoAdvanceEndsAt - Date.now()) / 1000));
      showModalAutoNextBanner(`Next word in ${remaining}s`);
    };
    tickCountdown();
    revealAutoCountdownTimer = setInterval(tickCountdown, 250);

    const tryAdvance = () => {
      if (_el('modal-overlay')?.classList.contains('hidden')) {
        clearRevealAutoAdvanceTimer();
        return;
      }
      if (voiceIsRecording) {
        revealAutoAdvanceTimer = setTimeout(tryAdvance, 900);
        return;
      }
      clearRevealAutoAdvanceTimer();
      newGame();
    };
    revealAutoAdvanceTimer = setTimeout(tryAdvance, seconds * 1000);
  }

  function shouldIncludeFunInMeaning() {
    const toggle = _el('s-meaning-fun-link');
    if (toggle) return !!toggle.checked;
    return (prefs.meaningPlusFun || DEFAULT_PREFS.meaningPlusFun) === 'on';
  }

  function cancelRevealNarration() {
    revealNarrationToken += 1;
    WQAudio.stop();
  }

  function trimToastDefinition(definition) {
    const text = String(definition || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= 72) return text;
    return `${text.slice(0, 69).trim()}...`;
  }

  function ensureTerminalPunctuation(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  function buildCombinedMeaningLine(definition, funAddOn) {
    const def = String(definition || '').replace(/\s+/g, ' ').trim();
    const fun = String(funAddOn || '').replace(/\s+/g, ' ').trim();
    if (!def && !fun) return '';
    if (!def) return ensureTerminalPunctuation(fun);
    if (!fun) return ensureTerminalPunctuation(def);
    const defBase = def.replace(/[.!?]+$/, '').trim();
    if (/^[,.;:!?]/.test(fun)) {
      return ensureTerminalPunctuation(`${defBase}${fun}`);
    }
    const funNoLeadPunc = fun.replace(/^[,.;:!?]\s*/, '').trim();
    return ensureTerminalPunctuation(`${defBase} and ${funNoLeadPunc}`);
  }

  function getRevealMeaningPayload(nextEntry) {
    const definition = String(nextEntry?.definition || '').replace(/\s+/g, ' ').trim();
    const includeFun = shouldIncludeFunInMeaning();
    const funAddOn = includeFun
      ? String(nextEntry?.fun_add_on || '').replace(/\s+/g, ' ').trim()
      : '';
    const line = buildCombinedMeaningLine(definition, funAddOn);
    const readDef = String(nextEntry?.text_to_read_definition || '').replace(/\s+/g, ' ').trim()
      || ensureTerminalPunctuation(
        nextEntry?.word && definition
          ? `${nextEntry.word} means ${definition}`
          : definition
      );
    const readFun = includeFun
      ? String(nextEntry?.text_to_read_fun || '').replace(/\s+/g, ' ').trim() || funAddOn
      : '';
    const readAll = (() => {
      if (readDef && readFun) {
        const smoothDef = readDef.replace(/[.!?]+$/, '').trim();
        const smoothFun = readFun.replace(/^[,.;:!?]\s*/, '').trim();
        return ensureTerminalPunctuation(`${smoothDef} and ${smoothFun}`);
      }
      return [readDef, readFun].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    })();
    return { definition, funAddOn, line, readAll };
  }

  function syncRevealMeaningHighlight(nextEntry) {
    const wrap = _el('modal-meaning-highlight');
    const lineEl = _el('modal-meaning-highlight-line');
    if (!wrap || !lineEl) return;

    const meaning = getRevealMeaningPayload(nextEntry);
    lineEl.textContent = meaning.line;
    wrap.classList.toggle('hidden', !meaning.line);
    syncRevealReadCue(nextEntry);
  }

  function buildRevealReadCue(text) {
    const sentence = String(text || '').replace(/\s+/g, ' ').trim();
    if (!sentence) return '';
    const cues = [];
    if (/\?$/.test(sentence)) cues.push('Lift your voice slightly at the end for the question mark.');
    else if (/!$/.test(sentence)) cues.push('Use a strong voice at the exclamation point.');
    if (/,/.test(sentence)) cues.push('Pause briefly at commas.');
    else if (/\b(because|although|when|if|while)\b/i.test(sentence)) cues.push('Add a small pause before the clause word.');
    return cues.slice(0, 2).join(' ');
  }

  function syncRevealReadCue(nextEntry) {
    const cueEl = _el('modal-read-cue');
    if (!cueEl) return;
    const sourceText = String(nextEntry?.sentence || '').trim() || String(nextEntry?.text_to_read_definition || '').trim();
    const cue = buildRevealReadCue(sourceText);
    cueEl.textContent = cue || '';
    cueEl.classList.toggle('hidden', !cue);
  }

  function getRevealFeedbackCopy(result) {
    const guessCount = Math.max(1, Number(result?.guesses?.length || 0));
    const maxGuesses = getActiveMaxGuesses();

    if (result?.won) {
      let key = 'steady';
      if (guessCount <= 1) key = 'lightning';
      else if (guessCount <= Math.max(2, Math.ceil(maxGuesses * 0.34))) key = 'fast';
      else if (guessCount >= Math.max(4, maxGuesses - 1)) key = 'resilient';
      return pickRandom(REVEAL_WIN_TOASTS[key]) || { lead: 'Great solve!', coach: '' };
    }

    const remaining = Math.max(0, maxGuesses - guessCount);
    let key = 'mid';
    if (remaining <= 1) key = 'close';
    else if (guessCount <= 2) key = 'early';
    return pickRandom(REVEAL_LOSS_TOASTS[key]) || { lead: 'Keep going.', coach: '' };
  }

  function getActiveMaxGuesses() {
    const stateMax = Number(WQGame.getState?.()?.maxGuesses || 0);
    const prefMax = Number.parseInt(_el('s-guesses')?.value || DEFAULT_PREFS.guesses, 10);
    return Math.max(1, Number.isFinite(stateMax) && stateMax > 0
      ? stateMax
      : Number.isFinite(prefMax) && prefMax > 0
        ? prefMax
        : 6);
  }

  function trimPromptText(value, max = 80) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
  }

  function pickThinkingLevel(result) {
    const guessCount = Math.max(1, Number(result?.guesses?.length || 0));
    const maxGuesses = getActiveMaxGuesses();
    if (result?.won) {
      if (guessCount <= Math.max(2, Math.ceil(maxGuesses * 0.34))) {
        return pickRandom(['evaluate', 'create']) || 'create';
      }
      if (guessCount <= Math.max(3, Math.ceil(maxGuesses * 0.67))) {
        return pickRandom(['apply', 'analyze']) || 'analyze';
      }
      return 'apply';
    }
    if (guessCount <= 2) return 'remember';
    if (guessCount >= Math.max(4, maxGuesses - 1)) return 'understand';
    return 'apply';
  }

  function getChallengeFocusLabel(value) {
    return getFocusLabel(value)
      .replace(/[—]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Classic (Wordle 5x6)';
  }

  function getChallengeTopicLabel(result) {
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const phonics = String(result?.entry?.phonics || '').trim();
    if (phonics && phonics.toLowerCase() !== 'all') return phonics;
    if (preset.kind === 'subject') return `${preset.subject.toUpperCase()} vocabulary`;
    if (preset.kind === 'phonics') return getChallengeFocusLabel(focusValue);
    return 'Word meaning + sentence clues';
  }

  function getChallengeGradeLabel(result) {
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject' && preset.gradeBand) {
      return formatGradeBandLabel(preset.gradeBand);
    }
    const entryBand = String(result?.entry?.grade_band || '').trim();
    if (entryBand) return formatGradeBandLabel(entryBand);
    return formatGradeBandLabel(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade);
  }

  function buildThinkingPrompt(level, result) {
    const word = String(result?.word || '').trim().toUpperCase();
    const sentence = trimPromptText(result?.entry?.sentence, 76);
    const topic = trimPromptText(getChallengeTopicLabel(result), 44);
    const promptsByLevel = {
      remember: [
        `Say "${word}" and spell it out loud.`,
        `Clap each sound in "${word}", then say the whole word.`
      ],
      understand: [
        `In your own words, what does "${word}" mean?`,
        sentence
          ? `How does "${word}" help the meaning of this sentence: "${sentence}"?`
          : `Tell what "${word}" means and give one real-life example.`
      ],
      apply: [
        `Use "${word}" in a brand-new sentence about your day.`,
        `Say a sentence with "${word}" that could happen at school or home.`
      ],
      analyze: [
        `Compare "${word}" with another word from this quest focus (${topic}). What is one key difference?`,
        `In this ${topic} quest, which clue helped most: start, ending, or sentence context? Why?`
      ],
      evaluate: [
        `Which strategy helped most this round and why?`,
        `If you played this word again, what one move would you keep? Explain.`
      ],
      create: [
        `Create a clue for "${word}" without saying the word.`,
        `Write a mini riddle that leads to "${word}".`
      ]
    };
    return pickRandom(promptsByLevel[level] || promptsByLevel.apply) || '';
  }

  function buildThinkingChallenge(result, options = {}) {
    if (!result?.word) return null;
    const forcedLevel = normalizeThinkingLevel(options.level || '');
    const level = forcedLevel || pickThinkingLevel(result);
    const meta = THINKING_LEVEL_META[level] || THINKING_LEVEL_META.apply;
    const prompt = buildThinkingPrompt(level, result);
    if (!prompt) return null;
    return {
      level,
      chip: meta.chip,
      prompt,
      teacher: meta.teacher
    };
  }

  function updateChallengeProgressUI() {
    const label = _el('challenge-progress-label');
    const fill = _el('challenge-progress-fill');
    const finishBtn = _el('challenge-finish-btn');
    if (!revealChallengeState) {
      if (label) label.textContent = '0 / 3 steps complete';
      if (fill) fill.style.width = '0%';
      if (finishBtn) finishBtn.disabled = true;
      if (finishBtn) finishBtn.textContent = 'Finish';
      setChallengeFeedback('');
      updateChallengeScoreUI();
      updateChallengeStationUI(null);
      return;
    }
    const doneCount = getChallengeDoneCount(revealChallengeState);
    if (label) label.textContent = `${doneCount} / 3 steps complete`;
    if (fill) fill.style.width = `${Math.round((doneCount / 3) * 100)}%`;
    if (finishBtn) {
      finishBtn.disabled = doneCount < 3;
      finishBtn.textContent = doneCount >= 3 ? 'Finish (3/3)' : `Finish (${doneCount}/3)`;
    }
    updateChallengeScoreUI();
    updateChallengeStationUI(revealChallengeState);
  }

  function setChallengeTaskComplete(task, complete) {
    if (!revealChallengeState || !Object.prototype.hasOwnProperty.call(revealChallengeState.tasks, task)) return;
    const normalized = !!complete;
    const wasComplete = !!revealChallengeState.tasks[task];
    revealChallengeState.tasks[task] = normalized;
    const card = document.querySelector(`[data-challenge-task="${task}"]`);
    const statusChip = _el(`challenge-status-${task}`);
    if (card) card.classList.toggle('is-complete', normalized);
    if (statusChip) {
      statusChip.textContent = normalized ? 'Completed' : 'Pending';
      statusChip.classList.toggle('is-complete', normalized);
    }
    if (normalized !== wasComplete) {
      if (normalized) {
        setChallengeFeedback(`${CHALLENGE_TASK_LABELS[task] || 'Step'} complete.`, 'good');
      } else {
        setChallengeFeedback(`${CHALLENGE_TASK_LABELS[task] || 'Step'} needs one more try.`, 'warn');
      }
    }
    saveChallengeDraft(revealChallengeState);
    updateChallengeProgressUI();
  }

  const deepDiveCoreFeature = window.WQDeepDiveCoreFeature?.createFeature?.({
    contract: DEEP_DIVE_CONTRACT,
    el: _el,
    getRevealChallengeState: () => revealChallengeState,
    getDoneCount: getChallengeDoneCount,
    setTaskComplete: setChallengeTaskComplete,
    setFeedback: setChallengeFeedback,
    renderModal: renderRevealChallengeModal
  }) || null;

  function renderRevealChallengeModal() {
    const state = revealChallengeState;
    if (!state) return;
    const challenge = state.challenge;
    if (!challenge) return;

    const levelChip = _el('challenge-level-chip');
    const wordChip = _el('challenge-word-chip');
    const topicChip = _el('challenge-topic-chip');
    const gradeChip = _el('challenge-grade-chip');
    const roleChip = _el('challenge-role-chip');
    const listenTitle = _el('challenge-listen-title');
    const analyzeTitle = _el('challenge-analyze-title');
    const createTitle = _el('challenge-create-title');
    const listenPrompt = _el('challenge-listen-prompt');
    const analyzePrompt = _el('challenge-analyze-prompt');
    const createPrompt = _el('challenge-create-prompt');
    const listenHelper = _el('challenge-listen-helper');
    const analyzeHelper = _el('challenge-analyze-helper');
    const createHelper = _el('challenge-create-helper');
    const teacherLens = _el('challenge-teacher-lens');
    const deepDive = state.deepDive || buildDeepDiveState(state.result);
    const scaffold = getChallengeScaffoldProfile(state);
    state.deepDive = deepDive;

    if (levelChip) levelChip.textContent = getChallengeLevelDisplay(challenge.level);
    if (wordChip) wordChip.textContent = `Word: ${state.word}`;
    if (topicChip) topicChip.textContent = `Quest focus: ${state.topic}`;
    if (gradeChip) gradeChip.textContent = `Grade: ${state.grade}`;
    if (roleChip) roleChip.textContent = `Word type: ${deepDive?.role?.label || 'Target Word'} (${deepDive?.role?.kidLabel || 'word'})`;
    if (listenTitle) listenTitle.textContent = deepDive?.titles?.listen || `1. ${CHALLENGE_TASK_LABELS.listen}`;
    if (analyzeTitle) analyzeTitle.textContent = deepDive?.titles?.analyze || `2. ${CHALLENGE_TASK_LABELS.analyze}`;
    if (createTitle) createTitle.textContent = deepDive?.titles?.create || `3. ${CHALLENGE_TASK_LABELS.create}`;
    if (listenPrompt) listenPrompt.textContent = deepDive.prompts.listen || `Tap the key sound chunk in "${state.word}".`;
    if (analyzePrompt) analyzePrompt.textContent = deepDive.prompts.analyze || `Pick the best meaning for "${state.word}".`;
    if (createPrompt) createPrompt.textContent = deepDive.prompts.create || `Choose the sentence that uses "${state.word}" correctly.`;
    if (listenHelper) listenHelper.textContent = `${deepDive.helpers.listen || ''} ${scaffold.listen}`.trim();
    if (analyzeHelper) analyzeHelper.textContent = `${deepDive.helpers.analyze || ''} ${scaffold.analyze}`.trim();
    if (createHelper) createHelper.textContent = `${deepDive.helpers.create || ''} ${scaffold.create}`.trim();
    if (teacherLens) teacherLens.textContent = `${challenge.teacher} Score updates appear in Specialist Hub.`;

    renderChallengeChoiceButtons('challenge-pattern-options', 'listen');
    renderChallengeChoiceButtons('challenge-meaning-options', 'analyze');
    renderChallengeChoiceButtons('challenge-syntax-options', 'create');
    syncChallengeResponseSummary(state);

    setChallengeTaskComplete('listen', !!state.tasks.listen);
    setChallengeTaskComplete('analyze', !!state.tasks.analyze);
    setChallengeTaskComplete('create', !!state.tasks.create);
    const feedbackText = String(_el('challenge-live-feedback')?.textContent || '').trim();
    if (!feedbackText) {
      setChallengeFeedback(getChallengeInstructionText(state), 'default');
    }
    updateChallengeProgressUI();
    syncChallengePacingTimer(state);
  }

  function buildRevealChallengeState(result, options = {}) {
    if (!result?.word) return null;
    const challenge = buildThinkingChallenge(result, {
      level: options.level
    });
    if (!challenge) return null;
    const word = String(result.word || '').trim().toUpperCase();
    const state = {
      attemptId: createMissionAttemptId(),
      result,
      word,
      topic: getChallengeTopicLabel(result),
      grade: getChallengeGradeLabel(result),
      source: String(options.source || 'reveal').trim() || 'reveal',
      challenge,
      tasks: { listen: false, analyze: false, create: false },
      activeTask: CHALLENGE_TASK_FLOW[0],
      responses: { analyze: '', create: '' },
      deepDive: buildDeepDiveState(result),
      pacing: { task: CHALLENGE_TASK_FLOW[0], startedAt: Date.now(), nudged: false },
      score: { clarity: 0, evidence: 0, vocabulary: 0, total: 0 },
      completedAt: 0
    };
    syncChallengeResponseSummary(state);
    return state;
  }

  function syncRevealChallengeLaunch(result) {
    const wrap = _el('modal-challenge-launch');
    const meta = _el('modal-challenge-launch-meta');
    const helper = _el('modal-challenge-launch-helper');
    if (!wrap || !meta) return;
    // Keep Deep Dive detached from core WordQuest reveal flow.
    if (!isMissionLabEnabled() || !isMissionLabStandaloneMode()) {
      revealChallengeState = null;
      meta.textContent = '';
      if (helper) helper.textContent = '';
      wrap.classList.add('hidden');
      clearChallengeSprintTimer();
      updateChallengeProgressUI();
      return;
    }
    const next = buildRevealChallengeState(result);
    revealChallengeState = next;
    if (!next) {
      meta.textContent = '';
      if (helper) helper.textContent = '';
      wrap.classList.add('hidden');
      clearChallengeSprintTimer();
      updateChallengeProgressUI();
      return;
    }
    meta.textContent = `${next.topic} · Grade ${next.grade} · 3 steps`;
    if (helper) {
      helper.textContent = 'Optional extension: finish 3 steps in order. You can also launch from Activities > Deep Dive.';
    }
    wrap.classList.remove('hidden');
    setChallengeFeedback('');
    updateChallengeProgressUI();
  }

  function getChallengeModalFocusableElements() {
    const modal = _el('challenge-modal');
    if (!modal || modal.classList.contains('hidden')) return [];
    return Array.from(
      modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    )
      .filter((node) => node instanceof HTMLElement)
      .filter((node) => node.getAttribute('aria-hidden') !== 'true')
      .filter((node) => node.getClientRects().length > 0);
  }

  function focusChallengeModalStart() {
    const closeBtn = _el('challenge-modal-close');
    const focusTarget = closeBtn || getChallengeModalFocusableElements()[0] || null;
    if (!focusTarget || typeof focusTarget.focus !== 'function') return;
    try {
      focusTarget.focus({ preventScroll: true });
    } catch {
      focusTarget.focus();
    }
  }

  function trapChallengeModalTab(event) {
    const focusables = getChallengeModalFocusableElements();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const currentIndex = focusables.indexOf(active);
    if (event.shiftKey) {
      if (currentIndex <= 0) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (currentIndex === -1 || currentIndex >= focusables.length - 1) {
      event.preventDefault();
      first.focus();
    }
  }

  function openRevealChallengeModal() {
    if (!isMissionLabEnabled()) return;
    if (!revealChallengeState) {
      if (isMissionLabStandaloneMode()) {
        startStandaloneMissionLab();
        return;
      }
      WQUI.showToast('Solve a word first to unlock Deep Dive Quest.');
      return;
    }
    const activeElement = document.activeElement;
    challengeModalReturnFocusEl = activeElement instanceof HTMLElement && activeElement !== document.body
      ? activeElement
      : null;
    hideInformantHintCard();
    renderRevealChallengeModal();
    _el('challenge-modal')?.classList.remove('hidden');
    syncChallengeQuickstartCard(revealChallengeState);
    focusChallengeModalStart();
    emitTelemetry('wq_deep_dive_open', {
      source: revealChallengeState?.source || 'reveal'
    });
    emitTelemetry('wq_funnel_deep_dive_started', {
      source: revealChallengeState?.source || 'reveal',
      word_id: normalizeReviewWord(revealChallengeState?.word),
      level: revealChallengeState?.challenge?.level || ''
    });
  }

  function closeRevealChallengeModal(options = {}) {
    clearChallengeSprintTimer();
    const modal = _el('challenge-modal');
    const wasOpen = !!modal && !modal.classList.contains('hidden');
    modal?.classList.add('hidden');
    _el('challenge-quickstart')?.classList.add('hidden');
    const returnFocusEl = challengeModalReturnFocusEl;
    challengeModalReturnFocusEl = null;
    if (wasOpen && options.restoreFocus !== false && returnFocusEl && document.contains(returnFocusEl)) {
      if (typeof returnFocusEl.focus === 'function') {
        try {
          returnFocusEl.focus({ preventScroll: true });
        } catch {
          returnFocusEl.focus();
        }
      }
    }
    if (!options.preserveFeedback) setChallengeFeedback('');
  }

  function persistRevealChallengeRecord(record) {
    if (!record || typeof record !== 'object') return false;
    try {
      const prior = JSON.parse(localStorage.getItem(CHALLENGE_REFLECTION_KEY) || '[]');
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
      localStorage.setItem(CHALLENGE_REFLECTION_KEY, JSON.stringify(rows.slice(0, 80)));
      return true;
    } catch {
      return false;
    }
  }

  function saveRevealChallengeResponses(options = {}) {
    if (!revealChallengeState) return false;
    const requireProgress = options.requireText !== false;
    const silent = !!options.silent;
    syncChallengeResponseSummary(revealChallengeState);
    const analyzeText = String(revealChallengeState.responses.analyze || '').trim();
    const createText = String(revealChallengeState.responses.create || '').trim();
    const doneCount = getChallengeDoneCount(revealChallengeState);
    if (requireProgress && doneCount <= 0) {
      setChallengeFeedback('Complete at least one step before saving.', 'warn');
      return false;
    }
    const score = computeChallengeScore(revealChallengeState);
    const scoreBand = resolveMissionScoreBand(score.total);
    const saveTs = Date.now();
    const completedAt = Math.max(0, Number(revealChallengeState.completedAt) || 0);
    const completed = completedAt > 0 || doneCount >= 3;
    const completionTs = completedAt || saveTs;
    const onTime = completed;
    const secondsLeft = 0;
    const record = {
      attemptId: String(revealChallengeState.attemptId || ''),
      source: String(revealChallengeState.source || 'reveal').trim() || 'reveal',
      deepDiveVersion: '1.1.0',
      deepDiveSchemaVersion: 1,
      student: getActiveStudentLabel(),
      ts: completionTs,
      word: revealChallengeState.word,
      topic: revealChallengeState.topic,
      grade: revealChallengeState.grade,
      level: revealChallengeState.challenge.level,
      score: score.total,
      scoreBand,
      clarity: score.clarity,
      evidence: score.evidence,
      vocabulary: score.vocabulary,
      completed,
      onTime,
      secondsLeft,
      analyze: analyzeText,
      create: createText,
      tasks: { ...revealChallengeState.tasks },
      taskOutcomes: CHALLENGE_TASK_FLOW.map((task) => ({
        task,
        complete: !!revealChallengeState.tasks?.[task],
        attempts: Math.max(0, Number(revealChallengeState.deepDive?.attempts?.[task]) || 0)
      }))
    };
    persistRevealChallengeRecord(record);
    saveChallengeDraft(revealChallengeState);
    renderSessionSummary();
    if (!silent) setChallengeFeedback('Deep Dive saved on this device.', 'good');
    return true;
  }

  function finishRevealChallenge() {
    if (!revealChallengeState) return;
    if (revealChallengeState.completedAt) return;
    const doneCount = getChallengeDoneCount(revealChallengeState);
    if (doneCount < 3) {
      setChallengeFeedback('Finish all 3 steps first.', 'warn');
      return;
    }
    const finishBtn = _el('challenge-finish-btn');
    if (finishBtn) finishBtn.disabled = true;
    revealChallengeState.completedAt = Date.now();
    saveRevealChallengeResponses({ requireText: false, silent: true });
    const score = computeChallengeScore(revealChallengeState);
    const pointsEarned = Math.max(8, Math.round(score.total / 10) + (doneCount * 3));
    const progress = loadChallengeProgress();
    progress.points += pointsEarned;
    const today = localDayKey();
    if (progress.lastWinDay !== today) {
      progress.streak = isConsecutiveDay(progress.lastWinDay, today) ? progress.streak + 1 : 1;
      progress.lastWinDay = today;
    }
    saveChallengeProgress(progress);
    const rank = resolveChallengeRank(progress.points);
    const line = pickRandom(CHALLENGE_COMPLETE_LINES) || 'Deep Dive complete.';
    setChallengeFeedback(`${line} +${pointsEarned} points · Rank ${rank.label}.`, 'good');
    emitTelemetry('wq_deep_dive_complete', {
      source: revealChallengeState?.source || 'reveal',
      word_id: normalizeReviewWord(revealChallengeState?.word),
      level: revealChallengeState?.challenge?.level || '',
      done_count: doneCount,
      completion_rate: Number((doneCount / 3).toFixed(2)),
      score: Number(score.total) || 0,
      score_total: Number(score.total) || 0,
      points_earned: pointsEarned,
      rank: rank?.label || ''
    });
    emitTelemetry('wq_funnel_deep_dive_completed', {
      source: revealChallengeState?.source || 'reveal',
      word_id: normalizeReviewWord(revealChallengeState?.word),
      level: revealChallengeState?.challenge?.level || '',
      completion_rate: Number((doneCount / 3).toFixed(2))
    });
    clearChallengeDraft(revealChallengeState);
    renderSessionSummary();
    setTimeout(() => {
      closeRevealChallengeModal({ silent: true });
    }, 900);
  }

  deepDiveCoreFeature?.publishBridge?.();
  deepDiveCoreFeature?.bindEvents?.();

  const PHONICS_CLUE_DECKS_URL = './data/taboo-phonics-starter-decks.json';
  const PHONICS_CLUE_DECK_OPTIONS = Object.freeze([
    Object.freeze({ id: 'taboo_phonics_k_1_starter_30', label: 'K-1 Starter (30 cards)' }),
    Object.freeze({ id: 'taboo_phonics_g2_3_starter_30', label: 'G2-3 Starter (30 cards)' }),
    Object.freeze({ id: 'taboo_phonics_g4_5_starter_30', label: 'G4-5 Starter (30 cards)' })
  ]);
  const PHONICS_CLUE_CONTEXT_LABELS = Object.freeze({
    solo: 'Solo',
    intervention: '1:1',
    small_group: 'Group'
  });
  const PHONICS_CLUE_CONTEXT_NOTES = Object.freeze({
    solo: 'Solo mode: read clues out loud to yourself, guess, then bank one bonus action before moving on.',
    intervention: '1:1 mode: alternate clue-giver each card. Keep one quick bonus check for intervention progress.',
    small_group: 'Small-group mode: rotate clue giver, guesser, speller, and checker every card.'
  });
  const PHONICS_CLUE_BONUS_PROMPTS = Object.freeze({
    spell: 'Bonus prompt: spell the target word.',
    segment: 'Bonus prompt: segment the word into sounds or chunks.',
    sentence: 'Bonus prompt: use the word in a full sentence.',
    meaning: 'Bonus prompt: explain the meaning in your own words.'
  });
  const PHONICS_CLUE_TIMER_OPTIONS = new Set(['off', '45', '60', '75', '90']);

  var phonicsClueDeckMap = Object.create(null);
  var phonicsClueDeckPromise = null;
  const phonicsClueState = {
    deckId: 'taboo_phonics_g2_3_starter_30',
    context: 'solo',
    timer: '60',
    bonus: 'spell',
    cards: [],
    index: -1,
    current: null,
    started: false,
    targetHidden: false,
    guessAwarded: false,
    bonusAwarded: false,
    guessPoints: 0,
    bonusPoints: 0,
    turnTimerId: 0,
    turnEndsAt: 0,
    turnSecondsLeft: 0
  };

  function normalizePhonicsClueDeckId(value, fallback = 'taboo_phonics_g2_3_starter_30') {
    const normalized = String(value || '').trim();
    const allowed = PHONICS_CLUE_DECK_OPTIONS.find((deck) => deck.id === normalized);
    if (allowed) return allowed.id;
    return fallback;
  }

  function normalizePhonicsClueContext(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(PHONICS_CLUE_CONTEXT_NOTES, normalized)
      ? normalized
      : 'solo';
  }

  function normalizePhonicsClueBonus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(PHONICS_CLUE_BONUS_PROMPTS, normalized)
      ? normalized
      : 'spell';
  }

  function normalizePhonicsClueTimer(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (PHONICS_CLUE_TIMER_OPTIONS.has(normalized)) return normalized;
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return 'off';
    if (seconds <= 45) return '45';
    if (seconds <= 60) return '60';
    if (seconds <= 75) return '75';
    return '90';
  }

  function normalizePhonicsClueCard(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    const targetWord = String(raw.target_word || '').trim().toLowerCase();
    if (!targetWord) return null;
    let tabooWords = Array.isArray(raw.taboo_words)
      ? raw.taboo_words
      : [raw.taboo_1, raw.taboo_2, raw.taboo_3];
    tabooWords = tabooWords
      .map((word) => String(word || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    while (tabooWords.length < 3) tabooWords.push('—');
    return Object.freeze({
      id: Math.max(1, Number(raw.id) || index + 1),
      deckId: normalizePhonicsClueDeckId(String(raw.deck_id || '').trim(), ''),
      gradeBand: String(raw.grade_band || '').trim(),
      targetWord,
      markedWord: String(raw.marked_word || targetWord).trim() || targetWord,
      tabooWords: Object.freeze([...tabooWords]),
      definition: String(raw.definition || '').trim(),
      exampleSentence: String(raw.example_sentence || '').trim()
    });
  }

  function shufflePhonicsClueCards(cards) {
    const next = Array.isArray(cards) ? [...cards] : [];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function clearPhonicsClueTurnTimer() {
    if (phonicsClueState.turnTimerId) {
      clearInterval(phonicsClueState.turnTimerId);
      phonicsClueState.turnTimerId = 0;
    }
    phonicsClueState.turnEndsAt = 0;
    phonicsClueState.turnSecondsLeft = 0;
  }

  function resolvePhonicsClueTurnSeconds() {
    if (phonicsClueState.timer === 'off') return 0;
    return Math.max(0, Number.parseInt(phonicsClueState.timer, 10) || 0);
  }

  function isPhonicsClueTurnExpired() {
    const timerSeconds = resolvePhonicsClueTurnSeconds();
    if (timerSeconds <= 0) return false;
    if (!phonicsClueState.started || !phonicsClueState.current) return false;
    return phonicsClueState.turnSecondsLeft <= 0;
  }

  function syncPhonicsClueTimerChip() {
    const chip = _el('phonics-clue-timer-chip');
    if (!chip) return;
    if (!phonicsClueState.started || !phonicsClueState.current) {
      chip.textContent = 'Timer: --';
      return;
    }
    const timerSeconds = resolvePhonicsClueTurnSeconds();
    if (timerSeconds <= 0) {
      chip.textContent = 'Timer: Off';
      return;
    }
    const left = Math.max(0, Number(phonicsClueState.turnSecondsLeft) || 0);
    chip.textContent = left > 0 ? `Timer: ${left}s` : 'Timer: Time up';
  }

  function syncPhonicsClueActionButtons() {
    const startBtn = _el('phonics-clue-start-btn');
    const guessBtn = _el('phonics-clue-guess-btn');
    const bonusBtn = _el('phonics-clue-bonus-btn');
    const nextBtn = _el('phonics-clue-next-btn');
    const skipBtn = _el('phonics-clue-skip-btn');
    const hideBtn = _el('phonics-clue-hide-btn');
    if (startBtn) {
      startBtn.textContent = phonicsClueState.started ? 'Restart Deck' : 'Start Deck';
    }
    const activeCard = Boolean(phonicsClueState.started && phonicsClueState.current);
    const expired = isPhonicsClueTurnExpired();
    if (guessBtn) guessBtn.disabled = !activeCard || phonicsClueState.guessAwarded || expired;
    if (bonusBtn) bonusBtn.disabled = !activeCard || phonicsClueState.bonusAwarded || expired;
    if (nextBtn) nextBtn.disabled = !activeCard;
    if (skipBtn) skipBtn.disabled = !activeCard;
    if (hideBtn) {
      hideBtn.disabled = !activeCard;
      hideBtn.textContent = phonicsClueState.targetHidden ? 'Show Target' : 'Hide Target';
      hideBtn.setAttribute('aria-pressed', phonicsClueState.targetHidden ? 'true' : 'false');
    }
  }

  function applyPhonicsClueTargetVisibility() {
    const targetEl = _el('phonics-clue-target-word');
    if (!targetEl) return;
    targetEl.classList.toggle('is-hidden', !!phonicsClueState.targetHidden);
  }

  function renderPhonicsCluePanel() {
    const cardChip = _el('phonics-clue-card-chip');
    const scoreChip = _el('phonics-clue-score-chip');
    const bonusChip = _el('phonics-clue-bonus-chip');
    const contextChip = _el('phonics-clue-context-chip');
    const targetWordEl = _el('phonics-clue-target-word');
    const markedWordEl = _el('phonics-clue-marked-word');
    const tabooListEl = _el('phonics-clue-taboo-list');
    const defEl = _el('phonics-clue-definition');
    const exampleEl = _el('phonics-clue-example');
    const bonusPromptEl = _el('phonics-clue-bonus-prompt');
    const contextNoteEl = _el('phonics-clue-context-note');

    if (cardChip) {
      if (phonicsClueState.started && phonicsClueState.current) {
        cardChip.textContent = `Card: ${phonicsClueState.index + 1}/${phonicsClueState.cards.length}`;
      } else if (phonicsClueState.started && !phonicsClueState.current) {
        cardChip.textContent = `Card: ${phonicsClueState.cards.length}/${phonicsClueState.cards.length} complete`;
      } else {
        cardChip.textContent = 'Card: --';
      }
    }
    if (scoreChip) scoreChip.textContent = `Guess points: ${phonicsClueState.guessPoints}`;
    if (bonusChip) bonusChip.textContent = `Bonus points: ${phonicsClueState.bonusPoints}`;
    if (contextChip) {
      contextChip.textContent = PHONICS_CLUE_CONTEXT_LABELS[phonicsClueState.context] || 'Solo';
    }
    if (bonusPromptEl) {
      bonusPromptEl.textContent = PHONICS_CLUE_BONUS_PROMPTS[phonicsClueState.bonus] || PHONICS_CLUE_BONUS_PROMPTS.spell;
    }
    if (contextNoteEl) {
      contextNoteEl.textContent = PHONICS_CLUE_CONTEXT_NOTES[phonicsClueState.context] || PHONICS_CLUE_CONTEXT_NOTES.solo;
    }

    const current = phonicsClueState.current;
    if (!current) {
      if (targetWordEl) targetWordEl.textContent = 'Start a round to reveal the first card.';
      if (markedWordEl) markedWordEl.textContent = 'Marked: —';
      if (tabooListEl) tabooListEl.innerHTML = '<li>—</li><li>—</li><li>—</li>';
      if (defEl) defEl.textContent = 'Definition: —';
      if (exampleEl) exampleEl.textContent = 'Example: —';
      phonicsClueState.targetHidden = false;
      applyPhonicsClueTargetVisibility();
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
      return;
    }

    if (targetWordEl) targetWordEl.textContent = current.targetWord.toUpperCase();
    if (markedWordEl) markedWordEl.textContent = `Marked: ${current.markedWord}`;
    if (tabooListEl) {
      tabooListEl.innerHTML = '';
      current.tabooWords.forEach((tabooWord) => {
        const li = document.createElement('li');
        li.textContent = tabooWord;
        tabooListEl.appendChild(li);
      });
    }
    if (defEl) defEl.textContent = `Definition: ${current.definition || '—'}`;
    if (exampleEl) exampleEl.textContent = `Example: ${current.exampleSentence || '—'}`;
    applyPhonicsClueTargetVisibility();
    syncPhonicsClueTimerChip();
    syncPhonicsClueActionButtons();
  }

  function syncPhonicsClueDeckSelect() {
    const select = _el('phonics-clue-deck-select');
    if (!select) return;
    const preferred = normalizePhonicsClueDeckId(select.value || phonicsClueState.deckId);
    select.innerHTML = '';
    PHONICS_CLUE_DECK_OPTIONS.forEach((deck) => {
      const count = Array.isArray(phonicsClueDeckMap[deck.id]) ? phonicsClueDeckMap[deck.id].length : 0;
      const option = document.createElement('option');
      option.value = deck.id;
      option.textContent = count > 0 ? deck.label : `${deck.label} (unavailable)`;
      option.disabled = count <= 0;
      select.appendChild(option);
    });
    let nextDeck = preferred;
    if (!Array.isArray(phonicsClueDeckMap[nextDeck]) || phonicsClueDeckMap[nextDeck].length <= 0) {
      const fallback = PHONICS_CLUE_DECK_OPTIONS.find(
        (deck) => Array.isArray(phonicsClueDeckMap[deck.id]) && phonicsClueDeckMap[deck.id].length > 0
      );
      nextDeck = fallback?.id || preferred;
    }
    select.value = nextDeck;
    phonicsClueState.deckId = nextDeck;
  }

  function updatePhonicsClueControlsFromUI() {
    phonicsClueState.deckId = normalizePhonicsClueDeckId(
      _el('phonics-clue-deck-select')?.value || phonicsClueState.deckId
    );
    phonicsClueState.context = normalizePhonicsClueContext(
      _el('phonics-clue-context-select')?.value || phonicsClueState.context
    );
    phonicsClueState.timer = normalizePhonicsClueTimer(
      _el('phonics-clue-timer-select')?.value || phonicsClueState.timer
    );
    phonicsClueState.bonus = normalizePhonicsClueBonus(
      _el('phonics-clue-bonus-select')?.value || phonicsClueState.bonus
    );
    const deckSelect = _el('phonics-clue-deck-select');
    if (deckSelect) deckSelect.value = phonicsClueState.deckId;
    const contextSelect = _el('phonics-clue-context-select');
    if (contextSelect) contextSelect.value = phonicsClueState.context;
    const timerSelect = _el('phonics-clue-timer-select');
    if (timerSelect) timerSelect.value = phonicsClueState.timer;
    const bonusSelect = _el('phonics-clue-bonus-select');
    if (bonusSelect) bonusSelect.value = phonicsClueState.bonus;
  }

  async function ensurePhonicsClueDeckData() {
    if (Object.keys(phonicsClueDeckMap).length > 0) return phonicsClueDeckMap;
    if (phonicsClueDeckPromise) return phonicsClueDeckPromise;
    phonicsClueDeckPromise = (async () => {
      try {
        const response = await fetch(PHONICS_CLUE_DECKS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`deck fetch failed (${response.status})`);
        const rows = await response.json();
        const grouped = Object.create(null);
        if (Array.isArray(rows)) {
          rows.forEach((rawCard, index) => {
            const card = normalizePhonicsClueCard(rawCard, index);
            if (!card || !card.deckId) return;
            if (!grouped[card.deckId]) grouped[card.deckId] = [];
            grouped[card.deckId].push(card);
          });
        }
        PHONICS_CLUE_DECK_OPTIONS.forEach((deck) => {
          const cards = Array.isArray(grouped[deck.id]) ? grouped[deck.id] : [];
          if (cards.length) {
            phonicsClueDeckMap[deck.id] = cards;
          }
        });
      } catch (error) {
        console.warn('[WordQuest] Phonics Clue Sprint deck load failed:', error?.message || error);
      } finally {
        phonicsClueDeckPromise = null;
      }
      return phonicsClueDeckMap;
    })();
    return phonicsClueDeckPromise;
  }

  function startPhonicsClueTurnTimer() {
    clearPhonicsClueTurnTimer();
    const seconds = resolvePhonicsClueTurnSeconds();
    if (!phonicsClueState.started || !phonicsClueState.current || seconds <= 0) {
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
      return;
    }
    phonicsClueState.turnEndsAt = Date.now() + (seconds * 1000);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phonicsClueState.turnEndsAt - Date.now()) / 1000));
      phonicsClueState.turnSecondsLeft = remaining;
      if (remaining <= 0) {
        clearPhonicsClueTurnTimer();
        WQUI.showToast('Time is up. Move to the next card.');
      }
      syncPhonicsClueTimerChip();
      syncPhonicsClueActionButtons();
    };
    tick();
    phonicsClueState.turnTimerId = setInterval(tick, 250);
  }

  function setPhonicsClueCard(index) {
    phonicsClueState.index = index;
    phonicsClueState.current = phonicsClueState.cards[index] || null;
    phonicsClueState.targetHidden = false;
    phonicsClueState.guessAwarded = false;
    phonicsClueState.bonusAwarded = false;
  }

  async function startPhonicsClueDeck() {
    updatePhonicsClueControlsFromUI();
    await ensurePhonicsClueDeckData();
    syncPhonicsClueDeckSelect();
    const cards = Array.isArray(phonicsClueDeckMap[phonicsClueState.deckId])
      ? phonicsClueDeckMap[phonicsClueState.deckId]
      : [];
    if (!cards.length) {
      WQUI.showToast('Phonics Clue Sprint deck data is unavailable on this build.');
      renderPhonicsCluePanel();
      return false;
    }
    phonicsClueState.cards = shufflePhonicsClueCards(cards);
    phonicsClueState.started = true;
    phonicsClueState.guessPoints = 0;
    phonicsClueState.bonusPoints = 0;
    setPhonicsClueCard(0);
    startPhonicsClueTurnTimer();
    renderPhonicsCluePanel();
    return true;
  }

  function completePhonicsClueDeck() {
    clearPhonicsClueTurnTimer();
    phonicsClueState.started = false;
    phonicsClueState.current = null;
    phonicsClueState.index = phonicsClueState.cards.length - 1;
    renderPhonicsCluePanel();
    WQUI.showToast(
      `Round complete: ${phonicsClueState.guessPoints} guess points + ${phonicsClueState.bonusPoints} bonus points.`,
      3200
    );
  }

  function advancePhonicsClueCard() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    const nextIndex = phonicsClueState.index + 1;
    if (nextIndex >= phonicsClueState.cards.length) {
      completePhonicsClueDeck();
      return;
    }
    setPhonicsClueCard(nextIndex);
    startPhonicsClueTurnTimer();
    renderPhonicsCluePanel();
  }

  function skipPhonicsClueCard() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    WQUI.showToast('Card skipped.');
    advancePhonicsClueCard();
  }

  function awardPhonicsClueGuessPoint() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    if (isPhonicsClueTurnExpired()) {
      WQUI.showToast('Timer ended. Move to the next card.');
      return;
    }
    if (phonicsClueState.guessAwarded) {
      WQUI.showToast('Guess point already banked for this card.');
      return;
    }
    phonicsClueState.guessPoints += 1;
    phonicsClueState.guessAwarded = true;
    renderPhonicsCluePanel();
  }

  function awardPhonicsClueBonusPoint() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    if (isPhonicsClueTurnExpired()) {
      WQUI.showToast('Timer ended. Move to the next card.');
      return;
    }
    if (phonicsClueState.bonusAwarded) {
      WQUI.showToast('Bonus point already banked for this card.');
      return;
    }
    phonicsClueState.bonusPoints += 1;
    phonicsClueState.bonusAwarded = true;
    renderPhonicsCluePanel();
  }

  function togglePhonicsClueTargetVisibility() {
    if (!phonicsClueState.started || !phonicsClueState.current) return;
    phonicsClueState.targetHidden = !phonicsClueState.targetHidden;
    applyPhonicsClueTargetVisibility();
    syncPhonicsClueActionButtons();
  }

  async function openPhonicsClueModal() {
    _el('phonics-clue-modal')?.classList.remove('hidden');
    await ensurePhonicsClueDeckData();
    syncPhonicsClueDeckSelect();
    updatePhonicsClueControlsFromUI();
    if (phonicsClueState.started && phonicsClueState.current) {
      startPhonicsClueTurnTimer();
    }
    renderPhonicsCluePanel();
  }

  function closePhonicsClueModal() {
    _el('phonics-clue-modal')?.classList.add('hidden');
    clearPhonicsClueTurnTimer();
  }

  function showRevealWordToast(result) {
    if (!result) return;
    const solvedWord = String(result.word || '').trim().toUpperCase();
    if (!solvedWord) return;
    const feedback = getRevealFeedbackCopy(result);
    const lead = String(feedback?.lead || '').trim();
    const coach = String(feedback?.coach || '').trim();
    const shortDef = trimToastDefinition(result?.entry?.definition);
    const base = shortDef
      ? `${lead} ${solvedWord} - ${shortDef}`
      : `${lead} ${solvedWord}`;
    const message = coach ? `${base} ${coach}` : base;
    WQUI.showToast(message, 3600);
  }

  function shouldNarrateReveal() {
    const mode = normalizeVoiceMode(_el('s-voice')?.value || prefs.voice || DEFAULT_PREFS.voice);
    return mode !== 'off';
  }

  async function playMeaningWithFun(nextEntry) {
    if (!nextEntry) return;
    const meaning = getRevealMeaningPayload(nextEntry);
    if (!(meaning.definition || meaning.funAddOn)) return;

    if (WQAudio && typeof WQAudio.playMeaningBundle === 'function') {
      await WQAudio.playMeaningBundle(nextEntry, {
        includeFun: shouldIncludeFunInMeaning(),
        allowFallbackInRecorded: true,
        fallbackText: meaning.readAll
      });
      return;
    }

    await WQAudio.playDef(nextEntry);
    if (!meaning.funAddOn) return;
    await WQAudio.playFun(nextEntry);
  }

  function promptLearnerAfterReveal() {
    if (getVoicePracticeMode() === 'off') return;
    if (voiceTakeComplete || voiceIsRecording) return;
    const practiceDetails = _el('modal-practice-details');
    if (!practiceDetails || practiceDetails.classList.contains('hidden')) return;
    const required = getVoicePracticeMode() === 'required';
    if (required) practiceDetails.open = true;
    setVoicePracticeFeedback('Your turn: tap Record and compare with model audio.', required ? 'warn' : 'default');
  }

  async function runRevealNarration(result) {
    if (!result?.entry) return;
    cancelRevealNarration();
    const token = revealNarrationToken;
    const pacing = getRevealPacingPreset();
    syncRevealMeaningHighlight(result.entry);
    syncRevealChallengeLaunch(result);
    if (!shouldNarrateReveal()) {
      await waitMs(Math.min(220, pacing.postMeaningDelay));
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
      return;
    }
    await waitMs(pacing.introDelay);
    if (token !== revealNarrationToken) return;
    try {
      runKaraokeGuide(result.entry);
      await WQAudio.playWord(result.entry);
      if (token !== revealNarrationToken) return;
      await waitMs(pacing.betweenDelay);
      if (token !== revealNarrationToken) return;
      await playMeaningWithFun(result.entry);
      if (token !== revealNarrationToken) return;
      await waitMs(pacing.postMeaningDelay);
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
    } catch {
      if (token !== revealNarrationToken) return;
      promptLearnerAfterReveal();
    }
  }

  _el('g-hear-word')?.addEventListener('click', () => {
    cancelRevealNarration();
    void WQAudio.playWord(entry());
  });
  _el('g-hear-def')?.addEventListener('click', () => {
    cancelRevealNarration();
    void playMeaningWithFun(entry());
  });

  // Modal audio buttons
  _el('hear-word-btn')?.addEventListener('click', () => {
    cancelRevealNarration();
    void WQAudio.playWord(entry());
  });
  _el('hear-def-btn')?.addEventListener('click', () => {
    cancelRevealNarration();
    void playMeaningWithFun(entry());
  });
  _el('hear-sentence-btn')?.addEventListener('click', () => {
    cancelRevealNarration();
    void WQAudio.playSentence(entry());
  });


function initAudio() { /* wired in app.js */ }

export {
  initAudio,
  saveRevealChallengeResponses,
  handleChallengeChoiceSelection,
  startPhonicsClueDeck,
  awardPhonicsClueGuessPoint,
  awardPhonicsClueBonusPoint,
  advancePhonicsClueCard,
  skipPhonicsClueCard,
  togglePhonicsClueTargetVisibility,
  startStandaloneMissionLab,
  refreshStandaloneMissionLabHub,
  closePhonicsClueModal,
  openRevealChallengeModal,
  closeRevealChallengeModal,
  buildDeepDiveState,
  getFirstIncompleteChallengeTask,
  setChallengeActiveTask,
  getChallengeInstructionText,
  syncChallengeActionButtons,
  updateChallengeStationUI,
  renderChallengeChoiceButtons,
  computeChallengeScore,
  updateChallengeScoreUI,
  getChallengeChoice,
  syncChallengeResponseSummary,
  syncChallengePacingTimer,
  getChallengeLevelDisplay,
  resolveMissionScoreBand,
  getChallengeScaffoldProfile,
  buildChallengeQuickstartCopy,
  loadChallengeProgress,
  saveChallengeProgress,
  resolveChallengeRank,
  showRevealWordToast,
  runRevealNarration,
  renderPhonicsCluePanel,
  updatePhonicsClueControlsFromUI,
  cancelRevealNarration
};
