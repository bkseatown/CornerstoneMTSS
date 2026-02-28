(function teacherDashboardWowPass() {
  "use strict";

  var DEMO_MODEL = {
    demo: true,
    kpis: {
      risk: "Strategy",
      tier: "Tier 2",
      confidence: 72,
      trend: "+9%",
      trendHint: "More solved probes and faster refinement.",
      lastProbe: "WQ Strategy Probe - 90s (2 days ago)"
    },
    plan: {
      group: "Group B",
      count: 5,
      steps: [
        "Model one vowel-first opener and one elimination guess.",
        "Coach two rounds using greens stay / yellows move / grays avoid.",
        "Close with one independent round and quick verbal reflection."
      ],
      nextMove: {
        title: "10-Minute Strategy Reset",
        steps: [
          "Warm-up: vowel sweep (2 min)",
          "Guided round with think-aloud (4 min)",
          "Independent round + check (4 min)"
        ],
        estMinutes: 10
      }
    },
    groups: [
      { label: "Group A", count: 3, need: "vowel team confusion", tier: "Tier 3" },
      { label: "Group B", count: 5, need: "sound-to-spell mapping + strategy", tier: "Tier 2" },
      { label: "Group C", count: 2, need: "multisyllable decoding", tier: "Tier 2" }
    ],
    evidence: [
      { student: "SAS7A-03", module: "Word Quest", signal: "Constraint Respect", score: 64, when: "2d ago", tier: "Tier 2" },
      { student: "SAS7A-11", module: "Reading Lab", signal: "Punctuation Respect", score: 58, when: "3d ago", tier: "Tier 3" },
      { student: "SAS7A-14", module: "Writing Studio", signal: "Reasoning Control", score: 71, when: "4d ago", tier: "Tier 2" },
      { student: "SAS7A-05", module: "Word Quest", signal: "Vowel Variety", score: 67, when: "5d ago", tier: "Tier 2" },
      { student: "SAS7A-09", module: "Reading Lab", signal: "Fluency Stability", score: 75, when: "6d ago", tier: "Tier 2" }
    ]
  };

  var root = {
    demoFlag: document.getElementById("td-demo-flag"),
    importStatus: document.getElementById("td-import-status"),
    kpiRisk: document.getElementById("td-kpi-risk"),
    kpiTier: document.getElementById("td-kpi-tier"),
    kpiConfidence: document.getElementById("td-kpi-confidence"),
    kpiTrend: document.getElementById("td-kpi-trend"),
    kpiTrendHint: document.getElementById("td-kpi-trend-hint"),
    kpiLastProbe: document.getElementById("td-kpi-last-probe"),
    planLede: document.getElementById("td-plan-lede"),
    planSteps: document.getElementById("td-plan-steps"),
    groups: document.getElementById("td-groups"),
    evidenceList: document.getElementById("td-evidence-list"),
    heatmapTable: document.getElementById("td-heatmap-table"),
    importBtn: document.getElementById("td-import-sessions"),
    importInput: document.getElementById("td-import-sessions-input"),
    exportBtn: document.getElementById("td-export-progress"),
    primaryCta: document.getElementById("td-primary-cta"),
    runMoveBtn: document.getElementById("td-run-move"),
    assignProbeBtn: document.getElementById("td-assign-probe")
  };

  if (!root.planSteps || !root.groups || !root.evidenceList || !root.heatmapTable) return;

  function hasStore() {
    return !!(window.CSCornerstoneStore && typeof window.CSCornerstoneStore.listSessions === "function");
  }

  function toDateMs(input) {
    var t = Date.parse(String(input || ""));
    return Number.isFinite(t) ? t : 0;
  }

  function nowMs() {
    return Date.now();
  }

  function clamp(n, min, max) {
    var x = Number(n);
    if (!Number.isFinite(x)) x = min;
    return Math.max(min, Math.min(max, x));
  }

  function pct(n) {
    return Math.round(clamp(n, 0, 100)) + "%";
  }

  function tierLabel(tier) {
    return String(tier || "tier2").toLowerCase() === "tier3" ? "Tier 3" : "Tier 2";
  }

  function inferRiskFromEngine(engine) {
    var key = String(engine || "").toLowerCase();
    if (key === "readinglab") return "Fluency";
    if (key === "writing") return "Reasoning";
    return "Strategy";
  }

  function daysAgoLabel(ms) {
    if (!ms) return "recent";
    var days = Math.max(0, Math.floor((nowMs() - ms) / 86400000));
    if (days <= 0) return "today";
    if (days === 1) return "1d ago";
    return days + "d ago";
  }

  function readSessions() {
    if (!hasStore()) return [];
    var rows = window.CSCornerstoneStore.listSessions({});
    if (!Array.isArray(rows)) return [];
    return rows.filter(function (row) {
      return row && typeof row === "object" && row.sessionId;
    }).sort(function (a, b) {
      return toDateMs(b.createdAt) - toDateMs(a.createdAt);
    });
  }

  function groupSessionsByStudent(rows) {
    var map = Object.create(null);
    rows.forEach(function (row) {
      var code = String(row.studentCode || row.deviceId || "NO-CODE").toUpperCase();
      if (!map[code]) map[code] = [];
      map[code].push(row);
    });
    return map;
  }

  function buildRealModel(rows) {
    if (!rows.length) return null;

    var byStudent = groupSessionsByStudent(rows);
    var studentKeys = Object.keys(byStudent);

    var groupA = [];
    var groupB = [];
    var groupC = [];
    var last7 = rows.filter(function (r) { return toDateMs(r.createdAt) >= nowMs() - (7 * 86400000); });

    var studentSummaries = studentKeys.map(function (code) {
      var sessions = byStudent[code].slice().sort(function (a, b) { return toDateMs(b.createdAt) - toDateMs(a.createdAt); });
      var latest = sessions[0];
      var tier3Count = sessions.filter(function (s) { return String(s.tier).toLowerCase() === "tier3"; }).length;
      var tier = tier3Count > 0 ? "Tier 3" : "Tier 2";
      var risk = inferRiskFromEngine(latest.engine);
      var confidence = tier === "Tier 3" ? 54 : 74;
      var need = (latest.nextMove && latest.nextMove.title) || (risk + " support");
      var signalScore = tier === "Tier 3" ? 56 : 76;
      var summary = {
        code: code,
        tier: tier,
        risk: risk,
        confidence: confidence,
        need: need,
        latest: latest,
        signalScore: signalScore
      };

      if (tier === "Tier 3") groupA.push(summary);
      else if (risk === "Strategy" || risk === "Decoding") groupB.push(summary);
      else groupC.push(summary);

      return summary;
    });

    var sortedStudents = studentSummaries.slice().sort(function (a, b) {
      if (a.tier !== b.tier) return a.tier === "Tier 3" ? -1 : 1;
      return b.confidence - a.confidence;
    });

    var top = sortedStudents[0];
    var focusGroup = groupA.length ? { label: "Group A", list: groupA }
      : (groupB.length ? { label: "Group B", list: groupB } : { label: "Group C", list: groupC.length ? groupC : sortedStudents });

    var trendNum = rows.length ? Math.max(-12, Math.min(18, Math.round((last7.length / rows.length) * 16) - 2)) : 0;
    var trend = (trendNum >= 0 ? "+" : "") + trendNum + "%";

    var latestLabel = (top.latest.engine === "readinglab" ? "Reading Lab" : top.latest.engine === "writing" ? "Writing Studio" : "WQ Strategy Probe") + " - " + (Math.round((Number(top.latest.durationMs || 0) / 1000)) || 90) + "s (" + daysAgoLabel(toDateMs(top.latest.createdAt)) + ")";

    var evidence = rows.slice(0, 5).map(function (row) {
      return {
        student: String(row.studentCode || row.deviceId || "NO-CODE").toUpperCase(),
        module: row.engine === "readinglab" ? "Reading Lab" : row.engine === "writing" ? "Writing Studio" : "Word Quest",
        signal: (row.nextMove && row.nextMove.title) ? row.nextMove.title : "Recommended move",
        score: String(row.tier).toLowerCase() === "tier3" ? 55 : 78,
        when: daysAgoLabel(toDateMs(row.createdAt)),
        tier: tierLabel(row.tier)
      };
    });

    return {
      demo: false,
      kpis: {
        risk: top.risk,
        tier: top.tier,
        confidence: top.confidence,
        trend: trend,
        trendHint: "Based on probes captured in the last 7 days.",
        lastProbe: latestLabel
      },
      plan: {
        group: focusGroup.label,
        count: focusGroup.list.length,
        steps: [
          "Run one modeled round and name the strategy out loud.",
          "Prompt one targeted correction after each attempt.",
          "Finish with independent attempt and brief check-in."
        ],
        nextMove: top.latest.nextMove || {
          title: "10-Minute Targeted Move",
          steps: ["Warm-up", "Guided practice", "Independent check"],
          estMinutes: 10
        }
      },
      groups: [
        {
          label: "Group A",
          count: groupA.length,
          need: groupA.length ? "intensive reteach + direct modeling" : "no students currently",
          tier: "Tier 3"
        },
        {
          label: "Group B",
          count: groupB.length,
          need: groupB.length ? "sound-to-spell mapping + strategy" : "no students currently",
          tier: "Tier 2"
        },
        {
          label: "Group C",
          count: groupC.length,
          need: groupC.length ? "fluency/reasoning extension" : "no students currently",
          tier: "Tier 2"
        }
      ],
      evidence: evidence,
      students: studentSummaries
    };
  }

  function text(el, value) {
    if (el) el.textContent = String(value || "");
  }

  function renderKpis(model) {
    text(root.kpiRisk, model.kpis.risk);
    text(root.kpiTier, model.kpis.tier);
    text(root.kpiConfidence, pct(model.kpis.confidence));
    text(root.kpiTrend, model.kpis.trend);
    text(root.kpiTrendHint, model.kpis.trendHint);
    text(root.kpiLastProbe, model.kpis.lastProbe);
  }

  function renderPlan(model) {
    text(root.planLede, "Start with " + model.plan.group + " (" + model.plan.count + " students).");
    root.planSteps.innerHTML = model.plan.steps.map(function (step, idx) {
      return '<div class="td-step"><span class="td-step-index">' + (idx + 1) + '.</span> ' + step + '</div>';
    }).join("");
  }

  function renderGroups(model) {
    root.groups.innerHTML = model.groups.map(function (group) {
      return [
        '<article class="td-group-card">',
        '<div class="g-title">' + group.label + ' · ' + group.tier + '</div>',
        '<div class="g-need">' + group.need + '</div>',
        '<div class="g-count">' + group.count + ' student' + (group.count === 1 ? '' : 's') + '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderEvidence(model) {
    root.evidenceList.innerHTML = model.evidence.map(function (row) {
      var barClass = row.score >= 75 ? "is-strong" : (row.score >= 60 ? "is-developing" : "is-emerging");
      return [
        '<article class="td-evidence-row">',
        '<div class="e-head"><strong>' + row.student + '</strong><span>' + row.module + ' · ' + row.when + '</span></div>',
        '<div class="e-signal">' + row.signal + '</div>',
        '<div class="e-bar"><span class="e-fill ' + barClass + '" style="width:' + clamp(row.score, 0, 100) + '%"></span></div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderHeatmap(model) {
    var rows = model.students && model.students.length ? model.students : DEMO_MODEL.evidence.map(function (item) {
      return {
        code: item.student,
        risk: item.signal,
        tier: item.tier,
        confidence: item.score,
        need: item.module
      };
    });

    root.heatmapTable.innerHTML = [
      '<thead><tr><th>Student</th><th>Primary Need</th><th>Tier</th><th>Confidence</th><th>Next Move</th></tr></thead>',
      '<tbody>',
      rows.map(function (row) {
        var risk = row.risk || inferRiskFromEngine(row.latest && row.latest.engine);
        var tier = row.tier || tierLabel(row.latest && row.latest.tier);
        var confidence = Number(row.confidence || row.signalScore || 72);
        var move = row.need || (row.latest && row.latest.nextMove && row.latest.nextMove.title) || "Run a 10-minute targeted move";
        return '<tr>' +
          '<td>' + (row.code || "NO-CODE") + '</td>' +
          '<td>' + risk + '</td>' +
          '<td>' + tier + '</td>' +
          '<td>' + pct(confidence) + '</td>' +
          '<td>' + move + '</td>' +
          '</tr>';
      }).join(""),
      '</tbody>'
    ].join("");
  }

  function render(model) {
    renderKpis(model);
    renderPlan(model);
    renderGroups(model);
    renderEvidence(model);
    renderHeatmap(model);

    if (root.demoFlag) {
      root.demoFlag.hidden = !model.demo;
    }
  }

  function setImportStatus(msg, isError) {
    if (!root.importStatus) return;
    root.importStatus.textContent = msg || "";
    root.importStatus.classList.toggle("is-error", !!isError);
  }

  function downloadCsv(rows) {
    var header = ["sessionId", "createdAt", "studentCode", "engine", "tier", "durationMs", "nextMoveTitle"];
    var lines = [header.join(",")];
    rows.forEach(function (row) {
      var cells = [
        row.sessionId,
        row.createdAt,
        row.studentCode || "",
        row.engine,
        row.tier,
        row.durationMs,
        (row.nextMove && row.nextMove.title) || ""
      ].map(function (value) {
        var s = String(value == null ? "" : value).replace(/"/g, '""');
        return '"' + s + '"';
      });
      lines.push(cells.join(","));
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cornerstone-progress.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 400);
  }

  function navigateToProbe() {
    window.location.href = "./index.html?play=1&probe=1";
  }

  function wireActions() {
    if (root.primaryCta) root.primaryCta.addEventListener("click", navigateToProbe);
    if (root.assignProbeBtn) root.assignProbeBtn.addEventListener("click", navigateToProbe);
    if (root.runMoveBtn) {
      root.runMoveBtn.addEventListener("click", function () {
        setImportStatus("10-minute move launched. Track completion in next probe.", false);
      });
    }

    if (root.importBtn && root.importInput && hasStore()) {
      root.importBtn.addEventListener("click", function () {
        root.importInput.value = "";
        root.importInput.click();
      });
      root.importInput.addEventListener("change", function () {
        var file = root.importInput.files && root.importInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var payload = JSON.parse(String(reader.result || "[]"));
            var result = window.CSCornerstoneStore.importSessions(payload);
            setImportStatus("Imported " + result.added + " session(s), deduped " + result.deduped + ".", false);
            refresh();
          } catch (_e) {
            setImportStatus("Import failed: invalid JSON.", true);
          }
        };
        reader.readAsText(file);
      });
    }

    if (root.exportBtn && hasStore()) {
      root.exportBtn.addEventListener("click", function () {
        var rows = readSessions();
        if (!rows.length) {
          setImportStatus("No sessions yet. Export is available after first probe.", true);
          return;
        }
        var jsonBlob = window.CSCornerstoneStore.exportSessions({});
        window.CSCornerstoneStore.downloadBlob(jsonBlob, "cornerstone-sessions.json");
        downloadCsv(rows);
        setImportStatus("Exported JSON + CSV.", false);
      });
    }
  }

  function refresh() {
    var rows = readSessions();
    var model = buildRealModel(rows) || DEMO_MODEL;
    render(model);
  }

  wireActions();
  refresh();
})();
