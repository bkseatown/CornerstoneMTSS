# Module 5 Extraction Playbook

**Status:** Ready for implementation after Modules 1-4 are extracted and verified

**Estimated effort:** 3-4 hours (Phase 1: state queries + reveal helpers)

---

## Phase 1: State Queries & Reveal Helpers (LOW RISK)

These are pure functions with zero DOM side effects. Safest to extract first.

### Step 1: Extract `getActiveMaxGuesses()`

**Current location:** app-main.js, ~line 16000

**Function:**
```javascript
function getActiveMaxGuesses() {
  const stateMax = Number(WQGame.getState?.()?.maxGuesses || 0);
  const prefMax = Number.parseInt(_el('s-guesses')?.value || DEFAULT_PREFS.guesses, 10);
  return Math.max(1, Number.isFinite(stateMax) && stateMax > 0
    ? stateMax
    : Number.isFinite(prefMax) && prefMax > 0
      ? prefMax
      : 6);
}
```

**Create new file:** `js/app-game-flow-queries.js`

**Copy to new file:**
```javascript
/**
 * app-game-flow-queries.js
 * Game flow state queries (Module 5, Phase 1)
 */

// Import dependency
// Assumes WQGame is available globally (TODO: pass as param after Module 1 extracted)

export function getActiveMaxGuesses(defaultGuesses = 6) {
  const stateMax = Number(window.WQGame?.getState?.()?.maxGuesses || 0);
  // TODO: After Module 2 extracted, get prefMax from imported prefs module
  const prefMax = Number.parseInt(
    document.getElementById('s-guesses')?.value || defaultGuesses,
    10
  );
  return Math.max(
    1,
    Number.isFinite(stateMax) && stateMax > 0
      ? stateMax
      : Number.isFinite(prefMax) && prefMax > 0
        ? prefMax
        : defaultGuesses
  );
}
```

**Update app-main.js:**
- Import at top: `import { getActiveMaxGuesses } from './app-game-flow-queries.js';`
- Replace function definition with import
- Keep all call sites the same

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Play a round, check max guesses displayed correctly
- [ ] Change guesses in settings, verify it updates board

---

### Step 2: Extract `shouldIncludeFunInMeaning()`

**Current location:** app-main.js, ~line 15800

**Function:**
```javascript
function shouldIncludeFunInMeaning() {
  const toggle = _el('s-meaning-fun-link');
  if (toggle) return !!toggle.checked;
  return (prefs.meaningPlusFun || DEFAULT_PREFS.meaningPlusFun) === 'on';
}
```

**Add to:** `js/app-game-flow-queries.js`

```javascript
export function shouldIncludeFunInMeaning(preferences = {}) {
  const toggle = document.getElementById('s-meaning-fun-link');
  if (toggle) return !!toggle.checked;
  // TODO: After Module 2 extracted, import preferences module
  const meaningPlusFun = preferences.meaningPlusFun || 'on'; // fallback
  return meaningPlusFun === 'on';
}
```

**Update app-main.js:**
- Add to import: `import { getActiveMaxGuesses, shouldIncludeFunInMeaning } from './app-game-flow-queries.js';`
- Remove function definition
- Update all call sites

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Open reveal modal with "fun" enabled, verify it appears
- [ ] Toggle "fun" in settings, verify reveal text changes

---

### Step 3: Extract `getRevealPacingPreset()`

**Current location:** app-main.js, ~line 15600

**Function:**
```javascript
function getRevealPacingPreset() {
  const mode = getRevealPacingMode();
  return REVEAL_PACING_PRESETS[mode] || REVEAL_PACING_PRESETS.guided;
}

// Also need to find: getRevealPacingMode() and REVEAL_PACING_PRESETS
```

**Search for dependencies:**
```bash
grep -n "getRevealPacingMode\|REVEAL_PACING_PRESETS" js/app-main.js
```

**Add to:** `js/app-game-flow-queries.js`

```javascript
// TODO: Extract REVEAL_PACING_PRESETS constant from app-main.js
// const REVEAL_PACING_PRESETS = { ... };

export function getRevealPacingPreset(mode = 'guided', presets = {}) {
  // TODO: After preferences module extracted, import getRevealPacingMode
  // const mode = getRevealPacingMode();
  const defaultPresets = {
    instant: { delay: 0, countdownMs: 0 },
    guided: { delay: 2000, countdownMs: 3000 },
    extended: { delay: 4000, countdownMs: 6000 }
  };
  const allPresets = { ...defaultPresets, ...presets };
  return allPresets[mode] || allPresets.guided;
}
```

