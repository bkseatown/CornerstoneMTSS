(function lessonGeneratorModule() {
  "use strict";

  function fallbackLesson(targetSkill, gradeBand, tier) {
    var skill = String(targetSkill || "reasoning");
    return {
      objective: "Students will improve " + skill.replace(/_/g, " ") + " in one revised sentence.",
      teacherModel: "Model: Because the road was flooded, the bus arrived late.",
      guidedPrompt: "Revise this line using " + skill.replace(/_/g, " ") + ": The bus was late.",
      commonErrors: ["No explicit link word", "Vague wording", "Missing punctuation"],
      quickPractice: "Students revise one sentence, then explain their change in 10 words.",
      exitTicket: "Write one sentence at " + String(gradeBand || "grade-level") + " that shows " + skill.replace(/_/g, " ") + "."
    };
  }

  async function generateMiniLesson(input) {
    var src = input && typeof input === "object" ? input : {};
    var targetSkill = String(src.targetSkill || "reasoning");
    var gradeBand = String(src.gradeBand || "3-5");
    var tier = Number(src.tier || 2);

    var svc = window.CSAIService;
    if (!svc || typeof svc.generateMiniLesson !== "function") {
      return fallbackLesson(targetSkill, gradeBand, tier);
    }

    var lesson = await svc.generateMiniLesson({
      targetSkill: targetSkill,
      gradeBand: gradeBand,
      tier: tier,
      channel: "teacher-mini-lesson"
    });

    if (!lesson || typeof lesson !== "object") {
      return fallbackLesson(targetSkill, gradeBand, tier);
    }

    return lesson;
  }

  window.CSLessonGenerator = {
    generateMiniLesson: generateMiniLesson,
    fallbackLesson: fallbackLesson
  };
})();
