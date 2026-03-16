# CORNERSTONE MTSS — STRATEGIC BLUEPRINT 2026 Q2-Q3
## Bridging Trust, Accuracy, and Powerful Recommendations

**Date:** 2026-03-16 | **Phase:** Post-Cleanup Architectural Relaunch | **Target:** Q2 Release Milestone

---

## EXECUTIVE SUMMARY

The Cornerstone MTSS platform has **strong structural bones** but is experiencing **trust fragmentation** from three systemic gaps:

1. **Teachers don't see themselves in the data.** Recommendations feel disconnected from their classroom reality.
2. **Curriculum accuracy is isolated.** Lesson/intervention/unit info lives in disparate systems without unified truth.
3. **Alignment paradox:** All the data is *there*, but it's not *converging* into a single powerful signal.

This blueprint addresses **what teachers NEED to see** (not what systems PRODUCE) and reorganizes the product around **teacher confidence**, **curriculum precision**, and **actionable recommendations that genuinely reduce teacher workload**.

---

## PART 1: THE TRUST PROBLEM

### Current State: Trust Fragmentation

**What teachers experience today:**
- Student profile shows competency data, but no clear path to "how do I teach this better?"
- Reports dashboard has metrics, but lacks narrative: "Here's why Maya is struggling, and here's what to do."
- Game recommendations are system-generated, not connected to lesson intent
- Curriculum metadata (grade band, standard alignment) is stored but not active in recommendations
- Intervention suggestions don't reference the specific classroom/lesson context

**Result:** Teachers treat the tool as a **data reporter**, not a **workflow amplifier**. Engagement is transactional.

### The Trust Gap: Root Causes

#### 1. **System-First Design vs. Teacher-First Logic**
- Current: "Here's what the data shows" → Teacher interprets
- Needed: "Here's what you should do on Monday" → Data supports the action

#### 2. **Disconnected Data Silos**
- Curriculum truth (lessons, units, standards) lives in `js/curriculum-truth.js` (static, not synced with student performance data)
- Evidence (assessments, game scores) lives in `js/evidence-store.js` (granular, not aggregated for teaching)
- Recommendations live in `js/app.js` (centralized but not context-aware)
- **Problem:** No unified query that says "Given THIS student + THIS lesson + THIS standard + TODAY'S evidence = RECOMMENDATION"

#### 3. **Accuracy Loss in Translation**
- Curriculum data is correct but never verified against actual lesson delivery
- Intervention assignments are suggested but not tracked for delivery confirmation
- Support moves recommended but not validated that teacher implemented

### The Trust Solution: Unified Narrative Engine

**Principle:** Every surface (reports, profile, game selection, hub) should answer:
> "What should this teacher do differently tomorrow that will help this student?"

**This requires:**
1. **Single curriculum source** that syncs with teaching reality
2. **Evidence aggregation** that connects game performance → lesson competency → standard mastery
3. **Recommendation engine** that knows lesson context and outputs teacher-specific actions
4. **Confirmation loop** that validates teachers acted on suggestions

---

## PART 2: THE ACCURACY PROBLEM

### Current Curriculum State

**What exists:**
- Curriculum data: Static curriculum loaded from `js/curriculum-truth.js`
- Lesson briefs: Displayed in sidebar via `js/lesson-brief-panel.js`
- Standards alignment: Referenced but not active in filtering/recommendations

**What's missing:**
- No unified "source of truth" for lesson-unit-standard mapping
- No real-time sync with teacher's actual lesson plans
- No way to capture "I taught this, but my students didn't get it"
- No validation that recommended intervention matches the actual unmet standard

### Accuracy Blueprint: Curriculum Sync Layer

#### Layer 1: Establish Single Curriculum Source
**Goal:** One place where lesson → unit → standard mapping is definitive

