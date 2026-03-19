/**
 * app-focus.js
 * Curriculum, lesson packs, focus selection, grade alignment
 */

import { prefs, setPref, setHoverNoteForElement, emitTelemetry } from './app-prefs.js';
import { DEFAULT_PREFS } from './app-constants.js';
import { isAssessmentRoundLocked, normalizePlayStyle } from './app-theme.js';
import { closeQuickPopover } from './app-settings.js';
import { newGame } from './app-game.js';
import { refreshStandaloneMissionLabHub } from './app-audio.js';

// DOM helper
const _el = id => document.getElementById(id);

  // ─── Curriculum helpers (extracted from app.js) ─────────────────────

  function getCurriculumLengthForFocus(focusValue, fallback = 'any') {
    const normalizedFocus = String(focusValue || '').trim().toLowerCase();
    if (normalizedFocus === 'cvc') return '3';
    return String(fallback || 'any').trim() || 'any';
  }

  function normalizeCurriculumTarget(rawTarget) {
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
      length: getCurriculumLengthForFocus(focus, rawLength),
      pacing: String(rawTarget.pacing || '').trim()
    });
  }

  function getMappedCurriculumTargets(packId) {
    const table = window.WQCurriculumTaxonomy;
    if (!table || typeof table !== 'object') return [];
    const rows = table[packId];
    if (!Array.isArray(rows) || !rows.length) return [];
    return rows
      .map((row) => normalizeCurriculumTarget(row))
      .filter(Boolean);
  }

  function resolveUfliLessonMeta(lessonNumber) {
    if (lessonNumber <= 8) return { focus: 'cvc', gradeBand: 'K-2', length: '3' };
    if (lessonNumber <= 24) return { focus: 'digraph', gradeBand: 'K-2', length: '4' };
    if (lessonNumber <= 34) return { focus: 'cvce', gradeBand: 'K-2', length: '4' };
    if (lessonNumber <= 52) return { focus: 'vowel_team', gradeBand: 'K-2', length: '5' };
    if (lessonNumber <= 64) return { focus: 'r_controlled', gradeBand: 'K-2', length: '5' };
    if (lessonNumber <= 80) return { focus: 'welded', gradeBand: 'G3-5', length: '6' };
    if (lessonNumber <= 104) return { focus: 'multisyllable', gradeBand: 'G3-5', length: '6' };
    return { focus: 'suffix', gradeBand: 'G3-5', length: '6' };
  }

  function buildUfliLessonTargets() {
    const mapped = getMappedCurriculumTargets('ufli');
    if (mapped.length) return Object.freeze(mapped);
    const targets = [];
    for (let lesson = 1; lesson <= 128; lesson += 1) {
      const meta = resolveUfliLessonMeta(lesson);
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

  function buildFundationsLessonTargets() {
    const mapped = getMappedCurriculumTargets('fundations');
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

  function buildWilsonLessonTargets() {
    const mapped = getMappedCurriculumTargets('wilson');
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

  function buildLexiaWidaLessonTargets() {
    const mapped = getMappedCurriculumTargets('lexiawida');
    if (mapped.length) return Object.freeze(mapped);
    return Object.freeze([
      Object.freeze({ id: 'lexia-wida-entering-k2', label: 'Lexia English WIDA Entering (1) · Grade K-2 · Lessons 1-2', focus: 'cvc', gradeBand: 'K-2', length: '3', pacing: 'Entering 1 · K-2' }),
      Object.freeze({ id: 'lexia-wida-entering-36', label: 'Lexia English WIDA Entering (1) · Grades 3-6 · Lessons 1-3', focus: 'multisyllable', gradeBand: 'G3-5', length: '5', pacing: 'Entering 1 · Grades 3-6' })
    ]);
  }

  const CURRICULUM_LESSON_PACKS = Object.freeze({
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
  });
  const CURRICULUM_PACK_ORDER = Object.freeze(['ufli', 'fundations', 'wilson', 'lexiawida', 'justwords']);

  // ─── 6. Focus + grade alignment ─────────────────────

  const FOCUS_HINTS = {
    all: '',
    cvc:'CVC · short vowel',
    digraph:'Digraphs · sh, ch, th, wh',
    ccvc:'Initial blends · st, bl, tr…',
    cvcc:'Final blends · mp, nd, st…',
    trigraph:'Trigraphs · tch, dge, igh',
    cvce:'Magic E / Silent E',
    vowel_team:'Vowel teams · ai, ee, oa…',
    r_controlled:'R-controlled · ar, or, er…',
    diphthong:'Diphthongs · oi, oy, ou…',
    floss:'FLOSS · ff, ll, ss',
    welded:'Welded sounds · -ang, -ing…',
    schwa:'Schwa · unstressed vowel',
    prefix:'Prefixes · un-, re-, pre-…',
    suffix:'Suffixes · -ing, -ed, -er…',
    compound:'Compound words',
    multisyllable:'Multisyllabic words',
    'vocab-math-k2':'Math vocabulary · K-2',
    'vocab-math-35':'Math vocabulary · Grades 3-5',
    'vocab-math-68':'Math vocabulary · Grades 6-8',
    'vocab-math-912':'Math vocabulary · Grades 9-12',
    'vocab-science-k2':'Science vocabulary · K-2',
    'vocab-science-35':'Science vocabulary · Grades 3-5',
    'vocab-science-68':'Science vocabulary · Grades 6-8',
    'vocab-science-912':'Science vocabulary · Grades 9-12',
    'vocab-social-k2':'Social Studies vocabulary · K-2',
    'vocab-social-35':'Social Studies vocabulary · Grades 3-5',
    'vocab-social-68':'Social Studies vocabulary · Grades 6-8',
    'vocab-social-912':'Social Studies vocabulary · Grades 9-12',
    'vocab-ela-k2':'ELA vocabulary · K-2',
    'vocab-ela-35':'ELA vocabulary · Grades 3-5',
    'vocab-ela-68':'ELA vocabulary · Grades 6-8',
    'vocab-ela-912':'ELA vocabulary · Grades 9-12'
  };

  var lessonPackApplying = false;

  function getLessonPackSelectElements() {
    return [_el('s-lesson-pack')]
      .filter(Boolean);
  }

  function getLessonTargetSelectElements() {
    return [_el('s-lesson-target')]
      .filter(Boolean);
  }

  function getLessonPackDefinition(packId) {
    const normalized = String(packId || '').trim().toLowerCase();
    return CURRICULUM_LESSON_PACKS[normalized] || CURRICULUM_LESSON_PACKS.custom;
  }

  function normalizeLessonPackId(packId) {
    const normalized = String(packId || '').trim().toLowerCase();
    return CURRICULUM_LESSON_PACKS[normalized] ? normalized : 'custom';
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
    return text
      .replace(/\s*\((?:aug|sep|oct|nov|dec|jan|feb|mar|apr|may|jun|jul)[^)]+\)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
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
    if (match[3]) {
      return { start, end: 60, raw: text };
    }
    const end = match[2]
      ? Math.max(start, Math.floor(Number(match[2]) || start))
      : start;
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
    const scored = pack.targets
      .map((target) => {
        const range = parsePacingWeekRange(target.pacing);
        if (!range) return null;
        const inRange = week >= range.start && week <= range.end;
        const distance = inRange
          ? 0
          : week < range.start
            ? range.start - week
            : week - range.end;
        return { target, range, inRange, distance };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        if (a.range.start !== b.range.start) return a.range.start - b.range.start;
        return 0;
      });
    return scored[0] || null;
  }

  function resolveDefaultLessonTargetId(packId) {
    const normalizedPack = normalizeLessonPackId(packId);
    if (normalizedPack === 'custom') return 'custom';
    const recommended = getCurrentWeekRecommendedLessonTarget(normalizedPack);
    const recommendedId = recommended?.target?.id || '';
    if (recommendedId) {
      return normalizeLessonTargetId(normalizedPack, recommendedId);
    }
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
        const node = document.createElement('option');
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
    const weekEl = _el('lesson-pack-week');
    const applyBtn = _el('lesson-pack-apply-week-btn');
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
    const text = isCurrentTarget
      ? `School week ${schoolWeek}: on pace (${recommendedTarget.label}).`
      : `School week ${schoolWeek}: suggested target ${recommendedTarget.label} (${pacing}).`;
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
    const noteEls = [_el('lesson-pack-note')].filter(Boolean);
    const pacingEls = [_el('lesson-pack-pacing')].filter(Boolean);
    const normalizedPack = normalizeLessonPackId(packId);
    const normalizedTarget = normalizeLessonTargetId(normalizedPack, targetId);
    updateLessonPackWeekRecommendation(normalizedPack, normalizedTarget);
    if (!noteEls.length && !pacingEls.length) return;
    if (normalizedPack === 'custom') {
      noteEls.forEach((el) => {
        el.textContent = 'Manual mode keeps Quest, Grade Band, and Word Length under your control.';
      });
      pacingEls.forEach((el) => {
        el.textContent = 'District pacing: choose a program and lesson target to view suggested week range.';
      });
      return;
    }
    const pack = getLessonPackDefinition(normalizedPack);
    const target = getLessonTarget(normalizedPack, normalizedTarget);
    if (!target) {
      noteEls.forEach((el) => {
        el.textContent = `${pack.label} selected. Pick a lesson target to auto-apply Quest focus, Grade Band, and suggested Word Length.`;
      });
      pacingEls.forEach((el) => {
        el.textContent = `${pack.label} pacing map loaded. Pick a lesson target to apply its week range.`;
      });
      return;
    }
    const focusLabel = getFocusLabel(target.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    noteEls.forEach((el) => {
      el.textContent = `${pack.label} · ${target.label}: Quest ${focusLabel}, Grade ${formatGradeBandLabel(target.gradeBand)}, ${formatLengthPrefLabel(target.length)}.`;
    });
    pacingEls.forEach((el) => {
      el.textContent = `District pacing: ${formatLessonTargetPacing(target)}.`;
    });
  }

  function syncLessonPackControlsFromPrefs(options = {}) {
    const packSelects = getLessonPackSelectElements();
    const targetSelects = getLessonTargetSelectElements();
    const firstPackSelect = packSelects[0] || null;
    const firstTargetSelect = targetSelects[0] || null;
    if (!firstPackSelect && !firstTargetSelect) return { packId: 'custom', targetId: 'custom' };

    const preferredPack = options.packId ?? prefs.lessonPack ?? firstPackSelect?.value ?? DEFAULT_PREFS.lessonPack;
    const preferredTarget = options.targetId ?? prefs.lessonTarget ?? firstTargetSelect?.value ?? DEFAULT_PREFS.lessonTarget;
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
    const focusSelect = _el('setting-focus');
    const gradeSelect = _el('s-grade');
    const lengthSelect = _el('s-length');
    const desiredLength = getCurriculumLengthForFocus(target.focus, target.length);
    let lengthChanged = false;

    lessonPackApplying = true;
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
      lessonPackApplying = false;
    }
    if (lengthChanged) refreshBoardForLengthChange();

    updateFocusGradeNote();
    updateGradeTargetInline();
    updateFocusSummaryLabel();
    refreshStandaloneMissionLabHub();
    if (options.toast) {
      WQUI.showToast(`${pack.label}: ${target.label} applied (${formatLessonTargetPacing(target)}).`);
    }
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
    if (lessonPackApplying) return;
    const packSelects = getLessonPackSelectElements();
    const currentPack = normalizeLessonPackId(
      prefs.lessonPack || packSelects[0]?.value || DEFAULT_PREFS.lessonPack
    );
    const currentTarget = normalizeLessonTargetId(
      currentPack,
      prefs.lessonTarget || getLessonTargetSelectElements()[0]?.value || DEFAULT_PREFS.lessonTarget
    );
    if (currentPack === 'custom' && currentTarget === 'custom') return;
    lessonPackApplying = true;
    try {
      packSelects.forEach((select) => { select.value = 'custom'; });
      populateLessonTargetSelect('custom', 'custom');
    } finally {
      lessonPackApplying = false;
    }
    setLessonPackPrefs('custom', 'custom');
    updateLessonPackNote('custom', 'custom');
    refreshStandaloneMissionLabHub();
  }

  function parseFocusPreset(value) {
    const focus = String(value || 'all').trim().toLowerCase();
    if (!focus || focus === 'all') {
      return { kind: 'classic', focus: 'all' };
    }
    const match = focus.match(/^vocab-(math|science|social|ela)-(k2|35|68|912)$/);
    if (match) {
      const [, subject, band] = match;
      return {
        kind: 'subject',
        focus,
        subject,
        band,
        gradeBand: SUBJECT_FOCUS_GRADE[band] || 'all'
      };
    }
    return { kind: 'phonics', focus };
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

  function getRecommendedLengthForFocus(focusValue) {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') return '';
    if (preset.kind === 'classic') return FOCUS_LENGTH_BY_VALUE.all;
    return FOCUS_LENGTH_BY_VALUE[preset.focus] || DEFAULT_PREFS.length;
  }

  function refreshBoardForLengthChange() {
    if (isAssessmentRoundLocked()) return false;
    const state = WQGame.getState?.() || null;
    if (!state?.word || state?.gameOver) {
      newGame();
      return true;
    }
    const hasProgress = Boolean((state?.guesses?.length || 0) > 0 || String(state?.guess || '').length > 0);
    if (hasProgress) return false;
    newGame();
    return true;
  }

  function syncLengthFromFocus(focusValue, options = {}) {
    if (lessonPackApplying) return false;
    const lengthSelect = _el('s-length');
    if (!lengthSelect) return false;
    const recommended = getRecommendedLengthForFocus(focusValue);
    if (!recommended) return false;
    if (String(lengthSelect.value || '').trim() === recommended) return false;
    lengthSelect.value = recommended;
    setPref('length', recommended);
    refreshBoardForLengthChange();
    if (!options.silent) {
      WQUI.showToast(`Word length synced to ${recommended} letters for this quest.`);
    }
    return true;
  }

  function getEffectiveGameplayGradeBand(selectedGradeBand, focusValue = 'all') {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject' && preset.gradeBand) {
      return preset.gradeBand;
    }
    const normalized = String(selectedGradeBand || 'all').trim().toLowerCase();
    return normalized === 'all'
      ? SAFE_DEFAULT_GRADE_BAND
      : String(selectedGradeBand || SAFE_DEFAULT_GRADE_BAND).trim();
  }

  function shouldExpandGradeBandForFocus(focusValue = 'all') {
    const preset = parseFocusPreset(focusValue);
    return preset.kind === 'phonics';
  }

  function applyAllGradeLengthDefault(options = {}) {
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') return false;

    const gradeValue = String(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade).trim().toLowerCase();
    if (gradeValue !== 'all') return false;

    const defaultLength = getRecommendedLengthForFocus(focusValue) || DEFAULT_PREFS.length;
    const lengthSelect = _el('s-length');
    if (!lengthSelect) return false;
    if (String(lengthSelect.value || '').trim() === defaultLength) return false;

    lengthSelect.value = defaultLength;
    setPref('length', defaultLength);
    if (options.toast) {
      WQUI.showToast(`All grades mode defaults to ${defaultLength}-letter words for this quest.`);
    }
    return true;
  }

  function enforceClassicFiveLetterDefault(options = {}) {
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    if (preset.kind !== 'classic') return false;
    const lengthSelect = _el('s-length');
    if (!lengthSelect) return false;
    if (String(lengthSelect.value || '').trim() === '5') return false;
    lengthSelect.value = '5';
    setPref('length', '5');
    if (options.toast) {
      WQUI.showToast('Classic mode reset to 5-letter words.');
    }
    return true;
  }

  function syncGradeFromFocus(focusValue, options = {}) {
    const preset = parseFocusPreset(focusValue);
    if (preset.kind !== 'subject') {
      updateGradeTargetInline();
      return;
    }
    const gradeSelect = _el('s-grade');
    if (!gradeSelect || !preset.gradeBand) {
      updateGradeTargetInline();
      return;
    }
    if (gradeSelect.value !== preset.gradeBand) {
      gradeSelect.value = preset.gradeBand;
      setPref('grade', preset.gradeBand);
      if (!options.silent) {
        WQUI.showToast(`Grade synced to ${formatGradeBandLabel(preset.gradeBand)} for this quest.`);
      }
    }
    updateGradeTargetInline();
  }

  function updateFocusHint() {
    syncHintToggleUI(getHintMode());
  }

  function syncChunkTabsVisibility() {
    const layout = document.documentElement.getAttribute('data-keyboard-layout') || 'standard';
    const mode = applyChunkTabsMode(_el('s-chunk-tabs')?.value || prefs.chunkTabs || DEFAULT_PREFS.chunkTabs);
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const relevantFocus = preset.kind === 'phonics' && CHUNK_TAB_FOCUS_KEYS.has(preset.focus);

    let shouldShow = false;
    if (layout === 'wilson') {
      if (mode === 'on') shouldShow = true;
      else if (mode === 'auto') shouldShow = relevantFocus;
    }
    document.documentElement.setAttribute('data-chunk-tabs', shouldShow ? 'on' : 'off');

    const state = WQGame.getState?.();
    if (state?.wordLength && state?.maxGuesses && typeof WQUI.calcLayout === 'function') {
      WQUI.calcLayout(state.wordLength, state.maxGuesses);
    }
  }

  function updateFocusGradeNote() {
    const note = _el('focus-grade-note');
    if (!note) return;
    const focusVal = _el('setting-focus')?.value || 'all';
    const gradeVal = _el('s-grade')?.value || 'all';
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
    const labels = getFocusDisplayLabel._labels || (getFocusDisplayLabel._labels = Object.freeze({
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
    }));
    return labels[value] || String(fallback || value || '').trim();
  }

  function getFocusDisplayGroup(value, fallbackGroup = '') {
    const groups = getFocusDisplayGroup._groups || (getFocusDisplayGroup._groups = Object.freeze({
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
    }));
    if (groups[value]) return groups[value];
    if (String(value || '').startsWith('vocab-')) return 'Subjects';
    return String(fallbackGroup || 'General').trim() || 'General';
  }

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

  function getQuestFilterGradeBand() {
    return normalizeQuestGradeBand(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade);
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
    const suggestedBand = getFocusSuggestedGradeBand(value);
    return isEntryGradeBandCompatible(selectedGradeBand, suggestedBand);
  }

  function getCurriculumTargetsForGrade(packId, selectedGradeBand = getQuestFilterGradeBand(), options = {}) {
    const pack = getLessonPackDefinition(packId);
    if (!pack || !Array.isArray(pack.targets)) return [];
    const gradeFiltered = options.matchSelectedGrade === true;
    return pack.targets.filter((target) => {
      if (!target?.id) return false;
      if (!gradeFiltered) return true;
      return isEntryGradeBandCompatible(selectedGradeBand, target.gradeBand);
    });
  }

  function getFocusEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    const select = _el('setting-focus');
    if (!select) return [];
    return Array.from(select.options)
      .filter((option) => option.value && !option.disabled)
      .map((option) => {
        const value = String(option.value || '').trim();
        const parent = option.parentElement;
        const rawGroup = parent && parent.tagName === 'OPTGROUP'
          ? String(parent.label || '').trim()
          : 'General';
        return {
          value,
          label: getFocusDisplayLabel(value, option.textContent || value),
          group: getFocusDisplayGroup(value, rawGroup),
          kind: 'focus',
          gradeBand: getFocusSuggestedGradeBand(value),
          questValue: `focus::${value}`
        };
      })
      .filter((entry) => isFocusValueCompatibleWithGrade(entry.value, selectedGradeBand));
  }

  function getCurriculumProgramEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    return CURRICULUM_PACK_ORDER.map((packId) => {
      const pack = getLessonPackDefinition(packId);
      const visibleTargets = getCurriculumTargetsForGrade(packId, selectedGradeBand, { matchSelectedGrade: false });
      if (!visibleTargets.length) return null;
      return {
        value: `curriculum-pack::${packId}`,
        label: pack.label,
        group: 'Curriculum',
        kind: 'curriculum-pack',
        packId,
        lessonCount: visibleTargets.length,
        gradeBand: selectedGradeBand,
        targetId: 'custom',
        questValue: `curriculum-pack::${packId}`
      };
    }).filter(Boolean);
  }

  function getCurriculumQuestEntries(packFilter = '', selectedGradeBand = getQuestFilterGradeBand()) {
    const normalizedFilter = normalizeLessonPackId(packFilter);
    const useFilter = normalizedFilter !== 'custom' && normalizedFilter.length > 0;
    const entries = [];
    CURRICULUM_PACK_ORDER.forEach((packId) => {
      if (useFilter && packId !== normalizedFilter) return;
      const pack = getLessonPackDefinition(packId);
      const targets = getCurriculumTargetsForGrade(packId, selectedGradeBand, { matchSelectedGrade: false });
      targets.forEach((target) => {
        entries.push({
          value: `curriculum::${packId}::${target.id}`,
          label: target.label,
          group: pack.label,
          kind: 'curriculum',
          packId,
          gradeBand: target.gradeBand,
          targetId: target.id,
          questValue: `curriculum::${packId}::${target.id}`
        });
      });
    });
    return entries;
  }

  function getQuestEntries(selectedGradeBand = getQuestFilterGradeBand()) {
    return [
      ...getFocusEntries(selectedGradeBand),
      ...getCurriculumProgramEntries(selectedGradeBand),
      ...getCurriculumQuestEntries('', selectedGradeBand)
    ];
  }

  function getFocusLabel(value) {
    const select = _el('setting-focus');
    if (!select) return '— Classic (Wordle 5x6) —';
    const option = Array.from(select.options).find((entry) => entry.value === value);
    const raw = String(option?.textContent || '— Classic (Wordle 5x6) —').trim();
    return getFocusDisplayLabel(String(value || '').trim(), raw);
  }

  function clearPinnedFocusSearchValue(inputEl) {
    if (!inputEl) return;
    const raw = String(inputEl.value || '').trim();
    if (!raw) return;
    const lockedLabel = String(inputEl.dataset.lockedLabel || '').trim().toLowerCase();
    const normalizedRaw = raw.toLowerCase();
    if (lockedLabel && normalizedRaw === lockedLabel) {
      inputEl.value = '';
    }
  }

  function updateFocusSummaryLabel() {
    const inputEl = _el('focus-inline-search');
    const focusValue = _el('setting-focus')?.value || 'all';
    const activePack = normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack);
    const activeTarget = normalizeLessonTargetId(
      activePack,
      prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
    );
    const target = activePack !== 'custom' ? getLessonTarget(activePack, activeTarget) : null;
    const currentLabelRaw = target
      ? `${getLessonPackDefinition(activePack).label} · ${target.label}`
      : getFocusLabel(focusValue).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
    const currentLabel = currentLabelRaw || 'Classic (Wordle 5x6)';

    if (!inputEl) return;
    inputEl.value = '';
    delete inputEl.dataset.lockedLabel;
    inputEl.placeholder = currentLabel;
    inputEl.setAttribute('aria-label', `Quest picker. Current selection: ${currentLabel}`);
    inputEl.setAttribute('title', `Current quest: ${currentLabel}. Click to switch.`);
  }

  function formatGradeBandLabel(value) {
    const normalized = String(value || 'all').toLowerCase();
    if (normalized === 'k-2') return 'K-2';
    if (normalized === 'g3-5') return '3-5';
    if (normalized === 'g6-8') return '6-8';
    if (normalized === 'g9-12') return '9-12';
    return `All (${SAFE_DEFAULT_GRADE_BAND} safe)`;
  }

  function formatGradeBandInlineLabel(value) {
    const normalized = String(value || 'all').toLowerCase();
    if (normalized === 'all') return `All (${SAFE_DEFAULT_GRADE_BAND} safe)`;
    return formatGradeBandLabel(value);
  }

  function updateGradeTargetInline() {
    const gradeEl = _el('grade-target-inline');
    const focusValue = _el('setting-focus')?.value || prefs.focus || 'all';
    const preset = parseFocusPreset(focusValue);
    const activeGrade = preset.kind === 'subject'
      ? preset.gradeBand
      : (_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade);
    const inlineLabel = formatGradeBandInlineLabel(activeGrade);
    const titleLabel = formatGradeBandLabel(activeGrade);
    if (gradeEl) {
      const normalizedGrade = String(activeGrade || 'all').toLowerCase();
      const safeDefaultGrade = String(SAFE_DEFAULT_GRADE_BAND || 'k-2').toLowerCase();
      const isDefaultSafeBand = normalizedGrade === 'all' || normalizedGrade === safeDefaultGrade;
      gradeEl.textContent = isDefaultSafeBand ? '' : `Grade ${inlineLabel}`;
      gradeEl.classList.toggle('is-subtle-hidden', isDefaultSafeBand);
      gradeEl.setAttribute('aria-hidden', isDefaultSafeBand ? 'true' : 'false');
      if (preset.kind === 'subject') {
        gradeEl.setAttribute('title', `Grade band currently follows the selected subject focus: ${titleLabel}.`);
      } else {
        gradeEl.setAttribute('title', `Grade band in use: ${titleLabel}. This filters age-appropriate words; word length is controlled separately.`);
      }
    }
    updateActiveGradeLockChip(titleLabel, preset.kind === 'subject');
    syncQuickSetupControls();
    syncPlayStyleToggleUI();
  }

  function updateActiveGradeLockChip(gradeLabel, fromSubjectPreset) {
    const chipEl = _el('active-grade-lock-chip');
    if (!chipEl) return;
    const sourceLabel = fromSubjectPreset ? 'subject preset' : 'teacher/session grade';
    chipEl.textContent = `Active Grade Band locked: ${gradeLabel}`;
    chipEl.setAttribute('title', `New rounds use ${gradeLabel} from ${sourceLabel}.`);
  }

  function syncPlayHeaderCopy() {
    const homeBtn = _el('home-logo-btn');
    const galleryBtn = _el('teacher-dashboard-btn');
    const nextBtn = _el('new-game-btn');
    const focusBtn = _el('focus-help-btn');
    const focusInput = _el('focus-inline-search');

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
      const playStyle = normalizePlayStyle(_el('s-play-style')?.value || prefs.playStyle || DEFAULT_PREFS.playStyle);
      const state = WQGame.getState?.() || {};
      const unlockCopy = getHintUnlockCopy(playStyle, Array.isArray(state.guesses) ? state.guesses.length : 0);
      const supportTitle = focusBtn.disabled
        ? (unlockCopy.message || 'Help options unlock after a miss.')
        : 'Open quest supports';
      focusBtn.setAttribute('title', supportTitle);
      setHoverNoteForElement(focusBtn, supportTitle);
    }
    if (focusInput) {
      setHoverNoteForElement(focusInput, 'Open the quest picker');
    }
  }

  function syncQuickSetupControls() {
    syncPlayStyleToggleUI();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  const FOCUS_QUICK_VALUES = Object.freeze([
    'cvc',
    'digraph',
    'cvce',
    'ccvc',
    'cvcc',
    'floss',
    'vowel_team',
    'r_controlled'
  ]);
  const FOCUS_EMPTY_VISIBLE_LIMIT = 72;
  const FOCUS_QUERY_VISIBLE_LIMIT = 36;
  const CURRICULUM_QUICK_VALUES = Object.freeze([]);

  // Prioritize options that are most common for everyday classroom use.
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

  function tokenizeFocusQuery(rawQuery = '') {
    return String(rawQuery || '')
      .toLowerCase()
      .trim()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 2);
  }

  function splitFocusSearchTokens(rawText = '') {
    return String(rawText || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);
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
        let value = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
        if (
          i > 1 &&
          j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]
        ) {
          value = Math.min(value, matrix[i - 2][j - 2] + 1);
        }
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
    const len = String(token || '').length;
    if (len <= 4) return 1;
    return 2;
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
    const aliases = (FOCUS_SEARCH_ALIASES[entry.value] || [])
      .map((alias) => String(alias || '').toLowerCase())
      .filter(Boolean);
    const candidateTokens = getFocusCandidateTokens(entry, aliases);
    const aliasText = aliases.join(' ');
    const searchable = `${label} ${group} ${value} ${aliasText}`;
    let score = FOCUS_POPULARITY[entry.value] || 0;
    let hasMatch = false;

    if (label === normalizedQuery || value === normalizedQuery) {
      score += 420;
      hasMatch = true;
    }
    if (label.startsWith(normalizedQuery) || value.startsWith(normalizedQuery)) {
      score += 300;
      hasMatch = true;
    }
    if (label.split(/[^a-z0-9]+/g).some((part) => part && part.startsWith(normalizedQuery))) {
      score += 240;
      hasMatch = true;
    }
    if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
      score += 220;
      hasMatch = true;
    }
    if (searchable.includes(normalizedQuery)) {
      score += 150;
      hasMatch = true;
    }

    if (queryTokens.length) {
      let exactHits = 0;
      let fuzzyHits = 0;
      for (const token of queryTokens) {
        if (searchable.includes(token)) {
          exactHits += 1;
          continue;
        }
        const fuzzyThreshold = getTokenFuzzyThreshold(token);
        const bestDistance = getBestFuzzyDistance(token, candidateTokens, fuzzyThreshold);
        if (bestDistance <= fuzzyThreshold) {
          fuzzyHits += 1;
          continue;
        }
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
        if (bestDistance <= 2) {
          score += 118 - bestDistance * 26;
          hasMatch = true;
        }
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
    return entries
      .map((entry) => ({ entry, score: scoreFocusEntry(entry, normalizedQuery, queryTokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const byGroup = String(a.entry.group || '').localeCompare(String(b.entry.group || ''));
        if (byGroup !== 0) return byGroup;
        return String(a.entry.label || '').localeCompare(String(b.entry.label || ''));
      })
      .slice(0, FOCUS_QUERY_VISIBLE_LIMIT)
      .map((row) => row.entry);
  }

  var focusNavIndex = -1;
  var focusCurriculumPackFilter = '';

  function setFocusSearchOpen(isOpen) {
    document.documentElement.setAttribute('data-focus-search-open', isOpen ? 'true' : 'false');
    if (isOpen) closeQuickPopover('all');
    syncThemePreviewStripVisibility();
  }

  function openTeacherWordTools() {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return;
    }
    const teacherBtn = _el('teacher-panel-btn');
    if (teacherBtn) {
      teacherBtn.click();
      return;
    }
    window.dispatchEvent(new CustomEvent(openTeacherHubEvent));
  }

  function getFocusSearchButtons() {
    const listEl = _el('focus-inline-results');
    if (!listEl) return [];
    return Array.from(listEl.querySelectorAll('.focus-search-item[data-quest-value]'));
  }

  function setFocusNavIndex(nextIndex, options = {}) {
    const buttons = getFocusSearchButtons();
    const inputEl = _el('focus-inline-search');
    if (!buttons.length) {
      focusNavIndex = -1;
      if (inputEl) inputEl.removeAttribute('aria-activedescendant');
      return;
    }

    const clamped = Math.max(0, Math.min(nextIndex, buttons.length - 1));
    focusNavIndex = clamped;
    buttons.forEach((button, idx) => {
      button.classList.toggle('is-nav-active', idx === clamped);
    });
    if (inputEl) inputEl.setAttribute('aria-activedescendant', buttons[clamped].id);
    if (options.scroll !== false) {
      buttons[clamped].scrollIntoView({ block: 'nearest' });
    }
  }

  function getGradeBandRank(value) {
    const order = Object.freeze({ 'K-2': 0, 'G3-5': 1, 'G6-8': 2, 'G9-12': 3 });
    return Number.isFinite(order[String(value || '').toUpperCase()]) ? order[String(value || '').toUpperCase()] : 9;
  }

  function getFocusEntrySectionKey(entry) {
    if (!entry) return 'phonics';
    if (entry.kind === 'curriculum' || entry.kind === 'curriculum-pack') return 'curriculum';
    const preset = parseFocusPreset(entry.value);
    if (preset.kind === 'subject') return 'subjects';
    return 'phonics';
  }

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

  const curriculumExamplePoolCache = new Map();
  const curriculumEntryExampleCache = new Map();

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
    const gradeBand = String(target.gradeBand || SAFE_DEFAULT_GRADE_BAND).trim() || SAFE_DEFAULT_GRADE_BAND;
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
      pool = Array.isArray(rawPool)
        ? rawPool
          .map((word) => String(word || '').trim().toLowerCase())
          .filter((word) => /^[a-z]{2,12}$/.test(word))
          .slice(0, 200)
        : [];
      curriculumExamplePoolCache.set(cacheKey, pool);
    }
    if (!pool.length) {
      return (CURRICULUM_FOCUS_EXAMPLE_FALLBACK[focus] || CURRICULUM_FOCUS_EXAMPLE_FALLBACK.all).slice(0, 3);
    }
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
      const curatedByPack = Object.freeze({
        ufli: Object.freeze({
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
        }),
        fundations: Object.freeze({
          cvc: 'closed syllables (CVC)',
          digraph: 'digraph spellings (sh/ch/th/wh)',
          ccvc: 'blend starters',
          cvcc: 'blend endings',
          cvce: 'VCe words (a_e/i_e/o_e/u_e)',
          vowel_team: 'vowel team spellings (ai/ay, ee/ea, oa/ow)',
          r_controlled: 'r-controlled spellings (ar/or/er/ir/ur)',
          welded: 'welded chunks (ang/ing/ong/ank/ink)',
          diphthong: 'diphthong spellings (oi/oy, ou/ow)',
          prefix: 'prefixes (re-/un-/pre-)',
          suffix: 'suffixes (-s/-ed/-ing)',
          multisyllable: 'syllable division (V/CV, VC/V)',
          all: 'mixed review'
        }),
        wilson: Object.freeze({
          cvc: 'closed syllable words (CVC)',
          digraph: 'digraph patterns (sh/ch/th/wh)',
          ccvc: 'blend openings (st-/bl-/tr-)',
          cvcc: 'blend endings (-mp/-nd/-st)',
          cvce: 'V-e syllable (a_e/i_e/o_e/u_e)',
          vowel_team: 'vowel team syllable (ai/ay, ee/ea, oa/ow)',
          r_controlled: 'r-controlled syllable (ar/or/er/ir/ur)',
          welded: 'welded sounds (ang/ing/ong/ank/ink)',
          diphthong: 'diphthong syllable (oi/oy, ou/ow)',
          prefix: 'prefix + base (re-/un-/pre-)',
          suffix: 'suffix + base (-s/-ed/-ing)',
          multisyllable: 'multisyllable decoding (V/CV, VC/V)',
          all: 'mixed review'
        })
      });
      const curated = curatedByPack[pack] || curatedByPack.ufli;
      return curated[focus] || focus.replaceAll('_', ' ');
    }
    const shortLabels = Object.freeze({
      cvc: 'cvc short vowels (CVC)',
      digraph: 'digraphs (sh/ch/th/wh)',
      ccvc: 'initial blends (st-/bl-/tr-)',
      cvcc: 'final blends (-mp/-nd/-st)',
      trigraph: 'trigraphs (tch/dge/igh)',
      cvce: 'magic e (a_e/i_e/o_e/u_e)',
      vowel_team: 'vowel teams (ai/ay, ee/ea, oa/ow)',
      r_controlled: 'r-controlled (ar/or/er/ir/ur)',
      diphthong: 'diphthongs (oi/oy, ou/ow)',
      welded: 'welded sounds (ang/ing/ong/ank/ink)',
      prefix: 'prefixes (re-/un-/pre-)',
      suffix: 'suffixes (-s/-ed/-ing)',
      multisyllable: 'multisyllable (V/CV, VC/V)',
      schwa: 'schwa (about/sofa)',
      floss: 'floss (-ff/-ll/-ss/-zz)'
    });
    return shortLabels[focus] || focus;
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
      const match = label.match(/Lesson\\s+(\\d+)/i);
      if (match) return `${packAbbrev || 'UFL'} L${match[1]}`;
    }
    if (entry.packId === 'wilson') {
      const mappedMatch = label.match(/Wilson\\s+Reading\\s+System\\s+([0-9]+(?:\\.[0-9]+)?)/i);
      if (mappedMatch) return `${packAbbrev || 'WRS'} ${mappedMatch[1]}`;
      const match = label.match(/Step\\s+(\\d+)\\s+Lesson\\s+(\\d+)/i);
      if (match) return `${packAbbrev || 'WRS'} S${match[1]} L${match[2]}`;
    }
    if (entry.packId === 'justwords') {
      const match = label.match(/Unit\\s+([A-Za-z0-9]+)/i);
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
    const text = examples.length
      ? `${focusLabel} (${examples.join(', ')})`
      : (useCuratedPatternOnly ? focusLabel : '');
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
    if (entry.kind === 'focus') {
      const preset = parseFocusPreset(entry.value);
      if (preset.kind === 'phonics') return focusHints[preset.focus] || '';
    }
    const preset = parseFocusPreset(entry.value);
    if (preset.kind === 'subject' && preset.gradeBand) return `Grade ${formatGradeBandLabel(preset.gradeBand)}`;
    return '';
  }

  function getSectionHeadingMarkup(text) {
    return `<div class="focus-search-heading" role="presentation">${escapeHtml(text)}</div>`;
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

  function parseCurriculumNumbers(entry) {
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
  }

  function compareCurriculumEntries(leftEntry, rightEntry) {
    if (!leftEntry || !rightEntry) return 0;
    const leftPack = String(leftEntry.packId || '').trim().toLowerCase();
    const rightPack = String(rightEntry.packId || '').trim().toLowerCase();
    if (leftPack !== rightPack) {
      return String(leftEntry.group || '').localeCompare(String(rightEntry.group || ''));
    }

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
    for (let i = 0; i < columns; i += 1) {
      cols.push(list.slice(i * perCol, (i + 1) * perCol));
    }
    const ordered = [];
    for (let row = 0; row < perCol; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const item = cols[col][row];
        if (item) ordered.push(item);
      }
    }
    return ordered;
  }

  function renderFocusSectionItems(entries, activeQuestValue, activePack, activePackLabel, options = {}) {
    return entries.map((entry) => {
      const questValue = entry.questValue || `focus::${entry.value}`;
      const isProgram = entry.kind === 'curriculum-pack';
      const isActive = isProgram
        ? (entry.packId === activePack || entry.packId === focusCurriculumPackFilter)
        : (questValue === activeQuestValue);
      const activeClass = isActive ? ' is-active' : '';
      const selected = isActive ? 'true' : 'false';
      const label = isProgram ? `${entry.label} · Choose Lesson` : formatCurriculumLessonLabel(entry);
      const meta = getFocusEntryMeta(entry);
      const scopeClass = isProgram ? ' is-program' : ' is-curriculum';
      const extraClass = options && options.columnFlow ? ' focus-curriculum-item' : '';
      const ariaLabel = isProgram
        ? `Open ${entry.label} lesson groups`
        : `${entry.group || activePackLabel} ${label}${meta ? ` ${meta}` : ''}`;
      return `<button type="button" class="focus-search-item${scopeClass}${extraClass}${activeClass}" data-quest-value="${escapeHtml(questValue)}" role="option" aria-selected="${selected}" aria-label="${escapeHtml(ariaLabel)}"><span>${escapeHtml(label)}</span>${meta ? `<small>${escapeHtml(meta)}</small>` : ''}</button>`;
    }).join('');
  }

  function buildFocusSearchSections(entries, options = {}) {
    const query = String(options.query || '').trim();
    const sectionOrder = Object.freeze(['phonics', 'curriculum', 'subjects']);
    const sections = {
      phonics: [],
      subjects: [],
      curriculum: []
    };
    entries.forEach((entry) => {
      const key = getFocusEntrySectionKey(entry);
      if (!sections[key]) return;
      sections[key].push(entry);
    });

    sections.phonics.sort((a, b) => String(a.label || '').localeCompare(String(b.label || '')));
    sections.subjects.sort((a, b) => {
      const left = parseFocusPreset(a.value);
      const right = parseFocusPreset(b.value);
      const rankDiff = getGradeBandRank(left.gradeBand) - getGradeBandRank(right.gradeBand);
      if (rankDiff !== 0) return rankDiff;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });
    sections.curriculum.sort((a, b) => {
      if (a.kind === 'curriculum-pack' && b.kind !== 'curriculum-pack') return -1;
      if (a.kind !== 'curriculum-pack' && b.kind === 'curriculum-pack') return 1;
      if (a.kind === 'curriculum' && b.kind === 'curriculum') {
        return compareCurriculumEntries(a, b);
      }
      return String(a.label || '').localeCompare(String(b.label || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    const output = [];
    sectionOrder.forEach((key) => {
      const rows = sections[key];
      if (!rows.length) return;
      if (key === 'phonics') {
        output.push({ heading: 'Phonics Skills', entries: rows });
        return;
      }
      if (key === 'curriculum' && !query) {
        output.push({ heading: 'Curriculum', entries: rows });
        return;
      }
      if (key === 'curriculum') {
        output.push({ heading: 'Curriculum Matches', entries: rows });
        return;
      }
      output.push({ heading: 'Grade Band Subjects', entries: rows });
    });
    return output;
  }

  function renderFocusSearchList(rawQuery = '', options = {}) {
    const listEl = _el('focus-inline-results');
    const inputEl = _el('focus-inline-search');
    if (!listEl) return;
    const userInitiated = options && options.userInitiated === true;
    if (!userInitiated && Date.now() < focusSearchReopenGuardUntil) {
      closeFocusSearchList();
      return;
    }
    const query = String(rawQuery || '').trim().toLowerCase();
    const isCurriculumLessonListMode = !query && Boolean(focusCurriculumPackFilter);
    const isFundationsLessonMode = isCurriculumLessonListMode && focusCurriculumPackFilter === 'fundations';
    listEl.classList.toggle('is-curriculum-list', isCurriculumLessonListMode);
    listEl.classList.toggle('is-fundations-grid', isFundationsLessonMode);
    const selectedGradeBand = getQuestFilterGradeBand();
    const focusEntries = getFocusEntries(selectedGradeBand);
    const curriculumProgramEntries = getCurriculumProgramEntries(selectedGradeBand);
    if (
      focusCurriculumPackFilter &&
      !curriculumProgramEntries.some((entry) => entry.packId === focusCurriculumPackFilter)
    ) {
      focusCurriculumPackFilter = '';
    }
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
      if (focusCurriculumPackFilter) {
        visible = curriculumLessonEntries;
      } else {
        const phonicsEntries = focusEntries.filter((entry) => {
          if (entry.value === 'all') return false;
          return parseFocusPreset(entry.value).kind === 'phonics';
        });
        const subjectEntries = focusEntries.filter((entry) => parseFocusPreset(entry.value).kind === 'subject');
        visible = [
          ...phonicsEntries,
          ...subjectEntries,
          ...curriculumProgramEntries
        ].slice(0, FOCUS_EMPTY_VISIBLE_LIMIT);
      }
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

    const activeFocus = _el('setting-focus')?.value || 'all';
    const activePack = normalizeLessonPackId(prefs.lessonPack || _el('s-lesson-pack')?.value || DEFAULT_PREFS.lessonPack);
    const activeTarget = normalizeLessonTargetId(
      activePack,
      prefs.lessonTarget || _el('s-lesson-target')?.value || DEFAULT_PREFS.lessonTarget
    );
    const activeQuestValue = (activePack !== 'custom' && activeTarget !== 'custom')
      ? `curriculum::${activePack}::${activeTarget}`
      : `focus::${activeFocus}`;
    const activePackLabel = getLessonPackDefinition(activePack).label;
    const actions = [];
    if (!query && focusCurriculumPackFilter) {
      const packLabel = getLessonPackDefinition(focusCurriculumPackFilter).label;
      actions.push(
        `<div class="focus-search-topbar">` +
          `<button type="button" class="focus-search-back-mini" data-focus-action="curriculum-back" aria-label="Back to program list" title="Back to program list">←</button>` +
          `<div class="focus-search-pack-title">${escapeHtml(packLabel)}</div>` +
        `</div>`
      );
    }
    const guidance = !query
      ? focusCurriculumPackFilter
        ? ''
        : '<div class="focus-search-empty focus-search-empty-hint">Choose a phonics skill to see the sound pattern and example words, or choose a curriculum/grade-band subject program.</div>'
      : '';
    const sections = buildFocusSearchSections(visible, { query });
    const sectionMarkup = sections.map((section) => {
      if (section.heading === 'Curriculum' || section.heading === 'Curriculum Matches') {
        const curriculumRows = section.entries;
        const programRows = curriculumRows.filter((entry) => entry.kind === 'curriculum-pack');
        const lessonRows = curriculumRows.filter((entry) => entry.kind === 'curriculum');
        const groupedLessons = lessonRows.reduce((map, entry) => {
          const key = String(entry.group || 'Curriculum').trim();
          if (!map[key]) map[key] = [];
          map[key].push(entry);
          return map;
        }, Object.create(null));
        const orderedPacks = ['UFLI', 'Fundations', 'Wilson Reading System', 'Lexia English (WIDA)', 'Just Words'];
        const lessonBlocks = orderedPacks
          .filter((packLabel) => Array.isArray(groupedLessons[packLabel]) && groupedLessons[packLabel].length)
          .map((packLabel) => {
            groupedLessons[packLabel].sort(compareCurriculumEntries);
            const orderedLessons = reorderForColumnFirstGrid(groupedLessons[packLabel], 2);
            return `<div class="focus-search-subheading" role="presentation">${escapeHtml(packLabel)}</div>` +
              renderFocusSectionItems(orderedLessons, activeQuestValue, activePack, activePackLabel, { columnFlow: true });
          });
        Object.keys(groupedLessons)
          .filter((packLabel) => !orderedPacks.includes(packLabel))
          .sort((a, b) => a.localeCompare(b))
          .forEach((packLabel) => {
            groupedLessons[packLabel].sort(compareCurriculumEntries);
            const orderedLessons = reorderForColumnFirstGrid(groupedLessons[packLabel], 2);
            lessonBlocks.push(
              `<div class="focus-search-subheading" role="presentation">${escapeHtml(packLabel)}</div>` +
              renderFocusSectionItems(orderedLessons, activeQuestValue, activePack, activePackLabel, { columnFlow: true })
            );
          });
        const includeCurriculumHeading = !(isCurriculumLessonListMode && !query);
        return `${includeCurriculumHeading ? getSectionHeadingMarkup(section.heading) : ''}` +
          renderFocusSectionItems(programRows, activeQuestValue, activePack, activePackLabel) +
          lessonBlocks.join('');
      }
      return getSectionHeadingMarkup(section.heading) +
        renderFocusSectionItems(section.entries, activeQuestValue, activePack, activePackLabel);
    }).join('');
    listEl.innerHTML = actions.join('') + guidance + sectionMarkup;
    if (shouldResetScroll) listEl.scrollTop = 0;
    getFocusSearchButtons().forEach((button, idx) => {
      button.id = `focus-search-option-${idx}`;
      button.classList.remove('is-nav-active');
    });
    focusNavIndex = -1;
    if (inputEl) inputEl.removeAttribute('aria-activedescendant');
    listEl.classList.remove('hidden');
    if (inputEl) inputEl.setAttribute('aria-expanded', 'true');
    setFocusSearchOpen(true);
  }

  function closeFocusSearchList() {
    const list = _el('focus-inline-results');
    const inputEl = _el('focus-inline-search');
    if (!list) return;
    focusCurriculumPackFilter = '';
    focusNavIndex = -1;
    if (inputEl) inputEl.removeAttribute('aria-activedescendant');
    if (inputEl) inputEl.setAttribute('aria-expanded', 'false');
    list.classList.remove('is-curriculum-list');
    list.classList.add('hidden');
    setFocusSearchOpen(false);
  }

  function setFocusValue(nextValue, options = {}) {
    if (isAssessmentRoundLocked() && !options.force) {
      showAssessmentLockNotice('Assessment lock is on. Focus changes unlock after this round.');
      closeFocusSearchList();
      return;
    }
    const select = _el('setting-focus');
    if (!select) return;
    const target = String(nextValue || '').trim();
    if (!target) return;
    const exists = Array.from(select.options).some((option) => option.value === target);
    if (!exists) return;
    if (select.value === target) {
      updateFocusSummaryLabel();
      closeFocusSearchList();
      if (options.startNewWord) newGame();
      return;
    }
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (options.toast) {
      WQUI.showToast(`Focus set: ${getFocusLabel(target)}.`);
    }
    closeFocusSearchList();
    if (options.startNewWord) newGame();
  }

  function setQuestValue(nextValue, options = {}) {
    const raw = String(nextValue || '').trim();
    if (!raw) return;
    if (raw.startsWith('curriculum-pack::')) {
      const [, packRaw = 'custom'] = raw.split('::');
      const packId = normalizeLessonPackId(packRaw);
      if (packId === 'custom') return;
      emitTelemetry('wq_funnel_quest_select', {
        source: 'focus_search',
        selection_type: 'curriculum_pack',
        lesson_pack_id: packId
      });
      focusCurriculumPackFilter = packId;
      const inputEl = _el('focus-inline-search');
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
        if (options.startNewWord) newGame();
        return;
      }
      handleLessonPackSelectionChange(packId);
      handleLessonTargetSelectionChange(targetId);
      emitTelemetry('wq_funnel_quest_select', {
        source: 'focus_search',
        selection_type: 'curriculum',
        lesson_pack_id: packId,
        lesson_target_id: targetId
      });
      if (options.toast) {
        const pack = getLessonPackDefinition(packId);
        const target = getLessonTarget(packId, targetId);
        if (target) WQUI.showToast(`Track set: ${pack.label} · ${target.label}.`);
      }
      updateFocusSummaryLabel();
      closeFocusSearchList();
      if (options.startNewWord) newGame();
      return;
    }
    const focusValue = raw.startsWith('focus::') ? raw.slice('focus::'.length) : raw;
    emitTelemetry('wq_funnel_quest_select', {
      source: 'focus_search',
      selection_type: 'focus',
      focus_id: focusValue
    });
    setFocusValue(focusValue, options);
  }

  const SUBJECT_TAG_ALIASES = Object.freeze({
    math: new Set(['math', 'mathematics', 'algebra', 'geometry', 'statistics', 'calculus', 'trigonometry', 'trig']),
    science: new Set(['science', 'sci', 'biology', 'bio', 'chemistry', 'physics', 'earth sci', 'earth science', 'anatomy', 'med', 'engineering']),
    social: new Set(['ss', 'social studies', 'history', 'hist', 'civics', 'govt', 'government', 'geo', 'geography', 'econ', 'economics', 'law', 'bus']),
    ela: new Set(['ela', 'language arts', 'reading', 'writing', 'literacy', 'english', 'eng'])
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

  const subjectTagsByWord = new Map();
  const playableWordsFromRaw = new Set();
  if (window.WQ_WORD_DATA && typeof window.WQ_WORD_DATA === 'object') {
    Object.values(window.WQ_WORD_DATA).forEach((raw) => {
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
  }

  const SUBJECT_WORD_OVERRIDES = Object.freeze({
    oxide: Object.freeze(['science', 'math']),
    oxidize: Object.freeze(['science', 'math'])
  });

  function matchesSubjectFocus(word, subject) {
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

  if (!WQData.__focusPatchApplied) {
    const originalGetPlayableWords = WQData.getPlayableWords.bind(WQData);
    WQData.getPlayableWords = function getPlayableWordsWithFocus(opts = {}) {
      const focusValue = opts.focus || opts.phonics || 'all';
      const preset = parseFocusPreset(focusValue);
      const requestedGradeBand = preset.kind === 'subject' ? preset.gradeBand : opts.gradeBand;
      const effectiveGradeBand = getEffectiveGameplayGradeBand(requestedGradeBand, focusValue);
      const includeLowerBands = preset.kind === 'phonics'
        ? (opts.includeLowerBands !== false)
        : false;
      const basePool = originalGetPlayableWords({
        gradeBand: effectiveGradeBand || SAFE_DEFAULT_GRADE_BAND,
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

  _el('setting-focus')?.addEventListener('change', (event) => {
    const focus = event.target?.value || 'all';
    setPref('focus', focus);
    releaseLessonPackToManualMode();
    syncLengthFromFocus(focus, { silent: lessonPackApplying });
    syncGradeFromFocus(focus, { silent: lessonPackApplying });
    updateFocusHint();
    updateFocusGradeNote();
    updateFocusSummaryLabel();
    syncChunkTabsVisibility();
    refreshStandaloneMissionLabHub();
    closeFocusSearchList();
  });

  _el('focus-inline-search')?.addEventListener('focus', (event) => {
    if (DEMO_MODE) {
      event.preventDefault();
      closeAllOverlaysForDemo();
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

  _el('focus-inline-search')?.addEventListener('click', (event) => {
    if (DEMO_MODE) {
      event.preventDefault();
      closeAllOverlaysForDemo();
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

  _el('focus-inline-search')?.addEventListener('input', (event) => {
    if (DEMO_MODE) {
      event.preventDefault();
      closeAllOverlaysForDemo();
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

  _el('focus-inline-search')?.addEventListener('keydown', (event) => {
    if (DEMO_MODE) {
      event.preventDefault();
      event.stopPropagation();
      closeAllOverlaysForDemo();
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
    // Prevent global game key handler from capturing focus-search typing.
    event.stopPropagation();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      const query = String(event.target?.value || '').trim();
      const listEl = _el('focus-inline-results');
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

  _el('focus-inline-results')?.addEventListener('click', (event) => {
    if (DEMO_MODE) {
      event.preventDefault();
      event.stopPropagation();
      closeAllOverlaysForDemo();
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
        const inputEl = _el('focus-inline-search');
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

  function initFocus() {
    const initialLessonPackState = syncLessonPackControlsFromPrefs();
    if (initialLessonPackState.packId !== 'custom' && initialLessonPackState.targetId !== 'custom') {
      applyLessonTargetConfig(initialLessonPackState.packId, initialLessonPackState.targetId);
    }
    syncGradeFromFocus(_el('setting-focus')?.value || prefs.focus || 'all', { silent: true });
    enforceFocusSelectionForGrade(_el('s-grade')?.value || prefs.grade || DEFAULT_PREFS.grade, { toast: false });
    enforceClassicFiveLetterDefault();
    applyAllGradeLengthDefault();
    updateFocusHint();
    updateFocusGradeNote();
    syncChunkTabsVisibility();
    updateFocusSummaryLabel();
    closeFocusSearchList();
  }

export {
  initFocus,
  setFocusValue,
  getFocusLabel,
  getEffectiveGameplayGradeBand,
  shouldExpandGradeBandForFocus,
  parseFocusPreset,
  CURRICULUM_PACK_ORDER,
  normalizeLessonPackId,
  normalizeLessonTargetId,
  getLessonPackDefinition,
  getLessonTarget,
  getCurriculumTargetsForGrade,
  getQuestFilterGradeBand,
  formatGradeBandLabel,
  updateFocusSummaryLabel
};
