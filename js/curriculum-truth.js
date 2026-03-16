(function curriculumTruthBootstrap() {
  "use strict";

  function freeze(value) {
    return Object.freeze(value);
  }

  var ENTRIES = freeze({
    "im-g4-u2-l7": freeze({
      id: "im-g4-u2-l7",
      program: "Illustrative Math",
      label: "Illustrative Math Grade 4 Unit 2 Lesson 7",
      shortLabel: "Illustrative Math · Lesson 7",
      grade: "Grade 4",
      unit: "Unit 2",
      lesson: "Lesson 7",
      officialFocus: "Find and explain equivalent fractions.",
      supportMove: "Use fraction strips, area models, or number lines to show why two fractions are equal.",
      assessmentPoint: "Lesson cool-down",
      assessmentDetail: "Use the cool-down to check whether the student can identify equal amounts and explain the equivalence.",
      progressMonitoring: "Track whether the student can match a model to two equivalent fractions with one prompt or less.",
      progressDataNote: "Log the cool-down result, the student's model explanation, and whether the student identified equivalence independently or with prompting.",
      sourceUrl: "https://im.kendallhunt.com/K5/teachers/grade-4/unit-2/lesson-7/preparation.html",
      sourceType: "verified"
    }),
    "im-g3-u6-l12": freeze({
      id: "im-g3-u6-l12",
      program: "Illustrative Math",
      label: "Illustrative Math Grade 3 Unit 6 Lesson 12",
      shortLabel: "Illustrative Math · Grade 3 · Unit 6 · Lesson 12",
      grade: "Grade 3",
      unit: "Unit 6",
      lesson: "Lesson 12",
      officialFocus: "Solve and represent weight and liquid-volume situations.",
      supportMove: "Use diagrams, labels, and one matching equation before students solve independently.",
      assessmentPoint: "Lesson cool-down",
      assessmentDetail: "Check whether the student can match the situation to the correct diagram and explain the quantities.",
      progressMonitoring: "Track correct diagram matching and equation selection across cool-downs.",
      progressDataNote: "Log the cool-down score, the diagram/equation match, and whether the student explained the quantities without teacher language support.",
      sourceUrl: "https://im.kendallhunt.com/K5/teachers/grade-3/unit-6/lesson-12/preparation.html",
      sourceType: "verified"
    }),
    "im-g4-u4-l9": freeze({
      id: "im-g4-u4-l9",
      program: "Illustrative Math",
      label: "Illustrative Math Grade 4 Unit 4 Lesson 9",
      shortLabel: "Illustrative Math · Grade 4 · Unit 4 · Lesson 9",
      grade: "Grade 4",
      unit: "Unit 4",
      lesson: "Lesson 9",
      officialFocus: "Read, write, and compare numbers in different forms.",
      supportMove: "Use place-value charts and expanded form before asking for a verbal explanation.",
      assessmentPoint: "Lesson cool-down",
      assessmentDetail: "Check whether the student can explain a digit's value in the number and compare two forms correctly.",
      progressMonitoring: "Track explanation accuracy for digit value and comparison language on cool-downs.",
      progressDataNote: "Log the cool-down result, the student's place-value explanation, and whether comparison language was accurate independently.",
      sourceUrl: "https://im.kendallhunt.com/K5/teachers/grade-4/unit-4/lesson-9/preparation.html",
      sourceType: "verified"
    }),
    "fishtank-g3-current": freeze({
      id: "fishtank-g3-current",
      program: "Fishtank ELA",
      label: "Fishtank ELA Grade 3 current unit",
      shortLabel: "Fishtank ELA Grade 3",
      officialFocus: "Use the current unit's text study and writing task to build evidence-based reading, discussion, and written response.",
      supportMove: "Preview the key vocabulary, then keep one text-dependent question and one sentence frame visible during independent response.",
      assessmentPoint: "Unit assessment set",
      assessmentDetail: "Use the current unit's pre-, mid-, and end-of-unit assessment tasks to check reading, discussion, and writing performance.",
      progressMonitoring: "Track text evidence use, response completion, and independence with the unit writing task.",
      progressDataNote: "Log the current pre-, mid-, or end-of-unit task, plus discussion evidence use, writing completion, and the level of prompting needed.",
      sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/",
      sourceType: "broad"
    }),
    "fishtank-g1-current": freeze({
      id: "fishtank-g1-current",
      program: "Fishtank ELA",
      label: "Fishtank ELA Grade 1 current unit",
      shortLabel: "Fishtank ELA Grade 1",
      officialFocus: "Use the current unit's anchor text and writing task to build grade-level reading, speaking, and response work.",
      supportMove: "Preview the target vocabulary, then keep one oral rehearsal prompt and one response frame visible during work time.",
      assessmentPoint: "Unit assessment set",
      assessmentDetail: "Use the current unit's pre-, mid-, and end-of-unit tasks to check comprehension, discussion, and writing.",
      progressMonitoring: "Track oral response, text evidence use, and completion of the same classroom task with supports.",
      progressDataNote: "Log the current unit task, oral rehearsal strength, and how much support was needed to complete the same classroom response.",
      sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/early-elementary/",
      sourceType: "broad"
    }),
    "fishtank-g2-current": freeze({
      id: "fishtank-g2-current",
      program: "Fishtank ELA",
      label: "Fishtank ELA Grade 2 current unit",
      shortLabel: "Fishtank ELA Grade 2",
      officialFocus: "Use the current unit's anchor text and writing task to build evidence-based reading, discussion, and written response.",
      supportMove: "Preteach the key vocabulary, then keep one note-catcher or sentence frame visible while the student completes the same task.",
      assessmentPoint: "Unit assessment set",
      assessmentDetail: "Use the current unit's pre-, mid-, and end-of-unit tasks to check reading, discussion, and writing performance.",
      progressMonitoring: "Track vocabulary carryover, response completion, and independence on the same classroom task.",
      progressDataNote: "Log the current unit task, target vocabulary carryover, and whether the student completed the classroom response with or without scaffolds.",
      sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/early-elementary/",
      sourceType: "broad"
    }),
    "el-g7-current": freeze({
      id: "el-g7-current",
      program: "EL Education",
      label: "EL Education Grade 7 current module",
      shortLabel: "EL Education Grade 7",
      officialFocus: "Use the current module's close reading, discussion, and evidence-based writing to keep middle-school literacy work aligned.",
      supportMove: "Preview the critical vocabulary and note-catcher first, then keep the writing target and one model response visible during work time.",
      assessmentPoint: "Mid-unit / end-of-unit / performance task",
      assessmentDetail: "Use the module's mid-unit assessment, end-of-unit assessment, and performance task to track reading analysis and writing.",
      progressMonitoring: "Track note-catcher completion, text evidence selection, and written response accuracy across lessons.",
      progressDataNote: "Log the current EL assessment or check-in, note-catcher completion, evidence selection accuracy, and writing independence.",
      sourceType: "verified"
    }),
    "el-g6-current": freeze({
      id: "el-g6-current",
      program: "EL Education",
      label: "EL Education Grade 6 current module",
      shortLabel: "EL Education Grade 6",
      officialFocus: "Use the current module's close reading, discussion, and evidence-based writing to keep middle-school literacy work aligned.",
      supportMove: "Preview the key vocabulary and note-catcher first, then keep one text-dependent question and response frame visible during work time.",
      assessmentPoint: "Mid-unit / end-of-unit / performance task",
      assessmentDetail: "Use the module's mid-unit assessment, end-of-unit assessment, and performance task to track reading analysis and writing.",
      progressMonitoring: "Track note-catcher completion, evidence use, and written response accuracy across lessons.",
      progressDataNote: "Log the current EL assessment or check-in, note-catcher completion, evidence use, and writing independence.",
      sourceType: "verified"
    }),
    "el-g8-current": freeze({
      id: "el-g8-current",
      program: "EL Education",
      label: "EL Education Grade 8 current module",
      shortLabel: "EL Education Grade 8",
      officialFocus: "Use the current module's close reading, discussion, and evidence-based writing to keep middle-school literacy work aligned.",
      supportMove: "Preview the critical vocabulary and note-catcher first, then keep the writing target and one model response visible during work time.",
      assessmentPoint: "Mid-unit / end-of-unit / performance task",
      assessmentDetail: "Use the module's mid-unit assessment, end-of-unit assessment, and performance task to track reading analysis and writing.",
      progressMonitoring: "Track note-catcher completion, text evidence selection, and written response accuracy across lessons.",
      progressDataNote: "Log the current EL assessment or check-in, note-catcher completion, evidence selection accuracy, and writing independence.",
      sourceType: "verified"
    }),
    "fundations-l2-u8": freeze({
      id: "fundations-l2-u8",
      program: "Fundations",
      label: "Fundations Level 2 Unit 8",
      shortLabel: "Fundations Level 2 Unit 8",
      officialFocus: "R-controlled syllable types, including ar and or, with decoding, encoding, and dictation transfer.",
      supportMove: "Tap and mark ar/or words, then move quickly into connected dictation.",
      assessmentPoint: "Diagnostic check / Unit test / Dictation",
      assessmentDetail: "Use weekly dictation and unit-level checks to measure decoding and encoding of the target patterns.",
      progressMonitoring: "Track accuracy on ar/or word reading, dictated words, and short sentence dictation.",
      progressDataNote: "Log dictation accuracy, unit check results, and whether the target pattern transferred into connected reading or sentence writing.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/fundations/",
      sourceType: "verified"
    }),
    "fundations-k-current": freeze({
      id: "fundations-k-current",
      program: "Fundations",
      label: "Fundations Level K current unit",
      shortLabel: "Fundations Level K current unit",
      officialFocus: "Use the current Fundations unit for explicit letter-sound work, CVC practice, and dictated word transfer.",
      supportMove: "Keep the oral routine, sound cards, and dictated word practice tightly sequenced.",
      assessmentPoint: "Diagnostic check / Unit test / Dictation",
      assessmentDetail: "Use current-unit checks and dictated word practice to monitor letter-sound and CVC accuracy.",
      progressMonitoring: "Track letter-sound fluency, CVC reading, and dictated-word accuracy.",
      progressDataNote: "Log unit check performance, dictated word accuracy, and whether the student held the pattern in reading and spelling.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/fundations/",
      sourceType: "broad"
    }),
    "ufli-current": freeze({
      id: "ufli-current",
      program: "UFLI Foundations",
      label: "UFLI Foundations current lesson",
      shortLabel: "UFLI current lesson",
      officialFocus: "Keep the daily UFLI routine cumulative: review, model, blend, spell, read, and transfer.",
      supportMove: "Correct at the sound or pattern level, then reread immediately.",
      assessmentPoint: "Weekly encoding / concept check",
      assessmentDetail: "Use dictated words and concept-based checks to measure whether the current pattern is stable.",
      progressMonitoring: "Track encoding accuracy and transfer into a phrase or short sentence.",
      progressDataNote: "Log the concept check or dictation result, the target pattern, and whether the student transferred it into phrase or sentence work.",
      sourceUrl: "https://ufli.education.ufl.edu/foundations/",
      sourceType: "broad"
    }),
    "bridges-place-value-cycle": freeze({
      id: "bridges-place-value-cycle",
      program: "Bridges Intervention",
      label: "Bridges Intervention current cycle",
      shortLabel: "Bridges Intervention current cycle",
      officialFocus: "Use the current intervention cycle for place-value reasoning in multi-step addition and subtraction.",
      supportMove: "Anchor the work in one representation before moving to the equation.",
      assessmentPoint: "Placement / progress monitoring",
      assessmentDetail: "Use the current Bridges intervention monitoring task to check model use and equation accuracy.",
      progressMonitoring: "Track whether the student selects a representation that matches the quantities and operation.",
      progressDataNote: "Log the current monitoring task, the model chosen, equation accuracy, and whether the student explained why the representation fit.",
      sourceType: "broad"
    }),
    "bridges-multistep-cycle": freeze({
      id: "bridges-multistep-cycle",
      program: "Bridges Intervention",
      label: "Bridges Intervention current cycle",
      shortLabel: "Bridges Intervention current cycle",
      officialFocus: "Use the current intervention cycle to represent multi-step problems with equations and models.",
      supportMove: "Have the student explain which operation matches each quantity before solving.",
      assessmentPoint: "Placement / progress monitoring",
      assessmentDetail: "Use current-cycle monitoring to check model selection, equation writing, and explanation of operation choice.",
      progressMonitoring: "Track whether the student can choose an operation and defend it with a model.",
      progressDataNote: "Log the current monitoring task, operation choice, model match, and the quality of the student's explanation.",
      sourceType: "broad"
    }),
    "justwords-current": freeze({
      id: "justwords-current",
      program: "Just Words",
      label: "Just Words current unit",
      shortLabel: "Just Words current unit",
      officialFocus: "Use the current Just Words unit for multisyllabic reading, spelling, and transfer into connected text.",
      supportMove: "Keep the target set small, mark the chunks, then transfer into a phrase or sentence.",
      assessmentPoint: "Progress check / dictation",
      assessmentDetail: "Use progress checks and dictation to monitor multisyllabic decoding and spelling transfer.",
      progressMonitoring: "Track accuracy on target words and transfer into connected text.",
      progressDataNote: "Log the progress check, dictation accuracy, and whether the pattern transferred into connected reading or sentence-level writing.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/just-words/",
      sourceType: "broad"
    }),
    "wilson-current-step": freeze({
      id: "wilson-current-step",
      program: "Wilson Reading System",
      label: "Wilson Reading System current step",
      shortLabel: "Wilson current step",
      officialFocus: "Use the current Wilson step for explicit word reading, wordlist charting, and dictation-based mastery.",
      supportMove: "Keep wordlist charting, word reading, and dictation in the same structured sequence.",
      assessmentPoint: "Wordlist charting / dictation",
      assessmentDetail: "Use charting and dictation to determine whether the student is ready to move within the current step.",
      progressMonitoring: "Track wordlist accuracy, dictation accuracy, and carryover into connected reading.",
      progressDataNote: "Log wordlist charting, dictation accuracy, controlled-text reading, and whether the student is ready to stay in or move beyond the current step.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/wilson-reading-system/",
      sourceType: "broad"
    })
  });

  var PROGRAMS = freeze({
    "fishtank-ela": freeze({
      id: "fishtank-ela",
      label: "Fishtank ELA",
      grades: freeze(["K", "1", "2", "3", "4", "5"]),
      assessmentModel: "Pre-unit / mid-unit / end-of-unit",
      supportRule: "Use the anchor text, preteach critical vocabulary, and keep one text-dependent prompt or sentence frame visible during the same classroom task.",
      progressDataNote: "Progress data should name the current Fishtank task and capture reading, discussion, and writing performance on the same classroom assessment or check-in.",
      sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/early-elementary/",
      gradeMap: freeze({
        "K": freeze([
          freeze({ unit: "K-1", title: "Welcome to School", focus: "community, belonging, and narrative comprehension" }),
          freeze({ unit: "K-2", title: "Noticing Patterns in Stories", focus: "story patterns, retelling, and vocabulary" }),
          freeze({ unit: "K-3", title: "Celebrating Fall", focus: "informational text, seasons, and key details" }),
          freeze({ unit: "K-4", title: "Falling in Love with Authors", focus: "author study, characters, and compare-contrast" }),
          freeze({ unit: "K-5", title: "Winter Wonderland", focus: "informational text, seasons, and questions about text" }),
          freeze({ unit: "K-6", title: "What Is Justice?", focus: "civics, fairness, and evidence from text" }),
          freeze({ unit: "K-7", title: "Exploring Life Cycles", focus: "science text, sequence, and domain vocabulary" }),
          freeze({ unit: "K-8", title: "Reduce, Reuse, Recycle", focus: "environmental argument, reasons, and opinion writing" })
        ]),
        "1": freeze([
          freeze({ unit: "1-1", title: "Being a Good Friend", focus: "character, social problem-solving, and narrative response" }),
          freeze({ unit: "1-2", title: "The Seven Continents", focus: "geography vocabulary, main idea, and compare-contrast" }),
          freeze({ unit: "1-3", title: "Folktales Around the World", focus: "theme, retelling, and cultural understanding" }),
          freeze({ unit: "1-4", title: "Amazing Animals", focus: "science text features, domain vocabulary, and comparison" }),
          freeze({ unit: "1-5", title: "Love Makes a Family", focus: "family structures, relationships, and narrative response" }),
          freeze({ unit: "1-6", title: "Inspiring Artists and Musicians", focus: "biography, chronology, and research writing" }),
          freeze({ unit: "1-7", title: "Making Old Stories New", focus: "retelling, story adaptation, and author's choices" }),
          freeze({ unit: "1-8", title: "Movements for Equality", focus: "civics, cause and effect, and opinion writing" }),
          freeze({ unit: "1-9", title: "The Power of Reading", focus: "reading response, recommendations, and narrative talk" }),
          freeze({ unit: "1-10", title: "Ancient Egypt", focus: "history, informational text, and domain vocabulary" })
        ]),
        "2": freeze([
          freeze({ unit: "2-1", title: "Exploring Habitats", focus: "ecosystems, text features, and research writing" }),
          freeze({ unit: "2-2", title: "Awesome Insects", focus: "scientific vocabulary, details, and expository writing" }),
          freeze({ unit: "2-3", title: "Stories of Immigration", focus: "perspective, character, and narrative response" }),
          freeze({ unit: "2-4", title: "People Who Changed the World", focus: "biography, chronology, and main idea" }),
          freeze({ unit: "2-5", title: "Inside the Human Body", focus: "health text, cause and effect, and research writing" }),
          freeze({ unit: "2-6", title: "Tall Tales", focus: "folklore, exaggeration, and narrative writing" }),
          freeze({ unit: "2-7", title: "Weather and Water", focus: "science explanation, text structure, and vocabulary" }),
          freeze({ unit: "2-8", title: "Poems About Us", focus: "poetry, imagery, and opinion response" }),
          freeze({ unit: "2-9", title: "Voting and Elections", focus: "civic vocabulary, reasons, and argument writing" })
        ]),
        "3": freeze([
          freeze({ unit: "3-1", title: "Defining Identity: Dyamonde Daniel and My Name Is Maria Isabel", focus: "identity, belonging, and character analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/" }),
          freeze({ unit: "3-2", title: "Rediscovering Thanksgiving: Fact vs. Fiction", focus: "informational reading, Indigenous history, and fact versus fiction", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/" }),
          freeze({ unit: "3-3", title: "Passing Down Wisdom: Indigenous, Hispanic, and African American Traditional Stories", focus: "traditional stories, theme, and retelling with evidence", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/" }),
          freeze({ unit: "3-4", title: "Understanding the Animal Kingdom", focus: "science text, key details, and text evidence", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/" }),
          freeze({ unit: "3-5", title: "Embracing Difference: The Hundred Dresses and Garvey's Choice", focus: "acceptance, central message, and literary response", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/3rd-grade/" })
        ]),
        "4": freeze([
          freeze({ unit: "4-1", title: "Finding Fortune: Where the Mountain Meets the Moon", focus: "identity, values, beliefs, and literary analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/4th-grade/" }),
          freeze({ unit: "4-2", title: "Preparing for the Worst: Natural Disasters", focus: "science knowledge, explanation, and informational reading", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/4th-grade/" }),
          freeze({ unit: "4-3", title: "Interpreting Perspectives: Greek Myths", focus: "mythology, perspective, and literary analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/4th-grade/" }),
          freeze({ unit: "4-4", title: "Believing in Yourself: The Wild Book", focus: "learning differences, self-image, and character analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/4th-grade/" }),
          freeze({ unit: "4-5", title: "Heart and Soul: The Story of America and African Americans", focus: "history, equality, and informational synthesis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/4th-grade/" })
        ]),
        "5": freeze([
          freeze({ unit: "5-1", title: "Building Community: Seedfolks", focus: "community, multiple perspectives, and theme", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/5th-grade/" }),
          freeze({ unit: "5-2", title: "Exploring Human Rights: The Breadwinner", focus: "human rights, historical context, and literary analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/5th-grade/" }),
          freeze({ unit: "5-3", title: "Protecting the Earth", focus: "plastic pollution, argument, and research", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/5th-grade/" }),
          freeze({ unit: "5-4", title: "Young Heroes: Children of the Civil Rights Movement", focus: "civil rights, multiple accounts, and informational analysis", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/5th-grade/" }),
          freeze({ unit: "5-5", title: "Friendship Across Boundaries: Return to Sender", focus: "immigration, stereotypes, and multiple perspectives", sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/5th-grade/" })
        ])
      }),
      sourceType: "mixed"
    }),
    "el-education": freeze({
      id: "el-education",
      label: "EL Education",
      grades: freeze(["6", "7", "8"]),
      assessmentModel: "Mid-unit / end-of-unit / performance task",
      supportRule: "Preview the critical vocabulary and note-catcher first, then keep the writing target and one model response visible during the same classroom task.",
      progressDataNote: "Progress data should name the EL assessment point and capture note-catcher completion, evidence use, and writing independence.",
      sourceUrl: "https://curriculum.eleducation.org/",
      sourceType: "verified"
    }),
    "fundations": freeze({
      id: "fundations",
      label: "Fundations",
      grades: freeze(["K", "1", "2", "3"]),
      assessmentModel: "Diagnostic check / Unit test / Dictation",
      supportRule: "Keep the oral routine, mark-up, reading, spelling, and dictation tightly sequenced so students transfer the pattern instead of naming it only.",
      progressDataNote: "Progress data should name the Fundations check used and capture reading, dictation, and transfer accuracy for the target pattern.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/fundations/",
      levels: freeze([
        freeze({ level: "K", units: freeze([
          freeze({ unit: "1", weeks: "12", swbat: "Match letters to sounds and read or build simple CVC words.", focus: "letter-sound knowledge, phonemic awareness, and early CVC transfer", sourceType: "broad" }),
          freeze({ unit: "2", weeks: "4", swbat: "Use the current taught sound-spelling patterns in reading and dictated words.", focus: "continued letter-sound and early word transfer", sourceType: "broad" }),
          freeze({ unit: "3", weeks: "6", swbat: "Use the current taught sound-spelling patterns in reading and dictated words.", focus: "continued letter-sound and CVC transfer", sourceType: "broad" }),
          freeze({ unit: "4", weeks: "4", swbat: "Use the current taught sound-spelling patterns in reading and dictated words.", focus: "continued phonics transfer into words and sentences", sourceType: "broad" }),
          freeze({ unit: "5", weeks: "6", swbat: "Use the current taught sound-spelling patterns in reading and dictated words.", focus: "continued phonics transfer into words and sentences", sourceType: "broad" })
        ]) }),
        freeze({ level: "1", units: freeze([
          freeze({ unit: "1", weeks: "2-3", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "short vowels, consonants, and routine transfer", sourceType: "broad" }),
          freeze({ unit: "2", weeks: "2-4", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued short-vowel decoding and encoding", sourceType: "broad" }),
          freeze({ unit: "3", weeks: "2", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued short-vowel decoding and encoding", sourceType: "broad" }),
          freeze({ unit: "4", weeks: "2", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued decoding, trick words, and sentence transfer", sourceType: "broad" }),
          freeze({ unit: "5", weeks: "1", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued decoding and transfer", sourceType: "broad" }),
          freeze({ unit: "6", weeks: "3", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued decoding and transfer", sourceType: "broad" }),
          freeze({ unit: "7", weeks: "3", swbat: "Read and spell words with the current taught short-vowel and consonant patterns.", focus: "continued decoding and transfer", sourceType: "broad" }),
          freeze({ unit: "8", weeks: "2", swbat: "Read and spell words with the current taught blends or digraph patterns.", focus: "blends, digraphs, and connected-text transfer", sourceType: "broad" }),
          freeze({ unit: "9", weeks: "2", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "10", weeks: "3", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "11", weeks: "3", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "12", weeks: "3", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "13", weeks: "3", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "14", weeks: "2", swbat: "Read and spell words with the current taught patterns in dictation and text.", focus: "continued pattern work and dictation transfer", sourceType: "broad" })
        ]) }),
        freeze({ level: "2", units: freeze([
          freeze({ unit: "1", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "2", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "3", weeks: "1", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "4", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "5", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "6", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "7", weeks: "3", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "8", weeks: "1", swbat: "Read and spell r-controlled syllable words, including ar and or, in dictation and connected text.", focus: "r-controlled syllables, ar/or, decoding, encoding, and dictation transfer", sourceType: "verified" }),
          freeze({ unit: "9", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "10", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "11", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "12", weeks: "1", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "13", weeks: "3", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "14", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "15", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "16", weeks: "1", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" }),
          freeze({ unit: "17", weeks: "2", swbat: "Use the current taught pattern in reading, spelling, and dictated sentences.", focus: "level 2 sequence, decoding, encoding, and transfer", sourceType: "broad" })
        ]) }),
        freeze({ level: "3", units: freeze([
          freeze({ unit: "1", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "2", weeks: "3", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "3", weeks: "1", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "4", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "5", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "6", weeks: "3", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "bonus", weeks: "2", swbat: "Apply the bonus-unit pattern or morpheme in reading, spelling, and dictation.", focus: "bonus-unit review and transfer", sourceType: "broad" }),
          freeze({ unit: "7", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "8", weeks: "3", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "9", weeks: "3", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "10", weeks: "3", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "11", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "12", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "13", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" }),
          freeze({ unit: "14", weeks: "2", swbat: "Use the current taught pattern or morpheme in reading, spelling, and dictation.", focus: "advanced patterns, morphology, and dictation transfer", sourceType: "broad" })
        ]) })
      ]),
      sourceType: "mixed"
    }),
    "illustrative-math": freeze({
      id: "illustrative-math",
      label: "Illustrative Math K-5",
      grades: freeze(["K", "1", "2", "3", "4", "5"]),
      assessmentModel: "Cool-down / section checkpoint / end-of-unit",
      supportRule: "Use the visual model, lesson language, and cool-down together. Ask students to show the quantity or relationship before naming it abstractly.",
      progressDataNote: "Progress data should name the IM cool-down or checkpoint and capture model use, explanation strength, and independence.",
      sourceUrl: "https://im.kendallhunt.com/k5/curriculum.html",
      gradeMap: freeze({
        "K": freeze([
          freeze({ unit: "1", title: "Math in Our World", focus: "explore tools, recognize quantities, and count collections" }),
          freeze({ unit: "2", title: "Numbers 1-10", focus: "count, compare, and connect quantities and numerals" }),
          freeze({ unit: "3", title: "Flat Shapes All Around Us", focus: "explore and make shapes in the environment" }),
          freeze({ unit: "4", title: "Understanding Addition and Subtraction", focus: "count to add and subtract and solve story problems within 10" }),
          freeze({ unit: "5", title: "Composing and Decomposing Numbers to 10", focus: "make and break apart numbers and solve more story problems" }),
          freeze({ unit: "6", title: "Numbers 0-20", focus: "count and represent teen numbers as 10 and some more" }),
          freeze({ unit: "7", title: "Solid Shapes All Around Us", focus: "describe, compare, and create solid shapes" }),
          freeze({ unit: "8", title: "Putting It All Together", focus: "fluency within 5, all about 10, and counting/comparing review" })
        ]),
        "1": freeze([
          freeze({ unit: "1", title: "Adding, Subtracting, and Working with Data", focus: "add and subtract within 10 and interpret categorical data" }),
          freeze({ unit: "2", title: "Addition and Subtraction Story Problems", focus: "solve add-to, take-from, and compare story problems" }),
          freeze({ unit: "3", title: "Adding and Subtracting Within 20", focus: "develop fluency and use ten as a unit" }),
          freeze({ unit: "4", title: "Numbers to 99", focus: "tens and ones, compare numbers, and compose numbers" }),
          freeze({ unit: "5", title: "Adding Within 100", focus: "use place value and make-a-ten strategies within 100" }),
          freeze({ unit: "6", title: "Length Measurements Within 120 Units", focus: "measure length, count to 120, and solve story problems" }),
          freeze({ unit: "7", title: "Geometry and Time", focus: "flat and solid shapes, halves/quarters, and tell time" }),
          freeze({ unit: "8", title: "Putting It All Together", focus: "review addition, subtraction, story problems, and numbers to 120" })
        ]),
        "2": freeze([
          freeze({ unit: "1", title: "Adding, Subtracting, and Working with Data", focus: "add/subtract within 20 and compare data" }),
          freeze({ unit: "2", title: "Adding and Subtracting within 100", focus: "place-value strategies and story problems within 100" }),
          freeze({ unit: "3", title: "Measuring Length", focus: "metric/customary measurement and line plots" }),
          freeze({ unit: "4", title: "Addition and Subtraction on the Number Line", focus: "use the number line structure to add and subtract" }),
          freeze({ unit: "5", title: "Numbers to 1,000", focus: "the value of three digits and comparing numbers within 1,000" }),
          freeze({ unit: "6", title: "Geometry, Time, and Money", focus: "shape attributes, equal shares, clocks, and money" }),
          freeze({ unit: "7", title: "Adding and Subtracting within 1,000", focus: "place-value strategies for adding and subtracting within 1,000" }),
          freeze({ unit: "8", title: "Equal Groups", focus: "odd/even, arrays, and equal-group reasoning" }),
          freeze({ unit: "9", title: "Putting It All Together", focus: "fluency within 20, measurement, and numbers to 1,000 review" })
        ]),
        "3": freeze([
          freeze({ unit: "1", title: "Introducing Multiplication", focus: "scaled graphs, arrays, and multiplication meaning" }),
          freeze({ unit: "2", title: "Area and Multiplication", focus: "area concepts and finding area with multiplication" }),
          freeze({ unit: "3", title: "Wrapping Up Addition and Subtraction Within 1,000", focus: "add/subtract within 1,000, round, and solve two-step problems" }),
          freeze({ unit: "4", title: "Relating Multiplication to Division", focus: "division meaning and larger-number multiplication/division" }),
          freeze({ unit: "5", title: "Fractions as Numbers", focus: "fractions, number line, equivalent fractions, and comparison" }),
          freeze({ unit: "6", title: "Measuring Length, Time, Liquid Volume, and Weight", focus: "measurement data, weight/liquid volume, and time" }),
          freeze({ unit: "7", title: "Two-dimensional Shapes and Perimeter", focus: "reason with shapes, perimeter, and design" }),
          freeze({ unit: "8", title: "Putting It All Together", focus: "fraction, measurement, and multiplication/division review" })
        ]),
        "4": freeze([
          freeze({ unit: "1", title: "Factors and Multiples", focus: "factor pairs, multiples, and prime/composite reasoning" }),
          freeze({ unit: "2", title: "Fraction Equivalence and Comparison", focus: "size/location of fractions, equivalent fractions, and comparison" }),
          freeze({ unit: "3", title: "Extending Operations to Fractions", focus: "equal groups, fraction addition/subtraction, and tenths/hundredths" }),
          freeze({ unit: "4", title: "From Hundredths to Hundred-thousands", focus: "decimals, place value, compare/order/round, and add/subtract" }),
          freeze({ unit: "5", title: "Multiplicative Comparison and Measurement", focus: "multiplicative comparison, conversion, and measurement problem solving" }),
          freeze({ unit: "6", title: "Multiplying and Dividing Multi-digit Numbers", focus: "patterns, multiplication, division, and problem solving" }),
          freeze({ unit: "7", title: "Angles and Angle Measurement", focus: "points/lines/angles and angle analysis" }),
          freeze({ unit: "8", title: "Properties of Two-dimensional Shapes", focus: "side lengths, angles, lines of symmetry, and attributes" }),
          freeze({ unit: "9", title: "Putting It All Together", focus: "reason with fractions and whole-number operations" })
        ]),
        "5": freeze([
          freeze({ unit: "1", title: "Finding Volume", focus: "unit cubes, expressions for finding volume, and solid figures" }),
          freeze({ unit: "2", title: "Fractions as Quotients and Fraction Multiplication", focus: "fractions as quotients and fractional side lengths" }),
          freeze({ unit: "3", title: "Multiplying and Dividing Fractions", focus: "fraction multiplication, division, and problem solving" }),
          freeze({ unit: "4", title: "Wrapping Up Multiplication and Division with Multi-Digit Numbers", focus: "multi-digit multiplication and division" }),
          freeze({ unit: "5", title: "Place Value Patterns and Decimal Operations", focus: "numbers to thousandths and decimal operations" }),
          freeze({ unit: "6", title: "More Decimal and Fraction Operations", focus: "measurement conversions, powers of 10, and fraction operations" }),
          freeze({ unit: "7", title: "Shapes on the Coordinate Plane", focus: "coordinate plane, hierarchy of shapes, and numerical patterns" }),
          freeze({ unit: "8", title: "Putting It All Together", focus: "volume plus fraction/decimal operations review" })
        ])
      }),
      sourceType: "verified"
    }),
    "wilson-reading-system": freeze({
      id: "wilson-reading-system",
      label: "Wilson Reading System",
      grades: freeze(["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]),
      assessmentModel: "Wordlist charting / dictation / passage reading / fluency checks",
      supportRule: "Keep sounds, word cards, controlled text, and dictation in the planned Wilson sequence so mastery decisions stay evidence-based. Use 10-part integrated lesson structure with constant teacher-student interaction.",
      progressDataNote: "Progress data should name the Wilson step/step-substep and capture wordlist charting accuracy, dictation performance, controlled-text reading accuracy, and transfer to fluency.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/wilson-reading-system/",
      stepMap: freeze({
        "1": freeze({ focus: "Closed syllables (3 sounds): CVC words with short vowels", swbat: "Identify/produce phoneme sounds for initial consonants and short vowels; blend phonemes into 3-sound CVC words; segment CVC words; read/spell phonetically regular 3-sound CVC words", substeps: "1.1-1.6", examples: "cat, wish, bill, bugs", sourceType: "verified" }),
        "2": freeze({ focus: "Closed syllables (4-6 sounds): Blends and digraphs", swbat: "Identify/produce phoneme sounds for consonant digraphs and additional consonants; blend/read 4-6 sound words; segment/spell words with final digraphs/blends; read -ang/-ing/-ong patterns", substeps: "2.1-2.5", examples: "bang, blend, pink, sprint", sourceType: "verified" }),
        "3": freeze({ focus: "Multisyllabic closed syllables: Two-syllable words", swbat: "Read two-syllable words with two closed syllables; identify syllable boundaries; segment by syllable; spell two-syllable closed syllable words accurately", substeps: "3.1-3.4", examples: "rabbit, napkin, submit", sourceType: "verified" }),
        "4": freeze({ focus: "Open syllables: Long vowel sound at syllable end", swbat: "Identify open syllables in written words; read/spell words with open syllables making long vowel sounds; blend open syllables in multisyllabic words", substeps: "4.1-4.3", examples: "preach, theme, ego", sourceType: "verified" }),
        "5": freeze({ focus: "Final silent e: VCe syllables producing long vowels", swbat: "Identify VCe syllables in written words; read/spell words with silent final e making long vowels; apply VCe pattern to words with suffixes (-ing, -ed)", substeps: "5.1-5.4", examples: "made, fine, hope, making", sourceType: "verified" }),
        "6": freeze({ focus: "Open syllables with y: y as long vowel sound", swbat: "Identify y as a vowel at end of words; produce long i and long e sounds for y; read/spell words with y as vowel", substeps: "6.1-6.2", examples: "happy, shy, family", sourceType: "verified" }),
        "7": freeze({ focus: "Vowel teams: Digraphs and vowel combinations", swbat: "Identify/read vowel digraph patterns (ai, ay, ea, ee, oa, oo, ou, au, aw); spell words using vowel digraphs; recognize multiple spellings for same sound (ai/ay, oi/oy)", substeps: "7.1-7.3", examples: "rain, beat, feet, boat", sourceType: "verified" }),
        "8": freeze({ focus: "Syllable division patterns: Multisyllabic word decoding", swbat: "Divide multisyllabic words by syllable type; read 3-4 syllable words using syllable division patterns; spell multisyllabic words by syllable", substeps: "8.1-8.3", examples: "napkin, pencil, fantastic", sourceType: "verified" }),
        "9": freeze({ focus: "Contractions & r-controlled vowels", swbat: "Read/spell contractions; identify/produce r-controlled vowel sounds (ar, or, er, ir, ur); read/spell multisyllabic words with r-controlled vowels", substeps: "9.1-9.3", examples: "it's, carpenter, forest", sourceType: "verified" }),
        "10": freeze({ focus: "Tricky vowel patterns: Double vowel exceptions", swbat: "Read/spell words with 'tricky' double vowel patterns; understand exceptions to digraph rules; distinguish regular digraphs from exception patterns", substeps: "10.1-10.2", examples: "flood, blood, tough", sourceType: "verified" }),
        "11": freeze({ focus: "Morphology: Suffix instruction with base word changes", swbat: "Apply suffixes to base words with rule changes (doubling, dropping e, changing y); read/spell words with inflectional endings (-ing, -ed, -er, -est, -ly); understand spelling changes", substeps: "11.1-11.3", examples: "running, making, happier", sourceType: "verified" }),
        "12": freeze({ focus: "Prefixes & morphology: Greek combining forms", swbat: "Identify/read prefixes in words; identify Greek combining forms and roots; read/spell complex words with multiple morphemes; determine word meaning using morpheme analysis", substeps: "12.1-12.4", examples: "unhappy, prefix, telephone, geography", sourceType: "verified" })
      }),
      sourceType: "verified"
    }),
    "just-words": freeze({
      id: "just-words",
      label: "Just Words",
      grades: freeze(["4", "5", "6", "7", "8", "9", "10", "11", "12"]),
      assessmentModel: "Progress check / Unit test (dictation & decoding) / Midterm & Final exams",
      supportRule: "Keep the target pattern set small, practice it in connected reading and spelling, and move quickly into sentence-level transfer. Use kinesthetic-tactile marking system for syllable type identification. Progress through units based on mastery, not grade level (~2 weeks per unit).",
      progressDataNote: "Progress data should name the Just Words unit/unit number and capture word reading accuracy, spelling dictation performance, syllable marking accuracy, and connected-text transfer with comprehension.",
      sourceUrl: "https://www.wilsonlanguage.com/programs/just-words/",
      unitMap: freeze({
        "1": freeze({ focus: "Closed syllables (review/reinforcement)", swbat: "Identify/mark closed syllables in single and multisyllabic words; read/spell single closed syllable words; apply kinesthetic marking system", patterns: "CVC, CVC with final digraphs, CVC with initial blends", examples: "cat, stop, bless", sourceType: "verified" }),
        "2": freeze({ focus: "Two-syllable words: Closed + Open syllables", swbat: "Identify syllable division between closed/open syllables; read two-syllable words with CVC|CV and VC|CV patterns; spell using syllable understanding", patterns: "VC|CV, V|CV division", examples: "napkin, robot, cabin", sourceType: "verified" }),
        "3": freeze({ focus: "Two-syllable words: Closed + VCe", swbat: "Identify VCe syllables in multisyllabic words; read words combining closed and VCe syllables; spell/apply inflectional endings (-ing) correctly", patterns: "CVC|VCe, base word + suffix", examples: "sunshine, making", sourceType: "verified" }),
        "4": freeze({ focus: "Double vowel patterns: 'A' & 'E' + open syllables", swbat: "Identify/read vowel digraph patterns (ea, ee) in multisyllabic words; understand vowel digraphs make single sounds; spell with vowel digraphs", patterns: "ea/ee + open, vowel teams", examples: "season, teacher, eagle", sourceType: "verified" }),
        "5": freeze({ focus: "Syllable patterns: Open + Closed (reversal)", swbat: "Identify/read multisyllabic words with open-closed syllable patterns; use syllable division to decode unfamiliar words; spell using open-closed patterns", patterns: "V|CVC, syllable type combination", examples: "paper, baby, tiger", sourceType: "verified" }),
        "6": freeze({ focus: "r-Controlled vowels + open syllables", swbat: "Identify r-controlled vowel patterns in multisyllabic words; read/spell words with r-controlled vowels; apply r-controlled understanding to complex words", patterns: "ar/or/er/ir/ur + open, r-controlled vowels", examples: "carpenter, forest, perfect", sourceType: "verified" }),
        "7": freeze({ focus: "Final syllable -le: Special syllable pattern", swbat: "Identify -le as a syllable type (not just suffix); correctly divide words ending in -le; read/spell words with final -le syllables", patterns: "_le syllable type, consonant + le", examples: "table, little, simple", sourceType: "verified" }),
        "8": freeze({ focus: "Morphology: Base words + unchanging suffixes", swbat: "Add common suffixes to base words without changing base; understand how suffixes change word meaning/function; read/spell multisyllabic words with base + suffix", patterns: "base + (-ing, -ed, -er, -est, -ly, -ful, -less, -ness)", examples: "helping, builder, helpful", sourceType: "verified" }),
        "9": freeze({ focus: "Morphology: Prefixes introduction", swbat: "Add variety of suffixes to base words; identify/read words with prefixes (un-, re-, pre-, dis-, mis-); understand how prefixes change word meaning", patterns: "prefix + base, expanded suffixes", examples: "redo, unfold, preview", sourceType: "verified" }),
        "10": freeze({ focus: "Latin roots: Foundation set", swbat: "Identify Latin roots within words; use Latin roots to determine word meaning; read/spell words containing roots (aqua, audi, bio, cred, duc, fact, form, fract)", patterns: "root + morpheme, Latin origin", examples: "aquatic, audition, biology", sourceType: "verified" }),
        "11": freeze({ focus: "Latin roots: Advanced set + complex prefixes", swbat: "Identify/use additional Latin roots (ject, luc, manu, path, port, scrib, spec, struct); recognize/apply advanced prefixes (over-, under-, out-, sub-, super-, inter-); analyze complex words", patterns: "complex morpheme combinations, advanced roots", examples: "inject, manuscript, submarine", sourceType: "verified" }),
        "12": freeze({ focus: "Greek combining forms + syllable review", swbat: "Identify Greek combining forms within words; use Greek forms to understand word meaning; read/spell words with Greek combining forms (phon, graph, tele, geo, meter, photo)", patterns: "Greek combining forms, syllable type consolidation", examples: "telephone, geography, thermometer", sourceType: "verified" }),
        "13": freeze({ focus: "Complex words: Three and four syllables", swbat: "Read 3-4 syllable words using all syllable type and morpheme knowledge; apply syllable division, root analysis, and morpheme understanding; spell longer complex words", patterns: "various syllable combinations, morpheme analysis", examples: "celebration, photography, combination", sourceType: "verified" }),
        "14": freeze({ focus: "Mastery & application review", swbat: "Demonstrate mastery of all Units 1-13 concepts; apply syllable type knowledge, morpheme analysis, and root understanding to unfamiliar words; read/spell grade-level words with automaticity", patterns: "cumulative, all previous patterns", examples: "cumulative selection from all units", sourceType: "verified" })
      }),
      sourceType: "verified"
    }),
    "ufli-foundations": freeze({
      id: "ufli-foundations",
      label: "UFLI Foundations",
      grades: freeze(["K", "1", "2", "3", "4", "5"]),
      assessmentModel: "Concept checks / Fluency checks / Spelling assessments / Placement test",
      supportRule: "Run the 8-step cumulative daily routine in order: Phonemic Awareness Drill → Visual Drill → Auditory Drill → Blending Drill → New Concept → Word Work → Irregular Words → Connected Text. Correct at the pattern level before asking for another independent response. Concept checks embedded throughout guide pacing decisions.",
      progressDataNote: "Progress data should name the UFLI lesson/concept check and capture phoneme-grapheme automaticity, concept understanding, decoding accuracy, spelling performance, fluency (words per minute), and transfer to connected text.",
      sourceUrl: "https://ufli.education.ufl.edu/foundations/",
      gradeMap: freeze({
        "K": freeze([
          freeze({ unit: "Alphabet Unit", lessons: "1-34", swbat: "Identify individual phoneme sounds and corresponding letters (a-z); blend individual sounds into CVC words; segment CVC words into sounds; read/spell simple CVC words; recognize high-frequency irregular words (the, and, a)", conceptFocus: "alphabetic principle, sound-letter relationships, one-to-one correspondence", sourceType: "verified" }),
          freeze({ unit: "Digraphs & Blends Unit", lessons: "35-53", swbat: "Read/spell consonant digraphs (ch, sh, th, wh) and initial blends; read decodable text with increasing complexity; recognize irregular words automatically", conceptFocus: "consonant combinations, phonetic patterns, beginning fluency", sourceType: "verified" }),
          freeze({ unit: "VCe Unit", lessons: "54-62", swbat: "Read/spell VCe (silent e) words with long vowel sounds; understand how silent e changes vowel sound; demonstrate understanding through decodable text reading", conceptFocus: "vowel patterns, silent e rule, long vowel sounds", sourceType: "verified" })
        ]),
        "1": freeze([
          freeze({ unit: "Alphabet Unit (Review)", lessons: "1-34", swbat: "Automatically produce phoneme-grapheme correspondences with high accuracy; maintain automaticity goal; build fluency foundation", conceptFocus: "phoneme-grapheme automaticity, foundational consolidation", sourceType: "verified" }),
          freeze({ unit: "Digraphs & Blends Unit", lessons: "35-53", swbat: "Read/spell consonant digraphs and initial blends automatically; read/spell final blends/digraphs; read/spell CVC words with accuracy and automaticity; demonstrate fluent reading of decodable passages", conceptFocus: "consonant combinations, ending blends, fluency development", sourceType: "verified" }),
          freeze({ unit: "VCe Unit", lessons: "54-62", swbat: "Read/spell VCe words; identify syllable boundaries in two-syllable words; read grade-level decodable text with accuracy/comprehension; recognize irregular words automatically", conceptFocus: "long vowel patterns, early multisyllabic words, fluency (80+ WPM)", sourceType: "verified" }),
          freeze({ unit: "Advanced Concepts", lessons: "63-75", swbat: "Apply all foundational concepts to more complex text; demonstrate oral reading fluency; transfer phonics knowledge to new contexts", conceptFocus: "advanced pattern application, comprehension, fluency development", sourceType: "verified" })
        ]),
        "2": freeze([
          freeze({ unit: "Alphabet Unit (Quick Review)", lessons: "1-15", swbat: "Demonstrate quick automaticity with letter-sound correspondences; move rapidly through review to allocate time for new learning", conceptFocus: "phoneme-grapheme automaticity consolidation", sourceType: "verified" }),
          freeze({ unit: "Vowel Teams & Digraphs Unit", lessons: "16-45", swbat: "Read words with vowel digraphs (ea, ee, ai, oa, etc.) with automaticity; read two-syllable words using VC|CV and V|CV patterns; spell multisyllabic CVC|CVC words correctly; demonstrate fluent reading (80+ WPM)", conceptFocus: "vowel team patterns, multisyllabic structure, fluency", sourceType: "verified" }),
          freeze({ unit: "Syllable Division & Morphology Unit", lessons: "46-70", swbat: "Identify syllable boundaries in two-syllable words; use syllable division to decode unfamiliar multisyllabic words; recognize irregular words automatically; read/comprehend grade-level text with fluency (80+ WPM)", conceptFocus: "syllable types, morpheme awareness, complex text navigation", sourceType: "verified" }),
          freeze({ unit: "Advanced Patterns & Concepts", lessons: "71-80", swbat: "Read/spell words with r-controlled vowels; demonstrate all syllable type knowledge; transfer skills to subject-specific text (science, social studies); maintain fluency (80+ WPM)", conceptFocus: "advanced syllable patterns, domain transfer, fluency automaticity", sourceType: "verified" })
        ]),
        "3": freeze([
          freeze({ unit: "Complex syllables & morphology", swbat: "Read/spell words with r-controlled vowels (ar, or, er, ir, ur); read 2-3 syllable words with varied syllable types; identify syllable type within multisyllabic words; use syllable division to decode unfamiliar words; identify/use prefixes and suffixes; read grade-level text (100+ WPM)", conceptFocus: "r-controlled vowels, complex syllables, morpheme use, fluency (100+ WPM)", sourceType: "verified" }),
          freeze({ unit: "Advanced morphology & fluency", swbat: "Identify/use prefixes and suffixes to understand word meaning; read grade-level text with fluency and comprehension; spell grade-level words correctly; recognize how word parts change word meaning; apply decoding to all subject areas", conceptFocus: "prefix/suffix use, comprehension, fluency, domain transfer", sourceType: "verified" })
        ]),
        "4-5": freeze([
          freeze({ unit: "Advanced word analysis & fluency", swbat: "Analyze multisyllabic words using syllable types and morphemes; identify word roots and affixes and use for word meaning; read grade-level complex text with fluency (115+ WPM) and comprehension; spell grade-level words using morpheme understanding", conceptFocus: "morphological analysis, complex text, fluency (115+ WPM), comprehension depth", sourceType: "verified" }),
          freeze({ unit: "Subject-specific text & mastery", swbat: "Apply decoding strategies to subject-specific text (science, social studies, math); demonstrate automaticity with all previous concepts; read at appropriate grade-level fluency with expression; show independent use of all strategies", conceptFocus: "domain-specific vocabulary, independent reading, fluency automaticity, expression", sourceType: "verified" })
        ])
      }),
      sourceType: "verified"
    }),
    "bridges-intervention": freeze({
      id: "bridges-intervention",
      label: "Bridges Intervention",
      grades: freeze(["K", "1", "2", "3", "4", "5"]),
      assessmentModel: "Placement / ongoing progress monitoring",
      supportRule: "Anchor the work in one representation before moving to the equation. Use the current monitoring task to decide whether the student can explain the quantity and operation choice.",
      progressDataNote: "Progress data should name the Bridges monitoring task and capture representation choice, equation accuracy, and explanation strength.",
      sourceUrl: "https://www.mathlearningcenter.org/curriculum/bridges-intervention",
      volumeMap: freeze({
        "1": freeze({ gradeLevel: "Kindergarten", domain: "Counting & Cardinality", focus: "Counting sequences, cardinality, comparing quantities", sessions: "40-65", swbat: "Count forward from a given number; recognize sets without counting (subitizing); compare quantities and identify which is greater/less", sourceType: "verified" }),
        "2": freeze({ gradeLevel: "K-1", domain: "Operations & Algebraic Thinking", focus: "Early addition/subtraction within 5-10", sessions: "40-65", swbat: "Solve addition problems within 5-10 using objects/drawings; understand addition as putting groups together; build number bonds within 10", sourceType: "verified" }),
        "3": freeze({ gradeLevel: "1-2", domain: "Operations & Base Ten", focus: "Addition/subtraction within 20 and 100", sessions: "40-65", swbat: "Solve addition/subtraction problems within 20 using strategies (counting on, making 10); understand inverse relationship; build automaticity with facts to 20", sourceType: "verified" }),
        "4": freeze({ gradeLevel: "2-3", domain: "Place Value & Operations", focus: "Multidigit addition/subtraction; place value", sessions: "40-65", swbat: "Add/subtract two-digit numbers using place value strategies; understand tens/ones place; apply multiple strategies (regrouping, decomposition, number lines)", sourceType: "verified" }),
        "5": freeze({ gradeLevel: "3-4", domain: "Multiplication/Division", focus: "Multiplication/division meaning; multidigit operations", sessions: "40-65", swbat: "Represent multiplication as equal groups/arrays; develop meaning for division; solve problems within 100 using strategies (arrays, area models, repeated addition)", sourceType: "verified" }),
        "6": freeze({ gradeLevel: "4-5", domain: "Multiplication/Division Fluency", focus: "Fluency with operations within 100", sessions: "40-65", swbat: "Multiply two-digit and multi-digit numbers; divide multi-digit by single-digit; develop fluency strategies; explain strategies using models", sourceType: "verified" }),
        "7": freeze({ gradeLevel: "4-5", domain: "Multiplication/Division Application", focus: "Fluency and real-world applications", sessions: "40-65", swbat: "Fluently multiply/divide within 100; apply to real-world situations; develop algebraic thinking; analyze strategy efficiency", sourceType: "verified" }),
        "8": freeze({ gradeLevel: "3-5", domain: "Fractions", focus: "Fraction concepts and comparison", sessions: "40-65", swbat: "Identify fractions as equal parts; read/write fractions; model using area models, number lines, manipulatives; compare/order fractions", sourceType: "verified" }),
        "9": freeze({ gradeLevel: "4-5", domain: "Fraction Operations", focus: "Fraction operations and mixed numbers", sessions: "40-65", swbat: "Add/subtract fractions with like denominators; solve word problems with fractions; apply to measurement; understand mixed numbers and improper fractions", sourceType: "verified" })
      }),
      cycleMap: freeze({
        "K-2": freeze([
          freeze({ cycle: "Quantity and counting", swbat: "Represent the quantity with one model and explain how the count matches the set.", focus: "counting, quantity, and one-to-one correspondence", sourceType: "broad" }),
          freeze({ cycle: "Addition and subtraction situations", swbat: "Choose a model that matches the situation and solve with support.", focus: "story problem structure and model matching", sourceType: "broad" }),
          freeze({ cycle: "Place value and number composition", swbat: "Show tens and ones with a representation before solving.", focus: "place value reasoning and composition/decomposition", sourceType: "broad" })
        ]),
        "3-5": freeze([
          freeze({ cycle: "Place-value reasoning", swbat: "Use one representation to explain the quantities before writing the equation.", focus: "place value, regrouping, and representation choice", sourceType: "broad" }),
          freeze({ cycle: "Multi-step problem structure", swbat: "Explain which operation matches each quantity before solving.", focus: "operation choice, equation writing, and model use", sourceType: "broad" }),
          freeze({ cycle: "Fraction and measurement support", swbat: "Use a visual model to explain the quantity or comparison before computing.", focus: "fraction/measurement reasoning and explanation", sourceType: "broad" })
        ])
      }),
      sourceType: "verified"
    }),
    "pam-harris-numeracy": freeze({
      id: "pam-harris-numeracy",
      label: "Pam Harris Numeracy & Number Sense",
      grades: freeze(["K", "1", "2", "3", "4", "5"]),
      assessmentModel: "Formative observation of student reasoning / problem strings / concept checks",
      supportRule: "Listen closely to understand student thinking and build instruction from what students already know. Use problem strings to nudge students toward efficient strategies. Focus on mathematical reasoning, not just answer-getting.",
      progressDataNote: "Progress data should capture student's reasoning strategies observed during problem-solving, development of flexible thinking, growth in subitizing/decomposition accuracy, and shift toward more efficient mental strategies.",
      sourceUrl: "https://www.mathisfigureoutable.com/",
      gradeMap: freeze({
        "K": freeze([
          freeze({ unit: "Subitizing", swbat: "Subitize sets of 1-4 objects without counting; recognize that numbers can be made by combining smaller numbers (composition)", focus: "foundational number sense, subitizing, composition", sourceType: "verified" }),
          freeze({ unit: "Decomposition", swbat: "Decompose small numbers (≤5) in multiple ways using objects and drawings; understand part-part-whole relationships", focus: "flexible thinking, decomposition strategies, visual representation", sourceType: "verified" }),
          freeze({ unit: "Counting", swbat: "Count with one-to-one correspondence for sets to 20; understand that counting tells 'how many'", focus: "cardinality principle, counting sequences, quantification", sourceType: "verified" })
        ]),
        "1": freeze([
          freeze({ unit: "Quick recognition", swbat: "Quickly recognize (subitize) sets of 1-10 objects; develop instant recognition of quantities", focus: "automaticity, number sense, visual perception", sourceType: "verified" }),
          freeze({ unit: "Decomposition to 10", swbat: "Decompose numbers to 10 in two or more ways; record with drawings and equations; understand relationships between decompositions", focus: "flexible decomposition, part-whole understanding, symbolic notation", sourceType: "verified" }),
          freeze({ unit: "Making tens", swbat: "Make tens and use tens to solve addition/subtraction problems; develop number bonds and complementary pairs", focus: "ten as anchor, efficient mental strategies, composition of 10", sourceType: "verified" }),
          freeze({ unit: "Problem solving", swbat: "Represent and solve word problems using objects, drawings, and equations; explain thinking about quantities", focus: "mathematical reasoning, flexible representation, problem-solving strategies", sourceType: "verified" })
        ]),
        "2": freeze([
          freeze({ unit: "Flexible addition/subtraction", swbat: "Fluently add and subtract within 20 using mental strategies based on number relationships; understand inverse relationship", focus: "mental math strategies, relational thinking, automaticity to 20", sourceType: "verified" }),
          freeze({ unit: "Place value", swbat: "Understand place value for 2-digit numbers (tens and ones); decompose numbers flexibly to solve problems", focus: "tens/ones conceptualization, flexible decomposition, multidigit reasoning", sourceType: "verified" }),
          freeze({ unit: "Part-whole thinking", swbat: "Solve word problems involving addition and subtraction using part-part-whole thinking and visual models", focus: "conceptual understanding, flexible strategies, mathematical explanation", sourceType: "verified" })
        ]),
        "3": freeze([
          freeze({ unit: "Multiplicative relationships", swbat: "Build relationships between addition and multiplication (equal groups); develop flexible multiplication strategies", focus: "multiplicative thinking, equal groups, flexible reasoning", sourceType: "verified" }),
          freeze({ unit: "Multi-step problem solving", swbat: "Use number sense and relationships to solve multi-step word problems; explain reasoning using mathematical models", focus: "complex problem-solving, relational thinking, mathematical explanation", sourceType: "verified" }),
          freeze({ unit: "Division reasoning", swbat: "Develop and apply flexible strategies for division; explain why a strategy works and when it is most efficient", focus: "division concepts, strategic thinking, mathematical justification", sourceType: "verified" })
        ]),
        "4-5": freeze([
          freeze({ unit: "Fluent multiplication/division", swbat: "Multiply and divide fluently using flexible strategies and number relationships; choose efficient strategies based on problem context", focus: "computational fluency, strategic flexibility, number relationships", sourceType: "verified" }),
          freeze({ unit: "Multi-step reasoning", swbat: "Solve complex multi-step problems in multiple ways; justify reasoning using multiple representations", focus: "complex reasoning, multiple solution paths, mathematical justification", sourceType: "verified" }),
          freeze({ unit: "Rational number sense", swbat: "Build understanding of decimals and fractions through part-whole relationships; connect concrete to abstract thinking", focus: "fraction/decimal reasoning, part-whole understanding, conceptual foundations", sourceType: "verified" })
        ])
      }),
      sourceType: "verified"
    }),
    "jo-boaler-mindset": freeze({
      id: "jo-boaler-mindset",
      label: "Jo Boaler Mathematical Mindset",
      grades: freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]),
      assessmentModel: "Formative assessment for learning / open-ended task analysis / student self-reflection",
      supportRule: "Use low-floor, high-ceiling tasks that are accessible to all students. Provide feedback focused on growth and learning, not grades. Emphasize that mathematical ability grows with effort and struggle.",
      progressDataNote: "Progress data should capture student engagement with challenging problems, quality of mathematical reasoning, growth in strategy flexibility, and development of growth mindset beliefs about mathematical ability.",
      sourceUrl: "https://www.youcubed.org/",
      gradeMap: freeze({
        "K-1": freeze([
          freeze({ unit: "Number decomposition", swbat: "Decompose numbers in multiple ways and explain thinking visually; use multiple strategies to solve addition problems and discuss why different strategies work", focus: "multiple representations, flexible thinking, growth mindset", sourceType: "verified" }),
          freeze({ unit: "Visual thinking", swbat: "Recognize that different ways of showing a number are equivalent; explain thinking about quantity, subitizing, and counting", focus: "multidimensional thinking, visual representation, mathematical communication", sourceType: "verified" })
        ]),
        "2": freeze([
          freeze({ unit: "Multiple strategies", swbat: "Solve addition and subtraction problems in multiple ways; explain why different strategies work and when each is useful", focus: "strategy flexibility, relational thinking, mathematical justification", sourceType: "verified" }),
          freeze({ unit: "Visual investigation", swbat: "Visualize and represent numbers using arrays, groups, and other models; investigate patterns and make conjectures about number relationships", focus: "visual/multidimensional thinking, pattern recognition, mathematical reasoning", sourceType: "verified" }),
          freeze({ unit: "Collaborative reasoning", swbat: "Discuss and justify mathematical reasoning in small groups; listen to and evaluate peer strategies", focus: "mathematical communication, collaborative learning, growth mindset", sourceType: "verified" })
        ]),
        "3": freeze([
          freeze({ unit: "Multiplication strategies", swbat: "Develop and communicate multiple strategies for multiplication and division; investigate and explain patterns in multiplication arrays and area models", focus: "strategy development, pattern exploration, mathematical explanation", sourceType: "verified" }),
          freeze({ unit: "Open-ended problem solving", swbat: "Solve open-ended problems using multiple representations (drawings, equations, models); explain why a strategy works and when it is most efficient", focus: "flexible problem-solving, multiple representations, strategic thinking", sourceType: "verified" })
        ]),
        "4-5": freeze([
          freeze({ unit: "Complex problem solving", swbat: "Solve complex multi-step problems in multiple ways; justify reasoning using mathematical models and visual representations", focus: "complex reasoning, multiple solution paths, deep understanding", sourceType: "verified" }),
          freeze({ unit: "Fraction visualization", swbat: "Visualize fraction and decimal concepts using area models, number lines, and other representations; investigate relationships between fractions/decimals", focus: "visual reasoning, multiple representations, conceptual understanding", sourceType: "verified" }),
          freeze({ unit: "Mathematical elegance", swbat: "Analyze different solution methods and discuss mathematical efficiency and elegance; develop appreciation for mathematical thinking", focus: "strategy analysis, mathematical aesthetics, deeper engagement", sourceType: "verified" })
        ]),
        "6-8": freeze([
          freeze({ unit: "Algebraic reasoning", swbat: "Solve real-world problems using algebraic and geometric reasoning with multiple solution paths; justify mathematical claims using mathematical language", focus: "algebraic thinking, real-world connections, mathematical justification", sourceType: "verified" }),
          freeze({ unit: "Visual exploration", swbat: "Create visual representations and algebraic models to explore mathematical relationships; investigate patterns and test conjectures", focus: "visual/algebraic integration, exploratory learning, mathematical reasoning", sourceType: "verified" }),
          freeze({ unit: "Mathematical communication", swbat: "Communicate mathematical reasoning with clarity and precision; engage in mathematical discourse about different solution strategies and their merits", focus: "mathematical communication, collaborative reasoning, intellectual growth", sourceType: "verified" })
        ])
      }),
      sourceType: "verified"
    })
  });

  function getEntry(id) {
    var key = String(id || "");
    return ENTRIES[key] || null;
  }

  function cloneEntry(id) {
    var entry = getEntry(id);
    return entry ? JSON.parse(JSON.stringify(entry)) : null;
  }

  function getProgram(id) {
    var key = String(id || "");
    return PROGRAMS[key] || null;
  }

  function cloneProgram(id) {
    var program = getProgram(id);
    return program ? JSON.parse(JSON.stringify(program)) : null;
  }

  window.CSCurriculumTruth = freeze({
    getEntry: getEntry,
    cloneEntry: cloneEntry,
    getProgram: getProgram,
    cloneProgram: cloneProgram,
    entries: ENTRIES,
    programs: PROGRAMS
  });
})();