**Implementation:**
```javascript
// curriculum/curriculum-engine.js (NEW)
class CurriculumEngine {
  constructor() {
    this.source = 'google-sheets|internal-db'; // Single source designation
    this.lastSync = timestamp;
    this.standards = Map<standardId, Standard>;
    this.units = Map<unitId, Unit>;
    this.lessons = Map<lessonId, Lesson>;
  }

  // Core query: "What standards does this lesson address?"
  async getStandardsForLesson(lessonId, gradeLevel, subject) {
    const lesson = this.lessons.get(lessonId);
    return lesson.standards.filter(s =>
      s.gradeLevel === gradeLevel && s.subject === subject
    );
  }

  // Core query: "What lessons address this standard?"
  async getLessonsForStandard(standardId) {
    return Array.from(this.lessons.values()).filter(l =>
      l.standards.some(s => s.id === standardId)
    );
  }

  // Core query: "Is there an intervention for this unmet standard?"
  async getInterventionPathForStandard(standardId, gradeLevel, evidenceOfGap) {
    // Returns [intervention-type, lesson-sequence, game-recommendations]
  }
}
```

**Data Flow:**
```
Teacher selects lesson
  ↓
CurriculumEngine fetches linked standards
  ↓
Evidence system tracks performance against those standards
  ↓
Gaps identified → Intervention path recommended
  ↓
Teacher sees: "Maya didn't master [Standard X]. Try [Intervention Y] then [Game Z]"
```

#### Layer 2: Evidence-to-Competency Pipeline
**Goal:** Map game performance → lesson competency (not just raw scores)

**Implementation:**
```javascript
// evidence/competency-mapper.js (NEW)
class CompetencyMapper {
  async inferCompetency(gamePerformance, lessonContext) {
    // Input: { gameType: 'word-quest', score: 82, accuracy: 0.91, timing: 'fast' }
    // + Lesson context: { standard: 'Phonetic Decoding', grade: '3-5' }

    // Output: { competency: 'EMERGING', confidence: 0.78, gap: 'pronunciation variants' }

    const gameSignal = this.parseGameMetrics(gamePerformance);
    const curriculumContext = await this.curriculum.getStandardContext(lessonContext.standard);

    return {
      standardId: lessonContext.standard,
      level: this.computeCompetencyLevel(gameSignal, curriculumContext),
      confidence: this.computeConfidence(gameSignal),
      specificGap: this.identifyGap(gameSignal, curriculumContext),
    };
  }
}
```

#### Layer 3: Intervention Accuracy
**Goal:** Recommend interventions that address the SPECIFIC gap (not generic)

**Implementation:**
```javascript
// interventions/intervention-recommender.js (NEW)
class InterventionRecommender {
  async recommendForGap(standardId, specificGap, studentContext) {
    // Input: { standard: 'Decoding', gap: 'consonant-blends', grade: '3-5' }

    // Output: {
    //   intervention: 'small-group-decoding-blends-intensive',
    //   duration: '10 days',
    //   game-sequence: ['word-quest-blends', 'typing-quest-consonants'],
    //   teacher-action: 'Use provided word list in phonics lesson',
    //   success-metric: '3 consecutive 90%+ performances on blend recognition'
    // }

    const interventionPath = await this.curriculum.getInterventionForGap(standardId, specificGap);
    return this.validateForStudent(interventionPath, studentContext);
  }
}
```

### Accuracy Guardrail: Validation Loop

**Every 7 days, Teacher sees:**
```
"You assigned [Intervention X] to [Maya].
✓ You delivered it: [YES/NO]
✓ She improved on [Standard Y]: [YES/NO]
Action taken: [Noted for future reference]"
```

This creates a **feedback loop** where:
- Teachers confirm actions taken
- System learns what interventions work for which gaps
- Recommendations improve over time

---

## PART 3: THE ALIGNMENT PROBLEM

### Current State: Silos Without Integration

**Data flow today:**
```
Games → Evidence Store → App.js → Reports / Profile
  (isolated)   (granular)     (opaque)    (disconnected)
```

**What's missing:**
- No unified student snapshot showing "TODAY's full picture"
- Recommendations aren't context-aware (don't know if intervention is active)
- Teacher actions aren't tracked (did they actually use the intervention?)
- Curriculum metadata doesn't influence game selection

