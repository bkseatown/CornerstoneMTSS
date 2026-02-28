(function sessionEngineModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSSessionEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var BLOCK = {
    WQ_PROBE: "WQ_PROBE",
    RL_ORF: "RL_ORF",
    SS_TARGET: "SS_TARGET",
    PB_TRANSFER: "PB_TRANSFER",
    MINI_PRACTICE: "MINI_PRACTICE"
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function clamp(n, min, max) {
    var x = Number(n);
    if (!Number.isFinite(x)) x = min;
    return Math.max(min, Math.min(max, x));
  }

  function normalizeMode(mode) {
    var v = String(mode || "smallgroup").toLowerCase();
    if (v === "pushin") return "pushin";
    if (v === "fullblock") return "fullblock";
    return "smallgroup";
  }

  function normalizeTier(tier) {
    var v = String(tier || "tier2").toLowerCase();
    if (v === "tier3" || v === "tier-3") return "tier3";
    return "tier2";
  }

  function normalizeFocusSkill(skill) {
    var v = String(skill || "strategy").toLowerCase();
    if (!v) return "strategy";
    if (v === "vowel" || v === "decoding") return "decoding";
    if (v === "reasoning") return "reasoning";
    if (v === "fluency") return "fluency";
    return "strategy";
  }

  function makeBlock(type, minutes, title, notes) {
    return {
      id: "blk_" + Math.random().toString(36).slice(2, 8),
      type: String(type),
      minutes: Number(minutes || 0),
      title: String(title || type),
      notes: String(notes || ""),
      status: "pending"
    };
  }

  function chooseMiniPractice(focusSkill, priorSignals) {
    var focus = normalizeFocusSkill(focusSkill);
    if (priorSignals && Number(priorSignals.wqRepeatedMiss || 0) >= 2) {
      return "vowel contrast";
    }
    if (priorSignals && Number(priorSignals.wqConstraintRespect || 1) < 0.55) {
      return "constraint follow-through";
    }
    if (focus === "decoding") return "vowel contrast";
    if (focus === "fluency") return "phrase pacing";
    if (focus === "reasoning") return "because / but / so sentence combine";
    return "elimination strategy";
  }

  function buildDefaultPlan(input) {
    var mode = normalizeMode(input && input.mode);
    var tier = normalizeTier(input && input.tier);
    var focus = normalizeFocusSkill(input && input.focusSkill);
    var priorSignals = input && input.priorSignals ? input.priorSignals : {};
    var mini = chooseMiniPractice(focus, priorSignals);

    if (mode === "pushin") {
      return {
        mode: mode,
        tier: tier,
        focusSkill: focus,
        blocks: [
          makeBlock(BLOCK.WQ_PROBE, 1, "Word Quest Probe", "Quick 60-second signal check."),
          makeBlock(BLOCK.MINI_PRACTICE, 2, "Mini Practice", "Target: " + mini + "."),
          makeBlock(BLOCK.SS_TARGET, 2, "Quick Summary", "Capture one instructional next step.")
        ]
      };
    }

    if (mode === "fullblock") {
      return {
        mode: mode,
        tier: tier,
        focusSkill: focus,
        blocks: [
          makeBlock(BLOCK.RL_ORF, 3, "Reading Lab ORF", "Short warm-up passage."),
          makeBlock(BLOCK.SS_TARGET, 10, "Sentence Surgery", "Targeted reasoning + control."),
          makeBlock(BLOCK.PB_TRANSFER, 12, "Paragraph Transfer", "Apply target in writing."),
          makeBlock(BLOCK.WQ_PROBE, 5, "Word Quest Probe", "Optional consolidation probe."),
          makeBlock(BLOCK.MINI_PRACTICE, 5, "Wrap + Plan Next", "Plan next move and assign practice.")
        ]
      };
    }

    if (tier === "tier3") {
      return {
        mode: mode,
        tier: tier,
        focusSkill: focus,
        blocks: [
          makeBlock(BLOCK.WQ_PROBE, 2, "Word Quest Probe", "90-second strategy probe."),
          makeBlock(BLOCK.MINI_PRACTICE, 4, "Mini Practice", "Target: " + mini + "."),
          makeBlock(BLOCK.SS_TARGET, 4, "Sentence Surgery Target", "Reinforce strategy through sentence work.")
        ]
      };
    }

    return {
      mode: mode,
      tier: tier,
      focusSkill: focus,
      blocks: [
        makeBlock(BLOCK.WQ_PROBE, 2, "Word Quest Probe", "Fast signal check."),
        makeBlock(BLOCK.MINI_PRACTICE, 3, "Mini Practice", "Target: " + mini + "."),
        makeBlock(BLOCK.SS_TARGET, 4, "Sentence Surgery Target", "Transfer to sentence-level control.")
      ]
    };
  }

  function makeSessionId() {
    return "se_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function createSession(input) {
    var plan = buildDefaultPlan(input || {});
    return {
      sessionId: makeSessionId(),
      mode: plan.mode,
      tier: plan.tier,
      focusSkill: plan.focusSkill,
      targetType: String(input && input.targetType || "group"),
      targetIds: Array.isArray(input && input.targetIds) ? input.targetIds.slice() : [],
      startedAt: nowIso(),
      endedAt: null,
      index: 0,
      blocks: plan.blocks,
      events: [],
      collectedSignals: {
        wqGuesses: 0,
        wqRepeatedMiss: 0,
        wqConstraintRespect: 1,
        rlAccuracy: 0,
        ssControl: 0,
        sessionScore: 0
      }
    };
  }

  function getCurrentBlock(session) {
    if (!session || !Array.isArray(session.blocks)) return null;
    if (session.index >= session.blocks.length) return null;
    return session.blocks[session.index] || null;
  }

  function getNextBlock(session) {
    if (!session || !Array.isArray(session.blocks)) return null;
    var nextIndex = Number(session.index || 0) + 1;
    return session.blocks[nextIndex] || null;
  }

  function updateSignals(session, block, metrics) {
    var signals = session.collectedSignals || {};
    var m = metrics && typeof metrics === "object" ? metrics : {};

    if (block.type === BLOCK.WQ_PROBE) {
      signals.wqGuesses = Number(m.guesses || signals.wqGuesses || 0);
      signals.wqRepeatedMiss = Number(m.repeatedMiss || signals.wqRepeatedMiss || 0);
      signals.wqConstraintRespect = clamp(Number(m.constraintRespect || signals.wqConstraintRespect || 1), 0, 1);
    }
    if (block.type === BLOCK.RL_ORF) {
      signals.rlAccuracy = clamp(Number(m.accuracy || signals.rlAccuracy || 0), 0, 1);
    }
    if (block.type === BLOCK.SS_TARGET || block.type === BLOCK.PB_TRANSFER || block.type === BLOCK.MINI_PRACTICE) {
      signals.ssControl = clamp(Number(m.quality || signals.ssControl || 0), 0, 1);
    }

    var weighted = (
      (1 - clamp(signals.wqRepeatedMiss / 6, 0, 1)) * 0.3 +
      clamp(signals.wqConstraintRespect, 0, 1) * 0.3 +
      clamp(signals.rlAccuracy, 0, 1) * 0.2 +
      clamp(signals.ssControl, 0, 1) * 0.2
    );
    signals.sessionScore = +clamp(weighted, 0, 1).toFixed(3);
    session.collectedSignals = signals;
  }

  function completeCurrentBlock(session, payload) {
    if (!session) return null;
    var block = getCurrentBlock(session);
    if (!block) return null;
    var data = payload && typeof payload === "object" ? payload : {};
    block.status = String(data.status || "done");
    block.completedAt = nowIso();
    block.metrics = data.metrics && typeof data.metrics === "object" ? data.metrics : {};
    block.note = String(data.note || "");

    updateSignals(session, block, block.metrics);

    session.events.push({
      t: nowIso(),
      type: "block_completed",
      blockId: block.id,
      blockType: block.type,
      status: block.status
    });

    session.index += 1;
    return block;
  }

  function isComplete(session) {
    return !getCurrentBlock(session);
  }

  function inferLikelyNeed(session) {
    var sig = session && session.collectedSignals ? session.collectedSignals : {};
    if (Number(sig.wqConstraintRespect || 1) < 0.55 || Number(sig.wqRepeatedMiss || 0) >= 3) {
      return "constraint monitoring + vowel contrast";
    }
    if (Number(sig.rlAccuracy || 0) < 0.7) {
      return "fluency accuracy with punctuation cues";
    }
    if (Number(sig.ssControl || 0) < 0.55) {
      return "sentence reasoning control";
    }
    return "strategy reinforcement";
  }

  function summarizeSession(session, options) {
    var now = Date.now();
    var endedAtIso = session.endedAt || nowIso();
    var startedAtMs = Date.parse(String(session.startedAt || "")) || now;
    var endedAtMs = Date.parse(String(endedAtIso || "")) || now;
    var durationMin = Math.max(1, Math.round((endedAtMs - startedAtMs) / 60000));
    var need = inferLikelyNeed(session);
    var targetName = String(options && options.targetName || "student/group");
    var score = Math.round(clamp(Number(session.collectedSignals && session.collectedSignals.sessionScore || 0), 0, 1) * 100);

    var teacherNote = [
      "Session complete for " + targetName + ".",
      "Mode: " + session.mode + ", Tier: " + session.tier + ".",
      "Likely need: " + need + ".",
      "Session score: " + score + "%.",
      "Next move: run one 10-minute follow-up targeting " + need + "."
    ].join(" ");

    var parentNote = [
      targetName + " completed a focused literacy support session today.",
      "We practiced " + need + " and finished with a confidence check.",
      "Next, we will repeat a short 10-minute practice to strengthen this skill."
    ].join(" ");

    return {
      durationMin: durationMin,
      likelyNeed: need,
      sessionScore: score,
      teacherNote: teacherNote,
      parentNote: parentNote,
      completedBlocks: (session.blocks || []).filter(function (b) { return b.status === "done"; }).length,
      totalBlocks: (session.blocks || []).length
    };
  }

  function endSession(session, options) {
    if (!session) return null;
    session.endedAt = nowIso();
    return summarizeSession(session, options || {});
  }

  return {
    BLOCK: BLOCK,
    normalizeMode: normalizeMode,
    normalizeTier: normalizeTier,
    normalizeFocusSkill: normalizeFocusSkill,
    buildDefaultPlan: buildDefaultPlan,
    createSession: createSession,
    getCurrentBlock: getCurrentBlock,
    getNextBlock: getNextBlock,
    completeCurrentBlock: completeCurrentBlock,
    isComplete: isComplete,
    summarizeSession: summarizeSession,
    endSession: endSession
  };
});
