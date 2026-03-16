/**
 * intervention-impact-report.spec.js
 * Unit tests for InterventionImpactReport - impact measurement
 */
const InterventionImpactReport = require('../js/reporting/intervention-impact-report.js');

describe('InterventionImpactReport', () => {
  let report;
  beforeEach(() => {
    const mockLogger = {
      getActionLog: async (filters) => [],
      getOutcomeLog: async (filters) => [],
    };
    report = new InterventionImpactReport(mockLogger);
  });

  it('should categorize substantial improvement', () => {
    expect(report._categorizeImprovement(0.30)).toBe('SUBSTANTIAL');
    expect(report._categorizeImprovement(0.25)).toBe('SUBSTANTIAL');
  });

  it('should categorize moderate improvement', () => {
    expect(report._categorizeImprovement(0.20)).toBe('MODERATE');
  });

  it('should assess HIGH impact', () => {
    const action = { actionType: 'delivered' };
    const outcome = { metGoal: true, improvementPercent: 0.18 };
    expect(report._assessImpact(action, outcome)).toBe('HIGH');
  });

  it('should assess MEDIUM impact', () => {
    const action = { actionType: 'delivered' };
    const outcome = { metGoal: true, improvementPercent: 0.08 };
    expect(report._assessImpact(action, outcome)).toBe('MEDIUM');
  });

  it('should assess ROI', () => {
    const action = { daysElapsed: 10, lessonsCompleted: ['L1', 'L2'], gamesUsed: ['word-quest'] };
    const outcome = { metGoal: true, improvementPercent: 0.25 };
    expect(report._assessROI(action, outcome)).toBe('EXCELLENT');
  });
});
