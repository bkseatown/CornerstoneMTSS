/**
 * specialist-hub-curriculum.js — Curriculum navigator module
 *
 * Manages lesson navigation for 4 curriculum systems:
 * 1. Fishtank ELA — Unit/lesson navigation with external links
 * 2. Illustrative Mathematics (IM) — Grade/unit/lesson hierarchy
 * 3. UFLI Foundations — K-2 phonics lessons
 * 4. IS Word Study — Semester/lesson structure
 *
 * Extracted from specialist-hub.js (Phase 5 refactoring)
 * Reduces specialist-hub.js by ~400 lines
 * Makes curriculum navigation swappable and testable
 */

function createSpecialistHubCurriculumModule(deps) {
  "use strict";

  var escapeHtml = deps.escapeHtml;

  if (!escapeHtml) {
    console.warn("[SpecialistHubCurriculum] Missing dependencies. Curriculum navigators disabled.");
    return null;
  }

  /* ── Curriculum Constants ──────────────────────────────── */

  var FISHTANK_GRADES = window.FISHTANK_GRADES || {};
  var IM_GRADES = window.IM_GRADES || {};
  var ISWS_GRADES = window.ISWS_GRADES || {};
  var UFLI_TOTAL = 160;
  var UFLI_BASE = "https://www.uflifoundations.org/lessons/unit-";
  var FT_BASE = "https://fishtankonmath.org/";

  /* ── Helper: Get lesson nav state ──────────────────────── */

  function lsNavKey(currId, grade) { 
    return "cs.lessonNav." + currId + "." + grade; 
  }

  function getLessonNavState(currId, grade) {
    return window.hubMemory && typeof window.hubMemory.getJson === "function"
      ? window.hubMemory.getJson(lsNavKey(currId, grade), {})
      : {};
  }

  function setLessonNavState(currId, grade, state) {
    if (window.hubMemory && typeof window.hubMemory.setJson === "function") {
      window.hubMemory.setJson(lsNavKey(currId, grade), state);
    }
  }

  /* ── Helper: UFLI Group Lookup ────────────────────────── */

  var UFLI_GROUPS = [
    { start: 1, end: 20, label: "1–20", focus: "Letter names & sounds" },
    { start: 21, end: 40, label: "21–40", focus: "Short vowels" },
    { start: 41, end: 60, label: "41–60", focus: "Consonant blends" },
    { start: 61, end: 80, label: "61–80", focus: "Long vowels" },
    { start: 81, end: 100, label: "81–100", focus: "Vowel teams" },
    { start: 101, end: 120, label: "101–120", focus: "Syllable patterns" },
    { start: 121, end: 140, label: "121–140", focus: "Morphology (prefixes/suffixes)" },
    { start: 141, end: 160, label: "141–160", focus: "Advanced patterns" }
  ];

  function ufliGroupForLesson(n) {
    var lesson = Math.max(1, Math.min(n, UFLI_TOTAL));
    for (var i = 0; i < UFLI_GROUPS.length; i++) {
      var group = UFLI_GROUPS[i];
      if (lesson >= group.start && lesson <= group.end) return group;
    }
    return UFLI_GROUPS[UFLI_GROUPS.length - 1];
  }

  /* ── Helper: Build URLs ────────────────────────────────── */

  function buildFishtankLessonUrl(gradeSlug, unitSlug, lessonN) {
    return FT_BASE + gradeSlug + "/" + unitSlug + "/lesson-" + lessonN + "/";
  }

  function buildIMUrl(gradeSlug, unitN, lessonN) {
    return "https://im.kendallhunt.com/K5/teachers/" + gradeSlug + "/unit-" + unitN + "/lesson-" + lessonN + "/preparation.html";
  }

  /* ── Render: Fishtank ELA Navigator ────────────────────── */

  function renderFishtankNav(gradeKey) {
    var ftGrade = FISHTANK_GRADES[gradeKey];
    if (!ftGrade || !ftGrade.units || !ftGrade.units.length) return "";

    var state = getLessonNavState("fishtank", gradeKey) || { unitIdx: 0, lessonN: 1 };
    var unitIdx  = Math.max(0, Math.min(state.unitIdx  || 0, ftGrade.units.length - 1));
    var unit     = ftGrade.units[unitIdx];
    var lessonN  = Math.max(1, Math.min(state.lessonN || 1, unit.lessonCount));
    var lessonUrl = buildFishtankLessonUrl(ftGrade.slug, unit.slug, lessonN);
    var unitUrl   = FT_BASE + ftGrade.slug + "/" + unit.slug + "/";
    var coreText  = unit.coreText && unit.coreText !== unit.title ? " — " + unit.coreText : "";

    var prevUnitOk = unitIdx > 0;
    var nextUnitOk = unitIdx < ftGrade.units.length - 1;
    var prevLsnOk  = lessonN > 1;
    var nextLsnOk  = lessonN < unit.lessonCount;

    return [
      '<div class="th2-lnav" data-lnav-curr="fishtank" data-lnav-grade="' + escapeHtml(gradeKey) + '">',
      '  <div class="th2-lnav-header">',
      '    <span class="th2-lnav-badge th2-lnav-badge--fishtank">Fishtank ELA</span>',
      '    <span class="th2-lnav-grade">' + escapeHtml(ftGrade.label) + '</span>',
      '    <div class="th2-lnav-unit-nav">',
      '      <button class="th2-lnav-unit-btn" data-lnav-unit-dir="-1" title="Previous unit"' + (prevUnitOk ? '' : ' disabled') + '>‹</button>',
      '      <span class="th2-lnav-unit-label" title="' + escapeHtml(unit.anchor) + '">' + escapeHtml(unit.title) + escapeHtml(coreText) + '</span>',
      '      <button class="th2-lnav-unit-btn" data-lnav-unit-dir="1" title="Next unit"' + (nextUnitOk ? '' : ' disabled') + '>›</button>',
      '    </div>',
      '  </div>',
      '  <div class="th2-lnav-body">',
      '    <button class="th2-lnav-btn" data-lnav-dir="-1" title="Previous lesson"' + (prevLsnOk ? '' : ' disabled') + '>‹</button>',
      '    <div class="th2-lnav-lesson">',
      '      <a class="th2-lnav-lesson-link" href="' + escapeHtml(lessonUrl) + '" target="_blank" rel="noopener">',
      '        Lesson ' + lessonN,
      '      </a>',
      '      <span class="th2-lnav-lesson-of">of ' + unit.lessonCount + '</span>',
      '    </div>',
      '    <button class="th2-lnav-btn" data-lnav-dir="1" title="Next lesson"' + (nextLsnOk ? '' : ' disabled') + '>›</button>',
      '  </div>',
      '  <div class="th2-lnav-unit-link-row">',
      '    <a class="th2-lnav-unit-link" href="' + escapeHtml(unitUrl) + '" target="_blank" rel="noopener">Open full unit</a>',
      '    <button class="th2-lnav-setpos-btn" data-lnav-setpos type="button" title="Set current position">📍 Set position</button>',
      '  </div>',
      '</div>'
    ].join("\n");
  }

  /* ── Render: IS Word Study Navigator ────────────────────── */

  function renderISWSNav(gradeKey) {
    var grade = ISWS_GRADES[gradeKey];
    if (!grade || !grade.semesters || !grade.semesters.length) return "";

    var state   = getLessonNavState("iswordstudy", gradeKey) || { semIdx: 0, lessonIdx: 0 };
    var semIdx  = Math.max(0, Math.min(state.semIdx || 0, grade.semesters.length - 1));
    var sem     = grade.semesters[semIdx];
    var lessons = sem.lessons || [];
    var lessonIdx = Math.max(0, Math.min(state.lessonIdx || 0, lessons.length - 1));
    var lesson  = lessons[lessonIdx] || {};
    var docUrl  = lesson.docUrl || sem.pageUrl;

    var prevSemOk = semIdx > 0;
    var nextSemOk = semIdx < grade.semesters.length - 1;
    var prevLsnOk = lessonIdx > 0;
    var nextLsnOk = lessonIdx < lessons.length - 1;
    var titleShort = lesson.title && lesson.title.length > 52
      ? lesson.title.slice(0, 49) + "…" : (lesson.title || "");

    return [
      '<div class="th2-lnav th2-lnav--isws" data-lnav-curr="iswordstudy" data-lnav-grade="' + escapeHtml(gradeKey) + '">',
      '  <div class="th2-lnav-header">',
      '    <span class="th2-lnav-badge th2-lnav-badge--isws">IS Word Study</span>',
      '    <span class="th2-lnav-grade">' + escapeHtml(grade.label) + '</span>',
      '    <div class="th2-lnav-unit-nav">',
      '      <button class="th2-lnav-unit-btn" data-lnav-sem-dir="-1" title="Previous semester"' + (prevSemOk ? '' : ' disabled') + '>‹</button>',
      '      <span class="th2-lnav-unit-label">' + escapeHtml(sem.label) + '</span>',
      '      <button class="th2-lnav-unit-btn" data-lnav-sem-dir="1" title="Next semester"' + (nextSemOk ? '' : ' disabled') + '>›</button>',
      '    </div>',
      '  </div>',
      '  <div class="th2-lnav-body">',
      '    <button class="th2-lnav-btn" data-lnav-dir="-1" title="Previous lesson"' + (prevLsnOk ? '' : ' disabled') + '>‹</button>',
      '    <div class="th2-lnav-lesson">',
      '      <span class="th2-lnav-lesson-num">Lesson ' + (lessonIdx + 1) + ' of ' + lessons.length + '</span>',
      '      ' + (docUrl
          ? '<a class="th2-lnav-lesson-link" href="' + escapeHtml(docUrl) + '" target="_blank" rel="noopener">' + escapeHtml(titleShort) + '</a>'
          : '<span class="th2-lnav-lesson-nohref">' + escapeHtml(titleShort) + '</span>'),
      '    </div>',
      '    <button class="th2-lnav-btn" data-lnav-dir="1" title="Next lesson"' + (nextLsnOk ? '' : ' disabled') + '>›</button>',
      '  </div>',
      '  <div class="th2-lnav-unit-link-row">',
      '    <a class="th2-lnav-unit-link" href="' + escapeHtml(sem.pageUrl) + '" target="_blank" rel="noopener">Open semester page</a>',
      '    <button class="th2-lnav-setpos-btn" data-lnav-setpos type="button" title="Set current position">📍 Set position</button>',
      '  </div>',
      '</div>'
    ].join("\n");
  }

  /* ── Render: UFLI Foundations Navigator ─────────────────── */

  function renderUFLINav(gradeKey) {
    var state   = getLessonNavState("ufli", gradeKey) || { lessonN: 1 };
    var lessonN = Math.max(1, Math.min(state.lessonN || 1, UFLI_TOTAL));
    var group   = ufliGroupForLesson(lessonN);
    var groupUrl = UFLI_BASE + group.start + "-" + group.end + "/";
    var prevOk  = lessonN > 1;
    var nextOk  = lessonN < UFLI_TOTAL;

    return [
      '<div class="th2-lnav th2-lnav--ufli" data-lnav-curr="ufli" data-lnav-grade="' + escapeHtml(gradeKey) + '">',
      '  <div class="th2-lnav-header">',
      '    <span class="th2-lnav-badge th2-lnav-badge--ufli">UFLI Foundations</span>',
      '    <span class="th2-lnav-grade">K–2 Phonics</span>',
      '    <div class="th2-lnav-unit-nav">',
      '      <span class="th2-lnav-unit-label" title="' + escapeHtml(group.focus) + '">' + escapeHtml(group.label) + '</span>',
      '    </div>',
      '  </div>',
      '  <div class="th2-lnav-body">',
      '    <button class="th2-lnav-btn" data-lnav-dir="-1" title="Previous lesson"' + (prevOk ? '' : ' disabled') + '>‹</button>',
      '    <div class="th2-lnav-lesson">',
      '      <a class="th2-lnav-lesson-link" href="' + escapeHtml(groupUrl) + '" target="_blank" rel="noopener">Lesson ' + lessonN + '</a>',
      '      <span class="th2-lnav-lesson-of">of ' + UFLI_TOTAL + '</span>',
      '    </div>',
      '    <button class="th2-lnav-btn" data-lnav-dir="1" title="Next lesson"' + (nextOk ? '' : ' disabled') + '>›</button>',
      '  </div>',
      '  <div class="th2-lnav-unit-link-row">',
      '    <span class="th2-lnav-lesson-focus">' + escapeHtml(group.focus) + '</span>',
      '    <button class="th2-lnav-setpos-btn" data-lnav-setpos type="button" title="Set current lesson">📍 Set position</button>',
      '  </div>',
      '</div>'
    ].join("\n");
  }

  /* ── Render: Illustrative Math Navigator ────────────────── */

  function renderIMNav(gradeKey) {
    var imGrade = IM_GRADES[gradeKey];
    if (!imGrade || !imGrade.units || !imGrade.units.length) return "";

    var state = getLessonNavState("illustrative-math", gradeKey) || { unitIdx: 0, lessonN: 1 };
    var unitIdx = Math.max(0, Math.min(state.unitIdx || 0, imGrade.units.length - 1));
    var unit = imGrade.units[unitIdx];
    var lessonN = Math.max(1, Math.min(state.lessonN || 1, unit.lessonCount));
    var lessonUrl = buildIMUrl(imGrade.slug, unitIdx + 1, lessonN);
    var unitUrl = "https://im.kendallhunt.com/K5/teachers/" + imGrade.slug + "/unit-" + (unitIdx + 1) + "/";
    var unitLabel = unit.label && unit.label.length > 40 ? unit.label.slice(0, 37) + "…" : unit.label;

    var prevUnitOk = unitIdx > 0;
    var nextUnitOk = unitIdx < imGrade.units.length - 1;
    var prevLsnOk = lessonN > 1;
    var nextLsnOk = lessonN < unit.lessonCount;

    return [
      '<div class="th2-lnav th2-lnav--im" data-lnav-curr="illustrative-math" data-lnav-grade="' + escapeHtml(gradeKey) + '">',
      '  <div class="th2-lnav-header">',
      '    <span class="th2-lnav-badge th2-lnav-badge--im">Illustrative Math</span>',
      '    <span class="th2-lnav-grade">' + escapeHtml(imGrade.label) + '</span>',
      '    <div class="th2-lnav-unit-nav">',
      '      <button class="th2-lnav-unit-btn" data-lnav-unit-dir="-1" title="Previous unit"' + (prevUnitOk ? '' : ' disabled') + '>‹</button>',
      '      <span class="th2-lnav-unit-label" title="' + escapeHtml(unit.label) + '">Unit ' + (unitIdx + 1) + ': ' + escapeHtml(unitLabel) + '</span>',
      '      <button class="th2-lnav-unit-btn" data-lnav-unit-dir="1" title="Next unit"' + (nextUnitOk ? '' : ' disabled') + '>›</button>',
      '    </div>',
      '  </div>',
      '  <div class="th2-lnav-body">',
      '    <button class="th2-lnav-btn" data-lnav-dir="-1" title="Previous lesson"' + (prevLsnOk ? '' : ' disabled') + '>‹</button>',
      '    <div class="th2-lnav-lesson">',
      '      <a class="th2-lnav-lesson-link" href="' + escapeHtml(lessonUrl) + '" target="_blank" rel="noopener">',
      '        Lesson ' + lessonN,
      '      </a>',
      '      <span class="th2-lnav-lesson-of">of ' + unit.lessonCount + '</span>',
      '    </div>',
      '    <button class="th2-lnav-btn" data-lnav-dir="1" title="Next lesson"' + (nextLsnOk ? '' : ' disabled') + '>›</button>',
      '  </div>',
      '  <div class="th2-lnav-unit-link-row">',
      '    <a class="th2-lnav-unit-link" href="' + escapeHtml(unitUrl) + '" target="_blank" rel="noopener">Open full unit</a>',
      '    <button class="th2-lnav-setpos-btn" data-lnav-setpos type="button" title="Set current position">📍 Set position</button>',
      '  </div>',
      '</div>'
    ].join("\n");
  }

  /* ── Public API ────────────────────────────────────────── */

  return {
    renderFishtankNav: renderFishtankNav,
    renderISWSNav: renderISWSNav,
    renderUFLINav: renderUFLINav,
    renderIMNav: renderIMNav,
    getLessonNavState: getLessonNavState,
    setLessonNavState: setLessonNavState,
    ufliGroupForLesson: ufliGroupForLesson
  };
}

// Wire to global scope
if (typeof window !== "undefined") {
  window.createSpecialistHubCurriculumModule = createSpecialistHubCurriculumModule;
}
