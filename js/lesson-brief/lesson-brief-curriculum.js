/**
 * Lesson Brief Panel - Curriculum Builders
 *
 * All curriculum-specific brief builders extracted from lesson-brief-panel.js
 * Each builder generates a complete brief object for its curriculum.
 *
 * Builders:
 * - Illustrative Math
 * - Fishtank ELA
 * - EL Education
 * - UFLI Foundations
 * - Fundations
 * - Just Words
 * - Heggerty PA
 * - Bridges Math
 * - Step Up to Writing
 * - SAS Humanities
 *
 * @module js/lesson-brief/lesson-brief-curriculum
 */

import { FUNDATIONS_LEVELS, JUST_WORDS_UNITS, HEGGERTY_ROUTINES, BRIDGES_COMPONENTS, STEP_UP_GENRES, STEP_UP_STAGES } from './lesson-brief-constants.js';
import { formatGradeLabel, normalizeGrade, buildFishtankGradeLink, buildElModuleLinks } from './lesson-brief-utils.js';

/**
 * Context line formatter
 * Builds display string from current selection state
 * @param {Object} selection - Current selection object
 * @param {Object} supportTypes - Support type lookup table
 * @returns {string} Formatted context line
 * @private
 */
function contextLine(selection, supportTypes) {
  const bits = [];
  if (selection && selection.blockLabel) bits.push(selection.blockLabel);
  if (selection && selection.blockTime) bits.push(selection.blockTime);
  if (selection && selection.supportType) {
    const item = supportTypes.find(t => t.id === selection.supportType);
    if (item) bits.push(item.label);
  }
  return bits.join(' • ');
}

/**
 * Parse lesson references from block data
 * Extracts unit, lesson, and grade from various sources
 * @param {Object} selection - Current selection
 * @param {Object} currentBlock - Current block data
 * @returns {Object} Parsed reference {grade, unit, lesson}
 * @private
 */
function parseIllustrativeReference(selection, currentBlock) {
  const block = currentBlock || {};
  const unitSource = [selection.customUnit, block.lesson, selection.lessonLabel].filter(Boolean).join(' ');
  const lessonSource = [selection.lessonLabel, block.lesson].filter(Boolean).join(' ');
  const gradeSource = [block.classSection, block.lesson, selection.blockLabel, selection.grade].filter(Boolean).join(' ');

  const unitMatch = unitSource.match(/unit\s*(\d+)/i);
  const lessonMatch = lessonSource.match(/lesson\s*(\d+)/i);
  const gradeMatch = gradeSource.match(/grade\s*(k|[1-9]|1[0-2])/i);

  return {
    grade: gradeMatch && gradeMatch[1] ? normalizeGrade(gradeMatch[1]) : normalizeGrade(selection.grade),
    unit: unitMatch && unitMatch[1] ? String(Number(unitMatch[1])) : '',
    lesson: lessonMatch && lessonMatch[1] ? String(Number(lessonMatch[1])) : ''
  };
}

/**
 * Deduplicate list items
 * Removes null/undefined and duplicates while preserving order
 * @param {Array} items - Items to deduplicate
 * @returns {Array} Deduplicated items
 * @private
 */
