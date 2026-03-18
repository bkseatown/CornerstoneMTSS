(function () {
  'use strict';

  const events = Object.freeze({
    assignmentUpdated: 'wq:assignment-updated',
    studentLockUpdated: 'wq:student-lock-updated',
    teacherPanelToggle: 'wq:teacher-panel-toggle',
    openTeacherHub: 'wq:open-teacher-hub',
    deepDiveCompleteTask: 'wq:deep-dive-complete-task',
    deepDiveFeedback: 'wq:deep-dive-feedback'
  });

  window.WQEventBusContract = Object.freeze({
    events
  });
})();
