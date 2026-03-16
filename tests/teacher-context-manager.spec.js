/**
 * teacher-context-manager.spec.js
 *
 * Unit tests for TeacherContextManager
 * Validates multi-class context switching and state management
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase D: Scaling & Optimization
 */

const TeacherContextManager = require('../js/scaling/teacher-context-manager.js');

describe('TeacherContextManager', () => {
  let manager;
  let mockDashboard;
  let mockActionLogger;
  let mockReport;

  beforeEach(() => {
    mockDashboard = {
      loadForTeacher: jest.fn().mockResolvedValue({
        categorized: {
          primaryFocus: [],
          secondaryWatch: [],
          onTrack: [],
        },
        studentSnapshots: [],
        summary: {
          totalStudents: 20,
          primaryFocusCount: 3,
          secondaryWatchCount: 5,
          onTrackCount: 12,
          percentOnTrack: '60.0',
          loadTimeMs: 150,
        },
      }),
    };

    mockActionLogger = {
      logAction: jest.fn().mockResolvedValue('ACTION_LOG_001'),
    };

    mockReport = {};

    manager = new TeacherContextManager(
      mockDashboard,
      mockActionLogger,
      mockReport
    );
  });

  describe('initialization', () => {
    it('should initialize with teacher ID and class contexts', async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
        { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' },
      ];

      const result = await manager.initialize('T001', contexts);

      expect(result).toEqual(contexts);
      expect(manager.teacherId).toBe('T001');
      expect(manager.recentlyUsed).toEqual(['C1', 'C2']);
    });

    it('should register all contexts in the map', async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
        { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' },
      ];

      await manager.initialize('T001', contexts);

      expect(manager.contexts.size).toBe(2);
      expect(manager.contexts.has('C1')).toBe(true);
      expect(manager.contexts.has('C2')).toBe(true);
    });
  });

  describe('context switching', () => {
    beforeEach(async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
        { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' },
      ];
      await manager.initialize('T001', contexts);
    });

    it('should switch to a registered class context', async () => {
      const result = await manager.switchContext('C1', [], []);

      expect(manager.currentContext.classId).toBe('C1');
      expect(result.classId).toBe('C1');
      expect(result.fromCache).toBe(false);
    });

    it('should move switched context to front of MRU list', async () => {
      await manager.switchContext('C1', [], []);
      await manager.switchContext('C2', [], []);
      await manager.switchContext('C1', [], []);

      expect(manager.getMRUContexts()[0]).toBe('C1');
    });

    it('should throw error for unknown class', async () => {
      await expect(manager.switchContext('C_UNKNOWN', [], [])).rejects.toThrow();
    });

    it('should cache dashboard state', async () => {
      await manager.switchContext('C1', [], []);

      expect(mockDashboard.loadForTeacher).toHaveBeenCalledTimes(1);

      // Switch back (should use cache)
      await new Promise(r => setTimeout(r, 10));
      await manager.switchContext('C2', [], []);
      await manager.switchContext('C1', [], []);

      expect(mockDashboard.loadForTeacher).toHaveBeenCalledTimes(2); // Called again
    });
  });

  describe('daily standup', () => {
    beforeEach(async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
        { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' },
      ];
      await manager.initialize('T001', contexts);
      await manager.switchContext('C1', [], []);
      await manager.switchContext('C2', [], []);
    });

    it('should generate daily standup across all classes', async () => {
      const standup = await manager.getDailyStandup();

      expect(standup.teacherId).toBe('T001');
      expect(standup.classSnapshots.length).toBe(2);
      expect(standup.totalPrimaryFocus).toBeDefined();
      expect(standup.totalSecondaryWatch).toBeDefined();
      expect(standup.totalOnTrack).toBeDefined();
    });

    it('should include per-class metrics', async () => {
      const standup = await manager.getDailyStandup();

      const c1Snapshot = standup.classSnapshots.find(s => s.classId === 'C1');
      expect(c1Snapshot.subject).toBe('Reading');
      expect(c1Snapshot.primaryFocus).toBe(3);
      expect(c1Snapshot.percentOnTrack).toBe('60.0');
    });
  });

  describe('action recording', () => {
    beforeEach(async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
      ];
      await manager.initialize('T001', contexts);
    });

    it('should record action in a specific class', async () => {
      const actionId = await manager.recordActionInClass('C1', 'REC_001', 'delivered', {
        notes: 'Completed phonics lesson',
      });

      expect(actionId).toBe('ACTION_LOG_001');
      expect(mockActionLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: 'T001',
          classId: 'C1',
          recommendationId: 'REC_001',
          actionType: 'delivered',
          notes: 'Completed phonics lesson',
        })
      );
    });

    it('should throw error for unknown class', async () => {
      await expect(
        manager.recordActionInClass('C_UNKNOWN', 'REC_001', 'delivered')
      ).rejects.toThrow();
    });
  });

  describe('class performance', () => {
    beforeEach(async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
      ];
      await manager.initialize('T001', contexts);
      await manager.switchContext('C1', [], []);
    });

    it('should get performance metrics for a class', async () => {
      const perf = await manager.getClassPerformance('C1');

      expect(perf.classId).toBe('C1');
      expect(perf.subject).toBe('Reading');
      expect(perf.metrics.totalStudents).toBe(20);
      expect(perf.metrics.primaryFocus).toBe(3);
    });

    it('should return null for unloaded class', async () => {
      const perf = await manager.getClassPerformance('C2');

      expect(perf).toBe(null);
    });
  });

  describe('context queries', () => {
    beforeEach(async () => {
      const contexts = [
        { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
        { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' },
      ];
      await manager.initialize('T001', contexts);
    });

    it('should get current context', () => {
      manager.currentContext = { classId: 'C1' };
      const ctx = manager.getCurrentContext();

      expect(ctx.classId).toBe('C1');
    });

    it('should get all contexts', () => {
      const all = manager.getAllContexts();

      expect(all.length).toBe(2);
      expect(all.some(c => c.classId === 'C1')).toBe(true);
    });

    it('should get MRU contexts (top 5)', () => {
      const mru = manager.getMRUContexts();

      expect(mru.length).toBeLessThanOrEqual(5);
      expect(mru[0]).toBe('C1');
    });
  });
});
