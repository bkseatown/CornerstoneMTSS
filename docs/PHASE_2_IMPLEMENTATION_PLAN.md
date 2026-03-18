# PHASE 2: SHOULD-DO + NICE-TO-HAVE IMPLEMENTATION PLAN

**Focus**: Medium-impact improvements (A) + Engagement enhancements (C)
**Timeline**: 4-6 weeks recommended
**Status**: PLANNING

---

## TRACK A: SHOULD-DO ITEMS (Medium Effort, Good Impact)

### A1: Alternative Intervention Recommendations
**Current State**: Platform shows single top recommendation
**Objective**: Show 2-3 alternative recommendations with rationale

**Implementation**:
- [ ] Modify intervention engine to rank alternatives (not just top)
- [ ] Update UI to display alternatives in Focus Card
- [ ] Add comparison tooltips explaining why/when to use each
- [ ] Store teacher selection of alternative (for feedback loop)

**Effort**: 8-10 hours
**Impact**: HIGH - Gives teachers choice and confidence

**Code Areas**:
- `js/teacher/intervention-recommender.js` (ranking logic)
- `teacher-hub-v2.html` (Focus Card rendering)
- `teacher-hub-v2.js` (alternative display)

---

### A2: Classroom-Level Performance Comparisons
**Current State**: Individual student focus only
**Objective**: Show class-level aggregated metrics

**Implementation**:
- [ ] Create classroom aggregation module
- [ ] Add "Class Summary" view in Reports
- [ ] Show comparative metrics: mastery distribution, gaps, patterns
- [ ] Non-identifiable aggregate data (no individual names in charts)

**Effort**: 10-12 hours
**Impact**: HIGH - Teachers see patterns across caseload

**Code Areas**:
- `reports.html` (new Class Summary section)
- `js/teacher/reports-engine.js` (aggregation logic)
- Create new module: `js/teacher/classroom-aggregator.js`

---

### A3: Teacher Orientation Video (5 min)
**Current State**: 6-step onboarding tour (text-based)
**Objective**: Short video walkthrough of key workflows

**Implementation**:
- [ ] Script key workflows (evidence capture, planning, monitoring)
- [ ] Record screen capture (platform walkthrough)
- [ ] Add captions for accessibility
- [ ] Embed in onboarding flow + help section
- [ ] Host on platform (or external CDN)

**Effort**: 6-8 hours (scripting + recording + editing)
**Impact**: MEDIUM-HIGH - Reaches visual learners, reduces support needs

**Deliverable**:
- `/assets/videos/cornerstone-orientation.mp4` (or YouTube embed)
- Integration point: onboarding-tour.js (new step)

---

### A4: First-Time Hints on Advanced Screens
**Current State**: Tour covers main flows, some advanced features hidden
**Objective**: Show contextual hints when entering complex screens

**Implementation**:
- [ ] Create "first-visit" detection per page
- [ ] Design hint overlays for: Case Management, Reports, AI Planning
- [ ] Non-intrusive banners that dismiss once read
- [ ] Store "seen" state in localStorage

**Effort**: 5-6 hours
**Impact**: MEDIUM - Improves advanced feature discoverability

**Code Areas**:
- `js/teacher/first-visit-hints.js` (new module)
- Add hints to: case-management.html, reports.html, teacher-hub-v2.js

---

### A5: Document Hidden Features
**Current State**: 3D keyboard, collaboration features exist but not visible in UI
**Objective**: Create discoverable documentation + enable access

**Implementation**:
- [ ] Create feature documentation: `/docs/HIDDEN_FEATURES.md`
- [ ] Add menu option to access these features (optional "Advanced" menu)
- [ ] Create short demo/guide for each feature
- [ ] Surface in help system

**Effort**: 4-5 hours
**Impact**: MEDIUM - Unlocks value for power users

**Deliverables**:
- Documentation file
- Menu/navigation updates

---

## TRACK C: NICE-TO-HAVE ENHANCEMENTS (Medium-High Effort)

### C1: Achievement Badge System
**Current State**: Mastery badges in games only
**Objective**: Unlock achievement milestones across platform usage

**Examples**:
- "First Evidence Logger" - Log 10 observations
- "Master Planner" - Create 5 intervention plans
- "Data Detective" - Analyze 3 class reports
- "Fluency Champion" - Student reaches 80%+ on typing
- "Intervention Expert" - 10+ students show improvement

**Implementation**:
- [ ] Create achievement definition system
- [ ] Track milestone events across platform
- [ ] Build achievement UI (badges, progress, notifications)
- [ ] Add celebratory animations on unlock
- [ ] Store achievements in user profile

**Effort**: 12-14 hours
**Impact**: HIGH - Increases engagement, motivates usage

**Code Areas**:
- Create new module: `js/teacher/achievement-system.js`
- `js/teacher/event-tracker.js` (milestone detection)
- `teacher-hub-v2.html` (badge display)
- CSS: `style/achievements.css`

---

### C2: Leaderboard System (Opt-In)
**Current State**: No competitive or comparative elements
**Objective**: Optional class-level leaderboard (participation metrics only)

**Features**:
- Show which students are most active (evidence capture, game sessions)
- Anonymized or optional (teacher controls visibility)
- Weekly/monthly reset
- Tie to rewards/recognition (not grading)

