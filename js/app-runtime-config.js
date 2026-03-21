/**
 * app-runtime-config.js
 * Shared runtime config extracted from app-main.js.
 */

(function initWordQuestRuntimeConfig(globalRef) {
  const curriculumHelpers = globalRef.WQFocusCurriculumHelpers || {};

  const buildUfliLessonTargets = curriculumHelpers.buildUfliLessonTargets || (() => Object.freeze([]));
  const buildFundationsLessonTargets = curriculumHelpers.buildFundationsLessonTargets || (() => Object.freeze([]));
  const buildWilsonLessonTargets = curriculumHelpers.buildWilsonLessonTargets || (() => Object.freeze([]));
  const buildLexiaWidaLessonTargets = curriculumHelpers.buildLexiaWidaLessonTargets || (() => Object.freeze([]));

  globalRef.WQAppRuntimeConfig = Object.freeze({
    AUTO_MUSIC_BY_FAMILY: Object.freeze({
      core: 'chill',
      sports: 'chill',
      inspired: 'lofi',
      dark: 'lofi'
    }),
    AUTO_MUSIC_BY_THEME: Object.freeze({
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
    }),
    CURRICULUM_LESSON_PACKS: Object.freeze({
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
    }),
    CHUNK_TAB_FOCUS_KEYS: Object.freeze([
      'digraph',
      'ccvc',
      'cvcc',
      'trigraph',
      'welded',
      'diphthong',
      'vowel_team',
      'r_controlled',
      'floss'
    ]),
    SUBJECT_FOCUS_GRADE: Object.freeze({
      k2: 'K-2',
      '35': 'G3-5',
      '68': 'G6-8',
      '912': 'G9-12'
    }),
    TEAM_LABEL_SETS: Object.freeze({
      mascots: Object.freeze(['Foxes', 'Owls', 'Sharks', 'Dragons']),
      colors: Object.freeze(['Blue Team', 'Gold Team', 'Red Team', 'Green Team']),
      space: Object.freeze(['Comets', 'Rockets', 'Nova Crew', 'Star Wings']),
      wizards: Object.freeze(['Lions', 'Eagles', 'Badgers', 'Serpents'])
    })
  });

  globalRef.WQRuntimeConstants = Object.freeze({
    PREF_KEY: 'wq_v2_prefs',
    PREF_MIGRATION_KEY: 'wq_v2_pref_defaults_20260222',
    PREF_UI_SKIN_RESET_MIGRATION_KEY: 'wq_v2_pref_ui_skin_default_20260226a',
    PREF_MUSIC_AUTO_MIGRATION_KEY: 'wq_v2_pref_music_auto_20260222',
    PREF_GUESSES_DEFAULT_MIGRATION_KEY: 'wq_v2_pref_guesses_default_20260224',
    FIRST_RUN_SETUP_KEY: 'wq_v2_first_run_setup_v1',
    SESSION_SUMMARY_KEY: 'wq_v2_teacher_session_summary_v1',
    ROSTER_STATE_KEY: 'wq_v2_teacher_roster_v1',
    PROBE_HISTORY_KEY: 'cs_probe_history_v1',
    PROBE_HISTORY_LEGACY_KEYS: Object.freeze(['wq_v2_weekly_probe_history_v1']),
    STUDENT_GOALS_KEY: 'wq_v2_student_goals_v1',
    PLAYLIST_STATE_KEY: 'wq_v2_assignment_playlists_v1',
    WRITING_STUDIO_RETURN_KEY: 'ws_return_to_wordquest_v1',
    SHUFFLE_BAG_KEY: 'wq_v2_shuffle_bag',
    REVIEW_QUEUE_KEY: 'wq_v2_spaced_review_queue_v1',
    TELEMETRY_QUEUE_KEY: 'wq_v2_telemetry_queue_v1',
    DIAGNOSTICS_LAST_RESET_KEY: 'wq_v2_diag_last_reset_v1',
    PAGE_MODE_KEY: 'wq_v2_page_mode_v1',
    LAST_NON_OFF_MUSIC_KEY: 'wq_v2_last_non_off_music_v1',
    SUPPORT_PROMPT_PREF_KEY: 'wq_v2_support_prompt_auto_v1',
    SAFE_STREAK_KEY: 'wordquest_streak',
    CHALLENGE_REFLECTION_KEY: 'wq_v2_levelup_reflections_v1',
    CHALLENGE_PROGRESS_KEY: 'wq_v2_mission_lab_progress_v1',
    CHALLENGE_DRAFT_KEY: 'wq_v2_mission_lab_draft_v1',
    CHALLENGE_ONBOARDING_KEY: 'wq_v2_deep_dive_onboarding_v1',
    DEMO_TOAST_DEFAULT_DURATION_MS: 90000,
    DEMO_TOAST_MIN_DWELL_MS: 3200,
    DEMO_COACH_READY_MAX_TRIES: 25,
    DEMO_COACH_READY_DELAY_MS: 120,
    DEMO_OVERLAY_SELECTORS: Object.freeze([
      '#focus-inline-results:not(.hidden)',
      '#teacher-panel:not(.hidden)',
      '#modal-overlay:not(.hidden)',
      '#challenge-modal:not(.hidden)',
      '#phonics-clue-modal:not(.hidden)',
      '#listening-mode-overlay:not(.hidden)',
      '#first-run-setup-modal:not(.hidden)',
      '#end-modal:not(.hidden)',
      '#modal-challenge-launch:not(.hidden)'
    ]),
    TELEMETRY_ENABLED_KEY: 'wq_v2_telemetry_enabled_v1',
    TELEMETRY_DEVICE_ID_KEY: 'wq_v2_device_id_local_v1',
    TELEMETRY_ENDPOINT_KEY: 'wq_v2_telemetry_endpoint_v1',
    TELEMETRY_LAST_UPLOAD_KEY: 'wq_v2_telemetry_last_upload_v1',
    TELEMETRY_QUEUE_LIMIT: 500,
    HOVER_NOTE_DELAY_MS: 500,
    HOVER_NOTE_TARGET_SELECTOR: '.icon-btn, .header-quick-btn, .focus-action-btn, .theme-preview-music, .wq-theme-nav-btn, .quick-popover-done',
    VOICE_PRIVACY_TOAST_KEY: 'wq_voice_privacy_toast_seen_v1',
    VOICE_CAPTURE_MS: 3000,
    VOICE_COUNTDOWN_SECONDS: 3,
    VOICE_HISTORY_KEY: 'wq_v2_voice_history_v1',
    VOICE_HISTORY_LIMIT: 3,
    CURRICULUM_PACK_ORDER: Object.freeze(['ufli', 'fundations', 'wilson', 'lexiawida', 'justwords'])
  });

  globalRef.WQMainConfig = Object.freeze({
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

  globalRef.WQDeepDiveConfig = Object.freeze({
    REVEAL_WIN_TOASTS: Object.freeze({
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
    }),
    REVEAL_LOSS_TOASTS: Object.freeze({
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
    }),
    THINKING_LEVEL_META: Object.freeze({
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
    }),
    CHALLENGE_REFLECTION_KEY: 'wq_v2_levelup_reflections_v1',
    CHALLENGE_PROGRESS_KEY: 'wq_v2_mission_lab_progress_v1',
    CHALLENGE_DRAFT_KEY: 'wq_v2_mission_lab_draft_v1',
    CHALLENGE_ONBOARDING_KEY: 'wq_v2_deep_dive_onboarding_v1',
    CHALLENGE_ONBOARDING_MAX_VIEWS: 2,
    CHALLENGE_STRONG_SCORE_MIN: 75,
    CHALLENGE_COMPLETE_LINES: Object.freeze([
      'Deep Dive complete. Pattern and meaning locked in.',
      'Deep Dive clear. You connected sound, meaning, and sentence use.',
      'Quest upgrade complete. Great transfer from decoding to comprehension.'
    ]),
    CHALLENGE_TASK_FLOW: Object.freeze(['listen', 'analyze', 'create']),
    CHALLENGE_TASK_LABELS: Object.freeze({
      listen: 'Sound',
      analyze: 'Meaning',
      create: 'Context'
    }),
    DEEP_DIVE_VARIANTS: Object.freeze({
      listen: Object.freeze(['chunk', 'anchor']),
      analyze: Object.freeze(['definition', 'context']),
      create: Object.freeze(['sentence_pick', 'sentence_fix'])
    }),
    CHALLENGE_PACING_NUDGE_MS: 45 * 1000,
    CHALLENGE_WORD_ROLE_META: Object.freeze({
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
    }),
    CHALLENGE_RANKS: Object.freeze([
      Object.freeze({ minPoints: 0, label: 'Scout' }),
      Object.freeze({ minPoints: 40, label: 'Navigator' }),
      Object.freeze({ minPoints: 90, label: 'Analyst' }),
      Object.freeze({ minPoints: 160, label: 'Strategist' }),
      Object.freeze({ minPoints: 260, label: 'Master Sleuth' })
    ]),
    CHALLENGE_LEVELS: Object.freeze([
      'remember',
      'understand',
      'apply',
      'analyze',
      'evaluate',
      'create'
    ]),
    CHALLENGE_SCAFFOLD_PROFILE: Object.freeze({
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
    }),
    REVEAL_PACING_PRESETS: Object.freeze({
      guided: Object.freeze({ introDelay: 260, betweenDelay: 140, postMeaningDelay: 200 }),
      quick: Object.freeze({ introDelay: 140, betweenDelay: 70, postMeaningDelay: 120 }),
      slow: Object.freeze({ introDelay: 420, betweenDelay: 220, postMeaningDelay: 320 })
    })
  });
})(window);
