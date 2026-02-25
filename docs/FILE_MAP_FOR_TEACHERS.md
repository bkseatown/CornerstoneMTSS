# File Map For Teachers

This is a plain-English guide to where things live.

## If you want to change...
- **Curriculum lesson lists (UFLI, Fundations, Wilson, WIDA)**:
  - `data/curriculum-taxonomy.js`
- **Teacher group assignments + student target lock behavior**:
  - `js/features/teacher-assignments.js`
  - `js/app.js` (orchestration)
- **Deep Dive Plus (handwriting + tap-to-mark)**:
  - `js/deep-dive-plus.js`
  - `style/components.deep-dive-plus.css`
- **Teacher Hub layout/fields**:
  - `index.html`
- **How Teacher Hub looks (colors/spacing/buttons)**:
  - `style/components.css`
- **Word data and playable word loading**:
  - `js/data.js`
  - `data/words-inline.js`
- **Game rules / round logic / checking guesses**:
  - `js/game.js`
- **Main app behavior (wiring everything together)**:
  - `js/app.js`

## Friendly names for key files
- `index.html`: "Main page layout"
- `js/app.js`: "Main controller"
- `js/game.js`: "Game engine"
- `js/ui.js`: "UI helper layer"
- `js/features/teacher-assignments.js`: "Teacher groups + lock tool"
- `js/deep-dive-plus.js`: "Deep Dive extensions"
- `data/curriculum-taxonomy.js`: "Curriculum lesson maps"
- `style/components.css`: "Main styles"
- `style/components.deep-dive-plus.css`: "Deep Dive styles"

## Rule of thumb
- Change **data/taxonomy files** for content.
- Change **feature files** for behavior.
- Change **CSS files** for visuals.
- Avoid editing `js/app.js` unless needed.
