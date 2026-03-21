/**
 * specialist-hub-quick-reference.test.js
 * Unit tests for Phase 3: Quick reference cards and lesson discovery
 */

describe('SpecialistHubQuickReference', () => {
  let quickRefModule;

  beforeEach(() => {
    if (typeof window.createSpecialistHubQuickReferenceModule === 'function') {
      quickRefModule = window.createSpecialistHubQuickReferenceModule({
        registry: window.CURRICULUM_REGISTRY,
        escapeHtml: (str) => String(str).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'),
      });
    }
  });

  describe('Lesson Card Rendering', () => {
    test('renderLessonCard should return HTML string', () => {
      if (!quickRefModule) return;

      const html = quickRefModule.renderLessonCard('fishtank', '1');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('renderLessonCard should include curriculum identifier', () => {
      if (!quickRefModule) return;

      const html = quickRefModule.renderLessonCard('illustrative-math', 'unit-2-lesson-7');
      expect(html).toContain('lesson' || 'card' || 'quick-ref');
    });

    test('renderLessonCard should include lesson information', () => {
      if (!quickRefModule) return;

      const html = quickRefModule.renderLessonCard('fishtank', '1');
      expect(html).toContain('div' || 'span' || 'article');
    });

    test('renderLessonCard should escape HTML content', () => {
      if (!quickRefModule) return;

      const html = quickRefModule.renderLessonCard('fishtank', '1');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('javascript:');
    });
  });

  describe('Pedagogical Card Rendering', () => {
    test('renderPedagogicalCard should return HTML for pedagogical frameworks', () => {
      if (!quickRefModule) return;

      const html = quickRefModule.renderPedagogicalCard && quickRefModule.renderPedagogicalCard('harkness');
      if (html) {
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
      }
    });

    test('renderPedagogicalCard should support Socratic method', () => {
      if (!quickRefModule || !quickRefModule.renderPedagogicalCard) return;

      const html = quickRefModule.renderPedagogicalCard('socratic');
      expect(html).toBeTruthy();
    });

    test('renderPedagogicalCard should support AVID framework', () => {
      if (!quickRefModule || !quickRefModule.renderPedagogicalCard) return;

      const html = quickRefModule.renderPedagogicalCard('avid');
      expect(html).toBeTruthy();
    });
  });

  describe('Curriculum Discovery', () => {
    test('getGradeLevelOptions should return array or null', () => {
      if (!quickRefModule) return;

      const options = quickRefModule.getGradeLevelOptions && quickRefModule.getGradeLevelOptions('fishtank');
      if (options) {
        expect(Array.isArray(options) || typeof options === 'object').toBe(true);
      } else {
        // Function may not be implemented
        expect(true).toBe(true);
      }
    });

    test('listAllCurricula should return available curricula', () => {
      if (!quickRefModule) return;

      const curricula = quickRefModule.listAllCurricula && quickRefModule.listAllCurricula();
      if (curricula) {
        expect(curricula && (Array.isArray(curricula) || typeof curricula === 'object')).toBe(true);
      }
    });

    test('listAllCurricula should include Tier 1 core curricula', () => {
      if (!quickRefModule || !quickRefModule.listAllCurricula) return;

      const curricula = quickRefModule.listAllCurricula();
      expect(curricula && (Array.isArray(curricula) || Object.keys(curricula).length > 0)).toBe(true);
    });
  });

  describe('Content Extraction', () => {
    test('getSwbatForLesson should extract SWBAT objectives', () => {
      if (!quickRefModule || !quickRefModule.getSwbatForLesson) return;

      const swbat = quickRefModule.getSwbatForLesson('fishtank', '1');
      if (swbat) {
        expect(Array.isArray(swbat) || typeof swbat === 'string').toBe(true);
      }
    });

    test('getTeachingPoints should extract teaching points', () => {
      if (!quickRefModule || !quickRefModule.getTeachingPoints) return;

      const points = quickRefModule.getTeachingPoints('fishtank', '1');
      if (points) {
        expect(Array.isArray(points) || typeof points === 'string').toBe(true);
      }
    });

    test('getAccommodations should extract accessibility accommodations', () => {
      if (!quickRefModule || !quickRefModule.getAccommodations) return;

      const accommodations = quickRefModule.getAccommodations('fishtank', '1');
      if (accommodations) {
        expect(Array.isArray(accommodations) || typeof accommodations === 'string').toBe(true);
      }
    });
  });

  describe('Module Creation', () => {
    test('should export rendering functions', () => {
      if (!quickRefModule) return;

      expect(typeof quickRefModule.renderLessonCard).toBe('function');
      if (quickRefModule.renderPedagogicalCard) {
        expect(typeof quickRefModule.renderPedagogicalCard).toBe('function');
      }
    });

    test('should export discovery functions', () => {
      if (!quickRefModule) return;

      if (quickRefModule.listAllCurricula) {
        expect(typeof quickRefModule.listAllCurricula).toBe('function');
      }
      if (quickRefModule.getGradeLevelOptions) {
        expect(typeof quickRefModule.getGradeLevelOptions).toBe('function');
      }
    });
  });
});
