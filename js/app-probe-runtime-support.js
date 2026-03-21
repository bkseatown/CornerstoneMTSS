/**
 * app-probe-runtime-support.js
 * Probe trend math and chip-tone helpers shared across reporting surfaces.
 */

function createProbeRuntimeSupportModule(deps) {
  const {
    getProbeHistory = () => [],
    getProbeState = () => ({ active: false })
  } = deps || {};

  function matchesProbeRecordStudent(recordStudent, studentLabel) {
    const left = String(recordStudent || '').trim() || 'Class';
    const right = String(studentLabel || '').trim() || 'Class';
    return left === right;
  }

  function getProbeRecordsForStudent(studentLabel) {
    return getProbeHistory().filter((record) => matchesProbeRecordStudent(record?.student, studentLabel));
  }

  function getLatestProbeSourceForStudent(studentLabel) {
    const probeState = getProbeState();
    if (probeState.active && matchesProbeRecordStudent(probeState.student, studentLabel)) {
      return probeState;
    }
    return getProbeRecordsForStudent(studentLabel)[0] || null;
  }

  function buildProbeNumericSummary(source) {
    const roundsDone = Math.max(0, Number(source?.roundsDone) || 0);
    const wins = Math.max(0, Number(source?.wins) || 0);
    const totalGuesses = Math.max(0, Number(source?.totalGuesses) || 0);
    const totalDurationMs = Math.max(0, Number(source?.totalDurationMs) || 0);
    const hintRounds = Math.max(0, Number(source?.hintRounds) || 0);
    return {
      roundsDone,
      wins,
      accuracyRate: roundsDone ? wins / roundsDone : 0,
      avgGuesses: roundsDone ? totalGuesses / roundsDone : 0,
      avgTimeSeconds: roundsDone ? (totalDurationMs / roundsDone) / 1000 : 0,
      hintRate: roundsDone ? hintRounds / roundsDone : 0
    };
  }

  function getComparableProbeTrend(studentLabel) {
    const probeState = getProbeState();
    const records = getProbeRecordsForStudent(studentLabel);
    const activeMatches = probeState.active &&
      matchesProbeRecordStudent(probeState.student, studentLabel) &&
      Math.max(0, Number(probeState.roundsDone) || 0) > 0;
    const currentRecord = activeMatches ? probeState : (records[0] || null);
    const previousRecord = activeMatches ? (records[0] || null) : (records[1] || null);
    const current = currentRecord ? buildProbeNumericSummary(currentRecord) : null;
    const previous = previousRecord ? buildProbeNumericSummary(previousRecord) : null;
    return { current, previous, activeMatches };
  }

  function applyChipTone(node, tone) {
    if (!node) return;
    node.classList.remove('is-good', 'is-warn', 'is-bad');
    if (tone === 'good') node.classList.add('is-good');
    if (tone === 'warn') node.classList.add('is-warn');
    if (tone === 'bad') node.classList.add('is-bad');
  }

  return Object.freeze({
    applyChipTone,
    buildProbeNumericSummary,
    getComparableProbeTrend,
    getLatestProbeSourceForStudent,
    getProbeRecordsForStudent,
    matchesProbeRecordStudent
  });
}

window.createProbeRuntimeSupportModule = createProbeRuntimeSupportModule;
