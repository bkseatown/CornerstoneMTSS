/**
 * app-deep-dive-config.js
 * Shared Deep Dive configuration and copy constants.
 */

window.WQDeepDiveConfig = Object.freeze({
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
