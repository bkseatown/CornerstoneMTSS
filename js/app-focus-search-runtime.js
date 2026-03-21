/**
 * app-focus-search-runtime.js
 * Focus search, ranking, rendering, and selection runtime.
 */

function createFocusSearchRuntimeModule(deps) {
  const {
    applyAllGradeLengthDefault = () => {},
    applyLessonTargetConfig = () => false,
    closeQuickPopover = () => {},
    clearPinnedFocusSearchValue = () => {},
    defaultPrefs = { lessonPack: 'custom', lessonTarget: 'custom' },
    demoCloseAllOverlays = () => {},
    demoMode = false,
    documentRef = null,
    el = () => null,
    enforceClassicFiveLetterDefault = () => false,
    enforceFocusSelectionForGrade = () => {},
    emitTelemetry = () => {},
    formatGradeBandLabel = (value) => String(value || ''),
    getFocusEntries = () => [],
    getEffectiveGameplayGradeBand = (_gradeBand, _focusValue) => 'K-2',
    getCurriculumProgramEntries = () => [],
    getCurriculumQuestEntries = () => [],
    getGradeBandRank = (value) => {
      const order = Object.freeze({ 'K-2': 0, 'G3-5': 1, 'G6-8': 2, 'G9-12': 3 });
      return Number.isFinite(order[String(value || '').toUpperCase()]) ? order[String(value || '').toUpperCase()] : 9;
    },
    getFocusDisplayLabel = (value) => String(value || ''),
    getFocusLabel = (value) => String(value || ''),
    getFocusSuggestedGradeBand = () => '',
    getLessonPackDefinition = () => ({ label: 'Curriculum' }),
    getLessonTarget = () => null,
    getQuestEntries = () => [],
    getQuestFilterGradeBand = () => 'all',
    getSectionHeadingMarkup = (text) => String(text || ''),
    handleLessonPackSelectionChange = () => {},
    handleLessonTargetSelectionChange = () => {},
    isAssessmentRoundLocked = () => false,
    isEntryGradeBandCompatible = () => true,
    normalizeLessonPackId = (value) => String(value || 'custom'),
    normalizeLessonTargetId = (_packId, value) => String(value || 'custom'),
    parseFocusPreset = () => ({ kind: 'classic', focus: 'all' }),
    prefs = {},
    refreshStandaloneMissionLabHub = () => {},
    releaseLessonPackToManualMode = () => {},
    safeDefaultGradeBand = 'K-2',
    setFocusPref = () => {},
    setFocusSearchReopenGuardUntil = () => {},
    setNewGame = () => {},
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    shouldExpandGradeBandForFocus = () => false,
    syncChunkTabsVisibility = () => {},
    syncGradeFromFocus = () => {},
    syncLengthFromFocus = () => false,
    syncLessonPackControlsFromPrefs = () => ({ packId: 'custom', targetId: 'custom' }),
    syncThemePreviewStripVisibility = () => {},
    updateFocusGradeNote = () => {},
    updateFocusHint = () => {},
    updateFocusSummaryLabel = () => {},
    windowRef = null,
    WQData = null,
    WQ_WORD_DATA = null
  } = deps || {};

  const FOCUS_EMPTY_VISIBLE_LIMIT = 72;
  const FOCUS_QUERY_VISIBLE_LIMIT = 36;
  const FOCUS_POPULARITY = Object.freeze({
    all: 240,
    cvc: 220,
    cvce: 210,
    digraph: 205,
    vowel_team: 200,
    r_controlled: 195,
    multisyllable: 190,
    'vocab-math-k2': 185,
    'vocab-math-35': 182,
    'vocab-science-k2': 180,
    'vocab-science-35': 176,
    'vocab-ela-k2': 172,
    'vocab-ela-35': 168
  });
  const FOCUS_SEARCH_ALIASES = Object.freeze({
    all: Object.freeze(['classic', 'wordle', 'default']),
    cvc: Object.freeze(['short vowels', 'closed syllables', 'cv/vc', 'cvc words']),
    digraph: Object.freeze(['sh', 'ch', 'th']),
    ccvc: Object.freeze(['initial blends', 'blends']),
    cvcc: Object.freeze(['final blends', 'blends']),
    trigraph: Object.freeze(['tch', 'dge', 'igh']),
    cvce: Object.freeze(['magic e', 'silent e']),
    vowel_team: Object.freeze(['vowel teams', 'ai', 'ee', 'oa']),
    r_controlled: Object.freeze(['r controlled', 'bossy r', 'ar', 'or', 'er']),
    diphthong: Object.freeze(['oi', 'oy', 'ou']),
    floss: Object.freeze(['ff', 'll', 'ss']),
    welded: Object.freeze(['ang', 'ing', 'ank', 'ink']),
    multisyllable: Object.freeze(['syllables', 'multi syllable']),
    'vocab-math-k2': Object.freeze(['math k-2', 'math k2', 'numbers']),
    'vocab-math-35': Object.freeze(['math 3-5', 'math 35']),
    'vocab-science-k2': Object.freeze(['science k-2', 'science k2']),
    'vocab-science-35': Object.freeze(['science 3-5', 'science 35']),
    'vocab-social-k2': Object.freeze(['social studies k-2', 'social k2']),
    'vocab-ela-k2': Object.freeze(['ela k-2', 'reading k2'])
  });
  const CURRICULUM_FOCUS_EXAMPLE_FALLBACK = Object.freeze({
    cvc: Object.freeze(['cat', 'map', 'sun']),
    digraph: Object.freeze(['ship', 'chat', 'thin']),
    ccvc: Object.freeze(['stop', 'trap', 'plan']),
    cvcc: Object.freeze(['lamp', 'sand', 'milk']),
    trigraph: Object.freeze(['catch', 'ridge', 'light']),
    cvce: Object.freeze(['cake', 'time', 'rope']),
    vowel_team: Object.freeze(['team', 'boat', 'rain']),
    r_controlled: Object.freeze(['car', 'storm', 'fern']),
    diphthong: Object.freeze(['coin', 'cloud', 'toy']),
    welded: Object.freeze(['ring', 'bank', 'song']),
    suffix: Object.freeze(['jumped', 'runner', 'hopeful']),
    prefix: Object.freeze(['redo', 'unfair', 'preview']),
    multisyllable: Object.freeze(['contest', 'sunset', 'napkin']),
    all: Object.freeze(['word', 'sound', 'meaning'])
  });

  let focusNavIndex = -1;
  let focusCurriculumPackFilter = '';
  const curriculumExamplePoolCache = new Map();
  const curriculumEntryExampleCache = new Map();
  const subjectTagsByWord = new Map();
  const playableWordsFromRaw = new Set();
  let wordFocusCachesHydrated = false;

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function tokenizeFocusQuery(rawQuery = '') {
    return String(rawQuery || '').toLowerCase().trim().split(/[^a-z0-9]+/g).filter((token) => token.length >= 2);
  }

  function splitFocusSearchTokens(rawText = '') {
    return String(rawText || '').toLowerCase().split(/[^a-z0-9]+/g).map((token) => token.trim()).filter((token) => token.length >= 2);
  }

  function damerauLevenshteinDistance(source, target, maxDistance = 2) {
    const a = String(source || '');
    const b = String(target || '');
    if (a === b) return 0;
    if (!a.length || !b.length) return Math.max(a.length, b.length);
    if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      let rowMin = maxDistance + 1;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let value = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, matrix[i - 2][j - 2] + 1);
        matrix[i][j] = value;
        if (value < rowMin) rowMin = value;
      }
      if (rowMin > maxDistance) return maxDistance + 1;
    }
    return matrix[a.length][b.length];
  }

  function getFocusCandidateTokens(entry, aliases) {
    const labelTokens = splitFocusSearchTokens(entry?.label || '');
    const valueTokens = splitFocusSearchTokens(String(entry?.value || '').replaceAll('-', ' '));
    const groupTokens = splitFocusSearchTokens(entry?.group || '');
    const aliasTokens = aliases.flatMap((alias) => splitFocusSearchTokens(alias));
    return Array.from(new Set([...labelTokens, ...valueTokens, ...groupTokens, ...aliasTokens]));
  }

  function getTokenFuzzyThreshold(token) {
    return String(token || '').length <= 4 ? 1 : 2;
  }

  function getBestFuzzyDistance(queryToken, candidateTokens, maxDistance = 2) {
    let best = maxDistance + 1;
    for (const candidate of candidateTokens) {
      const next = damerauLevenshteinDistance(queryToken, candidate, maxDistance);
      if (next < best) best = next;
      if (best === 0) break;
    }
    return best;
  }

  function scoreFocusEntry(entry, normalizedQuery, queryTokens) {
    const label = String(entry?.label || '').toLowerCase();
    const value = String(entry?.value || '').toLowerCase();
    const group = String(entry?.group || '').toLowerCase();
    const aliases = (FOCUS_SEARCH_ALIASES[entry.value] || []).map((alias) => String(alias || '').toLowerCase()).filter(Boolean);
    const candidateTokens = getFocusCandidateTokens(entry, aliases);
    const searchable = `${label} ${group} ${value} ${aliases.join(' ')}`;
    let score = FOCUS_POPULARITY[entry.value] || 0;
    let hasMatch = false;
    if (label === normalizedQuery || value === normalizedQuery) { score += 420; hasMatch = true; }
    if (label.startsWith(normalizedQuery) || value.startsWith(normalizedQuery)) { score += 300; hasMatch = true; }
    if (label.split(/[^a-z0-9]+/g).some((part) => part && part.startsWith(normalizedQuery))) { score += 240; hasMatch = true; }
    if (aliases.some((alias) => alias.startsWith(normalizedQuery))) { score += 220; hasMatch = true; }
    if (searchable.includes(normalizedQuery)) { score += 150; hasMatch = true; }
    if (queryTokens.length) {
      let exactHits = 0;
      let fuzzyHits = 0;
      for (const token of queryTokens) {
        if (searchable.includes(token)) { exactHits += 1; continue; }
        const fuzzyThreshold = getTokenFuzzyThreshold(token);
        const bestDistance = getBestFuzzyDistance(token, candidateTokens, fuzzyThreshold);
        if (bestDistance <= fuzzyThreshold) { fuzzyHits += 1; continue; }
        return -1;
      }
      score += exactHits * 60;
      score += fuzzyHits * 44;
      if (fuzzyHits > 0) score += 18;
      hasMatch = true;
    }
    if (!hasMatch && normalizedQuery.length >= 4) {
      const compactQuery = normalizedQuery.replace(/[^a-z0-9]+/g, '');
      if (compactQuery.length >= 4) {
        const bestDistance = getBestFuzzyDistance(compactQuery, candidateTokens, 2);
        if (bestDistance <= 2) { score += 118 - bestDistance * 26; hasMatch = true; }
      }
    }
    if (!hasMatch) return -1;
    score += Math.max(0, 34 - Math.max(0, label.length - normalizedQuery.length));
    return score;
  }

  function getRankedFocusMatches(entries, rawQuery = '') {
    const normalizedQuery = String(rawQuery || '').trim().toLowerCase();
    if (!normalizedQuery) return [];
    const queryTokens = tokenizeFocusQuery(normalizedQuery);
    return entries.map((entry) => ({ entry, score: scoreFocusEntry(entry, normalizedQuery, queryTokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => (b.score - a.score) || String(a.entry.group || '').localeCompare(String(b.entry.group || '')) || String(a.entry.label || '').localeCompare(String(b.entry.label || '')))
      .slice(0, FOCUS_QUERY_VISIBLE_LIMIT)
      .map((row) => row.entry);
  }

  function setFocusSearchOpen(isOpen) {
    documentRef.documentElement.setAttribute('data-focus-search-open', isOpen ? 'true' : 'false');
    if (isOpen) closeQuickPopover('all');
    syncThemePreviewStripVisibility();
  }

  function openTeacherWordTools() {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return;
    }
    const teacherBtn = el('teacher-panel-btn');
    if (teacherBtn) {
      teacherBtn.click();
      return;
    }
    windowRef.dispatchEvent(new CustomEvent('open-teacher-hub'));
  }

  function getFocusSearchButtons() {
    const listEl = el('focus-inline-results');
    if (!listEl) return [];
    return Array.from(listEl.querySelectorAll('.focus-search-item[data-quest-value]'));
  }

  function setFocusNavIndex(nextIndex, options = {}) {
    const buttons = getFocusSearchButtons();
    const inputEl = el('focus-inline-search');
    if (!buttons.length) {
      focusNavIndex = -1;
      if (inputEl) inputEl.removeAttribute('aria-activedescendant');
      return;
    }
    const clamped = Math.max(0, Math.min(nextIndex, buttons.length - 1));
    focusNavIndex = clamped;
    buttons.forEach((button, idx) => button.classList.toggle('is-nav-active', idx === clamped));
    if (inputEl) inputEl.setAttribute('aria-activedescendant', buttons[clamped].id);
    if (options.scroll !== false) buttons[clamped].scrollIntoView({ block: 'nearest' });
  }

  function getFocusEntrySectionKey(entry) {
    if (!entry) return 'phonics';
    if (entry.kind === 'curriculum' || entry.kind === 'curriculum-pack') return 'curriculum';
    return parseFocusPreset(entry.value).kind === 'subject' ? 'subjects' : 'phonics';
  }

  function hashStringToPositiveInt(value) {
    const text = String(value || '');
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getCurriculumExampleWordsForTarget(target, entryKey = '') {
    if (!target) return [];
    const focus = String(target.focus || 'all').trim() || 'all';
    const gradeBand = String(target.gradeBand || 'K-2').trim() || 'K-2';
    const length = String(target.length || 'any').trim() || 'any';
    const cacheKey = `${focus}::${gradeBand}::${length}`;
    let pool = curriculumExamplePoolCache.get(cacheKey);
    if (!Array.isArray(pool)) {
      const rawPool = WQData.getPlayableWords({
        gradeBand,
        length,
        phonics: focus,
        includeLowerBands: shouldExpandGradeBandForFocus(focus)
      });
      pool = Array.isArray(rawPool) ? rawPool.map((word) => String(word || '').trim().toLowerCase()).filter((word) => /^[a-z]{2,12}$/.test(word)).slice(0, 200) : [];
      curriculumExamplePoolCache.set(cacheKey, pool);
    }
    if (!pool.length) return (CURRICULUM_FOCUS_EXAMPLE_FALLBACK[focus] || CURRICULUM_FOCUS_EXAMPLE_FALLBACK.all).slice(0, 3);
    const seeded = hashStringToPositiveInt(`${entryKey}::${target.id}::${cacheKey}`);
    const start = seeded % pool.length;
    const out = [];
    for (let offset = 0; offset < pool.length && out.length < 3; offset += 1) {
      const next = pool[(start + offset) % pool.length];
      if (!next || out.includes(next)) continue;
      out.push(next);
    }
    return out;
  }

  function getCurriculumFocusChipLabel(focusValue, packId = '') {
    const focus = String(focusValue || 'all').trim().toLowerCase() || 'all';
    const pack = String(packId || '').trim().toLowerCase();
    if (pack === 'ufli' || pack === 'fundations' || pack === 'wilson') {
      const curated = {
        cvc: 'short-vowel CVC words',
        digraph: 'digraph spellings (sh/ch/th/wh)',
        ccvc: 'initial blends (st-/bl-/tr-)',
        cvcc: 'final blends (-mp/-nd/-st)',
        cvce: 'VCe (magic e: a_e/i_e/o_e/u_e)',
        vowel_team: 'vowel teams (ai/ay, ee/ea, oa/ow)',
        r_controlled: 'r-controlled vowels (ar/or/er/ir/ur)',
        welded: 'welded sounds (ang/ing/ong/ank/ink)',
        diphthong: 'diphthongs (oi/oy, ou/ow)',
        prefix: 'prefixes (re-/un-/pre-)',
        suffix: 'suffixes (-s/-ed/-ing)',
        multisyllable: 'syllable division (V/CV, VC/V)',
        all: 'mixed review'
      };
      return curated[focus] || focus.replaceAll('_', ' ');
    }
    const shortLabels = {
      cvc: 'cvc short vowels (CVC)', digraph: 'digraphs (sh/ch/th/wh)', ccvc: 'initial blends (st-/bl-/tr-)', cvcc: 'final blends (-mp/-nd/-st)',
      trigraph: 'trigraphs (tch/dge/igh)', cvce: 'magic e (a_e/i_e/o_e/u_e)', vowel_team: 'vowel teams (ai/ay, ee/ea, oa/ow)',
      r_controlled: 'r-controlled (ar/or/er/ir/ur)', diphthong: 'diphthongs (oi/oy, ou/ow)', welded: 'welded sounds (ang/ing/ong/ank/ink)',
      prefix: 'prefixes (re-/un-/pre-)', suffix: 'suffixes (-s/-ed/-ing)', multisyllable: 'multisyllable (V/CV, VC/V)', schwa: 'schwa (about/sofa)', floss: 'floss (-ff/-ll/-ss/-zz)'
    };
    return shortLabels[focus] || focus;
  }

  function getCurriculumPackAbbrev(packId) {
    const id = String(packId || '').trim().toLowerCase();
    if (id === 'fundations') return 'FND';
    if (id === 'ufli') return 'UFL';
    if (id === 'wilson') return 'WRS';
    if (id === 'lexia') return 'LEX';
    if (id === 'justwords') return 'JW';
    return '';
  }

  function formatCurriculumLessonLabel(entry) {
    const label = String(entry?.label || '').trim();
    if (!label || entry?.kind !== 'curriculum') return label;
    const packAbbrev = getCurriculumPackAbbrev(entry.packId);
    if (entry.packId === 'fundations') {
      const bonusMatch = label.match(/Fundations\s+Level\s+([A-Za-z0-9]+)\s+Bonus\s+Unit/i);
      if (bonusMatch) return `Level ${bonusMatch[1]} Bonus Unit`;
      const match = label.match(/Fundations\s+Level\s+([A-Za-z0-9]+)\s+Unit\s+([A-Za-z0-9]+)/i);
      if (match) return `Level ${match[1]} Unit ${match[2]}`;
      const compactMatch = label.match(/Fundations\s+L\.\s*([A-Za-z0-9]+)\s+U\.\s*([A-Za-z0-9]+)/i);
      if (compactMatch) return `Level ${compactMatch[1]} Unit ${compactMatch[2]}`;
      if (/^Fundations\b/i.test(label)) {
        const stripped = label.replace(/^Fundations\s*/i, '').trim();
        return stripped || 'Fundations Lesson';
      }
    }
    if (entry.packId === 'ufli') {
      const match = label.match(/Lesson\s+(\d+)/i);
      if (match) return `${packAbbrev || 'UFL'} L${match[1]}`;
    }
    if (entry.packId === 'wilson') {
      const mappedMatch = label.match(/Wilson\s+Reading\s+System\s+([0-9]+(?:\.[0-9]+)?)/i);
      if (mappedMatch) return `${packAbbrev || 'WRS'} ${mappedMatch[1]}`;
      const match = label.match(/Step\s+(\d+)\s+Lesson\s+(\d+)/i);
      if (match) return `${packAbbrev || 'WRS'} S${match[1]} L${match[2]}`;
    }
    if (entry.packId === 'justwords') {
      const match = label.match(/Unit\s+([A-Za-z0-9]+)/i);
      if (match) return `${packAbbrev || 'JW'} U${match[1]}`;
    }
    return packAbbrev ? `${packAbbrev} ${label}` : label;
  }

  function getCurriculumEntryMeta(entry) {
    if (!entry || entry.kind !== 'curriculum') return '';
    const cacheKey = String(entry.value || `${entry.packId || ''}::${entry.targetId || ''}`);
    if (curriculumEntryExampleCache.has(cacheKey)) return curriculumEntryExampleCache.get(cacheKey) || '';
    const target = getLessonTarget(entry.packId, entry.targetId);
    if (!target) return '';
    const examples = getCurriculumExampleWordsForTarget(target, cacheKey);
    const focusLabel = getCurriculumFocusChipLabel(target.focus, entry.packId);
    const packId = String(entry.packId || '').toLowerCase();
    const useCuratedPatternOnly = ['ufli', 'fundations', 'wilson'].includes(packId);
    const text = examples.length ? `${focusLabel} (${examples.join(', ')})` : (useCuratedPatternOnly ? focusLabel : '');
    curriculumEntryExampleCache.set(cacheKey, text);
    return text;
  }

  function getFocusEntryMeta(entry) {
    if (!entry) return '';
    if (entry.kind === 'curriculum-pack') {
      const count = Math.max(0, Number(entry.lessonCount) || 0);
      return count ? `${count} lessons` : 'Open lessons';
    }
    if (entry.kind === 'curriculum') return getCurriculumEntryMeta(entry);
    const focusHints = Object.freeze({
      cvc: 'short vowel sounds • cat, map',
      digraph: 'two letters, one sound • ship, chat',
      ccvc: 'blend at the start • stop, plan',
      cvcc: 'blend at the end • lamp, sand',
      trigraph: 'three-letter chunk • catch, light',
      cvce: 'silent e changes the vowel • cap→cape',
      vowel_team: 'two vowels team up • rain, boat',
      r_controlled: 'vowel sound changes before r • car, fern',
      diphthong: 'mouth glides between sounds • coin, cloud',
      floss: 'double f/l/s/z after short vowel • bell, miss',
      welded: 'glued chunks • ring, bank',
      schwa: 'lazy vowel /uh/ • about, sofa',
      prefix: 'add to the beginning • re+do',
      suffix: 'add to the end • jump+ed',
      compound: 'two words join • sun+set',
      multisyllable: 'clap the parts • nap-kin, con-test'
    });
    const preset = parseFocusPreset(entry.value);
    if (entry.kind === 'focus' && preset.kind === 'phonics') return focusHints[preset.focus] || '';
    if (preset.kind === 'subject' && preset.gradeBand) return `Grade ${formatGradeBandLabel(preset.gradeBand)}`;
    return '';
  }

  function compareCurriculumEntries(leftEntry, rightEntry) {
    if (!leftEntry || !rightEntry) return 0;
    const leftPack = String(leftEntry.packId || '').trim().toLowerCase();
    const rightPack = String(rightEntry.packId || '').trim().toLowerCase();
    if (leftPack !== rightPack) {
      return String(leftEntry.group || '').localeCompare(String(rightEntry.group || ''));
    }
    const parseCurriculumNumbers = (entry) => {
      if (!entry || entry.kind !== 'curriculum') return null;
      const packId = String(entry.packId || '').trim().toLowerCase();
      const targetId = String(entry.targetId || '').trim().toLowerCase();
      const label = String(entry.label || '').trim();
      if (packId === 'fundations') {
        const rankLevelToken = (rawToken) => {
          const token = String(rawToken || '').trim().toUpperCase();
          if (token === 'K') return 0;
          const numeric = Number(token);
          return Number.isFinite(numeric) && numeric > 0 ? numeric : 999;
        };
        const idMatch = targetId.match(/fundations-l([a-z0-9]+)-u([a-z0-9]+)/i);
        if (idMatch) return { pack: 'fundations', level: rankLevelToken(idMatch[1]), unit: Number(idMatch[2]) || 0 };
        const levelUnitMatch = label.match(/level\s+([a-z0-9]+)\s+unit\s+([a-z0-9]+)/i);
        if (levelUnitMatch) return { pack: 'fundations', level: rankLevelToken(levelUnitMatch[1]), unit: Number(levelUnitMatch[2]) || 0 };
        const bonusMatch = label.match(/level\s+([a-z0-9]+)\s+bonus\s+unit/i);
        if (bonusMatch) return { pack: 'fundations', level: rankLevelToken(bonusMatch[1]), unit: 999 };
      }
      if (packId === 'ufli') {
        const idMatch = targetId.match(/ufli-lesson-(\d+)/i);
        if (idMatch) return { pack: 'ufli', lesson: Number(idMatch[1]) || 0 };
        const labelMatch = label.match(/lesson\s+(\d+)/i);
        if (labelMatch) return { pack: 'ufli', lesson: Number(labelMatch[1]) || 0 };
      }
      if (packId === 'wilson') {
        const stepLesson = targetId.match(/wilson-step-(\d+)-lesson-(\d+)/i);
        if (stepLesson) return { pack: 'wilson', step: Number(stepLesson[1]) || 0, lesson: Number(stepLesson[2]) || 0 };
        const labelMatch = label.match(/step\s+(\d+)\s+lesson\s+(\d+)/i);
        if (labelMatch) return { pack: 'wilson', step: Number(labelMatch[1]) || 0, lesson: Number(labelMatch[2]) || 0 };
      }
      if (packId === 'justwords') {
        const labelMatch = label.match(/unit\s+([0-9]+)/i);
        if (labelMatch) return { pack: 'justwords', unit: Number(labelMatch[1]) || 0 };
      }
      return null;
    };
    const leftParsed = parseCurriculumNumbers(leftEntry);
    const rightParsed = parseCurriculumNumbers(rightEntry);
    if (leftParsed && rightParsed) {
      if (leftParsed.pack === 'fundations' && rightParsed.pack === 'fundations') {
        const levelDiff = (leftParsed.level || 0) - (rightParsed.level || 0);
        if (levelDiff !== 0) return levelDiff;
        const unitDiff = (leftParsed.unit || 0) - (rightParsed.unit || 0);
        if (unitDiff !== 0) return unitDiff;
      }
      if (leftParsed.pack === 'ufli' && rightParsed.pack === 'ufli') {
        const diff = (leftParsed.lesson || 0) - (rightParsed.lesson || 0);
        if (diff !== 0) return diff;
      }
      if (leftParsed.pack === 'wilson' && rightParsed.pack === 'wilson') {
        const stepDiff = (leftParsed.step || 0) - (rightParsed.step || 0);
        if (stepDiff !== 0) return stepDiff;
        const lessonDiff = (leftParsed.lesson || 0) - (rightParsed.lesson || 0);
        if (lessonDiff !== 0) return lessonDiff;
      }
      if (leftParsed.pack === 'justwords' && rightParsed.pack === 'justwords') {
        const diff = (leftParsed.unit || 0) - (rightParsed.unit || 0);
        if (diff !== 0) return diff;
      }
    }
    return String(leftEntry.label || '').localeCompare(String(rightEntry.label || ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  function reorderForColumnFirstGrid(entries, columns = 2) {
    const list = Array.isArray(entries) ? entries.slice() : [];
    if (list.length <= columns) return list;
    const perCol = Math.ceil(list.length / columns);
    const cols = [];
    for (let i = 0; i < columns; i += 1) cols.push(list.slice(i * perCol, (i + 1) * perCol));
    const ordered = [];
    for (let row = 0; row < perCol; row += 1) for (let col = 0; col < columns; col += 1) if (cols[col][row]) ordered.push(cols[col][row]);
    return ordered;
  }

  function renderFocusSectionItems(entries, activeQuestValue, activePack, activePackLabel, options = {}) {
    return entries.map((entry) => {
      const questValue = entry.questValue || `focus::${entry.value}`;
      const isProgram = entry.kind === 'curriculum-pack';
      const isActive = isProgram ? (entry.packId === activePack || entry.packId === focusCurriculumPackFilter) : (questValue === activeQuestValue);
      const label = isProgram ? `${entry.label} · Choose Lesson` : formatCurriculumLessonLabel(entry);
      const meta = getFocusEntryMeta(entry);
      const scopeClass = isProgram ? ' is-program' : ' is-curriculum';
      const extraClass = options && options.columnFlow ? ' focus-curriculum-item' : '';
      const ariaLabel = isProgram ? `Open ${entry.label} lesson groups` : `${entry.group || activePackLabel} ${label}${meta ? ` ${meta}` : ''}`;
      return `<button type="button" class="focus-search-item${scopeClass}${extraClass}${isActive ? ' is-active' : ''}" data-quest-value="${escapeHtml(questValue)}" role="option" aria-selected="${isActive ? 'true' : 'false'}" aria-label="${escapeHtml(ariaLabel)}"><span>${escapeHtml(label)}</span>${meta ? `<small>${escapeHtml(meta)}</small>` : ''}</button>`;
    }).join('');
  }

  function buildFocusSearchSections(entries, options = {}) {
    const query = String(options.query || '').trim();
    const sections = { phonics: [], subjects: [], curriculum: [] };
    entries.forEach((entry) => { const key = getFocusEntrySectionKey(entry); if (sections[key]) sections[key].push(entry); });
    sections.phonics.sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')));
    sections.subjects.sort((a, b) => getGradeBandRank(parseFocusPreset(a.value).gradeBand) - getGradeBandRank(parseFocusPreset(b.value).gradeBand) || String(a.label || '').localeCompare(String(b.label || '')));
    sections.curriculum.sort((a, b) => {
      if (a.kind === 'curriculum-pack' && b.kind !== 'curriculum-pack') return -1;
      if (a.kind !== 'curriculum-pack' && b.kind === 'curriculum-pack') return 1;
      return compareCurriculumEntries(a, b);
    });
    const output = [];
    if (sections.phonics.length) output.push({ heading: 'Phonics Skills', entries: sections.phonics });
    if (sections.curriculum.length) output.push({ heading: query ? 'Curriculum Matches' : 'Curriculum', entries: sections.curriculum });
    if (sections.subjects.length) output.push({ heading: 'Grade Band Subjects', entries: sections.subjects });
    return output;
  }

  function renderFocusSearchList(rawQuery = '', options = {}) {
    const listEl = el('focus-inline-results');
    const inputEl = el('focus-inline-search');
    if (!listEl) return;
    const userInitiated = options && options.userInitiated === true;
    const reopenGuardUntil = Number(documentRef.documentElement.dataset.focusSearchReopenGuardUntil || 0);
    if (!userInitiated && Date.now() < reopenGuardUntil) {
      closeFocusSearchList();
      return;
    }
    const query = String(rawQuery || '').trim().toLowerCase();
    const isCurriculumLessonListMode = !query && Boolean(focusCurriculumPackFilter);
    listEl.classList.toggle('is-curriculum-list', isCurriculumLessonListMode);
    listEl.classList.toggle('is-fundations-grid', isCurriculumLessonListMode && focusCurriculumPackFilter === 'fundations');
    const selectedGradeBand = getQuestFilterGradeBand();
    const focusEntries = getFocusEntries(selectedGradeBand);
    const curriculumProgramEntries = getCurriculumProgramEntries(selectedGradeBand);
    if (focusCurriculumPackFilter && !curriculumProgramEntries.some((entry) => entry.packId === focusCurriculumPackFilter)) focusCurriculumPackFilter = '';
    const curriculumLessonEntries = getCurriculumQuestEntries(focusCurriculumPackFilter, selectedGradeBand);
    const entries = getQuestEntries(selectedGradeBand);
    if (!entries.length) {
      listEl.innerHTML = '<div class="focus-search-empty">Focus options are loading...</div>';
      listEl.classList.remove('hidden');
      if (inputEl) inputEl.setAttribute('aria-expanded', 'true');
      setFocusSearchOpen(true);
      focusNavIndex = -1;
      if (inputEl) inputEl.removeAttribute('aria-activedescendant');
      return;
    }
    let visible = [];
    const shouldResetScroll = !query;
    if (!query) {
      visible = focusCurriculumPackFilter
        ? curriculumLessonEntries
        : [
            ...focusEntries.filter((entry) => entry.value !== 'all' && parseFocusPreset(entry.value).kind === 'phonics'),
            ...focusEntries.filter((entry) => parseFocusPreset(entry.value).kind === 'subject'),
            ...curriculumProgramEntries
          ].slice(0, FOCUS_EMPTY_VISIBLE_LIMIT);
    } else {
      visible = getRankedFocusMatches(entries, query);
    }
    if (!visible.length) {
      listEl.innerHTML = '<div class="focus-search-empty">No matches yet. Try <b>short vowels</b>, <b>magic e</b>, <b>vowel teams</b>, <b>digraphs</b>, or <b>blends</b>.</div>';
      listEl.classList.remove('hidden');
      if (inputEl) inputEl.setAttribute('aria-expanded', 'true');
      setFocusSearchOpen(true);
      focusNavIndex = -1;
      if (inputEl) inputEl.removeAttribute('aria-activedescendant');
      return;
    }
    const activeFocus = el('setting-focus')?.value || 'all';
    const activePack = normalizeLessonPackId(prefs.lessonPack || el('s-lesson-pack')?.value || defaultPrefs.lessonPack);
    const activeTarget = normalizeLessonTargetId(activePack, prefs.lessonTarget || el('s-lesson-target')?.value || defaultPrefs.lessonTarget);
    const activeQuestValue = (activePack !== 'custom' && activeTarget !== 'custom') ? `curriculum::${activePack}::${activeTarget}` : `focus::${activeFocus}`;
    const activePackLabel = getLessonPackDefinition(activePack).label;
    const actions = [];
    if (!query && focusCurriculumPackFilter) {
      const packLabel = getLessonPackDefinition(focusCurriculumPackFilter).label;
      actions.push(`<div class="focus-search-topbar"><button type="button" class="focus-search-back-mini" data-focus-action="curriculum-back" aria-label="Back to program list" title="Back to program list">←</button><div class="focus-search-pack-title">${escapeHtml(packLabel)}</div></div>`);
    }
    const guidance = !query && !focusCurriculumPackFilter ? '<div class="focus-search-empty focus-search-empty-hint">Choose a phonics skill to see the sound pattern and example words, or choose a curriculum/grade-band subject program.</div>' : '';
    const sections = buildFocusSearchSections(visible, { query });
    const sectionMarkup = sections.map((section) => {
      if (section.heading === 'Curriculum' || section.heading === 'Curriculum Matches') {
        const curriculumRows = section.entries;
        const programRows = curriculumRows.filter((entry) => entry.kind === 'curriculum-pack');
        const lessonRows = curriculumRows.filter((entry) => entry.kind === 'curriculum');
        const groupedLessons = lessonRows.reduce((map, entry) => { const key = String(entry.group || 'Curriculum').trim(); (map[key] ||= []).push(entry); return map; }, Object.create(null));
        const orderedPacks = ['UFLI', 'Fundations', 'Wilson Reading System', 'Lexia English (WIDA)', 'Just Words'];
        const lessonBlocks = orderedPacks.filter((packLabel) => Array.isArray(groupedLessons[packLabel]) && groupedLessons[packLabel].length).map((packLabel) => {
          groupedLessons[packLabel].sort(compareCurriculumEntries);
          const orderedLessons = reorderForColumnFirstGrid(groupedLessons[packLabel], 2);
          return `<div class="focus-search-subheading" role="presentation">${escapeHtml(packLabel)}</div>` + renderFocusSectionItems(orderedLessons, activeQuestValue, activePack, activePackLabel, { columnFlow: true });
        });
        return `${!(isCurriculumLessonListMode && !query) ? getSectionHeadingMarkup(section.heading) : ''}${renderFocusSectionItems(programRows, activeQuestValue, activePack, activePackLabel)}${lessonBlocks.join('')}`;
      }
      return getSectionHeadingMarkup(section.heading) + renderFocusSectionItems(section.entries, activeQuestValue, activePack, activePackLabel);
    }).join('');
    listEl.innerHTML = actions.join('') + guidance + sectionMarkup;
    if (shouldResetScroll) listEl.scrollTop = 0;
    getFocusSearchButtons().forEach((button, idx) => { button.id = `focus-search-option-${idx}`; button.classList.remove('is-nav-active'); });
    focusNavIndex = -1;
    if (inputEl) inputEl.removeAttribute('aria-activedescendant');
    listEl.classList.remove('hidden');
    if (inputEl) inputEl.setAttribute('aria-expanded', 'true');
    setFocusSearchOpen(true);
  }

  function closeFocusSearchList() {
    const list = el('focus-inline-results');
    const inputEl = el('focus-inline-search');
    if (!list) return;
    focusCurriculumPackFilter = '';
    focusNavIndex = -1;
    if (inputEl) inputEl.removeAttribute('aria-activedescendant');
    if (inputEl) inputEl.setAttribute('aria-expanded', 'false');
    list.classList.remove('is-curriculum-list');
    list.classList.add('hidden');
    setFocusSearchOpen(false);
  }

  const SUBJECT_TAG_ALIASES = Object.freeze({
    math: new Set(['math', 'mathematics', 'algebra', 'geometry', 'statistics', 'calculus', 'trigonometry', 'trig']),
    science: new Set(['science', 'sci', 'biology', 'bio', 'chemistry', 'physics', 'earth sci', 'earth science', 'anatomy', 'med', 'engineering']),
    social: new Set(['ss', 'social studies', 'history', 'hist', 'civics', 'govt', 'government', 'geo', 'geography', 'econ', 'economics', 'law', 'bus']),
    ela: new Set(['ela', 'language arts', 'reading', 'writing', 'literacy', 'english', 'eng'])
  });

  const SUBJECT_WORD_OVERRIDES = Object.freeze({
    oxide: Object.freeze(['science', 'math']),
    oxidize: Object.freeze(['science', 'math'])
  });

  function normalizeSubjectTag(rawTag) {
    const normalized = String(rawTag || '')
      .trim()
      .toLowerCase()
      .replace(/^"+|"+$/g, '')
      .replace(/\s+/g, ' ');
    if (!normalized) return '';
    if (normalized.length > 24) return '';
    if (!/^[a-z0-9/&+\- ]+$/.test(normalized)) return '';
    return normalized;
  }

  function hydrateWordFocusCaches() {
    if (wordFocusCachesHydrated) return;
    const rawEntries = WQData && typeof WQData.getAllRawEntries === 'function'
      ? WQData.getAllRawEntries()
      : (WQ_WORD_DATA && typeof WQ_WORD_DATA === 'object' ? WQ_WORD_DATA : {});
    Object.values(rawEntries).forEach((raw) => {
      const word = String(raw?.display_word || '').trim().toLowerCase();
      if (!word) return;
      if ((raw?.game_tag || 'playable') === 'playable') playableWordsFromRaw.add(word);
      const rawTags = raw?.instructional_paths?.subject_tags;
      const tags = (Array.isArray(rawTags) ? rawTags : [rawTags])
        .filter(Boolean)
        .flatMap((tag) => String(tag).split(','))
        .map(normalizeSubjectTag)
        .filter(Boolean);
      if (!tags.length) return;
      const prior = subjectTagsByWord.get(word) || [];
      subjectTagsByWord.set(word, Array.from(new Set([...prior, ...tags])));
    });
    wordFocusCachesHydrated = true;
  }

  function matchesSubjectFocus(word, subject) {
    hydrateWordFocusCaches();
    const normalizedWord = String(word || '').trim().toLowerCase();
    const overrideSubjects = SUBJECT_WORD_OVERRIDES[normalizedWord];
    if (Array.isArray(overrideSubjects) && overrideSubjects.includes(subject)) return true;
    const tags = subjectTagsByWord.get(normalizedWord) || [];
    if (!tags.length) return false;
    const aliasSet = SUBJECT_TAG_ALIASES[subject];
    if (!aliasSet) return false;
    return tags.some((tag) => aliasSet.has(tag));
  }

  function matchesPhonicsFocus(phonicsValue, focus, word) {
    hydrateWordFocusCaches();
    const phonics = String(phonicsValue || '').toLowerCase();
    const hasPrefix = typeof word === 'string' && /^(un|re|pre|dis|mis|non|sub|inter|trans|over|under|anti|de)/.test(word);
    const hasSuffix = typeof word === 'string' && /(ing|ed|er|est|ly|tion|sion|ment|ness|less|ful|able|ible|ous|ive|al|y)$/.test(word);
    const isLikelyCompound = (() => {
      if (typeof word !== 'string' || word.length < 6 || !playableWordsFromRaw.size) return false;
      for (let i = 3; i <= word.length - 3; i += 1) {
        const left = word.slice(0, i);
        const right = word.slice(i);
        if (playableWordsFromRaw.has(left) && playableWordsFromRaw.has(right)) return true;
      }
      return false;
    })();
    switch (focus) {
      case 'cvc': return /\bcvc\b|closed/.test(phonics);
      case 'digraph': return /digraph|sh|ch|th|wh|ph/.test(phonics);
      case 'ccvc': return /\bccvc\b|initial blend|blend/.test(phonics);
      case 'cvcc': return /\bcvcc\b|final blend|blend/.test(phonics);
      case 'trigraph': return /trigraph|tch|dge|igh/.test(phonics);
      case 'cvce': return /silent e|magic e|cvce|vce/.test(phonics);
      case 'vowel_team': return /vowel team/.test(phonics);
      case 'r_controlled': return /r-controlled|r controlled|\(ar\)|\(or\)|\(er\)|\(ir\)|\(ur\)/.test(phonics);
      case 'diphthong': return /diphthong/.test(phonics);
      case 'floss': return /floss/.test(phonics);
      case 'welded': return /welded/.test(phonics);
      case 'schwa': return /schwa/.test(phonics);
      case 'prefix': return /prefix/.test(phonics) || hasPrefix;
      case 'suffix': return /suffix/.test(phonics) || hasSuffix;
      case 'compound': return /compound/.test(phonics) || isLikelyCompound;
      case 'multisyllable': return /multi|syllab/.test(phonics);
      default: return focus === 'all' ? true : phonics.includes(focus);
    }
  }

  function installFocusDataPatch() {
    if (!WQData || WQData.__focusPatchApplied) return;
    const originalGetPlayableWords = WQData.getPlayableWords.bind(WQData);
    WQData.getPlayableWords = function getPlayableWordsWithFocus(opts = {}) {
      const focusValue = opts.focus || opts.phonics || 'all';
      const preset = parseFocusPreset(focusValue);
      const requestedGradeBand = preset.kind === 'subject' ? preset.gradeBand : opts.gradeBand;
      const effectiveGradeBand = getEffectiveGameplayGradeBand(requestedGradeBand, focusValue);
      const includeLowerBands = preset.kind === 'phonics' ? (opts.includeLowerBands !== false) : false;
      const basePool = originalGetPlayableWords({
        gradeBand: effectiveGradeBand || safeDefaultGradeBand,
        length: opts.length,
        phonics: 'all',
        includeLowerBands
      });
      if (preset.kind === 'classic') return basePool;
      if (preset.kind === 'subject') {
        return basePool.filter((word) => matchesSubjectFocus(word, preset.subject));
      }
      return basePool.filter((word) => {
        const entry = WQData.getEntry(word);
        return matchesPhonicsFocus(entry?.phonics, preset.focus, word);
      });
    };
    WQData.__focusPatchApplied = true;
  }

  function setFocusValue(nextValue, options = {}) {
    if (isAssessmentRoundLocked() && !options.force) {
      showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
      closeFocusSearchList();
      return;
    }
    const select = el('setting-focus');
    if (!select) return;
    const target = String(nextValue || '').trim();
    if (!target) return;
    const exists = Array.from(select.options).some((option) => option.value === target);
    if (!exists) return;
    if (select.value === target) {
      updateFocusSummaryLabel();
      closeFocusSearchList();
      if (options.startNewWord) setNewGame();
      return;
    }
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (options.toast) showToast(`Focus set: ${getFocusLabel(target)}.`);
    closeFocusSearchList();
    if (options.startNewWord) setNewGame();
  }

  function setQuestValue(nextValue, options = {}) {
    const raw = String(nextValue || '').trim();
    if (!raw) return;
    if (raw.startsWith('curriculum-pack::')) {
      const [, packRaw = 'custom'] = raw.split('::');
      const packId = normalizeLessonPackId(packRaw);
      if (packId === 'custom') return;
      emitTelemetry('wq_funnel_quest_select', { source: 'focus_search', selection_type: 'curriculum_pack', lesson_pack_id: packId });
      focusCurriculumPackFilter = packId;
      const inputEl = el('focus-inline-search');
      if (inputEl) {
        const packLabel = getLessonPackDefinition(packId).label;
        inputEl.value = packLabel;
        inputEl.dataset.lockedLabel = packLabel.toLowerCase();
      }
      renderFocusSearchList('', { userInitiated: true });
      return;
    }
    if (raw.startsWith('curriculum::')) {
      if (isAssessmentRoundLocked() && !options.force) {
        showAssessmentLockNotice('Assessment lock is on. Curriculum changes unlock after this round.');
        closeFocusSearchList();
        return;
      }
      const [, packRaw = 'custom', targetRaw = 'custom'] = raw.split('::');
      const packId = normalizeLessonPackId(packRaw);
      const targetId = normalizeLessonTargetId(packId, targetRaw);
      if (packId === 'custom') {
        handleLessonPackSelectionChange('custom');
        updateFocusSummaryLabel();
        closeFocusSearchList();
        if (options.startNewWord) setNewGame();
        return;
      }
      handleLessonPackSelectionChange(packId);
      handleLessonTargetSelectionChange(targetId);
      emitTelemetry('wq_funnel_quest_select', { source: 'focus_search', selection_type: 'curriculum', lesson_pack_id: packId, lesson_target_id: targetId });
      if (options.toast) {
        const pack = getLessonPackDefinition(packId);
        const target = getLessonTarget(packId, targetId);
        if (target) showToast(`Track set: ${pack.label} · ${target.label}.`);
      }
      updateFocusSummaryLabel();
      closeFocusSearchList();
      if (options.startNewWord) setNewGame();
      return;
    }
    const focusValue = raw.startsWith('focus::') ? raw.slice('focus::'.length) : raw;
    emitTelemetry('wq_funnel_quest_select', { source: 'focus_search', selection_type: 'focus', focus_id: focusValue });
    setFocusValue(focusValue, options);
  }

  function bindFocusControls() {
    el('setting-focus')?.addEventListener('change', (event) => {
      const focus = event.target?.value || 'all';
      setFocusPref('focus', focus);
      releaseLessonPackToManualMode();
      syncLengthFromFocus(focus, { silent: false });
      syncGradeFromFocus(focus, { silent: false });
      updateFocusHint();
      updateFocusGradeNote();
      updateFocusSummaryLabel();
      syncChunkTabsVisibility();
      refreshStandaloneMissionLabHub();
      closeFocusSearchList();
    });

    el('focus-inline-search')?.addEventListener('focus', (event) => {
      if (demoMode) {
        event.preventDefault();
        demoCloseAllOverlays();
        event.target.blur();
        return;
      }
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
        closeFocusSearchList();
        event.target.blur();
        return;
      }
      clearPinnedFocusSearchValue(event.target);
      renderFocusSearchList(String(event.target?.value || '').trim(), { userInitiated: true });
    });

    el('focus-inline-search')?.addEventListener('click', (event) => {
      if (demoMode) {
        event.preventDefault();
        demoCloseAllOverlays();
        return;
      }
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
        closeFocusSearchList();
        return;
      }
      clearPinnedFocusSearchValue(event.target);
      const query = String(event.target?.value || '').trim();
      renderFocusSearchList(query, { userInitiated: true });
    });

    el('focus-inline-search')?.addEventListener('input', (event) => {
      if (demoMode) {
        event.preventDefault();
        demoCloseAllOverlays();
        return;
      }
      if (isAssessmentRoundLocked()) {
        closeFocusSearchList();
        return;
      }
      clearPinnedFocusSearchValue(event.target);
      const query = String(event.target?.value || '').trim();
      renderFocusSearchList(query, { userInitiated: true });
    });

    el('focus-inline-search')?.addEventListener('keydown', (event) => {
      if (demoMode) {
        event.preventDefault();
        event.stopPropagation();
        demoCloseAllOverlays();
        return;
      }
      if (isAssessmentRoundLocked()) {
        if (event.key === 'Enter' || event.key === ' ') {
          showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
        }
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      clearPinnedFocusSearchValue(event.target);
      event.stopPropagation();
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
        const query = String(event.target?.value || '').trim();
        const listEl = el('focus-inline-results');
        if (listEl?.classList.contains('hidden')) {
          renderFocusSearchList(query, { userInitiated: true });
        }
        const buttons = getFocusSearchButtons();
        if (!buttons.length) return;
        if (event.key === 'Home') {
          setFocusNavIndex(0);
        } else if (event.key === 'End') {
          setFocusNavIndex(buttons.length - 1);
        } else if (event.key === 'ArrowDown') {
          const nextIndex = focusNavIndex < 0 ? 0 : (focusNavIndex + 1) % buttons.length;
          setFocusNavIndex(nextIndex);
        } else if (event.key === 'ArrowUp') {
          const nextIndex = focusNavIndex < 0 ? buttons.length - 1 : (focusNavIndex - 1 + buttons.length) % buttons.length;
          setFocusNavIndex(nextIndex);
        }
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        closeFocusSearchList();
        updateFocusSummaryLabel();
        event.target.blur();
        return;
      }
      if (event.key !== 'Enter') return;
      const buttons = getFocusSearchButtons();
      if (!buttons.length) return;
      const chosen = focusNavIndex >= 0 ? buttons[focusNavIndex] : buttons[0];
      setQuestValue(chosen.getAttribute('data-quest-value'), { startNewWord: true });
      updateFocusSummaryLabel();
      event.preventDefault();
    });

    el('focus-inline-results')?.addEventListener('click', (event) => {
      if (demoMode) {
        event.preventDefault();
        event.stopPropagation();
        demoCloseAllOverlays();
        return;
      }
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
        closeFocusSearchList();
        return;
      }
      const action = event.target?.closest?.('[data-focus-action]');
      if (action) {
        const actionId = String(action.getAttribute('data-focus-action') || '').trim().toLowerCase();
        if (actionId === 'teacher-words') {
          openTeacherWordTools();
        } else if (actionId === 'curriculum-back') {
          focusCurriculumPackFilter = '';
          const inputEl = el('focus-inline-search');
          if (inputEl) {
            inputEl.value = '';
            inputEl.dataset.lockedLabel = '';
          }
          renderFocusSearchList('', { userInitiated: true });
        }
        return;
      }
      const button = event.target?.closest?.('[data-quest-value]');
      if (!button) return;
      const value = button.getAttribute('data-quest-value');
      setQuestValue(value, { startNewWord: true });
      updateFocusSummaryLabel();
    });
  }

  function initializeFocusRuntime() {
    const initialLessonPackState = syncLessonPackControlsFromPrefs();
    if (initialLessonPackState.packId !== 'custom' && initialLessonPackState.targetId !== 'custom') {
      applyLessonTargetConfig(initialLessonPackState.packId, initialLessonPackState.targetId);
    }
    syncGradeFromFocus(el('setting-focus')?.value || prefs.focus || 'all', { silent: true });
    enforceFocusSelectionForGrade(el('s-grade')?.value || prefs.grade || defaultPrefs.grade, { toast: false });
    enforceClassicFiveLetterDefault();
    applyAllGradeLengthDefault();
    updateFocusHint();
    updateFocusGradeNote();
    syncChunkTabsVisibility();
    updateFocusSummaryLabel();
    closeFocusSearchList();
  }

  return Object.freeze({
    bindFocusControls,
    closeFocusSearchList,
    getFocusSearchButtons,
    initializeFocusRuntime,
    installFocusDataPatch,
    openTeacherWordTools,
    renderFocusSearchList,
    setFocusNavIndex,
    setFocusValue,
    setQuestValue
  });
}

window.createFocusSearchRuntimeModule = createFocusSearchRuntimeModule;
