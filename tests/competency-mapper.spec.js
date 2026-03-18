/**
 * competency-mapper.spec.js
 *
 * Unit tests for CompetencyMapper
 * Validates game-performance-to-competency-level mapping accuracy
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase A: Evidence-to-Competency Pipeline
 */

const CompetencyMapper = require('../js/evidence/competency-mapper.js');
const CurriculumEngine = require('../js/curriculum/curriculum-engine.js');

describe('CompetencyMapper', () => {
  let mapper;
  let curriculum;

  beforeEach(async () => {
    curriculum = new CurriculumEngine();
    await curriculum.initialize();

    // Mock evidence store for testing
    const mockEvidenceStore = {};

    mapper = new CompetencyMapper(curriculum, mockEvidenceStore);
  });

  describe('competency level classification', () => {
    it('should classify ADVANCED (score >0.90)', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 95,
          accuracy: 0.98,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.levelName).toBe('ADVANCED');
    });

    it('should classify PROFICIENT (score 0.70-0.90)', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 82,
          accuracy: 0.88,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.levelName).toBe('PROFICIENT');
    });

    it('should classify DEVELOPING (score 0.40-0.70)', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 62,
          accuracy: 0.65,
          attemptCount: 2,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.levelName).toBe('DEVELOPING');
    });

    it('should classify EMERGING (score 0-0.40)', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 32,
          accuracy: 0.45,
          attemptCount: 3,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.levelName).toBe('EMERGING');
    });
  });

  describe('confidence scoring', () => {
    it('should reduce confidence with multiple attempts', async () => {
      const one_attempt = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 75,
          accuracy: 0.80,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      const three_attempts = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 75,
          accuracy: 0.80,
          attemptCount: 3,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(three_attempts.confidence).toBeLessThan(one_attempt.confidence);
    });

    it('should increase confidence with higher accuracy', async () => {
      const low_accuracy = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 75,
          accuracy: 0.50,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      const high_accuracy = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 75,
          accuracy: 0.90,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(high_accuracy.confidence).toBeGreaterThan(low_accuracy.confidence);
    });
  });

  describe('gap identification', () => {
    it('should identify specific gap in phonics', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 32,
          accuracy: 0.40,
          attemptCount: 2,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.specificGap).toBeDefined();
      expect(inference.specificGap).toMatch(/Phonics|Decoding/);
    });

    it('should identify no gap for proficient performance', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 90,
          accuracy: 0.95,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.specificGap).toBe('None detected');
    });
  });

  describe('recommendations', () => {
    it('should recommend intervention for EMERGING level', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 32,
          accuracy: 0.40,
          attemptCount: 3,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.recommendation).toMatch(/intervention|Small-group/i);
    });

    it('should recommend monitoring for PROFICIENT level', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 82,
          accuracy: 0.88,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.recommendation).toMatch(/on track|continue/i);
    });

    it('should recommend challenge for ADVANCED level', async () => {
      const inference = await mapper.inferCompetency(
        {
          gameType: 'word-quest',
          score: 98,
          accuracy: 0.99,
          attemptCount: 1,
        },
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inference.recommendation).toMatch(/challenge|advanced/i);
    });
  });

  describe('batch inference', () => {
    it('should infer competency for multiple students', async () => {
      const gamePerformances = [
        {
          gameType: 'word-quest',
          score: 95,
          accuracy: 0.98,
          attemptCount: 1,
        },
        {
          gameType: 'word-quest',
          score: 62,
          accuracy: 0.65,
          attemptCount: 2,
        },
        {
          gameType: 'word-quest',
          score: 32,
          accuracy: 0.40,
          attemptCount: 3,
        },
      ];

      const inferences = await mapper.inferCompetencyBatch(
        gamePerformances,
        { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
      );

      expect(inferences.length).toBe(3);
      expect(inferences[0].levelName).toBe('ADVANCED');
      expect(inferences[1].levelName).toBe('DEVELOPING');
      expect(inferences[2].levelName).toBe('EMERGING');
    });
  });

  describe('data validation', () => {
    it('should handle missing game performance', async () => {
      try {
        await mapper.inferCompetency(null, {
          lessonId: 'L_3_RF_001',
          standardId: '3.RF.3',
          gradeLevel: '3',
        });
        fail('Should have thrown error');
      } catch (err) {
        expect(err.message).toMatch(/required/i);
      }
    });

    it('should handle missing lesson context', async () => {
      try {
        await mapper.inferCompetency(
          {
            gameType: 'word-quest',
            score: 75,
            accuracy: 0.80,
            attemptCount: 1,
          },
          null
        );
        fail('Should have thrown error');
      } catch (err) {
        expect(err.message).toMatch(/required/i);
      }
    });
  });
});
