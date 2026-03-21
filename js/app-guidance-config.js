/**
 * app-guidance-config.js
 * Static support-hint and error-coaching config for Word Quest.
 */

window.WQGuidanceConfig = Object.freeze({
  SOR_HINT_PROFILES: Object.freeze({
    initial_blend: Object.freeze({
      catchphrase: 'Blend Builders',
      concept: 'Initial blend focus',
      rule: 'Your word contains an initial blend. Two consonants sit together, and you hear both sounds.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b', mark: 'letter' }),
            Object.freeze({ text: 'r', mark: 'letter' }),
            Object.freeze({ text: 'ing' })
          ]),
          note: 'Each consonant keeps its own sound: /b/ + /r/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 's', mark: 'letter' }),
            Object.freeze({ text: 't', mark: 'letter' }),
            Object.freeze({ text: 'op' })
          ]),
          note: 'Read both consonants quickly, then slide to the vowel.'
        })
      ])
    }),
    final_blend: Object.freeze({
      catchphrase: 'Blend Builders',
      concept: 'Final blend focus',
      rule: 'Your word contains a final blend. The ending has two consonants, and you hear both sounds.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ca' }),
            Object.freeze({ text: 'm', mark: 'letter' }),
            Object.freeze({ text: 'p', mark: 'letter' })
          ]),
          note: 'Say the ending /m/ + /p/ clearly.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ne' }),
            Object.freeze({ text: 's', mark: 'letter' }),
            Object.freeze({ text: 't', mark: 'letter' })
          ]),
          note: 'Hold both ending consonants without dropping one.'
        })
      ])
    }),
    digraph: Object.freeze({
      catchphrase: 'Sound Buddies',
      concept: 'Digraph focus',
      rule: 'Your word has a digraph. Two letters work together to make one sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sh', mark: 'team' }),
            Object.freeze({ text: 'ip' })
          ]),
          note: 'Keep the two letters locked as one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'th', mark: 'team' }),
            Object.freeze({ text: 'in' })
          ]),
          note: 'Read the digraph first, then finish the word.'
        })
      ])
    }),
    trigraph: Object.freeze({
      catchphrase: 'Three-Letter Team',
      concept: 'Trigraph focus',
      rule: 'Your word includes a three-letter sound team. Read the chunk first before adding other letters.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'l' }),
            Object.freeze({ text: 'igh', mark: 'team' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Treat igh as one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'ma' }),
            Object.freeze({ text: 'tch', mark: 'team' })
          ]),
          note: 'Keep tch together at the end.'
        })
      ])
    }),
    cvc: Object.freeze({
      catchphrase: 'Sound Steps',
      concept: 'CVC short-vowel focus',
      rule: 'Your word follows a consonant-vowel-consonant pattern with a short vowel in the middle.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'a', mark: 'letter' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Tap each sound: /c/ /a/ /t/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'd' }),
            Object.freeze({ text: 'o', mark: 'letter' }),
            Object.freeze({ text: 'g' })
          ]),
          note: 'Keep the center vowel short and crisp.'
        })
      ])
    }),
    cvce: Object.freeze({
      catchphrase: 'Magic E',
      concept: 'CVCe focus',
      rule: 'Your word uses silent e. The ending e is quiet and makes the vowel say its name.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'a', mark: 'letter' }),
            Object.freeze({ text: 'p' }),
            Object.freeze({ text: 'e', mark: 'silent' })
          ]),
          note: 'The silent e changes cap to cape.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'k' }),
            Object.freeze({ text: 'i', mark: 'letter' }),
            Object.freeze({ text: 't' }),
            Object.freeze({ text: 'e', mark: 'silent' })
          ]),
          note: 'The vowel says its name in kite.'
        })
      ])
    }),
    vowel_team: Object.freeze({
      catchphrase: 'Vowel Team Detectives',
      concept: 'Vowel team focus',
      rule: 'Your word has a vowel team. Two vowels work together to carry one main sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'r' }),
            Object.freeze({ text: 'ai', mark: 'team' }),
            Object.freeze({ text: 'n' })
          ]),
          note: 'Read ai as one chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b' }),
            Object.freeze({ text: 'oa', mark: 'team' }),
            Object.freeze({ text: 't' })
          ]),
          note: 'Read oa as one chunk.'
        })
      ])
    }),
    r_controlled: Object.freeze({
      catchphrase: 'Bossy R',
      concept: 'R-controlled vowel focus',
      rule: 'Your word contains an r-controlled vowel. The r changes the vowel sound.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'ar', mark: 'team' })
          ]),
          note: 'Read ar as one sound pattern.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'h' }),
            Object.freeze({ text: 'er', mark: 'team' })
          ]),
          note: 'Read er as one sound pattern.'
        })
      ])
    }),
    diphthong: Object.freeze({
      catchphrase: 'Glide Team',
      concept: 'Diphthong focus',
      rule: 'Your word contains a diphthong. The vowel sound glides as your mouth moves.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'c' }),
            Object.freeze({ text: 'oi', mark: 'team' }),
            Object.freeze({ text: 'n' })
          ]),
          note: 'The oi glide is one sound chunk.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'cl' }),
            Object.freeze({ text: 'ou', mark: 'team' }),
            Object.freeze({ text: 'd' })
          ]),
          note: 'The ou glide is one sound chunk.'
        })
      ])
    }),
    welded: Object.freeze({
      catchphrase: 'Welded Sounds',
      concept: 'Welded sound focus',
      rule: 'Your word has a welded sound chunk. Keep the vowel plus ending consonants together.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'b' }),
            Object.freeze({ text: 'ang', mark: 'team' })
          ]),
          note: 'Read ang as one welded unit.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'r' }),
            Object.freeze({ text: 'ing', mark: 'team' })
          ]),
          note: 'Read ing as one welded unit.'
        })
      ])
    }),
    floss: Object.freeze({
      catchphrase: 'FLOSS Rule',
      concept: 'Double ending focus',
      rule: 'Your word may end with doubled f, l, s, or z after a short vowel in a one-syllable word.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'be' }),
            Object.freeze({ text: 'll', mark: 'team' })
          ]),
          note: 'll is doubled after a short vowel sound.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'o' }),
            Object.freeze({ text: 'ff', mark: 'team' })
          ]),
          note: 'ff is doubled after a short vowel sound.'
        })
      ])
    }),
    schwa: Object.freeze({
      catchphrase: 'Schwa Spotter',
      concept: 'Schwa focus',
      rule: 'Your word has a schwa sound. The vowel is unstressed and sounds like /uh/.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'a', mark: 'schwa' }),
            Object.freeze({ text: 'bout' })
          ]),
          note: 'The a is unstressed and says /uh/.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sof' }),
            Object.freeze({ text: 'a', mark: 'schwa' })
          ]),
          note: 'The final a is unstressed and says /uh/.'
        })
      ])
    }),
    prefix: Object.freeze({
      catchphrase: 'Prefix Power',
      concept: 'Prefix focus',
      rule: 'Your word starts with a prefix. Read the prefix chunk first, then the base word.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 're', mark: 'affix' }),
            Object.freeze({ text: 'play' })
          ]),
          note: 'Read re- first, then the base word.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'un', mark: 'affix' }),
            Object.freeze({ text: 'lock' })
          ]),
          note: 'Read un- first, then the base word.'
        })
      ])
    }),
    suffix: Object.freeze({
      catchphrase: 'Suffix Power',
      concept: 'Suffix focus',
      rule: 'Your word ends with a suffix. Read the base word first, then attach the ending.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'jump' }),
            Object.freeze({ text: 'ed', mark: 'affix' })
          ]),
          note: 'Read base + suffix: jump + ed.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'run' }),
            Object.freeze({ text: 'ning', mark: 'affix' })
          ]),
          note: 'Read base + suffix: run + ning.'
        })
      ])
    }),
    multisyllable: Object.freeze({
      catchphrase: 'Syllable Strategy',
      concept: 'Multisyllable focus',
      rule: 'Your word has more than one syllable. Chunk it into syllables before spelling.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sun' }),
            Object.freeze({ text: '-' }),
            Object.freeze({ text: 'set' })
          ]),
          note: 'Read each syllable chunk, then blend.'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'com' }),
            Object.freeze({ text: '-' }),
            Object.freeze({ text: 'plete' })
          ]),
          note: 'Read each syllable chunk, then blend.'
        })
      ])
    }),
    compound: Object.freeze({
      catchphrase: 'Word Builders',
      concept: 'Compound word focus',
      rule: 'Your word joins two smaller words. Find each part first, then combine.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'sun' }),
            Object.freeze({ text: 'flower' })
          ]),
          note: 'sun + flower = sunflower'
        }),
        Object.freeze({
          parts: Object.freeze([
            Object.freeze({ text: 'rain' }),
            Object.freeze({ text: 'coat' })
          ]),
          note: 'rain + coat = raincoat'
        })
      ])
    }),
    subject: Object.freeze({
      catchphrase: 'Context Detectives',
      concept: 'Vocabulary-in-context focus',
      rule: 'Use the sentence clue first to identify meaning, then map the sounds and spell.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([Object.freeze({ text: 'Use sentence meaning first.' })]),
          note: 'Then spell using the sounds you hear.'
        })
      ])
    }),
    general: Object.freeze({
      catchphrase: 'Pattern Detectives',
      concept: 'Phonics focus',
      rule: 'Use one clear sound pattern clue, then confirm with the sentence.',
      examples: Object.freeze([
        Object.freeze({
          parts: Object.freeze([Object.freeze({ text: 'Check beginning + middle + ending.' })]),
          note: 'Then use color feedback to refine the next guess.'
        })
      ])
    })
  }),
  ERROR_PATTERN_LABELS: Object.freeze({
    vowel_pattern: 'Vowel Pattern',
    blend_position: 'Blend Position',
    morpheme_ending: 'Morpheme Ending',
    context_strategy: 'Clue Strategy'
  }),
  ERROR_COACH_COPY: Object.freeze({
    vowel_pattern: 'Coach: check the vowel pattern first (short, team, or r-controlled).',
    blend_position: 'Coach: you have useful letters; adjust their positions and blends.',
    morpheme_ending: 'Coach: re-check the ending chunk (-ed, -ing, suffixes).',
    context_strategy: 'Coach: use the sentence clue to narrow meaning and part of speech.'
  }),
  ERROR_NEXT_STEP_COPY: Object.freeze({
    vowel_pattern: 'Re-teach vowel pattern contrast (short vs team vs r-controlled) with 6-word sorts.',
    blend_position: 'Run onset/rime blend mapping and left-to-right tracking with 5 guided words.',
    morpheme_ending: 'Practice suffix-ending checks (-ed/-ing/-s) with chunk tap + dictation.',
    context_strategy: 'Model clue-to-meaning strategy: identify part of speech, then confirm spelling.'
  }),
  ERROR_MINI_LESSON_PLANS: Object.freeze({
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
  })
});
