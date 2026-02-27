(function paragraphBuilderInit() {
  "use strict";

  var root = document.getElementById("pb-root");
  var slots = Array.prototype.slice.call(document.querySelectorAll(".pb-slot"));
  var coachEl = document.getElementById("pbCoach");
  var coachTextEl = document.getElementById("pbCoachText");
  var coachDismissBtn = document.getElementById("pbCoachDismiss");
  var doneBtn = document.getElementById("pbDoneBtn");
  var resetBtn = document.getElementById("pbResetBtn");
  var homeBtn = document.getElementById("pbHomeBtn");
  var compareOverlay = document.getElementById("pbCompare");
  var beforeTextEl = document.getElementById("pbBeforeText");
  var afterTextEl = document.getElementById("pbAfterText");
  var afterMetricsEl = document.getElementById("pbAfterMetrics");
  var compareResetBtn = document.getElementById("pbCompareReset");
  var compareHomeBtn = document.getElementById("pbCompareHome");
  var demoOverlay = document.getElementById("pbDemoSuccess");
  var demoReplayBtn = document.getElementById("pbDemoReplay");
  var demoHomeBtn = document.getElementById("pbDemoHome");

  var progressFillEl = document.getElementById("pbProgressFill");
  var progressLabelEl = document.getElementById("pbProgressLabel");
  var topicFillEl = document.getElementById("pbTopicFill");
  var topicScoreEl = document.getElementById("pbTopicScore");
  var reasonFillEl = document.getElementById("pbReasonFill");
  var reasonScoreEl = document.getElementById("pbReasonScore");
  var cohesionFillEl = document.getElementById("pbCohesionFill");
  var cohesionScoreEl = document.getElementById("pbCohesionScore");
  var transitionFillEl = document.getElementById("pbTransitionFill");
  var transitionScoreEl = document.getElementById("pbTransitionScore");

  if (!root || !slots.length) return;

  var SLOT_ORDER = ["topic", "body1", "body2", "conclusion"];
  var state = {
    values: { topic: "", body1: "", body2: "", conclusion: "" },
    analysis: {},
    metrics: { topicClarity: 0, reasoningDepth: 0, cohesion: 0, transitionStrength: 0, progress: 0 },
    coachDismissedFor: "",
    debounceTimer: 0,
    demo: isDemoMode(),
    demoTimers: []
  };

  function isDemoMode() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get("demo") === "1" || params.get("demo") === "true" || params.get("mode") === "demo";
    } catch (_e) {
      return false;
    }
  }

  function sanitize(text) {
    return String(text || "").replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function setCaretToEnd(el) {
    if (!el) return;
    var range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    var sel = window.getSelection && window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function getSlotEl(type) {
    return root.querySelector('.pb-slot[data-type="' + type + '"]');
  }

  function getCoachMessage(type, value, analysis) {
    var words = (sanitize(value).match(/\b[\w'-]+\b/g) || []).length;
    if (!words) {
      if (type === "topic") return "Make your topic clear and specific.";
      if (type === "body1") return "Add a reason clause with because or although.";
      if (type === "body2") return "Add sensory detail or evidence.";
      return "Summarize the idea and link back to topic.";
    }

    if (analysis && analysis.suggested_focus === "reasoning" && (type === "body1" || type === "body2")) {
      return "Add one cause-effect phrase so your logic is clear.";
    }
    if (type === "conclusion" && words < 6) return "Wrap up with one complete sentence linked to your topic.";
    if (type === "topic" && words < 5) return "Add a more specific topic sentence with a clear focus.";
    return "Nice progress. Keep this sentence precise and connected.";
  }

  function showCoach(slotEl, text) {
    if (!coachEl || !coachTextEl || !slotEl) return;
    coachTextEl.textContent = sanitize(text);
    coachEl.classList.remove("hidden");
    var slotRect = slotEl.getBoundingClientRect();
    var cardRect = slotEl.closest(".pb-card").getBoundingClientRect();
    var top = (slotRect.bottom - cardRect.top) + 8;
    var left = Math.min(cardRect.width - 340, Math.max(0, slotRect.left - cardRect.left));
    coachEl.style.top = String(top) + "px";
    coachEl.style.left = String(left) + "px";
  }

  function hideCoach() {
    if (!coachEl) return;
    coachEl.classList.add("hidden");
  }

  async function analyzeSlot(type, text) {
    if (window.SSAIAnalysis && typeof window.SSAIAnalysis.analyzeSentence === "function") {
      return window.SSAIAnalysis.analyzeSentence(text, {});
    }
    return heuristicAnalysis(text);
  }

  function heuristicAnalysis(text) {
    var clean = sanitize(text);
    var words = clean ? clean.split(/\s+/).filter(Boolean) : [];
    var lower = clean.toLowerCase();
    var hasReasoning = /\b(because|although|since|while|if|when|after|before)\b/.test(lower);
    var strongVerb = /\b(sprinted|dashed|bolted|lunged|gripped|raced|hurried|shattered)\b/.test(lower);
    var type = "simple";
    if (/\b(and|but|so)\b/.test(lower)) type = "compound";
    if (hasReasoning) type = "complex";
    return {
      sentence_type: type,
      has_reasoning: hasReasoning,
      detail_score: words.length > 10 ? 3 : words.length > 7 ? 2 : words.length ? 1 : 0,
      verb_strength: strongVerb ? "strong" : "adequate",
      word_count: words.length,
      suggested_focus: !hasReasoning ? "reasoning" : (strongVerb ? "clause_variety" : "verb_upgrade")
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function tokenize(text) {
    return sanitize(text).toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
  }

  function computeCohesion(topic, body1, body2, conclusion) {
    var topicTokens = tokenize(topic);
    if (!topicTokens.length) return 0;
    var bodyTokens = tokenize(body1).concat(tokenize(body2)).concat(tokenize(conclusion));
    if (!bodyTokens.length) return 0;
    var shared = 0;
    topicTokens.forEach(function (t) {
      if (bodyTokens.indexOf(t) >= 0) shared += 1;
    });
    return clamp(Math.round((shared / topicTokens.length) * 5), 0, 5);
  }

  function computeTransitionStrength(body1, body2, conclusion) {
    var joined = [body1, body2, conclusion].join(" ").toLowerCase();
    var transitions = ["first", "next", "then", "also", "for example", "because", "however", "therefore", "finally", "in conclusion"];
    var hits = transitions.reduce(function (count, term) {
      return count + (joined.indexOf(term) >= 0 ? 1 : 0);
    }, 0);
    return clamp(hits, 0, 5);
  }

  function completenessScore(type, text, analysis) {
    var words = (sanitize(text).match(/\b[\w'-]+\b/g) || []).length;
    var minWords = type === "topic" ? 4 : type === "conclusion" ? 5 : 6;
    var base = words >= minWords ? 3 : (words > 0 ? 1 : 0);
    if (analysis && analysis.has_reasoning && (type === "body1" || type === "body2")) base += 1;
    if (analysis && analysis.verb_strength === "strong") base += 1;
    return clamp(base, 0, 5);
  }

  function renderMetrics() {
    var m = state.metrics;
    if (topicFillEl) topicFillEl.style.width = String(m.topicClarity * 20) + "%";
    if (topicScoreEl) topicScoreEl.textContent = String(m.topicClarity);
    if (reasonFillEl) reasonFillEl.style.width = String(m.reasoningDepth * 20) + "%";
    if (reasonScoreEl) reasonScoreEl.textContent = String(m.reasoningDepth);
    if (cohesionFillEl) cohesionFillEl.style.width = String(m.cohesion * 20) + "%";
    if (cohesionScoreEl) cohesionScoreEl.textContent = String(m.cohesion);
    if (transitionFillEl) transitionFillEl.style.width = String(m.transitionStrength * 20) + "%";
    if (transitionScoreEl) transitionScoreEl.textContent = String(m.transitionStrength);
    if (progressFillEl) progressFillEl.style.width = String(m.progress) + "%";
    if (progressLabelEl) progressLabelEl.textContent = String(m.progress) + "%";
    if (doneBtn) doneBtn.classList.toggle("hidden", m.progress < 70);
  }

  function buildImprovedParagraph(values) {
    var topic = sanitize(values.topic);
    var body1 = sanitize(values.body1);
    var body2 = sanitize(values.body2);
    var conclusion = sanitize(values.conclusion);

    if (body1 && !/\b(first|for example|because|also|next|then)\b/i.test(body1)) {
      body1 = "For example, " + body1;
    }
    if (body2 && !/\b(next|also|because|therefore|however|then)\b/i.test(body2)) {
      body2 = "Next, " + body2;
    }
    if (conclusion && !/\b(finally|in conclusion|overall)\b/i.test(conclusion)) {
      conclusion = "In conclusion, " + conclusion;
    }

    return [topic, body1, body2, conclusion]
      .filter(Boolean)
      .map(function (line) {
        return /[.!?]$/.test(line) ? line : line + ".";
      })
      .join(" ");
  }

  async function updateAllMetrics() {
    var analyses = {};
    for (var i = 0; i < SLOT_ORDER.length; i += 1) {
      var type = SLOT_ORDER[i];
      analyses[type] = await analyzeSlot(type, state.values[type]);
    }
    state.analysis = analyses;

    var topicClarity = completenessScore("topic", state.values.topic, analyses.topic);
    var reasoningDepth = clamp(Math.round(((analyses.body1 && analyses.body1.has_reasoning ? 1 : 0)
      + (analyses.body2 && analyses.body2.has_reasoning ? 1 : 0)
      + (analyses.conclusion && analyses.conclusion.has_reasoning ? 1 : 0)) * 1.7), 0, 5);
    var cohesion = computeCohesion(state.values.topic, state.values.body1, state.values.body2, state.values.conclusion);
    var transitionStrength = computeTransitionStrength(state.values.body1, state.values.body2, state.values.conclusion);

    var completeness = SLOT_ORDER.reduce(function (sum, type) {
      return sum + completenessScore(type, state.values[type], analyses[type]);
    }, 0);

    state.metrics.topicClarity = topicClarity;
    state.metrics.reasoningDepth = reasoningDepth;
    state.metrics.cohesion = cohesion;
    state.metrics.transitionStrength = transitionStrength;
    state.metrics.progress = clamp(Math.round((completeness / 20) * 100), 0, 100);

    renderMetrics();
  }

  function queueMetricsUpdate() {
    window.clearTimeout(state.debounceTimer);
    state.debounceTimer = window.setTimeout(function () {
      void updateAllMetrics();
    }, 220);
  }

  function handleFocus(slotEl) {
    if (!slotEl) return;
    slots.forEach(function (el) { el.classList.remove("active"); });
    slotEl.classList.add("active");
    var type = slotEl.getAttribute("data-type") || "";
    var msg = getCoachMessage(type, state.values[type], state.analysis[type]);
    if (state.coachDismissedFor !== type) showCoach(slotEl, msg);
  }

  function handleInput(slotEl) {
    var type = slotEl.getAttribute("data-type") || "";
    if (!type) return;
    state.values[type] = sanitize(slotEl.textContent || "");
    queueMetricsUpdate();

    if (!state.values[type]) {
      slotEl.classList.add("pb-invalid");
    } else {
      slotEl.classList.remove("pb-invalid");
    }
  }

  function handleBlur(slotEl) {
    var type = slotEl.getAttribute("data-type") || "";
    if (!type) return;
    if (!sanitize(slotEl.textContent || "")) {
      slotEl.textContent = "";
      slotEl.classList.add("pb-invalid");
    } else {
      slotEl.classList.remove("pb-invalid");
    }
  }

  function showCompare() {
    if (!compareOverlay || !beforeTextEl || !afterTextEl || !afterMetricsEl) return;
    var before = SLOT_ORDER.map(function (type) {
      return sanitize(state.values[type]);
    }).filter(Boolean).join(" | ");
    var after = buildImprovedParagraph(state.values);
    beforeTextEl.textContent = before || "(empty)";
    afterTextEl.textContent = after;
    afterMetricsEl.textContent = "Topic clarity " + state.metrics.topicClarity + "/5 • Reasoning " + state.metrics.reasoningDepth + "/5 • Cohesion " + state.metrics.cohesion + "/5 • Transition " + state.metrics.transitionStrength + "/5";
    compareOverlay.classList.remove("hidden");
  }

  function resetAll() {
    slots.forEach(function (slotEl) {
      slotEl.textContent = "";
      slotEl.classList.remove("pb-invalid", "active");
    });
    state.values = { topic: "", body1: "", body2: "", conclusion: "" };
    state.analysis = {};
    state.metrics = { topicClarity: 0, reasoningDepth: 0, cohesion: 0, transitionStrength: 0, progress: 0 };
    state.coachDismissedFor = "";
    hideCoach();
    renderMetrics();
    compareOverlay && compareOverlay.classList.add("hidden");
    demoOverlay && demoOverlay.classList.add("hidden");
  }

  function openWritingStudioHome() {
    window.location.href = "writing-studio.html";
  }

  function setSlotText(type, text) {
    var slotEl = getSlotEl(type);
    if (!slotEl) return;
    slotEl.textContent = sanitize(text);
    state.values[type] = sanitize(text);
    handleInput(slotEl);
  }

  function demoSetTimeout(fn, ms) {
    var id = window.setTimeout(fn, ms);
    state.demoTimers.push(id);
    return id;
  }

  function clearDemoTimers() {
    while (state.demoTimers.length) {
      window.clearTimeout(state.demoTimers.pop());
    }
  }

  function runDemoSequence() {
    if (!state.demo) return;
    clearDemoTimers();
    resetAll();

    setSlotText("topic", "Dogs help people");
    setSlotText("body1", "They work as companions at hospitals");
    setSlotText("body2", "They support people with disabilities");
    setSlotText("conclusion", "Dogs make lives better.");
    void updateAllMetrics();

    var seq = ["topic", "body1", "body2", "conclusion"];
    seq.forEach(function (type, idx) {
      demoSetTimeout(function () {
        var slotEl = getSlotEl(type);
        if (!slotEl) return;
        handleFocus(slotEl);
        var msg = getCoachMessage(type, state.values[type], state.analysis[type]);
        showCoach(slotEl, msg);
      }, 900 + (idx * 1600));
    });

    demoSetTimeout(function () {
      hideCoach();
      demoOverlay && demoOverlay.classList.remove("hidden");
    }, 7800);
  }

  slots.forEach(function (slotEl) {
    slotEl.addEventListener("focus", function () {
      handleFocus(slotEl);
    });
    slotEl.addEventListener("input", function () {
      handleInput(slotEl);
    });
    slotEl.addEventListener("blur", function () {
      handleBlur(slotEl);
    });
    slotEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        var idx = SLOT_ORDER.indexOf(slotEl.getAttribute("data-type"));
        var nextType = SLOT_ORDER[idx + 1];
        if (nextType) {
          var next = getSlotEl(nextType);
          if (next) {
            next.focus();
            setCaretToEnd(next);
          }
        }
      }
    });
  });

  if (coachDismissBtn) {
    coachDismissBtn.addEventListener("click", function () {
      var active = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("pb-slot")
        ? document.activeElement
        : root.querySelector(".pb-slot.active");
      if (active) state.coachDismissedFor = active.getAttribute("data-type") || "";
      hideCoach();
    });
  }

  if (doneBtn) doneBtn.addEventListener("click", function () {
    void updateAllMetrics().then(showCompare);
  });
  if (resetBtn) resetBtn.addEventListener("click", resetAll);
  if (homeBtn) homeBtn.addEventListener("click", openWritingStudioHome);
  if (compareResetBtn) compareResetBtn.addEventListener("click", function () { compareOverlay.classList.add("hidden"); resetAll(); });
  if (compareHomeBtn) compareHomeBtn.addEventListener("click", openWritingStudioHome);
  if (demoReplayBtn) demoReplayBtn.addEventListener("click", runDemoSequence);
  if (demoHomeBtn) demoHomeBtn.addEventListener("click", openWritingStudioHome);

  resetAll();
  queueMetricsUpdate();
  if (state.demo) runDemoSequence();
})();
