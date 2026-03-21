/**
 * app-input-constraints.js
 * Team-label and smart-key-lock helpers for the active round surface.
 */

function createInputConstraintsModule(deps) {
  const {
    defaultPrefs = {},
    demoMode = false,
    demoUi = null,
    deriveWordState = () => ({ correctPositions: {}, usedLetters: {} }),
    documentRef = document,
    el = () => null,
    getDemoState = () => ({}),
    getClassroomTeamIndex = () => 0,
    getPrefs = () => ({}),
    getState = () => ({}),
    positionDemoLaunchButton = () => {},
    refreshStarterSuggestionsIfOpen = () => {},
    normalizeTeamCount = (value) => value,
    normalizeTeamSet = (value) => value,
    normalizeTurnTimer = (value) => value,
    showToast = () => {},
    updateCurrentRow = () => {},
    updateNextActionLine = () => {},
    teamLabelSets = Object.freeze({}),
    WQGame = null,
    WQUI = null
  } = deps || {};

  let blockedLetterToastAt = 0;

  function resolveTeamLabelSets() {
    return typeof teamLabelSets === 'function' ? (teamLabelSets() || {}) : teamLabelSets;
  }

  function getTeamCount() {
    const prefs = getPrefs();
    return Number.parseInt(
      normalizeTeamCount(el('s-team-count')?.value || prefs.teamCount || defaultPrefs.teamCount),
      10
    ) || 2;
  }

  function getTurnTimerSeconds() {
    const prefs = getPrefs();
    const mode = normalizeTurnTimer(el('s-turn-timer')?.value || prefs.turnTimer || defaultPrefs.turnTimer);
    return mode === 'off' ? 0 : (Number.parseInt(mode, 10) || 0);
  }

  function getTeamSet() {
    const prefs = getPrefs();
    return normalizeTeamSet(el('s-team-set')?.value || prefs.teamSet || defaultPrefs.teamSet);
  }

  function getCurrentTeamLabel() {
    const count = getTeamCount();
    const index = Math.max(0, Math.min(count - 1, Number(getClassroomTeamIndex()) || 0));
    const liveTeamLabelSets = resolveTeamLabelSets();
    const labels = liveTeamLabelSets[getTeamSet()] || liveTeamLabelSets.mascots || [];
    return labels[index] || `Team ${index + 1}`;
  }

  function formatTurnClock(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function isKnownAbsentLetter(letter) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return false;
    const keyEl = documentRef.querySelector(`#keyboard .key[data-key="${normalized}"]`);
    if (!keyEl) return false;
    return keyEl.classList.contains('absent')
      && !keyEl.classList.contains('present')
      && !keyEl.classList.contains('correct');
  }

  function pulseBlockedLetterKey(letter) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return;
    const keyEl = documentRef.querySelector(`#keyboard .key[data-key="${normalized}"]`);
    if (!keyEl) return;
    keyEl.classList.remove('dupe-pulse');
    void keyEl.offsetWidth;
    keyEl.classList.add('dupe-pulse');
    setTimeout(() => keyEl.classList.remove('dupe-pulse'), 220);
  }

  function maybeShowBlockedLetterToast(letter) {
    const now = Date.now();
    if (now - blockedLetterToastAt < 700) return;
    blockedLetterToastAt = now;
    const safeLetter = String(letter || '').toUpperCase().slice(0, 1);
    showToast(`Nice try. We already tested ${safeLetter}. Pick a different letter.`);
  }

  function getLiveWordState() {
    return deriveWordState(getState() || {});
  }

  function isSmartKeyLockEnabled() {
    const prefs = getPrefs();
    return String(el('s-smart-key-lock')?.value || prefs.smartKeyLock || defaultPrefs.smartKeyLock).toLowerCase() === 'on';
  }

  function validateLetterEntry(letter, state, wordState, options = {}) {
    const normalized = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(normalized)) return { ok: true };
    if (!options.smartKeyLockEnabled) return { ok: true };
    const liveState = state || {};
    const liveWordState = wordState || {};
    const slot = Math.max(0, Number(liveState?.guess?.length || 0));
    const requiredAtSlot = liveWordState.correctPositions?.[slot];
    if (requiredAtSlot && requiredAtSlot !== normalized) {
      return { ok: false, reason: 'locked_position', requiredLetter: requiredAtSlot };
    }
    if (liveWordState.absentLetters?.has?.(normalized)) {
      return { ok: false, reason: 'absent_letter' };
    }
    const maxCount = Number(liveWordState.maxCounts?.[normalized]);
    if (Number.isFinite(maxCount)) {
      const currentCount = String(liveState?.guess || '').split('').filter((ch) => ch === normalized).length;
      if ((currentCount + 1) > maxCount) {
        return { ok: false, reason: 'max_count', maxCount };
      }
    }
    return { ok: true };
  }

  function checkLetterEntryConstraints(letter, state, wordState) {
    const liveState = state || (getState() || {});
    const liveWordState = wordState || deriveWordState(liveState);
    return validateLetterEntry(letter, liveState, liveWordState, {
      smartKeyLockEnabled: isSmartKeyLockEnabled()
    });
  }

  function maybeShowConstraintToast(check, letter) {
    const now = Date.now();
    if (now - blockedLetterToastAt < 700) return;
    blockedLetterToastAt = now;
    const safeLetter = String(letter || '').toUpperCase().slice(0, 1);
    if (check?.reason === 'locked_position') {
      const must = String(check.requiredLetter || '').toUpperCase().slice(0, 1);
      showToast(`Slot is locked. Use ${must} in this position.`);
      return;
    }
    if (check?.reason === 'max_count') {
      const maxCount = Math.max(0, Number(check.maxCount) || 0);
      showToast(`${safeLetter} is already used ${maxCount} time${maxCount === 1 ? '' : 's'} here.`);
      return;
    }
    showToast(`Nice try. We already tested ${safeLetter}. Pick a different letter.`);
  }

  function syncKeyboardInputLocks(state, wordState) {
    const keyboard = el('keyboard');
    if (!keyboard) return;
    const liveState = state || (getState() || {});
    const liveWordState = wordState || deriveWordState(liveState);
    const slot = Math.max(0, Number(liveState?.guess?.length || 0));
    const requiredAtSlot = liveWordState.correctPositions?.[slot] || '';
    keyboard.querySelectorAll('.key[data-key]').forEach((keyEl) => {
      const raw = String(keyEl.getAttribute('data-key') || '').toLowerCase();
      if (!/^[a-z]$/.test(raw)) {
        keyEl.removeAttribute('disabled');
        keyEl.setAttribute('aria-disabled', 'false');
        keyEl.classList.remove('is-blocked');
        return;
      }
      const check = checkLetterEntryConstraints(raw, liveState, liveWordState);
      const blocked = !check.ok;
      keyEl.classList.toggle('is-blocked', blocked);
      keyEl.removeAttribute('disabled');
      keyEl.setAttribute('aria-disabled', 'false');
      if (requiredAtSlot && raw === requiredAtSlot) keyEl.classList.add('in-play');
      const status = String(liveWordState.usedLetters?.[raw] || '').toLowerCase();
      if (status === 'correct') {
        keyEl.classList.remove('present', 'absent');
        keyEl.classList.add('correct');
      } else if (status === 'present') {
        if (!keyEl.classList.contains('correct')) {
          keyEl.classList.remove('absent');
          keyEl.classList.add('present');
        }
      } else if (status === 'absent') {
        if (!keyEl.classList.contains('correct') && !keyEl.classList.contains('present')) {
          keyEl.classList.add('absent');
        }
      }
    });
  }

  function insertSequenceIntoGuess(sequence) {
    const letters = String(sequence || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!letters) return;
    const state = WQGame?.getState?.();
    if (!state || state.gameOver) return;
    const remaining = Math.max(0, state.wordLength - state.guess.length);
    if (!remaining) return;
    const clipped = letters.slice(0, remaining);
    if (!clipped) return;
    for (const letter of clipped) WQGame.addLetter(letter);
    const nextState = WQGame.getState();
    WQUI?.updateCurrentRow?.(nextState.guess, nextState.wordLength, nextState.guesses.length);
  }

  function handleInputUnit(rawUnit, handleKey) {
    const unit = String(rawUnit || '');
    if (!unit) return;
    if (unit === 'Enter') {
      handleKey('Enter');
      return;
    }
    if (unit === 'Backspace' || unit === '⌫') {
      handleKey('Backspace');
      return;
    }
    if (/^[a-zA-Z]$/.test(unit)) {
      handleKey(unit);
      return;
    }
    if (/^[a-z]{2,4}$/i.test(unit)) {
      insertSequenceIntoGuess(unit);
    }
  }

  function isEditableTarget(target) {
    const node = target instanceof Element ? target : null;
    if (!node) return false;
    if (node instanceof HTMLElement && node.isContentEditable) return true;
    return Boolean(node.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function handleBackspaceKey() {
    WQGame?.deleteLetter?.();
    const nextState = WQGame?.getState?.() || {};
    updateCurrentRow(nextState.guess, nextState.wordLength, nextState.guesses.length);
    syncKeyboardInputLocks(nextState);
    refreshStarterSuggestionsIfOpen();
    updateNextActionLine();
    if (!demoMode) positionDemoLaunchButton();
  }

  function handleLetterKey(key) {
    const normalizedLetter = String(key || '').toLowerCase();
    const liveState = WQGame?.getState?.() || {};
    const liveWordState = deriveWordState(liveState);
    const check = checkLetterEntryConstraints(normalizedLetter, liveState, liveWordState);
    if (!check.ok) {
      pulseBlockedLetterKey(normalizedLetter);
      maybeShowConstraintToast(check, normalizedLetter);
      updateNextActionLine();
      return false;
    }
    WQGame?.addLetter?.(key);
    const nextState = WQGame?.getState?.() || {};
    updateCurrentRow(nextState.guess, nextState.wordLength, nextState.guesses.length);
    syncKeyboardInputLocks(nextState, liveWordState);
    refreshStarterSuggestionsIfOpen();
    updateNextActionLine();
    if (!demoMode) positionDemoLaunchButton();
    return true;
  }

  return {
    checkLetterEntryConstraints,
    formatTurnClock,
    getCurrentTeamLabel,
    getLiveWordState,
    getTeamCount,
    getTeamSet,
    getTurnTimerSeconds,
    handleInputUnit,
    handleBackspaceKey,
    handleLetterKey,
    isKnownAbsentLetter,
    isEditableTarget,
    isSmartKeyLockEnabled,
    insertSequenceIntoGuess,
    maybeShowBlockedLetterToast,
    maybeShowConstraintToast,
    pulseBlockedLetterKey,
    syncKeyboardInputLocks
  };
}

window.createInputConstraintsModule = createInputConstraintsModule;
