# Real-Time Specialist Collaboration Integration Guide

## Phase 2: Synchronized Game Watching & Annotation

### Quick Start (15 minutes)

Add to your HTML `<head>`:

```html
<!-- Collaboration stylesheets -->
<link rel="stylesheet" href="/style/collab-overlay.css">

<!-- Collaboration JavaScript -->
<script src="/js/collab/session-sync.js"></script>
<script src="/js/collab/decision-log.js"></script>
<script src="/games/ui/collab-overlay.js"></script>
```

Initialize collaboration in your game/activity:

```html
<div id="game-board" data-game-board>
  <!-- Game content -->
</div>

<script>
  // Only enable for collaborative sessions
  const isCollaborativeMode = new URLSearchParams(location.search).get('collab') === 'true';

  if (isCollaborativeMode) {
    // Initialize collaboration
    const specialistId = 'specialist-' + Math.random().toString(36).substr(2, 9);
    const sessionId = new URLSearchParams(location.search).get('sessionId');

    // Initialize decision logging
    DecisionLog.init(sessionId, {
      game: 'word-quest',
      student: 'John'
    });

    // Initialize overlay
    CollabOverlay.init('game-board');

    // Connect to WebSocket
    SessionSync.connect(sessionId, specialistId)
      .then(() => {
        console.log('✓ Connected to collaboration session');

        // Listen for other specialist's annotations
        SessionSync.on('annotation-added', (annotation) => {
          CollabOverlay.highlightWord(
            annotation.wordId,
            annotation.color,
            annotation.style
          );
        });

        SessionSync.on('note-added', (note) => {
          CollabOverlay.addNote(note.x, note.y, note.text, note.type);
        });

        SessionSync.on('decision-logged', (decision) => {
          console.log('Other specialist logged:', decision.decision);
        });
      })
      .catch(err => {
        console.error('Failed to connect:', err);
        // Fall back to non-collaborative mode
      });
  }
</script>
```

---

## Components Explained

### 1. **SessionSync** (`js/collab/session-sync.js`)

Manages WebSocket connection and real-time message broadcasting.

**Methods:**

```javascript
// Connect to collaboration session
SessionSync.connect(sessionId, specialistId, wsUrl)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Failed to connect'));

// Add annotation (highlight, box, arrow)
SessionSync.addAnnotation({
  type: 'highlight',        // 'highlight', 'box', 'arrow', etc.
  wordId: 'word-123',        // Target element
  color: '#FFD700',          // Annotation color
  style: 'circle'            // 'circle' or 'box'
});

// Add sticky note
SessionSync.addNote({
  x: 100,
  y: 200,
  text: 'Student struggling with blends',
  type: 'observation'        // 'strategy', 'observation', 'question'
});

// Log decision about student response
SessionSync.logDecision({
  moment: {
    studentResponse: 'cat',
    correct: true,
    timestamp: Date.now()
  },
  decision: 'move-forward',   // 'move-forward', 'reteach', 'differentiate', 'probe'
  rationale: 'Student correctly decoded CVC word with confidence'
});

// Send message (hidden from student)
SessionSync.sendMessage('That was a good question. Let me probe deeper.');

// Get session status
const status = SessionSync.getStatus();
// {isConnected, sessionId, specialistId}

// Listen for events
SessionSync.on('annotation-added', (annotation) => {
  // annotation = {id, type, wordId, color, style, from, timestamp}
});

SessionSync.on('note-added', (note) => {
  // note = {id, x, y, text, type, from, timestamp}
});

SessionSync.on('decision-logged', (decision) => {
  // decision = {id, decision, rationale, evidence, from, timestamp}
});

SessionSync.on('connected', (info) => {
  console.log('Collaboration session started');
});

SessionSync.on('disconnected', () => {
  console.log('Connection lost');
});

// Disconnect
SessionSync.disconnect();
```

### 2. **CollabOverlay** (`games/ui/collab-overlay.js`)

SVG-based markup tool for annotating game board.

