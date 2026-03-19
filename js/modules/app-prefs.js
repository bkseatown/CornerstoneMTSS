/**
 * app-prefs.js
 * Preference loading, defaults, normalization, and migrations
 */

import {
  FEATURES, DEFAULT_PREFS, PREF_KEY, PREF_MIGRATION_KEY, PREF_UI_SKIN_RESET_MIGRATION_KEY,
  PREF_MUSIC_AUTO_MIGRATION_KEY, PREF_GUESSES_DEFAULT_MIGRATION_KEY, FIRST_RUN_SETUP_KEY,
  ALLOWED_MUSIC_MODES, ALLOWED_VOICE_MODES, ALLOWED_KEY_STYLES, ALLOWED_KEYBOARD_LAYOUTS,
  ALLOWED_UI_SKINS, KEYBOARD_LAYOUT_ORDER, KEYBOARD_LAYOUT_LABELS, SUPPORT_PROMPT_PREF_KEY,
  DUPE_PREF_KEY, SAFE_DEFAULT_GRADE_BAND, STUDENT_RECORDING_ENABLED,
  STARTER_WORD_SUPPORT_MODES, CURATED_MUSIC_MODES, KEYBOARD_PRESET_CONFIG, DEMO_MODE
} from './app-constants.js';
import { newGame } from './app-game.js';
import { getEffectiveGameplayGradeBand } from './app-focus.js';

// Debug mode
const DEMO_DEBUG_MODE = (() => {
  try {
    const params = new URLSearchParams(window.location.search || '');
    return String(params.get('debug') || '').trim() === '1';
  } catch {
    return false;
  }
})();

// ─── Preference Loading & Storage ──────────────────────────────────
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}

function savePrefs(p) {
  // In demo mode, don't persist
  if (window.WQ_DEMO || window.__CS_DEMO_STATE?.active) return;
  const normalized = p && typeof p === 'object' ? { ...p } : {};
  delete normalized.lessonPack;
  delete normalized.lessonTarget;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(normalized)); } catch {}
}

// Helper: Keyboard layout detection
function detectPreferredKeyboardLayout() {
  return 'standard';
}

const preferredInitialKeyboardLayout = detectPreferredKeyboardLayout();

// Initialize preferences from storage
var prefs = loadPrefs();

// Clean up old lesson pack/target keys (session-only)
if (Object.prototype.hasOwnProperty.call(prefs, 'lessonPack') || Object.prototype.hasOwnProperty.call(prefs, 'lessonTarget')) {
  delete prefs.lessonPack;
  delete prefs.lessonTarget;
  savePrefs(prefs);
}

// Always start from defaults for lesson pack/target
prefs.lessonPack = DEFAULT_PREFS.lessonPack;
prefs.lessonTarget = DEFAULT_PREFS.lessonTarget;

function setPref(k, v) { prefs[k] = v; savePrefs(prefs); }

// ─── Normalization Functions (from original app.js) ──────────────────────────────────

function normalizeKeyboardLayout(mode) {
  const raw = String(mode || '').trim().toLowerCase();
  if (raw === 'qwerty') return 'standard';
  if (raw === 'alpha' || raw === 'abc') return 'alphabet';
  return ALLOWED_KEYBOARD_LAYOUTS.has(raw) ? raw : DEFAULT_PREFS.keyboardLayout;
}

function normalizeStarterWordMode(mode) {
  const raw = String(mode || '').trim().toLowerCase();
  if (raw === 'ondemand') return 'on_demand';
  if (raw === 'auto2' || raw === 'after2') return 'after_2';
  if (raw === 'auto3' || raw === 'after3') return 'after_3';
  return STARTER_WORD_SUPPORT_MODES.has(raw) ? raw : DEFAULT_PREFS.starterWords;
}

function normalizeCuratedMusicMode(mode) {
  const normalized = normalizeMusicMode(mode);
  if (CURATED_MUSIC_MODES.has(normalized)) return normalized;
  if (normalized === 'deepfocus' || normalized === 'fantasy' || normalized === 'stealth') return 'lofi';
  if (normalized === 'classicalbeats') return 'coffee';
  if (normalized === 'focus') return 'chill';
  if (normalized === 'nerdcore' || normalized === 'scifi' || normalized === 'upbeat' || normalized === 'arcade' || normalized === 'sports') return 'team';
  return DEFAULT_PREFS.music;
}

function normalizeUiSkin(mode) {
  // Premium skin is temporarily disabled to prevent washed-out gameplay surfaces.
  return 'classic';
}

function normalizeTextSize(mode) {
  const raw = String(mode || '').trim().toLowerCase();
  if (raw === 'small' || raw === 'large') return raw;
  return 'medium';
}

function getKeyboardLayoutLabel(mode) {
  const normalized = normalizeKeyboardLayout(mode);
  return KEYBOARD_LAYOUT_LABELS[normalized] || 'QWERTY';
}

function getNextKeyboardLayout(currentLayout) {
  const normalized = normalizeKeyboardLayout(currentLayout);
  const currentIndex = KEYBOARD_LAYOUT_ORDER.indexOf(normalized);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  return KEYBOARD_LAYOUT_ORDER[(safeIndex + 1) % KEYBOARD_LAYOUT_ORDER.length];
}

function normalizeKeyboardPresetId(mode) {
  const raw = String(mode || '').trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(KEYBOARD_PRESET_CONFIG, raw)) return raw;
  return 'qwerty-classic';
}

function deriveKeyboardPresetId(layoutMode, keyStyleMode) {
  const layout = normalizeKeyboardLayout(layoutMode);
  const family = layout === 'alphabet' ? 'alphabet' : 'qwerty';
  return normalizeKeyboardPresetId(`${family}-classic`);
}

function getSupportPromptMode() {
  try {
    return localStorage.getItem(SUPPORT_PROMPT_PREF_KEY) === 'off' ? 'off' : 'on';
  } catch {
    return 'on';
  }
}

function setSupportPromptMode(mode) {
  try {
    localStorage.setItem(SUPPORT_PROMPT_PREF_KEY, mode === 'off' ? 'off' : 'on');
  } catch {}
}

