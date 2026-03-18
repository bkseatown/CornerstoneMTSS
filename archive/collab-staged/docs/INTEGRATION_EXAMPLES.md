# Phase 2-6 Integration Examples

Complete code examples for integrating all advanced features into existing game surfaces.

---

## Word Quest: Full Integration Example

```html
<!-- word-quest.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Quest 3D</title>

  <!-- Core Styles -->
  <link rel="stylesheet" href="/style/tokens.css">
  <link rel="stylesheet" href="/style/components.css">
  <link rel="stylesheet" href="/style/game-shell.css">

  <!-- Phase 6: Advanced Features -->
  <link rel="stylesheet" href="/style/parent-dashboard.css">

  <!-- Phase 5: Accessibility -->
  <link rel="stylesheet" href="/style/a11y-dyslexia.css">
  <link rel="stylesheet" href="/style/a11y-high-contrast.css">
  <link rel="stylesheet" href="/style/a11y-color-blind.css">
  <link rel="stylesheet" href="/style/a11y-low-vision.css">
  <link rel="stylesheet" href="/style/a11y-controls.css">

  <!-- Phase 4: 3D -->
  <script src="https://cdn.jsdelivr.net/npm/babylonjs@latest/babylon.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/babylonjs@latest/babylon.loaders.js"></script>

  <!-- Phase 2: Collaboration -->
  <link rel="stylesheet" href="/style/collab-overlay.css">
  <script src="/socket.io/socket.io.js"></script>

  <!-- Scripts -->
  <script src="/js/curriculum-truth.js"></script>
  <script src="/js/settings/a11y-settings.js"></script>
  <script src="/js/settings/a11y-controls.js"></script>
  <script src="/js/ava-character.js"></script>

  <!-- Phase 6 -->
  <script src="/js/3d/student-gallery-3d.js"></script>
  <script src="/js/ai/adaptive-recommendations.js"></script>
  <script src="/js/parent/parent-dashboard.js"></script>

  <!-- Phase 4 -->
  <script src="/js/3d/word-quest-3d.js"></script>
  <script src="/js/3d/keyboard-3d.js"></script>
  <script src="/js/3d/celebration-particles.js"></script>

  <!-- Phase 2 -->
  <script src="/js/collab/session-sync.js"></script>
  <script src="/js/collab/decision-log.js"></script>
  <script src="/games/ui/collab-overlay.js"></script>

  <style>
    body { margin: 0; padding: 0; }
    #game-canvas { display: block; width: 100%; height: 100vh; }
    #accessibility-panel { position: fixed; top: 20px; right: 20px; z-index: 1000; }
  </style>
</head>
<body>
  <!-- Game Canvas -->
  <canvas id="game-canvas"></canvas>

  <!-- Accessibility Controls -->
  <div id="accessibility-panel"></div>

  <!-- Collaboration Overlay -->
  <div id="collab-container" style="position: relative; width: 100%; height: 100%;"></div>

  <!-- Ava Character -->
  <div id="ava-container" style="position: fixed; bottom: 20px; right: 20px; width: 200px; height: 200px;"></div>

  <script>
    // ================================================================
    // Game Configuration
    // ================================================================

    const config = {
      studentId: new URLSearchParams(location.search).get('studentId') || 'student-' + Date.now(),
      sessionId: new URLSearchParams(location.search).get('sessionId') || 'session-' + Date.now(),
      mode3D: new URLSearchParams(location.search).get('3d') === 'true',
      collaborationMode: new URLSearchParams(location.search).get('collab') === 'true',
      specialistRole: new URLSearchParams(location.search).get('role') === 'teacher'
    };

    console.log('🎮 Word Quest Configuration:', config);

    // ================================================================
    // Phase 5: Initialize Accessibility
    // ================================================================

    A11ySettings.init();
    A11yControls.render('accessibility-panel', {
      defaultMode: localStorage.getItem('cornerstone-a11y-mode') || 'default'
    });

    // ================================================================
    // Phase 4 or 2D: Initialize Game Renderer
    // ================================================================

    let gameEngine;

    if (config.mode3D) {
      // Use 3D Word Quest
      console.log('🎮 Starting in 3D mode');
      WordQuest3D.init('game-canvas');
      gameEngine = WordQuest3D;
    } else {
      // Fall back to 2D (existing game shell)
      console.log('🎮 Starting in 2D mode');
      gameEngine = GameShell2D; // Existing 2D implementation
    }

    // ================================================================
    // Phase 6: Initialize AI Recommendations
    // ================================================================

    AdaptiveRecommendations.init();

    // ================================================================
    // Phase 2: Initialize Collaboration (if teacher)
    // ================================================================

    let isCollaborating = false;

    if (config.collaborationMode && config.specialistRole) {
      console.log('👥 Collaboration mode enabled');

      // Initialize overlay
      CollabOverlay.init('collab-container');

      // Initialize decision logging
      DecisionLog.init(config.sessionId, {
        game: 'word-quest',
        student: config.studentId
      });

      // Connect to WebSocket
      SessionSync.connect(config.sessionId, `teacher-${config.studentId}`)
        .then(() => {
          isCollaborating = true;
          console.log('✓ Connected to collaboration session');

          // Listen for other specialist's annotations
          SessionSync.on('annotation-added', (annotation) => {
            if (annotation.type === 'highlight') {
              CollabOverlay.highlightWord(annotation.wordId, annotation.color, annotation.style);
            }
          });

          SessionSync.on('note-added', (note) => {
            CollabOverlay.addNote(note.x, note.y, note.text, note.type);
          });

          // Show specialist-only UI
          document.querySelector('#collab-container').style.display = 'block';
        })
        .catch(err => {
          console.warn('⚠️ Collaboration unavailable:', err);
          isCollaborating = false;
        });
    } else {
      // Hide specialist UI from students
      document.querySelector('#collab-container').style.display = 'none';
    }

    // ================================================================
    // Initialize Ava Character
    // ================================================================

    AvaCharacter.init('ava-container', {
      size: 150,
      animations: true
    });

    // ================================================================
    // Game State & Word List
    // ================================================================

    const words = [
      {word: 'CAT', difficulty: 1, phoneme: 'cvc'},
      {word: 'BIRD', difficulty: 2, phoneme: 'consonant-blend'},
      {word: 'PLAY', difficulty: 2, phoneme: 'consonant-blend'},
      {word: 'DREAM', difficulty: 3, phoneme: 'consonant-blend'}
    ];

    let currentWordIndex = 0;
    let score = 0;
    let correctCount = 0;
    let totalAttempts = 0;

    // ================================================================
    // Game Logic
    // ================================================================

    function startGame() {
      currentWordIndex = 0;
      score = 0;
      correctCount = 0;
      totalAttempts = 0;

      displayWord(words[currentWordIndex]);
    }

    function displayWord(wordObj) {
      const {word} = wordObj;

      if (config.mode3D) {
        // 3D: Create word tile
        WordQuest3D.createWordTile(word, currentWordIndex, 'unassessed');
      } else {
        // 2D: Display word in existing UI
        document.querySelector('.word-display').textContent = word;
      }

      // Ava announces word
      AvaCharacter.speak(`${word}. Type the correct letters.`);
    }

    // ================================================================
    // Handle Student Response
    // ================================================================

    document.addEventListener('student-submitted-word', (event) => {
      const {studentResponse} = event.detail;
      const currentWord = words[currentWordIndex];
      const isCorrect = studentResponse === currentWord.word;

      totalAttempts++;
      const responseTime = event.detail.responseTime || 1500;

      // Track response in AI
      AdaptiveRecommendations.trackResponse(config.studentId, {
        correct: isCorrect,
        word: currentWord.word,
        responseTime,
        attempt: totalAttempts,
        context: 'word-quest'
      });

      if (isCorrect) {
        correctCount++;
        score += Math.max(10, 50 - responseTime / 100); // Time bonus

        // Animate tile reveal (3D)
        if (config.mode3D) {
          const tileId = `tile-${currentWord.word}-${currentWordIndex}`;
          WordQuest3D.revealTile(tileId);
          WordQuest3D.celebrate();
        }

        // Ava celebrates
        AvaCharacter.react(true);
        AvaCharacter.speak('Great! You got it!');

        // Log decision (collaboration)
        if (isCollaborating) {
          DecisionLog.logDecision({
            moment: {
              studentResponse,
              correct: true,
              responseTime,
              word: currentWord.word,
              timestamp: Date.now()
            },
            decision: responseTime < 1000 ? 'move-forward' : 'probe',
            rationale: `Student ${responseTime < 1000 ? 'fluently' : 'hesitantly'} decoded ${currentWord.word}`,
            tags: [currentWord.phoneme, 'correct']
          });

          SessionSync.logDecision({
            moment: {studentResponse, correct: true},
            decision: 'move-forward',
            rationale: 'Student decoded correctly'
          });
        }

        // Next word
        currentWordIndex++;
        if (currentWordIndex < words.length) {
          setTimeout(() => displayWord(words[currentWordIndex]), 1500);
        } else {
          endGame();
        }
      } else {
        // Incorrect response
        AvaCharacter.react(false);
        AvaCharacter.speak('Not quite. Try again.');

        // Log decision (collaboration)
        if (isCollaborating) {
          DecisionLog.logDecision({
            moment: {
              studentResponse,
              correct: false,
              responseTime,
              word: currentWord.word,
              timestamp: Date.now()
            },
            decision: 'reteach',
            rationale: `Student misread "${currentWord.word}" as "${studentResponse}"`,
            evidence: ['Blending error', 'Mispronunciation'],
            tags: [currentWord.phoneme, 'error']
          });

          // Highlight word in overlay
          const tileId = `tile-${currentWord.word}-${currentWordIndex}`;
          CollabOverlay.highlightWord(tileId, '#FF6B6B', 'circle');
        }
      }

      // Emit event for external tracking
      window.dispatchEvent(new CustomEvent('word-quest-response', {
        detail: {
          studentId: config.studentId,
          word: currentWord.word,
          response: studentResponse,
          correct: isCorrect,
          responseTime,
          score,
          accuracy: correctCount / totalAttempts
        }
      }));
    });

    function endGame() {
      const accuracy = correctCount / totalAttempts;

      // Get AI recommendations
      const recommendations = AdaptiveRecommendations.getRecommendations(config.studentId);
      const nextLesson = AdaptiveRecommendations.getNextLessonRecommendation(config.studentId);

      // Generate decision report
      if (isCollaborating) {
        const report = DecisionLog.getReport();
        console.log('📋 Decision Report:', report);

        // Export for post-session debrief
        SessionSync.sendMessage(`Game complete! ${report.totalDecisions} decisions logged.`);
      }

      // Show results
      AvaCharacter.celebrate();
      AvaCharacter.speak(`Game complete! Score: ${Math.round(score)} points.`);

      // Recommendation notification
      if (nextLesson) {
        console.log('💡 Next Step:', nextLesson.title);
        // Show notification to teacher
        if (config.specialistRole) {
          showTeacherNotification(nextLesson.title, nextLesson.description);
        }
      }
    }

    function showTeacherNotification(title, description) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
      `;
      document.body.appendChild(notification);

      setTimeout(() => notification.remove(), 5000);
    }

    // ================================================================
    // Start Game
    // ================================================================

    startGame();
  </script>
