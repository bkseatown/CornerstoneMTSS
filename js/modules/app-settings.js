/**
 * app-settings.js
 * Settings panel, review queue, team mode, voice, home navigation
 */

import { prefs, normalizeMasterySort, normalizeMasteryFilter } from './app-prefs.js';
import { DEFAULT_PREFS, REVIEW_QUEUE_KEY, REVIEW_QUEUE_MAX_ITEMS, TEACHER_ASSIGNMENTS_CONTRACT, MISSION_LAB_ENABLED, DEMO_MODE, WRITING_STUDIO_ENABLED, MIDGAME_BOOST_ENABLED } from './app-constants.js';
import { getEffectiveGameplayGradeBand, shouldExpandGradeBandForFocus, normalizeLessonPackId, normalizeLessonTargetId, getLessonPackDefinition, getLessonTarget, getCurriculumTargetsForGrade } from './app-focus.js';
import { getTopErrorKey } from './app-game.js';

// DOM helper
const _el = id => document.getElementById(id);

// Module state
let pageMode = 'wordquest';

// Local page mode utilities (extracted from app-prefs)
const PAGE_MODE_KEY = 'wordquest_page_mode_v1';
function isMissionLabEnabled() {
  return MISSION_LAB_ENABLED;
}
function normalizePageMode(mode) {
  if (!isMissionLabEnabled()) return 'wordquest';
  return String(mode || '').trim().toLowerCase() === 'mission-lab'
    ? 'mission-lab'
    : 'wordquest';
}
function persistPageMode(mode) {
  try { localStorage.setItem(PAGE_MODE_KEY, normalizePageMode(mode)); } catch {}
}

// Coach ribbon state and runtime variables
let homeCoachRibbon = null;
let wordQuestCoachRibbon = null;
let homeMode = 'home';
let wordQuestCoachKey = 'before_guess';
let firstRunSetupPending = false;
let focusSupportUnlockAt = 0;
let focusSupportUnlockTimer = 0;
let currentRoundSupportPromptShown = false;
let supportModalTimer = 0;

// Dev mode detection
function isDevModeEnabled() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    if (String(params.get('env') || '').toLowerCase() === 'dev') return true;
  } catch {}
  try {
    return localStorage.getItem('cs_allow_dev') === '1';
  } catch {
    return false;
  }
}

// Diagnostic functions (stubs - full implementations in app.js)
function logOverflowDiagnostics(tag) {
  // Dev-only logging; stub here
  if (!isDevModeEnabled()) return;
}

function assertHomeNoScrollDev() {
  // Dev-only assertion; stub here
  if (!isDevModeEnabled()) return;
}

// Utility functions from app-prefs
function setHoverNoteForElement(el, note) {
  if (!el) return;
  const text = String(note || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    el.removeAttribute('data-hover-note');
    return;
  }
  el.setAttribute('data-hover-note', text);
  if (el.hasAttribute('title')) el.removeAttribute('title');
}

function deriveWordState(state) {
  const guess = String(state?.guess || '').toUpperCase();
  const word = String(state?.word || '').toUpperCase();
  const wordLength = Number(state?.wordLength || 0) || 5;
  const result = [];
  for (let i = 0; i < wordLength; i += 1) {
    const letter = guess[i] || '';
    if (letter === '') {
      result[i] = 'empty';
    } else if (letter === word[i]) {
      result[i] = 'correct';
    } else if (word.includes(letter)) {
      result[i] = 'present';
    } else {
      result[i] = 'absent';
    }
  }
  return result;
}

// UI sync stubs - these control layout and positioning
function syncPlayHeaderCopy() {}
function updateFocusHint() {}
function updateFocusSummaryLabel() {}
function updateGradeTargetInline() {}
function positionHintClueCard() {}
function positionStarterWordCard() {}
function positionSupportChoiceCard() {}
function enableDraggableSupportChoiceCard() {}
function bindSettingsModeCard() {}
function bindFirstRunSetupModal() {}
function openFirstRunSetupModal() {}
function applyTeacherPreset() {}
function syncTeacherPresetButton() {}
function syncTeacherPresetButtons() {}
function syncAssessmentLockRuntime() {}
function syncStarterWordLauncherUI() {}
function syncGameplayAudioStrip() {}
function syncMusicModeButton() {}
function syncVoiceModeButton() {}
function updateMusicStatus() {}
function syncMediaSessionControls() {}
function bindSettingsModeCards() {}
function initRefreshLatestBanner() {}
function positionQuickPopoverOrContextMenu() {}
function buildCurrentCurriculumSnapshot() {
  return {};
}
function buildRoundMetrics() {
  return {};
}

// Student/classroom utility stubs
function getActiveStudentLabel() {
  return 'Student';
}

function getCurrentTeamLabel() {
  return 'Team';
}

// Global event bus (fallback if not defined elsewhere)
const EVENT_BUS_EVENTS = window.EVENT_BUS_EVENTS || {
  teacherPanelToggle: 'wq:teacher-panel-toggle',
  openTeacherHub: 'wq:open-teacher-hub'
};

// Assessment lock utilities (from app-theme)
function isAssessmentLockEnabled() {
  const toggle = _el('s-assessment-lock');
  if (toggle) return !!toggle.checked;
  return (prefs.assessmentLock || DEFAULT_PREFS.assessmentLock) === 'on';
}

function isAssessmentRoundLocked() {
  if (!isAssessmentLockEnabled()) return false;
  const state = WQGame?.getState?.();
  return Boolean(state?.word && !state?.gameOver);
}

// Play style normalization (from app-theme)
function normalizePlayStyle(mode) {
  return String(mode || '').toLowerCase() === 'listening' ? 'listening' : 'detective';
}

// Feature enablement checks (from app-theme)
function isConfidenceCoachingEnabled() {
  const toggle = _el('s-confidence-coaching');
  if (toggle) return !!toggle.checked;
  return String(prefs.confidenceCoaching || DEFAULT_PREFS.confidenceCoaching).toLowerCase() !== 'off';
}

function isMeaningPlusFunEnabled() {
  const toggle = _el('s-meaning-plus-fun');
  if (toggle) return !!toggle.checked;
  return String(prefs.meaningPlusFun || DEFAULT_PREFS.meaningPlusFun).toLowerCase() !== 'off';
}

function isSorNotationEnabled() {
  const toggle = _el('s-sor-notation');
  if (toggle) return !!toggle.checked;
  return String(prefs.sorNotation || DEFAULT_PREFS.sorNotation).toLowerCase() !== 'off';
}

// Team/classroom normalization (from app-prefs)
function normalizeTeamMode(mode) {
  return String(mode || '').trim().toLowerCase() === 'on' ? 'on' : 'off';
}

function normalizeTeamCount(count) {
  const num = Number(count) || 0;
  if (num < 1) return 1;
  if (num > 4) return 4;
  return num;
}

