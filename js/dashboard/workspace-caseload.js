(function workspaceCaseloadModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSWorkspaceCaseload = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createWorkspaceCaseload() {
  "use strict";

  function filterRows(rows, query) {
    var q = String(query || "").trim().toLowerCase();
    return (Array.isArray(rows) ? rows : []).filter(function (row) {
      if (!q) return true;
      return String(row && row.name || "").toLowerCase().includes(q) ||
        String(row && row.id || "").toLowerCase().includes(q) ||
        String(row && row.focus || "").toLowerCase().includes(q);
    });
  }

  function renderList(options) {
    var config = options && typeof options === "object" ? options : {};
    var rows = Array.isArray(config.rows) ? config.rows : [];
    var listEl = config.listEl || null;
    var selectedId = String(config.selectedId || "");
    var onSelect = typeof config.onSelect === "function" ? config.onSelect : function () {};
    if (!listEl) return;
    if (!rows.length) {
      listEl.innerHTML = '<div class="td-empty">No matches. Try name, student ID, or focus.</div>';
      return;
    }
    listEl.innerHTML = rows.map(function (row) {
      var selected = String(row && row.id || "") === selectedId ? "is-active" : "";
      return [
        '<button class="td-student-chip ' + selected + '" data-student-id="' + String(row.id || "") + '" type="button">',
        '<div class="td-chip-top"><strong>' + String(row.name || "Student") + '</strong><span class="td-risk ' + String(row.risk || "watch") + '">' + String(row.risk || "watch") + '</span></div>',
        '<div class="td-chip-top"><span>' + String(row.id || "") + '</span><span>' + String(row.focus || "") + '</span></div>',
        '</button>'
      ].join("");
    }).join("");

    Array.prototype.forEach.call(listEl.querySelectorAll("[data-student-id]"), function (node) {
      node.addEventListener("click", function () {
        onSelect(node.getAttribute("data-student-id") || "");
      });
    });
  }

  return {
    filterRows: filterRows,
    renderList: renderList
  };
});
