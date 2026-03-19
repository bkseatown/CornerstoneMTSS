/**
 * app-game.js
 * Game state, round tracking, error coaching, Deep Dive challenges
 */

import { prefs, setPref, normalizeMasterySort, normalizeMasteryFilter, emitTelemetry } from './app-prefs.js';
import { DEFAULT_PREFS, MISSION_LAB_ENABLED, TEACHER_ASSIGNMENTS_CONTRACT, DEMO_MODE, DEMO_TARGET_WORD, FEATURES, MIDGAME_BOOST_ENABLED } from './app-constants.js';
import {
  CURRICULUM_PACK_ORDER,
  normalizeLessonPackId,
  normalizeLessonTargetId,
  getLessonPackDefinition,
  getLessonTarget,
  getCurriculumTargetsForGrade,
  getQuestFilterGradeBand,
  updateFocusSummaryLabel
} from './app-focus.js';
import { isAssessmentRoundLocked, hideStarterWordCard } from './app-theme.js';
import { stopAvaWordQuestIdleWatcher, stopVoiceCaptureNow, clearClassroomTurnTimer } from './app-settings.js';
import { stopDemoToastProgress } from './app-prefs.js';

// DOM helper
const _el = id => document.getElementById(id);

  // ─── 7. New game ────────────────────────────────────
  const MIDGAME_BOOST_KEY = 'wq_v2_midgame_boost_state_v1';
  const MIDGAME_BOOST_TRIGGER_GUESS = 3;
  const MIDGAME_BOOST_FALLBACK = Object.freeze([
    Object.freeze({ type: 'fact', text: 'Your brain gets stronger when you keep trying.' }),
    Object.freeze({ type: 'joke', text: 'What is a spelling bee\'s favorite snack? Letter chips.' }),
    Object.freeze({ type: 'quote', text: 'Progress is built one guess at a time.' }),
    Object.freeze({ type: 'fact', text: 'Guess three is where pattern recognition usually clicks.' }),
    Object.freeze({ type: 'joke', text: 'Why did the clue smile? It knew you would solve it.' }),
    Object.freeze({ type: 'quote', text: 'Effort now becomes confidence later.' })
  ]);
  const MIDGAME_BOOST_POOL = (() => {
    const raw = Array.isArray(window.WQ_ENGAGEMENT_BOOSTS) ? window.WQ_ENGAGEMENT_BOOSTS : [];
    const cleaned = raw
      .map((item) => ({
        type: String(item?.type || 'fact').toLowerCase(),
        text: String(item?.text || '').trim()
      }))
      .filter((item) => item.text.length > 0)
      .map((item) => ({
        type: ['joke', 'fact', 'quote'].includes(item.type) ? item.type : 'fact',
        text: item.text
      }));

    if (!cleaned.length) return MIDGAME_BOOST_FALLBACK;
    return Object.freeze(cleaned.map((item) => Object.freeze(item)));
  })();
  var midgameBoostShown = false;
  var midgameBoostAutoHideTimer = 0;

  function clearMidgameBoostAutoHideTimer() {
    if (!midgameBoostAutoHideTimer) return;
    clearTimeout(midgameBoostAutoHideTimer);
    midgameBoostAutoHideTimer = 0;
  }

  function buildMidgameBoostState() {
    const order = Array.from({ length: MIDGAME_BOOST_POOL.length }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { order, cursor: 0 };
  }

  function loadMidgameBoostState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(MIDGAME_BOOST_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.order) || !Number.isInteger(parsed.cursor)) {
        return buildMidgameBoostState();
      }
      const validOrder = parsed.order.every(
        (value) => Number.isInteger(value) && value >= 0 && value < MIDGAME_BOOST_POOL.length
      );
      if (!validOrder || parsed.order.length !== MIDGAME_BOOST_POOL.length) {
        return buildMidgameBoostState();
      }
      return parsed;
    } catch {
      return buildMidgameBoostState();
    }
  }

  function saveMidgameBoostState(state) {
    try {
      localStorage.setItem(MIDGAME_BOOST_KEY, JSON.stringify(state));
    } catch {}
  }

  function nextMidgameBoostCard() {
    let state = loadMidgameBoostState();
    if (state.cursor >= state.order.length) {
      state = buildMidgameBoostState();
    }
    const idx = state.order[state.cursor];
    state.cursor += 1;
    saveMidgameBoostState(state);
    return MIDGAME_BOOST_POOL[idx] || null;
  }

  function hideMidgameBoost() {
    const boost = _el('midgame-boost');
    if (!boost) return;
    clearMidgameBoostAutoHideTimer();
    boost.classList.remove('is-visible');
    if (!boost.classList.contains('hidden')) {
      setTimeout(() => {
        boost.classList.add('hidden');
        boost.innerHTML = '';
      }, 180);
    }
  }

  function splitBoostQuestionAndAnswer(type, text) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return { question: '', answer: '' };
    if (type !== 'joke') return { question: cleaned, answer: '' };
    const questionEnd = cleaned.indexOf('?');
    if (questionEnd > -1 && questionEnd < cleaned.length - 1) {
      return {
        question: cleaned.slice(0, questionEnd + 1).trim(),
        answer: cleaned.slice(questionEnd + 1).trim().replace(/^[\-–—:]+\s*/, '')
      };
    }
    return { question: cleaned, answer: '' };
  }

  function shouldKeepMidgameBoostOpen(target) {
    const node = target instanceof Element ? target : null;
    if (!node) return false;
    return Boolean(
      node.closest(
        '#keyboard, #game-board, .board-plate, .gameplay-audio, #new-game-btn, #focus-inline-wrap, #settings-btn'
      )
    );
  }

  function showMidgameBoost() {
    if (!MIDGAME_BOOST_ENABLED) return;
    if (!areBoostPopupsEnabled()) return;
    if (isAssessmentRoundLocked()) return;
    const boost = _el('midgame-boost');
    if (!boost) return;
    clearMidgameBoostAutoHideTimer();
    const card = nextMidgameBoostCard();
    if (!card) return;
    const content = splitBoostQuestionAndAnswer(card.type, card.text);
    const isQnA = (card.type === 'joke' || card.type === 'riddle') && Boolean(content.answer);
    const isRiddle = isQnA && content.question.includes('?');
    const hasAnswer = isQnA;
    const label =
      card.type === 'quote'
        ? '💡 Coach Tip'
        : card.type === 'joke'
          ? (isRiddle ? '🧩 Riddle' : '😄 Joke')
          : '🕵️ Fun Fact';
    const mascot =
      card.type === 'quote'
        ? '🧠'
        : card.type === 'joke'
          ? (isRiddle ? '🕵️' : '😄')
          : '🛰️';
    boost.innerHTML = `
      <div class="midgame-boost-bubble">
        <span class="midgame-boost-mascot" aria-hidden="true">${mascot}</span>
        <span class="midgame-boost-tag">${label}</span>
        <p class="midgame-boost-question">${escapeHtml(content.question)}</p>
        ${hasAnswer ? '<button type="button" class="midgame-boost-answer-btn">Reveal answer</button><p class="midgame-boost-answer hidden"></p>' : ''}
        <div class="midgame-boost-actions">
          <span class="midgame-boost-round-note">Visible for this round.</span>
          <button type="button" class="midgame-boost-action midgame-boost-turn-off">Turn off round cards</button>
        </div>
      </div>
    `;
    const answerEl = boost.querySelector('.midgame-boost-answer');
    const answerBtn = boost.querySelector('.midgame-boost-answer-btn');
    if (answerEl) answerEl.textContent = content.answer;
    answerBtn?.addEventListener('click', () => {
      if (!answerEl) return;
      const reveal = answerEl.classList.contains('hidden');
      answerEl.classList.toggle('hidden', !reveal);
      answerBtn.textContent = reveal ? 'Hide answer' : 'Reveal answer';
    });
    boost.querySelector('.midgame-boost-turn-off')?.addEventListener('click', () => {
      const select = _el('s-boost-popups');
      if (select) select.value = 'off';
      setPref('boostPopups', 'off');
      hideMidgameBoost();
      WQUI.showToast('Round cards are off. Turn them back on in Settings.');
    });
    boost.classList.remove('hidden');
    requestAnimationFrame(() => boost.classList.add('is-visible'));
  }

  const ERROR_PATTERN_LABELS = Object.freeze({
    vowel_pattern: 'Vowel Pattern',
    blend_position: 'Blend Position',
    morpheme_ending: 'Morpheme Ending',
    context_strategy: 'Clue Strategy'
  });

  const ERROR_COACH_COPY = Object.freeze({
    vowel_pattern: 'Coach: check the vowel pattern first (short, team, or r-controlled).',
    blend_position: 'Coach: you have useful letters; adjust their positions and blends.',
    morpheme_ending: 'Coach: re-check the ending chunk (-ed, -ing, suffixes).',
    context_strategy: 'Coach: use the sentence clue to narrow meaning and part of speech.'
  });

  const ERROR_NEXT_STEP_COPY = Object.freeze({
    vowel_pattern: 'Re-teach vowel pattern contrast (short vs team vs r-controlled) with 6-word sorts.',
    blend_position: 'Run onset/rime blend mapping and left-to-right tracking with 5 guided words.',
    morpheme_ending: 'Practice suffix-ending checks (-ed/-ing/-s) with chunk tap + dictation.',
    context_strategy: 'Model clue-to-meaning strategy: identify part of speech, then confirm spelling.'
  });

  const ERROR_MINI_LESSON_PLANS = Object.freeze({
    vowel_pattern: Object.freeze([
      '1. Warm-up (1 min): sort 6 words by vowel pattern (short, team, r-controlled).',
      '2. Guided practice (3 min): read and spell 4 target words; underline vowel chunk.',
      '3. Transfer (1 min): use one target word in a spoken sentence clue.'
    ]),
    blend_position: Object.freeze([
      '1. Warm-up (1 min): tap onset and rime on 5 words.',
      '2. Guided practice (3 min): map 4 words left-to-right and correct blend placement.',
      '3. Transfer (1 min): timed readback with one self-correction.'
    ]),
    morpheme_ending: Object.freeze([
      '1. Warm-up (1 min): quick sort by ending (-ed, -ing, -s, suffix).',
      '2. Guided practice (3 min): chunk and spell 4 words; circle ending morpheme.',
      '3. Transfer (1 min): dictate one word and explain ending choice.'
    ]),
    context_strategy: Object.freeze([
      '1. Warm-up (1 min): identify part of speech from clue sentence.',
      '2. Guided practice (3 min): predict 3 candidate words, then verify spelling.',
      '3. Transfer (1 min): student writes one new clue for a practiced word.'
    ])
  });

  function normalizeCounterMap(raw) {
    const map = Object.create(null);
    if (!raw || typeof raw !== 'object') return map;
    Object.entries(raw).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const count = Math.max(0, Math.floor(Number(value) || 0));
      if (!count) return;
      map[normalizedKey] = count;
    });
    return map;
  }

  function mergeCounterMaps(target, additions) {
    const base = target && typeof target === 'object' ? target : Object.create(null);
    if (!additions || typeof additions !== 'object') return base;
    Object.entries(additions).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const next = Math.max(0, Math.floor(Number(value) || 0));
      if (!next) return;
      base[normalizedKey] = (base[normalizedKey] || 0) + next;
    });
    return base;
  }

  function getTopErrorKey(errorCounts) {
    const entries = Object.entries(errorCounts || {});
    if (!entries.length) return '';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || '';
  }

  function getTopErrorLabel(errorCounts) {
    const key = getTopErrorKey(errorCounts);
    if (!key) return '--';
    return ERROR_PATTERN_LABELS[key] || key.replace(/_/g, ' ');
  }

  function getInstructionalNextStep(errorCounts) {
    const key = getTopErrorKey(errorCounts);
    if (!key) return 'Continue current lesson target.';
    return ERROR_NEXT_STEP_COPY[key] || 'Review recent errors and provide a targeted reteach.';
  }

  function getInstructionalNextStepChip(errorCounts) {
    const key = getTopErrorKey(errorCounts);
    switch (key) {
      case 'vowel_pattern': return 'Vowel Pattern Reteach';
      case 'blend_position': return 'Blend Position Reteach';
      case 'morpheme_ending': return 'Morpheme Ending Reteach';
      case 'context_strategy': return 'Clue Strategy Reteach';
      default: return 'Stay Current Target';
    }
  }

  function resolveMiniLessonErrorKey(rawKey, fallbackCounts = null) {
    const normalized = String(rawKey || '').trim().toLowerCase();
    if (normalized === 'top' || normalized === 'auto') {
      const top = getTopErrorKey(fallbackCounts || sessionSummary?.errorTotals || {});
      return top || 'context_strategy';
    }
    if (ERROR_MINI_LESSON_PLANS[normalized]) return normalized;
    return 'context_strategy';
  }

  function buildMiniLessonPlanText(errorKey, options = {}) {
    const resolved = resolveMiniLessonErrorKey(errorKey, options.errorCounts);
    const label = ERROR_PATTERN_LABELS[resolved] || resolved.replace(/_/g, ' ');
    const steps = ERROR_MINI_LESSON_PLANS[resolved] || ERROR_MINI_LESSON_PLANS.context_strategy;
    const snapshot = buildCurrentCurriculumSnapshot();
    const lessonTargetLabel = snapshot.targetLabel || snapshot.packLabel || buildCurriculumSelectionLabel();
    const student = options.student || getActiveStudentLabel();
    return [
      `WordQuest Quick Mini-Lesson · ${label}`,
      `Student: ${student}`,
      `Current target: ${lessonTargetLabel}`,
      'Duration: 5 minutes',
      '',
      ...steps,
      '',
      'Materials: whiteboard or paper, 4-6 word cards, quick verbal feedback.'
    ].join('\n');
  }

  function formatDurationLabel(durationMs) {
    const ms = Math.max(0, Number(durationMs) || 0);
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${String(rem).padStart(2, '0')}s`;
  }

  function getSkillDescriptorForRound(result) {
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') {
      return {
        key: `subject:${preset.subject}:${preset.gradeBand || 'all'}`,
        label: `${preset.subject.toUpperCase()} vocab (${formatGradeBandLabel(preset.gradeBand)})`
      };
    }
    if (preset.kind === 'phonics' && preset.focus && preset.focus !== 'all') {
      const label = getFocusLabel(preset.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
      return {
        key: `phonics:${preset.focus}`,
        label: label || 'Phonics focus'
      };
    }
    const phonics = String(result?.entry?.phonics || '').trim();
    if (phonics && phonics.toLowerCase() !== 'all') {
      return {
        key: `phonics-tag:${phonics.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: phonics
      };
    }
    return { key: 'classic:all', label: 'Classic mixed practice' };
  }

  function resetRoundTracking(nextResult = null) {
    if (nextResult?.word) {
      activeRoundStartedAt = Date.now();
      currentRoundHintRequested = false;
      currentRoundStarterWordsShown = false;
      currentRoundVoiceAttempts = 0;
      currentRoundErrorCounts = Object.create(null);
      const skill = getSkillDescriptorForRound(nextResult);
      currentRoundSkillKey = skill.key;
      currentRoundSkillLabel = skill.label;
      emitTelemetry('wq_round_start', {
        word_id: normalizeReviewWord(nextResult.word),
        word_length: Number(nextResult.wordLength) || String(nextResult.word || '').length || null,
        skill_key: currentRoundSkillKey,
        skill_label: currentRoundSkillLabel,
        source: 'new_game'
      });
      return;
    }
    activeRoundStartedAt = 0;
    currentRoundHintRequested = false;
    currentRoundStarterWordsShown = false;
    currentRoundVoiceAttempts = 0;
    currentRoundErrorCounts = Object.create(null);
    currentRoundSkillKey = 'classic:all';
    currentRoundSkillLabel = 'Classic mixed practice';
  }

  function buildRoundMetrics(result, maxGuessesValue) {
    const guessed = Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : Math.max(1, Number(maxGuessesValue) || 6));
    const durationMs = activeRoundStartedAt > 0 ? Math.max(0, Date.now() - activeRoundStartedAt) : 0;
    const fallbackSkill = getSkillDescriptorForRound(result);
    return {
      guessesUsed: guessed,
      durationMs,
      hintRequested: !!currentRoundHintRequested,
      voiceAttempts: Math.max(0, Number(currentRoundVoiceAttempts) || 0),
      skillKey: currentRoundSkillKey || fallbackSkill.key,
      skillLabel: currentRoundSkillLabel || fallbackSkill.label,
      errorCounts: normalizeCounterMap(currentRoundErrorCounts)
    };
  }

  function classifyRoundErrorPattern(result) {
    const guess = String(result?.guess || '').toLowerCase();
    const word = String(result?.word || '').toLowerCase();
    const statuses = Array.isArray(result?.result) ? result.result : [];
    if (!guess || !word || !statuses.length) return '';
    const correctCount = statuses.filter((state) => state === 'correct').length;
    const presentCount = statuses.filter((state) => state === 'present').length;
    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
    const targetVowels = Array.from(new Set(word.split('').filter((ch) => vowels.has(ch))));
    const guessedVowels = new Set(guess.split('').filter((ch) => vowels.has(ch)));
    const vowelOverlap = targetVowels.filter((ch) => guessedVowels.has(ch)).length;
    const phonicsTag = String(result?.entry?.phonics || '').toLowerCase();

    if (targetVowels.length >= 2 && vowelOverlap === 0) return 'vowel_pattern';
    if (presentCount >= 2 && correctCount <= 1) return 'blend_position';
    if ((/suffix|prefix|multisyll|welded/.test(phonicsTag) || word.length >= 6) && guess.slice(-2) !== word.slice(-2)) {
      return 'morpheme_ending';
    }
    return 'context_strategy';
  }

  function maybeShowErrorCoach(result) {
    if (!result || result.won || result.lost) return;
    if (!Array.isArray(result.guesses) || result.guesses.length < 2) return;
    const category = classifyRoundErrorPattern(result);
    if (!category) return;
    currentRoundErrorCounts[category] = (currentRoundErrorCounts[category] || 0) + 1;
  }

  function loadSessionSummaryState() {
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
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_SUMMARY_KEY) || 'null');
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
          errorCounts: normalizeCounterMap(row.errorCounts)
        };
      });
      return {
        rounds: Math.max(0, Math.floor(Number(parsed.rounds) || 0)),
        wins: Math.max(0, Math.floor(Number(parsed.wins) || 0)),
        hintRounds: Math.max(0, Math.floor(Number(parsed.hintRounds) || 0)),
        voiceAttempts: Math.max(0, Math.floor(Number(parsed.voiceAttempts) || 0)),
        totalGuesses: Math.max(0, Math.floor(Number(parsed.totalGuesses) || 0)),
        totalDurationMs: Math.max(0, Math.floor(Number(parsed.totalDurationMs) || 0)),
        errorTotals: normalizeCounterMap(parsed.errorTotals),
        masteryBySkill,
        startedAt: Math.max(0, Number(parsed.startedAt) || Date.now())
      };
    } catch {
      return fallback;
    }
  }

  function loadRosterState() {
    const fallback = { students: [], active: '' };
    try {
      const parsed = JSON.parse(localStorage.getItem(ROSTER_STATE_KEY) || 'null');
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
      const keys = [PROBE_HISTORY_KEY, ...PROBE_HISTORY_LEGACY_KEYS];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
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
      return parsed
        .map((row) => ({
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
        }))
        .slice(0, 24);
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
    const bounded = Math.max(1, Math.min(8, parsed));
    return Number(bounded.toFixed(1));
  }

  function normalizeGoalEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
      accuracyTarget: normalizeGoalAccuracy(raw.accuracyTarget),
      avgGuessesTarget: normalizeGoalGuesses(raw.avgGuessesTarget),
      updatedAt: Math.max(0, Number(raw.updatedAt) || Date.now())
    };
  }

  function loadStudentGoalState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STUDENT_GOALS_KEY) || '{}');
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
    const gradeBand = String(raw.gradeBand || '').trim() || SAFE_DEFAULT_GRADE_BAND;
    const length = String(raw.length || '').trim() || DEFAULT_PREFS.length;
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

  function loadPlaylistState() {
    const fallback = createEmptyPlaylistState();
    try {
      const parsed = JSON.parse(localStorage.getItem(PLAYLIST_STATE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const playlists = Array.isArray(parsed.playlists)
        ? parsed.playlists.map((entry) => normalizePlaylistEntry(entry)).filter(Boolean).slice(0, 40)
        : [];
      const assignmentRaw = parsed.assignments && typeof parsed.assignments === 'object'
        ? parsed.assignments
        : {};
      const assignments = Object.create(null);
      Object.entries(assignmentRaw).forEach(([assigneeKey, playlistId]) => {
        const key = String(assigneeKey || '').trim();
        const value = String(playlistId || '').trim();
        if (!key || !value) return;
        if (!playlists.some((entry) => entry.id === value)) return;
        assignments[key] = value;
      });
      const progressRaw = parsed.progress && typeof parsed.progress === 'object'
        ? parsed.progress
        : {};
      const progress = Object.create(null);
      Object.entries(progressRaw).forEach(([assigneeKey, index]) => {
        const key = String(assigneeKey || '').trim();
        if (!key) return;
        const playlistId = String(assignments[key] || '').trim();
        if (!playlistId) return;
        const playlist = playlists.find((entry) => entry.id === playlistId);
        const itemCount = Math.max(1, playlist?.items?.length || 1);
        const parsedIndex = Math.floor(Number(index) || 0);
        progress[key] = Math.max(0, parsedIndex % itemCount);
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

  function saveProbeHistory() {
    const payload = JSON.stringify(probeHistory.slice(0, 24));
    try {
      localStorage.setItem(PROBE_HISTORY_KEY, payload);
      PROBE_HISTORY_LEGACY_KEYS.forEach((key) => {
        localStorage.setItem(key, payload);
      });
    } catch {}
  }

  function saveStudentGoalState() {
    try { localStorage.setItem(STUDENT_GOALS_KEY, JSON.stringify(studentGoalState)); } catch {}
  }

  function savePlaylistState() {
    try { localStorage.setItem(PLAYLIST_STATE_KEY, JSON.stringify(playlistState)); } catch {}
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
      roundsTarget: Number.parseInt(normalizeProbeRounds(prefs.probeRounds || DEFAULT_PREFS.probeRounds), 10),
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

  var rosterState = loadRosterState();
  var probeHistory = loadProbeHistory();
  var studentGoalState = loadStudentGoalState();
  var playlistState = loadPlaylistState();
  const teacherAssignmentsFeature = window.WQTeacherAssignmentsFeature?.createFeature?.({
    contract: TEACHER_ASSIGNMENTS_CONTRACT,
    el: _el,
    curriculumPackOrder: CURRICULUM_PACK_ORDER,
    normalizeLessonPackId,
    normalizeLessonTargetId,
    getLessonPackDefinition,
    getLessonTarget,
    getCurriculumTargetsForGrade,
    getQuestFilterGradeBand,
    getActiveStudentLabel,
    applyChipTone,
    applyStudentTargetConfig,
    isAssessmentRoundLocked
  }) || null;
  var probeState = createEmptyProbeState();
  var sessionSummary = loadSessionSummaryState();
  var activeMiniLessonKey = 'top';

  function saveSessionSummaryState() {
    try { sessionStorage.setItem(SESSION_SUMMARY_KEY, JSON.stringify(sessionSummary)); } catch {}
  }

  function saveRosterState() {
    try { localStorage.setItem(ROSTER_STATE_KEY, JSON.stringify(rosterState)); } catch {}
  }

  function getActiveStudentLabel() {
    return rosterState.active || 'Class';
  }

  function applyStudentTargetConfig(packId, targetId, options = {}) {
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    if (normalizedPack === 'custom' || normalizedTarget === 'custom') return false;
    syncLessonPackControlsFromPrefs({ packId: normalizedPack, targetId: normalizedTarget });
    return applyLessonTargetConfig(normalizedPack, normalizedTarget, { toast: !!options.toast });
  }

  function getAssigneeKeyForStudent(name) {
    const label = String(name || '').trim();
    if (!label || label === 'Class') return 'class';
    return `student:${label}`;
  }

  function getSelectedPlaylist() {
    const selectedId = String(playlistState.selectedId || '').trim();
    if (!selectedId) return null;
    return playlistState.playlists.find((entry) => entry.id === selectedId) || null;
  }

  function setSelectedPlaylistId(playlistId) {
    const nextId = String(playlistId || '').trim();
    if (!nextId) {
      playlistState.selectedId = '';
    } else if (playlistState.playlists.some((entry) => entry.id === nextId)) {
      playlistState.selectedId = nextId;
    } else {
      playlistState.selectedId = '';
    }
    savePlaylistState();
  }

  function getAssignedPlaylistContext(studentLabel) {
    const studentKey = getAssigneeKeyForStudent(studentLabel);
    const directId = String(playlistState.assignments[studentKey] || '').trim();
    if (directId) {
      const direct = playlistState.playlists.find((entry) => entry.id === directId);
      if (direct) return { playlist: direct, key: studentKey };
    }
    const classId = String(playlistState.assignments.class || '').trim();
    if (!classId) return null;
    const classPlaylist = playlistState.playlists.find((entry) => entry.id === classId) || null;
    if (!classPlaylist) return null;
    return { playlist: classPlaylist, key: 'class' };
  }

  function getAssignedPlaylistForStudent(studentLabel) {
    return getAssignedPlaylistContext(studentLabel)?.playlist || null;
  }

  function getPlaylistProgressIndex(assigneeKey, playlist) {
    if (!playlist || !Array.isArray(playlist.items) || !playlist.items.length) return 0;
    const key = String(assigneeKey || '').trim();
    const max = playlist.items.length;
    const raw = Math.floor(Number(playlistState.progress?.[key]) || 0);
    return Math.max(0, raw % max);
  }

  function setPlaylistProgressIndex(assigneeKey, playlist, rawIndex = 0) {
    const key = String(assigneeKey || '').trim();
    if (!key) return;
    if (!playlistState.progress || typeof playlistState.progress !== 'object') {
      playlistState.progress = Object.create(null);
    }
    const max = Math.max(1, Array.isArray(playlist?.items) ? playlist.items.length : 1);
    const parsed = Math.floor(Number(rawIndex) || 0);
    playlistState.progress[key] = Math.max(0, parsed % max);
  }

  function buildCurrentTargetSnapshot() {
    const packId = normalizeLessonPackId(
      prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack
    );
    const targetId = normalizeLessonTargetId(
      packId,
      prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
    );
    const focus = _el('setting-focus')?.value || prefs.focus || 'all';
    const gradeBand = getEffectiveGameplayGradeBand(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade, focus);
    const length = String(_el('s-length')?.value || prefs.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;
    let label = '';
    if (packId !== 'custom' && targetId !== 'custom') {
      const pack = getLessonPackDefinition(packId);
      const target = getLessonTarget(packId, targetId);
      label = target ? `${pack.label} · ${target.label}` : `${pack.label} · Target`;
    } else {
      const focusLabel = getFocusLabel(focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
      label = `${focusLabel || 'Classic'} · ${formatGradeBandLabel(gradeBand)} · ${formatLengthPrefLabel(length)}`;
    }
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      packId,
      targetId,
      focus,
      gradeBand,
      length,
      label,
      createdAt: Date.now()
    };
  }

  function applySnapshotToSettings(snapshot, options = {}) {
    if (!snapshot) return false;
    const packId = normalizeLessonPackId(snapshot.packId || 'custom');
    const targetId = normalizeLessonTargetId(packId, snapshot.targetId || 'custom');
    const focusValue = String(snapshot.focus || 'all').trim() || 'all';
    const gradeBand = String(snapshot.gradeBand || SAFE_DEFAULT_GRADE_BAND).trim() || SAFE_DEFAULT_GRADE_BAND;
    const lengthValue = String(snapshot.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;

    if (packId !== 'custom' && targetId !== 'custom') {
      getLessonPackSelectElements().forEach((select) => { select.value = packId; });
      const normalizedTarget = populateLessonTargetSelect(packId, targetId);
      getLessonTargetSelectElements().forEach((select) => { select.value = normalizedTarget; });
      setLessonPackPrefs(packId, normalizedTarget);
      updateLessonPackNote(packId, normalizedTarget);
      applyLessonTargetConfig(packId, normalizedTarget, { toast: false });
      if (options.toast) WQUI.showToast('Assigned playlist target applied.');
      return true;
    }

    lessonPackApplying = true;
    try {
      getLessonPackSelectElements().forEach((select) => { select.value = 'custom'; });
      populateLessonTargetSelect('custom', 'custom');
      setLessonPackPrefs('custom', 'custom');
      const focusSelect = _el('setting-focus');
      if (focusSelect && Array.from(focusSelect.options).some((option) => option.value === focusValue)) {
        focusSelect.value = focusValue;
        focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const gradeSelect = _el('s-grade');
      if (gradeSelect && gradeSelect.value !== gradeBand) {
        gradeSelect.value = gradeBand;
        setPref('grade', gradeBand);
      }
      const lengthSelect = _el('s-length');
      if (lengthSelect && lengthSelect.value !== lengthValue) {
        lengthSelect.value = lengthValue;
        setPref('length', lengthValue);
      }
    } finally {
      lessonPackApplying = false;
    }
    updateLessonPackNote('custom', 'custom');
    updateFocusGradeNote();
    updateGradeTargetInline();
    updateFocusSummaryLabel();
    if (options.toast) WQUI.showToast('Assigned playlist target applied.');
    return true;
  }

  function renderPlaylistControls() {
    const select = _el('s-playlist-select');
    const nameInput = _el('s-playlist-name');
    const summaryChip = _el('session-playlist-summary');
    const assignmentChip = _el('session-playlist-assigned');
    if (select) {
      select.innerHTML = '';
      const none = document.createElement('option');
      none.value = '';
      none.textContent = 'No playlist selected';
      select.appendChild(none);
      playlistState.playlists.forEach((playlist) => {
        const option = document.createElement('option');
        option.value = playlist.id;
        option.textContent = `${playlist.name} (${playlist.items.length})`;
        select.appendChild(option);
      });
      if (playlistState.selectedId && playlistState.playlists.some((entry) => entry.id === playlistState.selectedId)) {
        select.value = playlistState.selectedId;
      } else {
        select.value = '';
      }
    }

    const selected = getSelectedPlaylist();
    if (nameInput && !nameInput.matches(':focus')) {
      nameInput.value = selected?.name || '';
    }
    if (summaryChip) {
      summaryChip.textContent = selected
        ? `Playlist: ${selected.name} (${selected.items.length} target${selected.items.length === 1 ? '' : 's'})`
        : 'Playlist: --';
      summaryChip.setAttribute('title', summaryChip.textContent);
    }
    if (assignmentChip) {
      const studentLabel = getActiveStudentLabel();
      const assignedContext = getAssignedPlaylistContext(studentLabel);
      const assigned = assignedContext?.playlist || null;
      if (!assigned) {
        assignmentChip.textContent = 'Assignment: --';
        assignmentChip.setAttribute('title', assignmentChip.textContent);
      } else {
        const nextIndex = getPlaylistProgressIndex(assignedContext.key, assigned);
        const itemCount = Math.max(0, assigned.items.length);
        const nextTarget = itemCount ? assigned.items[nextIndex] : null;
        assignmentChip.textContent = itemCount
          ? `Assignment: ${studentLabel} -> ${assigned.name} (next ${nextIndex + 1}/${itemCount})`
          : `Assignment: ${studentLabel} -> ${assigned.name} (empty)`;
        assignmentChip.setAttribute(
          'title',
          itemCount
            ? `${assignmentChip.textContent} · Next target: ${nextTarget?.label || 'Saved target'}`
            : `${assignmentChip.textContent} · Add at least one target to this playlist.`
        );
      }
    }
  }

  function saveCurrentTargetToPlaylist() {
    const selected = getSelectedPlaylist();
    const nameInput = _el('s-playlist-name');
    const typedName = String(nameInput?.value || '').trim();
    const snapshot = buildCurrentTargetSnapshot();
    if (!snapshot) return false;

    if (selected) {
      const duplicate = selected.items.some((entry) => (
        entry.packId === snapshot.packId &&
        entry.targetId === snapshot.targetId &&
        entry.focus === snapshot.focus &&
        entry.gradeBand === snapshot.gradeBand &&
        entry.length === snapshot.length
      ));
      if (!duplicate) {
        selected.items.push(snapshot);
        selected.items = selected.items.slice(-20);
      }
      selected.updatedAt = Date.now();
      if (typedName) selected.name = typedName;
      savePlaylistState();
      renderPlaylistControls();
      return true;
    }

    const nextName = typedName || `Playlist ${playlistState.playlists.length + 1}`;
    const playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: nextName,
      items: [snapshot],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    playlistState.playlists.push(playlist);
    playlistState.playlists = playlistState.playlists.slice(-40);
    setSelectedPlaylistId(playlist.id);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function assignSelectedPlaylistToActiveStudent() {
    const selected = getSelectedPlaylist();
    if (!selected) return false;
    const student = getActiveStudentLabel();
    const assigneeKey = getAssigneeKeyForStudent(student);
    playlistState.assignments[assigneeKey] = selected.id;
    setPlaylistProgressIndex(assigneeKey, selected, 0);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function applyAssignedPlaylistForActiveStudent() {
    const context = getAssignedPlaylistContext(getActiveStudentLabel());
    const assigned = context?.playlist || null;
    if (!context || !assigned || !assigned.items.length) return false;
    const index = getPlaylistProgressIndex(context.key, assigned);
    const target = assigned.items[index] || assigned.items[0];
    const applied = applySnapshotToSettings(target, { toast: true });
    if (!applied) return false;
    setPlaylistProgressIndex(context.key, assigned, index + 1);
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function deleteSelectedPlaylist() {
    const selected = getSelectedPlaylist();
    if (!selected) return false;
    playlistState.playlists = playlistState.playlists.filter((entry) => entry.id !== selected.id);
    Object.entries(playlistState.assignments).forEach(([key, playlistId]) => {
      if (playlistId !== selected.id) return;
      delete playlistState.assignments[key];
      if (playlistState.progress && typeof playlistState.progress === 'object') {
        delete playlistState.progress[key];
      }
    });
    setSelectedPlaylistId(playlistState.playlists[0]?.id || '');
    savePlaylistState();
    renderPlaylistControls();
    return true;
  }

  function getGoalKeyForStudent(name) {
    const label = String(name || '').trim();
    return label || 'Class';
  }

  function getGoalForStudent(name) {
    const key = getGoalKeyForStudent(name);
    return normalizeGoalEntry(studentGoalState[key]);
  }

  function setGoalForStudent(name, goal) {
    const key = getGoalKeyForStudent(name);
    const entry = normalizeGoalEntry(goal);
    if (!entry) return false;
    studentGoalState[key] = entry;
    saveStudentGoalState();
    return true;
  }

  function clearGoalForStudent(name) {
    const key = getGoalKeyForStudent(name);
    if (!Object.prototype.hasOwnProperty.call(studentGoalState, key)) return false;
    delete studentGoalState[key];
    saveStudentGoalState();
    return true;
  }

  function matchesProbeRecordStudent(recordStudent, studentLabel) {
    const left = String(recordStudent || '').trim() || 'Class';
    const right = String(studentLabel || '').trim() || 'Class';
    return left === right;
  }

  function getProbeRecordsForStudent(studentLabel) {
    return probeHistory.filter((record) => matchesProbeRecordStudent(record?.student, studentLabel));
  }

  function getLatestProbeSourceForStudent(studentLabel) {
    if (probeState.active && matchesProbeRecordStudent(probeState.student, studentLabel)) {
      return probeState;
    }
    return getProbeRecordsForStudent(studentLabel)[0] || null;
  }

  function buildProbeNumericSummary(source) {
    const roundsDone = Math.max(0, Number(source?.roundsDone) || 0);
    const wins = Math.max(0, Number(source?.wins) || 0);
    const totalGuesses = Math.max(0, Number(source?.totalGuesses) || 0);
    const totalDurationMs = Math.max(0, Number(source?.totalDurationMs) || 0);
    const hintRounds = Math.max(0, Number(source?.hintRounds) || 0);
    return {
      roundsDone,
      wins,
      accuracyRate: roundsDone ? wins / roundsDone : 0,
      avgGuesses: roundsDone ? totalGuesses / roundsDone : 0,
      avgTimeSeconds: roundsDone ? (totalDurationMs / roundsDone) / 1000 : 0,
      hintRate: roundsDone ? hintRounds / roundsDone : 0
    };
  }

  function getComparableProbeTrend(studentLabel) {
    const records = getProbeRecordsForStudent(studentLabel);
    const activeMatches = probeState.active &&
      matchesProbeRecordStudent(probeState.student, studentLabel) &&
      Math.max(0, Number(probeState.roundsDone) || 0) > 0;
    const currentRecord = activeMatches ? probeState : (records[0] || null);
    const previousRecord = activeMatches ? (records[0] || null) : (records[1] || null);
    const current = currentRecord ? buildProbeNumericSummary(currentRecord) : null;
    const previous = previousRecord ? buildProbeNumericSummary(previousRecord) : null;
    return { current, previous, activeMatches };
  }

  function applyChipTone(el, tone) {
    if (!el) return;
    el.classList.remove('is-good', 'is-warn', 'is-bad');
    if (tone === 'good') el.classList.add('is-good');
    if (tone === 'warn') el.classList.add('is-warn');
    if (tone === 'bad') el.classList.add('is-bad');
  }

  function formatSignedDelta(value, digits = 1) {
    if (!Number.isFinite(value)) return '--';
    const rounded = Number(value.toFixed(digits));
    if (rounded > 0) return `+${rounded}`;
    return String(rounded);
  }

  function loadTelemetryRows() {
    try {
      const raw = localStorage.getItem(TELEMETRY_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => {
          const event = String(entry?.event_name || entry?.event || entry?.name || '').trim().toLowerCase();
          const timestamp = Number(entry?.ts_ms || entry?.ts || entry?.timestamp || entry?.time || 0);
          const payload = entry?.payload && typeof entry.payload === 'object'
            ? entry.payload
            : (entry?.data && typeof entry.data === 'object' ? entry.data : entry);
          return { event, timestamp, payload };
        })
        .filter((entry) => entry.event && Number.isFinite(entry.timestamp) && entry.timestamp > 0);
    } catch {
      return [];
    }
  }

  function buildAdoptionHealthMetrics() {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const telemetryRows = loadTelemetryRows().filter((row) => row.timestamp >= (now - sevenDaysMs));

    const byEvent = (names) => {
      const allowed = new Set([].concat(names || []).map((name) => String(name || '').toLowerCase()).filter(Boolean));
      return telemetryRows.filter((row) => allowed.has(row.event));
    };
    const pct = (value) => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
    const durationSeconds = (start, end) => Math.max(0, (Number(end) - Number(start)) / 1000);
    const metric = (key, label, valuePct, tone = '', detail = '', available = true, weight = 1) => ({
      key,
      label,
      valuePct: Number.isFinite(valuePct) ? Math.max(0, Math.min(100, Math.round(valuePct))) : null,
      tone,
      detail,
      available: Boolean(available),
      weight: Math.max(0, Number(weight) || 0)
    });

    const roundStarts = byEvent(['wq_round_start']).sort((a, b) => a.timestamp - b.timestamp);
    const supportEvents = byEvent(['wq_support_used', 'wq_hint_open', 'wq_hint_used', 'wq_clue_open', 'wq_coach_open'])
      .sort((a, b) => a.timestamp - b.timestamp);
    let noEarlySupportCount = 0;
    if (roundStarts.length) {
      roundStarts.forEach((start) => {
        const earlySupport = supportEvents.find((event) => {
          const delta = event.timestamp - start.timestamp;
          return delta >= 0 && delta <= 90_000;
        });
        if (!earlySupport) noEarlySupportCount += 1;
      });
    }
    const clarityFromTelemetry = roundStarts.length ? (noEarlySupportCount / roundStarts.length) : null;
    const clarityFromSession = sessionSummary.rounds
      ? Math.max(0, 1 - (sessionSummary.hintRounds / Math.max(1, sessionSummary.rounds)))
      : null;
    const clarityRate = clarityFromTelemetry ?? clarityFromSession;
    const clarity = clarityRate === null
      ? metric('clarity', 'Clarity', null, '', 'Need more rounds to score first-90s independence.', false, 1.1)
      : metric(
          'clarity',
          'Clarity',
          pct(clarityRate),
          clarityRate >= 0.72 ? 'good' : (clarityRate >= 0.5 ? 'warn' : 'bad'),
          `No-support first 90s: ${pct(clarityRate)}%.`,
          true,
          1.1
        );

    const zpdRows = telemetryRows.filter((row) => Object.prototype.hasOwnProperty.call(row.payload || {}, 'zpd_in_band'));
    const zpdRate = zpdRows.length
      ? (zpdRows.filter((row) => Boolean(row.payload?.zpd_in_band)).length / zpdRows.length)
      : null;
    const probeSummary = getLatestProbePerformance(getActiveStudentLabel());
    const zpdFallbackRate = probeSummary && probeSummary.roundsDone > 0
      ? Math.max(0, Math.min(1, ((probeSummary.accuracyRate * 0.7) + ((1 - probeSummary.hintRate) * 0.3))))
      : null;
    const zpdEffectiveRate = zpdRate ?? zpdFallbackRate;
    const zpd = zpdEffectiveRate === null
      ? metric('zpd', 'ZPD Fit', null, '', 'Need telemetry or a completed probe to estimate fit.', false, 1.15)
      : metric(
          'zpd',
          'ZPD Fit',
          pct(zpdEffectiveRate),
          zpdEffectiveRate >= 0.78 ? 'good' : (zpdEffectiveRate >= 0.6 ? 'warn' : 'bad'),
          `In-band estimate: ${pct(zpdEffectiveRate)}%.`,
          true,
          1.15
        );

    const hubOpens = byEvent(['wq_teacher_hub_open']).sort((a, b) => a.timestamp - b.timestamp);
    const targetApplies = byEvent(['wq_target_apply']).sort((a, b) => a.timestamp - b.timestamp);
    const setupDurations = [];
    hubOpens.forEach((openRow) => {
      const nextApply = targetApplies.find((applyRow) => applyRow.timestamp >= openRow.timestamp);
      if (nextApply) setupDurations.push(durationSeconds(openRow.timestamp, nextApply.timestamp));
    });
    const setupMedian = setupDurations.length
      ? setupDurations.slice().sort((a, b) => a - b)[Math.floor(setupDurations.length / 2)]
      : null;
    const setupSpeed = setupMedian === null
      ? metric('setup', 'Setup Speed', null, '', 'Open Specialist Hub and apply a target to score setup speed.', false, 0.9)
      : metric(
          'setup',
          'Setup Speed',
          pct(Math.max(0, Math.min(1, 1 - (setupMedian / 180)))),
          setupMedian <= 45 ? 'good' : (setupMedian <= 90 ? 'warn' : 'bad'),
          `Median hub->target apply: ${Math.round(setupMedian)}s.`,
          true,
          0.9
        );

    const targetKeyOf = (row) => String(
      row?.payload?.lesson_target_id ||
      row?.payload?.target_id ||
      row?.payload?.lessonId ||
      ''
    ).trim();
    const roundCompletes = byEvent(['wq_round_complete']).sort((a, b) => a.timestamp - b.timestamp);
    let fidelityTotal = 0;
    let fidelityMatched = 0;
    if (targetApplies.length && roundCompletes.length) {
      roundCompletes.forEach((row) => {
        const priorApply = targetApplies
          .filter((applyRow) => applyRow.timestamp <= row.timestamp)
          .slice(-1)[0];
        const applyKey = targetKeyOf(priorApply);
        const roundKey = targetKeyOf(row);
        if (applyKey || roundKey) {
          fidelityTotal += 1;
          if (applyKey && roundKey && applyKey === roundKey) fidelityMatched += 1;
        }
      });
    }
    const fidelityRate = fidelityTotal > 0 ? (fidelityMatched / fidelityTotal) : null;
    const fidelity = fidelityRate === null
      ? metric('fidelity', 'Lesson Fidelity', null, '', 'Need target-apply and round-complete telemetry to score fidelity.', false, 1.05)
      : metric(
          'fidelity',
          'Lesson Fidelity',
          pct(fidelityRate),
          fidelityRate >= 0.85 ? 'good' : (fidelityRate >= 0.65 ? 'warn' : 'bad'),
          `Rounds aligned to active lesson target: ${pct(fidelityRate)}%.`,
          true,
          1.05
        );

    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: getActiveStudentLabel() === 'Class' ? '' : getActiveStudentLabel()
    });
    const deepDiveRateTelemetry = (() => {
      const completes = byEvent(['wq_deep_dive_complete']);
      if (!completes.length) return null;
      const passed = completes.filter((row) => {
        const doneCount = Number(row.payload?.done_count || row.payload?.doneCount || 0);
        const completionRate = Number(row.payload?.completion_rate || row.payload?.completionRate || 0);
        return doneCount >= 3 || completionRate >= 0.75;
      }).length;
      return passed / completes.length;
    })();
    const deepDiveRate = deepDiveRateTelemetry ?? (missionStats.count ? missionStats.completionRate : null);
    const deepDive = deepDiveRate === null
      ? metric('deepdive', 'Deep Dive Completion', null, '', 'Complete at least one Deep Dive to score this KPI.', false, 0.95)
      : metric(
          'deepdive',
          'Deep Dive Completion',
          pct(deepDiveRate),
          deepDiveRate >= 0.7 ? 'good' : (deepDiveRate >= 0.5 ? 'warn' : 'bad'),
          `Completed at strong threshold: ${pct(deepDiveRate)}%.`,
          true,
          0.95
        );

    const errorRows = byEvent(['wq_error']);
    const blockerCount = errorRows.filter((row) => {
      const severity = String(row.payload?.severity || row.payload?.level || '').toLowerCase();
      return severity === 'blocker' || severity === 'critical' || severity === 'fatal';
    }).length;
    const sessionAnchors = byEvent(['wq_session_start', 'wq_teacher_hub_open']);
    const sessionCount = Math.max(1, sessionAnchors.length || (sessionSummary.rounds > 0 ? 1 : 0));
    const blockerRate = blockerCount / sessionCount;
    const reliabilityScore = Math.max(0, Math.min(1, 1 - blockerRate));
    const reliability = metric(
      'reliability',
      'Reliability',
      pct(reliabilityScore),
      blockerRate === 0 ? 'good' : (blockerRate <= 0.2 ? 'warn' : 'bad'),
      blockerCount ? `${blockerCount} blocker-level issue(s) detected in recent sessions.` : 'No blocker issues detected.',
      true,
      0.85
    );

    const metrics = [clarity, zpd, setupSpeed, fidelity, deepDive, reliability];
    const weighted = metrics
      .filter((item) => item.available && item.valuePct !== null)
      .reduce((acc, item) => {
        acc.value += item.valuePct * item.weight;
        acc.weight += item.weight;
        return acc;
      }, { value: 0, weight: 0 });
    const overallScore = weighted.weight > 0 ? Math.round(weighted.value / weighted.weight) : null;
    const overallTone = overallScore === null
      ? ''
      : (overallScore >= 80 ? 'good' : (overallScore >= 60 ? 'warn' : 'bad'));
    return { metrics, overallScore, overallTone };
  }

  function renderAdoptionHealthPanel() {
    const overallEl = _el('session-adoption-overall');
    const noteEl = _el('session-adoption-note');
    const clarityEl = _el('session-adoption-clarity');
    const zpdEl = _el('session-adoption-zpd');
    const setupEl = _el('session-adoption-setup');
    const fidelityEl = _el('session-adoption-fidelity');
    const deepDiveEl = _el('session-adoption-deepdive');
    const reliabilityEl = _el('session-adoption-reliability');
    const metricEls = {
      clarity: clarityEl,
      zpd: zpdEl,
      setup: setupEl,
      fidelity: fidelityEl,
      deepdive: deepDiveEl,
      reliability: reliabilityEl
    };
    if (!overallEl) return;

    const snapshot = buildAdoptionHealthMetrics();
    const availableCount = snapshot.metrics.filter((metricEntry) => metricEntry.available).length;
    const totalCount = snapshot.metrics.length;
    if (snapshot.overallScore === null) {
      overallEl.textContent = 'Overall: --';
      overallEl.setAttribute('title', 'Complete a few rounds/probes to unlock adoption scoring.');
      applyChipTone(overallEl, '');
    } else {
      overallEl.textContent = `Overall: ${snapshot.overallScore}/100`;
      overallEl.setAttribute('title', `Adoption health based on ${availableCount} of ${totalCount} KPIs.`);
      applyChipTone(overallEl, snapshot.overallTone);
    }

    snapshot.metrics.forEach((entry) => {
      const el = metricEls[entry.key];
      if (!el) return;
      el.textContent = entry.valuePct === null ? `${entry.label}: --` : `${entry.label}: ${entry.valuePct}%`;
      el.setAttribute('title', entry.detail || `${entry.label} score`);
      applyChipTone(el, entry.available ? entry.tone : '');
    });

    if (noteEl) {
      noteEl.textContent = `Data readiness: ${availableCount}/${totalCount} KPIs active (7-day local window).`;
    }
  }

  function renderTelemetryDashboards() {
    const adoptionEl = _el('telemetry-dashboard-adoption');
    const learningEl = _el('telemetry-dashboard-learning');
    const reliabilityEl = _el('telemetry-dashboard-reliability');
    const noteEl = _el('telemetry-dashboard-note');
    if (!adoptionEl || !learningEl || !reliabilityEl) return;

    const adoptionSnapshot = buildAdoptionHealthMetrics();
    const adoptionScore = adoptionSnapshot.overallScore;
    adoptionEl.textContent = adoptionScore === null ? 'Adoption: --' : `Adoption: ${adoptionScore}/100`;
    applyChipTone(adoptionEl, adoptionSnapshot.overallTone || '');

    const rows = loadTelemetryRows();
    const rounds = rows.filter((row) => row.event === 'wq_round_complete');
    const wins = rounds.filter((row) => Boolean(row.payload?.won)).length;
    const roundWinRate = rounds.length ? (wins / rounds.length) : null;
    const deepDive = rows.filter((row) => row.event === 'wq_funnel_deep_dive_completed' || row.event === 'wq_deep_dive_complete');
    const deepDiveCompletion = deepDive.length
      ? (deepDive.reduce((sum, row) => sum + Math.max(0, Math.min(1, Number(row.payload?.completion_rate || 0))), 0) / deepDive.length)
      : null;
    const learningScoreRaw = [roundWinRate, deepDiveCompletion].filter((value) => value !== null);
    const learningScore = learningScoreRaw.length
      ? Math.round((learningScoreRaw.reduce((sum, value) => sum + value, 0) / learningScoreRaw.length) * 100)
      : null;
    learningEl.textContent = learningScore === null ? 'Learning: --' : `Learning: ${learningScore}/100`;
    applyChipTone(learningEl, learningScore === null ? '' : (learningScore >= 80 ? 'good' : learningScore >= 60 ? 'warn' : 'bad'));

    const errorRows = rows.filter((row) => row.event === 'wq_error');
    const blockerCount = errorRows.filter((row) => {
      const severity = String(row.payload?.severity || row.payload?.level || '').toLowerCase();
      return severity === 'blocker' || severity === 'critical' || severity === 'fatal';
    }).length;
    const reliabilityScore = Math.max(0, 100 - (blockerCount * 20));
    reliabilityEl.textContent = `Reliability: ${reliabilityScore}/100`;
    applyChipTone(reliabilityEl, blockerCount === 0 ? 'good' : blockerCount <= 2 ? 'warn' : 'bad');

    if (noteEl) {
      noteEl.textContent = `Funnel events tracked: ${rows.filter((row) => row.event.startsWith('wq_funnel_')).length}.`;
    }
  }

  function getLatestProbePerformance(studentLabel) {
    const trend = getComparableProbeTrend(studentLabel);
    return trend.current || null;
  }

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
    const accuracyInput = _el('s-goal-accuracy');
    const guessesInput = _el('s-goal-guesses');
    const statusEl = _el('session-goal-status');
    const progressEl = _el('session-goal-progress');

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
        const topErrorKey = getTopErrorKey(errorCounts);
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
          avgTimeLabel: attempts ? formatDurationLabel(avgTimeMs) : '--',
          avgTimeSeconds: attempts ? Number((avgTimeMs / 1000).toFixed(1)) : 0,
          topErrorKey,
          topErrorLabel: getTopErrorLabel(errorCounts),
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
    const select = _el('s-mastery-sort');
    return normalizeMasterySort(select?.value || 'attempts_desc');
  }

  function getMasteryFilterMode() {
    const select = _el('s-mastery-filter');
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
    const tableBody = _el('session-mastery-table-body');
    if (!tableBody) return;
    const sortSelect = _el('s-mastery-sort');
    const filterSelect = _el('s-mastery-filter');
    const filterNote = _el('session-mastery-filter-note');
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

  function renderRosterControls() {
    const select = _el('s-roster-student');
    if (!select) return;
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No student selected';
    select.appendChild(none);
    rosterState.students.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = rosterState.active || '';
    const chip = _el('session-active-student');
    if (chip) chip.textContent = `Student: ${getActiveStudentLabel()}`;
    renderPlaylistControls();
    renderGroupBuilderPanel();
    renderStudentLockPanel();
  }

  function renderGroupBuilderPanel() {
    teacherAssignmentsFeature?.renderGroupBuilderPanel?.();
  }

  function renderStudentLockPanel() {
    teacherAssignmentsFeature?.renderStudentLockPanel?.();
  }

  function maybeApplyStudentPlanForActiveStudent(options = {}) {
    return teacherAssignmentsFeature?.maybeApplyStudentPlanForActiveStudent?.(options) || false;
  }

  function addRosterStudent(rawName) {
    const name = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!name) return false;
    if (rosterState.students.includes(name)) {
      rosterState.active = name;
      saveRosterState();
      renderRosterControls();
      return true;
    }
    rosterState.students.push(name);
    rosterState.students.sort((a, b) => a.localeCompare(b));
    rosterState.active = name;
    saveRosterState();
    renderRosterControls();
    return true;
  }

  function removeActiveRosterStudent() {
    const active = String(rosterState.active || '').trim();
    if (!active) return false;
    rosterState.students = rosterState.students.filter((name) => name !== active);
    rosterState.active = rosterState.students[0] || '';
    teacherAssignmentsFeature?.removeStudentReferences?.(active);
    saveRosterState();
    renderRosterControls();
    return true;
  }

  function clearRosterStudents() {
    rosterState = { students: [], active: '' };
    teacherAssignmentsFeature?.clearStudentAssignments?.();
    saveRosterState();
    renderRosterControls();
  }

  function buildProbeSummary(source) {
    const roundsDone = Math.max(0, Number(source?.roundsDone) || 0);
    const wins = Math.max(0, Number(source?.wins) || 0);
    const totalGuesses = Math.max(0, Number(source?.totalGuesses) || 0);
    const totalDurationMs = Math.max(0, Number(source?.totalDurationMs) || 0);
    const hintRounds = Math.max(0, Number(source?.hintRounds) || 0);
    const accuracy = roundsDone ? `${Math.round((wins / roundsDone) * 100)}%` : '--';
    const avgGuesses = roundsDone ? (totalGuesses / roundsDone).toFixed(1) : '--';
    const avgTime = roundsDone ? formatDurationLabel(totalDurationMs / roundsDone) : '--';
    const hintRate = roundsDone ? `${Math.round((hintRounds / roundsDone) * 100)}%` : '--';
    return { roundsDone, wins, accuracy, avgGuesses, avgTime, hintRate };
  }

  function getProbeRecencyMeta(studentLabel) {
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
      return {
        label: `Probe Recency: ${daysAgo}d ago`,
        detail: 'Probe baseline is current (within 7 days).',
        tone: 'good'
      };
    }
    if (daysAgo <= 14) {
      return {
        label: `Probe Recency: ${daysAgo}d ago`,
        detail: 'Probe baseline is aging (8-14 days old).',
        tone: ''
      };
    }
    return {
      label: `Probe Recency: ${daysAgo}d ago`,
      detail: 'Probe baseline is overdue (>14 days old).',
      tone: 'warn'
    };
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
      return {
        label: 'Support Flag: Intensive check-in',
        detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`,
        tone: 'warn'
      };
    }
    if (accuracyPct < 80 || hintPct >= 40 || avgGuesses >= 4.5) {
      return {
        label: 'Support Flag: Targeted reteach',
        detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`,
        tone: 'warn'
      };
    }
    if (accuracyPct >= 92 && hintPct <= 20 && avgGuesses <= 3) {
      return {
        label: 'Support Flag: Ready to stretch',
        detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`,
        tone: 'good'
      };
    }
    return {
      label: 'Support Flag: On track',
      detail: `Accuracy ${accuracyPct}%, hints ${hintPct}%, avg guesses ${avgGuesses}.`,
      tone: ''
    };
  }

  function renderProbeSupportChips(studentLabel) {
    const recencyEl = _el('probe-recency-chip');
    const riskEl = _el('session-risk-chip');
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
    const statusEl = _el('probe-status');
    const accuracyEl = _el('probe-accuracy');
    const avgGuessesEl = _el('probe-avg-guesses');
    const avgTimeEl = _el('probe-avg-time');
    const hintRateEl = _el('probe-hint-rate');
    const trendLabelEl = _el('probe-trend-label');
    const trendAccuracyEl = _el('probe-trend-accuracy');
    const trendGuessesEl = _el('probe-trend-guesses');
    const trendTimeEl = _el('probe-trend-time');
    const activeStudent = getActiveStudentLabel();
    const source = getLatestProbeSourceForStudent(activeStudent);
    const summary = buildProbeSummary(source || {});
    const trend = getComparableProbeTrend(activeStudent);
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
      [trendLabelEl, trendAccuracyEl, trendGuessesEl, trendTimeEl].forEach((el) => applyChipTone(el, ''));
      renderStudentGoalPanel();
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
      [trendLabelEl, trendAccuracyEl, trendGuessesEl, trendTimeEl].forEach((el) => applyChipTone(el, ''));
      renderStudentGoalPanel();
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
    renderStudentGoalPanel();
  }

  function startWeeklyProbe() {
    if (probeState.active) {
      WQUI.showToast('Weekly probe is already active.');
      return;
    }
    const targetSelect = _el('s-probe-rounds');
    const normalizedRounds = normalizeProbeRounds(targetSelect?.value || prefs.probeRounds || DEFAULT_PREFS.probeRounds);
    if (targetSelect) targetSelect.value = normalizedRounds;
    setPref('probeRounds', normalizedRounds);
    probeState = {
      active: true,
      startedAt: Date.now(),
      roundsTarget: Number.parseInt(normalizedRounds, 10),
      roundsDone: 0,
      wins: 0,
      totalGuesses: 0,
      totalDurationMs: 0,
      hintRounds: 0,
      focusLabel: getFocusLabel(_el('setting-focus')?.value || prefs.focus || 'all').replace(/[—]/g, '').trim(),
      gradeLabel: formatGradeBandLabel(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade),
      student: getActiveStudentLabel()
    };
    renderProbePanel();
    WQUI.showToast(`Weekly probe started (${probeState.roundsTarget} rounds).`);
  }

  function finishWeeklyProbe(options = {}) {
    const silent = !!options.silent;
    if (!probeState.active) {
      if (!silent) WQUI.showToast('No active probe to stop.');
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
    probeHistory.unshift(record);
    probeHistory = probeHistory.slice(0, 24);
    saveProbeHistory();
    probeState = createEmptyProbeState();
    renderProbePanel();
    if (!silent) {
      const summary = buildProbeSummary(record);
      WQUI.showToast(`Probe saved: ${summary.accuracy} accuracy across ${record.roundsDone} rounds.`);
    }
  }

  function recordProbeRound(result, roundMetrics) {
    if (!probeState.active) return;
    probeState.roundsDone += 1;
    if (result?.won) probeState.wins += 1;
    probeState.totalGuesses += Math.max(0, Number(roundMetrics?.guessesUsed) || 0);
    probeState.totalDurationMs += Math.max(0, Number(roundMetrics?.durationMs) || 0);
    if (roundMetrics?.hintRequested) probeState.hintRounds += 1;
    if (probeState.roundsDone >= probeState.roundsTarget) {
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

  function buildCurrentCurriculumSnapshot() {
    const packId = normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack);
    const targetId = normalizeLessonTargetId(packId, prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget);
    const focus = _el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus;
    const selectedGrade = _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade;
    const effectiveGrade = getEffectiveGameplayGradeBand(selectedGrade, focus);
    const length = _el('s-length')?.value || prefs.length || DEFAULT_PREFS.length;
    const pack = getLessonPackDefinition(packId);
    const target = getLessonTarget(packId, targetId);
    return {
      packId,
      targetId,
      focus,
      selectedGrade,
      effectiveGrade,
      length,
      packLabel: pack?.label || 'Manual',
      targetLabel: target?.label || '',
      pacing: target?.pacing || ''
    };
  }

  function buildCurriculumSelectionLabel() {
    const snapshot = buildCurrentCurriculumSnapshot();
    if (snapshot.packId === 'custom') return 'Manual mode (no lesson pack)';
    if (!snapshot.targetLabel) return `${snapshot.packLabel} (target not selected)`;
    return `${snapshot.packLabel} · ${snapshot.targetLabel}`;
  }

  function buildMtssIepNoteText() {
    const student = getActiveStudentLabel();
    const now = new Date();
    const topErrorLabel = getTopErrorLabel(sessionSummary.errorTotals);
    const nextStep = getInstructionalNextStep(sessionSummary.errorTotals);
    const assignedPlaylist = getAssignedPlaylistForStudent(student);
    const trend = getComparableProbeTrend(student);
    const recency = getProbeRecencyMeta(student);
    const support = getSupportFlagMeta(student);
    const goalEval = evaluateStudentGoalState(student);
    const goal = goalEval.goal;
    const goalStatusText = `Goal: ${goalEval.statusLabel}`;
    const goalProgressText = `Goal Progress: ${goalEval.progressLabel}`;
    const currentProbe = trend.current;
    const previousProbe = trend.previous;
    const trendLine = (!currentProbe || !previousProbe || currentProbe.roundsDone <= 0 || previousProbe.roundsDone <= 0)
      ? 'Probe trend: baseline in progress (need two probe points for delta).'
      : `Probe trend: accuracy ${formatSignedDelta((currentProbe.accuracyRate - previousProbe.accuracyRate) * 100)} pts, avg guesses ${formatSignedDelta(currentProbe.avgGuesses - previousProbe.avgGuesses)}, avg time ${formatSignedDelta(currentProbe.avgTimeSeconds - previousProbe.avgTimeSeconds)}s versus prior probe.`;
    const sessionWinRate = sessionSummary.rounds
      ? `${Math.round((sessionSummary.wins / sessionSummary.rounds) * 100)}%`
      : '--';
    const sessionAvgGuesses = sessionSummary.rounds
      ? (sessionSummary.totalGuesses / sessionSummary.rounds).toFixed(1)
      : '--';
    const sessionAvgTime = sessionSummary.rounds
      ? formatDurationLabel(sessionSummary.totalDurationMs / sessionSummary.rounds)
      : '--';

    return [
      'WordQuest MTSS/IEP Progress Note',
      `Student: ${student}`,
      `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      `Curriculum: ${buildCurriculumSelectionLabel()}`,
      assignedPlaylist ? `Assigned Playlist: ${assignedPlaylist.name}` : 'Assigned Playlist: --',
      '',
      'Session Snapshot',
      `Rounds: ${sessionSummary.rounds} | Win Rate: ${sessionWinRate} | Avg Guesses: ${sessionAvgGuesses} | Avg Time: ${sessionAvgTime}`,
      `Hint Rounds: ${sessionSummary.hintRounds} | Voice Attempts: ${sessionSummary.voiceAttempts}`,
      `Top Error Pattern: ${topErrorLabel}`,
      `Instructional Next Step: ${nextStep}`,
      '',
      'Weekly Probe Snapshot',
      buildProbeSummaryText(),
      recency.label,
      support.label,
      trendLine,
      '',
      'Student Goal',
      goal
        ? `Targets: accuracy >= ${goal.accuracyTarget}% and avg guesses <= ${goal.avgGuessesTarget}.`
        : 'Targets: no active goal set for this student.',
      `${goalStatusText} | ${goalProgressText}`,
      '',
      'Teacher Interpretation',
      `Use the next block for targeted reteach: ${nextStep}`
    ].join('\n');
  }

  function pickSamplePracticeWords(limit = 8) {
    const snapshot = buildCurrentCurriculumSnapshot();
    const focus = snapshot.focus || 'all';
    const gradeBand = getEffectiveGameplayGradeBand(snapshot.selectedGrade || snapshot.effectiveGrade, focus);
    const length = snapshot.length || DEFAULT_PREFS.length;
    const pool = WQData.getPlayableWords({
      gradeBand,
      length,
      phonics: focus,
      includeLowerBands: shouldExpandGradeBandForFocus(focus)
    });
    if (!Array.isArray(pool) || !pool.length) return [];
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.max(1, Math.min(12, limit)));
  }

  function buildFamilyHandoutText() {
    const snapshot = buildCurrentCurriculumSnapshot();
    const student = getActiveStudentLabel();
    const assignedPlaylist = getAssignedPlaylistForStudent(student);
    const focusLabel = getFocusLabel(snapshot.focus || 'all').replace(/[—]/g, '').replace(/\s+/g, ' ').trim() || 'Classic';
    const words = pickSamplePracticeWords(8);
    const wordLines = words.length
      ? words.map((word, index) => `${index + 1}. ${String(word || '').toUpperCase()}`).join('\n')
      : 'No words available for the current filters. Adjust lesson target or grade band.';
    return [
      'WordQuest Family Practice Handout',
      `Student: ${student}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Curriculum Target: ${buildCurriculumSelectionLabel()}`,
      assignedPlaylist ? `Assigned Playlist: ${assignedPlaylist.name}` : 'Assigned Playlist: --',
      `Quest Focus: ${focusLabel}`,
      `Grade Band: ${formatGradeBandLabel(snapshot.effectiveGrade || snapshot.selectedGrade)}`,
      `Word Length: ${formatLengthPrefLabel(snapshot.length)}`,
      '',
      'At-Home Routine (10 minutes)',
      '1. Read each word out loud.',
      '2. Tap or stretch sounds/chunks.',
      '3. Spell the word once from memory.',
      '4. Use two words in oral sentences.',
      '',
      'Practice Word List',
      wordLines,
      '',
      'Family Tip: Keep practice positive and short. Accuracy first, speed second.'
    ].join('\n');
  }

  function getMiniLessonKeyFromSession() {
    return resolveMiniLessonErrorKey(activeMiniLessonKey, sessionSummary.errorTotals);
  }

  function renderMiniLessonPanel() {
    const key = getMiniLessonKeyFromSession();
    const textEl = _el('session-mini-lesson-copy');
    if (!textEl) return;
    const planText = buildMiniLessonPlanText(key);
    textEl.textContent = planText;
    textEl.setAttribute('title', `Current quick mini-lesson: ${ERROR_PATTERN_LABELS[key] || key}`);
  }

  async function copyTextToClipboard(text, successMessage, failureMessage) {
    const value = String(text || '').trim();
    if (!value) {
      WQUI.showToast(failureMessage);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        WQUI.showToast(successMessage);
        return;
      }
    } catch {}
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.setAttribute('readonly', 'true');
    fallback.style.position = 'fixed';
    fallback.style.top = '-9999px';
    document.body.appendChild(fallback);
    fallback.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    fallback.remove();
    WQUI.showToast(copied ? successMessage : failureMessage);
  }

  function renderSessionSummary() {
    const roundsEl = _el('session-rounds');
    const winRateEl = _el('session-win-rate');
    const hintRoundsEl = _el('session-hint-rounds');
    const voiceAttemptsEl = _el('session-voice-attempts');
    const topSkillEl = _el('session-top-skill');
    const masteryRateEl = _el('session-mastery-rate');
    const avgGuessesEl = _el('session-avg-guesses');
    const avgTimeEl = _el('session-avg-time');
    const topErrorEl = _el('session-top-error');
    const nextStepEl = _el('session-next-step');
    const studentEl = _el('session-active-student');
    const missionCountEl = _el('session-mission-count');
    const missionScoreEl = _el('session-mission-score');
    const missionCompletionEl = _el('session-mission-complete');
    const missionLevelEl = _el('session-mission-level');

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
      ? formatDurationLabel(sessionSummary.totalDurationMs / sessionSummary.rounds)
      : '--';
    if (topSkillEl) topSkillEl.textContent = `Top Skill: ${topSkill?.label || '--'}`;
    if (masteryRateEl) {
      const masteryRate = topSkill?.accuracyLabel || '--';
      masteryRateEl.textContent = `Mastery: ${masteryRate}`;
    }
    if (avgGuessesEl) avgGuessesEl.textContent = `Avg Guesses: ${avgGuesses}`;
    if (avgTimeEl) avgTimeEl.textContent = `Avg Time: ${avgTime}`;
    if (topErrorEl) topErrorEl.textContent = `Top Error: ${getTopErrorLabel(sessionSummary.errorTotals)}`;
    if (nextStepEl) {
      const chipLabel = getInstructionalNextStepChip(sessionSummary.errorTotals);
      const nextStep = getInstructionalNextStep(sessionSummary.errorTotals);
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

  function recordSessionRound(result, roundMetrics = {}) {
    sessionSummary.rounds += 1;
    if (result?.won) sessionSummary.wins += 1;
    if (roundMetrics.hintRequested) sessionSummary.hintRounds += 1;
    sessionSummary.voiceAttempts += Math.max(0, Number(roundMetrics.voiceAttempts) || 0);
    sessionSummary.totalGuesses += Math.max(0, Number(roundMetrics.guessesUsed) || 0);
    sessionSummary.totalDurationMs += Math.max(0, Number(roundMetrics.durationMs) || 0);
    mergeCounterMaps(sessionSummary.errorTotals, roundMetrics.errorCounts);

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
    prior.errorCounts = mergeCounterMaps(prior.errorCounts || Object.create(null), roundMetrics.errorCounts);
    sessionSummary.masteryBySkill[skillKey] = prior;

    saveSessionSummaryState();
    renderSessionSummary();
  }

  function recordVoiceAttempt() {
    const state = WQGame.getState?.();
    if (state?.word && !state?.gameOver) {
      currentRoundVoiceAttempts += 1;
    } else {
      sessionSummary.voiceAttempts += 1;
      saveSessionSummaryState();
      renderSessionSummary();
    }
  }

  function buildSessionSummaryText() {
    const startedAt = new Date(sessionSummary.startedAt || Date.now());
    const activeStudent = getActiveStudentLabel();
    const winRate = sessionSummary.rounds
      ? `${Math.round((sessionSummary.wins / sessionSummary.rounds) * 100)}%`
      : '--';
    const avgGuesses = sessionSummary.rounds
      ? (sessionSummary.totalGuesses / sessionSummary.rounds).toFixed(1)
      : '--';
    const avgTime = sessionSummary.rounds
      ? formatDurationLabel(sessionSummary.totalDurationMs / sessionSummary.rounds)
      : '--';
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    return [
      'WordQuest Session Summary',
      `Student: ${activeStudent}`,
      `Started: ${startedAt.toLocaleString()}`,
      `Rounds: ${sessionSummary.rounds}`,
      `Wins: ${sessionSummary.wins}`,
      `Win Rate: ${winRate}`,
      `Hint Rounds: ${sessionSummary.hintRounds}`,
      `Voice Attempts: ${sessionSummary.voiceAttempts}`,
      `Avg Guesses: ${avgGuesses}`,
      `Avg Time: ${avgTime}`,
      `Top Error Pattern: ${getTopErrorLabel(sessionSummary.errorTotals)}`,
      `Next Instructional Step: ${getInstructionalNextStep(sessionSummary.errorTotals)}`,
      `Deep Dive Rounds: ${missionStats.count}`,
      `Deep Dive Avg Score: ${missionStats.count ? `${Math.round(missionStats.avgScore)}/100` : '--'}`,
      `Deep Dive Strong+ Rate: ${missionStats.count ? `${Math.round(missionStats.strongRate * 100)}%` : '--'}`,
      `Deep Dive Completion: ${missionStats.count ? `${Math.round(missionStats.completionRate * 100)}%` : '--'}`,
      `Deep Dive On-time: ${missionStats.completedCount ? `${Math.round(missionStats.onTimeRate * 100)}%` : '--'}`,
      `Deep Dive Top Level: ${missionStats.topLevelLabel}`
    ].join('\n');
  }

  function buildSessionSummaryCsvText() {
    const rounds = Math.max(0, Number(sessionSummary.rounds) || 0);
    const avgGuesses = rounds
      ? (sessionSummary.totalGuesses / rounds).toFixed(1)
      : '--';
    const avgTimeSeconds = rounds
      ? Number(((sessionSummary.totalDurationMs / rounds) / 1000).toFixed(1))
      : 0;
    const winRate = rounds
      ? `${Math.round((sessionSummary.wins / rounds) * 100)}%`
      : '--';
    const topSkill = getTopMasteryEntry();
    const activeStudent = getActiveStudentLabel();
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    const lines = [[
      'Student',
      'Generated',
      'Started',
      'Rounds',
      'Wins',
      'Win Rate',
      'Hint Rounds',
      'Voice Attempts',
      'Avg Guesses',
      'Avg Time (s)',
      'Top Error Pattern',
      'Next Instructional Step',
      'Top Skill',
      'Top Skill Accuracy',
      'Deep Dive Rounds',
      'Deep Dive Avg Score',
      'Deep Dive Strong+',
      'Deep Dive Completion',
      'Deep Dive On-Time',
      'Deep Dive Top Level'
    ], [
      activeStudent,
      new Date().toLocaleString(),
      new Date(sessionSummary.startedAt || Date.now()).toLocaleString(),
      String(rounds),
      String(Math.max(0, Number(sessionSummary.wins) || 0)),
      winRate,
      String(Math.max(0, Number(sessionSummary.hintRounds) || 0)),
      String(Math.max(0, Number(sessionSummary.voiceAttempts) || 0)),
      avgGuesses,
      String(avgTimeSeconds),
      getTopErrorLabel(sessionSummary.errorTotals),
      getInstructionalNextStep(sessionSummary.errorTotals),
      topSkill?.label || '--',
      topSkill?.accuracyLabel || '--',
      String(missionStats.count),
      missionStats.count ? `${Math.round(missionStats.avgScore)}/100` : '--',
      missionStats.count ? `${Math.round(missionStats.strongRate * 100)}%` : '--',
      missionStats.count ? `${Math.round(missionStats.completionRate * 100)}%` : '--',
      missionStats.completedCount ? `${Math.round(missionStats.onTimeRate * 100)}%` : '--',
      missionStats.topLevelLabel
    ]];
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildMasteryReportText() {
    const { rows, allRows, sortMode, filterMode } = getVisibleMasteryRows();
    const header = [
      'WordQuest Mastery Report',
      `Student: ${getActiveStudentLabel()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Session rounds: ${sessionSummary.rounds}`,
      `Filter: ${describeMasteryFilterMode(filterMode)}`,
      `Sort: ${describeMasterySortMode(sortMode)}`,
      `Next Instructional Step: ${getInstructionalNextStep(sessionSummary.errorTotals)}`
    ];
    if (!allRows.length) return [...header, 'No skill rows yet.'].join('\n');
    if (!rows.length) return [...header, 'No skill rows match the current filter.'].join('\n');
    const lines = rows.map((row) => {
      return `${row.label}: accuracy ${row.accuracyLabel} | attempts ${row.attempts} | hints ${row.hintRounds} (${row.hintRateLabel}) | voice attempts ${row.voiceAttempts} | avg guesses ${row.avgGuessesLabel} | avg time ${row.avgTimeLabel} | top error ${row.topErrorLabel}`;
    });
    return [...header, '', ...lines].join('\n');
  }

  function csvEscapeCell(value) {
    const text = String(value ?? '');
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function sanitizeFilenameToken(value, fallback = 'class') {
    const normalized = String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || fallback;
  }

  function buildCsvBundlePrefix() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const student = sanitizeFilenameToken(getActiveStudentLabel(), 'class');
    return `wordquest-${student}-${year}${month}${day}-${hour}${minute}`;
  }

  function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
    try {
      const text = String(content ?? '');
      const withBom = mimeType.startsWith('text/csv') ? `\uFEFF${text}` : text;
      const blob = new Blob([withBom], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch {
      return false;
    }
  }

  function buildMasteryReportCsvText() {
    const { rows, allRows, sortMode, filterMode } = getVisibleMasteryRows();
    const generated = new Date().toLocaleString();
    const student = getActiveStudentLabel();
    const lines = [[
      'Student',
      'Generated',
      'Filter',
      'Sort',
      'Skill',
      'Accuracy',
      'Attempts',
      'Wins',
      'Hint Rounds',
      'Hint Rate',
      'Voice Attempts',
      'Avg Guesses',
      'Avg Time (s)',
      'Top Error',
      'Session Next Step'
    ]];
    const filterLabel = describeMasteryFilterMode(filterMode);
    const sortLabel = describeMasterySortMode(sortMode);
    const nextStep = getInstructionalNextStep(sessionSummary.errorTotals);
    if (!allRows.length) {
      lines.push([student, generated, filterLabel, sortLabel, 'No skill rows yet.', '', '', '', '', '', '', '', '', '', nextStep]);
    } else if (!rows.length) {
      lines.push([student, generated, filterLabel, sortLabel, 'No skill rows match current filter.', '', '', '', '', '', '', '', '', '', nextStep]);
    } else {
      rows.forEach((row) => {
        lines.push([
          student,
          generated,
          filterLabel,
          sortLabel,
          row.label,
          row.accuracyLabel,
          String(row.attempts),
          String(row.wins),
          String(row.hintRounds),
          row.hintRateLabel,
          String(row.voiceAttempts),
          row.avgGuessesLabel,
          String(row.avgTimeSeconds),
          row.topErrorLabel,
          nextStep
        ]);
      });
    }
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildProbeSummaryCsvText() {
    const lines = [[
      'Student',
      'Focus',
      'Grade',
      'Status',
      'Started',
      'Completed',
      'Rounds Done',
      'Rounds Target',
      'Accuracy',
      'Avg Guesses',
      'Avg Time (s)',
      'Hint Rate'
    ]];
    const records = [];
    if (probeState.active) {
      records.push({
        ...probeState,
        completedAt: 0,
        status: 'Active'
      });
    }
    probeHistory.forEach((record) => {
      records.push({
        ...record,
        status: 'Completed'
      });
    });
    if (!records.length) {
      lines.push(['Class', '', '', 'No probe records yet', '', '', '', '', '', '', '', '']);
      return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
    }
    records.forEach((record) => {
      const summary = buildProbeSummary(record);
      const started = new Date(record.startedAt || Date.now()).toLocaleString();
      const completed = record.completedAt ? new Date(record.completedAt).toLocaleString() : '';
      lines.push([
        String(record.student || 'Class'),
        String(record.focusLabel || 'Mixed'),
        String(record.gradeLabel || 'All'),
        String(record.status || 'Completed'),
        started,
        completed,
        String(Math.max(0, Number(record.roundsDone) || 0)),
        String(Math.max(0, Number(record.roundsTarget) || 0)),
        summary.accuracy,
        summary.avgGuesses,
        String(Math.max(0, Number(record.roundsDone) || 0)
          ? Number(((Math.max(0, Number(record.totalDurationMs) || 0) / Math.max(1, Number(record.roundsDone) || 1)) / 1000).toFixed(1))
          : 0),
        summary.hintRate
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function buildClassRollupCsvText() {
    const students = new Set();
    rosterState.students.forEach((name) => {
      const normalized = String(name || '').trim();
      if (normalized) students.add(normalized);
    });
    probeHistory.forEach((record) => {
      const normalized = String(record?.student || '').trim() || 'Class';
      students.add(normalized);
    });
    if (probeState.active) {
      students.add(String(probeState.student || '').trim() || 'Class');
    }
    if (!students.size) students.add('Class');

    const lines = [[
      'Student',
      'Probe Status',
      'Probe Date',
      'Probe Recency',
      'Accuracy',
      'Avg Guesses',
      'Avg Time (s)',
      'Hint Rate',
      'Support Flag',
      'Accuracy Delta (pts)',
      'Guess Delta',
      'Time Delta (s)',
      'Goal Accuracy Target',
      'Goal Avg Guesses Target',
      'Goal Status',
      'Goal Progress'
    ]];

    Array.from(students).sort((a, b) => a.localeCompare(b)).forEach((student) => {
      const source = getLatestProbeSourceForStudent(student);
      const summary = buildProbeSummary(source || {});
      const trend = getComparableProbeTrend(student);
      const goalEval = evaluateStudentGoalState(student);
      const goal = goalEval.goal;
      const recency = getProbeRecencyMeta(student);
      const support = getSupportFlagMeta(student);

      const hasTrend = Boolean(trend.current && trend.previous && trend.current.roundsDone > 0 && trend.previous.roundsDone > 0);
      const accuracyDelta = hasTrend
        ? formatSignedDelta((trend.current.accuracyRate - trend.previous.accuracyRate) * 100)
        : '--';
      const guessesDelta = hasTrend
        ? formatSignedDelta(trend.current.avgGuesses - trend.previous.avgGuesses)
        : '--';
      const timeDelta = hasTrend
        ? formatSignedDelta(trend.current.avgTimeSeconds - trend.previous.avgTimeSeconds)
        : '--';

      const probeDate = source
        ? new Date(source.completedAt || source.startedAt || Date.now()).toLocaleDateString()
        : '';
      const probeStatus = source
        ? (probeState.active && matchesProbeRecordStudent(probeState.student, student) ? 'Active' : 'Recent')
        : 'No probe data';
      const avgTimeSeconds = source && Math.max(0, Number(source.roundsDone) || 0) > 0
        ? Number(((Math.max(0, Number(source.totalDurationMs) || 0) / Math.max(1, Number(source.roundsDone) || 1)) / 1000).toFixed(1))
        : 0;

      lines.push([
        student,
        probeStatus,
        probeDate,
        recency.label.replace(/^Probe Recency:\s*/, ''),
        summary.accuracy,
        summary.avgGuesses,
        String(avgTimeSeconds),
        summary.hintRate,
        support.label.replace(/^Support Flag:\s*/, ''),
        accuracyDelta,
        guessesDelta,
        timeDelta,
        goal ? String(goal.accuracyTarget) : '',
        goal ? String(goal.avgGuessesTarget) : '',
        goalEval.statusLabel,
        goalEval.progressLabel
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function getMissionLabRecords(options = {}) {
    const newestFirst = options.newestFirst !== false;
    const sessionOnly = !!options.sessionOnly;
    const startedAt = Math.max(0, Number(options.startedAt || sessionSummary?.startedAt || 0));
    const studentFilterRaw = String(options.student || '').trim();
    const studentFilter = studentFilterRaw && studentFilterRaw !== 'Class' ? studentFilterRaw : '';
    let records = [];
    try {
      const raw = JSON.parse(localStorage.getItem(CHALLENGE_REFLECTION_KEY) || '[]');
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
        const taskOutcomes = CHALLENGE_TASK_FLOW.map((task) => {
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
          level: normalizeThinkingLevel(record.level, 'apply'),
          score,
          scoreBand: String(record.scoreBand || resolveMissionScoreBand(score)).trim() || resolveMissionScoreBand(score),
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
          avgAttemptsPerStation: attemptTotal / CHALLENGE_TASK_FLOW.length
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
      count + (record.score >= CHALLENGE_STRONG_SCORE_MIN ? 1 : 0)
    ), 0);
    const levelCounts = records.reduce((map, record) => {
      const level = normalizeThinkingLevel(record.level, '');
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
      avgAttemptsPerStation: (totalAttempts / records.length) / CHALLENGE_TASK_FLOW.length,
      completionRate: completedCount / records.length,
      completedCount,
      onTimeRate: completedCount ? (onTimeCount / completedCount) : 0,
      strongRate: strongCount / records.length,
      topLevel,
      topLevelLabel: topLevel ? getChallengeLevelDisplay(topLevel) : '--'
    };
  }

  function buildMissionSummaryText() {
    const activeStudent = getActiveStudentLabel();
    const stats = buildMissionSummaryStats({
      sessionOnly: true,
      student: activeStudent === 'Class' ? '' : activeStudent
    });
    const recent = stats.records[0] || null;
    const lines = [
      'WordQuest Deep Dive Summary',
      `Student: ${activeStudent}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Session started: ${new Date(sessionSummary.startedAt || Date.now()).toLocaleString()}`,
      `Deep Dive rounds: ${stats.count}`,
      `Deep Dive average score: ${stats.count ? `${Math.round(stats.avgScore)}/100` : '--'}`,
      `Strong+ rounds: ${stats.count ? `${Math.round(stats.strongRate * 100)}%` : '--'}`,
      `Deep Dive completion: ${stats.count ? `${Math.round(stats.completionRate * 100)}%` : '--'}`,
      `Average attempts per station: ${stats.count ? stats.avgAttemptsPerStation.toFixed(1) : '--'}`,
      `On-time finishes: ${stats.completedCount ? `${Math.round(stats.onTimeRate * 100)}%` : '--'}`,
      `Most-used thinking level: ${stats.topLevelLabel}`
    ];
    if (recent) {
      lines.push(
        '',
        'Most recent Deep Dive',
        `${new Date(recent.ts).toLocaleString()} · ${recent.word || '--'} · ${recent.topic || '--'} · Grade ${recent.grade || '--'} · Student ${recent.student || 'Class'}`,
        `Level: ${getChallengeLevelDisplay(recent.level)} · Score: ${recent.score}/100 (${recent.scoreBand}) · On time: ${recent.onTime ? 'yes' : 'no'}`
      );
    }
    return lines.join('\n');
  }

  function buildMissionLabCsvText() {
    const records = getMissionLabRecords({ newestFirst: false });
    const lines = [[
      'Timestamp',
      'Deep Dive ID',
      'Source',
      'Student',
      'Word',
      'Topic',
      'Grade',
      'Thinking Level',
      'Score Band',
      'Deep Dive Score',
      'Clarity',
      'Evidence',
      'Vocabulary',
      'Completed',
      'On Time',
      'Seconds Left',
      'Listen Complete',
      'Analyze Complete',
      'Create Complete',
      'Analyze Response',
      'Create Response'
    ]];
    if (!records.length) {
      lines.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'No Deep Dive records yet.', '']);
      return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
    }
    records.forEach((record) => {
      const tasks = record?.tasks || {};
      lines.push([
        new Date(Number(record?.ts) || Date.now()).toLocaleString(),
        String(record?.attemptId || ''),
        String(record?.source || ''),
        String(record?.student || ''),
        String(record?.word || ''),
        String(record?.topic || ''),
        String(record?.grade || ''),
        String(record?.level || ''),
        String(record?.scoreBand || ''),
        String(Math.max(0, Number(record?.score) || 0)),
        String(Math.max(0, Number(record?.clarity) || 0)),
        String(Math.max(0, Number(record?.evidence) || 0)),
        String(Math.max(0, Number(record?.vocabulary) || 0)),
        record?.completed ? 'yes' : 'no',
        record?.onTime ? 'yes' : 'no',
        String(Math.max(0, Number(record?.secondsLeft) || 0)),
        tasks.listen ? 'yes' : 'no',
        tasks.analyze ? 'yes' : 'no',
        tasks.create ? 'yes' : 'no',
        String(record?.analyze || ''),
        String(record?.create || '')
      ]);
    });
    return lines.map((line) => line.map(csvEscapeCell).join(',')).join('\n');
  }

  function downloadClassRollupCsv() {
    const prefix = buildCsvBundlePrefix();
    const filename = `${prefix}-class-rollup.csv`;
    if (downloadTextFile(filename, buildClassRollupCsvText(), 'text/csv;charset=utf-8')) {
      WQUI.showToast('Class rollup CSV download started.');
      return;
    }
    WQUI.showToast('Could not start class rollup download on this device.');
  }

  function downloadCsvBundle() {
    const prefix = buildCsvBundlePrefix();
    const files = [
      { name: `${prefix}-session-summary.csv`, content: buildSessionSummaryCsvText() },
      { name: `${prefix}-mastery.csv`, content: buildMasteryReportCsvText() },
      { name: `${prefix}-probe.csv`, content: buildProbeSummaryCsvText() },
      { name: `${prefix}-class-rollup.csv`, content: buildClassRollupCsvText() },
      { name: `${prefix}-deep-dive.csv`, content: buildMissionLabCsvText() }
    ];
    const started = files.reduce((count, file) => (
      count + (downloadTextFile(file.name, file.content, 'text/csv;charset=utf-8') ? 1 : 0)
    ), 0);
    if (started === files.length) {
      WQUI.showToast(`CSV bundle download started (${files.length} files).`);
      return;
    }
    if (started > 0) {
      WQUI.showToast(`CSV bundle partially downloaded (${started}/${files.length}).`);
      return;
    }
    WQUI.showToast('Could not start CSV bundle download on this device.');
  }

  async function copySessionSummary() {
    await copyTextToClipboard(
      buildSessionSummaryText(),
      'Session summary copied.',
      'Could not copy summary on this device.'
    );
  }

  function buildSessionOutcomesSummaryText() {
    const rounds = Math.max(0, Number(sessionSummary.rounds) || 0);
    const masteryRows = getSortedMasteryRows();
    const topSkill = masteryRows[0] || null;
    const generatedAt = new Date().toLocaleString();
    const focusValue = String(_el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus || 'all').trim() || 'all';
    const focusLabel = getFocusLabel(focusValue).replace(/[—]/g, '').replace(/\s+/g, ' ').trim() || 'Classic';
    const presetId = detectTeacherPreset();
    const presetBtn = presetId ? document.querySelector(`[data-teacher-preset="${presetId}"]`) : null;
    const presetLabel = presetBtn instanceof HTMLElement
      ? String(presetBtn.textContent || '').replace(/\s+/g, ' ').trim()
      : 'Custom';
    const missionStats = buildMissionSummaryStats({
      sessionOnly: true,
      student: getActiveStudentLabel() === 'Class' ? '' : getActiveStudentLabel()
    });
    const trend = getComparableProbeTrend(getActiveStudentLabel());
    const hasTrend = Boolean(trend.current && trend.previous && trend.current.roundsDone > 0 && trend.previous.roundsDone > 0);
    const trendLabel = hasTrend
      ? `Accuracy ${formatSignedDelta((trend.current.accuracyRate - trend.previous.accuracyRate) * 100, 0)} pts, Avg guesses ${formatSignedDelta(trend.current.avgGuesses - trend.previous.avgGuesses)}`
      : 'Not enough probe trend data yet.';
    const startedAt = new Date(sessionSummary.startedAt || Date.now()).toLocaleString();
    return [
      `Session outcomes (${startedAt})`,
      `Timestamp: ${generatedAt}`,
      `Active focus: ${focusLabel}`,
      `Active preset: ${presetLabel}`,
      `Attempts: ${rounds}`,
      `Mastery trend: ${topSkill ? `${topSkill.label} at ${topSkill.accuracyLabel} across ${topSkill.attempts} attempts` : 'No mastery rows yet.'}`,
      `Probe trend: ${trendLabel}`,
      `Deep Dive completion: ${missionStats.count ? `${Math.round(missionStats.completionRate * 100)}% (${missionStats.completedCount}/${missionStats.count})` : '--'}`
    ].join('\n');
  }

  async function copySessionOutcomesSummary() {
    await copyTextToClipboard(
      buildSessionOutcomesSummaryText(),
      'Session outcomes copied.',
      'Could not copy session outcomes on this device.'
    );
  }

  async function copyMasterySummary() {
    await copyTextToClipboard(
      buildMasteryReportText(),
      'Mastery report copied.',
      'Could not copy mastery report on this device.'
    );
  }

  async function copyMasterySummaryCsv() {
    await copyTextToClipboard(
      buildMasteryReportCsvText(),
      'Mastery CSV copied.',
      'Could not copy mastery CSV on this device.'
    );
  }

  async function copyMissionSummary() {
    await copyTextToClipboard(
      buildMissionSummaryText(),
      'Deep Dive summary copied.',
      'Could not copy Deep Dive summary on this device.'
    );
  }

  async function copyMissionSummaryCsv() {
    await copyTextToClipboard(
      buildMissionLabCsvText(),
      'Deep Dive CSV copied.',
      'Could not copy Deep Dive CSV on this device.'
    );
  }

  async function copyProbeSummary() {
    await copyTextToClipboard(
      buildProbeSummaryText(),
      'Probe summary copied.',
      'Could not copy probe summary on this device.'
    );
  }

  async function copyProbeSummaryCsv() {
    await copyTextToClipboard(
      buildProbeSummaryCsvText(),
      'Probe CSV copied.',
      'Could not copy probe CSV on this device.'
    );
  }

  async function copyMtssIepNote() {
    await copyTextToClipboard(
      buildMtssIepNoteText(),
      'MTSS/IEP note copied.',
      'Could not copy MTSS/IEP note on this device.'
    );
  }

  async function copyMiniLessonPlan() {
    const key = getMiniLessonKeyFromSession();
    await copyTextToClipboard(
      buildMiniLessonPlanText(key),
      'Mini-lesson plan copied.',
      'Could not copy mini-lesson plan on this device.'
    );
  }

  async function copyFamilyHandout() {
    await copyTextToClipboard(
      buildFamilyHandoutText(),
      'Family handout copied.',
      'Could not copy family handout on this device.'
    );
  }

  function downloadFamilyHandout() {
    const prefix = buildCsvBundlePrefix();
    const filename = `${prefix}-family-handout.txt`;
    if (downloadTextFile(filename, buildFamilyHandoutText(), 'text/plain;charset=utf-8')) {
      WQUI.showToast('Family handout download started.');
      return;
    }
    WQUI.showToast('Could not start family handout download on this device.');
  }

  function resetSessionSummary() {
    sessionSummary = {
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
    saveSessionSummaryState();
    renderSessionSummary();
    renderProbePanel();
  }

  const QUEST_LOOP_KEY = 'wq_v2_quest_loop_v1';
  const QUEST_TIERS = Object.freeze([
    Object.freeze({ id: 'rookie',  label: 'Rookie',  minXp: 0,   reward: 'Bronze chest unlocked' }),
    Object.freeze({ id: 'allstar', label: 'All-Star', minXp: 220, reward: 'Silver spotlight unlocked' }),
    Object.freeze({ id: 'legend',  label: 'Legend',  minXp: 520, reward: 'Gold crown unlocked' })
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
      const parsed = JSON.parse(localStorage.getItem(QUEST_LOOP_KEY) || 'null');
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
      localStorage.setItem(QUEST_LOOP_KEY, JSON.stringify(state));
    } catch {}
  }

  function getQuestTierProgress(xpValue) {
    const xp = Math.max(0, Number(xpValue) || 0);
    const tier = resolveQuestTier(xp);
    const tierIndex = QUEST_TIERS.findIndex((item) => item.id === tier.id);
    const nextTier = QUEST_TIERS[tierIndex + 1] || null;
    if (!nextTier) {
      return { percent: 100, nextTier: null, remainingXp: 0 };
    }
    const span = Math.max(1, nextTier.minXp - tier.minXp);
    const progressed = Math.max(0, Math.min(span, xp - tier.minXp));
    const percent = Math.round((progressed / span) * 100);
    return {
      percent,
      nextTier,
      remainingXp: Math.max(0, nextTier.minXp - xp)
    };
  }

  function renderQuestLoop(state) {
    const tier = resolveQuestTier(state.xp);
    const progress = getQuestTierProgress(state.xp);

    const tierChip = _el('quest-tier-chip');
    const xpLabel = _el('quest-xp');
    const streakLabel = _el('quest-streak');
    const progressEl = _el('quest-progress');
    const progressFill = _el('quest-progress-fill');
    const nextLabel = _el('quest-next');

    if (tierChip) tierChip.textContent = `Tier: ${tier.label}`;
    if (xpLabel) xpLabel.textContent = `${state.xp} XP`;
    if (streakLabel) {
      const suffix = state.dailyStreak === 1 ? 'day' : 'days';
      streakLabel.textContent = `Streak: ${state.dailyStreak} ${suffix}`;
    }

    if (progressFill) {
      progressFill.style.width = `${progress.percent}%`;
    }
    if (progressEl) {
      progressEl.setAttribute('aria-valuenow', String(progress.percent));
      progressEl.setAttribute(
        'aria-valuetext',
        progress.nextTier
          ? `${progress.percent}% to ${progress.nextTier.label}`
          : 'Top tier complete'
      );
    }

    if (nextLabel) {
      nextLabel.textContent = progress.nextTier
        ? `Next reward: ${progress.nextTier.reward} in ${progress.remainingXp} XP.`
        : `Top reward unlocked: ${tier.reward}.`;
    }

    document.querySelectorAll('#quest-track .quest-node').forEach((node) => {
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
    const probeSelect = _el('s-probe-rounds');
    if (probeSelect) {
      const normalized = normalizeProbeRounds(prefs.probeRounds || DEFAULT_PREFS.probeRounds);
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
    const maxGuesses = Math.max(1, Number(WQGame.getState()?.maxGuesses || parseInt(DEFAULT_PREFS.guesses, 10) || 6));
    const guessesUsed = Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : maxGuesses);

    let streakIncreased = false;
    if (result?.won) {
      const today = localDayKey();
      if (state.lastWinDay !== today) {
        state.dailyStreak = isConsecutiveDay(state.lastWinDay, today) ? state.dailyStreak + 1 : 1;
        state.lastWinDay = today;
        streakIncreased = true;
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
  }

  function getActiveSignalStudentId() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const fromQuery = String(params.get('student') || params.get('studentId') || '').trim();
      if (fromQuery) return fromQuery;
    } catch {}
    try {
      const fromStorage = String(localStorage.getItem('cs_active_student_id') || '').trim();
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
    const btn = _el('wq-share-result-btn');
    const bundleBtn = _el('wq-share-bundle-btn');
    if (!btn && !bundleBtn) return;
    const show = !!sessionId && !DEMO_MODE;
    if (btn) {
      btn.classList.toggle('hidden', !show);
      btn.dataset.sessionId = show ? String(sessionId) : '';
    }
    if (bundleBtn) bundleBtn.classList.toggle('hidden', !show);
  }

  async function shareWordQuestSessionById(sessionId) {
    const id = String(sessionId || '').trim();
    if (!id || !window.CSCornerstoneStore || typeof window.CSCornerstoneStore.listSessions !== 'function') return;
    const sessions = window.CSCornerstoneStore.listSessions({});
    const row = sessions.find((session) => String(session?.sessionId || '') === id);
    if (!row) return;
    const filename = `cornerstone-session-${id}.json`;
    const json = JSON.stringify(row, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const file = typeof File !== 'undefined'
      ? new File([blob], filename, { type: 'application/json' })
      : null;
    try {
      if (navigator.share) {
        const payload = file ? { files: [file], title: 'Cornerstone Session', text: 'Cornerstone MTSS session export' } : { title: 'Cornerstone Session', text: json };
        await navigator.share(payload);
        WQUI.showToast('Session shared.');
        return;
      }
    } catch (_e) {}
    if (window.CSCornerstoneStore && typeof window.CSCornerstoneStore.downloadBlob === 'function') {
      window.CSCornerstoneStore.downloadBlob(blob, filename);
      WQUI.showToast('Session file downloaded.');
    }
  }

  async function shareWordQuestBundle() {
    if (!window.CSCornerstoneStore) return;
    const studentCode = typeof window.CSCornerstoneStore.getStudentCode === 'function'
      ? window.CSCornerstoneStore.getStudentCode()
      : null;
    const blob = window.CSCornerstoneStore.exportSessions({ studentCode: studentCode || undefined });
    const suffix = studentCode ? String(studentCode).toLowerCase() : 'device';
    const filename = `cornerstone-sessions-${suffix}.json`;
    const file = typeof File !== 'undefined'
      ? new File([blob], filename, { type: 'application/json' })
      : null;
    try {
      if (navigator.share && file) {
        await navigator.share({
          files: [file],
          title: 'Cornerstone Sessions',
          text: 'Cornerstone MTSS session bundle'
        });
        WQUI.showToast('Session bundle shared.');
        return;
      }
    } catch (_e) {}
    if (typeof window.CSCornerstoneStore.downloadBlob === 'function') {
      window.CSCornerstoneStore.downloadBlob(blob, filename);
      WQUI.showToast('Session bundle downloaded.');
    }
  }

  function persistWordQuestCornerstoneSession(signals, meta) {
    if (!window.CSCornerstoneSignals || !window.CSCornerstoneStore) return null;
    const studentCode = typeof window.CSCornerstoneStore.getStudentCode === 'function'
      ? window.CSCornerstoneStore.getStudentCode()
      : null;
    const tier = Number(signals.updateRespect || 0) < 0.55 || Number(signals.repetitionPenalty || 0) > 0.18 ? 'tier3' : 'tier2';
    const repeatRate = Number(signals.repetitionPenalty || 0);
    const session = window.CSCornerstoneSignals.normalizeSignal({
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
    const saved = window.CSCornerstoneStore.appendSession(session);
    return saved || null;
  }

  function publishWordQuestSignals(signals, meta) {
    const isDemo = DEMO_MODE || (new URLSearchParams(location.search)).get('demo') === '1';
    if (isDemo || !signals || typeof signals !== 'object') return;
    const studentId = getActiveSignalStudentId() || 'demo-student';
    const payloadMeta = meta && typeof meta === 'object' ? meta : {};

    try {
      if (window.CSAnalyticsEngine && typeof window.CSAnalyticsEngine.appendWordQuestSignals === 'function') {
        window.CSAnalyticsEngine.appendWordQuestSignals(signals, {
          ...payloadMeta,
          studentId
        });
      } else {
        const key = 'cs_progress_history';
        const raw = localStorage.getItem(key);
        const obj = raw ? JSON.parse(raw) : {};
        obj.wordQuestSignals = Array.isArray(obj.wordQuestSignals) ? obj.wordQuestSignals : [];
        const guessCount = Math.max(0, Number(signals.guesses || 0));
        const timeToFirstGuess = Math.max(0, Number(signals.timeToFirstGuessSec || 0));
        const patternAdherence = Math.max(0, Math.min(1, Number(signals.updateRespect || 0)));
        const repeatedInvalidLetterPlacementCount = Math.max(0, Math.round((1 - patternAdherence) * guessCount));
        const vowelSwapRate = guessCount > 0 ? Math.max(0, Math.min(1, Number(signals.uniqueVowels || 0) / guessCount)) : 0;
        const clueUtilization = payloadMeta.helpUsed ? 0.8 : 0.25;
        const decodingScore = Math.round(patternAdherence * 100);
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
        localStorage.setItem(key, JSON.stringify(obj));
      }
    } catch {}

    try {
      const guessCount = Math.max(0, Number(signals.guesses || 0));
      const timeToFirstGuess = Math.max(0, Number(signals.timeToFirstGuessSec || 0));
      const patternAdherence = Math.max(0, Math.min(1, Number(signals.updateRespect || 0)));
      const repeatedInvalidLetterPlacementCount = Math.max(0, Math.round((1 - patternAdherence) * guessCount));
      const vowelSwapCount = Math.max(0, Number(signals.uniqueVowels || 0));
      const clueUseScore = payloadMeta.helpUsed ? 0.8 : 0.25;
      if (window.CSEvidence && typeof window.CSEvidence.appendSession === 'function') {
        window.CSEvidence.appendSession(studentId, 'wordquest', {
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
      if (window.CSEvidence && typeof window.CSEvidence.addSession === 'function') {
        const durationSec = Math.max(0, Number(signals.durSec || 0));
        const avgGuessLatencyMs = guessCount > 0 ? Math.round((durationSec * 1000) / guessCount) : 0;
        const misplaceRate = Math.max(0, Math.min(1, Number(signals.repetitionPenalty || 0) * 1.2));
        const absentRate = Math.max(0, Math.min(1, 1 - patternAdherence));
        window.CSEvidence.addSession(studentId, {
          id: _activeEvidenceSessionId || undefined,
          createdAt: new Date().toISOString(),
          activity: 'wordquest',
          durationSec: durationSec,
          signals: {
            guessCount: guessCount,
            avgGuessLatencyMs: avgGuessLatencyMs,
            misplaceRate: Number(misplaceRate.toFixed(3)),
            absentRate: Number(absentRate.toFixed(3)),
            repeatSameBadSlotCount: repeatedInvalidLetterPlacementCount,
            vowelSwapCount: vowelSwapCount,
            constraintViolations: repeatedInvalidLetterPlacementCount
          },
          outcomes: {
            solved: !!signals.solved,
            attemptsUsed: Math.max(0, Number(signals.guesses || 0))
          }
        });
      }
      if (window.CSSupportStore && typeof window.CSSupportStore.addEvidencePoint === 'function') {
        window.CSSupportStore.addEvidencePoint(studentId, {
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
        window.CSSkillMapper &&
        typeof window.CSSkillMapper.mapWQSignalsToSkillEvidence === 'function' &&
        window.CSEvidence &&
        typeof window.CSEvidence.applySkillEvidence === 'function'
      ) {
        const evidencePatch = window.CSSkillMapper.mapWQSignalsToSkillEvidence({
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
          window.CSEvidence.applySkillEvidence(studentId, evidencePatch);
        }
      }
    } catch {}

    try {
      if (window.CSCornerstoneEngine && typeof window.CSCornerstoneEngine.appendSignal === 'function') {
        window.CSCornerstoneEngine.appendSignal(signals, {
          module: 'wordquest',
          studentId
        });
      }
    } catch {}

    try {
      const savedSession = persistWordQuestCornerstoneSession(signals, meta);
      if (savedSession?.sessionId) {
        _latestSavedSessionId = String(savedSession.sessionId);
        updateWordQuestShareButton(_latestSavedSessionId);
      }
    } catch {}
  }

  function newGame(options = {}) {
    if (DEMO_MODE && demoRoundComplete && !options.forceDemoReplay) {
      showDemoEndOverlay();
      return;
    }
    if (DEMO_MODE) {
      closeDemoEndOverlay();
      if (options.forceDemoReplay) resetDemoScriptState();
    }
    setWordQuestCoachState('before_guess');
    emitTelemetry('wq_new_word_click', {
      source: options.launchMissionLab ? 'mission_lab_new' : 'wordquest_new'
    });
    focusSupportUnlockedByMiss = false;
    focusSupportUnlockAt = Date.now() + 20000;
    currentRoundSupportPromptShown = false;
    gameStartedAt = Date.now();
    focusSupportEligibleAt = gameStartedAt + 30000;  // Show help only after 30 seconds
    clearSupportModalTimer();  // Clear any existing support modal timer from previous round
    scheduleFocusSupportUnlock();
    hideInformantHintCard();
    hideStarterWordCard();
    hideSupportChoiceCard();
    closeRevealChallengeModal({ silent: true });
    clearClassroomTurnTimer();
    resetRoundTracking();
    _activeEvidenceSessionId = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    if (firstRunSetupPending && !_el('first-run-setup-modal')?.classList.contains('hidden')) {
      WQUI.showToast('Pick a setup style or skip for now.');
      return;
    }
    if (isMissionLabStandaloneMode()) {
      if (options.launchMissionLab === false) {
        refreshStandaloneMissionLabHub();
        return;
      }
      startStandaloneMissionLab();
      return;
    }
    if (
      getVoicePracticeMode() === 'required' &&
      !(_el('modal-overlay')?.classList.contains('hidden')) &&
      !voiceTakeComplete
    ) {
      WQUI.showToast('Record your voice before starting the next word.');
      return;
    }
    clearRevealAutoAdvanceTimer();
    cancelRevealNarration();
    stopVoiceCaptureNow();
    if (voicePreviewAudio) {
      voicePreviewAudio.pause();
      voicePreviewAudio = null;
    }
    clearVoiceClip();
    voiceTakeComplete = false;
    drawWaveform();
    hideMidgameBoost();
    midgameBoostShown = false;
    if (_wqDiagTimer) {
      clearTimeout(_wqDiagTimer);
      _wqDiagTimer = null;
    }
    _wqDiagSession = null;
    _latestSavedSessionId = '';
    updateWordQuestShareButton('');
    avaWqIdleFiredThisRound = false;
    avaWqLastActionAt = Date.now();
    avaWqLastIdleEmitAt = 0;

    const s = WQUI.getSettings();
    if (DEMO_MODE) {
      s.length = '5';
      s.maxGuesses = 6;
      s.focus = 'all';
    }
    const focus = DEMO_MODE ? 'all' : (_el('setting-focus')?.value || prefs.focus || 'all');
    const effectiveGradeBand = getEffectiveGameplayGradeBand(s.gradeBand || 'all', focus);
    const playableSet = buildPlayableWordSet(effectiveGradeBand, s.length, focus);

    const result = WQGame.startGame({
      ...s,
      gradeBand: effectiveGradeBand,
      focus,
      phonics: focus,
      fixedWord: DEMO_MODE ? DEMO_TARGET_WORD : '',
      disableProgress: DEMO_MODE
    });
    if (!result) {
      const startError = typeof WQGame.getLastStartError === 'function'
        ? WQGame.getLastStartError()
        : null;
      if (startError?.code === 'EMPTY_FILTERED_POOL') {
        const pieces = [];
        if (startError.gradeBand && startError.gradeBand !== 'all') pieces.push(`grade ${startError.gradeBand}`);
        if (startError.phonics && startError.phonics !== 'all') pieces.push(`focus ${getFocusLabel(startError.phonics)}`);
        if (startError.length && startError.length !== 'any') pieces.push(`${startError.length}-letter words`);
        const detail = pieces.length ? ` for ${pieces.join(', ')}` : '';
        WQUI.showToast(`No words available${detail}. Adjust filters or pick Classic.`);
      } else {
        WQUI.showToast('No words found — try Classic focus or adjust filters');
      }
      updateNextActionLine({ dueCount: countDueReviewWords(playableSet) });
      syncHeaderClueLauncherUI();
      syncStarterWordLauncherUI();
      syncClassroomTurnRuntime({ resetTurn: true });
      syncAssessmentLockRuntime();
      return;
    }
    resetRoundTracking(result);
    const startedWord = normalizeReviewWord(result.word);
    const matchedDueReview = reviewQueueState.items.find((item) => (
      item.word === startedWord &&
      item.dueRound <= reviewQueueState.round
    )) || null;
    if (matchedDueReview) consumeReviewItem(matchedDueReview);
    WQUI.calcLayout(result.wordLength, result.maxGuesses);
    WQUI.buildBoard(result.wordLength, result.maxGuesses);
    WQUI.buildKeyboard();
    syncKeyboardInputLocks(WQGame.getState?.() || {});
    WQUI.hideModal();
    _el('new-game-btn')?.classList.remove('pulse');
    _el('settings-panel')?.classList.add('hidden');
    syncClassroomTurnRuntime({ resetTurn: true });
    syncHeaderControlsVisibility();
    removeDupeToast();
    updateVoicePracticePanel(WQGame.getState());
    updateFocusHint();
    updateNextActionLine({ dueCount: countDueReviewWords(playableSet) });
    syncHeaderClueLauncherUI();
    syncStarterWordLauncherUI();
    scheduleStarterCoachHint();
    syncAssessmentLockRuntime();
    startAvaWordQuestIdleWatcher();
    try {
      if (window.CSWQDiagnostics && typeof window.CSWQDiagnostics.createSession === 'function') {
        _wqDiagSession = window.CSWQDiagnostics.createSession(result.wordLength || 5);
        _wqDiagTimer = setTimeout(() => {
          if (_wqDiagSession && !_wqDiagSession.endedAtMs) {
            const softSignals = window.CSWQDiagnostics.endSession(_wqDiagSession, false);
            _wqDiagSession = null;
            if (softSignals) publishWordQuestSignals(softSignals, { soft: true });
          }
        }, 90000);
      }
    } catch {}
    if (DEMO_MODE) runDemoCoachForStart();
    if (!DEMO_MODE) positionDemoLaunchButton();
    // Auto-focus game board so students can start typing immediately
    const gameBoard = _el('game-board');
    if (gameBoard && typeof gameBoard.focus === 'function') {
      setTimeout(() => gameBoard.focus(), 50);
    }
  }

  const reflowLayout = () => {
    const s = WQGame.getState();
    if (s?.word) WQUI.calcLayout(s.wordLength, s.maxGuesses);
    if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
      positionHintClueCard();
    }
    if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
      positionStarterWordCard();
    }
    if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
      positionSupportChoiceCard();
    }
    logOverflowDiagnostics('reflowLayout');
  };
  function initGame() {
    // Game initialization happens on-demand via newGame()
    // Wire up event listeners and game state helpers
    window.addEventListener('resize', reflowLayout);
    window.visualViewport?.addEventListener('resize', reflowLayout);
    window.addEventListener('beforeunload', () => {
      stopAvaWordQuestIdleWatcher('beforeunload');
      stopDemoToastProgress();
      if (_wqDiagTimer) {
        clearTimeout(_wqDiagTimer);
        _wqDiagTimer = null;
      }
      emitTelemetry('wq_session_end', {
        duration_ms: Math.max(0, Date.now() - telemetrySessionStartedAt),
        reason: 'beforeunload'
      });
      stopVoiceCaptureNow();
      clearClassroomTurnTimer();
      finishWeeklyProbe({ silent: true });
    });
  }

export { initGame, newGame, resetRoundTracking, buildRoundMetrics, getTopErrorKey, copyTextToClipboard, showMidgameBoost, hideMidgameBoost, maybeShowErrorCoach };
