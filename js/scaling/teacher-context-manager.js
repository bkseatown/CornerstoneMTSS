/**
 * teacher-context-manager.js
 *
 * MULTI-CLASS TEACHER SUPPORT
 * ===========================
 * Enables teachers to manage multiple classes and switch contexts
 * Maintains per-class dashboards, recommendations, and state
 *
 * ARCHITECTURE:
 * - Context = { teacherId, classId, subject, grade, studentCount, lessonId }
 * - Each context has independent recommendation state
 * - Teachers switch contexts without data loss
 * - Batch operations across classes for daily standup
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase D: Scaling & Optimization
 */

class TeacherContextManager {
  constructor(dailyDashboard, actionLogger, impactReport) {
    /**
     * Dependencies: read-only synthesis
     */
    this.dashboard = dailyDashboard;
    this.actionLogger = actionLogger;
    this.report = impactReport;

    /**
     * Multi-class state
     */
    this.teacherId = null;
    this.currentContext = null; // { classId, subject, grade, studentCount, lessonId }
    this.contexts = new Map(); // classId → context definition
    this.contextState = new Map(); // classId → { recommendations, snapshots, summary }
    this.recentlyUsed = []; // MRU list of classIds
  }

  /**
   * Initialize teacher context manager
   *
   * @async
   * @param {string} teacherId - Teacher ID
   * @param {Array} classContexts - Array of class definitions
   *   Each: { classId, subject, grade, studentCount, lessonId }
   * @returns {Promise<Array>} Active contexts loaded
   *
   * @example
   * const contexts = await mgr.initialize('T001', [
   *   { classId: 'C1', subject: 'Reading', grade: '3', studentCount: 20, lessonId: 'L1' },
   *   { classId: 'C2', subject: 'Math', grade: '3', studentCount: 18, lessonId: 'M1' }
   * ]);
   */
  async initialize(teacherId, classContexts) {
    try {
      this.teacherId = teacherId;

      // Register all class contexts
      for (const ctx of classContexts) {
        this.contexts.set(ctx.classId, ctx);
        this.contextState.set(ctx.classId, {
          recommendations: [],
          snapshots: [],
          summary: null,
          loadedAt: null,
        });
      }

      // Sort by recently used (default: first)
      this.recentlyUsed = classContexts.map(c => c.classId);

      return classContexts;
    } catch (err) {
      console.error('TeacherContextManager.initialize failed:', err);
      throw err;
    }
  }

  /**
   * Switch to a specific class context
   * Loads dashboard for that context if not cached
   *
   * @async
   * @param {string} classId - Class to switch to
   * @param {Array} studentList - Students in class
   * @param {Array} gamePerformances - Recent performance data
   * @returns {Promise<object>} Dashboard state for the class
   */
  async switchContext(classId, studentList, gamePerformances) {
    try {
      if (!this.contexts.has(classId)) {
        throw new Error(`Class not found: ${classId}`);
      }

      this.currentContext = this.contexts.get(classId);

      // Move to front of MRU
      this.recentlyUsed = this.recentlyUsed.filter(id => id !== classId);
      this.recentlyUsed.unshift(classId);

      // Check cache
      const cached = this.contextState.get(classId);
      if (cached && cached.loadedAt && Date.now() - cached.loadedAt < 5 * 60 * 1000) {
        // Cache valid (5 min)
        return {
          classId,
          ...cached,
          fromCache: true,
        };
      }

      // Load fresh dashboard
      const dashboardState = await this.dashboard.loadForTeacher(
        { id: this.teacherId, name: 'Teacher' },
        {
          id: classId,
          subject: this.currentContext.subject,
          grade: this.currentContext.grade,
          studentCount: this.currentContext.studentCount,
        },
        {
          id: this.currentContext.lessonId,
          name: 'Current Lesson',
          standardIds: ['STANDARD_001'],
        },
        studentList,
        gamePerformances
      );

      // Cache result
      this.contextState.set(classId, {
        recommendations: dashboardState.categorized,
        snapshots: dashboardState.studentSnapshots,
        summary: dashboardState.summary,
        loadedAt: Date.now(),
      });

      return {
        classId,
        recommendations: dashboardState.categorized,
        snapshots: dashboardState.studentSnapshots,
        summary: dashboardState.summary,
        fromCache: false,
      };
    } catch (err) {
      console.error('TeacherContextManager.switchContext failed:', err);
      throw err;
    }
  }

