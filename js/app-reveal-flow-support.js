/**
 * app-reveal-flow-support.js
 * Reveal copy, narration gating, and meaning bundle helpers.
 */

function createRevealFlowSupportModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQAudio = null,
    WQGame = null,
    WQUI = null,
    clearIntervalRef = clearInterval,
    clearTimeoutRef = clearTimeout,
    cancelAnimationFrameFn = cancelAnimationFrame,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getActiveMaxGuesses = () => 6,
    getRevealAutoAdvanceEndsAt = () => 0,
    getRevealAutoNextSeconds = () => 0,
    getRevealAutoAdvanceTimer = () => 0,
    getRevealAutoCountdownTimer = () => 0,
    getRevealPacingMode = () => 'guided',
    getVoicePracticeMode = () => 'optional',
    isSorNotationEnabled = () => false,
    isVoiceRecording = () => false,
    normalizeVoiceMode = (value) => value,
    onAdvance = () => {},
    pickRandom = () => '',
    prefs = {},
    requestAnimationFrameFn = requestAnimationFrame,
    revealLossToasts = [],
    revealPacingPresets = {},
    revealWinToasts = [],
    setRevealAutoAdvanceEndsAt = () => {},
    setRevealAutoAdvanceTimer = () => {},
    setRevealAutoCountdownTimer = () => {},
    setTimeoutRef = setTimeout,
    shouldIncludeFunInMeaning = () => false,
    voiceTakeCompleteRef = () => false,
    localStorageRef = localStorage,
    getDupeMode = () => 'on',
    isAssessmentRoundLocked = () => false,
    getCelebrateLayer = () => null,
    getConfettiCanvas = () => null,
    dupePrefKey = 'wq_v2_dupe_dismissed'
  } = deps || {};

  let dupeToastEl = null;

  function getKidFriendlyFocusLabel(notation) {
    const raw = String(notation || '').replace(/\s+/g, ' ').trim();
    const normalized = raw.toLowerCase();
    if (!raw) return '';
    if (normalized.includes('floss')) return 'FLOSS Rule: doubled ending letters (-ss, -ll, -ff, -zz)';
    if (normalized.includes('cvc') || normalized.includes('short vowel') || normalized.includes('closed syllable')) {
      return 'Sound Steps: CVC short-vowel pattern (cat, dog)';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E Rule: CVCe pattern (cap -> cape)';
    }
    if (normalized.includes('digraph')) return 'Sound Buddies: digraph (sh as in ship)';
    if (normalized.includes('vowel team')) return 'Vowel Team focus (ai as in rain)';
    if (normalized.includes('r-controlled')) return 'Bossy R focus (ar as in car)';
    if (normalized.includes('blend')) {
      if (normalized.includes('initial') || normalized.includes('ccvc')) return 'Blend Builders: initial blend (b+r as in bring)';
      if (normalized.includes('final') || normalized.includes('cvcc')) return 'Blend Builders: final blend (m+p as in camp)';
      return 'Blend Builders: consonant blend focus (br in bring)';
    }
    if (normalized.includes('trigraph')) return 'Three-letter team focus (igh as in light)';
    if (normalized.includes('diphthong')) return 'Glide vowel focus (oi in coin, ou in cloud)';
    if (normalized.includes('prefix')) return 'Prefix focus (re- as in replay)';
    if (normalized.includes('suffix')) return 'Suffix focus (-ed as in jumped)';
    if (normalized.includes('schwa')) return 'Schwa focus (a in about says /uh/)';
    if (normalized.includes('multisyll')) return 'Syllable strategy focus (chunk + blend)';
    return raw;
  }

  function getKidFriendlyFocusDetail(notation) {
    const normalized = String(notation || '').toLowerCase();
    if (normalized.includes('floss')) {
      return 'Floss Rule: after a short vowel at the end of a one-syllable word, double f, l, s, or z.';
    }
    if (normalized.includes('cvce') || normalized.includes('magic e') || normalized.includes('silent e')) {
      return 'Magic E makes the vowel say its name: cap -> cape, kit -> kite.';
    }
    if (normalized.includes('digraph')) {
      return 'Digraphs are two letters that work together to make one sound.';
    }
    if (normalized.includes('vowel team')) {
      return 'Vowel teams are two vowels working together to make one main sound.';
    }
    if (normalized.includes('r-controlled')) {
      return 'Bossy R changes the vowel sound in patterns like ar, or, er, ir, and ur.';
    }
    if (normalized.includes('blend')) {
      return 'Blends keep both consonant sounds. Initial blend example: b+r in bring. Final blend example: m+p in camp.';
    }
    if (normalized.includes('schwa')) {
      return 'Schwa is the unstressed /uh/ sound in words like about or sofa.';
    }
    return '';
  }

  function trimToastDefinition(definition) {
    const text = String(definition || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= 72) return text;
    return `${text.slice(0, 69).trim()}...`;
  }

  function ensureTerminalPunctuation(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  }

  function buildCombinedMeaningLine(definition, funAddOn) {
    const def = String(definition || '').replace(/\s+/g, ' ').trim();
    const fun = String(funAddOn || '').replace(/\s+/g, ' ').trim();
    if (!def && !fun) return '';
    if (!def) return ensureTerminalPunctuation(fun);
    if (!fun) return ensureTerminalPunctuation(def);
    const defBase = def.replace(/[.!?]+$/, '').trim();
    if (/^[,.;:!?]/.test(fun)) return ensureTerminalPunctuation(`${defBase}${fun}`);
    const funNoLeadPunc = fun.replace(/^[,.;:!?]\s*/, '').trim();
    return ensureTerminalPunctuation(`${defBase} and ${funNoLeadPunc}`);
  }

  function getRevealMeaningPayload(nextEntry, includeFun = false) {
    const definition = String(nextEntry?.definition || '').replace(/\s+/g, ' ').trim();
    const funAddOn = includeFun
      ? String(nextEntry?.fun_add_on || '').replace(/\s+/g, ' ').trim()
      : '';
    const line = buildCombinedMeaningLine(definition, funAddOn);
    const readDef = String(nextEntry?.text_to_read_definition || '').replace(/\s+/g, ' ').trim()
      || ensureTerminalPunctuation(
        nextEntry?.word && definition
          ? `${nextEntry.word} means ${definition}`
          : definition
      );
    const readFun = includeFun
      ? String(nextEntry?.text_to_read_fun || '').replace(/\s+/g, ' ').trim() || funAddOn
      : '';
    const readAll = (() => {
      if (readDef && readFun) {
        const smoothDef = readDef.replace(/[.!?]+$/, '').trim();
        const smoothFun = readFun.replace(/^[,.;:!?]\s*/, '').trim();
        return ensureTerminalPunctuation(`${smoothDef} and ${smoothFun}`);
      }
      return [readDef, readFun].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    })();
    return { definition, funAddOn, line, readAll };
  }

  function buildRevealReadCue(text) {
    const sentence = String(text || '').replace(/\s+/g, ' ').trim();
    if (!sentence) return '';
    const cues = [];
    if (/\?$/.test(sentence)) cues.push('Lift your voice slightly at the end for the question mark.');
    else if (/!$/.test(sentence)) cues.push('Use a strong voice at the exclamation point.');
    if (/,/.test(sentence)) cues.push('Pause briefly at commas.');
    else if (/\b(because|although|when|if|while)\b/i.test(sentence)) cues.push('Add a small pause before the clause word.');
    return cues.slice(0, 2).join(' ');
  }

  function shouldIncludeFunInMeaningRuntime() {
    const toggle = el('s-meaning-fun-link');
    if (toggle) return !!toggle.checked;
    return (prefs.meaningPlusFun || DEFAULT_PREFS.meaningPlusFun) === 'on';
  }

  function getRevealFeedbackCopy(result) {
    const guessCount = Math.max(1, Number(result?.guesses?.length || 0));
    if (result?.won) {
      let key = 'steady';
      if (guessCount <= 1) key = 'lightning';
      else if (guessCount <= Math.max(2, Math.ceil(getActiveMaxGuesses() * 0.34))) key = 'fast';
      else if (guessCount >= Math.max(4, getActiveMaxGuesses() - 1)) key = 'resilient';
      return pickRandom(revealWinToasts[key]) || { lead: 'Great solve!', coach: '' };
    }
    const remaining = Math.max(0, getActiveMaxGuesses() - guessCount);
    let key = 'mid';
    if (remaining <= 1) key = 'close';
    else if (guessCount <= 2) key = 'early';
    return pickRandom(revealLossToasts[key]) || { lead: 'Keep going.', coach: '' };
  }

  function getRevealPacingPreset() {
    const mode = getRevealPacingMode();
    return revealPacingPresets[mode] || revealPacingPresets.guided;
  }

  function updateRevealSorBadge(entry) {
    const sor = el('modal-sor');
    if (!sor) return;
    const notation = String(entry?.phonics || '').trim();
    if (!isSorNotationEnabled() || !notation || notation.toLowerCase() === 'all') {
      sor.textContent = '';
      sor.removeAttribute('title');
      sor.classList.add('hidden');
      return;
    }
    sor.textContent = getKidFriendlyFocusLabel(notation);
    const detail = getKidFriendlyFocusDetail(notation);
    if (detail) sor.setAttribute('title', detail);
    else sor.removeAttribute('title');
    sor.classList.remove('hidden');
  }

  function syncRevealReadCue(nextEntry) {
    const cueEl = el('modal-read-cue');
    if (!cueEl) return;
    const sourceText = String(nextEntry?.sentence || '').trim() || String(nextEntry?.text_to_read_definition || '').trim();
    const cue = buildRevealReadCue(sourceText) || '';
    cueEl.textContent = cue || '';
    cueEl.classList.toggle('hidden', !cue);
  }

  function syncRevealMeaningHighlight(nextEntry) {
    const wrap = el('modal-meaning-highlight');
    const lineEl = el('modal-meaning-highlight-line');
    if (!wrap || !lineEl) return;
    const meaning = getRevealMeaningPayload(nextEntry, shouldIncludeFunInMeaning()) || {
      definition: '',
      funAddOn: '',
      line: '',
      readAll: ''
    };
    lineEl.textContent = meaning.line;
    wrap.classList.toggle('hidden', !meaning.line);
    syncRevealReadCue(nextEntry);
  }

  function getActiveMaxGuessesRuntime() {
    const stateMax = Number(WQGame?.getState?.()?.maxGuesses || 0);
    const prefMax = Number.parseInt(el('s-guesses')?.value || DEFAULT_PREFS.guesses, 10);
    return Math.max(1, Number.isFinite(stateMax) && stateMax > 0
      ? stateMax
      : Number.isFinite(prefMax) && prefMax > 0
        ? prefMax
        : 6);
  }

  function showRevealWordToast(result) {
    if (!result) return;
    const solvedWord = String(result.word || '').trim().toUpperCase();
    if (!solvedWord) return;
    const feedback = getRevealFeedbackCopy(result);
    const lead = String(feedback?.lead || '').trim();
    const coach = String(feedback?.coach || '').trim();
    const shortDef = trimToastDefinition(result?.entry?.definition);
    const base = shortDef ? `${lead} ${solvedWord} - ${shortDef}` : `${lead} ${solvedWord}`;
    const message = coach ? `${base} ${coach}` : base;
    WQUI?.showToast?.(message, 3600);
  }

  function removeDupeToast() {
    if (dupeToastEl) {
      dupeToastEl.remove();
      dupeToastEl = null;
    }
  }

  function maybeDismissDupeToast(target) {
    if (dupeToastEl && !dupeToastEl.contains(target)) {
      removeDupeToast();
    }
  }

  function showDupeToast(letter) {
    removeDupeToast();
    const div = documentRef.createElement('div');
    div.id = 'dupe-toast';
    div.innerHTML = `
      <span>Heads up: there's another <strong>${letter}</strong> in this word.</span>
      <div class="dupe-dismiss-row">
        <button id="dupe-ok">Got it</button>
        <button id="dupe-never">Don't show again</button>
      </div>`;
    documentRef.body.appendChild(div);
    dupeToastEl = div;

    div.querySelector('#dupe-ok')?.addEventListener('click', removeDupeToast);
    div.querySelector('#dupe-never')?.addEventListener('click', () => {
      localStorageRef.setItem(dupePrefKey, 'true');
      removeDupeToast();
    });

    setTimeoutRef(removeDupeToast, 8000);
  }

  function checkDuplicates(result) {
    if (getDupeMode() === 'off') return;
    if (isAssessmentRoundLocked()) return;
    if (localStorageRef.getItem(dupePrefKey) === 'true') return;

    const word = String(result?.word || '');
    const freq = {};
    word.split('').forEach((ch) => {
      freq[ch] = (freq[ch] || 0) + 1;
    });

    for (const [letter, count] of Object.entries(freq)) {
      if (count < 2) continue;
      let placed = 0;
      (result?.guesses || []).forEach((guess) => {
        guess.split('').forEach((ch, index) => {
          if (ch === letter && word[index] === letter) placed += 1;
        });
      });
      if (placed >= 1 && placed < count) {
        WQUI?.pulseDupeKey?.(letter);
        showDupeToast(letter.toUpperCase());
        break;
      }
    }
  }

  function launchStars() {
    const layer = getCelebrateLayer();
    if (!layer) return;
    layer.innerHTML = '';
    const starChars = ['*', '+', '.'];
    const count = 12;
    for (let index = 0; index < count; index += 1) {
      const star = documentRef.createElement('div');
      star.className = 'celebrate-star wq-anim';
      star.textContent = starChars[index % starChars.length];
      star.style.left = `${10 + Math.random() * 80}vw`;
      star.style.top = `${15 + Math.random() * 55}vh`;
      star.style.animationDelay = `${Math.random() * 180}ms`;
      layer.appendChild(star);
    }
    setTimeoutRef(() => {
      layer.innerHTML = '';
    }, 1200);
  }

  function launchConfetti() {
    const canvas = getConfettiCanvas();
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#f97316', '#a855f7', '#06b6d4', '#fbbf24'];
    const burstOrigins = [
      { x: canvas.width * 0.22, y: canvas.height * 0.14 },
      { x: canvas.width * 0.5, y: canvas.height * 0.1 },
      { x: canvas.width * 0.78, y: canvas.height * 0.14 }
    ];
    const pieces = Array.from({ length: 180 }, (_, index) => {
      const origin = burstOrigins[index % burstOrigins.length];
      return {
        x: origin.x + (Math.random() - 0.5) * 140,
        y: origin.y + (Math.random() - 0.5) * 40,
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6.2,
        vy: 1.8 + Math.random() * 3.4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      };
    });
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += (piece.vy += 0.08);
        piece.angle += piece.spin;
        if (piece.y < canvas.height + 30) any = true;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = Math.max(0, 1 - piece.y / canvas.height);
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      });
      if (any) frame = requestAnimationFrameFn(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    cancelAnimationFrameFn(frame);
    frame = requestAnimationFrameFn(draw);
    setTimeoutRef(() => {
      cancelAnimationFrameFn(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 5500);
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
      if (isVoiceRecording()) {
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
      if (isVoiceRecording()) {
        setRevealAutoAdvanceTimer(setTimeoutRef(tryAdvance, 900));
        return;
      }
      clearRevealAutoAdvanceTimer();
      onAdvance();
    };
    setRevealAutoAdvanceTimer(setTimeoutRef(tryAdvance, seconds * 1000));
  }

  return Object.freeze({
    buildRevealReadCue,
    checkDuplicates,
    clearRevealAutoAdvanceTimer,
    getActiveMaxGuesses: getActiveMaxGuessesRuntime,
    getRevealFeedbackCopy,
    getRevealMeaningPayload,
    getRevealPacingPreset,
    launchConfetti,
    launchStars,
    maybeDismissDupeToast,
    playMeaningWithFun,
    promptLearnerAfterReveal,
    removeDupeToast,
    scheduleRevealAutoAdvance,
    showModalAutoNextBanner,
    shouldIncludeFunInMeaningRuntime,
    shouldNarrateReveal,
    showRevealWordToast,
    syncRevealMeaningHighlight,
    syncRevealReadCue,
    updateRevealSorBadge,
    waitMs
  });
}

window.createRevealFlowSupportModule = createRevealFlowSupportModule;
