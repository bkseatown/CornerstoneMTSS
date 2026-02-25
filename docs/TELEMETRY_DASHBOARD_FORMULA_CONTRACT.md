# Telemetry Dashboard Formula Contract

This document locks the math contract for the three telemetry dashboards:
- Adoption
- Learning
- Reliability

Primary implementation lives in `js/app.js`:
- `buildAdoptionHealthMetrics()`
- `renderTelemetryDashboards()`

## Adoption Dashboard

Overall adoption score is a weighted average of available KPI percentages:

`overall = round(sum(metric_pct * metric_weight) / sum(metric_weight))`

KPI weights:
- Clarity: `1.10`
- ZPD Fit: `1.15`
- Setup Speed: `0.90`
- Lesson Fidelity: `1.05`
- Deep Dive Completion: `0.95`
- Reliability: `0.85`

Overall tone thresholds:
- Good: `>= 80`
- Warn: `>= 60` and `< 80`
- Bad: `< 60`

## Learning Dashboard

Learning score is the average of available components, converted to percentage:

`learning = round(mean([round_win_rate, deep_dive_completion]) * 100)`

Components:
- `round_win_rate = wins / round_completes`
- `deep_dive_completion = mean(completion_rate for deep dive completion rows)`

Learning tone thresholds:
- Good: `>= 80`
- Warn: `>= 60` and `< 80`
- Bad: `< 60`

## Reliability Dashboard

Reliability uses blocker-level error penalty:

`reliability = max(0, 100 - (blocker_count * 20))`

Blocker severities:
- `blocker`
- `critical`
- `fatal`

Reliability tone thresholds:
- Good: `blocker_count == 0`
- Warn: `blocker_count <= 2`
- Bad: `blocker_count > 2`

## Event Inputs

The dashboards rely on these telemetry event names:
- `wq_round_complete`
- `wq_funnel_deep_dive_completed`
- `wq_deep_dive_complete`
- `wq_error`
- Adoption support events:
  - `wq_round_start`
  - `wq_support_used`
  - `wq_hint_open`
  - `wq_hint_used`
  - `wq_clue_open`
  - `wq_coach_open`
  - `wq_teacher_hub_open`
  - `wq_target_apply`

Any formula or threshold changes must update this file and `scripts/check-telemetry-dashboard-contract.js` in the same PR.
