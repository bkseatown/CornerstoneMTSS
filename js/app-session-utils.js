/**
 * app-session-utils.js
 * Small session/report utilities that do not own workflow orchestration.
 */

function createSessionUtilsModule(deps) {
  const {
    documentRef = document,
    gameplaySupport = null,
    navigatorRef = navigator,
    showToast = () => {}
  } = deps || {};

  function buildProbeSummary(source) {
    const roundsDone = Math.max(0, Number(source?.roundsDone) || 0);
    const wins = Math.max(0, Number(source?.wins) || 0);
    const totalGuesses = Math.max(0, Number(source?.totalGuesses) || 0);
    const totalDurationMs = Math.max(0, Number(source?.totalDurationMs) || 0);
    const hintRounds = Math.max(0, Number(source?.hintRounds) || 0);
    const accuracy = roundsDone ? `${Math.round((wins / roundsDone) * 100)}%` : '--';
    const avgGuesses = roundsDone ? (totalGuesses / roundsDone).toFixed(1) : '--';
    const avgTime = roundsDone ? (gameplaySupport?.formatDurationLabel?.(totalDurationMs / roundsDone) || '0s') : '--';
    const hintRate = roundsDone ? `${Math.round((hintRounds / roundsDone) * 100)}%` : '--';
    return { roundsDone, wins, accuracy, avgGuesses, avgTime, hintRate };
  }

  async function copyTextToClipboard(text, successMessage, failureMessage) {
    const value = String(text || '').trim();
    if (!value) {
      showToast(failureMessage);
      return;
    }
    try {
      if (navigatorRef.clipboard?.writeText) {
        await navigatorRef.clipboard.writeText(value);
        showToast(successMessage);
        return;
      }
    } catch {}
    const fallback = documentRef.createElement('textarea');
    fallback.value = value;
    fallback.setAttribute('readonly', 'true');
    fallback.style.position = 'fixed';
    fallback.style.top = '-9999px';
    documentRef.body.appendChild(fallback);
    fallback.select();
    let copied = false;
    try { copied = documentRef.execCommand('copy'); } catch { copied = false; }
    fallback.remove();
    showToast(copied ? successMessage : failureMessage);
  }

  return Object.freeze({
    buildProbeSummary,
    copyTextToClipboard
  });
}

window.createSessionUtilsModule = createSessionUtilsModule;
