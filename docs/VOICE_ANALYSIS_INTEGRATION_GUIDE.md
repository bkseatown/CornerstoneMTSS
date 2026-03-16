# Voice Analysis Integration Guide

## Phase 3: Speaking Practice with AI Feedback

### Quick Start (10 minutes)

Add to your HTML `<head>`:

```html
<!-- Voice Analysis Stylesheets -->
<link rel="stylesheet" href="/style/voice-feedback.css">

<!-- Voice Analysis JavaScript -->
<script src="/js/voice/voice-recorder.js"></script>
<script src="/js/voice/voice-analyzer.js"></script>
<script src="/js/voice/waveform-canvas.js"></script>
<script src="/games/ui/voice-feedback.js"></script>
```

Add to your game/activity HTML `<body>`:

```html
<!-- Waveform visualization -->
<div id="waveform-container" style="margin: 20px 0; height: 200px;"></div>

<!-- Voice feedback panel (appears at bottom-right when activated) -->
<div id="voice-feedback-container"></div>

<!-- Recording button in your UI -->
<button id="record-button" class="btn btn-primary">🎤 Record Your Voice</button>
<button id="stop-button" class="btn btn-primary" style="display: none;">⏹️ Stop Recording</button>

<script>
  // Initialize voice system
  const recordButton = document.getElementById('record-button');
  const stopButton = document.getElementById('stop-button');

  // Initialize components
  VoiceRecorder.init({sampleRate: 44100})
    .then(() => {
      console.log('✓ Microphone access granted');
      recordButton.disabled = false;
    });

  WaveformDisplay.init('waveform-container');
  VoiceFeedback.init('voice-feedback-container');

  // Recording workflow
  recordButton.addEventListener('click', startRecording);
  stopButton.addEventListener('click', stopRecording);

  function startRecording() {
    recordButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    WaveformDisplay.clear();

    VoiceRecorder.startRecording((audioData) => {
      WaveformDisplay.drawLive(audioData);
    });
  }

  async function stopRecording() {
    stopButton.style.display = 'none';
    recordButton.style.display = 'inline-block';

    // Get recorded audio
    const studentBlob = await VoiceRecorder.stopRecording();
    const studentBuffer = await VoiceRecorder.decodeAudio(studentBlob);

    // For demo, use student audio as model (real implementation would have separate model)
    const analysisResult = VoiceAnalyzer.analyze(studentBuffer, studentBuffer);

    // Show feedback
    VoiceFeedback.show(analysisResult, {avaReaction: true});

    // Optional: Compare waveforms
    WaveformDisplay.compareWaveforms(studentBuffer, studentBuffer);
  }

  // Handle user actions
  window.addEventListener('voice-feedback-retry', () => {
    recordButton.click();
  });

  window.addEventListener('voice-feedback-continue', () => {
    console.log('User ready to continue');
  });
</script>
```

---

## Components Explained

### 1. **VoiceRecorder** (`js/voice/voice-recorder.js`)

Handles microphone access and audio capture.

**Methods:**
```javascript
// Initialize (requests microphone permission)
VoiceRecorder.init(options, onPermissionGranted, onError)

// Start/stop recording with visualization callback
VoiceRecorder.startRecording((audioData) => {
  // audioData = {frequencies: Uint8Array, bufferLength, sampleRate}
  WaveformDisplay.drawLive(audioData);
});

const audioBlob = await VoiceRecorder.stopRecording();

// Audio playback
const source = await VoiceRecorder.playAudio(audioBlob);

// Audio conversion
const audioBuffer = await VoiceRecorder.decodeAudio(audioBlob);

// Direct analyser access for advanced analysis
const analyser = VoiceRecorder.getAnalyser();
```

**Configuration:**
```javascript
VoiceRecorder.init({
  sampleRate: 44100,      // Audio sample rate (Hz)
  fftSize: 2048,          // FFT window size for analysis
  bufferLength: 4096      // Internal buffer size
})
```

### 2. **VoiceAnalyzer** (`js/voice/voice-analyzer.js`)

Analyzes audio recordings for speaking quality.

