# Cornerstone MTSS Deployment Guide

## Overview

Complete deployment documentation for Phases 1-6 production environment. Covers local setup, testing, staging, and production deployment to GitHub Pages + cloud services.

---

## Part 1: Local Development Setup

### Prerequisites
```bash
# Node.js 16+
node --version

# Git
git --version

# Python 3.x (for local server)
python3 --version
```

### Initial Setup
```bash
cd /path/to/CornerstoneMTSS

# Install dependencies (if needed)
npm install

# Start local dev server
python3 -m http.server 4174

# Navigate to http://127.0.0.1:4174
```

### Build & Release Checks
```bash
# Run all guardrails checks
npm run audit:ui      # UI quality audit
npm run hud:check     # Build badge verification
npm run release:check # Pre-release validation

# Should see: ✅ All checks passed
```

---

## Part 2: Testing Each Phase

### Phase 5: Accessibility Testing

```bash
# Test accessibility modes on any page
# Add to HTML head:
# <script src="/js/settings/a11y-settings.js"></script>
# <script src="/js/settings/a11y-controls.js"></script>
# <link rel="stylesheet" href="/style/a11y-*.css">

# Keyboard shortcut: Alt+A to toggle controls
# Test each mode:
# - Standard (default)
# - Dyslexia-Friendly (OpenDyslexia font visible)
# - High Contrast (black/white, 3px borders, symbols)
# - Large Text (200% scale)
```

### Phase 3: Voice Analysis Testing

```javascript
// In browser console on Typing Quest:
VoiceRecorder.init().then(() => {
  console.log('✓ Microphone access granted');

  // Click record button and speak
  // Check: Waveform animates in real-time
  // Check: Feedback panel shows pitch/tempo/clarity
  // Check: Ava reacts based on score
});
```

### Phase 2: Collaboration Testing

```bash
# Terminal 1: Start WebSocket server
cd server
npm install
node collab-server.js
# Should show: 🚀 Collaboration server running on port 3000

# Terminal 2: Open Word Quest in browser
# Add to URL: ?sessionId=test-123&role=teacher&collab=true

# Terminal 3: Open same URL in another browser
# Both should see:
# - Real-time annotations sync
# - Cursor positions update
# - Messages appear immediately
```

### Phase 4: 3D Environments Testing

```javascript
// In browser console on Word Quest page:
WordQuest3D.init('renderCanvas');
console.log('✓ 3D scene initialized');

// Check:
// - Game board appears in 3D
// - Word tiles render with correct colors
// - Keyboard appears below board
// - Can rotate camera (mouse drag)
// - Can zoom (mouse wheel)
// - Tile reveal animation works
```

### Phase 6: Advanced Features Testing

```javascript
// 3D Gallery
StudentGallery3D.init('canvas');
students.forEach(s => StudentGallery3D.addStudent(s.id, s));
// Check: Podiums height = progress%, color = status

// Adaptive AI
AdaptiveRecommendations.init();
AdaptiveRecommendations.trackResponse(studentId, {
  correct: true,
  word: 'cat',
  responseTime: 1200
});
const recs = AdaptiveRecommendations.getRecommendations(studentId);
// Check: Recommendations generated

// Parent Dashboard
ParentDashboard.init('dashboard', {
  name: 'Emma Johnson',
  grade: '2nd',
  class: 'Room 201'
});
ParentDashboard.updateProgress({fluency: 75, recognition: 82});
// Check: Progress bars update, responsive layout
```

---

## Part 3: WebSocket Server Setup

### Prerequisites
```bash
npm install express socket.io cors
```

### Production Server Code

Create `archive/collab-staged/server/collab-server.js`:

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://127.0.0.1:4174', 'https://bkseatown.github.io'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Store active sessions
const sessions = new Map();
const connections = new Map();

