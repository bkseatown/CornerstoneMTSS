(function hubBriefIntelligenceModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSHubBriefIntelligence = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createHubBriefIntelligenceModule() {
  "use strict";

  function createEngine() {
    function describeOutcomeMemory(item) {
      if (!item) return "";
      if (Number(item.notYetCount || 0) > 0) {
        return item.notYetCount + " recent move" + (item.notYetCount === 1 ? " still needs" : "s still need") + " another pass here.";
      }
      if (Number(item.helpedCount || 0) > 0) {
        return "Last move helped " + item.helpedCount + " student" + (item.helpedCount === 1 ? "" : "s") + " in this block.";
      }
      return "";
    }

    function detectSharedPattern(item) {
      var students = item && item.contextData && item.contextData.derived && Array.isArray(item.contextData.derived.students)
        ? item.contextData.derived.students
        : [];
      var supports = {};
      students.forEach(function (student) {
        var tag = String((student && student.relatedSupport && student.relatedSupport[0]) || student && student.primaryGoal || "").trim();
        if (!tag) return;
        supports[tag] = (supports[tag] || 0) + 1;
      });
      var bestLabel = "";
      var bestCount = 0;
      Object.keys(supports).forEach(function (key) {
        if (supports[key] > bestCount) {
          bestLabel = key;
          bestCount = supports[key];
        }
      });
      if (bestCount >= 2) {
        return bestCount + " students in this block are showing the same need: " + bestLabel + ".";
      }
      return "";
    }

    function buildGroupSuggestion(item) {
      var students = item && item.contextData && item.contextData.derived && Array.isArray(item.contextData.derived.students)
        ? item.contextData.derived.students
        : [];
      var groups = {};
      students.forEach(function (student) {
        var label = String((student && student.relatedSupport && student.relatedSupport[0]) || student && student.primaryGoal || "").trim();
        if (!label) return;
        groups[label] = groups[label] || [];
        groups[label].push(student.name || "Student");
      });
      var bestLabel = "";
      var bestNames = [];
      Object.keys(groups).forEach(function (key) {
        if (groups[key].length > bestNames.length) {
          bestLabel = key;
          bestNames = groups[key];
        }
      });
      if (bestNames.length < 2) return null;
      return {
        label: bestLabel,
        names: bestNames.slice(0, 3),
        count: bestNames.length
      };
    }

    function buildGroupPlanText(block, item, suggestion) {
      if (!suggestion) return "";
      var blockLabel = block && (block.label || block.classSection || block.subject) || "This block";
      return [
        "Small-group plan",
        blockLabel,
        "Focus: " + suggestion.label,
        "Students: " + suggestion.names.join(", "),
        "Move: Pull this group first for a quick scaffold before whole-group release."
      ].join("\n");
    }

    function buildBlockOutputText(kind, block, item) {
      var blockLabel = block && (block.label || block.classSection || block.subject) || "This block";
      var teacher = block && block.teacher || "Teacher";
      var time = block && block.timeLabel || "";
      var supportCount = Number(item && item.supportCount || 0);
      var reason = String(item && item.reason || "");
      var pattern = detectSharedPattern(item);
      var suggestion = buildGroupSuggestion(item);
      var actionLabel = "Recommended first move: " + (item && item.angle || "Priority support");
      var groupLine = suggestion
        ? "Suggested group: " + suggestion.names.join(", ") + " for " + suggestion.label + "."
        : "";
      if (kind === "team") {
        return [
          "Team update",
          blockLabel + (time ? " (" + time + ")" : ""),
          "Lead: " + teacher,
          "Priority load: " + supportCount + " student" + (supportCount === 1 ? "" : "s") + ".",
          actionLabel,
          pattern,
          groupLine,
          describeOutcomeMemory(item),
          reason
        ].filter(Boolean).join("\n");
      }
      if (kind === "family") {
        return [
          "Family update draft",
          "Today we are getting ready for " + blockLabel + (time ? " during " + time + "." : "."),
          "Our first support move will focus on helping students enter the lesson successfully.",
          pattern ? "A shared focus we are watching is " + pattern.replace(/^\d+ students in this block are showing the same need:\s*/i, "").replace(/\.$/, "") + "." : "",
          suggestion ? "We may pull a brief small group for " + suggestion.label + " support." : "",
          describeOutcomeMemory(item),
          reason
        ].filter(Boolean).join("\n");
      }
      return [
        "Intervention snapshot",
        blockLabel + (time ? " · " + time : ""),
        "Priority students: " + supportCount,
        actionLabel,
        pattern,
        groupLine,
        describeOutcomeMemory(item),
        reason
      ].filter(Boolean).join("\n");
    }

    return {
      buildBlockOutputText: buildBlockOutputText,
      describeOutcomeMemory: describeOutcomeMemory,
      detectSharedPattern: detectSharedPattern,
      buildGroupSuggestion: buildGroupSuggestion,
      buildGroupPlanText: buildGroupPlanText
    };
  }

  return {
    createEngine: createEngine
  };
});
