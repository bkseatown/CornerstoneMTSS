(function dashboardMeetingModule() {
  "use strict";

  function setWorkspaceState(store, patch) {
    if (!store || typeof store.updateMeetingWorkspace !== "function") return;
    store.updateMeetingWorkspace(patch || {});
  }

  window.CSDashboardMeeting = {
    setWorkspaceState: setWorkspaceState
  };
})();
