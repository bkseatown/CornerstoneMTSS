#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const contractPath = path.join(root, 'js/contracts/teacher-assignments-contract.js');
const featurePath = path.join(root, 'js/features/teacher-assignments.js');

function makeElement() {
  const listeners = Object.create(null);
  return {
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    trigger(type, payload = {}) {
      if (typeof listeners[type] !== 'function') throw new Error(`No ${type} listener registered.`);
      listeners[type](payload);
    }
  };
}

const context = {
  window: {},
  document: {},
  localStorage: {
    getItem() { return null; },
    setItem() {}
  },
  CustomEvent: function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
context.window.dispatchEvent = () => {};
context.window.CustomEvent = context.CustomEvent;

vm.createContext(context);
vm.runInContext(fs.readFileSync(contractPath, 'utf8'), context, { filename: contractPath });
vm.runInContext(fs.readFileSync(featurePath, 'utf8'), context, { filename: featurePath });

const feature = context.window.WQTeacherAssignmentsFeature;
if (!feature || typeof feature.bindUI !== 'function') {
  throw new Error('Teacher assignments feature did not expose bindUI.');
}

const selectedGroup = {
  id: 'group-1',
  name: 'Group 1',
  students: [],
  assignment: { packId: 'custom', targetId: 'custom', updatedAt: 0 },
  updatedAt: 0
};

const elements = {
  'session-group-assign-target-btn': makeElement(),
  'session-lock-apply-btn': makeElement()
};

let applyCalls = 0;
let renderGroupBuilderCalls = 0;
let renderStudentLockCalls = 0;

feature.bindUI({
  contract: context.window.WQTeacherAssignmentsContract,
  el: (id) => elements[id] || null,
  toast: () => {},
  normalizeLessonPackId: (value) => String(value || 'custom'),
  normalizeLessonTargetId: (_pack, value) => String(value || 'custom'),
  populateTargetSelectForPack: () => 'custom',
  buildCurrentCurriculumSnapshot: () => ({ packId: 'fundations', targetId: 'fundations_u1_l1' }),
  getActiveStudentLabel: () => 'Avery',
  getGroupPlanCount: () => 1,
  addGroupPlanEntry: () => {},
  removeGroupPlanById: () => {},
  getFirstGroupPlanId: () => 'group-1',
  getSelectedGroupPlan: () => selectedGroup,
  setSelectedGroupPlanId: () => {},
  saveGroupPlanState: () => {},
  renderGroupBuilderPanel: () => { renderGroupBuilderCalls += 1; },
  setStudentTargetLock: () => true,
  clearStudentTargetLock: () => true,
  renderStudentLockPanel: () => { renderStudentLockCalls += 1; },
  maybeApplyStudentPlanForActiveStudent: () => {
    applyCalls += 1;
    return true;
  }
});

elements['session-group-assign-target-btn'].trigger('click');
if (selectedGroup.assignment.packId !== 'fundations' || selectedGroup.assignment.targetId !== 'fundations_u1_l1') {
  throw new Error('Assign target action did not persist selected curriculum snapshot.');
}
if (renderGroupBuilderCalls < 1) {
  throw new Error('Assign target action did not re-render group builder panel.');
}

elements['session-lock-apply-btn'].trigger('click');
if (applyCalls !== 1) {
  throw new Error('Apply action did not invoke maybeApplyStudentPlanForActiveStudent.');
}
if (renderStudentLockCalls < 1) {
  throw new Error('Apply action did not re-render student lock panel.');
}

console.log('browser smoke check passed: group assign/apply contract');
