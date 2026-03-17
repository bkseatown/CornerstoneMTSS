/**
 * app-music.js — Music playback module for Word Quest
 *
 * Handles:
 * - Synthesized background music (12 preset modes: focus, chill, lofi, etc.)
 * - Audio track catalog playback
 * - Speech pause/resume coordination
 * - Volume and playback mode control
 *
 * Extracted from app.js Phase 1 modularization (415 lines → standalone module)
 */

function createMusicModule(DEFAULT_PREFS) {
  const MUSIC_CATALOG_URL = './data/music-catalog.json';
  let ctx = null;
  let synthGain = null;
  let synthInterval = null;
  let mode = 'chill';
  let vol = 0.35;
  let resumeBound = false;
  let audioEl = null;
  let catalog = null;
  let catalogPromise = null;
  let activeTrackId = '';
  let playbackToken = 0;
  let customTracks = [];
  let transportPaused = false;
  const speechPauseTokens = new Set();
  let speechPausedActive = false;
  let shouldResumeAfterSpeech = false;

  const PLAYBACK_PRESETS = Object.freeze({
    deepfocus: Object.freeze({ seq: [196, 0, 220, 0, 247, 0, 220, 0], tempo: 500, dur: 0.15, wave: 'sine', level: 0.1 }),
    classicalbeats: Object.freeze({ seq: [262, 330, 392, 330, 440, 392, 330, 262], tempo: 280, dur: 0.11, wave: 'triangle', level: 0.12 }),
    nerdcore: Object.freeze({ seq: [523, 659, 784, 988, 784, 659, 523, 659], tempo: 220, dur: 0.1, wave: 'square', level: 0.12 }),
    focus:   Object.freeze({ seq: [220, 0, 247, 0, 262, 0, 247, 0], tempo: 430, dur: 0.12, wave: 'triangle', level: 0.11 }),
    chill:   Object.freeze({ seq: [196, 0, 220, 0, 247, 0, 220, 0], tempo: 520, dur: 0.16, wave: 'sine', level: 0.12 }),
    lofi:    Object.freeze({ seq: [220, 0, 247, 0, 196, 0, 220, 0], tempo: 420, dur: 0.13, wave: 'triangle', level: 0.14 }),
    upbeat:  Object.freeze({ seq: [392, 523, 587, 659, 587, 523, 440, 523], tempo: 240, dur: 0.1, wave: 'square', level: 0.12 }),
    coffee:  Object.freeze({ seq: [196, 247, 294, 247, 220, 262, 330, 262], tempo: 470, dur: 0.14, wave: 'triangle', level: 0.12 }),
    arcade:  Object.freeze({ seq: [523, 659, 784, 659, 523, 392, 523, 659], tempo: 260, dur: 0.1, wave: 'square', level: 0.12 }),
    fantasy: Object.freeze({ seq: [262, 330, 392, 330, 440, 392, 330, 262], tempo: 320, dur: 0.12, wave: 'triangle', level: 0.13 }),
    scifi:   Object.freeze({ seq: [440, 0, 880, 0, 660, 0, 990, 0], tempo: 280, dur: 0.1, wave: 'sawtooth', level: 0.11 }),
    sports:  Object.freeze({ seq: [392, 392, 523, 392, 659, 523, 784, 659], tempo: 240, dur: 0.1, wave: 'square', level: 0.13 }),
    stealth: Object.freeze({ seq: [196, 0, 196, 233, 0, 174, 0, 220], tempo: 360, dur: 0.11, wave: 'triangle', level: 0.11 }),
    team:    Object.freeze({ seq: [392, 523, 659, 784, 659, 523, 784, 988], tempo: 220, dur: 0.1, wave: 'square', level: 0.13 })
  });

  const ALT_SEQS = Object.freeze({
    deepfocus: [174, 0, 196, 0, 220, 0, 196, 0],
    classicalbeats: [294, 370, 440, 370, 494, 440, 370, 294],
    nerdcore: [659, 784, 988, 1175, 988, 784, 659, 784],
    focus:   [196, 0, 220, 0, 247, 0, 220, 0],
    chill:   [220, 0, 247, 0, 262, 0, 247, 0],
    lofi:    [196, 0, 220, 0, 247, 0, 196, 0],
    upbeat:  [440, 523, 659, 587, 523, 440, 392, 440],
    coffee:  [220, 262, 330, 262, 247, 294, 349, 294],
    arcade:  [659, 784, 988, 784, 659, 523, 659, 784],
    fantasy: [294, 370, 440, 370, 494, 440, 370, 294],
    scifi:   [660, 0, 990, 0, 770, 0, 1120, 0],
    sports:  [440, 440, 587, 440, 698, 587, 880, 698],
    stealth: [220, 0, 174, 196, 0, 233, 0, 196],
    team:    [523, 659, 784, 988, 784, 659, 523, 784]
  });

  const clamp01 = (value, fallback = 0) => {
    const next = Number.isFinite(value) ? value : fallback;
    return Math.max(0, Math.min(1, next));
  };

  const normalizePlaybackMode = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'off') return 'off';
    return PLAYBACK_PRESETS[normalized] ? normalized : 'chill';
  };

  const ensureCtx = () => {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    synthGain = ctx.createGain();
    synthGain.gain.value = clamp01(vol, parseFloat(DEFAULT_PREFS.musicVol));
    synthGain.connect(ctx.destination);
    bindResumeEvents();
  };

  const resumeAllAudio = () => {
    if (speechPauseTokens.size) return;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (audioEl && mode !== 'off' && audioEl.paused && !transportPaused) {
      audioEl.play().catch(() => {});
    }
  };

  const bindResumeEvents = () => {
    if (resumeBound) return;
    resumeBound = true;
    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
      document.addEventListener(eventName, resumeAllAudio, { passive: true });
    });
  };

  const beep = (freq, dur = 0.12, type = 'sine', peak = 0.12) => {
    if (!ctx || !synthGain) return;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    envelope.gain.value = 0.0001;
    oscillator.connect(envelope);
    envelope.connect(synthGain);
    const now = ctx.currentTime;
    envelope.gain.exponentialRampToValueAtTime(peak, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    oscillator.start(now);
    oscillator.stop(now + dur + 0.02);
  };

  const stopSynth = () => {
    if (synthInterval) clearInterval(synthInterval);
    synthInterval = null;
  };

  const startSynth = (playMode) => {
    stopSynth();
    if (playMode === 'off') return;
    ensureCtx();
    resumeAllAudio();
    const preset = PLAYBACK_PRESETS[playMode] || PLAYBACK_PRESETS.chill;
    let seq = Math.random() < 0.5 ? preset.seq : (ALT_SEQS[playMode] || preset.seq);
    let index = 0;
    synthInterval = setInterval(() => {
      if (index > 0 && index % seq.length === 0) {
        seq = Math.random() < 0.5 ? preset.seq : (ALT_SEQS[playMode] || preset.seq);
      }
      const freq = seq[index % seq.length];
      if (freq) beep(freq, preset.dur, preset.wave, preset.level);
      index += 1;
    }, preset.tempo);
  };

  const ensureAudioEl = () => {
    if (audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.preload = 'auto';
    audioEl.addEventListener('error', () => {
      if (mode === 'off') return;
      startSynth(mode);
    });
    return audioEl;
  };

  const stopTrack = () => {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.removeAttribute('src');
    try { audioEl.load(); } catch {}
  };

  const pauseTransport = () => {
    transportPaused = true;
    stopSynth();
    if (audioEl) audioEl.pause();
  };

  const resumeTransport = async () => {
    if (mode === 'off') return;
    if (speechPauseTokens.size) return;
    transportPaused = false;
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    if (audioEl && audioEl.src) {
      try {
        await audioEl.play();
        return;
      } catch {}
    }
    await start();
  };

  const normalizeTrack = (rawTrack) => {
    if (!rawTrack || typeof rawTrack !== 'object') return null;
    const src = String(rawTrack.src || '').trim();
    if (!src) return null;
    const id = String(rawTrack.id || src).trim();
    const modes = Array.from(new Set(
      (Array.isArray(rawTrack.modes) ? rawTrack.modes : [])
        .map(normalizePlaybackMode)
        .filter((entry) => entry !== 'off')
    ));
    if (!modes.length) modes.push('focus');
    const gain = clamp01(parseFloat(rawTrack.gain), 1);
    return {
      id,
      src,
      modes,
      gain
    };
  };

  const normalizeCatalog = (payload) => {
    const tracks = Array.isArray(payload?.tracks)
      ? payload.tracks.map(normalizeTrack).filter(Boolean)
      : [];
    if (!tracks.length) return null;
    const modeIndex = {};
    tracks.forEach((track) => {
      track.modes.forEach((tag) => {
        if (!modeIndex[tag]) modeIndex[tag] = [];
        modeIndex[tag].push(track);
      });
    });
    return { tracks, modeIndex };
  };

  const loadCatalog = async () => {
    if (catalog) return catalog;
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch(MUSIC_CATALOG_URL, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => normalizeCatalog(payload))
      .catch(() => null)
      .then((nextCatalog) => {
        catalog = nextCatalog;
        return catalog;
      });
    return catalogPromise;
  };

  const chooseTrack = (playMode) => {
    let options = customTracks.length
      ? customTracks
      : (catalog?.modeIndex?.[playMode] || []);
    if (!options.length && !customTracks.length) {
      options = catalog?.modeIndex?.focus || [];
    }
    if (!options.length) return null;
    if (options.length === 1) return options[0];
    const pool = options.filter((track) => track.id !== activeTrackId);
    const source = pool.length ? pool : options;
    const index = Math.floor(Math.random() * source.length);
    return source[index];
  };

  const clearCustomTracks = () => {
    customTracks.forEach((track) => {
      if (!track?.src || !String(track.src).startsWith('blob:')) return;
      try { URL.revokeObjectURL(track.src); } catch {}
    });
    customTracks = [];
  };

  const setTrackVolume = (trackGain = 1) => {
    if (!audioEl) return;
    audioEl.volume = clamp01(vol * clamp01(trackGain, 1), vol);
  };

  const pauseForSpeech = (token) => {
    if (!token) return;
    speechPauseTokens.add(token);
    if (speechPausedActive) return;
    shouldResumeAfterSpeech = !transportPaused && mode !== 'off' && (!!synthInterval || !!(audioEl && !audioEl.paused));
    speechPausedActive = true;
    stopSynth();
    if (audioEl) audioEl.pause();
  };

  const resumeAfterSpeech = (token) => {
    if (token) speechPauseTokens.delete(token);
    if (speechPauseTokens.size) return;
    const shouldResume = speechPausedActive && shouldResumeAfterSpeech && mode !== 'off';
    speechPausedActive = false;
    shouldResumeAfterSpeech = false;
    if (shouldResume) void start();
  };

  const playCatalogTrack = async (playMode, token) => {
    await loadCatalog();
    if (token !== playbackToken || playMode !== mode || !catalog) {
      return { started: false, blocked: false };
    }
    const track = chooseTrack(playMode);
    if (!track) return { started: false, blocked: false };

    const player = ensureAudioEl();
    const resolveTrackSrc = (rawSrc) => {
      const src = String(rawSrc || '').trim();
      if (!src) return '';
      if (/^(?:blob:|data:|https?:)/i.test(src)) return src;
      // Support GH Pages subpath deploys by resolving root-like paths as app-relative.
      const normalized = src.startsWith('/') ? src.slice(1) : src;
      return new URL(normalized, window.location.href).toString();
    };
    const resolvedTrackUrl = resolveTrackSrc(track.src);
    if (!resolvedTrackUrl) return { started: false, blocked: false };
    if (player.src !== resolvedTrackUrl) player.src = resolvedTrackUrl;
    player.currentTime = 0;
    setTrackVolume(track.gain);
    try {
      await player.play();
      activeTrackId = track.id;
      player.dataset.wqTrackGain = String(track.gain || 1);
      return { started: true, blocked: false };
    } catch (error) {
      const blocked = String(error?.name || '').toLowerCase() === 'notallowederror';
      return { started: false, blocked };
    }
  };

  const start = async () => {
    const playMode = normalizePlaybackMode(mode);
    const token = ++playbackToken;
    stopSynth();
    if (speechPauseTokens.size) return;
    if (playMode === 'off') {
      transportPaused = false;
      activeTrackId = '';
      stopTrack();
      return;
    }
    if (transportPaused) return;

    const catalogPlayback = await playCatalogTrack(playMode, token);
    if (token !== playbackToken || playMode !== mode) return;
    if (!catalogPlayback.started) {
      if (catalogPlayback.blocked) {
        // Browser autoplay gate: wait for user interaction to resume real tracks.
        activeTrackId = '';
        stopSynth();
        return;
      }
      activeTrackId = '';
      stopTrack();
      startSynth(playMode);
    }
  };

  return {
    setMode(nextMode) {
      mode = normalizePlaybackMode(nextMode);
      transportPaused = false;
      void start();
    },
    setVolume(value) {
      const next = Number.isFinite(value) ? value : parseFloat(DEFAULT_PREFS.musicVol);
      vol = clamp01(next, parseFloat(DEFAULT_PREFS.musicVol));
      if (synthGain) synthGain.gain.value = vol;
      const trackGain = parseFloat(audioEl?.dataset?.wqTrackGain || '1');
      setTrackVolume(Number.isFinite(trackGain) ? trackGain : 1);
    },
    pauseForSpeech,
    resumeAfterSpeech,
    isPausedForSpeech() {
      return speechPausedActive || speechPauseTokens.size > 0;
    },
    pause() {
      pauseTransport();
    },
    resume() {
      void resumeTransport();
    },
    getPlaybackState() {
      if (mode === 'off') return 'paused';
      if (speechPausedActive || speechPauseTokens.size || transportPaused) return 'paused';
      return 'playing';
    },
    initFromPrefs(prefState) {
      mode = normalizePlaybackMode(prefState.music || DEFAULT_PREFS.music);
      vol = clamp01(parseFloat(prefState.musicVol), parseFloat(DEFAULT_PREFS.musicVol));
      if (synthGain) synthGain.gain.value = vol;
      void loadCatalog();
      void start();
    },
    setCustomFiles(fileList) {
      const files = Array.from(fileList || [])
        .filter((file) => file && /^audio\//i.test(String(file.type || '')) && Number(file.size || 0) > 0);
      clearCustomTracks();
      const modeTags = Object.keys(PLAYBACK_PRESETS);
      customTracks = files.map((file, index) => ({
        id: `local-${Date.now()}-${index}`,
        src: URL.createObjectURL(file),
        modes: modeTags,
        gain: 1,
        name: file.name || `Track ${index + 1}`
      }));
      activeTrackId = '';
      if (mode !== 'off') void start();
      return { count: customTracks.length };
    },
    clearCustomFiles() {
      clearCustomTracks();
      activeTrackId = '';
      if (mode !== 'off') void start();
      return { count: 0 };
    },
    getCustomFileCount() {
      return customTracks.length;
    }
  };
}
