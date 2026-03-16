# Speaking Studio: Audio Recording & Oral Language Development Tool
**Status**: Concept & Design Document  
**Target Launch**: Phase 2 (April 2026)  
**Audience**: K-5 students (Tier 1/2/3 contexts), EAL focus

---

## VISION

A **privacy-first audio recording tool** that helps students build self-awareness of their own speech, fluency, articulation, and pronunciation through immediate playback and visual waveform feedback. Ideal for EAL students, speech support, and fluency building.

**Tagline**: *"Hear yourself. See your voice. Improve with confidence."*

---

## WHY SPEAKING STUDIO MATTERS

### Problem It Solves
- **No self-awareness** — Students don't "hear" their own speech patterns
- **Pronunciation practice** — EAL students need models and feedback
- **Articulation awareness** — Unclear speech goes uncorrected without feedback
- **Fluency monitoring** — Teachers can't assess oral fluency digitally
- **Privacy concerns** — Cloud-based recording makes teachers reluctant to use
- **Isolated practice** — Limited ways for students to practice speaking

### What Makes It Different
✅ **Local-only recording** — No cloud upload, no privacy concerns  
✅ **Visual feedback** — Waveforms show speech patterns visually  
✅ **Immediate playback** — Students hear themselves instantly  
✅ **Model comparison** — Optional comparison to professional audio  
✅ **EAL-optimized** — Supports pronunciation and articulation  
✅ **Self-monitoring** — Builds meta-awareness of own voice  
✅ **Low-stakes** — Safe space to practice without judgment  

---

## CORE EXPERIENCE: RECORDING & VISUALIZATION

### Design Philosophy
1. **Make Speech Visible** — Waveforms show what good speech sounds like
2. **Immediate Feedback** — Instant playback without delay
3. **Comparison Support** — Option to hear professional model
4. **Low Pressure** — Private, individual practice space
5. **Actionable Insights** — Visual patterns prompt self-reflection

---

## FEATURE SET

### Primary Features

#### 🎤 **Record Your Voice**
- One-click record button
- Automatic stop after prompt completion
- Visual recording indicator (red dot pulsing)
- Counter showing recording length

#### 🌊 **Waveform Visualization**
- Real-time waveform display during recording
- Color-coded waveform:
  - Blue: Normal volume
  - Yellow: Loud
  - Red: Too loud
- Shows frequency patterns
- Visual representation of speech clarity

#### 👂 **Playback with Controls**
- Play/pause button
- Playback speed control (0.75x, 1x, 1.25x, 1.5x)
- Skip forward/backward (5-second increments)
- Volume control
- Listen count tracker

#### 🎯 **Model Comparison (Optional)**
- Option to hear professional model first
- Side-by-side waveform comparison
- Highlight differences visually
- Prompt for reflection ("Did you match the model?")

#### 📊 **Self-Assessment Questions**
- "How clear was your speech?"
- "Did you speak at the right speed?"
- "Did you pronounce the challenging words?"
- "Did you read with expression?"
- Student rates on scale (1-5 stars or smilies)

#### 💾 **Save & Review**
- Save recording with date/time
- Listen to previous attempts
- See progress over time
- Optional: Share recording with teacher

---

## ACTIVITY TYPES

### **Type 1: Fluency Practice**
- Record reading a passage aloud
- See waveform patterns
- Compare to teacher/professional model
- Track WCPM (words per minute) informally
- Self-assess clarity and expression

**Use case**: Tier 1 fluency practice, Tier 2/3 fluency intervention

### **Type 2: Articulation/Pronunciation**
- Record specific words or sentences
- Focus on challenging sounds
- Compare to model pronunciation
- Repeat for improvement
- Track progress session-to-session

**Use case**: EAL pronunciation, speech support, phoneme practice

### **Type 3: Prepared Speech/Presentation**
- Record student giving a short speech or presentation
- Assess clarity, pacing, confidence
- Review with teacher or peer
- Optional audience presence

**Use case**: Speaking skills development, presentation practice

### **Type 4: Language Response**
- Record response to prompt ("Tell me about your favorite book")
- Monitor oral language quality
- Assess vocabulary use, syntax, fluency
- Informal assessment tool

**Use case**: EAL language development, oral language assessment

---

## INTERFACE DESIGN

