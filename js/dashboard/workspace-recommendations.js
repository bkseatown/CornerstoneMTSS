(function workspaceRecommendationsModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSWorkspaceRecommendations = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createWorkspaceRecommendations() {
  "use strict";

  function toSequencerRoute(moduleName, fallbackHref) {
    var href = String(fallbackHref || "").trim();
    if (href) return href;
    var module = String(moduleName || "");
    if (module === "ReadingLab") return "reading-lab.html";
    if (module === "WritingStudio") return "writing-studio.html";
    if (module === "SentenceStudio") return "sentence-surgery.html";
    if (module === "WordConnections") return "precision-play.html";
    if (module === "PrecisionPlay") return "precision-play.html";
    if (module.indexOf("Numeracy") === 0) return "numeracy.html";
    return "word-quest.html?play=1";
  }

  function renderRecommendedPlan(options) {
    var config = options && typeof options === "object" ? options : {};
    var listEl = config.listEl || null;
    var studentId = String(config.studentId || "");
    var Evidence = config.Evidence || null;
    var SessionPlanner = config.SessionPlanner || null;
    var getSkillLabelSafe = typeof config.getSkillLabelSafe === "function" ? config.getSkillLabelSafe : function () { return "Skill"; };
    var appendStudentParam = typeof config.appendStudentParam === "function" ? config.appendStudentParam : function (value) { return value; };
    if (!listEl) return;
    if (!studentId) {
      listEl.innerHTML = '<p class="td-reco-line">Select a student to generate today\'s micro-plan.</p>';
      return;
    }
    var model = Evidence && typeof Evidence.getSkillModel === "function" ? Evidence.getSkillModel(studentId) : null;
    var rows = SessionPlanner && typeof SessionPlanner.buildDailyPlan === "function"
      ? SessionPlanner.buildDailyPlan({
          studentId: studentId,
          skillModel: model,
          topNeeds: model && Array.isArray(model.topNeeds) ? model.topNeeds : [],
          timeBudgetMin: 20
        })
      : [];
    if (!rows.length) {
      listEl.innerHTML = '<p class="td-reco-line">Run a quick check to auto-build a recommended plan.</p>';
      return;
    }
    listEl.innerHTML = rows.map(function (row) {
      var focusLabel = getSkillLabelSafe(row.focusSkillId || "decoding.short_vowels");
      return [
        '<article class="td-plan-quick-item">',
        '<div><strong>' + row.title + '</strong><p class="td-reco-line">' + focusLabel + '</p></div>',
        '<span class="td-chip">' + row.minutes + ' min</span>',
        '<button class="td-top-btn" type="button" data-reco-launch="' + String(row.href || "word-quest.html?quick=1") + '">Launch</button>',
        '</article>'
      ].join("");
    }).join("");
    Array.prototype.forEach.call(listEl.querySelectorAll("[data-reco-launch]"), function (button) {
      button.addEventListener("click", function () {
        var href = String(button.getAttribute("data-reco-launch") || "word-quest.html?quick=1");
        window.location.href = appendStudentParam("./" + href.replace(/^\.\//, ""));
      });
    });
  }

  function renderInstructionalSequencer(options) {
    var config = options && typeof options === "object" ? options : {};
    var listEl = config.listEl || null;
    var studentId = String(config.studentId || "");
    var InstructionalSequencer = config.InstructionalSequencer || null;
    var SupportStore = config.SupportStore || null;
    var AlignmentLoader = config.AlignmentLoader || null;
    var showAlignment = !!config.showAlignment;
    var formatSkillBreadcrumb = typeof config.formatSkillBreadcrumb === "function" ? config.formatSkillBreadcrumb : function () { return "Foundational skill"; };
    var formatAlignmentLine = typeof config.formatAlignmentLine === "function" ? config.formatAlignmentLine : function () { return ""; };
    var formatAnchorContextLine = typeof config.formatAnchorContextLine === "function" ? config.formatAnchorContextLine : function (line) {
      var text = String(line || "").trim();
      return text ? '<p class="td-sequencer-alignment">Context: ' + text + '</p>' : "";
    };
    var applyInstitutionalAnchorOverlay = typeof config.applyInstitutionalAnchorOverlay === "function"
      ? config.applyInstitutionalAnchorOverlay
      : function (_studentId, rows) { return Array.isArray(rows) ? rows.slice(0, 3) : []; };
    var appendStudentParam = typeof config.appendStudentParam === "function" ? config.appendStudentParam : function (value) { return value; };
    if (!listEl) return;
    if (!studentId) {
      listEl.innerHTML = '<p class="td-reco-line">Select a student to generate 3 ranked instructional moves.</p>';
      return;
    }
    var rows = InstructionalSequencer && typeof InstructionalSequencer.generateInstructionalOptions === "function"
      ? InstructionalSequencer.generateInstructionalOptions(studentId)
      : [];
    rows = applyInstitutionalAnchorOverlay(studentId, rows);
    if (SupportStore && typeof SupportStore.calculateImplementationConsistency === "function") {
      var fidelity = SupportStore.calculateImplementationConsistency(studentId, 21);
      if (fidelity && Number(fidelity.percent || 0) < 40) {
        rows = rows.map(function (row) {
          return Object.assign({}, row, {
            reason: String(row.reason || "") + " Low implementation consistency detected; prioritize structured routine support."
          });
        });
      }
    }
    if (SupportStore && typeof SupportStore.getExecutiveFunction === "function") {
      var ef = SupportStore.getExecutiveFunction(studentId);
      var recentFocus = Array.isArray(ef.focusHistory) ? ef.focusHistory.slice(0, 3) : [];
      if (recentFocus.length >= 3) {
        var lowFocusCount = recentFocus.filter(function (entry) {
          var rating = String(entry && entry.selfRating || "");
          return rating === "Struggled" || rating === "Mostly";
        }).length;
        if (lowFocusCount >= 3) {
          rows = rows.map(function (row) {
            return Object.assign({}, row, {
              reason: String(row.reason || "") + " Low sustained focus detected; begin with 10-min structured sprint."
            });
          });
        }
      }
    }
    if (!Array.isArray(rows) || !rows.length) {
      listEl.innerHTML = '<p class="td-reco-line">No recommendation data yet. Run a quick check and refresh.</p>';
      return;
    }
    listEl.innerHTML = rows.slice(0, 3).map(function (row, idx) {
      var rank = Math.max(1, Math.min(3, Number(row.rank || (idx + 1))));
      var moduleName = String(row.module || "WordQuest");
      var title = String(row.title || "Focused skill reinforcement");
      var skillId = String(row.skillId || "");
      var skillLabel = skillId ? formatSkillBreadcrumb(skillId) : "Foundational skill";
      var duration = Math.max(5, Math.min(10, Number(row.durationMin || 6)));
      var reason = String(row.reason || "Targeted reinforcement based on recent evidence.");
      var alignment = showAlignment && AlignmentLoader && typeof AlignmentLoader.getAlignmentForSkill === "function"
        ? AlignmentLoader.getAlignmentForSkill(skillId)
        : null;
      var anchorContext = showAlignment ? formatAnchorContextLine(row.anchorContext) : "";
      var launchHref = toSequencerRoute(moduleName, row.href);
      return [
        '<article class="td-sequencer-item">',
        '<span class="td-sequencer-rank">' + rank + '</span>',
        '<div class="td-sequencer-main">',
        '<div class="td-sequencer-head"><strong>' + title + '</strong><span class="td-chip">' + moduleName + '</span></div>',
        '<p class="td-sequencer-meta">' + skillLabel + " • " + duration + ' min</p>',
        '<p class="td-sequencer-reason">' + reason + '</p>',
        (showAlignment ? formatAlignmentLine(alignment) : ""),
        anchorContext,
        '</div>',
        '<button class="td-top-btn" type="button" data-sequencer-launch="' + launchHref + '">Start This</button>',
        '</article>'
      ].join("");
    }).join("");
    Array.prototype.forEach.call(listEl.querySelectorAll("[data-sequencer-launch]"), function (button) {
      button.addEventListener("click", function () {
        var launch = String(button.getAttribute("data-sequencer-launch") || "word-quest.html?play=1");
        window.location.href = appendStudentParam("./" + launch.replace(/^\.\//, ""), studentId);
      });
    });
  }

  return {
    renderRecommendedPlan: renderRecommendedPlan,
    renderInstructionalSequencer: renderInstructionalSequencer
  };
});
