(function numeracyPracticeEngineModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root || globalThis);
    return;
  }
  root.CSNumeracyPracticeEngine = factory(root || globalThis);
})(typeof globalThis !== "undefined" ? globalThis : window, function createNumeracyPracticeEngine(root) {
  "use strict";

  var STORAGE_KEY = "cs.numeracy.practice.v1";

  var CONTENT_FOCUS = Object.freeze([
    "Number Fluency",
    "Place Value Reasoning",
    "Fraction Concepts",
    "Ratio & Proportion",
    "Algebraic Thinking",
    "Problem Solving & Modeling"
  ]);

  var STRATEGY_STAGE = Object.freeze([
    "Counting",
    "Additive",
    "Multiplicative",
    "Proportional",
    "Abstract"
  ]);

  var PRACTICE_MODES = Object.freeze([
    "Quick Check",
    "Strategy Builder",
    "Error Analysis",
    "Skill Sprint"
  ]);

  var ERROR_PATTERN = Object.freeze([
    "Conceptual misunderstanding",
    "Procedural inconsistency",
    "Language barrier",
    "Working memory overload",
    "Transfer issue"
  ]);

  var STAGE_REPRESENTATION = Object.freeze({
    Counting: "Number line and manipulatives",
    Additive: "Open number line decomposition",
    Multiplicative: "Arrays and area model",
    Proportional: "Double number line scaling",
    Abstract: "Symbolic equations"
  });

  function safeString(value, fallback) {
    var out = String(value == null ? "" : value).trim();
    return out || String(fallback || "");
  }

  function clamp(value, min, max) {
    var n = Number(value);
    if (!Number.isFinite(n)) return min;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function normalizeContentFocus(value) {
    var raw = safeString(value, "");
    var hit = CONTENT_FOCUS.find(function (item) { return item.toLowerCase() === raw.toLowerCase(); });
    return hit || "Number Fluency";
  }

  function normalizeStage(value) {
    var raw = safeString(value, "");
    var hit = STRATEGY_STAGE.find(function (item) { return item.toLowerCase() === raw.toLowerCase(); });
    return hit || "Additive";
  }

  function normalizeMode(value) {
    var raw = safeString(value, "");
    var hit = PRACTICE_MODES.find(function (item) { return item.toLowerCase() === raw.toLowerCase(); });
    return hit || "Quick Check";
  }

  function normalizeError(value) {
    var raw = safeString(value, "");
    var hit = ERROR_PATTERN.find(function (item) { return item.toLowerCase() === raw.toLowerCase(); });
    return hit || "Procedural inconsistency";
  }

  function stageScaffold(stage) {
    if (stage === "Counting") {
      return [
        "Point on the number line before solving.",
        "Use counters to model each quantity.",
        "Explain how the model matches the equation."
      ];
    }
    if (stage === "Additive") {
      return [
        "Break each number into parts before combining.",
        "Use partial sums on an open number line.",
        "Check reasonableness with estimation."
      ];
    }
    if (stage === "Multiplicative") {
      return [
        "Build an array or area model first.",
        "Label rows/columns or factors clearly.",
        "Use repeated groups to justify the product."
      ];
    }
    if (stage === "Proportional") {
      return [
        "Build a double number line before computing.",
        "Scale both quantities by the same factor.",
        "Compare unit rates to verify equivalence."
      ];
    }
    return [
      "Translate the context into an equation.",
      "Annotate each step with operation purpose.",
      "Validate with inverse operation or substitution."
    ];
  }

  function errorPatternScaffold(errorPattern) {
    if (errorPattern === "Conceptual misunderstanding") {
      return [
        "Use a visual model before symbolic steps.",
        "Name what each quantity represents.",
        "Connect answer back to model."
      ];
    }
    if (errorPattern === "Procedural inconsistency") {
      return [
        "Follow a 3-step procedure checklist.",
        "Check operation signs before calculating.",
        "Rework one step to verify consistency."
      ];
    }
    if (errorPattern === "Language barrier") {
      return [
        "Use simplified wording and short sentences.",
        "Highlight key math vocabulary in the prompt.",
        "Restate the question in your own words."
      ];
    }
    if (errorPattern === "Working memory overload") {
      return [
        "Solve smaller chunks one line at a time.",
        "Keep one reference model visible while solving.",
        "Use reduced number size for first attempt."
      ];
    }
    return [
      "Start with a guided worked example.",
      "Identify where this strategy transfers to a new context.",
      "Use one reflective sentence after solving."
    ];
  }

  function createPrompt(contentFocus, stage, idx, mappedNode) {
    var n = idx + 1;
    var nodeLabel = safeString(mappedNode, "Core Numeracy Node");
    if (contentFocus === "Number Fluency") {
      return "Problem " + n + ": Build efficient mental strategy for 38 + 27 and explain why it works (" + stage + ", " + nodeLabel + ").";
    }
    if (contentFocus === "Place Value Reasoning") {
      return "Problem " + n + ": Compare 4.08 and 4.8 using place-value reasoning, not just symbols (" + stage + ", " + nodeLabel + ").";
    }
    if (contentFocus === "Fraction Concepts") {
      return "Problem " + n + ": Represent 3/4 and 2/3 with a model and decide which is greater with evidence (" + stage + ", " + nodeLabel + ").";
    }
    if (contentFocus === "Ratio & Proportion") {
      return "Problem " + n + ": A recipe uses 2 cups flour for 3 cups milk. Scale to 10 cups flour and justify method (" + stage + ", " + nodeLabel + ").";
    }
    if (contentFocus === "Algebraic Thinking") {
      return "Problem " + n + ": Solve 3(x + 4) = 27 and explain each transformation (" + stage + ", " + nodeLabel + ").";
    }
    return "Problem " + n + ": Model and solve a two-step planning problem with constraints, then justify strategy choice (" + stage + ", " + nodeLabel + ").";
  }

  function buildProblemSet(args) {
    var mode = normalizeMode(args.mode);
    var contentFocus = normalizeContentFocus(args.contentFocus);
    var stage = normalizeStage(args.strategyStage);
    var mappedNode = safeString(args.mappedNumeracyNode, "Core Numeracy Node");
    var count = 4;
    if (mode === "Quick Check") count = 4;
    if (mode === "Strategy Builder") count = 5;
    if (mode === "Error Analysis") count = 3;
    if (mode === "Skill Sprint") count = 5;

    var items = [];
    for (var i = 0; i < count; i += 1) {
      var prompt = createPrompt(contentFocus, stage, i, mappedNode);
      if (mode === "Error Analysis") {
        items.push({
          id: "num-error-" + (i + 1),
          type: "error-analysis",
          prompt: prompt,
          incorrectWork: "Student wrote: " + (i + 2) + " + " + (i + 3) + " = " + (i + 8) + ". Identify and correct the error.",
          target: "Identify error source and repair reasoning."
        });
      } else {
        items.push({
          id: "num-problem-" + (i + 1),
          type: "solve",
          prompt: prompt,
          target: "Show model and explain reasoning."
        });
      }
    }
    return items;
  }

  function mergeScaffolds(stage, errorPattern, mode) {
    var merged = stageScaffold(stage).concat(errorPatternScaffold(errorPattern));
    if (mode === "Skill Sprint") {
      merged.push("Focus on accurate completion under time constraints.");
    }
    if (mode === "Quick Check") {
      merged.push("Complete each item quickly, then check one with a model.");
    }
    return merged.slice(0, 6);
  }

  function feedbackTypeForMode(mode) {
    if (mode === "Quick Check") return "Immediate correctness + one strategy note";
    if (mode === "Strategy Builder") return "Model-based coaching feedback";
    if (mode === "Error Analysis") return "Error attribution + correction feedback";
    return "Timed fluency feedback with accuracy checkpoint";
  }

  function nextStepFromTier(tierLevel, trendDecision, mode) {
    if (trendDecision === "INTENSIFY") {
      return "Increase scaffold density and move to Strategy Builder before sprint work.";
    }
    if (trendDecision === "FADE") {
      return "Fade prompts and transfer to mixed-context application tasks.";
    }
    if (tierLevel === "Tier 3") {
      return "Hold intensive support with explicit modeling and teacher check-ins.";
    }
    if (mode === "Error Analysis") {
      return "Follow with targeted correction set and one generalization task.";
    }
    return "Hold current mode and review one representation switch next session.";
  }

  function computeTierSignal(args) {
    var tierEngine = root && root.CSTierEngine;
    var fallback = {
      tierLevel: safeString(args.tierLevel, "Tier 2"),
      trendDecision: "HOLD",
      reasoning: ["Tier engine unavailable; using provided tier level."]
    };
    if (!tierEngine || typeof tierEngine.computeTierSignal !== "function") return fallback;

    var recentAccuracy = clamp(Number(args.recentAccuracy), 0, 1);
    var goalAccuracy = clamp(Number(args.goalAccuracy), 0, 1);
    var stableCount = Math.max(0, Math.round(Number(args.stableCount)));
    var weeksInIntervention = Math.max(0, Math.round(Number(args.weeksInIntervention)));
    var fidelityPercent = clamp(Number(args.fidelityPercent), 0, 100);

    if (!Number.isFinite(recentAccuracy)) recentAccuracy = 0.72;
    if (!Number.isFinite(goalAccuracy)) goalAccuracy = 0.8;
    if (!Number.isFinite(stableCount)) stableCount = recentAccuracy >= goalAccuracy ? 3 : 1;
    if (!Number.isFinite(weeksInIntervention)) weeksInIntervention = recentAccuracy < goalAccuracy ? 8 : 4;
    if (!Number.isFinite(fidelityPercent)) fidelityPercent = 82;

    return tierEngine.computeTierSignal({
      recentAccuracy: recentAccuracy,
      goalAccuracy: goalAccuracy,
      stableCount: stableCount,
      weeksInIntervention: weeksInIntervention,
      fidelityPercent: fidelityPercent
    });
  }

  function generateNumeracyPractice(input) {
    var args = input && typeof input === "object" ? input : {};
    var contentFocus = normalizeContentFocus(args.contentFocus);
    var strategyStage = normalizeStage(args.strategyStage);
    var errorPattern = normalizeError(args.errorPattern);
    var mode = normalizeMode(args.mode);
    var representationMode = STAGE_REPRESENTATION[strategyStage] || STAGE_REPRESENTATION.Additive;
    var tierSignal = computeTierSignal(args);
    var tierLevel = safeString(tierSignal.tierLevel, safeString(args.tierLevel, "Tier 2"));
    var trendDecision = safeString(tierSignal.trendDecision, "HOLD");

    var progressionSignal = {
      tierLevel: tierLevel,
      trendDecision: trendDecision,
      reasoning: Array.isArray(tierSignal.reasoning) ? tierSignal.reasoning.slice(0, 4) : [],
      suggestedNextStep: nextStepFromTier(tierLevel, trendDecision, mode),
      recentAccuracy: clamp(Number(args.recentAccuracy), 0, 1),
      goalAccuracy: clamp(Number(args.goalAccuracy), 0, 1),
      stableCount: Math.max(0, Math.round(Number(args.stableCount || 0)))
    };

    return {
      problemSet: buildProblemSet({
        mode: mode,
        contentFocus: contentFocus,
        strategyStage: strategyStage,
        mappedNumeracyNode: args.mappedNumeracyNode
      }),
      representationMode: representationMode,
      scaffolds: mergeScaffolds(strategyStage, errorPattern, mode),
      feedbackType: feedbackTypeForMode(mode),
      progressionSignal: progressionSignal
    };
  }

  function readPracticeLogs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function writePracticeLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(logs) ? logs.slice(-800) : []));
    } catch (_e) {}
  }

  function recordPracticeSession(session) {
    var logs = readPracticeLogs();
    var row = {
      ts: new Date().toISOString(),
      studentId: safeString(session && session.studentId, ""),
      attempts: Math.max(0, Math.round(Number(session && session.attempts || 0))),
      accuracy: clamp(Number(session && session.accuracy || 0), 0, 1),
      strategyStage: normalizeStage(session && session.strategyStage),
      modeUsed: normalizeMode(session && session.modeUsed),
      timeSpentSeconds: Math.max(0, Math.round(Number(session && session.timeSpentSeconds || 0)))
    };
    logs.push(row);
    writePracticeLogs(logs);
    return row;
  }

  return {
    generateNumeracyPractice: generateNumeracyPractice,
    recordPracticeSession: recordPracticeSession,
    readPracticeLogs: readPracticeLogs
  };
});
