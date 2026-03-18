/**
 * daily-dashboard.js
 *
 * DAILY DASHBOARD ENGINE
 * ======================
 * Surfaces the convergence of curriculum + evidence + recommendations
 * into a single teacher-day snapshot showing:
 * - 3 students needing PRIMARY FOCUS (critical/high urgency)
 * - 5 students needing SECONDARY WATCH (medium urgency)
 * - Remaining students ON TRACK (low/no urgency)
 *
 * PHILOSOPHY:
 * Teachers need ONE screen that answers: "What should I do with which students today?"
 * This page provides that answer in <1 second.
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Part 3: Alignment Problem + Daily Dashboard
 */

class DailyDashboard {
  constructor(
    curriculumEngine,
    competencyMapper,
    interventionRecommender,
    evidenceStore
  ) {
    /**
     * Dependencies injected (not created here)
     * All read-only; this module synthesizes, doesn't modify
     */
    this.curriculum = curriculumEngine;
    this.competency = competencyMapper;
    this.recommender = interventionRecommender;
    this.evidence = evidenceStore;

    /**
     * Student prioritization categories
     * Used to organize dashboard view
     */
    this.categories = {
      PRIMARY_FOCUS: {
        capacity: 3,
        urgencyRange: [3, 4], // HIGH, CRITICAL
        color: 'red',
        label: '🔴 PRIMARY FOCUS',
        description: 'Needs action today',
      },
      SECONDARY_WATCH: {
        capacity: 5,
        urgencyRange: [2], // MEDIUM
        color: 'yellow',
        label: '🟡 SECONDARY WATCH',
        description: 'Monitor, action this week',
      },
      ON_TRACK: {
        capacity: 100,
        urgencyRange: [0, 1], // NONE, LOW
        color: 'green',
        label: '🟢 ON TRACK',
        description: 'No action needed',
      },
    };

    /**
     * Runtime state
     */
    this.currentClass = null;
    this.currentTeacher = null;
    this.currentLesson = null;
    this.loadedAt = null;
    this.recommendations = [];
    this.studentSnapshots = [];
  }

  /**
   * Load daily dashboard for a specific teacher + class + lesson
   *
   * @async
   * @param {object} teacher - Teacher object { id, name, classId, classLabel }
   * @param {object} classContext - Class context { id, subject, grade, studentCount }
   * @param {object} lessonContext - Current lesson { id, name, standardIds }
   * @param {Array} studentList - Array of students in class
   * @param {Array} gamePerformances - Recent game performance data
   *
   * @returns {Promise<object>} Dashboard state with categorized recommendations
   *
   * @example
   * const dashboard = await dailyDashboard.loadForTeacher(
   *   { id: 'T001', name: 'Ms. Smith', classId: 'C1' },
   *   { id: 'C1', subject: 'Reading', grade: '3', studentCount: 20 },
   *   { id: 'L_3_RF_001', name: 'Consonant Blends', standardIds: ['3.RF.3'] },
   *   studentList,
   *   gamePerformances
   * );
   */
  async loadForTeacher(
    teacher,
    classContext,
    lessonContext,
    studentList,
    gamePerformances
  ) {
    try {
      this.currentTeacher = teacher;
      this.currentClass = classContext;
      this.currentLesson = lessonContext;
      this.loadedAt = Date.now();

      // Step 1: Compute competency for all students
      const competencies = await this._computeCompetencies(
        studentList,
        lessonContext,
        gamePerformances
      );

      // Step 2: Generate recommendations
      const recs = await this._generateRecommendations(
        studentList,
        competencies,
        lessonContext
      );

      this.recommendations = recs;

      // Step 3: Categorize students
      const categorized = this._categorizeStudents(recs);

      // Step 4: Build snapshots (rich summary for each student)
      const snapshots = await this._buildStudentSnapshots(
        recs,
        competencies,
        categorized
      );

      this.studentSnapshots = snapshots;

      // Step 5: Return dashboard state
      return {
        teacher: this.currentTeacher,
        classContext: this.currentClass,
        lessonContext: this.currentLesson,
        loadedAt: this.loadedAt,
        categorized: categorized,
        studentSnapshots: snapshots,
        summary: this._buildDashboardSummary(snapshots, categorized),
      };
    } catch (err) {
      console.error('DailyDashboard.loadForTeacher failed:', err);
      throw err;
    }
  }

