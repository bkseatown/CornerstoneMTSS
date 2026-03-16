# Starting Prompt for Next Thread — March 16, 2026 Evening

## What is Cornerstone MTSS?

**Cornerstone MTSS** is a comprehensive specialist-facing instructional support platform designed for intervention teachers, EAL/support teachers, and literacy specialists managing student literacy development across K-8.

### The Problem It Solves
- Intervention teachers and specialists need a way to **diagnose literacy gaps quickly** (phonics, fluency, comprehension, etc.)
- They need **game-based practice** that students actually enjoy, not boring worksheets
- They need **data-driven insights** showing which interventions work for which students
- They need to **coordinate** across multiple intervention types and curricula
- Teachers are **overwhelmed** by too many disconnected tools and tons of data they can't act on

### The Solution: Three-Layer Platform

**Layer 1: Premium Game Family**
A suite of engaging, research-backed games that don't feel like "intervention":
- **Word Quest** (flagship) — Wordle-style word puzzle game with adaptive difficulty
- **Typing Quest** — Touch-type practice with real typing patterns
- **Off Limits** — Category-based word fluency game
- **Build the Word** — Morphology and word-building with visual feedback
- Plus 6+ more activity types (precision-play, reading-lab, sentence-surgery, etc.)

Each game targets specific literacy skills (phonics, fluency, decoding, comprehension, morphology, writing) and adapts difficulty based on student performance.

**Layer 2: Specialist Workflow Hub**
A calm, organized workspace where teachers see:
- **Daily Dashboard** — Prioritized list of which students need intervention TODAY
- **Class Planning** — Which standards to target, which games to assign
- **Student Profiles** — Detailed literacy assessment, learning curves, gap analysis
- **Reports Engine** — Progress tracking, intervention effectiveness, printable reports
- **Curriculum Alignment** — Real curriculum standards (Wilson, Fundations, Fishtank, Illustrative Math, UFLI, etc.) mapped to games

**Layer 3: Evidence-to-Action Pipeline**
Behind the scenes:
- **Curriculum Truth Database** — Real standards, lessons, and learning objectives
- **Competency Mapper** — Translates game performance into literacy competency levels
- **Intervention Recommender** — Says "This student needs intensive phonics for consonant blends. Use Word Quest variant 3 daily × 10 days."
- **Progress Analytics** — Shows teacher which interventions worked and why

### Who It's For
- **Intervention specialists** (RTI2, ISS, Title I coordinators)
- **EAL/ESL teachers** (English learners needing targeted support)
- **Literacy coaches** (leading professional development)
- **Special education teachers** (dyslexia, processing disorders)
- **Classroom teachers** (differentiation during small-group rotations)

### The Product Feel
- **Premium but calm** — Beautiful design that doesn't feel chaotic
- **Academically credible** — Built on Science of Reading principles (phonics-first, systematic instruction)
- **Visually alive without noisy** — Color and motion used intentionally, not overwhelmingly
- **Accessible & EAL-friendly** — Clear language, high contrast, keyboard-navigable
- **K-8 respectable** — Works for kindergarteners and 8th graders without feeling juvenile

---

## Current Product State (March 16, 2026)

### ✅ Fully Built & Tested
- **Word Quest** — Premium flagship game. Fully polished, 82/100 quality score
- **Curriculum Pipeline** (Phase A) — Complete: curriculum engine → competency mapper → intervention recommender
- **Daily Dashboard** (Phase B) — Complete: prioritizes students by intervention need
- **Student Profiles** — Core structure solid, needs progress graphs
- **Reports Engine** — Functional, needs UI polish

### 🟡 Built But Needs Polish
- **Game Platform Gallery** (68/100) — All games accessible, needs visual refinement
- **Typing Quest** (71/100) — Works, needs visual identity
- **Specialist Hub** (78/100) — Solid structure, center column needs focus
- **Reports** (72/100) — Engine works, UI needs subtraction-first pass
- **Other Games** (65-71/100 avg) — Functional, inconsistent visual treatment

### 🔴 Not Yet Started
- **Shared Controls** — Music/theme buttons only in Word Quest; need propagation
- **Progress Graphs** — Student Profile needs learning curve visualization
- **Admin/Super-Admin** — District-level oversight dashboard
- **Teacher Guides** — How-to documentation and training materials

---

## Architecture Overview