// WebSocket handlers
io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);

  socket.on('join-session', (data) => {
    const {sessionId, specialistId} = data;

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        specialists: new Map(),
        annotations: [],
        messages: [],
        decisions: [],
        createdAt: Date.now()
      });
    }

    const session = sessions.get(sessionId);
    session.specialists.set(specialistId, {
      id: specialistId,
      socketId: socket.id,
      joinedAt: Date.now(),
      name: data.name || 'Specialist'
    });

    connections.set(socket.id, {sessionId, specialistId});
    socket.join(sessionId);

    console.log(`✓ ${specialistId} joined ${sessionId}`);

    socket.to(sessionId).emit('specialist-joined', {
      specialistId,
      name: data.name,
      timestamp: Date.now()
    });
  });

  socket.on('annotation-added', (data) => {
    const conn = connections.get(socket.id);
    if (!conn) return;

    const session = sessions.get(conn.sessionId);
    if (session) {
      session.annotations.push(data);
      socket.to(conn.sessionId).emit('annotation-added', data);

      // Auto-cleanup old annotations (> 1 hour)
      const oneHourAgo = Date.now() - 3600000;
      session.annotations = session.annotations.filter(a => a.createdAt > oneHourAgo);
    }
  });

  socket.on('decision-logged', (data) => {
    const conn = connections.get(socket.id);
    if (!conn) return;

    const session = sessions.get(conn.sessionId);
    if (session) {
      session.decisions.push(data);
      socket.to(conn.sessionId).emit('decision-logged', data);
    }
  });

  socket.on('chat-message', (data) => {
    const conn = connections.get(socket.id);
    if (!conn) return;

    const session = sessions.get(conn.sessionId);
    if (session) {
      session.messages.push(data);
      socket.to(conn.sessionId).emit('chat-message', data);
    }
  });

  socket.on('disconnect', () => {
    const conn = connections.get(socket.id);
    if (conn) {
      const session = sessions.get(conn.sessionId);
      if (session) {
        session.specialists.delete(conn.specialistId);
        if (session.specialists.size === 0) {
          sessions.delete(conn.sessionId);
        }
      }
      connections.delete(socket.id);
    }
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// REST endpoints for session management
app.get('/api/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error: 'Session not found'});

  res.json({
    id: session.id,
    specialists: Array.from(session.specialists.values()),
    annotationCount: session.annotations.length,
    decisionCount: session.decisions.length,
    messageCount: session.messages.length
  });
});

app.get('/api/session/:id/decisions', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error: 'Session not found'});

  res.json(session.decisions);
});

app.get('/api/session/:id/export', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({error: 'Session not found'});

  const exportData = {
    sessionId: session.id,
    exportedAt: new Date().toISOString(),
    summary: {
      specialists: session.specialists.size,
      annotations: session.annotations.length,
      decisions: session.decisions.length,
      messages: session.messages.length
    },
    decisions: session.decisions,
    messages: session.messages
  };

  res.json(exportData);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    activeConnections: connections.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Collaboration server running on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down gracefully');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
```

### Start Production Server

```bash
# Local testing
node archive/collab-staged/server/collab-server.js

# Production (with PM2)
npm install -g pm2
pm2 start archive/collab-staged/server/collab-server.js --name "collab-server"
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs collab-server
```

---

## Part 4: GitHub Pages Deployment

### Configuration

1. **Update `build.json`** (version tracking):
```json
{
  "version": "6.0.0",
  "timestamp": "2026-03-17T00:00:00Z",
  "phases": {
    "1": "Color system + dashboards + Ava",
    "2": "Real-time collaboration",
    "3": "Voice analysis",
    "4": "3D environments",
    "5": "Accessibility variants",
    "6": "Advanced features"
  },
  "status": "production"
}
```

2. **Update `.github/workflows/deploy-pages.yml`**:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Build badge
      run: node build-stamp.js

    - name: Run guardrails checks
      run: |
        npm run audit:ui
        npm run hud:check
        npm run release:check

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
        cname: cornerstone.edu  # Optional: custom domain
```

3. **Deploy**:
```bash
git push main

# Workflow runs automatically
# Monitor at: https://github.com/bkseatown/CornerstoneMTSS/actions

# Live at: https://bkseatown.github.io/CornerstoneMTSS
```

---

## Part 5: Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Guardrails checks passing
- [ ] Build badge updated
- [ ] Version bumped in build.json
- [ ] Git history clean
- [ ] No sensitive data in commits
- [ ] Performance benchmarks met

### Deployment
- [ ] GitHub Pages workflow passes
- [ ] Site accessible at https://bkseatown.github.io/CornerstoneMTSS
- [ ] All pages load without 404 errors
- [ ] Accessibility features work
- [ ] Voice recording prompts for permission
- [ ] 3D scenes render (Chrome/Firefox/Safari/Edge)

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance (Lighthouse)
- [ ] User acceptance testing
- [ ] Production WebSocket server operational
- [ ] Parent portal email notifications working
- [ ] Backup decision logs periodically

---

## Part 6: Monitoring & Maintenance

### Performance Monitoring
```javascript
// Add to main page
window.addEventListener('load', () => {
  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;

  console.log(`Page load: ${pageLoadTime}ms`);
  console.log(`Server response: ${connectTime}ms`);

  // Send to analytics
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/perf', JSON.stringify({
      pageLoadTime,
      connectTime,
      timestamp: Date.now()
    }));
  }
});
```

### Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);

  // Send to error tracking service
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: event.error.message,
      stack: event.error.stack,
      timestamp: Date.now()
    })
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

