/**
 * intervention-recommender.js
 *
 * RECOMMENDATION SYNTHESIS ENGINE
 * ================================
 * Transforms curriculum + evidence + competency → specific teacher actions
 * "What should this teacher do for this student TODAY?"
 *
 * INPUT: Curriculum context + Student competency + Evidence history
 * OUTPUT: Specific, actionable intervention (lessons + games + timeline)
 *
 * PHILOSOPHY:
 * Teachers choose tools based on one criterion: "Does this make my life better?"
 * Recommendations must be immediately actionable, specific, and timely.
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Part 2: Accuracy Problem + Recommendation Synthesis
 */

class InterventionRecommender {
  constructor(curriculumEngine, competencyMapper, evidenceStore) {
    this.curriculum = curriculumEngine;
    this.competency = competencyMapper;
    this.evidence = evidenceStore;

    /**
     * Intervention types and their characteristics
     * Used to select appropriate intervention pathway
     */
    this.interventionTypes = {
      'phonics-intensive': {
        name: 'Intensive Phonics Sequence',
        duration: 10,
        daysPerWeek: 5,
        sessionLength: 20,
        gameWeighting: ['word-quest', 'precision-play'],
        suitableFor: ['EMERGING', 'DEVELOPING'],
      },
      'fluency-focus': {
        name: 'Fluency & Automaticity',
        duration: 14,
        daysPerWeek: 3,
        sessionLength: 15,
        gameWeighting: ['typing-quest'],
        suitableFor: ['DEVELOPING'],
      },
      'comprehension-strategy': {
        name: 'Comprehension Strategy Instruction',
        duration: 14,
        daysPerWeek: 3,
        sessionLength: 25,
        gameWeighting: ['reading-lab'],
        suitableFor: ['DEVELOPING', 'PROFICIENT'],
      },
      'enrichment': {
        name: 'Challenge & Enrichment',
        duration: 21,
        daysPerWeek: 2,
        sessionLength: 20,
        gameWeighting: ['word-quest', 'typing-quest'],
        suitableFor: ['ADVANCED'],
      },
      'maintenance': {
        name: 'Skill Maintenance',
        duration: 30,
        daysPerWeek: 2,
        sessionLength: 15,
        gameWeighting: ['mixed'],
        suitableFor: ['PROFICIENT'],
      },
    };

    /**
     * Urgency levels for prioritizing student interventions
     * Used by daily dashboard to rank students
     */
    this.urgencyLevels = {
      CRITICAL: 4,         // Immediate action needed (score <40%)
      HIGH: 3,             // This week
      MEDIUM: 2,           // This month
      LOW: 1,              // Monitor, no intervention yet
      NONE: 0,             // On track
    };
  }

  /**
   * Main recommendation method
   * Given student + lesson + competency, generate specific intervention
   *
   * @async
   * @param {object} student - Student object with id, gradeLevel, classId
   * @param {string} standardId - Standard with identified gap
   * @param {object} competencyData - Output from competency-mapper
   * @param {string} lessonId - Current lesson context (optional)
   *
   * @returns {Promise<object>} Recommendation object
   *   @property {string} id - Unique recommendation ID
   *   @property {string} studentId - Student this recommendation is for
   *   @property {string} standardId - Standard being addressed
   *   @property {string} interventionType - Type of intervention
   *   @property {string} name - Human-readable intervention name
   *   @property {object} sequence - Lesson + game sequence
   *   @property {number} estimatedDays - How long intervention takes
   *   @property {number} urgency - Urgency level (0-4)
   *   @property {string} action - What teacher does today
   *   @property {number} confidence - Confidence in recommendation (0-1)
   *
   * @example
   * const rec = await recommender.recommendIntervention(
   *   { id: 'S001', gradeLevel: '3', classId: 'C1' },
   *   '3.RF.3',
   *   competencyData,
   *   'L_3_RF_001'
   * );
   * // Returns: {
   * //   id: 'REC_20260316_001',
   * //   interventionType: 'phonics-intensive',
   * //   name: 'Intensive Phonics Sequence',
   * //   sequence: [
   * //     { type: 'lesson', id: 'L_3_RF_001', duration: 45 },
   * //     { type: 'game', id: 'word-quest', variant: 'blends', duration: 15 }
   * //   ],
   * //   estimatedDays: 10,
   * //   urgency: 3,
   * //   action: 'Start lesson on consonant blends; follow with Word Quest blend practice',
   * //   confidence: 0.85
   * // }
   */
  async recommendIntervention(student, standardId, competencyData, lessonId) {
    try {
      // Select intervention type based on competency level
      const interventionType = this._selectInterventionType(competencyData);

      // Build lesson + game sequence
      const sequence = await this._buildInterventionSequence(
        standardId,
        interventionType,
        student.gradeLevel
      );

      // Determine urgency
      const urgency = this._computeUrgency(competencyData);

      // Generate specific action
      const action = this._generateAction(interventionType, competencyData);

      // Build recommendation object
      const recommendation = {
        id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studentId: student.id,
        standardId: standardId,
        gradeLevel: student.gradeLevel,
        interventionType: interventionType.type,
        name: interventionType.name,
        description: interventionType.description,
        sequence: sequence,
        estimatedDays: interventionType.duration,
        daysPerWeek: interventionType.daysPerWeek,
        sessionLength: interventionType.sessionLength,
        urgency: urgency,
        urgencyLabel: this._getUrgencyLabel(urgency),
        action: action,
        confidence: this._computeRecommendationConfidence(competencyData),
        competencyDataSnapshot: {
          level: competencyData.level,
          confidence: competencyData.confidence,
          gap: competencyData.specificGap,
        },
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
      };

      return recommendation;
    } catch (err) {
      console.error('InterventionRecommender.recommendIntervention failed:', err);
      throw err;
    }
  }

