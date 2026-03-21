# Documentation Index

## Current Source-Of-Truth Docs

Start here when you need reliable, current guidance for the checked-in repo:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/README.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/QUICK_START.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/SHIP_AND_DEBUG_CHECKLIST.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ARCHITECTURE_MAP.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/REFACTOR_ROADMAP.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_CORE_ANALYSIS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_QUICK_REFERENCE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULES_3_4_5_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/MODULES_3_4_5_EXTRACTION_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_3_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_4_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_3_4_EXTRACTION_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_5_DEEP_DIVE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_5_EXTRACTION_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/GAMEPLAY_MODULE_5_GOTCHAS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DEPLOYMENT_GUIDE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/progress.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/VISION.md`

## Active Working Docs

These are still useful, but they are more directional or tactical than canonical:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/APP_MODULARIZATION_PROGRESS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/EXTRACTION_PLAN.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/TEACHER_READY_CHECKLIST.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/CODEX_QUICK_REFERENCE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/MODULES_1_2_EXTRACTION_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/ROADMAP_PHASE2-6.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/pilot/README.md`

## Historical Or Archival Context

These files can still provide background, but they should not be treated as current operating instructions without checking the source-of-truth docs above:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/FINAL_DELIVERY_SUMMARY.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/SESSION_SUMMARY_2026-03-17.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/WEEK1_COMPLETION_SUMMARY.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/WEEK2_RESTORATION_COMPLETE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/WORK_SUMMARY_2026-03-16.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/UI_IMPROVEMENTS_PHASE2_COMPLETE.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/VISUAL_AUDIT_AND_FIX_PLAN.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/LAYOUT_AUDIT_2026-03-20.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/DESIGN_ELEVATION_PLAN.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/REVEAL_MODAL_RESTORATION_PLAN.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/CANONICAL_RESET_PLAN_2026-03-19.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/CLEANUP_CANDIDATES_2026-03-19.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/REFACTORING_DEPENDENCY_MAP.md`

## Notes On Parallel Refactor Docs

- `docs/GAMEPLAY_MODULES_1_2_PLAYBOOK.md` and `docs/GAMEPLAY_QUICK_REFERENCE.md` are the current repo-aligned versions.
- `docs/MODULES_1_2_EXTRACTION_PLAYBOOK.md` and `docs/CODEX_QUICK_REFERENCE.md` are still useful, but parts of them describe target module names such as `app-word-helpers.js`, `app-score-tracking.js`, and `app-input-validators.js` that are not yet the checked-in runtime shape. Treat them as tactical idea banks, not exact source-of-truth instructions.

## Practical Rule

If two docs disagree, trust this order:

1. `README.md`
2. `QUICK_START.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/SHIP_AND_DEBUG_CHECKLIST.md`
5. The code and scripts themselves
6. Historical summaries

## Current Word Quest Note

- If any doc still describes `js/app-main.js` as roughly 18k lines, treat that number as stale.
- The current checked-in reality is:
  - `js/app.js` about 184 lines
  - `js/word-quest-runtime.js` about 4,291 lines
- The current work is no longer “start the split.” It is “keep the extracted runtime clean, fix init-order regressions, and continue reducing `js/word-quest-runtime.js` where the boundary is safe.”