**Methods:**

```javascript
// Initialize on game board
CollabOverlay.init('container-id', {
  highlightColor: '#FFD700',
  arrowColor: '#FF6B6B',
  noteColor: '#FFE66D',
  remoteCursorColor: '#0173b2',
  strokeWidth: 3
});

// Highlight a word (circle or box)
const id = CollabOverlay.highlightWord(
  wordElement,      // DOM element or word ID string
  '#FFD700',        // Color
  'circle'          // 'circle' or 'box'
);

// Draw arrow pointing to area of interest
CollabOverlay.drawAttention(
  fromX, fromY,     // Start coordinates
  toX, toY,         // End coordinates
  '#FF6B6B'         // Color
);

// Add sticky note
const noteId = CollabOverlay.addNote(
  x, y,             // Position on board
  'Student needs help with vowel blends',
  'observation'     // Type: 'strategy', 'observation', 'question'
);

// Show remote specialist's cursor
CollabOverlay.showRemoteCursor(
  {x: 150, y: 200},
  'Sarah (Co-Teacher)'
);

// Remove annotation
CollabOverlay.removeAnnotation(annotationId);

// Clear all annotations
CollabOverlay.clear();

// Get all current annotations
const annotations = CollabOverlay.getAnnotations();

// Enable/disable overlay
CollabOverlay.setEnabled(true);

// Resize overlay (called automatically on window resize)
CollabOverlay.resize();
```

### 3. **DecisionLog** (`js/collab/decision-log.js`)

Records specialist decisions and rationales for post-session analysis.

**Methods:**

```javascript
// Initialize logging
DecisionLog.init(sessionId, {game: 'word-quest', student: 'John'});

// Log a decision
const decisionId = DecisionLog.logDecision({
  moment: {
    studentResponse: 'cat',
    correct: true,
    timestamp: Date.now()
  },
  decision: 'move-forward',     // Required: one of valid types
  rationale: 'Student correctly decoded CVC word',
  evidence: ['Fluent reading', 'No hesitation'],
  nextSteps: 'Continue with similar words',
  tags: ['decoding', 'cvc-words']
});

// Quick observation log
DecisionLog.logObservation({
  moment: {timestamp: Date.now()},
  text: 'Student engaged and focused',
  tags: ['engagement']
});

// Update decision with new info
DecisionLog.updateDecision(decisionId, {
  rationale: 'Student decoded word but needs more complex words'
});

// Query decisions
const reteachDecisions = DecisionLog.getDecisionsByType('reteach');
const wordDecisions = DecisionLog.getDecisionsForMoment('word-123');

// Get summary
const summary = DecisionLog.getSummary();
// {totalDecisions, breakdown: {move-forward: 8, reteach: 2, ...}}

// Get detailed report
const report = DecisionLog.getReport();
// {sessionId, totalDecisions, percentages, patterns, recommendations, decisions}

// Get all decisions
const all = DecisionLog.getAll();

// Export
const json = DecisionLog.exportJSON();
const csv = DecisionLog.exportCSV();

// Clear log (starts new session)
DecisionLog.clear();
```

**Decision Types:**
- `move-forward` - Student ready to progress
- `reteach` - Student needs re-instruction
- `differentiate` - Adjust task difficulty
- `probe` - Ask probing question to assess understanding
- `clarify` - Clarify instructions or concept
- `observe` - Passive observation (no decision)

**Valid Evidence Tags:**
- `fluent-reading`, `hesitant`, `self-correction`
- `independent`, `with-support`, `needs-modeling`
- `blending`, `decoding`, `comprehension`
- `engagement`, `off-task`, `confused`
- `cvc-words`, `sight-words`, `blends`, `digraphs`

---

## Integration Example: Word Quest Collaborative Mode

