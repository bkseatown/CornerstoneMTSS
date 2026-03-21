/**
 * app-hover-notes.js
 * Hover and focus note toast helpers for header and control affordances.
 */

function createHoverNotesModule(deps) {
  const {
    delayMs = 500,
    documentRef = document,
    requestAnimationFrameRef = requestAnimationFrame,
    selector = '',
    windowRef = window
  } = deps || {};

  let hoverNoteTimer = 0;
  let hoverNoteTarget = null;
  let hoverNoteEl = null;

  function setHoverNoteForElement(el, note) {
    if (!el) return;
    const text = String(note || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      el.removeAttribute('data-hover-note');
      return;
    }
    el.setAttribute('data-hover-note', text);
    if (el.hasAttribute('title')) el.removeAttribute('title');
  }

  function getHoverNoteText(el) {
    if (!el) return '';
    if (el.getAttribute('data-no-hover-note') === 'true') return '';
    const explicit = el.getAttribute('data-hover-note');
    const fromHint = el.getAttribute('data-hint');
    const fromAria = el.getAttribute('aria-label');
    const fromTitle = el.getAttribute('title');
    const raw = String(explicit || fromHint || fromAria || fromTitle || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (raw.length <= 120) return raw;
    return `${raw.slice(0, 117).trimEnd()}...`;
  }

  function ensureHoverNoteToast() {
    if (hoverNoteEl && documentRef.body.contains(hoverNoteEl)) return hoverNoteEl;
    const el = documentRef.createElement('div');
    el.id = 'hover-note-toast';
    el.className = 'hover-note-toast hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-hidden', 'true');
    documentRef.body.appendChild(el);
    hoverNoteEl = el;
    return hoverNoteEl;
  }

  function hideHoverNoteToast() {
    if (hoverNoteTimer) {
      clearTimeout(hoverNoteTimer);
      hoverNoteTimer = 0;
    }
    hoverNoteTarget = null;
    if (!hoverNoteEl) return;
    hoverNoteEl.classList.remove('is-visible');
    hoverNoteEl.classList.add('hidden');
    hoverNoteEl.setAttribute('aria-hidden', 'true');
  }

  function showHoverNoteToast(targetEl) {
    if (!targetEl || !documentRef.contains(targetEl)) return;
    const text = getHoverNoteText(targetEl);
    if (!text) return;
    const toast = ensureHoverNoteToast();
    toast.textContent = `✨ ${text}`;
    toast.classList.remove('hidden');
    const rect = targetEl.getBoundingClientRect();
    const showAbove = rect.top > 84;
    const placement = showAbove ? 'top' : 'bottom';
    const top = showAbove ? (rect.top - 10) : (rect.bottom + 10);
    const left = Math.max(14, Math.min(windowRef.innerWidth - 14, rect.left + (rect.width / 2)));
    toast.style.left = `${left}px`;
    toast.style.top = `${Math.max(10, Math.min(windowRef.innerHeight - 10, top))}px`;
    toast.setAttribute('data-placement', placement);
    toast.setAttribute('aria-hidden', 'false');
    requestAnimationFrameRef(() => {
      toast.classList.add('is-visible');
    });
  }

  function scheduleHoverNoteToast(targetEl, delay = delayMs) {
    if (!windowRef.matchMedia('(hover: hover)').matches) return;
    if (hoverNoteTimer) {
      clearTimeout(hoverNoteTimer);
      hoverNoteTimer = 0;
    }
    hoverNoteTarget = targetEl;
    hoverNoteTimer = windowRef.setTimeout(() => {
      hoverNoteTimer = 0;
      if (hoverNoteTarget !== targetEl) return;
      showHoverNoteToast(targetEl);
    }, Math.max(0, delay));
  }

  function initHoverNoteToasts() {
    if (!windowRef.matchMedia('(hover: hover)').matches) return;
    const captureHoverNote = (eventTarget) => {
      const node = eventTarget?.closest?.(selector);
      if (!node || !documentRef.contains(node)) return null;
      if (node.getAttribute('data-no-hover-note') === 'true') return null;
      if (node.matches(':disabled,[aria-disabled="true"]')) return null;
      return node;
    };

    documentRef.addEventListener('mouseover', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      if (node.hasAttribute('title') && !node.hasAttribute('data-hover-note')) {
        setHoverNoteForElement(node, node.getAttribute('title'));
      }
      scheduleHoverNoteToast(node);
    }, true);

    documentRef.addEventListener('mouseout', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      const related = event.relatedTarget;
      if (related && node.contains(related)) return;
      hideHoverNoteToast();
    }, true);

    documentRef.addEventListener('focusin', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      scheduleHoverNoteToast(node, 320);
    }, true);

    documentRef.addEventListener('focusout', (event) => {
      const node = captureHoverNote(event.target);
      if (!node) return;
      const related = event.relatedTarget;
      if (related && node.contains(related)) return;
      hideHoverNoteToast();
    }, true);

    documentRef.addEventListener('pointerdown', hideHoverNoteToast, true);
    documentRef.addEventListener('keydown', hideHoverNoteToast, true);
    windowRef.addEventListener('scroll', hideHoverNoteToast, { passive: true });
    windowRef.addEventListener('resize', hideHoverNoteToast, { passive: true });
  }

  return {
    hideHoverNoteToast,
    initHoverNoteToasts,
    setHoverNoteForElement
  };
}

window.createHoverNotesModule = createHoverNotesModule;
