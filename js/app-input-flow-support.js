/**
 * app-input-flow-support.js
 * Gameplay input helpers that stay adjacent to handleKey without owning orchestration.
 */

function createInputFlowSupportModule(deps) {
  const {
    WQGame = null,
    WQUI = null
  } = deps || {};

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

  return Object.freeze({
    handleInputUnit,
    insertSequenceIntoGuess,
    isEditableTarget
  });
}

window.createInputFlowSupportModule = createInputFlowSupportModule;
