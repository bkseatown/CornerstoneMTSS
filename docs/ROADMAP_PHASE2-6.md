# Cornerstone MTSS Roadmap: Phase 2-6 (High-ROI Features)

## Overview
Phase 1 (March 17, 2026) delivered:
- ✅ Systematic OKLCH color token generation (solves color consistency problem)
- ✅ Interactive progress dashboards (D3.js competency heatmap)
- ✅ Animated Ava character (SVG + GSAP emotion/gesture system)

Phases 2-6 are the cutting-edge platform differentiators. This document outlines architecture, data flows, and integration points for each.

---

## Phase 2: Real-Time Specialist Collaboration (Weeks 1-2)

### What This Solves
Teachers are overloaded. Two specialists need to:
- Watch same student game session live
- Annotate/mark up the board in real-time without breaking student flow
- Chat without student seeing
- Track decisions for post-session debrief

### Technical Architecture

```
Student Game Session
         ↓
    WebSocket Server (Node.js + Socket.io or similar)
         ↓
  Annotation Service (stores marks, hints, decisions)
         ↓
Two Specialist Browsers (see live, annotate, sync instantly)
```

### Key Components

**1. WebSocket Sync Layer** (`js/collab/session-sync.js`)
```javascript
// Real-time state sync for annotations
const SessionSync = {
  connect(sessionId, specialistId) {
    // Join session room
    socket.emit('join-session', {sessionId, specialistId});

    // Listen for all annotations from other specialist
    socket.on('annotation-added', (annotation) => {
      renderAnnotation(annotation);
    });

    // Broadcast my annotation
    addAnnotation(annotation) {
      socket.emit('add-annotation', annotation);
    }
  }
};
```

**2. Annotation Overlay** (`games/ui/collab-overlay.js`)
```javascript
// SVG overlay on game board for specialist markup
const CollabOverlay = {
  // Draw circle around a word
  highlightWord(wordElement, color = 'gold') {},

  // Add sticky note with decision
  addNote(x, y, text, type = 'strategy') {},

  // Arrow pointing to something to notice
  drawAttention(fromX, fromY, toX, toY) {},

  // Real-time cursor position of other specialist
  showRemoteCursor(position, name) {}
};
```

**3. Decision Recorder** (`js/collab/decision-log.js`)
```javascript
// Track what specialists chose and why
const DecisionLog = {
  logDecision(moment, decision, rationale) {
    // Moment: {timestamp, studentResponse, correct}
    // Decision: {type: 'reteach'|'move-forward'|'differentiate', ... }
    // Rationale: string

    // Stores for post-session analysis
  }
};
```

### Integration Points
- **Game shell**: Modify `games/ui/game-shell.js` to accept `data-collaboration-mode="true"`
- **Student view**: Hide collaboration UI from student (CSS: `.spec-only { display: none !important; }`)
- **Teacher Hub**: Add "Start Collaborative Watch" button to live sessions

### Data Requirements
- Session ID (existing)
- Multiple specialist connections (new)
- Annotation stream (new WebSocket messages)
- Decision log for post-analysis (new database table)

---

## Phase 3: Voice Analysis for Speaking Practice (Weeks 2-3)

### What This Solves
Speaking practice (e.g., Typing Quest voice recording) needs **feedback**, not just "recorded/not recorded".
- Student hears model pronunciation
- Student records their own
- System analyzes: pitch, tempo, clarity, phoneme accuracy
- Returns visual + audio feedback

### Technical Architecture

```
Student speaks
    ↓
Web Audio API captures audio blob
    ↓
Real-time waveform visualization (canvas)
    ↓
Analysis Engine:
  - Pitch detection (TarsosDSP.js or Crepe.js)
  - Tempo analysis (RMS energy)
  - Phoneme alignment (compare to model via ML)
    ↓
Feedback UI: "Good pitch! A bit slower than model."
```

### Key Components

