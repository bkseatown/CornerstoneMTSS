/**
 * action-logger.js
 * TEACHER ACTION & OUTCOME LOGGING
 * Tracks teacher delivery and student outcomes for validation loop
 */
class ActionLogger {
  constructor(curriculumSyncStore) {
    this.store = curriculumSyncStore;
    this.ACTION_TYPES = {
      DELIVERED: 'delivered',
      PARTIAL: 'partial',
      ADAPTED: 'adapted',
      NOT_DELIVERED: 'not-delivered',
      DEFERRED: 'deferred',
    };
  }

  async logAction(action) {
    try {
      this._validateAction(action);
      const logRecord = {
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action,
        actionTimestamp: Date.now(),
        actionDateTime: new Date().toISOString(),
      };
      await this.store.recordTeacherAction(logRecord);
      return logRecord;
    } catch (err) {
      console.error('ActionLogger.logAction failed:', err);
      throw err;
    }
  }

  async getActionLog(filters = {}) {
    try {
      const log = await this.store.getTeacherActionLog(filters);
      let filtered = log;
      if (filters.actionType) {
        filtered = filtered.filter(a => a.actionType === filters.actionType);
      }
      return filtered;
    } catch (err) {
      console.error('ActionLogger.getActionLog failed:', err);
      throw err;
    }
  }

  async getActionStats(filters = {}) {
    const log = await this.getActionLog(filters);
    return {
      totalActions: log.length,
      deliveredCount: log.filter(a => a.actionType === 'delivered').length,
      deliveryRate: log.length > 0 ? log.filter(a => ['delivered', 'partial', 'adapted'].includes(a.actionType)).length / log.length : 0,
      studentsTracked: new Set(log.map(a => a.studentId)).size,
    };
  }

  async logOutcome(outcome) {
    try {
      this._validateOutcome(outcome);
      const outcomeRecord = {
        id: `OUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...outcome,
        outcomeTimestamp: Date.now(),
        outcomeDateTime: new Date().toISOString(),
      };
      await this.store.recordOutcome(outcomeRecord);
      return outcomeRecord;
    } catch (err) {
      console.error('ActionLogger.logOutcome failed:', err);
      throw err;
    }
  }

  _validateAction(action) {
    if (!action.recommendationId) throw new Error('recommendationId required');
    if (!action.studentId) throw new Error('studentId required');
    if (!action.teacherId) throw new Error('teacherId required');
    if (!action.actionType) throw new Error('actionType required');
    if (!Object.values(this.ACTION_TYPES).includes(action.actionType)) {
      throw new Error(`Invalid actionType: ${action.actionType}`);
    }
  }

  _validateOutcome(outcome) {
    if (!outcome.actionId) throw new Error('actionId required');
    if (!outcome.studentId) throw new Error('studentId required');
    if (typeof outcome.improvementPercent !== 'number') throw new Error('improvementPercent (number) required');
    if (typeof outcome.metGoal !== 'boolean') throw new Error('metGoal (boolean) required');
  }
}

module.exports = ActionLogger;
