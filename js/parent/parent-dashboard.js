/**
 * parent-dashboard.js
 * Parent communication dashboard - shares student progress and recommendations
 * Privacy-respecting: only shows appropriate data for parents
 */

const ParentDashboard = (() => {
  let isInitialized = false;
  let studentData = null;
  let communicationLog = [];

  /**
   * Initialize parent dashboard
   * @param {string} containerId - Container element ID
   * @param {object} data - Student data {name, grade, class, achievements}
   */
  function init(containerId, data = {}) {
    if (isInitialized) {
      console.warn('⚠️ ParentDashboard already initialized');
      return true;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Container not found');
      return false;
    }

    studentData = data;

    // Create dashboard HTML
    container.innerHTML = `
      <div class="parent-dashboard">
        <div class="dashboard-header">
          <h1>${data.name}'s Learning Progress</h1>
          <p class="grade-class">${data.grade} - ${data.class}</p>
        </div>

        <div class="dashboard-grid">
          <!-- Progress Overview -->
          <section class="dashboard-card progress-card">
            <h2>📊 Learning Progress</h2>
            <div class="progress-metrics">
              <div class="metric">
                <span class="label">Reading Fluency</span>
                <div class="progress-bar">
                  <div class="progress-fill" id="fluency-bar" style="width: 0%"></div>
                </div>
                <span class="value" id="fluency-value">--</span>
              </div>
              <div class="metric">
                <span class="label">Word Recognition</span>
                <div class="progress-bar">
                  <div class="progress-fill" id="recognition-bar" style="width: 0%"></div>
                </div>
                <span class="value" id="recognition-value">--</span>
              </div>
              <div class="metric">
                <span class="label">Comprehension</span>
                <div class="progress-bar">
                  <div class="progress-fill" id="comprehension-bar" style="width: 0%"></div>
                </div>
                <span class="value" id="comprehension-value">--</span>
              </div>
            </div>
          </section>

          <!-- This Week's Achievements -->
          <section class="dashboard-card achievements-card">
            <h2>🌟 This Week's Wins</h2>
            <ul class="achievements-list" id="achievements-list">
              <li class="placeholder">Loading achievements...</li>
            </ul>
          </section>

          <!-- What to Practice at Home -->
          <section class="dashboard-card practice-card">
            <h2>🏠 Practice at Home</h2>
            <div class="practice-tips" id="practice-tips">
              <p class="placeholder">Loading recommendations...</p>
            </div>
          </section>

          <!-- Recent Messages -->
          <section class="dashboard-card messages-card">
            <h2>💬 Messages from Teacher</h2>
            <div class="messages-container" id="messages-container">
              <p class="placeholder">No new messages</p>
            </div>
            <button class="btn-primary" id="btn-send-message">Send Message</button>
          </section>

          <!-- Resources -->
          <section class="dashboard-card resources-card">
            <h2>📚 Helpful Resources</h2>
            <ul class="resources-list" id="resources-list">
              <li><a href="#">Reading Tips for Parents</a></li>
              <li><a href="#">At-Home Spelling Practice</a></li>
              <li><a href="#">Supporting Early Readers</a></li>
            </ul>
          </section>

          <!-- Attendance & Engagement -->
          <section class="dashboard-card attendance-card">
            <h2>📅 Attendance & Engagement</h2>
            <div class="attendance-stats">
              <div class="stat">
                <span class="label">Attendance</span>
                <span class="value" id="attendance-value">--</span>
              </div>
              <div class="stat">
                <span class="label">Participation</span>
                <span class="value" id="participation-value">--</span>
              </div>
              <div class="stat">
                <span class="label">Work Completion</span>
                <span class="value" id="completion-value">--</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Communication Modal -->
        <div id="message-modal" class="modal hidden">
          <div class="modal-content">
            <h3>Send Message to Teacher</h3>
            <textarea id="message-text" placeholder="Type your message..." rows="5"></textarea>
            <div class="modal-actions">
              <button class="btn-secondary" id="btn-cancel">Cancel</button>
              <button class="btn-primary" id="btn-submit-message">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    attachEventListeners();

    isInitialized = true;
    console.log('✅ ParentDashboard initialized');
    return true;
  }

  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    const btnSendMessage = document.getElementById('btn-send-message');
    const btnSubmit = document.getElementById('btn-submit-message');
    const btnCancel = document.getElementById('btn-cancel');
    const modal = document.getElementById('message-modal');

    btnSendMessage.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });

    btnSubmit.addEventListener('click', () => {
      const text = document.getElementById('message-text').value;
      if (text.trim()) {
        sendMessage(text);
        document.getElementById('message-text').value = '';
        modal.classList.add('hidden');
      }
    });

    btnCancel.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  /**
   * Update progress metrics
   * @param {object} metrics - {fluency, recognition, comprehension}
   */
  function updateProgress(metrics) {
    const {fluency = 0, recognition = 0, comprehension = 0} = metrics;

    document.getElementById('fluency-bar').style.width = `${fluency}%`;
    document.getElementById('fluency-value').textContent = `${Math.round(fluency)}%`;

    document.getElementById('recognition-bar').style.width = `${recognition}%`;
    document.getElementById('recognition-value').textContent = `${Math.round(recognition)}%`;

    document.getElementById('comprehension-bar').style.width = `${comprehension}%`;
    document.getElementById('comprehension-value').textContent = `${Math.round(comprehension)}%`;
  }

  /**
   * Add achievement
   * @param {object} achievement - {title, description, date}
   */
  function addAchievement(achievement) {
    const {title, description, date} = achievement;
    const list = document.getElementById('achievements-list');

    // Clear placeholder
    const placeholder = list.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    const li = document.createElement('li');
    li.className = 'achievement-item';
    li.innerHTML = `
      <div class="achievement-title">🎉 ${title}</div>
      <div class="achievement-desc">${description}</div>
      <div class="achievement-date">${new Date(date).toLocaleDateString()}</div>
    `;

    list.insertBefore(li, list.firstChild);
  }

  /**
   * Add home practice recommendation
   * @param {object} recommendation - {title, steps, duration}
   */
  function addPracticeRecommendation(recommendation) {
    const {title, steps, duration} = recommendation;
    const container = document.getElementById('practice-tips');

    // Clear placeholder
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.className = 'practice-tip';
    div.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Time needed:</strong> ${duration} minutes</p>
      <ol>
        ${steps.map(step => `<li>${step}</li>`).join('')}
      </ol>
    `;

    container.appendChild(div);
  }

  /**
   * Add teacher message
   * @param {object} message - {text, date, sender}
   */
  function addTeacherMessage(message) {
    const {text, date, sender = 'Teacher'} = message;
    const container = document.getElementById('messages-container');

    // Clear placeholder
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.className = 'message-item teacher-message';
    div.innerHTML = `
      <div class="message-sender">${sender}</div>
      <div class="message-text">${text}</div>
      <div class="message-date">${new Date(date).toLocaleDateString()}</div>
    `;

    container.insertBefore(div, container.firstChild);
    communicationLog.push({type: 'teacher', text, date, sender});
  }

  /**
   * Send parent message
   */
  function sendMessage(text) {
    const message = {
      text,
      date: Date.now(),
      sender: studentData.parentName || 'Parent'
    };

    const container = document.getElementById('messages-container');
    const div = document.createElement('div');
    div.className = 'message-item parent-message';
    div.innerHTML = `
      <div class="message-sender">${message.sender}</div>
      <div class="message-text">${text}</div>
      <div class="message-date">${new Date(message.date).toLocaleDateString()}</div>
    `;

    container.insertBefore(div, container.firstChild);
    communicationLog.push({type: 'parent', ...message});

    // Emit event for backend
    dispatchEvent(new CustomEvent('parent-message-sent', {detail: message}));
    console.log('✓ Message sent to teacher');
  }

  /**
   * Update attendance stats
   */
  function updateAttendance(stats) {
    const {attendance = '--', participation = '--', completion = '--'} = stats;

    document.getElementById('attendance-value').textContent = attendance;
    document.getElementById('participation-value').textContent = participation;
    document.getElementById('completion-value').textContent = completion;
  }

  /**
   * Get communication log
   */
  function getCommunicationLog() {
    return communicationLog;
  }

  /**
   * Export progress report
   */
  function exportReport() {
    const report = {
      studentName: studentData.name,
      grade: studentData.grade,
      class: studentData.class,
      exportedAt: new Date().toISOString(),
      progress: {
        fluency: document.getElementById('fluency-value').textContent,
        recognition: document.getElementById('recognition-value').textContent,
        comprehension: document.getElementById('comprehension-value').textContent
      },
      attendance: {
        attendance: document.getElementById('attendance-value').textContent,
        participation: document.getElementById('participation-value').textContent,
        completion: document.getElementById('completion-value').textContent
      },
      communicationLog
    };

    return JSON.stringify(report, null, 2);
  }

  return {
    init,
    updateProgress,
    addAchievement,
    addPracticeRecommendation,
    addTeacherMessage,
    sendMessage,
    updateAttendance,
    getCommunicationLog,
    exportReport
  };
})();
