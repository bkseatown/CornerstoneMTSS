# Cornerstone MTSS — Design & Experience Improvements Roadmap

**Vision**: Transform Cornerstone from functional intervention tool to delightful daily-use platform that reduces teacher burden while making learning activities genuinely engaging for students.

---

## Phase 1: High-Impact Quick Wins (This Week)

### A. Learning Hub (learning-hub.html) — Navigation & Trust
**Current State**: Grid-based activity cards with basic text information
**Figma Audit Focus**: Layout Fit, Visual Hierarchy, Interaction Clarity

**Improvements**:
1. **Visual Tier Badges** — Add visual indicators (colored bands) to differentiate Tier 1-3 alongside text
   - Tier 1: Blue (whole-class)
   - Tier 2: Orange (small group)
   - Tier 3: Red (intensive)
   - Builds rapid teacher visual parsing

2. **Activity Status at a Glance** — Enhance "Coming Soon" and "NEW" badges with more info density
   - Add expected availability date for "Coming Soon" items
   - Add brief feature highlight for "NEW" items
   - Reduces teacher clicks to understand readiness

3. **Curriculum Alignment Quick View** — Add micro-icons for each aligned curriculum (Fishtank 📘, Fundations 🔤, UFLI, IM)
   - Positioned right on activity card header
   - Builds confidence that tools match existing workflow

4. **Accessibility Notes** — Add subtle EAL/accessibility tags below activity-purpose
   - "🌍 Multilingual support" (visual affordance already exists but could be more prominent)
   - "🔊 Audio feedback available"
   - Helps specialists quickly identify intervention match

---

### B. Session Runner (session-runner.html) — Teacher Workflow Clarity
**Current State**: Block-by-block progression with coach feedback
**Figma Audit Focus**: Interaction Clarity, Production Discipline, Visual Hierarchy

**Improvements**:
1. **Session At-a-Glance Status Bar** — Add visual progress tracker above "Now" section
   - Show: [Block 1] → [Block 2] → [Current Block] → [Block 4] → [Block 5]
   - Color: gray | gray | blue (current) | gray | gray
   - Provides spatial context (not just "block 3 of 5 text")
   - Reduces teacher cognitive load during session

2. **Metrics Visibility** — Instead of empty `sr-metrics` div, pre-populate with standard tracking
   - Response time, accuracy, engagement level
   - Visible during session (not just summary)
   - Enables real-time progress observation

3. **Completion Intent Buttons** — Enhance ✅ Complete and ⏭️ Skip with hover previews
   - Hover "✅ Complete" → shows next block preview
   - Hover "⏭️ Skip" → shows reason picker (too easy | student struggling | time constraint)
   - Skip reason saved to session notes for future planning

4. **Notes Export UX** — Highlight the most-copied-to-clipboard note type
   - If teacher copies notes 3x in a row, suggest "Want to email this directly?"
   - One-click email composition (opens mailto with teacher note pre-filled)
   - Reduces copy-paste friction

---

### C. Reading Lab (reading-lab.html) — Student Engagement & Flow
**Current State**: Passage reading with manual marking, comprehension questions
**Figma Audit Focus**: Interaction Clarity, Brand/Art Direction, Spacing Rhythm

