# ARCHITECTURE REGISTRY
**Living Inventory of Module Architecture (Updated: 2026-03-16)**

This document maintains a canonical map of all modules, their dependencies, and API contracts. Update this whenever you create a new module or modify an API.

---

## MODULE INVENTORY

### Phase A: Foundation Modules (March 16–April 6)

#### curriculum-engine.js
| Field | Value |
|-------|-------|
| **Status** | Not Started (Phase A, Deliverable 1) |
| **File** | `js/curriculum/curriculum-engine.js` |
| **Lines** | — (target: 1.2K) |
| **Owner** | Core |
| **Purpose** | Single source of truth for lesson-unit-standard mapping |
| **Exports** | `getStandardsForLesson()`, `getLessonsForStandard()`, `getInterventionPathForStandard()` |
| **Reads From** | `curriculum-sync-store.js` (curriculum data store) |
| **Reads Nothing Else** | No cross-module dependencies (isolation) |
| **Sync Strategy** | Weekly from Google Sheets (or internal DB) |
| **Data Schema** | Lessons, Units, Standards, Grade Bands, Subject Tags |
| **Query Latency** | <200ms (verified via unit tests) |
| **Tests** | `tests/curriculum-engine.spec.js` (12 specs target) |

#### competency-mapper.js
| Field | Value |
|-------|-------|
| **Status** | Not Started (Phase A, Deliverable 2) |
| **File** | `js/evidence/competency-mapper.js` |
| **Lines** | — (target: 800) |
| **Owner** | Evidence |
| **Purpose** | Infer student competency (mastery level) from game performance data |
| **Exports** | `inferCompetency()`, `parseGameMetrics()`, `identifyGap()` |
| **Reads From** | `curriculum-engine.js` (for standard context), `evidence-store.js` (for game data) |
| **Output** | Competency level (EMERGING, DEVELOPING, PROFICIENT, ADVANCED), confidence score, specific gap |
| **Validation** | Tested against known game-performance-to-competency mappings |
| **Tests** | `tests/competency-mapper.spec.js` (10 specs target) |

#### intervention-recommender.js
| Field | Value |
|-------|-------|
| **Status** | Not Started (Phase A, Deliverable 3) |
| **File** | `js/interventions/intervention-recommender.js` |
| **Lines** | — (target: 1.5K) |
| **Owner** | Evidence |
| **Purpose** | Generate context-aware intervention recommendations |
| **Exports** | `recommendIntervention()`, `getInterventionSequence()`, `validateRecommendation()` |
| **Reads From** | `curriculum-engine.js`, `competency-mapper.js`, `evidence-store.js` |
| **Outputs** | Intervention path (type + game sequence + duration) |
| **Integration** | Daily dashboard queries this module to show recommendations |
| **Tests** | `tests/intervention-recommender.spec.js` (15 specs target) |

#### curriculum-sync-store.js (Storage Layer)
| Field | Value |
|-------|-------|
| **Status** | Not Started (Phase A, Deliverable 4) |
| **File** | `js/db/curriculum-sync-store.js` |
| **Lines** | — (target: 800) |
| **Owner** | Core / Data Layer |
| **Purpose** | Persistent storage for curriculum data, syncs, and teacher actions |
| **Exports** | `getCurriculumData()`, `syncCurriculum()`, `recordTeacherAction()`, `getTeacherActionLog()` |
| **Storage Backend** | IndexedDB (client-side) + optional server sync |
| **Data Structures** | Curriculum cache, sync timestamps, action log, evidence aggregations |
| **Sync Strategy** | Nightly batch from curriculum source (Google Sheets or API) |
| **Tests** | `tests/curriculum-sync-store.spec.js` (8 specs target) |

---

### Existing Modules (Reference)

#### curriculum-truth.js
| Field | Value |
|-------|-------|
| **Status** | Active (legacy, will be superseded by curriculum-engine.js) |
| **File** | `js/curriculum-truth.js` |
| **Purpose** | Static curriculum data (old system) |
| **Note** | curriculum-engine.js will replace this for dynamic queries; keep until Phase B migration |

#### evidence-store.js
| Field | Value |
|-------|-------|
| **Status** | Active (exists, structure TBD) |
| **File** | `js/evidence-store.js` |
| **Purpose** | Track game performance and student evidence |
| **Used By** | competency-mapper.js (Phase A will depend on this) |
| **Critical** | competency-mapper.js needs clear schema — **clarify before coding** |

