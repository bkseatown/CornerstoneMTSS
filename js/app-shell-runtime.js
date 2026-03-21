/**
 * app-shell-runtime.js
 * Home/play shell, page mode, routing, and activity-launch helpers.
 */

function createShellRuntimeModule(deps) {
  const {
    assertHomeNoScroll = () => {},
    closeQuickPopover = () => {},
    closeFocusSearchList = () => {},
    csSetHeaderTitleCenter = () => {},
    deepDiveModal = null,
    demoMode = false,
    documentRef = document,
    el = (id) => documentRef.getElementById(id),
    emitTelemetry = () => {},
    getThemeFallback = () => 'default',
    hideInformantHintCard = () => {},
    historyRef = window.history,
    hideStarterWordCard = () => {},
    isMissionLabEnabled = () => false,
    isMissionLabStandaloneMode = () => false,
    isTeacherRoleEnabled = () => false,
    localStorageRef = globalThis.localStorage,
    locationRef = window.location,
    normalizePageMode = (value) => value,
    normalizeTheme = (value) => value,
    openWordQuestIfNeeded = () => {},
    prefs = {},
    defaultPrefs = {},
    refreshStandaloneMissionLabHub = () => {},
    setActivityLabel = () => {},
    setFocusSearchOpen = () => {},
    setFocusSearchReopenGuardUntil = () => {},
    setHoverNoteForElement = () => {},
    setWordQuestCoachState = () => {},
    showToast = () => {},
    startAvaWordQuestIdleWatcher = () => {},
    stopAvaWordQuestIdleWatcher = () => {},
    syncGameplayAudioStrip = () => {},
    syncHeaderControlsVisibility = () => {},
    syncStarterWordLauncherUI = () => {},
    startupApp = () => {},
    updatePageModeStorage = () => {},
    updateFocusSummaryLabel = () => {},
    updateHomeCoachRibbon = () => {},
    withAppBase = (value) => value,
    writingStudioReturnKey = '',
    windowRef = window
  } = deps || {};

  function readWritingStudioReturnFlag() {
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      return params.get('wq_studio_return') === '1';
    } catch {
      return false;
    }
  }

  function readWritingStudioHiddenFlag() {
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      return params.get('ws_hidden') === '1';
    } catch {
      return false;
    }
  }

  function consumeWritingStudioReturnSummary() {
    if (!readWritingStudioReturnFlag()) return;
    setFocusSearchReopenGuardUntil(Date.now() + 1500);
    closeFocusSearchList();
    const focusInput = el('focus-inline-search');
    if (focusInput) {
      focusInput.blur();
      focusInput.setAttribute('aria-expanded', 'false');
    }
    setFocusSearchOpen(false);
    let payload = null;
    try {
      payload = JSON.parse(localStorageRef?.getItem?.(writingStudioReturnKey) || 'null');
      localStorageRef?.removeItem?.(writingStudioReturnKey);
    } catch {
      payload = null;
    }
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      params.delete('wq_studio_return');
      const query = params.toString();
      const nextUrl = `${locationRef.pathname}${query ? `?${query}` : ''}${locationRef.hash || ''}`;
      historyRef.replaceState(null, '', nextUrl);
    } catch {}
    if (!payload || typeof payload !== 'object') return;
    const words = Math.max(0, Number(payload.words) || 0);
    const sentences = Math.max(0, Number(payload.sentences) || 0);
    const mode = String(payload.mode || '').toLowerCase() === 'paragraph' ? 'paragraph' : 'sentence';
    const planItems = Math.max(0, Number(payload.planItems) || 0);
    const focus = String(payload.focus || '').trim();
    emitTelemetry('studio_return', {
      studio_words: words,
      studio_sentences: sentences,
      studio_mode: mode,
      studio_plan_items: planItems,
      studio_focus: focus || null
    });
    windowRef.setTimeout(() => {
      closeFocusSearchList();
      setFocusSearchOpen(false);
    }, 0);
    windowRef.setTimeout(() => {
      closeFocusSearchList();
      setFocusSearchOpen(false);
    }, 220);
  }

  function consumeWritingStudioHiddenNotice() {
    if (!readWritingStudioHiddenFlag()) return;
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      params.delete('ws_hidden');
      const query = params.toString();
      const nextUrl = `${locationRef.pathname}${query ? `?${query}` : ''}${locationRef.hash || ''}`;
      historyRef.replaceState(null, '', nextUrl);
    } catch {}
    showToast('Writing Studio is hidden in this shared build.');
  }

  function runInitialStartup() {
    startupApp();
    consumeWritingStudioReturnSummary();
    consumeWritingStudioHiddenNotice();
  }

  function csComputeHeaderTitleCenter() {
    const path = String(locationRef.pathname || '').toLowerCase();
    if (path.endsWith('/reading-lab.html')) return 'Reading Lab';
    if (path.endsWith('/teacher-dashboard.html') || path.endsWith('/reports.html') || path.endsWith('/my-workspace.html')) return 'My Workspace';
    if (path.endsWith('/sentence-studio.html') || path.endsWith('/sentence-surgery.html') || path.endsWith('/writing-studio.html')) return 'Writing Studio';
    const mode = documentRef.documentElement.getAttribute('data-home-mode');
    if (mode === 'home') return 'Cornerstone MTSS';
    if (mode === 'play') return 'Word Quest';
    return 'Cornerstone MTSS';
  }

  function csSyncHeaderTitleCenter() {
    csSetHeaderTitleCenter(csComputeHeaderTitleCenter());
  }

  function setHomePlayShellIsolation(isHome) {
    const hidden = !!isHome;
    [
      '#play-shell',
      'header',
      'main',
      '.top-control-hub',
      '#next-action-line',
      '.classroom-turn-line',
      '#play-tools-drawer',
      '#theme-preview-strip',
      '#quick-music-strip',
      '#settings-panel',
      '#teacher-panel',
      '#toast',
      '#modal-overlay',
      '#challenge-modal',
      '#phonics-clue-modal',
      '#first-run-setup-modal',
      '#voice-help-modal',
      '#celebrate-layer',
      '#confetti-canvas',
      '#listening-mode-overlay',
      '#hint-clue-card',
      '#starter-word-card'
    ].forEach((selector) => {
      const node = documentRef.querySelector(selector);
      if (!node) return;
      if (hidden) {
        node.setAttribute('aria-hidden', 'true');
        try { node.setAttribute('inert', ''); } catch {}
      } else {
        node.removeAttribute('aria-hidden');
        try { node.removeAttribute('inert'); } catch {}
      }
    });
  }

  function applyHomePlayVisibility(nextMode) {
    const inPlay = String(nextMode || '') === 'play';
    const playShell = el('play-shell');
    const hero = el('hero-v2');
    const header = documentRef.querySelector('body > header');
    if (playShell instanceof HTMLElement) playShell.style.display = inPlay ? 'block' : 'none';
    if (hero instanceof HTMLElement) hero.style.display = inPlay ? 'none' : '';
    if (header instanceof HTMLElement) header.style.display = inPlay ? 'block' : 'none';
  }

  function setHomeMode(mode, options = {}) {
    const next = String(mode || '').toLowerCase() === 'play' ? 'play' : 'home';
    documentRef.body?.classList.toggle('home-locked', next === 'home');
    applyHomePlayVisibility(next);
    setHomePlayShellIsolation(next !== 'play');
    updateHomeCoachRibbon();
    setWordQuestCoachState(options.wordQuestCoachKey || 'before_guess');
    if (next === 'play') {
      documentRef.documentElement.setAttribute('data-home-mode', 'play');
      setActivityLabel('Word Quest');
      startAvaWordQuestIdleWatcher();
      el('home-tools-section')?.classList.add('hidden');
      el('play-tools-drawer')?.classList.add('hidden');
      el('play-tools-btn')?.setAttribute('aria-expanded', 'false');
      if (options.scroll !== false) el('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        const url = new URL(windowRef.location.href);
        url.searchParams.set('play', '1');
        windowRef.history.replaceState(windowRef.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      } catch {}
      return next;
    }
    documentRef.documentElement.setAttribute('data-home-mode', 'home');
    setActivityLabel('Cornerstone MTSS');
    stopAvaWordQuestIdleWatcher('home mode');
    el('home-tools-section')?.classList.remove('hidden');
    assertHomeNoScroll();
    try {
      const url = new URL(windowRef.location.href);
      url.searchParams.delete('play');
      windowRef.history.replaceState(windowRef.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {}
    return next;
  }

  function initializeHomeMode() {
    const forceGameplayRoute = /(?:^|\/)word-quest\.html$/i.test(String(locationRef.pathname || ''));
    if (demoMode) return setHomeMode('play', { scroll: false });
    let forcePlay = false;
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      const playParam = String(params.get('play') || '').toLowerCase();
      const fromParam = String(params.get('from') || '').toLowerCase();
      forcePlay = playParam === '1' || playParam === 'true' || fromParam === 'home';
    } catch {}
    if (forceGameplayRoute) forcePlay = true;
    const next = setHomeMode(forcePlay ? 'play' : 'home', { scroll: false });
    csSyncHeaderTitleCenter();
    return next;
  }

  function routeTo(route) {
    const normalized = String(route || 'home').toLowerCase().replace(/^#/, '') || 'home';
    if (locationRef.hash === `#${normalized}`) {
      applyHashRoute();
      return;
    }
    locationRef.hash = `#${normalized}`;
  }

  function openWritingStudioPage() {
    const enabled = deps.writingStudioEnabled !== false;
    if (!enabled) {
      showToast('Writing Studio is hidden in this shared build.');
      return;
    }
    const state = deps.getState?.() || {};
    const focusSelect = el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || defaultPrefs.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'General writing').trim();
    const gradeValue = String(el('s-grade')?.value || prefs.grade || defaultPrefs.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const activeTheme = normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    try { localStorage.setItem('ws_theme_v1', activeTheme); } catch {}
    const url = new URL(withAppBase('writing-studio.html'), windowRef.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    windowRef.location.href = url.toString();
  }

  function openSentenceSurgeryPage() {
    const state = deps.getState?.() || {};
    const focusSelect = el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || defaultPrefs.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'Sentence practice').trim();
    const gradeValue = String(el('s-grade')?.value || prefs.grade || defaultPrefs.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const activeTheme = normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    const url = new URL(withAppBase('sentence-studio.html'), windowRef.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    windowRef.location.href = url.toString();
  }

  function openReadingLabPage() {
    const state = deps.getState?.() || {};
    const focusSelect = el('setting-focus');
    const focusValue = String(focusSelect?.value || prefs.focus || defaultPrefs.focus || 'all').trim();
    const focusLabel = String(focusSelect?.selectedOptions?.[0]?.textContent || focusValue || 'Reading practice').trim();
    const gradeValue = String(el('s-grade')?.value || prefs.grade || defaultPrefs.grade || 'all').trim();
    const targetWord = String(state?.word || '').trim().toUpperCase();
    const clueSentence = String(state?.entry?.sentence || '').trim();
    const activeTheme = normalizeTheme(documentRef.documentElement.getAttribute('data-theme'), getThemeFallback());
    const url = new URL(withAppBase('reading-lab.html'), windowRef.location.origin);
    url.searchParams.set('theme', activeTheme);
    url.searchParams.set('wq_focus', focusValue);
    url.searchParams.set('wq_focus_label', focusLabel);
    url.searchParams.set('wq_grade', gradeValue);
    if (targetWord) url.searchParams.set('wq_word', targetWord);
    if (clueSentence) url.searchParams.set('wq_clue', clueSentence);
    windowRef.location.href = url.toString();
  }

  function openTeacherDashboardPage() {
    const url = new URL(withAppBase('my-activities.html'), windowRef.location.origin);
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      if (params.get('demo') === '1') url.searchParams.set('demo', '1');
      if (params.get('subject')) url.searchParams.set('subject', params.get('subject'));
    } catch {}
    windowRef.location.href = url.toString();
  }

  function openNumeracyLabPage() {
    const url = new URL(withAppBase('number-lab.html'), windowRef.location.origin);
    try {
      const params = new URLSearchParams(windowRef.location.search || '');
      if (params.get('demo') === '1') url.searchParams.set('demo', '1');
    } catch {}
    windowRef.location.href = url.toString();
  }

  function applyHashRoute() {
    const route = String(locationRef.hash || '#').replace(/^#/, '').toLowerCase();
    if (!route || route === 'home') {
      try {
        const params = new URLSearchParams(windowRef.location.search || '');
        const playParam = String(params.get('play') || '').toLowerCase();
        const fromParam = String(params.get('from') || '').toLowerCase();
        const forcePlay = playParam === '1' || playParam === 'true' || fromParam === 'home';
        if (forcePlay) {
          setHomeMode('play', { scroll: false });
          openWordQuestIfNeeded();
          return;
        }
      } catch {}
      setHomeMode('home', { scroll: false });
      return;
    }
    if (route === 'wordquest' || route === 'word-quest') {
      setHomeMode('play', { scroll: false });
      openWordQuestIfNeeded();
      return;
    }
    if (route === 'reading') {
      setActivityLabel('Reading Lab');
      openReadingLabPage();
      return;
    }
    if (route === 'writing') {
      setActivityLabel('Writing Studio');
      openWritingStudioPage();
      return;
    }
    if (route === 'dashboard' || route === 'admin-demo') {
      setActivityLabel('Specialist Hub');
      const url = new URL(withAppBase('specialist-hub.html'), windowRef.location.origin);
      if (route === 'admin-demo') url.hash = '#admin-demo';
      windowRef.location.href = url.toString();
      return;
    }
    routeTo('home');
  }

  function syncPlayToolsRoleVisibility() {
    const teacherOnly = el('play-drawer-my-activities');
    if (!teacherOnly) return;
    teacherOnly.classList.toggle('hidden', !isTeacherRoleEnabled());
  }

  function togglePlayToolsDrawer(homeMode) {
    const drawer = el('play-tools-drawer');
    const trigger = el('play-tools-btn');
    if (!drawer || homeMode !== 'play') return;
    const open = drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden', !open);
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function updatePageModeUrl(mode) {
    try {
      const normalized = normalizePageMode(mode);
      const url = new URL(windowRef.location.href);
      if (normalized === 'mission-lab') url.searchParams.set('page', 'mission-lab');
      else url.searchParams.delete('page');
      windowRef.history.replaceState(windowRef.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {}
  }

  function syncPageModeUI() {
    const missionEnabled = isMissionLabEnabled();
    const missionMode = missionEnabled && isMissionLabStandaloneMode();
    documentRef.documentElement.setAttribute('data-page-mode', missionMode ? 'mission-lab' : 'word-quest');
    documentRef.documentElement.setAttribute('data-mission-lab', missionEnabled ? 'on' : 'off');
    const navBtn = el('mission-lab-nav-btn');
    if (navBtn) {
      navBtn.classList.toggle('hidden', !missionEnabled);
      navBtn.innerHTML = missionMode
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 3.5h13.5V17"></path><path d="M20.5 3.5L9.5 14.5"></path><path d="M3.5 9.5V20.5H14.5"></path></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"></rect></svg>';
      navBtn.setAttribute('aria-pressed', missionMode ? 'true' : 'false');
      navBtn.setAttribute('aria-label', missionMode ? 'Return to WordQuest' : 'Open more activities');
      navBtn.title = missionMode ? 'Return to WordQuest gameplay mode' : 'Open more activities';
      setHoverNoteForElement(navBtn, missionMode ? 'Return to WordQuest gameplay mode.' : 'Open more activities like Deep Dive.');
    }
    const newWordBtn = el('new-game-btn');
    if (newWordBtn) {
      if (demoMode) {
        newWordBtn.textContent = 'Stop Demo';
        newWordBtn.classList.add('is-demo-stop');
      } else {
        newWordBtn.textContent = missionMode ? 'Deep Dive Mode' : 'Next Word';
        newWordBtn.classList.remove('is-demo-stop');
      }
      newWordBtn.setAttribute('aria-label', demoMode ? 'Stop automated demo and enter play mode' : (missionMode ? 'Start a standalone Deep Dive round' : 'Start the next word round'));
      newWordBtn.removeAttribute('title');
      if (missionMode) newWordBtn.classList.remove('pulse');
    }
    const focusInput = el('focus-inline-search');
    if (focusInput) {
      focusInput.placeholder = missionMode ? 'Choose Deep Dive track' : 'Select your quest';
      focusInput.setAttribute('aria-label', missionMode ? 'Deep Dive track finder' : 'Quest finder');
    }
    el('mission-lab-hub')?.classList.toggle('hidden', !missionMode);
    syncStarterWordLauncherUI();
    syncGameplayAudioStrip();
    if (!missionEnabled) {
      deepDiveModal?.closeRevealChallengeModal?.({ silent: true, preserveFeedback: false });
      el('modal-challenge-launch')?.classList.add('hidden');
      el('challenge-modal')?.classList.add('hidden');
      el('mission-lab-hub')?.classList.add('hidden');
      return;
    }
    if (missionMode) {
      hideInformantHintCard();
      hideStarterWordCard();
      el('toast')?.classList.remove('visible', 'toast-informant');
      refreshStandaloneMissionLabHub();
      deepDiveModal?.closeRevealChallengeModal?.({ silent: true, preserveFeedback: false });
      el('modal-overlay')?.classList.add('hidden');
      el('end-modal')?.classList.add('hidden');
    }
  }

  function setPageMode(mode, options = {}) {
    const normalized = normalizePageMode(mode);
    if (options.currentMode === normalized && !options.force) return normalized;
    updatePageModeStorage(normalized);
    if (!options.skipUrl) updatePageModeUrl(normalized);
    syncPageModeUI();
    syncHeaderControlsVisibility();
    return normalized;
  }

  function initStudentCodeControls() {
    const row = el('home-student-code-row');
    const toggle = el('home-set-code-toggle');
    const input = el('home-student-code-input');
    const saveBtn = el('home-student-code-save');
    if (!row || !toggle || !input || !saveBtn || !windowRef.CSCornerstoneStore) return;
    const current = typeof windowRef.CSCornerstoneStore.getStudentCode === 'function'
      ? windowRef.CSCornerstoneStore.getStudentCode()
      : '';
    if (current) input.value = String(current);
    toggle.addEventListener('click', () => {
      row.classList.toggle('hidden');
      if (!row.classList.contains('hidden')) input.focus();
    });
    saveBtn.addEventListener('click', () => {
      const next = String(input.value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const saved = windowRef.CSCornerstoneStore.setStudentCode(next);
      input.value = saved || '';
      showToast(saved ? `Student code saved: ${saved}` : 'Student code cleared.');
      row.classList.add('hidden');
    });
  }

  return {
    applyHashRoute,
    consumeWritingStudioHiddenNotice,
    consumeWritingStudioReturnSummary,
    csSyncHeaderTitleCenter,
    initStudentCodeControls,
    initializeHomeMode,
    openNumeracyLabPage,
    openReadingLabPage,
    openSentenceSurgeryPage,
    openTeacherDashboardPage,
    openWritingStudioPage,
    routeTo,
    runInitialStartup,
    setHomeMode,
    setPageMode,
    updatePageModeUrl,
    syncPageModeUI,
    syncPlayToolsRoleVisibility,
    togglePlayToolsDrawer
  };
}

window.createShellRuntimeModule = createShellRuntimeModule;