### Usage Analytics
```javascript
// Track feature usage
function trackFeature(feature, action) {
  fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      feature,
      action,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
  });
}

// Examples
trackFeature('voice-analysis', 'recording-started');
trackFeature('3d-gallery', 'student-focused');
trackFeature('accessibility', 'mode-changed', {mode: 'dyslexia'});
```

---

## Part 7: Production Troubleshooting

### WebSocket Connection Issues

```javascript
// Debugging connection
SessionSync.on('disconnected', () => {
  console.error('Lost collaboration connection');
  // Attempt reconnect with exponential backoff
  let retries = 0;
  const reconnect = () => {
    retries++;
    const delay = Math.min(1000 * Math.pow(2, retries), 30000);
    setTimeout(() => {
      SessionSync.connect(sessionId, specialistId)
        .catch(() => reconnect());
    }, delay);
  };
  reconnect();
});
```

### 3D Rendering Issues

```javascript
// Check WebGL support
function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return !!gl;
}

if (!checkWebGLSupport()) {
  console.warn('⚠️ WebGL not supported - falling back to 2D');
  // Use 2D game shell instead of 3D
}
```

### Accessibility Not Working

```javascript
// Force accessibility reload
localStorage.setItem('cornerstone-a11y-mode', 'dyslexia');
localStorage.setItem('cornerstone-font-scale', '1.5');
location.reload();
```

---

## Part 8: Scaling Considerations

### For 1000+ Users
- [ ] CDN for static assets (CSS/JS/images)
- [ ] Session storage (Redis) instead of in-memory
- [ ] Load balancer for WebSocket servers
- [ ] Database for decision logs
- [ ] Analytics service (Mixpanel, Amplitude)

### For 100+ Concurrent Users
- [ ] Multiple WebSocket servers with Socket.IO Redis adapter
- [ ] Horizontal scaling with PM2 cluster mode
- [ ] Load testing with k6 or Apache JMeter

### For International Users
- [ ] CDN with geographic distribution
- [ ] Multi-language UI (i18n)
- [ ] Timezone-aware scheduling

---

## Resources

- [GitHub Pages Deployment](https://pages.github.com/)
- [Socket.IO Production Deployment](https://socket.io/docs/v4/deploying-on-a-linux-server/)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Lighthouse Performance Guide](https://developers.google.com/web/tools/lighthouse)
- [WCAG Accessibility Checklist](https://www.w3.org/WAI/test-evaluate/preliminary/)
