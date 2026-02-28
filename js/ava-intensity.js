(function avaIntensityModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.AvaIntensity = factory();
})(typeof window !== "undefined" ? window : this, function avaIntensityFactory() {
  "use strict";

  var eventMatrix = {
    wordquest: {
      after_first_miss: { priority: 2, defaultLane: "neutral_coach" },
      after_second_miss: { priority: 3, defaultLane: "direct_instruction" },
      rapid_wrong_streak: { priority: 5, defaultLane: "deescalation" },
      near_solve: { priority: 2, defaultLane: "neutral_coach" },
      streak_three_correct: {
        priority: 1,
        defaultLane: "challenge_stretch",
        allowedLanes: ["challenge_stretch", "neutral_coach"],
        tierRestrictions: { disallow: ["3"], allowWithContextFlag: "allowChallenge" }
      },
      idle_20s: { priority: 4, defaultLane: "direct_instruction" }
    },
    reading_lab: {
      low_accuracy: { priority: 4, defaultLane: "gentle_support" },
      punctuation_miss: { priority: 4, defaultLane: "direct_instruction" },
      pacing_drop: { priority: 3, defaultLane: "direct_instruction" },
      repeated_pause_pattern: { priority: 3, defaultLane: "gentle_support" },
      paragraph_complete: { priority: 1, defaultLane: "neutral_coach" },
      idle_20s: { priority: 4, defaultLane: "direct_instruction" }
    },
    sentence_surgery: {
      first_reason_added: { priority: 2, defaultLane: "neutral_coach" },
      reasoning_missing: { priority: 4, defaultLane: "direct_instruction" },
      repeated_backspace: { priority: 5, defaultLane: "deescalation" },
      paragraph_complete: { priority: 1, defaultLane: "neutral_coach" },
      streak_three_correct: {
        priority: 1,
        defaultLane: "challenge_stretch",
        allowedLanes: ["challenge_stretch", "neutral_coach"],
        tierRestrictions: { disallow: ["3"], allowWithContextFlag: "allowChallenge" }
      },
      idle_20s: { priority: 4, defaultLane: "direct_instruction" }
    },
    writing_studio: {
      planning_missing: { priority: 3, defaultLane: "direct_instruction" },
      evidence_thin: { priority: 3, defaultLane: "direct_instruction" },
      revision_stall: { priority: 4, defaultLane: "gentle_support" },
      rapid_delete_streak: { priority: 5, defaultLane: "deescalation" },
      paragraph_complete: { priority: 1, defaultLane: "neutral_coach" },
      idle_20s: { priority: 4, defaultLane: "direct_instruction" }
    },
    teacher_dashboard: {
      low_group_accuracy: { priority: 4, defaultLane: "direct_instruction", allowedLanes: ["direct_instruction", "neutral_coach"] },
      group_pacing_drop: { priority: 3, defaultLane: "neutral_coach" },
      reteach_recommended: { priority: 4, defaultLane: "direct_instruction" },
      student_growth_spike: {
        priority: 1,
        defaultLane: "challenge_stretch",
        allowedLanes: ["challenge_stretch", "neutral_coach"],
        tierRestrictions: { disallow: ["3"], allowWithContextFlag: "allowChallenge" }
      },
      progress_review_ready: { priority: 2, defaultLane: "neutral_coach" },
      idle_20s: { priority: 3, defaultLane: "gentle_support" }
    },
    numeracy: {
      after_first_miss: { priority: 2, defaultLane: "neutral_coach" },
      after_second_miss: { priority: 3, defaultLane: "direct_instruction" },
      rapid_wrong_streak: { priority: 5, defaultLane: "deescalation" },
      near_solve: { priority: 2, defaultLane: "neutral_coach" },
      streak_three_correct: {
        priority: 1,
        defaultLane: "challenge_stretch",
        allowedLanes: ["challenge_stretch", "neutral_coach"],
        tierRestrictions: { disallow: ["3"], allowWithContextFlag: "allowChallenge" }
      },
      idle_20s: { priority: 4, defaultLane: "direct_instruction" }
    }
  };

  function str(value) {
    return String(value || "").trim().toLowerCase();
  }

  function num(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function listContains(list, value) {
    if (!Array.isArray(list)) return false;
    return list.map(str).indexOf(str(value)) !== -1;
  }

  function moduleEvents(moduleName) {
    return eventMatrix[str(moduleName)] || {};
  }

  function getEventMeta(moduleName, eventKey) {
    var domain = moduleEvents(moduleName);
    return domain[str(eventKey)] || null;
  }

  function getEventPriority(moduleName, eventKey) {
    var meta = getEventMeta(moduleName, eventKey);
    return meta ? num(meta.priority, 0) : 0;
  }

  function isConditionActive(moduleName, eventKey, ctx) {
    var moduleKey = str(moduleName);
    var event = str(eventKey);

    if (event && str(ctx.event) === event) return true;

    if (event === "rapid_wrong_streak") {
      return num(ctx.streakWrong, 0) >= 3 && num(ctx.rapidActions, 0) >= 6;
    }
    if (event === "idle_20s") {
      return num(ctx.idleMs, 0) >= 20000;
    }

    if (moduleKey === "wordquest" || moduleKey === "numeracy") {
      if (event === "after_second_miss") return num(ctx.streakWrong, 0) >= 2;
      if (event === "after_first_miss") return num(ctx.streakWrong, 0) >= 1;
      if (event === "near_solve") return !!ctx.nearSolve || (!!ctx.remainingGuesses && num(ctx.remainingGuesses, 9) <= 1);
      if (event === "streak_three_correct") return num(ctx.streakCorrect, 0) >= 2;
    }

    if (moduleKey === "reading_lab") {
      if (event === "low_accuracy") return num(ctx.accuracyPct, 100) < 85;
      if (event === "punctuation_miss") return num(ctx.punctuationScore, 100) < 60;
      if (event === "pacing_drop") return !!ctx.pacingDrop || num(ctx.pacingVar, 0) >= 420;
      if (event === "repeated_pause_pattern") return !!ctx.repeatedPausePattern;
      if (event === "paragraph_complete") return !!ctx.paragraphComplete;
    }

    if (moduleKey === "sentence_surgery") {
      if (event === "repeated_backspace") return num(ctx.backspaceBurst, 0) >= 4;
      if (event === "first_reason_added") return !!ctx.firstReasonAdded;
      if (event === "reasoning_missing") {
        if (ctx.reasoningMissing === true) return true;
        if (ctx.reasoningMissing === false) return false;
        return !!ctx.edited && !ctx.hasReasoning;
      }
      if (event === "paragraph_complete") return !!ctx.paragraphComplete;
      if (event === "streak_three_correct") return num(ctx.streakCorrect, 0) >= 2;
    }

    if (moduleKey === "writing_studio") {
      if (event === "planning_missing") return !!ctx.planningMissing;
      if (event === "evidence_thin") return !!ctx.evidenceThin;
      if (event === "revision_stall") return !!ctx.revisionStall;
      if (event === "rapid_delete_streak") return num(ctx.backspaceBurst, 0) >= 6;
      if (event === "paragraph_complete") return !!ctx.paragraphComplete;
    }

    if (moduleKey === "teacher_dashboard") {
      if (event === "low_group_accuracy") return num(ctx.accuracyPct, 100) < 85;
      if (event === "group_pacing_drop") return !!ctx.pacingDrop;
      if (event === "reteach_recommended") return !!ctx.reteachRecommended;
      if (event === "student_growth_spike") return !!ctx.growthSpike;
      if (event === "progress_review_ready") return !!ctx.progressReviewReady;
    }

    return false;
  }

  function resolveEvent(context) {
    var ctx = context && typeof context === "object" ? context : {};
    var moduleName = str(ctx.module || "wordquest");
    var domain = moduleEvents(moduleName);
    var keys = Object.keys(domain);
    if (!keys.length) return "";

    var active = [];
    for (var i = 0; i < keys.length; i += 1) {
      var eventKey = keys[i];
      if (!isConditionActive(moduleName, eventKey, ctx)) continue;
      active.push({ key: eventKey, priority: num(domain[eventKey].priority, 0), index: i });
    }

    if (!active.length) {
      if (keys.indexOf("after_first_miss") !== -1) return "after_first_miss";
      if (keys.indexOf("paragraph_complete") !== -1) return "paragraph_complete";
      return keys[0] || "";
    }

    active.sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.index - b.index;
    });

    return active[0].key;
  }

  function computeLane(context, eventKey) {
    var ctx = context && typeof context === "object" ? context : {};
    var moduleName = str(ctx.module || "wordquest");
    var event = str(eventKey || resolveEvent(ctx));
    var meta = getEventMeta(moduleName, event);
    var lane = meta && meta.defaultLane ? str(meta.defaultLane) : "neutral_coach";

    if (num(ctx.streakWrong, 0) >= 3 && num(ctx.rapidActions, 0) >= 6) {
      lane = "deescalation";
    }

    if (lane === "challenge_stretch" && String(num(ctx.tier, 2)) === "3" && ctx.allowChallenge !== true) {
      lane = "neutral_coach";
    }

    if (meta && Array.isArray(meta.allowedLanes) && meta.allowedLanes.length && meta.allowedLanes.indexOf(lane) === -1) {
      lane = str(meta.allowedLanes[0]);
    }

    if (meta && meta.tierRestrictions && listContains(meta.tierRestrictions.disallow, String(num(ctx.tier, 2)))) {
      var allowFlag = str(meta.tierRestrictions.allowWithContextFlag);
      if (!allowFlag || ctx[allowFlag] !== true) {
        lane = "neutral_coach";
      }
    }

    return lane || "neutral_coach";
  }

  function computeLength(context, eventKey, lane) {
    var ctx = context && typeof context === "object" ? context : {};
    var event = str(eventKey);
    var audience = str(ctx.audience || (str(ctx.module) === "teacher_dashboard" ? "teacher" : "student"));

    if (lane === "deescalation") return "micro";
    if (event === "idle_20s" || event === "pacing_drop" || event === "repeated_pause_pattern") return "short";
    if (lane === "direct_instruction") return audience === "teacher" ? "medium" : "short";
    if (audience === "teacher") return "medium";

    if (String(num(ctx.tier, 2)) === "3") return "short";

    return "short";
  }

  function compute(context) {
    var ctx = context && typeof context === "object" ? context : {};
    var event = resolveEvent(ctx);
    var lane = computeLane(ctx, event);
    var length = computeLength(ctx, event, lane);
    var reason = "event=" + event + "; lane=" + lane + "; length=" + length;
    return {
      event: event,
      lane: lane,
      length: length,
      reason: reason
    };
  }

  function setEventMatrix(nextMatrix) {
    if (!nextMatrix || typeof nextMatrix !== "object") return false;
    eventMatrix = nextMatrix;
    return true;
  }

  function getEventMatrix() {
    return eventMatrix;
  }

  return {
    setEventMatrix: setEventMatrix,
    getEventMatrix: getEventMatrix,
    getEventMeta: getEventMeta,
    getEventPriority: getEventPriority,
    resolveEvent: resolveEvent,
    computeLane: computeLane,
    computeLength: computeLength,
    compute: compute
  };
});
