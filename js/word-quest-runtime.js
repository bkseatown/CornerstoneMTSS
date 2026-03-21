/**
 * app-main.js
 * Extracted Word Quest main runtime from app.js.
 */

window.runWordQuestMain = async function runWordQuestMain(context = {}) {
  const {
    APP_SEMVER,
    DEMO_DEBUG_MODE,
    DEMO_MODE,
    DEMO_TARGET_WORD,
    FEATURES,
    SW_RUNTIME_RESOLVED_VERSION,
    assertHomeNoScroll,
    demoClearTimers,
    demoSetTimeout,
    getDemoState,
    isDevModeEnabled,
    logOverflow,
    withAppBase
  } = context;
  const RUNTIME_CONSTANTS = window.WQRuntimeConstants || {};
  // ─── 3. Preferences ────────────────────────────────
  const PREF_KEY = RUNTIME_CONSTANTS.PREF_KEY || 'wq_v2_prefs';
  const PREF_MIGRATION_KEY = RUNTIME_CONSTANTS.PREF_MIGRATION_KEY || 'wq_v2_pref_defaults_20260222';
  const PREF_UI_SKIN_RESET_MIGRATION_KEY = RUNTIME_CONSTANTS.PREF_UI_SKIN_RESET_MIGRATION_KEY || 'wq_v2_pref_ui_skin_default_20260226a';
  const PREF_MUSIC_AUTO_MIGRATION_KEY = RUNTIME_CONSTANTS.PREF_MUSIC_AUTO_MIGRATION_KEY || 'wq_v2_pref_music_auto_20260222';
  const PREF_GUESSES_DEFAULT_MIGRATION_KEY = RUNTIME_CONSTANTS.PREF_GUESSES_DEFAULT_MIGRATION_KEY || 'wq_v2_pref_guesses_default_20260224';
  const FIRST_RUN_SETUP_KEY = RUNTIME_CONSTANTS.FIRST_RUN_SETUP_KEY || 'wq_v2_first_run_setup_v1';
  const SESSION_SUMMARY_KEY = RUNTIME_CONSTANTS.SESSION_SUMMARY_KEY || 'wq_v2_teacher_session_summary_v1';
  const ROSTER_STATE_KEY = RUNTIME_CONSTANTS.ROSTER_STATE_KEY || 'wq_v2_teacher_roster_v1';
  const PROBE_HISTORY_KEY = RUNTIME_CONSTANTS.PROBE_HISTORY_KEY || 'cs_probe_history_v1';
  const PROBE_HISTORY_LEGACY_KEYS = RUNTIME_CONSTANTS.PROBE_HISTORY_LEGACY_KEYS || Object.freeze(['wq_v2_weekly_probe_history_v1']);
  const STUDENT_GOALS_KEY = RUNTIME_CONSTANTS.STUDENT_GOALS_KEY || 'wq_v2_student_goals_v1';
  const PLAYLIST_STATE_KEY = RUNTIME_CONSTANTS.PLAYLIST_STATE_KEY || 'wq_v2_assignment_playlists_v1';
  const WRITING_STUDIO_RETURN_KEY = RUNTIME_CONSTANTS.WRITING_STUDIO_RETURN_KEY || 'ws_return_to_wordquest_v1';
  const EVENT_BUS_EVENTS = window.WQEventBusContract?.events || {};
  const TEACHER_ASSIGNMENTS_CONTRACT = window.WQTeacherAssignmentsContract || {};
  const DEEP_DIVE_CONTRACT = window.WQDeepDiveContract || {};
  const SHUFFLE_BAG_KEY = RUNTIME_CONSTANTS.SHUFFLE_BAG_KEY || 'wq_v2_shuffle_bag';
  const REVIEW_QUEUE_KEY = RUNTIME_CONSTANTS.REVIEW_QUEUE_KEY || 'wq_v2_spaced_review_queue_v1';
  const TELEMETRY_QUEUE_KEY = RUNTIME_CONSTANTS.TELEMETRY_QUEUE_KEY || 'wq_v2_telemetry_queue_v1';
  const DIAGNOSTICS_LAST_RESET_KEY = RUNTIME_CONSTANTS.DIAGNOSTICS_LAST_RESET_KEY || 'wq_v2_diag_last_reset_v1';
  const PAGE_MODE_KEY = RUNTIME_CONSTANTS.PAGE_MODE_KEY || 'wq_v2_page_mode_v1';
  const LAST_NON_OFF_MUSIC_KEY = RUNTIME_CONSTANTS.LAST_NON_OFF_MUSIC_KEY || 'wq_v2_last_non_off_music_v1';
  const FEATURE_FLAGS = window.WQFeatureFlags || {};
  const FOCUS_CURRICULUM_HELPERS = window.WQFocusCurriculumHelpers || {};
  const MAIN_CONFIG = window.WQMainConfig || {};
  const WRITING_STUDIO_ENABLED = FEATURE_FLAGS.writingStudio === true;
  const MISSION_LAB_ENABLED = true;
  const MIDGAME_BOOST_ENABLED = false;
  const REVIEW_QUEUE_MAX_ITEMS = MAIN_CONFIG.REVIEW_QUEUE_MAX_ITEMS || 36;
  const ALLOWED_MUSIC_MODES = MAIN_CONFIG.ALLOWED_MUSIC_MODES || new Set();
  const ALLOWED_VOICE_MODES = MAIN_CONFIG.ALLOWED_VOICE_MODES || new Set();
  const MUSIC_LABELS = MAIN_CONFIG.MUSIC_LABELS || Object.freeze({});
  const CURATED_MUSIC_MODE_ORDER = MAIN_CONFIG.CURATED_MUSIC_MODE_ORDER || Object.freeze([]);
  const CURATED_MUSIC_MODES = MAIN_CONFIG.CURATED_MUSIC_MODES || new Set();
  const QUICK_MUSIC_VIBE_ORDER = MAIN_CONFIG.QUICK_MUSIC_VIBE_ORDER || CURATED_MUSIC_MODE_ORDER;
  const DEFAULT_PREFS = MAIN_CONFIG.DEFAULT_PREFS || Object.freeze({});
  const STUDENT_RECORDING_ENABLED = MAIN_CONFIG.STUDENT_RECORDING_ENABLED === true;
  const SAFE_DEFAULT_GRADE_BAND = MAIN_CONFIG.SAFE_DEFAULT_GRADE_BAND || 'K-2';
  const ALLOWED_MASTERY_SORT_MODES = MAIN_CONFIG.ALLOWED_MASTERY_SORT_MODES || new Set();
  const ALLOWED_MASTERY_FILTER_MODES = MAIN_CONFIG.ALLOWED_MASTERY_FILTER_MODES || new Set();
  const ALLOWED_KEY_STYLES = MAIN_CONFIG.ALLOWED_KEY_STYLES || new Set();
  const KEYBOARD_LAYOUT_ORDER = MAIN_CONFIG.KEYBOARD_LAYOUT_ORDER || Object.freeze(['standard', 'alphabet']);
  const ALLOWED_KEYBOARD_LAYOUTS = MAIN_CONFIG.ALLOWED_KEYBOARD_LAYOUTS || new Set(KEYBOARD_LAYOUT_ORDER);
  const KEYBOARD_LAYOUT_LABELS = MAIN_CONFIG.KEYBOARD_LAYOUT_LABELS || Object.freeze({});
  const STARTER_WORD_SUPPORT_MODES = MAIN_CONFIG.STARTER_WORD_SUPPORT_MODES || new Set(['off', 'on_demand', 'after_2', 'after_3']);
  const SUPPORT_PROMPT_PREF_KEY = RUNTIME_CONSTANTS.SUPPORT_PROMPT_PREF_KEY || 'wq_v2_support_prompt_auto_v1';
  const ALLOWED_UI_SKINS = MAIN_CONFIG.ALLOWED_UI_SKINS || new Set(['premium', 'classic']);
  const KEYBOARD_PRESET_CONFIG = MAIN_CONFIG.KEYBOARD_PRESET_CONFIG || Object.freeze({});

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

  function getSupportPromptMode() {
    try {
      return localStorage.getItem(SUPPORT_PROMPT_PREF_KEY) === 'off' ? 'off' : 'on';
    } catch {
      return 'on';
    }
  }

  function buildCurrentCurriculumSnapshot() {
    const packEl = _el('s-lesson-pack');
    const targetEl = _el('s-lesson-target');
    const focusValue = String(_el('setting-focus')?.value || prefs.focus || 'all').trim() || 'all';
    const selectedGrade = String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade).trim() || DEFAULT_PREFS.grade;
    const effectiveGrade = getEffectiveGameplayGradeBand(selectedGrade, focusValue);
    const lengthValue = String(_el('s-length')?.value || prefs.length || DEFAULT_PREFS.length).trim() || DEFAULT_PREFS.length;
    const packId = String(packEl?.value || prefs.lessonPack || 'custom').trim() || 'custom';
    const targetId = String(targetEl?.value || prefs.lessonTarget || 'custom').trim() || 'custom';
    const packLabel = String(
      packEl?.selectedOptions?.[0]?.textContent ||
      focusCurriculumRuntime?.getLessonPackDefinition?.(packId)?.label ||
      'Manual selection'
    ).replace(/\s+/g, ' ').trim();
    const targetLabel = String(
      targetEl?.selectedOptions?.[0]?.textContent ||
      (targetId === 'custom' ? '' : targetId)
    ).replace(/\s+/g, ' ').trim();
    return {
      packId,
      packLabel,
      targetId,
      targetLabel,
      focus: focusValue,
      selectedGrade,
      effectiveGrade,
      gradeBand: effectiveGrade,
      length: lengthValue
    };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSectionHeadingMarkup(text) {
    return `<div class="focus-search-heading" role="presentation">${escapeHtml(text)}</div>`;
  }

  function renderRevealChallengeModal(...args) {
    return deepDiveCoreRuntime?.renderRevealChallengeModal?.(...args);
  }

  function closeRevealChallengeModal(...args) {
    return deepDiveCoreRuntime?.closeRevealChallengeModal?.(...args);
  }

  function isConsecutiveDay(prevDay, nextDay) {
    if (!prevDay || !nextDay) return false;
    const prev = new Date(`${prevDay}T12:00:00`);
    const next = new Date(`${nextDay}T12:00:00`);
    if (Number.isNaN(prev.getTime()) || Number.isNaN(next.getTime())) return false;
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000);
    return diffDays === 1;
  }

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isQuickPopoverAllowed() {
    const panelOpen = !_el('settings-panel')?.classList.contains('hidden');
    const teacherPanelOpen = !_el('teacher-panel')?.classList.contains('hidden');
    const focusOpen = document.documentElement.getAttribute('data-focus-search-open') === 'true';
    return !panelOpen && !teacherPanelOpen && !focusOpen && !isAssessmentRoundLocked();
  }

  function setSupportPromptMode(mode) {
    try {
      localStorage.setItem(SUPPORT_PROMPT_PREF_KEY, mode === 'off' ? 'off' : 'on');
    } catch {}
  }

  function normalizeUiSkin(mode) {
    // Premium skin is temporarily disabled to prevent washed-out gameplay surfaces.
    // Keep a hard fallback to classic regardless of stale saved prefs.
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

  function detectPreferredKeyboardLayout() {
    return 'standard';
  }

  const preferredInitialKeyboardLayout = detectPreferredKeyboardLayout();

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
  }
  function savePrefs(p) {
    if (DEMO_MODE) return;
    const normalized = p && typeof p === 'object' ? { ...p } : {};
    delete normalized.lessonPack;
    delete normalized.lessonTarget;
    try { localStorage.setItem(PREF_KEY, JSON.stringify(normalized)); } catch {}
  }
  const prefs = loadPrefs();

  if (Object.prototype.hasOwnProperty.call(prefs, 'lessonPack') || Object.prototype.hasOwnProperty.call(prefs, 'lessonTarget')) {
    delete prefs.lessonPack;
    delete prefs.lessonTarget;
    savePrefs(prefs);
  }

  // Curriculum pack/target are session-only: always start from defaults on load.
  prefs.lessonPack = DEFAULT_PREFS.lessonPack;
  prefs.lessonTarget = DEFAULT_PREFS.lessonTarget;

  function setPref(k, v) { prefs[k] = v; savePrefs(prefs); }
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

  function syncFocusSupportRuntimeState() {
    window.focusSupportUnlockAt = Number(focusSupportUnlockAt) || 0;
    window.focusSupportUnlockedByMiss = !!focusSupportUnlockedByMiss;
    window.currentRoundSupportPromptShown = !!currentRoundSupportPromptShown;
    window.focusSupportEligibleAt = Number(focusSupportEligibleAt) || 0;
  }

  syncFocusSupportRuntimeState();

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
  const SAFE_STREAK_KEY = RUNTIME_CONSTANTS.SAFE_STREAK_KEY || 'wordquest_streak';
  const DEEP_DIVE_CONFIG = window.WQDeepDiveConfig || {};
  const REVEAL_WIN_TOASTS = DEEP_DIVE_CONFIG.REVEAL_WIN_TOASTS || Object.freeze({});
  const REVEAL_LOSS_TOASTS = DEEP_DIVE_CONFIG.REVEAL_LOSS_TOASTS || Object.freeze({});
  const THINKING_LEVEL_META = DEEP_DIVE_CONFIG.THINKING_LEVEL_META || Object.freeze({});
  const CHALLENGE_REFLECTION_KEY = DEEP_DIVE_CONFIG.CHALLENGE_REFLECTION_KEY || RUNTIME_CONSTANTS.CHALLENGE_REFLECTION_KEY || 'wq_v2_levelup_reflections_v1';
  const CHALLENGE_PROGRESS_KEY = DEEP_DIVE_CONFIG.CHALLENGE_PROGRESS_KEY || RUNTIME_CONSTANTS.CHALLENGE_PROGRESS_KEY || 'wq_v2_mission_lab_progress_v1';
  const CHALLENGE_DRAFT_KEY = DEEP_DIVE_CONFIG.CHALLENGE_DRAFT_KEY || RUNTIME_CONSTANTS.CHALLENGE_DRAFT_KEY || 'wq_v2_mission_lab_draft_v1';
  const CHALLENGE_ONBOARDING_KEY = DEEP_DIVE_CONFIG.CHALLENGE_ONBOARDING_KEY || RUNTIME_CONSTANTS.CHALLENGE_ONBOARDING_KEY || 'wq_v2_deep_dive_onboarding_v1';
  const CHALLENGE_ONBOARDING_MAX_VIEWS = DEEP_DIVE_CONFIG.CHALLENGE_ONBOARDING_MAX_VIEWS || 2;
  const CHALLENGE_STRONG_SCORE_MIN = DEEP_DIVE_CONFIG.CHALLENGE_STRONG_SCORE_MIN || 75;
  const CHALLENGE_COMPLETE_LINES = DEEP_DIVE_CONFIG.CHALLENGE_COMPLETE_LINES || Object.freeze([]);
  const CHALLENGE_TASK_FLOW = DEEP_DIVE_CONFIG.CHALLENGE_TASK_FLOW || Object.freeze([]);
  const CHALLENGE_TASK_LABELS = DEEP_DIVE_CONFIG.CHALLENGE_TASK_LABELS || Object.freeze({});
  const DEEP_DIVE_VARIANTS = DEEP_DIVE_CONFIG.DEEP_DIVE_VARIANTS || Object.freeze({});
  const CHALLENGE_PACING_NUDGE_MS = DEEP_DIVE_CONFIG.CHALLENGE_PACING_NUDGE_MS || (45 * 1000);
  const CHALLENGE_WORD_ROLE_META = DEEP_DIVE_CONFIG.CHALLENGE_WORD_ROLE_META || Object.freeze({});
  const CHALLENGE_RANKS = DEEP_DIVE_CONFIG.CHALLENGE_RANKS || Object.freeze([]);
  const CHALLENGE_LEVELS = DEEP_DIVE_CONFIG.CHALLENGE_LEVELS || Object.freeze([]);
  const CHALLENGE_SCAFFOLD_PROFILE = DEEP_DIVE_CONFIG.CHALLENGE_SCAFFOLD_PROFILE || Object.freeze({});
  const REVEAL_PACING_PRESETS = DEEP_DIVE_CONFIG.REVEAL_PACING_PRESETS || Object.freeze({});
  const demoUiFactory = window.createDemoUiModule;
  const demoFlowFactory = window.createDemoFlowModule;
  const supportUiFactory = window.createSupportUiModule;
  const supportLogicFactory = window.createSupportLogicModule;
  const gameplayStatsModuleFactory = window.createGameplayStatsModule;
  const deepDiveBuildersFactory = window.createDeepDiveBuilders;
  const deepDiveStateFactory = window.createDeepDiveStateModule;
  const deepDiveUiFactory = window.createDeepDiveUiModule;
  const deepDiveSessionFactory = window.createDeepDiveSessionModule;
  const phonicsClueModuleFactory = window.createPhonicsClueModule;
  const midgameBoostFactory = window.createMidgameBoostModule;
  const telemetryDiagnosticsFactory = window.createTelemetryDiagnosticsModule;
  const sessionAnalyticsFactory = window.createSessionAnalyticsModule;
  const sessionMasteryFactory = window.createSessionMasteryModule;
  const sessionProbeFactory = window.createSessionProbeModule;
  const sessionExportsFactory = window.createSessionExportsModule;
  const questRuntimeFactory = window.createQuestRuntimeModule;
  const teacherStateFactory = window.createTeacherStateModule;
  const shellRuntimeFactory = window.createShellRuntimeModule;
  const settingsRuntimeFactory = window.createSettingsRuntimeModule;
  const panelRuntimeFactory = window.createPanelRuntimeModule;
  const preferencesRuntimeFactory = window.createPreferencesRuntimeModule;
  const sessionControlsFactory = window.createSessionControlsModule;
  const musicRuntimeFactory = window.createMusicRuntimeModule;
  const voiceSupportFactory = window.createVoiceSupportModule;
  const revealFlowSupportFactory = window.createRevealFlowSupportModule;
  const standaloneMissionFactory = window.createStandaloneMissionModule;
  const deepDiveCoreRuntimeFactory = window.createDeepDiveCoreRuntimeModule;
  const sessionSummaryRuntimeFactory = window.createSessionSummaryRuntimeModule;
  const playlistRuntimeFactory = window.createPlaylistRuntimeModule;
  const studentSessionRuntimeFactory = window.createStudentSessionRuntimeModule;
  const focusSearchRuntimeFactory = window.createFocusSearchRuntimeModule;
  const focusCurriculumRuntimeFactory = window.createFocusCurriculumRuntimeModule;
  const focusGradeRuntimeFactory = window.createFocusGradeRuntimeModule;
  const mediaRuntimeFactory = window.createMediaRuntimeModule;
  const playSettingsRuntimeFactory = window.createPlaySettingsRuntimeModule;
  const playSurfaceBindingsFactory = window.createPlaySurfaceBindingsModule;
  const inputShellFactory = window.createInputShellModule;
  const inputConstraintsFactory = window.createInputConstraintsModule;
  const classroomTurnsFactory = window.createClassroomTurnsModule;
  const coachRuntimeFactory = window.createCoachRuntimeModule;
  const startupRuntimeFactory = window.createStartupRuntimeModule;
  const surfaceSettingsRuntimeFactory = window.createSurfaceSettingsRuntimeModule;
  const maintenanceRuntimeFactory = window.createMaintenanceRuntimeModule;
  const roundStartRuntimeFactory = window.createRoundStartRuntimeModule;
  const roundSubmitRuntimeFactory = window.createRoundSubmitRuntimeModule;
  let telemetryDiagnostics = null;
  let sessionAnalytics = null;
  let sessionMastery = null;
  let sessionProbe = null;
  let sessionExports = null;
  let questRuntime = null;
  let teacherState = null;
  let shellRuntime = null;
  let settingsRuntime = null;
  let panelRuntime = null;
  let preferencesRuntime = null;
  let sessionControls = null;
  let musicRuntime = null;
  let voiceSupport = null;
  let revealFlowSupport = null;
  let standaloneMission = null;
  let deepDiveCoreRuntime = null;
  let sessionSummaryRuntime = null;
  let playlistRuntime = null;
  let studentSessionRuntime = null;
  let focusSearchRuntime = null;
  let focusCurriculumRuntime = null;
  let focusGradeRuntime = null;
  let mediaRuntime = null;
  let playSettingsRuntime = null;
  let playSurfaceBindings = null;
  let inputShell = null;
  let inputConstraints = null;
  let classroomTurns = null;
  let coachRuntime = null;
  let startupRuntime = null;
  let surfaceSettingsRuntime = null;
  let maintenanceRuntime = null;
  let midgameBoostRuntime = null;
  let teacherAssignmentsFeature = null;
  const DEMO_TOAST_DEFAULT_DURATION_MS = RUNTIME_CONSTANTS.DEMO_TOAST_DEFAULT_DURATION_MS || 90000;
  const DEMO_TOAST_MIN_DWELL_MS = RUNTIME_CONSTANTS.DEMO_TOAST_MIN_DWELL_MS || 3200;
  const DEMO_COACH_READY_MAX_TRIES = RUNTIME_CONSTANTS.DEMO_COACH_READY_MAX_TRIES || 25;
  const DEMO_COACH_READY_DELAY_MS = RUNTIME_CONSTANTS.DEMO_COACH_READY_DELAY_MS || 120;
  const DEMO_OVERLAY_SELECTORS = RUNTIME_CONSTANTS.DEMO_OVERLAY_SELECTORS || Object.freeze([]);
  function emitTelemetry(...args) {
    return telemetryDiagnostics?.emitTelemetry?.(...args);
  }
  const demoUi = typeof demoUiFactory === 'function'
    ? demoUiFactory({
        defaultDurationMs: DEMO_TOAST_DEFAULT_DURATION_MS,
        demoMode: DEMO_MODE,
        dwellMs: DEMO_TOAST_MIN_DWELL_MS,
        getDemoState,
        getLaunchAnchorRect: () => {
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
        },
        handleRestart: () => {
          demoRoundComplete = false;
          demoToastAutoCollapsedByPlay = false;
          demoFlow?.resetDemoScriptState?.(
            demoState,
            stopDemoCoachReadyLoop,
            clearDemoAutoplayTimer,
            stopDemoKeyPulse,
            demoClearTimers
          );
          demoFlow?.closeDemoEndOverlay?.();
          newGame({ forceDemoReplay: true, launchMissionLab: false });
        },
        handleSkip: () => {
          stopDemoCoachReadyLoop();
          hideDemoCoach();
          window.WQ_DEMO = false;
          window.location.href = withAppBase('index.html');
        },
        isTeacherToolsNode: (node) => !!node,
        positionLaunchButtonLater: () => {
          setTimeout(() => demoUi?.positionDemoLaunchButton?.(), 0);
        },
        resolveDemoUrl: (url) => demoFlow?.ensureDemoParam?.(url) || url,
        runtime: {
          get demoBannerEl() { return demoBannerEl; },
          set demoBannerEl(value) { demoBannerEl = value; },
          get demoLaunchBtnEl() { return demoLaunchBtnEl; },
          set demoLaunchBtnEl(value) { demoLaunchBtnEl = value; },
          get demoToastBarFillEl() { return demoToastBarFillEl; },
          set demoToastBarFillEl(value) { demoToastBarFillEl = value; },
          get demoToastChipEl() { return demoToastChipEl; },
          set demoToastChipEl(value) { demoToastChipEl = value; },
          get demoToastCollapsed() { return demoToastCollapsed; },
          set demoToastCollapsed(value) { demoToastCollapsed = value; },
          get demoToastDurationMs() { return demoToastDurationMs; },
          set demoToastDurationMs(value) { demoToastDurationMs = value; },
          get demoToastEl() { return demoToastEl; },
          set demoToastEl(value) { demoToastEl = value; },
          get demoToastLastMessageAt() { return demoToastLastMessageAt; },
          set demoToastLastMessageAt(value) { demoToastLastMessageAt = value; },
          get demoToastMessageTimer() { return demoToastMessageTimer; },
          set demoToastMessageTimer(value) { demoToastMessageTimer = value; },
          get demoToastPendingKey() { return demoToastPendingKey; },
          set demoToastPendingKey(value) { demoToastPendingKey = value; },
          get demoToastProgressTimer() { return demoToastProgressTimer; },
          set demoToastProgressTimer(value) { demoToastProgressTimer = value; },
          get demoToastStartedAt() { return demoToastStartedAt; },
          set demoToastStartedAt(value) { demoToastStartedAt = value; },
          get demoToastTextEl() { return demoToastTextEl; },
          set demoToastTextEl(value) { demoToastTextEl = value; }
        },
        stopCoachReadyLoop: stopDemoCoachReadyLoop,
        stopDemoAudio: () => {
          if (window.WQAudio && typeof window.WQAudio.stop === 'function') window.WQAudio.stop();
          if (window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') {
            try { window.speechSynthesis.cancel(); } catch {}
          }
        },
        stopDemoAutoplayTimer: clearDemoAutoplayTimer,
        stopDemoKeyPulse,
        stopDemoTimers: () => {
          demoClearTimers();
        },
        textForStep: getDemoToastLine
      })
    : null;
  function getDemoToastLine(stepKey) {
    switch (String(stepKey || '').trim()) {
      case 'afterFirstGuess':
        return 'Try another guess or open a clue if you want help.';
      case 'idle20s':
        return 'Need a nudge? Open a clue or try one of the suggested words.';
      case 'completed':
        return 'Round complete. Restart the demo or move to the next word.';
      case 'preRound':
      default:
        return 'Live demo: try one round.';
    }
  }
  function hideDemoCoach() {
    if (demoCoachEl instanceof HTMLElement) demoCoachEl.classList.add('hidden');
  }
  const demoFlow = typeof demoFlowFactory === 'function'
    ? demoFlowFactory({
        demoDebugMode: DEMO_DEBUG_MODE,
        demoDebugRuntime: {
          getLabel: () => demoDebugLabelEl,
          setLabel: (value) => { demoDebugLabelEl = value; }
        },
        demoMode: DEMO_MODE,
        demoOverlaySelectors: DEMO_OVERLAY_SELECTORS,
        demoSetTimeoutRef: demoSetTimeout,
        el: _el,
        getDemoState,
        getDemoTargetWord: () => DEMO_TARGET_WORD,
        getGameState: () => WQGame.getState?.() || null,
        handleInputUnit,
        hideDemoCoachUi: hideDemoCoach,
        normalizePageMode,
        onCloseDemoEndOverlay: () => {
          demoUi?.setDemoToastText?.('preRound', { force: true });
          if (!demoToastAutoCollapsedByPlay) demoUi?.showDemoToast?.(true);
        },
        onDemoCompleted: () => {
          demoUi?.clearDemoToastMessageTimer?.();
          demoUi?.setDemoToastText?.('completed', { force: true });
          demoUi?.showDemoToast?.(true);
          demoUi?.stopDemoToastProgress?.();
          demoUi?.renderDemoToastProgress?.(100);
        },
        onResetDemoUi: () => {
          demoUi?.stopDemoToastProgress?.();
          demoUi?.clearDemoToastMessageTimer?.();
          demoToastCollapsed = false;
          demoToastAutoCollapsedByPlay = false;
          demoUi?.collapseDemoToast?.();
        },
        onShowDemoLine: (lineOrKey, options = {}) => {
          if (options.literal) demoUi?.setDemoToastTextLiteral?.(lineOrKey, { force: true });
          else demoUi?.setDemoToastText?.(lineOrKey);
          if (!demoToastAutoCollapsedByPlay || lineOrKey === 'completed') {
            demoUi?.showDemoToast?.(lineOrKey === 'completed');
          }
        },
        removeDemoTimer: (timerId) => {
          if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
            window.__CS_DEMO_TIMERS.delete(timerId);
          }
        },
        setPageMode,
        showDemoCoachUi: () => {},
        stopDemoAudioTimers: () => {
          if (demoAutoplayTimer) {
            clearTimeout(demoAutoplayTimer);
            if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
              window.__CS_DEMO_TIMERS.delete(demoAutoplayTimer);
            }
            demoAutoplayTimer = 0;
          }
          demoClearTimers();
          if (demoCoachReadyTimer) {
            clearTimeout(demoCoachReadyTimer);
            if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
              window.__CS_DEMO_TIMERS.delete(demoCoachReadyTimer);
            }
            demoCoachReadyTimer = 0;
          }
          if (demoState.keyPulseTimer) {
            clearTimeout(demoState.keyPulseTimer);
            demoState.keyPulseTimer = 0;
          }
        },
        syncHeaderControlsVisibility
      })
    : null;
  const supportUi = typeof supportUiFactory === 'function'
    ? supportUiFactory({
        clearInformantHintHideTimer,
        clearStarterCoachTimer,
        el: _el,
        getPickStarterWordsForRound: () => pickStarterWordsForRound,
        getSupportPromptMode,
        isAnyOverlayModalOpen,
        isHelpSuppressedForTeamMode,
        isMissionLabStandaloneMode,
        normalizePlayStyle,
        prefs,
        defaultPrefs: DEFAULT_PREFS,
        renderHintExamples,
        renderStarterWordList: (...args) => supportLogic?.renderStarterWordList?.(...args),
        setCurrentRoundSupportPromptShown: (value) => {
          currentRoundSupportPromptShown = !!value;
          syncFocusSupportRuntimeState();
        },
        setLastSupportPromptShownAt: (value) => {
          lastSupportPromptShownAt = Number(value) || 0;
        },
        setStarterWordsShown: (value) => {
          gameplayStats?.setStarterWordsShown?.(value);
        },
        showToast: (message) => WQUI.showToast(message)
      })
    : null;
  const supportLogic = typeof supportLogicFactory === 'function'
    ? supportLogicFactory({
        buildFriendlyHintMessage,
        buildLiveHintExample,
        defaultPrefs: DEFAULT_PREFS,
        emitTelemetry,
        getEffectiveGameplayGradeBand,
        getFocusLabel,
        getGameState: () => WQGame.getState?.() || {},
        getHintUnlockCopy,
        getThemeFallback,
        getWQData: () => WQData,
        hideInformantHintCard: (...args) => supportUi?.hideInformantHintCard?.(...args),
        hideStarterWordCard: (...args) => supportUi?.hideStarterWordCard?.(...args),
        isAnyOverlayModalOpen,
        isHelpSuppressedForTeamMode,
        isMissionLabStandaloneMode,
        normalizeHintCategoryFromFocusTag,
        normalizePlayStyle,
        normalizeReviewWord,
        normalizeTheme,
        parseFocusPreset,
        pickRandomized: shuffleList,
        prefs,
        setHintRequested: (value) => gameplayStats?.setHintRequested?.(value),
        setStarterWordsShown: (value) => gameplayStats?.setStarterWordsShown?.(value),
        showInformantHintCard: (...args) => supportUi?.showInformantHintCard?.(...args),
        showToast: (message) => WQUI.showToast(message),
        shouldExpandGradeBandForFocus,
        getSorHintProfiles: () => SOR_HINT_PROFILES,
        syncRoundTrackingLocals,
        ui: {
          addLetter: (value) => WQGame.addLetter(value),
          deleteLetter: () => WQGame.deleteLetter()
        },
        updateCurrentRow: (...args) => WQUI.updateCurrentRow(...args),
        updateNextActionLine,
        detectHintCategoryFromWord,
        positionStarterWordCard: (...args) => supportUi?.positionStarterWordCard?.(...args),
        currentRoundHintRequested: () => !!currentRoundHintRequested
      })
    : null;
  const hideInformantHintCard = (...args) => supportUi?.hideInformantHintCard?.(...args);
  const hideStarterWordCard = (...args) => supportUi?.hideStarterWordCard?.(...args);
  const hideSupportChoiceCard = (...args) => supportUi?.hideSupportChoiceCard?.(...args);
  const positionHintClueCard = (...args) => supportUi?.positionHintClueCard?.(...args);
  const positionSupportChoiceCard = (...args) => supportUi?.positionSupportChoiceCard?.(...args);
  const showSupportChoiceCard = (state = WQGame.getState?.() || {}, runtime = {}) => supportUi?.showSupportChoiceCard?.(state, { currentRoundSupportPromptShown, focusSupportEligibleAt, gameStartedAt, lastSupportPromptShownAt, playStyle: _el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle, ...runtime });
  const enableDraggableSupportChoiceCard = (...args) => supportUi?.enableDraggableSupportChoiceCard?.(...args);
  const positionStarterWordCard = (...args) => supportUi?.positionStarterWordCard?.(...args);
  const showInformantHintCard = (...args) => supportUi?.showInformantHintCard?.(...args);
  const buildInformantHintPayload = (...args) => supportLogic?.buildInformantHintPayload?.(...args);
  const showInformantHintToast = (...args) => supportLogic?.showInformantHintToast?.(...args);
  const replaceCurrentGuessWithWord = (...args) => supportLogic?.replaceCurrentGuessWithWord?.(...args);
  const deriveWordState = (...args) => supportLogic?.deriveWordState?.(...args);
  const pickStarterWordsForRound = (...args) => supportLogic?.pickStarterWordsForRound?.(...args);
  const getConstraintSafeCoachSuggestion = (...args) => supportLogic?.getConstraintSafeCoachSuggestion?.(...args);
  const renderStarterWordList = (...args) => supportLogic?.renderStarterWordList?.(...args);
  const showStarterWordCard = (...args) => supportLogic?.showStarterWordCard?.(...args);
  function buildMidgameBoostState() { return midgameBoostRuntime?.buildMidgameBoostState?.() || { order: [], cursor: 0 }; }

  function hideMidgameBoost() { midgameBoostRuntime?.hideMidgameBoost?.(); }
  function shouldKeepMidgameBoostOpen(target) { return midgameBoostRuntime?.shouldKeepMidgameBoostOpen?.(target) || false; }
  function showMidgameBoost() { midgameBoostRuntime?.showMidgameBoost?.(); }
  const gameplayStats = typeof gameplayStatsModuleFactory === 'function'
    ? gameplayStatsModuleFactory({
        buildCurriculumSelectionLabel,
        buildCurrentCurriculumSnapshot,
        buildMidgameBoostState,
        clock: () => Date.now(),
        emitTelemetry,
        formatGradeBandLabel,
        getActiveStudentLabel,
        getErrorNextStepCopy: () => ERROR_NEXT_STEP_COPY,
        getErrorPatternLabels: () => ERROR_PATTERN_LABELS,
        getFocusLabel,
        getFocusValue: () => (_el('setting-focus')?.value || prefs.focus || 'all'),
        getMidgameBoostKey: () => midgameBoostRuntime?.MIDGAME_BOOST_KEY || 'wq_v2_midgame_boost_state_v1',
        getMidgameBoostPool: () => midgameBoostRuntime?.MIDGAME_BOOST_POOL || Object.freeze([]),
        getPlayableWords: (options) => WQData.getPlayableWords(options),
        getRoundLocals: () => ({
          activeRoundStartedAt,
          currentRoundHintRequested,
          currentRoundStarterWordsShown,
          currentRoundVoiceAttempts,
          currentRoundErrorCounts,
          currentRoundSkillKey,
          currentRoundSkillLabel
        }),
        normalizeReviewWord,
        parseFocusPreset,
        reviewQueueKey: REVIEW_QUEUE_KEY,
        reviewQueueMaxItems: REVIEW_QUEUE_MAX_ITEMS,
        shouldExpandGradeBandForFocus,
        setRoundLocals: (nextState) => {
          activeRoundStartedAt = Number(nextState?.activeRoundStartedAt) || 0;
          currentRoundHintRequested = !!nextState?.currentRoundHintRequested;
          currentRoundStarterWordsShown = !!nextState?.currentRoundStarterWordsShown;
          currentRoundVoiceAttempts = Math.max(0, Number(nextState?.currentRoundVoiceAttempts) || 0);
          currentRoundErrorCounts = gameplayStats?.normalizeCounterMap?.(nextState?.currentRoundErrorCounts) || Object.create(null);
          currentRoundSkillKey = String(nextState?.currentRoundSkillKey || 'classic:all');
          currentRoundSkillLabel = String(nextState?.currentRoundSkillLabel || 'Classic mixed practice');
        },
        storage: localStorage,
        streakKey: SAFE_STREAK_KEY
      })
    : null;
  const gameplaySupport = gameplayStats;
  midgameBoostRuntime = typeof midgameBoostFactory === 'function'
    ? midgameBoostFactory({
        WQUI,
        areBoostPopupsEnabled,
        documentRef: document,
        el: _el,
        escapeHtml,
        gameplayStats,
        getMidgameBoostEnabled: () => MIDGAME_BOOST_ENABLED,
        getPref: (key) => prefs?.[key],
        getWqEngagementBoosts: () => window.WQ_ENGAGEMENT_BOOSTS,
        isAssessmentRoundLocked,
        requestAnimationFrameRef: (fn) => requestAnimationFrame(fn),
        setMidgameBoostShown: (value) => { midgameBoostShown = !!value; },
        setPref,
        showToast: (message) => WQUI.showToast(message)
      })
    : null;
  const deepDiveBuilders = typeof deepDiveBuildersFactory === 'function'
    ? deepDiveBuildersFactory({
        DEFAULT_PREFS,
        buildLiveHintExample,
        challengeLevels: CHALLENGE_LEVELS,
        challengeWordRoleMeta: CHALLENGE_WORD_ROLE_META,
        deepDiveVariants: DEEP_DIVE_VARIANTS,
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        detectHintCategoryFromWord,
        el: _el,
        formatGradeBandLabel,
        getActiveMaxGuesses: () => revealFlowSupport?.getActiveMaxGuesses?.() || 6,
        getEffectiveGameplayGradeBand,
        getFocusLabel,
        getFocusValue: () => _el('setting-focus')?.value || prefs.focus || 'all',
        getSelectedGrade: () => _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade,
        normalizeHintCategoryFromFocusTag,
        normalizeReviewWord,
        parseFocusPreset,
        pickRandom: (...args) => deepDiveBuilders?.pickRandom?.(...args) || '',
        prefs,
        safeDefaultGradeBand: SAFE_DEFAULT_GRADE_BAND,
        shuffleList: (...args) => deepDiveBuilders?.shuffleList?.(...args) || [],
        thinkingLevelMeta: THINKING_LEVEL_META,
        WQData
      })
    : null;
  const deepDiveState = typeof deepDiveStateFactory === 'function'
    ? deepDiveStateFactory({
        challengeDraftKey: CHALLENGE_DRAFT_KEY,
        challengeOnboardingKey: CHALLENGE_ONBOARDING_KEY,
        challengeOnboardingMaxViews: CHALLENGE_ONBOARDING_MAX_VIEWS,
        challengeProgressKey: CHALLENGE_PROGRESS_KEY,
        challengeRanks: CHALLENGE_RANKS,
        challengeScaffoldProfile: CHALLENGE_SCAFFOLD_PROFILE,
        challengeStrongScoreMin: CHALLENGE_STRONG_SCORE_MIN,
        el: _el,
        getChallengeOnboardingState: () => challengeOnboardingState,
        localStorageRef: localStorage,
        setChallengeOnboardingState: (nextState) => {
          challengeOnboardingState = nextState;
        }
      })
    : null;
  const deepDiveUi = typeof deepDiveUiFactory === 'function'
    ? deepDiveUiFactory({
        challengePacingNudgeMs: CHALLENGE_PACING_NUDGE_MS,
        challengeScaffoldProfile: CHALLENGE_SCAFFOLD_PROFILE,
        challengeTaskFlow: CHALLENGE_TASK_FLOW,
        challengeTaskLabels: CHALLENGE_TASK_LABELS,
        clearIntervalRef: clearInterval,
        clearTimeoutRef: clearTimeout,
        el: _el,
        getChallengePacingTimer: () => challengePacingTimer,
        getChallengeScaffold: (state) => deepDiveState?.getChallengeScaffoldProfile?.(state) || CHALLENGE_SCAFFOLD_PROFILE.g35,
        getRevealChallengeState: () => revealChallengeState,
        getChallengeSprintTimer: () => challengeSprintTimer,
        renderRevealChallengeModal,
        resolveMissionScoreBand: (score) => deepDiveState?.resolveMissionScoreBand?.(score) || 'Launch',
        setChallengePacingTimer: (timerId) => { challengePacingTimer = timerId; },
        setChallengeSprintTimer: (timerId) => { challengeSprintTimer = timerId; },
        setTaskComplete: (task, complete) => deepDiveCoreRuntime?.setChallengeTaskComplete?.(task, complete)
      })
    : null;
  const deepDiveSession = typeof deepDiveSessionFactory === 'function'
    ? deepDiveSessionFactory({
        challengeCompleteLines: CHALLENGE_COMPLETE_LINES,
        challengeRanks: CHALLENGE_RANKS,
        challengeReflectionKey: CHALLENGE_REFLECTION_KEY,
        challengeTaskFlow: CHALLENGE_TASK_FLOW,
        closeRevealChallengeModal,
        deepDiveBuilders,
        deepDiveState,
        deepDiveUi,
        el: _el,
        emitTelemetry,
        getActiveStudentLabel,
        getChallengeGradeLabel: (...args) => deepDiveBuilders?.getChallengeGradeLabel?.(...args) || formatGradeBandLabel(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade),
        getChallengeTopicLabel: (...args) => deepDiveBuilders?.getChallengeTopicLabel?.(...args) || 'Word meaning + sentence clues',
        getRevealChallengeState: () => revealChallengeState,
        isConsecutiveDay,
        isMissionLabEnabled,
        isMissionLabStandaloneMode,
        localDayKey,
        localStorageRef: localStorage,
        normalizeReviewWord,
        pickRandom: (...args) => deepDiveBuilders?.pickRandom?.(...args) || '',
        renderSessionSummary,
        setChallengeFeedback: (...args) => deepDiveUi?.setChallengeFeedback?.(...args),
        setRevealChallengeState: (nextState) => {
          revealChallengeState = nextState;
          deepDiveUi?.clearChallengeSprintTimer?.();
        },
        setWrapText: (node, text) => {
          if (node) node.textContent = text;
        },
        syncUi: () => {
          deepDiveUi?.updateChallengeProgressUI?.();
        },
        buildThinkingChallenge: (...args) => deepDiveBuilders?.buildThinkingChallenge?.(...args) || null
      })
    : null;
  let wordReview = null;
  let roundStartRuntime = null;
  let roundSubmitRuntime = null;
  const phonicsClueModule = typeof phonicsClueModuleFactory === 'function'
    ? phonicsClueModuleFactory({ _el, WQUI })
    : null;
  const phonicsClueState = phonicsClueModule?.phonicsClueState || {
    started: false,
    current: null
  };
  const openPhonicsClueModal = (...args) => phonicsClueModule?.openModal?.(...args);
  const closePhonicsClueModal = (...args) => phonicsClueModule?.closeModal?.(...args);
  const startPhonicsClueDeck = (...args) => phonicsClueModule?.startDeck?.(...args);
  const advancePhonicsClueCard = (...args) => phonicsClueModule?.advanceCard?.(...args);
  const skipPhonicsClueCard = (...args) => phonicsClueModule?.skipCard?.(...args);
  const awardPhonicsClueGuessPoint = (...args) => phonicsClueModule?.awardGuessPoint?.(...args);
  const awardPhonicsClueBonusPoint = (...args) => phonicsClueModule?.awardBonusPoint?.(...args);
  const togglePhonicsClueTargetVisibility = (...args) => phonicsClueModule?.toggleTargetVisibility?.(...args);
  const renderPhonicsCluePanel = (...args) => phonicsClueModule?.renderPanel?.(...args);
  const updatePhonicsClueControlsFromUI = (...args) => phonicsClueModule?.updateControlsFromUI?.(...args);
  const startPhonicsClueTurnTimer = (...args) => phonicsClueModule?.startTurnTimer?.(...args);
  const loadStreak = () => gameplayStats?.loadStreak?.() ?? 0;
  const saveStreak = (value) => gameplayStats?.saveStreak?.(value);
  const incrementStreak = () => gameplayStats?.incrementStreak?.() ?? 0;
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
  const TELEMETRY_ENABLED_KEY = RUNTIME_CONSTANTS.TELEMETRY_ENABLED_KEY || 'wq_v2_telemetry_enabled_v1';
  const TELEMETRY_DEVICE_ID_KEY = RUNTIME_CONSTANTS.TELEMETRY_DEVICE_ID_KEY || 'wq_v2_device_id_local_v1';
  const TELEMETRY_ENDPOINT_KEY = RUNTIME_CONSTANTS.TELEMETRY_ENDPOINT_KEY || 'wq_v2_telemetry_endpoint_v1';
  const TELEMETRY_LAST_UPLOAD_KEY = RUNTIME_CONSTANTS.TELEMETRY_LAST_UPLOAD_KEY || 'wq_v2_telemetry_last_upload_v1';
  const TELEMETRY_QUEUE_LIMIT = RUNTIME_CONSTANTS.TELEMETRY_QUEUE_LIMIT || 500;
  const TELEMETRY_SESSION_ID = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const telemetrySessionStartedAt = Date.now();
  var telemetryLastMusicSignature = '';
  telemetryDiagnostics = typeof telemetryDiagnosticsFactory === 'function'
    ? telemetryDiagnosticsFactory({
        appSemver: APP_SEMVER,
        copyTextToClipboard,
        defaultPrefs: DEFAULT_PREFS,
        demoMode: DEMO_MODE,
        diagnosticsLastResetKey: DIAGNOSTICS_LAST_RESET_KEY,
        documentRef: document,
        el: _el,
        fetchImpl: (...args) => fetch(...args),
        getEffectiveGameplayGradeBand,
        getFocusValue: () => _el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus || 'all',
        getGameState: () => WQGame.getState?.() || {},
        getGradeValue: () => _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade || 'all',
        getLengthValue: () => _el('s-length')?.value || prefs.length || DEFAULT_PREFS.length,
        getLessonPackValue: () => prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack,
        getLessonTargetValue: () => prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget,
        getVoiceValue: () => normalizeVoiceMode(_el('s-voice')?.value || prefs.voice || DEFAULT_PREFS.voice),
        isDevModeEnabled,
        localStorageRef: localStorage,
        locationRef: location,
        navigatorRef: navigator,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        normalizePageMode,
        loadStoredPageMode,
        normalizePlayStyle,
        readPageModeAttr: () => document.documentElement.getAttribute('data-page-mode') || '',
        prefs,
        swRuntimeResolvedVersion: SW_RUNTIME_RESOLVED_VERSION,
        telemetryDeviceIdKey: TELEMETRY_DEVICE_ID_KEY,
        telemetryEnabledKey: TELEMETRY_ENABLED_KEY,
        telemetryEndpointKey: TELEMETRY_ENDPOINT_KEY,
        telemetryLastUploadKey: TELEMETRY_LAST_UPLOAD_KEY,
        telemetryQueueKey: TELEMETRY_QUEUE_KEY,
        telemetryQueueLimit: TELEMETRY_QUEUE_LIMIT,
        telemetrySessionId: TELEMETRY_SESSION_ID,
        windowRef: window
      })
    : null;
  function resolveBuildLabel(...args) {
    return telemetryDiagnostics?.resolveBuildLabel?.(...args) || '';
  }
  function resolveRuntimeChannel(...args) {
    return telemetryDiagnostics?.resolveRuntimeChannel?.(...args) || 'LOCAL';
  }
  function syncBuildBadge(...args) {
    return telemetryDiagnostics?.syncBuildBadge?.(...args);
  }
  function syncPersistentVersionChip(...args) {
    return telemetryDiagnostics?.syncPersistentVersionChip?.(...args);
  }
  function logRuntimeBuildDiagnostics(...args) {
    return telemetryDiagnostics?.logRuntimeBuildDiagnostics?.(...args);
  }
  function applyDevOnlyVisibility(...args) {
    return telemetryDiagnostics?.applyDevOnlyVisibility?.(...args);
  }
  function formatDiagnosticDate(...args) {
    return telemetryDiagnostics?.formatDiagnosticDate?.(...args) || '--';
  }
  function readDiagnosticsLastReset(...args) {
    return telemetryDiagnostics?.readDiagnosticsLastReset?.(...args) || null;
  }
  function collectRuntimeDiagnostics(...args) {
    return telemetryDiagnostics?.collectRuntimeDiagnostics?.(...args);
  }
  function renderDiagnosticsPanel(...args) {
    return telemetryDiagnostics?.renderDiagnosticsPanel?.(...args);
  }
  function copyDiagnosticsSummary(...args) {
    return telemetryDiagnostics?.copyDiagnosticsSummary?.(...args);
  }
  function resolveTelemetryEndpoint(...args) {
    return telemetryDiagnostics?.resolveTelemetryEndpoint?.(...args) || '';
  }
  function getTelemetryUploadMeta(...args) {
    return telemetryDiagnostics?.getTelemetryUploadMeta?.(...args) || null;
  }
  function getTelemetryQueue(...args) {
    return telemetryDiagnostics?.getTelemetryQueue?.(...args) || [];
  }
  window.WQTelemetry = Object.freeze({
    emit: emitTelemetry,
    setEnabled(next) {
      return telemetryDiagnostics?.setTelemetryEnabled?.(next);
    },
    isEnabled() {
      return telemetryDiagnostics?.isTelemetryEnabled?.() ?? true;
    },
    setEndpoint(url) {
      return telemetryDiagnostics?.setTelemetryEndpoint?.(url) || '';
    },
    getEndpoint: resolveTelemetryEndpoint,
    peek(limit = 20) {
      return telemetryDiagnostics?.peekTelemetry?.(limit) || [];
    },
    async uploadNow(reason = 'manual') {
      return telemetryDiagnostics?.uploadTelemetryQueue?.(reason) ?? false;
    },
    flush() {
      return telemetryDiagnostics?.flushTelemetryQueue?.() || [];
    }
  });
  telemetryDiagnostics?.initTelemetryUploader?.();
  function buildStableShareLinkUrl(...args) {
    return maintenanceRuntime?.buildStableShareLinkUrl?.(...args) || window.location.href;
  }
  function copyReviewLink(...args) {
    return maintenanceRuntime?.copyReviewLink?.(...args);
  }
  function runAutoCacheRepairForBuild(...args) {
    return maintenanceRuntime?.runAutoCacheRepairForBuild?.(...args);
  }
  function runRemoteBuildConsistencyCheck(...args) {
    return maintenanceRuntime?.runRemoteBuildConsistencyCheck?.(...args);
  }
  function installBuildConsistencyHeartbeat(...args) {
    return maintenanceRuntime?.installBuildConsistencyHeartbeat?.(...args);
  }
  const HOVER_NOTE_DELAY_MS = RUNTIME_CONSTANTS.HOVER_NOTE_DELAY_MS || 500;
  const HOVER_NOTE_TARGET_SELECTOR = RUNTIME_CONSTANTS.HOVER_NOTE_TARGET_SELECTOR || '.icon-btn';
  function setHoverNoteForElement(...args) {
    return startupRuntime?.setHoverNoteForElement?.(...args);
  }
  function initHoverNoteToasts(...args) {
    return startupRuntime?.initHoverNoteToasts?.(...args);
  }
  sessionAnalytics = typeof sessionAnalyticsFactory === 'function'
    ? sessionAnalyticsFactory({
        applyChipTone: (...args) => sessionProbe?.applyChipTone?.(...args),
        buildMissionSummaryStats: (options = {}) => studentSessionRuntime?.buildMissionSummaryStats?.(options) || { records: [], count: 0, avgScore: 0, avgAttemptsPerStation: 0, completionRate: 0, completedCount: 0, onTimeRate: 0, strongRate: 0, topLevel: '', topLevelLabel: '--' },
        el: _el,
        getActiveStudentLabel,
        getLatestProbePerformance,
        getTelemetryQueue,
        sessionSummary
      })
    : null;
  function formatSignedDelta(...args) {
    return sessionAnalytics?.formatSignedDelta?.(...args) || '--';
  }
  function loadTelemetryRows(...args) {
    return sessionAnalytics?.loadTelemetryRows?.(...args) || [];
  }
  function buildAdoptionHealthMetrics(...args) {
    return sessionAnalytics?.buildAdoptionHealthMetrics?.(...args) || { metrics: [], overallScore: null, overallTone: '' };
  }
  function renderAdoptionHealthPanel(...args) {
    return sessionAnalytics?.renderAdoptionHealthPanel?.(...args);
  }
  function renderTelemetryDashboards(...args) {
    return sessionAnalytics?.renderTelemetryDashboards?.(...args);
  }
  sessionMastery = typeof sessionMasteryFactory === 'function'
    ? sessionMasteryFactory({
        applyChipTone: (...args) => sessionProbe?.applyChipTone?.(...args),
        el: _el,
        formatSignedDelta,
        formatDurationLabel: (value) => gameplaySupport?.formatDurationLabel?.(value) || '0s',
        getActiveStudentLabel,
        getComparableProbeTrend: (...args) => sessionProbe?.getComparableProbeTrend?.(...args) || { current: null, previous: null, activeMatches: false },
        getGoalForStudent: (name) => studentSessionRuntime?.getGoalForStudent?.(name) || null,
        getLatestProbePerformance: (studentLabel) => {
          const trend = sessionProbe?.getComparableProbeTrend?.(studentLabel) || { current: null, previous: null, activeMatches: false };
          return trend.current || null;
        },
        getTopErrorKey: (map) => gameplaySupport?.getTopErrorKey?.(map) || '',
        getTopErrorLabel: (map) => gameplaySupport?.getTopErrorLabel?.(map) || '--',
        normalizeCounterMap: (raw) => gameplaySupport?.normalizeCounterMap?.(raw) || Object.create(null),
        normalizeMasteryFilter,
        normalizeMasterySort,
        sessionSummary
      })
    : null;
  function getLatestProbePerformance(...args) {
    return sessionMastery?.getLatestProbePerformance?.(...args) || null;
  }
  function evaluateStudentGoalState(...args) {
    return sessionMastery?.evaluateStudentGoalState?.(...args) || { statusLabel: 'Not set', progressLabel: 'Set accuracy + guesses target.', tone: '', goal: null, current: null };
  }
  function renderStudentGoalPanel(...args) {
    return sessionMastery?.renderStudentGoalPanel?.(...args);
  }
  function getMasteryRowsForDisplay(...args) {
    return sessionMastery?.getMasteryRowsForDisplay?.(...args) || [];
  }
  function describeMasterySortMode(...args) {
    return sessionMastery?.describeMasterySortMode?.(...args) || 'attempts (high to low)';
  }
  function describeMasteryFilterMode(...args) {
    return sessionMastery?.describeMasteryFilterMode?.(...args) || 'all skills';
  }
  function getMasterySortMode(...args) {
    return sessionMastery?.getMasterySortMode?.(...args) || 'attempts_desc';
  }
  function getMasteryFilterMode(...args) {
    return sessionMastery?.getMasteryFilterMode?.(...args) || 'all';
  }
  function compareMasteryRows(...args) {
    return sessionMastery?.compareMasteryRows?.(...args) || 0;
  }
  function rowMatchesMasteryFilter(...args) {
    return sessionMastery?.rowMatchesMasteryFilter?.(...args) ?? true;
  }
  function getVisibleMasteryRows(...args) {
    return sessionMastery?.getVisibleMasteryRows?.(...args) || { rows: [], allRows: [], sortMode: 'attempts_desc', filterMode: 'all' };
  }
  function getTopMasteryEntry(...args) {
    return sessionMastery?.getTopMasteryEntry?.(...args) || null;
  }
  function renderMasteryTable(...args) {
    return sessionMastery?.renderMasteryTable?.(...args);
  }
  sessionProbe = typeof sessionProbeFactory === 'function'
    ? sessionProbeFactory({
        buildProbeSummary: (...args) => sessionSummaryRuntime?.buildProbeSummary?.(...args) || { roundsDone: 0, wins: 0, accuracy: '--', avgGuesses: '--', avgTime: '--', hintRate: '--' },
        createEmptyProbeState,
        defaultPrefs: DEFAULT_PREFS,
        el: _el,
        formatGradeBandLabel,
        formatSignedDelta,
        getActiveStudentLabel,
        getFocusLabel,
        getGoalEval: evaluateStudentGoalState,
        normalizeProbeRounds,
        onRenderStudentGoalPanel: () => renderStudentGoalPanel(),
        prefs,
        probeHistoryRef: {
          get: () => probeHistory,
          set: (value) => {
            probeHistory = value;
          }
        },
        probeStateRef: {
          get: () => probeState,
          set: (value) => {
            probeState = value;
          }
        },
        saveProbeHistory,
        setPref,
        showToast: (message) => WQUI.showToast(message)
      })
    : null;
  function getProbeRecencyMeta(...args) {
    return sessionProbe?.getProbeRecencyMeta?.(...args) || { label: 'Probe Recency: No baseline', detail: 'No probe has been recorded for this student yet.', tone: 'warn' };
  }
  function getSupportFlagMeta(...args) {
    return sessionProbe?.getSupportFlagMeta?.(...args) || { label: 'Support Flag: Collect baseline', detail: 'Run at least one probe to determine risk band.', tone: '' };
  }
  function renderProbeSupportChips(...args) {
    return sessionProbe?.renderProbeSupportChips?.(...args);
  }
  function renderProbePanel(...args) {
    return sessionProbe?.renderProbePanel?.(...args);
  }
  function startWeeklyProbe(...args) {
    return sessionProbe?.startWeeklyProbe?.(...args);
  }
  function finishWeeklyProbe(...args) {
    return sessionProbe?.finishWeeklyProbe?.(...args);
  }
  function recordProbeRound(...args) {
    return sessionProbe?.recordProbeRound?.(...args);
  }
  function buildProbeSummaryText(...args) {
    return sessionProbe?.buildProbeSummaryText?.(...args) || 'No weekly probe results yet.';
  }
  sessionExports = typeof sessionExportsFactory === 'function'
    ? sessionExportsFactory({
        buildMissionSummaryStats,
        buildProbeSummary: (...args) => sessionSummaryRuntime?.buildProbeSummary?.(...args) || { roundsDone: 0, wins: 0, accuracy: '--', avgGuesses: '--', avgTime: '--', hintRate: '--' },
        buildProbeSummaryText,
        copyTextToClipboard: (...args) => sessionSummaryRuntime?.copyTextToClipboard?.(...args),
        defaultPrefs: DEFAULT_PREFS,
        deepDiveBuilders,
        documentRef: document,
        downloadTextFile,
        formatGradeBandLabel,
        formatLengthPrefLabel,
        formatSignedDelta,
        formatDurationLabel: (value) => gameplaySupport?.formatDurationLabel?.(value) || '0s',
        getActiveStudentLabel,
        getAssignedPlaylistForStudent: (studentLabel) => playlistRuntime?.getAssignedPlaylistForStudent?.(studentLabel) || null,
        getComparableProbeTrend: (...args) => sessionProbe?.getComparableProbeTrend?.(...args) || { current: null, previous: null, activeMatches: false },
        getCurriculumSnapshot: () => ({
          packId: normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack),
          targetId: normalizeLessonTargetId(
            normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack),
            prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
          ),
          focus: _el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus,
          selectedGrade: _el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade,
          effectiveGrade: getEffectiveGameplayGradeBand(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade, _el('setting-focus')?.value || prefs.focus || DEFAULT_PREFS.focus),
          length: _el('s-length')?.value || prefs.length || DEFAULT_PREFS.length
        }),
        getCurriculumSelectionLabel: () => buildCurriculumSelectionLabel(),
        getFocusLabel,
        getGoalEval: evaluateStudentGoalState,
        getLatestProbeSourceForStudent: (...args) => sessionProbe?.getLatestProbeSourceForStudent?.(...args) || null,
        deriveMiniLessonKey: () => gameplaySupport?.resolveMiniLessonErrorKey?.(
          activeMiniLessonKey,
          sessionSummary.errorTotals,
          ERROR_MINI_LESSON_PLANS
        ) || 'context_strategy',
        getMissionLabRecords: (options = {}) => studentSessionRuntime?.getMissionLabRecords?.(options) || [],
        getProbeHistory: () => probeHistory,
        getProbeRecencyMeta,
        getProbeState: () => probeState,
        getSupportFlagMeta,
        getTopMasteryEntry,
        getVisibleMasteryRows,
        getWQData: () => WQData,
        sessionSummary,
        shouldExpandGradeBandForFocus,
        showToast: (message) => WQUI.showToast(message),
        supportMeta: {
          buildMiniLessonPlanText: (...args) => gameplaySupport?.buildMiniLessonPlanText?.(...args) || '',
          errorMiniLessonPlans: () => ERROR_MINI_LESSON_PLANS,
          errorPatternLabels: () => ERROR_PATTERN_LABELS,
          getActiveMiniLessonKey: () => activeMiniLessonKey,
          getInstructionalNextStep: (...args) => gameplaySupport?.getInstructionalNextStep?.(...args) || 'Continue current lesson target.',
          getTopErrorLabel: (...args) => gameplaySupport?.getTopErrorLabel?.(...args) || '--',
          resolveMiniLessonErrorKey: (...args) => gameplaySupport?.resolveMiniLessonErrorKey?.(...args) || 'context_strategy'
        },
        WQData
      })
    : null;
  questRuntime = typeof questRuntimeFactory === 'function'
    ? questRuntimeFactory({
        defaultPrefs: DEFAULT_PREFS,
        demoMode: DEMO_MODE,
        documentRef: document,
        el: _el,
        getActiveEvidenceSessionId: () => _activeEvidenceSessionId,
        getActiveMaxGuesses: () => revealFlowSupport?.getActiveMaxGuesses?.() || 6,
        getLocationSearch: () => String(location.search || ''),
        getState: () => WQGame.getState?.() || {},
        localStorageRef: localStorage,
        locationRef: location,
        navigatorRef: navigator,
        normalizeProbeRounds,
        onSavedSessionId: (value) => {
          _latestSavedSessionId = String(value || '');
        },
        recordProbeRound,
        recordSessionRound: (result, roundMetrics = {}) => studentSessionRuntime?.recordSessionRound?.(result, roundMetrics),
        refreshStandaloneMissionLabHub,
        renderMiniLessonPanel,
        renderPlaylistControls,
        renderProbePanel,
        renderRosterControls: () => studentSessionRuntime?.renderRosterControls?.(),
        renderSessionSummary: () => studentSessionRuntime?.renderSessionSummary?.(),
        maybeApplyStudentPlanForActiveStudent: (options = {}) => studentSessionRuntime?.maybeApplyStudentPlanForActiveStudent?.(options) || false,
        setPref,
        prefs,
        showToast: (message) => WQUI.showToast(message),
        windowRef: window
      })
    : null;
  teacherState = typeof teacherStateFactory === 'function'
    ? teacherStateFactory({
        defaultPrefs: DEFAULT_PREFS,
        gameplaySupport,
        loadLocalStorage: (key) => localStorage.getItem(key),
        loadSessionStorage: (key) => sessionStorage.getItem(key),
        normalizeLessonPackId,
        normalizeLessonTargetId,
        prefs,
        probeHistoryKeys: [PROBE_HISTORY_KEY, ...PROBE_HISTORY_LEGACY_KEYS]
      })
    : null;
  shellRuntime = typeof shellRuntimeFactory === 'function'
    ? shellRuntimeFactory({
        assertHomeNoScroll,
        closeQuickPopover: (...args) => settingsRuntime?.closeQuickPopover?.(...args),
        closeFocusSearchList,
        csSetHeaderTitleCenter,
        deepDiveModal,
        demoMode: DEMO_MODE,
        documentRef: document,
        el: _el,
        emitTelemetry,
        getState: () => WQGame.getState?.() || {},
        getThemeFallback,
        historyRef: history,
        hideInformantHintCard,
        hideStarterWordCard,
        isMissionLabEnabled,
        isMissionLabStandaloneMode,
        isTeacherRoleEnabled,
        localStorageRef: localStorage,
        locationRef: location,
        normalizePageMode,
        normalizeTheme,
        openWordQuestIfNeeded: () => {
          if (!WQGame.getState?.()?.word) newGame({ launchMissionLab: false });
        },
        prefs,
        defaultPrefs: DEFAULT_PREFS,
        refreshStandaloneMissionLabHub,
        setActivityLabel,
        setFocusSearchOpen,
        setFocusSearchReopenGuardUntil: (value) => { focusSearchReopenGuardUntil = value; },
        setHoverNoteForElement,
        setWordQuestCoachState: (key) => coachRuntime?.setWordQuestCoachState?.(key),
        showToast: (message) => WQUI.showToast(message),
        startAvaWordQuestIdleWatcher: (...args) => coachRuntime?.startAvaWordQuestIdleWatcher?.(...args),
        startupApp: () => {
          mediaRuntime?.installMediaSessionControls?.();
          musicRuntime?.initMusicRuntime?.(prefs);
          enforceClassicFiveLetterDefault();
          newGame({ launchMissionLab: false });
        },
        stopAvaWordQuestIdleWatcher: (...args) => coachRuntime?.stopAvaWordQuestIdleWatcher?.(...args),
        syncGameplayAudioStrip,
        syncHeaderControlsVisibility: () => panelRuntime?.syncHeaderControlsVisibility?.(),
        syncStarterWordLauncher: syncStarterWordLauncherUI,
        updatePageModeStorage: (value) => {
          pageMode = value;
          persistPageMode(value);
        },
        updateFocusSummaryLabel,
        updateHomeCoachRibbon,
        withAppBase,
        writingStudioReturnKey: WRITING_STUDIO_RETURN_KEY,
        writingStudioEnabled: WRITING_STUDIO_ENABLED,
        windowRef: window
      })
    : null;
  settingsRuntime = typeof settingsRuntimeFactory === 'function'
    ? settingsRuntimeFactory({
        DEFAULT_PREFS,
        WQAudio,
        closeFocusSearchList,
        cancelRevealNarration: (...args) => deepDiveCoreRuntime?.cancelRevealNarration?.(...args),
        detectTeacherPreset,
        documentRef: document,
        el: _el,
        firstRunSetupKey: FIRST_RUN_SETUP_KEY,
        getHintMode,
        getRevealFocusMode,
        getVoicePracticeMode,
        handleLessonPackSelectionChange: (...args) => preferencesRuntime?.handleLessonPackSelectionChange?.(...args),
        hideMidgameBoost,
        isAssessmentLockEnabled,
        isAssessmentRoundLocked,
        isConfidenceCoachingEnabled,
        isMissionLabStandaloneMode,
        normalizeLessonPackId,
        normalizePlayStyle,
        normalizeVoiceMode,
        onFirstRunContinue: () => {
          firstRunSetupPending = false;
          const state = WQGame.getState?.() || {};
          if (!state.word || state.gameOver) {
            newGame({ launchMissionLab: !isMissionLabStandaloneMode() });
          }
          updateNextActionLine();
        },
        prefs,
        setConfidenceCoachingMode,
        setFocusValue,
        setHintMode,
        setPref,
        setRevealFocusMode: applyRevealFocusMode,
        setVoicePracticeMode,
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        syncAssessmentLockRuntime,
        syncHeaderControlsVisibility: () => syncHeaderControlsVisibility(),
        syncRevealFocusModalSections,
        updateVoicePracticePanel: () => updateVoicePracticePanel(WQGame.getState()),
        windowRef: window
      })
    : null;
  panelRuntime = typeof panelRuntimeFactory === 'function'
    ? panelRuntimeFactory({
        applyTeacherPreset,
        bindSettingsAccordion,
        closeFocusSearchList,
        closeQuickPopover: (...args) => settingsRuntime?.closeQuickPopover?.(...args),
        documentRef: document,
        el: _el,
        emitTelemetry,
        getLatestSavedSessionId: () => _latestSavedSessionId,
        hideInformantHintCard,
        hideMidgameBoost,
        initStudentCodeControls,
        isAssessmentRoundLocked,
        isMissionLabStandaloneMode,
        jumpToSettingsGroup,
        logOverflow,
        maybeDismissDupeToast: (target) => revealFlowSupport?.maybeDismissDupeToast?.(target),
        openNumeracyLabPage,
        openReadingLabPage,
        openSentenceSurgeryPage,
        openTeacherDashboardPage,
        openWritingStudioPage,
        positionHintClueCard,
        positionStarterWordCard,
        positionSupportChoiceCard,
        renderDiagnosticsPanel,
        routeTo,
        setPageMode,
        setSettingsView,
        shareWordQuestBundle: (...args) => questRuntime?.shareWordQuestBundle?.(...args),
        shareWordQuestSessionById: (...args) => questRuntime?.shareWordQuestSessionById?.(...args),
        shouldKeepMidgameBoostOpen,
        showAssessmentLockNotice,
        syncPlayHeaderCopy,
        syncPlayToolsRoleVisibility,
        syncQuickPopoverPositions,
        syncThemePreviewStripVisibility: (...args) => settingsRuntime?.syncThemePreviewStripVisibility?.(...args),
        syncWritingStudioAvailability,
        togglePlayToolsDrawer,
        updateFocusHint,
        updateFocusSummaryLabel,
        updateGradeTargetInline,
        updateNextActionLine,
        windowRef: window,
        writingStudioEnabled: WRITING_STUDIO_ENABLED
      })
    : null;
  preferencesRuntime = typeof preferencesRuntimeFactory === 'function'
    ? preferencesRuntimeFactory({
        DEFAULT_PREFS,
        WQGame,
        WQUI,
        applyAllGradeLengthDefault,
        applyAtmosphere,
        applyBoardStyle,
        applyChunkTabsMode,
        applyKeyStyle,
        applyKeyboardLayout,
        applyLessonTargetConfig,
        applyMotion,
        applyProjector,
        applyTextSize,
        applyTheme,
        applyUiSkin,
        applyWilsonMode,
        documentRef: document,
        el: _el,
        formatGradeBandLabel,
        getCurrentWeekRecommendedLessonTarget,
        getKeyboardLayoutLabel,
        getLessonPackSelectElements,
        getLessonTargetSelectElements,
        getNextKeyboardLayout,
        getThemeDisplayLabel: (themeId) => {
          const normalized = normalizeTheme(themeId, getThemeFallback());
          const themeRegistry = window.WQThemeRegistry || null;
          if (themeRegistry && typeof themeRegistry.getLabel === 'function') return themeRegistry.getLabel(normalized);
          return normalized;
        },
        getThemeFallback,
        isAssessmentRoundLocked,
        isFocusValueCompatibleWithGrade,
        newGame,
        normalizeKeyboardLayout,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        normalizeTheme,
        populateLessonTargetSelect,
        prefs,
        refreshStandaloneMissionLabHub,
        releaseLessonPackToManualMode,
        renderFocusSearchList,
        resolveDefaultLessonTargetId,
        savePrefs,
        setConfidenceCoachingMode,
        setLessonPackPrefs,
        setPref,
        shouldPersistTheme,
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        syncCaseToggleUI,
        syncChunkTabsVisibility,
        syncHeaderControlsVisibility: () => syncHeaderControlsVisibility(),
        syncKeyboardInputLocks,
        syncLessonPackControlsFromPrefs,
        syncPlayStyleToggleUI,
        syncQuickSetupControls,
        updateFocusGradeNote,
        updateGradeTargetInline,
        updateLessonPackNote,
        updateWilsonModeToggle
      })
    : null;
  sessionControls = typeof sessionControlsFactory === 'function'
    ? sessionControlsFactory({
        WQTeacherAssignmentsFeature: window.WQTeacherAssignmentsFeature,
        buildCurrentCurriculumSnapshot,
        clearGoalForStudent: (name) => studentSessionRuntime?.clearGoalForStudent?.(name) || false,
        clearRosterStudents: () => studentSessionRuntime?.clearRosterStudents?.(),
        contract: TEACHER_ASSIGNMENTS_CONTRACT,
        copyDiagnosticsSummary,
        copyFamilyHandout,
        copyMasterySummary,
        copyMasterySummaryCsv,
        copyMiniLessonPlan,
        copyMissionSummary,
        copyMissionSummaryCsv,
        copyMtssIepNote,
        copyProbeSummary,
        copyProbeSummaryCsv,
        copyReviewLink,
        copySessionOutcomesSummary,
        copySessionSummary,
        deleteSelectedPlaylist: () => playlistRuntime?.deleteSelectedPlaylist?.() || false,
        documentRef: document,
        downloadClassRollupCsv,
        downloadCsvBundle,
        downloadFamilyHandout,
        el: _el,
        emitTelemetry,
        finishWeeklyProbe,
        getActiveStudentLabel,
        maybeApplyStudentPlanForActiveStudent: (options = {}) => studentSessionRuntime?.maybeApplyStudentPlanForActiveStudent?.(options) || false,
        normalizeGoalAccuracy,
        normalizeGoalGuesses,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        onSetActiveMiniLessonKey: (value) => { activeMiniLessonKey = value; },
        populateTargetSelectForPack: (...args) => teacherAssignmentsFeature?.populateTargetSelectForPack?.(...args) || 'custom',
        removeActiveRosterStudent: () => studentSessionRuntime?.removeActiveRosterStudent?.() || false,
        renderDiagnosticsPanel,
        renderGroupBuilderPanel: () => studentSessionRuntime?.renderGroupBuilderPanel?.(),
        renderMiniLessonPanel,
        renderPlaylistControls,
        renderProbePanel,
        renderRosterControls: () => studentSessionRuntime?.renderRosterControls?.(),
        renderSessionSummary: () => studentSessionRuntime?.renderSessionSummary?.(),
        renderStudentGoalPanel,
        renderStudentLockPanel: () => studentSessionRuntime?.renderStudentLockPanel?.(),
        rerunOnboardingSetup,
        resetSessionSummary: () => studentSessionRuntime?.resetSessionSummary?.(),
        saveCurrentTargetToPlaylist: () => playlistRuntime?.saveCurrentTargetToPlaylist?.() || false,
        saveGroupPlanState: () => teacherAssignmentsFeature?.saveGroupPlanState?.(),
        saveRosterState,
        setGoalForStudent: (name, goal) => studentSessionRuntime?.setGoalForStudent?.(name, goal) || false,
        setRosterActive: (value) => {
          rosterState.active = rosterState.students.includes(value) ? value : '';
        },
        setSelectedGroupPlanId: (id) => teacherAssignmentsFeature?.setSelectedGroupPlanId?.(id),
        setSelectedPlaylistId: (playlistId) => playlistRuntime?.setSelectedPlaylistId?.(playlistId),
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        startWeeklyProbe,
        teacherAssignmentsFeature,
        isAssessmentRoundLocked,
        addRosterStudent: (rawName) => studentSessionRuntime?.addRosterStudent?.(rawName) || false,
        assignSelectedPlaylistToActiveStudent: () => playlistRuntime?.assignSelectedPlaylistToActiveStudent?.() || false,
        applyAssignedPlaylistForActiveStudent: () => playlistRuntime?.applyAssignedPlaylistForActiveStudent?.() || false
      })
    : null;
  musicRuntime = typeof musicRuntimeFactory === 'function'
    ? musicRuntimeFactory({
        DEFAULT_PREFS,
        applyTheme,
        clearLocalMusicFiles,
        closeQuickPopover: (...args) => settingsRuntime?.closeQuickPopover?.(...args),
        createMusicModule,
        documentRef: document,
        el: _el,
        getMusicController: () => musicController,
        getThemeFallback,
        isQuickPopoverAllowed,
        normalizeCuratedMusicMode,
        normalizeTheme,
        normalizeVoiceMode,
        onInitQuestLoop: (...args) => questRuntime?.initQuestLoop?.(...args),
        onMusicControllerReady: (controller) => {
          musicController = controller;
        },
        onPrimeAudioManifest: () => {
          if (typeof WQAudio.primeAudioManifest === 'function') {
            void WQAudio.primeAudioManifest();
          }
        },
        setLocalMusicFiles,
        setPref,
        syncDemoModeUi: () => {
          demoUi?.createDemoBanner?.();
          demoUi?.createHomeDemoLaunchButton?.();
          demoUi?.setDemoControlsDisabled?.();
          if (DEMO_MODE) {
            demoFlow?.closeAllOverlaysForDemo?.();
            renderDemoDebugReadout();
          }
        },
        shuffleMusicVibe,
        shouldPersistTheme,
        stepMusicVibe,
        syncMusicForTheme,
        syncQuickMusicVolume,
        toggleMusicQuick,
        toggleQuickPopover: (...args) => settingsRuntime?.toggleQuickPopover?.(...args),
        WQAudio,
        windowRef: window
      })
    : null;
  mediaRuntime = typeof mediaRuntimeFactory === 'function'
    ? mediaRuntimeFactory({
        allowedMasteryFilterModes: ALLOWED_MASTERY_FILTER_MODES,
        allowedMasterySortModes: ALLOWED_MASTERY_SORT_MODES,
        allowedMusicModes: ALLOWED_MUSIC_MODES,
        allowedVoiceModes: ALLOWED_VOICE_MODES,
        autoMusicByFamily: () => window.WQAppRuntimeConfig?.AUTO_MUSIC_BY_FAMILY || Object.freeze({}),
        autoMusicByTheme: () => window.WQAppRuntimeConfig?.AUTO_MUSIC_BY_THEME || Object.freeze({}),
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        emitTelemetry,
        getMusicController: () => musicController,
        getPrefs: () => prefs,
        getTelemetryLastMusicSignature: () => telemetryLastMusicSignature,
        getThemeFallback,
        getThemeFamily,
        lastNonOffMusicKey: LAST_NON_OFF_MUSIC_KEY,
        localStorageRef: localStorage,
        musicLabels: MUSIC_LABELS,
        normalizeTheme,
        quickMusicVibeOrder: QUICK_MUSIC_VIBE_ORDER,
        setHoverNoteForElement,
        setPref,
        setTelemetryLastMusicSignature: (value) => {
          telemetryLastMusicSignature = value;
        },
        showToast: (message) => WQUI.showToast(message),
        teamLabelSets: () => window.WQAppRuntimeConfig?.TEAM_LABEL_SETS || Object.freeze({}),
        windowRef: window
      })
    : null;
  voiceSupport = typeof voiceSupportFactory === 'function'
    ? voiceSupportFactory({
        WQAudio,
        WQUI,
        bumpVoiceCountdownToken: () => { voiceCountdownToken += 1; },
        cancelRevealNarration,
        cancelAnimationFrameRef: cancelAnimationFrame,
        clearIntervalRef: clearInterval,
        clearTimeoutRef: clearTimeout,
        clearRevealAutoAdvanceTimer: () => clearRevealAutoAdvanceTimer(),
        deepDiveModal,
        deepDiveSession,
        documentRef: document,
        el: _el,
        getGameWord: () => WQGame.getState()?.word || '',
        getVoiceAnalyser: () => voiceAnalyser,
        getVoiceAudioCtx: () => voiceAudioCtx,
        getVoiceAutoStopTimer: () => voiceAutoStopTimer,
        getVoiceClipUrl: () => voiceClipUrl,
        getVoiceCountdownTimer: () => voiceCountdownTimer,
        getVoiceHistory: () => voiceHistory,
        getVoiceIsRecording: () => voiceIsRecording,
        getVoiceKaraokeRunToken: () => voiceKaraokeRunToken,
        getVoiceKaraokeTimer: () => voiceKaraokeTimer,
        getVoicePracticeMode: () => getVoicePracticeMode(),
        getVoiceRecorder: () => voiceRecorder,
        getVoiceStream: () => voiceStream,
        getVoiceTakeComplete: () => voiceTakeComplete,
        getVoiceWaveRaf: () => voiceWaveRaf,
        getWQGameState: () => WQGame.getState?.(),
        getRevealFocusMode: () => getRevealFocusMode(),
        getStudentRecordingEnabled: () => STUDENT_RECORDING_ENABLED,
        hideInformantHintCard,
        localStorageRef: localStorage,
        playVoiceRecording: () => playVoiceRecording(),
        requestAnimationFrameRef: requestAnimationFrame,
        resetVoiceTakeComplete: () => { voiceTakeComplete = false; },
        runRevealNarration: (state) => deepDiveCoreRuntime?.runRevealNarration?.(state),
        saveVoiceRecording: () => saveVoiceRecording(),
        scheduleRevealAutoAdvance: () => scheduleRevealAutoAdvance(),
        setTimeoutRef: setTimeout,
        setVoiceAnalyser: (value) => { voiceAnalyser = value; },
        setVoiceAudioCtx: (value) => { voiceAudioCtx = value; },
        setVoiceAutoStopTimer: (value) => { voiceAutoStopTimer = value; },
        setVoiceClipBlob: (value) => { voiceClipBlob = value; },
        setVoiceClipUrl: (value) => { voiceClipUrl = value; },
        setVoiceCountdownTimer: (value) => { voiceCountdownTimer = value; },
        setVoiceHistory: (value) => { voiceHistory = value; },
        setVoiceIsRecording: (value) => { voiceIsRecording = !!value; },
        setVoiceKaraokeRunToken: (value) => { voiceKaraokeRunToken = value; },
        setVoiceKaraokeTimer: (value) => { voiceKaraokeTimer = value; },
        setVoiceRecorder: (value) => { voiceRecorder = value; },
        setVoicePracticeMode: (...args) => setVoicePracticeMode(...args),
        setVoiceRecordingUIState: () => {},
        setVoiceStream: (value) => { voiceStream = value; },
        setVoiceWaveRaf: (value) => { voiceWaveRaf = value; },
        showToast: (message) => WQUI.showToast(message),
        startVoiceRecording: () => startVoiceRecording(),
        stopVoiceRecording: (options) => stopVoiceRecording(options),
        syncRevealFocusModalSections: () => syncRevealFocusModalSections(),
        syncRevealMeaningHighlight: (entry) => syncRevealMeaningHighlight(entry),
        syncRevealSorBadge: (entry) => updateRevealSorBadge(entry),
        urlRef: URL,
        voiceCaptureMs: () => VOICE_CAPTURE_MS,
        voiceHistoryKey: () => VOICE_HISTORY_KEY,
        voiceHistoryLimit: () => VOICE_HISTORY_LIMIT,
        voicePrivacyToastKey: () => VOICE_PRIVACY_TOAST_KEY,
        windowRef: window
      })
    : null;
  revealFlowSupport = typeof revealFlowSupportFactory === 'function'
    ? revealFlowSupportFactory({
        DEFAULT_PREFS,
        WQAudio,
        WQGame,
        WQUI,
        documentRef: document,
        el: _el,
        getActiveMaxGuesses: () => revealFlowSupport?.getActiveMaxGuesses?.() || 6,
        getRevealMeaningPayload: (...args) => revealFlowSupport?.getRevealMeaningPayload?.(...args) || {
          definition: '',
          funAddOn: '',
          line: '',
          readAll: ''
        },
        getRevealPacingMode,
        getVoicePracticeMode,
        isSorNotationEnabled,
        isVoiceRecording: () => voiceIsRecording,
        normalizeVoiceMode,
        pickRandom: (...args) => deepDiveBuilders?.pickRandom?.(...args) || '',
        prefs,
        revealLossToasts: REVEAL_LOSS_TOASTS,
        revealPacingPresets: REVEAL_PACING_PRESETS,
        revealText,
        revealWinToasts: REVEAL_WIN_TOASTS,
        shouldIncludeFunInMeaning: () => revealFlowSupport?.shouldIncludeFunInMeaningRuntime?.() ?? false,
        voiceTakeCompleteRef: () => voiceTakeComplete
      })
    : null;
  standaloneMission = typeof standaloneMissionFactory === 'function'
    ? standaloneMissionFactory({
        DEFAULT_PREFS,
        WQData,
        WQGame,
        WQUI,
        challengeModalReturnFocusRef: {
          get: () => challengeModalReturnFocusEl,
          set: (value) => { challengeModalReturnFocusEl = value; }
        },
        clearClassroomTurnTimer: (...args) => classroomTurns?.clearClassroomTurnTimer?.(...args),
        deepDiveBuilders,
        deepDiveModal,
        deepDiveSession,
        deepDiveState,
        demoUi,
        documentRef: document,
        el: _el,
        emitTelemetry,
        finishWeeklyProbe,
        formatGradeBandLabel,
        getFocusLabel,
        getEffectiveGameplayGradeBand,
        logOverflow,
        normalizeReviewWord,
        pickRandom,
        prefs,
        positionHintClueCard,
        positionStarterWordCard,
        positionSupportChoiceCard,
        revealChallengeStateRef: {
          get: () => revealChallengeState,
          set: (value) => { revealChallengeState = value; }
        },
        shouldExpandGradeBandForFocus,
        stopAvaWordQuestIdleWatcher: (...args) => coachRuntime?.stopAvaWordQuestIdleWatcher?.(...args),
        stopVoiceCaptureNow,
        telemetrySessionStartedAtRef: () => telemetrySessionStartedAt,
        windowRef: window,
        wqDiagTimerRef: {
          get: () => _wqDiagTimer,
          set: (value) => { _wqDiagTimer = value; }
        }
      })
    : null;
  sessionSummaryRuntime = typeof sessionSummaryRuntimeFactory === 'function'
    ? sessionSummaryRuntimeFactory({
        challengeReflectionKey: CHALLENGE_REFLECTION_KEY,
        challengeStrongScoreMin: CHALLENGE_STRONG_SCORE_MIN,
        challengeTaskFlow: CHALLENGE_TASK_FLOW,
        deepDiveBuilders,
        deepDiveState,
        documentRef: document,
        el: _el,
        gameplaySupport,
        gameplayStats,
        getActiveStudentLabel,
        getSessionSummary: () => sessionSummary,
        getTopMasteryEntry,
        getWQGameState: () => WQGame.getState?.(),
        localStorageRef: localStorage,
        navigatorRef: navigator,
        renderAdoptionHealthPanel,
        renderMasteryTable,
        renderMiniLessonPanel,
        renderProbePanel,
        renderTelemetryDashboards,
        saveSessionSummaryState,
        setSessionSummary: (nextSummary) => {
          sessionSummary = nextSummary;
        },
        showToast: (message) => WQUI.showToast(message),
        syncRoundTrackingLocals
      })
    : null;
  playlistRuntime = typeof playlistRuntimeFactory === 'function'
    ? playlistRuntimeFactory({
        applySnapshotToSettings: (snapshot, options = {}) => studentSessionRuntime?.applySnapshotToSettings?.(snapshot, options) || false,
        buildCurrentTargetSnapshot: () => studentSessionRuntime?.buildCurrentTargetSnapshot?.() || null,
        documentRef: document,
        el: _el,
        getActiveStudentLabel,
        getPlaylistState: () => playlistState,
        renderPlaylistControls: (...args) => playlistRuntime?.renderPlaylistControls?.(...args),
        savePlaylistState,
        setPlaylistState: (nextState) => {
          playlistState = nextState;
        }
      })
    : null;
  studentSessionRuntime = typeof studentSessionRuntimeFactory === 'function'
    ? studentSessionRuntimeFactory({
        DEFAULT_PREFS,
        WQUI,
        applyLessonTargetConfig,
        buildMissionSummaryStats: (...args) => sessionSummaryRuntime?.buildMissionSummaryStats?.(...args),
        el: _el,
        formatGradeBandLabel,
        formatLengthPrefLabel,
        getActiveStudentLabel,
        getEffectiveGameplayGradeBand,
        getFocusLabel,
        getGoalState: () => studentGoalState,
        getLessonPackDefinition,
        getLessonPackSelectElements,
        getLessonTarget,
        getLessonTargetSelectElements,
        getMissionLabRecords: (...args) => sessionSummaryRuntime?.getMissionLabRecords?.(...args) || [],
        getPrefs: () => prefs,
        getRosterState: () => rosterState,
        getTeacherAssignmentsFeature: () => teacherAssignmentsFeature,
        normalizeGoalEntry,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        populateLessonTargetSelect,
        recordSessionRound: (...args) => sessionSummaryRuntime?.recordSessionRound?.(...args),
        recordVoiceAttempt: (...args) => sessionSummaryRuntime?.recordVoiceAttempt?.(...args),
        renderPlaylistControls: (...args) => playlistRuntime?.renderPlaylistControls?.(...args),
        renderSessionSummary: (...args) => sessionSummaryRuntime?.renderSessionSummary?.(...args),
        resetSessionSummary: (...args) => sessionSummaryRuntime?.resetSessionSummary?.(...args),
        saveGoalState: saveStudentGoalState,
        setLessonPackApplying: (value) => { lessonPackApplying = !!value; },
        setLessonPackPrefs,
        setPref,
        syncLessonPackControlsFromPrefs,
        updateFocusGradeNote,
        updateFocusSummaryLabel,
        updateGradeTargetInline,
        updateLessonPackNote
      })
    : null;
  focusSearchRuntime = typeof focusSearchRuntimeFactory === 'function'
    ? focusSearchRuntimeFactory({
        applyAllGradeLengthDefault,
        applyLessonTargetConfig,
        closeQuickPopover: (...args) => settingsRuntime?.closeQuickPopover?.(...args),
        clearPinnedFocusSearchValue,
        defaultPrefs: DEFAULT_PREFS,
        demoCloseAllOverlays: () => demoFlow?.closeAllOverlaysForDemo?.(),
        demoMode: DEMO_MODE,
        documentRef: document,
        el: _el,
        enforceClassicFiveLetterDefault,
        enforceFocusSelectionForGrade: (...args) => preferencesRuntime?.enforceFocusSelectionForGrade?.(...args),
        emitTelemetry,
        formatGradeBandLabel,
        getEffectiveGameplayGradeBand,
        getCurriculumProgramEntries,
        getCurriculumQuestEntries,
        getFocusDisplayLabel,
        getFocusEntries,
        getFocusLabel,
        getLessonPackDefinition,
        getLessonTarget,
        getQuestEntries,
        getQuestFilterGradeBand,
        getSectionHeadingMarkup,
        handleLessonPackSelectionChange: (...args) => preferencesRuntime?.handleLessonPackSelectionChange?.(...args),
        handleLessonTargetSelectionChange: (...args) => preferencesRuntime?.handleLessonTargetSelectionChange?.(...args),
        isAssessmentRoundLocked,
        isEntryGradeBandCompatible,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        parseFocusPreset,
        prefs,
        refreshStandaloneMissionLabHub: () => standaloneMission?.refreshStandaloneMissionLabHub?.(),
        releaseLessonPackToManualMode,
        safeDefaultGradeBand: SAFE_DEFAULT_GRADE_BAND,
        setFocusPref: setPref,
        setNewGame: () => newGame(),
        shouldExpandGradeBandForFocus,
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        syncChunkTabsVisibility,
        syncGradeFromFocus,
        syncLengthFromFocus: (focus, options = {}) => syncLengthFromFocus(focus, { silent: lessonPackApplying || !!options.silent }),
        syncLessonPackControlsFromPrefs,
        syncThemePreviewStripVisibility,
        updateFocusGradeNote,
        updateFocusHint,
        updateFocusSummaryLabel,
        windowRef: window,
        WQData,
        WQ_WORD_DATA: window.WQ_WORD_DATA
      })
    : null;
  focusCurriculumRuntime = typeof focusCurriculumRuntimeFactory === 'function'
    ? focusCurriculumRuntimeFactory({
        curriculumLessonPacks: () => window.WQAppRuntimeConfig?.CURRICULUM_LESSON_PACKS || Object.freeze({}),
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        emitTelemetry,
        formatGradeBandLabel,
        getCurriculumLengthForFocus: (...args) => {
          const resolved = window.WQFocusCurriculumHelpers?.getCurriculumLengthForFocus?.(...args);
          if (resolved != null && String(resolved).trim()) return String(resolved).trim();
          return String(args[1] || 'any').trim() || 'any';
        },
        getFocusLabel,
        getLessonPackApplying: () => lessonPackApplying,
        prefs,
        refreshBoardForLengthChange,
        refreshStandaloneMissionLabHub,
        setLessonPackApplying: (value) => {
          lessonPackApplying = value;
        },
        setPref,
        updateFocusGradeNote,
        updateFocusSummaryLabel,
        updateGradeTargetInline,
        WQUI
      })
    : null;
  focusGradeRuntime = typeof focusGradeRuntimeFactory === 'function'
    ? focusGradeRuntimeFactory({
        applyChunkTabsMode,
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        formatHintUnlockCopy: (playStyle, guessCount) => getHintUnlockCopy(playStyle, guessCount),
        formatSafeDefaultGradeBand: SAFE_DEFAULT_GRADE_BAND,
        getFocusLabel,
        getGameState: () => WQGame.getState?.() || {},
        getLessonPackDefinition,
        getLessonTarget,
        getPlayableStyle: () => normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle),
        getPrefState: () => prefs,
        getQuestFilterGradeBand: () => normalizeQuestGradeBand(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade),
        hintModeGetter: getHintMode,
        isAssessmentRoundLocked,
        lessonPackApplyingGetter: () => lessonPackApplying,
        normalizeLessonPackId,
        normalizeLessonTargetId,
        refreshBoardForLengthChange,
        setHoverNoteForElement,
        setPref,
        showToast: (message) => WQUI.showToast(message),
        syncHintToggleUI,
        syncPlayStyleToggleUI,
        WQUI,
        wqGame: WQGame,
        chunkTabFocusKeys: () => new Set(window.WQAppRuntimeConfig?.CHUNK_TAB_FOCUS_KEYS || []),
        curriculumPackOrder: () => window.WQAppRuntimeConfig?.CURRICULUM_PACK_ORDER || Object.freeze([]),
        subjectFocusGrade: () => window.WQAppRuntimeConfig?.SUBJECT_FOCUS_GRADE || Object.freeze({})
      })
    : null;
  playSettingsRuntime = typeof playSettingsRuntimeFactory === 'function'
    ? playSettingsRuntimeFactory({
        closeFocusSearchList,
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        emitTelemetry,
        getHintUnlockCopy: (playStyle, guessCount) => getHintUnlockCopy(playStyle, guessCount),
        getHintUnlockMinimum,
        getThemeDisplayLabel,
        getThemeFallback,
        getVoicePracticeMode,
        hideInformantHintCard,
        hideStarterWordCard,
        normalizePlayStyle,
        normalizeReportCompactMode,
        normalizeRevealAutoNext,
        normalizeRevealPacing,
        normalizeTheme,
        normalizeUiSkin,
        prefs,
        setHoverNoteForElement,
        setPref,
        showToast: (message) => WQUI.showToast(message),
        syncHeaderControlsVisibility,
        syncMusicForTheme,
        syncSettingsModeCards,
        syncStarterWordLauncherUI,
        syncThemePreviewStripVisibility,
        updateFocusHint,
        updateNextActionLine,
        windowRef: window,
        WQGame,
        getHeaderIconMarkup,
        isHelpSuppressedForTeamMode,
        isMissionLabStandaloneMode,
        normalizeStarterWordMode,
        showSupportChoiceCard
      })
    : null;
  startupRuntime = typeof startupRuntimeFactory === 'function'
    ? startupRuntimeFactory({
        appRuntimeConfig: APP_RUNTIME_CONFIG,
        applyAtmosphere,
        applyBoardStyle,
        applyDevOnlyVisibility,
        applyFeedback,
        applyHint,
        applyKeyStyle,
        applyKeyboardLayout,
        applyMotion,
        applyPlayStyle,
        applyProjector,
        applyReportCompactMode,
        applyRevealFocusMode,
        applyStarterWordMode,
        applyTextSize,
        applyTheme,
        applyUiSkin,
        defaultPrefs: DEFAULT_PREFS,
        el: _el,
        emitTelemetry,
        getHintMode,
        hoverNoteDelayMs: HOVER_NOTE_DELAY_MS,
        hoverNoteSelector: HOVER_NOTE_TARGET_SELECTOR,
        installBuildConsistencyHeartbeat,
        logRuntimeBuildDiagnostics,
        missionLabEnabled: MISSION_LAB_ENABLED,
        normalizeCuratedMusicMode,
        normalizeHeaderControlLayout,
        normalizeMasteryFilter,
        normalizeMasterySort,
        normalizeReportCompactMode,
        normalizeRevealAutoNext,
        normalizeRevealPacing,
        normalizeTeamCount,
        normalizeTeamMode,
        normalizeTeamSet,
        normalizeTurnTimer,
        normalizeVoiceMode,
        pageModeKey: PAGE_MODE_KEY,
        populateVoiceSelector,
        prefs,
        runAutoCacheRepairForBuild,
        runRemoteBuildConsistencyCheck,
        savePrefs,
        requestAnimationFrameRef: requestAnimationFrame,
        setPref,
        shouldPersistTheme,
        syncBuildBadge,
        syncCaseToggleUI,
        syncHeaderStaticIcons,
        syncHintToggleUI,
        syncPersistentVersionChip,
        syncQuickMusicVolume,
        syncQuickSetupControls,
        themeRegistry: () => window.WQThemeRegistry || null,
        updateWilsonModeToggle,
        windowRef: window,
        WQUI
      })
    : null;
  playSurfaceBindings = typeof playSurfaceBindingsFactory === 'function'
    ? playSurfaceBindingsFactory({
        WQAudio,
        WQGame,
        WQUI,
        applyFeedback,
        applyPlayStyle,
        applyReportCompactMode,
        applyRevealFocusMode,
        cancelRevealNarration: (...args) => deepDiveCoreRuntime?.cancelRevealNarration?.(...args),
        clearRevealAutoAdvanceTimer,
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        forceUpdateNow,
        getPrefs: () => prefs,
        hideInformantHintCard,
        hideMidgameBoost,
        normalizeMasteryFilter,
        normalizeMasterySort,
        normalizePlayStyle,
        normalizeProbeRounds,
        normalizeRevealAutoNext,
        normalizeRevealPacing,
        normalizeTeamCount,
        normalizeTeamMode,
        normalizeTeamSet,
        normalizeTurnTimer,
        normalizeVoiceMode,
        recordAvaWordQuestEvent: (...args) => coachRuntime?.recordAvaWordQuestEvent?.(...args),
        renderMasteryTable,
        resetAppearanceAndCache,
        runRevealNarration: (...args) => deepDiveCoreRuntime?.runRevealNarration?.(...args),
        setHintMode,
        setPref,
        setVoicePracticeMode,
        showInformantHintToast,
        speakAvaWordQuestAdaptive: (...args) => coachRuntime?.speakAvaWordQuestAdaptive?.(...args),
        syncAssessmentLockRuntime,
        syncClassroomTurnRuntime,
        syncHeaderClueLauncherUI,
        syncKeyboardInputLocks,
        syncQuickSetupControls,
        syncStarterWordLauncherUI,
        syncTeacherPresetButtons,
        syncRevealMeaningHighlight,
        updateClassroomTurnLine,
        updateNextActionLine,
        updateRevealSorBadge,
        windowRef: window
      })
    : null;
  roundStartRuntime = typeof roundStartRuntimeFactory === 'function'
    ? roundStartRuntimeFactory({
        DEMO_MODE,
        DEMO_TARGET_WORD,
        WQGame,
        WQUI,
        buildPlayableWordSet,
        cancelRevealNarration: (...args) => deepDiveCoreRuntime?.cancelRevealNarration?.(...args),
        clearClassroomTurnTimer,
        clearRevealAutoAdvanceTimer,
        clearSupportModalTimer,
        clearVoiceClip,
        closeRevealChallengeModal,
        demoFlow,
        demoState,
        demoUi,
        demoHelpers: {
          clearAutoplayTimer: () => clearDemoAutoplayTimer(),
          clearTimers: demoClearTimers,
          getDemoRoundComplete: () => demoRoundComplete,
          setAutoplayTimer: (value) => { demoAutoplayTimer = value; },
          stopCoachReadyLoop: stopDemoCoachReadyLoop,
          stopKeyPulse: stopDemoKeyPulse
        },
        drawWaveform,
        el: _el,
        emitTelemetry,
        getEffectiveGameplayGradeBand,
        getFirstRunSetupPending: () => firstRunSetupPending,
        getFocusLabel,
        getPrefs: () => prefs,
        getVoicePracticeMode,
        getVoiceState: () => ({
          voicePreviewAudio,
          voiceTakeComplete
        }),
        hideInformantHintCard,
        hideMidgameBoost,
        hideStarterWordCard,
        hideSupportChoiceCard,
        isMissionLabStandaloneMode,
        normalizeReviewWord,
        onRoundDiagnosticsStart: (result) => {
          try {
            if (window.CSWQDiagnostics && typeof window.CSWQDiagnostics.createSession === 'function') {
              _wqDiagSession = window.CSWQDiagnostics.createSession(result.wordLength || 5);
              _wqDiagTimer = setTimeout(() => {
                if (_wqDiagSession && !_wqDiagSession.endedAtMs) {
                  const softSignals = window.CSWQDiagnostics.endSession(_wqDiagSession, false);
                  _wqDiagSession = null;
                  if (softSignals) questRuntime?.publishWordQuestSignals?.(softSignals, { soft: true });
                }
              }, 90000);
            }
          } catch {}
        },
        refreshStandaloneMissionLabHub,
        resetRoundTracking,
        scheduleFocusSupportUnlock,
        scheduleStarterCoachHint,
        setAvaRuntimeState: (nextState = {}) => {
          avaWqIdleFiredThisRound = !!nextState.idleFiredThisRound;
          avaWqLastActionAt = Number(nextState.lastActionAt) || Date.now();
          avaWqLastIdleEmitAt = Number(nextState.lastIdleEmitAt) || 0;
        },
        setEvidenceSessionId: (value) => {
          _activeEvidenceSessionId = String(value || '');
        },
        setFocusSupportState: (nextState = {}) => {
          focusSupportUnlockedByMiss = !!nextState.unlockedByMiss;
          focusSupportUnlockAt = Number(nextState.unlockAt) || 0;
          currentRoundSupportPromptShown = !!nextState.promptShown;
          focusSupportEligibleAt = Number(nextState.eligibleAt) || 0;
        },
        setGameStartedAt: (value) => {
          gameStartedAt = Number(value) || 0;
        },
        setMidgameBoostShown: (value) => {
          midgameBoostShown = !!value;
        },
        setRuntimeDiagnosticsState: (nextState = {}) => {
          if (_wqDiagTimer) clearTimeout(_wqDiagTimer);
          _wqDiagTimer = Number(nextState.diagTimer) || 0;
          _wqDiagSession = nextState.diagSession || null;
          _latestSavedSessionId = String(nextState.latestSavedSessionId || '');
        },
        setVoiceState: (nextState = {}) => {
          if (Object.prototype.hasOwnProperty.call(nextState, 'voicePreviewAudio')) {
            voicePreviewAudio = nextState.voicePreviewAudio || null;
          }
          if (Object.prototype.hasOwnProperty.call(nextState, 'voiceTakeComplete')) {
            voiceTakeComplete = !!nextState.voiceTakeComplete;
          }
        },
        setWordQuestCoachState: (...args) => coachRuntime?.setWordQuestCoachState?.(...args),
        startAvaWordQuestIdleWatcher: (...args) => coachRuntime?.startAvaWordQuestIdleWatcher?.(...args),
        startStandaloneMissionLab: (options = {}) => standaloneMission?.startStandaloneMissionLab?.(options) || false,
        stopVoiceCaptureNow: (...args) => voiceSupport?.stopVoiceCaptureNow?.(...args),
        supportUi: {
          getFocusLabel,
          removeDupeToast: (...args) => revealFlowSupport?.removeDupeToast?.(...args)
        },
        syncAssessmentLockRuntime,
        syncClassroomTurnRuntime: (...args) => classroomTurns?.syncClassroomTurnRuntime?.(...args),
        syncFocusSupportRuntimeState,
        syncHeaderClueLauncherUI,
        syncHeaderControlsVisibility,
        syncKeyboardInputLocks,
        syncStarterWordLauncherUI,
        updateFocusHint,
        updateNextActionLine,
        updateVoicePracticePanel: (state) => { voiceSupport?.updateVoicePracticePanel?.(state); },
        updateWordQuestShareButton: (...args) => questRuntime?.updateWordQuestShareButton?.(...args),
        wordReview,
        windowRef: window
      })
    : null;
  roundSubmitRuntime = typeof roundSubmitRuntimeFactory === 'function'
    ? roundSubmitRuntimeFactory({
        DEMO_MODE,
        FEATURES,
        MIDGAME_BOOST_ENABLED,
        WQGame,
        WQUI,
        applyTheme,
        awardQuestProgress: (...args) => questRuntime?.awardQuestProgress?.(...args),
        buildPlayableWordSet,
        buildRoundMetrics,
        clearClassroomTurnTimer: (...args) => classroomTurns?.clearClassroomTurnTimer?.(...args),
        clearFocusSupportUnlockTimer,
        closeRevealChallengeModal: (...args) => deepDiveCoreRuntime?.closeRevealChallengeModal?.(...args),
        demoFlow,
        demoSetTimeoutRef: demoSetTimeout,
        demoState,
        demoUi,
        el: _el,
        emitTelemetry,
        getActiveDiagnosticsSession: () => _wqDiagSession,
        getCurrentRoundFlags: () => ({
          hintRequested: currentRoundHintRequested,
          starterWordsShown: currentRoundStarterWordsShown
        }),
        getCurrentTheme: () => normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback()),
        getDiagnosticsApi: () => window.CSWQDiagnostics || null,
        getDiagnosticsTimer: () => _wqDiagTimer,
        getEffectiveGameplayGradeBand,
        getGameplayPrefs: () => prefs,
        getMidgameBoostShown: () => midgameBoostShown,
        getThemeFallback,
        getWrongStreakMeta: () => ({
          correctStreak: avaWqCorrectStreak,
          rapidEventsLength: avaWqRapidEvents.length,
          totalCorrect: avaWqTotalCorrect,
          totalWrong: avaWqTotalWrong,
          wrongStreak: avaWqWrongStreak
        }),
        hideDemoCoach,
        hideMidgameBoost,
        maybeAutoShowStarterWords,
        maybeShowErrorCoach,
        normalizeReviewWord,
        onDemoReplayRequested: () => { demoRoundComplete = true; },
        onGuessAccepted: () => {},
        onGuessTooShort: (state) => {
          WQUI.showToast('Fill in all the letters first');
          WQUI.shakeRow(state.guesses, state.wordLength);
          updateNextActionLine();
          syncKeyboardInputLocks(WQGame.getState?.() || {});
          if (!DEMO_MODE) demoUi?.positionDemoLaunchButton?.();
        },
        onRevealContinue: () => {},
        onRevealLostOrWon: () => {
          resetRoundTracking();
        },
        publishWordQuestSignals: (...args) => questRuntime?.publishWordQuestSignals?.(...args),
        recordAvaWordQuestEvent: (...args) => coachRuntime?.recordAvaWordQuestEvent?.(...args),
        refreshStarterSuggestionsIfOpen,
        renderSafeStreak,
        revealFlowSupport,
        setAvaStreakState: (nextState = {}) => {
          if (Object.prototype.hasOwnProperty.call(nextState, 'correctStreak')) avaWqCorrectStreak = Number(nextState.correctStreak) || 0;
          if (Object.prototype.hasOwnProperty.call(nextState, 'wrongStreak')) avaWqWrongStreak = Number(nextState.wrongStreak) || 0;
          if (Object.prototype.hasOwnProperty.call(nextState, 'totalCorrect')) avaWqTotalCorrect = Number(nextState.totalCorrect) || 0;
          if (Object.prototype.hasOwnProperty.call(nextState, 'totalWrong')) avaWqTotalWrong = Number(nextState.totalWrong) || 0;
        },
        setDiagnosticsState: (nextState = {}) => {
          if (Object.prototype.hasOwnProperty.call(nextState, 'timer')) _wqDiagTimer = Number(nextState.timer) || 0;
          if (Object.prototype.hasOwnProperty.call(nextState, 'session')) _wqDiagSession = nextState.session || null;
        },
        setFocusSupportState: (nextState = {}) => {
          if (Object.prototype.hasOwnProperty.call(nextState, 'unlockedByMiss')) {
            focusSupportUnlockedByMiss = !!nextState.unlockedByMiss;
          }
          if (Object.prototype.hasOwnProperty.call(nextState, 'eligibleAt')) {
            focusSupportEligibleAt = Number(nextState.eligibleAt) || 0;
          }
        },
        setMidgameBoostShown: (value) => {
          midgameBoostShown = !!value;
        },
        setWordQuestCoachState: (...args) => coachRuntime?.setWordQuestCoachState?.(...args),
        showMidgameBoost,
        speakAvaWordQuestAdaptive: (...args) => coachRuntime?.speakAvaWordQuestAdaptive?.(...args),
        startNewGame: (...args) => newGame(...args),
        stopAvaWordQuestIdleWatcher: (...args) => coachRuntime?.stopAvaWordQuestIdleWatcher?.(...args),
        syncAssessmentLockRuntime,
        syncFocusSupportRuntimeState,
        syncHeaderClueLauncherUI,
        syncKeyboardInputLocks,
        syncStarterWordLauncherUI,
        updateClassroomTurnLine: (...args) => classroomTurns?.updateClassroomTurnLine?.(...args),
        updateNextActionLine,
        wordReview,
        mapGuessFeedbackToSignalStates: (...args) => questRuntime?.mapGuessFeedbackToSignalStates?.(...args) || [],
        scheduleSupportModalTimer,
        incrementStreak,
        midgameBoostTriggerGuess: midgameBoostRuntime?.MIDGAME_BOOST_TRIGGER_GUESS || 3,
        setDemoAutoplayTimer: (value) => { demoAutoplayTimer = value; },
        advanceTeamTurn: (...args) => classroomTurns?.advanceTeamTurn?.(...args)
      })
    : null;
  inputShell = typeof inputShellFactory === 'function'
    ? inputShellFactory({
        awardPhonicsClueBonusPoint,
        awardPhonicsClueGuessPoint,
        closePhonicsClueModal,
        closeQuickPopover: (...args) => settingsRuntime?.closeQuickPopover?.(...args),
        demoFlow,
        demoUi,
        deepDiveModal,
        deepDiveSession,
        deepDiveUi,
        documentRef: document,
        el: _el,
        getChallengeLevelDisplay: (level) => deepDiveBuilders?.getChallengeLevelDisplay?.(level) || level,
        getDemoMode: () => DEMO_MODE,
        getDemoToastAutoCollapsedByPlay: () => demoToastAutoCollapsedByPlay,
        getDemoToastElements: () => ({ toast: demoToastEl, chip: demoToastChipEl }),
        getFirstRunSetupPending: () => firstRunSetupPending,
        getFocusSearchOpen: () => document.documentElement.getAttribute('data-focus-search-open') === 'true',
        getGameState: () => WQGame.getState?.() || {},
        getHelpModalOpen: () => !(_el('listening-mode-overlay')?.classList.contains('hidden')),
        getMissionLabStandaloneMode: () => isMissionLabStandaloneMode(),
        getMusicPopoverOpen: () => !(_el('quick-music-strip')?.classList.contains('hidden')),
        getPhonicsClueCurrent: () => phonicsClueState?.current,
        getPhonicsClueOpen: () => !(_el('phonics-clue-modal')?.classList.contains('hidden')),
        getPhonicsClueStarted: () => !!phonicsClueState?.started,
        getQuickPopoverThemeOpen: () => !(_el('theme-preview-strip')?.classList.contains('hidden')),
        getRevealChallengeOpen: () => !(_el('challenge-modal')?.classList.contains('hidden')),
        getRevealChallengeState: () => revealChallengeState,
        getStarterWordOpen: () => !(_el('starter-word-card')?.classList.contains('hidden')),
        getSupportChoiceOpen: () => !(_el('support-choice-card')?.classList.contains('hidden')),
        handleInputUnit: (rawUnit) => inputConstraints?.handleInputUnit?.(rawUnit, handleKey),
        handleKey,
        hideListeningModeExplainer,
        hideStarterWordCard,
        hideSupportChoiceCard,
        isEditableTarget: (target) => inputConstraints?.isEditableTarget?.(target) || false,
        isMissionLabStandaloneMode,
        isPlayMode: () => document.documentElement.getAttribute('data-page-mode') !== 'mission-lab',
        newGame,
        normalizeThinkingLevel: (value, fallback) => deepDiveBuilders?.normalizeThinkingLevel?.(value, fallback) || fallback,
        onGameplayInteraction: () => { avaWqLastActionAt = Date.now(); },
        onSetDemoToastAutoCollapsedByPlay: (value) => { demoToastAutoCollapsedByPlay = !!value; },
        onVisibilityResume: () => { coachRuntime?.startAvaWordQuestIdleWatcher?.(); },
        onVisibilitySuspend: () => { coachRuntime?.stopAvaWordQuestIdleWatcher?.('document hidden'); },
        openVoicePracticeAndRecord: (options = {}) => voiceSupport?.openVoicePracticeAndRecord?.(options) || false,
        playChallengeSentence: () => {
          deepDiveCoreRuntime?.cancelRevealNarration?.();
          const current = revealChallengeState?.result?.entry || entry();
          if (current) void WQAudio.playSentence(current);
        },
        playChallengeWord: () => {
          deepDiveCoreRuntime?.cancelRevealNarration?.();
          const current = revealChallengeState?.result?.entry || entry();
          if (current) void WQAudio.playWord(current);
        },
        refreshStandaloneMissionLabHub: () => standaloneMission?.refreshStandaloneMissionLabHub?.(),
        renderPhonicsCluePanel,
        setChallengeFeedback: (...args) => deepDiveUi?.setChallengeFeedback?.(...args),
        setRevealChallengeActiveTask: (task) => {
          if (revealChallengeState) revealChallengeState.activeTask = task;
        },
        setSupportPromptMode,
        showInformantHintToast,
        showStarterWordCard,
        showSupportChoiceCard,
        showToast: (message) => WQUI.showToast(message),
        startPhonicsClueDeck,
        startPhonicsClueTurnTimer,
        startStandaloneMissionLab: (options = {}) => standaloneMission?.startStandaloneMissionLab?.(options) || false,
        togglePhonicsClueTargetVisibility,
        updatePhonicsClueControlsFromUI,
        windowRef: window,
        challengeTaskFlow: CHALLENGE_TASK_FLOW,
        dismissChallengeQuickstart: () => {
          deepDiveState?.saveChallengeOnboardingState?.({
            seenCount: Math.max(CHALLENGE_ONBOARDING_MAX_VIEWS, challengeOnboardingState.seenCount),
            dismissed: true
          });
          _el('challenge-quickstart')?.classList.add('hidden');
        }
      })
    : null;
  inputConstraints = typeof inputConstraintsFactory === 'function'
    ? inputConstraintsFactory({
        defaultPrefs: DEFAULT_PREFS,
        demoMode: DEMO_MODE,
        demoUi,
        deriveWordState,
        documentRef: document,
        el: _el,
        getClassroomTeamIndex: () => classroomTeamIndex,
        getDemoState: () => demoState,
        getPrefs: () => prefs,
        getState: () => WQGame.getState?.() || {},
        normalizeTeamCount,
        normalizeTeamSet,
        normalizeTurnTimer,
        positionDemoLaunchButton: () => demoUi?.positionDemoLaunchButton?.(),
        refreshStarterSuggestionsIfOpen,
        showToast: (message) => WQUI.showToast(message),
        updateCurrentRow: (...args) => WQUI.updateCurrentRow(...args),
        updateNextActionLine,
        teamLabelSets: () => window.WQAppRuntimeConfig?.TEAM_LABEL_SETS || Object.freeze({}),
        WQGame,
        WQUI
      })
    : null;
  classroomTurns = typeof classroomTurnsFactory === 'function'
    ? classroomTurnsFactory({
        TEAM_LABEL_SETS: () => window.WQAppRuntimeConfig?.TEAM_LABEL_SETS || Object.freeze({}),
        WQUI,
        defaultPrefs: DEFAULT_PREFS,
        documentRef: document,
        el: _el,
        getCurrentGuessClear: () => {
          const state = WQGame.getState?.();
          if (!state?.word || !state.guess) return;
          while ((WQGame.getState?.()?.guess || '').length > 0) WQGame.deleteLetter();
          const next = WQGame.getState?.();
          if (next?.wordLength) WQUI.updateCurrentRow(next.guess, next.wordLength, next.guesses.length);
        },
        getGameState: () => WQGame.getState?.() || {},
        getHelpSuppressed: isHelpSuppressedForTeamMode,
        getTeamMode: () => normalizeTeamMode(_el('s-team-mode')?.value || prefs.teamMode || DEFAULT_PREFS.teamMode),
        getTeamSet: () => normalizeTeamSet(_el('s-team-set')?.value || prefs.teamSet || DEFAULT_PREFS.teamSet),
        getTeamCount: () => Number.parseInt(normalizeTeamCount(_el('s-team-count')?.value || prefs.teamCount || DEFAULT_PREFS.teamCount), 10) || 2,
        getTurnTimerSeconds: () => {
          const mode = normalizeTurnTimer(_el('s-turn-timer')?.value || prefs.turnTimer || DEFAULT_PREFS.turnTimer);
          return mode === 'off' ? 0 : (Number.parseInt(mode, 10) || 0);
        },
        positionSupportCards: () => {
          if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) positionHintClueCard();
          if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) positionStarterWordCard();
          if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) positionSupportChoiceCard();
        },
        showToast: (message) => WQUI.showToast(message),
        syncTeamHelpSuppressionUI,
        windowRef: window
      })
    : null;
  coachRuntime = typeof coachRuntimeFactory === 'function'
    ? coachRuntimeFactory({
        demoMode: DEMO_MODE,
        documentRef: document,
        el: _el,
        getGameState: () => WQGame.getState?.() || {},
        getHomeMode: () => homeMode,
        isDevModeEnabled,
        localStorageRef: localStorage,
        setWordQuestCoachKey: (value) => { wordQuestCoachKey = value; },
        windowRef: window
      })
    : null;
  surfaceSettingsRuntime = typeof surfaceSettingsRuntimeFactory === 'function'
    ? surfaceSettingsRuntimeFactory({
        defaultPrefs: DEFAULT_PREFS,
        detectPreferredKeyboardLayout,
        documentRef: document,
        diagnosticsLastResetKey: DIAGNOSTICS_LAST_RESET_KEY,
        el: _el,
        getHintMode,
        getRevealFocusMode,
        getThemeFallback,
        getVoicePracticeMode: () => getVoicePracticeMode(),
        isAssessmentLockEnabled,
        isAssessmentRoundLocked,
        isConfidenceCoachingEnabled,
        midgameBoostEnabled: MIDGAME_BOOST_ENABLED,
        normalizeKeyboardLayout,
        normalizeKeyboardPresetId,
        normalizeLessonPackId,
        normalizeTextSize,
        normalizeTheme,
        normalizeVoiceMode,
        openFirstRunSetupModal,
        prefs,
        resolveBuildLabel,
        setFirstRunSetupPending: (value) => { firstRunSetupPending = !!value; },
        setHoverNoteForElement,
        setPref,
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        studentRecordingEnabled: STUDENT_RECORDING_ENABLED,
        syncChunkTabsVisibility,
        syncHeaderControlsVisibility,
        teacherPresets: settingsRuntime?.getTeacherPresets?.() || Object.freeze({}),
        updateFocusHint,
        updateVoicePracticePanel,
        writingStudioEnabled: WRITING_STUDIO_ENABLED,
        closeFocusSearchList,
        syncTeacherPresetButtons,
        syncRevealFocusModalSections,
        wqGame: WQGame,
        WQUI
      })
    : null;
  maintenanceRuntime = typeof maintenanceRuntimeFactory === 'function'
    ? maintenanceRuntimeFactory({
        appPrefKey: PREF_KEY,
        cachesRef: typeof caches !== 'undefined' ? caches : null,
        cancelRevealNarration,
        copyTextToClipboard,
        defaultPrefs: DEFAULT_PREFS,
        demoMode: DEMO_MODE,
        diagnosticsLastResetKey: DIAGNOSTICS_LAST_RESET_KEY,
        documentRef: document,
        emitTelemetry,
        fetchImpl: (...args) => fetch(...args),
        getThemeFallback,
        locationRef: location,
        localStorageRef: localStorage,
        markDiagnosticsReset,
        navigatorRef: navigator,
        normalizeReviewWord,
        persistTheme: shouldPersistTheme,
        prefs,
        resolveBuildLabel,
        reviewQueueKey: SHUFFLE_BAG_KEY,
        reviewQueueMaxItems: REVIEW_QUEUE_MAX_ITEMS,
        savePrefs,
        sessionStorageRef: sessionStorage,
        setPref,
        setTimeoutRef: setTimeout,
        showAssessmentLockNotice,
        showToast: (message) => WQUI.showToast(message),
        stopVoiceCaptureNow,
        syncAssessmentLockRuntime,
        syncClassroomTurnRuntime,
        syncHeaderControlsVisibility,
        syncTeacherPresetButtons,
        uiApply: {
          applyAtmosphere,
          applyBoardStyle,
          applyChunkTabsMode,
          applyFeedback,
          applyKeyStyle,
          applyKeyboardLayout,
          applyTextSize
        },
        updateWilsonModeToggle,
        windowRef: window,
        WQUI
      })
    : null;
  function buildCurriculumSelectionLabel(...args) {
    return sessionExports?.buildCurriculumSelectionLabel?.(...args) || 'Manual mode (no lesson pack)';
  }
  function buildMtssIepNoteText(...args) {
    return sessionExports?.buildMtssIepNoteText?.(...args) || '';
  }
  function pickSamplePracticeWords(...args) {
    return sessionExports?.pickSamplePracticeWords?.(...args) || [];
  }
  function buildFamilyHandoutText(...args) {
    return sessionExports?.buildFamilyHandoutText?.(...args) || '';
  }
  function getMiniLessonKeyFromSession(...args) {
    return sessionExports?.getMiniLessonKeyFromSession?.(...args) || 'context_strategy';
  }
  function renderMiniLessonPanel(...args) {
    return sessionExports?.renderMiniLessonPanel?.(...args);
  }
  function buildSessionSummaryText(...args) {
    return sessionExports?.buildSessionSummaryText?.(...args) || '';
  }
  function buildSessionSummaryCsvText(...args) {
    return sessionExports?.buildSessionSummaryCsvText?.(...args) || '';
  }
  function buildMasteryReportText(...args) {
    return sessionExports?.buildMasteryReportText?.(...args) || '';
  }
  function buildMasteryReportCsvText(...args) {
    return sessionExports?.buildMasteryReportCsvText?.(...args) || '';
  }
  function buildClassRollupCsvText(...args) {
    return sessionExports?.buildClassRollupCsvText?.(...args) || '';
  }
  function buildCsvBundlePrefix(...args) {
    return sessionExports?.buildCsvBundlePrefix?.(...args) || 'wordquest-class';
  }
  function buildProbeSummaryCsvText(...args) {
    return sessionExports?.buildProbeSummaryCsvText?.(...args) || '';
  }
  function buildMissionSummaryText(...args) {
    return sessionExports?.buildMissionSummaryText?.(...args) || '';
  }
  function buildMissionLabCsvText(...args) {
    return sessionExports?.buildMissionLabCsvText?.(...args) || '';
  }
  function buildSessionOutcomesSummaryText(...args) {
    return sessionExports?.buildSessionOutcomesSummaryText?.(...args) || '';
  }
  function downloadTextFile(...args) {
    return sessionExports?.downloadTextFile?.(...args) || false;
  }
  function downloadClassRollupCsv(...args) {
    return sessionExports?.downloadClassRollupCsv?.(...args);
  }
  function downloadCsvBundle(...args) {
    return sessionExports?.downloadCsvBundle?.(...args);
  }
  function copySessionOutcomesSummary(...args) {
    return sessionExports?.copySessionOutcomesSummary?.(...args);
  }
  function copyMiniLessonPlan(...args) {
    return sessionExports?.copyMiniLessonPlan?.(...args);
  }
  function copySessionSummary(...args) {
    return sessionExports?.copySessionSummary?.(...args);
  }
  function copyMasterySummary(...args) {
    return sessionExports?.copyMasterySummary?.(...args);
  }
  function copyMasterySummaryCsv(...args) {
    return sessionExports?.copyMasterySummaryCsv?.(...args);
  }
  function copyMissionSummary(...args) {
    return sessionExports?.copyMissionSummary?.(...args);
  }
  function copyMissionSummaryCsv(...args) {
    return sessionExports?.copyMissionSummaryCsv?.(...args);
  }
  function copyProbeSummary(...args) {
    return sessionExports?.copyProbeSummary?.(...args);
  }
  function copyProbeSummaryCsv(...args) {
    return sessionExports?.copyProbeSummaryCsv?.(...args);
  }
  function copyMtssIepNote(...args) {
    return sessionExports?.copyMtssIepNote?.(...args);
  }
  function copyFamilyHandout(...args) {
    return sessionExports?.copyFamilyHandout?.(...args);
  }
  function downloadFamilyHandout(...args) {
    return sessionExports?.downloadFamilyHandout?.(...args);
  }
  function loadSessionSummaryState(...args) {
    return teacherState?.loadSessionSummaryState?.(...args);
  }
  function loadRosterState(...args) {
    return teacherState?.loadRosterState?.(...args);
  }
  function loadProbeHistory(...args) {
    return teacherState?.loadProbeHistory?.(...args) || [];
  }
  function normalizeGoalAccuracy(...args) {
    return teacherState?.normalizeGoalAccuracy?.(...args) || 80;
  }
  function normalizeGoalGuesses(...args) {
    return teacherState?.normalizeGoalGuesses?.(...args) || 4;
  }
  function normalizeGoalEntry(...args) {
    return teacherState?.normalizeGoalEntry?.(...args);
  }
  function loadStudentGoalState(...args) {
    return teacherState?.loadStudentGoalState?.(...args) || Object.create(null);
  }
  function loadPlaylistState(...args) {
    return teacherState?.loadPlaylistState?.(...args) || { playlists: [], assignments: Object.create(null), progress: Object.create(null), selectedId: '' };
  }
  function saveProbeHistory() {
    return teacherState?.saveProbeHistory?.(PROBE_HISTORY_KEY, probeHistory);
  }
  function saveStudentGoalState() {
    return teacherState?.saveStudentGoalState?.(STUDENT_GOALS_KEY, studentGoalState);
  }
  function savePlaylistState() {
    return teacherState?.savePlaylistState?.(PLAYLIST_STATE_KEY, playlistState);
  }
  function normalizeProbeRounds(...args) {
    return teacherState?.normalizeProbeRounds?.(...args) || '3';
  }
  function createEmptyProbeState(...args) {
    return teacherState?.createEmptyProbeState?.(...args) || {
      active: false,
      startedAt: 0,
      roundsTarget: 3,
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
  function saveSessionSummaryState() {
    return teacherState?.saveSessionSummaryState?.(SESSION_SUMMARY_KEY, sessionSummary);
  }
  function saveRosterState() {
    return teacherState?.saveRosterState?.(ROSTER_STATE_KEY, rosterState);
  }
  function csSyncHeaderTitleCenter(...args) {
    return shellRuntime?.csSyncHeaderTitleCenter?.(...args);
  }
  function setHomeMode(...args) {
    const next = shellRuntime?.setHomeMode?.(...args, { wordQuestCoachKey }) || String(args[0] || 'home');
    homeMode = next;
    return next;
  }
  function initializeHomeMode(...args) {
    const next = shellRuntime?.initializeHomeMode?.(...args) || homeMode;
    homeMode = next;
    return next;
  }
  function routeTo(...args) {
    return shellRuntime?.routeTo?.(...args);
  }
  function applyHashRoute(...args) {
    return shellRuntime?.applyHashRoute?.(...args);
  }
  window.applyHashRouteFromMain = (...args) => applyHashRoute(...args);
  function syncPlayToolsRoleVisibility(...args) {
    return shellRuntime?.syncPlayToolsRoleVisibility?.(...args);
  }
  function togglePlayToolsDrawer(...args) {
    return shellRuntime?.togglePlayToolsDrawer?.(homeMode, ...args);
  }
  function syncPageModeUI(...args) {
    return shellRuntime?.syncPageModeUI?.(...args);
  }
  function setPageMode(mode, options = {}) {
    const next = shellRuntime?.setPageMode?.(mode, { ...options, currentMode: pageMode }) || normalizePageMode(mode);
    pageMode = next;
    return next;
  }
  function openWritingStudioPage(...args) {
    return shellRuntime?.openWritingStudioPage?.(...args);
  }
  function syncHeaderControlsVisibility(...args) {
    return panelRuntime?.syncHeaderControlsVisibility?.(...args);
  }
  function drawWaveform(...args) { return voiceSupport?.drawWaveform?.(...args); }
  function animateLiveWaveform(...args) { return voiceSupport?.animateLiveWaveform?.(...args); }
  function setVoicePracticeFeedback(...args) { return voiceSupport?.setVoicePracticeFeedback?.(...args); }
  function clearRevealAutoAdvanceTimer(...args) { return revealFlowSupport?.clearRevealAutoAdvanceTimer?.(...args); }
  function scheduleRevealAutoAdvance() { revealFlowSupport?.scheduleRevealAutoAdvance?.(); }
  var focusSearchReopenGuardUntil = 0;
  function shouldPersistTheme() { return (prefs.themeSave || DEFAULT_PREFS.themeSave) === 'on'; }
  const themeRuntimeApi = window.WQTheme || null;
  function renderThemeOptionsHook(...args) {
    return (window.WQThemeRegistry?.renderThemeOptions?.(...args)) || null;
  }
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
  var homeCoachRibbon = null;
  var wordQuestCoachRibbon = null;
  var _wqDiagSession = null;
  var _wqDiagTimer = null;
  var _latestSavedSessionId = '';
  var _activeEvidenceSessionId = '';
  var wordQuestCoachKey = 'before_guess';
  var avaWqWrongStreak = 0;
  var avaWqCorrectStreak = 0;
  var avaWqTotalWrong = 0;
  var avaWqTotalCorrect = 0;
  var avaWqRapidEvents = [];
  var avaWqLastActionAt = Date.now();
  var avaWqLastIdleEmitAt = 0;
  var avaWqIdleTimer = 0;
  var avaWqIdleFiredThisRound = false;
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
  function stopDemoKeyPulse() {
    if (demoFlow?.clearDemoKeyPulseTimer) {
      demoFlow.clearDemoKeyPulseTimer(demoState);
      return;
    }
    if (!demoState.keyPulseTimer) return;
    clearTimeout(demoState.keyPulseTimer);
    demoState.keyPulseTimer = 0;
  }

  function stopDemoCoachReadyLoop() {
    if (demoFlow?.stopDemoCoachReadyTimer) {
      demoFlow.stopDemoCoachReadyTimer(demoCoachReadyTimer, (value) => { demoCoachReadyTimer = value; });
      return;
    }
    if (!demoCoachReadyTimer) return;
    clearTimeout(demoCoachReadyTimer);
    if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
      window.__CS_DEMO_TIMERS.delete(demoCoachReadyTimer);
    }
    demoCoachReadyTimer = 0;
  }

  function clearDemoAutoplayTimer() {
    if (demoFlow?.stopDemoAutoplayTimerById) {
      demoFlow.stopDemoAutoplayTimerById(demoAutoplayTimer, (value) => { demoAutoplayTimer = value; });
      return;
    }
    if (!demoAutoplayTimer) return;
    clearTimeout(demoAutoplayTimer);
    if (window.__CS_DEMO_TIMERS && typeof window.__CS_DEMO_TIMERS.delete === 'function') {
      window.__CS_DEMO_TIMERS.delete(demoAutoplayTimer);
    }
    demoAutoplayTimer = 0;
  }

  function renderDemoDebugReadout() {
    if (demoFlow?.renderDemoDebugOverlay) {
      demoFlow.renderDemoDebugOverlay(demoState);
      return;
    }
    if (!DEMO_MODE || !DEMO_DEBUG_MODE) return;
    if (!demoDebugLabelEl) {
      const label = document.createElement('div');
      label.id = 'wq-demo-debug';
      label.className = 'wq-demo-debug';
      document.body.appendChild(label);
      demoDebugLabelEl = label;
    }
    const coachMounted = demoState.coachMounted ? 'true' : 'false';
    demoDebugLabelEl.textContent = `demo:1 overlaysClosed:true coachMounted:${coachMounted}`;
  }

  function isMissionLabEnabled() {
    return startupRuntime?.isMissionLabEnabled?.() || MISSION_LAB_ENABLED;
  }

  function normalizePageMode(mode) {
    return startupRuntime?.normalizePageMode?.(mode) || 'wordquest';
  }

  function readPageModeFromQuery() {
    return startupRuntime?.readPageModeFromQuery?.() || 'wordquest';
  }

  function loadStoredPageMode() {
    return startupRuntime?.loadStoredPageMode?.() || 'wordquest';
  }

  function persistPageMode(mode) {
    startupRuntime?.persistPageMode?.(mode);
  }

  function getThemeFamily(themeId) {
    return startupRuntime?.getThemeFamily?.(themeId) || 'core';
  }

  const AUTO_MUSIC_BY_THEME = window.WQAppRuntimeConfig?.AUTO_MUSIC_BY_THEME || Object.freeze({});
  const AUTO_MUSIC_BY_FAMILY = window.WQAppRuntimeConfig?.AUTO_MUSIC_BY_FAMILY || Object.freeze({});
  const CHUNK_TAB_FOCUS_KEYS = new Set(window.WQAppRuntimeConfig?.CHUNK_TAB_FOCUS_KEYS || []);
  const SUBJECT_FOCUS_GRADE = window.WQAppRuntimeConfig?.SUBJECT_FOCUS_GRADE || Object.freeze({});
  const TEAM_LABEL_SETS = window.WQAppRuntimeConfig?.TEAM_LABEL_SETS || Object.freeze({});
  const getCurriculumLengthForFocus = FOCUS_CURRICULUM_HELPERS.getCurriculumLengthForFocus || ((focusValue, fallback = 'any') => String(fallback || 'any').trim() || 'any');
  const CURRICULUM_LESSON_PACKS = window.WQAppRuntimeConfig?.CURRICULUM_LESSON_PACKS || Object.freeze({
    custom: Object.freeze({
      label: 'Manual (no pack)',
      targets: Object.freeze([])
    })
  });
  const CURRICULUM_PACK_ORDER = RUNTIME_CONSTANTS.CURRICULUM_PACK_ORDER || Object.freeze(['ufli', 'fundations', 'wilson', 'lexiawida', 'justwords']);

  function getThemeFallback() {
    return startupRuntime?.getThemeFallback?.() || 'seahawks';
  }

  function normalizeTheme(theme, fallback = getThemeFallback()) {
    return startupRuntime?.normalizeTheme?.(theme, fallback) || fallback;
  }

  function readThemeFromQuery() {
    return startupRuntime?.readThemeFromQuery?.() || '';
  }

  function normalizeMusicMode(mode) {
    return mediaRuntime?.normalizeMusicMode?.(mode) || DEFAULT_PREFS.music;
  }

  function normalizeVoiceMode(mode) {
    return mediaRuntime?.normalizeVoiceMode?.(mode) || DEFAULT_PREFS.voice;
  }

  function normalizeRevealPacing(mode) {
    return mediaRuntime?.normalizeRevealPacing?.(mode) || DEFAULT_PREFS.revealPacing;
  }

  function normalizeRevealAutoNext(mode) {
    return mediaRuntime?.normalizeRevealAutoNext?.(mode) || DEFAULT_PREFS.revealAutoNext;
  }

  function normalizeTeamMode(mode) {
    return mediaRuntime?.normalizeTeamMode?.(mode) || DEFAULT_PREFS.teamMode;
  }

  function normalizeTeamCount(value) {
    return mediaRuntime?.normalizeTeamCount?.(value) || DEFAULT_PREFS.teamCount;
  }

  function normalizeTurnTimer(value) {
    return mediaRuntime?.normalizeTurnTimer?.(value) || DEFAULT_PREFS.turnTimer;
  }

  function normalizeTeamSet(value) {
    return mediaRuntime?.normalizeTeamSet?.(value) || DEFAULT_PREFS.teamSet;
  }

  function normalizeReportCompactMode(value) {
    return mediaRuntime?.normalizeReportCompactMode?.(value) || DEFAULT_PREFS.reportCompact;
  }

  function normalizeMasterySort(value) {
    return mediaRuntime?.normalizeMasterySort?.(value) || 'attempts_desc';
  }

  function normalizeMasteryFilter(value) {
    return mediaRuntime?.normalizeMasteryFilter?.(value) || 'all';
  }

  function resolveAutoMusicMode(themeId) {
    return mediaRuntime?.resolveAutoMusicMode?.(themeId) || 'chill';
  }

  function updateMusicStatus(selectedMode, activeMode) {
    mediaRuntime?.updateMusicStatus?.(selectedMode, activeMode);
  }

  function syncMediaSessionControls(selectedMode, activeMode) {
    mediaRuntime?.syncMediaSessionControls?.(selectedMode, activeMode);
  }

  function syncQuickMusicDock(selectedMode, activeMode) {
    mediaRuntime?.syncQuickMusicDock?.(selectedMode, activeMode);
  }

  function syncQuickMusicVolume(value) {
    mediaRuntime?.syncQuickMusicVolume?.(value);
  }

  function getPreferredMusicOnMode() {
    return mediaRuntime?.getPreferredMusicOnMode?.() || 'auto';
  }

  function toggleMusicQuick() {
    mediaRuntime?.toggleMusicQuick?.();
  }

  function getCurrentMusicVibeForControls() {
    return mediaRuntime?.getCurrentMusicVibeForControls?.() || 'auto';
  }

  function applyMusicModeFromQuick(mode, options = {}) {
    mediaRuntime?.applyMusicModeFromQuick?.(mode, options);
  }

  function stepMusicVibe(direction = 1) {
    mediaRuntime?.stepMusicVibe?.(direction);
  }

  function shuffleMusicVibe() {
    mediaRuntime?.shuffleMusicVibe?.();
  }

  function setLocalMusicFiles(fileList) {
    mediaRuntime?.setLocalMusicFiles?.(fileList);
  }

  function clearLocalMusicFiles() {
    mediaRuntime?.clearLocalMusicFiles?.();
  }

  function syncMusicForTheme(options = {}) {
    mediaRuntime?.syncMusicForTheme?.(options);
  }

  startupRuntime?.initializeStartupPreferences?.();

  // ─── 4. Theme / projector / motion helpers ──────────
  function applyTheme(name) {
    const beforeTheme = normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback());
    const normalized = playSettingsRuntime?.applyTheme?.(name) || normalizeTheme(name, getThemeFallback());
    document.documentElement.setAttribute('data-theme-family', getThemeFamily(normalized));
    const select = _el('s-theme');
    if (select && select.value !== normalized) select.value = normalized;
    if (beforeTheme !== normalized) {
      emitTelemetry('wq_theme_change', {
        from_theme: beforeTheme,
        to_theme: normalized
      });
    }
    return normalized;
  }

  function applyProjector(mode) {
    playSettingsRuntime?.applyProjector?.(mode);
  }

  function applyUiSkin(mode, options = {}) {
    return playSettingsRuntime?.applyUiSkin?.(mode, options) || normalizeUiSkin(mode);
  }

  function applyMotion(mode) {
    playSettingsRuntime?.applyMotion?.(mode);
  }

  function applyHint(mode) {
    playSettingsRuntime?.applyHint?.(mode);
  }

  function applyReportCompactMode(mode, options = {}) {
    return playSettingsRuntime?.applyReportCompactMode?.(mode, options) || normalizeReportCompactMode(mode);
  }

  function getRevealFocusMode() {
    return playSettingsRuntime?.getRevealFocusMode?.() || 'on';
  }

  function getRevealPacingMode() {
    return playSettingsRuntime?.getRevealPacingMode?.() || DEFAULT_PREFS.revealPacing;
  }

  function syncRevealFocusModalSections() {
    playSettingsRuntime?.syncRevealFocusModalSections?.();
  }

  function applyRevealFocusMode(mode, options = {}) {
    return playSettingsRuntime?.applyRevealFocusMode?.(mode, options) || 'on';
  }

  var lastAssessmentLockNoticeAt = 0;

  function isAssessmentLockEnabled() {
    return playSettingsRuntime?.isAssessmentLockEnabled?.() || false;
  }

  function isAssessmentRoundLocked() {
    return playSettingsRuntime?.isAssessmentRoundLocked?.() || false;
  }

  function showAssessmentLockNotice(message = 'Assessment lock is on until this round ends.') {
    playSettingsRuntime?.showAssessmentLockNotice?.(message);
  }

  function syncAssessmentLockRuntime(options = {}) {
    playSettingsRuntime?.syncAssessmentLockRuntime?.(options);
  }

  function getHintMode() {
    return playSettingsRuntime?.getHintMode?.() || 'on';
  }

  function isConfidenceCoachingEnabled() {
    return playSettingsRuntime?.isConfidenceCoachingEnabled?.() || false;
  }

  function setConfidenceCoachingMode(enabled, options = {}) {
    playSettingsRuntime?.setConfidenceCoachingMode?.(enabled, options);
  }

  function syncHintToggleUI(mode = getHintMode()) {
    playSettingsRuntime?.syncHintToggleUI?.(mode);
  }

  function setHintMode(mode, options = {}) {
    playSettingsRuntime?.setHintMode?.(mode, options);
  }

  function normalizePlayStyle(mode) {
    return playSettingsRuntime?.normalizePlayStyle?.(mode) || (String(mode || '').toLowerCase() === 'listening' ? 'listening' : 'detective');
  }

  function syncPlayStyleToggleUI(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    playSettingsRuntime?.syncPlayStyleToggleUI?.(mode);
  }

  function clearFocusSupportUnlockTimer() {
    playSettingsRuntime?.clearFocusSupportUnlockTimer?.();
  }

  function scheduleFocusSupportUnlock() {
    playSettingsRuntime?.scheduleFocusSupportUnlock?.();
  }

  function clearSupportModalTimer() {
    playSettingsRuntime?.clearSupportModalTimer?.();
  }

  function scheduleSupportModalTimer() {
    playSettingsRuntime?.scheduleSupportModalTimer?.();
  }

  function syncHeaderClueLauncherUI(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    playSettingsRuntime?.syncHeaderClueLauncherUI?.(mode);
  }

  function getStarterWordMode() {
    return playSettingsRuntime?.getStarterWordMode?.() || 'on_demand';
  }

  function syncStarterWordLauncherUI(mode = getStarterWordMode()) {
    playSettingsRuntime?.syncStarterWordLauncherUI?.(mode);
  }

  function applyStarterWordMode(mode, options = {}) {
    return playSettingsRuntime?.applyStarterWordMode?.(mode, options) || normalizeStarterWordMode(mode);
  }

  function hideListeningModeExplainer() {
    playSettingsRuntime?.syncGameplayAudioStrip?.(normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle));
    _el('listening-mode-overlay')?.classList.add('hidden');
  }

  function showListeningModeExplainer() {
    // Disabled by request: avoid interruptive explainer popup.
    hideListeningModeExplainer();
  }

  function syncGameplayAudioStrip(mode = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle)) {
    playSettingsRuntime?.syncGameplayAudioStrip?.(mode);
  }

  function applyPlayStyle(mode, options = {}) {
    return playSettingsRuntime?.applyPlayStyle?.(mode, options) || normalizePlayStyle(mode);
  }

  function isAnyOverlayModalOpen() {
    const revealOpen = !_el('modal-overlay')?.classList.contains('hidden');
    const missionOpen = !_el('challenge-modal')?.classList.contains('hidden');
    const setupOpen = !_el('first-run-setup-modal')?.classList.contains('hidden');
    const listeningOpen = !_el('listening-mode-overlay')?.classList.contains('hidden');
    return !!(revealOpen || missionOpen || setupOpen || listeningOpen);
  }


  var starterCoachTimer = 0;
  var informantHintHideTimer = 0;

  const SOR_HINT_PROFILES = window.WQGuidanceConfig?.SOR_HINT_PROFILES || Object.freeze({});

  function clearInformantHintHideTimer() { supportUi?.clearInformantHintHideTimer?.(); }
  function normalizeHintCategoryFromFocusTag(...args) { return supportLogic?.normalizeHintCategoryFromFocusTag?.(...args) || 'general'; }
  function detectHintCategoryFromWord(...args) { return supportLogic?.detectHintCategoryFromWord?.(...args) || 'cvc'; }
  function buildLiveHintExample(...args) { return supportLogic?.buildLiveHintExample?.(...args) || null; }
  function buildFriendlyHintMessage(...args) { return supportLogic?.buildFriendlyHintMessage?.(...args) || ''; }
  function getHintUnlockMinimum(...args) { return supportLogic?.getHintUnlockMinimum?.(...args) || 1; }
  function getHintUnlockCopy(...args) { return supportLogic?.getHintUnlockCopy?.(...args) || { unlocked: true, minimum: 1, message: '' }; }
  function renderHintExamples(...args) { supportUi?.renderHintExamples?.(...args); }
  function scheduleStarterCoachHint() { supportUi?.scheduleStarterCoachHint?.(); }
  function maybeAutoShowStarterWords(state) {
    if (!focusSupportUnlockedByMiss || currentRoundStarterWordsShown) return;
    showSupportChoiceCard(state);
  }

  function applyFeedback(mode) { surfaceSettingsRuntime?.applyFeedback?.(mode); }
  function applyBoardStyle(mode) { return surfaceSettingsRuntime?.applyBoardStyle?.(mode) || DEFAULT_PREFS.boardStyle; }
  function applyKeyStyle(mode) { return surfaceSettingsRuntime?.applyKeyStyle?.(mode) || DEFAULT_PREFS.keyStyle; }
  function normalizeHeaderControlLayout() { surfaceSettingsRuntime?.normalizeHeaderControlLayout?.(); }
  function syncWritingStudioAvailability() { surfaceSettingsRuntime?.syncWritingStudioAvailability?.(); }
  function getHeaderIconMarkup(kind) { return surfaceSettingsRuntime?.getHeaderIconMarkup?.(kind) || ''; }
  function syncHeaderStaticIcons() { surfaceSettingsRuntime?.syncHeaderStaticIcons?.(); }
  function applyKeyboardLayout(mode) { return surfaceSettingsRuntime?.applyKeyboardLayout?.(mode) || normalizeKeyboardLayout(mode); }
  function syncCaseToggleUI() { surfaceSettingsRuntime?.syncCaseToggleUI?.(); }
  function applyChunkTabsMode(mode) { return surfaceSettingsRuntime?.applyChunkTabsMode?.(mode) || 'auto'; }
  function applyAtmosphere(mode) { return surfaceSettingsRuntime?.applyAtmosphere?.(mode) || DEFAULT_PREFS.atmosphere; }
  function applyTextSize(mode) { return surfaceSettingsRuntime?.applyTextSize?.(mode) || normalizeTextSize(mode); }
  function updateWilsonModeToggle() { surfaceSettingsRuntime?.updateWilsonModeToggle?.(); }
  function applyWilsonMode(enabled) { surfaceSettingsRuntime?.applyWilsonMode?.(enabled); }

  function isSorNotationEnabled() { return surfaceSettingsRuntime?.isSorNotationEnabled?.() || false; }
  function normalizeVoicePracticeMode(mode) { return surfaceSettingsRuntime?.normalizeVoicePracticeMode?.(mode) || 'optional'; }

  function getVoicePracticeMode() {
    return !STUDENT_RECORDING_ENABLED ? 'off' : normalizeVoicePracticeMode(_el('s-voice-task')?.value || prefs.voicePractice || DEFAULT_PREFS.voicePractice);
  }

  function setVoicePracticeMode(mode, options = {}) { return surfaceSettingsRuntime?.setVoicePracticeMode?.(mode, options) || 'optional'; }
  function areBoostPopupsEnabled() { return surfaceSettingsRuntime?.areBoostPopupsEnabled?.() || false; }
  function detectTeacherPreset() { return surfaceSettingsRuntime?.detectTeacherPreset?.() || ''; }

  const shouldOfferStartupPreset = !(settingsRuntime?.hasCompletedFirstRunSetup?.()) && !(settingsRuntime?.launchedFromGameGallery?.());
  firstRunSetupPending = shouldOfferStartupPreset;

  function markDiagnosticsReset(reason = 'maintenance') { return surfaceSettingsRuntime?.markDiagnosticsReset?.(reason) || { ts: Date.now(), reason }; }

  async function resetAppearanceAndCache() {
    await maintenanceRuntime?.resetAppearanceAndCache?.({
      applyMotion,
      applyPlayStyle,
      applyProjector,
      applyTheme,
      applyUiSkin,
      isAssessmentRoundLocked
    });
  }

  async function runForceUpdateNow(options = {}) { await maintenanceRuntime?.runForceUpdateNow?.(options); }
  async function forceUpdateNow() { await maintenanceRuntime?.forceUpdateNow?.(); }
  function initRefreshLatestBanner() { surfaceSettingsRuntime?.initRefreshLatestBanner?.(); }
  function rerunOnboardingSetup() { surfaceSettingsRuntime?.rerunOnboardingSetup?.(); }
  function populateVoiceSelector() { surfaceSettingsRuntime?.populateVoiceSelector?.(); }
  function normalizeReviewWord(word) { return surfaceSettingsRuntime?.normalizeReviewWord?.(word) || ''; }

  wordReview = gameplayStats;

  function buildPlayableWordSet(gradeBand, lengthPref, focusValue) { return wordReview?.buildPlayableWordSet?.(gradeBand, lengthPref, focusValue) || new Set(); }
  function primeShuffleBagWithWord(scope, word) { maintenanceRuntime?.primeShuffleBagWithWord?.(scope, word); }

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

  function isTeamModeEnabled() { return surfaceSettingsRuntime?.isTeamModeEnabled?.() || false; }
  function isHelpSuppressedForTeamMode() { return surfaceSettingsRuntime?.isHelpSuppressedForTeamMode?.() || false; }
  function syncTeamHelpSuppressionUI() { surfaceSettingsRuntime?.syncTeamHelpSuppressionUI?.(); }
  function getTeamCount() { return inputConstraints?.getTeamCount?.() || 2; }
  function getTurnTimerSeconds() { return inputConstraints?.getTurnTimerSeconds?.() || 0; }
  function getTeamSet() { return inputConstraints?.getTeamSet?.() || normalizeTeamSet(_el('s-team-set')?.value || prefs.teamSet || DEFAULT_PREFS.teamSet); }
  function pulseBlockedLetterKey(letter) { inputConstraints?.pulseBlockedLetterKey?.(letter); }
  function maybeShowBlockedLetterToast(letter) { inputConstraints?.maybeShowBlockedLetterToast?.(letter); }
  function syncKeyboardInputLocks(state, wordState) { inputConstraints?.syncKeyboardInputLocks?.(state, wordState); }

  function refreshStarterSuggestionsIfOpen() {
    const card = _el('starter-word-card');
    if (!card || card.classList.contains('hidden')) return;
    showStarterWordCard({ source: 'manual' });
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
    classroomTurns?.updateClassroomTurnLine?.();
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

  window.CSRoute = Object.assign(window.CSRoute || {}, { routeTo });

  // Always land in WordQuest first. Deep Dive opens only from the dedicated tab button.
  pageMode = 'wordquest';
  persistPageMode('wordquest');
  shellRuntime?.updatePageModeUrl?.('wordquest');
  coachRuntime?.initCoachRibbons?.();
  initializeHomeMode();
  applyHashRoute();
  csSyncHeaderTitleCenter();
  coachRuntime?.updateHomeCoachRibbon?.();
  coachRuntime?.setWordQuestCoachState?.('before_guess');
  coachRuntime?.startAvaWordQuestIdleWatcher?.();
  logOverflow('init');
  syncPlayToolsRoleVisibility();

  settingsRuntime?.setSettingsView?.('quick');
  syncPageModeUI();
  syncHeaderControlsVisibility();
  classroomTurns?.syncClassroomTurnRuntime?.({ resetTurn: true });
  settingsRuntime?.syncTeacherPresetButtons?.();
  syncAssessmentLockRuntime({ closeFocus: false });
  settingsRuntime?.bindFirstRunSetupModal?.({ get: () => firstRunSetupPending, set: (value) => { firstRunSetupPending = !!value; } });
  enableDraggableSupportChoiceCard();
  settingsRuntime?.bindSettingsModeCards?.();
  panelRuntime?.init?.();
  preferencesRuntime?.init?.();
  sessionControls?.init?.();
  musicRuntime?.init?.();
  playSurfaceBindings?.init?.();
  inputShell?.init?.();
  standaloneMission?.bindWindowLifecycle?.();
  if (firstRunSetupPending) {
    settingsRuntime?.openFirstRunSetupModal?.(firstRunSetupPending);
  }
  initRefreshLatestBanner();

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
  const VOICE_PRIVACY_TOAST_KEY = RUNTIME_CONSTANTS.VOICE_PRIVACY_TOAST_KEY || 'wq_voice_privacy_toast_seen_v1';
  const VOICE_CAPTURE_MS = RUNTIME_CONSTANTS.VOICE_CAPTURE_MS || 3000;
  const VOICE_COUNTDOWN_SECONDS = RUNTIME_CONSTANTS.VOICE_COUNTDOWN_SECONDS || 3;
  const VOICE_HISTORY_KEY = RUNTIME_CONSTANTS.VOICE_HISTORY_KEY || 'wq_v2_voice_history_v1';
  const VOICE_HISTORY_LIMIT = RUNTIME_CONSTANTS.VOICE_HISTORY_LIMIT || 3;

  var voiceHistory = voiceSupport?.loadVoiceHistory?.() || [];
  async function startVoiceRecording() {
    if (voiceIsRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoicePracticeFeedback('Recording is not available on this device.', true);
      return;
    }
    voiceSupport?.clearVoiceCountdownTimer?.();
    voiceCountdownToken += 1;
    const countdownToken = voiceCountdownToken;
    let secondsLeft = VOICE_COUNTDOWN_SECONDS;
    voiceSupport?.setVoiceRecordingUI?.(false);
    setVoicePracticeFeedback(`Get ready... recording starts in ${secondsLeft}.`);
    voiceCountdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (!voiceCountdownTimer || countdownToken !== voiceCountdownToken) return;
      if (secondsLeft > 0) {
        setVoicePracticeFeedback(`Get ready... recording starts in ${secondsLeft}.`);
        voiceSupport?.setVoiceRecordingUI?.(false);
        return;
      }
      voiceSupport?.clearVoiceCountdownTimer?.();
    }, 1000);
    voiceSupport?.setVoiceRecordingUI?.(false);
    await waitMs(VOICE_COUNTDOWN_SECONDS * 1000);
    if (countdownToken !== voiceCountdownToken) return;
    studentSessionRuntime?.recordVoiceAttempt?.();
    try {
      voiceSupport?.clearVoiceClip?.();
      voiceTakeComplete = false;
      voiceChunks = [];
      setVoicePracticeFeedback('Recording now...');
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceRecorder = new MediaRecorder(voiceStream);
      voiceRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) voiceChunks.push(event.data);
      });
      voiceRecorder.addEventListener('stop', () => {
        voiceSupport?.clearVoiceAutoStopTimer?.();
        voiceIsRecording = false;
        voiceSupport?.setVoiceRecordingUI?.(false);
        voiceSupport?.stopVoiceVisualizer?.();
        voiceSupport?.stopVoiceStream?.();
        const blob = new Blob(voiceChunks, { type: voiceChunks[0]?.type || 'audio/webm' });
        if (!blob.size) {
          setVoicePracticeFeedback('No audio captured. Please try again.', true);
          return;
        }
        voiceClipBlob = blob;
        voiceClipUrl = URL.createObjectURL(blob);
        voiceTakeComplete = true;
        if (revealChallengeState) deepDiveCoreRuntime?.setChallengeTaskComplete?.('listen', true);
        const playBtn = _el('voice-play-btn');
        if (playBtn) playBtn.disabled = false;
        const saveBtn = _el('voice-save-btn');
        if (saveBtn) saveBtn.disabled = false;
        setVoicePracticeFeedback('Analyzing your clip...');
        updateVoicePracticePanel(WQGame.getState());
        void (voiceSupport?.analyzeVoiceClip?.(blob) || Promise.resolve(null)).then((analysis) => {
          if (!voiceClipBlob || voiceClipBlob !== blob) return;
          const review = voiceSupport?.buildVoiceFeedback?.(analysis, WQGame.getState()?.entry || null) || {
            message: 'Clip captured. Play it back, compare with model audio.',
            tone: 'default',
            score: 60,
            label: 'Captured'
          };
          setVoicePracticeFeedback(review.message, review.tone);
          voiceSupport?.appendVoiceHistory?.(review);
        });
      });
      voiceIsRecording = true;
      voiceSupport?.setVoiceRecordingUI?.(true);
      setVoicePracticeFeedback('Recording for 3 seconds...');
      if (localStorage.getItem(VOICE_PRIVACY_TOAST_KEY) !== 'seen') {
        WQUI.showToast('Voice recordings stay on this device only. Nothing is uploaded.');
        localStorage.setItem(VOICE_PRIVACY_TOAST_KEY, 'seen');
      }
      voiceSupport?.clearVoiceAutoStopTimer?.();
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
      voiceSupport?.setVoiceRecordingUI?.(false);
      voiceSupport?.clearVoiceAutoStopTimer?.();
      voiceSupport?.stopVoiceVisualizer?.();
      voiceSupport?.stopVoiceStream?.();
    }
  }

  function stopVoiceRecording(options = {}) {
    voiceSupport?.clearVoiceAutoStopTimer?.();
    if (voiceRecorder && voiceRecorder.state !== 'inactive') {
      voiceRecorder.stop();
      const reason = String(options.reason || 'manual');
      setVoicePracticeFeedback(reason === 'auto' ? 'Saving your 3-second clip...' : 'Saving your recording...');
    } else {
      voiceSupport?.stopVoiceCaptureNow?.();
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
  voiceSupport?.installRevealModalPatch?.();
  installResponsiveLayoutPatch();

  // ─── 6. Focus + grade alignment ─────────────────────

  var lessonPackApplying = false;

  function getLessonPackSelectElements() { return focusCurriculumRuntime?.getLessonPackSelectElements?.() || []; }
  function getLessonTargetSelectElements() { return focusCurriculumRuntime?.getLessonTargetSelectElements?.() || []; }
  function getLessonPackDefinition(packId) { return focusCurriculumRuntime?.getLessonPackDefinition?.(packId) || CURRICULUM_LESSON_PACKS.custom; }
  function normalizeLessonPackId(packId) { return focusCurriculumRuntime?.normalizeLessonPackId?.(packId) || 'custom'; }
  function normalizeLessonTargetId(packId, targetId) { return focusCurriculumRuntime?.normalizeLessonTargetId?.(packId, targetId) || 'custom'; }
  function getLessonTarget(packId, targetId) { return focusCurriculumRuntime?.getLessonTarget?.(packId, targetId) || null; }
  function formatLengthPrefLabel(value) { return focusCurriculumRuntime?.formatLengthPrefLabel?.(value) || `${value}-letter`; }
  function stripPacingMonthWindow(pacingLabel) { return focusCurriculumRuntime?.stripPacingMonthWindow?.(pacingLabel) || ''; }
  function formatLessonTargetPacing(target, options = {}) { return focusCurriculumRuntime?.formatLessonTargetPacing?.(target, options) || 'Flexible schedule'; }
  function formatLessonTargetOptionLabel(target) { return focusCurriculumRuntime?.formatLessonTargetOptionLabel?.(target) || ''; }
  function parsePacingWeekRange(pacingLabel) { return focusCurriculumRuntime?.parsePacingWeekRange?.(pacingLabel) || null; }
  function getSchoolYearStartDate() { return new Date(); }
  function getCurrentSchoolWeek() { return focusCurriculumRuntime?.getCurrentSchoolWeek?.() || 1; }
  function getCurrentWeekRecommendedLessonTarget(packId) { return focusCurriculumRuntime?.getCurrentWeekRecommendedLessonTarget?.(packId) || null; }
  function resolveDefaultLessonTargetId(packId) { return focusCurriculumRuntime?.resolveDefaultLessonTargetId?.(packId) || 'custom'; }
  function populateLessonTargetSelect(packId, preferredTarget = 'custom') { return focusCurriculumRuntime?.populateLessonTargetSelect?.(packId, preferredTarget) || 'custom'; }
  function setLessonPackPrefs(packId, targetId) { return focusCurriculumRuntime?.setLessonPackPrefs?.(packId, targetId) || { packId: 'custom', targetId: 'custom' }; }
  function updateLessonPackWeekRecommendation(packId, targetId) { focusCurriculumRuntime?.updateLessonPackWeekRecommendation?.(packId, targetId); }
  function updateLessonPackNote(packId, targetId) { focusCurriculumRuntime?.updateLessonPackNote?.(packId, targetId); }
  function syncLessonPackControlsFromPrefs(options = {}) { return focusCurriculumRuntime?.syncLessonPackControlsFromPrefs?.(options) || { packId: 'custom', targetId: 'custom' }; }
  function applyLessonTargetConfig(packId, targetId, options = {}) { return focusCurriculumRuntime?.applyLessonTargetConfig?.(packId, targetId, options) || false; }
  function releaseLessonPackToManualMode() { focusCurriculumRuntime?.releaseLessonPackToManualMode?.(); }
  function parseFocusPreset(value) { return focusGradeRuntime?.parseFocusPreset?.(value) || { kind: 'classic', focus: 'all' }; }
  function getRecommendedLengthForFocus(focusValue) { return focusGradeRuntime?.getRecommendedLengthForFocus?.(focusValue) || DEFAULT_PREFS.length; }

  function refreshBoardForLengthChange() {
    if (isAssessmentRoundLocked()) return false;
    const state = WQGame.getState?.() || null;
    if (!state?.word || state?.gameOver) {
      newGame();
      return true;
    }
    const hasProgress = Boolean((state?.guesses?.length || 0) > 0 || String(state?.guess || '').length > 0);
    if (hasProgress) return false;
    newGame();
    return true;
  }

  function syncLengthFromFocus(focusValue, options = {}) { return focusGradeRuntime?.syncLengthFromFocus?.(focusValue, options) || false; }
  function getEffectiveGameplayGradeBand(selectedGradeBand, focusValue = 'all') { return focusGradeRuntime?.getEffectiveGameplayGradeBand?.(selectedGradeBand, focusValue) || SAFE_DEFAULT_GRADE_BAND; }
  function shouldExpandGradeBandForFocus(focusValue = 'all') { return focusGradeRuntime?.shouldExpandGradeBandForFocus?.(focusValue) || false; }
  function applyAllGradeLengthDefault(options = {}) { return focusGradeRuntime?.applyAllGradeLengthDefault?.(options) || false; }
  function enforceClassicFiveLetterDefault(options = {}) { return focusGradeRuntime?.enforceClassicFiveLetterDefault?.(options) || false; }

  function syncGradeFromFocus(focusValue, options = {}) { focusGradeRuntime?.syncGradeFromFocus?.(focusValue, options); updateGradeTargetInline(); }

  function updateFocusHint() { focusGradeRuntime?.updateFocusHint?.(); }
  function syncChunkTabsVisibility() { focusGradeRuntime?.syncChunkTabsVisibility?.(); }
  function updateFocusGradeNote() { focusGradeRuntime?.updateFocusGradeNote?.(); }
  function getFocusDisplayLabel(value, fallback = '') { return focusGradeRuntime?.getFocusDisplayLabel?.(value, fallback) || String(fallback || value || '').trim(); }
  function getFocusDisplayGroup(value, fallbackGroup = '') { return focusGradeRuntime?.getFocusDisplayGroup?.(value, fallbackGroup) || String(fallbackGroup || 'General').trim() || 'General'; }
  function normalizeQuestGradeBand(value) { return focusGradeRuntime?.normalizeQuestGradeBand?.(value) || 'all'; }
  function getQuestFilterGradeBand() { return normalizeQuestGradeBand(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade); }
  function isEntryGradeBandCompatible(selectedGradeBand, entryGradeBand) { return focusGradeRuntime?.isEntryGradeBandCompatible?.(selectedGradeBand, entryGradeBand) || true; }
  function getFocusSuggestedGradeBand(value) { return focusGradeRuntime?.getFocusSuggestedGradeBand?.(value) || ''; }
  function isFocusValueCompatibleWithGrade(value, selectedGradeBand = getQuestFilterGradeBand()) { return focusGradeRuntime?.isFocusValueCompatibleWithGrade?.(value, selectedGradeBand) || true; }
  function getCurriculumTargetsForGrade(packId, selectedGradeBand = getQuestFilterGradeBand(), options = {}) { return focusGradeRuntime?.getCurriculumTargetsForGrade?.(packId, selectedGradeBand, options) || []; }
  function getFocusEntries(selectedGradeBand = getQuestFilterGradeBand()) { return focusGradeRuntime?.getFocusEntries?.(selectedGradeBand) || []; }
  function getCurriculumProgramEntries(selectedGradeBand = getQuestFilterGradeBand()) { return focusGradeRuntime?.getCurriculumProgramEntries?.(selectedGradeBand) || []; }
  function getCurriculumQuestEntries(packFilter = '', selectedGradeBand = getQuestFilterGradeBand()) { return focusGradeRuntime?.getCurriculumQuestEntries?.(packFilter, selectedGradeBand) || []; }
  function getQuestEntries(selectedGradeBand = getQuestFilterGradeBand()) { return focusGradeRuntime?.getQuestEntries?.(selectedGradeBand) || []; }

  function getFocusLabel(value) {
    const select = _el('setting-focus');
    if (!select) return '— Classic (Wordle 5x6) —';
    const option = Array.from(select.options).find((entry) => entry.value === value);
    return getFocusDisplayLabel(String(value || '').trim(), String(option?.textContent || '— Classic (Wordle 5x6) —').trim());
  }

  function clearPinnedFocusSearchValue(inputEl) { focusGradeRuntime?.clearPinnedFocusSearchValue?.(inputEl); }
  function updateFocusSummaryLabel() { focusGradeRuntime?.updateFocusSummaryLabel?.(); }
  function formatGradeBandLabel(value) { return focusGradeRuntime?.formatGradeBandLabel?.(value) || String(value || ''); }
  function formatGradeBandInlineLabel(value) { return focusGradeRuntime?.formatGradeBandInlineLabel?.(value) || formatGradeBandLabel(value); }
  function updateGradeTargetInline() { focusGradeRuntime?.updateGradeTargetInline?.(); }

  function updateActiveGradeLockChip(gradeLabel, fromSubjectPreset) {
    const chipEl = _el('active-grade-lock-chip');
    if (!chipEl) return;
    const sourceLabel = fromSubjectPreset ? 'subject preset' : 'teacher/session grade';
    chipEl.textContent = `Active Grade Band locked: ${gradeLabel}`;
    chipEl.setAttribute('title', `New rounds use ${gradeLabel} from ${sourceLabel}.`);
  }

  function syncPlayHeaderCopy() { focusGradeRuntime?.syncPlayHeaderCopy?.(); }
  function syncQuickSetupControls() { focusGradeRuntime?.syncQuickSetupControls?.(); }

  function setFocusSearchOpen(isOpen) {
    document.documentElement.setAttribute('data-focus-search-open', isOpen ? 'true' : 'false');
    if (isOpen) closeQuickPopover('all');
    settingsRuntime?.syncThemePreviewStripVisibility?.();
  }

  function renderFocusSearchList(rawQuery = '', options = {}) { focusSearchRuntime?.renderFocusSearchList?.(rawQuery, options); }
  function closeFocusSearchList() { focusSearchRuntime?.closeFocusSearchList?.(); }
  function setFocusValue(nextValue, options = {}) { focusSearchRuntime?.setFocusValue?.(nextValue, options); }
  focusSearchRuntime?.installFocusDataPatch?.();
  focusSearchRuntime?.bindFocusControls?.();
  focusSearchRuntime?.initializeFocusRuntime?.();

  // ─── 7. New game ────────────────────────────────────
  var midgameBoostShown = false;

  const ERROR_PATTERN_LABELS = window.WQGuidanceConfig?.ERROR_PATTERN_LABELS || Object.freeze({});
  const ERROR_COACH_COPY = window.WQGuidanceConfig?.ERROR_COACH_COPY || Object.freeze({});
  const ERROR_NEXT_STEP_COPY = window.WQGuidanceConfig?.ERROR_NEXT_STEP_COPY || Object.freeze({});
  const ERROR_MINI_LESSON_PLANS = window.WQGuidanceConfig?.ERROR_MINI_LESSON_PLANS || Object.freeze({});

  function syncRoundTrackingLocals() { gameplayStats?.syncRoundTrackingLocals?.(); }
  function resetRoundTracking(nextResult = null) { gameplayStats?.resetRoundTrackingAndSync?.(nextResult); }
  function buildRoundMetrics(result, maxGuessesValue) {
    return gameplayStats?.buildRoundMetricsAndSync?.(result, maxGuessesValue) || {
      guessesUsed: Math.max(1, Array.isArray(result?.guesses) ? result.guesses.length : Math.max(1, Number(maxGuessesValue) || 6)),
      durationMs: 0,
      hintRequested: !!currentRoundHintRequested,
      voiceAttempts: Math.max(0, Number(currentRoundVoiceAttempts) || 0),
      skillKey: currentRoundSkillKey || 'classic:all',
      skillLabel: currentRoundSkillLabel || 'Classic mixed practice',
      errorCounts: gameplaySupport?.normalizeCounterMap?.(currentRoundErrorCounts) || Object.create(null)
    };
  }
  function maybeShowErrorCoach(result) { gameplayStats?.maybeShowErrorCoach?.(result); }

  var rosterState = loadRosterState(ROSTER_STATE_KEY);
  var probeHistory = loadProbeHistory();
  var studentGoalState = loadStudentGoalState(STUDENT_GOALS_KEY);
  var playlistState = loadPlaylistState(PLAYLIST_STATE_KEY);
  teacherAssignmentsFeature = window.WQTeacherAssignmentsFeature?.createFeature?.({
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
  var sessionSummary = loadSessionSummaryState(SESSION_SUMMARY_KEY);
  var activeMiniLessonKey = 'top';

  function getActiveStudentLabel() { return rosterState.active || 'Class'; }
  function applyStudentTargetConfig(packId, targetId, options = {}) {
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    if (normalizedPack === 'custom' || normalizedTarget === 'custom') return false;
    syncLessonPackControlsFromPrefs({ packId: normalizedPack, targetId: normalizedTarget });
    return applyLessonTargetConfig(normalizedPack, normalizedTarget, { toast: !!options.toast });
  }
  function recordVoiceAttempt() { studentSessionRuntime?.recordVoiceAttempt?.(); }

  function newGame(options = {}) {
    return roundStartRuntime?.newGame?.(options);
  }

  const reflowLayout = () => standaloneMission?.reflowLayout?.();

  // ─── 8. Input handling ──────────────────────────────
  function handleKey(key) {
    avaWqLastActionAt = Date.now();
    if (DEMO_MODE && !demoToastAutoCollapsedByPlay) {
      const normalized = String(key || '');
      if (normalized === 'Enter' || normalized === 'Backspace' || /^[a-zA-Z]$/.test(normalized)) {
        demoToastAutoCollapsedByPlay = true;
        demoUi?.collapseDemoToast?.();
      }
    }
    supportUi?.clearStarterCoachTimer?.();
    if (_el('hint-clue-card') && !_el('hint-clue-card')?.classList.contains('hidden')) {
      hideInformantHintCard();
    }
    if (_el('starter-word-card') && !_el('starter-word-card')?.classList.contains('hidden')) {
      hideStarterWordCard();
    }
    if (_el('support-choice-card') && !_el('support-choice-card')?.classList.contains('hidden')) {
      hideSupportChoiceCard();
    }
    // Close music player when user starts typing a guess
    if (/^[a-zA-Z]$/.test(key) && !_el('quick-music-strip')?.classList.contains('hidden')) {
      closeQuickPopover('music');
    }
    if (firstRunSetupPending && !_el('first-run-setup-modal')?.classList.contains('hidden')) return;
    const s = WQGame.getState();
    if (s.gameOver) return;

    if (key === 'Enter') {
      roundSubmitRuntime?.submitCurrentGuess?.(s);

    } else if (key === 'Backspace' || key === '⌫') {
      inputConstraints?.handleBackspaceKey?.();

    } else if (/^[a-zA-Z]$/.test(key)) {
      inputConstraints?.handleLetterKey?.(key);
    }
  }

  // ─── 9. Gameplay audio buttons ──────────────────────
  const entry = () => WQGame.getState()?.entry;

  var revealAutoAdvanceTimer = 0;
  var revealAutoCountdownTimer = 0;
  var revealAutoAdvanceEndsAt = 0;
  var revealChallengeState = null;
  var challengeOnboardingState = deepDiveState?.loadChallengeOnboardingState?.() || { seenCount: 0, dismissed: false };

  deepDiveCoreRuntime = typeof deepDiveCoreRuntimeFactory === 'function'
    ? deepDiveCoreRuntimeFactory({
        WQAudio,
        WQUI,
        challengeTaskLabels: CHALLENGE_TASK_LABELS,
        deepDiveBuilders,
        deepDiveState,
        deepDiveUi,
        documentRef: document,
        el: _el,
        emitTelemetry,
        focusReturnState: {
          get: () => challengeModalReturnFocusEl,
          set: (value) => {
            challengeModalReturnFocusEl = value;
          }
        },
        getDoneCount: (state) => deepDiveUi?.getChallengeDoneCount?.(state) || 0,
        getRevealChallengeState: () => revealChallengeState,
        getRevealPacingPreset: (...args) => revealFlowSupport?.getRevealPacingPreset?.(...args) || REVEAL_PACING_PRESETS.guided,
        getStateWord: () => revealChallengeState?.word || '',
        hideInformantHintCard,
        isConfettiEnabled: () => {
          const settings = WQUI?.getSettings?.();
          return !(settings && settings.confetti === false);
        },
        isMissionLabEnabled,
        isMissionLabStandaloneMode,
        normalizeReviewWord,
        playMeaningWithFun: (...args) => revealFlowSupport?.playMeaningWithFun?.(...args),
        promptLearnerAfterReveal: (...args) => revealFlowSupport?.promptLearnerAfterReveal?.(voiceSupport?.setVoicePracticeFeedback?.bind(voiceSupport), ...args),
        revealEffects,
        runKaraokeGuide: (...args) => voiceSupport?.runKaraokeGuide?.(...args),
        setChallengeFeedback: (...args) => deepDiveUi?.setChallengeFeedback?.(...args),
        setRevealChallengeState: (value) => { revealChallengeState = value; },
        startStandaloneMissionLab: (options = {}) => standaloneMission?.startStandaloneMissionLab?.(options) || false,
        shouldNarrateReveal: (...args) => revealFlowSupport?.shouldNarrateReveal?.(...args) ?? true,
        syncRevealChallengeLaunch: (result) => deepDiveSession?.syncRevealChallengeLaunch?.(result),
        syncRevealMeaningHighlight: (...args) => revealFlowSupport?.syncRevealMeaningHighlight?.(...args),
        uiScaffoldFallback: CHALLENGE_SCAFFOLD_PROFILE.g35,
        waitMs: (...args) => revealFlowSupport?.waitMs?.(...args)
      })
    : null;
  deepDiveCoreRuntime?.initSupportChoiceCardDrag?.();
  deepDiveCoreRuntime?.initDeepDiveCoreFeature?.(DEEP_DIVE_CONTRACT);
  deepDiveCoreRuntime?.bindRevealAudioButtons?.(entry);
  deepDiveCoreRuntime?.bindResultModalCelebration?.();
// ─── 12. Start ───────────────────────────────────────
  shellRuntime?.runInitialStartup?.();

};