function normalizeTeamSet(set) {
  const valid = ['team-a', 'team-b', 'team-c', 'team-d'];
  return valid.includes(String(set || '').toLowerCase()) ? String(set).toLowerCase() : 'team-a';
}

  // ─── 5. Settings panel wiring ───────────────────────
  const SETTINGS_VIEWS = new Set(['quick', 'advanced']);

  function setSettingsView(view, options = {}) {
    const next = SETTINGS_VIEWS.has(view) ? view : 'quick';
    const tabs = Array.from(document.querySelectorAll('#settings-panel [data-settings-tab]'));
    const sections = Array.from(document.querySelectorAll('#settings-panel [data-settings-section]'));

    tabs.forEach((tab) => {
      const active = tab.getAttribute('data-settings-tab') === next;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });

    sections.forEach((section) => {
      const active = section.getAttribute('data-settings-section') === next;
      section.classList.toggle('is-active', active);
      section.hidden = !active;
    });

    if (options.focus) {
      const activeTab = tabs.find((tab) => tab.getAttribute('data-settings-tab') === next);
      if (activeTab && typeof activeTab.focus === 'function') activeTab.focus();
    }
  }

  function normalizeReviewWord(word) {
    return String(word || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  }

  function loadReviewQueueState() {
    const fallback = { round: 0, items: [] };
    try {
      const parsed = JSON.parse(localStorage.getItem(REVIEW_QUEUE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      const round = Math.max(0, Math.floor(Number(parsed.round) || 0));
      const items = Array.isArray(parsed.items)
        ? parsed.items
          .map((item) => ({
            word: normalizeReviewWord(item?.word),
            dueRound: Math.max(1, Math.floor(Number(item?.dueRound) || 0)),
            reason: String(item?.reason || 'review').trim().toLowerCase(),
            createdAt: Math.max(0, Number(item?.createdAt) || Date.now())
          }))
          .filter((item) => item.word && item.dueRound > 0)
        : [];
      return { round, items };
    } catch {
      return fallback;
    }
  }

  var reviewQueueState = loadReviewQueueState();

  function saveReviewQueueState() {
    const cleanedItems = reviewQueueState.items
      .map((item) => ({
        word: normalizeReviewWord(item.word),
        dueRound: Math.max(1, Math.floor(Number(item.dueRound) || 1)),
        reason: String(item.reason || 'review').trim().toLowerCase(),
        createdAt: Math.max(0, Number(item.createdAt) || Date.now())
      }))
      .filter((item) => item.word)
      .sort((a, b) => a.dueRound - b.dueRound || a.createdAt - b.createdAt)
      .slice(0, REVIEW_QUEUE_MAX_ITEMS);
    reviewQueueState = {
      round: Math.max(0, Math.floor(Number(reviewQueueState.round) || 0)),
      items: cleanedItems
    };
    try {
      localStorage.setItem(REVIEW_QUEUE_KEY, JSON.stringify(reviewQueueState));
    } catch {}
  }

  function buildPlayableWordSet(gradeBand, lengthPref, focusValue) {
    const effectiveGradeBand = getEffectiveGameplayGradeBand(gradeBand, focusValue);
    const pool = WQData.getPlayableWords({
      gradeBand: effectiveGradeBand,
      length: lengthPref || 'any',
      phonics: focusValue || 'all',
      includeLowerBands: shouldExpandGradeBandForFocus(focusValue)
    });
    return new Set(pool.map((word) => normalizeReviewWord(word)));
  }

  function countDueReviewWords(playableSet) {
    const due = reviewQueueState.items.filter((item) => item.dueRound <= reviewQueueState.round);
    if (!(playableSet instanceof Set)) return due.length;
    return due.filter((item) => playableSet.has(item.word)).length;
  }

  function peekDueReviewItemForPool(playableSet) {
    if (!(playableSet instanceof Set) || playableSet.size === 0) return null;
    const dueItems = reviewQueueState.items
      .filter((item) => item.dueRound <= reviewQueueState.round && playableSet.has(item.word))
      .sort((a, b) => a.dueRound - b.dueRound || a.createdAt - b.createdAt);
    return dueItems[0] || null;
  }

  function consumeReviewItem(item) {
    if (!item?.word) return;
    const idx = reviewQueueState.items.findIndex((entry) => (
      entry.word === item.word &&
      entry.dueRound === item.dueRound &&
      entry.createdAt === item.createdAt
    ));
    if (idx < 0) return;
    reviewQueueState.items.splice(idx, 1);
    saveReviewQueueState();
  }

  function scheduleReviewWord(word, delays, reason) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord || !Array.isArray(delays) || !delays.length) return;
    const now = Date.now();
    delays.forEach((delay, index) => {
      const dueRound = reviewQueueState.round + Math.max(1, Math.floor(Number(delay) || 1));
      const isDuplicate = reviewQueueState.items.some((item) => (
        item.word === normalizedWord &&
        Math.abs(item.dueRound - dueRound) <= 1
      ));
      if (isDuplicate) return;
      reviewQueueState.items.push({
        word: normalizedWord,
        dueRound,
        reason: String(reason || 'review').toLowerCase(),
        createdAt: now + index
      });
    });
    saveReviewQueueState();
  }

  function trackRoundForReview(result, maxGuessesValue, roundMetrics = {}) {
    const solvedWord = normalizeReviewWord(result?.word);
    if (!solvedWord) return;
    reviewQueueState.round += 1;
    const maxGuesses = Math.max(1, Number(maxGuessesValue) || 6);
    const guessesUsed = Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : maxGuesses);
    const hintRequested = !!roundMetrics.hintRequested;
    const durationMs = Math.max(0, Number(roundMetrics.durationMs) || 0);
    const topError = getTopErrorKey(roundMetrics.errorCounts || {});
    const attachReason = (base) => topError ? `${base}:${topError}` : base;
    if (result?.lost) {
      scheduleReviewWord(solvedWord, [1, 3, 7], attachReason('missed'));
      if (topError === 'vowel_pattern') scheduleReviewWord(solvedWord, [2], 'vowel-pattern');
      if (topError === 'morpheme_ending') scheduleReviewWord(solvedWord, [4], 'morpheme-ending');
      return;
    }
    const hardSolveThreshold = Math.max(4, maxGuesses - 1);
    if (guessesUsed >= hardSolveThreshold) {
      scheduleReviewWord(solvedWord, [3, 6], attachReason('hard'));
      return;
    }
    if (hintRequested) {
      scheduleReviewWord(solvedWord, [4], attachReason('hinted'));
    }
    if (topError === 'vowel_pattern') {
      scheduleReviewWord(solvedWord, [2, 5], 'vowel-pattern');
      return;
    }
    if (topError === 'blend_position') {
      scheduleReviewWord(solvedWord, [3], 'blend-position');
      return;
    }
    if (topError === 'morpheme_ending') {
      scheduleReviewWord(solvedWord, [4, 7], 'morpheme-ending');
      return;
    }
    if (durationMs >= 90000) {
      scheduleReviewWord(solvedWord, [5], 'slow-round');
      return;
    }
    saveReviewQueueState();
  }

  function primeShuffleBagWithWord(scope, word) {
    const normalizedWord = normalizeReviewWord(word);
    if (!scope || !normalizedWord) return;
    const bagKey = `${SHUFFLE_BAG_KEY}:${scope}`;
    let prior = { queue: [], last: '' };
    try {
      const parsed = JSON.parse(localStorage.getItem(bagKey) || 'null');
      if (parsed && Array.isArray(parsed.queue)) prior = parsed;
    } catch {}
    const cleanedQueue = prior.queue
      .map((item) => normalizeReviewWord(item))
      .filter((item) => item && item !== normalizedWord);
    cleanedQueue.push(normalizedWord);
    try {
      localStorage.setItem(bagKey, JSON.stringify({
        queue: cleanedQueue,
        last: normalizeReviewWord(prior.last)
      }));
    } catch {}
  }

  var activeRoundStartedAt = 0;
  var currentRoundHintRequested = false;
  var currentRoundStarterWordsShown = false;
  var currentRoundVoiceAttempts = 0;
  var currentRoundErrorCounts = Object.create(null);
  var currentRoundSkillKey = 'classic';
  var currentRoundSkillLabel = 'Classic mixed practice';
  var blockedLetterToastAt = 0;

  var classroomTurnTimer = 0;
  var classroomTurnEndsAt = 0;
  var classroomTurnRemaining = 0;
  var classroomTeamIndex = 0;

  function isTeamModeEnabled() {
    return normalizeTeamMode(_el('s-team-mode')?.value || prefs.teamMode || DEFAULT_PREFS.teamMode) === 'on';
  }

  function isHelpSuppressedForTeamMode() {
    return isTeamModeEnabled();
  }

  function syncTeamHelpSuppressionUI() {
    const disabled = isHelpSuppressedForTeamMode();
    const helpBtn = _el('focus-help-btn');
    [helpBtn].forEach((button) => {
      if (!button) return;
      button.disabled = disabled || button.disabled;
      button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
      button.classList.toggle('is-locked', button.disabled);
    });
    if (disabled) {
      setHoverNoteForElement(helpBtn, 'Help options are off during team mode.');
    }
  }

  function getTeamCount() {
    return Number.parseInt(
      normalizeTeamCount(_el('s-team-count')?.value || prefs.teamCount || DEFAULT_PREFS.teamCount),
      10
    ) || 2;
  }

  function getTurnTimerSeconds() {
    const mode = normalizeTurnTimer(_el('s-turn-timer')?.value || prefs.turnTimer || DEFAULT_PREFS.turnTimer);
    return mode === 'off' ? 0 : (Number.parseInt(mode, 10) || 0);
  }

  function getTeamSet() {
    return normalizeTeamSet(_el('s-team-set')?.value || prefs.teamSet || DEFAULT_PREFS.teamSet);
  }

  function getCurrentTeamLabel() {
    const count = getTeamCount();
    const index = Math.max(0, Math.min(count - 1, classroomTeamIndex));
    const labels = TEAM_LABEL_SETS[getTeamSet()] || TEAM_LABEL_SETS.mascots;
    return labels[index] || `Team ${index + 1}`;
  }

  function formatTurnClock(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function clearClassroomTurnTimer() {
    if (classroomTurnTimer) {
      clearInterval(classroomTurnTimer);
      classroomTurnTimer = 0;
    }
    classroomTurnEndsAt = 0;
    classroomTurnRemaining = 0;
  }

  function updateClassroomTurnLine() {
    const line = _el('classroom-turn-line');
    if (!line) return;
    const state = WQGame.getState?.() || {};
    const activeRound = Boolean(state.word && !state.gameOver);
    if (!isTeamModeEnabled() || !activeRound) {
      line.textContent = '';
      line.classList.add('hidden');
      line.style.left = '';
      line.style.top = '';
      line.style.transform = '';
      return;
    }
    const seconds = getTurnTimerSeconds();
    const remaining = Math.max(0, classroomTurnRemaining || seconds);
    const teamLabel = getCurrentTeamLabel();
    const urgencyClass = seconds > 0
      ? (remaining <= 10 ? 'is-critical' : (remaining <= 20 ? 'is-warning' : 'is-steady'))
      : 'is-steady';
    const progress = seconds > 0
      ? Math.max(0.06, Math.min(1, remaining / Math.max(1, seconds)))
      : 1;
    line.className = `classroom-turn-line ${urgencyClass}`;
    line.innerHTML = `
      <div class="classroom-turn-badge">
        <div class="classroom-turn-copy">
          <span class="classroom-turn-kicker">Your turn</span>
          <span class="classroom-turn-team">${teamLabel}</span>
        </div>
        <div class="classroom-turn-clock" aria-label="${seconds > 0 ? `${formatTurnClock(remaining)} remaining` : 'Free play'}">
          <span class="classroom-turn-clock-ring" style="--turn-progress:${Math.round(progress * 100)}%"></span>
          <span class="classroom-turn-timer">${seconds > 0 ? formatTurnClock(remaining) : 'GO'}</span>
        </div>
      </div>
    `;
    line.classList.remove('hidden');
    positionClassroomTurnLine();
  }

  function positionClassroomTurnLine() {
    const line = _el('classroom-turn-line');
    if (!(line instanceof HTMLElement) || line.classList.contains('hidden')) return;
    line.style.left = '';
    line.style.top = '';
    line.style.right = '';
    line.style.transform = '';

    const boardZone = document.querySelector('.board-zone');
    const focusBar = document.querySelector('.focus-bar');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const focusRect = focusBar?.getBoundingClientRect?.();
    const topFallback = Math.max(88, Math.round((focusRect?.bottom || 92) + 8));
    const lineRect = line.getBoundingClientRect();
    const desiredTop = Math.max(Math.round((boardRect?.top || topFallback) + 8), topFallback);

    if (!boardRect) {
      line.style.left = '50%';
      line.style.top = `${topFallback}px`;
      line.style.transform = 'translateX(-50%)';
      return;
    }

    if (window.innerWidth < 1180) {
      const centeredLeft = Math.round(boardRect.left + (boardRect.width - lineRect.width) / 2);
      const boardSafeTop = Math.round(boardRect.top - lineRect.height - 8);
      line.style.left = `${Math.max(8, centeredLeft)}px`;
      line.style.top = `${Math.max(84, boardSafeTop)}px`;
      return;
    }

    const gutter = Math.min(28, Math.max(14, Math.round((window.innerWidth - boardRect.right) * 0.22)));
    const roomRight = window.innerWidth - boardRect.right - gutter;
    if (roomRight >= lineRect.width - 8) {
      line.style.left = `${Math.max(8, Math.round(boardRect.right + gutter))}px`;
      line.style.top = `${desiredTop}px`;
      return;
    }

    line.style.left = `${Math.max(8, Math.round(boardRect.left + boardRect.width - lineRect.width))}px`;
    line.style.top = `${Math.max(topFallback, Math.round(boardRect.top - lineRect.height - 12))}px`;
  }

  function reflowGameplayLayoutForTurnLine() {
    const state = WQGame.getState?.() || {};
    if (!state?.wordLength || !state?.maxGuesses || !WQUI || typeof WQUI.calcLayout !== 'function') return;
    WQUI.calcLayout(state.wordLength, state.maxGuesses);
    positionClassroomTurnLine();
  }

  function isKnownAbsentLetter(letter) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return false;
    const keyEl = document.querySelector(`#keyboard .key[data-key="${normalized}"]`);
    if (!keyEl) return false;
    return keyEl.classList.contains('absent')
      && !keyEl.classList.contains('present')
      && !keyEl.classList.contains('correct');
  }

  function pulseBlockedLetterKey(letter) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return;
    const keyEl = document.querySelector(`#keyboard .key[data-key="${normalized}"]`);
    if (!keyEl) return;
    keyEl.classList.remove('dupe-pulse');
    void keyEl.offsetWidth;
    keyEl.classList.add('dupe-pulse');
    setTimeout(() => keyEl.classList.remove('dupe-pulse'), 220);
  }

  function maybeShowBlockedLetterToast(letter) {
    const now = Date.now();
    if (now - blockedLetterToastAt < 700) return;
    blockedLetterToastAt = now;
    const safeLetter = String(letter || '').toUpperCase().slice(0, 1);
    WQUI.showToast(`Nice try. We already tested ${safeLetter}. Pick a different letter.`);
  }

  function getLiveWordState() {
    return deriveWordState(WQGame.getState?.() || {});
  }

  function isSmartKeyLockEnabled() {
    return String(_el('s-smart-key-lock')?.value || prefs.smartKeyLock || DEFAULT_PREFS.smartKeyLock).toLowerCase() === 'on';
  }

  function checkLetterEntryConstraints(letter, state, wordState) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return { ok: true };
    if (!isSmartKeyLockEnabled()) return { ok: true };
    const liveState = state || (WQGame.getState?.() || {});
    const liveWordState = wordState || deriveWordState(liveState);
    const slot = Math.max(0, Number(liveState?.guess?.length || 0));
    const requiredAtSlot = liveWordState.correctPositions?.[slot];
    if (requiredAtSlot && requiredAtSlot !== normalized) {
      return { ok: false, reason: 'locked_position', requiredLetter: requiredAtSlot };
    }
    if (liveWordState.absentLetters?.has(normalized)) {
      return { ok: false, reason: 'absent_letter' };
    }
    const maxCount = Number(liveWordState.maxCounts?.[normalized]);
    if (Number.isFinite(maxCount)) {
      const currentCount = String(liveState?.guess || '').split('').filter((ch) => ch === normalized).length;
      if ((currentCount + 1) > maxCount) {
        return { ok: false, reason: 'max_count', maxCount };
      }
    }
    return { ok: true };
  }

  function maybeShowConstraintToast(check, letter) {
    const now = Date.now();
    if (now - blockedLetterToastAt < 700) return;
    blockedLetterToastAt = now;
    const safeLetter = String(letter || '').toUpperCase().slice(0, 1);
    if (check?.reason === 'locked_position') {
      const must = String(check.requiredLetter || '').toUpperCase().slice(0, 1);
      WQUI.showToast(`Slot is locked. Use ${must} in this position.`);
      return;
    }
    if (check?.reason === 'max_count') {
      const maxCount = Math.max(0, Number(check.maxCount) || 0);
      WQUI.showToast(`${safeLetter} is already used ${maxCount} time${maxCount === 1 ? '' : 's'} here.`);
      return;
    }
    WQUI.showToast(`Nice try. We already tested ${safeLetter}. Pick a different letter.`);
  }

  function syncKeyboardInputLocks(state, wordState) {
    const keyboard = _el('keyboard');
    if (!keyboard) return;
    const liveState = state || (WQGame.getState?.() || {});
    const liveWordState = wordState || deriveWordState(liveState);
    const slot = Math.max(0, Number(liveState?.guess?.length || 0));
    const requiredAtSlot = liveWordState.correctPositions?.[slot] || '';
    keyboard.querySelectorAll('.key[data-key]').forEach((keyEl) => {
      const raw = String(keyEl.getAttribute('data-key') || '').toLowerCase();
      if (!/^[a-z]$/.test(raw)) {
        keyEl.removeAttribute('disabled');
        keyEl.setAttribute('aria-disabled', 'false');
        keyEl.classList.remove('is-blocked');
        return;
      }
      const check = checkLetterEntryConstraints(raw, liveState, liveWordState);
      const blocked = !check.ok;
      keyEl.classList.toggle('is-blocked', blocked);
      keyEl.removeAttribute('disabled');
      keyEl.setAttribute('aria-disabled', 'false');
      if (requiredAtSlot && raw === requiredAtSlot) keyEl.classList.add('in-play');
      const status = String(liveWordState.usedLetters?.[raw] || '').toLowerCase();
      if (status === 'correct') {
        keyEl.classList.remove('present', 'absent');
        keyEl.classList.add('correct');
      } else if (status === 'present') {
        if (!keyEl.classList.contains('correct')) {
          keyEl.classList.remove('absent');
          keyEl.classList.add('present');
        }
      } else if (status === 'absent') {
        if (!keyEl.classList.contains('correct') && !keyEl.classList.contains('present')) {
          keyEl.classList.add('absent');
        }
      }
    });
  }

  function refreshStarterSuggestionsIfOpen() {
    const card = _el('starter-word-card');
    if (!card || card.classList.contains('hidden')) return;
    showStarterWordCard({ source: 'manual' });
  }

  function clearCurrentGuessInput() {
    const state = WQGame.getState?.();
    if (!state?.word || !state.guess) return;
    while ((WQGame.getState?.()?.guess || '').length > 0) {
      WQGame.deleteLetter();
    }
    const next = WQGame.getState?.();
    if (next?.wordLength) {
      WQUI.updateCurrentRow(next.guess, next.wordLength, next.guesses.length);
    }
  }

  function startClassroomTurnClock(options = {}) {
    const resetTurn = Boolean(options.resetTurn);
    if (resetTurn) classroomTeamIndex = 0;
    clearClassroomTurnTimer();

    const state = WQGame.getState?.() || {};
    const activeRound = Boolean(state.word && !state.gameOver);
    if (!isTeamModeEnabled() || !activeRound) {
      updateClassroomTurnLine();
      reflowGameplayLayoutForTurnLine();
      return;
    }

    const seconds = getTurnTimerSeconds();
    if (seconds <= 0) {
      updateClassroomTurnLine();
      reflowGameplayLayoutForTurnLine();
      return;
    }

    classroomTurnRemaining = seconds;
    classroomTurnEndsAt = Date.now() + (seconds * 1000);
    updateClassroomTurnLine();
    reflowGameplayLayoutForTurnLine();

    classroomTurnTimer = setInterval(() => {
      const round = WQGame.getState?.() || {};
      if (!round.word || round.gameOver || !isTeamModeEnabled()) {
        clearClassroomTurnTimer();
        updateClassroomTurnLine();
        reflowGameplayLayoutForTurnLine();
        return;
      }
      const remaining = Math.max(0, Math.ceil((classroomTurnEndsAt - Date.now()) / 1000));
      if (remaining !== classroomTurnRemaining) {
        classroomTurnRemaining = remaining;
        updateClassroomTurnLine();
      }
      if (remaining <= 0) {
        clearClassroomTurnTimer();
        const expiringTeam = getCurrentTeamLabel();
        clearCurrentGuessInput();
        classroomTeamIndex = (classroomTeamIndex + 1) % getTeamCount();
        startClassroomTurnClock();
        WQUI.showToast(`${expiringTeam} ran out of time. ${getCurrentTeamLabel()} is up.`);
      }
    }, 250);
  }

  function advanceTeamTurn() {
    const state = WQGame.getState?.() || {};
    const activeRound = Boolean(state.word && !state.gameOver);
    if (!isTeamModeEnabled() || !activeRound) {
      updateClassroomTurnLine();
      return;
    }
    classroomTeamIndex = (classroomTeamIndex + 1) % getTeamCount();
    startClassroomTurnClock();
  }

  function syncClassroomTurnRuntime(options = {}) {
    startClassroomTurnClock({ resetTurn: !!options.resetTurn });
    syncTeamHelpSuppressionUI();
  }

  function updateNextActionLine(options = {}) {
    const line = _el('next-action-line');
    if (!line) return;
    const reviewWord = normalizeReviewWord(options.reviewWord || '');
    const state = WQGame.getState?.() || {};
    const hasActiveRound = Boolean(state.word && !state.gameOver);
    const guessCount = Array.isArray(state.guesses) ? state.guesses.length : 0;
    const activeGuessLength = String(state.guess || '').length;
    const wordLength = Math.max(1, Number(state.wordLength) || 0);
    const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const dueCount = Math.max(0, Number(options.dueCount) || 0);
    const confidenceOn = isConfidenceCoachingEnabled();
    let text = '';

    if (isMissionLabStandaloneMode()) {
      text = 'Deep Dive standalone: launch a three-step word unpacking round from the panel below.';
    } else if (firstRunSetupPending) {
      text = 'Open the quick how-to card to learn tile colors, then start your first word.';
    } else if (reviewWord) {
      text = `Level-up review: ${reviewWord.toUpperCase()} is back for a quick memory win.`;
    } else if (hasActiveRound && guessCount === 0 && activeGuessLength === 0) {
      if (confidenceOn) {
        text = playStyle === 'listening'
          ? 'Listening mode: tap Listen to Word, then Listen to Definition, then spell what you hear. Use Sound Clue only if stuck.'
          : 'Try one strong word first, then use the tile colors like clues instead of guessing randomly.';
      } else {
        text = playStyle === 'listening'
          ? 'Listening mode: hear the word, check meaning if needed, then spell from sound.'
          : 'Try a first guess, then use tile colors to refine the pattern one letter at a time.';
      }
    } else if (hasActiveRound && guessCount === 0 && activeGuessLength > 0) {
      text = `Build your first test word (${Math.min(activeGuessLength, wordLength)}/${wordLength}), then press Enter.`;
    } else if (hasActiveRound && guessCount === 1 && confidenceOn) {
      text = 'Great first try. Use the color feedback to move one letter at a time.';
    } else if (dueCount > 0) {
      text = `Review words ready: ${dueCount} due word${dueCount === 1 ? '' : 's'} in this focus.`;
    } else if (playStyle === 'listening') {
      text = hasActiveRound
        ? 'Keep spelling from audio. Sound Clue is optional support.'
        : 'Tap Next Word to start listening mode. Goal: hear and spell.';
    } else {
      text = hasActiveRound
        ? 'Keep guessing and use color feedback to narrow the word.'
        : 'Tap Next Word to start. Make your first guess when ready.';
    }

    const showTopLine = firstRunSetupPending;
    line.textContent = showTopLine ? text : '';
    line.classList.toggle('hidden', !showTopLine || !text);
    line.classList.toggle('is-review', Boolean(reviewWord));
    updateClassroomTurnLine();
  }

  function bindSettingsAccordion(sectionSelector) {
    const groups = Array.from(document.querySelectorAll(`${sectionSelector} .settings-group`));
    if (!groups.length) return;
    groups.forEach((group) => {
      group.addEventListener('toggle', () => {
        if (!(group instanceof HTMLDetailsElement) || !group.open) return;
        groups.forEach((other) => {
          if (other === group || !(other instanceof HTMLDetailsElement)) return;
          other.open = false;
        });
      });
    });
  }

  function jumpToSettingsGroup(groupId) {
    const target = _el(groupId);
    if (!(target instanceof HTMLElement)) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function isQuickPopoverAllowed() {
    const panelOpen = !_el('settings-panel')?.classList.contains('hidden');
    const teacherPanelOpen = !_el('teacher-panel')?.classList.contains('hidden');
    const focusOpen = document.documentElement.getAttribute('data-focus-search-open') === 'true';
    return !panelOpen && !teacherPanelOpen && !focusOpen && !isAssessmentRoundLocked();
  }

  function positionQuickPopover(popover, anchorBtn) {
    if (!(popover instanceof HTMLElement) || !(anchorBtn instanceof HTMLElement)) return;
    popover.style.right = 'auto';
    popover.style.left = '-9999px';
    const margin = 8;
    const anchorRect = anchorBtn.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    let left = anchorRect.right - popRect.width;
    left = Math.max(margin, Math.min(left, window.innerWidth - popRect.width - margin));
    let top = anchorRect.bottom + 8;
    if (top + popRect.height > window.innerHeight - margin) {
      top = Math.max(margin, anchorRect.top - popRect.height - 8);
    }
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function syncQuickPopoverPositions() {
    const themePopover = _el('theme-preview-strip');
    const musicPopover = _el('quick-music-strip');
    if (themePopover && !themePopover.classList.contains('hidden')) {
      positionQuickPopover(themePopover, _el('theme-dock-toggle-btn'));
    }
    if (musicPopover && !musicPopover.classList.contains('hidden')) {
      positionQuickPopover(musicPopover, _el('music-dock-toggle-btn'));
    }
  }

  function closeQuickPopover(kind = 'all') {
    const closeTheme = kind === 'all' || kind === 'theme';
    const closeMusic = kind === 'all' || kind === 'music';
    const themePopover = _el('theme-preview-strip');
    const musicPopover = _el('quick-music-strip');
    const themeBtn = _el('theme-dock-toggle-btn');
    const musicBtn = _el('music-dock-toggle-btn');
    if (closeTheme && themePopover) {
      themePopover.classList.add('hidden');
      themePopover.setAttribute('aria-hidden', 'true');
    }
    if (closeMusic && musicPopover) {
      musicPopover.classList.add('hidden');
      musicPopover.setAttribute('aria-hidden', 'true');
    }
    if (closeTheme && themeBtn) {
      themeBtn.classList.remove('is-active');
      themeBtn.setAttribute('aria-expanded', 'false');
    }
    if (closeMusic && musicBtn) {
      musicBtn.classList.remove('is-active');
      musicBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openQuickPopover(kind) {
    if (!isQuickPopoverAllowed()) {
      closeQuickPopover('all');
      return;
    }
    const themePopover = _el('theme-preview-strip');
    const musicPopover = _el('quick-music-strip');
    const themeBtn = _el('theme-dock-toggle-btn');
    const musicBtn = _el('music-dock-toggle-btn');
    if (kind === 'theme' && themePopover) {
      if (musicPopover) {
        musicPopover.classList.add('hidden');
        musicPopover.setAttribute('aria-hidden', 'true');
      }
      if (musicBtn) {
        musicBtn.classList.remove('is-active');
        musicBtn.setAttribute('aria-expanded', 'false');
      }
      themePopover.classList.remove('hidden');
      themePopover.setAttribute('aria-hidden', 'false');
      if (themeBtn) {
        themeBtn.classList.add('is-active');
        themeBtn.setAttribute('aria-expanded', 'true');
        positionQuickPopover(themePopover, themeBtn);
      }
      return;
    }
    if (kind === 'music' && musicPopover) {
      if (themePopover) {
        themePopover.classList.add('hidden');
        themePopover.setAttribute('aria-hidden', 'true');
      }
      if (themeBtn) {
        themeBtn.classList.remove('is-active');
        themeBtn.setAttribute('aria-expanded', 'false');
      }
      musicPopover.classList.remove('hidden');
      musicPopover.setAttribute('aria-hidden', 'false');
      if (musicBtn) {
        musicBtn.classList.add('is-active');
        musicBtn.setAttribute('aria-expanded', 'true');
        positionQuickPopover(musicPopover, musicBtn);
      }
      return;
    }
  }

  function toggleQuickPopover(kind) {
    const popover = kind === 'music'
      ? _el('quick-music-strip')
      : _el('theme-preview-strip');
    if (!popover || popover.classList.contains('hidden')) {
      openQuickPopover(kind);
      return;
    }
    closeQuickPopover(kind);
  }

  function syncThemePreviewStripVisibility() {
    const allowed = isQuickPopoverAllowed();
    const themeBtn = _el('theme-dock-toggle-btn');
    const musicBtn = _el('music-dock-toggle-btn');
    [themeBtn, musicBtn].forEach((btn) => {
      if (!btn) return;
      btn.setAttribute('aria-disabled', allowed ? 'false' : 'true');
    });
    if (!allowed) {
      closeQuickPopover('all');
      return;
    }
    syncQuickPopoverPositions();
  }

  function isMissionLabStandaloneMode() {
    return normalizePageMode(pageMode) === 'mission-lab';
  }

  function isTeacherRoleEnabled() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const role = String(params.get('role') || localStorage.getItem('cs_role') || '').toLowerCase();
      return role === 'teacher' || role === 'admin';
    } catch {
      return false;
    }
  }

  function initCoachRibbons() {
    const ribbonMod = window.CSCoachRibbon;
    if (!ribbonMod || typeof ribbonMod.initCoachRibbon !== 'function') return;
    if (!homeCoachRibbon) {
      const mount = _el('home-coach-ribbon');
      if (mount) {
        homeCoachRibbon = ribbonMod.initCoachRibbon({
          mountEl: mount,
          getMessageFn: () => {
            const toolsVisible = !_el('home-tools-section')?.classList.contains('hidden');
            return {
              key: toolsVisible ? 'home.tools' : 'home.default',
              text: toolsVisible
                ? 'Pick a tool; everything is scaffolded for Tier 2/3.'
                : 'Try a 60-second round to see decoding + feedback.'
            };
          }
        });
      }
    }
    if (!wordQuestCoachRibbon) {
      const mount = _el('wq-coach-ribbon');
      if (mount) {
        wordQuestCoachRibbon = ribbonMod.initCoachRibbon({
          mountEl: mount,
          getMessageFn: () => ({
            key: 'wq.beforeFirstGuess',
            text: ''
          })
        });
      }
    }
  }

  function updateHomeCoachRibbon() {
    if (!homeCoachRibbon || typeof homeCoachRibbon.update !== 'function') return;
    homeCoachRibbon.update({});
  }

  var avaWqWrongStreak = 0;
  var avaWqCorrectStreak = 0;
  var avaWqTotalWrong = 0;
  var avaWqTotalCorrect = 0;
  var avaWqRapidEvents = [];
  var avaWqLastActionAt = Date.now();
  var avaWqLastIdleEmitAt = 0;
  var avaWqIdleTimer = 0;
  var avaWqIdleFiredThisRound = false;

  function logAvaIdleDev(message, detail) {
    if (!isDevModeEnabled()) return;
    try {
      console.debug('[AvaIdle]', message, detail || '');
    } catch {}
  }

  function isPlayMode() {
    return document.documentElement.getAttribute('data-home-mode') === 'play';
  }

  function isWordQuestActiveRound() {
    const state = WQGame.getState ? WQGame.getState() : null;
    if (!state || !state.word || state.gameOver) return false;
    return true;
  }

  function isCoachEnabled() {
    try {
      return localStorage.getItem('cs_coach_voice_enabled') === 'true';
    } catch {
      return false;
    }
  }

  function isAnyOverlayOpen() {
    const selectors = [
      '#modal-overlay:not(.hidden)',
      '#challenge-modal:not(.hidden)',
      '#phonics-clue-modal:not(.hidden)',
      '#listening-mode-overlay:not(.hidden)',
      '#first-run-setup-modal:not(.hidden)',
      '#end-modal:not(.hidden)',
      '#modal-challenge-launch:not(.hidden)',
      '#voice-help-modal:not(.hidden)',
      '#settings-panel:not(.hidden)',
      '#teacher-panel:not(.hidden)',
      '#play-tools-drawer:not(.hidden)',
      '#theme-preview-strip:not(.hidden)',
      '#quick-music-strip:not(.hidden)'
    ];
    for (const selector of selectors) {
      if (document.querySelector(selector)) return true;
    }
    return false;
  }

  function isTextCompositionFocusActive() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return false;
    if (active.closest('#challenge-modal, #teacher-panel, #settings-panel, #modal-overlay, #voice-help-modal')) {
      return true;
    }
    const tag = String(active.tagName || '').toLowerCase();
    if (active.isContentEditable) return true;
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  function canRunAvaIdleCoaching() {
    if (DEMO_MODE) return false;
    if (document.hidden) return false;
    if (!isPlayMode()) return false;
    if (!isWordQuestActiveRound()) return false;
    if (!isCoachEnabled()) return false;
    if (isAnyOverlayOpen()) return false;
    if (isTextCompositionFocusActive()) return false;
    return true;
  }

  function recordAvaWordQuestEvent(type) {
    const ts = Date.now();
    avaWqRapidEvents.push({ type: String(type || 'event'), ts });
    avaWqRapidEvents = avaWqRapidEvents.filter((evt) => (ts - Number(evt.ts || 0)) <= 10000);
    avaWqLastActionAt = ts;
  }

  function speakAvaWordQuestAdaptive(eventKey, overrides = {}) {
    // Hard guard: never speak outside true active Word Quest play.
    if (DEMO_MODE) return;
    if (!isPlayMode()) return;
    if (!isWordQuestActiveRound()) return;
    if (!isCoachEnabled()) return;
    if (document.hidden) return;
    if (isAnyOverlayOpen()) return;
    if (isTextCompositionFocusActive()) return;
    if (typeof window.CSEmitAva !== 'function') return;
    const state = WQGame.getState ? WQGame.getState() : {};
    const tierRaw = String(localStorage.getItem('cs_tier_level') || '').trim();
    const tier = Number(tierRaw || 2) === 3 ? 3 : 2;
    const baseContext = {
      module: 'wordquest',
      event: String(eventKey || '').trim(),
      tier,
      demo: !!DEMO_MODE,
      streakCorrect: avaWqCorrectStreak,
      streakWrong: avaWqWrongStreak,
      idleMs: Math.max(0, Date.now() - avaWqLastActionAt),
      rapidActions: avaWqRapidEvents.length,
      backspaceBurst: 0,
      selfCorrects: 0,
      accuracyPct: null,
      punctuationScore: null,
      remainingGuesses: Math.max(0, Number(state?.maxGuesses || 0) - Number(state?.guesses?.length || 0)),
      lastEvents: avaWqRapidEvents.slice(-12)
    };
    void window.CSEmitAva(Object.assign(baseContext, overrides)).catch(() => {});
  }

  function startAvaWordQuestIdleWatcher() {
    if (DEMO_MODE) {
      logAvaIdleDev('watcher not started (demo mode)');
      return;
    }
    if (avaWqIdleTimer) return;
    if (!isPlayMode()) {
      logAvaIdleDev('watcher not started (not play mode)');
      return;
    }
    logAvaIdleDev('watcher started');
    avaWqIdleTimer = window.setInterval(() => {
      if (!canRunAvaIdleCoaching()) return;
      if (avaWqIdleFiredThisRound) return;
      const idleMs = Math.max(0, Date.now() - avaWqLastActionAt);
      if (idleMs < 20000) return;
      if ((Date.now() - avaWqLastIdleEmitAt) < 20000) return;
      avaWqLastIdleEmitAt = Date.now();
      avaWqIdleFiredThisRound = true;
      logAvaIdleDev('idle_20s fired', { idleMs });
      speakAvaWordQuestAdaptive('idle_20s', { idleMs });
    }, 1000);
  }

  function stopAvaWordQuestIdleWatcher(reason) {
    if (avaWqIdleTimer) {
      clearInterval(avaWqIdleTimer);
      avaWqIdleTimer = 0;
      logAvaIdleDev('watcher stopped', reason || '');
    }
  }

  function setWordQuestCoachState(key) {
    wordQuestCoachKey = String(key || '').trim() || 'before_guess';
    if (!wordQuestCoachRibbon || typeof wordQuestCoachRibbon.set !== 'function') return;
    const mount = _el('wq-coach-ribbon');
    if (!(mount instanceof HTMLElement)) return;
    if (homeMode !== 'play') {
      mount.classList.add('hidden');
      return;
    }
    if (DEMO_MODE) {
      mount.classList.add('hidden');
      return;
    }
    mount.classList.remove('hidden');
    const map = {
      before_guess: { key: 'wq.beforeFirstGuess', text: 'Start with one strong test word. The tile colors will show what to keep, move, or drop.' },
      after_first_miss: { key: 'wq.afterFirstMiss', text: 'Read the color pattern carefully, then make the next guess more precise instead of wider.' },
      after_correct: { key: 'wq.correct', text: 'Solved. Tap Next Word to keep the momentum going or replay the pattern for fluency.' }
    };
    const next = map[wordQuestCoachKey] || map.before_guess;
    wordQuestCoachRibbon.set(next);
  }

  function csSetHeaderTitleCenter(label) {
    const el =
      document.querySelector('[data-cs-header-title-center]') ||
      _el('csHeaderTitleCenter') ||
      document.querySelector('.cs-topbar-center-title') ||
      _el('play-mode-label');
    if (!el) return;
    el.textContent = String(label || 'Cornerstone MTSS');
  }

  function setActivityLabel(label) {
    csSetHeaderTitleCenter(String(label || 'Cornerstone MTSS'));
  }

  function csComputeHeaderTitleCenter() {
    const path = String(location.pathname || '').toLowerCase();
    if (path.endsWith('/reading-lab.html')) return 'Reading Lab';
    if (path.endsWith('/teacher-dashboard.html') || path.endsWith('/reports.html')) return 'Reports';
    if (path.endsWith('/sentence-surgery.html') || path.endsWith('/writing-studio.html')) return 'Writing Studio';
    const mode = document.documentElement.getAttribute('data-home-mode');
    if (mode === 'home') return 'Cornerstone MTSS';
    if (mode === 'play') return 'Word Quest';
    return 'Cornerstone MTSS';
  }

  function csSyncHeaderTitleCenter() {
    csSetHeaderTitleCenter(csComputeHeaderTitleCenter());
  }

  function setHomePlayShellIsolation(isHome) {
    const hidden = !!isHome;
    const selectors = [
      '#play-shell',
      'header',
      'main',
      '.top-control-hub',
      '#next-action-line',
      '.classroom-turn-line',
      '#play-tools-drawer',
      '#theme-preview-strip',
      '#quick-music-strip',
      '#settings-panel',
      '#teacher-panel',
      '#toast',
      '#modal-overlay',
      '#challenge-modal',
      '#phonics-clue-modal',
      '#first-run-setup-modal',
      '#voice-help-modal',
      '#celebrate-layer',
      '#confetti-canvas',
      '#listening-mode-overlay',
      '#hint-clue-card',
      '#starter-word-card'
    ];
    selectors.forEach((selector) => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (hidden) {
        el.setAttribute('aria-hidden', 'true');
        try { el.setAttribute('inert', ''); } catch {}
      } else {
        el.removeAttribute('aria-hidden');
        try { el.removeAttribute('inert'); } catch {}
      }
    });
  }

  function applyHomePlayVisibility(nextMode) {
    const playShell = _el('play-shell');
    const hero = _el('hero-v2');
    const header = document.querySelector('body > header');
    const inPlay = String(nextMode || '') === 'play';
    if (playShell instanceof HTMLElement) {
      playShell.style.display = inPlay ? 'block' : 'none';
    }
    if (hero instanceof HTMLElement) {
      hero.style.display = inPlay ? 'none' : '';
    }
    if (header instanceof HTMLElement) {
      header.style.display = inPlay ? 'block' : 'none';
    }
  }

  function setHomeMode(mode, options = {}) {
    const next = String(mode || '').toLowerCase() === 'play' ? 'play' : 'home';
    homeMode = next;
    document.body?.classList.toggle('home-locked', next === 'home');
    applyHomePlayVisibility(next);
    setHomePlayShellIsolation(next !== 'play');
    updateHomeCoachRibbon();
    setWordQuestCoachState(wordQuestCoachKey);
    if (next === 'play') {
      document.documentElement.setAttribute('data-home-mode', 'play');
      setActivityLabel('Word Quest');
      startAvaWordQuestIdleWatcher();
      _el('home-tools-section')?.classList.add('hidden');
      _el('play-tools-drawer')?.classList.add('hidden');
      _el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
      if (options.scroll !== false) {
        _el('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('play', '1');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      } catch {}
      logOverflowDiagnostics('setHomeMode:play');
      return;
    }
    document.documentElement.setAttribute('data-home-mode', 'home');
    setActivityLabel('Cornerstone MTSS');
    stopAvaWordQuestIdleWatcher('home mode');
    _el('home-tools-section')?.classList.remove('hidden');
    assertHomeNoScrollDev();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('play');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {}
    logOverflowDiagnostics('setHomeMode:home');
  }

  function initializeHomeMode() {
    const forceGameplayRoute = /(?:^|\/)word-quest\.html$/i.test(String(location.pathname || ''));
    if (DEMO_MODE) {
      setHomeMode('play', { scroll: false });
      return;
    }
    let forcePlay = false;
    try {
      const params = new URLSearchParams(window.location.search || '');
      const playParam = String(params.get('play') || '').toLowerCase();
      const fromParam = String(params.get('from') || '').toLowerCase();
      forcePlay = playParam === '1' || playParam === 'true' || fromParam === 'home';
    } catch {
      forcePlay = false;
    }
    if (forceGameplayRoute) forcePlay = true;
    setHomeMode(forcePlay ? 'play' : 'home', { scroll: false });
    csSyncHeaderTitleCenter();
  }

  function routeTo(route) {
    const normalized = String(route || 'home').toLowerCase().replace(/^#/, '') || 'home';
    if (location.hash === `#${normalized}`) {
      applyHashRoute();
      return;
    }
    location.hash = `#${normalized}`;
  }

  function applyHashRoute() {
    const route = String(location.hash || '#').replace(/^#/, '').toLowerCase();
    if (!route || route === 'home') {
      try {
        const params = new URLSearchParams(window.location.search || '');
        const playParam = String(params.get('play') || '').toLowerCase();
        const fromParam = String(params.get('from') || '').toLowerCase();
        const forcePlay = playParam === '1' || playParam === 'true' || fromParam === 'home';
        if (forcePlay) {
          setHomeMode('play', { scroll: false });
          if (!WQGame.getState?.()?.word) newGame({ launchMissionLab: false });
          return;
        }
      } catch (_e) {
        // no-op
      }
      setHomeMode('home', { scroll: false });
      return;
    }
    if (route === 'wordquest') {
      setHomeMode('play', { scroll: false });
      if (!WQGame.getState?.()?.word) newGame({ launchMissionLab: false });
      return;
    }
    if (route === 'reading') {
      setActivityLabel('Reading Lab');
      openReadingLabPage();
      return;
    }
    if (route === 'writing') {
      setActivityLabel('Writing Studio');
      openWritingStudioPage();
      return;
    }
    if (route === 'dashboard' || route === 'admin-demo') {
      setActivityLabel('Specialist Hub');
      const url = new URL(withAppBase('teacher-hub-v2.html'), window.location.origin);
      if (route === 'admin-demo') url.hash = '#admin-demo';
      window.location.href = url.toString();
      return;
    }
    routeTo('home');
  }
  window.CSRoute = Object.assign(window.CSRoute || {}, { routeTo });

  function syncPlayToolsRoleVisibility() {
    const teacherOnly = _el('play-drawer-teacher-dashboard');
    if (!teacherOnly) return;
    teacherOnly.classList.toggle('hidden', !isTeacherRoleEnabled());
  }

  function togglePlayToolsDrawer() {
    const drawer = _el('play-tools-drawer');
    const trigger = _el('play-tools-btn');
    if (!drawer || homeMode !== 'play') return;
    const open = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden', !open);
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function updatePageModeUrl(mode) {
    try {
      const normalized = normalizePageMode(mode);
      const url = new URL(window.location.href);
      if (normalized === 'mission-lab') {
        url.searchParams.set('page', 'mission-lab');
      } else {
        url.searchParams.delete('page');
      }
      const nextHref = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', nextHref);
    } catch {}
  }

  function syncPageModeUI() {
    const missionEnabled = isMissionLabEnabled();
    const missionMode = missionEnabled && isMissionLabStandaloneMode();
    document.documentElement.setAttribute('data-page-mode', missionMode ? 'mission-lab' : 'wordquest');
    document.documentElement.setAttribute('data-mission-lab', missionEnabled ? 'on' : 'off');
    const navBtn = _el('mission-lab-nav-btn');
    if (navBtn) {
      navBtn.classList.toggle('hidden', !missionEnabled);
      navBtn.innerHTML = missionMode
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 3.5h13.5V17"></path><path d="M20.5 3.5L9.5 14.5"></path><path d="M3.5 9.5V20.5H14.5"></path></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"></rect></svg>';
      navBtn.setAttribute('aria-pressed', missionMode ? 'true' : 'false');
      navBtn.setAttribute('aria-label', missionMode ? 'Return to WordQuest' : 'Open more activities');
      navBtn.title = missionMode
        ? 'Return to WordQuest gameplay mode'
        : 'Open more activities';
      setHoverNoteForElement(navBtn, missionMode ? 'Return to WordQuest gameplay mode.' : 'Open more activities like Deep Dive.');
    }
    const newWordBtn = _el('new-game-btn');
    if (newWordBtn) {
      if (DEMO_MODE) {
        newWordBtn.textContent = 'Stop Demo';
        newWordBtn.classList.add('is-demo-stop');
      } else {
        newWordBtn.textContent = missionMode ? 'Deep Dive Mode' : 'Next Word';
        newWordBtn.classList.remove('is-demo-stop');
      }
      newWordBtn.setAttribute(
        'aria-label',
        DEMO_MODE
          ? 'Stop automated demo and enter play mode'
          : (missionMode ? 'Start a standalone Deep Dive round' : 'Start the next word round')
      );
      newWordBtn.removeAttribute('title');
      if (missionMode) newWordBtn.classList.remove('pulse');
    }
    const focusInput = _el('focus-inline-search');
    if (focusInput) {
      focusInput.placeholder = missionMode
        ? 'Choose Deep Dive track'
        : 'Select your quest';
      focusInput.setAttribute('aria-label', missionMode ? 'Deep Dive track finder' : 'Quest finder');
    }
    _el('mission-lab-hub')?.classList.toggle('hidden', !missionMode);
    syncStarterWordLauncherUI();
    syncGameplayAudioStrip();
    if (!missionEnabled) {
      closeRevealChallengeModal({ silent: true, preserveFeedback: false });
      _el('modal-challenge-launch')?.classList.add('hidden');
      _el('challenge-modal')?.classList.add('hidden');
      _el('mission-lab-hub')?.classList.add('hidden');
      return;
    }
    if (missionMode) {
      hideInformantHintCard();
      hideStarterWordCard();
      _el('toast')?.classList.remove('visible', 'toast-informant');
      refreshStandaloneMissionLabHub();
      closeRevealChallengeModal({ silent: true, preserveFeedback: false });
      _el('modal-overlay')?.classList.add('hidden');
      _el('end-modal')?.classList.add('hidden');
    }
  }

  function setPageMode(mode, options = {}) {
    const normalized = normalizePageMode(mode);
    if (pageMode === normalized && !options.force) return;
    pageMode = normalized;
    persistPageMode(normalized);
    if (!options.skipUrl) updatePageModeUrl(normalized);
    syncPageModeUI();
    syncHeaderControlsVisibility();
  }

  function syncHeaderControlsVisibility() {
    const overlay = _el('modal-overlay');
    if (overlay) {
      const modals = [
        _el('teacher-panel'),
        _el('end-modal'),
        _el('challenge-modal'),
        _el('modal-challenge-launch'),
        _el('first-run-setup-modal')
      ];
      const anyOpen = modals.some((el) => el && !el.classList.contains('hidden'));
      if (!anyOpen) overlay.classList.add('hidden');
    }
    syncThemePreviewStripVisibility();
    updateFocusHint();
    updateFocusSummaryLabel();
    updateGradeTargetInline();
    updateNextActionLine();
    syncPlayHeaderCopy();
  }

  document.querySelectorAll('#settings-panel [data-settings-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setSettingsView(tab.getAttribute('data-settings-tab'));
    });
  });
  document.querySelectorAll('.settings-jump-chip[data-settings-jump]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const groupId = chip.getAttribute('data-settings-jump');
      if (!groupId) return;
      jumpToSettingsGroup(groupId);
    });
  });
  bindSettingsAccordion('#settings-quick');
  bindSettingsAccordion('#settings-advanced');

  document.querySelectorAll('[data-teacher-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTeacherPreset(btn.getAttribute('data-teacher-preset') || '');
    });
  });

  // Always land in WordQuest first. Deep Dive opens only from the dedicated tab button.
  pageMode = 'wordquest';
  persistPageMode('wordquest');
  updatePageModeUrl('wordquest');
  initCoachRibbons();
  initializeHomeMode();
  applyHashRoute();
  csSyncHeaderTitleCenter();
  updateHomeCoachRibbon();
  setWordQuestCoachState('before_guess');
  startAvaWordQuestIdleWatcher();
  logOverflowDiagnostics('init');
  syncPlayToolsRoleVisibility();

  setSettingsView('quick');
  syncPageModeUI();
  syncHeaderControlsVisibility();
  syncClassroomTurnRuntime({ resetTurn: true });
  syncTeacherPresetButtons();
  syncAssessmentLockRuntime({ closeFocus: false });
  bindFirstRunSetupModal();
  enableDraggableSupportChoiceCard();
  bindSettingsModeCards();
  if (firstRunSetupPending) {
    openFirstRunSetupModal();
  }
  const teacherPanelToggleEvent = EVENT_BUS_EVENTS.teacherPanelToggle || 'wq:teacher-panel-toggle';
  const openTeacherHubEvent = EVENT_BUS_EVENTS.openTeacherHub || 'wq:open-teacher-hub';
  window.addEventListener(teacherPanelToggleEvent, () => {
    const isOpen = !_el('teacher-panel')?.classList.contains('hidden');
    emitTelemetry(isOpen ? 'wq_teacher_hub_open' : 'wq_teacher_hub_close', {
      source: 'teacher_panel_toggle_event'
    });
    syncHeaderControlsVisibility();
  });
  window.addEventListener(openTeacherHubEvent, () => {
    _el('teacher-panel-btn')?.click();
  });
  window.addEventListener('resize', () => {
    if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
      positionHintClueCard();
    }
    if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
      positionStarterWordCard();
    }
    if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
      positionSupportChoiceCard();
    }
    syncQuickPopoverPositions();
    positionSettingsPanel();
    logOverflowDiagnostics('resize');
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
      positionHintClueCard();
    }
    if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
      positionStarterWordCard();
    }
    if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
      positionSupportChoiceCard();
    }
    syncQuickPopoverPositions();
    positionSettingsPanel();
  }, { passive: true });

  function positionSettingsPanel() {
    const panel = _el('settings-panel');
    if (!(panel instanceof HTMLElement) || panel.classList.contains('hidden')) return;
    if ((window.innerWidth || 0) <= 1080) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(78px, 10vh, 108px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const board = document.querySelector('.board-plate');
    const header = document.querySelector('header');
    if (!(board instanceof HTMLElement)) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(78px, 10vh, 108px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const headerBottom = header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 72;
    const gap = 18;
    const top = Math.max(headerBottom + 10, Math.min(boardRect.top, window.innerHeight - panel.offsetHeight - 12));
    const rightSpace = window.innerWidth - boardRect.right - gap - 12;
    const leftSpace = boardRect.left - gap - 12;
    let left = boardRect.right + gap;
    if (rightSpace < panel.offsetWidth && leftSpace > rightSpace) {
      left = Math.max(12, boardRect.left - panel.offsetWidth - gap);
    }
    left = Math.max(12, Math.min(left, window.innerWidth - panel.offsetWidth - 12));
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.max(12, top)}px`;
    panel.style.transform = 'none';
  }

  _el('settings-btn')?.addEventListener('click', () => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return;
    }
    const panel = _el('settings-panel');
    if (!panel) return;
    _el('teacher-panel')?.classList.add('hidden');
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (opening) {
      setSettingsView('quick');
      void renderDiagnosticsPanel();
      positionSettingsPanel();
    }
    syncHeaderControlsVisibility();
  });
  _el('settings-close')?.addEventListener('click', () => {
    _el('settings-panel')?.classList.add('hidden');
    syncHeaderControlsVisibility();
  });
  {
    const panel = _el('settings-panel');
    const header = panel?.querySelector('.settings-header');
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const onPointerMove = (event) => {
      if (!dragging || !panel) return;
      const x = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, event.clientX - dragOffsetX));
      const y = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, event.clientY - dragOffsetY));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.transform = 'none';
    };
    const stopDragging = () => {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
    header?.addEventListener('pointerdown', (event) => {
      if (!(panel instanceof HTMLElement)) return;
      if ((event.target instanceof HTMLElement) && event.target.closest('#settings-close')) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!panel || panel.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (_el('settings-btn')?.contains(target)) return;
      panel.classList.add('hidden');
      syncHeaderControlsVisibility();
    });
  }
  {
    const panel = _el('teacher-panel');
    const card = panel?.querySelector('.teacher-panel-card');
    const header = panel?.querySelector('.teacher-panel-head');
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const onPointerMove = (event) => {
      if (!dragging || !(card instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
      const x = Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, event.clientX - dragOffsetX));
      const y = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, event.clientY - dragOffsetY));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    };
    const stopDragging = () => {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
    header?.addEventListener('pointerdown', (event) => {
      if (!(card instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
      if ((event.target instanceof HTMLElement) && event.target.closest('#teacher-panel-close')) return;
      dragging = true;
      const rect = card.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!(panel instanceof HTMLElement) || panel.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (_el('teacher-panel-btn')?.contains(target)) return;
      panel.classList.add('hidden');
      syncHeaderControlsVisibility();
    });
  }

  
  // Voice help modal
  const openVoiceHelp = () => {
    _el('settings-panel')?.classList.add('hidden');
    syncHeaderControlsVisibility();
    _el('voice-help-modal')?.classList.remove('hidden');
  };
  const closeVoiceHelp = () => _el('voice-help-modal')?.classList.add('hidden');
  _el('voice-help-btn')?.addEventListener('click', openVoiceHelp);
  _el('voice-help-close')?.addEventListener('click', closeVoiceHelp);
  _el('voice-help-modal')?.addEventListener('click', e => { if (e.target.id === 'voice-help-modal') closeVoiceHelp(); });
  _el('mission-lab-nav-btn')?.addEventListener('click', () => {
    setPageMode(isMissionLabStandaloneMode() ? 'wordquest' : 'mission-lab');
  });
  function openWritingStudioPage() {
    if (!WRITING_STUDIO_ENABLED) {
      WQUI.showToast('Writing Studio is hidden in this shared build.');
      return;
    }
    const activeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    try { localStorage.setItem('ws_theme_v1', activeTheme); } catch {}
    const state = WQGame.getState?.() || {};
    const focusSelect = _el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || DEFAULT_PREFS.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'General writing').trim();
    const gradeValue = String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const url = new URL(withAppBase('writing-studio.html'), window.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    window.location.href = url.toString();
  }

  function openSentenceSurgeryPage() {
    const activeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const state = WQGame.getState?.() || {};
    const focusSelect = _el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || DEFAULT_PREFS.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'Sentence practice').trim();
    const gradeValue = String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const url = new URL(withAppBase('sentence-surgery.html'), window.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    window.location.href = url.toString();
  }

  function openReadingLabPage() {
    const activeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const state = WQGame.getState?.() || {};
    const focusSelect = _el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || DEFAULT_PREFS.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'Reading practice').trim();
    const gradeValue = String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const url = new URL(withAppBase('reading-lab.html'), window.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    window.location.href = url.toString();
  }

  function openTeacherDashboardPage() {
    const url = new URL(withAppBase('game-platform.html'), window.location.origin);
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('demo') === '1') url.searchParams.set('demo', '1');
      if (params.get('subject')) url.searchParams.set('subject', params.get('subject'));
    } catch (_e) {
      // no-op
    }
    window.location.href = url.toString();
  }

  function openNumeracyLabPage() {
    const url = new URL(withAppBase('numeracy.html'), window.location.origin);
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('demo') === '1') url.searchParams.set('demo', '1');
    } catch (_e) {
      // no-op
    }
    window.location.href = url.toString();
  }

  function initStudentCodeControls() {
    const row = _el('home-student-code-row');
    const toggle = _el('home-set-code-toggle');
    const input = _el('home-student-code-input');
    const saveBtn = _el('home-student-code-save');
    if (!row || !toggle || !input || !saveBtn || !window.CSCornerstoneStore) return;
    const current = typeof window.CSCornerstoneStore.getStudentCode === 'function'
      ? window.CSCornerstoneStore.getStudentCode()
      : '';
    if (current) input.value = String(current);
    toggle.addEventListener('click', () => {
      row.classList.toggle('hidden');
      if (!row.classList.contains('hidden')) input.focus();
    });
    saveBtn.addEventListener('click', () => {
      const next = String(input.value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const saved = window.CSCornerstoneStore.setStudentCode(next);
      input.value = saved || '';
      WQUI.showToast(saved ? `Student code saved: ${saved}` : 'Student code cleared.');
      row.classList.add('hidden');
    });
  }

  if (WRITING_STUDIO_ENABLED) {
    _el('writing-studio-btn')?.addEventListener('click', openWritingStudioPage);
  } else {
    syncWritingStudioAvailability();
  }
  _el('sentence-surgery-btn')?.addEventListener('click', openSentenceSurgeryPage);
  _el('reading-lab-btn')?.addEventListener('click', openReadingLabPage);
  _el('teacher-open-writing-studio-btn')?.addEventListener('click', openWritingStudioPage);
  _el('teacher-open-sentence-surgery-btn')?.addEventListener('click', openSentenceSurgeryPage);
  _el('teacher-open-reading-lab-btn')?.addEventListener('click', openReadingLabPage);
  _el('teacher-dashboard-btn')?.addEventListener('click', openTeacherDashboardPage);
  _el('play-tools-btn')?.addEventListener('click', togglePlayToolsDrawer);
  _el('play-drawer-close')?.addEventListener('click', () => {
    _el('play-tools-drawer')?.classList.add('hidden');
    _el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
  });
  _el('play-drawer-writing-studio')?.addEventListener('click', openWritingStudioPage);
  _el('play-drawer-sentence-surgery')?.addEventListener('click', openSentenceSurgeryPage);
  _el('play-drawer-reading-lab')?.addEventListener('click', openReadingLabPage);
  _el('play-drawer-teacher-dashboard')?.addEventListener('click', openTeacherDashboardPage);
  _el('home-open-writing-studio')?.addEventListener('click', () => routeTo('writing'));
  _el('home-open-wordquest')?.addEventListener('click', () => routeTo('wordquest'));
  _el('home-open-reading-lab')?.addEventListener('click', () => routeTo('reading'));
  _el('home-open-numeracy')?.addEventListener('click', openNumeracyLabPage);
  _el('wq-share-result-btn')?.addEventListener('click', async () => {
    if (!_latestSavedSessionId) return;
    await shareWordQuestSessionById(_latestSavedSessionId);
  });
  _el('wq-share-bundle-btn')?.addEventListener('click', async () => {
    await shareWordQuestBundle();
  });
  _el('cta-wordquest')?.addEventListener('click', () => routeTo('wordquest'));
  _el('cta-tools')?.addEventListener('click', () => routeTo('dashboard'));
  _el('home-logo-btn')?.addEventListener('click', () => {
    routeTo('home');
    setPageMode('wordquest', { force: true });
    closeFocusSearchList();
    closeQuickPopover('all');
    _el('settings-panel')?.classList.add('hidden');
    _el('teacher-panel')?.classList.add('hidden');
    _el('modal-overlay')?.classList.add('hidden');
    _el('end-modal')?.classList.add('hidden');
    _el('challenge-modal')?.classList.add('hidden');
    _el('modal-challenge-launch')?.classList.add('hidden');
    _el('play-tools-drawer')?.classList.add('hidden');
    _el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
    syncHeaderControlsVisibility();
  });
  window.addEventListener('hashchange', applyHashRoute);
  initStudentCodeControls();
// Global outside-click handlers for flyouts/toasts
  document.addEventListener('pointerdown', e => {
    const focusWrap = _el('focus-inline-wrap');
    const hintToggleBtn = _el('focus-hint-toggle');
    const hintCard = _el('hint-clue-card');
    if (focusWrap && !focusWrap.contains(e.target)) {
      closeFocusSearchList();
      updateFocusSummaryLabel();
    }
    if (
      hintCard &&
      !hintCard.classList.contains('hidden') &&
      !hintCard.contains(e.target) &&
      e.target !== hintToggleBtn &&
      !hintToggleBtn?.contains(e.target)
    ) {
      hideInformantHintCard();
    }
    const themeDockBtn = _el('theme-dock-toggle-btn');
    const musicDockBtn = _el('music-dock-toggle-btn');
    const playToolsBtn = _el('play-tools-btn');
    const playToolsDrawer = _el('play-tools-drawer');
    const themePopover = _el('theme-preview-strip');
    const musicPopover = _el('quick-music-strip');
    const clickInsideQuickPopover =
      themePopover?.contains(e.target) ||
      musicPopover?.contains(e.target) ||
      themeDockBtn?.contains(e.target) ||
      musicDockBtn?.contains(e.target);
    if (!clickInsideQuickPopover) {
      closeQuickPopover('all');
    }
    if (
      playToolsDrawer &&
      !playToolsDrawer.classList.contains('hidden') &&
      !playToolsDrawer.contains(e.target) &&
      e.target !== playToolsBtn &&
      !playToolsBtn?.contains(e.target)
    ) {
      playToolsDrawer.classList.add('hidden');
      playToolsBtn?.setAttribute('aria-expanded', 'false');
    }
    if (_dupeToastEl && !_dupeToastEl.contains(e.target)) removeDupeToast();
    if (_el('toast')?.classList.contains('visible')) _el('toast').classList.remove('visible', 'toast-informant');
    const boost = _el('midgame-boost');
    if (
      boost &&
      !boost.classList.contains('hidden') &&
      !boost.contains(e.target) &&
      !shouldKeepMidgameBoostOpen(e.target)
    ) {
      hideMidgameBoost();
    }
  });

  _el('s-theme')?.addEventListener('change', e => {
    const normalized = applyTheme(e.target.value);
    if (shouldPersistTheme()) {
      setPref('theme', normalized);
    }
    WQUI.showToast(`Theme: ${getThemeDisplayLabel(normalized)}`);
    syncQuickSetupControls();
    syncPlayStyleToggleUI();
    syncHeaderControlsVisibility();
  });
  _el('s-theme')?.addEventListener('input', e => {
    const normalized = applyTheme(e.target.value);
    if (shouldPersistTheme()) {
      setPref('theme', normalized);
    }
    syncQuickSetupControls();
    syncPlayStyleToggleUI();
    syncHeaderControlsVisibility();
  });
  _el('s-theme')?.addEventListener('keydown', e => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return;
    const select = e.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;
    const options = Array.from(select.options).filter((option) => !option.disabled && option.value);
    if (!options.length) return;
    const currentIndex = Math.max(0, options.findIndex((option) => option.value === select.value));
    let nextIndex = currentIndex;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') nextIndex = Math.min(options.length - 1, currentIndex + 1);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') nextIndex = Math.max(0, currentIndex - 1);
    if (e.key === 'Home') nextIndex = 0;
    if (e.key === 'End') nextIndex = options.length - 1;
    if (nextIndex === currentIndex) return;
    e.preventDefault();
    select.value = options[nextIndex].value;
    const normalized = applyTheme(select.value);
    if (shouldPersistTheme()) {
      setPref('theme', normalized);
    }
    syncQuickSetupControls();
    syncPlayStyleToggleUI();
    syncHeaderControlsVisibility();
  });
  _el('s-theme-save')?.addEventListener('change', e => {
    const next = e.target.value === 'on' ? 'on' : 'off';
    setPref('themeSave', next);
    if (next === 'on') {
      setPref('theme', normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()));
      WQUI.showToast('Theme will be saved for next time.');
    } else {
      delete prefs.theme;
      savePrefs(prefs);
      WQUI.showToast('Theme save is off. App will start on default theme next time.');
    }
  });
  _el('s-ui-skin')?.addEventListener('change', e => {
    const normalized = applyUiSkin(e.target.value, { persist: true });
    WQUI.showToast(`Visual skin: ${normalized === 'premium' ? 'Premium' : 'Classic'}.`);
  });

  function evaluateGuessForKeyboard(guess, targetWord) {
    const target = String(targetWord || '').toLowerCase().split('');
    const chars = String(guess || '').toLowerCase().split('');
    const result = Array(target.length).fill('absent');
    chars.forEach((ch, idx) => {
      if (ch === target[idx]) {
        result[idx] = 'correct';
        target[idx] = '';
        chars[idx] = '';
      }
    });
    chars.forEach((ch, idx) => {
      if (!ch) return;
      const foundIndex = target.indexOf(ch);
      if (foundIndex < 0) return;
      result[idx] = 'present';
      target[foundIndex] = '';
    });
    return result;
  }

  function restoreKeyboardStateFromRound(state) {
    if (!state?.word || !Array.isArray(state.guesses) || !state.guesses.length) return;
    state.guesses.forEach((guess) => {
      const result = evaluateGuessForKeyboard(guess, state.word);
      WQUI.updateKeyboard(result, guess);
    });
    syncKeyboardInputLocks(state);
  }

  function refreshKeyboardLayoutPreview() {
    const state = WQGame.getState?.();
    if (!state?.word) return;
    WQUI.buildKeyboard();
    restoreKeyboardStateFromRound(state);
    if (state.guess) {
      WQUI.updateCurrentRow(state.guess, state.wordLength, state.guesses.length);
    }
    if (state.wordLength && state.maxGuesses) {
      WQUI.calcLayout(state.wordLength, state.maxGuesses);
    }
    syncKeyboardInputLocks(state);
  }

  _el('s-board-style')?.addEventListener('change', e => {
    const next = applyBoardStyle(e.target.value);
    setPref('boardStyle', next);
    updateWilsonModeToggle();
    refreshKeyboardLayoutPreview();
  });
  _el('s-key-style')?.addEventListener('change', () => {
    const next = applyKeyStyle(DEFAULT_PREFS.keyStyle);
    setPref('keyStyle', next);
    updateWilsonModeToggle();
    refreshKeyboardLayoutPreview();
  });
  _el('s-keyboard-layout')?.addEventListener('change', e => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      e.target.value = normalizeKeyboardLayout(document.documentElement.getAttribute('data-keyboard-layout') || DEFAULT_PREFS.keyboardLayout);
      return;
    }
    const next = applyKeyboardLayout(e.target.value);
    setPref('keyboardLayout', next);
    refreshKeyboardLayoutPreview();
    WQUI.showToast(`Keyboard switched to ${getKeyboardLayoutLabel(next)}.`);
  });
  _el('s-chunk-tabs')?.addEventListener('change', e => {
    const next = applyChunkTabsMode(e.target.value);
    setPref('chunkTabs', next);
    syncChunkTabsVisibility();
  });
  _el('s-wilson-mode')?.addEventListener('change', e => {
    const enabled = !!e.target.checked;
    applyWilsonMode(enabled);
    refreshKeyboardLayoutPreview();
    WQUI.showToast(enabled
      ? 'Wilson sound-card mode is on.'
      : 'Switched to standard keyboard + simple board.');
  });
  _el('keyboard-layout-toggle')?.addEventListener('click', () => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return;
    }
    const current = normalizeKeyboardLayout(document.documentElement.getAttribute('data-keyboard-layout') || 'standard');
    const next = applyKeyboardLayout(getNextKeyboardLayout(current));
    setPref('keyboardLayout', next);
    refreshKeyboardLayoutPreview();
    WQUI.showToast(`Keyboard switched to ${getKeyboardLayoutLabel(next)}.`);
  });
  _el('s-atmosphere')?.addEventListener('change', e => {
    setPref('atmosphere', applyAtmosphere(e.target.value));
  });
  _el('s-text-size')?.addEventListener('change', e => {
    setPref('textSize', applyTextSize(e.target.value));
  });
  _el('s-projector')?.addEventListener('change', e => {
    applyProjector(e.target.value);
    setPref('projector', e.target.value);
  });
  _el('s-motion')?.addEventListener('change', e => {
    applyMotion(e.target.value);
    setPref('motion', e.target.value);
  });
  _el('s-case')?.addEventListener('change', e => {
    const next = String(e.target.value || 'lower').toLowerCase() === 'upper' ? 'upper' : 'lower';
    WQUI.setCaseMode(next);
    setPref('caseMode', next);
    syncCaseToggleUI();
  });
  _el('case-toggle-btn')?.addEventListener('click', () => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return;
    }
    const current = String(document.documentElement.getAttribute('data-case') || prefs.caseMode || DEFAULT_PREFS.caseMode).toLowerCase();
    const next = current === 'upper' ? 'lower' : 'upper';
    const select = _el('s-case');
    if (select) select.value = next;
    WQUI.setCaseMode(next);
    setPref('caseMode', next);
    syncCaseToggleUI();
    WQUI.showToast(next === 'upper' ? 'Letter case: UPPERCASE.' : 'Letter case: lowercase.');
  });
  function handleLessonPackSelectionChange(rawValue) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before changing lesson packs.');
      syncLessonPackControlsFromPrefs();
      return false;
    }
    const nextPack = normalizeLessonPackId(rawValue);
    const preferredTarget = nextPack === 'custom'
      ? 'custom'
      : resolveDefaultLessonTargetId(nextPack);
    lessonPackApplying = true;
    let nextTarget = 'custom';
    try {
      getLessonPackSelectElements().forEach((select) => { select.value = nextPack; });
      nextTarget = populateLessonTargetSelect(nextPack, preferredTarget);
    } finally {
      lessonPackApplying = false;
    }
    setLessonPackPrefs(nextPack, nextTarget);
    updateLessonPackNote(nextPack, nextTarget);
    refreshStandaloneMissionLabHub();
    if (nextPack !== 'custom' && nextTarget !== 'custom') {
      applyLessonTargetConfig(nextPack, nextTarget, { toast: false });
    }
    return true;
  }

  function handleLessonTargetSelectionChange(rawValue) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before changing lesson targets.');
      syncLessonPackControlsFromPrefs();
      return false;
    }
    const currentPack = normalizeLessonPackId(
      prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack
    );
    const nextTarget = normalizeLessonTargetId(currentPack, rawValue);
    getLessonTargetSelectElements().forEach((select) => { select.value = nextTarget; });
    setLessonPackPrefs(currentPack, nextTarget);
    updateLessonPackNote(currentPack, nextTarget);
    refreshStandaloneMissionLabHub();
    if (currentPack === 'custom' || nextTarget === 'custom') return true;
    applyLessonTargetConfig(currentPack, nextTarget, { toast: false });
    return true;
  }

  _el('s-lesson-pack')?.addEventListener('change', e => {
    handleLessonPackSelectionChange(e.target.value);
  });
  _el('s-lesson-target')?.addEventListener('change', e => {
    handleLessonTargetSelectionChange(e.target.value);
  });
  _el('lesson-pack-apply-week-btn')?.addEventListener('click', () => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before applying pacing targets.');
      return;
    }
    const button = _el('lesson-pack-apply-week-btn');
    const packId = normalizeLessonPackId(
      button?.getAttribute('data-pack-id') || prefs.lessonPack || DEFAULT_PREFS.lessonPack
    );
    const recommendation = getCurrentWeekRecommendedLessonTarget(packId);
    const targetId = recommendation?.target?.id || '';
    if (packId === 'custom' || !targetId) {
      WQUI.showToast('No pacing target available to apply.');
      return;
    }
    getLessonPackSelectElements().forEach((select) => { select.value = packId; });
    getLessonTargetSelectElements().forEach((select) => { select.value = targetId; });
    setLessonPackPrefs(packId, targetId);
    updateLessonPackNote(packId, targetId);
    applyLessonTargetConfig(packId, targetId, { toast: true });
  });
  function syncFocusSearchForCurrentGrade() {
    const listEl = _el('focus-inline-results');
    if (!listEl || listEl.classList.contains('hidden')) return;
    renderFocusSearchList(_el('focus-inline-search')?.value || '');
  }

  function enforceFocusSelectionForGrade(selectedGradeBand, options = {}) {
    const focusSelect = _el('setting-focus');
    if (!focusSelect) return false;
    const currentFocus = String(focusSelect.value || 'all').trim() || 'all';
    if (isFocusValueCompatibleWithGrade(currentFocus, selectedGradeBand)) return false;
    focusSelect.value = 'all';
    focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    if (options.toast !== false) {
      WQUI.showToast(`Quest reset to Classic for grade ${formatGradeBandLabel(selectedGradeBand)}.`);
    }
    return true;
  }

  _el('s-grade')?.addEventListener('change',   e => {
    const selectedGradeBand = String(e.target?.value || DEFAULT_PREFS.grade).trim() || DEFAULT_PREFS.grade;
    setPref('grade', selectedGradeBand);
    applyAllGradeLengthDefault({ toast: true });
    releaseLessonPackToManualMode();
    enforceFocusSelectionForGrade(selectedGradeBand, { toast: true });
    updateFocusGradeNote();
    updateGradeTargetInline();
    refreshStandaloneMissionLabHub();
    syncFocusSearchForCurrentGrade();
    syncQuickSetupControls();
  });
  _el('s-length')?.addEventListener('change',  e => {
    setPref('length', e.target.value);
    releaseLessonPackToManualMode();
    refreshStandaloneMissionLabHub();
  });
  _el('s-guesses')?.addEventListener('change', e => {
    const currentState = WQGame.getState?.() || null;
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before changing max guesses.');
      e.target.value = String(
        Math.max(1, Number(currentState?.maxGuesses || prefs.guesses || DEFAULT_PREFS.guesses || 6))
      );
      return;
    }
    const normalized = String(
      Math.max(1, Number.parseInt(String(e.target.value || DEFAULT_PREFS.guesses), 10) || Number.parseInt(DEFAULT_PREFS.guesses, 10) || 6)
    );
    e.target.value = normalized;
    setPref('guesses', normalized);
    const hasActiveWord = Boolean(currentState?.word && !currentState?.gameOver);
    const hasProgress = Boolean(
      hasActiveWord && (((currentState?.guesses?.length || 0) > 0) || String(currentState?.guess || '').length > 0)
    );
    if (hasProgress) {
      WQUI.showToast(`Max guesses set to ${normalized}. It applies next word.`);
      return;
    }
    if (hasActiveWord) {
      newGame();
      WQUI.showToast(`Max guesses set to ${normalized}.`);
      return;
    }
    WQUI.showToast(`Max guesses saved: ${normalized}.`);
  });
  _el('s-confidence-coaching')?.addEventListener('change', e => {
    setConfidenceCoachingMode(!!e.target.checked, { toast: true });
  });
  _el('s-team-mode')?.addEventListener('change', e => {
    const normalized = normalizeTeamMode(e.target.value);
    e.target.value = normalized;
    setPref('teamMode', normalized);
    if (normalized === 'on') {
      closeHintClueCard();
      hideStarterWordCard();
      hideSupportChoiceCard();
    }
    syncHeaderClueLauncherUI();
    syncStarterWordLauncherUI();
    syncClassroomTurnRuntime({ resetTurn: true });
    updateNextActionLine();
    WQUI.showToast(normalized === 'on'
      ? 'Team turns are on.'
      : 'Team turns are off.');
  });
  _el('s-team-count')?.addEventListener('change', e => {
    const normalized = normalizeTeamCount(e.target.value);
    e.target.value = normalized;
    setPref('teamCount', normalized);
    syncClassroomTurnRuntime({ resetTurn: true });
    updateNextActionLine();
    WQUI.showToast(`${normalized} team${normalized === '1' ? '' : 's'} ready.`);
  });
  _el('s-team-set')?.addEventListener('change', e => {
    const normalized = normalizeTeamSet(e.target.value);
    e.target.value = normalized;
    setPref('teamSet', normalized);
    updateClassroomTurnLine();
    WQUI.showToast(`Team names: ${normalized}.`);
  });
  _el('s-turn-timer')?.addEventListener('change', e => {
    const normalized = normalizeTurnTimer(e.target.value);
    e.target.value = normalized;
    setPref('turnTimer', normalized);
    syncClassroomTurnRuntime();
    updateNextActionLine();
    WQUI.showToast(normalized === 'off'
      ? 'Team turn timer is off.'
      : `Team turn timer: ${normalized} seconds.`);
  });
  _el('s-smart-key-lock')?.addEventListener('change', e => {
    const normalized = String(e.target?.value || DEFAULT_PREFS.smartKeyLock).toLowerCase() === 'on' ? 'on' : 'off';
    e.target.value = normalized;
    setPref('smartKeyLock', normalized);
    syncKeyboardInputLocks(WQGame.getState?.() || {});
    WQUI.showToast(normalized === 'on'
      ? 'Smart Key Guard is on.'
      : 'Smart Key Guard is off.');
  });
  _el('s-probe-rounds')?.addEventListener('change', e => {
    const normalized = normalizeProbeRounds(e.target.value);
    e.target.value = normalized;
    setPref('probeRounds', normalized);
  });
  _el('s-report-compact')?.addEventListener('change', e => {
    const normalized = applyReportCompactMode(e.target?.checked ? 'on' : 'off');
    WQUI.showToast(normalized === 'on'
      ? 'Compact report mode is on.'
      : 'Compact report mode is off.');
  });
  _el('s-mastery-sort')?.addEventListener('change', e => {
    const normalized = normalizeMasterySort(e.target.value);
    e.target.value = normalized;
    renderMasteryTable();
  });
  _el('s-mastery-filter')?.addEventListener('change', e => {
    const normalized = normalizeMasteryFilter(e.target.value);
    e.target.value = normalized;
    renderMasteryTable();
  });
  _el('s-hint')?.addEventListener('change',    e => { setHintMode(e.target.value); syncTeacherPresetButtons(); });
  _el('s-play-style')?.addEventListener('change', e => {
    const next = applyPlayStyle(e.target.value);
    syncQuickSetupControls();
    WQUI.showToast(next === 'listening'
      ? 'Spelling Mode on: hear word + meaning, then spell.'
      : 'Detective Mode on: use tile colors and clues.');
  });
  _el('s-reveal-focus')?.addEventListener('change', e => {
    const next = applyRevealFocusMode(e.target.value);
    WQUI.showToast(next === 'on'
      ? 'Reveal focus is on: word + meaning first.'
      : 'Reveal focus is off: full detail layout.');
    syncTeacherPresetButtons();
  });
  _el('s-reveal-pacing')?.addEventListener('change', e => {
    const next = normalizeRevealPacing(e.target.value);
    e.target.value = next;
    setPref('revealPacing', next);
    WQUI.showToast(
      next === 'quick'
        ? 'Reveal pacing: quick.'
        : next === 'slow'
          ? 'Reveal pacing: slow.'
          : 'Reveal pacing: guided.'
    );
  });
  _el('s-reveal-auto-next')?.addEventListener('change', e => {
    const next = normalizeRevealAutoNext(e.target.value);
    e.target.value = next;
    setPref('revealAutoNext', next);
    if (next === 'off') {
      clearRevealAutoAdvanceTimer();
      WQUI.showToast('Auto next word is off.');
      return;
    }
    WQUI.showToast(`Auto next word: ${next} seconds.`);
  });
  _el('focus-hint-toggle')?.addEventListener('click', () => {
    recordAvaWordQuestEvent('hint_open');
    showInformantHintToast();
    speakAvaWordQuestAdaptive('hint_open');
  });
  const closeHintClueCard = (event) => {
    event.preventDefault();
    hideInformantHintCard();
  };
  _el('hint-clue-close-btn')?.addEventListener('click', closeHintClueCard);
  _el('hint-clue-close-icon')?.addEventListener('click', closeHintClueCard);
  _el('hint-clue-sentence-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const current = WQGame.getState?.()?.entry;
    const mode = String(event.currentTarget?.dataset?.mode || 'none').trim().toLowerCase();
    cancelRevealNarration();
    if (mode === 'word-meaning') {
      if (!current) {
        WQUI.showToast('Start a word first.');
        return;
      }
      void (async () => {
        await WQAudio.playWord(current);
        await WQAudio.playDef(current);
      })();
      return;
    }
    if (!current?.sentence) {
      WQUI.showToast('No sentence clue is available for this word yet.');
      return;
    }
    void WQAudio.playSentence(current);
  });
  _el('play-style-toggle')?.addEventListener('click', () => {
    const modeSelect = _el('s-play-style');
    if (!(modeSelect instanceof HTMLSelectElement)) return;
    const current = normalizePlayStyle(modeSelect.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
    const next = current === 'listening' ? 'detective' : 'listening';
    modeSelect.value = next;
    modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
  _el('s-dupe')?.addEventListener('change',    e => setPref('dupe',     e.target.value));
  _el('s-confetti')?.addEventListener('change',e => {
    setPref('confetti', e.target.value);
    syncTeacherPresetButtons();
  });
  _el('s-assessment-lock')?.addEventListener('change', e => {
    const enabled = !!e.target.checked;
    setPref('assessmentLock', enabled ? 'on' : 'off');
    syncAssessmentLockRuntime();
    syncTeacherPresetButtons();
    WQUI.showToast(enabled
      ? 'Assessment lock is on for active rounds.'
      : 'Assessment lock is off.');
  });
  _el('s-feedback')?.addEventListener('change', e => {
    applyFeedback(e.target.value);
    setPref('feedback', e.target.value);
  });
  _el('s-meaning-fun-link')?.addEventListener('change', e => {
    const enabled = !!e.target.checked;
    setPref('meaningPlusFun', enabled ? 'on' : 'off');
    WQUI.showToast(enabled
      ? 'Extended definition add-on is on.'
      : 'Extended definition add-on is off.'
    );
    if (!(_el('modal-overlay')?.classList.contains('hidden'))) {
      syncRevealMeaningHighlight(WQGame.getState()?.entry);
    }
  });
  _el('s-sor-notation')?.addEventListener('change', e => {
    const enabled = !!e.target.checked;
    setPref('sorNotation', enabled ? 'on' : 'off');
    WQUI.showToast(enabled
      ? 'SoR notation will show during reveal.'
      : 'SoR notation is hidden during reveal.'
    );
    if (!(_el('modal-overlay')?.classList.contains('hidden'))) {
      const currentEntry = WQGame.getState()?.entry;
      updateRevealSorBadge(currentEntry);
    }
  });
  _el('s-voice-task')?.addEventListener('change', e => {
    setVoicePracticeMode(e.target.value, { toast: true });
  });
  _el('s-boost-popups')?.addEventListener('change', e => {
    const normalized = e.target.value === 'off' ? 'off' : 'on';
    setPref('boostPopups', normalized);
    if (normalized === 'off') hideMidgameBoost();
    syncTeacherPresetButtons();
    WQUI.showToast(normalized === 'off' ? 'Engagement popups are off.' : 'Engagement popups are on.');
  });
  _el('s-reset-look-cache')?.addEventListener('click', () => {
    void resetAppearanceAndCache();
  });
  _el('s-force-update-now')?.addEventListener('click', () => {
    void forceUpdateNow();
  });
  _el('s-force-update-now-top')?.addEventListener('click', () => {
    void forceUpdateNow();
  });
  initRefreshLatestBanner();
  _el('diag-refresh-btn')?.addEventListener('click', () => {
    void renderDiagnosticsPanel();
  });
  _el('diag-copy-btn')?.addEventListener('click', () => {
    void copyDiagnosticsSummary();
  });
  _el('diag-copy-review-link-btn')?.addEventListener('click', () => {
    void copyReviewLink();
  });
  _el('session-copy-btn')?.addEventListener('click', () => {
    void copySessionSummary();
  });
  _el('session-copy-mastery-btn')?.addEventListener('click', () => {
    void copyMasterySummary();
  });
  _el('session-copy-mastery-csv-btn')?.addEventListener('click', () => {
    void copyMasterySummaryCsv();
  });
  _el('session-copy-mission-btn')?.addEventListener('click', () => {
    void copyMissionSummary();
  });
  _el('session-copy-mission-csv-btn')?.addEventListener('click', () => {
    void copyMissionSummaryCsv();
  });
  _el('session-copy-mtss-note-btn')?.addEventListener('click', () => {
    void copyMtssIepNote();
  });
  _el('session-copy-family-handout-btn')?.addEventListener('click', () => {
    void copyFamilyHandout();
  });
  _el('session-download-family-handout-btn')?.addEventListener('click', () => {
    downloadFamilyHandout();
  });
  _el('session-download-csv-bundle-btn')?.addEventListener('click', () => {
    downloadCsvBundle();
  });
  _el('session-download-class-rollup-btn')?.addEventListener('click', () => {
    downloadClassRollupCsv();
  });
  _el('session-copy-outcomes-btn')?.addEventListener('click', () => {
    void copySessionOutcomesSummary();
  });
  _el('session-copy-probe-export-btn')?.addEventListener('click', () => {
    void copyProbeSummary();
  });
  _el('session-copy-probe-csv-export-btn')?.addEventListener('click', () => {
    void copyProbeSummaryCsv();
  });
  _el('session-reset-btn')?.addEventListener('click', () => {
    resetSessionSummary();
    emitTelemetry('wq_funnel_reset_used', { source: 'teacher_session' });
    WQUI.showToast('Teacher session summary reset.');
  });
  _el('session-probe-start-btn')?.addEventListener('click', () => {
    startWeeklyProbe();
  });
  _el('session-probe-stop-btn')?.addEventListener('click', () => {
    finishWeeklyProbe();
  });
  _el('session-probe-copy-btn')?.addEventListener('click', () => {
    void copyProbeSummary();
  });
  _el('session-probe-copy-csv-btn')?.addEventListener('click', () => {
    void copyProbeSummaryCsv();
  });
  _el('s-playlist-select')?.addEventListener('change', (event) => {
    setSelectedPlaylistId(event.target?.value || '');
    renderPlaylistControls();
  });
  _el('s-playlist-name')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    _el('session-playlist-save-btn')?.click();
  });
  _el('session-playlist-save-btn')?.addEventListener('click', () => {
    if (!saveCurrentTargetToPlaylist()) {
      WQUI.showToast('Could not save the current target.');
      return;
    }
    WQUI.showToast('Current target saved to playlist.');
  });
  _el('session-playlist-assign-btn')?.addEventListener('click', () => {
    if (!assignSelectedPlaylistToActiveStudent()) {
      WQUI.showToast('Select a playlist first.');
      return;
    }
    WQUI.showToast(`Assigned playlist to ${getActiveStudentLabel()}.`);
  });
  _el('session-playlist-apply-btn')?.addEventListener('click', () => {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice('Finish this round before applying assigned playlists.');
      return;
    }
    if (!applyAssignedPlaylistForActiveStudent()) {
      WQUI.showToast('No assigned playlist for this student.');
      return;
    }
  });
  _el('session-playlist-delete-btn')?.addEventListener('click', () => {
    if (!deleteSelectedPlaylist()) {
      WQUI.showToast('Select a playlist to delete.');
      return;
    }
    WQUI.showToast('Playlist deleted.');
  });
  _el('session-mini-lesson-top-btn')?.addEventListener('click', () => {
    activeMiniLessonKey = 'top';
    renderMiniLessonPanel();
    WQUI.showToast('Loaded mini-lesson from top error.');
  });
  _el('session-mini-lesson-vowel-btn')?.addEventListener('click', () => {
    activeMiniLessonKey = 'vowel_pattern';
    renderMiniLessonPanel();
  });
  _el('session-mini-lesson-blend-btn')?.addEventListener('click', () => {
    activeMiniLessonKey = 'blend_position';
    renderMiniLessonPanel();
  });
  _el('session-mini-lesson-morpheme-btn')?.addEventListener('click', () => {
    activeMiniLessonKey = 'morpheme_ending';
    renderMiniLessonPanel();
  });
  _el('session-mini-lesson-context-btn')?.addEventListener('click', () => {
    activeMiniLessonKey = 'context_strategy';
    renderMiniLessonPanel();
  });
  _el('session-mini-lesson-copy-btn')?.addEventListener('click', () => {
    void copyMiniLessonPlan();
  });
  _el('s-roster-student')?.addEventListener('change', (event) => {
    const next = String(event.target?.value || '').trim();
    rosterState.active = rosterState.students.includes(next) ? next : '';
    saveRosterState();
    renderRosterControls();
    maybeApplyStudentPlanForActiveStudent();
    renderSessionSummary();
    renderProbePanel();
  });
  _el('session-roster-add-btn')?.addEventListener('click', () => {
    const input = _el('s-roster-name');
    const nextName = String(input?.value || '').trim();
    if (!nextName) {
      WQUI.showToast('Enter a student name first.');
      return;
    }
    if (addRosterStudent(nextName)) {
      if (input) input.value = '';
      renderSessionSummary();
      renderProbePanel();
      WQUI.showToast('Student added to roster.');
      return;
    }
    WQUI.showToast('Could not add student name.');
  });
  _el('s-roster-name')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    _el('session-roster-add-btn')?.click();
  });
  _el('session-roster-remove-btn')?.addEventListener('click', () => {
    if (!removeActiveRosterStudent()) {
      WQUI.showToast('Select a student to remove.');
      return;
    }
    renderSessionSummary();
    renderProbePanel();
    WQUI.showToast('Student removed from roster.');
  });
  _el('session-roster-clear-btn')?.addEventListener('click', () => {
    clearRosterStudents();
    renderSessionSummary();
    renderProbePanel();
    WQUI.showToast('Roster cleared for this device.');
  });
  window.WQTeacherAssignmentsFeature?.bindUI?.({
    contract: TEACHER_ASSIGNMENTS_CONTRACT,
    el: _el,
    toast: (message) => WQUI.showToast(message),
    normalizeLessonPackId,
    normalizeLessonTargetId,
    populateTargetSelectForPack: (...args) => teacherAssignmentsFeature?.populateTargetSelectForPack?.(...args) || 'custom',
    buildCurrentCurriculumSnapshot,
    getActiveStudentLabel,
    getGroupPlanCount: () => teacherAssignmentsFeature?.getGroupPlanCount?.() || 0,
    addGroupPlanEntry: (entry) => teacherAssignmentsFeature?.addGroupPlanEntry?.(entry),
    removeGroupPlanById: (id) => teacherAssignmentsFeature?.removeGroupPlanById?.(id),
    getFirstGroupPlanId: () => teacherAssignmentsFeature?.getFirstGroupPlanId?.() || '',
    getSelectedGroupPlan: () => teacherAssignmentsFeature?.getSelectedGroupPlan?.() || null,
    setSelectedGroupPlanId: (id) => teacherAssignmentsFeature?.setSelectedGroupPlanId?.(id),
    saveGroupPlanState: () => teacherAssignmentsFeature?.saveGroupPlanState?.(),
    renderGroupBuilderPanel,
    setStudentTargetLock: (student, payload) => teacherAssignmentsFeature?.setStudentTargetLock?.(student, payload) || false,
    clearStudentTargetLock: (student) => teacherAssignmentsFeature?.clearStudentTargetLock?.(student) || false,
    renderStudentLockPanel,
    maybeApplyStudentPlanForActiveStudent
  });
  _el('session-goal-save-btn')?.addEventListener('click', () => {
    const student = getActiveStudentLabel();
    const accuracyInput = _el('s-goal-accuracy');
    const guessesInput = _el('s-goal-guesses');
    const accuracyTarget = normalizeGoalAccuracy(accuracyInput?.value);
    const avgGuessesTarget = normalizeGoalGuesses(guessesInput?.value);
    if (accuracyInput) accuracyInput.value = String(accuracyTarget);
    if (guessesInput) guessesInput.value = String(avgGuessesTarget);
    setGoalForStudent(student, {
      accuracyTarget,
      avgGuessesTarget,
      updatedAt: Date.now()
    });
    renderStudentGoalPanel();
    WQUI.showToast(`Goal saved for ${student}.`);
  });
  _el('session-goal-clear-btn')?.addEventListener('click', () => {
    const student = getActiveStudentLabel();
    if (!clearGoalForStudent(student)) {
      WQUI.showToast('No saved goal to clear.');
      renderStudentGoalPanel();
      return;
    }
    renderStudentGoalPanel();
    WQUI.showToast(`Goal cleared for ${student}.`);
  });
  _el('session-rerun-onboarding-btn')?.addEventListener('click', () => {
    rerunOnboardingSetup();
  });
  _el('theme-dock-toggle-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!isQuickPopoverAllowed()) return;
    toggleQuickPopover('theme');
  });
  _el('theme-name-indicator')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!isQuickPopoverAllowed()) {
      _el('settings-btn')?.click();
      return;
    }
    toggleQuickPopover('theme');
  });
  _el('music-dock-toggle-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!isQuickPopoverAllowed()) return;
    toggleQuickPopover('music');
  });
  _el('theme-preview-done')?.addEventListener('click', () => {
    closeQuickPopover('theme');
  });

  /* Keyboard navigation for theme popover */
  _el('theme-preview-slot')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (window.WQThemeNav && typeof window.WQThemeNav.cycleTheme === 'function') {
        window.WQThemeNav.cycleTheme(-1);
        e.preventDefault();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (window.WQThemeNav && typeof window.WQThemeNav.cycleTheme === 'function') {
        window.WQThemeNav.cycleTheme(1);
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      closeQuickPopover('theme');
      e.preventDefault();
    }
  });

  _el('quick-music-done')?.addEventListener('click', () => {
    closeQuickPopover('music');
  });
  _el('quick-music-toggle')?.addEventListener('click', () => {
    toggleMusicQuick();
  });
  _el('quick-music-prev')?.addEventListener('click', () => {
    stepMusicVibe(-1);
  });
  _el('quick-music-next')?.addEventListener('click', () => {
    stepMusicVibe(1);
  });
  _el('quick-music-shuffle')?.addEventListener('click', () => {
    shuffleMusicVibe();
  });
  _el('s-music')?.addEventListener('change', e => {
    const selected = normalizeCuratedMusicMode(e.target.value);
    e.target.value = selected;
    setPref('music', selected);
    syncMusicForTheme({ toast: true });
  });
  _el('s-music-vol')?.addEventListener('input', e => {
    const next = Math.max(0, Math.min(1, parseFloat(e.target.value)));
    setPref('musicVol', String(Number.isFinite(next) ? next : parseFloat(DEFAULT_PREFS.musicVol)));
    if (musicController) musicController.setVolume(next);
    syncQuickMusicVolume(next);
  });
  _el('quick-music-vol')?.addEventListener('input', e => {
    const next = Math.max(0, Math.min(1, parseFloat(e.target.value)));
    const normalized = String(Number.isFinite(next) ? next : parseFloat(DEFAULT_PREFS.musicVol));
    const settingsInput = _el('s-music-vol');
    if (settingsInput) settingsInput.value = normalized;
    setPref('musicVol', normalized);
    if (musicController) musicController.setVolume(next);
    syncQuickMusicVolume(next);
  });
  _el('s-music-upload')?.addEventListener('change', (event) => {
    const files = event.target?.files || [];
    setLocalMusicFiles(files);
  });
  _el('s-music-clear-local')?.addEventListener('click', () => {
    clearLocalMusicFiles();
    const settingsInput = _el('s-music-upload');
    if (settingsInput) settingsInput.value = '';
  });

  _el('s-voice')?.addEventListener('change', e => {
    const normalized = normalizeVoiceMode(e.target.value);
    e.target.value = normalized;
    WQAudio.setVoiceMode(normalized);
    setPref('voice', normalized);
    const modalOpen = !(_el('modal-overlay')?.classList.contains('hidden'));
    if (normalized === 'off') {
      cancelRevealNarration();
      syncTeacherPresetButtons();
      WQUI.showToast('Voice read-aloud is off.');
      return;
    }
    if (modalOpen) {
      void runRevealNarration(WQGame.getState());
    }
    syncTeacherPresetButtons();
    WQUI.showToast('Voice read-aloud is on.');
  });

  window.WQTheme = Object.freeze({
    getTheme() {
      return normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    },
    setTheme(nextTheme, options = {}) {
      const normalized = applyTheme(nextTheme);
      if (options.persist !== false && shouldPersistTheme()) setPref('theme', normalized);
      return normalized;
    },
    getOrder() {
      if (ThemeRegistry && Array.isArray(ThemeRegistry.order)) return ThemeRegistry.order.slice();
      return ['default'];
    },
    getLabel(themeId) {
      if (ThemeRegistry && typeof ThemeRegistry.getLabel === 'function') {
        return ThemeRegistry.getLabel(themeId);
      }
      return normalizeTheme(themeId, getThemeFallback());
    }
  });

  var voiceTakeComplete = false;
  var voiceRecorder = null;
  var voiceStream = null;
  var voiceChunks = [];
  var voiceClipUrl = null;
  var voiceClipBlob = null;
  var voicePreviewAudio = null;
  var voiceAnalyser = null;
  var voiceAudioCtx = null;
  var voiceWaveRaf = 0;
  var voiceIsRecording = false;
  var voiceAutoStopTimer = 0;
  var voiceCountdownTimer = 0;
  var voiceCountdownToken = 0;
  var voiceKaraokeTimer = 0;
  var voiceKaraokeRunToken = 0;
  var revealNarrationToken = 0;
  const VOICE_PRIVACY_TOAST_KEY = 'wq_voice_privacy_toast_seen_v1';
  const VOICE_CAPTURE_MS = 3000;
  const VOICE_COUNTDOWN_SECONDS = 3;
  const VOICE_HISTORY_KEY = 'wq_v2_voice_history_v1';
  const VOICE_HISTORY_LIMIT = 3;

  function setVoiceRecordingUI(isRecording) {
    const recordBtn = _el('voice-record-btn');
    if (recordBtn) {
      const isCountingDown = !!voiceCountdownTimer;
      recordBtn.disabled = !!isRecording || isCountingDown;
      recordBtn.classList.toggle('is-recording', !!isRecording);
      recordBtn.textContent = isCountingDown
        ? 'Get Ready...'
        : isRecording
          ? 'Recording...'
          : 'Start Recording (3s countdown)';
    }
    const saveBtn = _el('voice-save-btn');
    if (saveBtn && isRecording) saveBtn.disabled = true;
  }

  function loadVoiceHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(VOICE_HISTORY_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => ({
          word: String(item?.word || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12),
          score: Math.max(0, Math.min(100, Number(item?.score) || 0)),
          label: String(item?.label || 'Captured').trim().slice(0, 28),
          tone: ['good', 'warn', 'error'].includes(String(item?.tone || '').toLowerCase())
            ? String(item.tone).toLowerCase()
            : 'default',
          at: Number(item?.at) || Date.now()
        }))
        .filter((item) => item.word)
        .slice(0, VOICE_HISTORY_LIMIT);
    } catch {
      return [];
    }
  }

  var voiceHistory = loadVoiceHistory();

  function saveVoiceHistory() {
    const entries = Array.isArray(voiceHistory) ? voiceHistory : [];
    try {
      localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(entries.slice(0, VOICE_HISTORY_LIMIT)));
    } catch {}
  }

  function renderVoiceHistoryStrip() {
    const listEl = _el('voice-history-items');
    const trendEl = _el('voice-history-trend');
    if (!listEl || !trendEl) return;
    const entries = Array.isArray(voiceHistory) ? voiceHistory.slice(0, VOICE_HISTORY_LIMIT) : [];
    listEl.innerHTML = '';

    if (!entries.length) {
      const empty = document.createElement('span');
      empty.className = 'voice-history-empty';
      empty.textContent = 'No clips yet.';
      listEl.appendChild(empty);
      trendEl.textContent = 'Trend: —';
      trendEl.classList.remove('is-up', 'is-down', 'is-steady');
      return;
    }

    entries.forEach((entry) => {
      const chip = document.createElement('span');
      chip.className = `voice-history-chip${entry.tone === 'good' || entry.tone === 'warn' || entry.tone === 'error' ? ` is-${entry.tone}` : ''}`;
      const word = document.createElement('b');
      word.textContent = entry.word;
      chip.appendChild(word);
      chip.appendChild(document.createTextNode(` ${entry.label} ${entry.score}`));
      listEl.appendChild(chip);
    });

    trendEl.classList.remove('is-up', 'is-down', 'is-steady');
    if (entries.length < 2) {
      trendEl.textContent = 'Trend: baseline';
      trendEl.classList.add('is-steady');
      return;
    }
    const delta = entries[0].score - entries[entries.length - 1].score;
    if (delta >= 10) {
      trendEl.textContent = 'Trend: rising ↑';
      trendEl.classList.add('is-up');
      return;
    }
    if (delta <= -10) {
      trendEl.textContent = 'Trend: dip ↓';
      trendEl.classList.add('is-down');
      return;
    }
    trendEl.textContent = 'Trend: steady →';
    trendEl.classList.add('is-steady');
  }

  function appendVoiceHistory(review) {
    const word = String(WQGame.getState()?.word || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 12);
    if (!word) return;
    const score = Math.max(0, Math.min(100, Number(review?.score) || 0));
    const label = String(review?.label || 'Captured').trim().slice(0, 28) || 'Captured';
    const tone = ['good', 'warn', 'error'].includes(String(review?.tone || '').toLowerCase())
      ? String(review.tone).toLowerCase()
      : 'default';

    voiceHistory = [{ word, score, label, tone, at: Date.now() }, ...voiceHistory]
      .slice(0, VOICE_HISTORY_LIMIT);
    saveVoiceHistory();
    renderVoiceHistoryStrip();
  }

  function clearVoiceClip() {
    if (voiceClipUrl) {
      URL.revokeObjectURL(voiceClipUrl);
      voiceClipUrl = null;
    }
    voiceClipBlob = null;
    const playBtn = _el('voice-play-btn');
    if (playBtn) playBtn.disabled = true;
    const saveBtn = _el('voice-save-btn');
    if (saveBtn) saveBtn.disabled = true;
  }

  function clearVoiceAutoStopTimer() {
    if (!voiceAutoStopTimer) return;
    clearTimeout(voiceAutoStopTimer);
    voiceAutoStopTimer = 0;
  }

  function clearVoiceCountdownTimer() {
    if (!voiceCountdownTimer) return;
    clearInterval(voiceCountdownTimer);
    voiceCountdownTimer = 0;
  }

  function resetKaraokeGuide(word = '') {
    const wordWrap = _el('voice-karaoke-word');
    const hintEl = _el('voice-karaoke-hint');
    const normalizedWord = String(word || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (wordWrap) {
      wordWrap.innerHTML = normalizedWord
        ? normalizedWord
          .split('')
          .map((ch) => `<span class="voice-karaoke-letter">${ch}</span>`)
          .join('')
        : '<span class="voice-karaoke-letter">?</span>';
    }
    if (hintEl) hintEl.textContent = normalizedWord
      ? 'Tap Guide Me to see pacing, then record.'
      : 'Start a round to load the target word.';
  }

  function stopKaraokeGuide() {
    voiceKaraokeRunToken += 1;
    if (voiceKaraokeTimer) {
      clearTimeout(voiceKaraokeTimer);
      voiceKaraokeTimer = 0;
    }
  }

  function runKaraokeGuide(entry) {
    stopKaraokeGuide();
    const word = String(entry?.word || '').toUpperCase().replace(/[^A-Z]/g, '');
    const hintEl = _el('voice-karaoke-hint');
    const wordWrap = _el('voice-karaoke-word');
    if (!wordWrap) return;
    resetKaraokeGuide(word);
    const letters = Array.from(wordWrap.querySelectorAll('.voice-karaoke-letter'));
    if (!letters.length || !word) return;
    if (hintEl) hintEl.textContent = 'Follow the highlight and match the pace.';
    const token = ++voiceKaraokeRunToken;
    const totalMs = Math.max(900, Math.min(3200, word.length * 300));
    const perLetter = Math.max(120, Math.floor(totalMs / letters.length));
    let index = 0;
    const tick = () => {
      if (token !== voiceKaraokeRunToken) return;
      letters.forEach((el, letterIndex) => {
        el.classList.toggle('is-active', letterIndex === index);
        el.classList.toggle('is-done', letterIndex < index);
      });
      const modalLetters = Array.from(document.querySelectorAll('#modal-word span'));
      modalLetters.forEach((el, letterIndex) => {
        el.classList.toggle('is-karaoke-active', letterIndex === index);
        el.classList.toggle('is-karaoke-done', letterIndex < index);
      });
      index += 1;
      if (index < letters.length) {
        voiceKaraokeTimer = setTimeout(tick, perLetter);
        return;
      }
      letters.forEach((el) => {
        el.classList.remove('is-active');
        el.classList.add('is-done');
      });
      modalLetters.forEach((el) => {
        el.classList.remove('is-karaoke-active');
        el.classList.add('is-karaoke-done');
      });
      voiceKaraokeTimer = setTimeout(() => {
        if (token !== voiceKaraokeRunToken) return;
        letters.forEach((el) => el.classList.remove('is-done'));
        modalLetters.forEach((el) => el.classList.remove('is-karaoke-done'));
        if (hintEl) hintEl.textContent = 'Nice pacing. Press Record when you are ready.';
        voiceKaraokeTimer = 0;
      }, 500);
    };
    tick();
  }

  function stopVoiceVisualizer() {
    if (voiceWaveRaf) {
      cancelAnimationFrame(voiceWaveRaf);
      voiceWaveRaf = 0;
    }
    if (voiceAudioCtx) {
      try { voiceAudioCtx.close(); } catch {}
      voiceAudioCtx = null;
    }
    voiceAnalyser = null;
  }

  function stopVoiceStream() {
    if (voiceStream) {
      voiceStream.getTracks().forEach((track) => track.stop());
      voiceStream = null;
    }
    voiceRecorder = null;
  }

  function stopVoiceCaptureNow() {
    clearVoiceAutoStopTimer();
    clearVoiceCountdownTimer();
    voiceCountdownToken += 1;
    try {
      if (voiceRecorder && voiceRecorder.state !== 'inactive') {
        voiceRecorder.stop();
      }
    } catch {}
    stopVoiceVisualizer();
    stopVoiceStream();
    voiceIsRecording = false;
    stopKaraokeGuide();
    setVoiceRecordingUI(false);
  }

  function drawWaveform() {}

  function animateLiveWaveform() {
    if (!voiceAnalyser) return;
    const points = new Uint8Array(voiceAnalyser.fftSize);
    const frame = () => {
      if (!voiceAnalyser) return;
      voiceAnalyser.getByteTimeDomainData(points);
      drawWaveform(points);
      voiceWaveRaf = requestAnimationFrame(frame);
    };
    frame();
  }

  function setVoicePracticeFeedback(message, tone = 'default') {
    const feedback = _el('voice-practice-feedback');
    if (!feedback) return;
    const normalizedTone = tone === true
      ? 'error'
      : tone === false
        ? 'default'
        : String(tone || 'default').toLowerCase();
    feedback.textContent = message || '';
    feedback.classList.toggle('is-error', normalizedTone === 'error');
    feedback.classList.toggle('is-warn', normalizedTone === 'warn');
    feedback.classList.toggle('is-good', normalizedTone === 'good');
  }

  async function analyzeVoiceClip(blob) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor || !blob?.size) return null;
    const ctx = new Ctor();
    try {
      const sourceBytes = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(sourceBytes.slice(0));
      const duration = Number(audioBuffer.duration) || (VOICE_CAPTURE_MS / 1000);
      let peak = 0;
      let sumSquares = 0;
      let voiced = 0;
      let samples = 0;
      const threshold = 0.02;
      const stride = 2;

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i += stride) {
          const abs = Math.abs(data[i] || 0);
          if (abs > peak) peak = abs;
          sumSquares += abs * abs;
          if (abs >= threshold) voiced += 1;
          samples += 1;
        }
      }
      if (!samples) return null;
      const rms = Math.sqrt(sumSquares / samples);
      const voicedRatio = voiced / samples;
      return { duration, peak, rms, voicedRatio };
    } catch {
      return null;
    } finally {
      try { await ctx.close(); } catch {}
    }
  }

  function buildVoiceFeedback(analysis, entry = null) {
    const targetWord = String(entry?.word || '').toLowerCase();
    const hasTh = targetWord.includes('th');
    const hasV = targetWord.includes('v');
    const hasR = targetWord.includes('r');
    const hasL = targetWord.includes('l');
    const hasShortI = /[bcdfghjklmnpqrstvwxyz]i[bcdfghjklmnpqrstvwxyz]/.test(targetWord);
    const ealTip = hasTh
      ? 'EAL tip: keep your tongue gently between teeth for "th".'
      : hasV
        ? 'EAL tip: for "v", use voice and touch your bottom lip to upper teeth.'
        : hasR && hasL
          ? 'EAL tip: check /r/ vs /l/ contrast and keep sounds distinct.'
          : hasShortI
            ? 'EAL tip: keep short /i/ crisp (as in "sit"), not /ee/.'
            : 'EAL tip: stress the main syllable and keep ending sounds clear.';
    if (!analysis) {
      return {
        message: `Clip captured. Play it back, compare with model audio. ${ealTip}`,
        tone: 'default',
        score: 60,
        label: 'Captured'
      };
    }
    if (analysis.duration < 1.4) {
      return {
        message: `Clip was very short. Speak right after the countdown. ${ealTip}`,
        tone: 'warn',
        score: 35,
        label: 'Short'
      };
    }
    if (analysis.rms < 0.012 || analysis.voicedRatio < 0.05) {
      return {
        message: `Clip was very quiet. Try a little louder or closer to the mic. ${ealTip}`,
        tone: 'warn',
        score: 44,
        label: 'Quiet'
      };
    }
    if (analysis.peak > 0.97 || analysis.rms > 0.25) {
      return {
        message: `Volume may be too high. Step back slightly and retry. ${ealTip}`,
        tone: 'warn',
        score: 52,
        label: 'Hot'
      };
    }
    return {
      message: `Great clarity. Play it back and compare with model audio. ${ealTip}`,
      tone: 'good',
      score: 86,
      label: 'Clear'
    };
  }

  function getKidFriendlyFocusLabel(notation) {
    const raw = String(notation || '').replace(/\s+/g, ' ').trim();
    const normalized = raw.toLowerCase();
    if (!raw) return '';
    if (normalized.includes('floss')) return 'FLOSS Rule: doubled ending letters (-ss, -ll, -ff, -zz)';
    if (normalized.includes('cvc') || normalized.includes('short vowel') || normalized.includes('closed syllable')) {
      return 'Sound Steps: CVC short-vowel pattern (cat, dog)';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E Rule: CVCe pattern (cap -> cape)';
    }
    if (normalized.includes('digraph')) return 'Sound Buddies: digraph (sh as in ship)';
    if (normalized.includes('vowel team')) return 'Vowel Team focus (ai as in rain)';
    if (normalized.includes('r-controlled')) return 'Bossy R focus (ar as in car)';
    if (normalized.includes('blend')) {
      if (normalized.includes('initial') || normalized.includes('ccvc')) return 'Blend Builders: initial blend (b+r as in bring)';
      if (normalized.includes('final') || normalized.includes('cvcc')) return 'Blend Builders: final blend (m+p as in camp)';
      return 'Blend Builders: consonant blend focus (br in bring)';
    }
    if (normalized.includes('trigraph')) return 'Three-letter team focus (igh as in light)';
    if (normalized.includes('diphthong')) return 'Glide vowel focus (oi in coin, ou in cloud)';
    if (normalized.includes('prefix')) return 'Prefix focus (re- as in replay)';
    if (normalized.includes('suffix')) return 'Suffix focus (-ed as in jumped)';
    if (normalized.includes('schwa')) return 'Schwa focus (a in about says /uh/)';
    if (normalized.includes('multisyll')) return 'Syllable strategy focus (chunk + blend)';
    return raw;
  }

  function getKidFriendlyFocusDetail(notation) {
    const normalized = String(notation || '').toLowerCase();
    if (normalized.includes('floss')) {
      return 'Floss Rule: after a short vowel at the end of a one-syllable word, double f, l, s, or z.';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E makes the vowel say its name: cap → cape, kit → kite.';
    }
    if (normalized.includes('digraph')) {
      return 'Digraphs are two letters that work together to make one sound.';
    }
    if (normalized.includes('vowel team')) {
      return 'Vowel teams are two vowels working together to make one main sound.';
    }
    if (normalized.includes('r-controlled')) {
      return 'Bossy R changes the vowel sound in patterns like ar, or, er, ir, and ur.';
    }
    if (normalized.includes('blend')) {
      return 'Blends keep both consonant sounds. Initial blend example: b+r in bring. Final blend example: m+p in camp.';
    }
    if (normalized.includes('schwa')) {
      return 'Schwa is the unstressed /uh/ sound in words like about or sofa.';
    }
    return '';
  }

  function updateRevealSorBadge(entry) {
    const sor = _el('modal-sor');
    if (!sor) return;
    const notation = String(entry?.phonics || '').trim();
    if (!isSorNotationEnabled() || !notation || notation.toLowerCase() === 'all') {
      sor.textContent = '';
      sor.removeAttribute('title');
      sor.classList.add('hidden');
      return;
    }
    sor.textContent = getKidFriendlyFocusLabel(notation);
    const detail = getKidFriendlyFocusDetail(notation);
    if (detail) sor.setAttribute('title', detail);
    else sor.removeAttribute('title');
    sor.classList.remove('hidden');
  }

  function updateVoicePracticePanel(state) {
    const panel = _el('modal-voice-practice');
    const practiceDetails = _el('modal-practice-details');
    const practiceStatus = _el('modal-practice-status');
    const target = _el('voice-practice-target');
    const playAgain = _el('play-again-btn');
    const challengePracticeBtn = _el('challenge-open-practice');
    const mode = getVoicePracticeMode();
    const word = String(state?.word || '').toUpperCase();
    if (challengePracticeBtn) challengePracticeBtn.classList.toggle('hidden', !STUDENT_RECORDING_ENABLED);

    if (practiceStatus) {
      const required = mode === 'required';
      practiceStatus.textContent = required ? 'Required' : 'Optional';
      practiceStatus.classList.toggle('is-required', required);
      const toggleLabel = required
        ? 'Tap to switch to Optional'
        : 'Tap to switch to Required';
      practiceStatus.setAttribute('title', toggleLabel);
      practiceStatus.setAttribute('aria-label', toggleLabel);
      if (practiceStatus instanceof HTMLButtonElement) {
        practiceStatus.disabled = mode === 'off';
      }
    }

    if (target) target.textContent = word ? `Target: ${word}` : '';
    if (!panel) return;
    renderVoiceHistoryStrip();

    if (mode === 'off') {
      if (voiceIsRecording) stopVoiceCaptureNow();
      panel.classList.add('hidden');
      if (practiceDetails) {
        practiceDetails.classList.add('hidden');
        practiceDetails.open = false;
      }
      if (playAgain) {
        playAgain.disabled = false;
        playAgain.removeAttribute('aria-disabled');
      }
      return;
    }

    if (practiceDetails) {
      practiceDetails.classList.remove('hidden');
      if (getRevealFocusMode() === 'off') practiceDetails.open = true;
    }
    panel.classList.remove('hidden');
    if (mode === 'required' && !voiceTakeComplete) {
      if (practiceDetails) practiceDetails.open = true;
      if (playAgain) {
        playAgain.disabled = true;
        playAgain.setAttribute('aria-disabled', 'true');
      }
      setVoicePracticeFeedback('Recording is required before the next word.');
      return;
    }

    if (playAgain) {
      playAgain.disabled = false;
      playAgain.removeAttribute('aria-disabled');
    }
    if (!voiceTakeComplete && !voiceIsRecording) {
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown, then compare with model audio.');
    }
  }

  function openVoicePracticeAndRecord(options = {}) {
    const mode = getVoicePracticeMode();
    const practiceDetails = _el('modal-practice-details');
    if (practiceDetails) practiceDetails.open = true;
    if (mode === 'off') {
      setVoicePracticeFeedback('Say It Back is off in Settings. Switch Voice Practice to Optional or Required.', 'warn');
      return false;
    }
    if (voiceIsRecording) {
      setVoicePracticeFeedback('Recording in progress...');
      return true;
    }
    const shouldAutoStart = options.autoStart !== false;
    if (shouldAutoStart && !voiceTakeComplete) {
      void startVoiceRecording();
      return true;
    }
    if (!voiceTakeComplete) {
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown and capture your voice.');
    }
    return true;
  }

  async function startVoiceRecording() {
    if (voiceIsRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoicePracticeFeedback('Recording is not available on this device.', true);
      return;
    }
    clearVoiceCountdownTimer();
    voiceCountdownToken += 1;
    const countdownToken = voiceCountdownToken;
    let secondsLeft = VOICE_COUNTDOWN_SECONDS;
    setVoiceRecordingUI(false);
    setVoicePracticeFeedback(`Get ready... recording starts in ${secondsLeft}.`);
    voiceCountdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (!voiceCountdownTimer || countdownToken !== voiceCountdownToken) return;
      if (secondsLeft > 0) {
        setVoicePracticeFeedback(`Get ready... recording starts in ${secondsLeft}.`);
        setVoiceRecordingUI(false);
        return;
      }
      clearVoiceCountdownTimer();
    }, 1000);
    setVoiceRecordingUI(false);
    await waitMs(VOICE_COUNTDOWN_SECONDS * 1000);
    if (countdownToken !== voiceCountdownToken) return;
    recordVoiceAttempt();
    try {
      clearVoiceClip();
      voiceTakeComplete = false;
      voiceChunks = [];
      setVoicePracticeFeedback('Recording now...');
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceRecorder = new MediaRecorder(voiceStream);
      voiceRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) voiceChunks.push(event.data);
      });
      voiceRecorder.addEventListener('stop', () => {
        clearVoiceAutoStopTimer();
        voiceIsRecording = false;
        setVoiceRecordingUI(false);
        stopVoiceVisualizer();
        stopVoiceStream();
        const blob = new Blob(voiceChunks, { type: voiceChunks[0]?.type || 'audio/webm' });
        if (!blob.size) {
          setVoicePracticeFeedback('No audio captured. Please try again.', true);
          return;
        }
        voiceClipBlob = blob;
        voiceClipUrl = URL.createObjectURL(blob);
        voiceTakeComplete = true;
        if (revealChallengeState) setChallengeTaskComplete('listen', true);
        const playBtn = _el('voice-play-btn');
        if (playBtn) playBtn.disabled = false;
        const saveBtn = _el('voice-save-btn');
        if (saveBtn) saveBtn.disabled = false;
        setVoicePracticeFeedback('Analyzing your clip...');
        updateVoicePracticePanel(WQGame.getState());
        void analyzeVoiceClip(blob).then((analysis) => {
          if (!voiceClipBlob || voiceClipBlob !== blob) return;
          const review = buildVoiceFeedback(analysis, WQGame.getState()?.entry || null);
          setVoicePracticeFeedback(review.message, review.tone);
          appendVoiceHistory(review);
        });
      });
      voiceIsRecording = true;
      setVoiceRecordingUI(true);
      setVoicePracticeFeedback('Recording for 3 seconds...');
      if (localStorage.getItem(VOICE_PRIVACY_TOAST_KEY) !== 'seen') {
        WQUI.showToast('Voice recordings stay on this device only. Nothing is uploaded.');
        localStorage.setItem(VOICE_PRIVACY_TOAST_KEY, 'seen');
      }
      clearVoiceAutoStopTimer();
      voiceAutoStopTimer = setTimeout(() => {
        if (voiceRecorder && voiceRecorder.state === 'recording') {
          stopVoiceRecording({ reason: 'auto' });
        }
      }, VOICE_CAPTURE_MS);

      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) {
        voiceAudioCtx = new Ctor();
        const source = voiceAudioCtx.createMediaStreamSource(voiceStream);
        voiceAnalyser = voiceAudioCtx.createAnalyser();
        voiceAnalyser.fftSize = 1024;
        source.connect(voiceAnalyser);
        animateLiveWaveform();
      } else {
        drawWaveform();
      }

      voiceRecorder.start();
    } catch {
      setVoicePracticeFeedback('Microphone access was blocked.', true);
      voiceIsRecording = false;
      setVoiceRecordingUI(false);
      clearVoiceAutoStopTimer();
      stopVoiceVisualizer();
      stopVoiceStream();
    }
  }

  function stopVoiceRecording(options = {}) {
    clearVoiceAutoStopTimer();
    if (voiceRecorder && voiceRecorder.state !== 'inactive') {
      voiceRecorder.stop();
      const reason = String(options.reason || 'manual');
      setVoicePracticeFeedback(reason === 'auto' ? 'Saving your 3-second clip...' : 'Saving your recording...');
    } else {
      stopVoiceCaptureNow();
    }
  }

  function playVoiceRecording() {
    if (!voiceClipUrl) return;
    if (voicePreviewAudio) {
      voicePreviewAudio.pause();
      voicePreviewAudio = null;
    }
    voicePreviewAudio = new Audio(voiceClipUrl);
    setVoicePracticeFeedback('Playing your recording. Compare with the model audio.');
    void voicePreviewAudio.play().catch(() => {
      setVoicePracticeFeedback('Could not play your recording on this device.', true);
    });
  }

  function saveVoiceRecording() {
    if (!voiceClipBlob || !voiceClipUrl) return;
    const currentWord = String(WQGame.getState()?.word || 'word')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'word';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = voiceClipBlob.type.includes('ogg')
      ? 'ogg'
      : voiceClipBlob.type.includes('mp4')
        ? 'm4a'
        : 'webm';
    const link = document.createElement('a');
    link.href = voiceClipUrl;
    link.download = `wordquest-${currentWord}-${stamp}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setVoicePracticeFeedback('Saved locally to your Downloads folder.');
  }

  function bindVoicePracticeControls() {
    if (document.body.dataset.wqVoicePracticeBound === '1') return;
    _el('voice-guide-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      runKaraokeGuide(WQGame.getState()?.entry || null);
      cancelRevealNarration();
      void WQAudio.playWord(WQGame.getState()?.entry || null);
    });
    _el('voice-record-btn')?.addEventListener('click', () => { void startVoiceRecording(); });
    _el('voice-play-btn')?.addEventListener('click', () => playVoiceRecording());
    _el('voice-save-btn')?.addEventListener('click', () => saveVoiceRecording());
    _el('modal-practice-status')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = getVoicePracticeMode();
      const next = current === 'required' ? 'optional' : 'required';
      setVoicePracticeMode(next, { toast: true });
      const details = _el('modal-practice-details');
      if (details && next === 'required') details.open = true;
    });
    _el('voice-quick-record-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openVoicePracticeAndRecord({ autoStart: true });
    });
    _el('modal-practice-details')?.addEventListener('toggle', (event) => {
      const details = event.currentTarget;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (voiceTakeComplete || voiceIsRecording) return;
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown.');
    });
    document.body.dataset.wqVoicePracticeBound = '1';
    setVoiceRecordingUI(false);
    resetKaraokeGuide(WQGame.getState()?.word || '');
    renderVoiceHistoryStrip();
  }

  function installRevealModalPatch() {
    if (!WQUI || typeof WQUI.showModal !== 'function') return;
    if (WQUI.__revealPatchApplied) return;
    bindVoicePracticeControls();
    const originalShowModal = WQUI.showModal.bind(WQUI);
    WQUI.showModal = function patchedShowModal(state) {
      clearRevealAutoAdvanceTimer();
      hideInformantHintCard();
      originalShowModal(state);
      voiceTakeComplete = false;
      stopVoiceCaptureNow();
      clearVoiceClip();
      resetKaraokeGuide(state?.word || '');
      updateRevealSorBadge(state?.entry);
      syncRevealMeaningHighlight(state?.entry);
      syncRevealChallengeLaunch(state);
      closeRevealChallengeModal({ silent: true });
      const practiceDetails = _el('modal-practice-details');
      if (practiceDetails) {
        const requiredPractice = getVoicePracticeMode() === 'required';
        practiceDetails.open = requiredPractice || getRevealFocusMode() === 'off';
      }
      const details = _el('modal-more-details');
      if (details && !details.classList.contains('hidden')) {
        details.open = getRevealFocusMode() === 'off';
      }
      updateVoicePracticePanel(state);
      syncRevealFocusModalSections();
      void runRevealNarration(state).finally(() => {
        if (_el('modal-overlay')?.classList.contains('hidden')) return;
        scheduleRevealAutoAdvance();
      });
      return state;
    };
    WQUI.__revealPatchApplied = true;
  }

  function installResponsiveLayoutPatch() {
    if (!WQUI || typeof WQUI.calcLayout !== 'function') return;
    if (WQUI.__layoutPatchApplied) return;

    const parsePx = (value, fallback = 0) => {
      const num = parseFloat(String(value || '').replace('px', '').trim());
      return Number.isFinite(num) ? num : fallback;
    };

    WQUI.calcLayout = function calcLayoutAdaptive(wordLength, maxGuesses) {
      const rootStyle = getComputedStyle(document.documentElement);
      const mainEl = document.querySelector('main');
      const boardZoneEl = document.querySelector('.board-zone');
      const supportRowEl = document.querySelector('.play-support-row');
      const boardPlateEl = document.querySelector('.board-plate');
      const keyboardEl = _el('keyboard');
      const coachRibbonEl = _el('wq-coach-ribbon');
      const gameplayAudioEl = document.querySelector('.gameplay-audio');
      const headerEl = document.querySelector('header');
      const focusEl = document.querySelector('.focus-bar');
      const nextActionEl = _el('next-action-line');
      const classroomTurnEl = _el('classroom-turn-line');
      const themeStripEl = _el('theme-preview-strip');

      const keyH = parsePx(rootStyle.getPropertyValue('--key-h'), 52);
      const keyGap = parsePx(rootStyle.getPropertyValue('--gap-key'), 8);
      const baseTileGap = parsePx(rootStyle.getPropertyValue('--gap-tile'), 9);
      const mainStyle = mainEl ? getComputedStyle(mainEl) : null;
      const mainInnerW = (mainEl?.clientWidth || Math.min(window.innerWidth, 560))
        - parsePx(mainStyle?.paddingLeft, 12)
        - parsePx(mainStyle?.paddingRight, 12);
      const mainPadTop = parsePx(mainStyle?.paddingTop, 10);
      const mainPadBottom = parsePx(mainStyle?.paddingBottom, 10);
      const boardZoneGap = parsePx(getComputedStyle(boardZoneEl || document.body).gap, 16);
      const platePadY = parsePx(getComputedStyle(boardPlateEl || document.body).paddingTop, 22) * 2;
      const platePadX = parsePx(getComputedStyle(boardPlateEl || document.body).paddingLeft, 26) * 2;
      const supportH = supportRowEl?.offsetHeight || 0;
      const coachH = (coachRibbonEl && !coachRibbonEl.classList.contains('hidden'))
        ? Math.max(0, coachRibbonEl.offsetHeight || 0)
        : 0;
      const audioH = supportH ? 0 : (gameplayAudioEl?.offsetHeight || 36);
      const headerH = headerEl?.offsetHeight || parsePx(rootStyle.getPropertyValue('--header-h'), 50);
      const focusH = focusEl?.offsetHeight || parsePx(rootStyle.getPropertyValue('--focus-h'), 44);
      const nextActionH = nextActionEl && !nextActionEl.classList.contains('hidden')
        ? Math.max(0, nextActionEl.offsetHeight || 0)
        : 0;
      const classroomTurnPosition = classroomTurnEl ? getComputedStyle(classroomTurnEl).position : '';
      const classroomTurnOverlay = classroomTurnPosition === 'fixed' || classroomTurnPosition === 'absolute';
      const classroomTurnH = classroomTurnEl && !classroomTurnEl.classList.contains('hidden') && !classroomTurnOverlay
        ? Math.max(0, classroomTurnEl.offsetHeight || 0)
        : 0;
      const themeNestedInHeader = Boolean(themeStripEl && headerEl && headerEl.contains(themeStripEl));
      const themeStripPosition = themeStripEl ? getComputedStyle(themeStripEl).position : '';
      const themeStripOverlay = themeStripEl
        ? themeStripPosition === 'fixed' || themeStripPosition === 'absolute'
        : false;
      const themeH = (themeNestedInHeader || themeStripOverlay) ? 0 : (themeStripEl?.offsetHeight || 0);
      const viewportH = window.visualViewport?.height || window.innerHeight;
      const viewportW = window.visualViewport?.width || window.innerWidth;
      const homeMode = document.documentElement.getAttribute('data-home-mode') || 'play';
      const playModeActive = homeMode === 'play';
      const safeEdge = parsePx(rootStyle.getPropertyValue('--wq-safe-edge'), 12);
      const playStyle = document.documentElement.getAttribute('data-play-style') || 'detective';
      const keyboardLayout = document.documentElement.getAttribute('data-keyboard-layout') || 'standard';
      const chunkTabsOn = document.documentElement.getAttribute('data-chunk-tabs') !== 'off';
      const isLandscape = viewportW >= viewportH;
      const isFullscreen = Boolean(document.fullscreenElement);
      let layoutMode = 'default';
      if (viewportW >= 1040 && viewportH >= 760) layoutMode = 'wide';
      else if (viewportH <= 560 || (isLandscape && viewportH <= 620)) layoutMode = 'compact';
      else if (viewportH <= 760) layoutMode = 'tight';
      const shortLaptopMode = playModeActive && viewportW >= 960 && viewportH <= 730;
      const tileGap = baseTileGap;
      const keyboardBottomGap = layoutMode === 'compact'
        ? (isFullscreen ? 2 : 4)
        : layoutMode === 'tight'
          ? (isFullscreen ? 3 : 5)
          : (isFullscreen ? 4 : 0);
      const listeningBottomGapBoost = playStyle === 'listening' ? 10 : 0;
      document.documentElement.setAttribute('data-layout-mode', layoutMode);
      document.documentElement.setAttribute('data-viewport-orientation', isLandscape ? 'landscape' : 'portrait');

      const chunkButtons = keyboardEl
        ? keyboardEl.querySelectorAll('.key-row-chunks .key').length
        : 0;
      const expectedChunkButtons = keyboardLayout === 'wilson' && chunkTabsOn ? 6 : 0;
      const effectiveChunkButtons = Math.max(chunkButtons, expectedChunkButtons);
      const chunkKeyH = Math.round(Math.max(18, keyH * (layoutMode === 'compact' ? 0.44 : 0.5)));
      const chunkSlotW = Math.max(46, Math.round((keyH * 0.82)));
      const chunkCols = Math.max(3, Math.floor(Math.max(280, mainInnerW) / chunkSlotW));
      const chunkRowsRaw = (keyboardLayout === 'wilson' && chunkTabsOn && effectiveChunkButtons > 0)
        ? Math.ceil(effectiveChunkButtons / chunkCols)
        : 0;
      const chunkRows = layoutMode === 'compact' ? Math.min(chunkRowsRaw, 1) : chunkRowsRaw;
      const chunkRowH = chunkRows > 0
        ? (chunkRows * chunkKeyH) + ((chunkRows - 1) * 5) + 8
        : 0;
      const supportReserveH = supportH ? Math.max(0, supportH - 2) : 0;
      const kbRows = 3;
      const keyboardSafetyPad = keyboardLayout === 'wilson'
        ? (layoutMode === 'compact' ? 24 : layoutMode === 'tight' ? 19 : 16)
        : 4;
      const kbH = kbRows * keyH + (kbRows - 1) * keyGap + chunkRowH + keyboardSafetyPad;

      const extraSafetyBase = layoutMode === 'compact' ? 30 : layoutMode === 'tight' ? 22 : layoutMode === 'wide' ? 14 : 18;
      const playModeSafety = homeMode === 'play' ? 12 : 0;
      const extraSafetyH = extraSafetyBase + playModeSafety;
      const listeningReserveH = playStyle === 'listening' ? 12 : 0;
      const teamTimerSafetyReserve = (isTeamModeEnabled() && getTurnTimerSeconds() > 0) ? 8 : 0;
      const reservedH = headerH + focusH + nextActionH + classroomTurnH + themeH + mainPadTop + mainPadBottom + audioH + kbH + coachH + (keyboardBottomGap + listeningBottomGapBoost) + boardZoneGap + supportReserveH + extraSafetyH + listeningReserveH + teamTimerSafetyReserve;
      const availableBoardH = Math.max(140, viewportH - reservedH);
      const guessDensityRelief = maxGuesses > 5 ? Math.min(12, (maxGuesses - 5) * 6) : 0;
      const byHeight = Math.floor((availableBoardH + guessDensityRelief - platePadY - tileGap * (maxGuesses - 1) + 2) / maxGuesses);

      const availableBoardW = Math.max(220, mainInnerW);
      const byWidth = Math.floor((availableBoardW - platePadX - tileGap * (wordLength - 1)) / wordLength);

      const sizeCap = layoutMode === 'wide' ? 102 : layoutMode === 'tight' ? 92 : layoutMode === 'compact' ? 84 : 98;
      const sizeFloor = layoutMode === 'compact' ? 34 : layoutMode === 'tight' ? 38 : 42;
      let size = Math.max(sizeFloor, Math.min(byHeight, byWidth, sizeCap));
      if (layoutMode !== 'compact' && size < sizeCap && byHeight > size + 1 && byWidth > size + 1) {
        size = Math.min(sizeCap, size + 4);
      }
      if (wordLength === 5 && layoutMode !== 'compact' && viewportW >= 900) {
        const wideFiveFloor = viewportH <= 760 ? 52 : 58;
        size = Math.max(size, wideFiveFloor);
      }
      if (shortLaptopMode) {
        size = Math.max(layoutMode === 'tight' ? 52 : sizeFloor, Math.min(size, wordLength === 5 ? 56 : 54));
      }
      const tileRadius = Math.max(10, Math.min(19, Math.round(size * 0.24)));
      const boardWidth = wordLength * size + (wordLength - 1) * tileGap;
      const boardHeight = maxGuesses * size + (maxGuesses - 1) * tileGap;
      const playfieldW = Math.ceil(boardWidth);
      const playfieldH = Math.ceil(boardHeight);

      const preferredKeyH = parseFloat(rootStyle.getPropertyValue('--key-h')) || 58;
      const preferredKeyMinW = parseFloat(rootStyle.getPropertyValue('--key-min-w')) || 38;
      const adaptiveKeyFloor = Math.max(
        playModeActive
          ? (layoutMode === 'compact' ? 31 : shortLaptopMode ? 32 : layoutMode === 'tight' ? 35 : layoutMode === 'wide' ? 40 : 41)
          : (layoutMode === 'compact' ? 36 : layoutMode === 'tight' ? 42 : 48),
        Math.round(preferredKeyH * (playModeActive ? 0.78 : 0.88))
      );
      const adaptiveKeyCeil = Math.min(
        playModeActive
          ? (layoutMode === 'compact' ? 41 : shortLaptopMode ? 42 : layoutMode === 'tight' ? 45 : layoutMode === 'wide' ? 50 : 52)
          : Math.max(layoutMode === 'wide' ? 62 : 60, Math.round(preferredKeyH)),
        Math.max(playModeActive ? 32 : 36, size - (playModeActive ? 8 : 4))
      );
      const keyScale = playModeActive
        ? (layoutMode === 'compact' ? 0.7 : shortLaptopMode ? 0.7 : layoutMode === 'tight' ? 0.74 : layoutMode === 'wide' ? 0.76 : 0.79)
        : (layoutMode === 'compact' ? 0.84 : layoutMode === 'tight' ? 0.85 : 0.86);
      const adaptiveKeyH = Math.max(adaptiveKeyFloor, Math.min(adaptiveKeyCeil, Math.round(size * keyScale)));
      let adaptiveKeyMinW = Math.max(
        playModeActive
          ? (layoutMode === 'compact' ? 22 : shortLaptopMode ? 24 : layoutMode === 'tight' ? 26 : 28)
          : (layoutMode === 'compact' ? 24 : layoutMode === 'tight' ? 28 : 32),
        Math.min(Math.round(preferredKeyMinW), Math.round(size * (playModeActive ? 0.72 : 0.78)))
      );
      let adaptiveKeyGap = Math.max(
        playModeActive ? (layoutMode === 'compact' ? 4.2 : shortLaptopMode ? 4.0 : 4.6) : (layoutMode === 'compact' ? 5.6 : 6.2),
        Math.min(playModeActive ? 8 : 10, Math.round(size * (playModeActive ? 0.12 : 0.16)))
      );
      const maxKeyboardW = Math.max(286, Math.min(window.innerWidth - (safeEdge * 2), mainInnerW - 4));
      const activeCols = keyboardLayout === 'wilson' ? 10 : 10;
      const estimateKeyboardW = () => (adaptiveKeyMinW * activeCols) + (adaptiveKeyGap * (activeCols - 1));
      const minKeyFloor = Math.max(
        playModeActive
          ? (layoutMode === 'compact' ? 22 : layoutMode === 'tight' ? 24 : 26)
          : (layoutMode === 'compact' ? 24 : layoutMode === 'tight' ? 28 : 30),
        Math.round(preferredKeyMinW - (playModeActive ? 6 : 4))
      );
      while (estimateKeyboardW() > maxKeyboardW && adaptiveKeyMinW > minKeyFloor) {
        adaptiveKeyMinW -= 1;
        if (adaptiveKeyGap > (playModeActive ? 4.2 : 5.4)) adaptiveKeyGap -= 0.2;
      }

      document.documentElement.style.setProperty('--tile-size', `${size}px`);
      document.documentElement.style.setProperty('--radius-tile', `${tileRadius}px`);
      document.documentElement.style.setProperty('--gap-tile', `${tileGap}px`);
      document.documentElement.style.setProperty('--playfield-width', `${playfieldW}px`);
      document.documentElement.style.setProperty('--playfield-height', `${playfieldH}px`);
      document.documentElement.style.setProperty('--key-h', `${Math.min(adaptiveKeyH, Math.max(playModeActive ? 30 : 36, size - (playModeActive ? 8 : 4)))}px`);
      document.documentElement.style.setProperty('--key-min-w', `${adaptiveKeyMinW}px`);
      document.documentElement.style.setProperty('--gap-key', `${Math.max(playModeActive ? 4.2 : 6, adaptiveKeyGap).toFixed(1)}px`);
      document.documentElement.style.setProperty('--keyboard-max-width', `${Math.ceil(maxKeyboardW)}px`);
      document.documentElement.style.setProperty('--keyboard-bottom-gap', `${keyboardBottomGap + listeningBottomGapBoost}px`);
      document.documentElement.style.setProperty('--play-header-h', `${Math.ceil(headerH)}px`);
      document.documentElement.style.setProperty('--play-focus-h', `${Math.ceil(focusH)}px`);

      if (boardPlateEl) {
        boardPlateEl.style.removeProperty('width');
      }

      if (keyboardEl && keyboardEl.offsetWidth > maxKeyboardW) {
        document.documentElement.style.setProperty('--key-min-w', `${Math.max(minKeyFloor, adaptiveKeyMinW - 2)}px`);
      }

      return { size, playfieldW };
    };

    WQUI.__layoutPatchApplied = true;
  }
  installRevealModalPatch();
  installResponsiveLayoutPatch();


function initSettings() { /* wired in app.js */ }

export { initSettings, setSettingsView, setHomeMode, setPageMode };