**Main Method:**
```javascript
const result = VoiceAnalyzer.analyze(studentBuffer, modelBuffer);

// Returns:
{
  pitch: {
    studentHz: 220,       // Student's fundamental frequency
    modelHz: 215,         // Model's fundamental frequency
    match: 98             // Percentage match (0-100)
  },
  tempo: {
    studentBPM: 120,      // Estimated beats per minute
    modelBPM: 115,
    match: 96
  },
  clarity: 0.85,          // Voice clarity (0-1, RMS energy)
  phonemeAccuracy: 0.92,  // Phoneme similarity (0-1)
  suggestions: [
    "Great pitch! Very close to model.",
    "Slightly faster than model—try slowing down."
  ],
  score: 92               // Overall score (0-100)
}
```

**Individual Analyzers:**
```javascript
// Detect pitch (fundamental frequency in Hz)
const hz = VoiceAnalyzer.detectPitch(audioBuffer);

// Analyze voice clarity (0-1)
const clarity = VoiceAnalyzer.analyzeClarity(audioBuffer);

// Estimate tempo (BPM)
const bpm = VoiceAnalyzer.analyzeTempo(audioBuffer);

// Compare pronunciations (0-1)
const similarity = VoiceAnalyzer.analyzePhonemeSimilarity(student, model);
```

**Feedback Thresholds:**
- **Pitch Match:** 90%+ = "Excellent", 75%+ = "Good", 50%+ = "Needs work"
- **Tempo Match:** 85%+ = "Great", otherwise suggests adjustment
- **Clarity:** 70%+ = "Clear and confident", 40%+ = "Speak louder"
- **Pronunciation:** 85%+ = "Excellent", 70%+ = "Good"

### 3. **WaveformDisplay** (`js/voice/waveform-canvas.js`)

Visualizes audio in real-time and for comparison.

**Methods:**
```javascript
// Initialize canvas in container
WaveformDisplay.init('container-id', {
  backgroundColor: '#ffffff',
  waveColor: '#0173b2',
  comparisonColor: '#de8f05',
  height: 200
});

// Draw live waveform during recording
WaveformDisplay.drawLive({
  frequencies: Uint8Array,  // from VoiceRecorder
  bufferLength: number,
  sampleRate: number
});

// Set reference audio for comparison
WaveformDisplay.setComparison(modelAudioBuffer);

// Display side-by-side comparison
WaveformDisplay.compareWaveforms(studentBuffer, modelBuffer);

// Cleanup
WaveformDisplay.clear();
WaveformDisplay.stop();
```

**Features:**
- Live frequency visualization during recording
- Comparison mode shows student vs. model side-by-side
- Divergence highlighting in red (areas where waveforms differ significantly)
- Grid background for timing reference

### 4. **VoiceFeedback** (`games/ui/voice-feedback.js`)

Displays analysis results with interactive feedback panel.

**Methods:**
```javascript
// Initialize feedback panel
VoiceFeedback.init('container-id');

// Display results
VoiceFeedback.show(analysisResult, {avaReaction: true});

// Control visibility
VoiceFeedback.hide();
const visible = VoiceFeedback.visible();

// Get feedback summary (for logging)
const summary = VoiceFeedback.getSummary();
```

**Features:**
- Circular score indicator (red → orange → green)
- Metric cards: Pitch, Tempo, Clarity, Pronunciation
- Smart suggestions with color-coded difficulty
- "Try Again" and "Continue" buttons
- Optional Ava character reactions
- Responsive design (mobile-friendly)

### 5. **Styling** (`style/voice-feedback.css`)

- Fixed bottom-right panel with slide-in animation
- Color-coded metric cards (gray background, accent on hover)
- Accessibility support (high contrast, low vision modes)
- Dark mode support (prefers-color-scheme)
- 44px+ touch targets for all buttons
- Responsive layout (full-width on mobile < 480px)

---

## Integration Points

### Typing Quest (Voice Recording Activity)

