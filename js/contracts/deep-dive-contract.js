(function () {
  'use strict';

  const eventBusEvents = window.WQEventBusContract?.events || {};

  const bridge = Object.freeze({
    version: '1.2.0',
    deepDiveSchemaVersion: 1
  });

  const tasks = Object.freeze(['listen', 'analyze', 'create']);

  const events = Object.freeze({
    completeTask: eventBusEvents.deepDiveCompleteTask || 'wq:deep-dive-complete-task',
    feedback: eventBusEvents.deepDiveFeedback || 'wq:deep-dive-feedback'
  });

  window.WQDeepDiveContract = Object.freeze({
    bridge,
    tasks,
    events
  });
})();
