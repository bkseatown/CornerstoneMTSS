/**
 * voice-feedback.js
 * Displays voice analysis results and feedback with Ava reactions
 */

const VoiceFeedback = (() => {
  let container = null;
  let feedbackPanel = null;
  let isVisible = false;

  /**
   * Initialize feedback panel
   * @param {string} containerId - Container element ID
   */
  function init(containerId) {
    container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container ${containerId} not found`);
      return false;
    }

    // Create feedback panel
    feedbackPanel = document.createElement('div');
    feedbackPanel.className = 'voice-feedback-panel';
    feedbackPanel.innerHTML = `
      <div class="voice-feedback-content">
        <div class="voice-feedback-header">
          <h3>Voice Analysis</h3>
          <button class="voice-feedback-close" aria-label="Close feedback">✕</button>
        </div>

        <div class="voice-feedback-body">
          <!-- Overall score -->
          <div class="voice-score-section">
            <div class="voice-score-display">
              <svg class="voice-score-circle" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" class="voice-score-bg"></circle>
                <circle cx="50" cy="50" r="45" class="voice-score-ring"></circle>
              </svg>
              <div class="voice-score-text">
                <span class="voice-score-number">--</span>
                <span class="voice-score-label">Overall</span>
              </div>
            </div>
          </div>

          <!-- Metrics grid -->
          <div class="voice-metrics-grid">
            <div class="voice-metric">
              <div class="voice-metric-icon">♪</div>
              <div class="voice-metric-label">Pitch</div>
              <div class="voice-metric-value">--</div>
              <div class="voice-metric-target">vs --</div>
            </div>

            <div class="voice-metric">
              <div class="voice-metric-icon">♩</div>
              <div class="voice-metric-label">Tempo</div>
              <div class="voice-metric-value">--</div>
              <div class="voice-metric-target">vs --</div>
            </div>

            <div class="voice-metric">
              <div class="voice-metric-icon">📢</div>
              <div class="voice-metric-label">Clarity</div>
              <div class="voice-metric-value">--</div>
              <div class="voice-metric-target"></div>
            </div>

            <div class="voice-metric">
              <div class="voice-metric-icon">🔤</div>
              <div class="voice-metric-label">Pronunciation</div>
              <div class="voice-metric-value">--</div>
              <div class="voice-metric-target"></div>
            </div>
          </div>

          <!-- Suggestions -->
          <div class="voice-suggestions">
            <h4>Tips for improvement:</h4>
            <ul class="voice-suggestions-list">
              <!-- Populated by show() -->
            </ul>
          </div>

          <!-- Action buttons -->
          <div class="voice-feedback-actions">
            <button class="voice-btn-retry">Try Again</button>
            <button class="voice-btn-continue">Continue</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(feedbackPanel);

    // Attach event listeners
    feedbackPanel.querySelector('.voice-feedback-close').addEventListener('click', hide);
    feedbackPanel.querySelector('.voice-btn-retry').addEventListener('click', () => {
      console.log('📝 Retry requested');
      dispatchEvent('retry');
    });
    feedbackPanel.querySelector('.voice-btn-continue').addEventListener('click', () => {
      console.log('✓ Continue requested');
      dispatchEvent('continue');
    });

    console.log('🎤 VoiceFeedback initialized');
    return true;
  }

  /**
   * Display analysis results
   * @param {object} analysisResult - Result from VoiceAnalyzer.analyze()
   * @param {object} options - Additional options {avaReaction: boolean}
   */
  function show(analysisResult, options = {}) {
    if (!feedbackPanel) return;

    const { pitch, tempo, clarity, phonemeAccuracy, suggestions, score } = analysisResult;
    const { avaReaction = true } = options;

    // Update overall score
    updateScoreDisplay(score || 0);

    // Update metrics
    updateMetric('Pitch', `${pitch.match || 0}%`, `${pitch.studentHz || 0} Hz`, `${pitch.modelHz || 0} Hz`);
    updateMetric('Tempo', `${tempo.match || 0}%`, `${tempo.studentBPM || 0} BPM`, `${tempo.modelBPM || 0} BPM`);
    updateMetric('Clarity', `${Math.round(clarity * 100)}%`, '', '');
    updateMetric('Pronunciation', `${Math.round(phonemeAccuracy * 100)}%`, '', '');

    // Update suggestions
    updateSuggestions(suggestions || []);

    // Show panel
    show_panel();

    // Ava reaction
    if (avaReaction && typeof AvaCharacter !== 'undefined') {
      reactWithAva(score || 0);
    }

    console.log(`📊 Feedback displayed: score=${score}`);
  }

  /**
   * Update score display with circular indicator
   */
  function updateScoreDisplay(score) {
    const numberElement = feedbackPanel.querySelector('.voice-score-number');
    const ringElement = feedbackPanel.querySelector('.voice-score-ring');

    // Update number
    numberElement.textContent = score;

    // Update ring color based on score
    let color = '#d62828'; // Red for low scores
    if (score >= 70) color = '#00a651'; // Green for good
    else if (score >= 50) color = '#f77f00'; // Orange for medium

    ringElement.style.stroke = color;
    ringElement.style.strokeDasharray = `${score * 2.83} 283`; // Circumference ≈ 283
  }

  /**
   * Update a single metric display
   */
  function updateMetric(label, value, student, model) {
    const metricElements = Array.from(feedbackPanel.querySelectorAll('.voice-metric'));
    const metric = metricElements.find(m => m.querySelector('.voice-metric-label').textContent === label);

    if (metric) {
      metric.querySelector('.voice-metric-value').textContent = value;
      const targetEl = metric.querySelector('.voice-metric-target');
      if (student && model) {
        targetEl.textContent = `${student} vs ${model}`;
      } else if (student) {
        targetEl.textContent = student;
      }
    }
  }

  /**
   * Update suggestions list
   */
  function updateSuggestions(suggestions) {
    const suggestionsList = feedbackPanel.querySelector('.voice-suggestions-list');
    suggestionsList.innerHTML = '';

    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.className = 'voice-suggestion-item';
      li.textContent = suggestion;

      // Color code by emoji/prefix
      if (suggestion.includes('⭐')) {
        li.classList.add('excellent');
      } else if (suggestion.includes('✓')) {
        li.classList.add('good');
      } else if (suggestion.includes('→')) {
        li.classList.add('needs-work');
      } else if (suggestion.includes('⚠️')) {
        li.classList.add('warning');
      }

      suggestionsList.appendChild(li);
    });
  }

  /**
   * Show feedback panel
   */
  function show_panel() {
    if (feedbackPanel) {
      feedbackPanel.classList.add('visible');
      isVisible = true;
    }
  }

  /**
   * Hide feedback panel
   */
  function hide() {
    if (feedbackPanel) {
      feedbackPanel.classList.remove('visible');
      isVisible = false;
    }
  }

  /**
   * React with Ava character based on score
   */
  function reactWithAva(score) {
    if (typeof AvaCharacter === 'undefined') return;

    if (score >= 85) {
      AvaCharacter.react(true); // Show happy/celebrating
      AvaCharacter.speak('Excellent pronunciation! You did great!');
    } else if (score >= 70) {
      AvaCharacter.react(true); // Show encouraging
      AvaCharacter.speak('Nice try! Keep practicing.');
    } else if (score >= 50) {
      AvaCharacter.react(false); // Show confused/need help
      AvaCharacter.speak('Let me help you with this. Listen carefully to the model.');
    } else {
      AvaCharacter.react(false); // Show confused
      AvaCharacter.speak('Let\'s try that again. Listen to how I say it.');
    }
  }

  /**
   * Dispatch custom events
   */
  function dispatchEvent(eventType) {
    window.dispatchEvent(new CustomEvent(`voice-feedback-${eventType}`, {
      detail: { timestamp: Date.now() }
    }));
  }

  /**
   * Check if feedback is visible
   */
  function visible() {
    return isVisible;
  }

  /**
   * Get metric summary (for logging/analytics)
   */
  function getSummary() {
    if (!feedbackPanel) return null;

    return {
      score: feedbackPanel.querySelector('.voice-score-number').textContent,
      pitch: feedbackPanel.querySelector('[data-metric="pitch"] .voice-metric-value')?.textContent,
      tempo: feedbackPanel.querySelector('[data-metric="tempo"] .voice-metric-value')?.textContent,
      clarity: feedbackPanel.querySelector('[data-metric="clarity"] .voice-metric-value')?.textContent,
      pronunciation: feedbackPanel.querySelector('[data-metric="pronunciation"] .voice-metric-value')?.textContent,
    };
  }

  return {
    init,
    show,
    hide,
    visible,
    getSummary,
  };
})();
