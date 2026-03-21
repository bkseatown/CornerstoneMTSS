/**
 * app-focus-curriculum-runtime.js
 * Lesson-pack, pacing, and curriculum-target runtime helpers.
 */

function getCurriculumLengthForFocusHelper(focusValue, fallback = 'any') {
  const normalizedFocus = String(focusValue || '').trim().toLowerCase();
  if (normalizedFocus === 'cvc') return '3';
  return String(fallback || 'any').trim() || 'any';
}

function normalizeCurriculumTargetHelper(rawTarget) {
  if (!rawTarget || typeof rawTarget !== 'object') return null;
  const id = String(rawTarget.id || '').trim();
  const label = String(rawTarget.label || '').trim();
  if (!id || !label) return null;
  const focus = String(rawTarget.focus || 'cvc').trim();
  const rawLength = String(rawTarget.length || 'any').trim();
  return Object.freeze({
    id,
    label,
    focus,
    gradeBand: String(rawTarget.gradeBand || 'K-2').trim(),
    length: getCurriculumLengthForFocusHelper(focus, rawLength),
    pacing: String(rawTarget.pacing || '').trim()
  });
}

function getMappedCurriculumTargetsHelper(packId, taxonomy = window.WQCurriculumTaxonomy) {
  const table = taxonomy;
  if (!table || typeof table !== 'object') return [];
  const rows = table[packId];
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map((row) => normalizeCurriculumTargetHelper(row)).filter(Boolean);
}

function resolveUfliLessonMetaHelper(lessonNumber) {
  if (lessonNumber <= 8) return { focus: 'cvc', gradeBand: 'K-2', length: '3' };
  if (lessonNumber <= 24) return { focus: 'digraph', gradeBand: 'K-2', length: '4' };
  if (lessonNumber <= 34) return { focus: 'cvce', gradeBand: 'K-2', length: '4' };
  if (lessonNumber <= 52) return { focus: 'vowel_team', gradeBand: 'K-2', length: '5' };
  if (lessonNumber <= 64) return { focus: 'r_controlled', gradeBand: 'K-2', length: '5' };
  if (lessonNumber <= 80) return { focus: 'welded', gradeBand: 'G3-5', length: '6' };
  if (lessonNumber <= 104) return { focus: 'multisyllable', gradeBand: 'G3-5', length: '6' };
  return { focus: 'suffix', gradeBand: 'G3-5', length: '6' };
}

function buildUfliLessonTargetsHelper(taxonomy = window.WQCurriculumTaxonomy) {
  const mapped = getMappedCurriculumTargetsHelper('ufli', taxonomy);
  if (mapped.length) return Object.freeze(mapped);
  const targets = [];
  for (let lesson = 1; lesson <= 128; lesson += 1) {
    const meta = resolveUfliLessonMetaHelper(lesson);
    targets.push(Object.freeze({
      id: `ufli-lesson-${lesson}`,
      label: `UFLI Lesson ${lesson}`,
      focus: meta.focus,
      gradeBand: meta.gradeBand,
      length: meta.length,
      pacing: `Lesson ${lesson}`
    }));
  }
  return Object.freeze(targets);
}

function buildFundationsLessonTargetsHelper(taxonomy = window.WQCurriculumTaxonomy) {
  const mapped = getMappedCurriculumTargetsHelper('fundations', taxonomy);
  if (mapped.length) return Object.freeze(mapped);
  const byLevel = Object.freeze([
    Object.freeze({ level: 1, units: 14 }),
    Object.freeze({ level: 2, units: 17 }),
    Object.freeze({ level: 3, units: 16 })
  ]);
  const targets = [];
  byLevel.forEach((row) => {
    for (let unit = 1; unit <= row.units; unit += 1) {
      targets.push(Object.freeze({
        id: `fundations-l${row.level}-u${unit}`,
        label: `Fundations Level ${row.level} Unit ${unit}`,
        focus: 'structured_literacy',
        gradeBand: row.level <= 1 ? 'K-2' : 'G3-5',
        length: row.level <= 1 ? '4' : '6',
        pacing: `Level ${row.level} · Unit ${unit}`
      }));
    }
  });
  return Object.freeze(targets);
}

