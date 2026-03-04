(function dashboardSupportModule() {
  "use strict";

  function getSelectedStudent(store) {
    if (!store || typeof store.get !== "function") return "";
    var state = store.get();
    return String(state && state.selectedStudentId || "");
  }

  window.CSDashboardSupport = {
    getSelectedStudent: getSelectedStudent
  };
})();
