# Quick Start — Cornerstone MTSS Platform

**Current working guidance for the checked-in repo.**

## Current Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the local static server
python3 -m http.server 4173

# 3. Open browser
# http://127.0.0.1:4173/index.html
```

## Environment Configuration

```bash
# Optional: copy templates if you need external integrations or production config
cp .env.example .env
cp .env.production.example .env.production
```

## How The Repo Runs Today

- The current app is served directly from the repo root as a static-first front end.
- Playwright defaults to `http://127.0.0.1:4173`, matching the checked-in config.
- The repo includes `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/server.js`, but the older `server/` directory and database bootstrap scripts referenced by historical docs are not part of the current working structure.

## Active Platform Areas

| Area | Purpose | Key Files |
|---|---|---|
| Landing and bootstrap | Main app entry and runtime wiring | `index.html`, `js/app.js`, `word-quest.html` |
| Teacher workflows | My Workspace surfaces | `my-workspace.html`, `my-workspace.js`, `js/dashboard/` |
| Specialist hub | Specialist workflow and case context | `specialist-hub.html`, `specialist-hub.js`, `js/teacher/` |
| Learning surfaces | Specialist-launched activity pages | `word-quest.html`, `reading-lab.html`, `sentence-studio.html`, `writing-studio.html`, `typing-quest.html`, `precision-play.html`, `number-lab.html`, `number-lab/index.html` |
| Theming and accessibility | Tokens, contrast, modes, navigation | `style/`, `js/theme-registry.js`, `js/theme-nav.js` |

## Canonical Surface Names

- Main Landing Page: `index.html`
- Specialist Hub: `specialist-hub.html`
- My Students: `my-students.html`
- Student Profile: `student-profile.html`
- My Workspace: `my-workspace.html`
- My Activities: `my-activities.html`

Legacy pages such as `teacher-hub-v2.html`, `reports.html`, `case-management.html`, `game-platform.html`, `sentence-surgery.html`, and `numeracy.html` are now compatibility shims and should not be used as the primary names in new work.

The active naming cleanup is complete at the platform/runtime layer:
- canonical surfaces and activity routes are live
- active launcher/runtime IDs use the canonical names
- active evidence/reporting writes use canonical activity names
- active Word Quest page-mode, export, and telemetry names now write `word-quest`

Remaining old-name references are compatibility aliases or deeper internal taxonomy/data domains.

## High-Value Commands

### Runtime Smoke

```bash
npm run guard:runtime
```

### HUD Contract

```bash
npm run hud:check
```

### Accessibility Audit

```bash
npm run audit:a11y
```

### Visual Regression

```bash
npm run test:visual:regression
```

### Release Safety Checks

```bash
npm run release:check
```

## Deployment

### GitHub Pages

```bash
git push origin main
```

Live target:

- `https://bkseatown.github.io/CornerstoneMTSS`

### Live Verification

```bash
npm run check:live
npm run publish:check
```

## Troubleshooting

### "The page looks stale"

```bash
# Hard refresh after restarting the local server
# Cmd+Shift+R
```

### "Playwright checks failed"

```bash
npm run guard:runtime
npm run hud:check
npm run release:check
```

### "I need current project context"

Read these first:

- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/DOCS_INDEX.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PROJECT_STATUS.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/SHIP_AND_DEBUG_CHECKLIST.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/progress.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/README.md`