```html
<!-- word-quest.html -->
<div id="game-board" class="game-board">
  <!-- Game content -->
</div>

<!-- Collaboration panel (optional, for specialist view) -->
<div id="collab-panel" style="display: none;"></div>

<script>
  const isTeacher = new URLSearchParams(location.search).get('role') === 'teacher';
  const sessionId = new URLSearchParams(location.search).get('sessionId');
  const studentName = new URLSearchParams(location.search).get('student');

  if (isTeacher && sessionId) {
    initializeCollaboration();
  }

  async function initializeCollaboration() {
    // Initialize components
    CollabOverlay.init('game-board');
    DecisionLog.init(sessionId, {game: 'word-quest', student: studentName});

    // Connect to session
    const specialistId = 'teacher-' + getUserId();
    await SessionSync.connect(sessionId, specialistId);

    console.log('✓ Collaboration enabled');

    // Attach listener to game events
    document.addEventListener('student-correct', (event) => {
      const {word, responseTime} = event.detail;

      // Log decision
      DecisionLog.logDecision({
        moment: {
          studentResponse: word,
          correct: true,
          responseTime,
          timestamp: Date.now()
        },
        decision: responseTime < 1000 ? 'move-forward' : 'probe',
        rationale: `Student ${responseTime < 1000 ? 'fluently' : 'hesitantly'} decoded word`,
        tags: ['decoding']
      });

      // Broadcast decision
      SessionSync.logDecision({
        moment: {studentResponse: word},
        decision: responseTime < 1000 ? 'move-forward' : 'probe',
        rationale: 'Testing student fluency'
      });
    });

    document.addEventListener('student-incorrect', (event) => {
      const {word, studentResponse} = event.detail;

      DecisionLog.logDecision({
        moment: {
          studentResponse,
          correct: false,
          targetWord: word,
          timestamp: Date.now()
        },
        decision: 'reteach',
        rationale: `Student misread "${word}" as "${studentResponse}"`,
        evidence: ['Blending error', 'Mispronunciation'],
        tags: ['decoding-error']
      });

      // Highlight the word on overlay
      CollabOverlay.highlightWord(word, '#FF6B6B', 'circle');

      // Add note about error
      const wordElement = document.querySelector(`[data-word-id="${word}"]`);
      if (wordElement) {
        const rect = wordElement.getBoundingClientRect();
        const boardRect = document.querySelector('.game-board').getBoundingClientRect();
        CollabOverlay.addNote(
          rect.left - boardRect.left,
          rect.top - boardRect.top,
          `Error: said "${studentResponse}"`,
          'observation'
        );
      }

      // Alert other specialist
      SessionSync.sendMessage(`${word} was misread as "${studentResponse}". Recommend reteaching.`);
    });

    // Render decision report at end of session
    document.addEventListener('game-end', () => {
      const report = DecisionLog.getReport();
      console.log('=== Session Report ===');
      console.log(`Total decisions: ${report.totalDecisions}`);
      console.log('Breakdown:', report.percentages);
      console.log('Recommendations:', report.recommendations);

      // Option to export
      if (confirm('Export decision log?')) {
        downloadJSON(DecisionLog.exportJSON(), `decision-log-${sessionId}.json`);
      }
    });
  }

  function getUserId() {
    return localStorage.getItem('specialist-id') || Math.random().toString(36).substr(2, 9);
  }

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
</script>
```

---

## WebSocket Server Setup (Node.js + Socket.IO Example)

```javascript
// collab-server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active sessions
const sessions = new Map();

io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  socket.on('join-session', (data) => {
    const {sessionId, specialistId} = data;

    // Create session if doesn't exist
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        specialists: new Map(),
        annotations: []
      });
    }

    const session = sessions.get(sessionId);
    session.specialists.set(specialistId, {
      id: specialistId,
      socketId: socket.id,
      joinedAt: Date.now()
    });

    socket.join(sessionId);
    console.log(`✓ ${specialistId} joined session ${sessionId}`);

    // Notify other specialists
    socket.to(sessionId).emit('specialist-joined', {
      specialistId,
      timestamp: Date.now()
    });
  });

  socket.on('annotation-added', (data) => {
    const {sessionId} = data;
    const session = sessions.get(sessionId);

    if (session) {
      session.annotations.push(data);
      // Broadcast to other specialists in session
      socket.to(sessionId).emit('annotation-added', data);
    }
  });

  socket.on('note-added', (data) => {
    socket.to(data.sessionId).emit('note-added', data);
  });

  socket.on('decision-logged', (data) => {
    socket.to(data.sessionId).emit('decision-logged', data);
  });

  socket.on('chat-message', (data) => {
    socket.to(data.sessionId).emit('chat-message', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('🚀 Collaboration server running on port 3000');
});
```