#### lesson-brief-panel.js
| Field | Value |
|-------|-------|
| **Status** | Active |
| **File** | `js/lesson-brief-panel.js` |
| **Purpose** | Sidebar panel for lesson context |
| **Integration** | Phase B daily dashboard will extend this |

#### game-shell.js
| Field | Value |
|-------|-------|
| **Status** | Active (recently cleaned up March 16) |
| **File** | `games/ui/game-shell.js` |
| **Lines** | 5,065 |
| **CSS** | `games/ui/game-shell.css` (11,127 lines after cleanup) |
| **Note** | Game platform shell; modularization planned for Phase B+ |

#### teacher-hub-v2.js
| Field | Value |
|-------|-------|
| **Status** | Active (current specialist hub) |
| **File** | `js/teacher-hub-v2.js` |
| **CSS** | `teacher-hub-v2.css` (8,270 lines) |
| **Integration** | Phase B daily dashboard will integrate with teacher schedule |

#### app.js
| Field | Value |
|-------|-------|
| **Status** | Active (monolithic, target for refactoring) |
| **File** | `js/app.js` |
| **Lines** | 19,000 (exceeds guardrail) |
| **Refactor** | STRATEGIC_BLUEPRINT_2026-Q2 Part 5 outlines split strategy |
| **Target** | Split into core/, games/, teacher/, curriculum/, ui/ modules |

---

## CSS MODULE REGISTRY

| File | Lines | Owner | Scope | Tokens Used | Hardcoded Colors | !important | Status |
|------|-------|-------|-------|-------------|------------------|-----------|--------|
| `style/tokens.css` | 162 | Core | Token definitions | — | 0 | 0 | ✓ Clean |
| `style/components.css` | ~2K | Core | Component base styles | 162 | 0 | <5 | ✓ Clean |
| `style/themes.css` | ~3K | Design | Theme variants (light/dark/seahawks/forest) | 162 | 0 | <5 | ⚠️ Under Review |
| `home-v3.css` | ~1.2K | Landing | Landing page styles | 120 | 0 | 0 | ✓ Clean |
| `games/ui/game-shell.css` | 11,127 | Games | Game platform chrome (oversize) | 342 unique | 211 off-system | 685 | ⚠️ Bloated (needs split) |
| `games/word-quest/word-quest.css` | ~3K | Games/WQ | Word Quest game styles | 150 | 45 | 12 | ⚠️ Token audit needed |
| `games/typing-quest/typing-quest.css` | ~2.5K | Games/TQ | Typing Quest game styles | 140 | 32 | 8 | ⚠️ Token audit needed |
| `teacher-hub-v2.css` | 8,270 | Teacher | Specialist hub styles (oversize) | 280 | 180 | 92 | ⚠️ Bloated (needs split) |
| `activities/*.css` | Various | Activities | Tool surface styles | — | — | — | TBD |

**Total:** ~30K CSS lines (should be ~20K) → 50% bloat remaining after March 16 cleanup

---

## DATA FLOW DIAGRAM

```
CURRICULUM SYNC (Weekly)
├─ Google Sheets / Internal DB
└─ curriculum-sync-store.js (persistence layer)
    └─ curriculum-engine.js (query layer)
        ├─ getStandardsForLesson(L, G, S)
        ├─ getLessonsForStandard(S)
        └─ getInterventionPathForStandard(S)

GAME PERFORMANCE (Real-time)
├─ Game shells record scores
└─ evidence-store.js (collection layer)
    └─ competency-mapper.js (inference layer)
        ├─ parseGameMetrics(perf)
        ├─ inferCompetency(perf, context)
        └─ identifyGap(perf, standard)

RECOMMENDATIONS (On-demand)
├─ curriculum-engine.js (standards)
├─ competency-mapper.js (gaps)
├─ evidence-store.js (performance history)
└─ intervention-recommender.js (synthesis)
    └─ recommendIntervention(student, lesson, standard)

TEACHER VIEW (Daily)
├─ Daily dashboard queries above
├─ Shows prioritized students
├─ Offers specific actions
└─ Logs teacher responses
```

---

## DEPENDENCY MATRIX