</body>
</html>
```

---

## Typing Quest: Voice Analysis Integration

```html
<!-- In typing-quest.html -->
<div id="voice-section">
  <h2>🎤 Practice Pronunciation</h2>
  <p>Listen to the model, then record yourself saying the word.</p>

  <div id="waveform-container" style="height: 200px; margin: 20px 0;"></div>

  <button id="play-model" class="btn-secondary">🔊 Listen to Model</button>
  <button id="record-button" class="btn-primary">🎤 Record Your Voice</button>
  <button id="stop-button" class="btn-primary" style="display: none;">⏹️ Stop</button>

  <div id="voice-feedback-container"></div>
</div>

<script>
  // Initialize voice components
  VoiceRecorder.init()
    .then(() => {
      WaveformDisplay.init('waveform-container');
      VoiceFeedback.init('voice-feedback-container');
      document.getElementById('record-button').disabled = false;
    });

  let modelBuffer = null;

  // Load model audio
  const modelAudio = document.createElement('audio');
  modelAudio.src = `/audio/model-pronunciations/${currentWord}.wav`;
  modelAudio.onload = async () => {
    const response = await fetch(modelAudio.src);
    const blob = await response.blob();
    modelBuffer = await VoiceRecorder.decodeAudio(blob);
  };

  // Play model button
  document.getElementById('play-model').addEventListener('click', () => {
    modelAudio.play();
  });

  // Record button
  document.getElementById('record-button').addEventListener('click', () => {
    document.getElementById('record-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline-block';

    VoiceRecorder.startRecording((audioData) => {
      WaveformDisplay.drawLive(audioData);
    });
  });

  // Stop button
  document.getElementById('stop-button').addEventListener('click', async () => {
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('record-button').style.display = 'inline-block';

    const studentBlob = await VoiceRecorder.stopRecording();
    const studentBuffer = await VoiceRecorder.decodeAudio(studentBlob);

    // Analyze
    const result = VoiceAnalyzer.analyze(studentBuffer, modelBuffer);
    VoiceFeedback.show(result, {avaReaction: true});

    // Show waveform comparison
    WaveformDisplay.compareWaveforms(studentBuffer, modelBuffer);

    // Log for adaptive AI
    AdaptiveRecommendations.trackResponse(config.studentId, {
      correct: result.score >= 75,
      word: currentWord,
      responseTime: result.phonemeAccuracy * 1000
    });
  });

  // Retry
  window.addEventListener('voice-feedback-retry', () => {
    document.getElementById('record-button').click();
  });

  // Continue
  window.addEventListener('voice-feedback-continue', () => {
    moveToNextWord();
  });
</script>
```

---

## Teacher Hub: 3D Gallery + Analytics

```html
<!-- In teacher-hub-v2.html -->
<div class="dashboard-section">
  <h2>📊 Class Progress Gallery</h2>

  <div id="gallery-canvas" style="width: 100%; height: 600px;"></div>

  <div id="analytics-panel">
    <h3>Class Analytics</h3>
    <div id="analytics-content"></div>
  </div>
</div>

<script>
  // Initialize 3D gallery
  StudentGallery3D.init('gallery-canvas', {layout: 'stadium'});

  // Load student data
  fetch('/api/students')
    .then(r => r.json())
    .then(students => {
      students.forEach(student => {
        StudentGallery3D.addStudent(student.id, {
          name: student.name,
          avatar: student.avatar,
          score: student.totalScore,
          progress: student.masteryLevel * 100,
          status: student.status
        });
      });
    });

  // Click on student to see details
  document.addEventListener('gallery-student-selected', (event) => {
    const {studentId} = event.detail;

    // Get recommendations
    const recs = AdaptiveRecommendations.getRecommendations(studentId);

    // Display in panel
    const panel = document.getElementById('analytics-content');
    panel.innerHTML = `
      <h4>${studentId}</h4>
      <ul>
        ${recs.map(r => `<li>${r.title}: ${r.description}</li>`).join('')}
      </ul>
    `;

    // Focus camera on student
    StudentGallery3D.focusOnStudent(studentId, 1000);
  });

  // Class analytics
  const classAnalytics = AdaptiveRecommendations.getClassAnalytics();
  console.log('📊 Class Average:', classAnalytics.classAverage + '%');
  console.log('🆘 Struggling:', classAnalytics.strugglingStudents);
  console.log('⭐ Advanced:', classAnalytics.advancedStudents);
</script>
```

---

## Reports Page: Decision Log Export

```javascript
// In reports.html post-session
const sessionId = new URLSearchParams(location.search).get('sessionId');

fetch(`/api/session/${sessionId}/decisions`)
  .then(r => r.json())
  .then(data => {
    // Display decisions
    const decisionsList = document.getElementById('decisions-list');
    data.decisions.forEach(d => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${d.decision}</strong>: ${d.rationale}
        <small>${new Date(d.timestamp).toLocaleTimeString()}</small>
      `;
      decisionsList.appendChild(li);
    });

    // Export button
    const exportBtn = document.getElementById('export-btn');
    exportBtn.onclick = () => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decisions-${sessionId}.json`;
      a.click();
    };
  });
```

---

## Parent Portal: Share Progress

```javascript
// In teacher dashboard
const studentId = 'student-123';

// Generate secure token
const token = generateSecureToken(studentId, {accessLevel: 'parent', expiresIn: 365});

// Send to parent email
sendParentEmail(parentEmail, {
  studentName: 'Emma Johnson',
  dashboardUrl: `https://cornerstone.edu/parent/${token}`,
  message: 'View Emma\'s progress anytime!'
});

// Parent receives link
ParentDashboard.init('dashboard', {
  name: 'Emma Johnson',
  grade: '2nd',
  class: 'Room 201'
});

// Teacher updates progress
ParentDashboard.updateProgress({
  fluency: 75,
  recognition: 82,
  comprehension: 68
});

ParentDashboard.addAchievement({
  title: 'Mastered CVC Words',
  description: 'Successfully decoded 20+ consonant-vowel-consonant words',
  date: Date.now()
});

ParentDashboard.addPracticeRecommendation({
  title: 'Sight Word Fluency',
  duration: 10,
  steps: [
    'Read sight word cards daily',
    'Play sight word matching game',
    'Write sight words in sentences'
  ]
});
```

---

## Collab Mode: Real-Time Co-Teaching

```javascript
// Specialist 1: Marks word that needs work
CollabOverlay.highlightWord('BLEND', '#FF6B6B', 'circle');
CollabOverlay.addNote(100, 200, 'Student struggles with consonant blends', 'observation');

// Specialist 2: Sees immediately
SessionSync.on('annotation-added', (annotation) => {
  if (annotation.type === 'highlight') {
    // Word is highlighted - see student struggling
    AvaCharacter.tilt('left'); // Show concern
    AvaCharacter.speak('Let me help you blend these sounds.');
  }
});

// Log intervention decision
DecisionLog.logDecision({
  decision: 'intervention',
  rationale: 'Student confused by consonant blends - needs explicit instruction',
  evidence: ['3 errors on blend words', 'hesitant response'],
  nextSteps: 'Teach blending strategy with hand motions'
});

// Share with other specialist
SessionSync.logDecision({
  decision: 'intervention',
  rationale: 'Recommend consonant blend mini-lesson'
});
```

---

These examples show full end-to-end integration of all Phase 2-6 features into your existing game surfaces.
