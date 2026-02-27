(function growthReportEngineModule() {
  "use strict";

  var schema = window.CSStorageSchema || null;
  var HISTORY_KEY = "cs_progress_history";

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function safeLoad(key, fallback) {
    if (schema && typeof schema.safeLoadJSON === "function") {
      return schema.safeLoadJSON(key, fallback);
    }
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function toLabel(skill) {
    if (skill === "verb_precision") return "verb precision";
    return String(skill || "");
  }

  function summarizeDelta(skill, startLevels, endLevels) {
    var s = Number(startLevels && startLevels[skill] || 0);
    var e = Number(endLevels && endLevels[skill] || 0);
    var delta = Number((e - s).toFixed(1));
    if (delta > 0) return "+" + delta + " level over 4 weeks";
    if (delta < 0) return delta + " level over 4 weeks";
    return "stable";
  }

  function generateGrowthReport(studentData, timeframe) {
    var student = studentData && typeof studentData === "object" ? studentData : {};
    var name = String(student.name || "Student");
    var levels = student.levels || {};
    var history = Array.isArray(student.history) ? student.history : [];
    if (!history.length && student.studentId) {
      var all = safeLoad(HISTORY_KEY, {});
      history = Array.isArray(all[student.studentId]) ? all[student.studentId] : [];
    }

    var first = history.length ? history[0] : { skillLevels: levels };
    var last = history.length ? history[history.length - 1] : { skillLevels: levels };

    var skills = ["reasoning", "detail", "verb_precision", "cohesion"];
    var sorted = skills.slice().sort(function (a, b) {
      return Number(levels[a] || 0) - Number(levels[b] || 0);
    });

    var strengths = sorted.slice(2).map(function (k) {
      return toLabel(k) + " at Level " + String(clamp(Number(levels[k] || 0) + 1, 1, 3));
    });

    var growthAreas = sorted.slice(0, 2).map(function (k) {
      return "Increase " + toLabel(k) + " from Level " + String(clamp(Number(levels[k] || 0) + 1, 1, 3)) + " to next progression step";
    });

    var report = {
      summary: name + " shows tier-aligned writing growth with strongest performance in " + toLabel(sorted[3]) + ".",
      strengths: strengths,
      growthAreas: growthAreas,
      measurableProgress: {
        reasoning: summarizeDelta("reasoning", first.skillLevels, last.skillLevels),
        cohesion: summarizeDelta("cohesion", first.skillLevels, last.skillLevels),
        detail: summarizeDelta("detail", first.skillLevels, last.skillLevels)
      },
      recommendedFocus: "Prioritize " + toLabel(sorted[0]) + " in the next " + String(timeframe || "4-week") + " cycle."
    };

    return report;
  }

  function reportHtml(studentName, timeframe, report) {
    var esc = function (s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    return [
      "<!doctype html>",
      "<html><head><meta charset='utf-8'><title>Growth Report</title>",
      "<style>",
      "body{font-family:Atkinson Hyperlegible,Segoe UI,sans-serif;padding:24px;color:#1b2632}",
      ".card{border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin:10px 0}",
      "h1,h2{margin:0 0 8px}",
      "ul{margin:8px 0 0 18px}",
      "@media print{body{padding:8px}.no-print{display:none}}",
      "</style></head><body>",
      "<h1>IEP-Style Growth Report</h1>",
      "<div><strong>Student:</strong> " + esc(studentName) + "</div>",
      "<div><strong>Timeframe:</strong> " + esc(timeframe) + "</div>",
      "<div class='card'><h2>Summary</h2><div>" + esc(report.summary) + "</div></div>",
      "<div class='card'><h2>Strengths</h2><ul>" + report.strengths.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>",
      "<div class='card'><h2>Growth Areas</h2><ul>" + report.growthAreas.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>",
      "<div class='card'><h2>Measurable Progress</h2>",
      "<div>Reasoning: " + esc(report.measurableProgress.reasoning) + "</div>",
      "<div>Cohesion: " + esc(report.measurableProgress.cohesion) + "</div>",
      "<div>Detail: " + esc(report.measurableProgress.detail) + "</div>",
      "</div>",
      "<div class='card'><h2>Recommended Focus</h2><div>" + esc(report.recommendedFocus) + "</div></div>",
      "<button class='no-print' onclick='window.print()'>Print / Save PDF</button>",
      "</body></html>"
    ].join("");
  }

  function openPrintableReport(studentName, timeframe, report) {
    var popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return false;
    popup.document.open();
    popup.document.write(reportHtml(studentName, timeframe, report));
    popup.document.close();
    return true;
  }

  window.CSGrowthReportEngine = {
    generateGrowthReport: generateGrowthReport,
    reportHtml: reportHtml,
    openPrintableReport: openPrintableReport
  };
})();