### Main Screen
```
┌─────────────────────────────────────────────────────────┐
│  🎤 Speaking Studio: Fluency Practice                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📝 PROMPT:                                              │
│  "Read this passage about butterflies aloud"            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ When caterpillars are ready to transform, they   │  │
│  │ stop eating and find a safe place. They build    │  │
│  │ a chrysalis around themselves. Inside, they      │  │
│  │ slowly change into a butterfly. Days or weeks    │  │
│  │ later, they break out as beautiful butterflies.  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ OPTIONAL: 👂 Listen to Model Pronunciation ┐       │
│  │ [▶ Play Model]                               │       │
│  └──────────────────────────────────────────────┘       │
│                                                          │
│  ┌─ RECORDING ──────────────────────────────────┐       │
│  │                                               │       │
│  │         🎤 [RECORD]    [STOP]                │       │
│  │                                               │       │
│  │  🔴 Recording...  0:35                        │       │
│  │                                               │       │
│  │  Real-time Waveform:                          │       │
│  │  ~~~~~~~⠀~~∿∿∿⠀~~~~~~⠀~~~~⠀∿∿∿∿⠀~~~~~  │       │
│  │  [████████░░░░░░░░░░░░░░░░░░] 45%             │       │
│  │                                               │       │
│  │  Volume: 🟦🟦🟦 (Normal)                      │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Playback Screen
```
┌─────────────────────────────────────────────────────────┐
│  🎤 Speaking Studio: Your Recording                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Saved: March 16, 2026 • 2:15 PM                        │
│  Duration: 1:47                                         │
│                                                          │
│  ┌─ YOUR RECORDING ──────────────────────────────┐      │
│  │                                                │      │
│  │  [▶ ⏸]  [║║ Speakers]  🔊███░░  [×]           │      │
│  │                                                │      │
│  │  Waveform:                                     │      │
│  │  ∿∿∿∿∿⠀∿∿∿∿⠀∿∿∿⠀∿∿∿∿∿⠀∿∿⠀∿∿∿∿∿  │      │
│  │  [████████████████░░░░░░░░░░░░] 0:47 / 1:47    │      │
│  │                                                │      │
│  │  Speed: [0.75x] [1x] [1.25x] [1.5x]           │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  ┌─ REFLECT ON YOUR SPEECH ──────────────────────┐      │
│  │                                                │      │
│  │  1. How clear was your speech?                │      │
│  │     ⭐☆ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐                       │      │
│  │                                                │      │
│  │  2. Did you speak at the right pace?         │      │
│  │     ☺☺☺☺☺ (5 = perfect)                      │      │
│  │                                                │      │
│  │  3. Did you read with expression?            │      │
│  │     😐😕😐😊😄                                  │      │
│  │                                                │      │
│  │  [Save Reflection]  [Listen Again]            │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  ┌─ COMPARE TO MODEL (Optional) ─────────────────┐      │
│  │  [👂 Listen to Model] [🔄 Side-by-Side]       │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## TECHNICAL ARCHITECTURE

### Frontend Components
- **Recording interface** (Web Audio API)
- **Waveform visualization** (Canvas or SVG rendering)
- **Playback controls** (HTML5 audio)
- **Visual feedback** (animated waveforms)
- **Assessment forms** (interactive radio buttons, sliders)

### Recording Method
- **Local-only**: Records to browser's local storage
- **No upload**: All data stays on device
- **Privacy-first**: No cloud dependency
- **Optional sync**: Teachers can enable device-to-teacher viewing (future)

### Browser Compatibility
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Mobile support**: iOS/Android where supported
- **Fallback**: Graceful degradation for older browsers

### Data Storage
- **IndexedDB**: Store recordings locally
- **Session-based**: Can be deleted when leaving page
- **Optional persistent**: Save with "Save Recording" action

---

## MODES OF USE

### **Tier 1: Classroom Fluency Practice**
- Whole class records during independent reading time
- Self-listening builds awareness
- No teacher involvement needed
- Optional: Share with teacher for formative assessment

### **Tier 2: Small Group Speech Support**
- Teacher facilitates recording activity
- Plays back and discusses with group
- Uses waveform to discuss clarity, pace, expression
- Repeated practice with feedback

### **Tier 3: Individual Articulation Intervention**
- 1:1 recording of targeted sounds/words
- Speech specialist reviews with student
- Compares to model pronunciation
- Tracks progress over sessions