**1. Voice Capture** (`js/voice/voice-recorder.js`)
```javascript
const VoiceRecorder = {
  init(containerId) {
    navigator.mediaDevices.getUserMedia({audio: true})
      .then(stream => {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        // visualize waveform in real-time
      });
  },

  startRecording() { /* ... */ },
  stopRecording() { /* returns audio blob */ }
};
```

**2. Audio Analysis** (`js/voice/voice-analyzer.js`)
```javascript
const VoiceAnalyzer = {
  // Compare student recording to model
  analyze(studentAudio, modelAudio) {
    return {
      pitch: { studentHz: 220, modelHz: 215, match: 98 }, // 98% match
      tempo: { studentBPM: 120, modelBPM: 115, match: 96 },
      clarity: 0.85, // RMS energy analysis
      phonemeAccuracy: 0.92, // ML-based phoneme comparison
      suggestions: [
        "Great pitch! Very close to model.",
        "Slightly faster than model—try slowing down."
      ]
    };
  }
};
```

**3. Waveform Visualization** (`js/voice/waveform-canvas.js`)
```javascript
// Real-time waveform display + comparison
const WaveformDisplay = {
  drawLive(audioData) { /* canvas animation */ },
  compareWaveforms(studentWave, modelWave) {
    // Side-by-side visualization with overlay
    // Highlight areas of divergence
  }
};
```

**4. Feedback UI** (`games/ui/voice-feedback.js`)
```javascript
const VoiceFeedback = {
  show(analysisResult) {
    // Green checkmark for good pitch
    // Orange indicator for tempo difference
    // Ava character reacts: "Nice try! A little slower next time."
  }
};
```

### Integration Points
- **Typing Quest**: Add voice section with pitch/tempo feedback
- **Reading Lab**: Pronunciation coaching for new words
- **Ava character**: React to voice quality ("Great pronunciation!")

### Dependencies
- `crepe.js` or `TarsosDSP.js` for pitch detection
- Canvas API for waveform rendering
- Web Audio API (browser standard)

---

## Phase 4: 3D Game Environments (Weeks 3-4)

### What This Solves
Word Quest is currently 2D grid. Competitors are moving to:
- Immersive 3D spaces where words float in a room
- Tactile keyboard animations
- Avatar-based multiplayer word games
- Premium feel that matches "joyful, confidence-building" vision

### Technical Architecture

```
Babylon.js 3D Engine
    ├─ Scene: Word Quest board in 3D space
    ├─ Camera: Pan/zoom controls
    ├─ Lighting: Dynamic based on theme
    ├─ Keyboard model: 3D animated keys with physics
    ├─ Word tiles: 3D cubes that rotate on reveal
    └─ Particles: Celebration confetti on correct answer

Fallback: 2D canvas (if 3D unavailable)
```

### Key Components

**1. 3D Scene Setup** (`js/3d/word-quest-3d.js`)
```javascript
const WordQuest3D = (() => {
  let scene, engine, camera;

  function init(canvasElement) {
    engine = new BABYLON.Engine(canvasElement);
    scene = new BABYLON.Scene(engine);

    // Lighting
    const light = new BABYLON.HemisphericLight('light',
      new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Responsive camera
    camera = new BABYLON.ArcRotateCamera('camera',
      Math.PI / 2, Math.PI / 2.5, 20,
      new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvasElement, true);
  }

  return {init};
})();
```

**2. 3D Word Tiles** (`js/3d/word-tile-3d.js`)
```javascript
const WordTile3D = {
  create(word, position) {
    const box = BABYLON.MeshBuilder.CreateBox('wordTile',
      {width: 1.5, height: 1.5, depth: 0.3}, scene);
    box.position = new BABYLON.Vector3(...position);

    // Material with gradient
    const material = new BABYLON.StandardMaterial('wordMat', scene);
    material.emissiveColor = getStatusColor(word.status);

    box.material = material;

    // Reveal animation: rotate 180° and scale up
    box.reveal = () => {
      BABYLON.Animation.CreateAndStartAnimation('reveal',
        box, 'rotation.y', 30, 20, 0, Math.PI,
        BABYLON.Animation.ANIMATIONLOOPMODE_CLAMP);
    };

    return box;
  }
};
```