### Alignment Blueprint: The Daily Dashboard

**Goal:** One surface where everything converges into "What should I focus on today?"

#### Daily Dashboard Schema

```javascript
// dashboard/daily-dashboard.js (NEW)
class DailyDashboard {
  async getTeacherView(teacherId, today) {
    const caseload = await this.teacher.getCaseload(teacherId);
    const lessonPlan = await this.teacher.getTodaysLessonPlan(teacherId, today);

    // For each student:
    const studentSnapshots = await Promise.all(caseload.map(async student => {
      const evidence = await this.evidence.getRecentPerformance(student.id, last14days);
      const curriculum = await this.curriculum.getLessonStandards(lessonPlan.lessonId);
      const gaps = await this.competencyMapper.identifyGaps(evidence, curriculum);
      const interventions = await this.interventionRecommender.getActive(student.id);

      return {
        student: student,
        lessonReadiness: this.assessLessonReadiness(student, curriculum),
        performanceSnapshot: {
          recentGames: evidence.games.slice(-3),
          competencyStatus: gaps,
          activeInterventions: interventions,
        },
        recommendedAction: this.synthesizeAction(gaps, interventions, lessonPlan),
        calloutPriority: this.rankByUrgency(gaps, interventions),
      };
    }));

    // Rank by urgency: Who needs attention first?
    return {
      primaryFocus: studentSnapshots.filter(s => s.calloutPriority === 'HIGH'),
      secondaryWatch: studentSnapshots.filter(s => s.calloutPriority === 'MEDIUM'),
      onTrack: studentSnapshots.filter(s => s.calloutPriority === 'LOW'),
    };
  }
}
```

#### Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  TODAY'S FOCUS — 8:20 Math · Ms. Smith                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔴 PRIMARY FOCUS (3 students)                          │
│  ├─ Noah K. — Decoding struggling                       │
│  │  Action: Use blend-heavy phonics + Word Quest review │
│  │  Status: Intervention day 3/10 active               │
│  │  Recent: 62% Word Quest (down from 78%)             │
│  │                                                      │
│  ├─ Maya R. — Fluency needs acceleration               │
│  │  Action: Move to challenge group; Typing Quest tier3 │
│  │  Status: Ready for next level                       │
│  │  Recent: 95% on easy games 4x in a row             │
│  │                                                      │
│  └─ Jayden T. — Engagement dropped                      │
│     Action: Check-in on motivation; use preferred game │
│     Status: Last active 3 days ago                      │
│     Recent: No activity                                 │
│                                                          │
│  🟡 SECONDARY WATCH (5 students)                        │
│  ├─ [Compact list with student + one-liner]           │
│  └─ ...                                                 │
│                                                          │
│  🟢 ON TRACK (12 students) — No action needed          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Alignment in Action

**Example: Noah's Gap**
```
1. Evidence system detects: Noah scored 62% on Word Quest (below threshold)
2. Competency mapper infers: "Decoding/consonant-blends gap"
3. Curriculum engine finds: This skill addresses [Standard 3.RF.3]
4. Intervention recommender suggests: "Small-group phonics + Word Quest variants"
5. Daily dashboard shows teacher: "Noah needs phonics blend work today"
6. Teacher selects game: System recommends Word Quest with blend-heavy word list
7. Tracking loop: "Did you deliver the intervention?" → Yes/No capture
```

**The teacher sees NONE of the pipeline — just the action: "Do phonics + this game."**

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase A: Foundation (Weeks 1–4, March 16–April 6)

**Objective:** Establish single curriculum source + evidence aggregation

**Deliverables:**
1. `curriculum/curriculum-engine.js` — Single source for lesson-unit-standard mapping
2. `evidence/competency-mapper.js` — Infer student competency from game performance
3. `interventions/intervention-recommender.js` — Context-aware suggestion engine
4. Database/storage layer — Persist curriculum syncs, evidence aggregation, teacher actions

**Testing:** Unit tests for curriculum queries; evidence-to-competency mapping against known test cases

