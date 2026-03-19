/**
 * app-constants.js
 * Shared constants, feature flags, storage keys, and defaults
 */

// Feature flags
const FEATURES = Object.freeze({
  tileFlipAnimation: true,
  streakSystem: true,
  adaptiveDifficulty: true
});

const DEMO_WORDS = Object.freeze(['plant', 'crane', 'shine', 'brave', 'grasp']);
const DEMO_TARGET_WORD = DEMO_WORDS[0];

// Storage keys
const PREF_KEY = 'wq_v2_prefs';
const PREF_MIGRATION_KEY = 'wq_v2_pref_defaults_20260222';
const PREF_UI_SKIN_RESET_MIGRATION_KEY = 'wq_v2_pref_ui_skin_default_20260226a';
const PREF_MUSIC_AUTO_MIGRATION_KEY = 'wq_v2_pref_music_auto_20260222';
const PREF_GUESSES_DEFAULT_MIGRATION_KEY = 'wq_v2_pref_guesses_default_20260224';
const FIRST_RUN_SETUP_KEY = 'wq_v2_first_run_setup_v1';
const SESSION_SUMMARY_KEY = 'wq_v2_teacher_session_summary_v1';
const ROSTER_STATE_KEY = 'wq_v2_teacher_roster_v1';
const PROBE_HISTORY_KEY = 'cs_probe_history_v1';
const PROBE_HISTORY_LEGACY_KEYS = Object.freeze(['wq_v2_weekly_probe_history_v1']);
const STUDENT_GOALS_KEY = 'wq_v2_student_goals_v1';
const PLAYLIST_STATE_KEY = 'wq_v2_assignment_playlists_v1';
const WRITING_STUDIO_RETURN_KEY = 'ws_return_to_wordquest_v1';
const SHUFFLE_BAG_KEY = 'wq_v2_shuffle_bag';
const REVIEW_QUEUE_KEY = 'wq_v2_spaced_review_queue_v1';
const TELEMETRY_QUEUE_KEY = 'wq_v2_telemetry_queue_v1';
const DIAGNOSTICS_LAST_RESET_KEY = 'wq_v2_diag_last_reset_v1';
const PAGE_MODE_KEY = 'wq_v2_page_mode_v1';
const LAST_NON_OFF_MUSIC_KEY = 'wq_v2_last_non_off_music_v1';
const DUPE_PREF_KEY = 'wq_v2_dupe_dismissed';

// Feature flags from window
const FEATURE_FLAGS = window.WQFeatureFlags || {};
const WRITING_STUDIO_ENABLED = FEATURE_FLAGS.writingStudio === true;
const MISSION_LAB_ENABLED = true;
const MIDGAME_BOOST_ENABLED = false;
const REVIEW_QUEUE_MAX_ITEMS = 36;

// Allowed modes and sets
const ALLOWED_MUSIC_MODES = new Set([
  'auto', 'deepfocus', 'classicalbeats', 'nerdcore', 'focus', 'chill',
  'lofi', 'coffee', 'fantasy', 'scifi', 'upbeat', 'arcade', 'sports', 'stealth', 'team', 'off'
]);

const ALLOWED_VOICE_MODES = new Set(['recorded', 'auto', 'device', 'off']);

const MUSIC_LABELS = Object.freeze({
  auto: 'Auto', deepfocus: 'Lo-fi Focus', classicalbeats: 'Coffeehouse Groove',
  nerdcore: 'Timed Mode Boost', focus: 'Chill Beats', chill: 'Chill Beats',
  lofi: 'Lo-fi Focus', coffee: 'Coffeehouse Groove', fantasy: 'Lo-fi Focus',
  scifi: 'Timed Mode Boost', upbeat: 'Timed Mode Boost', arcade: 'Timed Mode Boost',
  sports: 'Timed Mode Boost', stealth: 'Lo-fi Focus', team: 'Timed Mode Boost', off: 'Off'
});

const CURATED_MUSIC_MODE_ORDER = Object.freeze(['chill', 'lofi', 'coffee', 'focus']);
const CURATED_MUSIC_MODES = new Set(['off', 'auto', 'gaming', ...CURATED_MUSIC_MODE_ORDER]);
const QUICK_MUSIC_VIBE_ORDER = CURATED_MUSIC_MODE_ORDER;

const DEFAULT_PREFS = Object.freeze({
  focus: 'all', lessonPack: 'custom', lessonTarget: 'custom', grade: 'all',
  length: '5', guesses: '6', caseMode: 'lower', smartKeyLock: 'off',
  hint: 'on', playStyle: 'detective', confidenceCoaching: 'off',
  revealFocus: 'on', revealPacing: 'guided', revealAutoNext: 'off',
  dupe: 'on', confetti: 'on', projector: 'on', motion: 'fun',
  feedback: 'themed', meaningPlusFun: 'on', sorNotation: 'on',
  voicePractice: 'optional', teamMode: 'off', teamCount: '2', teamSet: 'mascots',
  turnTimer: '60', probeRounds: '3', reportCompact: 'off', assessmentLock: 'off',
  boostPopups: 'off', starterWords: 'on_demand', music: 'auto', musicVol: '0.50',
  voice: 'recorded', themeSave: 'on', boardStyle: 'card', keyStyle: 'classic',
  keyboardLayout: 'standard', chunkTabs: 'auto', atmosphere: 'minimal',
  uiSkin: 'classic', textSize: 'medium'
});

