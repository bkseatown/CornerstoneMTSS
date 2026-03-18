/**
 * collab-overlay.js
 * SVG overlay for specialist annotations on game board
 * Allows real-time marking, highlighting, and decision notes
 */

const CollabOverlay = (() => {
  let svg = null;
  let container = null;
  let gameBoard = null;
  let annotations = new Map();
  let isEnabled = false;

  // Configuration
  const config = {
    highlightColor: '#FFD700',
    arrowColor: '#FF6B6B',
    noteColor: '#FFE66D',
    remoteCursorColor: '#0173b2',
    strokeWidth: 3,
    fontSize: 14
  };

  /**
   * Initialize overlay on game board
   * @param {string} containerId - Container element ID or element
   * @param {object} options - Configuration options
   */
  function init(containerId, options = {}) {
    // Get container
    if (typeof containerId === 'string') {
      container = document.getElementById(containerId);
    } else {
      container = containerId;
    }

    if (!container) {
      console.error('❌ Overlay container not found');
      return false;
    }

    // Get game board dimensions
    gameBoard = container.querySelector('[data-game-board], .game-board, .word-board');
    if (!gameBoard) {
      gameBoard = container;
    }

    // Create SVG overlay
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'collab-overlay');
    svg.setAttribute('width', gameBoard.offsetWidth);
    svg.setAttribute('height', gameBoard.offsetHeight);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '900';

    // Create SVG groups for different annotation types
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Arrow marker definition
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', config.arrowColor);
    marker.appendChild(polygon);
    defs.appendChild(marker);

    svg.appendChild(defs);

    // Create annotation groups
    svg.appendChild(createGroup('highlights'));
    svg.appendChild(createGroup('arrows'));
    svg.appendChild(createGroup('notes'));
    svg.appendChild(createGroup('cursors'));

    gameBoard.appendChild(svg);
    container.style.position = 'relative';

    // Handle window resize
    window.addEventListener('resize', resize);

    // Merge options
    Object.assign(config, options);

    isEnabled = true;
    console.log('📐 CollabOverlay initialized');
    return true;
  }

  /**
   * Create annotation group
   */
  function createGroup(name) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `overlay-${name}`);
    return group;
  }

  /**
   * Highlight a word tile with circle/rectangle
   * @param {object|string} target - DOM element or word ID
   * @param {string} color - Highlight color (default: gold)
   * @param {string} style - 'circle' or 'box' (default: circle)
   */
  function highlightWord(target, color = config.highlightColor, style = 'circle') {
    if (!svg) return;

    // Find element
    let element = target;
    if (typeof target === 'string') {
      element = document.querySelector(`[data-word-id="${target}"], .word[id="${target}"]`);
    }

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const containerRect = gameBoard.getBoundingClientRect();

    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    const width = rect.width;
    const height = rect.height;

    const id = generateId('highlight');

    if (style === 'circle') {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('id', id);
      circle.setAttribute('cx', x + width / 2);
      circle.setAttribute('cy', y + height / 2);
      circle.setAttribute('r', Math.max(width, height) / 2 + 5);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', config.strokeWidth);
      circle.setAttribute('data-annotation-id', id);

      svg.querySelector('.overlay-highlights').appendChild(circle);
    } else {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', id);
      rect.setAttribute('x', x - 5);
      rect.setAttribute('y', y - 5);
      rect.setAttribute('width', width + 10);
      rect.setAttribute('height', height + 10);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', config.strokeWidth);
      rect.setAttribute('data-annotation-id', id);

      svg.querySelector('.overlay-highlights').appendChild(rect);
    }

    annotations.set(id, {type: 'highlight', element, color, style});
    console.log('✓ Word highlighted');
    return id;
  }

  /**
   * Draw attention arrow
   * @param {number} fromX - Start X coordinate
   * @param {number} fromY - Start Y coordinate
   * @param {number} toX - End X coordinate
   * @param {number} toY - End Y coordinate
   */
  function drawAttention(fromX, fromY, toX, toY, color = config.arrowColor) {
    if (!svg) return;

    const id = generateId('arrow');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('id', id);
    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', config.strokeWidth);
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.setAttribute('data-annotation-id', id);

    svg.querySelector('.overlay-arrows').appendChild(line);

    annotations.set(id, {type: 'arrow', fromX, fromY, toX, toY, color});
    console.log('→ Attention arrow drawn');
    return id;
  }

  /**
   * Add sticky note with decision/observation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} text - Note text
   * @param {string} type - Note type ('strategy', 'observation', 'question')
   */
  function addNote(x, y, text, type = 'strategy') {
    if (!svg) return;

    const id = generateId('note');

    // Note background (sticky note shape)
    const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    noteGroup.setAttribute('id', id);
    noteGroup.setAttribute('class', `note note-${type}`);
    noteGroup.setAttribute('data-annotation-id', id);

    // Rectangle for note
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', '140');
    rect.setAttribute('height', '120');
    rect.setAttribute('fill', config.noteColor);
    rect.setAttribute('stroke', '#999999');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('rx', '4');

    // Shadow effect
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadow.setAttribute('id', `shadow-${id}`);
    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '2');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '3');
    shadow.appendChild(feDropShadow);
    svg.querySelector('defs').appendChild(shadow);
    rect.setAttribute('filter', `url(#shadow-${id})`);

    // Text content
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', x + 10);
    textEl.setAttribute('y', y + 25);
    textEl.setAttribute('font-size', config.fontSize);
    textEl.setAttribute('font-family', 'Arial, sans-serif');
    textEl.setAttribute('fill', '#000000');
    textEl.setAttribute('font-weight', '500');
    textEl.setAttribute('pointer-events', 'none');

    // Wrap text
    const words = text.split(' ');
    let currentY = 25;
    let currentLine = '';

    words.forEach((word, index) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;

      if (testLine.length > 15 || index === words.length - 1) {
        if (currentLine) {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', x + 10);
          tspan.setAttribute('dy', '1.2em');
          tspan.textContent = currentLine + (index === words.length - 1 && !currentLine.includes(word) ? '' : (currentLine ? ' ' : '') + word);
          textEl.appendChild(tspan);
          currentLine = '';
        } else {
          currentLine = word;
        }
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', x + 10);
      tspan.setAttribute('dy', '1.2em');
      tspan.textContent = currentLine;
      textEl.appendChild(tspan);
    }

    noteGroup.appendChild(rect);
    noteGroup.appendChild(textEl);

    svg.querySelector('.overlay-notes').appendChild(noteGroup);

    annotations.set(id, {type: 'note', x, y, text, noteType: type});
    console.log('📌 Note added');
    return id;
  }

  /**
   * Show remote specialist's cursor
   * @param {object} position - {x, y}
   * @param {string} name - Specialist name
   */
  function showRemoteCursor(position, name = 'Specialist') {
    if (!svg) return;

    const id = generateId('cursor');

    // Cursor group
    const cursorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cursorGroup.setAttribute('id', id);
    cursorGroup.setAttribute('class', 'remote-cursor');

    // Cursor arrow
    const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cursor.setAttribute('d', 'M 0,0 L 0,20 L 5,15 L 10,20 Z');
    cursor.setAttribute('fill', config.remoteCursorColor);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '12');
    label.setAttribute('y', '15');
    label.setAttribute('font-size', '12');
    label.setAttribute('fill', config.remoteCursorColor);
    label.setAttribute('font-weight', 'bold');
    label.textContent = name;

    cursorGroup.appendChild(cursor);
    cursorGroup.appendChild(label);
    cursorGroup.setAttribute('transform', `translate(${position.x}, ${position.y})`);

    svg.querySelector('.overlay-cursors').appendChild(cursorGroup);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (svg && document.getElementById(id)) {
        document.getElementById(id).remove();
      }
    }, 5000);

    return id;
  }

  /**
   * Remove annotation by ID
   * @param {string} annotationId - ID of annotation to remove
   */
  function removeAnnotation(annotationId) {
    const element = svg.querySelector(`[data-annotation-id="${annotationId}"]`);
    if (element) {
      element.remove();
      annotations.delete(annotationId);
      console.log('✓ Annotation removed');
      return true;
    }
    return false;
  }

  /**
   * Clear all annotations
   */
  function clear() {
    if (svg) {
      svg.querySelectorAll('[data-annotation-id]').forEach(el => el.remove());
      annotations.clear();
      console.log('✓ All annotations cleared');
    }
  }

  /**
   * Handle window resize
   */
  function resize() {
    if (!svg || !gameBoard) return;

    const width = gameBoard.offsetWidth;
    const height = gameBoard.offsetHeight;

    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
  }

  /**
   * Get all annotations
   */
  function getAnnotations() {
    return Array.from(annotations.entries()).map(([id, data]) => ({id, ...data}));
  }

  /**
   * Enable/disable overlay
   */
  function setEnabled(enabled) {
    if (svg) {
      svg.style.pointerEvents = enabled ? 'auto' : 'none';
      svg.style.opacity = enabled ? '1' : '0.5';
      isEnabled = enabled;
    }
  }

  /**
   * Generate unique ID
   */
  function generateId(prefix = 'annotation') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    init,
    highlightWord,
    drawAttention,
    addNote,
    showRemoteCursor,
    removeAnnotation,
    clear,
    getAnnotations,
    setEnabled,
    resize
  };
})();
