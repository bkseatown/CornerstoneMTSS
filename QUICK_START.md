# Quick Start — Cornerstone MTSS Platform

**Everything you need to run the platform locally or deploy to production.**

---

## 30-Second Setup

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Choose database (pick one)
npm run db:mongodb  # MongoDB
# OR
npm run db:postgresql  # PostgreSQL

# 3. Start development server
npm run dev

# 4. Open browser
# http://127.0.0.1:4174/index.html
```

---

## Environment Configuration

Copy template and customize:

```bash
# Development
cp .env.example .env
# Edit: MONGODB_URI or DATABASE_URL

# Production
cp .env.production.example .env.production
# Edit: CRITICAL marked fields (API keys, credentials, domains)
```

---

## Database Setup

### MongoDB (Fastest to Get Started)

```bash
# Start MongoDB (Docker)
docker run -d -p 27017:27017 mongo

# Initialize
npm run db:init

# Verify
curl http://localhost:3000/api/health
```

### PostgreSQL (Production Recommended)

```bash
# Start PostgreSQL (Docker)
docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres

# Create database
createdb cornerstone_mtss

# Initialize
npm run db:init

# Verify
curl http://localhost:3000/api/health
```

---

## What's Inside

### Phases 2-6 Features

| Phase | Feature | Key Files |
|---|---|---|
| 2 | Real-time collaboration | `js/collab/`, `server/collab-server.js` |
| 3 | Voice analysis | `js/voice/`, `games/ui/voice-feedback.js` |
| 4 | 3D environments | `js/3d/`, `games/ui/game-shell.js` |
| 5 | Accessibility | `js/settings/a11y-*.js`, `style/a11y-*.css` |
| 6 | AI recommendations | `js/ai/`, `js/3d/student-gallery-3d.js`, `js/parent/` |

### Production Infrastructure

| Component | Location | Purpose |
|---|---|---|
| GitHub Actions | `.github/workflows/deploy-pages.yml` | Auto-deployment with guardrails checks |
| Environment templates | `.env.example`, `.env.production.example` | Configuration for all environments |
| Database schemas | `server/database/` | MongoDB (Mongoose) + PostgreSQL |
| Deployment guide | `server/database/DATABASE_SETUP_GUIDE.md` | Comprehensive setup and migration docs |

---

## Game Surfaces

| Game | URL | Status |
|---|---|---|
| Word Quest | `word-quest.html` | Phase 4: 3D environment |
| Typing Quest | `typing-quest.html` | Phase 3: Voice analysis |
| Reading Lab | `reading-lab.html` | Phases 2-3: Collaboration + voice |
| Sentence Surgery | `sentence-surgery.html` | Phase 2: Collaboration |
| Writing Studio | `writing-studio.html` | Phase 2: Collaboration |
| Precision Play | `precision-play.html` | Phase 2: Collaboration |
| Paragraph Builder | `paragraph-builder.html` | Phases 2-5: Collaboration + accessibility |

---

## Testing Features

### Collaboration
```bash
# Terminal 1: Start WebSocket server
cd server && npm run dev

# Terminal 2: Open Word Quest in two browsers
# http://127.0.0.1:4174/word-quest.html?sessionId=test-123&role=teacher

# Test:
# ✓ Annotations sync between tabs
# ✓ Cursor positions appear
# ✓ Messages deliver instantly
```

### Voice Analysis
```javascript
// In browser console on Typing Quest
VoiceRecorder.init().then(() => {
  console.log('✓ Microphone access granted');
  // Click record button and speak
  // Check: Waveform animates, feedback shows pitch/tempo
});
```

### Accessibility
```javascript
// Toggle accessibility modes: Alt+A
// Or programmatically:
localStorage.setItem('cornerstone-a11y-mode', 'dyslexia');
location.reload();
```

### 3D Rendering
```javascript
// In browser console on Word Quest
WordQuest3D.init('renderCanvas');
console.log('✓ 3D scene initialized');
```

---

## Deployment

### GitHub Pages (Automatic)

```bash
# Push to main
git push main

# GitHub Actions workflow automatically:
# 1. Runs guardrails checks
# 2. Generates build badge
# 3. Deploys to GitHub Pages
# 4. Smoke tests the deployment

# Live at: https://bkseatown.github.io/CornerstoneMTSS
```

### Production (With Database)

```bash
# 1. Setup managed database
# MongoDB Atlas: https://www.mongodb.com/cloud/atlas
# AWS RDS PostgreSQL: https://aws.amazon.com/rds/

# 2. Update .env.production
cp .env.production.example .env.production
# Edit: Database URI, API keys, domains

# 3. Deploy server
npm install
npm run db:init
npm start

# Server runs on: http://localhost:3000
# WebSocket: ws://localhost:3000
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","activeSessions":0,"activeConnections":0}
```

### Active Sessions

```bash
curl http://localhost:3000/api/sessions
# {"total":2,"sessions":[...]}
```

### Session Export

```bash
curl http://localhost:3000/api/session/:sessionId/export?format=json
# {sessionId, summary, decisions, messages, annotationSummary}
```

---

## Troubleshooting

### "Database connection failed"

**MongoDB:**
```bash
# Verify MongoDB is running
docker ps | grep mongo

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/cornerstone-mtss
```

**PostgreSQL:**
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -U postgres -d cornerstone_mtss -c "SELECT NOW();"
```