  /**
   * Batch recommendations for whole class/group
   * Used by daily dashboard to prioritize students
   *
   * @async
   * @param {Array} students - Array of student objects
   * @param {Array} competencyDataList - Competency inferences for each student
   * @returns {Promise<Array>} Sorted recommendations (urgent first)
   */
  async recommendInterventionBatch(students, competencyDataList) {
    const recommendations = await Promise.all(
      students.map((student, idx) =>
        this.recommendIntervention(
          student,
          competencyDataList[idx].standardId,
          competencyDataList[idx]
        ).catch(err => ({
          error: true,
          studentId: student.id,
          message: err.message,
        }))
      )
    );

    // Sort by urgency (high first)
    return recommendations
      .filter(r => !r.error)
      .sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Select intervention type based on competency level and gap
   *
   * @private
   * @param {object} competencyData - Competency inference
   * @returns {object} Selected intervention type config
   */
  _selectInterventionType(competencyData) {
    const levelName = competencyData.levelName;
    const gap = competencyData.specificGap;

    // Map competency level to intervention strategy
    if (levelName === 'EMERGING') {
      // Struggling significantly → intensive intervention
      if (gap.includes('Phonics') || gap.includes('Decoding')) {
        return {
          type: 'phonics-intensive',
          ...this.interventionTypes['phonics-intensive'],
        };
      }
      if (gap.includes('Fluency')) {
        return {
          type: 'fluency-focus',
          ...this.interventionTypes['fluency-focus'],
        };
      }
      // Default for EMERGING
      return {
        type: 'phonics-intensive',
        ...this.interventionTypes['phonics-intensive'],
      };
    }

    if (levelName === 'DEVELOPING') {
      // Making progress → targeted intervention
      if (gap.includes('Fluency')) {
        return {
          type: 'fluency-focus',
          ...this.interventionTypes['fluency-focus'],
        };
      }
      if (gap.includes('Comprehension')) {
        return {
          type: 'comprehension-strategy',
          ...this.interventionTypes['comprehension-strategy'],
        };
      }
      // Default for DEVELOPING
      return {
        type: 'fluency-focus',
        ...this.interventionTypes['fluency-focus'],
      };
    }

    if (levelName === 'PROFICIENT') {
      // On track → maintenance
      return {
        type: 'maintenance',
        ...this.interventionTypes['maintenance'],
      };
    }

    if (levelName === 'ADVANCED') {
      // Exceeding → enrichment
      return {
        type: 'enrichment',
        ...this.interventionTypes['enrichment'],
      };
    }

    // Default fallback
    return {
      type: 'maintenance',
      ...this.interventionTypes['maintenance'],
    };
  }

  /**
   * Build sequence of lessons and games for intervention
   *
   * @private
   * @param {string} standardId - Standard being addressed
   * @param {object} interventionType - Selected intervention type
   * @param {string} gradeLevel - Student grade level
   * @returns {Promise<Array>} Sequence of lesson + game objects
   */
  async _buildInterventionSequence(standardId, interventionType, gradeLevel) {
    try {
      // Get lessons that address this standard
      const lessons = await this.curriculum.getLessonsForStandard(standardId);

      // Filter to intervention-tagged lessons if available
      const interventionLessons = lessons.filter(
        l => l.tags && l.tags.includes('intervention')
      );

      const selectedLessons = (interventionLessons.length > 0
        ? interventionLessons
        : lessons
      ).slice(0, 3);

      // Map games based on intervention type
      const gameSequence = interventionType.gameWeighting.map(gameType => ({
        type: 'game',
        gameType: gameType,
        sessionLength: interventionType.sessionLength,
        repetitions: 3, // Default: 3 plays of each game type
      }));

      // Interleave lessons and games
      const sequence = [];
      selectedLessons.forEach((lesson, idx) => {
        sequence.push({
          type: 'lesson',
          id: lesson.id,
          name: lesson.name,
          duration: lesson.duration,
          sequencePosition: sequence.length + 1,
        });

        // Add game after each lesson
        if (idx < gameSequence.length) {
          sequence.push({
            type: 'game',
            gameType: gameSequence[idx].gameType,
            sessionLength: gameSequence[idx].sessionLength,
            repetitions: gameSequence[idx].repetitions,
            sequencePosition: sequence.length + 1,
          });
        }
      });

      return sequence;
    } catch (err) {
      console.error('Error building intervention sequence:', err);
      return [];
    }
  }

  /**
   * Compute urgency level for this recommendation
   *
   * @private
   * @param {object} competencyData - Competency inference
   * @returns {number} Urgency level (0-4)
   */
  _computeUrgency(competencyData) {
    const levelName = competencyData.levelName;
    const confidence = competencyData.confidence;

    // Map competency level to urgency
    if (levelName === 'EMERGING') {
      // Struggling student = CRITICAL urgency
      return this.urgencyLevels.CRITICAL;
    }
    if (levelName === 'DEVELOPING') {
      // Progressing but not there yet = HIGH urgency
      return this.urgencyLevels.HIGH;
    }
    if (levelName === 'PROFICIENT') {
      // On track = LOW urgency
      return this.urgencyLevels.LOW;
    }
    if (levelName === 'ADVANCED') {
      // Exceeding = NONE (no intervention needed)
      return this.urgencyLevels.NONE;
    }

    return this.urgencyLevels.MEDIUM;
  }

  /**
   * Generate specific teacher action
   *
   * @private
   * @param {object} interventionType - Selected intervention type
   * @param {object} competencyData - Competency data
   * @returns {string} Specific action teacher should take
   */
  _generateAction(interventionType, competencyData) {
    const gap = competencyData.specificGap;
    const type = interventionType.type;

    const actions = {
      'phonics-intensive': `Start intensive phonics: ${gap}. Deliver 20-min lesson + 15-min game practice daily for 10 days.`,
      'fluency-focus': `Work on fluency: ${gap}. Use timed reading + Typing Quest. 3x/week, 15 min each.`,
      'comprehension-strategy': `Teach comprehension: ${gap}. Model strategy, guided practice, then independent practice via games.`,
      'maintenance': `Continue current pace. Review ${gap} 1x/week as maintenance.`,
      'enrichment': `Challenge student. Introduce next skill level or advanced variant.`,
    };

    return actions[type] || 'Deliver intervention as planned.';
  }

  /**
   * Get human-readable urgency label
   *
   * @private
   * @param {number} urgency - Urgency level (0-4)
   * @returns {string} Label
   */
  _getUrgencyLabel(urgency) {
    const labels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Critical',
    };
    return labels[urgency] || 'Unknown';
  }

  /**
   * Compute confidence in this recommendation
   *
   * @private
   * @param {object} competencyData - Competency inference
   * @returns {number} Confidence (0-1)
   */
  _computeRecommendationConfidence(competencyData) {
    // Recommendation confidence = competency confidence
    // (If we're uncertain about the gap, the rec is uncertain)
    return competencyData.confidence;
  }
}

// EXPORT FOR USE IN OTHER MODULES
module.exports = InterventionRecommender;
