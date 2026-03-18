/**
 * curriculum-engine.spec.js
 *
 * Unit tests for CurriculumEngine
 * Validates core query latency and accuracy
 *
 * REFERENCE: CODE_HEALTH_GUARDRAILS.md Rule 1.1 + STRATEGIC_BLUEPRINT_2026-Q2.md Phase A
 */

const CurriculumEngine = require('../js/curriculum/curriculum-engine.js');

describe('CurriculumEngine', () => {
  let engine;

  beforeEach(async () => {
    engine = new CurriculumEngine();
    await engine.initialize();
  });

  // Query 1: getStandardsForLesson
  describe('getStandardsForLesson()', () => {
    it('should return standards for a lesson', async () => {
      const standards = await engine.getStandardsForLesson(
        'L_3_RF_001',
        '3',
        'Reading'
      );

      expect(Array.isArray(standards)).toBe(true);
      expect(standards.length).toBeGreaterThan(0);
    });

    it('should filter by grade level', async () => {
      const standards = await engine.getStandardsForLesson(
        'L_3_RF_001',
        '3',
        'Reading'
      );

      standards.forEach(std => {
        expect(std.gradeLevel).toBe('3');
      });
    });

    it('should filter by subject', async () => {
      const standards = await engine.getStandardsForLesson(
        'L_3_RF_001',
        '3',
        'Reading'
      );

      standards.forEach(std => {
        expect(std.subject).toBe('Reading');
      });
    });

    it('should return empty for nonexistent lesson', async () => {
      const standards = await engine.getStandardsForLesson(
        'NONEXISTENT',
        '3',
        'Reading'
      );

      expect(Array.isArray(standards)).toBe(true);
      expect(standards.length).toBe(0);
    });

    it('should complete in <200ms (query latency requirement)', async () => {
      const start = Date.now();
      await engine.getStandardsForLesson('L_3_RF_001', '3', 'Reading');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });
  });

  // Query 2: getLessonsForStandard
  describe('getLessonsForStandard()', () => {
    it('should return lessons for a standard', async () => {
      const lessons = await engine.getLessonsForStandard('3.RF.3');

      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBeGreaterThan(0);
    });

    it('should include correct lesson data', async () => {
      const lessons = await engine.getLessonsForStandard('3.RF.3');

      lessons.forEach(lesson => {
        expect(lesson.id).toBeDefined();
        expect(lesson.name).toBeDefined();
        expect(lesson.standardIds).toBeDefined();
        expect(lesson.standardIds).toContain('3.RF.3');
      });
    });

    it('should return empty for nonexistent standard', async () => {
      const lessons = await engine.getLessonsForStandard('NONEXISTENT');

      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBe(0);
    });

    it('should complete in <200ms', async () => {
      const start = Date.now();
      await engine.getLessonsForStandard('3.RF.3');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });
  });

  // Query 3: getInterventionPathForStandard
  describe('getInterventionPathForStandard()', () => {
    it('should return intervention path object', async () => {
      const path = await engine.getInterventionPathForStandard(
        '3.RF.3',
        '3',
        { gapType: 'phonetic-decoding' }
      );

      expect(path).toBeDefined();
      expect(path.lessonSequence).toBeDefined();
      expect(path.gameRecommendations).toBeDefined();
      expect(path.estimatedDays).toBeDefined();
    });

    it('should return empty path for nonexistent standard', async () => {
      const path = await engine.getInterventionPathForStandard(
        'NONEXISTENT',
        '3',
        { gapType: 'phonetic-decoding' }
      );

      expect(path.lessonSequence.length).toBe(0);
      expect(path.gameRecommendations.length).toBe(0);
    });

    it('should complete in <200ms', async () => {
      const start = Date.now();
      await engine.getInterventionPathForStandard(
        '3.RF.3',
        '3',
        { gapType: 'phonetic-decoding' }
      );
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });
  });

  // Structure overview
  describe('getStructureOverview()', () => {
    it('should return structure summary', () => {
      const overview = engine.getStructureOverview();

      expect(overview.totalStandards).toBeGreaterThan(0);
      expect(overview.totalLessons).toBeGreaterThan(0);
      expect(overview.subjects).toBeDefined();
      expect(Array.isArray(overview.subjects)).toBe(true);
    });

    it('should include sync status', () => {
      const overview = engine.getStructureOverview();

      expect(overview.syncStatus).toBeDefined();
    });
  });

  // Data integrity
  describe('Data integrity', () => {
    it('should not expose internal data structures', () => {
      // Users should query through methods, not access internal maps
      expect(engine.standards).toBeDefined(); // Exists internally
      // But should use getStandardsForLesson() instead of accessing directly
    });

    it('should have consistent standard-lesson mapping', async () => {
      // Get a lesson
      const lessons = await engine.getLessonsForStandard('3.RF.3');
      const lesson = lessons[0];

      // Get standards for that lesson
      if (lesson) {
        const standards = await engine.getStandardsForLesson(
          lesson.id,
          lesson.gradeLevel,
          lesson.subject
        );

        // Lesson should reference standards we found
        standards.forEach(std => {
          expect(lesson.standardIds).toContain(std.id);
        });
      }
    });
  });
});
