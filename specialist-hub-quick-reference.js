/**
 * specialist-hub-quick-reference.js — Quick Reference Cards for Instruction
 *
 * Provides ready-to-use UI components for displaying teaching points, SWBATs,
 * practice ideas, and scaffolds at the moment of teaching.
 *
 * Supports co-teaching workflow: teacher can quickly reference what to teach
 * without having textbook/materials nearby.
 */

function createSpecialistHubQuickReferenceModule(deps) {
  "use strict";

  var registry = deps.registry;
  var escapeHtml = deps.escapeHtml || function (str) { return String(str).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); };

  if (!registry) {
    console.warn("[SpecialistHubQuickReference] Missing registry dependency. Module disabled.");
    return null;
  }

  /**
   * Render a quick-reference card for a lesson
   * Shows: focus, SWBAT, teaching points, practice ideas, accommodations
   */
  function renderLessonCard(curriculumId, lessonId) {
    var curriculum = registry.getCurriculum(curriculumId);
    if (!curriculum) return "<div class=\"qr-card\">Curriculum not found: " + escapeHtml(curriculumId) + "</div>";

    var lesson = null;
    var lessonParent = null;

    // Find lesson in units or cycles or other structure
    if (curriculum.units) {
      for (var i = 0; i < curriculum.units.length; i++) {
        for (var j = 0; j < curriculum.units[i].lessons.length; j++) {
          if (curriculum.units[i].lessons[j].id === lessonId) {
            lesson = curriculum.units[i].lessons[j];
            lessonParent = curriculum.units[i];
            break;
          }
        }
      }
    } else if (curriculum.cycles) {
      for (var i = 0; i < curriculum.cycles.length; i++) {
        if (curriculum.cycles[i].id === lessonId) {
          lesson = curriculum.cycles[i];
          break;
        }
      }
    } else if (curriculum.groups) {
      for (var i = 0; i < curriculum.groups.length; i++) {
        if (curriculum.groups[i].lessons) {
          for (var j = 0; j < curriculum.groups[i].lessons.length; j++) {
            if (curriculum.groups[i].lessons[j].id === lessonId) {
              lesson = curriculum.groups[i].lessons[j];
              lessonParent = curriculum.groups[i];
              break;
            }
          }
        }
      }
    } else if (curriculum.steps) {
      for (var i = 0; i < curriculum.steps.length; i++) {
        if (curriculum.steps[i].id === lessonId) {
          lesson = curriculum.steps[i];
          break;
        }
      }
    } else if (curriculum.strands) {
      for (var i = 0; i < curriculum.strands.length; i++) {
        if (curriculum.strands[i].id === lessonId) {
          lesson = curriculum.strands[i];
          break;
        }
      }
    }

    if (!lesson) return "<div class=\"qr-card\">Lesson not found: " + escapeHtml(lessonId) + "</div>";

    var html = "<div class=\"qr-card qr-lesson-card\">";
    html += "<div class=\"qr-header\">";
    html += "<h3 class=\"qr-curriculum\">" + escapeHtml(curriculum.name) + "</h3>";
    if (lessonParent) {
      html += "<h4 class=\"qr-unit\">" + escapeHtml(lessonParent.title || lessonParent.name) + "</h4>";
    }
    html += "</div>";

    if (lesson.focus) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Today's Focus</div>";
      html += "<div class=\"qr-content\">" + escapeHtml(lesson.focus) + "</div>";
      html += "</div>";
    }

    if (lesson.swbat && lesson.swbat.length > 0) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">SWBAT (Students Will Be Able To)</div>";
      html += "<ul class=\"qr-list\">";
      for (var i = 0; i < lesson.swbat.length; i++) {
        html += "<li>" + escapeHtml(lesson.swbat[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lesson.teachingPoints && lesson.teachingPoints.length > 0) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Key Teaching Points</div>";
      html += "<ul class=\"qr-list\">";
      for (var i = 0; i < lesson.teachingPoints.length; i++) {
        html += "<li>" + escapeHtml(lesson.teachingPoints[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lesson.practiceIdeas && lesson.practiceIdeas.length > 0) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Practice Ideas</div>";
      html += "<ul class=\"qr-list\">";
      for (var i = 0; i < lesson.practiceIdeas.length; i++) {
        html += "<li>" + escapeHtml(lesson.practiceIdeas[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lesson.accommodations && lesson.accommodations.length > 0) {
      html += "<div class=\"qr-section qr-accommodations\">";
      html += "<div class=\"qr-label\">Accommodations (T2/T3 in T1 Classroom)</div>";
      html += "<ul class=\"qr-list\">";
      for (var i = 0; i < lesson.accommodations.length; i++) {
        html += "<li>" + escapeHtml(lesson.accommodations[i]) + "</li>";
      }
      html += "</ul>";
      html += "</div>";
    }

    if (lesson.scaffolds) {
      html += "<div class=\"qr-section qr-scaffolds\">";
      html += "<div class=\"qr-label\">Scaffolds</div>";
      if (lesson.scaffolds.struggling && lesson.scaffolds.struggling.length > 0) {
        html += "<div class=\"qr-scaffold-group\">";
        html += "<div class=\"qr-scaffold-type\">For Struggling Learners</div>";
        html += "<ul class=\"qr-list\">";
        for (var i = 0; i < lesson.scaffolds.struggling.length; i++) {
          html += "<li>" + escapeHtml(lesson.scaffolds.struggling[i]) + "</li>";
        }
        html += "</ul>";
        html += "</div>";
      }
      if (lesson.scaffolds.advanced && lesson.scaffolds.advanced.length > 0) {
        html += "<div class=\"qr-scaffold-group\">";
        html += "<div class=\"qr-scaffold-type\">For Advanced Learners</div>";
        html += "<ul class=\"qr-list\">";
        for (var i = 0; i < lesson.scaffolds.advanced.length; i++) {
          html += "<li>" + escapeHtml(lesson.scaffolds.advanced[i]) + "</li>";
        }
        html += "</ul>";
        html += "</div>";
      }
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  /**
   * Render a reference card for a pedagogical framework
   */
  function renderPedagogicalCard(curriculumId) {
    var framework = registry.getCurriculum(curriculumId);
    if (!framework || framework.type !== "pedagogical") {
      return "<div class=\"qr-card\">Framework not found: " + escapeHtml(curriculumId) + "</div>";
    }

    var html = "<div class=\"qr-card qr-framework-card\">";
    html += "<h3 class=\"qr-framework-title\">" + escapeHtml(framework.name) + "</h3>";

    if (framework.description) {
      html += "<p class=\"qr-description\">" + escapeHtml(framework.description) + "</p>";
    }

    // Harkness/Socratic specific sections
    if (framework.teacherPrep) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Teacher Preparation</div>";
      if (framework.teacherPrep.role) {
        html += "<div class=\"qr-subsection\">";
        html += "<div class=\"qr-sublabel\">Your Role</div>";
        html += "<p>" + escapeHtml(framework.teacherPrep.role) + "</p>";
        html += "</div>";
      }
      if (framework.teacherPrep.questions && framework.teacherPrep.questions.length > 0) {
        html += "<div class=\"qr-subsection\">";
        html += "<div class=\"qr-sublabel\">Prepare Questions</div>";
        html += "<ul class=\"qr-list\">";
        for (var i = 0; i < framework.teacherPrep.questions.length; i++) {
          html += "<li>" + escapeHtml(framework.teacherPrep.questions[i]) + "</li>";
        }
        html += "</ul>";
        html += "</div>";
      }
      html += "</div>";
    }

    if (framework.studentPrep) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Student Preparation</div>";
      if (framework.studentPrep.beforeDiscussion && framework.studentPrep.beforeDiscussion.length > 0) {
        html += "<div class=\"qr-subsection\">";
        html += "<div class=\"qr-sublabel\">Before Discussion</div>";
        html += "<ul class=\"qr-list\">";
        for (var i = 0; i < framework.studentPrep.beforeDiscussion.length; i++) {
          html += "<li>" + escapeHtml(framework.studentPrep.beforeDiscussion[i]) + "</li>";
        }
        html += "</ul>";
        html += "</div>";
      }
      if (framework.studentPrep.swbat && framework.studentPrep.swbat.length > 0) {
        html += "<div class=\"qr-subsection\">";
        html += "<div class=\"qr-sublabel\">SWBAT</div>";
        html += "<ul class=\"qr-list\">";
        for (var i = 0; i < framework.studentPrep.swbat.length; i++) {
          html += "<li>" + escapeHtml(framework.studentPrep.swbat[i]) + "</li>";
        }
        html += "</ul>";
        html += "</div>";
      }
      html += "</div>";
    }

    // AVID elements
    if (framework.elements) {
      html += "<div class=\"qr-section\">";
      html += "<div class=\"qr-label\">Elements</div>";
      Object.keys(framework.elements).forEach(function (elementKey) {
        var element = framework.elements[elementKey];
        html += "<div class=\"qr-element\">";
        html += "<div class=\"qr-element-title\">" + escapeHtml(elementKey.replace(/-/g, " ")) + "</div>";
        if (element.description) {
          html += "<p class=\"qr-element-desc\">" + escapeHtml(element.description) + "</p>";
        }
        if (element.swbat && element.swbat.length > 0) {
          html += "<ul class=\"qr-list\">";
          for (var i = 0; i < element.swbat.length; i++) {
            html += "<li>" + escapeHtml(element.swbat[i]) + "</li>";
          }
          html += "</ul>";
        }
        html += "</div>";
      });
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  /**
   * Get all curricula available for a specific grade
   */
  function getGradeLevelOptions(grade) {
    return registry.getByGrade(grade);
  }

  /**
   * Get all Tier 1 and Tier 2/3 options
   */
  function getCurriculaByTier(tier) {
    return registry.getByTier(tier);
  }

  /**
   * List all curricula with metadata
   */
  function listAllCurricula() {
    return registry.listCurricula();
  }

  return {
    renderLessonCard: renderLessonCard,
    renderPedagogicalCard: renderPedagogicalCard,
    getGradeLevelOptions: getGradeLevelOptions,
    getCurriculaByTier: getCurriculaByTier,
    listAllCurricula: listAllCurricula
  };
}

// Wire to global scope
if (typeof window !== "undefined") {
  window.createSpecialistHubQuickReferenceModule = createSpecialistHubQuickReferenceModule;
}
