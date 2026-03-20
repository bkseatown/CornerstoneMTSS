/**
 * app-gameplay-support.js
 * Shared gameplay summary and formatting helpers.
 */

function createGameplaySupportModule(deps) {
  const {
    buildCurriculumSelectionLabel = () => '',
    buildCurrentCurriculumSnapshot = () => ({}),
    getActiveStudentLabel = () => '',
    getErrorPatternLabels = () => ({}),
    getErrorNextStepCopy = () => ({}),
    getFocusLabel = () => '',
    getFocusValue = () => 'all',
    formatGradeBandLabel = () => '',
    parseFocusPreset = () => ({ kind: 'classic', focus: 'all' })
  } = deps || {};

  function normalizeCounterMap(raw) {
    const map = Object.create(null);
    if (!raw || typeof raw !== 'object') return map;
    Object.entries(raw).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const count = Math.max(0, Math.floor(Number(value) || 0));
      if (!count) return;
      map[normalizedKey] = count;
    });
    return map;
  }

  function mergeCounterMaps(target, additions) {
    const base = target && typeof target === 'object' ? target : Object.create(null);
    if (!additions || typeof additions !== 'object') return base;
    Object.entries(additions).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      if (!normalizedKey) return;
      const next = Math.max(0, Math.floor(Number(value) || 0));
      if (!next) return;
      base[normalizedKey] = (base[normalizedKey] || 0) + next;
    });
    return base;
  }

  function getTopErrorKey(errorCounts) {
    const entries = Object.entries(errorCounts || {});
    if (!entries.length) return '';
    entries.sort((left, right) => right[1] - left[1]);
    return entries[0]?.[0] || '';
  }

  function getTopErrorLabel(errorCounts) {
    const errorPatternLabels = getErrorPatternLabels() || {};
    const key = getTopErrorKey(errorCounts);
    if (!key) return '--';
    return errorPatternLabels[key] || key.replace(/_/g, ' ');
  }

  function getInstructionalNextStep(errorCounts) {
    const errorNextStepCopy = getErrorNextStepCopy() || {};
    const key = getTopErrorKey(errorCounts);
    if (!key) return 'Continue current lesson target.';
    return errorNextStepCopy[key] || 'Review recent errors and provide a targeted reteach.';
  }

  function getInstructionalNextStepChip(errorCounts) {
    const key = getTopErrorKey(errorCounts);
    switch (key) {
      case 'vowel_pattern': return 'Vowel Pattern Reteach';
      case 'blend_position': return 'Blend Position Reteach';
      case 'morpheme_ending': return 'Morpheme Ending Reteach';
      case 'context_strategy': return 'Clue Strategy Reteach';
      default: return 'Stay Current Target';
    }
  }

  function resolveMiniLessonErrorKey(rawKey, fallbackCounts = null, validPlans = {}) {
    const normalized = String(rawKey || '').trim().toLowerCase();
    if (normalized === 'top' || normalized === 'auto') {
      const top = getTopErrorKey(fallbackCounts || {});
      return top || 'context_strategy';
    }
    if (validPlans[normalized]) return normalized;
    return 'context_strategy';
  }

  function buildMiniLessonPlanText(errorKey, options = {}) {
    const errorPatternLabels = getErrorPatternLabels() || {};
    const resolved = resolveMiniLessonErrorKey(errorKey, options.errorCounts, options.validPlans || {});
    const steps = (options.validPlans && options.validPlans[resolved]) || [];
    const label = errorPatternLabels[resolved] || resolved.replace(/_/g, ' ');
    const snapshot = buildCurrentCurriculumSnapshot();
    const lessonTargetLabel = snapshot.targetLabel || snapshot.packLabel || buildCurriculumSelectionLabel();
    const student = options.student || getActiveStudentLabel();
    return [
      `WordQuest Quick Mini-Lesson · ${label}`,
      `Student: ${student}`,
      `Current target: ${lessonTargetLabel}`,
      'Duration: 5 minutes',
      '',
      ...steps,
      '',
      'Materials: whiteboard or paper, 4-6 word cards, quick verbal feedback.'
    ].join('\n');
  }

  function getSkillDescriptorForRound(result) {
    const focusValue = getFocusValue();
    const preset = parseFocusPreset(focusValue);
    if (preset.kind === 'subject') {
      return {
        key: `subject:${preset.subject}:${preset.gradeBand || 'all'}`,
        label: `${preset.subject.toUpperCase()} vocab (${formatGradeBandLabel(preset.gradeBand)})`
      };
    }
    if (preset.kind === 'phonics' && preset.focus && preset.focus !== 'all') {
      const label = getFocusLabel(preset.focus).replace(/[—]/g, '').replace(/\s+/g, ' ').trim();
      return {
        key: `phonics:${preset.focus}`,
        label: label || 'Phonics focus'
      };
    }
    const phonics = String(result?.entry?.phonics || '').trim();
    if (phonics && phonics.toLowerCase() !== 'all') {
      return {
        key: `phonics-tag:${phonics.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: phonics
      };
    }
    return { key: 'classic:all', label: 'Classic mixed practice' };
  }

  function formatDurationLabel(durationMs) {
    const ms = Math.max(0, Number(durationMs) || 0);
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${String(rem).padStart(2, '0')}s`;
  }

  return {
    buildMiniLessonPlanText,
    formatDurationLabel,
    getInstructionalNextStep,
    getInstructionalNextStepChip,
    getSkillDescriptorForRound,
    getTopErrorKey,
    getTopErrorLabel,
    mergeCounterMaps,
    normalizeCounterMap,
    resolveMiniLessonErrorKey
  };
}