**Implementation**:
- [ ] Create leaderboard data aggregation
- [ ] Build leaderboard UI component
- [ ] Add teacher settings for visibility
- [ ] Non-academic metrics only (effort, participation)

**Effort**: 10-12 hours
**Impact**: MEDIUM - Increases student engagement (use cautiously)

**Code Areas**:
- Create new module: `js/teacher/leaderboard-engine.js`
- `reports.html` (leaderboard view)
- Teacher settings for opt-in/out

---

### C3: Enhanced Sound Design
**Current State**: Basic game sounds, music toggle
**Objective**: Layered audio feedback for platform interactions

**Additions**:
- Notification chimes (different tones for different events)
- Celebration audio escalation (matches visual celebration)
- Streak audio rewards
- Thoughtful audio for errors (not punitive)

**Implementation**:
- [ ] Commission/source audio assets (or use royalty-free)
- [ ] Implement audio player in game shell
- [ ] Create sound manager module
- [ ] Add teacher audio preferences

**Effort**: 8-10 hours (assuming audio assets provided)
**Impact**: MEDIUM - Improves engagement, sensory feedback

**Code Areas**:
- Create new module: `js/games/sound-manager.js`
- Update game-shell.js to use sound manager
- Add preferences to teacher settings

---

### C4: Rubric-Based Writing Evaluation
**Current State**: Generic writing feedback
**Objective**: Structured rubric assessment for writing activities

**Implementation**:
- [ ] Define writing rubrics (grade-banded)
- [ ] Create rubric assessment UI
- [ ] Score writing samples against rubric
- [ ] Store rubric scores with evidence

**Effort**: 14-16 hours (complex scoring logic)
**Impact**: HIGH - Professional-grade evaluation tool

**Code Areas**:
- Create new module: `js/teacher/writing-rubric-engine.js`
- Update writing-studio.html with rubric interface
- Add rubric definitions to curriculum-truth.js

---

### C5: Video Tutorials for Key Workflows
**Current State**: Onboarding tour + written help
**Objective**: Short how-to videos for common teacher tasks

**Videos** (2-3 min each):
1. "Log Evidence in 30 Seconds"
2. "Create an Intervention Plan"
3. "Read Your Class Report"
4. "Select the Right Game"
5. "Monitor Student Progress"

**Implementation**:
- [ ] Script each workflow
- [ ] Record screen captures
- [ ] Add captions/narration
- [ ] Create video gallery in help system
- [ ] Embed in contextual help

**Effort**: 10-12 hours (scripting + recording + editing)
**Impact**: MEDIUM-HIGH - Reduces support burden

**Deliverables**:
- `/assets/videos/` folder with 5 videos
- Video navigation: new page or modal gallery

---

## IMPLEMENTATION PHASES

### Phase 1: Quick Wins (Weeks 1-2)
**Priority**: High-impact, lower-effort items

- [x] A1: Alternative Recommendations (8 hrs)
- [x] A4: First-Time Hints (6 hrs)
- [x] A5: Hidden Features Documentation (5 hrs)
- [ ] C3: Enhanced Sound Design (8 hrs)

**Subtotal**: ~27 hours

---

### Phase 2: Medium Complexity (Weeks 3-4)
**Priority**: Good impact with moderate effort

- [ ] A2: Classroom Comparisons (10 hrs)
- [ ] A3: Orientation Video (7 hrs)
- [ ] C1: Achievement System (13 hrs)

**Subtotal**: ~30 hours

---

### Phase 3: High Value (Weeks 5-6)
**Priority**: Comprehensive features with lasting impact

- [ ] C2: Leaderboard System (11 hrs)
- [ ] C4: Writing Rubrics (15 hrs)
- [ ] C5: Video Tutorials (11 hrs)

**Subtotal**: ~37 hours

---

## TOTAL EFFORT & TIMELINE

| Track | Items | Est. Hours | Duration |
|-------|-------|-----------|----------|
| Should-Do (A) | 5 items | 33 hours | 2 weeks |
| Nice-to-Have (C) | 5 items | 50 hours | 3-4 weeks |
| **TOTAL** | **10 items** | **83 hours** | **4-6 weeks** |

---

## RECOMMENDED SEQUENCE

### Immediate (This Week)
1. **A1: Alternative Recommendations** - Core product improvement
2. **A4: First-Time Hints** - Improves discoverability quickly
3. **A5: Hidden Features Docs** - Zero-effort value unlock

### Next 2 Weeks
4. **A2: Classroom Comparisons** - Teacher request, high value
5. **C1: Achievement System** - Engagement driver
6. **A3: Orientation Video** - Reduces support need

### Weeks 5-6 (Post-Teacher-Testing)
7. **C4: Writing Rubrics** - Professional tool, needs teacher feedback
8. **C2: Leaderboard** - After understanding classroom context
9. **C3: Sound Design** - Polish, implement last
10. **C5: Video Tutorials** - Create based on teacher questions

---

## QUALITY GATES

Before marking items complete:
- [ ] Code meets existing style standards
- [ ] Accessibility verified (WCAG AA)
- [ ] Mobile responsive
- [ ] Dark mode tested
- [ ] Documentation complete
- [ ] No performance regressions

---

**Next Step**: Begin Phase 1 with A1 (Alternative Recommendations)

**Estimated Launch**: Late April 2026 (post teacher-testing feedback)
