(function () {
  'use strict';

  const FALLBACK_BRIDGE = Object.freeze({
    version: '1.2.0',
    deepDiveSchemaVersion: 1
  });
  const FALLBACK_TASKS = Object.freeze(['listen', 'analyze', 'create']);
  const FALLBACK_EVENTS = Object.freeze({
    completeTask: 'wq:deep-dive-complete-task',
    feedback: 'wq:deep-dive-feedback'
  });

  function getContract(contract) {
    const source = contract && typeof contract === 'object'
      ? contract
      : (window.WQDeepDiveContract || {});
    const bridge = source.bridge && typeof source.bridge === 'object'
      ? source.bridge
      : {};
    return {
      bridge: {
        version: String(bridge.version || FALLBACK_BRIDGE.version),
        deepDiveSchemaVersion: Number(bridge.deepDiveSchemaVersion) || FALLBACK_BRIDGE.deepDiveSchemaVersion
      },
      tasks: Array.isArray(source.tasks) && source.tasks.length
        ? source.tasks.map((task) => String(task || '').trim().toLowerCase()).filter(Boolean)
        : FALLBACK_TASKS.slice(),
      events: {
        completeTask: source.events?.completeTask || FALLBACK_EVENTS.completeTask,
        feedback: source.events?.feedback || FALLBACK_EVENTS.feedback
      }
    };
  }

  function createFeature(deps) {
    if (!deps || typeof deps.el !== 'function') return null;
    const _el = deps.el;
    const contract = getContract(deps.contract);
    const taskSet = new Set(contract.tasks);
    let eventsBound = false;

    function getRevealState() {
      if (typeof deps.getRevealChallengeState !== 'function') return null;
      return deps.getRevealChallengeState() || null;
    }

    function getBridgeState() {
      const modalOpen = !(_el('challenge-modal')?.classList.contains('hidden'));
      const revealChallengeState = getRevealState();
      if (!revealChallengeState) {
        return {
          open: modalOpen,
          word: '',
          topic: '',
          grade: '',
          level: '',
          activeTask: '',
          doneCount: 0,
          tasks: { listen: false, analyze: false, create: false },
          attemptId: '',
          deepDiveSchemaVersion: contract.bridge.deepDiveSchemaVersion
        };
      }
      return {
        open: modalOpen,
        word: String(revealChallengeState.word || ''),
        topic: String(revealChallengeState.topic || ''),
        grade: String(revealChallengeState.grade || ''),
        level: String(revealChallengeState.challenge?.level || ''),
        activeTask: String(revealChallengeState.activeTask || ''),
        doneCount: typeof deps.getDoneCount === 'function' ? deps.getDoneCount(revealChallengeState) : 0,
        tasks: {
          listen: !!revealChallengeState.tasks?.listen,
          analyze: !!revealChallengeState.tasks?.analyze,
          create: !!revealChallengeState.tasks?.create
        },
        attemptId: String(revealChallengeState.attemptId || ''),
        deepDiveSchemaVersion: contract.bridge.deepDiveSchemaVersion
      };
    }

    function setFeedback(message, tone = 'default') {
      if (typeof deps.setFeedback !== 'function') return false;
      deps.setFeedback(message, tone);
      return true;
    }

    function completeTask(task, complete = true, options = {}) {
      const revealChallengeState = getRevealState();
      const normalizedTask = String(task || '').trim().toLowerCase();
      if (!taskSet.has(normalizedTask)) return false;
      if (!revealChallengeState) return false;
      if (typeof deps.setTaskComplete !== 'function') return false;
      deps.setTaskComplete(normalizedTask, !!complete);
      if (options && options.render !== false && typeof deps.renderModal === 'function') deps.renderModal();
      return true;
    }

    function render() {
      const revealChallengeState = getRevealState();
      if (!revealChallengeState || typeof deps.renderModal !== 'function') return false;
      deps.renderModal();
      return true;
    }

    function publishBridge() {
      const bridge = {
        version: contract.bridge.version,
        deepDiveSchemaVersion: contract.bridge.deepDiveSchemaVersion,
        getState: getBridgeState,
        isOpen: () => !(_el('challenge-modal')?.classList.contains('hidden')),
        getActiveWord: () => String(getRevealState()?.word || ''),
        completeTask,
        setFeedback,
        render
      };
      window.WQDeepDive = Object.freeze(bridge);
    }

    function bindEvents() {
      if (eventsBound) return;
      const completeTaskEvent = contract.events.completeTask;
      const feedbackEvent = contract.events.feedback;
      if (completeTaskEvent) {
        document.addEventListener(completeTaskEvent, (event) => {
          const detail = event?.detail && typeof event.detail === 'object' ? event.detail : {};
          const task = String(detail.task || '').trim();
          const isComplete = detail.complete !== false;
          const shouldRender = detail.render !== false;
          completeTask(task, isComplete, { render: shouldRender });
        });
      }
      if (feedbackEvent) {
        document.addEventListener(feedbackEvent, (event) => {
          const detail = event?.detail && typeof event.detail === 'object' ? event.detail : {};
          const message = String(detail.message || '').trim();
          const tone = String(detail.tone || 'default').trim();
          if (!message) return;
          setFeedback(message, tone);
        });
      }
      eventsBound = true;
    }

    return Object.freeze({
      getBridgeState,
      setFeedback,
      completeTask,
      render,
      publishBridge,
      bindEvents
    });
  }

  window.WQDeepDiveCoreFeature = Object.freeze({
    createFeature
  });
})();