  /**
   * Get daily standup across all classes
   * Summary of recommendations by class
   *
   * @async
   * @returns {Promise<object>} Standup summary
   */
  async getDailyStandup() {
    try {
      const standup = {
        teacherId: this.teacherId,
        timestamp: Date.now(),
        classSnapshots: [],
        totalPrimaryFocus: 0,
        totalSecondaryWatch: 0,
        totalOnTrack: 0,
      };

      for (const classId of this.recentlyUsed) {
        const state = this.contextState.get(classId);
        if (!state || !state.summary) continue;

        standup.classSnapshots.push({
          classId,
          subject: this.contexts.get(classId).subject,
          grade: this.contexts.get(classId).grade,
          primaryFocus: state.summary.primaryFocusCount,
          secondaryWatch: state.summary.secondaryWatchCount,
          onTrack: state.summary.onTrackCount,
          percentOnTrack: state.summary.percentOnTrack,
        });

        standup.totalPrimaryFocus += state.summary.primaryFocusCount;
        standup.totalSecondaryWatch += state.summary.secondaryWatchCount;
        standup.totalOnTrack += state.summary.onTrackCount;
      }

      return standup;
    } catch (err) {
      console.error('TeacherContextManager.getDailyStandup failed:', err);
      throw err;
    }
  }

  /**
   * Record action for a student across any class
   *
   * @async
   * @param {string} classId - Class context
   * @param {string} recommendationId - Recommendation ID
   * @param {string} action - Action type
   * @param {object} notes - Optional notes
   * @returns {Promise<string>} Action log ID
   */
  async recordActionInClass(classId, recommendationId, action, notes = {}) {
    try {
      if (!this.contexts.has(classId)) {
        throw new Error(`Class not found: ${classId}`);
      }

      return await this.actionLogger.logAction({
        teacherId: this.teacherId,
        classId,
        recommendationId,
        actionType: action,
        ...notes,
      });
    } catch (err) {
      console.error('TeacherContextManager.recordActionInClass failed:', err);
      throw err;
    }
  }

  /**
   * Get performance summary for a class
   *
   * @async
   * @param {string} classId - Class context
   * @returns {Promise<object>} Performance metrics
   */
  async getClassPerformance(classId) {
    try {
      if (!this.contexts.has(classId)) {
        throw new Error(`Class not found: ${classId}`);
      }

      const state = this.contextState.get(classId);
      if (!state || !state.summary) {
        return null;
      }

      return {
        classId,
        subject: this.contexts.get(classId).subject,
        grade: this.contexts.get(classId).grade,
        metrics: {
          totalStudents: state.summary.totalStudents,
          primaryFocus: state.summary.primaryFocusCount,
          secondaryWatch: state.summary.secondaryWatchCount,
          onTrack: state.summary.onTrackCount,
          percentOnTrack: state.summary.percentOnTrack,
          loadTimeMs: state.summary.loadTimeMs,
        },
      };
    } catch (err) {
      console.error('TeacherContextManager.getClassPerformance failed:', err);
      throw err;
    }
  }

  /**
   * Get current context
   *
   * @returns {object} Current class context
   */
  getCurrentContext() {
    return this.currentContext;
  }

  /**
   * Get all registered contexts
   *
   * @returns {Array} All class contexts
   */
  getAllContexts() {
    return Array.from(this.contexts.values());
  }

  /**
   * Get MRU class list
   *
   * @returns {Array} Most recently used class IDs
   */
  getMRUContexts() {
    return this.recentlyUsed.slice(0, 5); // Return top 5
  }
}

module.exports = TeacherContextManager;