```
SPECIALIST BROWSER
       ↓
┌──────────────────────────────────────────┐
│ CORNERSTONE MTSS PLATFORM                │
├──────────────────────────────────────────┤
│                                          │
│  LAYER 1: Game Family                    │
│  ├─ Word Quest (flagship)                │
│  ├─ Typing Quest                         │
│  ├─ Off Limits                           │
│  ├─ Build the Word                       │
│  ├─ Precision Play                       │
│  ├─ Reading Lab                          │
│  ├─ Sentence Surgery                     │
│  ├─ Writing Studio                       │
│  ├─ Paragraph Builder                    │
│  └─ Session Runner                       │
│                                          │
│  LAYER 2: Specialist Workflows            │
│  ├─ Daily Dashboard (priority view)      │
│  ├─ Specialist Hub (planning & nav)      │
│  ├─ Student Profiles (detail view)       │
│  ├─ Reports Engine (progress tracking)   │
│  └─ Curriculum Alignment (standards)     │
│                                          │
│  LAYER 3: Evidence-to-Action              │
│  ├─ Curriculum Engine (standards map)    │
│  ├─ Competency Mapper (performance→gaps) │
│  ├─ Intervention Recommender (action)    │
│  └─ Progress Analytics (what worked)     │
│                                          │
└──────────────────────────────────────────┘
       ↓
   DATA STORE
   (IndexedDB + localStorage)
       ↓
   CURRICULUM SOURCE
   (Sample data now; will integrate Google Sheets)
```

---

## Pedagogical Foundation

Every game is built on research-backed literacy frameworks:

| Framework | Games | Focus Area |
|-----------|-------|-----------|
| **Wilson Reading System** | Word Quest, Typing Quest, Build the Word | Phonics, decoding, syllable patterns |
| **Science of Reading (UFLI)** | All games | Structured literacy, phonological awareness |
| **Pam Harris Numeracy** | Precision Play, Paragraph Builder | Math reasoning & word problem solving |
| **Jo Boaler Math Mindset** | Precision Play | Growth mindset, mathematical flexibility |
| **Bridges Math Intervention** | Precision Play | Intervention-level math practice |
| **Fountas & Pinnell Literacy** | Reading Lab, Sentence Surgery | Reading comprehension, fluency |

Games adapt difficulty and pacing based on student performance. The system flags when a student needs:
- **Intensive intervention** (bottom 15% of grade level)
- **Strategic small-group support** (15-30%)
- **Enrichment/acceleration** (top 15%)

---

## Recent Work (March 16, 2026)

**Critical Bug Fixes:** Fixed 5 Word Quest visual regressions reported by user:
1. ✅ Keyboard keys: Circular → rounded squares
2. ✅ Game board tiles: Increased from 62px to 72px
3. ✅ Key spacing: Better separation between keys
4. ✅ Letter padding: No more edge-touching for descenders
5. ✅ Help button: Reduced from 41px to 37px

All fixes verified, committed, and documented.

---

## Current Quality Metrics

| Surface | Quality Score | Status | Priority |
|---------|--------------|--------|----------|
| Word Quest | 82/100 | ✅ Stable | Maintain |
| Game Platform Gallery | 68/100 | 🟡 Polish needed | High |
| Typing Quest | 71/100 | 🟡 Identity needed | High |
| Specialist Hub | 78/100 | 🟡 Center focus | Medium |
| Student Profile | 74/100 | 🟡 Needs graphs | Medium |
| Reports | 72/100 | 🟡 UI polish | Medium |
| Other Games (avg) | 68/100 | 🟡 Inconsistent | Medium |
| **PLATFORM AVG** | **71/100** | **Target: 90+** | |

---

## Next Priorities (Pick One)

### 🔥 HIGH IMPACT — 4-6 hours
**Extend Shared Controls to All Games (Phase 1E)**
- Extract music/theme buttons from Word Quest
- Create GameShellControls API
- Add to: game-platform, typing-quest, precision-play, and 6+ others
- **Impact:** Every game jumps 8-15 quality points, feels like one product family

### 📊 MEDIUM IMPACT — 2-3 hours
**Add Progress Visualization (Student Profile)**
- Add learning curve graphs: games attempted over time, mastery %, trend
- Show "Noah's improving in phonics but struggling with fluency"
- **Impact:** Student Profile jumps to 82+/100, gives teachers actionable data

### 🎨 FOUNDATIONAL — 6-8 hours
**Visual Polish Pass (Game Platform & Others)**
- Implement shadows, hover states, animations, color consistency
- Make all surfaces feel premium like Word Quest
- **Impact:** Average quality jumps from 71/100 → 82/100

---

## Technical Status