**Improvements**:
1. **Passage Reading Visualization** — Enhance visual feedback during read-aloud mode
   - Current: Text only
   - Proposed: Highlight each word as student reads (sync'd with audio/timer)
   - Gives clear visual affordance of "where we are" in passage
   - Supports EAL students who need visual word boundary help

2. **Accuracy Real-Time Indicator** — Move rl-live-chip from hidden to always visible (when in read mode)
   - Show: "Accuracy: 92% | 🟢 Great job!"
   - Color changes: 🟢 (90+), 🟡 (80-89), 🔴 (below 80)
   - Immediate, kid-friendly feedback loop (not just end-of-session)

3. **Comprehension Question Polish** — Add visual separation and clarity
   - Show question prompt in larger, darker text
   - Show answer options as cards (not list items)
   - Add "Think it over... 💭" placeholder before student answers
   - Makes answer intention explicit

4. **Word Work Side Panel Reflow** — Reduce cognitive split on small screens
   - On mobile/tablet: Move "Word Work" to modal (not always-visible panel)
   - On desktop: Keep side panel but add "collapse" toggle
   - Gives teacher choice of focus area size without scroll

5. **Keyboard Motion** — Already noted as needed
   - Add subtle opacity/scale animation to marked tokens (C/I/S/R buttons) on press
   - 200ms ease-out transition
   - Feels responsive without being distracting

---

### D. Typing Quest (typing-quest.html) — Game Flow & Polish
**Current State**: Word-typing game with theme switching
**Figma Audit Focus**: Brand/Art Direction, Spacing Rhythm, Interaction Clarity

**Improvements**:
1. **Typing Feedback Animation** — Enhance the feeling of typed input
   - Current: Input accepted, letter added to display
   - Proposed: Add 100ms scale-up animation on correct letter
   - Add shake/error animation on incorrect (if letter limit enforced)
   - Transforms typing from "input processed" to "action feels responsive"

2. **Score/Progress Clarity** — Make game progression obvious
   - Show: "Word 3 of 10" (not just points)
   - Visual progress bar (not just text)
   - Upcoming word preview in next position (so student knows what's coming)
   - Reduces "am I winning?" confusion

3. **Theme Accessibility** — Ensure contrast in all theme modes
   - Audit current theme colors for WCAG AA compliance
   - Add high-contrast "focused mode" theme for students with contrast sensitivity
   - Save theme preference to device storage (not just session)

4. **Pause/Resume Clarity** — Enhance game state transitions
   - When paused: Show "Game Paused | Tap to Resume" overlay (not just hidden UI)
   - Disable keyboard input when paused (prevent sneaky letter entry)
   - Makes pause state obvious for teacher observation

---

## Phase 2: Figma Audit Framework (Week 2)

Systematic audit of all surfaces against 9 categories:

| Category | Current Gap | Proposed Fix | Impact |
|----------|------------|--------------|--------|
| **Layout Fit** | Some surfaces have orphaned whitespace | Consolidate unused sections, reflow on tablet | Cleaner screens |
| **Visual Hierarchy** | Information density inconsistent | Apply token sizes consistently (h1, h2, h3, body) | Faster scanning |
| **Component Consistency** | Button styles vary slightly per file | Audit & unify .rl-btn, .sr-btn, .cg-btn via tokens | Predictable UI |
| **Spacing Rhythm** | Mix of hardcoded px and token values | Sweep all CSS to use token-based spacing grid | Professional polish |
| **Contrast & Separation** | Some text on busy backgrounds | Increase background opacity, add subtle borders | Better readability |
| **Typography Quality** | Serif/sans-serif mixing | Standardize to system font stack | Coherent feel |
| **Brand/Art Direction** | Emoji icons added but no cohesive visual language | Establish emoji usage pattern (action, noun, status) | Kid-friendly brand |
| **Interaction Clarity** | Some affordances subtle | Enhance hover states, add feedback animations | Obvious clickability |
| **Production Discipline** | Build badge exists but version drift | Implement cache-busting v-param on all CSS/JS | No stale asset surprises |

---

## Phase 3: Teacher Burden Reduction (Week 3)

### Priority: Making daily specialist workflow faster

1. **Reports Dashboard Enhancements**
   - Add "Quick Export" button on each student card (JSON/CSV in one click)
   - Show last 3 intervention sessions at a glance (not nested under expand)
   - Add "Schedule Next Session" CTA with student selector pre-filled

2. **Case Management Shortcuts**
   - Add keyboard nav (Arrow keys to switch students, Enter to open profile)
   - Add "Duplicate Student Setup" (for cohort groups)
   - Show upcoming intervention calendar view (not just caseload list)

3. **Teacher Hub Context Awareness**
   - Show "You have 5 ready-to-use intervention plans" (not just empty state)
   - Add "One-click session start" for each planned intervention
   - Show recent student progress without requiring click-through

---

## Phase 4: Trust-Building & Transparency (Ongoing)

1. **Data Privacy Reassurance** — More visible than footer note
   - Add "🔒 Data stays on this device" badge to hub header
   - On data export screens, show exactly what's included
   - Add "What data is stored?" help modal (referenced from multiple surfaces)

2. **Effectiveness Indicators** — Show impact to build adoption
   - On student profile: "📈 This student improved 12% in accuracy over 3 weeks"
   - On reports: Comparison to benchmark (not just raw scores)
   - On case management: "Ready-to-intervene flag" when student hits target

3. **Transparent Limitations** — Build trust through honesty
   - On "Coming Soon" cards: Show roadmap dates
   - On experimental features: Label as "Beta" with feedback link
   - On diagnostic tools: Show confidence score (not just raw data)

---

## Implementation Checklist

- [ ] Phase 1A: Learning Hub visual enhancements
- [ ] Phase 1B: Session Runner workflow improvements
- [ ] Phase 1C: Reading Lab student engagement
- [ ] Phase 1D: Typing Quest game polish
- [ ] Phase 2: Full Figma audit sweep across 12+ surfaces
- [ ] Phase 3: Teacher workflow shortcuts
- [ ] Phase 4: Trust-building features

---

## Success Metrics

- Learning Hub cards parsed 30% faster (teacher time study)
- Session Runner session setup time reduced 40% (fewer clarifying clicks)
- Reading Lab comprehension accuracy +8% (engagement improvement)
- Typing Quest completion rate +15% (fun factor working)
- Teacher adoption: "This feels like it was designed for my actual job" (qualitative)