**3. 3D Keyboard** (`js/3d/keyboard-3d.js`)
```javascript
// Animated 3D keyboard with tactile feedback
const Keyboard3D = {
  create() {
    // Load keyboard model or build procedurally
    // Each key responds to selection with scale/bounce animation
    // Material responds to theme colors
  },

  pressKey(letter) {
    // Depress key, play click sound, bounce back
    key.getChildMeshes()[0].scaling.y = 0.8;
    setTimeout(() => { key.getChildMeshes()[0].scaling.y = 1; }, 100);
  }
};
```

**4. Celebration Particles** (`js/3d/celebration-particles.js`)
```javascript
const CelebrationEffect = {
  trigger(position) {
    const particleSystem = new BABYLON.GPUParticleSystem(
      'celebration', 128, scene);

    // Confetti bursts upward
    particleSystem.addParticleUpdater(new BABYLON.TurbulenceParticleUpdater());
    particleSystem.emitter = new BABYLON.Vector3(...position);
    particleSystem.emitter.emit(15); // burst 15 particles
  }
};
```

### Integration Points
- **Word Quest game shell**: Toggle `data-3d-enabled="true"` for 3D, fallback to 2D
- **Settings**: "3D Mode" toggle (for accessibility/performance)
- **Mobile**: Fallback to 2D on mobile (performance)

### Dependencies
- `babylon.js` (24KB minified)
- Graceful degradation to 2D

---

## Phase 5: Accessibility Variants (Week 4)

### What This Solves
Non-negotiable for intervention educators:
- Dyslexic students: OpenDyslexia font + increased letter spacing
- Low vision: High contrast mode + larger fonts
- Color blind: Alternative palette + symbols instead of color alone
- Motor impairment: Larger touch targets + simplified interactions

### Technical Architecture

```
Settings UI (teacher sets accessibility mode)
         ↓
Stores in localStorage + session state
         ↓
CSS variable overrides applied to [data-a11y="dyslexia"]
         ↓
All components automatically adapt
```

### Key Components

**1. Accessibility Settings** (`js/settings/a11y-settings.js`)
```javascript
const A11ySettings = {
  modes: {
    dyslexia: {
      fontFamily: 'OpenDyslexia',
      letterSpacing: '0.2em',
      lineHeight: 1.8,
      wordSpacing: '0.3em'
    },
    highContrast: {
      '--accent': '#FF0000',
      '--text-primary': '#000000',
      '--surface-1': '#FFFFFF'
    },
    colorBlind: {
      filterMode: 'deuteranopia', // or protanopia, tritanopia
      useSymbols: true // ✓ instead of green, ✗ instead of red
    },
    lowVision: {
      fontSize: '18px',
      '--fs-body': '18px',
      touchTargetMin: '44px'
    }
  },

  setMode(mode) {
    document.documentElement.dataset.a11y = mode;
    localStorage.setItem('a11y-mode', mode);
  }
};
```

**2. Dyslexia Font** (`style/a11y-dyslexia.css`)
```css
[data-a11y="dyslexia"] {
  --font-body: "OpenDyslexia", monospace;
  letter-spacing: var(--space-1);
  line-height: 2;
  word-spacing: 0.3em;
  background: #fffbf0; /* warm, less harsh */
}

[data-a11y="dyslexia"] .word-tile {
  padding: var(--space-3); /* more breathing room */
}
```

**3. High Contrast Mode** (`style/a11y-high-contrast.css`)
```css
[data-a11y="high-contrast"] {
  --accent: #FF0000;
  --text-primary: #000000;
  --surface-1: #FFFFFF;
  --border: #000000;
}

[data-a11y="high-contrast"] * {
  border-width: 2px !important; /* thicker outlines */
}
```

