/**
 * action-logger.spec.js
 * Unit tests for ActionLogger - teacher action tracking
 */
const ActionLogger = require('../js/tracking/action-logger.js');

describe('ActionLogger', () => {
  let logger;
  beforeEach(() => {
    const mockStore = {
      recordTeacherAction: async (action) => action,
      getTeacherActionLog: async (filters) => [],
      recordOutcome: async (outcome) => outcome,
      getOutcomeLog: async (filters) => [],
    };
    logger = new ActionLogger(mockStore);
  });

  it('should log teacher action', async () => {
    const log = await logger.logAction({
      recommendationId: 'REC_001',
      studentId: 'S001',
      teacherId: 'T001',
      classId: 'C1',
      actionType: 'delivered',
    });

    expect(log.id).toBeDefined();
    expect(log.actionType).toBe('delivered');
  });

  it('should validate actionType', async () => {
    try {
      await logger.logAction({
        recommendationId: 'REC_001',
        studentId: 'S001',
        teacherId: 'T001',
        actionType: 'invalid',
      });
      fail('Should throw error');
    } catch (err) {
      expect(err.message).toMatch(/Invalid actionType/);
    }
  });

  it('should log outcome', async () => {
    const outcome = await logger.logOutcome({
      actionId: 'ACT_001',
      studentId: 'S001',
      improvementPercent: 0.15,
      metGoal: true,
    });

    expect(outcome.id).toBeDefined();
    expect(outcome.metGoal).toBe(true);
  });
});