---

## Testing Checklist

### SessionSync
- [ ] WebSocket connects without errors
- [ ] Join message sent with correct sessionId/specialistId
- [ ] Annotations broadcast to other specialist
- [ ] Notes appear on other specialist's overlay
- [ ] Decisions logged and visible in report
- [ ] Messages sent/received in real-time
- [ ] Disconnect handled gracefully
- [ ] Reconnect attempt works
- [ ] Event listeners fire correctly

### CollabOverlay
- [ ] Overlay initializes on game board
- [ ] Highlight appears around selected word
- [ ] Both 'circle' and 'box' styles work
- [ ] Arrow points from source to target
- [ ] Sticky notes render with text
- [ ] Remote cursor appears and disappears
- [ ] Annotations removable
- [ ] Clear removes all annotations
- [ ] Overlay resizes on window change

### DecisionLog
- [ ] Decisions logged with correct type
- [ ] getSummary returns accurate count
- [ ] Breakdown by decision type correct
- [ ] getReport generates recommendations
- [ ] exportJSON includes all decisions
- [ ] exportCSV formats correctly
- [ ] Recommendations meaningful based on data
- [ ] Evidence tags recognized

### Accessibility
- [ ] High contrast mode: Clear borders on annotations
- [ ] Low vision mode: Larger overlay elements
- [ ] Dyslexia mode: OpenDyslexia font in notes
- [ ] Keyboard navigation: Tab through controls
- [ ] Screen reader: aria-labels on buttons

---

## Privacy & Security Notes

**Student View (Hidden from Student):**
```css
.spec-only {
  display: none !important;
}
```

This CSS rule hides specialist-only UI from student:
- Collaboration panel
- Annotations overlay
- Decision log interface

**Data Considerations:**
- Decisions logged locally and on server
- Student cannot see specialist annotations
- Messages between specialists are not logged for student
- Post-session report generated separately from student assessment

---

## Performance Tips

### Reduce Network Load
```javascript
// Throttle cursor updates
let lastCursorUpdate = 0;
document.addEventListener('mousemove', (e) => {
  if (Date.now() - lastCursorUpdate > 200) {  // 200ms throttle
    SessionSync.moveCursor({x: e.clientX, y: e.clientY});
    lastCursorUpdate = Date.now();
  }
});
```

### Clean Up Annotations
```javascript
// Remove old annotations periodically
setInterval(() => {
  const annotations = CollabOverlay.getAnnotations();
  const now = Date.now();
  annotations.forEach(a => {
    if (now - a.createdAt > 10 * 60 * 1000) {  // 10 minutes
      CollabOverlay.removeAnnotation(a.id);
    }
  });
}, 60000);  // Check every minute
```

---

## Future Enhancements

1. **Real-time transcription** - Text of specialist chat
2. **Audio/video call** - Specialist-to-specialist communication
3. **Screen recording** - Capture session for review
4. **Undo/redo** - Annotation history
5. **Templates** - Pre-made decision notes
6. **Analytics** - Decision patterns over time
7. **Parent viewing** - Limited access for family
8. **Multi-student sync** - Watch multiple students simultaneously
9. **AI recommendations** - Suggest decisions based on student response
10. **Mobile app** - Remote specialist monitoring from phone

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [SVG Annotation Patterns](https://www.w3schools.com/graphics/svg_intro.asp)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Specialist Coaching Best Practices](https://www.adlit.org/)
