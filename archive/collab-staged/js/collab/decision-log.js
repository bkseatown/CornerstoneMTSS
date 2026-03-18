/**
 * decision-log.js
 * Logs specialist decisions and rationales during student game sessions
 * Used for post-session debrief and instructional analysis
 */

const DecisionLog = (() => {
  let decisions = [];
  let currentSessionId = null;
  let isRecording = false;

  /**
   * Initialize decision logging for a session
   * @param {string} sessionId - Student game session ID
   * @param {string} context - Session context (game name, student, etc.)
   */
  function init(sessionId, context = {}) {
    currentSessionId = sessionId;
    decisions = [];
    isRecording = true;

    console.log('📋 Decision logging started');
    return true;
  }

  /**
   * Log a decision about a student response
   * @param {object} decision - {moment, studentResponse, correct, decision, rationale}
   */
  function logDecision(decision) {
    if (!isRecording) {
      console.warn('⚠️ Decision logging not active');
      return false;
    }

    const entry = {
      id: generateId(),
      sessionId: currentSessionId,
      timestamp: Date.now(),
      moment: decision.moment || {},           // {timestamp, studentResponse, correct}
      decision: decision.decision || '',         // 'move-forward' | 'reteach' | 'differentiate' | 'probe'
      rationale: decision.rationale || '',       // Explanation for decision
      evidence: decision.evidence || [],         // Supporting observations
      nextSteps: decision.nextSteps || null,     // Follow-up action
      specialistId: decision.specialistId || null,
      tags: decision.tags || []                  // For categorization
    };

    // Validate decision type
    const validTypes = ['move-forward', 'reteach', 'differentiate', 'probe', 'clarify', 'observe'];
    if (entry.decision && !validTypes.includes(entry.decision)) {
      console.warn(`⚠️ Unknown decision type: ${entry.decision}`);
    }

    decisions.push(entry);
    console.log(`✓ Decision logged: ${entry.decision}`);

    // Emit event for real-time updates
    dispatchEvent('decision-logged', entry);

    return entry.id;
  }

  /**
   * Log observation without decision (passive note)
   * @param {object} observation - {moment, text, tags}
   */
  function logObservation(observation) {
    return logDecision({
      moment: observation.moment,
      decision: 'observe',
      rationale: observation.text,
      tags: observation.tags
    });
  }

  /**
   * Update a logged decision
   * @param {string} decisionId - ID of decision to update
   * @param {object} updates - Fields to update
   */
  function updateDecision(decisionId, updates) {
    const decision = decisions.find(d => d.id === decisionId);
    if (!decision) {
      console.warn(`⚠️ Decision ${decisionId} not found`);
      return false;
    }

    Object.assign(decision, updates, {updatedAt: Date.now()});
    console.log(`✓ Decision updated: ${decisionId}`);

    dispatchEvent('decision-updated', decision);
    return true;
  }

  /**
   * Get decisions by type
   * @param {string} type - Decision type to filter
   */
  function getDecisionsByType(type) {
    return decisions.filter(d => d.decision === type);
  }

  /**
   * Get decisions for a specific moment (word/question)
   * @param {string} momentId - ID of the moment
   */
  function getDecisionsForMoment(momentId) {
    return decisions.filter(d => d.moment.id === momentId);
  }

  /**
   * Get decision summary for report
   * @returns {object} Statistics and summary
   */
  function getSummary() {
    if (decisions.length === 0) {
      return {
        totalDecisions: 0,
        breakdown: {}
      };
    }

    const breakdown = {};
    decisions.forEach(d => {
      breakdown[d.decision] = (breakdown[d.decision] || 0) + 1;
    });

    return {
      totalDecisions: decisions.length,
      breakdown,
      decisions: decisions.map(d => ({
        timestamp: d.timestamp,
        decision: d.decision,
        rationale: d.rationale,
        tags: d.tags
      }))
    };
  }

  /**
   * Get detailed analysis report
   * @returns {object} Comprehensive report with patterns
   */
  function getReport() {
    const summary = getSummary();

    // Analyze patterns
    const patterns = analyzePatterns();

    // Calculate percentages
    const percentages = {};
    Object.keys(summary.breakdown).forEach(type => {
      percentages[type] = Math.round((summary.breakdown[type] / summary.totalDecisions) * 100);
    });

    return {
      sessionId: currentSessionId,
      sessionDuration: getSessionDuration(),
      totalDecisions: summary.totalDecisions,
      decisionBreakdown: summary.breakdown,
      percentages,
      patterns,
      recommendations: generateRecommendations(summary.breakdown),
      decisions: summary.decisions
    };
  }

  /**
   * Analyze decision patterns
   */
  function analyzePatterns() {
    const patterns = {
      averageTimePerDecision: 0,
      mostCommonDecision: null,
      decisionDistribution: {}
    };

    if (decisions.length < 2) return patterns;

    // Time analysis
    const timespan = decisions[decisions.length - 1].timestamp - decisions[0].timestamp;
    patterns.averageTimePerDecision = Math.round(timespan / decisions.length);

    // Most common
    const types = {};
    decisions.forEach(d => {
      types[d.decision] = (types[d.decision] || 0) + 1;
    });
    patterns.mostCommonDecision = Object.entries(types)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    patterns.decisionDistribution = types;

    return patterns;
  }

  /**
   * Generate teaching recommendations based on decisions
   */
  function generateRecommendations(breakdown) {
    const recommendations = [];

    // High reteach rate
    if (breakdown.reteach && breakdown.reteach > breakdown['move-forward'] * 1.5) {
      recommendations.push({
        priority: 'high',
        area: 'Instructional Approach',
        text: 'High reteach rate indicates student may need different instructional strategy or more scaffolding'
      });
    }

    // High differentiate rate
    if (breakdown.differentiate && breakdown.differentiate > (breakdown['move-forward'] || 0)) {
      recommendations.push({
        priority: 'medium',
        area: 'Task Complexity',
        text: 'Consider adjusting task difficulty or providing more varied response types'
      });
    }

    // Few probes
    if (!breakdown.probe || breakdown.probe < breakdown['move-forward'] * 0.2) {
      recommendations.push({
        priority: 'low',
        area: 'Assessment',
        text: 'Consider asking more probing questions to assess conceptual understanding'
      });
    }

    return recommendations;
  }

  /**
   * Get session duration in seconds
   */
  function getSessionDuration() {
    if (decisions.length < 2) return 0;
    return Math.round((decisions[decisions.length - 1].timestamp - decisions[0].timestamp) / 1000);
  }

  /**
   * Export log as JSON
   */
  function exportJSON() {
    return {
      sessionId: currentSessionId,
      exportedAt: new Date().toISOString(),
      decisions: decisions,
      summary: getSummary(),
      report: getReport()
    };
  }

  /**
   * Export log as CSV
   */
  function exportCSV() {
    const headers = ['Timestamp', 'Decision', 'Rationale', 'Evidence', 'Tags'];
    const rows = decisions.map(d => [
      new Date(d.timestamp).toISOString(),
      d.decision,
      `"${d.rationale.replace(/"/g, '""')}"`,
      d.evidence.join('; '),
      d.tags.join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get all decisions
   */
  function getAll() {
    return decisions;
  }

  /**
   * Clear log
   */
  function clear() {
    decisions = [];
    isRecording = false;
    console.log('✓ Decision log cleared');
  }

  /**
   * Event management
   */
  let eventListeners = {};

  function on(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
  }

  function off(event, callback) {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    }
  }

  function dispatchEvent(event, data) {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} listener:`, err);
        }
      });
    }
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    init,
    logDecision,
    logObservation,
    updateDecision,
    getDecisionsByType,
    getDecisionsForMoment,
    getSummary,
    getReport,
    getAll,
    exportJSON,
    exportCSV,
    clear,
    on,
    off
  };
})();
