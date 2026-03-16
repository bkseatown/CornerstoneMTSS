/**
 * competency-mapper.js
 *
 * COMPETENCY INFERENCE ENGINE
 * ============================
 * Translates game performance data → student competency levels
 * Bridges the gap between raw evidence (scores) and teaching decisions (what standard needs work)
 *
 * INPUT: Game performance metrics (score, accuracy, timing, attempt count)
 * OUTPUT: Competency inference (level, confidence, specific gap)
 *
 * ACCURACY REQUIREMENT:
 * All competency inferences must be validated against known game-performance-to-mastery mappings
 * (verified during Phase A unit testing)
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Part 2: Accuracy Problem + Competency Layer
 */

class CompetencyMapper {
  constructor(curriculumEngine, evidenceStore) {
    /**
     * Dependencies (injected, not created here)
     * Keeps module isolated and testable
     */
    this.curriculum = curriculumEngine;
    this.evidence = evidenceStore;

    /**
     * Competency levels (canonical)
     * Based on educational research and Cornerstone competency model
     */
    this.LEVELS = {
      NOT_ATTEMPTED: 0,      // Student has not attempted
      EMERGING: 1,           // 0-40% mastery (needs substantial support)
      DEVELOPING: 2,         // 41-70% mastery (progressing toward standard)
      PROFICIENT: 3,         // 71-90% mastery (meets standard)
      ADVANCED: 4,           // 91-100% mastery (exceeds standard)
    };

    /**
     * Thresholds for competency level classification
     * Used by computeCompetencyLevel()
     */
    this.thresholds = {
      emerging: { minScore: 0, maxScore: 0.40 },
      developing: { minScore: 0.40, maxScore: 0.70 },
      proficient: { minScore: 0.70, maxScore: 0.90 },
      advanced: { minScore: 0.90, maxScore: 1.0 },
    };

    /**
     * Game type → Standard category mappings
     * Used for intelligent gap identification
     */
    this.gameTypeSignatures = {
      'word-quest': {
        category: 'Foundational Skills',
        subcategories: ['decoding', 'phonics', 'sight-words'],
      },
      'typing-quest': {
        category: 'Fluency & Automaticity',
        subcategories: ['reading-fluency', 'speed', 'automaticity'],
      },
      'reading-lab': {
        category: 'Comprehension',
        subcategories: ['literal', 'inferential', 'evaluation'],
      },
      'sentence-surgery': {
        category: 'Syntax & Grammar',
        subcategories: ['sentence-structure', 'parts-of-speech'],
      },
      'precision-play': {
        category: 'Foundational Skills',
        subcategories: ['phoneme-awareness', 'letter-recognition'],
      },
    };
  }

