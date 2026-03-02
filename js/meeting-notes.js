(function meetingNotesModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSMeetingNotes = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var templates = {
    SSM: {
      agenda: "Data review, support barriers, immediate next steps",
      concerns: "Classroom access and consistency with accommodations",
      strengths: "Student engagement moments and recent growth",
      dataReviewed: "MAP / classroom work samples / intervention logs"
    },
    MDT: {
      agenda: "Multi-disciplinary review and referral readiness",
      concerns: "Cross-setting impact and fidelity of supports",
      strengths: "Progress in targeted domain and participation",
      dataReviewed: "Tier 1/2 logs, progress trends, accommodations implementation"
    },
    Parent: {
      agenda: "Home-school partnership goals and practical supports",
      concerns: "Completion stress and confidence dips",
      strengths: "Effort, strengths, and interests to leverage",
      dataReviewed: "Recent class samples and intervention highlights"
    }
  };

  function toActionItems(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .slice(0, 8)
      .map(function (line, idx) {
        return {
          id: "act_" + Date.now().toString(36) + "_" + idx,
          text: line,
          owner: "",
          dueDate: ""
        };
      });
  }

  function toDraftGoals(actionItems) {
    var rows = Array.isArray(actionItems) ? actionItems : [];
    return rows.slice(0, 5).map(function (item, idx) {
      return {
        id: "goal_" + Date.now().toString(36) + "_" + idx,
        domain: "literacy",
        skill: item.text.slice(0, 90),
        baseline: "Current classroom baseline",
        target: "Measurable improvement in 6-8 weeks",
        metric: "Teacher + intervention evidence",
        method: "Weekly progress check",
        schedule: "2-3x/week",
        reviewEveryDays: 14,
        notes: "Converted from meeting action item"
      };
    });
  }

  return {
    templates: templates,
    toActionItems: toActionItems,
    toDraftGoals: toDraftGoals
  };
});
