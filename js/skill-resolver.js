(function initSkillResolver(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CSSkillResolver = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var WARNED_UNMAPPED = Object.create(null);
  var LEGACY_TO_CANONICAL = {
    "decoding.short_vowels": "LIT.DEC.PHG",
    "decoding.long_vowels": "LIT.DEC.SYL",
    "orthography.pattern_control": "LIT.DEC.SYL",
    "morphology.inflectional": "LIT.MOR.INFLECT",
    "morphology.derivational": "LIT.MOR.DERIV",
    "fluency.pacing": "LIT.FLU.ACC",
    "sentence.syntax_clarity": "LIT.LANG.SYN",
    "writing.elaboration": "LIT.WRITE.SENT",
    "numeracy.fact_fluency": "NUM.FLU.FACT",
    "numeracy.strategy_use": "NUM.STRAT.USE"
  };

  var KNOWN_CANONICAL = {
    "LIT.DEC": true,
    "LIT.DEC.PHG": true,
    "LIT.DEC.PHG.CVC": true,
    "LIT.DEC.PHG.DIGRAPHS": true,
    "LIT.DEC.PHG.BLENDS": true,
    "LIT.DEC.SYL": true,
    "LIT.DEC.SYL.CLOSED": true,
    "LIT.DEC.SYL.VCE": true,
    "LIT.DEC.SYL.RCONTROL": true,
    "LIT.DEC.SYL.VOWELTEAMS": true,
    "LIT.DEC.IRREG": true,
    "LIT.DEC.IRREG.HF": true,
    "LIT.MOR": true,
    "LIT.MOR.INFLECT": true,
    "LIT.MOR.INFLECT.S": true,
    "LIT.MOR.INFLECT.ED": true,
    "LIT.MOR.INFLECT.ING": true,
    "LIT.MOR.DERIV": true,
    "LIT.MOR.DERIV.PREFIX": true,
    "LIT.MOR.DERIV.SUFFIX": true,
    "LIT.FLU": true,
    "LIT.FLU.ACC": true,
    "LIT.FLU.PRO": true,
    "LIT.LANG": true,
    "LIT.LANG.VOC": true,
    "LIT.LANG.VOC.SYN": true,
    "LIT.LANG.VOC.POLY": true,
    "LIT.LANG.SYN": true,
    "LIT.LANG.SYN.STRUCT": true,
    "LIT.LANG.SYN.CLAUSE": true,
    "LIT.WRITE": true,
    "LIT.WRITE.SENT": true,
    "LIT.WRITE.PAR": true,
    "NUM.FLU.FACT": true,
    "NUM.STRAT.USE": true
  };

  var CANONICAL_TO_FRIENDLY = {
    "LIT.DEC.PHG": "decoding.short_vowels",
    "LIT.DEC.SYL": "decoding.long_vowels",
    "LIT.MOR.INFLECT": "morphology.inflectional",
    "LIT.MOR.DERIV": "morphology.derivational",
    "LIT.FLU.ACC": "fluency.pacing",
    "LIT.LANG.SYN": "sentence.syntax_clarity",
    "LIT.WRITE.SENT": "writing.elaboration",
    "NUM.FLU.FACT": "numeracy.fact_fluency",
    "NUM.STRAT.USE": "numeracy.strategy_use"
  };

  function isKnownCanonical(id) {
    var skill = String(id || "").trim();
    if (!skill) return false;
    return !!KNOWN_CANONICAL[skill];
  }

  function warnUnmappedSkill(id) {
    if (!id || WARNED_UNMAPPED[id]) return;
    WARNED_UNMAPPED[id] = true;
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[taxonomy] Unmapped skill id:", id);
    }
  }

  function resolveSkillId(skillId) {
    var id = String(skillId || "").trim();
    if (!id) return { input: "", canonical: "", mapped: false, known: false };
    var canonical = id;
    var mapped = false;
    if (LEGACY_TO_CANONICAL[id]) {
      canonical = LEGACY_TO_CANONICAL[id];
      mapped = true;
    }
    var known = isKnownCanonical(canonical);
    if (!known && canonical.indexOf(".") > 0) warnUnmappedSkill(id);
    return { input: id, canonical: canonical, mapped: mapped, known: known };
  }

  function canonicalizeSkillId(skillId) {
    return resolveSkillId(skillId).canonical;
  }

  function toFriendlySkillId(skillId) {
    var id = canonicalizeSkillId(skillId);
    if (!id) return "";
    return CANONICAL_TO_FRIENDLY[id] || id;
  }

  function listAliases() {
    return Object.assign({}, LEGACY_TO_CANONICAL);
  }

  return {
    canonicalizeSkillId: canonicalizeSkillId,
    resolveSkillId: resolveSkillId,
    isKnownCanonical: isKnownCanonical,
    toFriendlySkillId: toFriendlySkillId,
    listAliases: listAliases,
    LEGACY_TO_CANONICAL: LEGACY_TO_CANONICAL
  };
});