function buildWilsonLessonTargetsHelper(taxonomy = window.WQCurriculumTaxonomy) {
  const mapped = getMappedCurriculumTargetsHelper('wilson', taxonomy);
  if (mapped.length) return Object.freeze(mapped);
  const targets = [];
  for (let step = 1; step <= 12; step += 1) {
    const gradeBand = step <= 9 ? 'G3-5' : 'G6-8';
    const length = step <= 9 ? '6' : '7';
    targets.push(Object.freeze({
      id: `wilson-step-${step}`,
      label: `Wilson Reading System Step ${step}`,
      focus: 'structured_literacy',
      gradeBand,
      length,
      pacing: `Step ${step}`
    }));
  }
  return Object.freeze(targets);
}

function buildLexiaWidaLessonTargetsHelper(taxonomy = window.WQCurriculumTaxonomy) {
  const mapped = getMappedCurriculumTargetsHelper('lexiawida', taxonomy);
  if (mapped.length) return Object.freeze(mapped);
  return Object.freeze([
    Object.freeze({ id: 'lexia-wida-entering-k2', label: 'Lexia English WIDA Entering (1) · Grade K-2 · Lessons 1-2', focus: 'cvc', gradeBand: 'K-2', length: '3', pacing: 'Entering 1 · K-2' }),
    Object.freeze({ id: 'lexia-wida-entering-36', label: 'Lexia English WIDA Entering (1) · Grades 3-6 · Lessons 1-3', focus: 'multisyllable', gradeBand: 'G3-5', length: '5', pacing: 'Entering 1 · Grades 3-6' })
  ]);
}

window.WQFocusCurriculumHelpers = Object.freeze({
  buildFundationsLessonTargets: buildFundationsLessonTargetsHelper,
  buildLexiaWidaLessonTargets: buildLexiaWidaLessonTargetsHelper,
  buildUfliLessonTargets: buildUfliLessonTargetsHelper,
  buildWilsonLessonTargets: buildWilsonLessonTargetsHelper,
  getCurriculumLengthForFocus: getCurriculumLengthForFocusHelper,
  getMappedCurriculumTargets: getMappedCurriculumTargetsHelper,
  normalizeCurriculumTarget: normalizeCurriculumTargetHelper,
  resolveUfliLessonMeta: resolveUfliLessonMetaHelper
});