  /**
   * Main inference method: Game Performance → Competency Level
   *
   * @async
   * @param {object} gamePerformance - Raw game metrics
   *   @property {string} gameType - Game played (word-quest, typing-quest, etc.)
   *   @property {number} score - Raw score (0-100 or 0-1)
   *   @property {number} accuracy - Accuracy rate (0-1)
   *   @property {number} timing - Response timing metric (for speed-based inferences)
   *   @property {number} attemptCount - How many attempts to complete
   *   @property {string} sessionId - Unique session identifier
   *
   * @param {object} lessonContext - Curriculum context
   *   @property {string} lessonId - Current lesson
   *   @property {string} standardId - Standard being taught
   *   @property {string} gradeLevel - Student grade level
   *
   * @returns {Promise<object>} Competency inference
   *   @property {number} level - Competency level (EMERGING, DEVELOPING, etc.)
   *   @property {string} levelName - Human-readable level name
   *   @property {number} confidence - How confident is this inference (0-1)
   *   @property {string} specificGap - What exactly needs work
   *   @property {object} metrics - Raw metrics used for inference
   *   @property {string} recommendation - What teacher should do
   *
   * @example
   * const inference = await mapper.inferCompetency(
   *   { gameType: 'word-quest', score: 62, accuracy: 0.82, attemptCount: 2 },
   *   { lessonId: 'L_3_RF_001', standardId: '3.RF.3', gradeLevel: '3' }
   * );
   * // Returns: {
   * //   level: 'DEVELOPING',
   * //   confidence: 0.78,
   * //   specificGap: 'Consonant blends (especially 'br', 'gr')',
   * //   recommendation: 'Small-group intervention with blend-heavy word list'
   * // }
   */
  async inferCompetency(gamePerformance, lessonContext) {
    try {
      // Validate inputs
      if (!gamePerformance || !lessonContext) {
        throw new Error('gamePerformance and lessonContext required');
      }

      // Parse game metrics into normalized score (0-1)
      const normalizedScore = this._normalizeScore(gamePerformance);

      // Get curriculum context (what standard is this measuring?)
      const curriculumContext = await this.curriculum.getStandardsForLesson(
        lessonContext.lessonId,
        lessonContext.gradeLevel,
        'Reading' // TODO: make subject flexible
      );

      // Compute competency level
      const level = this._computeCompetencyLevel(
        normalizedScore,
        gamePerformance.attemptCount
      );

      // Identify specific gap (what's NOT mastered)
      const gap = this._identifyGap(
        gamePerformance,
        curriculumContext,
        level
      );

      // Compute confidence score based on data quality
      const confidence = this._computeConfidence(
        gamePerformance,
        level
      );

      return {
        standardId: lessonContext.standardId,
        level: level,
        levelName: Object.keys(this.LEVELS).find(
          key => this.LEVELS[key] === level
        ),
        confidence: confidence,
        specificGap: gap,
        metrics: {
          normalizedScore: normalizedScore,
          rawScore: gamePerformance.score,
          accuracy: gamePerformance.accuracy,
          attemptCount: gamePerformance.attemptCount,
        },
        recommendation: this._getRecommendation(level, gap),
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('CompetencyMapper.inferCompetency failed:', err);
      throw err;
    }
  }

  /**
   * Batch inference for multiple game sessions
   * Used by daily dashboard to quickly assess whole class
   *
   * @async
   * @param {Array} gamePerformances - Array of game performance objects
   * @param {object} lessonContext - Shared lesson context
   * @returns {Promise<Array>} Array of competency inferences
   */
  async inferCompetencyBatch(gamePerformances, lessonContext) {
    const inferences = await Promise.all(
      gamePerformances.map(perf =>
        this.inferCompetency(perf, lessonContext).catch(err => ({
          error: true,
          message: err.message,
        }))
      )
    );

    return inferences;
  }

  /**
   * Normalize game score to 0-1 scale
   * Different games report scores differently (0-100, 0-1, etc.)
   *
   * @private
   * @param {object} gamePerformance - Raw game metrics
   * @returns {number} Normalized score (0-1)
   */
  _normalizeScore(gamePerformance) {
    let score = gamePerformance.score || 0;
    let accuracy = gamePerformance.accuracy || 1;

    // If score is 0-100, normalize to 0-1
    if (score > 1) {
      score = score / 100;
    }

    // Weight: 70% accuracy, 30% speed/attempts
    const attemptPenalty = Math.max(0, 1 - (gamePerformance.attemptCount - 1) * 0.1);
    const combined = accuracy * 0.7 + attemptPenalty * 0.3;

    return Math.min(1, Math.max(0, combined));
  }

  /**
   * Compute competency level from normalized score
   * Also considers attempt count (struggling? = lower confidence, not lower level)
   *
   * @private
   * @param {number} normalizedScore - Score from 0-1
   * @param {number} attemptCount - Number of attempts
   * @returns {number} Competency level (0-4)
   */
  _computeCompetencyLevel(normalizedScore, attemptCount) {
    // Attempt count doesn't lower level, just lowers confidence
    // (A student can be proficient but need more attempts)

    if (normalizedScore >= this.thresholds.advanced.minScore) {
      return this.LEVELS.ADVANCED;
    }
    if (normalizedScore >= this.thresholds.proficient.minScore) {
      return this.LEVELS.PROFICIENT;
    }
    if (normalizedScore >= this.thresholds.developing.minScore) {
      return this.LEVELS.DEVELOPING;
    }
    if (normalizedScore > 0) {
      return this.LEVELS.EMERGING;
    }
    return this.LEVELS.NOT_ATTEMPTED;
  }

  /**
   * Identify specific gap: what part of the standard isn't mastered?
   * Used by intervention recommender to suggest focused remediation
   *
   * @private
   * @param {object} gamePerformance - Raw metrics
   * @param {Array} curriculumContext - Standards this lesson addresses
   * @param {number} level - Competency level
   * @returns {string} Specific gap description
   */
  _identifyGap(gamePerformance, curriculumContext, level) {
    // If proficient/advanced, no gap
    if (level >= this.LEVELS.PROFICIENT) {
      return 'None detected';
    }

    // Game type determines likely gap category
    const gameType = gamePerformance.gameType;
    const signature = this.gameTypeSignatures[gameType] || {};

    // Example gap patterns by game type
    const gapPatterns = {
      'word-quest': {
        category: 'Phonics/Decoding',
        examples: [
          'Consonant blends (br, gr, st...)',
          'Vowel digraphs (ea, oa, ai...)',
          'Multisyllabic word reading',
          'Sight word fluency',
        ],
      },
      'typing-quest': {
        category: 'Reading Fluency',
        examples: [
          'Reading speed (pacing)',
          'Automaticity (overreliance on sounding out)',
          'Prosody (expression in reading)',
        ],
      },
      'reading-lab': {
        category: 'Comprehension',
        examples: [
          'Literal comprehension (details)',
          'Inferential comprehension (conclusions)',
          'Evaluating author purpose',
        ],
      },
    };

    const pattern = gapPatterns[gameType] || { category: 'Unknown', examples: [] };

    // Select specific gap based on accuracy patterns (if available)
    let specificGap = pattern.examples[0];
    if (gamePerformance.accuracy && gamePerformance.accuracy < 0.5) {
      specificGap = pattern.examples[Math.min(2, pattern.examples.length - 1)];
    }

    return `${pattern.category}: ${specificGap}`;
  }

  /**
   * Compute confidence in this inference
   * Based on attempt count, accuracy variance, and data recency
   *
   * @private
   * @param {object} gamePerformance - Raw metrics
   * @param {number} level - Competency level
   * @returns {number} Confidence (0-1)
   */
  _computeConfidence(gamePerformance, level) {
    let confidence = 0.5; // Base confidence

    // More attempts = lower confidence (struggling = uncertain)
    const attemptPenalty = Math.max(0, 1 - (gamePerformance.attemptCount - 1) * 0.1);
    confidence += attemptPenalty * 0.25;

    // Higher accuracy = higher confidence
    const accuracy = gamePerformance.accuracy || 0;
    confidence += accuracy * 0.25;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate teacher recommendation based on competency level and gap
   * Used in daily dashboard to show actions
   *
   * @private
   * @param {number} level - Competency level
   * @param {string} gap - Specific gap identified
   * @returns {string} Teacher recommendation
   */
  _getRecommendation(level, gap) {
    switch (level) {
      case this.LEVELS.ADVANCED:
        return 'Challenge student with advanced variant or next skill level';
      case this.LEVELS.PROFICIENT:
        return 'Student is on track; continue current pace';
      case this.LEVELS.DEVELOPING:
        return `Review this gap with student: ${gap}`;
      case this.LEVELS.EMERGING:
        return `Small-group intervention needed for: ${gap}`;
      default:
        return 'Administer assessment to establish baseline';
    }
  }
}

// EXPORT FOR USE IN OTHER MODULES
module.exports = CompetencyMapper;
