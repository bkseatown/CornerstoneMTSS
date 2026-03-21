/**
 * app-roster-runtime.js
 * Roster and teacher-assignment helpers used by the teacher/session shell.
 */

function createRosterRuntimeModule(deps) {
  const {
    getRosterState = () => ({ students: [], active: '' }),
    setRosterState = () => {},
    saveRosterState = () => {},
    renderRosterControls = () => {},
    getTeacherAssignmentsFeature = () => null
  } = deps || {};

  function renderGroupBuilderPanel() {
    getTeacherAssignmentsFeature()?.renderGroupBuilderPanel?.();
  }

  function renderStudentLockPanel() {
    getTeacherAssignmentsFeature()?.renderStudentLockPanel?.();
  }

  function maybeApplyStudentPlanForActiveStudent(options = {}) {
    return getTeacherAssignmentsFeature()?.maybeApplyStudentPlanForActiveStudent?.(options) || false;
  }

  function addRosterStudent(rawName) {
    const name = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!name) return false;
    const rosterState = getRosterState();
    if (rosterState.students.includes(name)) {
      rosterState.active = name;
      saveRosterState();
      renderRosterControls();
      return true;
    }
    rosterState.students.push(name);
    rosterState.students.sort((a, b) => a.localeCompare(b));
    rosterState.active = name;
    saveRosterState();
    renderRosterControls();
    return true;
  }

  function removeActiveRosterStudent() {
    const rosterState = getRosterState();
    const active = String(rosterState.active || '').trim();
    if (!active) return false;
    rosterState.students = rosterState.students.filter((name) => name !== active);
    rosterState.active = rosterState.students[0] || '';
    getTeacherAssignmentsFeature()?.removeStudentReferences?.(active);
    saveRosterState();
    renderRosterControls();
    return true;
  }

  function clearRosterStudents() {
    setRosterState({ students: [], active: '' });
    getTeacherAssignmentsFeature()?.clearStudentAssignments?.();
    saveRosterState();
    renderRosterControls();
  }

  return Object.freeze({
    addRosterStudent,
    clearRosterStudents,
    maybeApplyStudentPlanForActiveStudent,
    removeActiveRosterStudent,
    renderGroupBuilderPanel,
    renderStudentLockPanel
  });
}

window.createRosterRuntimeModule = createRosterRuntimeModule;
