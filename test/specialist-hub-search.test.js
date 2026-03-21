/**
 * specialist-hub-search.test.js
 * Unit tests for Phase 6: Search and filtering module
 */

describe('SpecialistHubSearch', () => {
  let searchModule;
  const mockTeacherSearchService = {
    create: jest.fn((config) => ({
      search: jest.fn((query) => {
        // Simple mock: filter by name
        return (config.students || []).filter(
          (s) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.id.includes(query)
        );
      }),
    })),
  };

  const mockHubMemory = {
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window.createSpecialistHubSearchModule === 'function') {
      searchModule = window.createSpecialistHubSearchModule({
        TeacherSearchService: mockTeacherSearchService,
        hubMemory: mockHubMemory,
      });
    }
  });

  describe('Search Execution', () => {
    test('buildSearchResults should filter caseload by query', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Noah K.', firstName: 'Noah', lastName: 'K.' },
        { id: 's2', name: 'Ava M.', firstName: 'Ava', lastName: 'M.' },
        { id: 's3', name: 'Maya R.', firstName: 'Maya', lastName: 'R.' },
      ];

      const results = searchModule.buildSearchResults('Noah', caseload);
      expect(results.count).toBe(1);
      expect(results.results[0].name).toBe('Noah K.');
      expect(results.query).toBe('Noah');
    });

    test('buildSearchResults should return full caseload with empty query', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Student 1' },
        { id: 's2', name: 'Student 2' },
      ];

      const results = searchModule.buildSearchResults('', caseload);
      expect(results.count).toBe(2);
    });

    test('buildSearchResults should apply tier filter', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Noah', tier: 'Tier 2' },
        { id: 's2', name: 'Ava', tier: 'Tier 1' },
        { id: 's3', name: 'Maya', tier: 'Tier 2' },
      ];

      const results = searchModule.buildSearchResults('', caseload, {
        tier: 'Tier 2',
      });
      expect(results.count).toBe(2);
    });

    test('buildSearchResults should apply program filter', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Noah', program: 'Just Words' },
        { id: 's2', name: 'Ava', program: 'Bridges Math' },
        { id: 's3', name: 'Maya', program: 'Just Words' },
      ];

      const results = searchModule.buildSearchResults('', caseload, {
        program: 'Just Words',
      });
      expect(results.count).toBe(2);
    });

    test('buildSearchResults should apply needsType filter', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Noah', needsType: 'Reading' },
        { id: 's2', name: 'Ava', needsType: 'Math' },
        { id: 's3', name: 'Maya', needsType: 'Reading' },
      ];

      const results = searchModule.buildSearchResults('', caseload, {
        needsType: 'Reading',
      });
      expect(results.count).toBe(2);
    });

    test('buildSearchResults should combine multiple filters', () => {
      if (!searchModule) return;

      const caseload = [
        { id: 's1', name: 'Noah', tier: 'Tier 2', program: 'Just Words' },
        { id: 's2', name: 'Ava', tier: 'Tier 2', program: 'Bridges' },
        { id: 's3', name: 'Maya', tier: 'Tier 1', program: 'Just Words' },
      ];

      const results = searchModule.buildSearchResults('', caseload, {
        tier: 'Tier 2',
        program: 'Just Words',
      });
      expect(results.count).toBe(1);
      expect(results.results[0].name).toBe('Noah');
    });
  });

  describe('Rendering', () => {
    test('renderSearchInput should return input HTML', () => {
      if (!searchModule) return;

      const html = searchModule.renderSearchInput();
      expect(html).toContain('input');
      expect(html).toContain('hub-search-input');
      expect(html).toContain('placeholder');
    });

    test('renderSearchResults should show student list', () => {
      if (!searchModule) return;

      const results = [
        { id: 's1', name: 'Noah K.' },
        { id: 's2', name: 'Ava M.' },
      ];
      const html = searchModule.renderSearchResults(results);
      expect(html).toContain('Found 2 students');
      expect(html).toContain('Noah K.');
      expect(html).toContain('Ava M.');
    });

    test('renderSearchResults should show empty state', () => {
      if (!searchModule) return;

      const html = searchModule.renderSearchResults([]);
      expect(html).toContain('No students match');
    });

    test('renderFilterUI should show filter dropdowns', () => {
      if (!searchModule) return;

      const html = searchModule.renderFilterUI();
      expect(html).toContain('Tier');
      expect(html).toContain('Program');
      expect(html).toContain('Need Type');
      expect(html).toContain('select');
    });
  });

  describe('State Persistence', () => {
    test('saveSearchState should persist search', () => {
      if (!searchModule) return;

      searchModule.saveSearchState('Noah', { tier: 'Tier 2' }, [
        { id: 's1' },
      ]);
      expect(mockHubMemory.setJson).toHaveBeenCalledWith(
        'cs.hub.search.state',
        expect.objectContaining({
          query: 'Noah',
          filters: { tier: 'Tier 2' },
          resultCount: 1,
        })
      );
    });

    test('clearSearch should clear saved state', () => {
      if (!searchModule) return;

      searchModule.clearSearch();
      expect(mockHubMemory.setJson).toHaveBeenCalledWith(
        'cs.hub.search.state',
        null
      );
    });
  });

  describe('Filter Options', () => {
    test('getFilterOptions should return available options', () => {
      if (!searchModule) return;

      const options = searchModule.getFilterOptions();
      expect(Array.isArray(options.tiers)).toBe(true);
      expect(Array.isArray(options.programs)).toBe(true);
      expect(Array.isArray(options.statuses)).toBe(true);
      expect(Array.isArray(options.needsTypes)).toBe(true);
    });
  });

  describe('Module Creation', () => {
    test('should return null if TeacherSearchService is missing', () => {
      const result = window.createSpecialistHubSearchModule({
        TeacherSearchService: null,
        hubMemory: mockHubMemory,
      });
      expect(result).toBeNull();
    });

    test('should export all public API methods', () => {
      if (!searchModule) return;

      expect(typeof searchModule.buildSearchResults).toBe('function');
      expect(typeof searchModule.getLastSearchResults).toBe('function');
      expect(typeof searchModule.renderSearchInput).toBe('function');
      expect(typeof searchModule.renderSearchResults).toBe('function');
      expect(typeof searchModule.renderFilterUI).toBe('function');
      expect(typeof searchModule.getFilterOptions).toBe('function');
      expect(typeof searchModule.saveSearchState).toBe('function');
      expect(typeof searchModule.loadSearchState).toBe('function');
      expect(typeof searchModule.clearSearch).toBe('function');
    });
  });
});
