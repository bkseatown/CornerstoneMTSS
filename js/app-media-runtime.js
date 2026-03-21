/**
 * app-media-runtime.js
 * Media normalization, music mode/runtime helpers, and Media Session wiring.
 */

function createMediaRuntimeModule(deps) {
  const {
    allowedMasteryFilterModes = new Set(),
    allowedMasterySortModes = new Set(),
    allowedMusicModes = new Set(),
    allowedVoiceModes = new Set(),
    autoMusicByFamily = {},
    autoMusicByTheme = {},
    defaultPrefs = {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    emitTelemetry = () => {},
    getMusicController = () => null,
    getTelemetryLastMusicSignature = () => '',
    getThemeFallback = () => 'default',
    getThemeFamily = () => 'default',
    getPrefs = () => ({}),
    lastNonOffMusicKey = '',
    localStorageRef = globalThis.localStorage,
    musicLabels = {},
    normalizeTheme = (value) => value,
    quickMusicVibeOrder = [],
    setHoverNoteForElement = () => {},
    setPref = () => {},
    setTelemetryLastMusicSignature = () => {},
    showToast = () => {},
    windowRef = window
  } = deps || {};

  function resolveConfigValue(value) {
    return typeof value === 'function' ? value() : value;
  }

  function normalizeMusicMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return allowedMusicModes.has(normalized) ? normalized : defaultPrefs.music;
  }

  function normalizeVoiceMode(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return allowedVoiceModes.has(normalized) ? normalized : defaultPrefs.voice;
  }

  function normalizeRevealPacing(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    return normalized === 'quick' || normalized === 'slow' ? normalized : defaultPrefs.revealPacing;
  }

  function normalizeRevealAutoNext(mode) {
    const normalized = String(mode || '').trim().toLowerCase();
    if (normalized === 'off') return 'off';
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return defaultPrefs.revealAutoNext;
    if (seconds <= 3) return '3';
    if (seconds <= 5) return '5';
    return '8';
  }

  function normalizeTeamMode(mode) {
    return String(mode || '').trim().toLowerCase() === 'on' ? 'on' : 'off';
  }

  function normalizeTeamCount(value) {
    const count = Number.parseInt(String(value || '').trim(), 10);
    if (!Number.isFinite(count) || count < 2) return '2';
    if (count > 4) return '4';
    return String(count);
  }

  function normalizeTurnTimer(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'off') return 'off';
    const seconds = Number.parseInt(normalized, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return 'off';
    if (seconds <= 30) return '30';
    if (seconds <= 45) return '45';
    return '60';
  }

  function normalizeTeamSet(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return deps.teamLabelSets?.[normalized] ? normalized : defaultPrefs.teamSet;
  }

  function normalizeReportCompactMode(value) {
    return String(value || '').trim().toLowerCase() === 'on' ? 'on' : 'off';
  }

  function normalizeMasterySort(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return allowedMasterySortModes.has(normalized) ? normalized : 'attempts_desc';
  }

  function normalizeMasteryFilter(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return allowedMasteryFilterModes.has(normalized) ? normalized : 'all';
  }

  function resolveAutoMusicMode(themeId) {
    const familyMap = resolveConfigValue(autoMusicByFamily) || {};
    const themeMap = resolveConfigValue(autoMusicByTheme) || {};
    const normalizedTheme = normalizeTheme(themeId, getThemeFallback());
    const directMode = themeMap[normalizedTheme];
    if (directMode) return directMode;
    return familyMap[getThemeFamily(normalizedTheme)] || 'chill';
  }

  function syncQuickMusicDock(selectedMode, activeMode) {
    const toggleBtn = el('quick-music-toggle');
    const prevBtn = el('quick-music-prev');
    const nextBtn = el('quick-music-next');
    const shuffleBtn = el('quick-music-shuffle');
    const labelEl = el('quick-music-label');
    if (!toggleBtn) return;
    const prefs = getPrefs();
    const selected = normalizeMusicMode(selectedMode || el('s-music')?.value || prefs.music || defaultPrefs.music);
    const active = normalizeMusicMode(activeMode || (selected === 'auto'
      ? resolveAutoMusicMode(normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback()))
      : selected));
    const isOn = selected !== 'off';
    const activeLabel = musicLabels[active] || active;
    toggleBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    toggleBtn.classList.toggle('is-on', isOn);
    toggleBtn.setAttribute('data-music-state', isOn ? 'on' : 'off');
    toggleBtn.textContent = isOn ? '⏸' : '▶';
    toggleBtn.setAttribute('aria-label', isOn ? `Pause music. Current vibe: ${activeLabel}.` : 'Play music.');
    setHoverNoteForElement(toggleBtn, isOn ? `Pause music (${activeLabel}).` : 'Play music.');
    [prevBtn, nextBtn, shuffleBtn].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('is-on', isOn);
    });
    if (prevBtn) setHoverNoteForElement(prevBtn, `Previous vibe (now ${activeLabel}).`);
    if (nextBtn) setHoverNoteForElement(nextBtn, `Next vibe (now ${activeLabel}).`);
    if (shuffleBtn) setHoverNoteForElement(shuffleBtn, `Shuffle vibe (now ${activeLabel}).`);
    if (labelEl) labelEl.textContent = isOn ? activeLabel : 'Stopped';
    if (isOn) {
      try {
        localStorageRef?.setItem?.(lastNonOffMusicKey, selected === 'auto' ? 'auto' : active);
      } catch {}
    }
  }

  function updateMusicStatus(selectedMode, activeMode) {
    const status = el('s-music-active');
    if (!status) return;
    if (selectedMode === 'off') {
      status.textContent = 'Music is stopped.';
      syncQuickMusicDock('off', activeMode);
      return;
    }
    const activeLabel = musicLabels[activeMode] || activeMode;
    if (selectedMode === 'auto') {
      status.textContent = `Auto picks ${activeLabel} for the active theme.`;
      syncQuickMusicDock(selectedMode, activeMode);
      return;
    }
    status.textContent = `Fixed music vibe: ${activeLabel}.`;
    syncQuickMusicDock(selectedMode, activeMode);
  }

  function syncMediaSessionControls(selectedMode, activeMode) {
    if (!('mediaSession' in navigator)) return;
    const prefs = getPrefs();
    const selected = normalizeMusicMode(selectedMode || el('s-music')?.value || prefs.music || defaultPrefs.music);
    const active = normalizeMusicMode(activeMode || (selected === 'auto'
      ? resolveAutoMusicMode(normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback()))
      : selected));
    const musicController = getMusicController();
    const playbackState = selected === 'off'
      ? 'paused'
      : (musicController && typeof musicController.getPlaybackState === 'function'
        ? musicController.getPlaybackState()
        : 'playing');
    const vibeLabel = musicLabels[active] || active;
    try {
      navigator.mediaSession.playbackState = playbackState === 'paused' ? 'paused' : 'playing';
    } catch {}
    try {
      navigator.mediaSession.metadata = new windowRef.MediaMetadata({
        title: `Word Quest ${vibeLabel}`,
        artist: 'Cornerstone MTSS',
        album: 'Word Quest'
      });
    } catch {}
  }

  function getPreferredMusicOnMode() {
    try {
      const stored = normalizeMusicMode(localStorageRef?.getItem?.(lastNonOffMusicKey) || '');
      if (stored && stored !== 'off') return stored;
    } catch {}
    const prefs = getPrefs();
    const pref = normalizeMusicMode(el('s-music')?.value || prefs.music || defaultPrefs.music);
    if (pref !== 'off') return pref;
    return 'auto';
  }

  function getCurrentMusicVibeForControls() {
    const prefs = getPrefs();
    const selected = normalizeMusicMode(el('s-music')?.value || prefs.music || defaultPrefs.music);
    if (selected === 'off') return getPreferredMusicOnMode();
    if (selected === 'auto') {
      const activeTheme = normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
      return resolveAutoMusicMode(activeTheme);
    }
    return selected;
  }

  function syncQuickMusicVolume(value) {
    const quickVolume = el('quick-music-vol');
    if (!quickVolume) return;
    const next = Math.max(0, Math.min(1, Number.parseFloat(value)));
    quickVolume.value = String(Number.isFinite(next) ? next : Number.parseFloat(defaultPrefs.musicVol));
  }

  function syncMusicForTheme(options = {}) {
    const prefs = getPrefs();
    const selected = normalizeMusicMode(el('s-music')?.value || prefs.music || defaultPrefs.music);
    const activeTheme = normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    const effective = selected === 'auto' ? resolveAutoMusicMode(activeTheme) : selected;
    const musicController = getMusicController();
    if (musicController) musicController.setMode(effective);
    updateMusicStatus(selected, effective);
    syncMediaSessionControls(selected, effective);
    const signature = `${selected}::${effective}`;
    if (getTelemetryLastMusicSignature() !== signature) {
      setTelemetryLastMusicSignature(signature);
      emitTelemetry('wq_music_change', {
        selected_music_mode: selected,
        active_music_mode: effective,
        source: options.toast ? 'user' : 'system'
      });
    }
    if (options.toast) {
      const label = musicLabels[effective] || effective;
      showToast(selected === 'auto' ? `Music auto: ${label}.` : `Music: ${label}.`);
    }
  }

  function applyMusicModeFromQuick(mode, options = {}) {
    const next = normalizeMusicMode(mode);
    if (next === 'off') return;
    const select = el('s-music');
    if (select) select.value = next;
    setPref('music', next);
    syncMusicForTheme({ toast: options.toast !== false });
  }

  function toggleMusicQuick() {
    const prefs = getPrefs();
    const select = el('s-music');
    const current = normalizeMusicMode(select?.value || prefs.music || defaultPrefs.music);
    const next = current === 'off' ? getPreferredMusicOnMode() : 'off';
    if (select) select.value = next;
    setPref('music', next);
    syncMusicForTheme({ toast: true });
  }

  function stepMusicVibe(direction = 1) {
    const current = getCurrentMusicVibeForControls();
    const idx = Math.max(0, quickMusicVibeOrder.indexOf(current));
    const next = quickMusicVibeOrder[(idx + direction + quickMusicVibeOrder.length) % quickMusicVibeOrder.length];
    applyMusicModeFromQuick(next, { toast: true });
  }

  function shuffleMusicVibe() {
    const current = getCurrentMusicVibeForControls();
    const pool = quickMusicVibeOrder.filter((mode) => mode !== current);
    const next = pool[Math.floor(Math.random() * pool.length)] || current;
    applyMusicModeFromQuick(next, { toast: true });
  }

  function setLocalMusicFiles(fileList) {
    const msgEl = el('s-music-upload-msg');
    const files = Array.from(fileList || [])
      .filter((file) => file && /^audio\//i.test(String(file.type || '')) && Number(file.size || 0) > 0);
    const musicController = getMusicController();
    if (!musicController || typeof musicController.setCustomFiles !== 'function') {
      if (msgEl) msgEl.textContent = 'Local upload is unavailable in this build.';
      return;
    }
    if (!files.length) {
      if (msgEl) msgEl.textContent = 'No valid audio files selected.';
      return;
    }
    const result = musicController.setCustomFiles(files);
    const count = Number(result?.count || 0);
    const prefs = getPrefs();
    const selected = normalizeMusicMode(el('s-music')?.value || prefs.music || defaultPrefs.music);
    if (selected === 'off') {
      applyMusicModeFromQuick(getPreferredMusicOnMode(), { toast: false });
    } else {
      syncMusicForTheme({ toast: false });
    }
    const message = count > 0
      ? `Loaded ${count} local track${count === 1 ? '' : 's'} for this device.`
      : 'No valid audio files selected.';
    if (msgEl) msgEl.textContent = message;
    showToast(message);
  }

  function clearLocalMusicFiles() {
    const msgEl = el('s-music-upload-msg');
    const musicController = getMusicController();
    if (musicController && typeof musicController.clearCustomFiles === 'function') {
      musicController.clearCustomFiles();
    }
    syncMusicForTheme({ toast: false });
    if (msgEl) msgEl.textContent = 'Local MP3 list cleared.';
    showToast('Local MP3 list cleared.');
  }

  function installMediaSessionControls() {
    if (!('mediaSession' in navigator)) return;
    const safeBind = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, (details) => {
          handler(details);
        });
      } catch {}
    };
    safeBind('play', () => {
      const prefs = getPrefs();
      const selected = normalizeMusicMode(el('s-music')?.value || prefs.music || defaultPrefs.music);
      const musicController = getMusicController();
      if (selected === 'off') {
        const next = getPreferredMusicOnMode();
        applyMusicModeFromQuick(next, { toast: false });
        return;
      }
      if (musicController && typeof musicController.resume === 'function') {
        musicController.resume();
      } else {
        syncMusicForTheme({ toast: false });
      }
      syncMediaSessionControls();
    });
    safeBind('pause', () => {
      const musicController = getMusicController();
      if (musicController && typeof musicController.pause === 'function') {
        musicController.pause();
      }
      syncMediaSessionControls();
    });
    safeBind('nexttrack', () => {
      stepMusicVibe(1);
    });
    safeBind('previoustrack', () => {
      stepMusicVibe(-1);
    });
    try {
      navigator.mediaSession.playbackState = 'paused';
    } catch {}
  }

  return {
    applyMusicModeFromQuick,
    clearLocalMusicFiles,
    getCurrentMusicVibeForControls,
    getPreferredMusicOnMode,
    installMediaSessionControls,
    normalizeMasteryFilter,
    normalizeMasterySort,
    normalizeMusicMode,
    normalizeReportCompactMode,
    normalizeRevealAutoNext,
    normalizeRevealPacing,
    normalizeTeamCount,
    normalizeTeamMode,
    normalizeTeamSet,
    normalizeTurnTimer,
    normalizeVoiceMode,
    resolveAutoMusicMode,
    setLocalMusicFiles,
    shuffleMusicVibe,
    stepMusicVibe,
    syncMediaSessionControls,
    syncMusicForTheme,
    syncQuickMusicDock,
    syncQuickMusicVolume,
    toggleMusicQuick,
    updateMusicStatus
  };
}

window.createMediaRuntimeModule = createMediaRuntimeModule;
