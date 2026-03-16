/**
 * Learning Hub: Portfolio Showcase Filtering
 * Allows teachers to filter activities by purpose/domain
 */

(function() {
  'use strict';

  let currentFilter = 'all';

  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    showDomain('all');
  });

  function initializeNavigation() {
    const navButtons = document.querySelectorAll('.hub-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');
        currentFilter = filter;

        // Update active button
        navButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Show/hide domains
        showDomain(filter);
      });
    });
  }

  function showDomain(filter) {
    const domains = document.querySelectorAll('.activity-domain');

    domains.forEach(domain => {
      if (filter === 'all') {
        domain.classList.add('visible');
      } else {
        // Check if this domain has activities matching the filter
        const matchingActivities = domain.querySelectorAll(
          `.activity-card[data-filter*="${filter}"]`
        );

        if (matchingActivities.length > 0) {
          domain.classList.add('visible');

          // Hide non-matching activities in this domain
          domain.querySelectorAll('.activity-card').forEach(card => {
            const filters = card.getAttribute('data-filter').split(' ');
            if (filters.includes(filter)) {
              card.style.display = 'block';
            } else {
              card.style.display = 'none';
            }
          });
        } else {
          domain.classList.remove('visible');
        }
      }
    });
  }

  // Expose for testing
  window.LearningHub = {
    currentFilter,
    showDomain
  };
})();
