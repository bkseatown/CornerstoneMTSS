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
})(window);