  /**
   * Compute competency for each student
   * Maps game performance → competency levels
   *
   * @private
   * @async
   * @param {Array} studentList - Students
   * @param {object} lessonContext - Current lesson
   * @param {Array} gamePerformances - Performance data
   * @returns {Promise<Map>} studentId → competency data
   */
  async _computeCompetencies(studentList, lessonContext, gamePerformances) {
    const competencies = new Map();

    // Group game performances by student
    const perfByStudent = new Map();
    gamePerformances.forEach(perf => {
      if (!perfByStudent.has(perf.studentId)) {
        perfByStudent.set(perf.studentId, []);
      }
      perfByStudent.get(perf.studentId).push(perf);
    });

    // Compute competency for each student
    for (const student of studentList) {
      const perfs = perfByStudent.get(student.id) || [];

      if (perfs.length === 0) {
        // No data: mark as NOT_ATTEMPTED
        competencies.set(student.id, {
          level: 0,
          levelName: 'NOT_ATTEMPTED',
          confidence: 0,
          specificGap: 'No evidence yet',
        });
        continue;
      }

      // Use most recent performance
      const latestPerf = perfs[perfs.length - 1];

      const competency = await this.competency.inferCompetency(latestPerf, {
        lessonId: lessonContext.id,
        standardId: lessonContext.standardIds[0] || 'UNKNOWN',
        gradeLevel: student.gradeLevel,
      });

      competencies.set(student.id, competency);
    }

    return competencies;
  }

