/**
 * app-voice-support.js
 * Voice-practice support helpers: history, karaoke guide, visualizer cleanup, and clip analysis.
 */

function createVoiceSupportModule(deps) {
  const {
    WQAudio = null,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    requestAnimationFrameRef = requestAnimationFrame,
    cancelAnimationFrameRef = cancelAnimationFrame,
    setTimeoutRef = setTimeout,
    clearTimeoutRef = clearTimeout,
    clearIntervalRef = clearInterval,
    localStorageRef = localStorage,
    urlRef = URL,
    windowRef = window,
    getGameWord = () => '',
    getVoiceHistory = () => [],
    setVoiceHistory = () => {},
    getVoiceCountdownTimer = () => 0,
    setVoiceCountdownTimer = () => {},
    getVoiceAutoStopTimer = () => 0,
    setVoiceAutoStopTimer = () => {},
    getVoiceKaraokeTimer = () => 0,
    setVoiceKaraokeTimer = () => {},
    getVoiceKaraokeRunToken = () => 0,
    setVoiceKaraokeRunToken = () => {},
    getVoiceWaveRaf = () => 0,
    setVoiceWaveRaf = () => {},
    getVoiceAudioCtx = () => null,
    setVoiceAudioCtx = () => {},
    getVoiceAnalyser = () => null,
    setVoiceAnalyser = () => {},
    getVoiceIsRecording = () => false,
    getVoicePracticeMode = () => 'optional',
    getVoiceStream = () => null,
    setVoiceStream = () => {},
    getVoiceTakeComplete = () => false,
    getVoiceRecorder = () => null,
    setVoiceRecorder = () => {},
    getVoiceClipUrl = () => null,
    setVoiceClipUrl = () => {},
    getWQGameState = () => null,
    getRevealFocusMode = () => 'on',
    getStudentRecordingEnabled = () => false,
    setVoiceClipBlob = () => {},
    setVoiceIsRecording = () => {},
    setVoiceRecordingUIState = () => {},
    hideInformantHintCard = () => {},
    scheduleRevealAutoAdvance = () => {},
    clearRevealAutoAdvanceTimer = () => {},
    showToast = () => {},
    startVoiceRecording = async () => {},
    stopVoiceRecording = () => {},
    playVoiceRecording = () => {},
    saveVoiceRecording = () => {},
    setVoicePracticeMode = () => {},
    syncRevealFocusModalSections = () => {},
    syncRevealMeaningHighlight = () => {},
    syncRevealSorBadge = () => {},
    runRevealNarration = async () => {},
    deepDiveSession = null,
    deepDiveModal = null,
    voiceCaptureMs = 3000,
    voiceHistoryKey = 'wq_v2_voice_history_v1',
    voiceHistoryLimit = 3,
    voicePrivacyToastKey = 'wq_voice_privacy_toast_seen_v1'
  } = deps || {};

  function resolveConfigValue(value, fallback) {
    if (typeof value === 'function') {
      try {
        const resolved = value();
        return resolved == null ? fallback : resolved;
      } catch {
        return fallback;
      }
    }
    return value == null ? fallback : value;
  }

  function setVoiceRecordingUI(isRecording) {
    const recordBtn = el('voice-record-btn');
    if (recordBtn) {
      const isCountingDown = !!getVoiceCountdownTimer();
      recordBtn.disabled = !!isRecording || isCountingDown;
      recordBtn.classList.toggle('is-recording', !!isRecording);
      recordBtn.textContent = isCountingDown
        ? 'Get Ready...'
        : isRecording
          ? 'Recording...'
          : 'Start Recording (3s countdown)';
    }
    const saveBtn = el('voice-save-btn');
    if (saveBtn && isRecording) saveBtn.disabled = true;
    setVoiceRecordingUIState(isRecording);
  }

  function loadVoiceHistory() {
    try {
      const historyKey = resolveConfigValue(voiceHistoryKey, 'wq_v2_voice_history_v1');
      const raw = JSON.parse(localStorageRef.getItem(historyKey) || '[]');
      if (!Array.isArray(raw)) return [];
      const historyLimit = resolveConfigValue(voiceHistoryLimit, 3);
      return raw
        .map((item) => ({
          word: String(item?.word || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12),
          score: Math.max(0, Math.min(100, Number(item?.score) || 0)),
          label: String(item?.label || 'Captured').trim().slice(0, 28),
          tone: ['good', 'warn', 'error'].includes(String(item?.tone || '').toLowerCase())
            ? String(item.tone).toLowerCase()
            : 'default',
          at: Number(item?.at) || Date.now()
        }))
        .filter((item) => item.word)
        .slice(0, historyLimit);
    } catch {
      return [];
    }
  }

  function saveVoiceHistory() {
    const entries = Array.isArray(getVoiceHistory()) ? getVoiceHistory() : [];
    try {
      const historyKey = resolveConfigValue(voiceHistoryKey, 'wq_v2_voice_history_v1');
      const historyLimit = resolveConfigValue(voiceHistoryLimit, 3);
      localStorageRef.setItem(historyKey, JSON.stringify(entries.slice(0, historyLimit)));
    } catch {}
  }

  function renderVoiceHistoryStrip() {
    const listEl = el('voice-history-items');
    const trendEl = el('voice-history-trend');
    if (!listEl || !trendEl) return;
    const historyLimit = resolveConfigValue(voiceHistoryLimit, 3);
    const entries = Array.isArray(getVoiceHistory()) ? getVoiceHistory().slice(0, historyLimit) : [];
    listEl.innerHTML = '';

    if (!entries.length) {
      const empty = documentRef.createElement('span');
      empty.className = 'voice-history-empty';
      empty.textContent = 'No clips yet.';
      listEl.appendChild(empty);
      trendEl.textContent = 'Trend: —';
      trendEl.classList.remove('is-up', 'is-down', 'is-steady');
      return;
    }

    entries.forEach((entry) => {
      const chip = documentRef.createElement('span');
      chip.className = `voice-history-chip${entry.tone === 'good' || entry.tone === 'warn' || entry.tone === 'error' ? ` is-${entry.tone}` : ''}`;
      const word = documentRef.createElement('b');
      word.textContent = entry.word;
      chip.appendChild(word);
      chip.appendChild(documentRef.createTextNode(` ${entry.label} ${entry.score}`));
      listEl.appendChild(chip);
    });

    trendEl.classList.remove('is-up', 'is-down', 'is-steady');
    if (entries.length < 2) {
      trendEl.textContent = 'Trend: baseline';
      trendEl.classList.add('is-steady');
      return;
    }
    const delta = entries[0].score - entries[entries.length - 1].score;
    if (delta >= 10) {
      trendEl.textContent = 'Trend: rising ↑';
      trendEl.classList.add('is-up');
      return;
    }
    if (delta <= -10) {
      trendEl.textContent = 'Trend: dip ↓';
      trendEl.classList.add('is-down');
      return;
    }
    trendEl.textContent = 'Trend: steady →';
    trendEl.classList.add('is-steady');
  }

  function appendVoiceHistory(review) {
    const word = String(getGameWord() || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 12);
    if (!word) return;
    const score = Math.max(0, Math.min(100, Number(review?.score) || 0));
    const label = String(review?.label || 'Captured').trim().slice(0, 28) || 'Captured';
    const tone = ['good', 'warn', 'error'].includes(String(review?.tone || '').toLowerCase())
      ? String(review.tone).toLowerCase()
      : 'default';

    const historyLimit = resolveConfigValue(voiceHistoryLimit, 3);
    const nextHistory = [{ word, score, label, tone, at: Date.now() }, ...getVoiceHistory()].slice(0, historyLimit);
    setVoiceHistory(nextHistory);
    saveVoiceHistory();
    renderVoiceHistoryStrip();
  }

  function clearVoiceClip() {
    const voiceClipUrl = getVoiceClipUrl();
    if (voiceClipUrl) {
      urlRef.revokeObjectURL(voiceClipUrl);
      setVoiceClipUrl(null);
    }
    setVoiceClipBlob(null);
    const playBtn = el('voice-play-btn');
    if (playBtn) playBtn.disabled = true;
    const saveBtn = el('voice-save-btn');
    if (saveBtn) saveBtn.disabled = true;
  }

  function clearVoiceAutoStopTimer() {
    const timer = getVoiceAutoStopTimer();
    if (!timer) return;
    clearTimeoutRef(timer);
    setVoiceAutoStopTimer(0);
  }

  function clearVoiceCountdownTimer() {
    const timer = getVoiceCountdownTimer();
    if (!timer) return;
    clearIntervalRef(timer);
    setVoiceCountdownTimer(0);
  }

  function resetKaraokeGuide(word = '') {
    const wordWrap = el('voice-karaoke-word');
    const hintEl = el('voice-karaoke-hint');
    const normalizedWord = String(word || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (wordWrap) {
      wordWrap.innerHTML = normalizedWord
        ? normalizedWord.split('').map((ch) => `<span class="voice-karaoke-letter">${ch}</span>`).join('')
        : '<span class="voice-karaoke-letter">?</span>';
    }
    if (hintEl) {
      hintEl.textContent = normalizedWord
        ? 'Tap Guide Me to see pacing, then record.'
        : 'Start a round to load the target word.';
    }
  }

  function stopKaraokeGuide() {
    setVoiceKaraokeRunToken(getVoiceKaraokeRunToken() + 1);
    const timer = getVoiceKaraokeTimer();
    if (timer) {
      clearTimeoutRef(timer);
      setVoiceKaraokeTimer(0);
    }
  }

  function runKaraokeGuide(entry) {
    stopKaraokeGuide();
    const word = String(entry?.word || '').toUpperCase().replace(/[^A-Z]/g, '');
    const hintEl = el('voice-karaoke-hint');
    const wordWrap = el('voice-karaoke-word');
    if (!wordWrap) return;
    resetKaraokeGuide(word);
    const letters = Array.from(wordWrap.querySelectorAll('.voice-karaoke-letter'));
    if (!letters.length || !word) return;
    if (hintEl) hintEl.textContent = 'Follow the highlight and match the pace.';
    const token = getVoiceKaraokeRunToken() + 1;
    setVoiceKaraokeRunToken(token);
    const totalMs = Math.max(900, Math.min(3200, word.length * 300));
    const perLetter = Math.max(120, Math.floor(totalMs / letters.length));
    let index = 0;
    const tick = () => {
      if (token !== getVoiceKaraokeRunToken()) return;
      letters.forEach((node, letterIndex) => {
        node.classList.toggle('is-active', letterIndex === index);
        node.classList.toggle('is-done', letterIndex < index);
      });
      const modalLetters = Array.from(documentRef.querySelectorAll('#modal-word span'));
      modalLetters.forEach((node, letterIndex) => {
        node.classList.toggle('is-karaoke-active', letterIndex === index);
        node.classList.toggle('is-karaoke-done', letterIndex < index);
      });
      index += 1;
      if (index < letters.length) {
        setVoiceKaraokeTimer(setTimeoutRef(tick, perLetter));
        return;
      }
      letters.forEach((node) => {
        node.classList.remove('is-active');
        node.classList.add('is-done');
      });
      modalLetters.forEach((node) => {
        node.classList.remove('is-karaoke-active');
        node.classList.add('is-karaoke-done');
      });
      setVoiceKaraokeTimer(setTimeoutRef(() => {
        if (token !== getVoiceKaraokeRunToken()) return;
        letters.forEach((node) => node.classList.remove('is-done'));
        modalLetters.forEach((node) => node.classList.remove('is-karaoke-done'));
        if (hintEl) hintEl.textContent = 'Nice pacing. Press Record when you are ready.';
        setVoiceKaraokeTimer(0);
      }, 500));
    };
    tick();
  }

  function stopVoiceVisualizer() {
    const raf = getVoiceWaveRaf();
    if (raf) {
      cancelAnimationFrameRef(raf);
      setVoiceWaveRaf(0);
    }
    const ctx = getVoiceAudioCtx();
    if (ctx) {
      try { ctx.close(); } catch {}
      setVoiceAudioCtx(null);
    }
    setVoiceAnalyser(null);
  }

  function stopVoiceStream() {
    const stream = getVoiceStream();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setVoiceStream(null);
    }
    setVoiceRecorder(null);
  }

  function stopVoiceCaptureNow() {
    clearVoiceAutoStopTimer();
    clearVoiceCountdownTimer();
    deps.bumpVoiceCountdownToken?.();
    try {
      const voiceRecorder = getVoiceRecorder();
      if (voiceRecorder && voiceRecorder.state !== 'inactive') {
        voiceRecorder.stop();
      }
    } catch {}
    stopVoiceVisualizer();
    stopVoiceStream();
    setVoiceIsRecording(false);
    stopKaraokeGuide();
    setVoiceRecordingUI(false);
  }

  function drawWaveform() {}

  function animateLiveWaveform() {
    const analyser = getVoiceAnalyser();
    if (!analyser) return;
    const points = new Uint8Array(analyser.fftSize);
    const frame = () => {
      const liveAnalyser = getVoiceAnalyser();
      if (!liveAnalyser) return;
      liveAnalyser.getByteTimeDomainData(points);
      drawWaveform(points);
      setVoiceWaveRaf(requestAnimationFrameRef(frame));
    };
    frame();
  }

  function setVoicePracticeFeedback(message, tone = 'default') {
    const feedback = el('voice-practice-feedback');
    if (!feedback) return;
    const normalizedTone = tone === true ? 'error' : tone === false ? 'default' : String(tone || 'default').toLowerCase();
    feedback.textContent = message || '';
    feedback.classList.toggle('is-error', normalizedTone === 'error');
    feedback.classList.toggle('is-warn', normalizedTone === 'warn');
    feedback.classList.toggle('is-good', normalizedTone === 'good');
  }

  async function analyzeVoiceClip(blob) {
    const Ctor = windowRef.AudioContext || windowRef.webkitAudioContext;
    if (!Ctor || !blob?.size) return null;
    const ctx = new Ctor();
    try {
      const sourceBytes = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(sourceBytes.slice(0));
      const captureMs = Number(resolveConfigValue(voiceCaptureMs, 3000)) || 3000;
      const duration = Number(audioBuffer.duration) || (captureMs / 1000);
      let peak = 0;
      let sumSquares = 0;
      let voiced = 0;
      let samples = 0;
      const threshold = 0.02;
      const stride = 2;

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i += stride) {
          const abs = Math.abs(data[i] || 0);
          if (abs > peak) peak = abs;
          sumSquares += abs * abs;
          if (abs >= threshold) voiced += 1;
          samples += 1;
        }
      }
      if (!samples) return null;
      const rms = Math.sqrt(sumSquares / samples);
      const voicedRatio = voiced / samples;
      return { duration, peak, rms, voicedRatio };
    } catch {
      return null;
    } finally {
      try { await ctx.close(); } catch {}
    }
  }

  function buildVoiceFeedback(analysis, entry = null) {
    const targetWord = String(entry?.word || '').toLowerCase();
    const hasTh = targetWord.includes('th');
    const hasV = targetWord.includes('v');
    const hasR = targetWord.includes('r');
    const hasL = targetWord.includes('l');
    const hasShortI = /[bcdfghjklmnpqrstvwxyz]i[bcdfghjklmnpqrstvwxyz]/.test(targetWord);
    const ealTip = hasTh
      ? 'EAL tip: keep your tongue gently between teeth for "th".'
      : hasV
        ? 'EAL tip: for "v", use voice and touch your bottom lip to upper teeth.'
        : hasR && hasL
          ? 'EAL tip: check /r/ vs /l/ contrast and keep sounds distinct.'
          : hasShortI
            ? 'EAL tip: keep short /i/ crisp (as in "sit"), not /ee/.'
            : 'EAL tip: stress the main syllable and keep ending sounds clear.';
    if (!analysis) return { message: `Clip captured. Play it back, compare with model audio. ${ealTip}`, tone: 'default', score: 60, label: 'Captured' };
    if (analysis.duration < 1.4) return { message: `Clip was very short. Speak right after the countdown. ${ealTip}`, tone: 'warn', score: 35, label: 'Short' };
    if (analysis.rms < 0.012 || analysis.voicedRatio < 0.05) return { message: `Clip was very quiet. Try a little louder or closer to the mic. ${ealTip}`, tone: 'warn', score: 44, label: 'Quiet' };
    if (analysis.peak > 0.97 || analysis.rms > 0.25) return { message: `Volume may be too high. Step back slightly and retry. ${ealTip}`, tone: 'warn', score: 52, label: 'Hot' };
    return { message: `Great clarity. Play it back and compare with model audio. ${ealTip}`, tone: 'good', score: 86, label: 'Clear' };
  }

  function updateVoicePracticePanel(state) {
    const panel = el('modal-voice-practice');
    const practiceDetails = el('modal-practice-details');
    const practiceStatus = el('modal-practice-status');
    const target = el('voice-practice-target');
    const playAgain = el('play-again-btn');
    const challengePracticeBtn = el('challenge-open-practice');
    const mode = getVoicePracticeMode();
    const word = String(state?.word || '').toUpperCase();
    if (challengePracticeBtn) challengePracticeBtn.classList.toggle('hidden', !getStudentRecordingEnabled());
    if (practiceStatus) {
      const required = mode === 'required';
      practiceStatus.textContent = required ? 'Required' : 'Optional';
      practiceStatus.classList.toggle('is-required', required);
      const toggleLabel = required ? 'Tap to switch to Optional' : 'Tap to switch to Required';
      practiceStatus.setAttribute('title', toggleLabel);
      practiceStatus.setAttribute('aria-label', toggleLabel);
      if (practiceStatus instanceof HTMLButtonElement) practiceStatus.disabled = mode === 'off';
    }
    if (target) target.textContent = word ? `Target: ${word}` : '';
    if (!panel) return;
    renderVoiceHistoryStrip();
    if (mode === 'off') {
      if (getVoiceIsRecording()) stopVoiceCaptureNow();
      panel.classList.add('hidden');
      if (practiceDetails) {
        practiceDetails.classList.add('hidden');
        practiceDetails.open = false;
      }
      if (playAgain) {
        playAgain.disabled = false;
        playAgain.removeAttribute('aria-disabled');
      }
      return;
    }
    if (practiceDetails) {
      practiceDetails.classList.remove('hidden');
      if (getRevealFocusMode() === 'off') practiceDetails.open = true;
    }
    panel.classList.remove('hidden');
    if (mode === 'required' && !getVoiceTakeComplete()) {
      if (practiceDetails) practiceDetails.open = true;
      if (playAgain) {
        playAgain.disabled = true;
        playAgain.setAttribute('aria-disabled', 'true');
      }
      setVoicePracticeFeedback('Recording is required before the next word.');
      return;
    }
    if (playAgain) {
      playAgain.disabled = false;
      playAgain.removeAttribute('aria-disabled');
    }
    if (!getVoiceTakeComplete() && !getVoiceIsRecording()) {
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown, then compare with model audio.');
    }
  }

  function openVoicePracticeAndRecord(options = {}) {
    const mode = getVoicePracticeMode();
    const practiceDetails = el('modal-practice-details');
    if (practiceDetails) practiceDetails.open = true;
    if (mode === 'off') {
      setVoicePracticeFeedback('Say It Back is off in Settings. Switch Voice Practice to Optional or Required.', 'warn');
      return false;
    }
    if (getVoiceIsRecording()) {
      setVoicePracticeFeedback('Recording in progress...');
      return true;
    }
    const shouldAutoStart = options.autoStart !== false;
    if (shouldAutoStart && !getVoiceTakeComplete()) {
      void startVoiceRecording();
      return true;
    }
    if (!getVoiceTakeComplete()) {
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown and capture your voice.');
    }
    return true;
  }

  function bindVoicePracticeControls() {
    if (documentRef.body.dataset.wqVoicePracticeBound === '1') return;
    el('voice-guide-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      runKaraokeGuide(getWQGameState()?.entry || null);
      deps.cancelRevealNarration?.();
      void WQAudio?.playWord?.(getWQGameState()?.entry || null);
    });
    el('voice-record-btn')?.addEventListener('click', () => { void startVoiceRecording(); });
    el('voice-play-btn')?.addEventListener('click', () => playVoiceRecording());
    el('voice-save-btn')?.addEventListener('click', () => saveVoiceRecording());
    el('modal-practice-status')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = getVoicePracticeMode();
      const next = current === 'required' ? 'optional' : 'required';
      setVoicePracticeMode(next, { toast: true });
      const details = el('modal-practice-details');
      if (details && next === 'required') details.open = true;
    });
    el('voice-quick-record-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openVoicePracticeAndRecord({ autoStart: true });
    });
    el('modal-practice-details')?.addEventListener('toggle', (event) => {
      const details = event.currentTarget;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (getVoiceTakeComplete() || getVoiceIsRecording()) return;
      setVoicePracticeFeedback('Tap Record to start a 3-second countdown.');
    });
    documentRef.body.dataset.wqVoicePracticeBound = '1';
    setVoiceRecordingUI(false);
    resetKaraokeGuide(getWQGameState()?.word || '');
    renderVoiceHistoryStrip();
  }

  function installRevealModalPatch() {
    if (!WQUI || typeof WQUI.showModal !== 'function') return;
    if (WQUI.__revealPatchApplied) return;
    bindVoicePracticeControls();
    const originalShowModal = WQUI.showModal.bind(WQUI);
    WQUI.showModal = function patchedShowModal(state) {
      clearRevealAutoAdvanceTimer();
      hideInformantHintCard();
      originalShowModal(state);
      deps.resetVoiceTakeComplete?.();
      stopVoiceCaptureNow();
      clearVoiceClip();
      resetKaraokeGuide(state?.word || '');
      syncRevealSorBadge(state?.entry);
      syncRevealMeaningHighlight(state?.entry);
      deepDiveSession?.syncRevealChallengeLaunch?.(state);
      deepDiveModal?.closeRevealChallengeModal?.({ silent: true });
      const practiceDetails = el('modal-practice-details');
      if (practiceDetails) {
        const requiredPractice = getVoicePracticeMode() === 'required';
        practiceDetails.open = requiredPractice || getRevealFocusMode() === 'off';
      }
      const details = el('modal-more-details');
      if (details && !details.classList.contains('hidden')) details.open = getRevealFocusMode() === 'off';
      updateVoicePracticePanel(state);
      syncRevealFocusModalSections();
      void runRevealNarration(state).finally(() => {
        if (el('modal-overlay')?.classList.contains('hidden')) return;
        scheduleRevealAutoAdvance();
      });
      return state;
    };
    WQUI.__revealPatchApplied = true;
  }

  return Object.freeze({
    analyzeVoiceClip,
    animateLiveWaveform,
    appendVoiceHistory,
    bindVoicePracticeControls,
    buildVoiceFeedback,
    clearVoiceAutoStopTimer,
    clearVoiceClip,
    clearVoiceCountdownTimer,
    drawWaveform,
    loadVoiceHistory,
    renderVoiceHistoryStrip,
    resetKaraokeGuide,
    saveVoiceHistory,
    setVoicePracticeFeedback,
    setVoiceRecordingUI,
    stopKaraokeGuide,
    stopVoiceCaptureNow,
    stopVoiceStream,
    stopVoiceVisualizer,
    runKaraokeGuide,
    installRevealModalPatch,
    openVoicePracticeAndRecord,
    updateVoicePracticePanel
  });
}

window.createVoiceSupportModule = createVoiceSupportModule;
