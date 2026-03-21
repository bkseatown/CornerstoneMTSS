/**
 * app-reveal-timing-support.js
 * Small reveal timing helpers that do not own scheduler orchestration.
 */

function createRevealTimingSupportModule(deps) {
  const {
    clearIntervalRef = clearInterval,
    clearTimeoutRef = clearTimeout,
    el = (id) => document.getElementById(id),
    getRevealAutoNextSeconds = () => 0,
    getRevealAutoAdvanceEndsAt = () => 0,
    getVoiceIsRecording = () => false,
    getVoicePracticeMode = () => 'optional',
    getRevealAutoAdvanceTimer = () => 0,
    getRevealAutoCountdownTimer = () => 0,
    onAdvance = () => {},
    setRevealAutoAdvanceEndsAt = () => {},
    setRevealAutoAdvanceTimer = () => {},
    setRevealAutoCountdownTimer = () => {},
    setTimeoutRef = setTimeout
  } = deps || {};

  function clearRevealAutoAdvanceTimer() {
    const advanceTimer = getRevealAutoAdvanceTimer();
    if (advanceTimer) {
      clearTimeoutRef(advanceTimer);
      setRevealAutoAdvanceTimer(0);
    }
    const countdownTimer = getRevealAutoCountdownTimer();
    if (countdownTimer) {
      clearIntervalRef(countdownTimer);
      setRevealAutoCountdownTimer(0);
    }
    setRevealAutoAdvanceEndsAt(0);
    el('modal-auto-next-banner')?.classList.add('hidden');
  }

  function showModalAutoNextBanner(message) {
    const banner = el('modal-auto-next-banner');
    const label = el('modal-auto-next-countdown');
    if (!banner || !label) return;
    label.textContent = message;
    banner.classList.remove('hidden');
  }

  function waitMs(ms) {
    const delay = Math.max(0, Number(ms) || 0);
    return new Promise((resolve) => setTimeoutRef(resolve, delay));
  }

  function scheduleRevealAutoAdvance() {
    clearRevealAutoAdvanceTimer();
    const seconds = getRevealAutoNextSeconds();
    if (seconds <= 0) return;
    if (getVoicePracticeMode() === 'required') return;
    if (el('modal-overlay')?.classList.contains('hidden')) return;
    setRevealAutoAdvanceEndsAt(Date.now() + (seconds * 1000));

    const tickCountdown = () => {
      if (el('modal-overlay')?.classList.contains('hidden')) {
        clearRevealAutoAdvanceTimer();
        return;
      }
      if (getVoiceIsRecording()) {
        showModalAutoNextBanner('Auto next waits for recording to finish...');
        return;
      }
      const endsAt = Number(getRevealAutoAdvanceEndsAt() || 0);
      const safeRemaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      showModalAutoNextBanner(`Next word in ${safeRemaining}s`);
    };
    tickCountdown();
    setRevealAutoCountdownTimer(setInterval(tickCountdown, 250));

    const tryAdvance = () => {
      if (el('modal-overlay')?.classList.contains('hidden')) {
        clearRevealAutoAdvanceTimer();
        return;
      }
      if (getVoiceIsRecording()) {
        setRevealAutoAdvanceTimer(setTimeoutRef(tryAdvance, 900));
        return;
      }
      clearRevealAutoAdvanceTimer();
      onAdvance();
    };
    setRevealAutoAdvanceTimer(setTimeoutRef(tryAdvance, seconds * 1000));
  }

  return Object.freeze({
    clearRevealAutoAdvanceTimer,
    scheduleRevealAutoAdvance,
    showModalAutoNextBanner,
    waitMs
  });
}

window.createRevealTimingSupportModule = createRevealTimingSupportModule;
