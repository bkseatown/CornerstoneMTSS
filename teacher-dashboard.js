(function teacherDashboardSearchFirst() {
  "use strict";

  var store = window.CSCaseloadStore;
  if (!store) return;

  var ROSTER_KEY = "cs_roster_v1";
  var state = {
    roster: [],
    sessions: [],
    selectedStudentId: "",
    activeTierTab: "tier2",
    tourIndex: -1,
    tourTimer: 0,
    replayTimer: 0
  };

  var el = {
    studentSearch: document.getElementById("td-student-search"),
    studentOptions: document.getElementById("td-student-options"),
    openStudents: document.getElementById("td-open-students"),
    runProbe: document.getElementById("td-run-probe"),
    run10: document.getElementById("td-run-10"),
    studentRun: document.getElementById("td-student-run"),
    importBtn: document.getElementById("td-import"),
    importInput: document.getElementById("td-import-input"),
    exportBtn: document.getElementById("td-export"),
    status: document.getElementById("td-status"),
    groups: document.getElementById("td-groups"),
    nextMove: document.getElementById("td-next-move"),
    recentList: document.getElementById("td-recent-list"),
    studentEmpty: document.getElementById("td-student-empty"),
    studentView: document.getElementById("td-student-view"),
    studentName: document.getElementById("td-student-name"),
    need: document.getElementById("td-need"),
    tier: document.getElementById("td-tier"),
    confidence: document.getElementById("td-confidence"),
    trend: document.getElementById("td-trend"),
    studentNext: document.getElementById("td-student-next"),
    drawer: document.getElementById("td-students-drawer"),
    drawerList: document.getElementById("td-drawer-list"),
    closeStudents: document.getElementById("td-close-students"),
    tierTabs: Array.from(document.querySelectorAll("[data-tier-tab]")),
    startAdminDemo: document.getElementById("td-start-admin-demo"),
    tourOverlay: document.getElementById("td-tour-overlay"),
    tourHighlight: document.getElementById("td-tour-highlight"),
    tourTitle: document.getElementById("td-tour-title"),
    tourText: document.getElementById("td-tour-text"),
    tourBack: document.getElementById("td-tour-back"),
    tourNext: document.getElementById("td-tour-next"),
    tourExit: document.getElementById("td-tour-exit"),
    probeHud: document.getElementById("td-probe-hud"),
    hudConstraint: document.getElementById("hud-constraint"),
    hudVowel: document.getElementById("hud-vowel"),
    hudRepeat: document.getElementById("hud-repeat"),
    hudTime: document.getElementById("hud-time")
  };

  var TOUR_STEPS = [
    {
      selector: "#td-student-search",
      title: "Roster + Search",
      text: "Caseload ready. Two taps to student goals and today\'s move."
    },
    {
      selector: "#td-student-view",
      title: "Data -> Need -> Next Move",
      text: "No data dump. Primary need, tier, confidence, and one next step."
    },
    {
      selector: "#td-probe-hud",
      title: "90-Second Probe",
      text: "Live metrics capture strategy signals during gameplay."
    },
    {
      selector: "#td-next-move",
      title: "Mini-Lesson Plan",
      text: "10-minute move with direct instruction and independent practice."
    },
    {
      selector: "#td-export",
      title: "Progress Reporting",
      text: "Export clean progress evidence for family and admin updates."
    }
  ];

  function setStatus(message) {
    el.status.textContent = String(message || "");
  }

  function parseJSON(raw, fallback) {
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_e) {
      return fallback;
    }
  }

  function loadRoster() {
    var roster = parseJSON(localStorage.getItem(ROSTER_KEY), []);
    if (!Array.isArray(roster) || !roster.length) {
      var seeded = store.seedDemoCaseload();
      roster = (seeded.students || []).map(function (student, idx) {
        return {
          id: String(student.id || ("SAS7A-" + String(idx + 1).padStart(2, "0"))),
          code: "SAS7A-" + String(idx + 1).padStart(2, "0"),
          name: String(student.name || ("Student " + (idx + 1))),
          tier: String(student.tier || "tier2"),
          focusSkill: String(student.focusSkill || "strategy")
        };
      });
      localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    }
    return roster;
  }

  function loadSessions() {
    var rows = store.listSessions();
    if (!Array.isArray(rows)) return [];
    return rows.slice().sort(function (a, b) {
      return Date.parse(String(b.createdAt || b.endedAt || "")) - Date.parse(String(a.createdAt || a.endedAt || ""));
    });
  }

  function normalizeTier(tier) {
    var v = String(tier || "").toLowerCase();
    if (v === "tier3" || v === "tier-3") return "tier3";
    if (v === "tier1" || v === "monitor") return "tier1";
    return "tier2";
  }

  function tierLabel(tier) {
    var v = normalizeTier(tier);
    if (v === "tier3") return "Tier 3";
    if (v === "tier1") return "Tier 1";
    return "Tier 2";
  }

  function findStudentByToken(token) {
    var t = String(token || "").trim().toLowerCase();
    if (!t) return null;
    return state.roster.find(function (student) {
      return String(student.id || "").toLowerCase() === t ||
        String(student.code || "").toLowerCase() === t ||
        String(student.name || "").toLowerCase() === t;
    }) || null;
  }

  function studentSessions(student) {
    if (!student) return [];
    return state.sessions.filter(function (row) {
      return String(row.studentId || "") === String(student.id || "") ||
        String(row.studentCode || "").toLowerCase() === String(student.code || "").toLowerCase();
    });
  }

  function inferNeedFromSession(session, fallbackSkill) {
    var moveTitle = String(session && session.nextMove && session.nextMove.title || "").toLowerCase();
    if (moveTitle.includes("vowel")) return "Decoding / vowel contrast";
    if (moveTitle.includes("fluency") || moveTitle.includes("orf")) return "Fluency";
    if (moveTitle.includes("reason") || moveTitle.includes("sentence")) return "Sentence reasoning";
    var skill = String(fallbackSkill || "strategy").toLowerCase();
    if (skill === "decoding") return "Decoding / vowel contrast";
    if (skill === "fluency") return "Fluency";
    if (skill === "reasoning") return "Sentence reasoning";
    return "Constraint Respect";
  }

  function summarizeStudent(student) {
    var rows = studentSessions(student);
    var latest = rows[0] || null;
    var tier = latest ? normalizeTier(latest.tier) : normalizeTier(student.tier);
    var confidence = latest
      ? Math.round((Number(latest.collectedSignals && latest.collectedSignals.sessionScore || 0.72) * 100))
      : (tier === "tier3" ? 58 : 72);
    var need = inferNeedFromSession(latest, student.focusSkill);
    var nextMove = latest && latest.teacherNote
      ? latest.teacherNote
      : "Run a 90-second Word Quest probe, then assign a 10-minute targeted move.";
    var trend = rows.length >= 2 ? "up" : "steady";
    return {
      student: student,
      latest: latest,
      confidence: confidence,
      need: need,
      tier: tier,
      trend: trend,
      nextMove: nextMove
    };
  }

  function buildGroups() {
    var tier = state.activeTierTab;
    var scoped = state.roster.filter(function (student) {
      var t = normalizeTier(student.tier);
      if (tier === "tier1") return t === "tier1";
      if (tier === "tier3") return t === "tier3";
      return t === "tier2";
    });

    var groups = {
      A: { label: "Group A", tier: "Tier 3", focus: "decoding / vowel contrast", students: [] },
      B: { label: "Group B", tier: "Tier 2", focus: "sentence reasoning", students: [] },
      C: { label: "Group C", tier: "Tier 1", focus: "fluency", students: [] }
    };

    scoped.forEach(function (student) {
      var t = normalizeTier(student.tier);
      if (t === "tier3") groups.A.students.push(student);
      else if (String(student.focusSkill || "") === "fluency" || t === "tier1") groups.C.students.push(student);
      else groups.B.students.push(student);
    });

    return [groups.A, groups.B, groups.C];
  }

  function renderSearchOptions() {
    el.studentOptions.innerHTML = "";
    state.roster.forEach(function (student) {
      var opt = document.createElement("option");
      opt.value = student.code || student.id;
      opt.label = student.name;
      el.studentOptions.appendChild(opt);
    });
  }

  function renderGroups() {
    var groups = buildGroups();
    el.groups.innerHTML = groups.map(function (group) {
      return [
        '<article class="td-group-row" data-group="' + group.label.slice(-1) + '">',
        '<div class="td-group-head"><span>' + group.label + ' · ' + group.tier + '</span><span>' + group.students.length + ' students</span></div>',
        '<div class="td-group-need">Focus: ' + group.focus + '</div>',
        '<button class="td-btn td-btn-primary" data-run-group="' + group.label.slice(-1) + '" type="button">Run 10-min session</button>',
        '</article>'
      ].join("");
    }).join("");

    el.groups.querySelectorAll("[data-run-group]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var groupId = btn.getAttribute("data-run-group") || "B";
        window.location.href = "session-runner.html?mode=smallgroup&group=" + encodeURIComponent(groupId);
      });
    });
  }

  function renderRecent() {
    var rows = state.sessions.slice(0, 5);
    if (!rows.length) {
      el.recentList.innerHTML = '<div class="td-recent-item">No sessions yet. Run a 90-second probe to start.</div>';
      return;
    }
    el.recentList.innerHTML = rows.map(function (row) {
      var ts = new Date(Date.parse(String(row.createdAt || row.endedAt || "")) || Date.now());
      var stamp = ts.toLocaleDateString() + " " + ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return '<article class="td-recent-item"><strong>' + (row.studentName || row.studentCode || row.studentId || "Student") + '</strong><br>' +
        tierLabel(row.tier) + ' · ' + (row.focusSkill || row.engine || "strategy") + '<br><span>' + stamp + '</span></article>';
    }).join("");
  }

  function renderStudent(student) {
    if (!student) {
      el.studentView.classList.add("hidden");
      el.studentEmpty.classList.remove("hidden");
      el.run10.disabled = true;
      el.nextMove.textContent = "Search a student first to load the recommended move.";
      return;
    }

    var summary = summarizeStudent(student);
    state.selectedStudentId = student.id;

    el.studentEmpty.classList.add("hidden");
    el.studentView.classList.remove("hidden");
    el.studentName.textContent = student.name + " (" + (student.code || student.id) + ")";
    el.need.textContent = summary.need;
    el.tier.textContent = tierLabel(summary.tier);
    el.confidence.textContent = String(summary.confidence) + "%";
    el.trend.textContent = summary.trend === "up" ? "Improving" : "Steady";
    el.studentNext.textContent = summary.nextMove;
    el.nextMove.textContent = "Today: " + summary.nextMove;
    el.run10.disabled = false;
  }

  function renderDrawer() {
    el.drawerList.innerHTML = state.roster.map(function (student) {
      return '<button class="td-drawer-student" data-student-id="' + student.id + '" type="button">' +
        '<strong>' + student.name + '</strong><br><span>' + (student.code || student.id) + ' · ' + tierLabel(student.tier) + '</span></button>';
    }).join("");

    el.drawerList.querySelectorAll("[data-student-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-student-id") || "";
        var student = state.roster.find(function (row) { return String(row.id) === id; }) || null;
        if (!student) return;
        el.studentSearch.value = student.code || student.id;
        renderStudent(student);
        el.drawer.classList.add("hidden");
      });
    });
  }

  function mergeImportedPayload(payload) {
    var parsed = payload;
    if (typeof payload === "string") {
      parsed = parseJSON(payload, null);
    }
    if (!parsed) return { added: 0 };

    var sessionRows = [];
    if (Array.isArray(parsed)) sessionRows = parsed;
    else if (Array.isArray(parsed.sessions)) sessionRows = parsed.sessions;
    else if (parsed.sessionId) sessionRows = [parsed];

    var added = 0;
    sessionRows.forEach(function (row) {
      if (!row || typeof row !== "object") return;
      var studentId = String(row.studentId || row.studentCode || "");
      store.recordSession(studentId, row);
      added += 1;
    });

    if (Array.isArray(parsed.roster) && parsed.roster.length) {
      localStorage.setItem(ROSTER_KEY, JSON.stringify(parsed.roster));
    }

    return { added: added };
  }

  function exportProgressCSV() {
    var rows = state.sessions.slice();
    var headers = ["studentId", "studentCode", "date", "activity", "primaryNeed", "tier", "confidence", "recommendedNextMove"];
    var lines = [headers.join(",")];
    rows.forEach(function (row) {
      var need = inferNeedFromSession(row, row.focusSkill);
      var confidence = Math.round((Number(row.collectedSignals && row.collectedSignals.sessionScore || 0.72) * 100));
      var values = [
        row.studentId || "",
        row.studentCode || "",
        row.createdAt || row.endedAt || "",
        row.engine || row.mode || "wordquest",
        need,
        tierLabel(row.tier),
        String(confidence) + "%",
        row.teacherNote || (row.nextMove && row.nextMove.title) || "Run 10-minute move"
      ].map(function (value) {
        var s = String(value == null ? "" : value).replace(/"/g, '""');
        return '"' + s + '"';
      });
      lines.push(values.join(","));
    });
    return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  }

  function downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) return;
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function runProbeForSelected() {
    var student = state.roster.find(function (row) { return row.id === state.selectedStudentId; }) || null;
    if (student) {
      window.location.href = "session-runner.html?mode=smallgroup&studentId=" + encodeURIComponent(student.id) + "&tier=" + encodeURIComponent(normalizeTier(student.tier));
      return;
    }
    window.location.href = "session-runner.html?mode=smallgroup&group=B";
  }

  function applyTierTab(tab) {
    state.activeTierTab = tab;
    el.tierTabs.forEach(function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-tier-tab") === tab);
    });
    renderGroups();
  }

  function stopReplay() {
    if (state.replayTimer) {
      clearInterval(state.replayTimer);
      state.replayTimer = 0;
    }
  }

  function startProbeReplay() {
    stopReplay();
    el.probeHud.classList.remove("hidden");
    var tick = 0;
    state.replayTimer = setInterval(function () {
      tick += 1;
      var respect = Math.min(0.88, 0.34 + tick * 0.045);
      var vowel = Math.min(5, 1 + Math.floor(tick / 2));
      var repeat = Math.max(0.08, 0.42 - tick * 0.028);
      var time = Math.max(620, 1900 - tick * 120);
      el.hudConstraint.textContent = respect.toFixed(2);
      el.hudVowel.textContent = String(vowel);
      el.hudRepeat.textContent = repeat.toFixed(2);
      el.hudTime.textContent = String(time);
      if (tick >= 9) stopReplay();
    }, 700);
  }

  function setTourHighlight(selector) {
    var node = document.querySelector(selector);
    if (!node) return;
    var rect = node.getBoundingClientRect();
    el.tourHighlight.style.left = Math.max(6, rect.left - 6) + "px";
    el.tourHighlight.style.top = Math.max(6, rect.top - 6) + "px";
    el.tourHighlight.style.width = Math.max(40, rect.width + 12) + "px";
    el.tourHighlight.style.height = Math.max(36, rect.height + 12) + "px";
  }

  function runTourStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) {
      stopTour();
      return;
    }
    state.tourIndex = index;
    var step = TOUR_STEPS[index];
    if (step.selector === "#td-student-view" && !state.selectedStudentId) {
      var first = state.roster[0] || null;
      if (first) renderStudent(first);
    }
    if (step.selector === "#td-probe-hud") startProbeReplay();
    setTourHighlight(step.selector);
    el.tourTitle.textContent = "Step " + (index + 1) + ": " + step.title;
    el.tourText.textContent = step.text;
    el.tourBack.disabled = index === 0;
    el.tourNext.textContent = index === TOUR_STEPS.length - 1 ? "Finish" : "Next";

    if (state.tourTimer) clearTimeout(state.tourTimer);
    state.tourTimer = setTimeout(function () {
      runTourStep(index + 1);
    }, 8000);
  }

  function startTour() {
    el.tourOverlay.classList.remove("hidden");
    runTourStep(0);
  }

  function stopTour() {
    if (state.tourTimer) clearTimeout(state.tourTimer);
    state.tourTimer = 0;
    stopReplay();
    el.probeHud.classList.add("hidden");
    el.tourOverlay.classList.add("hidden");
    state.tourIndex = -1;
    if (location.hash === "#admin-demo") {
      history.replaceState(history.state, "", location.pathname + location.search);
    }
  }

  function bindEvents() {
    el.studentSearch.addEventListener("change", function () {
      var student = findStudentByToken(el.studentSearch.value);
      if (!student) {
        setStatus("Student not found.");
        return;
      }
      renderStudent(student);
      setStatus("Loaded " + student.name + ".");
    });

    el.openStudents.addEventListener("click", function () {
      el.drawer.classList.toggle("hidden");
    });

    el.closeStudents.addEventListener("click", function () {
      el.drawer.classList.add("hidden");
    });

    el.runProbe.addEventListener("click", runProbeForSelected);
    el.run10.addEventListener("click", runProbeForSelected);
    el.studentRun.addEventListener("click", runProbeForSelected);

    el.importBtn.addEventListener("click", function () {
      el.importInput.value = "";
      el.importInput.click();
    });

    el.importInput.addEventListener("change", function () {
      var file = el.importInput.files && el.importInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var result = mergeImportedPayload(String(reader.result || ""));
        refresh();
        setStatus("Imported " + result.added + " session(s).");
      };
      reader.readAsText(file);
    });

    el.exportBtn.addEventListener("click", function () {
      downloadBlob(exportProgressCSV(), "cornerstone-progress.csv");
      downloadBlob(store.exportCaseloadJSON(), "cornerstone-caseload.json");
      setStatus("Exported CSV + JSON.");
    });

    el.tierTabs.forEach(function (node) {
      node.addEventListener("click", function () {
        applyTierTab(node.getAttribute("data-tier-tab") || "tier2");
      });
    });

    el.startAdminDemo.addEventListener("click", function () {
      location.hash = "admin-demo";
      startTour();
    });

    el.tourBack.addEventListener("click", function () {
      runTourStep(Math.max(0, state.tourIndex - 1));
    });

    el.tourNext.addEventListener("click", function () {
      runTourStep(state.tourIndex + 1);
    });

    el.tourExit.addEventListener("click", stopTour);

    window.addEventListener("resize", function () {
      if (!el.tourOverlay.classList.contains("hidden") && state.tourIndex >= 0) {
        setTourHighlight(TOUR_STEPS[state.tourIndex].selector);
      }
    });
  }

  function refresh() {
    state.roster = loadRoster();
    state.sessions = loadSessions();
    renderSearchOptions();
    renderDrawer();
    renderGroups();
    renderRecent();
    if (state.selectedStudentId) {
      var selected = state.roster.find(function (row) { return row.id === state.selectedStudentId; }) || null;
      renderStudent(selected);
    } else {
      renderStudent(null);
    }
  }

  bindEvents();
  refresh();
  if (location.hash === "#admin-demo") startTour();
})();