**Success Metric:** Core query latency <200ms: "What standards does lesson X address?"

---

### Phase B: Daily Dashboard (Weeks 5–8, April 7–May 4)

**Objective:** Surface convergence of curriculum + evidence + recommendations

**Deliverables:**
1. `dashboard/daily-dashboard.js` — Teacher-day snapshot
2. `dashboard/daily-dashboard.html` + `dashboard/daily-dashboard.css` — UI
3. Student prioritization algorithm — Rank by urgency
4. Action synthesis — "What should teacher do?"

**Integration Points:**
- Fetch today's lesson from teacher schedule (via teacher-hub-v2.js)
- Query curriculum engine for lesson standards
- Pull recent game performance from evidence-store.js
- Calculate gaps and interventions
- Render prioritized list

**Testing:** Functional e2e test with sample teacher + 20 students

**Success Metric:** Load dashboard in <1s; accurate student prioritization validated against expert teacher review

---

### Phase C: Validation Loop (Weeks 9–12, May 5–June 1)

**Objective:** Close the feedback loop — track if teacher acted on recommendations

**Deliverables:**
1. `tracking/action-logger.js` — Log teacher actions (delivered intervention Y/N, student progress Y/N)
2. `reporting/intervention-impact-report.js` — Show which interventions worked
3. UI for confirmation: "You recommended intervention X. Was it delivered?" → Yes/No/Partial
4. Feedback signal to recommender: Learn from outcomes

**Integration Points:**
- After student completes game, ask: "Did you deliver the planned intervention first?"
- Weekly summary: "You implemented 7/10 recommendations. Noah improved. Maya stalled on blends."
- Use feedback to refine future recommendations

**Testing:** Test with 3–5 classrooms over 4 weeks

**Success Metric:** 80%+ teacher action logging; measurable correlation between implementation and student improvement

---

### Phase D: Scaling & Optimization (Weeks 13–16, June 2–30)

**Objective:** Ensure system scales across teacher profiles; optimize for mobile

**Deliverables:**
1. Multi-class support (some teachers have 2–3 classes)
2. Mobile-optimized daily dashboard
3. Push notifications for high-priority students
4. Batch curriculum sync (nightly vs. real-time)

**Testing:** Load test with 100+ teachers + 3K students

**Success Metric:** System handles peak load (8:00am) without degradation; <2s dashboard load time

---

## PART 5: GUARDRAILS TO PREVENT BLOAT

### Architecture Guardrail: Modular Boundaries

