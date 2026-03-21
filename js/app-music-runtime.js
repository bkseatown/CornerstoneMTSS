/**
 * app-music-runtime.js
 * Quick music/theme popovers, music controls, hotkeys, progress UI, and media auto-pause wiring.
 */

function createMusicRuntimeModule(deps) {
  const {
    createMusicModule = null,
    DEFAULT_PREFS = {},
    closeQuickPopover = () => {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    getMusicController = () => null,
    isQuickPopoverAllowed = () => false,
    normalizeCuratedMusicMode = (value) => value,
    normalizeVoiceMode = (value) => value,
    onInitQuestLoop = () => {},
    onMusicControllerReady = () => {},
    onPrimeAudioManifest = () => {},
    setLocalMusicFiles = () => {},
    setPref = () => {},
    syncDemoModeUi = () => {},
    shuffleMusicVibe = () => {},
    shouldPersistTheme = () => true,
    stepMusicVibe = () => {},
    syncMusicForTheme = () => {},
    syncQuickMusicVolume = () => {},
    toggleMusicQuick = () => {},
    toggleQuickPopover = () => {},
    WQAudio = null,
    windowRef = window
  } = deps || {};

  let progressTimer = 0;
  let retryProgressTimer = 0;

  function formatTime(seconds) {
    const secs = Math.floor(seconds);
    const mins = Math.floor(secs / 60);
    const displaySecs = secs % 60;
    return `${mins}:${String(displaySecs).padStart(2, '0')}`;
  }

  function updateMusicProgress() {
    const musicController = getMusicController();
    const audioEl = musicController?.getAudioElement?.();
    const trackInfo = musicController?.getCurrentTrackInfo?.();
    const titleEl = el('quick-music-song-title');
    const progressEl = el('quick-music-progress');
    const currentEl = el('quick-music-time-current');
    const durationEl = el('quick-music-time-duration');

    if (!audioEl) {
      if (titleEl) titleEl.textContent = 'No song playing';
      if (progressEl) progressEl.value = 0;
      if (currentEl) currentEl.textContent = '0:00';
      if (durationEl) durationEl.textContent = '0:00';
      return;
    }

    if (titleEl && trackInfo?.title) {
      const displayTitle = trackInfo.title || 'Playing...';
      if (titleEl.textContent !== displayTitle) {
        titleEl.textContent = displayTitle;
      }
    }

    if (progressEl && audioEl.duration) {
      const percent = (audioEl.currentTime / audioEl.duration) * 100;
      progressEl.value = percent;
    }

    if (currentEl) currentEl.textContent = formatTime(audioEl.currentTime || 0);
    if (durationEl) durationEl.textContent = formatTime(audioEl.duration || 0);
  }

  function ensureProgressUpdater() {
    if (progressTimer || retryProgressTimer) return;
    const musicController = getMusicController();
    if (musicController?.getAudioElement?.()) {
      progressTimer = windowRef.setInterval(updateMusicProgress, 200);
      return;
    }
    retryProgressTimer = windowRef.setInterval(() => {
      const nextController = getMusicController();
      if (!nextController?.getAudioElement?.()) return;
      windowRef.clearInterval(retryProgressTimer);
      retryProgressTimer = 0;
      progressTimer = windowRef.setInterval(updateMusicProgress, 200);
    }, 1000);
  }

  function bindQuickPopoverControls() {
    el('theme-dock-toggle-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (!isQuickPopoverAllowed()) return;
      toggleQuickPopover('theme');
    });
    el('theme-name-indicator')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (!isQuickPopoverAllowed()) {
        el('settings-btn')?.click();
        return;
      }
      toggleQuickPopover('theme');
    });
    el('music-dock-toggle-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (!isQuickPopoverAllowed()) return;
      toggleQuickPopover('music');
    });
    el('theme-preview-done')?.addEventListener('click', () => {
      closeQuickPopover('theme');
    });
    el('theme-preview-slot')?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        if (windowRef.WQThemeNav && typeof windowRef.WQThemeNav.cycleTheme === 'function') {
          windowRef.WQThemeNav.cycleTheme(-1);
          event.preventDefault();
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        if (windowRef.WQThemeNav && typeof windowRef.WQThemeNav.cycleTheme === 'function') {
          windowRef.WQThemeNav.cycleTheme(1);
          event.preventDefault();
        }
      } else if (event.key === 'Escape') {
        closeQuickPopover('theme');
        event.preventDefault();
      }
    });
    el('quick-music-done')?.addEventListener('click', () => {
      closeQuickPopover('music');
    });
  }

  function bindMusicControls() {
    el('quick-music-toggle')?.addEventListener('click', () => {
      toggleMusicQuick();
    });
    el('quick-music-prev')?.addEventListener('click', () => {
      stepMusicVibe(-1);
    });
    el('quick-music-next')?.addEventListener('click', () => {
      stepMusicVibe(1);
    });
    el('quick-music-shuffle')?.addEventListener('click', () => {
      shuffleMusicVibe();
    });
    el('s-music')?.addEventListener('change', (event) => {
      const selected = normalizeCuratedMusicMode(event.target.value);
      event.target.value = selected;
      setPref('music', selected);
      syncMusicForTheme({ toast: true });
    });
    el('s-music-vol')?.addEventListener('input', (event) => {
      const next = Math.max(0, Math.min(1, parseFloat(event.target.value)));
      const musicController = getMusicController();
      setPref('musicVol', String(Number.isFinite(next) ? next : parseFloat(DEFAULT_PREFS.musicVol)));
      musicController?.setVolume?.(next);
      syncQuickMusicVolume(next);
    });
    el('quick-music-vol')?.addEventListener('input', (event) => {
      const next = Math.max(0, Math.min(1, parseFloat(event.target.value)));
      const normalized = String(Number.isFinite(next) ? next : parseFloat(DEFAULT_PREFS.musicVol));
      const settingsInput = el('s-music-vol');
      const musicController = getMusicController();
      if (settingsInput) settingsInput.value = normalized;
      setPref('musicVol', normalized);
      musicController?.setVolume?.(next);
      syncQuickMusicVolume(next);
    });
    el('s-music-upload')?.addEventListener('change', (event) => {
      const files = event.target?.files || [];
      setLocalMusicFiles(files);
    });
    el('s-music-clear-local')?.addEventListener('click', () => {
      deps.clearLocalMusicFiles?.();
      const settingsInput = el('s-music-upload');
      if (settingsInput) settingsInput.value = '';
    });
    el('quick-music-progress')?.addEventListener('input', (event) => {
      const musicController = getMusicController();
      const audioEl = musicController?.getAudioElement?.();
      if (!audioEl || !audioEl.duration) return;
      const percent = parseFloat(event.target.value) / 100;
      audioEl.currentTime = percent * audioEl.duration;
    });
  }

  function bindGlobalMusicHotkeys() {
    documentRef.addEventListener('keydown', (event) => {
      if (event.target?.matches('input, textarea, select, [contenteditable]')) return;
      switch (event.code) {
        case 'F7':
          event.preventDefault();
          stepMusicVibe(-1);
          break;
        case 'F8':
          event.preventDefault();
          toggleMusicQuick();
          break;
        case 'F9':
          event.preventDefault();
          stepMusicVibe(1);
          break;
        case 'F10':
          event.preventDefault();
          shuffleMusicVibe();
          break;
        case 'F11': {
          event.preventDefault();
          const volDown = el('quick-music-vol') || el('s-music-vol');
          if (!volDown) break;
          const current = parseFloat(volDown.value) || 0.5;
          volDown.value = Math.max(0, current - 0.1);
          volDown.dispatchEvent(new Event('input'));
          break;
        }
        case 'F12': {
          event.preventDefault();
          const volUp = el('quick-music-vol') || el('s-music-vol');
          if (!volUp) break;
          const current = parseFloat(volUp.value) || 0.5;
          volUp.value = Math.min(1, current + 0.1);
          volUp.dispatchEvent(new Event('input'));
          break;
        }
      }
    });
  }

  function bindVoiceAudioAutoPause() {
    const pauseMusicOnVoiceAudio = () => {
      const musicController = getMusicController();
      if (musicController && el('s-music')?.value !== 'off') {
        musicController.pause?.();
      }
    };
    documentRef.addEventListener('play', pauseMusicOnVoiceAudio, true);
  }

  function initThemeApi() {
    windowRef.WQTheme = Object.freeze({
      getTheme() {
        return deps.normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), deps.getThemeFallback());
      },
      setTheme(nextTheme, options = {}) {
        const normalized = deps.applyTheme(nextTheme);
        if (options.persist !== false && shouldPersistTheme()) setPref('theme', normalized);
        return normalized;
      },
      getOrder() {
        if (windowRef.ThemeRegistry && Array.isArray(windowRef.ThemeRegistry.order)) return windowRef.ThemeRegistry.order.slice();
        return ['default'];
      },
      getLabel(themeId) {
        if (windowRef.ThemeRegistry && typeof windowRef.ThemeRegistry.getLabel === 'function') {
          return windowRef.ThemeRegistry.getLabel(themeId);
        }
        return deps.normalizeTheme(themeId, deps.getThemeFallback());
      }
    });
  }

  function movePopoversOutOfPlayShell() {
    const musicPopover = el('quick-music-strip');
    const themePopover = el('theme-preview-strip');
    if (musicPopover && musicPopover.parentElement?.id === 'play-shell') {
      documentRef.body.appendChild(musicPopover);
    }
    if (themePopover && themePopover.parentElement?.id === 'play-shell') {
      documentRef.body.appendChild(themePopover);
    }
  }

  function init() {
    if (documentRef.body?.dataset.wqMusicRuntimeBound === '1') return;
    movePopoversOutOfPlayShell();
    bindQuickPopoverControls();
    bindMusicControls();
    bindGlobalMusicHotkeys();
    bindVoiceAudioAutoPause();
    ensureProgressUpdater();
    initThemeApi();
    documentRef.body.dataset.wqMusicRuntimeBound = '1';
  }

  function initMusicRuntime(prefs = {}) {
    const controller = typeof createMusicModule === 'function'
      ? createMusicModule(DEFAULT_PREFS)
      : null;
    if (!controller) return null;
    if (WQAudio && typeof WQAudio.setVoiceMode === 'function') {
      WQAudio.setVoiceMode(normalizeVoiceMode(prefs.voice || DEFAULT_PREFS.voice));
    }
    onPrimeAudioManifest();
    onMusicControllerReady(controller);
    windowRef.WQMusicSpeechBridge = {
      pauseForSpeech(token) {
        controller.pauseForSpeech(token);
      },
      resumeAfterSpeech(token) {
        controller.resumeAfterSpeech(token);
      },
      isPausedForSpeech() {
        return controller.isPausedForSpeech();
      }
    };
    windowRef.WQMusicControls = {
      pause() {
        controller.pause();
      },
      resume() {
        controller.resume();
      },
      getPlaybackState() {
        return controller.getPlaybackState();
      }
    };
    controller.initFromPrefs(prefs);
    syncMusicForTheme();
    onInitQuestLoop();
    syncDemoModeUi();
    return controller;
  }

  return Object.freeze({
    init,
    initMusicRuntime,
    updateMusicProgress
  });
}

window.createMusicRuntimeModule = createMusicRuntimeModule;
