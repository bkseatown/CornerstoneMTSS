/**
 * js/modules/index.js — Vite build entry point
 *
 * Re-exports all ES modules so Vite can bundle them into js/dist/wq-modules.js.
 * Import from here in any new <script type="module"> code.
 *
 * Usage in HTML:
 *   <script type="module">
 *     import { WQData, WQGame, WQSelector } from './js/dist/wq-modules.js';
 *     await WQData.load();
 *     const word = WQSelector.getRandomWord({ grade: 4, proficiency: 3 });
 *   </script>
 *
 * The legacy IIFE versions (js/data.js, js/game.js, js/wordEngine/selector.js)
 * remain loaded as classic <script> tags for backward compatibility with app.js
 * and all legacy code. Both systems coexist safely during the transition.
 */

export { default as WQData }     from './data.js';
export { default as WQGame }     from './game.js';
export { default as WQSelector } from './wordEngine/selector.js';
