# Edit Safety Zones

Use this before making changes.

## Green Zone (safe for routine updates)
- `data/curriculum-taxonomy.js`
- `data/assignment-schema.js`
- `js/features/teacher-assignments.js`
- `style/components.deep-dive-plus.css`
- Text copy in `index.html` labels/help text

These are usually low regression risk when edited carefully.

## Yellow Zone (medium risk)
- `style/components.css`
- `js/deep-dive-plus.js`
- Teacher Hub sections in `index.html`

These affect many screens or interactions, so always smoke test after changes.

## Red Zone (high risk)
- `js/app.js`
- `js/game.js`
- `js/data.js`
- script load order in `index.html`

These can break the whole app if changed incorrectly.

## Minimum checks after changes
1. Open app and confirm no console errors.
2. Start a normal game round.
3. Open Deep Dive and complete 1 station.
4. Open Teacher Hub and change curriculum target.
5. If groups/locks touched: switch active student and verify target applies.
