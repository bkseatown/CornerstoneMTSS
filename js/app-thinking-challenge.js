/**
 * app-thinking-challenge.js
 * Low-coupling thinking challenge helpers for Deep Dive prompt construction.
 */

function createThinkingChallengeModule(deps) {
  const {
    DEFAULT_PREFS = {},
    THINKING_LEVEL_META = {},
    deepDiveBuilders = null,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    formatGradeBandLabel = (value) => value,
    getActiveMaxGuesses = () => 6,
    getFocusLabel = (value) => value,
    parseFocusPreset = () => ({ kind: 'all' }),
    pickRandom = () => '',
    prefs = {}
  } = deps || {};

  function trimPromptText(value, max = 80) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
  }

  function pickThinkingLevel(result) {
    const guessCount = Math.max(1, Number(result?.guesses?.length || 0));
    const maxGuesses = getActiveMaxGuesses();
    if (result?.won) {
      if (guessCount <= Math.max(2, Math.ceil(maxGuesses * 0.34))) {
        return pickRandom(['evaluate', 'create']) || 'create';
      }
      if (guessCount <= Math.max(3, Math.ceil(maxGuesses * 0.67))) {
        return pickRandom(['apply', 'analyze']) || 'analyze';
      }
      return 'apply';
    }
    if (guessCount <= 2) return 'remember';
    if (guessCount >= Math.max(4, maxGuesses - 1)) return 'understand';
    return 'apply';
  }

  function getChallengeFocusLabel(value) {
    return getFocusLabel(value)
      .replace(/[—]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Classic (Wordle 5x6)';
  }

  function getChallengeTopicLabel(result) {
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const phonics = String(result?.entry?.phonics || '').trim();
    if (phonics && phonics.toLowerCase() !== 'all') return phonics;
    if (preset.kind === 'subject') return `${preset.subject.toUpperCase()} vocabulary`;
    if (preset.kind === 'phonics') return getChallengeFocusLabel(focusValue);
    return 'Word meaning + sentence clues';
  }

  function getChallengeGradeLabel(result) {
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject' && preset.gradeBand) {
      return formatGradeBandLabel(preset.gradeBand);
    }
    const entryBand = String(result?.entry?.grade_band || '').trim();
    if (entryBand) return formatGradeBandLabel(entryBand);
    return formatGradeBandLabel(el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade);
  }

  function buildThinkingPrompt(level, result) {
    const word = String(result?.word || '').trim().toUpperCase();
    const sentence = trimPromptText(result?.entry?.sentence, 76);
    const topic = trimPromptText(getChallengeTopicLabel(result), 44);
    const promptsByLevel = {
      remember: [
        `Say "${word}" and spell it out loud.`,
        `Clap each sound in "${word}", then say the whole word.`
      ],
      understand: [
        `In your own words, what does "${word}" mean?`,
        sentence
          ? `How does "${word}" help the meaning of this sentence: "${sentence}"?`
          : `Tell what "${word}" means and give one real-life example.`
      ],
      apply: [
        `Use "${word}" in a brand-new sentence about your day.`,
        `Say a sentence with "${word}" that could happen at school or home.`
      ],
      analyze: [
        `Compare "${word}" with another word from this quest focus (${topic}). What is one key difference?`,
        `In this ${topic} quest, which clue helped most: start, ending, or sentence context? Why?`
      ],
      evaluate: [
        `Which strategy helped most this round and why?`,
        `If you played this word again, what one move would you keep? Explain.`
      ],
      create: [
        `Create a clue for "${word}" without saying the word.`,
        `Write a mini riddle that leads to "${word}".`
      ]
    };
    return pickRandom(promptsByLevel[level] || promptsByLevel.apply) || '';
  }

  function buildThinkingChallenge(result, options = {}) {
    if (!result?.word) return null;
    const forcedLevel = deepDiveBuilders?.normalizeThinkingLevel?.(options.level || '', '') || '';
    const level = forcedLevel || pickThinkingLevel(result);
    const meta = THINKING_LEVEL_META[level] || THINKING_LEVEL_META.apply;
    const prompt = buildThinkingPrompt(level, result);
    if (!prompt) return null;
    return {
      level,
      chip: meta.chip,
      prompt,
      teacher: meta.teacher
    };
  }

  return Object.freeze({
    buildThinkingChallenge,
    buildThinkingPrompt,
    getChallengeFocusLabel,
    getChallengeGradeLabel,
    getChallengeTopicLabel,
    pickThinkingLevel,
    trimPromptText
  });
}

window.createThinkingChallengeModule = createThinkingChallengeModule;
