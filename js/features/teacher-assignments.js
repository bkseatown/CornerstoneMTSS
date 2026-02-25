(function () {
  'use strict';

  function bindUI(deps) {
    if (!deps || typeof deps.el !== 'function') return;
    const _el = deps.el;

    _el('s-group-select')?.addEventListener('change', (event) => {
      deps.setSelectedGroupPlanId(event.target?.value || '');
      deps.renderGroupBuilderPanel();
    });

    _el('session-group-new-btn')?.addEventListener('click', () => {
      const nextName = String(_el('s-group-name')?.value || '').trim() || `Group ${deps.getGroupPlanCount() + 1}`;
      const nextTier = String(_el('s-group-tier')?.value || 'tier2').trim().toLowerCase();
      const entry = {
        id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: nextName,
        tier: nextTier === 'tier1' || nextTier === 'tier3' ? nextTier : 'tier2',
        students: [],
        assignment: { packId: 'custom', targetId: 'custom', updatedAt: 0 },
        updatedAt: Date.now()
      };
      deps.addGroupPlanEntry(entry);
      deps.setSelectedGroupPlanId(entry.id);
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_created', group: entry } }));
      deps.renderGroupBuilderPanel();
      deps.toast('New group created.');
    });

    _el('session-group-save-btn')?.addEventListener('click', () => {
      const selected = deps.getSelectedGroupPlan();
      if (!selected) {
        deps.toast('Select or create a group first.');
        return;
      }
      const nextName = String(_el('s-group-name')?.value || '').trim() || selected.name;
      const nextTierRaw = String(_el('s-group-tier')?.value || selected.tier || 'tier2').trim().toLowerCase();
      selected.name = nextName;
      selected.tier = nextTierRaw === 'tier1' || nextTierRaw === 'tier3' ? nextTierRaw : 'tier2';
      selected.updatedAt = Date.now();
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_saved', group: selected } }));
      deps.renderGroupBuilderPanel();
      deps.toast('Group saved.');
    });

    _el('session-group-delete-btn')?.addEventListener('click', () => {
      const selected = deps.getSelectedGroupPlan();
      if (!selected) {
        deps.toast('Select a group to delete.');
        return;
      }
      deps.removeGroupPlanById(selected.id);
      deps.setSelectedGroupPlanId(deps.getFirstGroupPlanId());
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_deleted', groupId: selected.id } }));
      deps.renderGroupBuilderPanel();
      deps.toast('Group deleted.');
    });

    _el('session-group-add-active-btn')?.addEventListener('click', () => {
      const selected = deps.getSelectedGroupPlan();
      const student = deps.getActiveStudentLabel();
      if (!selected) {
        deps.toast('Select a group first.');
        return;
      }
      if (!student || student === 'Class') {
        deps.toast('Select a student first.');
        return;
      }
      if (!selected.students.includes(student)) selected.students.push(student);
      selected.students.sort((a, b) => a.localeCompare(b));
      selected.updatedAt = Date.now();
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_members_updated', group: selected } }));
      deps.renderGroupBuilderPanel();
      deps.toast(`${student} added to ${selected.name}.`);
    });

    _el('session-group-remove-active-btn')?.addEventListener('click', () => {
      const selected = deps.getSelectedGroupPlan();
      const student = deps.getActiveStudentLabel();
      if (!selected) {
        deps.toast('Select a group first.');
        return;
      }
      if (!student || student === 'Class') {
        deps.toast('Select a student first.');
        return;
      }
      selected.students = selected.students.filter((name) => name !== student);
      selected.updatedAt = Date.now();
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_members_updated', group: selected } }));
      deps.renderGroupBuilderPanel();
      deps.toast(`${student} removed from ${selected.name}.`);
    });

    _el('session-group-assign-target-btn')?.addEventListener('click', () => {
      const selected = deps.getSelectedGroupPlan();
      if (!selected) {
        deps.toast('Select a group first.');
        return;
      }
      const snapshot = deps.buildCurrentCurriculumSnapshot();
      selected.assignment = {
        packId: snapshot.packId || 'custom',
        targetId: snapshot.targetId || 'custom',
        updatedAt: Date.now()
      };
      selected.updatedAt = Date.now();
      deps.saveGroupPlanState();
      window.dispatchEvent(new CustomEvent('wq:assignment-updated', { detail: { type: 'group_target_assigned', group: selected } }));
      deps.renderGroupBuilderPanel();
      deps.toast(`Assigned current target to ${selected.name}.`);
    });

    _el('s-lock-pack')?.addEventListener('change', (event) => {
      const nextPack = deps.normalizeLessonPackId(event.target?.value || 'custom');
      deps.populateTargetSelectForPack(_el('s-lock-target'), nextPack, 'custom', { includeCustom: true });
    });

    _el('session-lock-save-btn')?.addEventListener('click', () => {
      const student = deps.getActiveStudentLabel();
      if (!student || student === 'Class') {
        deps.toast('Select a student first.');
        return;
      }
      const enabled = !!_el('s-lock-enabled')?.checked;
      const packId = deps.normalizeLessonPackId(_el('s-lock-pack')?.value || 'custom');
      const targetId = deps.normalizeLessonTargetId(packId, _el('s-lock-target')?.value || 'custom');
      const duration = String(_el('s-lock-duration')?.value || '1w').trim().toLowerCase();
      const now = Date.now();
      let expiresAt = 0;
      if (duration === '1w') expiresAt = now + (7 * 24 * 60 * 60 * 1000);
      if (duration === '2w') expiresAt = now + (14 * 24 * 60 * 60 * 1000);
      if (duration === '4w') expiresAt = now + (28 * 24 * 60 * 60 * 1000);
      if (duration === 'never') expiresAt = 0;
      if (!deps.setStudentTargetLock(student, { enabled, packId, targetId, expiresAt, updatedAt: now })) {
        deps.toast('Could not save lock.');
        return;
      }
      deps.renderStudentLockPanel();
      deps.toast(`Target lock saved for ${student}.`);
    });

    _el('session-lock-apply-btn')?.addEventListener('click', () => {
      const student = deps.getActiveStudentLabel();
      if (!student || student === 'Class') {
        deps.toast('Select a student first.');
        return;
      }
      if (!deps.maybeApplyStudentPlanForActiveStudent({ toast: true })) {
        deps.toast('No active lock or group assignment to apply.');
        return;
      }
      deps.renderStudentLockPanel();
    });

    _el('session-lock-clear-btn')?.addEventListener('click', () => {
      const student = deps.getActiveStudentLabel();
      if (!student || student === 'Class') {
        deps.toast('Select a student first.');
        return;
      }
      if (!deps.clearStudentTargetLock(student)) {
        deps.toast('No lock set for this student.');
        return;
      }
      deps.renderStudentLockPanel();
      deps.toast(`Target lock cleared for ${student}.`);
    });
  }

  window.WQTeacherAssignmentsFeature = Object.freeze({
    bindUI
  });
})();