**4. Color Blind Mode** (`style/a11y-colorblind.css`)
```css
[data-a11y="colorblind-deuteranopia"] {
  --status-secure: #0173B2;
  --status-developing: #DE8F05;
  --status-intensify: #CC78BC;
  /* Accessible palette for deuteranopia */
}

[data-a11y="colorblind-deuteranopia"] .status-secure::after {
  content: ' ✓';
  font-weight: bold;
}
```

**5. Low Vision Mode** (`style/a11y-low-vision.css`)
```css
[data-a11y="low-vision"] {
  --fs-body: 18px;
  --fs-lg: 24px;
  --touch-min: 44px;
}

[data-a11y="low-vision"] button,
[data-a11y="low-vision"] [role="button"] {
  min-width: var(--touch-min);
  min-height: var(--touch-min);
}
```

### Integration Points
- **Settings page**: Accessibility section with mode selector
- **Teacher Hub**: Recommend a11y mode in student profile
- **Game shells**: Apply a11y settings to all games globally

### Testing Checklist
- [ ] Dyslexia mode: test reading speed improvement (timing)
- [ ] High contrast: validate 7:1 WCAG AAA on all text
- [ ] Color blind: test with CBSim plugin
- [ ] Low vision: test with pinch zoom + a11y mode
- [ ] Mobile: touch targets >= 44px in low vision mode

---

## Phase 6: Advanced Features (Ongoing)

### 6a. Student Progress 3D Gallery
Students see their achievements in a virtual trophy room:
- 3D avatars representing progress milestones
- Unlockable items (badges, certificates, character skins)
- Multiplayer gallery (see other students' achievements—motivational)

### 6b. Adaptive Learning Path AI
Use ML to recommend next lesson based on:
- Competency gaps (from Phase 2 dashboard)
- Learning velocity (how fast student is improving)
- Motivation patterns (when to push, when to celebrate)

### 6c. Parent Communication Dashboard
Parents see:
- Weekly progress snapshot (from Phase 1 dashboard)
- Achievements unlocked
- Recommended home practice activities

---

## Implementation Roadmap

| Phase | Duration | ROI | Complexity | Status |
|-------|----------|-----|-----------|--------|
| 1: Colors + Dashboards + Ava | Week 1 | ⭐⭐⭐⭐⭐ | Medium | ✅ COMPLETE |
| 2: Real-Time Collab | Week 1-2 | ⭐⭐⭐⭐ | High | 📋 Planned |
| 3: Voice Analysis | Week 2-3 | ⭐⭐⭐⭐ | High | 📋 Planned |
| 4: 3D Environments | Week 3-4 | ⭐⭐⭐⭐ | High | 📋 Planned |
| 5: Accessibility | Week 4 | ⭐⭐⭐⭐⭐ | Low | 📋 Planned |
| 6: Advanced | Ongoing | ⭐⭐⭐ | Medium+ | 📋 Future |

---

## Dependency Graph

```
Phase 1 (Colors + Dashboards + Ava)
  ├─→ Phase 2 (Real-Time Collab) [depends on session architecture]
  ├─→ Phase 3 (Voice) [independent]
  ├─→ Phase 4 (3D) [depends on existing game shell]
  ├─→ Phase 5 (A11y) [depends on color tokens from Phase 1]
  └─→ Phase 6 (Advanced) [depends on all above]
```

**Parallel Path:**
- Phases 2, 3, 4 can be implemented simultaneously
- Phase 5 should begin immediately (a11y is non-negotiable)
- Phase 6 comes after core platform is stable

---

## Getting Started: Next Agent/Developer Hand-Off

If you're continuing this work:

1. **Phase 2 Start**: Read `js/collab/session-sync.js` architecture (create it from this doc)
2. **Phase 3 Start**: Install `crepe.js` for pitch detection, test with `/activities/reading-lab.html`
3. **Phase 4 Start**: Add Babylon.js to `index.html`, create `/js/3d/word-quest-3d.js`
4. **Phase 5 Start**: Create `/style/a11y-*.css` files and integrate into `/js/settings/a11y-settings.js`

Each phase has clear data flows and isolated concerns. Good luck! 🚀
