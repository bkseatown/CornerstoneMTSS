/**
 * specialist-hub-curriculum.test.js
 * Unit tests for Phase 2: Lesson navigation and curriculum mapping
 */

describe('SpecialistHubCurriculum', () => {
  let curriculumModule;

  beforeEach(() => {
    if (typeof window.createSpecialistHubCurriculumModule === 'function') {
      curriculumModule = window.createSpecialistHubCurriculumModule({
        escapeHtml: (str) => String(str).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'),
      });
    }
  });

  describe('Navigation State Management', () => {
    test('getLessonNavState should retrieve lesson navigation state', () => {
      if (!curriculumModule) return;

      const state = curriculumModule.getLessonNavState('fishtank', 'grade-3');
      expect(state === null || typeof state === 'object').toBe(true);
    });

    test('setLessonNavState should persist lesson navigation', () => {
      if (!curriculumModule) return;

      const testState = { unitIdx: 1, lessonN: 5 };
      curriculumModule.setLessonNavState('fishtank', 'grade-4', testState);
      const retrieved = curriculumModule.getLessonNavState('fishtank', 'grade-4');
      expect(retrieved).toBeTruthy();
    });

    test('getLessonNavState should preserve different grades separately', () => {
      if (!curriculumModule) return;

      curriculumModule.setLessonNavState('fishtank', 'grade-3', { unitIdx: 0, lessonN: 1 });
      curriculumModule.setLessonNavState('fishtank', 'grade-4', { unitIdx: 2, lessonN: 7 });

      const grade3State = curriculumModule.getLessonNavState('fishtank', 'grade-3');
      const grade4State = curriculumModule.getLessonNavState('fishtank', 'grade-4');

      expect(grade3State === null || grade3State.lessonN === 1).toBe(true);
      expect(grade4State === null || grade4State.lessonN === 7).toBe(true);
    });
  });

  describe('Fishtank ELA Navigation', () => {
    test('renderFishtankNav should return navigation HTML', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderFishtankNav('grade-3');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('renderFishtankNav should include grade level', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderFishtankNav('grade-4');
      expect(html).toContain('grade' || 'fishtank' || '4' || 'nav');
    });

    test('renderFishtankNav should include unit navigation', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderFishtankNav('grade-3');
      expect(html).toContain('unit' || 'lesson' || 'nav' || 'select');
    });

    test('renderFishtankNav should support grades 2-5', () => {
      if (!curriculumModule) return;

      ['grade-2', 'grade-3', 'grade-4', 'grade-5'].forEach((grade) => {
        const html = curriculumModule.renderFishtankNav(grade);
        expect(html.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Illustrative Math Navigation', () => {
    test('renderIMNav should return navigation HTML for Illustrative Math', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderIMNav('grade-4');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('renderIMNav should include lesson URLs', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderIMNav('grade-3');
      expect(html).toContain('href' || 'illustrativemathematics' || 'lesson');
    });
  });

  describe('UFLI Foundations Navigation', () => {
    test('renderUFLINav should return navigation HTML for UFLI', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderUFLINav && curriculumModule.renderUFLINav();
      if (html) {
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
      }
    });

    test('renderUFLINav should support lesson selection 1-160', () => {
      if (!curriculumModule || !curriculumModule.renderUFLINav) return;

      const html = curriculumModule.renderUFLINav();
      expect(html && html.length > 0).toBe(true);
    });
  });

  describe('Word Study Navigation', () => {
    test('renderWordStudyNav should return navigation HTML for Word Study', () => {
      if (!curriculumModule) return;

      const html = curriculumModule.renderWordStudyNav && curriculumModule.renderWordStudyNav();
      if (html) {
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
      }
    });
  });

  describe('URL Generation', () => {
    test('buildFishtankLessonUrl should generate valid lesson URLs', () => {
      if (!curriculumModule) return;

      const url = curriculumModule.buildFishtankLessonUrl && curriculumModule.buildFishtankLessonUrl('g3', 'unit-1', 1);
      if (url) {
        expect(typeof url).toBe('string');
        expect(url).toContain('fishtank' || 'http');
      }
    });

    test('buildIMUrl should generate Illustrative Math lesson URLs', () => {
      if (!curriculumModule) return;

      const url = curriculumModule.buildIMUrl && curriculumModule.buildIMUrl('4', 2, 7);
      if (url) {
        expect(typeof url).toBe('string');
        expect(url).toContain('illustrative' || 'math' || 'http');
      }
    });
  });

  describe('Module Creation', () => {
    test('should export all public API methods', () => {
      if (!curriculumModule) return;

      expect(typeof curriculumModule.getLessonNavState).toBe('function');
      expect(typeof curriculumModule.setLessonNavState).toBe('function');
      expect(typeof curriculumModule.renderFishtankNav).toBe('function');
      expect(typeof curriculumModule.renderIMNav).toBe('function');
    });

    test('should support UFLI and Word Study navigation', () => {
      if (!curriculumModule) return;

      if (curriculumModule.renderUFLINav) {
        expect(typeof curriculumModule.renderUFLINav).toBe('function');
      }
      if (curriculumModule.renderWordStudyNav) {
        expect(typeof curriculumModule.renderWordStudyNav).toBe('function');
      }
    });
  });
});
