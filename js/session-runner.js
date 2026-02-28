(function sessionRunnerPage() {
  "use strict";

  var store = window.CSCaseloadStore;
  var engine = window.CSSessionEngine;
  if (!store || !engine) return;

  var el = {
    meta: document.getElementById("sr-meta-line"),
    coach: document.getElementById("sr-coach"),
    coachText: document.getElementById("sr-coach-text"),
    coachToggle: document.getElementById("sr-coach-toggle"),
    currentBlock: document.getElementById("sr-current-block"),
    currentNotes: document.getElementById("sr-current-notes"),
    timer: document.getElementById("sr-timer-label"),
    progressFill: document.getElementById("sr-progress-fill"),
    metrics: document.getElementById("sr-metrics"),
    nextLine: document.getElementById("sr-next-line"),
    completeBlock: document.getElementById("sr-complete-block"),
    skipBlock: document.getElementById("sr-skip-block"),
    endSession: document.getElementById("sr-end-session"),
    summary: document.getElementById("sr-summary"),
    summaryLine: document.getElementById("sr-summary-line"),
    teacherNote: document.getElementById("sr-teacher-note"),
    parentNote: document.getElementById("sr-parent-note"),
    copyTeacher: document.getElementById("sr-copy-teacher"),
    copyParent: document.getElementById("sr-copy-parent"),
    saveSession: document.getElementById("sr-save-session"),
    exportJson: document.getElementById("sr-export-json"),
    exportCsv: document.getElementById("sr-export-csv"),
    status: document.getElementById("sr-status"),
    studentSelect: document.getElementById("sr-student-select")
  };

  var params = new URLSearchParams(window.location.search || "");
  var mode = engine.normalizeMode(params.get("mode") || "smallgroup");
  var group = String(params.get("group") || "A").toUpperCase();
  var requestedStudentId = String(params.get("studentId") || "");
  var tier = engine.normalizeTier(params.get("tier") || (group === "A" ? "tier3" : "tier2"));
  var focusSkill = engine.normalizeFocusSkill(params.get("focus") || (group === "C" ? "fluency" : (group === "B" ? "reasoning" : "strategy")));

  var caseload = store.seedDemoCaseload();
  var students = Array.isArray(caseload.students) ? caseload.students.slice() : [];
  var session = engine.createSession({
    mode: mode,
    tier: tier,
    focusSkill: focusSkill,
    targetType: requestedStudentId ? "student" : "group",
    targetIds: requestedStudentId ? [requestedStudentId] : []
  });

  var timerTick = 0;
  var blockStartedAt = Date.now();
  var latestSummary = null;

  function setStatus(msg) {
    if (el.status) el.status.textContent = String(msg || "");
  }

  function formatModeLabel(value) {
    if (value === "pushin") return "Push-In";
    if (value === "fullblock") return "Full Block";
    return "Small Group";
  }

  function formatBlockType(type) {
    var map = {
      WQ_PROBE: "Word Quest Probe",
      RL_ORF: "Reading Lab ORF",
      SS_TARGET: "Sentence Surgery",
      PB_TRANSFER: "Paragraph Builder Transfer",
      MINI_PRACTICE: "Mini Practice"
    };
    return map[String(type)] || String(type);
  }

  function selectTargetStudents() {
    if (requestedStudentId) {
      return students.filter(function (student) { return String(student.id) === requestedStudentId; });
    }
    if (group === "A") {
      return students.filter(function (student) { return String(student.tier) === "tier3"; });
    }
    if (group === "B") {
      return students.filter(function (student) { return String(student.tier) === "tier2"; });
    }
    return students.filter(function (student) { return String(student.focusSkill || "") === "fluency" || String(student.tier) === "monitor"; });
  }

  function populateStudentSelect() {
    var list = selectTargetStudents();
    if (!list.length) list = students;
    el.studentSelect.innerHTML = "";
    list.forEach(function (student) {
      var opt = document.createElement("option");
      opt.value = String(student.id);
      opt.textContent = student.name + " · " + String(student.tier || "tier2").toUpperCase();
      el.studentSelect.appendChild(opt);
    });
    if (!list.length) {
      var fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = "No student selected";
      el.studentSelect.appendChild(fallback);
    }
  }

  function updateMetaLine() {
    var target = requestedStudentId ? "Student" : ("Group " + group);
    el.meta.textContent = "Mode: " + formatModeLabel(mode) + " · Target: " + target;
  }

  function metricsTemplate(block) {
    if (!block) return "";
    if (block.type === "WQ_PROBE") {
      return [
        '<label>Guesses<input type="number" min="1" max="8" step="1" data-metric="guesses" value="4"></label>',
        '<label>Repeated misses<input type="number" min="0" max="8" step="1" data-metric="repeatedMiss" value="1"></label>',
        '<label>Constraint respect (0-1)<input type="number" min="0" max="1" step="0.05" data-metric="constraintRespect" value="0.72"></label>'
      ].join("");
    }
    if (block.type === "RL_ORF") {
      return [
        '<label>Accuracy (0-1)<input type="number" min="0" max="1" step="0.01" data-metric="accuracy" value="0.87"></label>'
      ].join("");
    }
    return '<label>Quality (0-1)<input type="number" min="0" max="1" step="0.05" data-metric="quality" value="0.70"></label>';
  }

  function readMetrics() {
    var out = {};
    el.metrics.querySelectorAll("[data-metric]").forEach(function (node) {
      var key = String(node.getAttribute("data-metric") || "");
      if (!key) return;
      out[key] = Number(node.value || 0);
    });
    return out;
  }

  function updateTimerAndProgress() {
    var block = engine.getCurrentBlock(session);
    if (!block) {
      el.timer.textContent = "Done";
      el.progressFill.style.width = "100%";
      return;
    }
    var elapsedMs = Date.now() - blockStartedAt;
    var elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
    var min = Math.floor(elapsedSec / 60);
    var sec = elapsedSec % 60;
    el.timer.textContent = String(min) + ":" + String(sec).padStart(2, "0");

    var totalSec = Math.max(10, Number(block.minutes || 1) * 60);
    var pct = Math.max(0, Math.min(100, (elapsedSec / totalSec) * 100));
    el.progressFill.style.width = pct.toFixed(1) + "%";
  }

  function getCoachLine(block) {
    if (!block) return "Session complete. Review notes and save.";
    if (block.type === "WQ_PROBE") return "Capture quick behavior signals: guesses, misses, and constraint follow-through.";
    if (block.type === "RL_ORF") return "Listen for accuracy and punctuation respect; record one clear metric.";
    if (block.type === "MINI_PRACTICE") return "Keep it tight: model once, student practices twice.";
    if (block.type === "SS_TARGET") return "Target one sentence move only. Avoid over-correcting.";
    if (block.type === "PB_TRANSFER") return "Transfer the same target to paragraph-level writing.";
    return "Complete this block, then move to the next step.";
  }

  function render() {
    var block = engine.getCurrentBlock(session);
    var next = engine.getNextBlock(session);

    if (!block) {
      el.currentBlock.textContent = "All blocks complete";
      el.currentNotes.textContent = "End session to generate notes and save.";
      el.metrics.innerHTML = "";
      el.completeBlock.disabled = true;
      el.skipBlock.disabled = true;
      el.nextLine.textContent = "No next block.";
      el.coachText.textContent = getCoachLine(null);
      return;
    }

    el.currentBlock.textContent = formatBlockType(block.type) + " · " + block.minutes + " min";
    el.currentNotes.textContent = block.notes || "";
    el.metrics.innerHTML = metricsTemplate(block);
    el.completeBlock.disabled = false;
    el.skipBlock.disabled = false;
    el.nextLine.textContent = next ? (formatBlockType(next.type) + " · " + next.minutes + " min") : "Summary and save.";
    el.coachText.textContent = getCoachLine(block);
    blockStartedAt = Date.now();
    updateTimerAndProgress();
  }

  function endAndShowSummary() {
    latestSummary = engine.endSession(session, {
      targetName: el.studentSelect.options[el.studentSelect.selectedIndex]
        ? el.studentSelect.options[el.studentSelect.selectedIndex].textContent
        : "group"
    });

    el.summary.classList.remove("hidden");
    el.summaryLine.textContent = "Completed " + latestSummary.completedBlocks + "/" + latestSummary.totalBlocks + " blocks · Session score " + latestSummary.sessionScore + "%";
    el.teacherNote.value = latestSummary.teacherNote;
    el.parentNote.value = latestSummary.parentNote;
    setStatus("Session summary ready.");
  }

  function saveSessionToStudent() {
    if (!latestSummary) {
      setStatus("End session first.");
      return;
    }
    var studentId = String(el.studentSelect.value || "");
    if (!studentId) {
      setStatus("Select a student before saving.");
      return;
    }
    var student = students.find(function (row) { return String(row.id) === studentId; }) || null;
    var saved = store.recordSession(studentId, {
      sessionId: session.sessionId,
      studentName: student ? student.name : "",
      mode: session.mode,
      tier: session.tier,
      focusSkill: session.focusSkill,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationMin: latestSummary.durationMin,
      blocks: session.blocks,
      collectedSignals: session.collectedSignals,
      teacherNote: latestSummary.teacherNote,
      parentNote: latestSummary.parentNote,
      source: "session-runner"
    });
    if (saved) setStatus("Saved session to " + (student ? student.name : "student") + ".");
  }

  function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(String(text)).then(function () {
      setStatus("Copied.");
    }).catch(function () {
      setStatus("Copy failed.");
    });
  }

  function wire() {
    el.coachToggle.addEventListener("click", function () {
      var hidden = el.coach.classList.toggle("hidden");
      el.coachToggle.textContent = hidden ? "Show Coach" : "Hide Coach";
    });

    el.completeBlock.addEventListener("click", function () {
      var metrics = readMetrics();
      engine.completeCurrentBlock(session, {
        status: "done",
        metrics: metrics,
        note: "Completed in runner"
      });
      render();
      if (engine.isComplete(session)) endAndShowSummary();
    });

    el.skipBlock.addEventListener("click", function () {
      engine.completeCurrentBlock(session, {
        status: "skipped",
        metrics: {},
        note: "Skipped in runner"
      });
      render();
    });

    el.endSession.addEventListener("click", endAndShowSummary);
    el.saveSession.addEventListener("click", saveSessionToStudent);
    el.copyTeacher.addEventListener("click", function () { copyText(el.teacherNote.value); });
    el.copyParent.addEventListener("click", function () { copyText(el.parentNote.value); });

    el.exportJson.addEventListener("click", function () {
      store.downloadBlob(store.exportCaseloadJSON(), "cornerstone-caseload.json");
      setStatus("Exported JSON.");
    });

    el.exportCsv.addEventListener("click", function () {
      store.downloadBlob(store.exportSessionsCSV(), "cornerstone-sessions.csv");
      setStatus("Exported CSV.");
    });
  }

  function startTimer() {
    if (timerTick) clearInterval(timerTick);
    timerTick = setInterval(updateTimerAndProgress, 250);
  }

  updateMetaLine();
  populateStudentSelect();
  wire();
  render();
  startTimer();
})();
