(function curriculumMapModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(typeof globalThis !== "undefined" ? globalThis : root);
    return;
  }
  root.CSCurriculumMap = factory(root);
})(typeof globalThis !== "undefined" ? globalThis : window, function createCurriculumMap(root) {
  "use strict";

  var ILLUSTRATIVE_MAP = Object.freeze({
    grade3: {
      unit1: {
        title: "Area Concepts",
        lessons: {
          lesson1: {
            contentFocus: "Area Models",
            numeracyNode: "Multiplicative Reasoning"
          }
        }
      }
    }
  });

  function safeMap() {
    if (rootHasMap()) return root.CSIllustrativeMathMapData;
    return ILLUSTRATIVE_MAP;
  }

  function rootHasMap() {
    try {
      return !!(typeof root !== "undefined" && root.CSIllustrativeMathMapData && typeof root.CSIllustrativeMathMapData === "object");
    } catch (_e) {
      return false;
    }
  }

  function normalizeKey(prefix, value) {
    var raw = String(value == null ? "" : value).trim().toLowerCase();
    if (!raw) return "";
    if (raw.indexOf(prefix) === 0) return raw;
    var digits = raw.match(/[0-9]+/);
    if (digits && digits[0]) return prefix + digits[0];
    return prefix + raw.replace(/[^a-z0-9]+/g, "");
  }

  function getIllustrativeAlignment(grade, unit, lesson) {
    var map = safeMap();
    var gradeKey = normalizeKey("grade", grade);
    var unitKey = normalizeKey("unit", unit);
    var lessonKey = normalizeKey("lesson", lesson);
    var gradeNode = gradeKey && map && map[gradeKey] ? map[gradeKey] : null;
    var unitNode = gradeNode && unitKey && gradeNode[unitKey] ? gradeNode[unitKey] : null;
    var lessonNode = unitNode && unitNode.lessons && lessonKey && unitNode.lessons[lessonKey]
      ? unitNode.lessons[lessonKey]
      : null;

    if (!unitNode || !lessonNode) return null;

    return {
      title: String(unitNode.title || ""),
      contentFocus: String(lessonNode.contentFocus || ""),
      mappedNumeracyNode: String(lessonNode.numeracyNode || "")
    };
  }

  function getIllustrativeMap() {
    return safeMap();
  }

  return {
    getIllustrativeAlignment: getIllustrativeAlignment,
    getIllustrativeMap: getIllustrativeMap
  };
});