const STUDENT_RECORDING_ENABLED = false;
const SAFE_DEFAULT_GRADE_BAND = 'K-2';

const ALLOWED_MASTERY_SORT_MODES = new Set(['attempts_desc', 'accuracy_desc', 'hint_rate_desc', 'voice_desc', 'top_error']);
const ALLOWED_MASTERY_FILTER_MODES = new Set(['all', 'needs_support', 'high_hints', 'vowel_pattern', 'blend_position', 'morpheme_ending', 'context_strategy']);
const ALLOWED_KEY_STYLES = new Set(['bubble', 'classic', 'arcade', 'soundcard', 'typewriter', 'pebble']);
const KEYBOARD_LAYOUT_ORDER = Object.freeze(['standard', 'alphabet']);
const ALLOWED_KEYBOARD_LAYOUTS = new Set([...KEYBOARD_LAYOUT_ORDER]);
const KEYBOARD_LAYOUT_LABELS = Object.freeze({ standard: 'QWERTY', alphabet: 'Alphabet' });
const STARTER_WORD_SUPPORT_MODES = new Set(['off', 'on_demand', 'after_2', 'after_3']);
const SUPPORT_PROMPT_PREF_KEY = 'wq_v2_support_prompt_auto_v1';
const ALLOWED_UI_SKINS = new Set(['premium', 'classic']);

const KEYBOARD_PRESET_CONFIG = Object.freeze({
  'qwerty-classic': Object.freeze({ id: 'qwerty-classic', layout: 'standard', keyStyle: 'classic', label: 'QWERTY · Classroom' }),
  'alphabet-classic': Object.freeze({ id: 'alphabet-classic', layout: 'alphabet', keyStyle: 'classic', label: 'Alphabet · Classroom' })
});

const LOADING_WATCHDOG_MS = 18000;

// Utility functions
function appBasePath() {
  var path = String((window.location && window.location.pathname) || '');
  var markers = ['/WordQuest/', '/Cornerstone%20MTSS/', '/Cornerstone MTSS/'];
  for (var i = 0; i < markers.length; i += 1) {
    var marker = markers[i];
    var idx = path.indexOf(marker);
    if (idx >= 0) return path.slice(0, idx + marker.length - 1);
  }
  try {
    var baseEl = document.querySelector('base[href]');
    if (baseEl) {
      var baseUrl = new URL(baseEl.getAttribute('href'), window.location.href);
      var basePath = String(baseUrl.pathname || '').replace(/\/+$/, '');
      if (basePath && basePath !== '/') return basePath;
    }
  } catch (_e) {}
  return '';
}

function withAppBase(path) {
  var clean = String(path || '').replace(/^\.?\//, '');
  return appBasePath() + '/' + clean;
}

export {
  FEATURES, DEMO_WORDS, DEMO_TARGET_WORD,
  PREF_KEY, PREF_MIGRATION_KEY, PREF_UI_SKIN_RESET_MIGRATION_KEY, PREF_MUSIC_AUTO_MIGRATION_KEY,
  PREF_GUESSES_DEFAULT_MIGRATION_KEY, FIRST_RUN_SETUP_KEY, SESSION_SUMMARY_KEY, ROSTER_STATE_KEY,
  PROBE_HISTORY_KEY, PROBE_HISTORY_LEGACY_KEYS, STUDENT_GOALS_KEY, PLAYLIST_STATE_KEY,
  WRITING_STUDIO_RETURN_KEY, SHUFFLE_BAG_KEY, REVIEW_QUEUE_KEY, TELEMETRY_QUEUE_KEY,
  DIAGNOSTICS_LAST_RESET_KEY, PAGE_MODE_KEY, LAST_NON_OFF_MUSIC_KEY, DUPE_PREF_KEY,
  WRITING_STUDIO_ENABLED, MISSION_LAB_ENABLED, MIDGAME_BOOST_ENABLED, REVIEW_QUEUE_MAX_ITEMS,
  ALLOWED_MUSIC_MODES, ALLOWED_VOICE_MODES, MUSIC_LABELS, CURATED_MUSIC_MODES, QUICK_MUSIC_VIBE_ORDER,
  DEFAULT_PREFS, SAFE_DEFAULT_GRADE_BAND, STUDENT_RECORDING_ENABLED,
  ALLOWED_MASTERY_SORT_MODES, ALLOWED_MASTERY_FILTER_MODES, ALLOWED_KEY_STYLES, KEYBOARD_LAYOUT_LABELS,
  ALLOWED_KEYBOARD_LAYOUTS, KEYBOARD_LAYOUT_ORDER, STARTER_WORD_SUPPORT_MODES, SUPPORT_PROMPT_PREF_KEY,
  ALLOWED_UI_SKINS, KEYBOARD_PRESET_CONFIG, LOADING_WATCHDOG_MS,
  appBasePath, withAppBase
};
