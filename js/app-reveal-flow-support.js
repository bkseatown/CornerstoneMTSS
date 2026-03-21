/**
 * app-reveal-flow-support.js
 * Reveal copy, narration gating, and meaning bundle helpers.
 */

function createRevealFlowSupportModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQAudio = null,
    WQUI = null,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getActiveMaxGuesses = () => 6,
    getRevealMeaningPayload = () => ({ definition: '', funAddOn: '', line: '', readAll: '' }),
    getRevealPacingMode = () => 'guided',
    getVoicePracticeMode = () => 'optional',
    isVoiceRecording = () => false,
    normalizeVoiceMode = (value) => value,
    pickRandom = () => '',
    prefs = {},
    revealLossToasts = [],
    revealPacingPresets = {},
    revealText = null,
    revealWinToasts = [],
    shouldIncludeFunInMeaning = () => false,
    voiceTakeCompleteRef = () => false
  } = deps || {};

  function shouldIncludeFunInMeaningRuntime() {
    const toggle = el('s-meaning-fun-link');
    if (toggle) return !!toggle.checked;
    return (prefs.meaningPlusFun || DEFAULT_PREFS.meaningPlusFun) === 'on';
  }

  function getRevealFeedbackCopy(result) {
    return revealText?.getRevealFeedbackCopy?.(result, {
      lossToasts: revealLossToasts,
      maxGuesses: getActiveMaxGuesses(),
      pickRandom,
      winToasts: revealWinToasts
    }) || { lead: 'Keep going.', coach: '' };
  }

  function getRevealPacingPreset() {
    const mode = getRevealPacingMode();
    return revealPacingPresets[mode] || revealPacingPresets.guided;
  }

  function showRevealWordToast(result) {
    if (!result) return;
    const solvedWord = String(result.word || '').trim().toUpperCase();
    if (!solvedWord) return;
    const feedback = getRevealFeedbackCopy(result);
    const lead = String(feedback?.lead || '').trim();
    const coach = String(feedback?.coach || '').trim();
    const shortDef = revealText?.trimToastDefinition?.(result?.entry?.definition) || '';
    const base = shortDef ? `${lead} ${solvedWord} - ${shortDef}` : `${lead} ${solvedWord}`;
    const message = coach ? `${base} ${coach}` : base;
    WQUI?.showToast?.(message, 3600);
  }

  function shouldNarrateReveal() {
    const mode = normalizeVoiceMode(el('s-voice')?.value || prefs.voice || DEFAULT_PREFS.voice);
    return mode !== 'off';
  }

  async function playMeaningWithFun(nextEntry) {
    if (!nextEntry) return;
    const meaning = getRevealMeaningPayload(nextEntry, shouldIncludeFunInMeaningRuntime()) || {
      definition: '',
      funAddOn: '',
      line: '',
      readAll: ''
    };
    if (!(meaning.definition || meaning.funAddOn)) return;

    if (WQAudio && typeof WQAudio.playMeaningBundle === 'function') {
      await WQAudio.playMeaningBundle(nextEntry, {
        includeFun: shouldIncludeFunInMeaningRuntime(),
        allowFallbackInRecorded: true,
        fallbackText: meaning.readAll
      });
      return;
    }

    await WQAudio?.playDef?.(nextEntry);
    if (!meaning.funAddOn) return;
    await WQAudio?.playFun?.(nextEntry);
  }

  function promptLearnerAfterReveal(setVoicePracticeFeedback) {
    if (getVoicePracticeMode() === 'off') return;
    if (voiceTakeCompleteRef() || isVoiceRecording()) return;
    const practiceDetails = el('modal-practice-details');
    if (!practiceDetails || practiceDetails.classList.contains('hidden')) return;
    const required = getVoicePracticeMode() === 'required';
    if (required) practiceDetails.open = true;
    setVoicePracticeFeedback('Your turn: tap Record and compare with model audio.', required ? 'warn' : 'default');
  }

  return Object.freeze({
    getRevealFeedbackCopy,
    getRevealPacingPreset,
    playMeaningWithFun,
    promptLearnerAfterReveal,
    shouldIncludeFunInMeaningRuntime,
    shouldNarrateReveal,
    showRevealWordToast
  });
}

window.createRevealFlowSupportModule = createRevealFlowSupportModule;