**Update app-main.js:**
- Add to import
- Extract REVEAL_PACING_PRESETS constant to new file or leave in app-main for now
- Remove function definition
- Update call sites

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Change reveal pacing in settings, verify timing changes in reveal modal

---

### Step 4: Extract `getRevealFeedbackCopy()`

**Current location:** app-main.js, ~line 15500

**Function:**
```javascript
function getRevealFeedbackCopy(result) {
  return revealText?.getRevealFeedbackCopy?.(result, {
    lossToasts: REVEAL_LOSS_TOASTS,
    maxGuesses: getActiveMaxGuesses(),
    pickRandom,
    winToasts: REVEAL_WIN_TOASTS
  }) || { lead: 'Keep going.', coach: '' };
}
```

**Add to:** `js/app-game-flow-queries.js`

```javascript
export function getRevealFeedbackCopy(
  result = {},
  revealTextModule = window.revealText,
  options = {}
) {
  const {
    lossToasts = [],
    winToasts = [],
    maxGuesses = 6,
    pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
  } = options;

  if (!revealTextModule?.getRevealFeedbackCopy) {
    return { lead: 'Keep going.', coach: '' };
  }

  return revealTextModule.getRevealFeedbackCopy(result, {
    lossToasts,
    maxGuesses,
    pickRandom,
    winToasts
  });
}
```

**Update app-main.js:**
- Add to import
- Remove function definition
- Update call sites to pass options:
  ```javascript
  // OLD:
  const feedback = getRevealFeedbackCopy(result);

  // NEW:
  const feedback = getRevealFeedbackCopy(result, window.revealText, {
    lossToasts: REVEAL_LOSS_TOASTS,
    winToasts: REVEAL_WIN_TOASTS,
    maxGuesses: getActiveMaxGuesses(),
    pickRandom
  });
  ```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Win a round, check feedback text appears
- [ ] Lose a round, check loss feedback appears
- [ ] Verify feedback changes based on game outcome

---

### Step 5: Extract DOM Helpers (`syncRevealMeaningHighlight`, `syncRevealReadCue`)

**Current location:** app-main.js, ~line 15400

**Functions:**
```javascript
function syncRevealMeaningHighlight(nextEntry) {
  const wrap = _el('modal-meaning-highlight');
  const lineEl = _el('modal-meaning-highlight-line');
  if (!wrap || !lineEl) return;
  // ... setup code ...
}

function syncRevealReadCue(nextEntry) {
  const cueEl = _el('modal-read-cue');
  if (!cueEl) return;
  // ... setup code ...
}
```

**Create new file:** `js/app-game-flow-ui.js`

```javascript
/**
 * app-game-flow-ui.js
 * UI update helpers for game flow (Module 5, Phase 1)
 */

export function syncRevealMeaningHighlight(
  nextEntry = {},
  revealTextModule = window.revealText,
  shouldIncludeFun = false
) {
  const wrap = document.getElementById('modal-meaning-highlight');
  const lineEl = document.getElementById('modal-meaning-highlight-line');
  if (!wrap || !lineEl) return;

  const meaning = revealTextModule?.getRevealMeaningPayload?.(
    nextEntry,
    shouldIncludeFun
  ) || {
    definition: '',
    funAddOn: '',
    line: '',
    readAll: ''
  };

  lineEl.textContent = meaning.line;
  wrap.classList.toggle('hidden', !meaning.line);

  // Also sync the read cue
  syncRevealReadCue(nextEntry, revealTextModule);
}

export function syncRevealReadCue(
  nextEntry = {},
  revealTextModule = window.revealText
) {
  const cueEl = document.getElementById('modal-read-cue');
  if (!cueEl) return;

  const sourceText = String(nextEntry?.sentence || '').trim() ||
    String(nextEntry?.text_to_read_definition || '').trim();
  const cue = revealTextModule?.buildRevealReadCue?.(sourceText) || '';

  cueEl.textContent = cue || '';
  cueEl.classList.toggle('hidden', !cue);
}
```

**Update app-main.js:**
- Import: `import { syncRevealMeaningHighlight, syncRevealReadCue } from './app-game-flow-ui.js';`
- Remove function definitions
- Update call sites:
  ```javascript
  // OLD:
  syncRevealMeaningHighlight(nextEntry);

  // NEW:
  syncRevealMeaningHighlight(nextEntry, window.revealText, shouldIncludeFunInMeaning());
  ```

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Open reveal modal, check meaning highlight appears
- [ ] Check phonetic read cue displays correctly

