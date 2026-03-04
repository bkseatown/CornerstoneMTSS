(function dashboardFocusModule() {
  "use strict";

  function setSelectedStudent(store, studentId) {
    if (!store || typeof store.set !== "function") return;
    store.set({ selectedStudentId: String(studentId || "") });
  }

  window.CSDashboardFocus = {
    setSelectedStudent: setSelectedStudent
  };
})();
