(function dashboardStateModule() {
  "use strict";

  function create(initial) {
    var base = {
      role: "teacher",
      mode: "daily",
      selectedStudentId: "",
      meetingWorkspace: {
        open: false,
        tab: "summary"
      },
      featureFlags: {
        demoMode: false,
        adminMode: false
      }
    };

    var state = Object.assign({}, base, initial || {});
    state.meetingWorkspace = Object.assign({}, base.meetingWorkspace, state.meetingWorkspace || {});
    state.featureFlags = Object.assign({}, base.featureFlags, state.featureFlags || {});

    var listeners = [];

    function emit() {
      listeners.slice().forEach(function (fn) {
        try { fn(state); } catch (_e) {}
      });
    }

    return {
      get: function () { return state; },
      set: function (patch) {
        if (!patch || typeof patch !== "object") return state;
        state = Object.assign({}, state, patch);
        if (patch.meetingWorkspace) {
          state.meetingWorkspace = Object.assign({}, state.meetingWorkspace, patch.meetingWorkspace);
        }
        if (patch.featureFlags) {
          state.featureFlags = Object.assign({}, state.featureFlags, patch.featureFlags);
        }
        emit();
        return state;
      },
      updateMeetingWorkspace: function (patch) {
        state.meetingWorkspace = Object.assign({}, state.meetingWorkspace, patch || {});
        emit();
        return state;
      },
      subscribe: function (fn) {
        if (typeof fn !== "function") return function () {};
        listeners.push(fn);
        return function () {
          listeners = listeners.filter(function (x) { return x !== fn; });
        };
      }
    };
  }

  window.CSDashboardState = { create: create };
})();
