/**
 * app-challenge-utils.js
 * Small Deep Dive utility helpers with no orchestration ownership.
 */

function createChallengeUtilsModule(deps) {
  const {
    clearIntervalRef = clearInterval,
    clearTimeoutRef = clearTimeout,
    el = (id) => document.getElementById(id)
  } = deps || {};

  function setChallengeFeedback(message, tone = 'default') {
    const node = el('challenge-live-feedback');
    if (!node) return;
    const text = String(message || '').trim();
    node.textContent = text;
    node.classList.toggle('hidden', !text);
    node.classList.toggle('is-good', tone === 'good');
    node.classList.toggle('is-warn', tone === 'warn');
  }

  function shuffleList(values) {
    const list = Array.isArray(values) ? [...values] : [];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function pickRandom(items) {
    if (!Array.isArray(items) || !items.length) return '';
    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }

  function clearChallengeSprintTimer(runtime = {}) {
    const sprintTimer = Number(runtime.getChallengeSprintTimer?.() || 0);
    if (sprintTimer) {
      clearIntervalRef(sprintTimer);
      runtime.setChallengeSprintTimer?.(0);
    }
    const pacingTimer = Number(runtime.getChallengePacingTimer?.() || 0);
    if (pacingTimer) {
      clearTimeoutRef(pacingTimer);
      runtime.setChallengePacingTimer?.(0);
    }
  }

  function clearChallengePacingTimer(runtime = {}) {
    const pacingTimer = Number(runtime.getChallengePacingTimer?.() || 0);
    if (!pacingTimer) return;
    clearTimeoutRef(pacingTimer);
    runtime.setChallengePacingTimer?.(0);
  }

  return Object.freeze({
    clearChallengePacingTimer,
    clearChallengeSprintTimer,
    pickRandom,
    setChallengeFeedback,
    shuffleList
  });
}

window.createChallengeUtilsModule = createChallengeUtilsModule;
