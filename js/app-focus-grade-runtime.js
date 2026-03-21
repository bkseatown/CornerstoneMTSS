/**
 * app-focus-grade-runtime.js
 * Focus/grade alignment, quest entry generation, and focus summary helpers.
 */

function createFocusGradeRuntimeModule(deps) {
  const {
    applyChunkTabsMode = (value) => String(value || ''),
    defaultPrefs = {},
    documentRef = null,
    el = () => null,
    formatHintUnlockCopy = () => ({ message: '' }),
    formatSafeDefaultGradeBand = 'K-2',
    getFocusLabel = (value) => String(value || ''),
    getGameState = () => ({}),
    getLessonPackDefinition = () => ({ label: 'Curriculum' }),
    getLessonTarget = () => null,
    getPlayableStyle = () => 'detective',
    getPrefState = () => ({}),
    getQuestFilterGradeBand = () => 'all',
    getRevealFocusMode = () => 'on',
    hintModeGetter = () => 'on',
    isAssessmentRoundLocked = () => false,
    lessonPackApplyingGetter = () => false,
    normalizeLessonPackId = (value) => String(value || 'custom'),
    normalizeLessonTargetId = (_pack, value) => String(value || 'custom'),
    refreshBoardForLengthChange = () => false,
    setHoverNoteForElement = () => {},
    setPref = () => {},
    showToast = () => {},
    syncHintToggleUI = () => {},
    syncPlayStyleToggleUI = () => {},
    WQUI = null,
    wqGame = null,
    chunkTabFocusKeys = new Set(),
    curriculumPackOrder = Object.freeze([]),
    subjectFocusGrade = Object.freeze({})
  } = deps || {};

  function resolveValue(value, fallback) {
    if (typeof value === 'function') {
      try {
        const resolved = value();
        return resolved == null ? fallback : resolved;
      } catch {
        return fallback;
      }
    }
    return value == null ? fallback : value;
  }

  function resolveChunkTabFocusKeys() {
    const raw = resolveValue(chunkTabFocusKeys, new Set());
    return raw instanceof Set ? raw : new Set(Array.isArray(raw) ? raw : []);
  }

  function resolveCurriculumPackOrder() {
    const raw = resolveValue(curriculumPackOrder, Object.freeze([]));
    return Array.isArray(raw) ? raw : [];
  }

  function resolveSubjectFocusGrade() {
    const raw = resolveValue(subjectFocusGrade, Object.freeze({}));
    return raw && typeof raw === 'object' ? raw : {};
  }

  const FOCUS_LENGTH_BY_VALUE = Object.freeze({
    all: '5',
    cvc: '3',
    digraph: '4',
    ccvc: '4',
    cvcc: '4',
    trigraph: '5',
    cvce: '4',
    vowel_team: '5',
    r_controlled: '5',
    diphthong: '5',
    floss: '4',
    welded: '5',
    schwa: '6',
    prefix: '6',
    suffix: '6',
    compound: '7',
    multisyllable: '7'
  });
  const QUEST_FILTER_GRADE_ORDER = Object.freeze(['K-2', 'G3-5', 'G6-8', 'G9-12']);
  const FOCUS_SUGGESTED_GRADE_BAND = Object.freeze({
    cvc: 'K-2',
    digraph: 'K-2',
    ccvc: 'K-2',
    cvcc: 'K-2',
    cvce: 'K-2',
    floss: 'K-2',
    welded: 'K-2',
    trigraph: 'G3-5',
    vowel_team: 'G3-5',
    r_controlled: 'G3-5',
    diphthong: 'G3-5',
    schwa: 'G3-5',
    prefix: 'G3-5',
    suffix: 'G3-5',
    compound: 'G3-5',
    multisyllable: 'G3-5'
  });

  function parseFocusPreset(value) {
    const focus = String(value || 'all').trim().toLowerCase();
    if (!focus || focus === 'all') return { kind: 'classic', focus: 'all' };
    const match = focus.match(/^vocab-(math|science|social|ela)-(k2|35|68|912)$/);
    if (match) {
      const [, subject, band] = match;
      const gradeMap = resolveSubjectFocusGrade();
      return { kind: 'subject', focus, subject, band, gradeBand: gradeMap[band] || 'all' };
    }
    return { kind: 'phonics', focus };
  }

  function getRecommendedLengthForFocus(focusValue) {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') return '';
    if (preset.kind === 'classic') return FOCUS_LENGTH_BY_VALUE.all;
    return FOCUS_LENGTH_BY_VALUE[preset.focus] || defaultPrefs.length;
  }

  function syncLengthFromFocus(focusValue, options = {}) {
    if (lessonPackApplyingGetter()) return false;
    const lengthSelect = el('s-length');
    if (!lengthSelect) return false;
    const recommended = getRecommendedLengthForFocus(focusValue);
    if (!recommended) return false;
    if (String(lengthSelect.value || '').trim() === recommended) return false;
    lengthSelect.value = recommended;
    setPref('length', recommended);
    refreshBoardForLengthChange();
    if (!options.silent) showToast(`Word length synced to ${recommended} letters for this quest.`);
    return true;
  }

  function getEffectiveGameplayGradeBand(selectedGradeBand, focusValue = 'all') {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject' && preset.gradeBand) return preset.gradeBand;
    const normalized = String(selectedGradeBand || 'all').trim().toLowerCase();
    return normalized === 'all' ? formatSafeDefaultGradeBand : String(selectedGradeBand || formatSafeDefaultGradeBand).trim();
  }

  function shouldExpandGradeBandForFocus(focusValue = 'all') {
    return parseFocusPreset(focusValue).kind === 'phonics';
  }

  function applyAllGradeLengthDefault(options = {}) {
    const prefs = getPrefState();
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') return false;
    const gradeValue = String(el('s-grade')?.value || prefs.grade || defaultPrefs.grade).trim().toLowerCase();
    if (gradeValue !== 'all') return false;
    const defaultLength = getRecommendedLengthForFocus(focusValue) || defaultPrefs.length;
    const lengthSelect = el('s-length');
    if (!lengthSelect) return false;
    if (String(lengthSelect.value || '').trim() === defaultLength) return false;
    lengthSelect.value = defaultLength;
    setPref('length', defaultLength);
    if (options.toast) showToast(`All grades mode defaults to ${defaultLength}-letter words for this quest.`);
    return true;
  }

  function enforceClassicFiveLetterDefault(options = {}) {
    const prefs = getPrefState();
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    if (parseFocusPreset(focusValue).kind !== 'classic') return false;
    const lengthSelect = el('s-length');
    if (!lengthSelect) return false;
    if (String(lengthSelect.value || '').trim() === '5') return false;
    lengthSelect.value = '5';
    setPref('length', '5');
    if (options.toast) showToast('Classic mode reset to 5-letter words.');
    return true;
  }

  function formatGradeBandLabel(value) {
    const normalized = String(value || 'all').toLowerCase();
    if (normalized === 'k-2') return 'K-2';
    if (normalized === 'g3-5') return '3-5';
    if (normalized === 'g6-8') return '6-8';
    if (normalized === 'g9-12') return '9-12';
    return `All (${formatSafeDefaultGradeBand} safe)`;
  }

  function formatGradeBandInlineLabel(value) {
    return String(value || 'all').toLowerCase() === 'all' ? `All (${formatSafeDefaultGradeBand} safe)` : formatGradeBandLabel(value);
  }

  function syncGradeFromFocus(focusValue, options = {}) {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind !== 'subject') return;
    const gradeSelect = el('s-grade');
    if (!gradeSelect || !preset.gradeBand) return;
    if (gradeSelect.value !== preset.gradeBand) {
      gradeSelect.value = preset.gradeBand;
      setPref('grade', preset.gradeBand);
      if (!options.silent) showToast(`Grade synced to ${formatGradeBandLabel(preset.gradeBand)} for this quest.`);
    }
  }

  function updateFocusHint() {
    syncHintToggleUI(hintModeGetter());
  }

  function syncChunkTabsVisibility() {
    const prefs = getPrefState();
    const layout = documentRef.documentElement.getAttribute('data-keyboard-layout') || 'standard';
    const mode = applyChunkTabsMode(el('s-chunk-tabs')?.value || prefs.chunkTabs || defaultPrefs.chunkTabs);
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const relevantFocus = preset.kind === 'phonics' && resolveChunkTabFocusKeys().has(preset.focus);
    let shouldShow = false;
    if (layout === 'wilson') {
      if (mode === 'on') shouldShow = true;
      else if (mode === 'auto') shouldShow = relevantFocus;
    }
    documentRef.documentElement.setAttribute('data-chunk-tabs', shouldShow ? 'on' : 'off');
    const state = wqGame?.getState?.();
    if (state?.wordLength && state?.maxGuesses && typeof WQUI?.calcLayout === 'function') WQUI.calcLayout(state.wordLength, state.maxGuesses);
  }

  function updateFocusGradeNote() {
    const prefs = getPrefState();
    const note = el('focus-grade-note');
    if (!note) return;
    const focusVal = el('setting-focus')?.value || 'all';
    const gradeVal = el('s-grade')?.value || 'all';
    const gradeLabel = formatGradeBandLabel(gradeVal);
    const preset = parseFocusPreset(focusVal);
    if (preset.kind === 'classic') {
      note.textContent = `Word Safety filters age-appropriate words. Word Length separately controls letters (default 5). Current safety band: ${gradeLabel}.`;
      return;
    }
    if (preset.kind === 'subject') {
      note.textContent = `Subject focus keeps vocabulary on-level by auto-aligning grade to ${formatGradeBandLabel(preset.gradeBand)}.`;
      return;
    }
    note.textContent = `Phonics focus trains sound patterns. Word Safety (${gradeLabel}) controls age-appropriate vocabulary, while Word Length controls letters.`;
  }

  function getFocusDisplayLabel(value, fallback = '') {
    const labels = Object.freeze({
      all: 'Classic Word Puzzle (5x6)',
      cvc: 'CVC (Short Vowels)',
      digraph: 'Digraphs',
      ccvc: 'Initial Blends (CCVC)',
      cvcc: 'Final Blends (CVCC)',
      trigraph: 'Trigraphs',
      cvce: 'CVCe (Magic E)',
      vowel_team: 'Vowel Teams',
      r_controlled: 'R-Controlled Vowels',
      diphthong: 'Diphthongs',
      floss: 'FLOSS Rule',
      welded: 'Welded Sounds',
      schwa: 'Schwa',
      prefix: 'Prefixes',
      suffix: 'Suffixes',
      compound: 'Compound Words',
      multisyllable: 'Multisyllabic Words'
    });
    return labels[value] || String(fallback || value || '').trim();
  }

  function getFocusDisplayGroup(value, fallbackGroup = '') {
    const groups = Object.freeze({
      all: 'Classic',
      cvc: 'Phonics',
      digraph: 'Phonics',
      ccvc: 'Phonics',
      cvcc: 'Phonics',
      trigraph: 'Phonics',
      cvce: 'Phonics',
      vowel_team: 'Phonics',
      r_controlled: 'Phonics',
      diphthong: 'Phonics',
      floss: 'Phonics',
      welded: 'Phonics',
      schwa: 'Phonics',
      prefix: 'Word Study',
      suffix: 'Word Study',
      compound: 'Word Study',
      multisyllable: 'Word Study'
    });
    if (groups[value]) return groups[value];
    if (String(value || '').startsWith('vocab-')) return 'Subjects';
    return String(fallbackGroup || 'General').trim() || 'General';
  }

  function normalizeQuestGradeBand(value) {
    const raw = String(value || 'all').trim();
    if (!raw) return 'all';
    const normalized = raw.toLowerCase();
    if (normalized === 'all') return 'all';
    if (normalized === 'k-2' || normalized === 'k2') return 'K-2';
    if (normalized === 'g3-5' || normalized === '3-5') return 'G3-5';
    if (normalized === 'g6-8' || normalized === '6-8') return 'G6-8';
    if (normalized === 'g9-12' || normalized === '9-12') return 'G9-12';
    return 'all';
  }

  function isEntryGradeBandCompatible(selectedGradeBand, entryGradeBand) {
    const selected = normalizeQuestGradeBand(selectedGradeBand);
    if (selected === 'all') return true;
    const selectedRank = QUEST_FILTER_GRADE_ORDER.indexOf(selected);
    if (selectedRank < 0) return true;
    const entry = normalizeQuestGradeBand(entryGradeBand);
    if (entry === 'all') return true;
    const entryRank = QUEST_FILTER_GRADE_ORDER.indexOf(entry);
    if (entryRank < 0) return true;
    return entryRank <= selectedRank;
  }

  function getFocusSuggestedGradeBand(value) {
    const preset = parseFocusPreset(value);
    if (preset.kind === 'subject') return preset.gradeBand || '';
    if (preset.kind === 'classic') return '';
    return FOCUS_SUGGESTED_GRADE_BAND[preset.focus] || '';
  }

  function isFocusValueCompatibleWithGrade(value, selectedGradeBand = getQuestFilterGradeBand()) {
    return isEntryGradeBandCompatible(selectedGradeBand, getFocusSuggestedGradeBand(value));
  }

  function getCurriculumTargetsForGrade(packId, selectedGradeBand = getQuestFilterGradeBand(), options = {}) {
    const pack = getLessonPackDefinition(packId);
    if (!pack || !Array.isArray(pack.targets)) return [];
    const gradeFiltered = options.matchSelectedGrade === true;
    return pack.targets.filter((target) => target?.id && (!gradeFiltered || isEntryGradeBandCompatible(selectedGradeBand, target.gradeBand)));
  }

  function getFocusEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    const select = el('setting-focus');
    if (!select) return [];
    return Array.from(select.options)
      .filter((option) => option.value && !option.disabled)
      .map((option) => {
        const value = String(option.value || '').trim();
        const parent = option.parentElement;
        const rawGroup = parent && parent.tagName === 'OPTGROUP' ? String(parent.label || '').trim() : 'General';
        return { value, label: getFocusDisplayLabel(value, option.textContent || value), group: getFocusDisplayGroup(value, rawGroup), kind: 'focus', gradeBand: getFocusSuggestedGradeBand(value), questValue: `focus::${value}` };
      })
      .filter((entry) => isFocusValueCompatibleWithGrade(entry.value, selectedGradeBand));
  }

  function getCurriculumProgramEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    return resolveCurriculumPackOrder().map((packId) => {
      const pack = getLessonPackDefinition(packId);
      const visibleTargets = getCurriculumTargetsForGrade(packId, selectedGradeBand, { matchSelectedGrade: false });
      if (!visibleTargets.length) return null;
      return { value: `curriculum-pack::${packId}`, label: pack.label, group: 'Curriculum', kind: 'curriculum-pack', packId, lessonCount: visibleTargets.length, gradeBand: selectedGradeBand, targetId: 'custom', questValue: `curriculum-pack::${packId}` };
    }).filter(Boolean);
  }

  function getCurriculumQuestEntries(packFilter = '', selectedGradeBand = getQuestFilterGradeBand()) {
    const normalizedFilter = normalizeLessonPackId(packFilter);
    const useFilter = normalizedFilter !== 'custom' && normalizedFilter.length > 0;
    const entries = [];
    resolveCurriculumPackOrder().forEach((packId) => {
      if (useFilter && packId !== normalizedFilter) return;
      const pack = getLessonPackDefinition(packId);
      getCurriculumTargetsForGrade(packId, selectedGradeBand, { matchSelectedGrade: false }).forEach((target) => {
        entries.push({ value: `curriculum::${packId}::${target.id}`, label: target.label, group: pack.label, kind: 'curriculum', packId, gradeBand: target.gradeBand, targetId: target.id, questValue: `curriculum::${packId}::${target.id}` });
      });
    });
    return entries;
  }

  function getQuestEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    return [...getFocusEntries(selectedGradeBand), ...getCurriculumProgramEntries(selectedGradeBand), ...getCurriculumQuestEntries('', selectedGradeBand)];
  }

  function clearPinnedFocusSearchValue(inputEl) {
    if (!inputEl) return;
    const raw = String(inputEl.value || '').trim();
    if (!raw) return;
    const lockedLabel = String(inputEl.dataset.lockedLabel || '').trim().toLowerCase();
    if (lockedLabel && raw.toLowerCase() === lockedLabel) inputEl.value = '';
  }

  function updateFocusSummaryLabel() {
    const prefs = getPrefState();
    const inputEl = el('focus-inline-search');
    const focusValue = el('setting-focus')?.value || 'all';
    const activePack = normalizeLessonPackId(prefs.lessonPack || el('s-lesson-pack')?.value || defaultPrefs.lessonPack);
    const activeTarget = normalizeLessonTargetId(activePack, prefs.lessonTarget || el('s-lesson-target')?.value || defaultPrefs.lessonTarget);
    const target = activePack !== 'custom' ? getLessonTarget(activePack, activeTarget) : null;
    const currentLabelRaw = target ? `${getLessonPackDefinition(activePack).label} · ${target.label}` : getFocusLabel(focusValue).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    const currentLabel = currentLabelRaw || 'Classic (Wordle 5x6)';
    if (!inputEl) return;
    inputEl.value = '';
    delete inputEl.dataset.lockedLabel;
    inputEl.placeholder = currentLabel;
    inputEl.setAttribute('aria-label', `Quest picker. Current selection: ${currentLabel}`);
    inputEl.setAttribute('title', `Current quest: ${currentLabel}. Click to switch.`);
  }

  function updateActiveGradeLockChip(gradeLabel, fromSubjectPreset) {
    const chipEl = el('active-grade-lock-chip');
    if (!chipEl) return;
    const sourceLabel = fromSubjectPreset ? 'subject preset' : 'teacher/session grade';
    chipEl.textContent = `Active Grade Band locked: ${gradeLabel}`;
    chipEl.setAttribute('title', `New rounds use ${gradeLabel} from ${sourceLabel}.`);
  }

  function updateGradeTargetInline() {
    const prefs = getPrefState();
    const gradeEl = el('grade-target-inline');
    const focusValue = el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const activeGrade = preset.kind === 'subject' ? preset.gradeBand : (el('s-grade')?.value || prefs.grade || defaultPrefs.grade);
    const inlineLabel = formatGradeBandInlineLabel(activeGrade);
    const titleLabel = formatGradeBandLabel(activeGrade);
    if (gradeEl) {
      const normalizedGrade = String(activeGrade || 'all').toLowerCase();
      const safeDefaultGrade = String(formatSafeDefaultGradeBand || 'k-2').toLowerCase();
      const isDefaultSafeBand = normalizedGrade === 'all' || normalizedGrade === safeDefaultGrade;
      gradeEl.textContent = isDefaultSafeBand ? '' : `Grade ${inlineLabel}`;
      gradeEl.classList.toggle('is-subtle-hidden', isDefaultSafeBand);
      gradeEl.setAttribute('aria-hidden', isDefaultSafeBand ? 'true' : 'false');
      gradeEl.setAttribute('title', preset.kind === 'subject' ? `Grade band currently follows the selected subject focus: ${titleLabel}.` : `Grade band in use: ${titleLabel}. This filters age-appropriate words; word length is controlled separately.`);
    }
    updateActiveGradeLockChip(titleLabel, preset.kind === 'subject');
    syncQuickSetupControls();
    syncPlayStyleToggleUI();
  }

  function syncPlayHeaderCopy() {
    const prefs = getPrefState();
    const homeBtn = el('home-logo-btn');
    const galleryBtn = el('my-activities-btn');
    const nextBtn = el('new-game-btn');
    const focusBtn = el('focus-help-btn');
    const focusInput = el('focus-inline-search');
    if (homeBtn) {
      homeBtn.setAttribute('title', 'Back to Cornerstone home');
      homeBtn.setAttribute('aria-label', 'Back to Cornerstone home');
    }
    if (galleryBtn) {
      galleryBtn.setAttribute('title', 'All games');
      galleryBtn.setAttribute('aria-label', 'Open all games');
      setHoverNoteForElement(galleryBtn, 'Back to all games');
    }
    if (nextBtn) {
      nextBtn.setAttribute('title', 'Start a fresh word');
      setHoverNoteForElement(nextBtn, 'Start a fresh word');
    }
    if (focusBtn) {
      const playStyle = getPlayableStyle();
      const state = getGameState();
      const unlockCopy = formatHintUnlockCopy(playStyle, Array.isArray(state.guesses) ? state.guesses.length : 0);
      const supportTitle = focusBtn.disabled ? (unlockCopy.message || 'Help options unlock after a miss.') : 'Open quest supports';
      focusBtn.setAttribute('title', supportTitle);
      setHoverNoteForElement(focusBtn, supportTitle);
    }
    if (focusInput) setHoverNoteForElement(focusInput, 'Open the quest picker');
  }

  function syncQuickSetupControls() {
    syncPlayStyleToggleUI();
  }

  return Object.freeze({
    applyAllGradeLengthDefault,
    clearPinnedFocusSearchValue,
    enforceClassicFiveLetterDefault,
    formatGradeBandInlineLabel,
    formatGradeBandLabel,
    getCurriculumProgramEntries,
    getCurriculumQuestEntries,
    getCurriculumTargetsForGrade,
    getEffectiveGameplayGradeBand,
    getFocusDisplayGroup,
    getFocusDisplayLabel,
    getFocusEntries,
    getFocusSuggestedGradeBand,
    getQuestEntries,
    getRecommendedLengthForFocus,
    isEntryGradeBandCompatible,
    isFocusValueCompatibleWithGrade,
    normalizeQuestGradeBand,
    parseFocusPreset,
    shouldExpandGradeBandForFocus,
    syncChunkTabsVisibility,
    syncGradeFromFocus,
    syncLengthFromFocus,
    syncPlayHeaderCopy,
    syncQuickSetupControls,
    updateFocusGradeNote,
    updateFocusHint,
    updateFocusSummaryLabel,
    updateGradeTargetInline
  });
}

window.createFocusGradeRuntimeModule = createFocusGradeRuntimeModule;
