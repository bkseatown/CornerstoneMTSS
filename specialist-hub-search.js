/**
 * specialist-hub-search.js — Search, Filtering, and Caseload Discovery
 *
 * Responsibility surface:
 * - Build and maintain searchable index of student caseload
 * - Filter students by multiple criteria (performance, tier, needs, program)
 * - Support keyword search across student attributes
 * - Provide ranked results for teacher quick-access workflows
 *
 * Extracted from specialist-hub.js (~200 lines)
 * Uses existing TeacherSearchService from window for core search logic
 */

function createSpecialistHubSearchModule(deps) {
  "use strict";

  var TeacherSearchService = deps.TeacherSearchService;
  var hubMemory = deps.hubMemory;

  if (!TeacherSearchService) {
    console.warn("[SpecialistHubSearch] Missing TeacherSearchService. Search disabled.");
    return null;
  }

  /* ── Search Index Management ────────────────────────────────────── */

  var searchService = null;
  var lastSearchQuery = "";
  var lastSearchResults = [];

  /**
   * Initialize search service with caseload
   */
  function ensureSearchService(caseload) {
    if (searchService) return searchService;

    searchService = TeacherSearchService.create({
      students: caseload || [],
      indexFields: ["id", "name", "firstName", "lastName", "notes"]
    });

    return searchService;
  }

  /**
   * Build search results from query and filters
   */
  function buildSearchResults(query, caseload, filterOptions) {
    var service = ensureSearchService(caseload);
    if (!service) return { results: [], query: query, count: 0 };

    var filters = filterOptions || {};
    var results = [];

    try {
      // Perform text search if query provided
      if (query && query.trim().length > 0) {
        results = service.search(query.trim()) || [];
      } else {
        // Return full caseload if no query
        results = (caseload || []).slice();
      }

      // Apply additional filters
      if (filters.tier) {
        results = results.filter(function (student) {
          return student && student.tier === filters.tier;
        });
      }

      if (filters.program) {
        results = results.filter(function (student) {
          return student && student.program === filters.program;
        });
      }

      if (filters.status) {
        results = results.filter(function (student) {
          return student && student.status === filters.status;
        });
      }

      if (filters.needsType) {
        results = results.filter(function (student) {
          return student && student.needsType === filters.needsType;
        });
      }

      lastSearchQuery = query;
      lastSearchResults = results;

      return {
        results: results,
        query: query,
        count: results.length,
        filters: filters
      };
    } catch (e) {
      console.error("[SpecialistHubSearch] Search error:", e);
      return { results: [], query: query, count: 0, error: true };
    }
  }

  /**
   * Get last search results (avoid re-searching if query unchanged)
   */
  function getLastSearchResults() {
    return {
      results: lastSearchResults,
      query: lastSearchQuery,
      count: lastSearchResults.length
    };
  }

  /**
   * Render search input box
   */
  function renderSearchInput(placeholderText) {
    var placeholder = placeholderText || "Search students by name, ID, or notes...";
    var html = "<div class=\"hub-search-container\">";
    html += "<input";
    html += " type=\"text\"";
    html += " class=\"hub-search-input\"";
    html += " id=\"hub-search-box\"";
    html += " placeholder=\"" + placeholder + "\"";
    html += " data-role=\"hub-search-input\"";
    html += " />";
    html += "<div class=\"hub-search-icon\">🔍</div>";
    html += "</div>";
    return html;
  }

  /**
   * Render search results list
   */
  function renderSearchResults(results, options) {
    var opts = options || {};
    var showCount = opts.showCount !== false;
    var maxResults = opts.maxResults || 50;
    var itemRenderer = opts.itemRenderer || defaultResultItemRenderer;

    var html = "<div class=\"hub-search-results\">";

    if (showCount) {
      html += "<div class=\"hub-search-count\">";
      html += "Found " + results.length + " student" + (results.length !== 1 ? "s" : "");
      html += "</div>";
    }

    if (results.length === 0) {
      html += "<div class=\"hub-search-empty\">No students match your search.</div>";
    } else {
      html += "<ul class=\"hub-search-list\">";
      for (var i = 0; i < Math.min(results.length, maxResults); i++) {
        html += "<li class=\"hub-search-item\" data-student-id=\"" + (results[i].id || "") + "\">";
        html += itemRenderer(results[i]);
        html += "</li>";
      }
      html += "</ul>";

      if (results.length > maxResults) {
        html += "<div class=\"hub-search-more\">";
        html += "Showing " + maxResults + " of " + results.length + " results";
        html += "</div>";
      }
    }

    html += "</div>";
    return html;
  }

  /**
   * Default renderer for individual search result items
   */
  function defaultResultItemRenderer(student) {
    var html = "<div class=\"hub-search-item-content\">";
    html += "<div class=\"hub-search-item-name\">" + (student.name || student.firstName + " " + student.lastName || "Unknown") + "</div>";
    if (student.notes) {
      html += "<div class=\"hub-search-item-notes\">" + (student.notes || "").substring(0, 60) + "</div>";
    }
    html += "</div>";
    return html;
  }

  /**
   * Get filter options for dropdown
   */
  function getFilterOptions() {
    return {
      tiers: ["Tier 1", "Tier 2", "Tier 3"],
      programs: [
        "General Education",
        "Fundations",
        "Just Words",
        "Wilson Reading System",
        "REWARDS ELA",
        "Bridges Math",
        "Step Up to Writing"
      ],
      statuses: ["Active", "On Hold", "Completed"],
      needsTypes: [
        "Reading",
        "Math",
        "Writing",
        "Behavior",
        "Speech/Language",
        "Social-Emotional"
      ]
    };
  }

  /**
   * Render filter dropdown UI
   */
  function renderFilterUI(filterOptions) {
    var options = filterOptions || getFilterOptions();
    var html = "<div class=\"hub-filter-controls\">";

    // Tier filter
    html += "<div class=\"hub-filter-group\">";
    html += "<label class=\"hub-filter-label\">Tier:</label>";
    html += "<select class=\"hub-filter-select\" data-filter=\"tier\">";
    html += "<option value=\"\">All Tiers</option>";
    for (var i = 0; i < options.tiers.length; i++) {
      html += "<option value=\"" + options.tiers[i] + "\">" + options.tiers[i] + "</option>";
    }
    html += "</select>";
    html += "</div>";

    // Program filter
    html += "<div class=\"hub-filter-group\">";
    html += "<label class=\"hub-filter-label\">Program:</label>";
    html += "<select class=\"hub-filter-select\" data-filter=\"program\">";
    html += "<option value=\"\">All Programs</option>";
    for (var i = 0; i < options.programs.length; i++) {
      html += "<option value=\"" + options.programs[i] + "\">" + options.programs[i] + "</option>";
    }
    html += "</select>";
    html += "</div>";

    // Needs type filter
    html += "<div class=\"hub-filter-group\">";
    html += "<label class=\"hub-filter-label\">Need Type:</label>";
    html += "<select class=\"hub-filter-select\" data-filter=\"needsType\">";
    html += "<option value=\"\">All Needs</option>";
    for (var i = 0; i < options.needsTypes.length; i++) {
      html += "<option value=\"" + options.needsTypes[i] + "\">" + options.needsTypes[i] + "</option>";
    }
    html += "</select>";
    html += "</div>";

    html += "</div>";
    return html;
  }

  /**
   * Persist search state to memory
   */
  function saveSearchState(query, filters, results) {
    if (!hubMemory) return;
    hubMemory.setJson("cs.hub.search.state", {
      query: query,
      filters: filters,
      resultCount: (results || []).length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Restore search state from memory
   */
  function loadSearchState() {
    if (!hubMemory) return null;
    return hubMemory.getJson("cs.hub.search.state", null);
  }

  /**
   * Clear search and restore full caseload
   */
  function clearSearch() {
    lastSearchQuery = "";
    lastSearchResults = [];
    if (hubMemory) {
      hubMemory.setJson("cs.hub.search.state", null);
    }
  }

  /* ── Public API ────────────────────────────────────────────────── */

  return {
    // Search execution
    buildSearchResults: buildSearchResults,
    getLastSearchResults: getLastSearchResults,
    ensureSearchService: ensureSearchService,

    // Rendering
    renderSearchInput: renderSearchInput,
    renderSearchResults: renderSearchResults,
    renderFilterUI: renderFilterUI,

    // Filter options
    getFilterOptions: getFilterOptions,

    // State management
    saveSearchState: saveSearchState,
    loadSearchState: loadSearchState,
    clearSearch: clearSearch
  };
}

// Wire to global scope for specialist-hub.js
if (typeof window !== "undefined") {
  window.createSpecialistHubSearchModule = createSpecialistHubSearchModule;
}
