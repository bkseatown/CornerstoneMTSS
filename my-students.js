(function caseManagementPage() {
  "use strict";

  var Evidence = window.CSEvidence || null;
  var CaseloadStore = window.CSCaseloadStore || null;
  var SupportStore = window.CSSupportStore || null;
  var TeacherSelectors = window.CSTeacherSelectors || null;
  var TeacherIntelligence = window.CSTeacherIntelligence || null;

  var state = {
    query: "",
    caseload: [],
    selectedPlan: ""
  };

  var el = {
    search: document.getElementById("cm-search-input"),
    studentList: document.getElementById("cm-student-list"),
    dueStrip: document.getElementById("cm-due-strip"),
    planFilters: document.getElementById("cm-plan-filters"),
    dueList: document.getElementById("cm-due-list"),
    caseloadSummary: document.getElementById("cm-caseload-summary")
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function params() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (_err) {
      return new URLSearchParams();
    }
  }

  function loadCaseload() {
    var rows = TeacherSelectors && typeof TeacherSelectors.loadCaseload === "function"
      ? TeacherSelectors.loadCaseload({ CaseloadStore: CaseloadStore, Evidence: Evidence })
      : [];
    if ((!rows || !rows.length) && CaseloadStore && typeof CaseloadStore.seedDemoCaseload === "function") {
      CaseloadStore.seedDemoCaseload();
      rows = TeacherSelectors && typeof TeacherSelectors.loadCaseload === "function"
        ? TeacherSelectors.loadCaseload({ CaseloadStore: CaseloadStore, Evidence: Evidence })
        : [];
    }
    if ((!rows || !rows.length) && CaseloadStore && typeof CaseloadStore.loadCaseload === "function") {
      var seeded = CaseloadStore.loadCaseload();
      rows = seeded && Array.isArray(seeded.students) ? seeded.students.map(function (student) {
        var src = student && typeof student === "object" ? student : {};
        return {
          id: String(src.id || ""),
          name: String(src.name || src.id || "Student"),
          grade: String(src.grade || src.gradeBand || ""),
          gradeBand: String(src.gradeBand || src.grade || ""),
          tier: String(src.tier || ""),
          focus: String(src.focus || src.focusSkill || ""),
          tags: Array.isArray(src.tags) ? src.tags.slice() : [],
          plans: Array.isArray(src.tags) ? src.tags.slice() : []
        };
      }) : [];
    }
    state.caseload = Array.isArray(rows) ? rows : [];
  }

  function planList(student) {
    var src = student && Array.isArray(student.plans) ? student.plans : (student && Array.isArray(student.tags) ? student.tags : []);
    return src.map(function (item) { return String(item || "").toUpperCase(); }).filter(Boolean);
  }

  function filteredCaseload() {
    var q = state.query.toLowerCase();
    if (!q) return state.caseload.slice();
    return state.caseload.filter(function (student) {
      var plans = planList(student);
      return [
        student.name,
        student.grade,
        student.gradeBand,
        student.focus,
        student.tier,
        plans.join(" ")
      ].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function getSummary(student) {
    return TeacherIntelligence && typeof TeacherIntelligence.getStudentSummary === "function"
      ? TeacherIntelligence.getStudentSummary(student.id, student, { Evidence: Evidence, TeacherSelectors: TeacherSelectors })
      : {};
  }

  function supportRow(studentId) {
    return SupportStore && typeof SupportStore.getStudent === "function"
      ? (SupportStore.getStudent(studentId) || {})
      : {};
  }

  function classifyDue(student, summary) {
    var plans = planList(student);
    if (plans.indexOf("BIP") >= 0) return { label: "BIP review", tone: "urgent" };
    if (plans.indexOf("IESP") >= 0) return { label: "Progress update", tone: "watch" };
    if (plans.indexOf("IAP") >= 0) return { label: "Accommodation check", tone: "steady" };
    if (String(summary && summary.risk || "").toLowerCase().indexOf("risk") >= 0) return { label: "Fresh evidence", tone: "watch" };
    return { label: "Routine check", tone: "steady" };
  }

  function applyPlanFilter(rows) {
    if (!state.selectedPlan) return rows.slice();
    return rows.filter(function (student) {
      return planList(student).indexOf(state.selectedPlan) >= 0;
    });
  }

  function buildStudentCard(student) {
    var summary = getSummary(student) || {};
    var support = supportRow(student.id);
    var plans = planList(student);
    var due = classifyDue(student, summary);
    var interventions = Array.isArray(support.interventions) ? support.interventions : [];
    var goals = Array.isArray(support.goals) ? support.goals : [];
    return [
      '<a class="cm-student-card" href="./student-profile.html?student=' + encodeURIComponent(student.id) + '">',
      '  <div class="cm-student-card-top">',
      '    <div><strong>' + esc(student.name || "Student") + '</strong><p>' + esc([student.gradeBand || student.grade || "", summary.focus || student.focus || "Support"].filter(Boolean).join(" · ")) + '</p></div>',
      '    <span class="cm-tier">' + esc(String(student.tier || "tier2").replace("tier", "T")) + '</span>',
      '  </div>',
      '  <div class="cm-student-meta">',
      '    <span class="cm-risk" data-risk="' + esc((summary.risk || "monitor").toLowerCase()) + '">' + esc(summary.risk || "monitor") + '</span>',
      '    <span class="cm-status-pill" data-tone="' + esc(due.tone) + '">' + esc(due.label) + '</span>',
      '  </div>',
      '  <div class="cm-chip-row">' + plans.map(function (plan) {
        return '<span class="cm-chip">' + esc(plan) + '</span>';
      }).join("") + '</div>',
      '  <p>' + esc(interventions[0] && (interventions[0].title || interventions[0].detail) || goals[0] && (goals[0].target || goals[0].skill) || "Open student record.") + '</p>',
      '</a>'
    ].join("");
  }

  function renderSummary(rows) {
    var students = rows.length;
    var planCount = rows.reduce(function (sum, student) { return sum + planList(student).length; }, 0);
    var urgent = rows.filter(function (student) {
      return classifyDue(student, getSummary(student)).tone === "urgent";
    }).length;
    el.caseloadSummary.innerHTML = [
      '<span class="cm-summary-chip">' + esc(String(students)) + ' students</span>',
      '<span class="cm-summary-chip">' + esc(String(planCount)) + ' active plans</span>',
      '<span class="cm-summary-chip">' + esc(String(urgent)) + ' urgent reviews</span>'
    ].join("");
  }

  function renderDue(rows) {
    var cards = rows.slice().sort(function (a, b) {
      var toneA = classifyDue(a, getSummary(a)).tone;
      var toneB = classifyDue(b, getSummary(b)).tone;
      return ["urgent", "watch", "steady"].indexOf(toneA) - ["urgent", "watch", "steady"].indexOf(toneB);
    }).slice(0, 5).map(function (student) {
      var summary = getSummary(student) || {};
      var due = classifyDue(student, summary);
      return [
        '<article class="cm-task-card">',
        '  <span>' + esc(due.label) + '</span>',
        '  <strong>' + esc(student.name || "Student") + '</strong>',
        '  <p>' + esc([student.gradeBand || student.grade || "", summary.focus || student.focus || "Support"].filter(Boolean).join(" · ")) + '</p>',
        '</article>'
      ].join("");
    });
    el.dueList.innerHTML = cards.length ? cards.join("") : '<p class="cm-empty">No urgent casework is waiting right now.</p>';
  }

  function renderDueStrip(rows) {
    var counts = { urgent: 0, watch: 0, steady: 0 };
    rows.forEach(function (student) {
      counts[classifyDue(student, getSummary(student)).tone] += 1;
    });
    el.dueStrip.innerHTML = [
      '<span class="cm-status-pill" data-tone="urgent">' + esc(String(counts.urgent)) + ' review now</span>',
      '<span class="cm-status-pill" data-tone="watch">' + esc(String(counts.watch)) + ' collect evidence</span>',
      '<span class="cm-status-pill" data-tone="steady">' + esc(String(counts.steady)) + ' routine checks</span>'
    ].join("");
  }

  function renderPlanFilters(rows) {
    var counts = {};
    rows.forEach(function (student) {
      planList(student).forEach(function (plan) {
        counts[plan] = (counts[plan] || 0) + 1;
      });
    });
    var plans = ["IESP", "IP", "IAP", "BIP", "FBA", "EF"];
    el.planFilters.innerHTML = plans.map(function (plan) {
      var count = counts[plan] || 0;
      return '<button class="cm-filter-chip" data-plan="' + esc(plan) + '" data-active="' + esc(String(state.selectedPlan === plan)) + '" type="button">' + esc(plan) + ' · ' + esc(String(count)) + '</button>';
    }).join("");
  }

  function render() {
    var searched = filteredCaseload();
    var rows = applyPlanFilter(searched);
    renderDueStrip(searched);
    renderPlanFilters(state.caseload);
    renderSummary(rows);
    renderDue(rows);
    el.studentList.innerHTML = rows.length ? rows.map(buildStudentCard).join("") : '<p class="cm-empty">No students match this filter.</p>';
  }

  function bind() {
    if (!el.search) return;
    el.search.addEventListener("input", function () {
      state.query = text(el.search.value);
      render();
    });
    document.addEventListener("click", function (event) {
      var button = event.target && typeof event.target.closest === "function"
        ? event.target.closest(".cm-filter-chip")
        : null;
      if (!button) return;
      var plan = text(button.getAttribute("data-plan")).toUpperCase();
      state.selectedPlan = state.selectedPlan === plan ? "" : plan;
      render();
    });
  }

  function init() {
    state.selectedPlan = text(params().get("panel")).toUpperCase();
    loadCaseload();
    bind();
    render();
  }

  init();
})();
