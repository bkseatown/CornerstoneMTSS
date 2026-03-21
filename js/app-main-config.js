/**
 * app-main-config.js
 * Static Word Quest runtime config that does not need to live in app-main.js.
 */

window.WQMainConfig = Object.freeze({
  REVIEW_QUEUE_MAX_ITEMS: 36,
  ALLOWED_MUSIC_MODES: new Set([
    'auto', 'deepfocus', 'classicalbeats', 'nerdcore', 'focus', 'chill', 'lofi',
    'coffee', 'fantasy', 'scifi', 'upbeat', 'gaming', 'sports', 'stealth', 'team', 'off'
  ]),
  ALLOWED_VOICE_MODES: new Set(['recorded', 'auto', 'device', 'off']),
  MUSIC_LABELS: Object.freeze({
    auto: 'Auto',
    deepfocus: 'Lo-fi Focus',
    classicalbeats: 'Coffeehouse Groove',
    nerdcore: 'Timed Mode Boost',
    focus: 'Chill Beats',
    chill: 'Chill Beats',
    lofi: 'Lo-fi Focus',
    coffee: 'Coffeehouse Groove',
    fantasy: 'Lo-fi Focus',
    scifi: 'Timed Mode Boost',
    upbeat: 'Timed Mode Boost',
    arcade: 'Timed Mode Boost',
    sports: 'Timed Mode Boost',
    stealth: 'Lo-fi Focus',
    team: 'Timed Mode Boost',
    off: 'Off'
  }),
  CURATED_MUSIC_MODE_ORDER: Object.freeze(['chill', 'lofi', 'coffee', 'focus']),
  CURATED_MUSIC_MODES: new Set(['off', 'auto', 'gaming', 'chill', 'lofi', 'coffee', 'focus']),
  QUICK_MUSIC_VIBE_ORDER: Object.freeze(['chill', 'lofi', 'coffee', 'focus']),
  DEFAULT_PREFS: Object.freeze({
    focus: 'all',
    lessonPack: 'custom',
    lessonTarget: 'custom',
    grade: 'all',
    length: '5',
    guesses: '6',
    caseMode: 'lower',
    smartKeyLock: 'off',
    hint: 'on',
    playStyle: 'detective',
    confidenceCoaching: 'off',
    revealFocus: 'on',
    revealPacing: 'guided',
    revealAutoNext: 'off',
    dupe: 'on',
    confetti: 'on',
    projector: 'on',
    motion: 'fun',
    feedback: 'themed',
    meaningPlusFun: 'on',
    sorNotation: 'on',
    voicePractice: 'optional',
    teamMode: 'off',
    teamCount: '2',
    teamSet: 'mascots',
    turnTimer: '60',
    probeRounds: '3',
    reportCompact: 'off',
    assessmentLock: 'off',
    boostPopups: 'off',
    starterWords: 'on_demand',
    music: 'auto',
    musicVol: '0.50',
    voice: 'recorded',
    themeSave: 'on',
    boardStyle: 'card',
    keyStyle: 'classic',
    keyboardLayout: 'standard',
    chunkTabs: 'auto',
    atmosphere: 'minimal',
    uiSkin: 'classic',
    textSize: 'medium'
  }),
  STUDENT_RECORDING_ENABLED: false,
  SAFE_DEFAULT_GRADE_BAND: 'K-2',
  ALLOWED_MASTERY_SORT_MODES: new Set([
    'attempts_desc', 'accuracy_desc', 'hint_rate_desc', 'voice_desc', 'top_error'
  ]),
  ALLOWED_MASTERY_FILTER_MODES: new Set([
    'all', 'needs_support', 'high_hints', 'vowel_pattern', 'blend_position', 'morpheme_ending', 'context_strategy'
  ]),
  ALLOWED_KEY_STYLES: new Set(['bubble', 'classic', 'arcade', 'soundcard', 'typewriter', 'pebble']),
  KEYBOARD_LAYOUT_ORDER: Object.freeze(['standard', 'alphabet']),
  ALLOWED_KEYBOARD_LAYOUTS: new Set(['standard', 'alphabet']),
  KEYBOARD_LAYOUT_LABELS: Object.freeze({
    standard: 'QWERTY',
    alphabet: 'Alphabet'
  }),
  STARTER_WORD_SUPPORT_MODES: new Set(['off', 'on_demand', 'after_2', 'after_3']),
  ALLOWED_UI_SKINS: new Set(['premium', 'classic']),
  KEYBOARD_PRESET_CONFIG: Object.freeze({
    'qwerty-classic': Object.freeze({
      id: 'qwerty-classic',
      layout: 'standard',
      keyStyle: 'classic',
      label: 'QWERTY · Classroom'
    }),
    'alphabet-classic': Object.freeze({
      id: 'alphabet-classic',
      layout: 'alphabet',
      keyStyle: 'classic',
      label: 'Alphabet · Classroom'
    })
  })
});
