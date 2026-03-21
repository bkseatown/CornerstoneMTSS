/**
 * specialist-hub-badges.js — Student badge management module
 *
 * Manages three badge/indicator systems:
 * 1. F&P (Fountas & Pinnell) reading level — letter grades A-Z
 * 2. Tool badges — Words Their Way stage, Read Naturally WPM, Lexia level
 * 3. UDL (Universal Design for Learning) accommodations
 *
 * Extracted from specialist-hub.js (Phase 4 refactoring)
 * Reduces specialist-hub.js by ~280 lines
 * Makes badge system testable and customizable
 */

function createSpecialistHubBadgesModule(deps) {
  "use strict";

  var hubMemory = deps.hubMemory;
  var escapeHtml = deps.escapeHtml;

  if (!hubMemory || !escapeHtml) {
    console.warn("[SpecialistHubBadges] Missing dependencies. Badge system disabled.");
    return null;
  }

  /* ── F&P Reading Level (A-Z) ──────────────────────────────── */

  var FP_VALID = /^[A-Z]$/;
  var FP_DEMO_LEVELS = {
    "demo-sam": "M",
    "demo-maya": "O",
    "demo-noah": "J"
  };

  function getFpLevel(studentId) {
    var lsKey = "cs.hub.fp." + studentId;
    var stored = hubMemory.getString(lsKey, "__missing__");
    if (stored !== "__missing__") return stored || null;
    var demo = FP_DEMO_LEVELS[studentId] || null;
    if (demo) hubMemory.setString(lsKey, demo);
    return demo;
  }

  function setFpLevel(studentId, level) {
    hubMemory.setString("cs.hub.fp." + studentId, level ? String(level).toUpperCase().slice(0, 1) : "");
  }

  function renderFpBadge(studentId) {
    var level = getFpLevel(studentId);
    if (!level) return "";
    return '<button class="th2-fp-badge" data-fp-student="' + escapeHtml(studentId) + '" title="F&P Reading Level — click to update" type="button">F&amp;P ' + escapeHtml(level) + '</button>';
  }

  /* ── Tool Badges (WtW · Read Naturally · Lexia) ────────────────── */

  var WTW_STAGES = ["E", "LNA", "WWP", "SA", "DR"];
  var WTW_DEMO   = { "demo-zoe": "LNA", "demo-liam": "WWP" };
  var RN_DEMO    = { "demo-maya": "94", "demo-noah": "71" };

  function getToolBadge(studentId, tool) {
    var lsKey = "cs.hub." + tool + "." + studentId;
    var stored = hubMemory.getString(lsKey, "__missing__");
    if (stored !== "__missing__") return stored || null;
    var demo = (tool === "wtw" ? WTW_DEMO : tool === "rn" ? RN_DEMO : {})[studentId] || null;
    if (demo) hubMemory.setString(lsKey, demo);
    return demo;
  }

  function setToolBadge(studentId, tool, value) {
    if (value) hubMemory.setString("cs.hub." + tool + "." + studentId, String(value));
    else        hubMemory.remove("cs.hub." + tool + "." + studentId);
  }

  function renderToolBadges(studentId) {
    var wtw   = getToolBadge(studentId, "wtw");
    var rn    = getToolBadge(studentId, "rn");
    var lexia = getToolBadge(studentId, "lexia");
    var parts = [];
    if (wtw)   parts.push('<button class="th2-tool-badge th2-tool-badge--wtw" data-tool-badge="wtw" data-tool-student="' + escapeHtml(studentId) + '" title="Words Their Way stage — click to update" type="button">WtW ' + escapeHtml(wtw) + '</button>');
    if (rn)    parts.push('<button class="th2-tool-badge th2-tool-badge--rn" data-tool-badge="rn" data-tool-student="' + escapeHtml(studentId) + '" title="Read Naturally WPM — click to update" type="button">RN ' + escapeHtml(rn) + ' wpm</button>');
    if (lexia) parts.push('<button class="th2-tool-badge th2-tool-badge--lexia" data-tool-badge="lexia" data-tool-student="' + escapeHtml(studentId) + '" title="Lexia level — click to update" type="button">Lexia ' + escapeHtml(lexia) + '</button>');
    parts.push('<button class="th2-tool-add" data-tool-add-student="' + escapeHtml(studentId) + '" title="Set tool levels (WtW · RN · Lexia)" type="button" aria-label="Set tool levels">+</button>');
    return parts.join("");
  }

  /* ── UDL (Universal Design for Learning) Accommodations ──────── */

  var UDL_CHIPS = [
    { id: "ext_time",    label: "Extended time" },
    { id: "pref_seat",   label: "Pref. seating" },
    { id: "visual",      label: "Visual supports" },
    { id: "sent_frames", label: "Sentence frames" },
    { id: "reduced",     label: "Reduced load" },
    { id: "manipul",     label: "Manipulatives" },
    { id: "read_aloud",  label: "Read aloud" },
    { id: "calculator",  label: "Calculator" }
  ];

  function getUdlActive(studentId) {
    return hubMemory.getJson("cs.hub.udl." + studentId, []) || [];
  }

  function setUdlActive(studentId, ids) {
    hubMemory.setJson("cs.hub.udl." + studentId, ids);
  }

  function renderUdlStrip(studentId) {
    var active = getUdlActive(studentId);
    var html = '<div class="th2-udl-strip" data-udl-student="' + escapeHtml(studentId) + '">';
    UDL_CHIPS.forEach(function (c) {
      if (active.indexOf(c.id) !== -1) {
        html += '<button class="th2-udl-chip is-active" data-udl-id="' + c.id +
                '" type="button">' + escapeHtml(c.label) + '</button>';
      }
    });
    var toggleLabel = active.length ? "✎ Accommodations" : "+ Accommodations";
    html += '<button class="th2-udl-toggle" data-udl-toggle="' + escapeHtml(studentId) + '" type="button">' + toggleLabel + '</button>';
    html += '</div>';
    return html;
  }

  /* ── Public API ────────────────────────────────────────────── */

  return {
    // F&P reading level
    getFpLevel: getFpLevel,
    setFpLevel: setFpLevel,
    renderFpBadge: renderFpBadge,
    FP_VALID: FP_VALID,

    // Tool badges
    getToolBadge: getToolBadge,
    setToolBadge: setToolBadge,
    renderToolBadges: renderToolBadges,
    WTW_STAGES: WTW_STAGES,

    // UDL accommodations
    getUdlActive: getUdlActive,
    setUdlActive: setUdlActive,
    renderUdlStrip: renderUdlStrip,
    UDL_CHIPS: UDL_CHIPS
  };
}

// Wire to global scope
if (typeof window !== "undefined") {
  window.createSpecialistHubBadgesModule = createSpecialistHubBadgesModule;
}