```html
<div class="voice-activity">
  <h2>Practice Pronunciation</h2>
  <p>Listen to the model, then record yourself saying the word.</p>

  <div class="model-section">
    <button id="play-model" class="btn">🔊 Listen to Model</button>
    <audio id="model-audio"></audio>
  </div>

  <div id="waveform-container"></div>

  <button id="record-button" class="btn btn-primary">🎤 Record Your Voice</button>
  <button id="stop-button" class="btn btn-primary" style="display: none;">⏹️ Stop</button>

  <div id="voice-feedback-container"></div>
</div>

<script>
  let modelAudioBlob = null;
  let modelBuffer = null;

  // Load model audio
  const modelAudio = document.getElementById('model-audio');
  modelAudio.src = '/audio/model-pronunciations/teeth.wav';
  modelAudio.onload = async () => {
    const response = await fetch(modelAudio.src);
    modelAudioBlob = await response.blob();
    modelBuffer = await VoiceRecorder.decodeAudio(modelAudioBlob);
  };

  // Initialize
  VoiceRecorder.init().then(() => {
    WaveformDisplay.init('waveform-container');
    VoiceFeedback.init('voice-feedback-container');
    document.getElementById('record-button').disabled = false;
  });

  document.getElementById('play-model').addEventListener('click', () => {
    modelAudio.play();
  });

  document.getElementById('record-button').addEventListener('click', async () => {
    document.getElementById('record-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline-block';
    VoiceRecorder.startRecording((data) => {
      WaveformDisplay.drawLive(data);
    });
  });

  document.getElementById('stop-button').addEventListener('click', async () => {
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('record-button').style.display = 'inline-block';

    const studentBlob = await VoiceRecorder.stopRecording();
    const studentBuffer = await VoiceRecorder.decodeAudio(studentBlob);

    // Compare to model
    const result = VoiceAnalyzer.analyze(studentBuffer, modelBuffer);
    VoiceFeedback.show(result, {avaReaction: true});

    // Show waveform comparison
    WaveformDisplay.compareWaveforms(studentBuffer, modelBuffer);
  });

  // Retry handler
  window.addEventListener('voice-feedback-retry', () => {
    document.getElementById('record-button').click();
  });
</script>
```

### Reading Lab (Pronunciation Coaching)

Add voice practice to new word instruction:

```javascript
const ReadingLabVoice = {
  async practiceWord(word, modelAudioUrl) {
    // Load model pronunciation
    const response = await fetch(modelAudioUrl);
    const modelBlob = await response.blob();
    const modelBuffer = await VoiceRecorder.decodeAudio(modelBlob);

    // Record student
    VoiceRecorder.startRecording(/* ... */);

    // Analyze when done
    const result = VoiceAnalyzer.analyze(studentBuffer, modelBuffer);
    VoiceFeedback.show(result);
  }
};
```

### Game Shell Integration

```javascript
// In game-shell.js
if (document.querySelector('[data-voice-enabled="true"]')) {
  VoiceRecorder.init();
  WaveformDisplay.init('waveform-container');
  VoiceFeedback.init('voice-feedback-container');
}
```

---

## Testing Checklist

### VoiceRecorder
- [ ] Microphone permission dialog appears on first init
- [ ] Permission denied gracefully (error callback called)
- [ ] Recording starts/stops cleanly
- [ ] Audio blob returned with correct size (> 1KB)
- [ ] Audio playback works (decodeAudio succeeds)
- [ ] Visualization callback fires during recording
- [ ] Frequency data updates in real-time

### VoiceAnalyzer
- [ ] detectPitch returns 50-300 Hz for typical speech
- [ ] analyzeTempo returns 60-180 BPM for typical speech
- [ ] analyzeClarity returns 0.1-0.8 for different volumes
- [ ] analyzePhonemeSimilarity returns 0-1 (not NaN)
- [ ] Suggestions generated for all score ranges (0%, 50%, 85%, 100%)
- [ ] analyzePhonemeSimilarity matches similar audio (0.8+)
- [ ] Different audio shows lower similarity (0.3-0.6)

### WaveformDisplay
- [ ] Canvas initializes in correct container
- [ ] drawLive shows frequency waveform during recording
- [ ] compareWaveforms shows side-by-side display
- [ ] Grid background visible
- [ ] Comparison audio shown with dashed line
- [ ] Divergence highlighted in red where significant
- [ ] Mobile layout (single column on < 480px)

### VoiceFeedback
- [ ] Panel appears at bottom-right when show() called
- [ ] Metric cards display correct values
- [ ] Score circle fills based on score (red → orange → green)
- [ ] Suggestions render with correct emoji prefixes
- [ ] Color-coding works (excellent/good/needs-work/warning)
- [ ] Buttons clickable (min 44px height)
- [ ] Ava reacts based on score
- [ ] Close button hides panel
- [ ] Retry/Continue buttons dispatch events