**Rule 1: Single Responsibility**
- Each module owns ONE data flow: curriculum → evidence → recommendations → action
- No module should know about all students or all games (scope control)
- Exception: Daily dashboard synthesizes (that's its job)

**Rule 2: API-First Design**
```javascript
// curriculum/curriculum-engine.js exports ONLY these:
export {
  getStandardsForLesson,   // (lessonId, gradeLevel) → [Standards]
  getLessonsForStandard,   // (standardId) → [Lessons]
  getInterventionForGap,   // (standardId, gap) → InterventionPath
};
```
- Changes to curriculum data structure don't ripple to evidence or recommendations
- Easy to swap curriculum source (Google Sheets → Internal DB → API)

**Rule 3: No Cascade Overrides**
- Modules don't override each other's CSS classes
- game-shell.css forbidden from styling dashboard components
- dashboard.css is ONLY for dashboard (BEM: `.dashboard-*`, `.daily-*`)
- Breaks the cascade-battle pattern that created game-shell.css bloat

### Code Bloat Guardrail: Size Limits

**CSS Limit:** No single CSS file >4,000 lines
- If approaching 4K lines, split into feature modules
- game-shell.css (11.1K) should split into:
  - game-shell-core.css (2K)
  - game-word-quest.css (3K)
  - game-typing-quest.css (2K)
  - game-responsive.css (1.5K)

**JS Limit:** No single JS file >8,000 lines
- If approaching 8K, split into logical modules
- app.js (19K) should modularize:
  - core/state-engine.js (3K)
  - games/game-controller.js (4K)
  - teacher/workflow-engine.js (4K)
  - curriculum/curriculum-engine.js (3K)
  - ui/renderer.js (3K)

**Enforcement:** CI linter runs on every PR:
```javascript
// linter-rule: file-size-limit.js
if (file.size > 4000) {
  console.error(`❌ ${file} exceeds 4K lines. Split required.`);
  process.exit(1);
}
```

### Design System Guardrail: Token Compliance

**Rule:** All colors, fonts, spacing MUST come from tokens

**Violation Detection:**
```css
/* ❌ ILLEGAL */
color: #12304f;           /* Hardcoded color */
font-size: 14px;          /* Hardcoded size */
margin: 18px;             /* Hardcoded spacing */

/* ✓ CORRECT */
color: var(--text-primary);
font-size: var(--fs-body);
margin: var(--space-2);
```

**Enforcement:** PostCSS linter:
```javascript
// lint-tokens.js
const colors = /^#[0-9a-f]{6}|rgb\(|hsl\(/i;
if (rule.prop === 'color' && colors.test(rule.value)) {
  throw `❌ Use CSS token, not hardcoded color: ${rule.value}`;
}
```

### Code Review Guardrail: Removal Verification

**PR Template Question:**
```
## Code Changes
- Lines added: __
- Lines removed: __
- Net change: __

### Have you deleted equivalent lines elsewhere?
- [ ] Yes, removed __ lines from similar/old code
- [ ] N/A (new feature, no prior equivalent)
- [ ] No (⚠️ Why not? Explain below)

Comment: _____________
```

**Policy:** If adding 50 lines, you should have considered removing 50 lines elsewhere. Show the math.

### Design Guardrail: Readability Audits

**Quarterly Audit (every 3 months):**
1. Test all themes against WCAG AA contrast
2. Verify no hardcoded colors outside tokens
3. Check for !important creep
4. Validate responsive behavior at 3 breakpoints

**Fail Criteria:**
- Any theme with contrast <4.5:1 on tile-board interaction elements → BLOCKER
- >100 new !important declarations → BLOCKER

### Documentation Guardrail: Architecture Registry

**File: `docs/ARCHITECTURE_REGISTRY.md`**

Maintain a living inventory:
```markdown
## Module Inventory
| Module | Lines | Owner | Purpose | Interlock |
|--------|-------|-------|---------|-----------|
| curriculum-engine | 1.2K | Teacher-focused | Standards mapping | Reads: none. Provides: `getStandardsForLesson()` |
| competency-mapper | 800 | Evidence | Infer skill mastery | Reads: curriculum-engine. Provides: competency levels |
| intervention-recommender | 1.5K | Evidence | Path suggestions | Reads: curriculum-engine, evidence-store. Provides: recommendations |
| daily-dashboard | 2.1K | UI | Teacher snapshot | Reads: all above. Provides: single view |

## CSS Registry
| File | Lines | Owner | Scope | Tokens |
|------|-------|-------|-------|--------|
| dashboard.css | 800 | UI | `.dashboard-*`, `.daily-*` | Uses 40 tokens; 0 hardcoded colors |
| game-shell-core.css | 2K | Games | Platform chrome | Uses 120 tokens; 12 !important |
```

**Rule:** Anytime code exceeds limits above, update registry AND create refactor ticket.

---

## PART 6: SUCCESS METRICS & TEACHER IMPACT

### How We Measure Teacher Trust

**Metric 1: Recommendation Adoption**
- Baseline: "How many recommendations does teacher act on?"
- Goal: >80% of high-priority recommendations implemented within 7 days
- Validation: Teacher confirms "Delivered intervention Y/N"

**Metric 2: Accuracy of Suggestions**
- Baseline: "How many teacher-confirmed interventions lead to measurable student improvement?"
- Goal: >70% of interventions followed by ≥10% performance lift
- Validation: Track student performance 2 weeks post-intervention

**Metric 3: Time Saved**
- Baseline: Teacher spends ~5 min/student/week finding actionable insights
- Goal: Dashboard reduces to <2 min/student/week
- Validation: Usage analytics (dashboard load time, actions per session)

### How Teachers Experience It

**Before (Today):**
> "I need to see student reports, game scores, and curriculum maps separately. I piece together 'Maya needs help with blends' from multiple screens. Takes 10 minutes per struggling student."

**After (Q2 2026):**
> "I open the Daily Dashboard. It shows 'Maya: Decoding blends. Try 10-day phonics sequence + Word Quest blends variant. Status: Day 3 of 10. Improve in blends?' Click yes, system logs it, game is ready, I move on. Total time: 90 seconds."

---

## PART 7: Risk Mitigation

### Risk 1: Curriculum Data Sync Breaks
**Scenario:** Curriculum source (Google Sheets / API) goes down → Recommendations fail

**Mitigation:**
- Cache curriculum data locally with 24-hour TTL
- Fall back to last-known-good state
- Alert teacher: "Using cached curriculum from [date]. Refreshing at [time]."

**Responsibility:** Curriculum-engine owns sync resilience

### Risk 2: Evidence Quality Degrades
**Scenario:** Game scores don't map cleanly to real competency → False recommendations

**Mitigation:**
- Expert teacher review: Spot-check 10% of inferred competencies
- Validation loop feedback: "Did improvement happen after intervention?" helps calibrate
- Conservative confidence thresholds: Only recommend if confidence >0.75

**Responsibility:** Competency-mapper owns validation

### Risk 3: Recommendation Overwhelm
**Scenario:** Too many simultaneous suggestions → Teacher ignores all

**Mitigation:**
- Daily dashboard ranks by urgency (NOT raw count)
- Max 3 "primary focus" students per day
- Secondary recommendations shown but not urgent
- Rule: Only one active intervention per student (unless multi-subject)

**Responsibility:** Daily-dashboard owns prioritization

### Risk 4: Dark Mode + Contrast Failures Return
**Scenario:** Forest theme tile readability collapses again

**Mitigation:**
- Quarterly contrast audit (WCAG AA minimum)
- CI linting for hardcoded colors (prevents drift)
- Teacher feedback form: "Readability issue? Report here."
- Token-first design makes fixes trivial (change 1 color variable)

**Responsibility:** Design system owner + linting

---

## PART 8: Success Criteria by Phase

### Phase A Success (Mid-April 2026)
- ✓ Curriculum engine responds to "What standards does lesson X address?" in <200ms
- ✓ Evidence system infers competency from Word Quest score + lesson context (validated against 5 expert teachers)
- ✓ Intervention recommender outputs 3+ intervention paths per student per week

### Phase B Success (Early May 2026)
- ✓ Daily dashboard loads for 20-student class in <1 second
- ✓ Student prioritization matches expert teacher ranking 85%+ of the time
- ✓ Teacher can identify "What should I do with Noah?" in <30 seconds using dashboard

### Phase C Success (Early June 2026)
- ✓ 80%+ of teachers confirm actions (intervention delivered / not delivered)
- ✓ 70%+ of confirmed interventions followed by measurable improvement
- ✓ Feedback loop successfully refines recommendations (later recommendations higher confidence)

### Phase D Success (End-June 2026)
- ✓ System handles 500+ concurrent teachers without degradation
- ✓ Mobile dashboard renders optimally (responsive, <2s load)
- ✓ Code bloat stable: 0 files >4K lines CSS, 0 files >8K lines JS

---

## Closing: Why This Matters

Teachers choose tools based on **one criterion: Do you make my life better?**

Right now, Cornerstone MTSS shows teachers **data**. This blueprint makes it show teachers **actions**.

Every teacher who opens the daily dashboard and sees:
> "Noah needs [specific intervention]. Here's the game. Did you do it? [Yes/No]"

…is experiencing a product that **understands their job** and **respects their time**.

That's trust. That's adoption. That's impact.

---

**Document Status:** Blueprint Ready for Stakeholder Review
**Next Step:** Approve architectural changes → Begin Phase A (Curriculum Engine)
**Questions/Feedback:** Contact Product Lead