### **EAL Focus**
- Record pronunciation of challenging words/sounds
- Compare to native speaker model
- Visual waveform shows differences
- Builds self-awareness of accent/pronunciation

---

## GAME MECHANICS & ENGAGEMENT

### ✨ **Satisfying Feedback**
- Visual waveforms show "real" speech patterns
- Color feedback (blue/yellow/red) during recording
- Volume indicator provides immediate information
- Playback feels natural and encouraging

### 📊 **Visual Progress**
- Number of attempts tracked
- Date/time of each recording shown
- Can see "improvement" by comparing recordings
- Progress over time motivates

### 🎯 **Self-Assessment**
- Simple reflection questions (not judgment)
- Star/emoji ratings feel less pressured
- Builds metacognition (thinking about thinking)
- Records student reflection alongside audio

### 🔄 **Comparison Options**
- Optional model listening (optional, not mandatory)
- Visual side-by-side waveform comparison
- Highlights differences without judgment
- Students compare themselves, build awareness

---

## INTEGRATION WITH CURRICULUM

### **Aligned to Oral Language Standards**
- Fishtank ELA speaking standards
- UFLI/Fundations pronunciation focus
- MTSS Tier 2/3 speech support

### **EAL Connection**
- Perfect for ELL teachers
- Pronunciation practice
- Self-awareness of accent/articulation
- Low-pressure practice environment

### **Assessment Use**
- Informal fluency check (WCPM proxy)
- Articulation/pronunciation observation
- Oral language quality assessment
- Progress monitoring tool

---

## PHASE 1 MVP (Minimum Viable Product)

**Launch with**:
- ✅ Record button with real-time waveform
- ✅ Playback with controls (play, pause, speed)
- ✅ Visual waveform rendering
- ✅ Volume feedback during recording
- ✅ Self-assessment reflection questions
- ✅ Save individual recordings
- ✅ Listen to previous recordings
- ✅ Clean, professional UI
- ✅ Mobile-responsive design

**Not in Phase 1** (Future):
- Model audio comparison
- Teacher dashboard view
- Session-to-session progress tracking
- Automatic WCPM calculation
- Audio editing capabilities

---

## SUCCESS METRICS

### **For Students**
- Can record and listen to themselves
- Uses visual feedback to reflect on speech
- Confident practicing without judgment
- Shows improved clarity/pace/expression over time

### **For Teachers**
- Easy to facilitate in classroom
- Provides insight into student fluency/articulation
- Useful for EAL support
- Works as formative assessment tool

### **For Platform** (Your Portfolio)
- Demonstrates audio handling expertise
- Shows EAL/speech support knowledge
- Differentiates from other game-only platforms
- Innovative feature administrators recognize
- Privacy-first approach appeals to schools

---

## DESIGN MOCKUP: Waveform Visualization

Different waveforms tell different stories:

```
Clear, expressive speech:
∿∿∿∿∿⠀∿∿∿∿∿⠀∿∿∿∿∿⠀∿∿∿∿∿  (good volume variation)

Monotone, flat speech:
━━━━━⠀━━━━━⠀━━━━━⠀━━━━━  (little volume change)

Rushed, fast speech:
∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  (compressed, tight pattern)

Slow, measured speech:
∿⠀⠀∿⠀⠀∿⠀⠀∿⠀⠀∿  (spread out, with space)

Unclear/mumbled speech:
~~~~~~~~~~~~  (barely visible, low volume)
```

---

## POSITIONING FOR YOUR PORTFOLIO

Speaking Studio is a **game-changer for differentiation**:

1. **Unique Feature**: Most ed-tech platforms don't have this
2. **EAL/Speech Focus**: Directly addresses underserved population
3. **Privacy-First**: Appeals to schools worried about cloud
4. **Research-Backed**: Self-monitoring builds metacognition
5. **Professional Tool**: Not "just a game" - genuine intervention tool
6. **Audio Expertise**: Demonstrates technical sophistication

This tool + Writers Studio + Word Quest = **comprehensive literacy intervention platform**

---

## NEXT STEPS

1. ✅ Finalize concept (this document)
2. → Build audio recording MVP (Web Audio API)
3. → Implement waveform visualization (Canvas)
4. → Add self-assessment reflection
5. → Testing with real EAL/speech contexts
6. → Iterate based on feedback

---

**Status**: ✅ CONCEPT APPROVED — READY FOR DEVELOPMENT
