/**
 * app-support-logic.js
 * Hint payloads, starter-word suggestion logic, and related support helpers.
 */

function createSupportLogicModule(deps) {
  const {
    defaultPrefs = {},
    emitTelemetry = () => {},
    getEffectiveGameplayGradeBand = () => 'all',
    getFocusLabel = () => '',
    getGameState = () => ({}),
    getThemeFallback = () => 'default',
    getWQData = () => null,
    hideInformantHintCard = () => {},
    hideStarterWordCard = () => {},
    isAnyOverlayModalOpen = () => false,
    isHelpSuppressedForTeamMode = () => false,
    isMissionLabStandaloneMode = () => false,
    normalizePlayStyle = (mode) => mode,
    normalizeReviewWord = (value) => String(value || '').trim().toLowerCase(),
    normalizeTheme = (value) => value,
    parseFocusPreset = () => ({ kind: 'phonics', focus: 'all' }),
    pickRandomized = (values) => values,
    prefs = {},
    renderStarterWordListUi = () => {},
    setHintRequested = () => {},
    setStarterWordsShown = () => {},
    showInformantHintCard = () => {},
    showToast = () => {},
    shouldExpandGradeBandForFocus = () => false,
    getSorHintProfiles = () => ({}),
    syncRoundTrackingLocals = () => {},
    ui = null,
    updateCurrentRow = () => {},
    updateNextActionLine = () => {}
  } = deps || {};

  function buildStarterWordConstraint(state) {
    const wordState = deriveWordState(state);
    const fixedLetters = Array.from({ length: wordState.length }, (_, index) => (
      wordState.correctPositions[index] || ''
    ));
    return {
      length: wordState.length,
      guessCount: wordState.guessCount,
      fixedLetters,
      excludedByPosition: wordState.forbiddenByPosition,
      minCounts: wordState.minCounts,
      maxCounts: wordState.maxCounts,
      absentLetters: wordState.absentLetters,
      guessedLetters: wordState.guessedLetters,
      wordState
    };
  }

  function wordMatchesStarterConstraint(word, constraint, options = {}) {
    const normalizedWord = normalizeReviewWord(word);
    const length = Math.max(1, Number(constraint?.length || 0));
    if (!normalizedWord || normalizedWord.length !== length) return false;
    const enforceMaxCounts = options.enforceMaxCounts !== false;
    const letterCounts = {};
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] !== letter) return false;
      if (constraint.excludedByPosition[index]?.has(letter)) return false;
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    for (const letter of constraint.absentLetters) {
      if ((letterCounts[letter] || 0) > 0) return false;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) return false;
    }
    if (enforceMaxCounts) {
      for (const [letter, maximum] of Object.entries(constraint.maxCounts || {})) {
        if ((letterCounts[letter] || 0) > maximum) return false;
      }
    }
    return true;
  }

  function scoreStarterWordCandidate(word, constraint) {
    const normalizedWord = normalizeReviewWord(word);
    if (!normalizedWord) return 0;
    let score = 0;
    const letterCounts = {};
    for (const ch of normalizedWord) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    const counted = new Set();
    for (let index = 0; index < normalizedWord.length; index += 1) {
      const letter = normalizedWord[index];
      if (constraint.fixedLetters[index] && constraint.fixedLetters[index] === letter) score += 4;
      if (!constraint.guessedLetters.has(letter) && !counted.has(letter)) {
        score += 2;
        counted.add(letter);
      }
      if ((constraint.minCounts[letter] || 0) > 0) score += 1;
    }
    for (const [letter, minimum] of Object.entries(constraint.minCounts || {})) {
      if ((letterCounts[letter] || 0) < minimum) score -= 14;
      else score += 6;
    }
    for (const letter of constraint.absentLetters || []) {
      if ((letterCounts[letter] || 0) > 0) score -= 18;
    }
    return score;
  }

  function formatStarterPattern(constraint) {
    if (!constraint || !Array.isArray(constraint.fixedLetters)) return '';
    const token = constraint.fixedLetters.map((letter) => (letter ? letter.toUpperCase() : '_')).join('');
    return token.includes('_') ? token : '';
  }

  function evaluateGuessPattern(guess, target) {
    const safeGuess = String(guess || '').toLowerCase().replace(/[^a-z]/g, '');
    const safeTarget = String(target || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!safeGuess || !safeTarget || safeGuess.length !== safeTarget.length) return [];
    const result = Array(safeTarget.length).fill('absent');
    const targetLetters = safeTarget.split('');
    const guessLetters = safeGuess.split('');
    for (let index = 0; index < guessLetters.length; index += 1) {
      if (guessLetters[index] === targetLetters[index]) {
        result[index] = 'correct';
        targetLetters[index] = null;
        guessLetters[index] = null;
      }
    }
    for (let index = 0; index < guessLetters.length; index += 1) {
      const letter = guessLetters[index];
      if (!letter) continue;
      const foundAt = targetLetters.indexOf(letter);
      if (foundAt >= 0) {
        result[index] = 'present';
        targetLetters[foundAt] = null;
      }
    }
    return result;
  }

  function normalizeHintCategoryFromFocusTag(focusValue, phonicsTag) {
    const focus = String(focusValue || '').trim().toLowerCase();
    const tag = String(phonicsTag || '').trim().toLowerCase();
    if (focus === 'ccvc') return 'initial_blend';
    if (focus === 'cvcc') return 'final_blend';
    if (focus === 'digraph' || /digraph/.test(tag)) return 'digraph';
    if (focus === 'trigraph' || /trigraph/.test(tag)) return 'trigraph';
    if (focus === 'cvc' || /(^|[^a-z])cvc([^a-z]|$)|closed[\s-]*syllable|short[\s-]*vowel/.test(tag)) return 'cvc';
    if (focus === 'cvce' || /silent[\s-]*e|magic[\s-]*e|cvce/.test(tag)) return 'cvce';
    if (focus === 'vowel_team' || /vowel[\s_-]*team/.test(tag)) return 'vowel_team';
    if (focus === 'r_controlled' || /r[\s_-]*controlled/.test(tag)) return 'r_controlled';
    if (focus === 'diphthong' || /diphthong/.test(tag)) return 'diphthong';
    if (focus === 'welded' || /welded/.test(tag)) return 'welded';
    if (focus === 'floss' || /floss/.test(tag)) return 'floss';
    if (focus === 'schwa' || /schwa/.test(tag)) return 'schwa';
    if (focus === 'prefix' || /prefix/.test(tag)) return 'prefix';
    if (focus === 'suffix' || /suffix/.test(tag)) return 'suffix';
    if (focus === 'multisyllable' || /multisyll/.test(tag)) return 'multisyllable';
    if (focus === 'compound' || /compound/.test(tag)) return 'compound';
    if (/blend/.test(tag)) return /final|\(-/.test(tag) ? 'final_blend' : 'initial_blend';
    return 'general';
  }

  function detectHintCategoryFromWord(wordValue) {
    const word = String(wordValue || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 'cvc';
    if (/(tch|dge|igh)/.test(word)) return 'trigraph';
    if (/^(sh|ch|th|wh|ph)/.test(word) || /(sh|ch|th|wh|ph|ck|ng)/.test(word)) return 'digraph';
    if (/(oi|oy|ou|ow|au|aw)/.test(word)) return 'diphthong';
    if (/(ai|ay|ea|ee|oa|oe|ie|ue|ui)/.test(word)) return 'vowel_team';
    if (/(ar|or|er|ir|ur)/.test(word)) return 'r_controlled';
    if (/(ang|ing|ong|ung|ank|ink|onk|unk)$/.test(word)) return 'welded';
    if (/(ff|ll|ss|zz)$/.test(word)) return 'floss';
    if (/^[a-z]{3}$/.test(word) && /^[^aeiou][aeiou][^aeiou]$/.test(word)) return 'cvc';
    if (/^[a-z]{4,}$/.test(word) && /[^aeiou][aeiou][^aeiou]e$/.test(word)) return 'cvce';
    if (/^[bcdfghjklmnpqrstvwxyz]{2}/.test(word)) return 'initial_blend';
    if (/[bcdfghjklmnpqrstvwxyz]{2}$/.test(word)) return 'final_blend';
    if (word.length >= 7 || /[aeiou].*[aeiou].*[aeiou]/.test(word)) return 'multisyllable';
    return 'cvc';
  }

  function buildMarkedHintParts(word, start, end, mark) {
    const upper = String(word || '').toUpperCase();
    const left = upper.slice(0, Math.max(0, start));
    const middle = upper.slice(Math.max(0, start), Math.max(start, end));
    const right = upper.slice(Math.max(start, end));
    const parts = [];
    if (left) parts.push(Object.freeze({ text: left }));
    if (middle) parts.push(Object.freeze({ text: middle, mark: mark || 'letter' }));
    if (right) parts.push(Object.freeze({ text: right }));
    return Object.freeze(parts);
  }

  function buildLiveHintExample(wordValue, category) {
    const word = String(wordValue || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return null;
    const teamMatch = word.match(/(ai|ay|ea|ee|oa|oe|ie|ue|ui|oo|oi|oy|ou|ow|au|aw|ew)/);
    const digraphMatch = word.match(/(sh|ch|th|wh|ph|ck|ng|qu)/);
    const rControlledMatch = word.match(/(ar|or|er|ir|ur)/);
    const prefixMatch = word.match(/^(un|re|pre|dis|mis|non|sub|inter|trans|over|under|anti|de)/);
    const suffixMatch = word.match(/(ing|ed|er|est|ly|tion|sion|ment|ness|less|ful|able|ible|ous|ive|al|y)$/);
    if (category === 'vowel_team' && teamMatch?.[0]) {
      const start = teamMatch.index || 0;
      return Object.freeze({ parts: buildMarkedHintParts(word, start, start + teamMatch[0].length, 'team'), note: 'Vowel team clue: these letters share one vowel sound.' });
    }
    if (category === 'diphthong' && teamMatch?.[0]) {
      const start = teamMatch.index || 0;
      return Object.freeze({ parts: buildMarkedHintParts(word, start, start + teamMatch[0].length, 'team'), note: 'Glide team clue: these letters slide together into one sound.' });
    }
    if ((category === 'digraph' || category === 'trigraph' || category === 'welded') && digraphMatch?.[0]) {
      const start = digraphMatch.index || 0;
      return Object.freeze({ parts: buildMarkedHintParts(word, start, start + digraphMatch[0].length, 'team'), note: 'Sound team clue: these letters work together as one sound.' });
    }
    if (category === 'r_controlled' && rControlledMatch?.[0]) {
      const start = rControlledMatch.index || 0;
      return Object.freeze({ parts: buildMarkedHintParts(word, start, start + rControlledMatch[0].length, 'team'), note: 'Bossy R clue: the vowel + r shifts the vowel sound.' });
    }
    if (category === 'prefix' && prefixMatch?.[0]) {
      return Object.freeze({ parts: buildMarkedHintParts(word, 0, prefixMatch[0].length, 'affix'), note: 'Prefix clue: read the beginning chunk first.' });
    }
    if (category === 'suffix' && suffixMatch?.[0]) {
      const end = word.length;
      return Object.freeze({ parts: buildMarkedHintParts(word, end - suffixMatch[0].length, end, 'affix'), note: 'Suffix clue: lock in the ending chunk.' });
    }
    if (category === 'cvce' && /[^aeiou][aeiou][^aeiou]e$/.test(word)) {
      return Object.freeze({
        parts: Object.freeze([
          Object.freeze({ text: word.slice(0, -1).toUpperCase() }),
          Object.freeze({ text: 'E', mark: 'silent' })
        ]),
        note: 'Magic E clue: the final e is silent and changes the vowel sound.'
      });
    }
    return null;
  }

  function buildFallbackHintExample(category) {
    const fallbackByCategory = Object.freeze({
      cvc: Object.freeze({ word: 'cat', start: 1, end: 2, mark: 'team', note: 'Tap each sound: /c/ /a/ /t/.' }),
      cvce: Object.freeze({ word: 'cake', start: 3, end: 4, mark: 'silent', note: 'Magic E clue: the final e is silent and changes the vowel sound.' }),
      vowel_team: Object.freeze({ word: 'rain', start: 1, end: 3, mark: 'team', note: 'Vowel team clue: these letters share one vowel sound.' }),
      diphthong: Object.freeze({ word: 'cloud', start: 2, end: 4, mark: 'team', note: 'Glide team clue: these letters slide together into one sound.' }),
      r_controlled: Object.freeze({ word: 'storm', start: 2, end: 4, mark: 'team', note: 'Bossy R clue: the vowel + r shifts the vowel sound.' }),
      digraph: Object.freeze({ word: 'ship', start: 0, end: 2, mark: 'team', note: 'Sound team clue: these letters work together as one sound.' }),
      trigraph: Object.freeze({ word: 'night', start: 1, end: 4, mark: 'team', note: 'Sound team clue: these letters work together as one sound.' }),
      welded: Object.freeze({ word: 'ring', start: 1, end: 4, mark: 'team', note: 'Welded sound clue: keep this chunk together.' }),
      prefix: Object.freeze({ word: 'replay', start: 0, end: 2, mark: 'affix', note: 'Prefix clue: read the beginning chunk first.' }),
      suffix: Object.freeze({ word: 'jumped', start: 4, end: 6, mark: 'affix', note: 'Suffix clue: lock in the ending chunk.' }),
      multisyllable: Object.freeze({ word: 'robot', start: 0, end: 2, mark: 'team', note: 'Chunk it, then blend it.' })
    });
    const entry = fallbackByCategory[category];
    if (!entry) return null;
    return Object.freeze({
      parts: buildMarkedHintParts(entry.word, entry.start, entry.end, entry.mark),
      note: entry.note
    });
  }

  function buildFriendlyHintMessage(category, sourceLabel) {
    const cleanSource = String(sourceLabel || '').replace(/\s+/g, ' ').trim();
    const focusText = cleanSource ? `Focus: ${cleanSource}. ` : '';
    const ruleByCategory = Object.freeze({
      cvc: 'Say the sounds: first, middle, last.',
      digraph: 'Find the 2-letter sound team first.',
      trigraph: 'Find the 3-letter sound team first.',
      cvce: 'Look for magic e at the end.',
      vowel_team: 'Find the vowel team and keep it together.',
      r_controlled: 'Find the vowel + r chunk and say it as one sound.',
      diphthong: 'Listen for the sliding vowel sound.',
      welded: 'Read the welded chunk as one unit.',
      floss: 'Short vowel + doubled ending letters.',
      prefix: 'Read the beginning chunk, then the base word.',
      suffix: 'Read the base word, then add the ending.',
      multisyllable: 'Chunk it, then blend it.',
      compound: 'Find two small words and join them.',
      subject: 'Use meaning first, then spell by sound.',
      general: 'Try one sound clue, then adjust.'
    });
    return `${focusText}${ruleByCategory[category] || ruleByCategory.general}`;
  }

  function getHintUnlockMinimum(playStyle) {
    return playStyle === 'listening' ? 1 : 2;
  }

  function getHintUnlockCopy(playStyle, guessCount) {
    const mode = playStyle === 'listening' ? 'listening' : 'detective';
    const minimum = getHintUnlockMinimum(mode);
    const count = Math.max(0, Number(guessCount) || 0);
    const remaining = Math.max(0, minimum - count);
    if (remaining <= 0) return { unlocked: true, minimum, message: '' };
    const guessWord = remaining === 1 ? 'guess' : 'guesses';
    return {
      unlocked: false,
      minimum,
      message: mode === 'listening'
        ? `Try ${remaining} more ${guessWord} to unlock Sound Help.`
        : `Try ${remaining} more ${guessWord} to unlock a Clue Hint.`
    };
  }

  function deriveWordState(state) {
    const wordLength = Math.max(1, Number(state?.wordLength || state?.word?.length || 0));
    const target = normalizeReviewWord(state?.word || '');
    const guesses = Array.isArray(state?.guesses)
      ? state.guesses.map((guess) => normalizeReviewWord(guess)).filter((guess) => guess.length === wordLength)
      : [];
    const correctPositions = {};
    const lockedPositions = {};
    const forbiddenByPosition = Array.from({ length: wordLength }, () => new Set());
    const presentLetters = new Set();
    const absentLetters = new Set();
    const guessedLetters = new Set();
    const minCounts = {};
    const maxCounts = {};
    const usedLetters = {};
    const statusRank = { neutral: 0, absent: 1, present: 2, correct: 3 };

    const setUsedStatus = (letter, status) => {
      if (!/^[a-z]$/.test(letter)) return;
      const next = String(status || 'neutral').toLowerCase();
      const prev = String(usedLetters[letter] || 'neutral').toLowerCase();
      if ((statusRank[next] || 0) >= (statusRank[prev] || 0)) {
        usedLetters[letter] = next;
      }
    };

    guesses.forEach((guessWord) => {
      const marks = evaluateGuessPattern(guessWord, target);
      const rowGuessCounts = {};
      const rowPositiveCounts = {};
      for (let index = 0; index < guessWord.length; index += 1) {
        const letter = guessWord[index];
        const mark = marks[index] || 'absent';
        if (!/^[a-z]$/.test(letter)) continue;
        guessedLetters.add(letter);
        rowGuessCounts[letter] = (rowGuessCounts[letter] || 0) + 1;

        if (mark === 'correct') {
          correctPositions[index] = letter;
          lockedPositions[index] = letter;
          presentLetters.add(letter);
          rowPositiveCounts[letter] = (rowPositiveCounts[letter] || 0) + 1;
          setUsedStatus(letter, 'correct');
        } else if (mark === 'present') {
          forbiddenByPosition[index].add(letter);
          presentLetters.add(letter);
          rowPositiveCounts[letter] = (rowPositiveCounts[letter] || 0) + 1;
          setUsedStatus(letter, 'present');
        } else {
          if (!correctPositions[index]) forbiddenByPosition[index].add(letter);
          setUsedStatus(letter, 'absent');
        }
      }

      Object.entries(rowPositiveCounts).forEach(([letter, count]) => {
        minCounts[letter] = Math.max(Number(minCounts[letter] || 0), Number(count || 0));
      });
      Object.entries(rowGuessCounts).forEach(([letter, count]) => {
        const positiveCount = Number(rowPositiveCounts[letter] || 0);
        if (positiveCount < Number(count || 0)) {
          if (maxCounts[letter] === undefined) maxCounts[letter] = positiveCount;
          else maxCounts[letter] = Math.min(Number(maxCounts[letter]), positiveCount);
        }
      });
    });

    guessedLetters.forEach((letter) => {
      if (!presentLetters.has(letter)) absentLetters.add(letter);
    });
    absentLetters.forEach((letter) => {
      if (!presentLetters.has(letter)) setUsedStatus(letter, 'absent');
    });

    return {
      correctPositions,
      presentLetters,
      absentLetters,
      lockedPositions,
      forbiddenByPosition,
      usedLetters,
      minCounts,
      maxCounts,
      guessCount: guesses.length,
      guessedLetters,
      length: wordLength,
      mode: normalizePlayStyle(document.getElementById('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle),
      theme: normalizeTheme(document.documentElement.getAttribute('data-theme'), getThemeFallback())
    };
  }

  function buildInformantHintPayload(state) {
    const sorHintProfiles = getSorHintProfiles() || {};
    const entry = state?.entry || null;
    const activeWord = String(state?.word || entry?.word || '').trim();
    const focusValue = document.getElementById('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const phonicsTag = String(entry?.phonics || '').trim();
    let category = preset.kind === 'subject' ? 'subject' : normalizeHintCategoryFromFocusTag(focusValue, phonicsTag);
    if (category === 'general') category = deps.detectHintCategoryFromWord?.(activeWord) || 'general';
    const profile = sorHintProfiles[category] || sorHintProfiles.general || {};
    const sourceLabel = phonicsTag && phonicsTag.toLowerCase() !== 'all'
      ? phonicsTag
      : preset.kind === 'phonics'
        ? getFocusLabel(preset.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim()
        : '';
    const liveExample = buildLiveHintExample(activeWord, category);
    const fallbackExample = buildFallbackHintExample(category);
    const profileExamples = Array.isArray(profile.examples) ? profile.examples : [];
    const examples = liveExample ? [liveExample] : fallbackExample ? [fallbackExample] : profileExamples.slice(0, 1);
    const playStyle = normalizePlayStyle(document.getElementById('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle);
    let message = buildFriendlyHintMessage(category, sourceLabel);
    if (playStyle === 'listening') {
      message = sourceLabel
        ? `Focus: ${sourceLabel}. Listen to the word and definition, tap sounds, then spell.`
        : 'Listen to the word and definition, tap sounds, then spell.';
    }
    const actionMode = playStyle === 'listening' && !!entry
        ? 'word-meaning'
        : 'none';
    return {
      title: playStyle === 'listening' ? 'Listening Coach' : `${profile.catchphrase || 'Clue Coach'}`,
      message,
      examples,
      actionMode
    };
  }

  function replaceCurrentGuessWithWord(word) {
    const normalizedWord = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    const state = getGameState();
    if (!state?.word || state.gameOver) return false;
    if (normalizedWord.length !== Number(state.wordLength || 0)) return false;
    while ((getGameState()?.guess || '').length > 0) {
      ui?.deleteLetter?.();
    }
    for (const letter of normalizedWord) {
      ui?.addLetter?.(letter);
    }
    const next = getGameState();
    if (next) updateCurrentRow(next.guess, next.wordLength, next.guesses.length);
    return true;
  }

  function pickStarterWordsForRound(state, limit = 9) {
    if (!state?.word || state.gameOver) return [];
    const focus = document.getElementById('setting-focus')?.value || prefs.focus || 'all';
    const selectedGrade = document.getElementById('s-grade')?.value || prefs.grade || defaultPrefs.grade;
    const gradeBand = getEffectiveGameplayGradeBand(selectedGrade, focus);
    const includeLowerBands = shouldExpandGradeBandForFocus(focus);
    const length = String(Math.max(1, Number(state.wordLength) || 0));
    const guessedWords = new Set((state.guesses || []).map((guess) => normalizeReviewWord(guess)));
    const targetWord = normalizeReviewWord(state.word);
    const data = getWQData();
    const addWords = (pool, bucket) => {
      if (!Array.isArray(pool)) return;
      pool.forEach((rawWord) => {
        const normalized = normalizeReviewWord(rawWord);
        if (!normalized || normalized.length !== Number(state.wordLength || 0)) return;
        if (guessedWords.has(normalized)) return;
        bucket.add(normalized);
      });
    };

    const prioritized = new Set();
    addWords(data?.getPlayableWords?.({ gradeBand, length, phonics: focus, includeLowerBands }), prioritized);
    if (prioritized.size < 6 && state.entry?.phonics) {
      addWords(data?.getPlayableWords?.({
        gradeBand,
        length,
        phonics: String(state.entry.phonics || '').toLowerCase(),
        includeLowerBands
      }), prioritized);
    }
    if (prioritized.size < 6) {
      addWords(data?.getPlayableWords?.({ gradeBand, length, phonics: 'all', includeLowerBands }), prioritized);
    }

    const constraint = buildStarterWordConstraint(state) || {
      length: 0,
      guessCount: 0,
      fixedLetters: [],
      excludedByPosition: {},
      minCounts: {},
      maxCounts: {},
      absentLetters: new Set(),
      guessedLetters: new Set(),
      wordState: deriveWordState(state)
    };
    const candidates = Array.from(prioritized);
    let filtered = candidates;
    if (constraint.guessCount >= 1) {
      const strict = candidates.filter((word) => wordMatchesStarterConstraint(word, constraint, { enforceMaxCounts: true }));
      filtered = strict;
      if (
        targetWord &&
        wordMatchesStarterConstraint(targetWord, constraint, { enforceMaxCounts: true }) &&
        !filtered.includes(targetWord)
      ) {
        filtered.unshift(targetWord);
      }
    }
    const ranked = pickRandomized(filtered).sort((left, right) => (
      scoreStarterWordCandidate(right, constraint) -
      scoreStarterWordCandidate(left, constraint)
    ));
    return ranked.slice(0, Math.max(3, Math.min(12, Number(limit) || 9)));
  }

  function getConstraintSafeCoachSuggestion(state) {
    if (!state || !state.word || state.gameOver) return '';
    const constraint = buildStarterWordConstraint(state) || {
      length: 0,
      guessCount: 0,
      fixedLetters: [],
      excludedByPosition: {},
      minCounts: {},
      maxCounts: {},
      absentLetters: new Set(),
      guessedLetters: new Set(),
      wordState: deriveWordState(state)
    };
    if (!constraint.guessCount) return '';
    const pool = pickStarterWordsForRound(state, 24);
    const tried = new Set((state.guesses || []).join('').toLowerCase().split(''));
    let best = '';
    let bestScore = -Infinity;
    for (const row of pool) {
      const word = normalizeReviewWord(row);
      if (!wordMatchesStarterConstraint(word, constraint, { enforceMaxCounts: true })) continue;
      const uniq = new Set(word.split(''));
      let score = 0;
      uniq.forEach((ch) => {
        if (!tried.has(ch)) score += 3;
        if ('aeiou'.includes(ch)) score += 0.5;
      });
      if (score > bestScore) {
        best = word;
        bestScore = score;
      }
    }
    return best;
  }

  function renderStarterWordList(words) {
    const list = document.getElementById('starter-word-list');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(words) || !words.length) {
      const empty = document.createElement('div');
      empty.className = 'starter-word-message';
      empty.textContent = 'No starter words found for this filter yet. Try switching focus or word length.';
      list.appendChild(empty);
      return;
    }
    words.forEach((word) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'starter-word-chip';
      chip.textContent = String(word || '').toUpperCase();
      chip.setAttribute('aria-label', `Use ${String(word || '').toUpperCase()} as next guess`);
      chip.addEventListener('click', () => {
        const applied = replaceCurrentGuessWithWord(word);
        if (applied) {
          hideStarterWordCard();
          updateNextActionLine();
          showToast(`Try this: ${String(word || '').toUpperCase()}`);
        }
      });
      list.appendChild(chip);
    });
  }

  function formatStarterConstraintSummary(constraint) {
    if (!constraint) return '';
    const fixedPattern = Array.isArray(constraint.fixedLetters)
      ? constraint.fixedLetters.map((letter) => (letter ? letter.toUpperCase() : '_')).join('')
      : '';
    const yellowLetters = Object.keys(constraint.minCounts || {})
      .filter((letter) => !constraint.fixedLetters?.includes?.(letter))
      .map((letter) => letter.toUpperCase());
    const parts = [];
    if (fixedPattern && /[A-Z]/.test(fixedPattern)) {
      parts.push(`Green pattern: ${fixedPattern}.`);
    }
    if (yellowLetters.length) {
      parts.push(`Yellow letters to use: ${yellowLetters.join(', ')}.`);
    }
    return parts.join(' ');
  }

  function showStarterWordCard(options = {}) {
    if (isHelpSuppressedForTeamMode()) return false;
    const card = document.getElementById('starter-word-card');
    if (!card) return false;
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;
    hideInformantHintCard();

    const state = getGameState() || {};
    const titleEl = document.getElementById('starter-word-title');
    const messageEl = document.getElementById('starter-word-message');
    const guessCount = Array.isArray(state.guesses) ? state.guesses.length : 0;
    const source = String(options.source || 'manual').toLowerCase();
    const constraint = buildStarterWordConstraint(state) || {
      length: 0,
      guessCount: 0,
      fixedLetters: [],
      excludedByPosition: {},
      minCounts: {},
      maxCounts: {},
      absentLetters: new Set(),
      guessedLetters: new Set(),
      wordState: deriveWordState(state)
    };
    const knownPattern = formatStarterPattern(constraint) || '';

    if (!state.word || state.gameOver) {
      if (titleEl) titleEl.textContent = 'Try a Starter Word';
      if (messageEl) messageEl.textContent = 'Start a round first, then open this for starter ideas.';
      renderStarterWordList([]);
      card.classList.remove('hidden');
      card.classList.add('visible');
      return true;
    }

    const words = pickStarterWordsForRound(state, 9);
    if (guessCount >= 1 && words.length < 3) {
      if (source !== 'auto') {
        showToast('Pattern Match opens when there are at least 3 strong matches.');
      }
      hideStarterWordCard();
      return false;
    }
    setStarterWordsShown(true);
    syncRoundTrackingLocals();
    if (titleEl) titleEl.textContent = guessCount >= 1 ? 'Try a Pattern Match' : (source === 'auto' ? 'Try a Starter Word' : 'Need Ideas? Try a Starter Word');
    if (messageEl) {
      if (guessCount >= 1) {
        const summaryHint = formatStarterConstraintSummary(constraint);
        messageEl.textContent = summaryHint
          ? `These options keep your green matches and include your yellow letters. ${summaryHint} Pick one to test next.`
          : 'These options keep your green matches and include your yellow letters. Pick one to test next.';
      } else {
        messageEl.textContent = source === 'auto'
          ? `You are ${guessCount} guesses in. Pick one idea to keep momentum.`
          : 'Pick one to test your next guess.';
      }
    }
    renderStarterWordList(words);
    card.classList.remove('hidden');
    deps.positionStarterWordCard?.();
    card.classList.add('visible');
    emitTelemetry('wq_support_used', {
      support_type: 'starter_word_list',
      guess_count: guessCount,
      source
    });
    return true;
  }

  function showInformantHintToast(options = {}) {
    if (isHelpSuppressedForTeamMode()) return false;
    hideStarterWordCard();
    const card = document.getElementById('hint-clue-card');
    if (card && !card.classList.contains('hidden')) {
      hideInformantHintCard();
      return false;
    }
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;

    const state = getGameState() || {};
    if (!state?.word) {
      showInformantHintCard({
        title: 'Clue Coach',
        message: 'Tap Next Word first, then tap Clue for one quick sound hint.',
        examples: [],
        actionMode: 'none'
      });
      return true;
    }
    if (!state.entry) state.entry = getWQData()?.getEntry?.(state.word) || null;
    const playStyle = normalizePlayStyle(document.getElementById('s-play-style')?.value || prefs.playStyle || defaultPrefs.playStyle);
    const guessCount = Array.isArray(state?.guesses) ? state.guesses.length : 0;
    const unlock = getHintUnlockCopy(playStyle, guessCount);
    const forcedFromChooser = options && options.force === true;
    if (!unlock.unlocked && !forcedFromChooser) {
      showInformantHintCard({
        title: playStyle === 'listening' ? 'Almost Ready' : 'Almost Ready',
        message: unlock.message,
        examples: [],
        actionMode: 'none'
      });
      return true;
    }
    if (playStyle === 'listening' && deps.currentRoundHintRequested?.()) {
      showInformantHintCard({
        title: 'Listening Coach',
        message: 'Phonics Hint is one-time per word in Listening mode. Use Hear Word + Meaning to keep mapping sounds and spelling.',
        examples: [],
        actionMode: state.entry ? 'word-meaning' : 'none'
      });
      return true;
    }
    setHintRequested(true);
    syncRoundTrackingLocals();
    emitTelemetry('wq_support_used', {
      support_type: playStyle === 'listening' ? 'listening_sound_help' : 'phonics_clue',
      guess_count: guessCount
    });
    showInformantHintCard(buildInformantHintPayload(state));
    return true;
  }

  return {
    buildFriendlyHintMessage,
    buildInformantHintPayload,
    buildLiveHintExample,
    detectHintCategoryFromWord,
    deriveWordState,
    getConstraintSafeCoachSuggestion,
    getHintUnlockCopy,
    getHintUnlockMinimum,
    normalizeHintCategoryFromFocusTag,
    pickStarterWordsForRound,
    renderStarterWordList,
    replaceCurrentGuessWithWord,
    showInformantHintToast,
    showStarterWordCard
  };
}