---

### Step 6: Extract `clearRevealAutoAdvanceTimer()`

**Current location:** app-main.js, ~line 15300

**Function:**
```javascript
function clearRevealAutoAdvanceTimer() {
  if (revealAutoAdvanceTimer) {
    clearTimeout(revealAutoAdvanceTimer);
    revealAutoAdvanceTimer = 0;
  }
  if (revealAutoCountdownTimer) {
    clearInterval(revealAutoCountdownTimer);
    revealAutoCountdownTimer = 0;
  }
  revealAutoAdvanceEndsAt = 0;
  _el('modal-auto-next-banner')?.classList.add('hidden');
}
```

**Add to:** `js/app-game-flow-ui.js`

```javascript
export function clearRevealAutoAdvanceTimer(
  timerRefs = {}  // { revealAutoAdvanceTimer, revealAutoCountdownTimer }
) {
  const { revealAutoAdvanceTimer, revealAutoCountdownTimer } = timerRefs;

  if (revealAutoAdvanceTimer) {
    clearTimeout(revealAutoAdvanceTimer);
  }
  if (revealAutoCountdownTimer) {
    clearInterval(revealAutoCountdownTimer);
  }

  const banner = document.getElementById('modal-auto-next-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}
```

**Update app-main.js:**
- Add to import from `app-game-flow-ui.js`
- Remove function definition
- Update all call sites to pass timer references if needed (consider refactoring to use global refs for now)

**Verify:**
- [ ] `npm run guard:runtime` passes
- [ ] Auto-advance timer starts and stops correctly
- [ ] Countdown banner appears/disappears

---

## Phase 1 Completion Checklist

- [ ] `app-game-flow-queries.js` created with all 4 query functions
- [ ] `app-game-flow-ui.js` created with all 3 UI functions
- [ ] All functions imported in app-main.js
- [ ] All call sites updated
- [ ] `npm run guard:runtime` passes
- [ ] Full game round tested (win, loss, reveal, auto-advance)
- [ ] All settings changes reflected in gameplay
- [ ] No regressions in other features

**Estimated time:** 1.5-2 hours

---

## Phase 2: Timer Management (MEDIUM RISK)

After Phase 1 passes, consider extracting `scheduleRevealAutoAdvance()` but keep it in app-main.js for now because it depends on `voiceIsRecording` flag.

---

## Phase 3: Core Orchestration (HIGH RISK - WAIT)

Do NOT extract `newGame()` or round orchestration until Modules 1-4 are fully integrated and tested with actual gameplay.

---

## Rollback Procedures

### If `npm run guard:runtime` fails:

1. **Check what failed:**
   ```bash
   npm run guard:runtime 2>&1 | grep -A5 "FAIL\|Error"
   ```

2. **Typical failures:**
   - Missing import: Add to app-main.js imports
   - Function call signature changed: Update all call sites
   - DOM element not found: Verify element IDs match (careful: `_el()` vs `getElementById()`)

3. **Rollback:**
   ```bash
   # Revert last commit
   git reset --hard HEAD~1
   # OR: manually remove new files and restore functions to app-main.js
   ```

### If round doesn't advance after reveal:

1. Check that `scheduleRevealAutoAdvance()` is still in app-main.js
2. Check that `revealAutoAdvanceTimer` variable is still accessible to it
3. Check that `voiceIsRecording` flag is being read correctly

### If feedback text doesn't appear:

1. Verify `revealText` module is loaded before `app-main.js`
2. Check that `getRevealFeedbackCopy()` is passing `window.revealText` correctly
3. Verify reveal modal HTML elements exist in DOM

---

## Testing Commands

After each extraction:

```bash
# Run quality checks
npm run guard:runtime

# Run specific tests if available
npm run test 2>&1 | grep -E "PASS|FAIL"

# Manual browser test (if dev server)
# 1. Load http://127.0.0.1:4174/word-quest.html
# 2. Play a full round (win + reveal)
# 3. Check auto-advance to next word
# 4. Repeat with loss
# 5. Toggle settings (max guesses, feedback style, etc)
```

---

## Notes for Codex

- Module 5 extraction is **lower priority** than Modules 1-4
- Only extract Phase 1 (queries + helpers) for now
- Phase 2 & 3 wait for Module 3/4 integration
- Keep `newGame()` and round orchestration in app-main.js until later phases
- Track all `emitTelemetry()` calls — don't move them yet

---

*Last updated: 2026-03-20 by Claude during autonomous Module 5 analysis*
