/* theme-nav.js
   Theme arrows and teacher word tools.
   Uses theme registry + app theme API as canonical sources.
*/
(function () {
  'use strict';

  const TEACHER_POOL_KEY = 'wq_teacher_words';
  const TEACHER_SUPPORT_KEY = 'wq_teacher_custom_support_v1';
  const EVENT_BUS_EVENTS = window.WQEventBusContract?.events || {};
  const TEACHER_PANEL_TOGGLE_EVENT = EVENT_BUS_EVENTS.teacherPanelToggle || 'wq:teacher-panel-toggle';
  const OPEN_TEACHER_HUB_EVENT = EVENT_BUS_EVENTS.openTeacherHub || 'wq:open-teacher-hub';

  const byId = (id) => document.getElementById(id);

  function setNavHoverNote(el, note) {
    if (!el) return;
    const text = String(note || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      el.removeAttribute('data-hover-note');
      el.removeAttribute('title');
      return;
    }
    el.setAttribute('data-hover-note', text);
    // Avoid native browser tooltip + app hover-note showing conflicting messages.
    el.removeAttribute('title');
  }

  function getThemeOrder() {
    if (window.WQTheme && typeof window.WQTheme.getOrder === 'function') {
      return window.WQTheme.getOrder();
    }
    if (window.WQThemeRegistry && Array.isArray(window.WQThemeRegistry.order)) {
      return window.WQThemeRegistry.order.slice();
    }
    return ['default'];
  }

  function getThemeLabel(themeId) {
    if (window.WQTheme && typeof window.WQTheme.getLabel === 'function') {
      return window.WQTheme.getLabel(themeId);
    }
    if (window.WQThemeRegistry && typeof window.WQThemeRegistry.getLabel === 'function') {
      return window.WQThemeRegistry.getLabel(themeId);
    }
    return themeId;
  }

  function getCurrentTheme() {
    if (window.WQTheme && typeof window.WQTheme.getTheme === 'function') {
      return window.WQTheme.getTheme();
    }
    return document.documentElement.getAttribute('data-theme') || getThemeOrder()[0];
  }

  function setTheme(theme, persist = true) {
    if (window.WQTheme && typeof window.WQTheme.setTheme === 'function') {
      return window.WQTheme.setTheme(theme, { persist });
    }

    const normalized = String(theme || '').trim().toLowerCase() || getThemeOrder()[0];
    document.documentElement.setAttribute('data-theme', normalized);

    const select = byId('s-theme');
    if (select) {
      select.value = normalized;
      if (persist) {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    return normalized;
  }

  function updateNavLabels(currentTheme) {
    const order = getThemeOrder();
    if (!order.length) return;

    const current = order.includes(currentTheme) ? currentTheme : order[0];
    const idx = order.indexOf(current);
    const prev = order[(idx - 1 + order.length) % order.length];
    const next = order[(idx + 1) % order.length];

    const label = byId('wq-theme-label');
    const labelBtn = byId('wq-theme-label-btn');
    const prevBtn = byId('wq-theme-prev');
    const nextBtn = byId('wq-theme-next');

    if (label) label.textContent = getThemeLabel(current);
    if (labelBtn) {
      labelBtn.setAttribute('aria-label', `Current style: ${getThemeLabel(current)}. Use arrows to change.`);
      setNavHoverNote(labelBtn, `${getThemeLabel(current)} (use arrows to change)`);
    }
    if (prevBtn) {
      prevBtn.setAttribute('aria-label', `Previous style: ${getThemeLabel(prev)}`);
      setNavHoverNote(prevBtn, `Previous style: ${getThemeLabel(prev)}`);
    }
    if (nextBtn) {
      nextBtn.setAttribute('aria-label', `Next style: ${getThemeLabel(next)}`);
      setNavHoverNote(nextBtn, `Next style: ${getThemeLabel(next)}`);
    }
  }

  function syncThemeQuickSelectOptions() {
    // No-op: quick theme UI is arrow-based (no direct dropdown picker).
  }

  function cycleTheme(direction) {
    const order = getThemeOrder();
    if (!order.length) return;

    const current = getCurrentTheme();
    const currentIdx = Math.max(0, order.indexOf(current));
    const nextIdx = (currentIdx + direction + order.length) % order.length;
    const nextTheme = setTheme(order[nextIdx], true);
    updateNavLabels(nextTheme);
  }

  function isThemePopoverOpen() {
    const popover = byId('theme-preview-strip');
    return !!(popover && !popover.classList.contains('hidden'));
  }

  function ensureThemeNav() {
    if (byId('wq-theme-nav')) return;

    const themeSelect = byId('s-theme');
    const previewSlot = byId('theme-preview-slot');
    const previewStrip = byId('theme-preview-strip');
    const host = previewSlot || previewStrip || themeSelect?.closest('.setting-row');
    if (!host) return;

    const nav = document.createElement('div');
    nav.id = 'wq-theme-nav';
    nav.className = 'wq-theme-nav';
    nav.innerHTML = [
      '<button id="wq-theme-prev" class="wq-theme-nav-btn" type="button" aria-label="Previous style">◀</button>',
      '<button id="wq-theme-label-btn" class="wq-theme-label-btn" type="button" aria-label="Current style">',
      '  <span id="wq-theme-label" class="wq-theme-label">Default</span>',
      '</button>',
      '<button id="wq-theme-next" class="wq-theme-nav-btn" type="button" aria-label="Next style">▶</button>'
    ].join('');
    host.appendChild(nav);

    byId('wq-theme-prev')?.addEventListener('click', () => cycleTheme(-1));
    byId('wq-theme-next')?.addEventListener('click', () => cycleTheme(1));
    byId('wq-theme-label-btn')?.addEventListener('click', () => cycleTheme(1));
    nav.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        cycleTheme(-1);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        cycleTheme(1);
      }
    });
    nav.addEventListener('wheel', (event) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      cycleTheme(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    if (themeSelect && !themeSelect.dataset.wqThemeNavBound) {
      themeSelect.addEventListener('change', (event) => {
        const theme = event.target?.value;
        if (!theme) return;
        syncThemeQuickSelectOptions();
        updateNavLabels(theme);
      });
      themeSelect.dataset.wqThemeNavBound = '1';
    }

    syncThemeQuickSelectOptions();
    updateNavLabels(getCurrentTheme());
  }

  window.WQThemeNav = Object.freeze({
    cycleTheme,
    isThemePopoverOpen
  });

  function parseTeacherWords(raw) {
    return String(raw || '')
      .split(/[\n,]+/)
      .map((word) => word.trim().toUpperCase())
      .filter((word) => /^[A-Z]{2,12}$/.test(word));
  }

  function shuffleWords(words) {
    const next = Array.isArray(words) ? words.slice() : [];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = next[i];
      next[i] = next[j];
      next[j] = temp;
    }
    return next;
  }

  function normalizeSupportPayload(raw) {
    return {
      definition: String(raw?.definition || '').replace(/\s+/g, ' ').trim(),
      sentence: String(raw?.sentence || '').replace(/\s+/g, ' ').trim()
    };
  }

  function readTeacherSupportMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TEACHER_SUPPORT_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function writeTeacherSupportMap(map) {
    try {
      localStorage.setItem(TEACHER_SUPPORT_KEY, JSON.stringify(map || {}));
    } catch (_error) {
      // Ignore storage failures and keep UI usable.
    }
  }

  function getTeacherSupport(word) {
    const normalizedWord = String(word || '').trim().toLowerCase();
    if (!normalizedWord) return { definition: '', sentence: '' };
    return normalizeSupportPayload(readTeacherSupportMap()[normalizedWord]);
  }

  function setTeacherSupport(word, payload) {
    const normalizedWord = String(word || '').trim().toLowerCase();
    if (!normalizedWord) return;
    const next = readTeacherSupportMap();
    const normalized = normalizeSupportPayload(payload);
    if (!normalized.definition && !normalized.sentence) {
      delete next[normalizedWord];
    } else {
      next[normalizedWord] = normalized;
    }
    writeTeacherSupportMap(next);
  }

  function hasBankEntry(word) {
    if (!window.WQData || typeof window.WQData.hasWord !== 'function') return false;
    return !!window.WQData.hasWord(word);
  }

  function getAuditStatus(word) {
    const normalizedWord = String(word || '').trim().toLowerCase();
    const support = getTeacherSupport(normalizedWord);
    const inBank = hasBankEntry(normalizedWord);
    if (inBank) {
      return {
        status: 'ready',
        label: 'In bank',
        detail: 'Built-in clue support is ready.'
      };
    }
    if (support.definition || support.sentence) {
      return {
        status: 'custom',
        label: 'Custom support',
        detail: 'Teacher support will be used for clue help.'
      };
    }
    return {
      status: 'missing',
      label: 'Needs info',
      detail: 'Add a definition or sentence to enable clue help.'
    };
  }

  function summarizeAudit(words) {
    const list = Array.isArray(words) ? words : [];
    if (!list.length) return 'No words yet.';
    let ready = 0;
    let custom = 0;
    let missing = 0;
    list.forEach((word) => {
      const status = getAuditStatus(word).status;
      if (status === 'ready') ready += 1;
      else if (status === 'custom') custom += 1;
      else missing += 1;
    });
    return `${ready} ready, ${custom} custom, ${missing} need support`;
  }

  function renderTeacherAudit(words) {
    const panel = byId('wq-teacher-audit');
    const listEl = byId('wq-teacher-audit-list');
    const summaryEl = byId('wq-teacher-audit-summary');
    if (!panel || !listEl || !summaryEl) return;
    const list = Array.isArray(words) ? words : [];
    if (!list.length) {
      panel.classList.add('hidden');
      listEl.innerHTML = '';
      summaryEl.textContent = 'No words yet.';
      return;
    }
    panel.classList.remove('hidden');
    summaryEl.textContent = summarizeAudit(list);
    listEl.innerHTML = list.map((word) => {
      const audit = getAuditStatus(word);
      const actionLabel = audit.status === 'ready' ? 'View' : (audit.status === 'custom' ? 'Edit' : 'Add support');
      return [
        `<div class="teacher-audit-item" data-status="${audit.status}">`,
        '  <span class="teacher-audit-dot" aria-hidden="true"></span>',
        '  <div>',
        `    <div class="teacher-audit-word">${word}</div>`,
        `    <div class="teacher-audit-meta">${audit.label}: ${audit.detail}</div>`,
        '  </div>',
        `  <button class="teacher-audit-action" type="button" data-word-action="edit-support" data-word="${word}">${actionLabel}</button>`,
        '</div>'
      ].join('');
    }).join('');
  }

  function openTeacherSupportEditor(word) {
    const normalizedWord = String(word || '').trim().toUpperCase();
    const editor = byId('wq-teacher-support-editor');
    if (!editor) return;
    const support = getTeacherSupport(normalizedWord);
    editor.dataset.word = normalizedWord;
    byId('wq-teacher-support-title').textContent = `Support for ${normalizedWord}`;
    byId('wq-teacher-support-definition').value = support.definition;
    byId('wq-teacher-support-sentence').value = support.sentence;
    editor.classList.remove('hidden');
  }

  function closeTeacherSupportEditor() {
    const editor = byId('wq-teacher-support-editor');
    if (!editor) return;
    editor.classList.add('hidden');
    editor.dataset.word = '';
  }

  function persistTeacherWords(words) {
    try {
      if (Array.isArray(words) && words.length) {
        localStorage.setItem(TEACHER_POOL_KEY, JSON.stringify(words));
      } else {
        localStorage.removeItem(TEACHER_POOL_KEY);
      }
    } catch (_error) {
      // Storage can be unavailable in private browsing.
    }
  }

  function loadTeacherWords() {
    try {
      const raw = localStorage.getItem(TEACHER_POOL_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function setTeacherMessage(message, isError) {
    const msg = byId('wq-teacher-msg');
    if (!msg) return;
    msg.textContent = message || '';
    msg.classList.toggle('is-error', !!isError);
  }

  function setTeacherStatus(activeWords) {
    const status = byId('wq-teacher-status');
    if (!status) return;
    if (Array.isArray(activeWords) && activeWords.length) {
      status.textContent = `ACTIVE (${activeWords.length})`;
      status.classList.remove('hidden');
      status.setAttribute('aria-hidden', 'false');
    } else {
      status.classList.add('hidden');
      status.setAttribute('aria-hidden', 'true');
    }
  }

  function applyTeacherPool(words, options = {}) {
    const next = Array.isArray(words) ? words : [];
    window.__WQ_TEACHER_POOL__ = next.length ? next : null;
    persistTeacherWords(next);
    setTeacherStatus(next);
    renderTeacherAudit(next);

    if (!options.silent) {
      if (next.length) {
        const preview = next.slice(0, 5).join(', ');
        const suffix = next.length > 5 ? '...' : '';
        setTeacherMessage(`Loaded ${next.length} word${next.length > 1 ? 's' : ''}: ${preview}${suffix}`, false);
      } else {
        setTeacherMessage('Word list cleared. Using full word bank.', false);
      }
    }
  }

  function syncTeacherHubSelectsFromSettings() {
    const mappings = [
      ['teacher-grade-band', 's-grade'],
      ['teacher-team-mode', 's-team-mode'],
      ['teacher-team-count', 's-team-count'],
      ['teacher-turn-timer', 's-turn-timer'],
      ['teacher-voice-task', 's-voice-task']
    ];
    mappings.forEach(([teacherId, settingsId]) => {
      const teacherSelect = byId(teacherId);
      const settingsSelect = byId(settingsId);
      if (!teacherSelect || !settingsSelect) return;
      teacherSelect.value = settingsSelect.value;
    });
  }

  function dispatchSettingsSelect(settingsId, value) {
    const settingsSelect = byId(settingsId);
    if (!settingsSelect) return;
    settingsSelect.value = value;
    settingsSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function bindTeacherHubControlSync() {
    if (document.body.dataset.wqTeacherHubControlBound === '1') return;
    const mappings = [
      ['teacher-grade-band', 's-grade'],
      ['teacher-team-mode', 's-team-mode'],
      ['teacher-team-count', 's-team-count'],
      ['teacher-turn-timer', 's-turn-timer'],
      ['teacher-voice-task', 's-voice-task']
    ];
    mappings.forEach(([teacherId, settingsId]) => {
      const teacherSelect = byId(teacherId);
      const settingsSelect = byId(settingsId);
      if (!teacherSelect || !settingsSelect) return;
      teacherSelect.addEventListener('change', (event) => {
        dispatchSettingsSelect(settingsId, event.target?.value || '');
      });
      settingsSelect.addEventListener('change', () => {
        teacherSelect.value = settingsSelect.value;
      });
    });
    document.body.dataset.wqTeacherHubControlBound = '1';
  }

  function openTeacherPanel() {
    const panel = byId('teacher-panel');
    if (!panel) return;
    syncTeacherHubSelectsFromSettings();
    byId('settings-panel')?.classList.add('hidden');
    panel.classList.remove('hidden');
    renderTeacherAudit(parseTeacherWords(byId('wq-teacher-words')?.value || ''));
    positionTeacherPanel();
    window.dispatchEvent(new CustomEvent(TEACHER_PANEL_TOGGLE_EVENT, { detail: { open: true } }));
    byId('wq-teacher-words')?.focus();
  }

  function closeTeacherPanel() {
    const panel = byId('teacher-panel');
    if (!panel) return;
    panel.classList.add('hidden');
    window.dispatchEvent(new CustomEvent(TEACHER_PANEL_TOGGLE_EVENT, { detail: { open: false } }));
  }

  function positionTeacherPanel() {
    const panel = byId('teacher-panel');
    const card = byId('teacher-panel')?.querySelector('.teacher-panel-card');
    if (!(panel instanceof HTMLElement) || !(card instanceof HTMLElement) || panel.classList.contains('hidden')) return;
    if ((window.innerWidth || 0) <= 1080) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(84px, 11vh, 120px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const board = document.querySelector('.board-plate');
    const header = document.querySelector('header');
    if (!(board instanceof HTMLElement)) {
      panel.style.left = '50%';
      panel.style.top = 'clamp(84px, 11vh, 120px)';
      panel.style.transform = 'translateX(-50%)';
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const headerBottom = header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 72;
    const gap = 18;
    const rightSpace = window.innerWidth - boardRect.right - gap - 12;
    const leftSpace = boardRect.left - gap - 12;
    let left = boardRect.right + gap;
    if (rightSpace < card.offsetWidth && leftSpace > rightSpace) {
      left = Math.max(12, boardRect.left - card.offsetWidth - gap);
    }
    left = Math.max(12, Math.min(left, window.innerWidth - card.offsetWidth - 12));
    const top = Math.max(headerBottom + 10, Math.min(boardRect.top, window.innerHeight - card.offsetHeight - 12));
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.max(12, top)}px`;
    panel.style.transform = 'none';
  }

  function launchTeacherWordRound() {
    const mode = String(document.documentElement.getAttribute('data-page-mode') || '').toLowerCase();
    if (mode === 'mission-lab') {
      byId('mission-lab-nav-btn')?.click();
    }
    closeTeacherPanel();
    byId('new-game-btn')?.click();
  }

  function bindTeacherPanel() {
    if (document.body.dataset.wqTeacherPanelBound === '1') return;
    byId('teacher-panel-btn')?.addEventListener('click', openTeacherPanel);
    byId('teacher-panel-close')?.addEventListener('click', closeTeacherPanel);
    byId('teacher-panel')?.addEventListener('click', (event) => {
      if (event.target?.id === 'teacher-panel') closeTeacherPanel();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const panel = byId('teacher-panel');
      if (!panel || panel.classList.contains('hidden')) return;
      closeTeacherPanel();
    });
    window.addEventListener(OPEN_TEACHER_HUB_EVENT, openTeacherPanel);
    window.addEventListener('resize', positionTeacherPanel, { passive: true });
    window.addEventListener('scroll', positionTeacherPanel, { passive: true });
    {
      const panel = byId('teacher-panel');
      const card = panel?.querySelector('.teacher-panel-card');
      const header = panel?.querySelector('.teacher-panel-head');
      let dragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      const onPointerMove = (event) => {
        if (!dragging || !(panel instanceof HTMLElement) || !(card instanceof HTMLElement)) return;
        const x = Math.max(8, Math.min(window.innerWidth - card.offsetWidth - 8, event.clientX - dragOffsetX));
        const y = Math.max(8, Math.min(window.innerHeight - card.offsetHeight - 8, event.clientY - dragOffsetY));
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.transform = 'none';
      };
      const stopDragging = () => {
        dragging = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stopDragging);
      };
      header?.addEventListener('pointerdown', (event) => {
        if (!(panel instanceof HTMLElement) || !(card instanceof HTMLElement)) return;
        if ((event.target instanceof HTMLElement) && event.target.closest('#teacher-panel-close')) return;
        dragging = true;
        const rect = card.getBoundingClientRect();
        dragOffsetX = event.clientX - rect.left;
        dragOffsetY = event.clientY - rect.top;
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', stopDragging);
      });
    }
    document.body.dataset.wqTeacherPanelBound = '1';
  }

  function ensureTeacherTools() {
    if (document.body.dataset.wqTeacherToolsBound === '1') return;
    const wordsInput = byId('wq-teacher-words');
    if (!wordsInput) return;

    function applyTeacherWords(options = {}) {
      const words = parseTeacherWords(wordsInput?.value || '');
      if (!words.length) {
        setTeacherMessage('No valid words found. Use letters only, 2-12 chars.', true);
        return;
      }
      const finalWords = options.shuffle ? shuffleWords(words) : words;
      applyTeacherPool(finalWords);
      wordsInput.value = finalWords.join('\n');
      launchTeacherWordRound();
    }

    byId('wq-teacher-activate')?.addEventListener('click', () => {
      applyTeacherWords({ shuffle: false });
    });

    byId('wq-teacher-shuffle')?.addEventListener('click', () => {
      applyTeacherWords({ shuffle: true });
    });

    byId('wq-teacher-clear')?.addEventListener('click', () => {
      if (wordsInput) wordsInput.value = '';
      applyTeacherPool([]);
      closeTeacherSupportEditor();
    });

    byId('wq-teacher-support-save')?.addEventListener('click', () => {
      const editor = byId('wq-teacher-support-editor');
      const word = String(editor?.dataset.word || '').trim();
      if (!word) return;
      const definition = byId('wq-teacher-support-definition')?.value || '';
      const sentence = byId('wq-teacher-support-sentence')?.value || '';
      setTeacherSupport(word, { definition, sentence });
      renderTeacherAudit(parseTeacherWords(wordsInput?.value || ''));
      setTeacherMessage(`Saved support for ${word}.`, false);
      closeTeacherSupportEditor();
    });

    byId('wq-teacher-support-cancel')?.addEventListener('click', () => {
      closeTeacherSupportEditor();
    });

    byId('wq-teacher-audit-list')?.addEventListener('click', (event) => {
      const btn = event.target?.closest?.('[data-word-action="edit-support"]');
      if (!btn) return;
      openTeacherSupportEditor(btn.getAttribute('data-word') || '');
    });

    wordsInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      applyTeacherWords({ shuffle: false });
    });

    wordsInput.addEventListener('input', () => {
      renderTeacherAudit(parseTeacherWords(wordsInput.value || ''));
    });

    const restoredWords = loadTeacherWords();
    if (restoredWords.length) {
      wordsInput.value = restoredWords.join('\n');
      applyTeacherPool(restoredWords, { silent: true });
    } else {
      setTeacherStatus([]);
      renderTeacherAudit([]);
    }

    bindTeacherHubControlSync();
    bindTeacherPanel();
    document.body.dataset.wqTeacherToolsBound = '1';
  }

  function init() {
    ensureThemeNav();
    ensureTeacherTools();

    byId('settings-btn')?.addEventListener('click', () => {
      requestAnimationFrame(() => {
        ensureThemeNav();
        ensureTeacherTools();
      });
    });

    const rootObserver = new MutationObserver(() => {
      updateNavLabels(getCurrentTheme());
    });
    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    const bodyObserver = new MutationObserver(() => {
      ensureThemeNav();
      syncThemeQuickSelectOptions();
      ensureTeacherTools();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
