/**
 * adaptive-recommendations.js
 * AI-powered adaptive learning recommendations based on student performance
 * Suggests next steps, intervention strategies, and scaffolding
 */

const AdaptiveRecommendations = (() => {
  let studentProfiles = new Map();
  let recommendationEngine = null;

  /**
   * Initialize recommendation engine
   */
  function init() {
    recommendationEngine = {
      thresholds: {
        mastery: 0.85,
        developing: 0.60,
        emerging: 0.40
      },
      patterns: {
        phonemesConfused: new Map(),
        commonErrors: new Map(),
        responseTime: new Map()
      }
    };

    console.log('✅ Adaptive Recommendations initialized');
    return true;
  }

  /**
   * Track student performance and generate recommendations
   * @param {string} studentId - Student ID
   * @param {object} response - {correct, word, responseTime, attempt, context}
   */
  function trackResponse(studentId, response) {
    if (!recommendationEngine) init();

    const {correct, word, responseTime, attempt, context} = response;

    // Initialize or update student profile
    if (!studentProfiles.has(studentId)) {
      studentProfiles.set(studentId, {
        studentId,
        totalAttempts: 0,
        correctAttempts: 0,
        wordPerformance: new Map(),
        phonemeAccuracy: new Map(),
        responseTimeData: [],
        recommendationHistory: []
      });
    }

    const profile = studentProfiles.get(studentId);

    // Update metrics
    profile.totalAttempts++;
    if (correct) profile.correctAttempts++;

    // Track word-specific performance
    const wordData = profile.wordPerformance.get(word) || {
      attempts: 0,
      correct: 0,
      avgResponseTime: 0
    };
    wordData.attempts++;
    if (correct) wordData.correct++;
    wordData.avgResponseTime = (wordData.avgResponseTime * (wordData.attempts - 1) + responseTime) / wordData.attempts;
    profile.wordPerformance.set(word, wordData);

    // Track response times
    profile.responseTimeData.push(responseTime);

    return generateRecommendation(studentId, profile);
  }

  /**
   * Generate adaptive recommendation based on student profile
   */
  function generateRecommendation(studentId, profile) {
    const recommendations = [];

    // Calculate current mastery level
    const masteryLevel = profile.correctAttempts / profile.totalAttempts;

    // 1. Analyze performance patterns
    const analysis = analyzePerformance(profile);

    // 2. Generate recommendations based on analysis
    if (analysis.strugglingWords.length > 0) {
      recommendations.push({
        type: 'reteach',
        priority: 'high',
        title: 'Review Struggling Words',
        description: `Focus on ${analysis.strugglingWords.join(', ')}`,
        action: 'reteach-words',
        words: analysis.strugglingWords,
        reason: 'Student showing <60% accuracy on these words'
      });
    }

    if (analysis.slowResponseTime) {
      recommendations.push({
        type: 'scaffold',
        priority: 'medium',
        title: 'Build Fluency',
        description: 'Student is responding slowly - use repeated exposure and timed practice',
        action: 'fluency-practice',
        suggestion: 'Use lower-difficulty words with time pressure removed',
        reason: `Average response time: ${analysis.avgResponseTime}ms (slow)`
      });
    }

    if (analysis.patternErrors.length > 0) {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        title: 'Phoneme Intervention',
        description: `Student struggles with: ${analysis.patternErrors.join(', ')}`,
        action: 'phoneme-instruction',
        phonemes: analysis.patternErrors,
        reason: 'Systematic phonological error pattern detected'
      });
    }

    if (masteryLevel >= 0.85) {
      recommendations.push({
        type: 'advance',
        priority: 'high',
        title: 'Ready for Next Level',
        description: 'Student has mastered current level - increase difficulty',
        action: 'increase-difficulty',
        reason: `Mastery level: ${Math.round(masteryLevel * 100)}%`
      });
    }

    if (analysis.inconsistency > 0.3) {
      recommendations.push({
        type: 'observe',
        priority: 'medium',
        title: 'High Variability',
        description: 'Student performance is inconsistent - may indicate attention or fatigue',
        action: 'monitor',
        reason: 'Inconsistent accuracy suggests possible factors (fatigue, attention, motivation)'
      });
    }

    // Store recommendations
    profile.recommendationHistory.push({
      timestamp: Date.now(),
      recommendations
    });

    return recommendations;
  }

  /**
   * Analyze student performance for patterns
   */
  function analyzePerformance(profile) {
    const analysis = {
      masteryLevel: profile.correctAttempts / profile.totalAttempts,
      strugglingWords: [],
      advancedWords: [],
      avgResponseTime: 0,
      slowResponseTime: false,
      patternErrors: [],
      inconsistency: 0
    };

    // Analyze word performance
    let totalResponseTime = 0;
    const wordAccuracies = [];

    profile.wordPerformance.forEach((data, word) => {
      const accuracy = data.correct / data.attempts;
      const avgTime = data.avgResponseTime;

      totalResponseTime += avgTime;
      wordAccuracies.push({word, accuracy, avgTime});

      if (accuracy < 0.60) {
        analysis.strugglingWords.push(word);
      } else if (accuracy >= 0.85) {
        analysis.advancedWords.push(word);
      }

      // Flag slow responses
      if (avgTime > 3000) {
        analysis.slowResponseTime = true;
      }
    });

    analysis.avgResponseTime = totalResponseTime / wordAccuracies.length;

    // Analyze inconsistency (standard deviation)
    const mean = analysis.masteryLevel;
    const variance = wordAccuracies.reduce((sum, w) => {
      return sum + Math.pow(w.accuracy - mean, 2);
    }, 0) / Math.max(1, wordAccuracies.length);
    analysis.inconsistency = Math.sqrt(variance);

    // Detect phoneme pattern errors (simple heuristic)
    const phonemeErrors = detectPhonemePatterns(profile);
    analysis.patternErrors = phonemeErrors;

    return analysis;
  }

  /**
   * Detect phonological error patterns
   */
  function detectPhonemePatterns(profile) {
    const patterns = [];

    // Common pattern detections
    const strugglingWords = Array.from(profile.wordPerformance.entries())
      .filter(([, data]) => data.correct / data.attempts < 0.5)
      .map(([word]) => word);

    // Check for common phoneme confusions
    const consonantBlends = ['BL', 'BR', 'CL', 'CR', 'DR', 'FR', 'GR', 'PR', 'TR'];
    const vowelDigraphs = ['EA', 'OO', 'AI', 'OY', 'OU'];

    consonantBlends.forEach(blend => {
      const count = strugglingWords.filter(w => w.includes(blend)).length;
      if (count > strugglingWords.length * 0.5) {
        patterns.push(`Consonant blend: ${blend}`);
      }
    });

    vowelDigraphs.forEach(digraph => {
      const count = strugglingWords.filter(w => w.includes(digraph)).length;
      if (count > strugglingWords.length * 0.5) {
        patterns.push(`Vowel digraph: ${digraph}`);
      }
    });

    return patterns;
  }

  /**
   * Get recommendations for student
   */
  function getRecommendations(studentId) {
    const profile = studentProfiles.get(studentId);
    if (!profile) return [];

    if (profile.recommendationHistory.length === 0) {
      return [];
    }

    return profile.recommendationHistory[profile.recommendationHistory.length - 1].recommendations;
  }

  /**
   * Get student profile
   */
  function getProfile(studentId) {
    return studentProfiles.get(studentId);
  }

  /**
   * Get all student profiles
   */
  function getAllProfiles() {
    return Array.from(studentProfiles.values());
  }

  /**
   * Get class-level analytics
   */
  function getClassAnalytics() {
    const profiles = getAllProfiles();

    if (profiles.length === 0) {
      return {
        totalStudents: 0,
        classAverage: 0,
        strugglingStudents: [],
        advancedStudents: [],
        commonErrors: []
      };
    }

    const classAverage = profiles.reduce((sum, p) => {
      return sum + (p.correctAttempts / p.totalAttempts);
    }, 0) / profiles.length;

    const strugglingStudents = profiles
      .filter(p => (p.correctAttempts / p.totalAttempts) < 0.60)
      .map(p => ({studentId: p.studentId, accuracy: p.correctAttempts / p.totalAttempts}));

    const advancedStudents = profiles
      .filter(p => (p.correctAttempts / p.totalAttempts) >= 0.85)
      .map(p => ({studentId: p.studentId, accuracy: p.correctAttempts / p.totalAttempts}));

    // Aggregate error patterns
    const errorCounts = {};
    profiles.forEach(p => {
      if (p.recommendationHistory.length > 0) {
        const recs = p.recommendationHistory[p.recommendationHistory.length - 1].recommendations;
        recs.forEach(r => {
          if (r.type === 'intervention' && r.phonemes) {
            r.phonemes.forEach(ph => {
              errorCounts[ph] = (errorCounts[ph] || 0) + 1;
            });
          }
        });
      }
    });

    const commonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({error, count}));

    return {
      totalStudents: profiles.length,
      classAverage: Math.round(classAverage * 100),
      strugglingStudents,
      advancedStudents,
      commonErrors
    };
  }

  /**
   * Get next lesson recommendation
   */
  function getNextLessonRecommendation(studentId) {
    const recommendations = getRecommendations(studentId);

    // Prioritize recommendations
    const prioritized = recommendations
      .filter(r => r.priority === 'high')
      .sort((a, b) => (b.priority === 'high' ? 1 : -1));

    if (prioritized.length === 0) {
      return recommendations[0] || {
        type: 'continue',
        title: 'Continue Practice',
        description: 'Student is progressing well',
        action: 'continue'
      };
    }

    return prioritized[0];
  }

  /**
   * Reset student profile
   */
  function resetStudent(studentId) {
    studentProfiles.delete(studentId);
    console.log(`✓ Student ${studentId} profile reset`);
  }

  return {
    init,
    trackResponse,
    getRecommendations,
    getProfile,
    getAllProfiles,
    getClassAnalytics,
    getNextLessonRecommendation,
    resetStudent
  };
})();
