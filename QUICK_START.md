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
| Teacher workflows | Reports and dashboard surfaces | `reports.html`, `teacher-dashboard.js`, `js/dashboard/` |
| Teacher hub | Specialist workflow and case context | `teacher-hub-v2.html`, `teacher-hub-v2.js`, `js/teacher/` |
| Learning surfaces | Student-facing activity pages | `reading-lab.html`, `sentence-surgery.html`, `writing-studio.html`, `precision-play.html` |
| Theming and accessibility | Tokens, contrast, modes, navigation | `style/`, `js/theme-registry.js`, `js/theme-nav.js` |

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
