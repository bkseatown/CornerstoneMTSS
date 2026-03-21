/**
 * specialist-hub-cost-dashboard.js — Cost tracking UI module
 *
 * Manages:
 * - Cost dashboard initialization
 * - Monthly stats display
 * - Budget warning indicators
 * - Cost tracking event subscriptions
 *
 * Extracted from specialist-hub.js (Phase 3 refactoring)
 * Reduces specialist-hub.js by ~100 lines
 * Makes cost dashboard optional/lazy-loadable
 */

function createSpecialistHubCostDashboardModule() {
  "use strict";

  function updateCostDisplay() {
    if (!window.CSCostTracker) return;

    var stats = window.CSCostTracker.getMonthlyStats();
    var dashboard = document.getElementById("th2-cost-dashboard");
    var monthlyEl = document.getElementById("th2-cost-monthly");
    var callsEl = document.getElementById("th2-cost-calls");
    var budgetEl = document.getElementById("th2-cost-budget");
    var fillEl = document.getElementById("th2-cost-progress-fill");
    var labelEl = document.getElementById("th2-cost-progress-label");
    var warningEl = document.getElementById("th2-cost-warning");

    if (monthlyEl) monthlyEl.textContent = "$" + stats.totalCost.toFixed(2);
    if (callsEl) callsEl.textContent = String(stats.callCount);
    if (budgetEl) budgetEl.textContent = "$" + stats.budgetRemaining.toFixed(2) + " remaining";
    if (fillEl) fillEl.style.width = Math.min(stats.percentOfBudget, 100) + "%";
    if (labelEl) labelEl.textContent = stats.percentOfBudget.toFixed(1) + "% of budget";

    // Show warning if over budget
    if (warningEl) {
      if (stats.totalCost > 5.0) {
        warningEl.classList.add("active");
      } else {
        warningEl.classList.remove("active");
      }
    }
  }

  function init() {
    var dashboard = document.getElementById("th2-cost-dashboard");
    var closeBtn = document.getElementById("th2-cost-dashboard-close");

    if (!dashboard || !window.CSCostTracker) return;

    // Initialize cost tracker
    window.CSCostTracker.init();

    // Cost dashboard stays hidden by default — user can open via menu if needed
    // Previous behavior auto-showed on localhost which blocked morning brief content

    // Update display with initial stats
    updateCostDisplay();

    // Close button handler
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        dashboard.classList.add("hidden");
      });
    }

    // Listen for cost tracking events
    window.addEventListener("cs-cost-tracked", function (e) {
      updateCostDisplay();
    });
  }

  return {
    init: init,
    updateCostDisplay: updateCostDisplay
  };
}

// Wire to global scope
if (typeof window !== "undefined") {
  window.createSpecialistHubCostDashboardModule = createSpecialistHubCostDashboardModule;
}