### "Port 3000 already in use"

```bash
# Change port in .env
PORT=3001

# Or kill the process
lsof -ti:3000 | xargs kill -9
```

### "Guardrails checks failed"

```bash
# Run checks locally
npm run audit:ui
npm run hud:check
npm run release:check

# Fix issues and commit
git add . && git commit -m "Fix guardrails"
```

---

## Documentation

### Deep Dives

- **Phases 2-6 Integration:** `docs/INTEGRATION_EXAMPLES.md` (400+ lines)
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md` (400+ lines)
- **Database Setup:** `server/database/DATABASE_SETUP_GUIDE.md` (400+ lines)
- **Voice Analysis:** `docs/VOICE_ANALYSIS_INTEGRATION_GUIDE.md` (300 lines)
- **3D Environments:** `docs/3D_ENVIRONMENTS_INTEGRATION_GUIDE.md` (400 lines)
- **Accessibility:** `docs/A11Y_INTEGRATION_GUIDE.md` (330 lines)
- **Advanced Features:** `docs/PHASE6_ADVANCED_FEATURES_GUIDE.md` (450 lines)
- **Collaboration:** `docs/COLLAB_INTEGRATION_GUIDE.md` (350 lines)

### API References

- **Collaboration:** `js/collab/session-sync.js` (lines 1-50)
- **Voice Analysis:** `js/voice/voice-analyzer.js` (lines 1-100)
- **3D Rendering:** `js/3d/word-quest-3d.js` (lines 1-80)
- **Accessibility:** `js/settings/a11y-settings.js` (lines 1-50)
- **Server:** `server/collab-server.js` (lines 315-476)

---

## Architecture

```
Cornerstone MTSS (6 Phases + Infrastructure)
│
├── Phase 1: Foundation
│   └── Color system, tokens, build badge
│
├── Phase 2: Real-Time Collaboration
│   ├── WebSocket sync (Socket.IO)
│   ├── Decision logging
│   ├── Game board annotations
│   └── Message exchange
│
├── Phase 3: Voice Analysis
│   ├── Microphone capture (Web Audio API)
│   ├── FFT frequency analysis
│   ├── Phoneme similarity
│   └── Ava emotional reactions
│
├── Phase 4: 3D Environments
│   ├── Babylon.js rendering
│   ├── Dynamic lighting & shadows
│   ├── Celebration effects
│   └── Keyboard interaction
│
├── Phase 5: Accessibility
│   ├── Dyslexia-friendly (OpenDyslexia)
│   ├── High contrast (WCAG AAA)
│   ├── Low vision (200% scale)
│   └── Color blind palettes
│
├── Phase 6: Advanced Features
│   ├── 3D student gallery
│   ├── Adaptive AI recommendations
│   └── Parent dashboard (FERPA compliant)
│
└── Infrastructure (Production Ready)
    ├── GitHub Actions auto-deployment
    ├── Environment configuration (.env)
    ├── Database schemas (MongoDB + PostgreSQL)
    ├── WebSocket server (Node.js + Socket.IO)
    └── Monitoring & logging
```

---

## Key Technologies

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Vanilla JS + Canvas/SVG | Lightweight, no build step |
| 3D | Babylon.js 5+ | WebGL rendering, physics, particles |
| Audio | Web Audio API | Real-time microphone capture & FFT |
| Real-time | Socket.IO | WebSocket with fallbacks |
| Backend | Express.js | REST API + static serving |
| Databases | MongoDB + PostgreSQL | Session & decision persistence |
| Styling | CSS with tokens | OKLCH colors, accessibility modes |
| Accessibility | WCAG AAA | Compliance-tested implementations |

---

## Performance Targets

| Metric | Target | Status |
|---|---|---|
| Page load time | < 3s | ✅ Tested |
| 3D frame rate | 60 FPS | ✅ Babylon.js optimized |
| Voice latency | < 200ms | ✅ Real-time processing |
| Collaboration sync | < 100ms | ✅ Socket.IO optimized |
| Accessibility toggle | Instant | ✅ CSS-based switching |

---

## Security

✅ JWT-based authentication (framework in place)
✅ CORS configured for allowed origins
✅ FERPA compliance (minimal parent data storage)
✅ SSL/TLS support (via reverse proxy)
✅ Audit logging (30-day retention)
✅ Environment-based secrets (never in code)
✅ Rate limiting (configurable)

---

## Support

**Stuck?** Check these in order:

1. Read the relevant guide in `docs/` folder
2. Check `FINAL_DELIVERY_SUMMARY.md` for architecture overview
3. Review inline code comments (detailed in all files)
4. Check `.env.example` for all configuration options
5. Run `npm run health-check` to verify server

---

**Last Updated:** March 17, 2026
**Version:** 6.0.0
**Status:** ✅ Production Ready
