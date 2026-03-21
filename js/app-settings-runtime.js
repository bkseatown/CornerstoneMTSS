/**
 * app-settings-runtime.js
 * Teacher presets, first-run setup, settings tabs, and quick-popover helpers.
 */

function createSettingsRuntimeModule(deps) {
  const {
    DEFAULT_PREFS = {},
    WQAudio = null,
    closeFocusSearchList = () => {},
    cancelRevealNarration = () => {},
    detectTeacherPreset = () => '',
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    firstRunSetupKey = '',
    getHintMode = () => 'on',
    getRevealFocusMode = () => 'on',
    getVoicePracticeMode = () => 'optional',
    handleLessonPackSelectionChange = () => false,
    hideMidgameBoost = () => {},
    isAssessmentLockEnabled = () => false,
    isAssessmentRoundLocked = () => false,
    isConfidenceCoachingEnabled = () => false,
    isMissionLabStandaloneMode = () => false,
    normalizeLessonPackId = (value) => value,
    normalizePlayStyle = (value) => value,
    normalizeVoiceMode = (value) => value,
    onFirstRunContinue = () => {},
    prefs = {},
    setConfidenceCoachingMode = () => {},
    setFocusValue = () => {},
    setHintMode = () => {},
    setPref = () => {},
    setRevealFocusMode = () => {},
    setVoicePracticeMode = () => {},
    showAssessmentLockNotice = () => {},
    showToast = () => {},
    syncAssessmentLockRuntime = () => {},
    syncHeaderControlsVisibility = () => {},
    syncRevealFocusModalSections = () => {},
    updateVoicePracticePanel = () => {},
    windowRef = window
  } = deps || {};

  const SETTINGS_VIEWS = new Set(['quick', 'advanced']);
  const TEACHER_PRESETS = Object.freeze({
    guided: Object.freeze({ hint: 'on', confidenceCoaching: 'on', revealFocus: 'on', voicePractice: 'required', voice: 'recorded', assessmentLock: 'off', boostPopups: 'on', confetti: 'on' }),
    independent: Object.freeze({ hint: 'off', confidenceCoaching: 'off', revealFocus: 'on', voicePractice: 'optional', voice: 'recorded', assessmentLock: 'off', boostPopups: 'on', confetti: 'on' }),
    assessment: Object.freeze({ hint: 'off', confidenceCoaching: 'off', revealFocus: 'on', voicePractice: 'off', voice: 'off', assessmentLock: 'on', boostPopups: 'off', confetti: 'off' }),
    'k2-phonics': Object.freeze({ hint: 'on', confidenceCoaching: 'on', revealFocus: 'on', voicePractice: 'required', voice: 'recorded', assessmentLock: 'off', boostPopups: 'on', confetti: 'on', focus: 'cvc', grade: 'K-2', lessonPack: 'custom' }),
    '35-vocab': Object.freeze({ hint: 'on', confidenceCoaching: 'off', revealFocus: 'on', voicePractice: 'optional', voice: 'recorded', assessmentLock: 'off', boostPopups: 'on', confetti: 'on', focus: 'vocab-ela-35', grade: 'G3-5', lessonPack: 'custom' }),
    intervention: Object.freeze({ hint: 'on', confidenceCoaching: 'on', revealFocus: 'on', voicePractice: 'required', voice: 'recorded', assessmentLock: 'on', boostPopups: 'off', confetti: 'off', focus: 'digraph', grade: 'K-2', lessonPack: 'custom' })
  });

  function syncTeacherPresetButtons(activePreset = detectTeacherPreset()) {
    documentRef.querySelectorAll('[data-teacher-preset]').forEach((btn) => {
      const isActive = btn.getAttribute('data-teacher-preset') === activePreset;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function applyTeacherPreset(mode) {
    if (isAssessmentRoundLocked()) {
      showAssessmentLockNotice();
      return false;
    }
    const preset = TEACHER_PRESETS[mode];
    if (!preset) return false;
    setHintMode(preset.hint);
    setConfidenceCoachingMode(preset.confidenceCoaching === 'on');
    setRevealFocusMode(preset.revealFocus);
    setVoicePracticeMode(preset.voicePractice, { toast: false });
    const voiceSelect = el('s-voice');
    if (voiceSelect) voiceSelect.value = preset.voice;
    WQAudio?.setVoiceMode?.(preset.voice);
    setPref('voice', preset.voice);
    const assessmentLockToggle = el('s-assessment-lock');
    if (assessmentLockToggle) assessmentLockToggle.checked = preset.assessmentLock === 'on';
    setPref('assessmentLock', preset.assessmentLock);
    const boostSelect = el('s-boost-popups');
    if (boostSelect) boostSelect.value = preset.boostPopups;
    setPref('boostPopups', preset.boostPopups);
    if (preset.boostPopups === 'off') hideMidgameBoost();
    const confettiSelect = el('s-confetti');
    if (confettiSelect) confettiSelect.value = preset.confetti;
    setPref('confetti', preset.confetti);
    if (preset.lessonPack) handleLessonPackSelectionChange(preset.lessonPack);
    if (preset.grade) {
      const gradeSelect = el('s-grade');
      if (gradeSelect) {
        gradeSelect.value = preset.grade;
        gradeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (preset.focus) setFocusValue(preset.focus, { force: true });
    if (preset.voice === 'off') cancelRevealNarration();
    updateVoicePracticePanel();
    syncRevealFocusModalSections();
    syncAssessmentLockRuntime();
    syncTeacherPresetButtons(mode);
    showToast(`Preset applied: ${mode}.`);
    return true;
  }

  function hasCompletedFirstRunSetup() {
    try { return localStorage.getItem(firstRunSetupKey) === 'done'; } catch { return false; }
  }

  function launchedFromGameGallery() {
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      return String(params.get('from') || '').trim().toLowerCase() === 'game-platform';
    } catch {
      return false;
    }
  }

  function closeFirstRunSetupModal() {
    el('first-run-setup-modal')?.classList.add('hidden');
  }

  function openFirstRunSetupModal(firstRunSetupPending) {
    const modal = el('first-run-setup-modal');
    if (!modal) return;
    const skipBtn = el('first-run-skip-btn');
    if (skipBtn) {
      skipBtn.disabled = !!firstRunSetupPending;
      skipBtn.classList.toggle('hidden', !!firstRunSetupPending);
      skipBtn.setAttribute('aria-hidden', firstRunSetupPending ? 'true' : 'false');
    }
    const hideAgainToggle = el('first-run-hide-again');
    if (hideAgainToggle) hideAgainToggle.checked = true;
    modal.classList.remove('hidden');
    el('settings-panel')?.classList.add('hidden');
    el('teacher-panel')?.classList.add('hidden');
    syncHeaderControlsVisibility();
  }

  function bindFirstRunSetupModal(stateRef) {
    if (documentRef.body.dataset.wqFirstRunSetupBound === '1') return;
    const closeTutorial = () => {
      try {
        if (el('first-run-hide-again')?.checked) localStorage.setItem(firstRunSetupKey, 'done');
        else localStorage.removeItem(firstRunSetupKey);
      } catch {}
      stateRef.set(false);
      closeFirstRunSetupModal();
      onFirstRunContinue();
    };
    el('first-run-skip-btn')?.addEventListener('click', closeTutorial);
    el('first-run-start-btn')?.addEventListener('click', closeTutorial);
    el('first-run-setup-modal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'first-run-setup-modal') closeTutorial();
    });
    documentRef.body.dataset.wqFirstRunSetupBound = '1';
  }

  function bindSettingsModeCards() {
    if (documentRef.body.dataset.wqSettingsModeCardsBound === '1') return;
    documentRef.querySelectorAll('[data-settings-play-style-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = normalizePlayStyle(button.getAttribute('data-settings-play-style-choice') || 'detective');
        const select = el('s-play-style');
        if (!select) return;
        select.value = next;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    documentRef.body.dataset.wqSettingsModeCardsBound = '1';
  }

  function setSettingsView(view, options = {}) {
    const next = SETTINGS_VIEWS.has(view) ? view : 'quick';
    const tabs = Array.from(documentRef.querySelectorAll('#settings-panel [data-settings-tab]'));
    const sections = Array.from(documentRef.querySelectorAll('#settings-panel [data-settings-section]'));
    tabs.forEach((tab) => {
      const active = tab.getAttribute('data-settings-tab') === next;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    sections.forEach((section) => {
      const active = section.getAttribute('data-settings-section') === next;
      section.classList.toggle('is-active', active);
      section.hidden = !active;
    });
    if (options.focus) {
      const activeTab = tabs.find((tab) => tab.getAttribute('data-settings-tab') === next);
      if (activeTab && typeof activeTab.focus === 'function') activeTab.focus();
    }
  }

  function bindSettingsAccordion(sectionSelector) {
    const groups = Array.from(documentRef.querySelectorAll(`${sectionSelector} .settings-group`));
    if (!groups.length) return;
    groups.forEach((group) => {
      group.addEventListener('toggle', () => {
        if (!(group instanceof HTMLDetailsElement) || !group.open) return;
        groups.forEach((other) => {
          if (other === group || !(other instanceof HTMLDetailsElement)) return;
          other.open = false;
        });
      });
    });
  }

  function jumpToSettingsGroup(groupId) {
    const target = el(groupId);
    if (!(target instanceof HTMLElement)) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function isQuickPopoverAllowed() {
    const panelOpen = !el('settings-panel')?.classList.contains('hidden');
    const teacherPanelOpen = !el('teacher-panel')?.classList.contains('hidden');
    const focusOpen = documentRef.documentElement.getAttribute('data-focus-search-open') === 'true';
    return !panelOpen && !teacherPanelOpen && !focusOpen && !isAssessmentRoundLocked();
  }

  function positionQuickPopover(popover, anchorBtn) {
    if (!(popover instanceof HTMLElement) || !(anchorBtn instanceof HTMLElement)) return;
    popover.style.right = 'auto';
    popover.style.left = '-9999px';
    const margin = 8;
    const anchorRect = anchorBtn.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    let left = anchorRect.right - popRect.width;
    left = Math.max(margin, Math.min(left, windowRef.innerWidth - popRect.width - margin));
    let top = anchorRect.bottom + 8;
    if (top + popRect.height > windowRef.innerHeight - margin) {
      top = Math.max(margin, anchorRect.top - popRect.height - 8);
    }
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function syncQuickPopoverPositions() {
    const themePopover = el('theme-preview-strip');
    const musicPopover = el('quick-music-strip');
    if (themePopover && !themePopover.classList.contains('hidden')) positionQuickPopover(themePopover, el('theme-dock-toggle-btn'));
    if (musicPopover && !musicPopover.classList.contains('hidden')) positionQuickPopover(musicPopover, el('music-dock-toggle-btn'));
  }

  function closeQuickPopover(kind = 'all') {
    const closeTheme = kind === 'all' || kind === 'theme';
    const closeMusic = kind === 'all' || kind === 'music';
    const themePopover = el('theme-preview-strip');
    const musicPopover = el('quick-music-strip');
    const themeBtn = el('theme-dock-toggle-btn');
    const musicBtn = el('music-dock-toggle-btn');
    if (closeTheme && themePopover) {
      themePopover.classList.add('hidden');
      themePopover.setAttribute('aria-hidden', 'true');
    }
    if (closeMusic && musicPopover) {
      musicPopover.classList.add('hidden');
      musicPopover.setAttribute('aria-hidden', 'true');
    }
    if (closeTheme && themeBtn) {
      themeBtn.classList.remove('is-active');
      themeBtn.setAttribute('aria-expanded', 'false');
    }
    if (closeMusic && musicBtn) {
      musicBtn.classList.remove('is-active');
      musicBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openQuickPopover(kind) {
    if (!isQuickPopoverAllowed()) {
      closeQuickPopover('all');
      return;
    }
    const themePopover = el('theme-preview-strip');
    const musicPopover = el('quick-music-strip');
    const themeBtn = el('theme-dock-toggle-btn');
    const musicBtn = el('music-dock-toggle-btn');
    if (kind === 'theme' && themePopover) {
      if (musicPopover) {
        musicPopover.classList.add('hidden');
        musicPopover.setAttribute('aria-hidden', 'true');
      }
      if (musicBtn) {
        musicBtn.classList.remove('is-active');
        musicBtn.setAttribute('aria-expanded', 'false');
      }
      themePopover.classList.remove('hidden');
      themePopover.setAttribute('aria-hidden', 'false');
      if (themeBtn) {
        themeBtn.classList.add('is-active');
        themeBtn.setAttribute('aria-expanded', 'true');
        positionQuickPopover(themePopover, themeBtn);
      }
      return;
    }
    if (kind === 'music' && musicPopover) {
      if (themePopover) {
        themePopover.classList.add('hidden');
        themePopover.setAttribute('aria-hidden', 'true');
      }
      if (themeBtn) {
        themeBtn.classList.remove('is-active');
        themeBtn.setAttribute('aria-expanded', 'false');
      }
      musicPopover.classList.remove('hidden');
      musicPopover.setAttribute('aria-hidden', 'false');
      if (musicBtn) {
        musicBtn.classList.add('is-active');
        musicBtn.setAttribute('aria-expanded', 'true');
        positionQuickPopover(musicPopover, musicBtn);
      }
    }
  }

  function toggleQuickPopover(kind) {
    const popover = kind === 'music' ? el('quick-music-strip') : el('theme-preview-strip');
    if (!popover || popover.classList.contains('hidden')) {
      openQuickPopover(kind);
      return;
    }
    closeQuickPopover(kind);
  }

  function syncThemePreviewStripVisibility() {
    const allowed = isQuickPopoverAllowed();
    const themeBtn = el('theme-dock-toggle-btn');
    const musicBtn = el('music-dock-toggle-btn');
    [themeBtn, musicBtn].forEach((btn) => {
      if (!btn) return;
      btn.setAttribute('aria-disabled', allowed ? 'false' : 'true');
    });
    if (!allowed) {
      closeQuickPopover('all');
      return;
    }
    syncQuickPopoverPositions();
  }

  return {
    applyTeacherPreset,
    bindFirstRunSetupModal,
    bindSettingsAccordion,
    bindSettingsModeCards,
    closeFirstRunSetupModal,
    closeQuickPopover,
    getTeacherPresets: () => TEACHER_PRESETS,
    hasCompletedFirstRunSetup,
    jumpToSettingsGroup,
    launchedFromGameGallery,
    openFirstRunSetupModal,
    setSettingsView,
    syncQuickPopoverPositions,
    syncTeacherPresetButtons,
    syncThemePreviewStripVisibility,
    toggleQuickPopover
  };
}

window.createSettingsRuntimeModule = createSettingsRuntimeModule;