### Accessibility
- [ ] High contrast mode: 3px borders, black/white only
- [ ] Low vision mode: Larger fonts, wider panel
- [ ] Dyslexia mode: OpenDyslexia font, increased spacing
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Screen reader: aria-labels on buttons, semantic HTML
- [ ] Focus indicators: Clear outline on focus

### Performance
- [ ] No audio lag during recording (< 50ms latency)
- [ ] Analysis completes in < 2 seconds
- [ ] Waveform animation smooth (60 FPS)
- [ ] No memory leaks (close VoiceRecorder properly)
- [ ] Mobile: Works on iOS/Android with microphone

---

## Troubleshooting

### Microphone Access Issues

**"Permission denied" error**
- Check browser privacy settings
- HTTPS required in production (localhost okay for dev)
- User can revoke permission in browser settings → reset → retry

**No audio captured**
- Verify microphone is working (test in browser devtools)
- Check browser volume settings
- Try different browser (Chrome/Firefox/Safari)

### Pitch/Tempo Detection Issues

**Pitch detection returns 0 Hz**
- Audio might be silent (check clarity > 0.2)
- Audio file might be noise-only
- Increase sample size (longer recording = better detection)

**Tempo too high/low**
- Tempo based on energy peaks (affected by clarity)
- Short/noisy recordings = unreliable tempo
- Result is estimate only (±10 BPM margin)

### Waveform Display Issues

**Waveform not showing**
- Verify container element exists with correct ID
- Check canvas width (set via container width)
- Verify init() called after DOM ready
- Check browser console for errors

**Comparison waveform not showing**
- Call `setComparison(audioBuffer)` before `compareWaveforms()`
- Verify modelBuffer is valid AudioBuffer

### Feedback Panel Issues

**Panel not appearing**
- Verify init() called with correct container ID
- Check z-index not obscured by other elements
- Verify show() called with analysisResult object
- Check CSS file loaded (voice-feedback.css)

**Buttons not working**
- Ensure event listeners attached (click handlers in HTML)
- Verify .voice-btn-continue/.voice-btn-retry selectors exist
- Check button is not disabled by parent page

---

## Performance Optimization

### For Low-Bandwidth Users

```javascript
// Reduce visualization updates
const slowMode = navigator.connection?.effectiveType === '2g' || '3g';

VoiceRecorder.startRecording((data) => {
  if (slowMode && Math.random() > 0.5) return;  // Skip 50% of frames
  WaveformDisplay.drawLive(data);
});
```

### For Mobile

```javascript
// Use smaller FFT size on mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

VoiceRecorder.init({
  fftSize: isMobile ? 1024 : 2048,  // Smaller = faster
  sampleRate: 22050  // Lower = uses less memory
});
```

### Analysis Caching

```javascript
// Cache analysis results to avoid re-computation
const analysisCache = new Map();

function analyzeWithCache(student, model) {
  const key = `${student.length}-${model.length}`;
  if (analysisCache.has(key)) return analysisCache.get(key);

  const result = VoiceAnalyzer.analyze(student, model);
  analysisCache.set(key, result);
  return result;
}
```

---

## Future Enhancements

1. **Real-time pitch visualization** - Show pitch line on waveform
2. **Phoneme-level feedback** - Highlight specific mispronounced sounds
3. **Replay with playhead** - Scrub through recording
4. **Confidence scoring** - How sure is the system about its feedback
5. **Multi-language support** - Detect and feedback on different languages
6. **Team comparison** - Compare student vs. classmate recordings
7. **Progress tracking** - Show improvement over multiple attempts
8. **Export recordings** - Save/download for parent sharing
9. **AI model training** - Improve pitch/tempo detection with more data
10. **Speaker identification** - Detect if correct student is recording

---

## Resources

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Crepe.js](https://github.com/spotify/crepe) (optional: more accurate pitch detection)
- [TarsosDSP](https://github.com/JorenSix/TarsosDSP) (Java pitch detection)
- [WCAG Audio Testing](https://www.w3.org/WAI/test-evaluate/preliminary/)
- [Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
