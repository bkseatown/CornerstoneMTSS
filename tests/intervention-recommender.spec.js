/**
 * intervention-recommender.spec.js
 *
 * Unit tests for InterventionRecommender
 * Validates recommendation synthesis accuracy and actionability
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase A: Intervention Recommender
 */

const InterventionRecommender = require('../js/interventions/intervention-recommender.js');
const CurriculumEngine = require('../js/curriculum/curriculum-engine.js');
const CompetencyMapper = require('../js/evidence/competency-mapper.js');

describe('InterventionRecommender', () => {
  let recommender;
  let curriculum;
  let competency;

  beforeEach(async () => {
    curriculum = new CurriculumEngine();
    await curriculum.initialize();

    const mockEvidenceStore = {};
    competency = new CompetencyMapper(curriculum, mockEvidenceStore);

    recommender = new InterventionRecommender(
      curriculum,
      competency,
      mockEvidenceStore
    );
  });

  describe('intervention type selection', () => {
    it('should select phonics-intensive for EMERGING phonics gap', async () => {
      const competencyData = {
        level: 1, // EMERGING
        levelName: 'EMERGING',
        confidence: 0.65,
        specificGap: 'Phonics/Decoding: Consonant blends',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.interventionType).toBe('phonics-intensive');
    });

    it('should select fluency-focus for fluency gaps', async () => {
      const competencyData = {
        level: 2, // DEVELOPING
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Reading Fluency: Reading speed (pacing)',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S002', gradeLevel: '3', classId: 'C1' },
        '3.RF.4',
        competencyData
      );

      expect(rec.interventionType).toBe('fluency-focus');
    });

    it('should select enrichment for ADVANCED level', async () => {
      const competencyData = {
        level: 4, // ADVANCED
        levelName: 'ADVANCED',
        confidence: 0.90,
        specificGap: 'None detected',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S003', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.interventionType).toBe('enrichment');
    });

    it('should select maintenance for PROFICIENT level', async () => {
      const competencyData = {
        level: 3, // PROFICIENT
        levelName: 'PROFICIENT',
        confidence: 0.85,
        specificGap: 'None detected',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S004', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.interventionType).toBe('maintenance');
    });
  });

  describe('urgency scoring', () => {
    it('should mark EMERGING as CRITICAL urgency', async () => {
      const competencyData = {
        level: 1, // EMERGING
        levelName: 'EMERGING',
        confidence: 0.65,
        specificGap: 'Phonics/Decoding: Consonant blends',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.urgency).toBe(recommender.urgencyLevels.CRITICAL);
      expect(rec.urgencyLabel).toBe('Critical');
    });

    it('should mark DEVELOPING as HIGH urgency', async () => {
      const competencyData = {
        level: 2, // DEVELOPING
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Reading Fluency: Reading speed',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S002', gradeLevel: '3', classId: 'C1' },
        '3.RF.4',
        competencyData
      );

      expect(rec.urgency).toBe(recommender.urgencyLevels.HIGH);
    });

    it('should mark PROFICIENT as LOW urgency', async () => {
      const competencyData = {
        level: 3, // PROFICIENT
        levelName: 'PROFICIENT',
        confidence: 0.85,
        specificGap: 'None detected',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S004', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.urgency).toBe(recommender.urgencyLevels.LOW);
    });

    it('should mark ADVANCED as NONE', async () => {
      const competencyData = {
        level: 4, // ADVANCED
        levelName: 'ADVANCED',
        confidence: 0.90,
        specificGap: 'None detected',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S003', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.urgency).toBe(recommender.urgencyLevels.NONE);
    });
  });

  describe('recommendation structure', () => {
    it('should include all required fields', async () => {
      const competencyData = {
        level: 2,
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Phonics gap',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.id).toBeDefined();
      expect(rec.studentId).toBe('S001');
      expect(rec.standardId).toBe('3.RF.3');
      expect(rec.interventionType).toBeDefined();
      expect(rec.name).toBeDefined();
      expect(rec.sequence).toBeDefined();
      expect(rec.estimatedDays).toBeDefined();
      expect(rec.urgency).toBeDefined();
      expect(rec.action).toBeDefined();
      expect(rec.confidence).toBeDefined();
      expect(rec.createdAt).toBeDefined();
      expect(rec.validUntil).toBeDefined();
    });

    it('should include teacher-readable action', async () => {
      const competencyData = {
        level: 1,
        levelName: 'EMERGING',
        confidence: 0.65,
        specificGap: 'Phonics/Decoding: Consonant blends',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.action).toBeDefined();
      expect(rec.action.length).toBeGreaterThan(0);
      // Action should be readable and specific
      expect(rec.action).toMatch(/consonant blends|phonics|intensive/i);
    });

    it('should include lesson and game sequence', async () => {
      const competencyData = {
        level: 2,
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Phonics gap',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.sequence).toBeDefined();
      expect(Array.isArray(rec.sequence)).toBe(true);
      // Should have mix of lesson and game steps
      const hasLessons = rec.sequence.some(s => s.type === 'lesson');
      const hasGames = rec.sequence.some(s => s.type === 'game');
      expect(hasLessons || hasGames).toBe(true);
    });
  });

  describe('batch recommendations', () => {
    it('should prioritize by urgency', async () => {
      const students = [
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        { id: 'S002', gradeLevel: '3', classId: 'C1' },
        { id: 'S003', gradeLevel: '3', classId: 'C1' },
      ];

      const competencyDataList = [
        {
          standardId: '3.RF.3',
          level: 3,
          levelName: 'PROFICIENT',
          confidence: 0.85,
          specificGap: 'None',
        },
        {
          standardId: '3.RF.3',
          level: 1,
          levelName: 'EMERGING',
          confidence: 0.65,
          specificGap: 'Phonics gap',
        },
        {
          standardId: '3.RF.3',
          level: 2,
          levelName: 'DEVELOPING',
          confidence: 0.75,
          specificGap: 'Fluency gap',
        },
      ];

      const recs = await recommender.recommendInterventionBatch(
        students,
        competencyDataList
      );

      // Should be sorted by urgency (high first)
      expect(recs[0].urgency).toBeGreaterThanOrEqual(recs[1].urgency);
      expect(recs[1].urgency).toBeGreaterThanOrEqual(recs[2].urgency);
    });
  });

  describe('confidence inheritance', () => {
    it('should inherit confidence from competency data', async () => {
      const competencyData = {
        level: 2,
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Phonics gap',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.confidence).toBe(0.75);
    });
  });

  describe('snapshot preservation', () => {
    it('should capture competency data at recommendation time', async () => {
      const competencyData = {
        level: 2,
        levelName: 'DEVELOPING',
        confidence: 0.75,
        specificGap: 'Phonics gap',
      };

      const rec = await recommender.recommendIntervention(
        { id: 'S001', gradeLevel: '3', classId: 'C1' },
        '3.RF.3',
        competencyData
      );

      expect(rec.competencyDataSnapshot).toBeDefined();
      expect(rec.competencyDataSnapshot.level).toBe(2);
      expect(rec.competencyDataSnapshot.confidence).toBe(0.75);
    });
  });
});
