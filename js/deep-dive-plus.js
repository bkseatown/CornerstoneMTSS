(function deepDivePlus() {
  'use strict';

  var VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
  var state = {
    word: '',
    markupWord: '',
    marked: new Set(),
    handwritingMode: 'trace',
    observer: null,
    syncQueued: false,
    canvasBound: false,
    drawing: false,
    canvas: null,
    ctx: null
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function getModal() {
    return byId('challenge-modal');
  }

  function isModalOpen() {
    var modal = getModal();
    return !!modal && !modal.classList.contains('hidden');
  }

  function queueSync() {
    if (state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(function () {
      state.syncQueued = false;
      sync();
    });
  }

  function getWordFromChip() {
    var chip = byId('challenge-word-chip');
    var raw = chip ? String(chip.textContent || '') : '';
    var parsed = raw.replace(/^word:\s*/i, '').trim();
    return parsed;
  }

  function resolveToken(name, fallback) {
    try {
      var value = getComputedStyle(document.documentElement).getPropertyValue(name);
      var clean = String(value || '').trim();
      return clean || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function setFeedback(text, tone) {
    var bridge = window.WQDeepDive;
    if (bridge && typeof bridge.setFeedback === 'function') {
      try {
        bridge.setFeedback(String(text || ''), String(tone || 'default'));
        return;
      } catch (_error) {}
    }
    var target = byId('challenge-feedback') || byId('challenge-live-feedback');
    if (!target) return;
    target.textContent = String(text || '');
    target.classList.remove('is-good', 'is-warn', 'wq-plus-good', 'wq-plus-warn');
    if (tone === 'good') {
      target.classList.add('is-good', 'wq-plus-good');
    } else if (tone === 'warn') {
      target.classList.add('is-warn', 'wq-plus-warn');
    }
    if (target.classList.contains('hidden')) target.classList.remove('hidden');
  }

  function isListenTaskAlreadyComplete() {
    var bridge = window.WQDeepDive;
    if (!bridge || typeof bridge.getState !== 'function') return false;
    try {
      var snapshot = bridge.getState();
      return !!snapshot?.tasks?.listen;
    } catch (_error) {
      return false;
    }
  }

  function ensureHandwritingPanel() {
    var modal = getModal();
    if (!modal) return null;
    var body = modal.querySelector('.challenge-modal-body');
    if (!body) return null;

    var existing = byId('wq-hw-panel');
    if (existing) return existing;

    var panel = document.createElement('section');
    panel.id = 'wq-hw-panel';
    panel.className = 'wq-hw-panel';
    panel.innerHTML = [
      '<div class="wq-hw-head">',
      '  <h3 class="wq-hw-title">✍️ Write It (Optional)</h3>',
      '  <span id="wq-hw-word" class="wq-hw-word">—</span>',
      '</div>',
      '<div id="wq-hw-markup" class="wq-hw-markup" role="group" aria-label="Optional sound lab"></div>',
      '<div class="wq-hw-controls" role="group" aria-label="Handwriting tools">',
      '  <button id="wq-hw-trace-btn" class="audio-btn wq-hw-btn" type="button" aria-pressed="true">Trace</button>',
      '  <button id="wq-hw-write-btn" class="audio-btn wq-hw-btn" type="button" aria-pressed="false">Write</button>',
      '  <button id="wq-hw-clear-btn" class="audio-btn wq-hw-btn" type="button">Clear</button>',
      '</div>',
      '<div class="wq-hw-canvas-wrap">',
      '  <canvas id="wq-hw-canvas" class="wq-hw-canvas" aria-label="Handwriting canvas"></canvas>',
      '  <div id="wq-hw-ghost" class="wq-hw-ghost" aria-hidden="true">—</div>',
      '</div>'
    ].join('');

    var progress = byId('challenge-station-progress');
    if (progress && progress.parentNode === body) {
      progress.insertAdjacentElement('afterend', panel);
    } else {
      body.appendChild(panel);
    }
    return panel;
  }

  function getCanvasPoint(evt, canvas) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / Math.max(1, rect.width);
    var scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  function ensureCanvasSize() {
    var canvas = state.canvas;
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var width = Math.max(1, Math.round(rect.width * dpr));
    var height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    state.ctx = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, Math.round(3 * dpr));
    ctx.strokeStyle = resolveToken('--text', '#1f2937');
  }

  function clearCanvas() {
    if (!state.ctx || !state.canvas) return;
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  }

  function setHandwritingMode(mode) {
    state.handwritingMode = mode === 'write' ? 'write' : 'trace';
    var ghost = byId('wq-hw-ghost');
    var traceBtn = byId('wq-hw-trace-btn');
    var writeBtn = byId('wq-hw-write-btn');
    if (ghost) ghost.classList.toggle('is-hidden', state.handwritingMode === 'write');
    if (traceBtn) traceBtn.setAttribute('aria-pressed', state.handwritingMode === 'trace' ? 'true' : 'false');
    if (writeBtn) writeBtn.setAttribute('aria-pressed', state.handwritingMode === 'write' ? 'true' : 'false');
  }

  function bindCanvas() {
    if (state.canvasBound) return;
    var canvas = byId('wq-hw-canvas');
    if (!canvas) return;
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    if (!state.ctx) return;
    canvas.style.touchAction = 'none';
    ensureCanvasSize();

    canvas.addEventListener('pointerdown', function (evt) {
      ensureCanvasSize();
      state.drawing = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(evt.pointerId); } catch (_error) {}
      }
      var point = getCanvasPoint(evt, canvas);
      state.ctx.beginPath();
      state.ctx.moveTo(point.x, point.y);
    });

    canvas.addEventListener('pointermove', function (evt) {
      if (!state.drawing) return;
      var point = getCanvasPoint(evt, canvas);
      state.ctx.lineTo(point.x, point.y);
      state.ctx.stroke();
    });

    function stopDrawing(evt) {
      state.drawing = false;
      if (canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(evt.pointerId); } catch (_error) {}
      }
    }

    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);

    var traceBtn = byId('wq-hw-trace-btn');
    var writeBtn = byId('wq-hw-write-btn');
    var clearBtn = byId('wq-hw-clear-btn');
    if (traceBtn) traceBtn.addEventListener('click', function () { setHandwritingMode('trace'); });
    if (writeBtn) writeBtn.addEventListener('click', function () { setHandwritingMode('write'); });
    if (clearBtn) clearBtn.addEventListener('click', clearCanvas);

    window.addEventListener('resize', function () {
      if (!isModalOpen()) return;
      ensureCanvasSize();
    });

    state.canvasBound = true;
  }

  function renderMarkup(word) {
    var wrap = byId('wq-hw-markup');
    if (!wrap) return;
    var letters = String(word || '').split('');
    var validIndexes = new Set();
    for (var i = 0; i < letters.length; i += 1) validIndexes.add(i);
    state.marked.forEach(function (idx) {
      if (!validIndexes.has(idx)) state.marked.delete(idx);
    });

    wrap.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'wq-markup-root';

    var row = document.createElement('div');
    row.className = 'wq-markup-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Tap letters to mark vowel sounds');

    letters.forEach(function (letter, index) {
      var lower = letter.toLowerCase();
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'wq-markup-letter';
      if (VOWELS.has(lower)) button.classList.add('is-vowel');
      if (state.marked.has(index)) button.classList.add('is-marked');
      button.dataset.wqMarkupIndex = String(index);
      button.textContent = letter;
      row.appendChild(button);
    });

    var actions = document.createElement('div');
    actions.className = 'wq-markup-actions';
    actions.innerHTML = [
      '<button type="button" class="audio-btn wq-markup-reset">Reset Marks</button>',
      '<button type="button" class="audio-btn wq-markup-check">Check</button>'
    ].join('');

    var help = document.createElement('p');
    help.className = 'wq-markup-help';
    help.textContent = 'Optional sound lab: mark every vowel (a, e, i, o, u).';

    root.appendChild(row);
    root.appendChild(actions);
    root.appendChild(help);
    wrap.appendChild(root);

    row.addEventListener('click', function (evt) {
      var button = evt.target && evt.target.closest ? evt.target.closest('button[data-wq-markup-index]') : null;
      if (!button) return;
      var index = Number(button.dataset.wqMarkupIndex);
      if (!Number.isInteger(index)) return;
      if (state.marked.has(index)) {
        state.marked.delete(index);
      } else {
        state.marked.add(index);
      }
      button.classList.toggle('is-marked', state.marked.has(index));
    });

    var resetBtn = actions.querySelector('.wq-markup-reset');
    var checkBtn = actions.querySelector('.wq-markup-check');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.marked.clear();
        row.querySelectorAll('.wq-markup-letter.is-marked').forEach(function (node) {
          node.classList.remove('is-marked');
        });
        setFeedback('Reset done. Tap each vowel.', 'default');
      });
    }
    if (checkBtn) {
      checkBtn.addEventListener('click', function () {
        var expected = new Set();
        letters.forEach(function (letter, index) {
          if (VOWELS.has(letter.toLowerCase())) expected.add(index);
        });
        var correct = expected.size === state.marked.size;
        if (correct) {
          expected.forEach(function (index) {
            if (!state.marked.has(index)) correct = false;
          });
        }
        if (!correct) {
          setFeedback('Nice try. Mark every vowel you see.', 'warn');
          return;
        }
        if (isListenTaskAlreadyComplete()) {
          setFeedback('Great sound check. This step is already complete.', 'good');
          return;
        }
        setFeedback('Great sound check. Now finish the Sound step above.', 'good');
      });
    }

    state.markupWord = word;
  }

  function syncWord() {
    var word = getWordFromChip();
    if (!word) return;
    var wordLabel = byId('wq-hw-word');
    var ghost = byId('wq-hw-ghost');
    if (wordLabel) wordLabel.textContent = word;
    if (ghost) ghost.textContent = word;
    if (state.word !== word) {
      state.word = word;
      state.marked.clear();
      renderMarkup(word);
      clearCanvas();
      return;
    }
    if (state.markupWord !== word || !byId('wq-hw-markup')?.querySelector('.wq-markup-root')) {
      renderMarkup(word);
    }
  }

  function sync() {
    if (!isModalOpen()) return;
    ensureHandwritingPanel();
    bindCanvas();
    setHandwritingMode(state.handwritingMode);
    syncWord();
  }

  function initObserver() {
    if (state.observer) return;
    var modal = getModal();
    if (!modal) return;
    state.observer = new MutationObserver(function () {
      queueSync();
    });
    state.observer.observe(modal, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function init() {
    initObserver();
    queueSync();
    window.setInterval(function () {
      if (!isModalOpen()) return;
      sync();
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