// Forward declarations for functions defined later in the 2-space block
let persistPageMode, normalizePageMode, loadStoredPageMode, readPageModeFromQuery, isMissionLabEnabled;

  var autoPhysicalKeyboardSwitchApplied = false;
  var firstRunSetupPending = false;
  var pageMode = 'wordquest';
  var homeMode = 'home';
  var focusSupportUnlockAt = 0;
  var focusSupportUnlockTimer = 0;
  var focusSupportUnlockedByMiss = false;
  var currentRoundSupportPromptShown = false;
  var lastSupportPromptShownAt = 0;  // Track when help was last shown to allow reappearing every 30s
  var focusSupportEligibleAt = 0;  // Timestamp when 30 seconds have elapsed for showing help
  var gameStartedAt = 0;  // Track when current game started
  var supportModalTimer = 0;  // Timer for showing support modal after 30 seconds

  // One-time baseline migration so existing installs land on your intended defaults.
  if (localStorage.getItem(PREF_MIGRATION_KEY) !== 'done') {
    if (prefs.length === undefined || prefs.length === 'any') prefs.length = DEFAULT_PREFS.length;
    if (prefs.guesses === undefined) prefs.guesses = DEFAULT_PREFS.guesses;
    if (prefs.feedback === undefined || prefs.feedback === 'classic') prefs.feedback = DEFAULT_PREFS.feedback;
    if (prefs.music === undefined || prefs.music === 'off') prefs.music = DEFAULT_PREFS.music;
    if (prefs.musicVol === undefined) prefs.musicVol = DEFAULT_PREFS.musicVol;
    if (prefs.focus === undefined) prefs.focus = DEFAULT_PREFS.focus;
    if (prefs.lessonPack === undefined) prefs.lessonPack = DEFAULT_PREFS.lessonPack;
    if (prefs.lessonTarget === undefined) prefs.lessonTarget = DEFAULT_PREFS.lessonTarget;
    if (prefs.grade === undefined) prefs.grade = DEFAULT_PREFS.grade;
    if (prefs.smartKeyLock === undefined) prefs.smartKeyLock = DEFAULT_PREFS.smartKeyLock;
    if (prefs.themeSave === undefined) prefs.themeSave = DEFAULT_PREFS.themeSave;
    if (prefs.keyboardLayout === undefined) prefs.keyboardLayout = preferredInitialKeyboardLayout;
    if (prefs.boardStyle === undefined) {
      prefs.boardStyle = DEFAULT_PREFS.boardStyle;
    }
    if (prefs.keyStyle === undefined) {
      prefs.keyStyle = DEFAULT_PREFS.keyStyle;
    }
    if (prefs.chunkTabs === undefined) prefs.chunkTabs = DEFAULT_PREFS.chunkTabs;
    if (prefs.atmosphere === undefined) prefs.atmosphere = DEFAULT_PREFS.atmosphere;
    if (prefs.meaningPlusFun === undefined) prefs.meaningPlusFun = DEFAULT_PREFS.meaningPlusFun;
    if (prefs.sorNotation === undefined) prefs.sorNotation = DEFAULT_PREFS.sorNotation;
    if (prefs.revealFocus === undefined) prefs.revealFocus = DEFAULT_PREFS.revealFocus;
    if (prefs.playStyle === undefined) prefs.playStyle = DEFAULT_PREFS.playStyle;
    if (prefs.confidenceCoaching === undefined) prefs.confidenceCoaching = DEFAULT_PREFS.confidenceCoaching;
    if (prefs.voicePractice === undefined) prefs.voicePractice = DEFAULT_PREFS.voicePractice;
    if (prefs.teamMode === undefined) prefs.teamMode = DEFAULT_PREFS.teamMode;
    if (prefs.teamCount === undefined) prefs.teamCount = DEFAULT_PREFS.teamCount;
    if (prefs.turnTimer === undefined) prefs.turnTimer = DEFAULT_PREFS.turnTimer;
    if (prefs.probeRounds === undefined) prefs.probeRounds = DEFAULT_PREFS.probeRounds;
    if (prefs.reportCompact === undefined) prefs.reportCompact = DEFAULT_PREFS.reportCompact;
    if (prefs.assessmentLock === undefined) prefs.assessmentLock = DEFAULT_PREFS.assessmentLock;
    if (prefs.boostPopups === undefined) prefs.boostPopups = DEFAULT_PREFS.boostPopups;
    if (prefs.starterWords === undefined) prefs.starterWords = DEFAULT_PREFS.starterWords;
    if (prefs.uiSkin === undefined) prefs.uiSkin = DEFAULT_PREFS.uiSkin;
    if (prefs.textSize === undefined) prefs.textSize = DEFAULT_PREFS.textSize;
    if (prefs.themeSave !== 'on') delete prefs.theme;
    savePrefs(prefs);
    localStorage.setItem(PREF_MIGRATION_KEY, 'done');
  }
  {
    const normalizedUiSkin = normalizeUiSkin(prefs.uiSkin);
    if (prefs.uiSkin !== normalizedUiSkin) {
      prefs.uiSkin = normalizedUiSkin;
      savePrefs(prefs);
    }
  }
  if (localStorage.getItem(PREF_UI_SKIN_RESET_MIGRATION_KEY) !== 'done') {
    prefs.uiSkin = DEFAULT_PREFS.uiSkin;
    savePrefs(prefs);
    localStorage.setItem(PREF_UI_SKIN_RESET_MIGRATION_KEY, 'done');
  }
  if (localStorage.getItem(PREF_MUSIC_AUTO_MIGRATION_KEY) !== 'done') {
    const currentMusic = String(prefs.music || '').toLowerCase();
    if (!currentMusic || currentMusic === 'lofi' || currentMusic === 'auto') {
      prefs.music = DEFAULT_PREFS.music;
    }
    const vol = parseFloat(prefs.musicVol ?? DEFAULT_PREFS.musicVol);
    if (!Number.isFinite(vol) || vol < 0.4) prefs.musicVol = DEFAULT_PREFS.musicVol;
    savePrefs(prefs);
    localStorage.setItem(PREF_MUSIC_AUTO_MIGRATION_KEY, 'done');
  }
  if (localStorage.getItem(PREF_GUESSES_DEFAULT_MIGRATION_KEY) !== 'done') {
    const currentGuesses = parseInt(String(prefs.guesses ?? ''), 10);
    if (!Number.isFinite(currentGuesses) || currentGuesses === 5) {
      prefs.guesses = DEFAULT_PREFS.guesses;
    }
    savePrefs(prefs);
    localStorage.setItem(PREF_GUESSES_DEFAULT_MIGRATION_KEY, 'done');
  }
  if (prefs.meaningPlusFun === undefined) {
    prefs.meaningPlusFun = DEFAULT_PREFS.meaningPlusFun;
    savePrefs(prefs);
  }
  if (prefs.lessonPack === undefined) {
    prefs.lessonPack = DEFAULT_PREFS.lessonPack;
    savePrefs(prefs);
  }
  if (prefs.lessonTarget === undefined) {
    prefs.lessonTarget = DEFAULT_PREFS.lessonTarget;
    savePrefs(prefs);
  }
  if (prefs.sorNotation === undefined) {
    prefs.sorNotation = DEFAULT_PREFS.sorNotation;
    savePrefs(prefs);
  }
  if (prefs.revealFocus === undefined) {
    prefs.revealFocus = DEFAULT_PREFS.revealFocus;
    savePrefs(prefs);
  }
  if (prefs.revealPacing === undefined) {
    prefs.revealPacing = DEFAULT_PREFS.revealPacing;
    savePrefs(prefs);
  }
  if (prefs.revealAutoNext === undefined) {
    prefs.revealAutoNext = DEFAULT_PREFS.revealAutoNext;
    savePrefs(prefs);
  }
  if (prefs.voicePractice === undefined) {
    prefs.voicePractice = DEFAULT_PREFS.voicePractice;
    savePrefs(prefs);
  }
  if (prefs.teamMode === undefined) {
    prefs.teamMode = DEFAULT_PREFS.teamMode;
    savePrefs(prefs);
  }
  if (prefs.teamCount === undefined) {
    prefs.teamCount = DEFAULT_PREFS.teamCount;
    savePrefs(prefs);
  }
  if (prefs.turnTimer === undefined) {
    prefs.turnTimer = DEFAULT_PREFS.turnTimer;
    savePrefs(prefs);
  }
  if (prefs.probeRounds === undefined) {
    prefs.probeRounds = DEFAULT_PREFS.probeRounds;
    savePrefs(prefs);
  }
  if (prefs.reportCompact === undefined) {
    prefs.reportCompact = DEFAULT_PREFS.reportCompact;
    savePrefs(prefs);
  }
  if (prefs.assessmentLock === undefined) {
    prefs.assessmentLock = DEFAULT_PREFS.assessmentLock;
    savePrefs(prefs);
  }
  if (prefs.boostPopups === undefined) {
    prefs.boostPopups = DEFAULT_PREFS.boostPopups;
    savePrefs(prefs);
  }
  if (prefs.confidenceCoaching === undefined) {
    prefs.confidenceCoaching = DEFAULT_PREFS.confidenceCoaching;
    savePrefs(prefs);
  }
  if (prefs.starterWords === undefined) {
    prefs.starterWords = DEFAULT_PREFS.starterWords;
    savePrefs(prefs);
  }
  const normalizedStarterWordsMode = normalizeStarterWordMode(prefs.starterWords);
  if (prefs.starterWords !== normalizedStarterWordsMode) {
    prefs.starterWords = normalizedStarterWordsMode;
    savePrefs(prefs);
  }
  if (prefs.keyboardLayout !== 'standard' && prefs.keyboardLayout !== 'alphabet') {
    prefs.keyboardLayout = DEFAULT_PREFS.keyboardLayout;
    savePrefs(prefs);
  }
  if (!ALLOWED_KEY_STYLES.has(String(prefs.keyStyle || '').toLowerCase()) || prefs.keyStyle === 'bubble') {
    prefs.keyStyle = DEFAULT_PREFS.keyStyle;
    savePrefs(prefs);
  }
  if (!['small', 'medium', 'large'].includes(String(prefs.textSize || '').toLowerCase())) {
    prefs.textSize = DEFAULT_PREFS.textSize;
    savePrefs(prefs);
  }
  if (!ALLOWED_MUSIC_MODES.has(String(prefs.music || '').toLowerCase())) {
    prefs.music = DEFAULT_PREFS.music;
    savePrefs(prefs);
  }
  function enforceStartupGameplayDefaults() {
    const startupDefaults = Object.freeze({
      focus: DEFAULT_PREFS.focus,
      lessonPack: DEFAULT_PREFS.lessonPack,
      lessonTarget: DEFAULT_PREFS.lessonTarget,
      grade: DEFAULT_PREFS.grade,
      length: DEFAULT_PREFS.length
    });
    let changed = false;
    // Keep launch predictable on hard refresh: always start in Classic 5-letter mode.
    if (prefs.focus !== DEFAULT_PREFS.focus) {
      prefs.focus = DEFAULT_PREFS.focus;
      changed = true;
    }
    if (String(prefs.length || '').trim() !== DEFAULT_PREFS.length) {
      prefs.length = DEFAULT_PREFS.length;
      changed = true;
    }
    Object.entries(startupDefaults).forEach(([key, value]) => {
      const current = prefs[key];
      if (current !== undefined && current !== null && String(current).trim() !== '') return;
      prefs[key] = value;
      changed = true;
    });
    if (changed) savePrefs(prefs);
    try {
      localStorage.removeItem('wq_v2_grade_band');
      localStorage.removeItem('wq_v2_length');
    } catch {}
  }
  enforceStartupGameplayDefaults();
  function enforceLockedDemoDefaults() {
    const lockedDefaults = Object.freeze({
      projector: 'on',
      feedback: 'themed',
      revealFocus: 'on',
      revealPacing: 'guided',
      revealAutoNext: 'off',
      meaningPlusFun: 'on',
      sorNotation: 'on',
      confidenceCoaching: 'off'
    });
    let changed = false;
    Object.entries(lockedDefaults).forEach(([key, value]) => {
      if (prefs[key] === value) return;
      prefs[key] = value;
      changed = true;
    });
    if (changed) savePrefs(prefs);
  }
  enforceLockedDemoDefaults();
  const _el = id => document.getElementById(id);
  const SAFE_STREAK_KEY = 'wordquest_streak';
  function loadStreak() {
    return parseInt(localStorage.getItem(SAFE_STREAK_KEY) || '0', 10) || 0;
  }
  function saveStreak(value) {
    localStorage.setItem(SAFE_STREAK_KEY, String(Math.max(0, Number(value) || 0)));
  }
  function incrementStreak() {
    let streak = loadStreak();
    streak += 1;
    saveStreak(streak);
    return streak;
  }
  function renderSafeStreak() {
    if (!FEATURES.streakSystem) return;
    const streakCount = _el('streakCount');
    if (streakCount) streakCount.textContent = String(loadStreak());
  }
  function filterWords(words, difficulty) {
    if (!FEATURES.adaptiveDifficulty) return words;
    const list = Array.isArray(words) ? words.slice() : [];
    if (difficulty === 'easy') {
      return list.filter((w) => String(w || '').length <= 5);
    }
    if (difficulty === 'medium') {
      return list.filter((w) => String(w || '').length <= 7);
    }
    return list;
  }
  window.WQSafeFilterWords = filterWords;
  renderSafeStreak();
  const TELEMETRY_ENABLED_KEY = 'wq_v2_telemetry_enabled_v1';
  const TELEMETRY_DEVICE_ID_KEY = 'wq_v2_device_id_local_v1';
  const TELEMETRY_ENDPOINT_KEY = 'wq_v2_telemetry_endpoint_v1';
  const TELEMETRY_LAST_UPLOAD_KEY = 'wq_v2_telemetry_last_upload_v1';
  const TELEMETRY_QUEUE_LIMIT = 500;
  const TELEMETRY_SESSION_ID = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const telemetrySessionStartedAt = Date.now();
  var telemetryLastMusicSignature = '';
  var telemetryUploadInFlight = false;
  var telemetryUploadIntervalId = 0;
  const HOVER_NOTE_DELAY_MS = 500;
  const HOVER_NOTE_TARGET_SELECTOR = '.icon-btn, .header-quick-btn, .focus-action-btn, .theme-preview-music, .wq-theme-nav-btn, .quick-popover-done';
  var hoverNoteTimer = 0;
  var hoverNoteTarget = null;
  var hoverNoteEl = null;
  var focusSearchReopenGuardUntil = 0;
  const ThemeRegistry = window.WQThemeRegistry || null;
  const shouldPersistTheme = () => (prefs.themeSave || DEFAULT_PREFS.themeSave) === 'on';
  var musicController = null;
  var challengeSprintTimer = 0;
  var challengePacingTimer = 0;
  var challengeModalReturnFocusEl = null;
  var demoRoundComplete = false;
  var demoEndOverlayEl = null;
  var demoBannerEl = null;
  var demoLaunchBtnEl = null;
  var demoCoachEl = null;
  var demoCoachReadyTimer = 0;
  var demoAutoplayTimer = 0;
  var demoDebugLabelEl = null;
  var demoToastEl = null;
  var demoToastTextEl = null;
  var demoToastBarFillEl = null;
  var demoToastChipEl = null;
  var demoToastProgressTimer = 0;
  var demoToastStartedAt = 0;
  var demoToastDurationMs = 90000;
  var demoToastCollapsed = false;
  var demoToastAutoCollapsedByPlay = false;
  var demoToastMessageTimer = 0;
  var demoToastLastMessageAt = 0;
  var demoToastPendingKey = '';
  const DEMO_TOAST_DEFAULT_DURATION_MS = 90000;
  const DEMO_TOAST_MIN_DWELL_MS = 3200;
  var homeCoachRibbon = null;
  var wordQuestCoachRibbon = null;
  var _wqDiagSession = null;
  var _wqDiagTimer = null;
  var _latestSavedSessionId = '';
  var _activeEvidenceSessionId = '';
  var wordQuestCoachKey = 'before_guess';
  const DEMO_COACH_READY_MAX_TRIES = 25;
  const DEMO_COACH_READY_DELAY_MS = 120;
  const demoState = {
    step: 0,
    guessCount: 0,
    suggestions: ['slate', 'plain', 'plant'],
    discoveredCore: new Set(),
    keyPulseTimer: 0,
    keyPulseIndex: 0,
    hintUsed: false,
    overlaysClosed: false,
    coachMounted: false,
    lastCoachStepId: '',
    handledGuessCounts: new Set()
  };
  const DEMO_OVERLAY_SELECTORS = Object.freeze([
    '#focus-inline-results:not(.hidden)',
    '#teacher-panel:not(.hidden)',
    '#modal-overlay:not(.hidden)',
    '#challenge-modal:not(.hidden)',
    '#phonics-clue-modal:not(.hidden)',
    '#listening-mode-overlay:not(.hidden)',
    '#first-run-setup-modal:not(.hidden)',
    '#end-modal:not(.hidden)',
    '#modal-challenge-launch:not(.hidden)'
  ]);

  function getDemoToastLine(stepKey) {
    const key = String(stepKey || '').trim().toLowerCase();
    if (key === 'afterfirstguess') return 'Nice. Use green/yellow clues on the next guess.';
    if (key === 'idle20s') return 'Small step: change one letter using the clues.';
    if (key === 'completed') return 'Demo done. Want another round?';
    return 'Live demo: try one round.';
  }

  function stopDemoToastProgress() {
    if (!demoToastProgressTimer) return;
    clearInterval(demoToastProgressTimer);
    demoToastProgressTimer = 0;
  }

  function clearDemoToastMessageTimer() {
    if (demoToastMessageTimer) {
      clearTimeout(demoToastMessageTimer);
      demoToastMessageTimer = 0;
    }
    demoToastPendingKey = '';
  }

  function renderDemoToastProgress(forcePct) {
    if (!(demoToastBarFillEl instanceof HTMLElement)) return;
    let pct = Number(forcePct);
    if (!Number.isFinite(pct)) {
      if (!demoToastStartedAt || !demoToastDurationMs) pct = 0;
      else pct = ((Date.now() - demoToastStartedAt) / demoToastDurationMs) * 100;
    }
    const clamped = Math.max(0, Math.min(100, pct));
    demoToastBarFillEl.style.width = `${clamped}%`;
  }

  function startDemoToastProgress(durationMs = DEMO_TOAST_DEFAULT_DURATION_MS) {
    demoToastDurationMs = Math.max(5000, Number(durationMs) || DEMO_TOAST_DEFAULT_DURATION_MS);
    demoToastStartedAt = Date.now();
    renderDemoToastProgress(0);
    stopDemoToastProgress();
    demoToastProgressTimer = setInterval(() => {
      renderDemoToastProgress();
      if (Date.now() - demoToastStartedAt >= demoToastDurationMs) {
        stopDemoToastProgress();
      }
    }, 160);
  }

  function setDemoToastText(stepKey, options = {}) {
    if (!(demoToastTextEl instanceof HTMLElement)) return;
    const nextLine = getDemoToastLine(stepKey);
    const force = !!(options && options.force);
    if (!nextLine || demoToastTextEl.textContent === nextLine) {
      demoToastPendingKey = '';
      return;
    }
    const now = Date.now();
    const elapsed = now - demoToastLastMessageAt;
    const needsDelay = !force && demoToastLastMessageAt > 0 && elapsed < DEMO_TOAST_MIN_DWELL_MS;
    if (needsDelay) {
      demoToastPendingKey = stepKey;
      if (demoToastMessageTimer) return;
      demoToastMessageTimer = window.setTimeout(() => {
        demoToastMessageTimer = 0;
        const pending = demoToastPendingKey;
        demoToastPendingKey = '';
        if (!pending) return;
        setDemoToastText(pending, { force: true });
      }, Math.max(120, DEMO_TOAST_MIN_DWELL_MS - elapsed));
      return;
    }
    if (demoToastMessageTimer) {
      clearDemoToastMessageTimer();
    }
    demoToastTextEl.textContent = nextLine;
    demoToastLastMessageAt = now;
  }

  function setDemoToastTextLiteral(line, options = {}) {
    if (!(demoToastTextEl instanceof HTMLElement)) return;
    const nextLine = String(line || '').trim();
    if (!nextLine) return;
    const force = !!(options && options.force);
    const now = Date.now();
    const elapsed = now - demoToastLastMessageAt;
    const needsDelay = !force && demoToastLastMessageAt > 0 && elapsed < DEMO_TOAST_MIN_DWELL_MS;
    if (needsDelay) {
      demoToastPendingKey = '';
      if (demoToastMessageTimer) return;
      demoToastMessageTimer = window.setTimeout(() => {
        demoToastMessageTimer = 0;
        setDemoToastTextLiteral(nextLine, { force: true });
      }, Math.max(120, DEMO_TOAST_MIN_DWELL_MS - elapsed));
      return;
    }
    if (demoToastMessageTimer) clearDemoToastMessageTimer();
    demoToastTextEl.textContent = nextLine;
    demoToastLastMessageAt = now;
  }

  function collapseDemoToast() {
    demoToastCollapsed = true;
    demoToastEl?.classList.add('hidden');
    demoToastChipEl?.classList.remove('hidden');
  }

  function showDemoToast(forceOpen = false) {
    if (!(demoToastEl instanceof HTMLElement)) return;
    if (forceOpen || !demoToastCollapsed) {
      demoToastEl.classList.remove('hidden');
      demoToastChipEl?.classList.add('hidden');
      demoToastCollapsed = false;
    }
  }

  function createDemoBanner() {
    if (!DEMO_MODE || document.getElementById('cs-demo-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'cs-demo-toast';
    toast.className = 'cs-demo-toast hidden';
    toast.setAttribute('role', 'region');
    toast.setAttribute('aria-label', 'Live demo');
    toast.innerHTML =
      '<div class=\"cs-demo-toast__row\">' +
        '<div class=\"cs-demo-toast__badge\" aria-hidden=\"true\">DEMO</div>' +
        '<div class=\"cs-demo-toast__text\" aria-live=\"polite\" id=\"cs-demo-toast-text\">Live demo: try one round.</div>' +
        '<div class=\"cs-demo-toast__actions\">' +
          '<button class=\"cs-btn cs-btn--ghost\" id=\"cs-demo-skip\" type=\"button\">Skip</button>' +
          '<button class=\"cs-btn cs-btn--primary\" id=\"cs-demo-restart\" type=\"button\">Restart</button>' +
          '<button class=\"cs-btn cs-btn--icon\" id=\"cs-demo-close\" type=\"button\" aria-label=\"Hide demo banner\">×</button>' +
        '</div>' +
      '</div>' +
      '<div class=\"cs-demo-toast__bar\"><div class=\"cs-demo-toast__barFill\" id=\"cs-demo-toast-bar\"></div></div>';
    document.body.appendChild(toast);
    const chip = document.createElement('button');
    chip.id = 'cs-demo-chip';
    chip.className = 'cs-demo-chip hidden';
    chip.type = 'button';
    chip.setAttribute('aria-label', 'Show demo banner');
    chip.textContent = 'DEMO';
    document.body.appendChild(chip);
    demoBannerEl = toast;
    demoToastEl = toast;
    demoToastTextEl = _el('cs-demo-toast-text');
    demoToastBarFillEl = _el('cs-demo-toast-bar');
    demoToastChipEl = chip;
    showDemoToast(true);
    setDemoToastText('preRound', { force: true });
    startDemoToastProgress(DEMO_TOAST_DEFAULT_DURATION_MS);
    _el('cs-demo-skip')?.addEventListener('click', () => {
      const demoStateRuntime = getDemoState();
      demoStateRuntime.active = false;
      clearDemoToastMessageTimer();
      stopDemoToastProgress();
      demoClearTimers();
      stopDemoCoachReadyLoop();
      hideDemoCoach();
      if (window.WQAudio && typeof window.WQAudio.stop === 'function') window.WQAudio.stop();
      if (window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      window.WQ_DEMO = false;
      window.location.href = withAppBase('index.html');
    });
    _el('cs-demo-restart')?.addEventListener('click', () => {
      demoRoundComplete = false;
      demoToastAutoCollapsedByPlay = false;
      resetDemoScriptState();
      closeDemoEndOverlay();
      showDemoToast(true);
      setDemoToastText('preRound', { force: true });
      startDemoToastProgress(DEMO_TOAST_DEFAULT_DURATION_MS);
      newGame({ forceDemoReplay: true, launchMissionLab: false });
    });
    _el('cs-demo-close')?.addEventListener('click', () => collapseDemoToast());
    chip.addEventListener('click', () => showDemoToast(true));
  }

  function getDemoLaunchAnchorRect() {
    const state = WQGame.getState?.() || null;
    const wordLength = Math.max(1, Number(state?.wordLength || 0));
    const activeRow = Math.max(0, Number(state?.guesses?.length || 0));
    const firstTile = _el(`tile-${activeRow * wordLength}`);
    const lastTile = _el(`tile-${activeRow * wordLength + (wordLength - 1)}`);
    if (firstTile instanceof HTMLElement && lastTile instanceof HTMLElement) {
      const a = firstTile.getBoundingClientRect();
      const b = lastTile.getBoundingClientRect();
      const hasSize = a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0;
      if (hasSize) {
        return {
          top: Math.min(a.top, b.top),
          bottom: Math.max(a.bottom, b.bottom),
          left: Math.min(a.left, b.left),
          right: Math.max(a.right, b.right),
          width: Math.max(0, Math.max(a.right, b.right) - Math.min(a.left, b.left)),
          height: Math.max(a.height, b.height)
        };
      }
    }
    const keyboard = _el('keyboard');
    if (keyboard instanceof HTMLElement) {
      const rect = keyboard.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    return null;
  }

  function positionDemoLaunchButton() {
    if (DEMO_MODE || !(demoLaunchBtnEl instanceof HTMLElement)) return;
    const rect = getDemoLaunchAnchorRect();
    if (!rect) {
      demoLaunchBtnEl.style.top = '';
      demoLaunchBtnEl.style.left = '';
      return;
    }
    const buttonWidth = Math.max(220, demoLaunchBtnEl.offsetWidth || 220);
    const maxLeft = Math.max(8, window.innerWidth - buttonWidth - 8);
    const targetCenterX = rect.left + (rect.width / 2);
    const nextLeft = Math.min(maxLeft, Math.max(8, Math.round(targetCenterX - (buttonWidth / 2))));
    const topFromTiles = Math.round(rect.top - 52);
    const topFromKeyboard = Math.round(rect.top - 48);
    const nextTop = Math.max(72, Math.min(window.innerHeight - 56, Math.max(topFromTiles, topFromKeyboard)));
    demoLaunchBtnEl.style.left = `${nextLeft}px`;
    demoLaunchBtnEl.style.top = `${nextTop}px`;
  }

  function createHomeDemoLaunchButton() {
    let allowDemoChip = false;
    try {
      const params = new URLSearchParams(window.location.search || '');
      allowDemoChip = params.get('democta') === '1';
    } catch {
      allowDemoChip = false;
    }
    if (!allowDemoChip) {
      const stale = document.getElementById('wq-demo-launch-btn');
      if (stale) stale.remove();
      demoLaunchBtnEl = null;
      return;
    }
    if (DEMO_MODE || document.getElementById('wq-demo-launch-btn')) return;
    const button = document.createElement('button');
    button.id = 'wq-demo-launch-btn';
    button.className = 'wq-demo-launch-btn';
    button.type = 'button';
    button.textContent = 'Try a live round (60 sec)';
    button.addEventListener('click', () => {
      window.location.href = ensureDemoParam(window.location.href);
    });
    document.body.appendChild(button);
    demoLaunchBtnEl = button;
    positionDemoLaunchButton();
    window.addEventListener('resize', positionDemoLaunchButton, { passive: true });
    window.addEventListener('scroll', positionDemoLaunchButton, { passive: true });
    setTimeout(positionDemoLaunchButton, 0);
  }

  function setDemoControlsDisabled() {
    if (!DEMO_MODE) return;
    document.body.classList.add('wq-demo');
    const focusInput = _el('focus-inline-search');
    const focusSelect = _el('setting-focus');
    const lengthSelect = _el('s-length');
    const guessesSelect = _el('s-guesses');
    if (focusSelect) focusSelect.value = 'all';
    if (lengthSelect) lengthSelect.value = '5';
    if (guessesSelect) guessesSelect.value = '6';
    if (focusInput) {
      focusInput.value = 'Classic (Demo Locked)';
      focusInput.setAttribute('readonly', 'true');
      focusInput.setAttribute('aria-readonly', 'true');
      focusInput.setAttribute('tabindex', '-1');
    }
    const targets = [
      focusSelect,
      lengthSelect,
      guessesSelect,
      focusInput,
      _el('wq-teacher-words')
    ];
    targets.forEach((node) => {
      if (!node) return;
      node.setAttribute('disabled', 'true');
      node.setAttribute('aria-disabled', 'true');
      node.setAttribute('title', 'Disabled in Live Demo');
    });
    document.querySelectorAll('#challenge-modal input, #challenge-modal textarea').forEach((node) => {
      node.setAttribute('disabled', 'true');
      node.setAttribute('aria-disabled', 'true');
      node.setAttribute('title', 'Disabled in Live Demo');
    });
    const teacherTools = _el('wq-teacher-tools');
    if (teacherTools) teacherTools.classList.add('hidden');
    closeFocusSearchList();
  }

  function ensureDemoParam(url) {
    const next = new URL(url || window.location.href, window.location.href);
    next.searchParams.set('demo', '1');
    next.searchParams.set('page', 'wordquest');
    next.searchParams.delete('mode');
    return next.toString();
  }

  function removeDemoParams(url) {
    const next = new URL(url || window.location.href, window.location.href);
    next.searchParams.delete('demo');
    next.searchParams.delete('mode');
    return next.toString();
  }

  function exitDemoModeToPlay() {
    if (!DEMO_MODE) return;
    try {
      const demoStateRuntime = getDemoState();
      demoStateRuntime.active = false;
    } catch {}
    clearDemoAutoplayTimer();
    demoClearTimers();
    stopDemoCoachReadyLoop();
    stopDemoKeyPulse();
    const next = new URL(removeDemoParams(window.location.href), window.location.href);
    next.searchParams.set('play', '1');
    next.searchParams.set('page', 'wordquest');
    window.location.replace(next.toString());
  }

  function stopDemoKeyPulse() {
    if (!demoState.keyPulseTimer) return;
    clearTimeout(demoState.keyPulseTimer);
    demoState.keyPulseTimer = 0;
  }

  function stopDemoCoachReadyLoop() {
    if (!demoCoachReadyTimer) return;
    clearTimeout(demoCoachReadyTimer);
    if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
      window.__CS_DEMO_TIMERS.delete(demoCoachReadyTimer);
    }
    demoCoachReadyTimer = 0;
  }

  function clearDemoAutoplayTimer() {
    if (!demoAutoplayTimer) return;
    clearTimeout(demoAutoplayTimer);
    if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
      window.__CS_DEMO_TIMERS.delete(demoAutoplayTimer);
    }
    demoAutoplayTimer = 0;
  }

  function listOpenOverlays() {
    return DEMO_OVERLAY_SELECTORS
      .map((selector) => {
        const node = document.querySelector(selector);
        return node ? selector : '';
      })
      .filter(Boolean);
  }

  function renderDemoDebugReadout() {
    if (!DEMO_MODE || !DEMO_DEBUG_MODE) return;
    if (!demoDebugLabelEl) {
      const label = document.createElement('div');
      label.id = 'wq-demo-debug';
      label.className = 'wq-demo-debug';
      document.body.appendChild(label);
      demoDebugLabelEl = label;
    }
    const overlaysOpen = listOpenOverlays().length === 0 ? 'true' : 'false';
    const coachMounted = demoState.coachMounted ? 'true' : 'false';
    demoDebugLabelEl.textContent = `demo:1 overlaysClosed:${overlaysOpen} coachMounted:${coachMounted}`;
  }

  function closeAllOverlaysForDemo() {
    if (!DEMO_MODE) return true;
    closeFocusSearchList();
    closeQuickPopover('all');
    _el('settings-panel')?.classList.add('hidden');
    _el('teacher-panel')?.classList.add('hidden');
    _el('modal-overlay')?.classList.add('hidden');
    _el('challenge-modal')?.classList.add('hidden');
    _el('phonics-clue-modal')?.classList.add('hidden');
    _el('listening-mode-overlay')?.classList.add('hidden');
    _el('first-run-setup-modal')?.classList.add('hidden');
    _el('end-modal')?.classList.add('hidden');
    _el('modal-challenge-launch')?.classList.add('hidden');
    _el('focus-inline-results')?.classList.add('hidden');
    document.documentElement.setAttribute('data-focus-search-open', 'false');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    setPageMode('wordquest', { force: true, skipUrl: true });
    syncHeaderControlsVisibility();
    const openOverlays = listOpenOverlays();
    demoState.overlaysClosed = openOverlays.length === 0;
    if (DEMO_DEBUG_MODE) {
      console.log('[demo] overlays:', openOverlays);
    }
    renderDemoDebugReadout();
    return demoState.overlaysClosed;
  }

  function pulseDemoKey(letter) {
    const key = document.querySelector(`.key[data-key=\"${String(letter || '').toLowerCase()}\"]`);
    if (!(key instanceof HTMLElement)) return;
    key.classList.remove('wq-demo-key-pulse');
    void key.offsetWidth;
    key.classList.add('wq-demo-key-pulse');
  }

  function startDemoKeyPulse(word) {
    stopDemoKeyPulse();
    const letters = String(word || '').toLowerCase().replace(/[^a-z]/g, '').split('');
    if (!letters.length) return;
    // One pass only to avoid perpetual repaint loops while demo coach is visible.
    const pulseOnce = () => {
      pulseDemoKey(letters[demoState.keyPulseIndex % letters.length]);
      demoState.keyPulseIndex += 1;
      if (demoState.keyPulseIndex >= letters.length) {
        stopDemoKeyPulse();
      } else {
        demoState.keyPulseTimer = demoSetTimeout(pulseOnce, 320);
      }
    };
    demoState.keyPulseIndex = 0;
    pulseOnce();
  }

  function applySuggestedDemoWord(word) {
    const normalizedWord = String(word || '').trim().toLowerCase();
    const current = WQGame.getState?.() || {};
    if (!normalizedWord || !current.wordLength || normalizedWord.length !== current.wordLength) return false;
    let clears = 0;
    while ((WQGame.getState?.()?.guess || '').length > 0 && clears < 8) {
      handleInputUnit('Backspace');
      clears += 1;
    }
    for (const letter of normalizedWord) handleInputUnit(letter);
    handleInputUnit('Enter');
    return true;
  }

  function ensureDemoCoach() {
    return demoToastEl instanceof HTMLElement ? demoToastEl : null;
  }

  function hideDemoCoach() {
    stopDemoKeyPulse();
  }

  function positionDemoCoach(coachEl, preferredAnchor) {
    return;
  }

  function showDemoCoach(config) {
    if (!DEMO_MODE) return;
    const demoStateRuntime = getDemoState();
    if (!demoStateRuntime.active) return;
    if (!ensureDemoCoach()) return;
    const nextStepId = String(config?.id || '').trim() || 'unknown';
    if (demoState.lastCoachStepId === nextStepId) {
      return;
    }
    demoState.lastCoachStepId = nextStepId;
    window.__CS_DEMO_RENDER_COUNT = (window.__CS_DEMO_RENDER_COUNT || 0) + 1;
    console.log('[demo] coach render', window.__CS_DEMO_RENDER_COUNT, 'step', nextStepId);

    let stateKey = 'preRound';
    if (nextStepId === 'after_guess_1' || nextStepId === 'after_guess_2') stateKey = 'afterFirstGuess';
    else if (nextStepId === 'hint') stateKey = 'idle20s';
    else if (nextStepId === 'completed') stateKey = 'completed';
    if (config?.overrideLine) setDemoToastTextLiteral(String(config.overrideLine), { force: true });
    else setDemoToastText(stateKey);
    if (!demoToastAutoCollapsedByPlay || stateKey === 'completed') showDemoToast(stateKey === 'completed');

    const suggestedWord = String(config?.suggestedWord || '').trim().toLowerCase();
    if (suggestedWord) {
      startDemoKeyPulse(suggestedWord);
    } else {
      stopDemoKeyPulse();
    }
  }

  function resetDemoScriptState() {
    const demoStateRuntime = getDemoState();
    demoStateRuntime.step = 0;
    demoStateRuntime.active = true;
    demoStateRuntime.started = false;
    demoState.step = 0;
    demoState.guessCount = 0;
    demoState.discoveredCore = new Set();
    demoState.hintUsed = false;
    demoState.overlaysClosed = false;
    demoState.coachMounted = false;
    demoState.lastCoachStepId = '';
    demoState.handledGuessCounts = new Set();
    window.__CS_DEMO_RENDER_COUNT = 0;
    stopDemoCoachReadyLoop();
    clearDemoAutoplayTimer();
    demoClearTimers();
    stopDemoKeyPulse();
    hideDemoCoach();
    stopDemoToastProgress();
    clearDemoToastMessageTimer();
    demoToastCollapsed = false;
    demoToastAutoCollapsedByPlay = false;
    collapseDemoToast();
    renderDemoDebugReadout();
  }

  function runBoardOnlyDemoPlayback() {
    if (!DEMO_MODE) return;
    const demoStateRuntime = getDemoState();
    if (!demoStateRuntime.active) return;
    const script = ['slate', 'plain', DEMO_TARGET_WORD];
    const typeDelayMs = 260;
    const betweenGuessesMs = 2200;

    clearDemoAutoplayTimer();

    const clearCurrentGuess = () => {
      const state = WQGame.getState?.();
      const guess = String(state?.guess || '');
      for (let i = 0; i < guess.length; i += 1) handleKey('Backspace');
    };

    const typeGuessAt = (index) => {
      const state = WQGame.getState?.();
      if (!state || state.gameOver || !demoStateRuntime.active) return;
      if (index >= script.length) return;
      const guessWord = String(script[index] || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, Number(state.wordLength) || 5);
      if (!guessWord) return;
      clearCurrentGuess();
      let letterIdx = 0;

      const typeNextLetter = () => {
        const live = WQGame.getState?.();
        if (!live || live.gameOver || !demoStateRuntime.active) return;
        if (letterIdx < guessWord.length) {
          handleKey(guessWord[letterIdx]);
          letterIdx += 1;
          demoAutoplayTimer = demoSetTimeout(typeNextLetter, typeDelayMs);
          return;
        }
        handleKey('Enter');
        demoAutoplayTimer = demoSetTimeout(() => typeGuessAt(index + 1), betweenGuessesMs);
      };

      demoAutoplayTimer = demoSetTimeout(typeNextLetter, 500);
    };

    typeGuessAt(0);
  }

  function runDemoCoachForStart() {
    if (!DEMO_MODE) return;
    const demoStateRuntime = getDemoState();
    if (!demoStateRuntime.active || demoStateRuntime.started) return;
    demoStateRuntime.started = true;
    demoStateRuntime.step = 1;
    closeAllOverlaysForDemo();
    hideDemoCoach();
    runBoardOnlyDemoPlayback();
  }

  function updateDemoDiscovered(result) {
    const guess = String(result?.guess || '').toUpperCase();
    const statuses = Array.isArray(result?.result) ? result.result : [];
    ['P', 'L', 'A'].forEach((targetLetter) => {
      for (let i = 0; i < guess.length; i += 1) {
        if (guess[i] !== targetLetter) continue;
        if (statuses[i] === 'correct' || statuses[i] === 'present') {
          demoState.discoveredCore.add(targetLetter);
          return;
        }
      }
    });
  }

  function runDemoCoachAfterGuess(result) {
    if (!DEMO_MODE || !result || result.error || result.won || result.lost) return;
    const demoStateRuntime = getDemoState();
    if (!demoStateRuntime.active) return;
    demoState.guessCount = Math.max(0, Number(result.guesses?.length || 0));
    demoStateRuntime.step = demoState.guessCount + 1;
  }

  function closeDemoEndOverlay() {
    hideDemoCoach();
    setDemoToastText('preRound', { force: true });
    if (!demoToastAutoCollapsedByPlay) showDemoToast(true);
  }

  function showDemoEndOverlay() {
    if (!DEMO_MODE) return;
    const demoStateRuntime = getDemoState();
    demoStateRuntime.active = false;
    demoClearTimers();
    clearDemoToastMessageTimer();
    stopDemoCoachReadyLoop();
    stopDemoKeyPulse();
    hideDemoCoach();
    setDemoToastText('completed', { force: true });
    showDemoToast(true);
    stopDemoToastProgress();
    renderDemoToastProgress(100);
  }

  function readTelemetryEnabled() {
    try {
      const raw = String(localStorage.getItem(TELEMETRY_ENABLED_KEY) || '').trim().toLowerCase();
      if (!raw) return true;
      return raw !== 'off' && raw !== '0' && raw !== 'false';
    } catch {
      return true;
    }
  }

  function getTelemetryDeviceId() {
    let deviceId = '';
    try {
      deviceId = String(localStorage.getItem(TELEMETRY_DEVICE_ID_KEY) || '').trim();
      if (!deviceId) {
        deviceId = `dev_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
        localStorage.setItem(TELEMETRY_DEVICE_ID_KEY, deviceId);
      }
    } catch {
      deviceId = `dev_mem_${Math.random().toString(36).slice(2, 10)}`;
    }
    return deviceId;
  }

  function getTelemetryQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TELEMETRY_QUEUE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setTelemetryQueue(queue) {
    try {
      localStorage.setItem(TELEMETRY_QUEUE_KEY, JSON.stringify(Array.isArray(queue) ? queue.slice(-TELEMETRY_QUEUE_LIMIT) : []));
    } catch {}
  }

  function normalizeTelemetryEndpoint(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (value.startsWith('/')) return value;
    if (/^https?:\/\//i.test(value)) return value;
    return '';
  }

  function resolveTelemetryEndpoint() {
    if (DEMO_MODE) return '';
    let queryValue = '';
    try {
      const params = new URLSearchParams(window.location.search || '');
      queryValue = params.get('telemetry_endpoint') || params.get('telemetryEndpoint') || '';
    } catch {}
    const queryEndpoint = normalizeTelemetryEndpoint(queryValue);
    if (queryEndpoint) {
      try { localStorage.setItem(TELEMETRY_ENDPOINT_KEY, queryEndpoint); } catch {}
      return queryEndpoint;
    }
    try {
      return normalizeTelemetryEndpoint(localStorage.getItem(TELEMETRY_ENDPOINT_KEY) || '');
    } catch {
      return '';
    }
  }

  function getTelemetryUploadMeta() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TELEMETRY_LAST_UPLOAD_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        ts: Math.max(0, Number(parsed.ts) || 0),
        count: Math.max(0, Number(parsed.count) || 0),
        endpoint: normalizeTelemetryEndpoint(parsed.endpoint || '')
      };
    } catch {
      return null;
    }
  }

  function setTelemetryUploadMeta(meta) {
    const row = {
      ts: Date.now(),
      count: Math.max(0, Number(meta?.count) || 0),
      endpoint: normalizeTelemetryEndpoint(meta?.endpoint || '')
    };
    try { localStorage.setItem(TELEMETRY_LAST_UPLOAD_KEY, JSON.stringify(row)); } catch {}
  }

  async function uploadTelemetryQueue(reason = 'manual', options = {}) {
    if (telemetryUploadInFlight) return false;
    const endpoint = resolveTelemetryEndpoint();
    if (!endpoint || !readTelemetryEnabled()) return false;
    const queue = getTelemetryQueue();
    if (!queue.length) return true;
    telemetryUploadInFlight = true;
    try {
      const rows = queue.slice(-200);
      const payload = {
        app: 'wordquest',
        reason: String(reason || 'manual').trim() || 'manual',
        sent_at_ms: Date.now(),
        rows
      };
      const shouldUseBeacon = !!options.useBeacon;
      if (shouldUseBeacon && navigator?.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon(endpoint, blob);
        if (ok) {
          setTelemetryQueue([]);
          setTelemetryUploadMeta({ count: rows.length, endpoint });
          return true;
        }
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: shouldUseBeacon
      });
      if (!response.ok) return false;
      setTelemetryQueue([]);
      setTelemetryUploadMeta({ count: rows.length, endpoint });
      return true;
    } catch {
      return false;
    } finally {
      telemetryUploadInFlight = false;
    }
  }

  function initTelemetryUploader() {
    if (DEMO_MODE) return;
    if (document.body.dataset.wqTelemetryUploaderBound === '1') return;
    document.body.dataset.wqTelemetryUploaderBound = '1';
    if (telemetryUploadIntervalId) clearInterval(telemetryUploadIntervalId);
    telemetryUploadIntervalId = window.setInterval(() => {
      void uploadTelemetryQueue('interval');
    }, 90_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void uploadTelemetryQueue('visibility_hidden', { useBeacon: true });
      }
    });
    window.addEventListener('pagehide', () => {
      void uploadTelemetryQueue('pagehide', { useBeacon: true });
    });
  }

  function getTelemetryContext() {
    const state = WQGame.getState?.() || {};
    const build = resolveBuildLabel() || 'local';
    const appVersion = `v${APP_SEMVER}`;
    const focusValue = _el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus || 'all';
    const gradeBand = getEffectiveGameplayGradeBand(
      _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade || 'all',
      focusValue
    );
    const lessonPackId = normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack);
    const lessonTargetId = normalizeLessonTargetId(
      lessonPackId,
      prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
    );
    return {
      ts_ms: Date.now(),
      session_id: TELEMETRY_SESSION_ID,
      device_id_local: getTelemetryDeviceId(),
      app_version: `${appVersion}+${build}`,
      page_mode: normalizePageMode(document.documentElement.getAttribute('data-page-mode') || loadStoredPageMode()),
      play_style: normalizePlayStyle(document.documentElement.getAttribute('data-play-style') || prefs.playStyle || DEFAULT_PREFS.playStyle),
      grade_band: gradeBand,
      focus_id: String(focusValue || 'all'),
      lesson_pack_id: lessonPackId,
      lesson_target_id: lessonTargetId,
      word_length: Number(state?.wordLength || 0) || null
    };
  }

  function emitTelemetry(eventName, payload = {}) {
    if (DEMO_MODE) return;
    if (!readTelemetryEnabled()) return;
    const name = String(eventName || '').trim().toLowerCase();
    if (!name) return;
    const row = {
      event_name: name.startsWith('wq_') ? name : `wq_${name}`,
      ...getTelemetryContext(),
      ...(payload && typeof payload === 'object' ? payload : {})
    };
    const queue = getTelemetryQueue();
    queue.push(row);
    setTelemetryQueue(queue);
  }

  window.WQTelemetry = Object.freeze({
    emit: emitTelemetry,
    setEnabled(next) {
      try {
        localStorage.setItem(TELEMETRY_ENABLED_KEY, next ? 'on' : 'off');
      } catch {}
    },
    isEnabled: readTelemetryEnabled,
    setEndpoint(url) {
      const endpoint = normalizeTelemetryEndpoint(url);
      try {
        if (endpoint) localStorage.setItem(TELEMETRY_ENDPOINT_KEY, endpoint);
        else localStorage.removeItem(TELEMETRY_ENDPOINT_KEY);
      } catch {}
      return endpoint;
    },
    getEndpoint: resolveTelemetryEndpoint,
    peek(limit = 20) {
      const count = Math.max(1, Math.min(200, Number(limit) || 20));
      return getTelemetryQueue().slice(-count);
    },
    async uploadNow(reason = 'manual') {
      return uploadTelemetryQueue(reason);
    },
    flush() {
      const rows = getTelemetryQueue();
      setTelemetryQueue([]);
      return rows;
    }
  });
  initTelemetryUploader();

  isMissionLabEnabled = function() {
    return MISSION_LAB_ENABLED;
  };

  normalizePageMode = function(mode) {
    if (!isMissionLabEnabled()) return 'wordquest';
    return String(mode || '').trim().toLowerCase() === 'mission-lab'
      ? 'mission-lab'
      : 'wordquest';
  };

  readPageModeFromQuery = function() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const raw = params.get('page') || params.get('mode') || '';
      return normalizePageMode(raw);
    } catch {
      return 'wordquest';
    }
  };

  loadStoredPageMode = function() {
    try {
      return normalizePageMode(localStorage.getItem(PAGE_MODE_KEY) || 'wordquest');
    } catch {
      return 'wordquest';
    }
  };

  persistPageMode = function(mode) {
    try { localStorage.setItem(PAGE_MODE_KEY, normalizePageMode(mode)); } catch {}
  };

  function resolveBuildLabel() {
    const stampedBuild = String(window.CS_BUILD?.version || '').trim();
    if (stampedBuild) return stampedBuild;
    const metaBuild = document.querySelector('meta[name="wq-build"]')?.getAttribute('content');
    const normalizedMetaBuild = String(metaBuild || '').trim();
    if (normalizedMetaBuild) return normalizedMetaBuild;
    const appScript = Array.from(document.querySelectorAll('script[src]'))
      .find((script) => /(?:^|\/)js\/app\.js(?:[?#]|$)/i.test(script.getAttribute('src') || ''));
    const src = String(appScript?.getAttribute('src') || '');
    const match = src.match(/[?&]v=([^&#]+)/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return '';
  }

  function resolveRuntimeChannel() {
    const host = String(location.hostname || '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return 'LOCAL';
    if (host === 'bkseatown.github.io') return 'LIVE';
    if (host === 'cdn.jsdelivr.net' || host === 'htmlpreview.github.io') return 'PREVIEW';
    return 'CUSTOM';
  }

  function syncBuildBadge() {
    const badge = _el('settings-build-badge');
    if (!badge) return;
    if (!isDevModeEnabled()) {
      badge.textContent = '';
      badge.classList.add('hidden');
      return;
    }
    badge.classList.remove('hidden');
    const label = resolveBuildLabel();
    const channel = resolveRuntimeChannel();
    const buildLabel = label || 'local';
    const appVersion = `v${APP_SEMVER}`;
    badge.textContent = `${channel} · ${appVersion} · Build ${buildLabel}`;
    badge.title = `${channel} source: ${location.origin}${location.pathname} · ${appVersion} · build ${buildLabel}`;
  }

  function syncPersistentVersionChip() {
    if (!isDevModeEnabled()) {
      _el('wq-version-chip')?.classList.add('hidden');
      return;
    }
    const channel = resolveRuntimeChannel();
    const buildLabel = resolveBuildLabel() || 'local';
    const staleClient = !!window.CS_BUILD?.staleClient;
    const appVersion = `v${APP_SEMVER}`;
    let chip = _el('wq-version-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'wq-version-chip';
      chip.className = 'wq-version-chip';
      chip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(chip);
    }
    chip.textContent = staleClient
      ? `${channel} · ${appVersion} · ${buildLabel} · syncing`
      : `${channel} · ${appVersion} · ${buildLabel}`;
    chip.title = staleClient
      ? `WordQuest ${appVersion} (${buildLabel}) is syncing to latest deploy`
      : `WordQuest ${appVersion} (${buildLabel})`;
    chip.classList.remove('hidden');
  }

  async function logRuntimeBuildDiagnostics() {
    if (!isDevModeEnabled()) return;
    const build = resolveBuildLabel() || 'local';
    const controlledBySw = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    let cacheCount = 0;
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        cacheCount = names.length;
      }
    } catch {}
    console.info('[WQ Build Debug]', { build, controlledBySw, cacheCount });
  }

  function applyDevOnlyVisibility() {
    const isDev = isDevModeEnabled();
    _el('settings-group-diagnostics')?.classList.toggle('hidden', !isDev);
    _el('settings-group-diagnostics')?.setAttribute('aria-hidden', isDev ? 'false' : 'true');
    if (!isDev) {
      _el('diag-refresh-btn')?.closest('.setting-row')?.classList.add('hidden');
    }
  }

  function formatDiagnosticDate(ts) {
    const value = Number(ts) || 0;
    if (!value) return '--';
    return new Date(value).toLocaleString();
  }

  function readDiagnosticsLastReset() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DIAGNOSTICS_LAST_RESET_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        ts: Math.max(0, Number(parsed.ts) || 0),
        reason: String(parsed.reason || '').trim() || 'maintenance',
        build: String(parsed.build || '').trim() || 'local'
      };
    } catch {
      return null;
    }
  }

  async function collectRuntimeDiagnostics() {
    const build = resolveBuildLabel() || 'local';
    const appVersion = `v${APP_SEMVER}`;
    const lastReset = readDiagnosticsLastReset();
    const activePrefs = [
      `focus:${_el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus}`,
      `grade:${_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade}`,
      `length:${_el('s-length')?.value || prefs.length || DEFAULT_PREFS.length}`,
      `pack:${normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack)}`,
      `target:${normalizeLessonTargetId(
        normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack),
        prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
      )}`,
      `voice:${normalizeVoiceMode(_el('s-voice')?.value || prefs.voice || DEFAULT_PREFS.voice)}`
    ].join(' | ');

    let cacheBuckets = 0;
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        cacheBuckets = cacheNames.filter((name) => String(name || '').startsWith('wq-')).length;
      } catch {}
    }

    let swRegistrations = 0;
    let swRuntimeVersion = SW_RUNTIME_RESOLVED_VERSION;
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swRegistrations = registrations.length;
        const activeScript = registrations[0]?.active?.scriptURL || '';
        if (activeScript.includes('sw-runtime.js?v=')) {
          const match = activeScript.match(/sw-runtime\.js\?v=([^&#]+)/i);
          if (match?.[1]) swRuntimeVersion = decodeURIComponent(match[1]);
        }
      } catch {}
    }

    const telemetryEndpoint = resolveTelemetryEndpoint();
    const telemetryMeta = getTelemetryUploadMeta();
    const telemetryQueueSize = getTelemetryQueue().length;

    return {
      build,
      appVersion,
      swRuntimeVersion,
      swRegistrations,
      cacheBuckets,
      activePrefs,
      lastReset,
      telemetry: {
        endpoint: telemetryEndpoint,
        queueSize: telemetryQueueSize,
        lastUpload: telemetryMeta
      }
    };
  }

  async function renderDiagnosticsPanel() {
    const buildEl = _el('diag-build');
    if (!buildEl) return;
    const snapshot = await collectRuntimeDiagnostics();
    const swVersionEl = _el('diag-sw-version');
    const swRegistrationsEl = _el('diag-sw-registrations');
    const cacheBucketsEl = _el('diag-cache-buckets');
    const telemetryEl = _el('diag-telemetry');
    const activePrefsEl = _el('diag-active-prefs');
    const lastResetEl = _el('diag-last-reset');

    buildEl.textContent = `Build: ${snapshot.build} (${snapshot.appVersion})`;
    if (swVersionEl) swVersionEl.textContent = `SW Runtime: ${snapshot.swRuntimeVersion || '--'}`;
    if (swRegistrationsEl) swRegistrationsEl.textContent = `SW Registrations: ${snapshot.swRegistrations}`;
    if (cacheBucketsEl) cacheBucketsEl.textContent = `Cache Buckets: ${snapshot.cacheBuckets}`;
    if (telemetryEl) {
      const endpointLabel = snapshot.telemetry.endpoint || '(disabled)';
      const uploaded = snapshot.telemetry.lastUpload?.ts
        ? `last ${formatDiagnosticDate(snapshot.telemetry.lastUpload.ts)}`
        : 'never uploaded';
      telemetryEl.textContent = `Telemetry Sink: ${endpointLabel} · Queue ${snapshot.telemetry.queueSize} · ${uploaded}`;
    }
    if (activePrefsEl) activePrefsEl.textContent = `Active Prefs: ${snapshot.activePrefs}`;
    if (lastResetEl) {
      const resetLabel = snapshot.lastReset
        ? `${formatDiagnosticDate(snapshot.lastReset.ts)} (${snapshot.lastReset.reason}, ${snapshot.lastReset.build})`
        : '--';
      lastResetEl.textContent = `Last Reset: ${resetLabel}`;
    }
  }

  async function copyDiagnosticsSummary() {
    const snapshot = await collectRuntimeDiagnostics();
    const lines = [
      'WordQuest Diagnostics',
      `App Version: ${snapshot.appVersion}`,
      `Build: ${snapshot.build}`,
      `SW Runtime: ${snapshot.swRuntimeVersion || '--'}`,
      `SW Registrations: ${snapshot.swRegistrations}`,
      `Cache Buckets: ${snapshot.cacheBuckets}`,
      `Telemetry Sink: ${snapshot.telemetry.endpoint || '(disabled)'}`,
      `Telemetry Queue: ${snapshot.telemetry.queueSize}`,
      `Telemetry Last Upload: ${snapshot.telemetry.lastUpload?.ts ? formatDiagnosticDate(snapshot.telemetry.lastUpload.ts) : '--'}`,
      `Active Prefs: ${snapshot.activePrefs}`,
      `Last Reset: ${snapshot.lastReset ? `${formatDiagnosticDate(snapshot.lastReset.ts)} (${snapshot.lastReset.reason}, ${snapshot.lastReset.build})` : '--'}`
    ];
    await copyTextToClipboard(
      lines.join('\n'),
      'Diagnostics copied.',
      'Could not copy diagnostics on this device.'
    );
  }

  function buildStableShareLinkUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('cb');
    return url.toString();
  }

  async function copyReviewLink() {
    await copyTextToClipboard(
      buildStableShareLinkUrl(),
      'Share link copied. This link always points to the latest deployed version.',
      'Could not copy share link on this device.'
    );
  }

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

  function getHoverNoteText(el) {
    if (!el) return '';
    if (el.getAttribute('data-no-hover-note') === 'true') return '';
    const explicit = el.getAttribute('data-hover-note');
    const fromHint = el.getAttribute('data-hint');
    const fromAria = el.getAttribute('aria-label');
    const fromTitle = el.getAttribute('title');
    const raw = String(explicit || fromHint || fromAria || fromTitle || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (raw.length <= 120) return raw;
    return `${raw.slice(0, 117).trimEnd()}...`;
  }

  function ensureHoverNoteToast() {
    if (hoverNoteEl && document.body.contains(hoverNoteEl)) return hoverNoteEl;
    const el = document.createElement('div');
    el.id = 'hover-note-toast';
    el.className = 'hover-note-toast hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    hoverNoteEl = el;
    return hoverNoteEl;
  }

  function hideHoverNoteToast() {
    if (hoverNoteTimer) {
      clearTimeout(hoverNoteTimer);
      hoverNoteTimer = 0;
    }
    hoverNoteTarget = null;
    if (!hoverNoteEl) return;
    hoverNoteEl.classList.remove('is-visible');
    hoverNoteEl.classList.add('hidden');
    hoverNoteEl.setAttribute('aria-hidden', 'true');
  }

  function showHoverNoteToast(targetEl) {
    if (!targetEl || !document.contains(targetEl)) return;
    const text = getHoverNoteText(targetEl);
    if (!text) return;
    const toast = ensureHoverNoteToast();
    toast.textContent = `✨ ${text}`;
    toast.classList.remove('hidden');
    const rect = targetEl.getBoundingClientRect();
    const showAbove = rect.top > 84;
    const placement = showAbove ? 'top' : 'bottom';
    const top = showAbove ? (rect.top - 10) : (rect.bottom + 10);
    const left = Math.max(14, Math.min(window.innerWidth - 14, rect.left + (rect.width / 2)));
    toast.style.left = `${left}px`;
    toast.style.top = `${Math.max(10, Math.min(window.innerHeight - 10, top))}px`;
    toast.setAttribute('data-placement', placement);
    toast.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });
  }

  function scheduleHoverNoteToast(targetEl, delay = HOVER_NOTE_DELAY_MS) {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (hoverNoteTimer) {
      clearTimeout(hoverNoteTimer);
      hoverNoteTimer = 0;
    }
    hoverNoteTarget = targetEl;
    hoverNoteTimer = window.setTimeout(() => {
      hoverNoteTimer = 0;
      if (hoverNoteTarget !== targetEl) return;
      showHoverNoteToast(targetEl);
    }, Math.max(0, delay));
  }

  function initHoverNoteToasts() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const captureHoverNote = (eventTarget) => {
      const node = eventTarget?.closest?.(HOVER_NOTE_TARGET_SELECTOR);
      if (!node || !document.contains(node)) return null;
      if (node.getAttribute('data-no-hover-note') === 'true') return null;
      if (node.matches(':disabled,[aria-disabled="true"]')) return null;
      return node;
    };

    document.addEventListener('mouseover', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      if (node.hasAttribute('title') && !node.hasAttribute('data-hover-note')) {
        setHoverNoteForElement(node, node.getAttribute('title'));
      }
      scheduleHoverNoteToast(node);
    }, true);

    document.addEventListener('mouseout', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      const related = event.relatedTarget;
      if (related && node.contains(related)) return;
      hideHoverNoteToast();
    }, true);

    document.addEventListener('focusin', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      scheduleHoverNoteToast(node, 320);
    }, true);

    document.addEventListener('focusout', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      const related = event.relatedTarget;
      if (related && node.contains(related)) return;
      hideHoverNoteToast();
    }, true);

    document.addEventListener('pointerdown', hideHoverNoteToast, true);
    document.addEventListener('keydown', hideHoverNoteToast, true);
    window.addEventListener('scroll', hideHoverNoteToast, { passive: true });
    window.addEventListener('resize', hideHoverNoteToast, { passive: true });
  }

  async function runAutoCacheRepairForBuild() {
    if (DEMO_MODE) return;
    const CACHE_REPAIR_BUILD_KEY = 'wq_v2_cache_repair_build_v1';
    const buildLabel = resolveBuildLabel();
    if (!buildLabel) return;
    let priorBuild = '';
    try {
      priorBuild = String(localStorage.getItem(CACHE_REPAIR_BUILD_KEY) || '');
      localStorage.setItem(CACHE_REPAIR_BUILD_KEY, buildLabel);
    } catch {
      priorBuild = '';
    }
    if (priorBuild === buildLabel) return;
    if (!('caches' in window)) return;
    try {
      const names = await caches.keys();
      const targets = names.filter((name) => String(name || '').startsWith('wq-'));
      if (targets.length) await Promise.all(targets.map((name) => caches.delete(name)));
    } catch {}
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
      } catch {}
    }
  }

  async function runRemoteBuildConsistencyCheck() {
    if (DEMO_MODE) return;
    if (new URLSearchParams(location.search || '').get('audit') === '1') return;
    const BUILD_REMOTE_CHECK_KEY = 'wq_v2_build_remote_check_v1';
    const currentBuild = resolveBuildLabel();
    if (!currentBuild) return;

    const checkMarker = `${location.pathname}::${currentBuild}`;
    try {
      if (sessionStorage.getItem(BUILD_REMOTE_CHECK_KEY) === checkMarker) return;
      sessionStorage.setItem(BUILD_REMOTE_CHECK_KEY, checkMarker);
    } catch {}

    try {
      const probeUrl = `./index.html?cb=build-check-${Date.now()}`;
      const response = await fetch(probeUrl, { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const match = html.match(/js\/app\.js\?v=([^"'&#]+)/i);
      const deployedBuild = match?.[1] ? decodeURIComponent(match[1]).trim() : '';
      if (!deployedBuild || deployedBuild === currentBuild) return;

      if ('caches' in window) {
        try {
          const names = await caches.keys();
          const targets = names.filter((name) => String(name || '').startsWith('wq-'));
          if (targets.length) await Promise.all(targets.map((name) => caches.delete(name)));
        } catch {}
      }

      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(async (registration) => {
            registration.waiting?.postMessage({ type: 'WQ_SKIP_WAITING' });
            await registration.update().catch(() => {});
          }));
        } catch {}
      }

      const reloadKey = 'wq_v2_build_sync_once_v1';
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(reloadKey) === deployedBuild;
      } catch {}
      if (alreadyReloaded) return;
      try {
        sessionStorage.setItem(reloadKey, deployedBuild);
      } catch {}

      WQUI.showToast('Update available. Refreshing...');
      const params = new URLSearchParams(location.search || '');
      params.set('cb', `build-sync-${deployedBuild}-${Date.now()}`);
      const nextUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || ''}`;
      setTimeout(() => location.replace(nextUrl), 380);
    } catch {}
  }

  function installBuildConsistencyHeartbeat() {
    if (DEMO_MODE) return;
    const HEARTBEAT_MS = 5 * 60 * 1000;
    setInterval(() => { void runRemoteBuildConsistencyCheck(); }, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void runRemoteBuildConsistencyCheck();
      }
    });
  }
  const themeFamilyById = (() => {
    const map = new Map();
    const themes = Array.isArray(ThemeRegistry?.themes) ? ThemeRegistry.themes : [];
    themes.forEach((theme) => {
      if (!theme || !theme.id) return;
      map.set(String(theme.id), String(theme.family || 'core'));
    });
    return map;
  })();

  function getThemeFamily(themeId) {
    return themeFamilyById.get(String(themeId || '').toLowerCase()) || 'core';
  }

  const AUTO_MUSIC_BY_THEME = Object.freeze({
    default: 'chill',
    sunset: 'lofi',
    ocean: 'chill',
    superman: 'fantasy',
    mario: 'arcade',
    zelda: 'fantasy',
    amongus: 'scifi',
    rainbowfriends: 'upbeat',
    marvel: 'scifi',
    seahawks: 'chill',
    huskies: 'chill',
    ironman: 'scifi',
    harleyquinn: 'lofi',
    kuromi: 'lofi',
    poppink: 'lofi',
    harrypotter: 'fantasy',
    minecraft: 'arcade',
    demonhunter: 'fantasy',
    dark: 'chill',
    coffee: 'coffee',
    matrix: 'scifi'
  });

  const AUTO_MUSIC_BY_FAMILY = Object.freeze({
    core: 'chill',
    sports: 'chill',
    inspired: 'lofi',
    dark: 'lofi'
  });

  const SUBJECT_FOCUS_GRADE = Object.freeze({
    k2: 'K-2',
    '35': 'G3-5',
    '68': 'G6-8',
    '912': 'G9-12'
  });

  function getCurriculumLengthForFocus(focusValue, fallback = 'any') {
    const normalizedFocus = String(focusValue || '').trim().toLowerCase();
    if (normalizedFocus === 'cvc') return '3';
    return String(fallback || 'any').trim() || 'any';
  }

  function normalizeCurriculumTarget(rawTarget) {
    if (!rawTarget || typeof rawTarget !== 'object') return null;
    const id = String(rawTarget.id || '').trim();
    const label = String(rawTarget.label || '').trim();
    if (!id || !label) return null;
    const focus = String(rawTarget.focus || 'cvc').trim();
    const rawLength = String(rawTarget.length || 'any').trim();
    return Object.freeze({
      id,
      label,
      focus,
      gradeBand: String(rawTarget.gradeBand || 'K-2').trim(),
      length: getCurriculumLengthForFocus(focus, rawLength),
      pacing: String(rawTarget.pacing || '').trim()
    });
  }

  function getMappedCurriculumTargets(packId) {
    const table = window.WQCurriculumTaxonomy;
    if (!table || typeof table !== 'object') return [];
    const rows = table[packId];
    if (!Array.isArray(rows) || !rows.length) return [];
    return rows
      .map((row) => normalizeCurriculumTarget(row))
      .filter(Boolean);
  }

  function resolveUfliLessonMeta(lessonNumber) {
    if (lessonNumber <= 8) return { focus: 'cvc', gradeBand: 'K-2', length: '3' };
    if (lessonNumber <= 24) return { focus: 'digraph', gradeBand: 'K-2', length: '4' };
    if (lessonNumber <= 34) return { focus: 'cvce', gradeBand: 'K-2', length: '4' };
    if (lessonNumber <= 52) return { focus: 'vowel_team', gradeBand: 'K-2', length: '5' };
    if (lessonNumber <= 64) return { focus: 'r_controlled', gradeBand: 'K-2', length: '5' };
    if (lessonNumber <= 80) return { focus: 'welded', gradeBand: 'G3-5', length: '6' };
    if (lessonNumber <= 104) return { focus: 'multisyllable', gradeBand: 'G3-5', length: '6' };
    return { focus: 'suffix', gradeBand: 'G3-5', length: '6' };
  }

  function buildUfliLessonTargets() {
    const mapped = getMappedCurriculumTargets('ufli');
    if (mapped.length) return Object.freeze(mapped);
    const targets = [];
    for (let lesson = 1; lesson <= 128; lesson += 1) {
      const meta = resolveUfliLessonMeta(lesson);
      targets.push(Object.freeze({
        id: `ufli-lesson-${lesson}`,
        label: `UFLI Lesson ${lesson}`,
        focus: meta.focus,
        gradeBand: meta.gradeBand,
        length: meta.length,
        pacing: `Lesson ${lesson}`
      }));
    }
    return Object.freeze(targets);
  }

  function buildFundationsLessonTargets() {
    const mapped = getMappedCurriculumTargets('fundations');
    if (mapped.length) return Object.freeze(mapped);
    const byLevel = Object.freeze([
      Object.freeze({ level: 1, units: 14 }),
      Object.freeze({ level: 2, units: 17 }),
      Object.freeze({ level: 3, units: 16 })
    ]);
    const targets = [];
    byLevel.forEach((row) => {
      for (let unit = 1; unit <= row.units; unit += 1) {
        targets.push(Object.freeze({
          id: `fundations-l${row.level}-u${unit}`,
          label: `Fundations Level ${row.level} Unit ${unit}`,
          focus: 'structured_literacy',
          gradeBand: row.level <= 1 ? 'K-2' : 'G3-5',
          length: row.level <= 1 ? '4' : '6',
          pacing: `Level ${row.level} · Unit ${unit}`
        }));
      }
    });
    return Object.freeze(targets);
  }

  function buildWilsonLessonTargets() {
    const mapped = getMappedCurriculumTargets('wilson');
    if (mapped.length) return Object.freeze(mapped);
    const targets = [];
    for (let step = 1; step <= 12; step += 1) {
      const gradeBand = step <= 9 ? 'G3-5' : 'G6-8';
      const length = step <= 9 ? '6' : '7';
      targets.push(Object.freeze({
        id: `wilson-step-${step}`,
        label: `Wilson Reading System Step ${step}`,
        focus: 'structured_literacy',
        gradeBand,
        length,
        pacing: `Step ${step}`
      }));
    }
    return Object.freeze(targets);
  }

  function buildLexiaWidaLessonTargets() {
    const mapped = getMappedCurriculumTargets('lexiawida');
    if (mapped.length) return Object.freeze(mapped);
    return Object.freeze([
      Object.freeze({ id: 'lexia-wida-entering-k2', label: 'Lexia English WIDA Entering (1) · Grade K-2 · Lessons 1-2', focus: 'cvc', gradeBand: 'K-2', length: '3', pacing: 'Entering 1 · K-2' }),
      Object.freeze({ id: 'lexia-wida-entering-36', label: 'Lexia English WIDA Entering (1) · Grades 3-6 · Lessons 1-3', focus: 'multisyllable', gradeBand: 'G3-5', length: '5', pacing: 'Entering 1 · Grades 3-6' })
    ]);
  }

  const CURRICULUM_LESSON_PACKS = Object.freeze({
    custom: Object.freeze({
      label: 'Manual (no pack)',
      targets: Object.freeze([])
    }),
    phonics: Object.freeze({
      label: 'Phonics Curriculum',
      targets: Object.freeze([
        Object.freeze({ id: 'phonics-k2-cvc', label: 'Phonics K-2 · CVC and short vowels', focus: 'cvc', gradeBand: 'K-2', length: '3', pacing: 'Weeks 1-6 (Sep-Oct)' }),
        Object.freeze({ id: 'phonics-k2-digraph', label: 'Phonics K-2 · Digraphs and blends', focus: 'digraph', gradeBand: 'K-2', length: '4', pacing: 'Weeks 7-12 (Oct-Nov)' }),
        Object.freeze({ id: 'phonics-k2-cvce', label: 'Phonics K-2 · Magic E (CVCe)', focus: 'cvce', gradeBand: 'K-2', length: '4', pacing: 'Weeks 13-18 (Dec-Jan)' }),
        Object.freeze({ id: 'phonics-35-vowel-team', label: 'Phonics G3-5 · Vowel teams', focus: 'vowel_team', gradeBand: 'G3-5', length: '5', pacing: 'Weeks 19-24 (Feb-Mar)' }),
        Object.freeze({ id: 'phonics-35-r-controlled', label: 'Phonics G3-5 · R-controlled vowels', focus: 'r_controlled', gradeBand: 'G3-5', length: '5', pacing: 'Weeks 25-30 (Apr-May)' }),
        Object.freeze({ id: 'phonics-35-multisyllable', label: 'Phonics G3-5 · Multisyllable transfer', focus: 'multisyllable', gradeBand: 'G3-5', length: '6', pacing: 'Weeks 31-36 (May-Jun)' })
      ])
    }),
    ufli: Object.freeze({
      label: 'UFLI',
      targets: buildUfliLessonTargets()
    }),
    fundations: Object.freeze({
      label: 'Fundations',
      targets: buildFundationsLessonTargets()
    }),
    wilson: Object.freeze({
      label: 'Wilson Reading System',
      targets: buildWilsonLessonTargets()
    }),
    lexiawida: Object.freeze({
      label: 'Lexia English (WIDA)',
      targets: buildLexiaWidaLessonTargets()
    }),
    justwords: Object.freeze({
      label: 'Just Words',
      targets: Object.freeze([
        Object.freeze({ id: 'jw-unit-1', label: 'Just Words Unit 1', focus: 'structured_literacy', gradeBand: 'G6-8', length: '7', pacing: 'Unit 1' }),
        Object.freeze({ id: 'jw-unit-2', label: 'Just Words Unit 2', focus: 'structured_literacy', gradeBand: 'G6-8', length: '7', pacing: 'Unit 2' }),
        Object.freeze({ id: 'jw-unit-3', label: 'Just Words Unit 3', focus: 'structured_literacy', gradeBand: 'G6-8', length: '7', pacing: 'Unit 3' }),
        Object.freeze({ id: 'jw-unit-4', label: 'Just Words Unit 4', focus: 'structured_literacy', gradeBand: 'G6-8', length: '7', pacing: 'Unit 4' }),
        Object.freeze({ id: 'jw-unit-5', label: 'Just Words Unit 5', focus: 'structured_literacy', gradeBand: 'G6-8', length: '7', pacing: 'Unit 5' })
      ])
    })
  });
  const CURRICULUM_PACK_ORDER = Object.freeze(['ufli', 'fundations', 'wilson', 'lexiawida', 'justwords']);

  const CHUNK_TAB_FOCUS_KEYS = new Set([
    'digraph',
    'ccvc',
    'cvcc',
    'trigraph',
    'welded',
    'diphthong',
    'vowel_team',
    'r_controlled',
    'floss'
  ]);
  const TEAM_LABEL_SETS = Object.freeze({
    mascots: Object.freeze(['Foxes', 'Owls', 'Sharks', 'Dragons']),
    colors: Object.freeze(['Blue Team', 'Gold Team', 'Red Team', 'Green Team']),
    space: Object.freeze(['Comets', 'Rockets', 'Nova Crew', 'Star Wings']),
    wizards: Object.freeze(['Lions', 'Eagles', 'Badgers', 'Serpents'])
  });

  function getThemeFallback() {
    return 'seahawks';
  }

  function normalizeTheme(theme, fallback = getThemeFallback()) {
    if (ThemeRegistry && typeof ThemeRegistry.normalizeTheme === 'function') {
      return ThemeRegistry.normalizeTheme(theme, fallback);
    }
    return theme || fallback;
  }

  function readThemeFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const raw = params.get('theme') || '';
      const normalized = String(raw || '').trim();
      if (!normalized) return '';
      return normalizeTheme(normalized, getThemeFallback());
    } catch {
      return '';
    }
  }

  function readWritingStudioReturnFlag() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('wq_studio_return') === '1';
    } catch {
      return false;
    }
  }

  function readWritingStudioHiddenFlag() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      return params.get('ws_hidden') === '1';
    } catch {
      return false;
    }
  }

  function consumeWritingStudioReturnSummary() {
    if (!readWritingStudioReturnFlag()) return;
    focusSearchReopenGuardUntil = Date.now() + 1500;
    closeFocusSearchList();
    const focusInput = _el('focus-inline-search');
    if (focusInput) {
      focusInput.blur();
      focusInput.setAttribute('aria-expanded', 'false');
    }
    setFocusSearchOpen(false);
    let payload = null;
    try {
      payload = JSON.parse(localStorage.getItem(WRITING_STUDIO_RETURN_KEY) || 'null');
      localStorage.removeItem(WRITING_STUDIO_RETURN_KEY);
    } catch {
      payload = null;
    }
    try {
      const params = new URLSearchParams(window.location.search || '');
      params.delete('wq_studio_return');
      const query = params.toString();
      const nextUrl = `${location.pathname}${query ? `?${query}` : ''}${location.hash || ''}`;
      history.replaceState(null, '', nextUrl);
    } catch {}
    if (!payload || typeof payload !== 'object') return;
    const words = Math.max(0, Number(payload.words) || 0);
    const sentences = Math.max(0, Number(payload.sentences) || 0);
    const mode = String(payload.mode || '').toLowerCase() === 'paragraph' ? 'paragraph' : 'sentence';
    const planItems = Math.max(0, Number(payload.planItems) || 0);
    const focus = String(payload.focus || '').trim();
    emitTelemetry('studio_return', {
      studio_words: words,
      studio_sentences: sentences,
      studio_mode: mode,
      studio_plan_items: planItems,
      studio_focus: focus || null
    });
    setTimeout(() => {
      closeFocusSearchList();
      setFocusSearchOpen(false);
    }, 0);
    setTimeout(() => {
      closeFocusSearchList();
      setFocusSearchOpen(false);
    }, 220);
  }

  function consumeWritingStudioHiddenNotice() {
    if (!readWritingStudioHiddenFlag()) return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      params.delete('ws_hidden');
      const query = params.toString();
      const nextUrl = `${location.pathname}${query ? `?${query}` : ''}${location.hash || ''}`;
      history.replaceState(null, '', nextUrl);
    } catch {}
    WQUI.showToast('Writing Studio is hidden in this shared build.');
  }

  function normalizeMusicMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return ALLOWED_MUSIC_MODES.has(normalized) ? normalized : DEFAULT_PREFS.music;
  }

  function normalizeVoiceMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return ALLOWED_VOICE_MODES.has(normalized)
      ? normalized
      : DEFAULT_PREFS.voice;
  }

  function normalizeRevealPacing(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return normalized === 'quick' || normalized === 'slow'
      ? normalized
      : DEFAULT_PREFS.revealPacing;
  }

  function normalizeRevealAutoNext(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (normalized === 'off') return 'off';
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_PREFS.revealAutoNext;
    if (seconds <= 3) return '3';
    if (seconds <= 5) return '5';
    return '8';
  }

  function normalizeTeamMode(mode) {
    return String(mode || '').trim().toLowerCase() === 'on' ? 'on' : 'off';
  }

  function normalizeTeamCount(value) {
    const count = Number.parseInt(String(value || '').trim(), 10);
    if (!Number.isFinite(count) || count < 2) return '2';
    if (count > 4) return '4';
    return String(count);
  }

  function normalizeTurnTimer(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'off') return 'off';
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return 'off';
    if (seconds <= 30) return '30';
    if (seconds <= 45) return '45';
    return '60';
  }

  function normalizeTeamSet(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return TEAM_LABEL_SETS[normalized] ? normalized : DEFAULT_PREFS.teamSet;
  }

  function normalizeReportCompactMode(value) {
    return String(value || '').trim().toLowerCase() === 'on' ? 'on' : 'off';
  }

  function normalizeMasterySort(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ALLOWED_MASTERY_SORT_MODES.has(normalized) ? normalized : 'attempts_desc';
  }

  function normalizeMasteryFilter(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ALLOWED_MASTERY_FILTER_MODES.has(normalized) ? normalized : 'all';
  }

  function resolveAutoMusicMode(themeId) {
    const normalizedTheme = normalizeTheme(themeId, getThemeFallback());
    const directMode = AUTO_MUSIC_BY_THEME[normalizedTheme];
    if (directMode) return directMode;
    return AUTO_MUSIC_BY_FAMILY[getThemeFamily(normalizedTheme)] || 'chill';
  }

  function updateMusicStatus(selectedMode, activeMode) {
    const status = _el('s-music-active');
    if (!status) return;
    if (selectedMode === 'off') {
      status.textContent = 'Music is stopped.';
      syncQuickMusicDock('off', activeMode);
      return;
    }
    const activeLabel = MUSIC_LABELS[activeMode] || activeMode;
    if (selectedMode === 'auto') {
      status.textContent = `Auto picks ${activeLabel} for the active theme.`;
      syncQuickMusicDock(selectedMode, activeMode);
      return;
    }
    status.textContent = `Fixed music vibe: ${activeLabel}.`;
    syncQuickMusicDock(selectedMode, activeMode);
  }

  function syncMediaSessionControls(selectedMode, activeMode) {
    if (!('mediaSession' in navigator)) return;
    const selected = normalizeMusicMode(selectedMode || _el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    const active = normalizeMusicMode(activeMode || (selected === 'auto'
      ? resolveAutoMusicMode(normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()))
      : selected));
    const playbackState = selected === 'off'
      ? 'paused'
      : (musicController && typeof musicController.getPlaybackState === 'function'
        ? musicController.getPlaybackState()
        : 'playing');
    const vibeLabel = MUSIC_LABELS[active] || active;
    try {
      navigator.mediaSession.playbackState = playbackState === 'paused' ? 'paused' : 'playing';
    } catch {}
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Word Quest ${vibeLabel}`,
        artist: 'Cornerstone MTSS',
        album: 'Word Quest'
      });
    } catch {}
  }

  function installMediaSessionControls() {
    if (!('mediaSession' in navigator)) return;
    const safeBind = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, (details) => {
          // Prevent other media players from handling these actions
          handler(details);
        });
      } catch {}
    };
    safeBind('play', (details) => {
      const selected = normalizeMusicMode(_el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
      if (selected === 'off') {
        const next = getPreferredMusicOnMode();
        applyMusicModeFromQuick(next, { toast: false });
        return;
      }
      if (musicController && typeof musicController.resume === 'function') {
        musicController.resume();
      } else {
        syncMusicForTheme({ toast: false });
      }
      syncMediaSessionControls();
    });
    safeBind('pause', (details) => {
      if (musicController && typeof musicController.pause === 'function') {
        musicController.pause();
      }
      syncMediaSessionControls();
    });
    safeBind('nexttrack', (details) => {
      stepMusicVibe(1);
    });
    safeBind('previoustrack', (details) => {
      stepMusicVibe(-1);
    });
    // Set initial playback state to ensure Media Session is active
    try {
      navigator.mediaSession.playbackState = 'paused';
    } catch {}
  }

  function syncQuickMusicDock(selectedMode, activeMode) {
    const toggleBtn = _el('quick-music-toggle');
    const prevBtn = _el('quick-music-prev');
    const nextBtn = _el('quick-music-next');
    const shuffleBtn = _el('quick-music-shuffle');
    const labelEl = _el('quick-music-label');
    if (!toggleBtn) return;
    const selected = normalizeMusicMode(selectedMode || _el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    const active = normalizeMusicMode(activeMode || (selected === 'auto'
      ? resolveAutoMusicMode(normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()))
      : selected));
    const isOn = selected !== 'off';
    const activeLabel = MUSIC_LABELS[active] || active;
    toggleBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    toggleBtn.classList.toggle('is-on', isOn);
    toggleBtn.setAttribute('data-music-state', isOn ? 'on' : 'off');
    toggleBtn.textContent = isOn ? '⏸' : '▶';
    toggleBtn.setAttribute('aria-label', isOn
      ? `Pause music. Current vibe: ${activeLabel}.`
      : 'Play music.');
    setHoverNoteForElement(toggleBtn, isOn ? `Pause music (${activeLabel}).` : 'Play music.');
    [prevBtn, nextBtn, shuffleBtn].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('is-on', isOn);
    });
    if (prevBtn) setHoverNoteForElement(prevBtn, `Previous vibe (now ${activeLabel}).`);
    if (nextBtn) setHoverNoteForElement(nextBtn, `Next vibe (now ${activeLabel}).`);
    if (shuffleBtn) setHoverNoteForElement(shuffleBtn, `Shuffle vibe (now ${activeLabel}).`);
    if (labelEl) {
      labelEl.textContent = isOn ? activeLabel : 'Stopped';
    }
    if (isOn) {
      try { localStorage.setItem(LAST_NON_OFF_MUSIC_KEY, selected === 'auto' ? 'auto' : active); } catch {}
    }
  }

  function syncQuickMusicVolume(value) {
    const quickVolume = _el('quick-music-vol');
    if (!quickVolume) return;
    const next = Math.max(0, Math.min(1, Number.parseFloat(value)));
    quickVolume.value = String(Number.isFinite(next) ? next : Number.parseFloat(DEFAULT_PREFS.musicVol));
  }

  function getPreferredMusicOnMode() {
    try {
      const stored = normalizeMusicMode(localStorage.getItem(LAST_NON_OFF_MUSIC_KEY) || '');
      if (stored && stored !== 'off') return stored;
    } catch {}
    const pref = normalizeMusicMode(_el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    if (pref !== 'off') return pref;
    return 'auto';
  }

  function toggleMusicQuick() {
    const select = _el('s-music');
    const current = normalizeMusicMode(select?.value || prefs.music || DEFAULT_PREFS.music);
    const next = current === 'off' ? getPreferredMusicOnMode() : 'off';
    if (select) select.value = next;
    setPref('music', next);
    syncMusicForTheme({ toast: true });
  }

  function getCurrentMusicVibeForControls() {
    const selected = normalizeMusicMode(_el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    if (selected === 'off') return getPreferredMusicOnMode();
    if (selected === 'auto') {
      const activeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
      return resolveAutoMusicMode(activeTheme);
    }
    return selected;
  }

  function applyMusicModeFromQuick(mode, options = {}) {
    const next = normalizeMusicMode(mode);
    if (next === 'off') return;
    const select = _el('s-music');
    if (select) select.value = next;
    setPref('music', next);
    syncMusicForTheme({ toast: options.toast !== false });
  }

  function stepMusicVibe(direction = 1) {
    const current = getCurrentMusicVibeForControls();
    const idx = Math.max(0, QUICK_MUSIC_VIBE_ORDER.indexOf(current));
    const next = QUICK_MUSIC_VIBE_ORDER[(idx + direction + QUICK_MUSIC_VIBE_ORDER.length) % QUICK_MUSIC_VIBE_ORDER.length];
    applyMusicModeFromQuick(next, { toast: true });
  }

  function shuffleMusicVibe() {
    const current = getCurrentMusicVibeForControls();
    const pool = QUICK_MUSIC_VIBE_ORDER.filter((mode) => mode !== current);
    const next = pool[Math.floor(Math.random() * pool.length)] || current;
    applyMusicModeFromQuick(next, { toast: true });
  }

  function setLocalMusicFiles(fileList) {
    const msgEl = _el('s-music-upload-msg');
    const files = Array.from(fileList || [])
      .filter((file) => file && /^audio\//i.test(String(file.type || '')) && Number(file.size || 0) > 0);
    if (!musicController || typeof musicController.setCustomFiles !== 'function') {
      if (msgEl) msgEl.textContent = 'Local upload is unavailable in this build.';
      return;
    }
    if (!files.length) {
      if (msgEl) msgEl.textContent = 'No valid audio files selected.';
      return;
    }
    const result = musicController.setCustomFiles(files);
    const count = Number(result?.count || 0);
    const selected = normalizeMusicMode(_el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    if (selected === 'off') {
      applyMusicModeFromQuick(getPreferredMusicOnMode(), { toast: false });
    } else {
      syncMusicForTheme({ toast: false });
    }
    const message = count > 0
      ? `Loaded ${count} local track${count === 1 ? '' : 's'} for this device.`
      : 'No valid audio files selected.';
    if (msgEl) msgEl.textContent = message;
    WQUI.showToast(message);
  }

  function clearLocalMusicFiles() {
    const msgEl = _el('s-music-upload-msg');
    if (musicController && typeof musicController.clearCustomFiles === 'function') {
      musicController.clearCustomFiles();
    }
    syncMusicForTheme({ toast: false });
    if (msgEl) msgEl.textContent = 'Local MP3 list cleared.';
    WQUI.showToast('Local MP3 list cleared.');
  }

  function syncMusicForTheme(options = {}) {
    const selected = normalizeMusicMode(_el('s-music')?.value || prefs.music || DEFAULT_PREFS.music);
    const activeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const effective = selected === 'auto' ? resolveAutoMusicMode(activeTheme) : selected;
    if (musicController) musicController.setMode(effective);
    updateMusicStatus(selected, effective);
    syncMediaSessionControls(selected, effective);
    const signature = `${selected}::${effective}`;
    if (telemetryLastMusicSignature !== signature) {
      telemetryLastMusicSignature = signature;
      emitTelemetry('wq_music_change', {
        selected_music_mode: selected,
        active_music_mode: effective,
        source: options.toast ? 'user' : 'system'
      });
    }
    if (options.toast) {
      const label = MUSIC_LABELS[effective] || effective;
      WQUI.showToast(selected === 'auto' ? `Music auto: ${label}.` : `Music: ${label}.`);
    }
  }


export {
  // Core preference management
  prefs, loadPrefs, savePrefs, setPref,
  // Streak management
  loadStreak, saveStreak, incrementStreak, renderSafeStreak,
  // UI normalization
  normalizeKeyboardLayout, normalizeStarterWordMode, normalizeCuratedMusicMode,
  normalizeUiSkin, normalizeTextSize, normalizeKeyboardPresetId, deriveKeyboardPresetId,
  getKeyboardLayoutLabel, getNextKeyboardLayout,
  getSupportPromptMode, setSupportPromptMode,
  // Theme helpers
  normalizeTheme, getThemeFallback, getThemeFamily, shouldPersistTheme, readThemeFromQuery,
  // Team mode normalization
  normalizeTeamMode, normalizeTeamCount, normalizeTeamSet,
  // Reveal and pacing normalization
  normalizeRevealPacing, normalizeRevealAutoNext,
  // Music and voice
  normalizeMusicMode, normalizeVoiceMode,
  // Report and mastery normalization
  normalizeReportCompactMode, normalizeMasterySort, normalizeMasteryFilter,
  // Telemetry
  emitTelemetry, stopDemoToastProgress,
  // Demo UI
  positionDemoLaunchButton,
  // UI helpers
  setHoverNoteForElement
};

// Explicit exports for page mode functions
export { persistPageMode, normalizePageMode, loadStoredPageMode, readPageModeFromQuery, isMissionLabEnabled };
