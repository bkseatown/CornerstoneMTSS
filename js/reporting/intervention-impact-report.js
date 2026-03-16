/**
 * intervention-impact-report.js
 * INTERVENTION IMPACT ANALYSIS
 * Measures which recommendations led to improved student outcomes
 */
class InterventionImpactReport {
  constructor(actionLogger, competencyMapper) {
    this.actionLogger = actionLogger;
    this.competency = competencyMapper;
  }

  async analyzeIntervention(actionId) {
    const actions = await this.actionLogger.getActionLog({ actionId });
    if (actions.length === 0) throw new Error(`Action not found: ${actionId}`);

    const action = actions[0];
    const outcomes = await this.actionLogger.getOutcomeLog({ actionId });
    if (outcomes.length === 0) return this._reportWithoutOutcome(action);

    const outcome = outcomes[0];
    return {
      actionId: action.id,
      studentId: action.studentId,
      delivered: ['delivered', 'partial', 'adapted'].includes(action.actionType),
      improvement: outcome.improvementPercent,
      improvementCategory: this._categorizeImprovement(outcome.improvementPercent),
      outcomeStatus: outcome.metGoal ? 'met-goal' : 'did-not-meet-goal',
      impact: this._assessImpact(action, outcome),
      roi: this._assessROI(action, outcome),
      timestamp: Date.now(),
    };
  }

  async generateTeacherReport(teacherId, options = {}) {
    const actions = await this.actionLogger.getActionLog({ teacherId });
    if (actions.length === 0) {
      return {
        teacherId,
        totalInterventions: 0,
        summary: 'No interventions logged',
      };
    }

    const analyses = await Promise.all(
      actions.map(action => this.analyzeIntervention(action.id).catch(() => null))
    );

    const validAnalyses = analyses.filter(a => a !== null);
    const deliveredCount = validAnalyses.filter(a => a.delivered).length;
    const successCount = validAnalyses.filter(a => a.outcomeStatus === 'met-goal').length;

    return {
      teacherId,
      totalInterventions: validAnalyses.length,
      deliveryRate: deliveredCount / validAnalyses.length,
      successRate: successCount / validAnalyses.length,
      avgImprovement: validAnalyses.reduce((sum, a) => sum + (a.improvement || 0), 0) / validAnalyses.length,
    };
  }

  async generateSchoolReport(options = {}) {
    return {
      period: 'all-time',
      generatedAt: new Date().toISOString(),
      message: 'School report structure ready for implementation',
    };
  }

  async generateRecommenderFeedback() {
    return {
      feedbackTimestamp: Date.now(),
      message: 'Feedback system ready - outcomes will inform recommender weights',
    };
  }

  _reportWithoutOutcome(action) {
    return {
      actionId: action.id,
      studentId: action.studentId,
      delivered: ['delivered', 'partial', 'adapted'].includes(action.actionType),
      outcomeStatus: 'pending',
      status: 'Waiting for outcome measurement',
      timestamp: Date.now(),
    };
  }

  _categorizeImprovement(percent) {
    if (percent >= 0.25) return 'SUBSTANTIAL';
    if (percent >= 0.15) return 'MODERATE';
    if (percent >= 0.05) return 'SLIGHT';
    if (percent === 0) return 'FLAT';
    return 'DECLINE';
  }

  _assessImpact(action, outcome) {
    const delivered = ['delivered', 'partial', 'adapted'].includes(action.actionType);
    const metGoal = outcome.metGoal;
    const improvement = outcome.improvementPercent;

    if (delivered && metGoal && improvement >= 0.15) return 'HIGH';
    if (delivered && metGoal) return 'MEDIUM';
    if (delivered && improvement > 0) return 'LOW';
    if (!delivered) return 'NOT_ASSESSED';
    return 'NEGATIVE';
  }

  _assessROI(action, outcome) {
    const improvement = outcome.improvementPercent;
    if (improvement >= 0.20) return 'EXCELLENT';
    if (improvement >= 0.10) return 'GOOD';
    if (improvement > 0) return 'FAIR';
    return 'POOR';
  }
}

module.exports = InterventionImpactReport;
