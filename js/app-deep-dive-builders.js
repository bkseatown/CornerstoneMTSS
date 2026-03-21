/**
 * app-deep-dive-builders.js
 * Deep Dive task and scoring builders kept separate from modal orchestration.
 */

function createDeepDiveBuilders(deps) {
  const {
    challengeLevels = [],
    challengeWordRoleMeta = {},
    DEFAULT_PREFS = {},
    deepDiveVariants = {},
    defaultPrefs = {},
    documentRef = document,
    detectHintCategoryFromWord = () => 'general',
    buildLiveHintExample = () => null,
    el = (id) => documentRef.getElementById(id),
    formatGradeBandLabel = (value) => value,
    getActiveMaxGuesses = () => 6,
    getEffectiveGameplayGradeBand = () => 'all',
    getFocusLabel = (value) => value,
    getFocusValue = () => 'all',
    getSelectedGrade = () => defaultPrefs.grade || 'all',
    normalizeHintCategoryFromFocusTag = () => 'general',
    parseFocusPreset = () => ({ kind: 'all' }),
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    pickRandom = (items) => (Array.isArray(items) && items.length ? items[0] : ''),
    prefs = {},
    safeDefaultGradeBand = 'G3-5',
    shuffleList = (items) => Array.isArray(items) ? [...items] : [],
    thinkingLevelMeta = {},
    WQData = null
  } = deps || {};

  function normalizeThinkingLevel(level, fallback = '') {
    const normalized = String(level || '').trim().toLowerCase();
    if (challengeLevels.includes(normalized)) return normalized;
    return fallback;
  }

  function getChallengeLevelDisplay(level) {
    const normalized = normalizeThinkingLevel(level, 'apply');
    const meta = thinkingLevelMeta[normalized] || thinkingLevelMeta.apply;
    return String(meta?.chip || normalized).replace(/\s*\(.+\)\s*$/, '').trim();
  }

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
        'Which strategy helped most this round and why?',
        'If you played this word again, what one move would you keep? Explain.'
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
    const level = normalizeThinkingLevel(options.level || '', '') || pickThinkingLevel(result);
    const meta = thinkingLevelMeta[level] || thinkingLevelMeta.apply;
    const prompt = buildThinkingPrompt(level, result);
    if (!prompt) return null;
    return {
      level,
      chip: meta?.chip,
      prompt,
      teacher: meta?.teacher
    };
  }

  function normalizeChallengeWord(value) {
    return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  function inferChallengeWordRole(entryData, wordValue = '') {
    const word = normalizeChallengeWord(wordValue || entryData?.word || '');
    const definition = String(entryData?.definition || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const sentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim().toLowerCase();

    if (/(?:ly)$/.test(word) && !/(?:family|only|early|friendly)$/.test(word)) return 'adverb';
    if (/^to\s+[a-z]/.test(definition)) return 'verb';
    if (/\b(action|act|move|do|make|run|jump|write|read|carry|help)\b/.test(definition) && /\bto\b/.test(definition)) {
      return 'verb';
    }
    if (/\b(describing|quality|kind of|full of|having|able to|like)\b/.test(definition)) return 'adjective';
    if (/\b(person|place|thing|idea|someone|something)\b/.test(definition)) return 'noun';
    if (/\b(quickly|slowly|carefully|quietly)\b/.test(sentence)) return 'adverb';
    return 'general';
  }

  function getChallengeWordRoleMeta(entryData, wordValue = '') {
    const roleKey = inferChallengeWordRole(entryData, wordValue);
    return {
      key: roleKey,
      ...(challengeWordRoleMeta[roleKey] || challengeWordRoleMeta.general)
    };
  }

  function escapeForRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function fallbackPatternPieces(wordValue) {
    const word = normalizeChallengeWord(wordValue);
    if (!word) return [];
    if (word.length <= 3) return word.split('');
    if (word.length <= 5) return [word.slice(0, 1), word.slice(1, 3), word.slice(3)].filter(Boolean);
    return [word.slice(0, 2), word.slice(2, word.length - 2), word.slice(word.length - 2)].filter(Boolean);
  }

  function resolvePatternPrompt(mark, isPrefixLike, variant = 'chunk') {
    if (variant === 'anchor') {
      if (mark === 'affix') return isPrefixLike ? 'Tap the chunk at the start that guides pronunciation.' : 'Tap the chunk at the end that guides pronunciation.';
      if (mark === 'silent') return 'Tap the chunk that changes the sound without saying every letter.';
      return 'Tap the chunk that best anchors the vowel sound.';
    }
    if (mark === 'team') return 'Tap the sound team chunk.';
    if (mark === 'silent') return 'Tap the silent letter chunk.';
    if (mark === 'affix') return isPrefixLike ? 'Tap the prefix chunk.' : 'Tap the suffix chunk.';
    if (mark === 'schwa') return 'Tap the schwa vowel chunk.';
    if (mark === 'letter') return 'Tap the vowel anchor chunk.';
    return 'Tap the target sound chunk.';
  }

  function scorePatternFallbackChunk(label) {
    const chunk = String(label || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!chunk) return Number.NEGATIVE_INFINITY;
    const vowelCount = (chunk.match(/[AEIOUY]/g) || []).length;
    const hasAnchorCluster = /(AI|AY|AU|AW|EA|EE|EI|EY|IE|OA|OE|OI|OO|OU|OW|OY|UE|UI|AR|ER|IR|OR|UR|IGH|CH|SH|TH|PH|WH|TCH|DGE|CK|NG|NK)/.test(chunk);
    let score = vowelCount * 5;
    if (hasAnchorCluster) score += 3;
    if (vowelCount === 0) score -= 4;
    score += Math.min(2, chunk.length * 0.3);
    return score;
  }

  function resolveFallbackPatternChoiceIndex(choices) {
    const list = Array.isArray(choices) ? choices : [];
    if (!list.length) return 0;
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    list.forEach((choice, index) => {
      const score = scorePatternFallbackChunk(choice?.label);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestIndex >= 0 ? bestIndex : Math.max(0, Math.floor((list.length - 1) / 2));
  }

  function computeWordVariantSeed(word) {
    const text = String(word || '').toLowerCase();
    let seed = 0;
    for (let index = 0; index < text.length; index += 1) {
      seed = ((seed * 31) + text.charCodeAt(index)) % 2147483647;
    }
    seed += (Date.now() % 997);
    return Math.abs(seed);
  }

  function pickDeepDiveTaskVariant(result, task) {
    const options = deepDiveVariants[task];
    if (!Array.isArray(options) || !options.length) return '';
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim();
    const seed = computeWordVariantSeed(`${word}:${task}`);
    return options[seed % options.length] || options[0];
  }

  function buildDeepDiveVariants(result) {
    return {
      listen: pickDeepDiveTaskVariant(result, 'listen') || 'chunk',
      analyze: pickDeepDiveTaskVariant(result, 'analyze') || 'definition',
      create: pickDeepDiveTaskVariant(result, 'create') || 'sentence_pick'
    };
  }

  function buildDeepDivePatternTask(result, variant = 'chunk') {
    const entryData = result?.entry || null;
    const word = normalizeChallengeWord(result?.word || entryData?.word || '');
    if (!word) return { prompt: 'Tap the target sound chunk.', helper: '', choices: [] };

    const focusValue = getFocusValue();
    const phonicsTag = String(entryData?.phonics || '').trim();
    let category = normalizeHintCategoryFromFocusTag(focusValue, phonicsTag);
    if (category === 'general') category = detectHintCategoryFromWord(word);
    const live = buildLiveHintExample(word, category);

    let choices = Array.isArray(live?.parts)
      ? live.parts.map((part, index) => {
          const text = String(part?.text || '').toUpperCase();
          if (!text) return null;
          const mark = String(part?.mark || '').trim().toLowerCase();
          return {
            id: `pattern-${index}`,
            label: text,
            mark,
            correct: !!mark
          };
        }).filter(Boolean)
      : [];

    if (!choices.length) {
      choices = fallbackPatternPieces(word).map((piece, index) => ({
        id: `pattern-${index}`,
        label: String(piece || '').toUpperCase(),
        mark: '',
        correct: false
      }));
    }

    if (!choices.length) {
      choices = [{ id: 'pattern-full', label: word.toUpperCase(), mark: '', correct: true }];
    }

    let usedFallbackAnchor = false;
    let correctChoice = choices.find((choice) => choice.correct);
    if (!correctChoice) {
      const fallbackIndex = resolveFallbackPatternChoiceIndex(choices);
      correctChoice = choices[fallbackIndex] || choices[0];
      if (correctChoice) {
        correctChoice.correct = true;
        if (!correctChoice.mark) correctChoice.mark = 'letter';
        usedFallbackAnchor = true;
      }
    }

    const prefixLike = !!correctChoice && choices[0] && correctChoice.id === choices[0].id;
    const helperNote = String(live?.note || '').trim();
    return {
      prompt: resolvePatternPrompt(correctChoice?.mark || '', prefixLike, variant),
      helper: helperNote || (usedFallbackAnchor ? `Look for the chunk that carries the vowel anchor in ${word.toUpperCase()}.` : ''),
      choices: choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        correct: !!choice.correct
      }))
    };
  }

  function buildDeepDiveMeaningTask(result, roleMeta, variant = 'definition') {
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim().toUpperCase();
    const correctDefinition = String(entryData?.definition || '').replace(/\s+/g, ' ').trim();
    const sentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim();
    const selectedGrade = getSelectedGrade();
    const focus = getFocusValue();
    const gradeBand = String(entryData?.grade_band || getEffectiveGameplayGradeBand(selectedGrade, focus)).trim() || safeDefaultGradeBand;
    const pool = shuffleList(WQData?.getPlayableWords?.({
      gradeBand,
      length: 'any',
      phonics: 'all'
    }) || []);

    const distractors = [];
    const distractorWords = [];
    pool.forEach((candidateWord) => {
      if (distractors.length >= 3) return;
      const normalizedCandidate = normalizeReviewWord(candidateWord);
      if (!normalizedCandidate || normalizedCandidate === normalizeReviewWord(word)) return;
      const candidateEntry = WQData?.getEntry?.(normalizedCandidate);
      const candidateDefinition = String(candidateEntry?.definition || '').replace(/\s+/g, ' ').trim();
      if (!candidateDefinition || candidateDefinition.toLowerCase() === correctDefinition.toLowerCase()) return;
      if (distractors.some((item) => item.toLowerCase() === candidateDefinition.toLowerCase())) return;
      distractors.push(candidateDefinition);
      distractorWords.push(normalizedCandidate.toUpperCase());
    });

    const fallbackDistractors = [
      'A quick sound warm-up pattern.',
      'A place where words are sorted.',
      'A strategy for checking letter order.'
    ];
    while (distractors.length < 3) {
      const candidate = fallbackDistractors[distractors.length] || fallbackDistractors[0];
      distractors.push(candidate);
      distractorWords.push('—');
    }

    const compact = (value) => {
      const clean = String(value || '').replace(/\s+/g, ' ').trim();
      if (clean.length <= 108) return clean;
      return `${clean.slice(0, 105).trim()}...`;
    };

    const choices = shuffleList([
      { id: 'meaning-correct', label: compact(correctDefinition || `${word} is the target word for this round.`), correct: true },
      ...distractors.slice(0, 3).map((label, index) => ({
        id: `meaning-${index + 1}`,
        label: compact(label),
        correct: false
      }))
    ]);

    let prompt = `Pick the meaning that matches this ${roleMeta?.kidLabel || 'word'}: "${word}".`;
    if (variant === 'context' && sentence) {
      prompt = `Use the sentence clue to choose the best meaning for "${word}": ${compact(sentence)}`;
    }

    return { prompt, choices, distractorWords };
  }

  function buildDeepDiveSyntaxTask(result, meaningTask, roleMeta, variant = 'sentence_pick') {
    const entryData = result?.entry || null;
    const word = String(result?.word || entryData?.word || '').trim().toUpperCase();
    const normalizedWord = normalizeChallengeWord(word);
    const rawSentence = String(entryData?.sentence || '').replace(/\s+/g, ' ').trim();
    const fallbackSentence = `${word} fits in this sentence because the meaning matches the context.`;
    const correctSentence = rawSentence || fallbackSentence;
    const distractorWord = normalizeChallengeWord(meaningTask?.distractorWords?.[0] || '')
      || normalizeChallengeWord(pickRandom(WQData?.getPlayableWords?.({ gradeBand: safeDefaultGradeBand, length: 'any', phonics: 'all' }) || []))
      || 'banana';

    let wrongSentence = correctSentence;
    if (normalizedWord && new RegExp(`\\b${escapeForRegExp(normalizedWord)}\\b`, 'i').test(correctSentence)) {
      wrongSentence = correctSentence.replace(
        new RegExp(`\\b${escapeForRegExp(normalizedWord)}\\b`, 'i'),
        distractorWord.toLowerCase()
      );
    } else {
      wrongSentence = `Because ${normalizedWord || 'word'} the students quickly.`;
    }

    const compact = (value) => {
      const clean = String(value || '').replace(/\s+/g, ' ').trim();
      if (clean.length <= 120) return clean;
      return `${clean.slice(0, 117).trim()}...`;
    };

    const prompt = variant === 'sentence_fix'
      ? `Which sentence needs "${word}" to make sense?`
      : `Which sentence uses this ${roleMeta?.kidLabel || 'word'} correctly: "${word}"?`;
    const wrongLabel = variant === 'sentence_fix'
      ? compact(`The class planned to ${distractorWord.toLowerCase()} the story during lunch.`)
      : compact(wrongSentence);

    return {
      prompt,
      choices: shuffleList([
        { id: 'syntax-correct', label: compact(correctSentence), correct: true },
        { id: 'syntax-wrong', label: wrongLabel, correct: false }
      ])
    };
  }

  function buildDeepDiveState(result) {
    const entryData = result?.entry || null;
    const roleMeta = getChallengeWordRoleMeta(entryData, result?.word || entryData?.word || '');
    const variants = buildDeepDiveVariants(result);
    const patternTask = buildDeepDivePatternTask(result, variants.listen);
    const meaningTask = buildDeepDiveMeaningTask(result, roleMeta, variants.analyze);
    const syntaxTask = buildDeepDiveSyntaxTask(result, meaningTask, roleMeta, variants.create);
    return {
      role: roleMeta,
      variants,
      titles: {
        listen: '1. Sound',
        analyze: '2. Meaning',
        create: '3. Context'
      },
      prompts: {
        listen: patternTask.prompt,
        analyze: meaningTask.prompt,
        create: syntaxTask.prompt
      },
      helpers: {
        listen: patternTask.helper || '',
        analyze: 'Use the clue sentence and part of speech.',
        create: 'Pick the sentence that keeps the meaning accurate.'
      },
      choices: {
        listen: patternTask.choices,
        analyze: meaningTask.choices,
        create: syntaxTask.choices
      },
      selected: {
        listen: '',
        analyze: '',
        create: ''
      },
      attempts: {
        listen: 0,
        analyze: 0,
        create: 0
      }
    };
  }

  return {
    buildDeepDiveState,
    buildThinkingChallenge,
    buildThinkingPrompt,
    getChallengeFocusLabel,
    getChallengeGradeLabel,
    getChallengeLevelDisplay,
    getChallengeTopicLabel,
    normalizeThinkingLevel,
    pickRandom,
    pickThinkingLevel,
    shuffleList,
    trimPromptText
  };
}
