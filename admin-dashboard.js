(function adminDashboardRuntime() {
  "use strict";

  var schema = window.CSStorageSchema || null;
  if (schema && typeof schema.migrateStorageIfNeeded === "function") {
    schema.migrateStorageIfNeeded();
  }

  var schoolMetricsEl = document.getElementById("admin-school-metrics");
  var classBarsEl = document.getElementById("admin-class-bars");
  var trendInsightsEl = document.getElementById("admin-trend-insights");

  if (!schoolMetricsEl || !classBarsEl || !trendInsightsEl || !window.CSMultiClassEngine) return;

  function renderStorageWarningIfNeeded() {
    if (!schema || typeof schema.getMigrationStatus !== "function") return;
    var status = schema.getMigrationStatus();
    if (!status || !status.corruptionDetected || !Array.isArray(status.backups) || !status.backups.length) return;
    if (document.getElementById("cs-storage-warning")) return;
    var banner = document.createElement("div");
    banner.id = "cs-storage-warning";
    banner.className = "admin-trend";
    banner.textContent = "Storage was reset due to invalid data. A backup was saved.";
    var root = document.getElementById("admin-root");
    if (root) root.insertBefore(banner, root.firstChild);
  }

  function pct(rate) {
    return window.CSMultiClassEngine.toPercent(rate);
  }

  function animateBar(el, percent) {
    if (!el) return;
    el.style.width = "0%";
    requestAnimationFrame(function () {
      el.style.width = String(Math.max(0, Math.min(100, percent))) + "%";
    });
  }

  function metricRow(label, valueText, percent) {
    return [
      '<div class="admin-metric">',
      '  <div class="admin-metric-head"><span>' + label + '</span><span>' + valueText + '</span></div>',
      '  <div class="admin-bar"><div class="admin-bar-fill" data-fill="' + percent + '"></div></div>',
      '</div>'
    ].join("");
  }

  function renderSnapshot(snapshot, classCount, lastUpdated) {
    var detailPct = Math.round(Math.max(0, Math.min(100, snapshot.avgDetail * 20)));
    var cohesionPct = Math.round(Math.max(0, Math.min(100, snapshot.avgCohesion * 20)));

    schoolMetricsEl.innerHTML = [
      metricRow("Reasoning Rate", pct(snapshot.reasoningRate) + "%", pct(snapshot.reasoningRate)),
      metricRow("Complex Sentence Rate", pct(snapshot.complexRate) + "%", pct(snapshot.complexRate)),
      metricRow("Average Detail", snapshot.avgDetail.toFixed(2) + " / 5", detailPct),
      metricRow("Average Cohesion", snapshot.avgCohesion.toFixed(2) + " / 5", cohesionPct),
      '<div class="admin-muted">Classes: ' + classCount + ' • Total sentences: ' + snapshot.totalSentences + ' • Last updated: ' + (lastUpdated ? new Date(lastUpdated).toLocaleString() : "N/A") + '</div>'
    ].join("");

    Array.prototype.forEach.call(schoolMetricsEl.querySelectorAll("[data-fill]"), function (fill) {
      animateBar(fill, Number(fill.getAttribute("data-fill") || 0));
    });
  }

  function classCard(row) {
    return [
      '<div class="admin-class-card">',
      '  <div class="admin-class-title">' + row.classId + '</div>',
      metricRow("Reasoning", pct(row.reasoningRate) + "%", pct(row.reasoningRate)),
      metricRow("Complex", pct(row.complexRate) + "%", pct(row.complexRate)),
      metricRow("Detail", row.avgDetail.toFixed(2) + " / 5", Math.round(row.avgDetail * 20)),
      metricRow("Cohesion", row.avgCohesion.toFixed(2) + " / 5", Math.round(row.avgCohesion * 20)),
      '</div>'
    ].join("");
  }

  function renderClasses(rows) {
    if (!rows.length) {
      classBarsEl.innerHTML = '<div class="admin-muted">No class aggregates yet. Open Teacher Dashboard and run class snapshots.</div>';
      return;
    }

    classBarsEl.innerHTML = rows.map(classCard).join("");
    Array.prototype.forEach.call(classBarsEl.querySelectorAll("[data-fill]"), function (fill) {
      animateBar(fill, Number(fill.getAttribute("data-fill") || 0));
    });
  }

  function renderTrends(lines) {
    trendInsightsEl.innerHTML = lines.map(function (line) {
      return '<div class="admin-trend">' + line + '</div>';
    }).join("");
  }

  function run() {
    renderStorageWarningIfNeeded();
    var demo = window.CSMultiClassEngine.isDemoMode();
    var school = demo ? window.CSMultiClassEngine.buildDemoSchool() : window.CSMultiClassEngine.readSchoolAnalytics();
    var rows = window.CSMultiClassEngine.classRows(school);
    var work = function () {
      var snapshot = window.CSMultiClassEngine.aggregate(rows);
      renderSnapshot(snapshot, rows.length, school.lastUpdated);
      renderClasses(rows);
      renderTrends(window.CSMultiClassEngine.trends(snapshot, rows));
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(work, { timeout: 800 });
    } else {
      window.setTimeout(work, 0);
    }
  }

  run();
})();
