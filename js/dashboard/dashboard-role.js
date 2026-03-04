(function dashboardRoleModule() {
  "use strict";

  function normalizeRole(value) {
    var role = String(value || "teacher").toLowerCase();
    return role === "admin" ? "admin" : "teacher";
  }

  function applyRoleClasses(role) {
    var normalized = normalizeRole(role);
    document.body.classList.toggle("td-admin-role", normalized === "admin");
    document.body.classList.toggle("td-teacher-role", normalized !== "admin");
    return normalized;
  }

  window.CSDashboardRole = {
    normalizeRole: normalizeRole,
    applyRoleClasses: applyRoleClasses
  };
})();
