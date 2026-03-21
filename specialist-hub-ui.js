/**
 * specialist-hub-ui.js — Complete UI Rendering Layer
 *
 * Responsibility surface:
 * - Render caseload lists and student profiles
 * - Render individual student reports (progress by 6 skill domains)
 * - Render collective reports dashboard (aggregate caseload data)
 * - Render Specialist Hub schedule view and lesson briefs
 * - Support domain-based reporting (Math, Reading, Writing, Speaking, Listening, EF/LB)
 *
 * Extracted from specialist-hub.js (~500+ lines)
 * Enables testable, composable UI rendering independent of event handlers
 */

function createSpecialistHubUIModule(deps) {
  "use strict";

  var escapeHtml = deps.escapeHtml || function (str) { return String(str).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); };

  /* ── Domain Definitions ──────────────────────────────────────────── */

  var SKILL_DOMAINS = {
    math: { name: "Math", color: "#3B82F6", icon: "🔢" },
    reading: { name: "Reading", color: "#EF4444", icon: "📖" },
    writing: { name: "Writing", color: "#8B5CF6", icon: "✍️" },
    speaking: { name: "Speaking", color: "#F59E0B", icon: "🗣️" },
    listening: { name: "Listening", color: "#10B981", icon: "👂" },
    ef_lb: { name: "Executive Function/Learning Behaviors", color: "#6366F1", icon: "🧠" }
  };

  /* ── CASELOAD LIST RENDERING ────────────────────────────────────── */

  /**
   * Render full caseload list for My Students view
   */
  function renderCaseloadList(students, options) {
    var opts = options || {};
    var showTier = opts.showTier !== false;
    var showProgram = opts.showProgram !== false;
    var maxStudents = opts.maxStudents || 100;

    var html = "<div class=\"hub-caseload-list\">";

    if (!students || students.length === 0) {
      html += "<div class=\"hub-empty-state\">No students in caseload.</div>";
      html += "</div>";
      return html;
    }

    html += "<div class=\"hub-caseload-count\">" + students.length + " student" + (students.length !== 1 ? "s" : "") + "</div>";
    html += "<ul class=\"hub-student-list\">";

    for (var i = 0; i < Math.min(students.length, maxStudents); i++) {
      var student = students[i];
      html += "<li class=\"hub-student-list-item\" data-student-id=\"" + escapeHtml(student.id || "") + "\">";
      html += renderStudentCard(student, { tier: showTier, program: showProgram, compact: true });
      html += "</li>";
    }

    html += "</ul>";
    html += "</div>";
    return html;
  }

  /**
   * Render individual student card
   */
  function renderStudentCard(student, options) {
    var opts = options || {};
    var showTier = opts.tier !== false;
    var showProgram = opts.program !== false;
    var compact = opts.compact === true;

    var html = "<div class=\"hub-student-card" + (compact ? " hub-student-card--compact" : "") + "\">";

    html += "<div class=\"hub-student-header\">";
    html += "<div class=\"hub-student-name\">" + escapeHtml(student.name || "Unknown Student") + "</div>";
    if (!compact && student.studentId) {
      html += "<div class=\"hub-student-id\">ID: " + escapeHtml(student.studentId) + "</div>";
    }
    html += "</div>";

    if (!compact) {
      html += "<div class=\"hub-student-meta\">";
      if (showTier && student.tier) {
        html += "<span class=\"hub-student-tier\">" + escapeHtml(student.tier) + "</span>";
      }
      if (showProgram && student.program) {
        html += "<span class=\"hub-student-program\">" + escapeHtml(student.program) + "</span>";
      }
      html += "</div>";
    }

    if (!compact && student.notes) {
      html += "<div class=\"hub-student-notes\">" + escapeHtml((student.notes || "").substring(0, 100)) + "</div>";
    }

    html += "</div>";
    return html;
  }

  /**
   * Render student profile view
   */
  function renderStudentProfile(student) {
    var html = "<div class=\"hub-student-profile\">";

    html += "<div class=\"hub-profile-header\">";
    html += "<h2 class=\"hub-profile-name\">" + escapeHtml(student.name || "Student Profile") + "</h2>";
    html += "</div>";

    html += "<div class=\"hub-profile-section\">";
    html += "<h3 class=\"hub-section-title\">Student Information</h3>";
    html += "<div class=\"hub-profile-grid\">";
    html += "<div class=\"hub-profile-field\"><label>Student ID:</label> <span>" + escapeHtml(student.studentId || "N/A") + "</span></div>";
    html += "<div class=\"hub-profile-field\"><label>Tier:</label> <span>" + escapeHtml(student.tier || "N/A") + "</span></div>";
    html += "<div class=\"hub-profile-field\"><label>Primary Program:</label> <span>" + escapeHtml(student.program || "N/A") + "</span></div>";
    html += "<div class=\"hub-profile-field\"><label>Status:</label> <span>" + escapeHtml(student.status || "Active") + "</span></div>";
    html += "</div>";
    html += "</div>";

    if (student.notes) {
      html += "<div class=\"hub-profile-section\">";
      html += "<h3 class=\"hub-section-title\">Notes</h3>";
      html += "<p class=\"hub-profile-notes\">" + escapeHtml(student.notes) + "</p>";
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  /* ── DOMAIN-BASED PROGRESS RENDERING ────────────────────────────── */

  /**
   * Render progress bar for a single domain
   */
  function renderDomainProgressBar(domainKey, progressPercent, options) {
    var opts = options || {};
    var domain = SKILL_DOMAINS[domainKey];
    if (!domain) return "";

    var percent = Math.min(100, Math.max(0, progressPercent || 0));
    var html = "<div class=\"hub-domain-progress\">";
    html += "<div class=\"hub-domain-label\">";
    html += "<span class=\"hub-domain-icon\">" + domain.icon + "</span>";
    html += "<span class=\"hub-domain-name\">" + domain.name + "</span>";
    html += "</div>";
    html += "<div class=\"hub-progress-bar\">";
    html += "<div class=\"hub-progress-fill\" style=\"width: " + percent + "%; background-color: " + domain.color + ";\"></div>";
    html += "</div>";
    html += "<div class=\"hub-progress-percent\">" + percent + "%</div>";
    html += "</div>";
    return html;
  }

  /**
   * Render student progress across all 6 domains
   */
  function renderStudentDomainProgress(student) {
    var html = "<div class=\"hub-student-domain-progress\">";
    html += "<h3 class=\"hub-section-title\">Progress by Domain</h3>";

    Object.keys(SKILL_DOMAINS).forEach(function (domainKey) {
      var progress = student.domainProgress && student.domainProgress[domainKey] || 0;
      html += renderDomainProgressBar(domainKey, progress);
    });

    html += "</div>";
    return html;
  }

  /**
   * Render individual student report
   */
  function renderStudentReport(student) {
    var html = "<div class=\"hub-student-report\">";

    html += "<div class=\"hub-report-header\">";
    html += "<h2>" + escapeHtml(student.name) + " - Progress Report</h2>";
    html += "<div class=\"hub-report-meta\">As of " + new Date().toLocaleDateString() + "</div>";
    html += "</div>";

    html += "<div class=\"hub-report-section\">";
    html += renderStudentDomainProgress(student);
    html += "</div>";

    if (student.interventions && student.interventions.length > 0) {
      html += "<div class=\"hub-report-section\">";
      html += "<h3 class=\"hub-section-title\">Active Interventions</h3>";
      html += "<ul class=\"hub-intervention-list\">";
      for (var i = 0; i < student.interventions.length; i++) {
        var intervention = student.interventions[i];
        html += "<li>";
        html += "<strong>" + escapeHtml(intervention.name) + "</strong>";
        if (intervention.startDate) {
          html += " <span class=\"hub-intervention-date\">Started " + escapeHtml(intervention.startDate) + "</span>";
        }
        html += "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (student.goals && student.goals.length > 0) {
      html += "<div class=\"hub-report-section\">";
      html += "<h3 class=\"hub-section-title\">IEP/IAP Goals</h3>";
      html += "<ul class=\"hub-goal-list\">";
      for (var i = 0; i < student.goals.length; i++) {
        var goal = student.goals[i];
        var progress = goal.progress || 0;
        html += "<li class=\"hub-goal-item\">";
        html += "<div class=\"hub-goal-text\">" + escapeHtml(goal.description) + "</div>";
        html += "<div class=\"hub-goal-progress\">";
        html += "<div class=\"hub-progress-bar\"><div class=\"hub-progress-fill\" style=\"width: " + progress + "%;\"></div></div>";
        html += "<span>" + progress + "% complete</span>";
        html += "</div>";
        html += "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  /* ── COLLECTIVE REPORTS DASHBOARD ────────────────────────────────── */

  /**
   * Render tier distribution summary
   */
  function renderTierDistribution(caseload) {
    var counts = { "Tier 1": 0, "Tier 2": 0, "Tier 3": 0 };
    (caseload || []).forEach(function (student) {
      if (student.tier && counts.hasOwnProperty(student.tier)) {
        counts[student.tier]++;
      }
    });

    var total = caseload ? caseload.length : 0;
    var html = "<div class=\"hub-report-card\">";
    html += "<h3 class=\"hub-card-title\">Tier Distribution</h3>";

    Object.keys(counts).forEach(function (tier) {
      var count = counts[tier];
      var percent = total > 0 ? Math.round((count / total) * 100) : 0;
      html += "<div class=\"hub-tier-row\">";
      html += "<span class=\"hub-tier-label\">" + tier + "</span>";
      html += "<div class=\"hub-tier-bar\">";
      html += "<div class=\"hub-tier-fill\" style=\"width: " + percent + "%;\"></div>";
      html += "</div>";
      html += "<span class=\"hub-tier-count\">" + count + " (" + percent + "%)</span>";
      html += "</div>";
    });

    html += "</div>";
    return html;
  }

  /**
   * Render domain performance summary for entire caseload
   */
  function renderCaseloadDomainSummary(caseload) {
    var domainAverages = {};

    Object.keys(SKILL_DOMAINS).forEach(function (domainKey) {
      domainAverages[domainKey] = 0;
    });

    if (caseload && caseload.length > 0) {
      caseload.forEach(function (student) {
        Object.keys(SKILL_DOMAINS).forEach(function (domainKey) {
          var progress = student.domainProgress && student.domainProgress[domainKey] || 0;
          domainAverages[domainKey] += progress;
        });
      });

      Object.keys(domainAverages).forEach(function (domainKey) {
        domainAverages[domainKey] = Math.round(domainAverages[domainKey] / caseload.length);
      });
    }

    var html = "<div class=\"hub-report-card\">";
    html += "<h3 class=\"hub-card-title\">Caseload Performance by Domain</h3>";

    Object.keys(SKILL_DOMAINS).forEach(function (domainKey) {
      html += renderDomainProgressBar(domainKey, domainAverages[domainKey], { showLabel: true });
    });

    html += "</div>";
    return html;
  }

  /**
   * Render intervention effectiveness summary
   */
  function renderInterventionSummary(caseload) {
    var interventionMap = {};

    (caseload || []).forEach(function (student) {
      (student.interventions || []).forEach(function (intervention) {
        if (!interventionMap[intervention.name]) {
          interventionMap[intervention.name] = { count: 0, avgProgress: 0 };
        }
        interventionMap[intervention.name].count++;
        var studentProgress = student.domainProgress && student.domainProgress[intervention.targetDomain] || 0;
        interventionMap[intervention.name].avgProgress += studentProgress;
      });
    });

    Object.keys(interventionMap).forEach(function (name) {
      if (interventionMap[name].count > 0) {
        interventionMap[name].avgProgress = Math.round(interventionMap[name].avgProgress / interventionMap[name].count);
      }
    });

    var html = "<div class=\"hub-report-card\">";
    html += "<h3 class=\"hub-card-title\">Intervention Effectiveness</h3>";
    html += "<ul class=\"hub-intervention-summary\">";

    Object.keys(interventionMap).forEach(function (name) {
      var data = interventionMap[name];
      html += "<li class=\"hub-intervention-summary-item\">";
      html += "<div class=\"hub-intervention-name\">" + escapeHtml(name) + "</div>";
      html += "<div class=\"hub-intervention-stats\">";
      html += "<span class=\"hub-stat-count\">" + data.count + " student" + (data.count !== 1 ? "s" : "") + "</span>";
      html += "<span class=\"hub-stat-avg\">Avg progress: " + data.avgProgress + "%</span>";
      html += "</div>";
      html += "</li>";
    });

    html += "</ul>";
    html += "</div>";
    return html;
  }

  /**
   * Render complete collective reports dashboard
   */
  function renderCollectiveReportsDashboard(caseload) {
    var html = "<div class=\"hub-collective-reports\">";
    html += "<h2 class=\"hub-dashboard-title\">Collective Reports Dashboard</h2>";

    html += "<div class=\"hub-reports-grid\">";
    html += renderTierDistribution(caseload);
    html += renderCaseloadDomainSummary(caseload);
    html += renderInterventionSummary(caseload);
    html += "</div>";

    html += "</div>";
    return html;
  }

  /* ── SPECIALIST HUB SCHEDULE & LESSON BRIEF ────────────────────── */

  /**
   * Render lesson brief panel (SWBAT, teaching points, support moves)
   */
  function renderLessonBrief(lessonData, options) {
    var opts = options || {};
    var html = "<div class=\"hub-lesson-brief\">";

    if (lessonData.title) {
      html += "<div class=\"hub-brief-header\">";
      html += "<h3 class=\"hub-brief-title\">" + escapeHtml(lessonData.title) + "</h3>";
      if (lessonData.curriculum) {
        html += "<div class=\"hub-brief-curriculum\">" + escapeHtml(lessonData.curriculum) + "</div>";
      }
      html += "</div>";
    }

    if (lessonData.focus) {
      html += "<div class=\"hub-brief-section\">";
      html += "<div class=\"hub-brief-label\">Today's Focus</div>";
      html += "<div class=\"hub-brief-content\">" + escapeHtml(lessonData.focus) + "</div>";
      html += "</div>";
    }

    if (lessonData.swbat && lessonData.swbat.length > 0) {
      html += "<div class=\"hub-brief-section\">";
      html += "<div class=\"hub-brief-label\">SWBAT</div>";
      html += "<ul class=\"hub-brief-list\">";
      for (var i = 0; i < lessonData.swbat.length; i++) {
        html += "<li>" + escapeHtml(lessonData.swbat[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lessonData.teachingPoints && lessonData.teachingPoints.length > 0) {
      html += "<div class=\"hub-brief-section\">";
      html += "<div class=\"hub-brief-label\">Key Teaching Points</div>";
      html += "<ul class=\"hub-brief-list\">";
      for (var i = 0; i < lessonData.teachingPoints.length; i++) {
        html += "<li>" + escapeHtml(lessonData.teachingPoints[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lessonData.supportMoves && lessonData.supportMoves.length > 0) {
      html += "<div class=\"hub-brief-section hub-support-moves\">";
      html += "<div class=\"hub-brief-label\">Support Moves</div>";
      html += "<ul class=\"hub-brief-list\">";
      for (var i = 0; i < lessonData.supportMoves.length; i++) {
        html += "<li>" + escapeHtml(lessonData.supportMoves[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  /**
   * Render block roster (students in current lesson block)
   */
  function renderBlockRoster(blockStudents, blockInfo) {
    var html = "<div class=\"hub-block-roster\">";

    if (blockInfo) {
      html += "<div class=\"hub-block-header\">";
      html += "<h3 class=\"hub-block-time\">" + escapeHtml(blockInfo.time || "") + "</h3>";
      if (blockInfo.teacher) {
        html += "<div class=\"hub-block-teacher\">" + escapeHtml(blockInfo.teacher) + "</div>";
      }
      html += "</div>";
    }

    html += "<div class=\"hub-roster-count\">" + (blockStudents || []).length + " student" + ((blockStudents || []).length !== 1 ? "s" : "") + "</div>";

    if (!blockStudents || blockStudents.length === 0) {
      html += "<div class=\"hub-empty-state\">No students in this block.</div>";
    } else {
      html += "<ul class=\"hub-roster-list\">";
      for (var i = 0; i < blockStudents.length; i++) {
        html += "<li class=\"hub-roster-item\" data-student-id=\"" + escapeHtml(blockStudents[i].id || "") + "\">";
        html += renderStudentCard(blockStudents[i], { compact: true });
        html += "</li>";
      }
      html += "</ul>";
    }

    html += "</div>";
    return html;
  }

  /* ── Public API ────────────────────────────────────────────────── */

  return {
    // Caseload and profiles
    renderCaseloadList: renderCaseloadList,
    renderStudentCard: renderStudentCard,
    renderStudentProfile: renderStudentProfile,

    // Domain-based progress
    renderStudentDomainProgress: renderStudentDomainProgress,
    renderDomainProgressBar: renderDomainProgressBar,
    renderStudentReport: renderStudentReport,

    // Collective reports
    renderCollectiveReportsDashboard: renderCollectiveReportsDashboard,
    renderTierDistribution: renderTierDistribution,
    renderCaseloadDomainSummary: renderCaseloadDomainSummary,
    renderInterventionSummary: renderInterventionSummary,

    // Specialist Hub
    renderLessonBrief: renderLessonBrief,
    renderBlockRoster: renderBlockRoster,

    // Utilities
    SKILL_DOMAINS: SKILL_DOMAINS
  };
}

// Wire to global scope for specialist-hub.js
if (typeof window !== "undefined") {
  window.createSpecialistHubUIModule = createSpecialistHubUIModule;
}
