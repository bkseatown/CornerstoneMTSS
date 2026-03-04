(function dashboardUtilsModule() {
  "use strict";

  function safeLower(value, fallback) {
    var str = String(value == null ? "" : value).trim().toLowerCase();
    return str || String(fallback || "").toLowerCase();
  }

  window.CSDashboardUtils = {
    safeLower: safeLower
  };
})();