function createFocusCurriculumRuntimeModule(deps) {
  const {
    curriculumLessonPacks = {},
    defaultPrefs = { lessonPack: 'custom', lessonTarget: 'custom' },
    documentRef = null,
    el = () => null,
    emitTelemetry = () => {},
    formatGradeBandLabel = (value) => String(value || ''),
    getCurriculumLengthForFocus = (_focus, fallback) => String(fallback || ''),
    getFocusLabel = (value) => String(value || ''),
    getLessonPackApplying = () => false,
    prefs = {},
    refreshBoardForLengthChange = () => false,
    refreshStandaloneMissionLabHub = () => {},
    setLessonPackApplying = () => {},
    setPref = () => {},
    updateFocusGradeNote = () => {},
    updateFocusSummaryLabel = () => {},
    updateGradeTargetInline = () => {},
    WQUI = null
  } = deps || {};

  function resolveCurriculumLessonPacks() {
    return typeof curriculumLessonPacks === 'function' ? (curriculumLessonPacks() || {}) : curriculumLessonPacks;
  }

  function getLessonPackSelectElements() {
    return [el('s-lesson-pack')].filter(Boolean);
  }

  function getLessonTargetSelectElements() {
    return [el('s-lesson-target')].filter(Boolean);
  }

  function getLessonPackDefinition(packId) {
    const lessonPacks = resolveCurriculumLessonPacks();
    const normalized = String(packId || '').trim().toLowerCase();
    return lessonPacks[normalized] || lessonPacks.custom;
  }

  function normalizeLessonPackId(packId) {
    const lessonPacks = resolveCurriculumLessonPacks();
    const normalized = String(packId || '').trim().toLowerCase();
    return lessonPacks[normalized] ? normalized : 'custom';
  }

  function normalizeLessonTargetId(packId, targetId) {
    const normalizedPack = normalizeLessonPackId(packId);
    if (normalizedPack === 'custom') return 'custom';
    const normalizedTarget = String(targetId || '').trim().toLowerCase();
    if (!normalizedTarget || normalizedTarget === 'custom') return 'custom';
    const pack = getLessonPackDefinition(normalizedPack);
    const exists = pack.targets.some((target) => target.id === normalizedTarget);
    return exists ? normalizedTarget : 'custom';
  }

  function getLessonTarget(packId, targetId) {
    const normalizedPack = normalizeLessonPackId(packId);
    if (normalizedPack === 'custom') return null;
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    if (normalizedTarget === 'custom') return null;
    const pack = getLessonPackDefinition(normalizedPack);
    return pack.targets.find((target) => target.id === normalizedTarget) || null;
  }

  function formatLengthPrefLabel(value) {
    if (String(value || '').toLowerCase() === 'any') return 'Any length';
    return `${value}-letter`;
  }

  function stripPacingMonthWindow(pacingLabel) {
    const text = String(pacingLabel || '').trim();
    if (!text) return '';
    return text.replace(/\s*\((?:aug|sep|oct|nov|dec|jan|feb|mar|apr|may|jun|jul)[^)]+\)\s*$/i, '').replace(/\s+/g, ' ').trim();
  }

  function formatLessonTargetPacing(target, options = {}) {
    const pacingRaw = String(target?.pacing || '').trim();
    if (!pacingRaw) return 'Flexible schedule';
    if (options.includeMonthWindow) return pacingRaw;
    const stripped = stripPacingMonthWindow(pacingRaw);
    return stripped || pacingRaw;
  }

  function formatLessonTargetOptionLabel(target) {
    if (!target) return '';
    return String(target.label || '').trim();
  }

  function parsePacingWeekRange(pacingLabel) {
    const text = String(pacingLabel || '').trim();
    const match = text.match(/weeks?\s+(\d+)\s*(?:-\s*(\d+)|(\+))?/i);
    if (!match) return null;
    const start = Math.max(1, Math.floor(Number(match[1]) || 1));
    if (match[3]) return { start, end: 60, raw: text };
    const end = match[2] ? Math.max(start, Math.floor(Number(match[2]) || start)) : start;
    return { start, end, raw: text };
  }

  function getSchoolYearStartDate() {
    const now = new Date();
    const year = now.getFullYear();
    const startYear = now.getMonth() >= 7 ? year : year - 1;
    return new Date(startYear, 8, 1);
  }

  function getCurrentSchoolWeek() {
    const now = new Date();
    const start = getSchoolYearStartDate();
    const dayMs = 24 * 60 * 60 * 1000;
    const nowFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startFloor = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const dayDiff = Math.floor((nowFloor - startFloor) / dayMs);
    if (dayDiff <= 0) return 1;
    return Math.max(1, Math.floor(dayDiff / 7) + 1);
  }

  function getCurrentWeekRecommendedLessonTarget(packId) {
    const normalizedPack = normalizeLessonPackId(packId);
    if (normalizedPack === 'custom') return null;
    const pack = getLessonPackDefinition(normalizedPack);
    const week = getCurrentSchoolWeek();
    const scored = pack.targets.map((target) => {
      const range = parsePacingWeekRange(target.pacing);
      if (!range) return null;
      const inRange = week >= range.start && week <= range.end;
      const distance = inRange ? 0 : week < range.start ? range.start - week : week - range.end;
      return { target, range, inRange, distance };
    }).filter(Boolean).sort((a, b) => (a.distance - b.distance) || (a.range.start - b.range.start));
    return scored[0] || null;
  }

  function resolveDefaultLessonTargetId(packId) {
    const normalizedPack = normalizeLessonPackId(packId);
    if (normalizedPack === 'custom') return 'custom';
    const recommended = getCurrentWeekRecommendedLessonTarget(normalizedPack);
    const recommendedId = recommended?.target?.id || '';
    if (recommendedId) return normalizeLessonTargetId(normalizedPack, recommendedId);
    const pack = getLessonPackDefinition(normalizedPack);
    const firstId = pack.targets?.[0]?.id || 'custom';
    return normalizeLessonTargetId(normalizedPack, firstId);
  }

  function populateLessonTargetSelect(packId, preferredTarget = 'custom') {
    const targetSelects = getLessonTargetSelectElements();
    if (!targetSelects.length) return 'custom';
    const pack = getLessonPackDefinition(packId);
    const normalizedPack = normalizeLessonPackId(packId);
    const options = [];
    if (normalizedPack === 'custom') {
      options.push({ value: 'custom', label: 'Manual' });
    } else {
      const recommended = getCurrentWeekRecommendedLessonTarget(normalizedPack);
      const recommendedId = recommended?.target?.id || '';
      options.push({ value: 'custom', label: 'Select a lesson target' });
      pack.targets.forEach((target) => {
        const prefix = target.id === recommendedId ? '★ ' : '';
        options.push({ value: target.id, label: `${prefix}${formatLessonTargetOptionLabel(target)}` });
      });
    }
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, preferredTarget);
    targetSelects.forEach((targetSelect) => {
      targetSelect.innerHTML = '';
      options.forEach((option) => {
        const node = documentRef.createElement('option');
        node.value = option.value;
        node.textContent = option.label;
        targetSelect.appendChild(node);
      });
      targetSelect.value = normalizedTarget;
    });
    return normalizedTarget;
  }

  function setLessonPackPrefs(packId, targetId) {
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    setPref('lessonPack', normalizedPack);
    setPref('lessonTarget', normalizedTarget);
    return { packId: normalizedPack, targetId: normalizedTarget };
  }

  function updateLessonPackWeekRecommendation(packId, targetId) {
    const weekEl = el('lesson-pack-week');
    const applyBtn = el('lesson-pack-apply-week-btn');
    if (!weekEl && !applyBtn) return;
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    if (normalizedPack === 'custom') {
      if (weekEl) {
        weekEl.textContent = 'School week recommendation: choose a program to view suggested pacing target.';
        weekEl.setAttribute('title', weekEl.textContent);
      }
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.removeAttribute('data-pack-id');
        applyBtn.removeAttribute('data-target-id');
      }
      return;
    }
    const schoolWeek = getCurrentSchoolWeek();
    const recommendation = getCurrentWeekRecommendedLessonTarget(normalizedPack);
    if (!recommendation || !recommendation.target) {
      if (weekEl) {
        weekEl.textContent = `School week ${schoolWeek}: pacing map not available for this pack.`;
        weekEl.setAttribute('title', weekEl.textContent);
      }
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.removeAttribute('data-pack-id');
        applyBtn.removeAttribute('data-target-id');
      }
      return;
    }
    const recommendedTarget = recommendation.target;
    const isCurrentTarget = normalizedTarget === recommendedTarget.id;
    const pacing = formatLessonTargetPacing(recommendedTarget);
    const text = isCurrentTarget ? `School week ${schoolWeek}: on pace (${recommendedTarget.label}).` : `School week ${schoolWeek}: suggested target ${recommendedTarget.label} (${pacing}).`;
    if (weekEl) {
      weekEl.textContent = text;
      weekEl.setAttribute('title', text);
    }
    if (applyBtn) {
      applyBtn.disabled = isCurrentTarget;
      applyBtn.setAttribute('data-pack-id', normalizedPack);
      applyBtn.setAttribute('data-target-id', recommendedTarget.id);
    }
  }

  function updateLessonPackNote(packId, targetId) {
    const noteEls = [el('lesson-pack-note')].filter(Boolean);
    const pacingEls = [el('lesson-pack-pacing')].filter(Boolean);
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    updateLessonPackWeekRecommendation(normalizedPack, normalizedTarget);
    if (!noteEls.length && !pacingEls.length) return;
    if (normalizedPack === 'custom') {
      noteEls.forEach((node) => { node.textContent = 'Manual mode keeps Quest, Grade Band, and Word Length under your control.'; });
      pacingEls.forEach((node) => { node.textContent = 'District pacing: choose a program and lesson target to view suggested week range.'; });
      return;
    }
    const pack = getLessonPackDefinition(normalizedPack);
    const target = getLessonTarget(normalizedPack, normalizedTarget);
    if (!target) {
      noteEls.forEach((node) => { node.textContent = `${pack.label} selected. Pick a lesson target to auto-apply Quest focus, Grade Band, and suggested Word Length.`; });
      pacingEls.forEach((node) => { node.textContent = `${pack.label} pacing map loaded. Pick a lesson target to apply its week range.`; });
      return;
    }
    const focusLabel = getFocusLabel(target.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    noteEls.forEach((node) => { node.textContent = `${pack.label} · ${target.label}: Quest ${focusLabel}, Grade ${formatGradeBandLabel(target.gradeBand)}, ${formatLengthPrefLabel(target.length)}.`; });
    pacingEls.forEach((node) => { node.textContent = `District pacing: ${formatLessonTargetPacing(target)}.`; });
  }

  function syncLessonPackControlsFromPrefs(options = {}) {
    const packSelects = getLessonPackSelectElements();
    const targetSelects = getLessonTargetSelectElements();
    const firstPackSelect = packSelects[0] || null;
    const firstTargetSelect = targetSelects[0] || null;
    if (!firstPackSelect && !firstTargetSelect) return { packId: 'custom', targetId: 'custom' };
    const preferredPack = options.packId ?? prefs.lessonPack ?? firstPackSelect?.value ?? defaultPrefs.lessonPack;
    const preferredTarget = options.targetId ?? prefs.lessonTarget ?? firstTargetSelect?.value ?? defaultPrefs.lessonTarget;
    const packId = normalizeLessonPackId(preferredPack);
    packSelects.forEach((select) => { select.value = packId; });
    const targetId = populateLessonTargetSelect(packId, preferredTarget);
    setLessonPackPrefs(packId, targetId);
    updateLessonPackNote(packId, targetId);
    refreshStandaloneMissionLabHub();
    return { packId, targetId };
  }

  function applyLessonTargetConfig(packId, targetId, options = {}) {
    const target = getLessonTarget(packId, targetId);
    if (!target) return false;
    const pack = getLessonPackDefinition(packId);
    const focusSelect = el('setting-focus');
    const gradeSelect = el('s-grade');
    const lengthSelect = el('s-length');
    const desiredLength = getCurriculumLengthForFocus(target.focus, target.length);
    let lengthChanged = false;
    setLessonPackApplying(true);
    try {
      if (focusSelect) {
        const focusExists = Array.from(focusSelect.options).some((option) => option.value === target.focus);
        if (focusExists && focusSelect.value !== target.focus) {
          focusSelect.value = target.focus;
          focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      if (gradeSelect && gradeSelect.value !== target.gradeBand) {
        gradeSelect.value = target.gradeBand;
        setPref('grade', target.gradeBand);
      }
      if (lengthSelect && lengthSelect.value !== desiredLength) {
        lengthSelect.value = desiredLength;
        setPref('length', desiredLength);
        lengthChanged = true;
      }
    } finally {
      setLessonPackApplying(false);
    }
    if (lengthChanged) refreshBoardForLengthChange();
    updateFocusGradeNote();
    updateGradeTargetInline();
    updateFocusSummaryLabel();
    refreshStandaloneMissionLabHub();
    if (options.toast) WQUI?.showToast?.(`${pack.label}: ${target.label} applied (${formatLessonTargetPacing(target)}).`);
    emitTelemetry('wq_target_apply', {
      program_id: packId,
      program_label: pack?.label || packId,
      lesson_id: target.id,
      lesson_label: target.label,
      pacing_label: formatLessonTargetPacing(target),
      source: options.toast ? 'manual_apply' : 'auto_apply'
    });
    return true;
  }

  function releaseLessonPackToManualMode() {
    if (getLessonPackApplying()) return;
    const packSelects = getLessonPackSelectElements();
    const currentPack = normalizeLessonPackId(prefs.lessonPack || packSelects[0]?.value || defaultPrefs.lessonPack);
    const currentTarget = normalizeLessonTargetId(currentPack, prefs.lessonTarget || getLessonTargetSelectElements()[0]?.value || defaultPrefs.lessonTarget);
    if (currentPack === 'custom' && currentTarget === 'custom') return;
    setLessonPackApplying(true);
    try {
      packSelects.forEach((select) => { select.value = 'custom'; });
      populateLessonTargetSelect('custom', 'custom');
    } finally {
      setLessonPackApplying(false);
    }
    setLessonPackPrefs('custom', 'custom');
    updateLessonPackNote('custom', 'custom');
    refreshStandaloneMissionLabHub();
  }

  return Object.freeze({
    applyLessonTargetConfig,
    formatLengthPrefLabel,
    formatLessonTargetOptionLabel,
    formatLessonTargetPacing,
    getCurrentSchoolWeek,
    getCurrentWeekRecommendedLessonTarget,
    getLessonPackDefinition,
    getLessonPackSelectElements,
    getLessonTarget,
    getLessonTargetSelectElements,
    normalizeLessonPackId,
    normalizeLessonTargetId,
    parsePacingWeekRange,
    populateLessonTargetSelect,
    releaseLessonPackToManualMode,
    resolveDefaultLessonTargetId,
    setLessonPackPrefs,
    stripPacingMonthWindow,
    syncLessonPackControlsFromPrefs,
    updateLessonPackNote,
    updateLessonPackWeekRecommendation
  });
}

window.createFocusCurriculumRuntimeModule = createFocusCurriculumRuntimeModule;
