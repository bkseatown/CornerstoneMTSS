/**
 * app-panel-runtime.js
 * Settings/teacher panel positioning, modal toggles, and shell-adjacent event wiring.
 */

function createPanelRuntimeModule(deps) {
  const {
    applyTeacherPreset = () => {},
    bindSettingsAccordion = () => {},
    closeFocusSearchList = () => {},
    closeQuickPopover = () => {},
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    emitTelemetry = () => {},
    getLatestSavedSessionId = () => '',
    getThemePreviewStripSync = () => {},
    hideInformantHintCard = () => {},
    hideMidgameBoost = () => {},
    initStudentCodeControls = () => {},
    isAssessmentRoundLocked = () => false,
    isMissionLabStandaloneMode = () => false,
    jumpToSettingsGroup = () => {},
    logOverflow = () => {},
    maybeDismissDupeToast = () => {},
    openNumeracyLabPage = () => {},
    openReadingLabPage = () => {},
    openSentenceSurgeryPage = () => {},
    openTeacherDashboardPage = () => {},
    openWritingStudioPage = () => {},
    positionHintClueCard = () => {},
    positionStarterWordCard = () => {},
    positionSupportChoiceCard = () => {},
    renderDiagnosticsPanel = () => {},
    routeTo = () => {},
    setPageMode = () => {},
    setSettingsView = () => {},
    shareWordQuestBundle = async () => {},
    shareWordQuestSessionById = async () => {},
    shouldKeepMidgameBoostOpen = () => false,
    showAssessmentLockNotice = () => {},
    syncPlayHeaderCopy = () => {},
    syncPlayToolsRoleVisibility = () => {},
    syncQuickPopoverPositions = () => {},
    syncWritingStudioAvailability = () => {},
    syncThemePreviewStripVisibility = () => {},
    togglePlayToolsDrawer = () => {},
    updateFocusHint = () => {},
    updateFocusSummaryLabel = () => {},
    updateGradeTargetInline = () => {},
    updateNextActionLine = () => {},
    writingStudioEnabled = false,
    windowRef = window
  } = deps || {};

  function syncHeaderControlsVisibility() {
    const overlay = el('modal-overlay');
    if (overlay) {
      const modals = [
        el('teacher-panel'),
        el('end-modal'),
        el('challenge-modal'),
        el('modal-challenge-launch'),
        el('first-run-setup-modal')
      ];
      const anyOpen = modals.some((node) => node && !node.classList.contains('hidden'));
      if (!anyOpen) overlay.classList.add('hidden');
    }
    syncThemePreviewStripVisibility();
    updateFocusHint();
    updateFocusSummaryLabel();
    updateGradeTargetInline();
    updateNextActionLine();
    syncPlayHeaderCopy();
  }

  function positionSettingsPanel() {
    const panel = el('settings-panel');
    if (!(panel instanceof HTMLElement) || panel.classList.contains('hidden')) return;
    if ((windowRef.innerWidth || 0) <= 1080) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(78px, 10vh, 108px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const board = documentRef.querySelector('.board-plate');
    const header = documentRef.querySelector('header');
    if (!(board instanceof HTMLElement)) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(78px, 10vh, 108px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const headerBottom = header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 72;
    const gap = 18;
    const top = Math.max(headerBottom + 10, Math.min(boardRect.top, windowRef.innerHeight - panel.offsetHeight - 12));
    const rightSpace = windowRef.innerWidth - boardRect.right - gap - 12;
    const leftSpace = boardRect.left - gap - 12;
    let left = boardRect.right + gap;
    if (rightSpace < panel.offsetWidth && leftSpace > rightSpace) {
      left = Math.max(12, boardRect.left - panel.offsetWidth - gap);
    }
    left = Math.max(12, Math.min(left, windowRef.innerWidth - panel.offsetWidth - 12));
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.max(12, top)}px`;
    panel.style.transform = 'none';
  }

  function positionFloatingCards() {
    if (el('hint-clue-card') && !el('hint-clue-card')?.classList.contains('hidden')) {
      positionHintClueCard();
    }
    if (el('starter-word-card') && !el('starter-word-card')?.classList.contains('hidden')) {
      positionStarterWordCard();
    }
    if (el('support-choice-card') && !el('support-choice-card')?.classList.contains('hidden')) {
      positionSupportChoiceCard();
    }
    syncQuickPopoverPositions();
    positionSettingsPanel();
  }

  function bindDraggablePanel(panel, dragHandle, closeSelector, movePanel) {
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const onPointerMove = (event) => {
      if (!dragging) return;
      movePanel(event, { dragOffsetX, dragOffsetY });
    };

    const stopDragging = () => {
      dragging = false;
      windowRef.removeEventListener('pointermove', onPointerMove);
      windowRef.removeEventListener('pointerup', stopDragging);
    };

    dragHandle?.addEventListener('pointerdown', (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest(closeSelector)) return;
      const rect = panel.getBoundingClientRect();
      dragging = true;
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      windowRef.addEventListener('pointermove', onPointerMove);
      windowRef.addEventListener('pointerup', stopDragging);
    });
  }

  function closeVoiceHelp() {
    el('voice-help-modal')?.classList.add('hidden');
  }

  function openVoiceHelp() {
    el('settings-panel')?.classList.add('hidden');
    syncHeaderControlsVisibility();
    el('voice-help-modal')?.classList.remove('hidden');
  }

  function bindSettingsPanelRuntime() {
    el('settings-btn')?.addEventListener('click', () => {
      if (isAssessmentRoundLocked()) {
        showAssessmentLockNotice();
        return;
      }
      const panel = el('settings-panel');
      if (!panel) return;
      el('teacher-panel')?.classList.add('hidden');
      const opening = panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      if (opening) {
        setSettingsView('quick');
        void renderDiagnosticsPanel();
        positionSettingsPanel();
      }
      syncHeaderControlsVisibility();
    });
    el('settings-close')?.addEventListener('click', () => {
      el('settings-panel')?.classList.add('hidden');
      syncHeaderControlsVisibility();
    });

    const panel = el('settings-panel');
    const header = panel?.querySelector('.settings-header');
    if (panel instanceof HTMLElement) {
      bindDraggablePanel(panel, header, '#settings-close', (event, offsets) => {
        const x = Math.max(8, Math.min(windowRef.innerWidth - panel.offsetWidth - 8, event.clientX - offsets.dragOffsetX));
        const y = Math.max(8, Math.min(windowRef.innerHeight - panel.offsetHeight - 8, event.clientY - offsets.dragOffsetY));
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.transform = 'none';
      });
      documentRef.addEventListener('pointerdown', (event) => {
        if (panel.classList.contains('hidden')) return;
        const target = event.target instanceof Node ? event.target : null;
        if (!target) return;
        if (panel.contains(target)) return;
        if (el('settings-btn')?.contains(target)) return;
        panel.classList.add('hidden');
        syncHeaderControlsVisibility();
      });
    }
  }

  function bindTeacherPanelRuntime() {
    const panel = el('teacher-panel');
    const card = panel?.querySelector('.teacher-panel-card');
    const header = panel?.querySelector('.teacher-panel-head');
    if (!(panel instanceof HTMLElement) || !(card instanceof HTMLElement)) return;

    bindDraggablePanel(card, header, '#teacher-panel-close', (event, offsets) => {
      const x = Math.max(8, Math.min(windowRef.innerWidth - card.offsetWidth - 8, event.clientX - offsets.dragOffsetX));
      const y = Math.max(8, Math.min(windowRef.innerHeight - card.offsetHeight - 8, event.clientY - offsets.dragOffsetY));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    });

    documentRef.addEventListener('pointerdown', (event) => {
      if (panel.classList.contains('hidden')) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (el('teacher-panel-btn')?.contains(target)) return;
      panel.classList.add('hidden');
      syncHeaderControlsVisibility();
    });
  }

  function bindWindowRuntime() {
    const teacherPanelToggleEvent = 'wq:teacher-panel-toggle';
    const openTeacherHubEvent = 'wq:open-teacher-hub';

    windowRef.addEventListener(teacherPanelToggleEvent, () => {
      const isOpen = !el('teacher-panel')?.classList.contains('hidden');
      emitTelemetry(isOpen ? 'wq_teacher_hub_open' : 'wq_teacher_hub_close', {
        source: 'teacher_panel_toggle_event'
      });
      syncHeaderControlsVisibility();
    });
    windowRef.addEventListener(openTeacherHubEvent, () => {
      el('teacher-panel-btn')?.click();
    });
    windowRef.addEventListener('resize', () => {
      positionFloatingCards();
      logOverflow('resize');
    }, { passive: true });
    windowRef.addEventListener('scroll', () => {
      positionFloatingCards();
    }, { passive: true });
    windowRef.addEventListener('hashchange', () => {
      const handler = windowRef.applyHashRouteFromMain;
      if (typeof handler === 'function') handler();
    });
  }

  function bindVoiceHelpRuntime() {
    el('voice-help-btn')?.addEventListener('click', openVoiceHelp);
    el('voice-help-close')?.addEventListener('click', closeVoiceHelp);
    el('voice-help-modal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'voice-help-modal') closeVoiceHelp();
    });
  }

  function bindNavigationRuntime() {
    el('mission-lab-nav-btn')?.addEventListener('click', () => {
      setPageMode(isMissionLabStandaloneMode() ? 'word-quest' : 'mission-lab');
    });
    if (writingStudioEnabled) {
      el('writing-studio-btn')?.addEventListener('click', openWritingStudioPage);
    } else {
      syncWritingStudioAvailability();
    }
    el('sentence-studio-btn')?.addEventListener('click', openSentenceSurgeryPage);
    el('reading-lab-btn')?.addEventListener('click', openReadingLabPage);
    el('teacher-open-writing-studio-btn')?.addEventListener('click', openWritingStudioPage);
    el('teacher-open-sentence-studio-btn')?.addEventListener('click', openSentenceSurgeryPage);
    el('teacher-open-reading-lab-btn')?.addEventListener('click', openReadingLabPage);
    el('my-activities-btn')?.addEventListener('click', openTeacherDashboardPage);
    el('play-tools-btn')?.addEventListener('click', togglePlayToolsDrawer);
    el('play-drawer-close')?.addEventListener('click', () => {
      el('play-tools-drawer')?.classList.add('hidden');
      el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
    });
    el('play-drawer-writing-studio')?.addEventListener('click', openWritingStudioPage);
    el('play-drawer-sentence-studio')?.addEventListener('click', openSentenceSurgeryPage);
    el('play-drawer-reading-lab')?.addEventListener('click', openReadingLabPage);
    el('play-drawer-my-activities')?.addEventListener('click', openTeacherDashboardPage);
    el('home-open-writing-studio')?.addEventListener('click', () => routeTo('writing'));
    el('home-open-word-quest')?.addEventListener('click', () => routeTo('word-quest'));
    el('home-open-reading-lab')?.addEventListener('click', () => routeTo('reading'));
    el('home-open-number-lab')?.addEventListener('click', openNumeracyLabPage);
    el('wq-share-result-btn')?.addEventListener('click', async () => {
      const latestSavedSessionId = getLatestSavedSessionId();
      if (!latestSavedSessionId) return;
      await shareWordQuestSessionById(latestSavedSessionId);
    });
    el('wq-share-bundle-btn')?.addEventListener('click', async () => {
      await shareWordQuestBundle();
    });
    el('cta-word-quest')?.addEventListener('click', () => routeTo('word-quest'));
    el('cta-tools')?.addEventListener('click', () => routeTo('dashboard'));
    el('home-logo-btn')?.addEventListener('click', () => {
      routeTo('home');
      setPageMode('word-quest', { force: true });
      closeFocusSearchList();
      closeQuickPopover('all');
      el('settings-panel')?.classList.add('hidden');
      el('teacher-panel')?.classList.add('hidden');
      el('modal-overlay')?.classList.add('hidden');
      el('end-modal')?.classList.add('hidden');
      el('challenge-modal')?.classList.add('hidden');
      el('modal-challenge-launch')?.classList.add('hidden');
      el('play-tools-drawer')?.classList.add('hidden');
      el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
      syncHeaderControlsVisibility();
    });
  }

  function bindGlobalPointerDismissals() {
    documentRef.addEventListener('pointerdown', (event) => {
      const target = event.target;
      const focusWrap = el('focus-inline-wrap');
      const hintToggleBtn = el('focus-hint-toggle');
      const hintCard = el('hint-clue-card');
      if (focusWrap && !focusWrap.contains(target)) {
        closeFocusSearchList();
        updateFocusSummaryLabel();
      }
      if (
        hintCard &&
        !hintCard.classList.contains('hidden') &&
        !hintCard.contains(target) &&
        target !== hintToggleBtn &&
        !hintToggleBtn?.contains(target)
      ) {
        hideInformantHintCard();
      }
      const themeDockBtn = el('theme-dock-toggle-btn');
      const musicDockBtn = el('music-dock-toggle-btn');
      const playToolsBtn = el('play-tools-btn');
      const playToolsDrawer = el('play-tools-drawer');
      const themePopover = el('theme-preview-strip');
      const musicPopover = el('quick-music-strip');
      const clickInsideQuickPopover =
        themePopover?.contains(target) ||
        musicPopover?.contains(target) ||
        themeDockBtn?.contains(target) ||
        musicDockBtn?.contains(target);
      if (!clickInsideQuickPopover) {
        closeQuickPopover('all');
      }
      if (
        playToolsDrawer &&
        !playToolsDrawer.classList.contains('hidden') &&
        !playToolsDrawer.contains(target) &&
        target !== playToolsBtn &&
        !playToolsBtn?.contains(target)
      ) {
        playToolsDrawer.classList.add('hidden');
        playToolsBtn?.setAttribute('aria-expanded', 'false');
      }
      maybeDismissDupeToast(target);
      if (el('toast')?.classList.contains('visible')) el('toast').classList.remove('visible', 'toast-informant');
      const boost = el('midgame-boost');
      if (
        boost &&
        !boost.classList.contains('hidden') &&
        !boost.contains(target) &&
        !shouldKeepMidgameBoostOpen(target)
      ) {
        hideMidgameBoost();
      }
    });
  }

  function init() {
    if (documentRef.body?.dataset.wqPanelRuntimeBound === '1') return;
    documentRef.querySelectorAll('#settings-panel [data-settings-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        setSettingsView(tab.getAttribute('data-settings-tab'));
      });
    });
    documentRef.querySelectorAll('.settings-jump-chip[data-settings-jump]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const groupId = chip.getAttribute('data-settings-jump');
        if (!groupId) return;
        jumpToSettingsGroup(groupId);
      });
    });
    bindSettingsAccordion('#settings-quick');
    bindSettingsAccordion('#settings-advanced');
    documentRef.querySelectorAll('[data-teacher-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        applyTeacherPreset(button.getAttribute('data-teacher-preset') || '');
      });
    });
    bindSettingsPanelRuntime();
    bindTeacherPanelRuntime();
    bindVoiceHelpRuntime();
    bindNavigationRuntime();
    bindWindowRuntime();
    bindGlobalPointerDismissals();
    initStudentCodeControls();
    syncPlayToolsRoleVisibility();
    documentRef.body.dataset.wqPanelRuntimeBound = '1';
  }

  return Object.freeze({
    init,
    positionSettingsPanel,
    syncHeaderControlsVisibility
  });
}

window.createPanelRuntimeModule = createPanelRuntimeModule;
