(function gameContentRegistryModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("./morphology-content"),
      require("./ladder-content"),
      require("./error-content"),
      require("./category-content"),
      require("./sentence-content"),
      require("./game-content-generator")
    );
    return;
  }
  root.CSGameContentRegistry = factory(
    root.CSMorphologyContent,
    root.CSLadderContent,
    root.CSErrorContent,
    root.CSCategoryContent,
    root.CSSentenceContent,
    root.CSGameContentGenerator
  );
})(typeof globalThis !== "undefined" ? globalThis : window, function createGameContentRegistry(
  morphologyContent,
  ladderContent,
  errorContent,
  categoryContent,
  sentenceContent,
  generator
) {
  "use strict";

  var WORD_QUEST_PACK = [
    // K-2 — ELA / Intervention
    { id: "wq-k1", word: "blend", clue: "Combine two or more sounds together.", gradeBands: ["K-2"], subjects: ["ELA", "Intervention"] },
    { id: "wq-k2", word: "vowel", clue: "A sound made with an open mouth — a, e, i, o, u.", gradeBands: ["K-2"], subjects: ["ELA", "Intervention"] },
    { id: "wq-k3", word: "chunk", clue: "A group of letters that go together in a word.", gradeBands: ["K-2"], subjects: ["Intervention"] },
    // 3-5 — ELA
    { id: "wq-1", word: "trace", clue: "Follow or mark the path.", gradeBands: ["3-5"], subjects: ["ELA"] },
    { id: "wq-35a", word: "infer", clue: "Use clues in the text to figure out what the author means.", gradeBands: ["3-5"], subjects: ["ELA"] },
    { id: "wq-35b", word: "theme", clue: "The central message or big idea of a story.", gradeBands: ["3-5"], subjects: ["ELA"] },
    { id: "wq-35c", word: "prefix", clue: "A word part added to the beginning that changes meaning.", gradeBands: ["3-5"], subjects: ["ELA", "Intervention"] },
    { id: "wq-35d", word: "context", clue: "The information around a word that helps explain its meaning.", gradeBands: ["3-5"], subjects: ["ELA"] },
    // 3-5 — Math
    { id: "wq-35m1", word: "product", clue: "The answer when you multiply two numbers.", gradeBands: ["3-5"], subjects: ["Math"] },
    { id: "wq-35m2", word: "factor", clue: "A number that divides evenly into another number.", gradeBands: ["3-5"], subjects: ["Math"] },
    // 3-5 — Science
    { id: "wq-4", word: "roots", clue: "Plant structures that anchor and absorb water.", gradeBands: ["3-5"], subjects: ["Science"] },
    { id: "wq-35s1", word: "predict", clue: "Say what you think will happen based on evidence.", gradeBands: ["3-5"], subjects: ["Science"] },
    // 6-8 — ELA / Writing
    { id: "wq-3", word: "claim", clue: "A statement a writer supports with evidence.", gradeBands: ["6-8", "9-12"], subjects: ["Writing", "ELA"] },
    { id: "wq-68a", word: "syntax", clue: "The arrangement of words and phrases to form sentences.", gradeBands: ["6-8"], subjects: ["ELA", "Writing"] },
    { id: "wq-68b", word: "cite", clue: "Point directly to evidence in a text to support your idea.", gradeBands: ["6-8", "9-12"], subjects: ["ELA", "Writing"] },
    { id: "wq-68c", word: "perspective", clue: "The viewpoint or position from which someone sees something.", gradeBands: ["6-8"], subjects: ["ELA"] },
    // 6-8 — Math
    { id: "wq-2", word: "ratio", clue: "A comparison between two quantities.", gradeBands: ["6-8"], subjects: ["Math"] },
    { id: "wq-68m1", word: "variable", clue: "A symbol — often a letter — that represents an unknown value.", gradeBands: ["6-8"], subjects: ["Math"] },
    { id: "wq-68m2", word: "equation", clue: "A mathematical statement that two expressions are equal.", gradeBands: ["6-8"], subjects: ["Math"] },
    // 6-8 — Science
    { id: "wq-68s1", word: "hypothesis", clue: "A testable prediction about what will happen in an experiment.", gradeBands: ["6-8"], subjects: ["Science"] },
    // 9-12 — ELA / Writing
    { id: "wq-912a", word: "synthesis", clue: "Combining ideas from multiple sources into a unified whole.", gradeBands: ["9-12"], subjects: ["ELA", "Writing"] },
    { id: "wq-912b", word: "rhetoric", clue: "The art of effective and persuasive communication.", gradeBands: ["9-12"], subjects: ["ELA", "Writing"] },
    { id: "wq-912c", word: "nuance", clue: "A subtle difference in meaning, expression, or tone.", gradeBands: ["9-12"], subjects: ["ELA"] }
  ];

  var WORD_CONNECTIONS_PACK = [
    {
      id: "wc-1",
      target: "analyze",
      forbidden: ["study", "look", "think", "read"],
      scaffolds: ["Use a precise academic sentence.", "Connect the word to lesson evidence."],
      requiredMove: "Use analyze in a complete explanation.",
      skillTag: "LIT.VOC.ACAD",
      gradeBands: ["6-8", "9-12"],
      subjects: ["ELA", "Writing"]
    },
    {
      id: "wc-2",
      target: "fraction",
      forbidden: ["part", "number", "piece", "math"],
      scaffolds: ["Use a representation or model.", "Describe the relationship between numerator and denominator."],
      requiredMove: "Explain with math language, not everyday language.",
      skillTag: "MATH.CONCEPT.PARTWHOLE",
      gradeBands: ["3-5", "6-8"],
      subjects: ["Math"]
    },
    {
      id: "wc-3",
      target: "summarize",
      forbidden: ["copy", "list", "write", "say"],
      scaffolds: ["Use your own words.", "Include the most important idea and two key details."],
      requiredMove: "Summarize in 1–2 sentences without looking at the text.",
      skillTag: "LIT.COMP.SUMMARIZE",
      gradeBands: ["3-5", "6-8"],
      subjects: ["ELA"]
    },
    {
      id: "wc-4",
      target: "evidence",
      forbidden: ["proof", "fact", "example", "quote"],
      scaffolds: ["Connect your evidence to your claim.", "Use: 'This shows that…'"],
      requiredMove: "Use evidence in a sentence that supports a specific claim.",
      skillTag: "LIT.WRITING.ARGUMENT",
      gradeBands: ["5-8", "6-8", "9-12"],
      subjects: ["ELA", "Writing"]
    },
    {
      id: "wc-5",
      target: "equivalent",
      forbidden: ["same", "equal", "match", "similar"],
      scaffolds: ["Use a representation (fraction bar, number line, or area model).", "Explain why two forms represent the same value."],
      requiredMove: "Explain equivalent without using the word 'same'.",
      skillTag: "MATH.CONCEPT.EQUIVALENCE",
      gradeBands: ["3-5", "6-8"],
      subjects: ["Math"]
    },
    {
      id: "wc-6",
      target: "decompose",
      forbidden: ["break", "split", "divide", "cut"],
      scaffolds: ["Use a place value chart or area model.", "Name the parts you broke the number into."],
      requiredMove: "Use decompose in a sentence about a specific number or shape.",
      skillTag: "MATH.CONCEPT.DECOMPOSE",
      gradeBands: ["K-2", "3-5"],
      subjects: ["Math"]
    },
    {
      id: "wc-7",
      target: "infer",
      forbidden: ["guess", "think", "know", "feel"],
      scaffolds: ["Use a text clue + background knowledge together.", "Sentence frame: 'I infer ___ because the text says ___ and I know ___.'" ],
      requiredMove: "Make an inference and cite the evidence you used.",
      skillTag: "LIT.COMP.INFERENCE",
      gradeBands: ["3-5", "6-8"],
      subjects: ["ELA"]
    },
    {
      id: "wc-8",
      target: "justify",
      forbidden: ["explain", "show", "prove", "tell"],
      scaffolds: ["State your answer first, then support it.", "Use: 'I know this because…'"],
      requiredMove: "Justify your answer using at least one piece of evidence.",
      skillTag: "LIT.WRITING.JUSTIFY",
      gradeBands: ["3-5", "6-8", "9-12"],
      subjects: ["ELA", "Writing", "Math"]
    }
  ];

  var CONTENT = Object.freeze({
    "word-quest": WORD_QUEST_PACK,
    "word-connections": WORD_CONNECTIONS_PACK,
    "morphology-builder": morphologyContent || [],
    "concept-ladder": ladderContent || [],
    "error-detective": errorContent || [],
    "rapid-category": categoryContent || [],
    "sentence-builder": sentenceContent || []
  });

  function normalizeGradeBand(value) {
    var raw = String(value || "").toUpperCase();
    if (raw === "K-2" || raw === "3-5" || raw === "6-8" || raw === "9-12") return raw;
    if (/K|1|2/.test(raw)) return "K-2";
    if (/3|4|5/.test(raw)) return "3-5";
    if (/6|7|8/.test(raw)) return "6-8";
    return "9-12";
  }

  function inferSubject(context) {
    var ctx = context && typeof context === "object" ? context : {};
    var program = String(ctx.programId || "").toLowerCase();
    var subject = String(ctx.subject || "").trim();
    var title = String(ctx.lessonTitle || ctx.conceptFocus || "").toLowerCase();
    if (subject) return subject;
    if (program.indexOf("illustrative") >= 0 || program.indexOf("bridges") >= 0 || title.indexOf("math") >= 0) return "Math";
    if (program.indexOf("fundations") >= 0 || program.indexOf("wilson") >= 0 || program.indexOf("ufli") >= 0 || program.indexOf("just-words") >= 0) return "Intervention";
    if (program.indexOf("writing") >= 0 || title.indexOf("writing") >= 0) return "Writing";
    if (title.indexOf("science") >= 0) return "Science";
    return "ELA";
  }

  function recommendedGame(context) {
    var subject = inferSubject(context);
    var program = String(context && context.programId || "").toLowerCase();
    if (program.indexOf("fundations") >= 0 || program.indexOf("wilson") >= 0 || program.indexOf("ufli") >= 0) return "morphology-builder";
    if (subject === "Math") return "concept-ladder";
    if (subject === "Writing") return "sentence-builder";
    return "word-quest";
  }

  function filterDeck(gameId, context) {
    var ctx = context && typeof context === "object" ? context : {};
    var gradeBand = normalizeGradeBand(ctx.gradeBand || ctx.grade || "3-5");
    var subject = inferSubject(ctx);
    var programId = String(ctx.programId || "").toLowerCase();
    var rows = (CONTENT[gameId] || []).filter(function (row) {
      var gradeOk = !row.gradeBands || row.gradeBands.indexOf(gradeBand) >= 0;
      var subjectOk = !row.subjects || row.subjects.indexOf(subject) >= 0 || row.subjects.indexOf("ELA") >= 0 && subject === "Intervention";
      var programOk = !row.programs || !row.programs.length || row.programs.some(function (value) {
        return programId.indexOf(String(value || "").toLowerCase()) >= 0;
      });
      return gradeOk && subjectOk && programOk;
    });
    if (!rows.length) rows = (CONTENT[gameId] || []).slice();
    return rows;
  }

  function pickRound(gameId, context, history) {
    var rows = filterDeck(gameId, context);
    var used = {};
    (Array.isArray(history) ? history : []).forEach(function (row) {
      used[String(row && row.label || "")] = true;
    });
    var unused = rows.filter(function (row) {
      return !used[String(row.prompt || row.word || row.target || row.id || "")];
    });
    var pool = unused.length ? unused : rows;
    if (!pool.length) {
      return generator && typeof generator.generateGameContent === "function"
        ? generator.generateGameContent({
            gameType: gameId,
            gradeBand: normalizeGradeBand(context && context.gradeBand),
            subject: inferSubject(context),
            lessonContext: context || {},
            vocabularyFocus: context && context.vocabularyFocus || ""
          })
        : null;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return {
    inferSubject: inferSubject,
    recommendedGame: recommendedGame,
    pickRound: pickRound,
    filterDeck: filterDeck,
    generateGameContent: generator && generator.generateGameContent
      ? generator.generateGameContent
      : function () { return null; }
  };
});
