/**
 * Lesson Brief Panel - UI Rendering
 *
 * All rendering functions for the lesson brief panel.
 * Generates HTML for blocks, forms, briefs, and options.
 *
 * @module js/lesson-brief/lesson-brief-ui
 */

import { el, escapeHtml, clearElement } from './lesson-brief-utils.js';

/**
 * Build the panel DOM structure
 * Creates overlay and panel container
 * @param {Object} deps - Dependencies {PANEL_ID, OVERLAY_ID, BODY_ID, close, handleClick, handleChange, handleInput}
 */
export function buildPanel(deps) {
  const { PANEL_ID, OVERLAY_ID, BODY_ID, close, handleClick, handleChange, handleInput } = deps;

  if (el(PANEL_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'cs-brief-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.className = 'cs-brief-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'cs-brief-title');
  panel.innerHTML = [
    '<div class="cs-brief-head">',
    '  <div class="cs-brief-head-copy">',
    '    <h2 id="cs-brief-title" class="cs-brief-title">Today\'s Briefing</h2>',
    '    <p class="cs-brief-sub">Start with the block of time, then the roster you support, then the lesson you are walking into.</p>',
    '  </div>',
    '  <button id="cs-brief-close" class="cs-brief-close" type="button" aria-label="Close lesson brief panel">x</button>',
    '</div>',
    '<div id="' + BODY_ID + '" class="cs-brief-body"></div>'
  ].join('');
  document.body.appendChild(panel);

  overlay.addEventListener('click', close);
  panel.addEventListener('click', handleClick);
  panel.addEventListener('change', handleChange);
  panel.addEventListener('input', handleInput);

  const closeBtn = el('cs-brief-close');
  if (closeBtn) closeBtn.addEventListener('click', close);
}

/**
 * Render form option
 * @param {string} value - Option value
 * @param {string} label - Option label
 * @param {boolean} selected - Is selected
 * @returns {string} HTML string
 */
export function renderOption(value, label, selected) {
  return '<option value="' + escapeHtml(value) + '"' + (selected ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
}

/**
 * Render number options (1, 2, 3, ...)
 * @param {number} total - Total count
 * @param {string} selectedValue - Selected value
 * @param {string} prefix - Label prefix
 * @returns {string} HTML string
 */
export function renderNumberOptions(total, selectedValue, prefix) {
  let html = '';
  for (let i = 1; i <= total; i++) {
    const val = String(i);
    const label = (prefix || '') + val;
    html += renderOption(val, label, val === selectedValue);
  }
  return html;
}

/**
 * Render a list of items as HTML list
 * @param {Array} items - Items to render
 * @returns {string} HTML string
 */
export function renderList(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return '<ul>' + items.map(item => '<li>' + escapeHtml(String(item || '')) + '</li>').join('') + '</ul>';
}

/**
 * Render resource links
 * @param {Array} items - Link objects {label, href, meta}
 * @returns {string} HTML string
 */
export function renderResourceLinks(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return '<div class="cs-brief-resource-links">'
    + items.map(link => {
      const href = escapeHtml(String(link.href || '#'));
      const label = escapeHtml(String(link.label || 'Link'));
      const meta = link.meta ? ' <span class="cs-brief-link-meta">(' + escapeHtml(String(link.meta)) + ')</span>' : '';
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' + meta;
    }).join('<br>')
    + '</div>';
}

/**
 * Render brief with optional tips
 * @param {string} base - Base HTML
 * @param {string} programId - Program identifier
 * @returns {string} HTML with tips
 */
export function renderWithTips(base, programId) {
  // Could add program-specific tips here
  return base;
}

/**
 * Deduuplicate and format list items
 * @param {Array} items - Items to process
 * @returns {Array} Deduplicated items
 */
export function dedupeList(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    if (!item) return false;
    const key = String(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Render block list
 * @param {Array} blocks - Blocks to render
 * @returns {string} HTML
 */
export function renderBlockList(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) {
    return '<p class="cs-brief-empty">No schedule blocks yet.</p>';
  }

  return '<div class="cs-brief-block-list">'
    + blocks.map(block => {
      const timeLabel = escapeHtml(String(block.timeLabel || ''));
      const label = escapeHtml(String(block.label || ''));
      const blockId = escapeHtml(String(block.id || ''));

      return '<div class="cs-brief-block-item">'
        + '<button type="button" data-brief-select-block="' + blockId + '" class="cs-brief-block-button">'
        + timeLabel + (timeLabel && label ? ' - ' : '') + label
        + '</button>'
        + '<button type="button" data-brief-delete-block="' + blockId + '" class="cs-brief-block-delete" aria-label="Delete block">×</button>'
        + '</div>';
    }).join('')
    + '</div>';
}

/**
 * Render student roster
 * @param {Array} students - Student list
 * @param {string} selectedId - Currently selected student ID
 * @returns {string} HTML
 */
export function renderRoster(students, selectedId) {
  if (!Array.isArray(students) || !students.length) {
    return '<p class="cs-brief-empty">No students in caseload.</p>';
  }

  let html = '<select id="cs-brief-roster-select" class="cs-brief-select" aria-label="Select student">'
    + '<option value="">Choose a student...</option>';

  students.forEach(student => {
    const id = escapeHtml(String(student.id || ''));
    const name = escapeHtml(String(student.name || student.preferredName || 'Student'));
    const grade = escapeHtml(String(student.grade || student.gradeBand || ''));
    const label = name + (grade ? ' (' + grade + ')' : '');
    html += renderOption(id, label, id === selectedId);
  });

  html += '</select>';
  return html;
}

/**
 * Render recent selections
 * @param {Array} recents - Recent selection history
 * @returns {string} HTML
 */
export function renderRecents(recents) {
  if (!Array.isArray(recents) || !recents.length) {
    return '<p class="cs-brief-empty">No recent selections.</p>';
  }

  return '<div class="cs-brief-recents">'
    + recents.slice(0, 6).map(recent => {
      const key = escapeHtml(String(recent.key || ''));
      const label = escapeHtml(String(recent.label || 'Recent'));
      return '<button type="button" data-brief-recent="' + key + '" class="cs-brief-recent-button">'
        + label
        + '</button>';
    }).join('')
    + '</div>';
}

/**
 * Render brief content
 * @param {Object} brief - Brief object
 * @param {Object} deps - Dependencies {noteForKey, getNoteMap}
 * @returns {string} HTML
 */
export function renderBrief(brief, deps) {
  if (!brief) return '<p class="cs-brief-empty">No brief selected.</p>';

  const { noteForKey, getNoteMap } = deps;
  const note = noteForKey ? noteForKey(brief) : '';

  let html = '<div class="cs-brief-content">'
    + '<h3>' + escapeHtml(brief.title || '') + '</h3>';

  if (brief.contextLine) {
    html += '<p class="cs-brief-meta">' + escapeHtml(brief.contextLine) + '</p>';
  }

  if (brief.summary) {
    html += '<div class="cs-brief-section">'
      + '<h4>Summary</h4>'
      + '<p>' + escapeHtml(brief.summary) + '</p>'
      + '</div>';
  }

  if (brief.mainConcept) {
    html += '<div class="cs-brief-section">'
      + '<h4>Main Concept</h4>'
      + '<p>' + escapeHtml(brief.mainConcept) + '</p>'
      + '</div>';
  }

  if (brief.workedExample) {
    html += '<div class="cs-brief-section">'
      + '<h4>Worked Example</h4>'
      + '<p>' + escapeHtml(brief.workedExample) + '</p>'
      + '</div>';
  }

  if (Array.isArray(brief.likelyConfusions) && brief.likelyConfusions.length) {
    html += '<div class="cs-brief-section">'
      + '<h4>Likely Confusions</h4>'
      + renderList(brief.likelyConfusions)
      + '</div>';
  }

  if (Array.isArray(brief.supportMoves) && brief.supportMoves.length) {
    html += '<div class="cs-brief-section">'
      + '<h4>Support Moves</h4>'
      + renderList(brief.supportMoves)
      + '</div>';
  }

  if (Array.isArray(brief.lookFors) && brief.lookFors.length) {
    html += '<div class="cs-brief-section">'
      + '<h4>Look Fors</h4>'
      + renderList(brief.lookFors)
      + '</div>';
  }

  if (Array.isArray(brief.prompts) && brief.prompts.length) {
    html += '<div class="cs-brief-section">'
      + '<h4>Prompts</h4>'
      + renderList(brief.prompts)
      + '</div>';
  }

  if (Array.isArray(brief.resourceLinks) && brief.resourceLinks.length) {
    html += '<div class="cs-brief-section">'
      + '<h4>Resources</h4>'
      + renderResourceLinks(brief.resourceLinks)
      + '</div>';
  }

  if (note) {
    html += '<div class="cs-brief-section cs-brief-note-display">'
      + '<h4>Your Note</h4>'
      + '<p>' + escapeHtml(note) + '</p>'
      + '</div>';
  }

  html += '<div class="cs-brief-actions">'
    + '<button type="button" data-brief-copy="' + escapeHtml(brief.key || '') + '" class="cs-brief-button">Copy to Clipboard</button>'
    + '<button type="button" data-brief-save-context="' + escapeHtml(brief.key || '') + '" class="cs-brief-button">Confirm & Save</button>'
    + '</div>'
    + '</div>';

  return html;
}

/**
 * Clear panel body
 */
export function clearPanelBody() {
  const body = el('cs-brief-body');
  if (body) clearElement(body);
}

/**
 * Update panel body content
 * @param {string} html - HTML to insert
 */
export function updatePanelBody(html) {
  const body = el('cs-brief-body');
  if (body) {
    body.innerHTML = html;
  }
}

export default {
  buildPanel,
  renderOption,
  renderNumberOptions,
  renderList,
  renderResourceLinks,
  renderWithTips,
  dedupeList,
  renderBlockList,
  renderRoster,
  renderRecents,
  renderBrief,
  clearPanelBody,
  updatePanelBody
};
