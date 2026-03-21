/**
 * app-support-ui.js
 * Hint, starter-word, and support-card UI helpers.
 */

function createSupportUiModule(deps) {
  const {
    el = () => null,
    getPickStarterWordsForRound = () => [],
    getSupportPromptMode = () => 'coach',
    isAnyOverlayModalOpen = () => false,
    isHelpSuppressedForTeamMode = () => false,
    isMissionLabStandaloneMode = () => false,
    normalizePlayStyle = (mode) => mode,
    prefs = {},
    defaultPrefs = {},
    positionCallback = () => {},
    renderStarterWordList = () => {},
    setCurrentRoundSupportPromptShown = () => {},
    setLastSupportPromptShownAt = () => {},
    setStarterWordsShown = () => {},
    showToast = () => {}
  } = deps || {};

  let starterWordDragBound = false;
  let starterCoachTimer = 0;
  let informantHintHideTimer = 0;

  function clearStarterCoachTimer() {
    if (!starterCoachTimer) return;
    clearTimeout(starterCoachTimer);
    starterCoachTimer = 0;
  }

  function clearInformantHintHideTimer() {
    if (!informantHintHideTimer) return;
    clearTimeout(informantHintHideTimer);
    informantHintHideTimer = 0;
  }

  function hideInformantHintCard() {
    clearStarterCoachTimer();
    clearInformantHintHideTimer();
    const card = el('hint-clue-card');
    if (!card) return;
    card.classList.remove('visible');
    card.classList.add('hidden');
  }

  function hideStarterWordCard() {
    const card = el('starter-word-card');
    if (!card) return;
    card.classList.remove('visible');
    card.classList.add('hidden');
  }

  function hideSupportChoiceCard() {
    el('support-choice-card')?.classList.add('hidden');
  }

  function positionHintClueCard() {
    const card = el('hint-clue-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';
    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    if (!boardRect || window.innerWidth < 980) {
      card.style.left = '50%';
      card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
      card.style.transform = 'translateX(-50%)';
      return;
    }
    const roomRight = window.innerWidth - boardRect.right - 18;
    const top = Math.max(Math.round(boardRect.top + 8), Math.round((headerRect?.bottom || 82) + 12));
    if (roomRight >= 300) {
      card.style.left = `${Math.max(8, Math.round(boardRect.right + 18))}px`;
      card.style.top = `${top}px`;
      return;
    }
    card.style.left = `${Math.max(8, Math.round(boardRect.left - 330))}px`;
    card.style.top = `${top}px`;
  }

  function positionSupportChoiceCard() {
    const card = el('support-choice-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';
    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    const top = Math.max(Math.round(boardRect?.top || 100) + 8, Math.round((headerRect?.bottom || 82) + 12));
    const roomRight = window.innerWidth - (boardRect?.right || 400) - 18;
    if (roomRight >= 200) {
      card.style.right = `${Math.max(8, 18)}px`;
      card.style.top = `${top}px`;
      return;
    }
    const roomLeft = (boardRect?.left || 0) - 18;
    if (roomLeft >= 200) {
      card.style.left = `${Math.max(8, Math.round(boardRect?.left || 0) - 200)}px`;
      card.style.top = `${top}px`;
      return;
    }
    card.style.right = '8px';
    card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
  }

  function showSupportChoiceCard(state, runtime = {}) {
    if (isHelpSuppressedForTeamMode()) return false;
    if (getSupportPromptMode() === 'off') return false;
    if (isMissionLabStandaloneMode() || isAnyOverlayModalOpen()) return false;
    const card = el('support-choice-card');
    if (!card) return false;
    const liveState = state || {};
    if (!liveState?.word || liveState.gameOver) return false;
    const guessCount = Array.isArray(liveState.guesses) ? liveState.guesses.length : 0;
    const eligibleAt = Number(runtime.focusSupportEligibleAt || 0);
    const playStyle = normalizePlayStyle(runtime.playStyle || prefs.playStyle || defaultPrefs.playStyle);
    const isDetectiveMode = playStyle !== 'listening';
    const timeSinceLastPrompt = Date.now() - Number(runtime.lastSupportPromptShownAt || 0);
    const shouldShowAgain = isDetectiveMode && timeSinceLastPrompt >= 30000;
    if (!runtime.currentRoundSupportPromptShown && (guessCount < 1 || Date.now() < eligibleAt)) return false;
    if (runtime.currentRoundSupportPromptShown && !isDetectiveMode) return false;
    if (runtime.currentRoundSupportPromptShown && !shouldShowAgain) return false;
    hideInformantHintCard();
    hideStarterWordCard();
    const suggestionBtn = el('support-choice-suggestion');
    const messageEl = card.querySelector('.support-choice-message');
    const suggestionCount = getPickStarterWordsForRound()(liveState, 9).length;
    if (suggestionBtn) {
      const enabled = suggestionCount >= 3;
      suggestionBtn.classList.toggle('hidden', !enabled);
      suggestionBtn.disabled = !enabled;
      suggestionBtn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
      suggestionBtn.textContent = '💡 Try Words';
    }
    if (messageEl) {
      messageEl.textContent = suggestionCount >= 3
        ? 'Pick one kind of help: a phonics clue or a matching word idea.'
        : 'A phonics clue is ready. Matching word ideas appear when at least 3 strong options fit.';
    }
    const neverToggle = el('support-choice-never');
    if (neverToggle) neverToggle.checked = false;
    positionSupportChoiceCard();
    card.classList.remove('hidden');
    setCurrentRoundSupportPromptShown(true);
    setLastSupportPromptShownAt(Date.now());
    return true;
  }

  function enableDraggableSupportChoiceCard() {
    const card = el('support-choice-card');
    const handle = card?.querySelector('.support-choice-head');
    if (!(card instanceof HTMLElement) || !(handle instanceof HTMLElement) || card.dataset.dragBound === '1') return;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    const stopDragging = () => {
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const left = Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, event.clientX - offsetX));
      const top = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, event.clientY - offsetY));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.transform = 'none';
    };
    handle.addEventListener('pointerdown', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('#support-choice-close')) return;
      dragging = true;
      const rect = card.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', stopDragging);
    });
    card.dataset.dragBound = '1';
  }

  function positionStarterWordCard() {
    const card = el('starter-word-card');
    if (!(card instanceof HTMLElement)) return;
    card.style.left = '';
    card.style.top = '';
    card.style.right = '';
    card.style.bottom = '';
    card.style.transform = '';

    const boardZone = document.querySelector('.board-zone');
    const header = document.querySelector('header');
    const boardRect = boardZone?.getBoundingClientRect?.();
    const headerRect = header?.getBoundingClientRect?.();
    const margin = 18;
    const cardWidth = Math.min(320, Math.max(280, Math.round(window.innerWidth * 0.24)));
    card.style.width = `${Math.min(cardWidth, window.innerWidth - 24)}px`;

    if (!boardRect || window.innerWidth < 980) {
      card.style.left = '50%';
      card.style.top = `${Math.max(92, Math.round((headerRect?.bottom || 82) + 12))}px`;
      card.style.transform = 'translateX(-50%)';
      return;
    }

    const roomRight = window.innerWidth - boardRect.right - margin;
    const top = Math.max(
      Math.round((headerRect?.bottom || 82) + 14),
      Math.round(boardRect.top + 8)
    );

    if (roomRight >= card.offsetWidth - 12 || roomRight >= 280) {
      card.style.left = `${Math.max(8, Math.round(boardRect.right + margin))}px`;
      card.style.top = `${top}px`;
      card.style.transform = 'none';
      return;
    }

    card.style.left = `${Math.max(8, Math.round(boardRect.left - card.offsetWidth - margin))}px`;
    card.style.top = `${top}px`;
    card.style.transform = 'none';
  }

  function renderHintExamples(examples) {
    const wrap = el('hint-clue-examples');
    if (!wrap) return;
    wrap.innerHTML = '';
    const rows = Array.isArray(examples) ? examples.slice(0, 1) : [];
    if (!rows.length) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    rows.forEach((example) => {
      const row = document.createElement('div');
      row.className = 'hint-example';
      const word = document.createElement('div');
      word.className = 'hint-example-word';
      (Array.isArray(example?.parts) ? example.parts : []).forEach((part) => {
        const segment = document.createElement('span');
        segment.textContent = String(part?.text || '');
        const mark = String(part?.mark || '').trim();
        if (mark) segment.classList.add(`hint-mark-${mark}`);
        word.appendChild(segment);
      });
      row.appendChild(word);
      const note = String(example?.note || '').trim();
      if (note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'hint-example-note';
        noteEl.textContent = note;
        row.appendChild(noteEl);
      }
      wrap.appendChild(row);
    });
  }

  function scheduleStarterCoachHint() {
    clearStarterCoachTimer();
  }

  function initializeStarterWordCardDrag() {
    if (starterWordDragBound) return;
    const card = el('starter-word-card');
    const head = card?.querySelector('.starter-word-head');
    if (!(card instanceof HTMLElement) || !(head instanceof HTMLElement)) return;
    starterWordDragBound = true;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    const getPoint = (event) => {
      if (event.touches && event.touches[0]) return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      return { x: event.clientX, y: event.clientY };
    };
    const onMove = (event) => {
      if (!dragging) return;
      const point = getPoint(event);
      const nextLeft = originLeft + (point.x - startX);
      const nextTop = originTop + (point.y - startY);
      card.style.left = `${Math.max(8, nextLeft)}px`;
      card.style.top = `${Math.max(8, nextTop)}px`;
      card.style.transform = 'none';
      event.preventDefault();
    };
    const onUp = () => {
      dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    const onDown = (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('button')) return;
      const point = getPoint(event);
      const rect = card.getBoundingClientRect();
      dragging = true;
      startX = point.x;
      startY = point.y;
      originLeft = rect.left;
      originTop = rect.top;
      card.style.left = `${rect.left}px`;
      card.style.top = `${rect.top}px`;
      card.style.transform = 'none';
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp, { passive: true });
      event.preventDefault();
    };
    head.addEventListener('mousedown', onDown);
    head.addEventListener('touchstart', onDown, { passive: false });
  }

  function showInformantHintCard(payload) {
    const card = el('hint-clue-card');
    if (!card) return false;
    const normalized = payload && typeof payload === 'object' ? payload : {};
    const title = el('hint-clue-title');
    const message = el('hint-clue-message');
    if (title) title.textContent = String(normalized.title || 'Need a clue?');
    if (message) message.textContent = String(normalized.message || '');
    hideSupportChoiceCard();
    hideStarterWordCard();
    renderHintExamples(Array.isArray(normalized.examples) ? normalized.examples : []);
    const sentenceBtn = el('hint-clue-sentence-btn');
    if (sentenceBtn) {
      const actionMode = String(normalized.actionMode || 'none').trim().toLowerCase();
      sentenceBtn.dataset.mode = actionMode;
      if (actionMode === 'word-meaning') {
        sentenceBtn.textContent = 'Hear Word + Meaning';
        sentenceBtn.classList.remove('hidden');
        sentenceBtn.disabled = false;
        sentenceBtn.setAttribute('aria-hidden', 'false');
      } else {
        sentenceBtn.textContent = 'Hear Word + Meaning';
        sentenceBtn.classList.add('hidden');
        sentenceBtn.disabled = true;
        sentenceBtn.setAttribute('aria-hidden', 'true');
      }
    }
    clearInformantHintHideTimer();
    card.classList.remove('hidden');
    positionHintClueCard();
    card.classList.add('visible');
    return true;
  }

  function renderStarterWordCard(words, options = {}) {
    const card = el('starter-word-card');
    if (!card) return false;
    hideSupportChoiceCard();
    hideInformantHintCard();
    const titleEl = el('starter-word-title');
    const messageEl = el('starter-word-message');
    if (titleEl) titleEl.textContent = String(options.title || 'Try a Starter Word');
    if (messageEl) messageEl.textContent = String(options.message || '');
    if (!Array.isArray(words) || !words.length) {
      renderStarterWordList([]);
      card.classList.remove('hidden');
      card.classList.add('visible');
      return true;
    }
    renderStarterWordList(words);
    card.classList.remove('hidden');
    positionStarterWordCard();
    card.classList.add('visible');
    setStarterWordsShown(true);
    return true;
  }

  return {
    clearInformantHintHideTimer,
    clearStarterCoachTimer,
    enableDraggableSupportChoiceCard,
    hideInformantHintCard,
    hideStarterWordCard,
    hideSupportChoiceCard,
    initializeStarterWordCardDrag,
    positionHintClueCard,
    positionStarterWordCard,
    positionSupportChoiceCard,
    renderHintExamples,
    renderStarterWordCard,
    scheduleStarterCoachHint,
    showInformantHintCard,
    showSupportChoiceCard
  };
}
