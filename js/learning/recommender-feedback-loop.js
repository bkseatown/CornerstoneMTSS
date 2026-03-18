/**
 * recommender-feedback-loop.js
 * RECOMMENDER LEARNING SYSTEM
 * Feeds intervention outcomes back to InterventionRecommender
 * Improves future recommendation quality based on what actually worked
 */
class RecommenderFeedbackLoop {
  constructor(interventionRecommender, impactReport) {
    this.recommender = interventionRecommender;
    this.impactReport = impactReport;

    this.weights = {
      'phonics-intensive': { baseWeight: 1.0, successRate: 0, attempts: 0 },
      'fluency-focus': { baseWeight: 1.0, successRate: 0, attempts: 0 },
      'comprehension-strategy': { baseWeight: 1.0, successRate: 0, attempts: 0 },
      'enrichment': { baseWeight: 1.0, successRate: 0, attempts: 0 },
      'maintenance': { baseWeight: 1.0, successRate: 0, attempts: 0 },
    };

    this.gapMappings = new Map();
    this.studentPatterns = new Map();
  }

  async processOutcome(outcome) {
    try {
      this._updateInterventionWeights(outcome);
      this._learnGapMapping(outcome);
      this._learnStudentPattern(outcome);

      console.log('📚 Feedback loop learned from outcome:', {
        studentId: outcome.studentId,
        interventionType: outcome.interventionType,
        success: outcome.metGoal,
      });
    } catch (err) {
      console.error('RecommenderFeedbackLoop.processOutcome failed:', err);
      throw err;
    }
  }

  getInterventionWeight(interventionType) {
    const weight = this.weights[interventionType];
    if (!weight) return 1.0;

    const successMultiplier = weight.attempts > 0
      ? 1.0 + (weight.successRate - 0.5) * 2
      : 1.0;

    return Math.max(0.5, Math.min(2.0, weight.baseWeight * successMultiplier));
  }

  getBestInterventionForGap(gapDescription) {
    const mapping = this.gapMappings.get(gapDescription);
    if (!mapping || mapping.attempts === 0) return null;

    return Object.entries(mapping).reduce((best, [type, data]) => {
      if (data.attempts === 0) return best;
      const rate = data.successes / data.attempts;
      return rate > best.rate ? { type, rate } : best;
    }, { type: null, rate: 0 }).type;
  }

  adjustRecommendationByFeedback(recommendation, interventionType) {
    const weight = this.getInterventionWeight(interventionType);
    if (weight < 0.7) {
      return {
        ...recommendation,
        confidence: recommendation.confidence * weight,
        note: `Confidence adjusted based on effectiveness`,
      };
    }
    return recommendation;
  }

  getLearnings() {
    const weights = Object.entries(this.weights).reduce((acc, [type, data]) => {
      acc[type] = this.getInterventionWeight(type);
      return acc;
    }, {});

    const insights = [];
    Object.entries(weights).forEach(([type, weight]) => {
      const change = (weight - 1.0) * 100;
      if (Math.abs(change) > 5) {
        insights.push(`${type} effectiveness: ${change > 0 ? '+' : ''}${change.toFixed(0)}%`);
      }
    });

    return {
      generatedAt: new Date().toISOString(),
      interventionWeights: weights,
      insights,
    };
  }

  _updateInterventionWeights(outcome) {
    const weight = this.weights[outcome.interventionType];
    if (!weight) return;

    weight.attempts++;
    if (outcome.metGoal) {
      weight.successRate = (weight.successRate * (weight.attempts - 1) + 1) / weight.attempts;
    } else {
      weight.successRate = (weight.successRate * (weight.attempts - 1)) / weight.attempts;
    }
  }

  _learnGapMapping(outcome) {
    const gap = outcome.specificGap || 'unknown';
    if (!this.gapMappings.has(gap)) {
      this.gapMappings.set(gap, {});
    }

    const mapping = this.gapMappings.get(gap);
    if (!mapping[outcome.interventionType]) {
      mapping[outcome.interventionType] = { attempts: 0, successes: 0 };
    }

    const interventionData = mapping[outcome.interventionType];
    interventionData.attempts++;
    if (outcome.metGoal) interventionData.successes++;
  }

  _learnStudentPattern(outcome) {
    const studentId = outcome.studentId;
    if (!this.studentPatterns.has(studentId)) {
      this.studentPatterns.set(studentId, {});
    }

    const patterns = this.studentPatterns.get(studentId);
    if (!patterns[outcome.interventionType]) {
      patterns[outcome.interventionType] = { attempts: 0, successes: 0 };
    }

    const typeData = patterns[outcome.interventionType];
    typeData.attempts++;
    if (outcome.metGoal) typeData.successes++;
  }
}

module.exports = RecommenderFeedbackLoop;