function dedupeList(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    if (!item) return false;
    const key = String(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Format curriculum note from entry/program
 * @param {Object} entry - Curriculum entry
 * @param {Object} program - Program definition
 * @returns {string} Progress data note
 * @private
 */
function progressDataLine(entry, program) {
  if (entry && entry.progressDataNote) return String(entry.progressDataNote);
  if (program && program.progressDataNote) return String(program.progressDataNote);
  return '';
}

/**
 * Format truth lines from entry
 * Combines officialFocus and assessmentDetail with fallback
 * @param {Object} entry - Truth entry
 * @param {string} fallback - Fallback text
 * @returns {string} Formatted lines
 * @private
 */
function truthLines(entry, fallback) {
  const lines = [];
  if (entry && entry.officialFocus) lines.push(entry.officialFocus);
  if (entry && entry.assessmentDetail) lines.push(entry.assessmentDetail);
  return lines.length ? lines.join(' ') : String(fallback || '');
}

/**
 * Render tips with program-specific guidance
 * @param {Array} items - Base items
 * @param {string} programId - Program identifier
 * @returns {Array} Enhanced items with tips
 * @private
 */
function renderWithTips(items, programId) {
  // Could be extended with program-specific tips
  return dedupeList(items);
}

// ============================================================================
// Curriculum Builders
// ============================================================================

/**
 * Build Illustrative Math brief
 * @param {Object} deps - Dependencies {selection, currentBlock, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object
 */
export function buildIllustrativeBrief(deps) {
  const { selection, currentBlock, CurriculumTruth, supportTypes } = deps;

  const reference = parseIllustrativeReference(selection, currentBlock);
  const grade = reference.grade || '4';
  const unit = reference.unit || '';
  const lesson = reference.lesson || '';

  const truthId = grade && unit && lesson ? ['im', 'g' + String(grade).toLowerCase(), 'u' + unit, 'l' + lesson].join('-') : '';
  const entry = truthId && CurriculumTruth && typeof CurriculumTruth.cloneEntry === 'function'
    ? CurriculumTruth.cloneEntry(truthId)
    : null;
  const program = CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function'
    ? CurriculumTruth.cloneProgram('illustrative-math')
    : null;

  const titleBits = [];
  if (grade) titleBits.push(formatGradeLabel(grade));
  if (unit) titleBits.push('Unit ' + unit);
  if (lesson) titleBits.push('Lesson ' + lesson);

  return {
    key: ['illustrative', grade || 'g', unit || 'u', lesson || 'l'].join(':'),
    curriculumLabel: 'Illustrative Math',
    title: titleBits.join(' - ') || 'Illustrative Math',
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Lesson briefing',
    swbat: entry && entry.officialFocus
      ? 'Students will be able to ' + entry.officialFocus.toLowerCase().replace(/\.$/, '') + '.'
      : 'Students will be able to use a visual model to represent and explain the mathematical relationship.',
    curriculumPath: ['Illustrative Math', grade ? 'Grade ' + grade : null, unit ? 'Unit ' + unit : null].filter(Boolean).join(' · '),
    sourceType: entry ? 'verified' : 'broad',
    interventionRecs: [
      'Pre-teach the key vocabulary and model before the lesson warm-up.',
      'Keep one visual representation visible throughout the lesson.',
      'After the cool-down, use the student\'s error to design tomorrow\'s targeted practice.'
    ],
    summary: entry && entry.officialFocus ? entry.officialFocus : 'Use the current Illustrative Math lesson goal, visual model, and cool-down together.',
    mainConcept: entry && entry.assessmentDetail ? entry.assessmentDetail : 'Students should show the quantity or relationship first, then explain the math language.',
    workedExample: entry && entry.supportMove ? entry.supportMove : 'Model one example with a visual representation before asking for independent explanation.',
    likelyConfusions: [
      'Naming an answer without showing the model or quantity first.',
      'Using the right representation but not explaining what it proves.',
      'Switching procedures before the relationship in the problem is clear.'
    ],
    supportMoves: dedupeList([
      entry && entry.supportMove,
      'Keep the class representation visible while the student explains the relationship.',
      'Ask the student to point to the equal amount, part, or comparison before naming it.'
    ]),
    progressDataNote: progressDataLine(entry, program),
    resourceLinks: entry || program ? [
      { label: 'Open lesson overview', href: entry && entry.sourceUrl || 'https://illustrativemathematics.org/', meta: 'Illustrative lesson context' }
    ] : [],
    lookFors: [
      'Student matches the model to the mathematical idea with one prompt or less.',
      'Student uses lesson language to explain why the representation works.'
    ],
    prompts: [
      'What in the model shows your answer is true?',
      'Which two quantities match here, and how do you know?',
      'Can you explain the relationship before you compute?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - Illustrative Math ' + (lesson ? 'L' + lesson : 'brief'))
  };
}

/**
 * Build Fishtank ELA brief
 * @param {Object} deps - Dependencies {unit, lessonNumber, selection, data, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object or null
 */
export function buildFishtankBrief(deps) {
  const { unit, lessonNumber, selection, data, CurriculumTruth, supportTypes } = deps;

  if (!unit || !data || !data.fishtank || !data.fishtank.domains) return null;

  const domain = String(unit.domain || 'narrative');
  const domainNode = data.fishtank.domains[domain] || data.fishtank.domains.narrative;
  const lessonCount = Number(unit.lessonCount || 1);
  const lesson = Number(lessonNumber || 1);
  const phaseKey = lesson <= Math.max(2, Math.ceil(lessonCount * 0.3)) ? 'launch'
    : lesson >= Math.max(3, Math.ceil(lessonCount * 0.76)) ? 'synthesize' : 'build';
  const phaseNode = domainNode[phaseKey] || domainNode.build;
  const skills = Array.isArray(unit.keySkills) && unit.keySkills.length ? unit.keySkills : ['text evidence', 'academic discussion'];

  const tokens = {
    unitTitle: unit.title || 'this unit',
    anchor: unit.anchor || 'the anchor theme',
    skill1: skills[0] || 'text evidence',
    skill2: skills[1] || skills[0] || 'discussion',
    textReference: unit.coreText || unit.title || 'the anchor text'
  };

  const replace = (template) => String(template || '').replace(/\{([a-zA-Z0-9]+)\}/g, (_match, key) =>
    tokens[key] == null ? '' : String(tokens[key])
  );

  return {
    key: ['fishtank', unit.id, lesson].join(':'),
    curriculumLabel: 'Fishtank ELA',
    title: formatGradeLabel(normalizeGrade(unit.grade)) + ' - ' + (unit.title || 'Fishtank unit') + ' - Lesson ' + lesson,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: phaseNode.phaseLabel || 'Lesson briefing',
    swbat: 'Students will be able to ' + (skills[0] || 'engage with text evidence') + (skills[1] ? ' and ' + skills[1] : '') + '.',
    curriculumPath: ['Fishtank ELA', unit.grade ? 'Grade ' + normalizeGrade(unit.grade) : null, unit.title].filter(Boolean).join(' · '),
    sourceType: 'broad',
    interventionRecs: [
      'Preview the anchor text or key vocabulary before whole-class work begins.',
      'Provide one sentence frame or discussion prompt aligned to the lesson question.',
      'Use the same text as the class but with a shorter passage or pre-marked evidence.'
    ],
    summary: replace(phaseNode.summaryTemplate),
    mainConcept: replace(phaseNode.coreConceptTemplate),
    workedExample: replace(phaseNode.workedExampleTemplate),
    likelyConfusions: Array.isArray(domainNode.likelyConfusions) ? domainNode.likelyConfusions.slice() : [],
    supportMoves: renderWithTips(Array.isArray(domainNode.supportMoves) ? domainNode.supportMoves.slice() : [], 'fishtank-ela'),
    progressDataNote: progressDataLine(null, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('fishtank-ela') : null),
    resourceLinks: [
      { label: 'Open grade sequence', href: buildFishtankGradeLink(unit), meta: 'Fishtank grade overview' },
      { label: 'Open curriculum overview', href: 'https://www.fishtanklearning.org/curriculum/ela/', meta: 'Fishtank ELA overview' }
    ],
    lookFors: Array.isArray(domainNode.lookFors) ? domainNode.lookFors.slice() : [],
    prompts: Array.isArray(domainNode.prompts) ? domainNode.prompts.slice() : [],
    recentLabel: ((selection.studentName || 'Planning') + ' - ' + (unit.title || 'Fishtank') + ' L' + lesson)
  };
}

/**
 * Build EL Education brief
 * @param {Object} deps - Dependencies {unit, module, grade, selection, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object or null
 */
export function buildElBrief(deps) {
  const { unit, module, grade, selection, CurriculumTruth, supportTypes } = deps;

  if (!unit) return null;

  const entry = CurriculumTruth && typeof CurriculumTruth.cloneEntry === 'function'
    ? CurriculumTruth.cloneEntry(grade === '6' ? 'el-g6-current' : grade === '7' ? 'el-g7-current' : grade === '8' ? 'el-g8-current' : '')
    : null;
  const links = buildElModuleLinks(grade, module, unit);

  return {
    key: ['el', grade, module && module.id, unit.id].join(':'),
    curriculumLabel: 'EL Education ELA',
    title: formatGradeLabel(grade) + ' - ' + (unit.title || 'EL unit'),
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Unit briefing',
    swbat: entry && entry.officialFocus
      ? 'Students will be able to ' + entry.officialFocus.toLowerCase().replace(/\.$/, '') + '.'
      : 'Students will be able to analyze text evidence and contribute to structured discussion.',
    curriculumPath: ['EL Education', grade ? 'Grade ' + grade : null, module && module.title ? module.title : null].filter(Boolean).join(' · '),
    sourceType: entry ? 'verified' : 'broad',
    interventionRecs: [
      'Preview the note-catcher structure and vocabulary before the lesson begins.',
      'Provide one sentence stem aligned to the evidence standard for the unit.',
      'After the lesson, review the note-catcher together and highlight one strong piece of evidence.'
    ],
    summary: entry && entry.officialFocus ? entry.officialFocus : String(unit.summary || ''),
    mainConcept: entry && entry.assessmentDetail ? entry.assessmentDetail : String(unit.mainConcept || ''),
    workedExample: String(unit.workedExample || ''),
    likelyConfusions: Array.isArray(unit.likelyConfusions) ? unit.likelyConfusions.slice() : [],
    supportMoves: dedupeList((entry && entry.supportMove ? [entry.supportMove] : []).concat(unit.supportMoves ? unit.supportMoves.slice() : [])),
    progressDataNote: progressDataLine(entry, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('el-education') : null),
    resourceLinks: [
      { label: 'Open module overview', href: links.moduleHref, meta: 'EL module overview' },
      { label: 'Open current unit', href: links.unitHref, meta: 'EL unit overview' }
    ],
    lookFors: unit.lookFors ? unit.lookFors.slice() : [],
    prompts: unit.prompts ? unit.prompts.slice() : [],
    recentLabel: ((selection.studentName || 'Planning') + ' - ' + (unit.title || 'EL unit'))
  };
}

/**
 * Build UFLI Foundations brief
 * @param {Object} deps - Dependencies {selection, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object
 */
export function buildUfliBrief(deps) {
  const { selection, CurriculumTruth, supportTypes } = deps;

  const entry = CurriculumTruth && typeof CurriculumTruth.cloneEntry === 'function'
    ? CurriculumTruth.cloneEntry('ufli-current')
    : null;

  return {
    key: ['ufli', selection.lesson].join(':'),
    curriculumLabel: 'UFLI Foundations',
    title: 'UFLI Lesson ' + selection.lesson,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Current lesson',
    swbat: 'Students will be able to blend, read, and encode words with the UFLI Lesson ' + selection.lesson + ' target pattern.',
    curriculumPath: 'UFLI Foundations · Lesson ' + selection.lesson,
    sourceType: 'broad',
    interventionRecs: [
      'Open with the cumulative review routine before introducing the new pattern.',
      'Correct at the phoneme level: model the sound, have the student echo, then reread the word.',
      'End every session with 1-2 connected-text sentences containing the target pattern.'
    ],
    summary: entry && entry.officialFocus ? entry.officialFocus : 'Keep the UFLI routine tight and cumulative.',
    mainConcept: entry && entry.assessmentDetail ? entry.assessmentDetail : 'Students need accuracy at the sound-pattern level before speed.',
    workedExample: 'Pick one target word, say each sound, blend it, spell it, then reread it in a short phrase.',
    likelyConfusions: [
      'Guessing from the whole word shape instead of mapping sounds.',
      'Dropping the new pattern when reading connected text.',
      'Moving too fast and skipping cumulative review.'
    ],
    supportMoves: renderWithTips((entry && entry.supportMove ? [entry.supportMove] : []).concat([
      'Keep the UFLI routine in the same order every time.',
      'Correct at the sound or pattern level, then have the student reread immediately.',
      'Use one short transfer sentence before moving on.'
    ]), 'ufli'),
    progressDataNote: progressDataLine(entry, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('ufli-foundations') : null),
    resourceLinks: [{ label: 'Open UFLI Foundations overview', href: 'https://ufli.education.ufl.edu/foundations/', meta: 'Program overview' }],
    lookFors: [
      'Student reads with sound-by-sound accuracy first.',
      'Student can spell the target pattern, not just read it.',
      'Student carries the pattern into a second example.'
    ],
    prompts: [
      'Which sound or chunk do you know first?',
      'Can you tap it, blend it, then reread it smoothly?',
      'Where do you see the same pattern in the next word?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - UFLI L' + selection.lesson)
  };
}

/**
 * Build Fundations brief
 * @param {Object} deps - Dependencies {selection, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object
 */
export function buildFundationsBrief(deps) {
  const { selection, CurriculumTruth, supportTypes } = deps;

  const entry = CurriculumTruth && typeof CurriculumTruth.cloneEntry === 'function'
    ? (selection.level === '2' && String(selection.lesson || '') === '8'
      ? CurriculumTruth.cloneEntry('fundations-l2-u8')
      : CurriculumTruth.cloneEntry('fundations-k-current'))
    : null;

  const levelLabel = FUNDATIONS_LEVELS.find(l => l.id === selection.level)?.label || 'Level 1';

  return {
    key: ['fundations', selection.level, selection.lesson].join(':'),
    curriculumLabel: 'Fundations',
    title: 'Fundations ' + levelLabel + ' - Unit ' + selection.lesson,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Structured literacy',
    swbat: entry && entry.officialFocus
      ? 'Students will be able to ' + entry.officialFocus.toLowerCase().replace(/\.$/, '') + '.'
      : 'Students will be able to decode, encode, and transfer the target Fundations pattern.',
    curriculumPath: 'Fundations · ' + levelLabel + ' · Unit ' + selection.lesson,
    sourceType: entry && entry.sourceType === 'verified' ? 'verified' : 'broad',
    interventionRecs: [
      'Use sound-tapping or finger-spelling before dictation to anchor the phoneme sequence.',
      'Mark the pattern consistently before asking the student to read or spell independently.',
      'Connect the unit pattern to a word the student already knows before introducing new words.'
    ],
    summary: truthLines(entry, 'Use the current Fundations unit for explicit decoding, encoding, and connected-text transfer.'),
    mainConcept: entry && entry.progressMonitoring ? entry.progressMonitoring : 'Students need to connect sounds, letters, marking, and spelling in the same routine.',
    workedExample: 'Tap the sounds in one word, mark the pattern, read it, spell it, and use it in a short dictated sentence.',
    likelyConfusions: [
      'Skipping the sound routine and jumping to the whole word.',
      'Remembering the pattern in isolation but losing it in dictation.',
      'Mixing known and new trick words.'
    ],
    supportMoves: renderWithTips((entry && entry.supportMove ? [entry.supportMove] : []).concat([
      'Use the same oral routine the classroom teacher uses.',
      'Keep modeling brief, then get the student producing the response.',
      'Return to one previously taught pattern before introducing the new part.'
    ]), 'fundations'),
    progressDataNote: progressDataLine(entry, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('fundations') : null),
    resourceLinks: [{ label: 'Open Fundations overview', href: 'https://www.wilsonlanguage.com/programs/fundations/', meta: 'Program overview' }],
    lookFors: [
      'Student can tap, read, and spell the target pattern.',
      'Student marks or explains the pattern accurately enough to show understanding.',
      'Student transfers the pattern into a second word or sentence.'
    ],
    prompts: [
      'What pattern do you notice in this word?',
      'Can you tap it, read it, then write it?',
      'Where is the tricky part we need to remember?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - Fundations L' + selection.level + 'U' + selection.lesson)
  };
}

/**
 * Build Just Words brief
 * @param {Object} deps - Dependencies {selection, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object
 */
export function buildJustWordsBrief(deps) {
  const { selection, CurriculumTruth, supportTypes } = deps;

  const unit = JUST_WORDS_UNITS.find(row => row.id === selection.jwUnitId) || JUST_WORDS_UNITS[0];
  const entry = CurriculumTruth && typeof CurriculumTruth.cloneEntry === 'function'
    ? CurriculumTruth.cloneEntry('justwords-current')
    : null;

  return {
    key: ['just-words', unit.id].join(':'),
    curriculumLabel: 'Just Words',
    title: unit.label,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Word study intervention',
    swbat: 'Students will be able to decode and spell multisyllabic words using the patterns taught in Just Words.',
    curriculumPath: 'Just Words · ' + unit.label,
    sourceType: 'broad',
    interventionRecs: [
      'Mark the syllable boundaries before reading each target word.',
      'Limit the word set to 5-8 words and add 2-3 transfer sentences per session.',
      'Repeat dictated sentences from the previous session before introducing new words.'
    ],
    summary: entry && entry.officialFocus ? entry.officialFocus : 'Keep Just Words fast, explicit, and closely tied to reading and spelling transfer.',
    mainConcept: entry && entry.assessmentDetail ? entry.assessmentDetail : 'Older students need direct word analysis plus immediate application in connected text.',
    workedExample: 'Take one multisyllabic word, mark the chunks, read it, spell it, then use it in a phrase.',
    likelyConfusions: [
      'Reading the word once without analyzing the meaningful chunks.',
      'Knowing the pattern in word study but not applying it while reading text.',
      'Confusing a prefix or suffix label with its function in the word.'
    ],
    supportMoves: renderWithTips((entry && entry.supportMove ? [entry.supportMove] : []).concat([
      'Keep the target set small and cumulative.',
      'Ask the student to explain which chunk helped unlock the word.',
      'Finish with a quick transfer read or write.'
    ]), 'just-words'),
    progressDataNote: progressDataLine(entry, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('just-words') : null),
    resourceLinks: [{ label: 'Open Just Words overview', href: 'https://www.wilsonlanguage.com/programs/just-words/', meta: 'Program overview' }],
    lookFors: [
      'Student identifies the relevant chunk or morpheme.',
      'Student can read and spell the word family more accurately.',
      'Student applies the pattern in a new example.'
    ],
    prompts: [
      'Which part of the word gives you the best clue first?',
      'How does this chunk affect pronunciation or meaning?',
      'Can you use the same pattern in one more word?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - ' + unit.label)
  };
}

/**
 * Build Heggerty Phonemic Awareness brief
 * @param {Object} deps - Dependencies {selection, supportTypes}
 * @returns {Object} Brief object
 */
export function buildHeggertybBrief(deps) {
  const { selection, supportTypes } = deps;

  const routine = HEGGERTY_ROUTINES.find(row => row.id === selection.haggertyRoutine) || HEGGERTY_ROUTINES[0];

  return {
    key: ['haggerty', routine.id, selection.lessonLabel || ''].join(':'),
    curriculumLabel: 'Heggerty / Haggerty PA',
    title: 'Heggerty routine - ' + routine.label,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Oral phonemic awareness',
    swbat: 'Students will be able to manipulate phonemes as part of the daily Heggerty/Haggerty sequence.',
    curriculumPath: 'Heggerty / Haggerty PA · ' + routine.label,
    sourceType: 'broad',
    interventionRecs: [
      'Keep the PA routine purely oral — do not add print until the oral response is accurate.',
      'Slow the pace on manipulation tasks and repeat with corrective echo before moving on.',
      'Connect oral work to a letter-sound card the student knows before transitioning to decoding.'
    ],
    summary: 'This routine is targeting phonemic awareness. Keep it oral, brisk, and highly responsive to student errors.',
    mainConcept: 'Heggerty is about hearing and manipulating sounds before print gets added.',
    workedExample: 'Say the word, pause, and have the student say the sounds or manipulate one sound before repeating the full word.',
    likelyConfusions: [
      'Adding print too early instead of staying oral.',
      'Collapsing sounds together when segmenting.',
      'Needing more wait time when sounds are added, deleted, or substituted.'
    ],
    supportMoves: renderWithTips([
      'Keep the response window short but fair.',
      'Repeat the task with cleaner articulation instead of overexplaining.',
      'Return to one easier item before retrying the harder manipulation.'
    ], 'haggerty'),
    lookFors: [
      'Student can hear each phoneme clearly enough to respond accurately.',
      'Student improves with one immediate redo.',
      'Student keeps the full word stable after manipulating one sound.'
    ],
    prompts: [
      'Say the word. Now say each sound.',
      'Say it again without the first sound.',
      'Change the first sound. What is the new word?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - Heggerty ' + routine.label)
  };
}

/**
 * Build Bridges Math brief
 * @param {Object} deps - Dependencies {selection, CurriculumTruth, supportTypes}
 * @returns {Object} Brief object
 */
export function buildBridgesBrief(deps) {
  const { selection, CurriculumTruth, supportTypes } = deps;

  const component = BRIDGES_COMPONENTS.find(row => row.id === selection.bridgesComponent) || BRIDGES_COMPONENTS[0];

  return {
    key: ['bridges', selection.bridgesComponent, selection.lessonLabel || ''].join(':'),
    curriculumLabel: 'Bridges Math',
    title: component.label + (selection.lessonLabel ? ' - ' + selection.lessonLabel : ''),
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: component.phaseLabel || 'Math intervention',
    swbat: 'Students will be able to ' + component.summary.toLowerCase().replace(/\.$/, '') + '.',
    curriculumPath: 'Bridges Math · ' + component.label + (selection.lessonLabel ? ' · ' + selection.lessonLabel : ''),
    sourceType: 'broad',
    interventionRecs: [
      'Name the one mathematical idea before beginning the task (one concept per session).',
      'Anchor in one concrete or visual representation before asking for an explanation.',
      'After the activity, have the student say or write one sentence about what the model proves.'
    ],
    summary: component.summary,
    mainConcept: component.mainConcept,
    workedExample: component.workedExample,
    likelyConfusions: component.confusions ? component.confusions.slice() : [],
    supportMoves: renderWithTips(component.moves ? component.moves.slice() : [], 'bridges-math'),
    progressDataNote: progressDataLine(null, CurriculumTruth && typeof CurriculumTruth.cloneProgram === 'function' ? CurriculumTruth.cloneProgram('bridges-intervention') : null),
    resourceLinks: [{ label: 'Open Bridges Intervention overview', href: 'https://www.mathlearningcenter.org/curriculum/bridges-intervention', meta: 'Program overview' }],
    lookFors: component.lookFors ? component.lookFors.slice() : [],
    prompts: component.prompts ? component.prompts.slice() : [],
    recentLabel: ((selection.studentName || 'Planning') + ' - Bridges ' + component.label)
  };
}

/**
 * Build Step Up to Writing brief
 * @param {Object} deps - Dependencies {selection, supportTypes}
 * @returns {Object} Brief object
 */
export function buildStepUpBrief(deps) {
  const { selection, supportTypes } = deps;

  const genre = STEP_UP_GENRES.find(row => row.id === selection.stepUpGenre) || STEP_UP_GENRES[0];
  const stage = STEP_UP_STAGES.find(row => row.id === selection.stepUpStage) || STEP_UP_STAGES[0];

  return {
    key: ['step-up', genre.id, stage.id, selection.lessonLabel || ''].join(':'),
    curriculumLabel: 'Step Up to Writing',
    title: genre.label + ' - ' + stage.label,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Writing support',
    swbat: 'Students will be able to ' + stage.concept.toLowerCase().replace(/\.$/, '') + ' in a ' + genre.label.toLowerCase() + ' piece.',
    curriculumPath: 'Step Up to Writing · ' + genre.label + ' · ' + stage.label,
    sourceType: 'broad',
    interventionRecs: [
      'Pre-fill the first section of the organizer together before the student works independently.',
      'Keep the color-coding consistent with what the classroom teacher uses.',
      'End the session with one sentence read aloud from the draft to build editing awareness.'
    ],
    summary: 'This writing block is centered on ' + genre.label.toLowerCase() + ' work during the ' + stage.label.toLowerCase() + ' stage.',
    mainConcept: stage.concept,
    workedExample: 'Take one paragraph and ask the student to name the color-coded job of each part before revising.',
    likelyConfusions: [
      'Adding sentences without a clear structure.',
      'Confusing elaboration with repetition.',
      'Using transitions that do not match the relationship between ideas.'
    ],
    supportMoves: [
      'Anchor the student in one organizer row or one paragraph at a time.',
      'Ask what each sentence is doing before asking whether it sounds good.',
      'Use one sentence frame or color cue to tighten structure quickly.'
    ],
    lookFors: [
      'Student can name the role of a sentence or paragraph.',
      'Student organizes evidence or details more clearly after one prompt.',
      'Student revises with purpose instead of just adding length.'
    ],
    prompts: [
      'What job is this sentence doing?',
      'What detail or evidence belongs here?',
      'Which transition best matches the relationship between these ideas?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - Step Up ' + stage.label)
  };
}

/**
 * Build SAS Humanities brief
 * @param {Object} deps - Dependencies {selection, supportTypes}
 * @returns {Object} Brief object
 */
export function buildHumanitiesBrief(deps) {
  const { selection, supportTypes } = deps;

  const course = selection.customCourse || 'SAS Humanities 9';
  const unit = selection.customUnit || 'current unit';
  const text = selection.customText ? ' using ' + selection.customText : '';
  const lesson = selection.lessonLabel || 'today\'s lesson';

  return {
    key: ['humanities-9', course, unit, lesson].join(':'),
    curriculumLabel: 'SAS Humanities 9',
    title: course + ' - ' + lesson,
    contextLine: contextLine(selection, supportTypes),
    phaseLabel: 'Manual humanities briefing',
    swbat: 'Students will be able to identify the central claim or question in ' + unit + ', select and explain supporting evidence, and contribute to academic discussion' + text + '.',
    curriculumPath: ['SAS Humanities 9', unit !== 'current unit' ? unit : null, lesson !== 'today\'s lesson' ? lesson : null].filter(Boolean).join(' · '),
    sourceType: 'broad',
    interventionRecs: [
      'Preview the central question and one key source or passage before class.',
      'Provide an annotation target: one question to answer while reading.',
      'After the discussion, have the student write one sentence stating the claim and one piece of evidence.'
    ],
    summary: 'This briefing is anchored to ' + unit + text + '. The main support job is helping the student track the central claim.',
    mainConcept: 'Humanities support usually means reducing task load without reducing intellectual demand.',
    workedExample: 'Ask the student to identify the strongest line, image, or idea and explain it before expanding.',
    likelyConfusions: [
      'Reading for completion instead of reading for a claim or idea.',
      'Quoting evidence without explaining its significance.',
      'Losing the thread of the discussion or annotation task.'
    ],
    supportMoves: [
      'Name the essential question before reading or annotating.',
      'Keep the student on one paragraph, image, or source excerpt at a time.',
      'Use one frame: This matters because it shows ___.'
    ],
    resourceLinks: [],
    lookFors: [
      'Student can name the central idea or claim in plain language.',
      'Student connects one piece of evidence to that idea.',
      'Student can speak or write one complete analytical sentence.'
    ],
    prompts: [
      'What idea is this source pushing us toward?',
      'Which piece of evidence matters most here?',
      'How would you explain that evidence in one precise sentence?'
    ],
    recentLabel: ((selection.studentName || 'Planning') + ' - ' + lesson)
  };
}

export default {
  buildIllustrativeBrief,
  buildFishtankBrief,
  buildElBrief,
  buildUfliBrief,
  buildFundationsBrief,
  buildJustWordsBrief,
  buildHeggertybBrief,
  buildBridgesBrief,
  buildStepUpBrief,
  buildHumanitiesBrief
};
