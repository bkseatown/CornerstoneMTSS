#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const eventBusPath = path.join(root, 'js/contracts/event-bus-contract.js');
const contractPath = path.join(root, 'js/contracts/deep-dive-contract.js');
const featurePath = path.join(root, 'js/features/deep-dive-core.js');

const listeners = Object.create(null);
const modal = {
  classList: {
    contains(className) {
      return className === 'hidden' ? false : false;
    }
  }
};

const context = {
  window: {},
  document: {
    addEventListener(type, handler) {
      listeners[type] = handler;
    }
  },
  CustomEvent: function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
context.window.CustomEvent = context.CustomEvent;

vm.createContext(context);
vm.runInContext(fs.readFileSync(eventBusPath, 'utf8'), context, { filename: eventBusPath });
vm.runInContext(fs.readFileSync(contractPath, 'utf8'), context, { filename: contractPath });
vm.runInContext(fs.readFileSync(featurePath, 'utf8'), context, { filename: featurePath });

const contract = context.window.WQDeepDiveContract;
const factory = context.window.WQDeepDiveCoreFeature;
if (!contract || !factory || typeof factory.createFeature !== 'function') {
  throw new Error('Deep Dive contract or feature failed to initialize.');
}

const revealState = {
  word: 'planet',
  topic: 'science',
  grade: 'G3-5',
  challenge: { level: 'apply' },
  activeTask: 'listen',
  tasks: { listen: false, analyze: false, create: false },
  attemptId: 'attempt-1'
};

let feedbackMessage = '';
let renderCalls = 0;

const feature = factory.createFeature({
  contract,
  el: (id) => (id === 'challenge-modal' ? modal : null),
  getRevealChallengeState: () => revealState,
  getDoneCount: (state) => ['listen', 'analyze', 'create'].filter((task) => !!state.tasks[task]).length,
  setTaskComplete: (task, complete) => { revealState.tasks[task] = !!complete; },
  setFeedback: (message) => { feedbackMessage = String(message || ''); },
  renderModal: () => { renderCalls += 1; }
});

if (!feature) throw new Error('Deep Dive feature did not instantiate.');
feature.publishBridge();
feature.bindEvents();

const eventNames = contract.events || {};
const completeHandler = listeners[eventNames.completeTask];
if (typeof completeHandler !== 'function') {
  throw new Error('Deep Dive complete-task event listener was not bound.');
}

completeHandler({ detail: { task: 'listen', complete: true, render: true } });
if (!revealState.tasks.listen) {
  throw new Error('Deep Dive listen task did not complete after event dispatch.');
}
if (renderCalls < 1) {
  throw new Error('Deep Dive render was not invoked on listen completion.');
}

const feedbackHandler = listeners[eventNames.feedback];
if (typeof feedbackHandler !== 'function') {
  throw new Error('Deep Dive feedback event listener was not bound.');
}
feedbackHandler({ detail: { message: 'Nice work', tone: 'good' } });
if (feedbackMessage !== 'Nice work') {
  throw new Error('Deep Dive feedback event did not route to feature setFeedback.');
}

if (!context.window.WQDeepDive || typeof context.window.WQDeepDive.getState !== 'function') {
  throw new Error('Deep Dive bridge was not published.');
}

const bridgeState = context.window.WQDeepDive.getState();
if (!bridgeState.open || bridgeState.word !== 'planet') {
  throw new Error('Deep Dive bridge state is incomplete.');
}

console.log('browser smoke check passed: deep dive open/listen contract');
