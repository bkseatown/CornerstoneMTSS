(function pedagogyEngineModule() {
  "use strict";

  var CS_SKILLS = {
    reasoning: {
      description: "Uses subordinating conjunctions to explain cause or contrast",
      targets: ["because", "although", "since", "if", "while"]
    },
    detail: {
      description: "Adds specific, concrete information",
      scale: "0-5"
    },
    verb_precision: {
      description: "Uses strong, specific verbs instead of vague ones"
    },
    cohesion: {
      description: "Links sentences logically using transitions or clause structure"
    },
    sentence_control: {
      description: "Maintains grammatical completeness and punctuation control"
    }
  };

  var VALID_PRIMARY = ["reasoning", "detail", "verb_precision", "cohesion", "sentence_control"];

  function normalizeSentence(sentence) {
    return String(sentence || "").replace(/\s+/g, " ").trim();
  }

  function clampTier(rawTier) {
    var n = Number(rawTier);
    if (n === 1 || n === 2 || n === 3) return n;
    var text = String(rawTier || "").toLowerCase();
    if (text.indexOf("tier 1") >= 0 || text.indexOf("tier1") >= 0 || text === "1") return 1;
    if (text.indexOf("tier 3") >= 0 || text.indexOf("tier3") >= 0 || text === "3") return 3;
    return 2;
  }

  function tierRules(tierLevel) {
    if (tierLevel === 3) {
      return "Tier 3 mode: include one focused micro-question and one partial scaffold stem in suggested_stem.";
    }
    if (tierLevel === 1) {
      return "Tier 1 mode: give a challenge extension in extension_option. suggested_stem should be null unless absolutely necessary.";
    }
    return "Tier 2 mode: directional hint only. suggested_stem must be null. extension_option must be null.";
  }

  function buildPedagogyPrompt(sentence, tierLevel) {
    var clean = normalizeSentence(sentence);
    var tier = clampTier(tierLevel);
    return [
      "You are a Tiered Writing Intervention Coach for Cornerstone Writing Studio.",
      "Analyze the student sentence and respond ONLY with valid JSON.",
      "Allowed skill taxonomy keys only: reasoning, detail, verb_precision, cohesion, sentence_control.",
      "Do NOT rewrite student text.",
      "Do NOT provide a full replacement sentence.",
      "No praise fluff.",
      "Focus on one primary skill.",
      "coach_prompt must be 30 words or fewer.",
      tierRules(tier),
      "Return exactly this shape:",
      "{",
      "  \"skills_detected\": {",
      "    \"reasoning\": boolean,",
      "    \"detail_score\": number,",
      "    \"verb_strength\": \"weak\"|\"adequate\"|\"strong\",",
      "    \"cohesion_score\": number,",
      "    \"sentence_control_score\": number",
      "  },",
      "  \"primary_focus\": \"reasoning\"|\"detail\"|\"verb_precision\"|\"cohesion\"|\"sentence_control\",",
      "  \"coach_prompt\": string,",
      "  \"suggested_stem\": string|null,",
      "  \"extension_option\": string|null",
      "}",
      "Student sentence: \"" + clean.replace(/\"/g, "\\\"") + "\"",
      "Tier level: " + tier
    ].join("\n");
  }

  function ensureWordLimit(text, maxWords) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    return words.slice(0, maxWords).join(" ");
  }

  function heuristicPedagogy(sentence, tierLevel, analysis, preferredFocus) {
    var clean = normalizeSentence(sentence);
    var tier = clampTier(tierLevel);
    var lower = clean.toLowerCase();
    var words = clean ? clean.split(/\s+/).filter(Boolean) : [];
    var hasReasoning = /\b(because|although|since|if|while)\b/.test(lower);
    var detailScore = analysis && typeof analysis.detail_score === "number"
      ? Math.max(0, Math.min(5, Math.round(analysis.detail_score)))
      : Math.max(0, Math.min(5, words.length >= 12 ? 4 : words.length >= 8 ? 3 : words.length >= 5 ? 2 : 1));
    var strongVerb = /\b(sprinted|dashed|raced|bolted|lunged|gripped|shattered)\b/.test(lower);
    var verbStrength = analysis && analysis.verb_strength
      ? String(analysis.verb_strength).toLowerCase()
      : (strongVerb ? "strong" : "weak");
    if (verbStrength !== "strong" && verbStrength !== "adequate" && verbStrength !== "weak") {
      verbStrength = "adequate";
    }
    var cohesionScore = /\b(and|but|so|therefore|however|then|because|although|since|if|while)\b/.test(lower)
      ? 3
      : 1;
    if (words.length >= 12) cohesionScore += 1;
    cohesionScore = Math.max(0, Math.min(5, cohesionScore));

    var sentenceControlScore = /[.!?]$/.test(clean) ? 3 : 1;
    if (words.length >= 6) sentenceControlScore += 1;
    sentenceControlScore = Math.max(0, Math.min(5, sentenceControlScore));

    var primary = preferredFocus && VALID_PRIMARY.indexOf(preferredFocus) >= 0
      ? preferredFocus
      : (!hasReasoning ? "reasoning" : detailScore <= 2 ? "detail" : verbStrength === "weak" ? "verb_precision" : cohesionScore <= 2 ? "cohesion" : "sentence_control");

    var coach = "Add one specific detail tied to your main idea.";
    var stem = null;
    var extension = null;

    if (primary === "reasoning") {
      coach = tier === 3
        ? "Explain why it happened using because. What caused it?"
        : "Add a because or although clause to show reasoning.";
      if (tier === 3) stem = "Because ___, ___.";
      if (tier === 1) extension = "Add a contrast clause with although to qualify your claim.";
    } else if (primary === "detail") {
      coach = tier === 3
        ? "Name one concrete detail. What can we see or hear?"
        : "Add one concrete detail so the idea is specific.";
      if (tier === 3) stem = "One clear detail is ___.";
      if (tier === 1) extension = "Add a precise statistic or domain term to sharpen detail.";
    } else if (primary === "verb_precision") {
      coach = tier === 3
        ? "Replace one vague verb. Which action word is strongest?"
        : "Swap one vague verb for a stronger, specific action verb.";
      if (tier === 3) stem = "Instead of ___, use ___.";
      if (tier === 1) extension = "Use one verb that implies tone, not just movement.";
    } else if (primary === "cohesion") {
      coach = tier === 3
        ? "Link ideas with one transition. How does this connect?"
        : "Add one transition or connector to link your ideas.";
      if (tier === 3) stem = "___, so ___.";
      if (tier === 1) extension = "Blend two ideas using a subordinate clause and transition.";
    } else {
      coach = tier === 3
        ? "Check punctuation and complete the sentence. What is missing?"
        : "Complete the sentence and fix end punctuation for control.";
      if (tier === 3) stem = "___, and ___.";
      if (tier === 1) extension = "Vary punctuation once while keeping grammar fully controlled.";
    }

    return {
      skills_detected: {
        reasoning: !!hasReasoning,
        detail_score: detailScore,
        verb_strength: verbStrength,
        cohesion_score: cohesionScore,
        sentence_control_score: sentenceControlScore
      },
      primary_focus: primary,
      coach_prompt: ensureWordLimit(coach, 30),
      suggested_stem: tier === 3 ? stem : null,
      extension_option: tier === 1 ? extension : null
    };
  }

  window.CSPedagogyEngine = {
    CS_SKILLS: CS_SKILLS,
    buildPedagogyPrompt: buildPedagogyPrompt,
    heuristicPedagogy: heuristicPedagogy,
    clampTier: clampTier,
    VALID_PRIMARY: VALID_PRIMARY
  };
})();
