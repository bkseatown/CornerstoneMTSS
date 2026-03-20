/**
 * app-input-validators.js
 * DOM-free gameplay input validation helpers.
 */

function createInputValidators() {
  function checkLetterEntryConstraints(letter, state, wordState, options = {}) {
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

  return {
    checkLetterEntryConstraints
  };
}