  /**
   * Generate recommendations for each student
   *
   * @private
   * @async
   * @param {Array} studentList - Students
   * @param {Map} competencies - competency map
   * @param {object} lessonContext - Current lesson
   * @returns {Promise<Array>} Array of recommendations
   */
  async _generateRecommendations(studentList, competencies, lessonContext) {
    const recs = [];

    for (const student of studentList) {
      const competency = competencies.get(student.id);

      if (!competency) continue;

      const rec = await this.recommender.recommendIntervention(
        {
          id: student.id,
          gradeLevel: student.gradeLevel,
          classId: this.currentClass.id,
        },
        lessonContext.standardIds[0] || 'UNKNOWN',
        competency,
        lessonContext.id
      );

      recs.push(rec);
    }

    // Sort by urgency (high first)
    return recs.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Categorize students by urgency
   *
   * @private
   * @param {Array} recommendations - All recommendations (sorted by urgency)
   * @returns {object} Categorized students
   */
  _categorizeStudents(recommendations) {
    const categorized = {
      primaryFocus: [],
      secondaryWatch: [],
      onTrack: [],
    };

    for (const rec of recommendations) {
      if (categorized.primaryFocus.length < this.categories.PRIMARY_FOCUS.capacity) {
        if (this.categories.PRIMARY_FOCUS.urgencyRange.includes(rec.urgency)) {
          categorized.primaryFocus.push(rec);
          continue;
        }
      }

      if (
        categorized.secondaryWatch.length <
        this.categories.SECONDARY_WATCH.capacity
      ) {
        if (this.categories.SECONDARY_WATCH.urgencyRange.includes(rec.urgency)) {
          categorized.secondaryWatch.push(rec);
          continue;
        }
      }

      categorized.onTrack.push(rec);
    }

    return categorized;
  }

  /**
   * Build rich student snapshot for display
   * Includes student data, competency, recommendation, and action
   *
   * @private
   * @async
   * @param {Array} recommendations - All recommendations
   * @param {Map} competencies - competency map
   * @param {object} categorized - Categorized students
   * @returns {Promise<Array>} Array of snapshots
   */
  async _buildStudentSnapshots(recommendations, competencies, categorized) {
    const snapshots = [];

    // Build snapshots for primary focus (high detail)
    for (const rec of categorized.primaryFocus) {
      snapshots.push({
        studentId: rec.studentId,
        calloutPriority: 'PRIMARY_FOCUS',
        recommendation: rec,
        competency: competencies.get(rec.studentId),
        actions: [
          {
            primary: rec.action,
            secondary: `Estimated ${rec.estimatedDays} days`,
          },
        ],
        visibleFields: [
          'studentName',
          'currentLevel',
          'gap',
          'actionPrimary',
          'actionDuration',
          'urgency',
        ],
      });
    }

    // Build snapshots for secondary watch (medium detail)
    for (const rec of categorized.secondaryWatch) {
      snapshots.push({
        studentId: rec.studentId,
        calloutPriority: 'SECONDARY_WATCH',
        recommendation: rec,
        competency: competencies.get(rec.studentId),
        actions: [{ primary: rec.action }],
        visibleFields: [
          'studentName',
          'currentLevel',
          'actionPrimary',
          'urgency',
        ],
      });
    }

    // Build snapshots for on-track (minimal detail)
    for (const rec of categorized.onTrack) {
      snapshots.push({
        studentId: rec.studentId,
        calloutPriority: 'ON_TRACK',
        recommendation: rec,
        competency: competencies.get(rec.studentId),
        actions: [],
        visibleFields: ['studentName', 'currentLevel'],
      });
    }

    return snapshots;
  }

  /**
   * Build dashboard summary (counts + metadata)
   *
   * @private
   * @param {Array} snapshots - Student snapshots
   * @param {object} categorized - Categorized students
   * @returns {object} Summary object
   */
  _buildDashboardSummary(snapshots, categorized) {
    return {
      totalStudents: snapshots.length,
      primaryFocusCount: categorized.primaryFocus.length,
      secondaryWatchCount: categorized.secondaryWatch.length,
      onTrackCount: categorized.onTrack.length,
      percentOnTrack: (
        (categorized.onTrack.length / snapshots.length) *
        100
      ).toFixed(1),
      loadTimeMs: Date.now() - this.loadedAt,
    };
  }

  /**
   * Get data for dashboard display
   * Returns formatted structure for rendering
   *
   * @returns {object} Dashboard display structure
   */
  getDisplayData() {
    return {
      header: {
        teacher: this.currentTeacher?.name || 'Unknown Teacher',
        class: this.currentClass?.grade || 'Unknown Class',
        subject: this.currentClass?.subject || 'Unknown Subject',
        lesson: this.currentLesson?.name || 'Unnamed Lesson',
        time: new Date(this.loadedAt).toLocaleTimeString(),
      },
      primaryFocus: this.studentSnapshots.filter(
        s => s.calloutPriority === 'PRIMARY_FOCUS'
      ),
      secondaryWatch: this.studentSnapshots.filter(
        s => s.calloutPriority === 'SECONDARY_WATCH'
      ),
      onTrack: this.studentSnapshots.filter(
        s => s.calloutPriority === 'ON_TRACK'
      ),
      summary: {
        total: this.studentSnapshots.length,
        primary: this.studentSnapshots.filter(
          s => s.calloutPriority === 'PRIMARY_FOCUS'
        ).length,
        secondary: this.studentSnapshots.filter(
          s => s.calloutPriority === 'SECONDARY_WATCH'
        ).length,
        onTrack: this.studentSnapshots.filter(
          s => s.calloutPriority === 'ON_TRACK'
        ).length,
      },
    };
  }

  /**
   * Record that teacher acknowledged/acted on a recommendation
   * Used by Phase C validation loop
   *
   * @async
   * @param {string} recommendationId - Recommendation ID
   * @param {string} action - 'delivered', 'not-delivered', 'partial', 'adapted'
   * @param {object} notes - Optional teacher notes
   * @returns {Promise<string>} Action log ID
   */
  async recordAction(recommendationId, action, notes = {}) {
    return await this.recommender.recordAction({
      recommendationId,
      action,
      ...notes,
    });
  }
}

// EXPORT FOR USE IN OTHER MODULES
module.exports = DailyDashboard;