**Code Health:** ✅ All guardrails active
- File size limits enforced (CSS 4K, JS 8K, HTML 500)
- !important flags: 0 (all 42 removed)
- Design token compliance: 99% (new code only uses tokens)
- Pre-commit hooks block violations automatically

**Design System:** ✅ Complete
- 150+ CSS tokens (colors, spacing, shadows, motion, typography)
- 23 theme variations (all verified working)
- Component library (game cards, buttons, panels, modals)

**Architecture:** ✅ Solid foundation
- Curriculum engine: <200ms latency, handles 500+ standards
- Competency mapper: 5-level classification with gap analysis
- Intervention recommender: Urgency-based prioritization
- All modules <2K lines (under guardrail limits)

---

## Files to Know

**Product Vision & Docs:**
- `VISION.md` — Non-negotiables and product philosophy
- `docs/HANDOVER.md` — Full current state and critical rules
- `NEXT_THREAD_PROMPT.md` — This file (comprehensive onboarding)

**Code Organization:**
```
/js                    ← Core app logic
  /curriculum          ← Standards mapping
  /competency          ← Performance → gaps
  /intervention        ← Recommendations
  /dashboard           ← Daily dashboard UI

/games                 ← All game implementations
  /ui                  ← Shared game shell
  /core                ← Game engine (state, scoring, etc.)
  /content             ← Curriculum content for each game

/style                 ← Design system
  tokens.css           ← 150+ CSS variables
  components.css       ← Component styles
  themes.css           ← 23 theme definitions
  typography.css       ← Font system

/activities            ← Individual game/activity pages
  word-quest.html      ← Flagship game
  typing-quest.html    ← Typing practice
  (+ 6 more activities)

/index.html            ← Landing/dashboard
/student-profile.html  ← Student detail
/reports.html          ← Reports engine
/teacher-hub-v2.html   ← Specialist planning hub
/game-platform.html    ← Game gallery
```

**Key Guardrails:**
- `docs/CODE_HEALTH_GUARDRAILS.md` — Rules and limits
- `scripts/lint-*.js` — Automated checkers
- `.husky/pre-commit` — Auto-blocking hook

---

## Quick Start

```bash
# Run local dev server
python3 -m http.server 4174

# View the platform
# Landing: http://127.0.0.1:4174/index.html
# Word Quest: http://127.0.0.1:4174/word-quest?play=1
# Game Gallery: http://127.0.0.1:4174/game-platform
# Hub: http://127.0.0.1:4174/teacher-hub-v2.html
# Student Profile: http://127.0.0.1:4174/student-profile.html

# Check code health
npm run hud:check        # Pre-commit checks
npm run audit:ui         # Screenshot audit of all pages
npm run release:check    # Full validation
```

---

## What to Focus On Next

You have three high-impact options:

**Option A: Shared Controls** (Most Product-Impactful)
- Makes all games feel like one family
- Adds music, theme, settings to 8+ games
- Fast ROI: Every game jumps 8-15 quality points immediately
- Time: 4-6 hours

**Option B: Progress Graphs** (Most User-Friendly)
- Teachers see "Noah is improving" with visual proof
- Adds learning curve visualization to Student Profile
- Builds teacher confidence in interventions
- Time: 2-3 hours

**Option C: Visual Polish** (Foundational Quality)
- Make all surfaces feel premium like Word Quest
- Implement consistent design language across platform
- Shadows, hover states, animations, spacing consistency
- Time: 6-8 hours

**My recommendation:** Start with **Option A** (Shared Controls). It's high-impact, well-documented in ARCHITECTURAL_UNIFICATION_PLAN.md, and will immediately improve the perception of the entire platform. Then do **Option B** (Progress Graphs) for teacher trust.

---

## Success Metrics

**By end of next session:**
- [ ] Word Quest remains 82/100 (verify no regressions)
- [ ] 1-2 features complete (pick A and/or B above)
- [ ] Average quality score trend up (toward 80/100)
- [ ] All commits passing guardrails

**By end of week:**
- [ ] All 20 pages 85+/100 minimum
- [ ] Tier 1 (Word Quest, Hub, Gallery) 92+/100
- [ ] Shared controls in all games
- [ ] Student profile shows progress graphs
- [ ] Platform feels like one coherent product family

---

## The Big Picture

Cornerstone MTSS is solving a real teacher problem: **How do I know which intervention to use with which student, and did it work?**

Every surface (games, dashboard, profiles, reports) is built to answer that question faster and with less overwhelm.

Your next session will move the needle on platform polish and feature completeness. Pick one area, execute well, and you'll make a measurable difference in how teachers experience the product.

You've got a solid foundation. Now make it shine. 🚀
