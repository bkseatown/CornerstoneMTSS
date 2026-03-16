/**
 * competency-heatmap.js
 * D3-based interactive heatmap showing student competency across standards
 * High-ROI specialist dashboard: see at a glance which students need focus on which standards
 */

const CompetencyHeatmap = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let containerEl = null;
  let data = {students: [], standards: [], competencies: []};
  let selectedStudent = null;
  let filteredData = null;

  /**
   * Initialize heatmap in container
   * @param {string|HTMLElement} selector Container for heatmap
   * @param {object} initialData {students, standards, competencies}
   */
  function init(selector, initialData) {
    containerEl = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (!containerEl) {
      console.error('CompetencyHeatmap: container not found');
      return;
    }

    data = initialData || {students: [], standards: [], competencies: []};
    filteredData = JSON.parse(JSON.stringify(data));
    render();
  }

  /**
   * Get competency level for a student-standard pair (0-100)
   */
  function getCompetency(studentId, standardId) {
    const entry = data.competencies.find(c =>
      c.studentId === studentId && c.standardId === standardId
    );
    return entry ? entry.level : 0;
  }

  /**
   * Get status color based on competency level
   * 0-33: intensify (red)
   * 34-66: developing (amber)
   * 67-100: secure (green)
   */
  function getStatusColor(level) {
    if (level >= 67) return 'var(--status-secure)';  // green
    if (level >= 34) return 'var(--status-developing)'; // amber
    return 'var(--status-intensify)';  // red
  }

  /**
   * Get status label
   */
  function getStatusLabel(level) {
    if (level >= 67) return 'Secure';
    if (level >= 34) return 'Developing';
    if (level > 0) return 'Emerging';
    return 'Not Assessed';
  }

  /**
   * Render the heatmap
   */
  function render() {
    containerEl.innerHTML = '';

    if (filteredData.students.length === 0 || filteredData.standards.length === 0) {
      containerEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No data to display</div>';
      return;
    }

    const cellSize = 48;
    const marginLeft = 180;
    const marginTop = 60;
    const marginRight = 20;
    const marginBottom = 20;

    const width = marginLeft + (filteredData.standards.length * cellSize) + marginRight;
    const height = marginTop + (filteredData.students.length * cellSize) + marginBottom;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('style', 'width: 100%; max-width: 1200px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-1);');

    // ─── Title ───
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', marginLeft);
    title.setAttribute('y', 24);
    title.setAttribute('style', 'font-size: 16px; font-weight: 600; fill: var(--text-primary);');
    title.textContent = 'Student Competency Across Standards';
    svg.appendChild(title);

    // ─── Standard Labels (Top) ───
    filteredData.standards.forEach((standard, i) => {
      const x = marginLeft + (i * cellSize) + (cellSize / 2);
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', marginTop - 8);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('style', 'font-size: 11px; fill: var(--text-muted); font-weight: 500;');
      label.textContent = standard.code || `S${i+1}`;
      label.setAttribute('title', standard.name || '');
      svg.appendChild(label);
    });

    // ─── Student Rows ───
    filteredData.students.forEach((student, studentIdx) => {
      const y = marginTop + (studentIdx * cellSize) + (cellSize / 2);

      // Student Name Label
      const nameLabel = document.createElementNS(SVG_NS, 'text');
      nameLabel.setAttribute('x', marginLeft - 12);
      nameLabel.setAttribute('y', y + 4);
      nameLabel.setAttribute('text-anchor', 'end');
      nameLabel.setAttribute('style', 'font-size: 12px; font-weight: 500; fill: var(--text-primary);');
      nameLabel.textContent = student.name || `Student ${studentIdx+1}`;
      nameLabel.setAttribute('title', student.id);
      svg.appendChild(nameLabel);

      // Competency Cells
      filteredData.standards.forEach((standard, stdIdx) => {
        const x = marginLeft + (stdIdx * cellSize);
        const cellY = marginTop + (studentIdx * cellSize);

        const level = getCompetency(student.id, standard.id);
        const statusColor = getStatusColor(level);
        const statusLabel = getStatusLabel(level);

        // Cell background
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', x + 2);
        rect.setAttribute('y', cellY + 2);
        rect.setAttribute('width', cellSize - 4);
        rect.setAttribute('height', cellSize - 4);
        rect.setAttribute('fill', statusColor);
        rect.setAttribute('opacity', '0.3');
        rect.setAttribute('rx', '4');
        rect.setAttribute('style', 'cursor: pointer; transition: opacity 0.2s;');
        rect.setAttribute('title', `${student.name} on ${standard.name}: ${statusLabel} (${level}%)`);

        rect.addEventListener('mouseenter', () => {
          rect.setAttribute('opacity', '0.5');
        });
        rect.addEventListener('mouseleave', () => {
          rect.setAttribute('opacity', '0.3');
        });

        rect.addEventListener('click', () => {
          selectStudent(student.id, standard.id);
        });

        svg.appendChild(rect);

        // Level text (if assessed)
        if (level > 0) {
          const text = document.createElementNS(SVG_NS, 'text');
          text.setAttribute('x', x + (cellSize / 2));
          text.setAttribute('y', cellY + (cellSize / 2) + 5);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('style', `font-size: 13px; font-weight: 600; fill: var(--text-strong);`);
          text.textContent = `${Math.round(level)}%`;
          svg.appendChild(text);
        }
      });
    });

    // ─── Legend ───
    const legendY = height - marginBottom + 10;
    const legendItems = [
      { label: 'Secure (67-100%)', color: 'var(--status-secure)' },
      { label: 'Developing (34-66%)', color: 'var(--status-developing)' },
      { label: 'Emerging (1-33%)', color: 'var(--status-intensify)' },
    ];

    legendItems.forEach((item, i) => {
      const x = marginLeft + (i * 220);

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', legendY);
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', item.color);
      dot.setAttribute('opacity', '0.5');
      svg.appendChild(dot);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', x + 12);
      label.setAttribute('y', legendY + 4);
      label.setAttribute('style', 'font-size: 11px; fill: var(--text-muted);');
      label.textContent = item.label;
      svg.appendChild(label);
    });

    containerEl.appendChild(svg);
    attachInteractivity();
  }

  /**
   * Attach click handlers and filters
   */
  function attachInteractivity() {
    // Can add filter controls here later (by grade, unit, etc.)
  }

  /**
   * Select a student/standard cell for detailed view
   */
  function selectStudent(studentId, standardId) {
    selectedStudent = {studentId, standardId};
    const student = data.students.find(s => s.id === studentId);
    const standard = data.standards.find(s => s.id === standardId);
    const level = getCompetency(studentId, standardId);

    console.log(`Selected: ${student?.name} on ${standard?.name} (${level}%)`);

    // Emit event for parent to handle detail view
    const event = new CustomEvent('competency-selected', {
      detail: {studentId, standardId, student, standard, level}
    });
    containerEl.dispatchEvent(event);
  }

  /**
   * Update competency data and re-render
   */
  function updateData(newData) {
    data = newData || data;
    filteredData = JSON.parse(JSON.stringify(data));
    render();
  }

  /**
   * Filter by criteria
   */
  function filterBy(criteria) {
    filteredData = {
      students: data.students.filter(s => {
        if (criteria.gradeLevel && s.gradeLevel !== criteria.gradeLevel) return false;
        if (criteria.classId && s.classId !== criteria.classId) return false;
        return true;
      }),
      standards: data.standards.filter(std => {
        if (criteria.unit && std.unit !== criteria.unit) return false;
        if (criteria.focus && std.focus !== criteria.focus) return false;
        return true;
      }),
      competencies: data.competencies
    };
    render();
  }

  return {
    init,
    render,
    updateData,
    filterBy,
    getCompetency,
    selectStudent
  };
})();
