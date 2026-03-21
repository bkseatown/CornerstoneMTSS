/**
 * specialist-hub-storage.js — Unified persistence layer for Specialist Hub
 *
 * Consolidates all storage concerns:
 * - Block memory (lesson block open history)
 * - Recommendation verdicts and outcomes
 * - Recommendation history with tracking
 * - Summary metrics across caseload
 *
 * Extracted from specialist-hub.js (Phase 1 refactoring)
 * Reduces specialist-hub.js by ~200 lines
 * Makes data persistence testable and swappable
 */

function createSpecialistHubStorageModule(deps) {
  "use strict";

  var hubMemory = deps.hubMemory;
  var todayIsoKey = deps.todayIsoKey;

  if (!hubMemory || !todayIsoKey) {
    console.warn("[SpecialistHubStorage] Missing dependencies. Storage disabled.");
    return null;
  }

  /* ── Block Memory: track lesson block opens ─────────────── */

  function blockMemoryKey() {
    return "cs.hub.block-memory." + todayIsoKey();
  }

  function readBlockMemory() {
    return hubMemory.getJson(blockMemoryKey(), {}) || {};
  }

  function writeBlockMemory(memory) {
    hubMemory.setJson(blockMemoryKey(), memory || {});
  }

  function recordBlockOpen(blockId) {
    if (!blockId) return;
    var memory = readBlockMemory();
    var current = memory[blockId] || {};
    memory[blockId] = {
      opens: Number(current.opens || 0) + 1,
      lastOpenedAt: new Date().toISOString()
    };
    writeBlockMemory(memory);
  }

  function blockOpenMemory(blockId) {
    var memory = readBlockMemory();
    return memory[String(blockId || "")] || { opens: 0, lastOpenedAt: "" };
  }

  /* ── Recommendation Verdicts: teacher decision tracking ──── */

  function recommendationVerdictKey(studentId) {
    return "cs.rec.verdict." + studentId + "." + todayIsoKey();
  }

  function readRecommendationVerdict(studentId) {
    return hubMemory.getString(recommendationVerdictKey(studentId), "");
  }

  function writeRecommendationVerdict(studentId, verdict) {
    hubMemory.setString(recommendationVerdictKey(studentId), String(verdict || ""));
  }

  /* ── Recommendation Outcomes: what happened after recommendation ── */

  function recommendationOutcomeKey(studentId) {
    return "cs.rec.outcome." + studentId + "." + todayIsoKey();
  }

  function readRecommendationOutcome(studentId) {
    return hubMemory.getString(recommendationOutcomeKey(studentId), "");
  }

  function writeRecommendationOutcome(studentId, outcome) {
    hubMemory.setString(recommendationOutcomeKey(studentId), String(outcome || ""));
  }

  /* ── Recommendation History: full log of recommendations ──── */

  function recommendationHistoryKey(studentId) {
    return "cs.rec.history." + studentId;
  }

  function readRecommendationHistory(studentId) {
    return hubMemory.getJson(recommendationHistoryKey(studentId), []) || [];
  }

  function writeRecommendationHistory(studentId, rows) {
    hubMemory.setJson(
      recommendationHistoryKey(studentId),
      Array.isArray(rows) ? rows.slice(0, 12) : []
    );
  }

  function saveRecommendationHistoryPoint(studentId, update) {
    if (!studentId) return;
    var day = todayIsoKey();
    var rows = readRecommendationHistory(studentId).filter(function (row) {
      return row && row.day !== day;
    });
    var current = readRecommendationHistory(studentId).filter(function (row) {
      return row && row.day === day;
    })[0] || { day: day };

    rows.unshift({
      day: day,
      verdict: typeof update.verdict === "string" ? update.verdict : String(current.verdict || ""),
      outcome: typeof update.outcome === "string" ? update.outcome : String(current.outcome || ""),
      updatedAt: new Date().toISOString()
    });

    writeRecommendationHistory(studentId, rows);
  }

  function summarizeRecommendationHistory(studentIds) {
    var ids = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];
    var totals = { helped: 0, notYet: 0, followed: 0, skipped: 0, entries: 0 };

    ids.forEach(function (studentId) {
      readRecommendationHistory(studentId).slice(0, 4).forEach(function (row) {
        if (!row) return;
        totals.entries += 1;
        if (row.outcome === "helped") totals.helped += 1;
        if (row.outcome === "not-yet") totals.notYet += 1;
        if (row.verdict === "followed") totals.followed += 1;
        if (row.verdict === "skipped") totals.skipped += 1;
      });
    });

    return totals;
  }

  function latestRecommendationHistory(studentId) {
    return readRecommendationHistory(studentId).slice(0, 1)[0] || null;
  }

  /* ── Public API ────────────────────────────────────────── */

  return {
    // Block memory API
    recordBlockOpen: recordBlockOpen,
    blockOpenMemory: blockOpenMemory,

    // Recommendation verdict API
    readRecommendationVerdict: readRecommendationVerdict,
    writeRecommendationVerdict: writeRecommendationVerdict,

    // Recommendation outcome API
    readRecommendationOutcome: readRecommendationOutcome,
    writeRecommendationOutcome: writeRecommendationOutcome,

    // Recommendation history API
    readRecommendationHistory: readRecommendationHistory,
    writeRecommendationHistory: writeRecommendationHistory,
    saveRecommendationHistoryPoint: saveRecommendationHistoryPoint,
    summarizeRecommendationHistory: summarizeRecommendationHistory,
    latestRecommendationHistory: latestRecommendationHistory
  };
}

// Wire to global scope for specialist-hub.js
if (typeof window !== "undefined") {
  window.createSpecialistHubStorageModule = createSpecialistHubStorageModule;
}