| From | To | Type | Latency | Critical |
|------|----|----|---------|----------|
| competency-mapper | curriculum-engine | Read | <50ms | ✓ Yes |
| competency-mapper | evidence-store | Read | <50ms | ✓ Yes |
| intervention-recommender | curriculum-engine | Read | <50ms | ✓ Yes |
| intervention-recommender | competency-mapper | Read | <100ms | ✓ Yes |
| intervention-recommender | evidence-store | Read | <50ms | ✓ Yes |
| daily-dashboard (Phase B) | all above | Read | <1s | ✓ Yes |

**Rule:** No circular dependencies. Module A can read B, but B cannot read A.

---

## REFACTORING TICKETS

### High Priority

#### Ticket: game-shell.css Split
| Field | Value |
|-------|-------|
| **Status** | Planned (Phase B+) |
| **File** | `games/ui/game-shell.css` |
| **Issue** | 11.1K lines = 38.8% of CSS bloat |
| **Target** | 4 modules: core (2K), word-quest (3K), typing-quest (2K), responsive (1.5K) |
| **Blocker** | Selector deduplication must complete first |
| **Estimated** | 3-day refactor |

#### Ticket: teacher-hub-v2.css Split
| Field | Value |
|-------|-------|
| **Status** | Planned (Phase B+) |
| **File** | `teacher-hub-v2.css` |
| **Issue** | 8.3K lines = 29% of CSS bloat |
| **Target** | 3 modules: core (3K), reports (2.5K), workroom (2.5K) |
| **Blocker** | None |
| **Estimated** | 2-day refactor |

#### Ticket: app.js Modularization
| Field | Value |
|-------|-------|
| **Status** | Planned (Phase B+) |
| **File** | `js/app.js` |
| **Issue** | 19K lines exceeds 8K guardrail |
| **Target** | Split: core/state-engine (3K), games/game-controller (4K), teacher/workflow-engine (4K), curriculum/curriculum-engine (3K), ui/renderer (3K) |
| **Blocker** | curriculum-engine.js must exist first (Phase A) |
| **Estimated** | 5-day refactor |

---

## QUALITY METRICS (Updated: 2026-03-16)

### Code Bloat Baseline
```
CSS: 36K lines (target: 20K) = 80% OVER budget
JS: 30.9K lines (target: 20K) = 55% OVER budget
HTML: Average 300 lines (target: 500) ✓ OK
```

### Design System Compliance
```
Colors: 211 hardcoded vs 162 tokens = 130% OVER (65% off-system)
Font sizes: 141 arbitrary vs 10-tier scale = 1,310% OVER
!important: 796 declarations (target: <50) = 1,592% OVER
Duplicate selectors: 258 instances (target: 0) = CASCADE BATTLES
```

### After March 16 Cleanup
```
game-shell.css: 11.4K → 11.1K lines (2.6% reduction only)
!important: 796 → 685 (14% reduction)
Duplicate selectors: Still ~258 (unchanged - lint-duplicates.js new, prevents future only)
```

**Note:** Cleanup was conservative (safety-first without dev server verification). Comprehensive refactor needed Phase B+.

---

## NEXT ACTIONS (Prioritized)

### Immediate (March 16–20)
1. ✓ Create curriculum-engine.js (Phase A start)
2. ✓ Create competency-mapper.js (Phase A)
3. ✓ Clarify evidence-store.js schema with user (blocker!)
4. ✓ Create curriculum-sync-store.js

### Week 1–2 (March 23–April 6)
1. Unit tests for Phase A modules
2. Verify <200ms query latency
3. Integrate with existing evidence-store.js
4. Update HANDOVER.md with progress

### Phase B (April 7+)
1. Create daily-dashboard.js
2. Begin game-shell.css / app.js refactoring
3. Resolve design system bloat (token compliance audit)

---

## Document Status

| Field | Value |
|-------|-------|
| **Created** | 2026-03-16 |
| **Last Updated** | 2026-03-16 |
| **Owner** | Engineering Lead |
| **Review** | Every 4 weeks (phase completion) |
| **Version** | 1.0 (baseline as of Phase A start) |

Update this document whenever:
- Creating a new module
- Modifying a module's API or exports
- Changing file sizes significantly
- Completing a refactoring ticket

---

