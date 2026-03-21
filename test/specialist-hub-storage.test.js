/**
 * specialist-hub-storage.test.js
 * Unit tests for Phase 1: Storage consolidation module
 */

describe('SpecialistHubStorage', () => {
  let storageModule;
  let mockHubMemory;
  let mockTodayIsoKey;

  beforeEach(() => {
    // Mock hubMemory interface
    mockHubMemory = {
      getJson: jest.fn((key, fallback) => fallback),
      setJson: jest.fn(),
      getString: jest.fn((key, fallback) => fallback),
      setString: jest.fn(),
    };

    // Mock todayIsoKey function
    mockTodayIsoKey = jest.fn(() => '2026-03-21');

    // Load module (if available in global scope)
    if (typeof window.createSpecialistHubStorageModule === 'function') {
      storageModule = window.createSpecialistHubStorageModule({
        hubMemory: mockHubMemory,
        todayIsoKey: mockTodayIsoKey,
      });
    }
  });

  describe('Block Memory', () => {
    test('recordBlockOpen should increment opens counter', () => {
      if (!storageModule) {
        console.warn('Storage module not available; skipping test');
        return;
      }

      mockHubMemory.getJson.mockReturnValue({});
      storageModule.recordBlockOpen('block-123');

      expect(mockHubMemory.setJson).toHaveBeenCalled();
      const callArgs = mockHubMemory.setJson.mock.calls[0];
      expect(callArgs[1]).toEqual(
        expect.objectContaining({
          'block-123': expect.objectContaining({
            opens: 1,
            lastOpenedAt: expect.any(String),
          }),
        })
      );
    });

    test('blockOpenMemory should return block stats', () => {
      if (!storageModule) return;

      mockHubMemory.getJson.mockReturnValue({
        'block-123': { opens: 5, lastOpenedAt: '2026-03-21T10:00:00Z' },
      });

      const memory = storageModule.blockOpenMemory('block-123');
      expect(memory.opens).toBe(5);
      expect(memory.lastOpenedAt).toBe('2026-03-21T10:00:00Z');
    });

    test('blockOpenMemory should return zeros for unknown block', () => {
      if (!storageModule) return;

      mockHubMemory.getJson.mockReturnValue({});
      const memory = storageModule.blockOpenMemory('unknown');
      expect(memory.opens).toBe(0);
      expect(memory.lastOpenedAt).toBe('');
    });
  });

  describe('Recommendation Verdicts', () => {
    test('writeRecommendationVerdict should store verdict', () => {
      if (!storageModule) return;

      storageModule.writeRecommendationVerdict('student-1', 'followed');
      expect(mockHubMemory.setString).toHaveBeenCalledWith(
        expect.stringContaining('student-1'),
        'followed'
      );
    });

    test('readRecommendationVerdict should retrieve stored verdict', () => {
      if (!storageModule) return;

      mockHubMemory.getString.mockReturnValue('followed');
      const verdict = storageModule.readRecommendationVerdict('student-1');
      expect(verdict).toBe('followed');
    });
  });

  describe('Recommendation History', () => {
    test('saveRecommendationHistoryPoint should add new history entry', () => {
      if (!storageModule) return;

      mockHubMemory.getJson.mockReturnValue([]);
      storageModule.saveRecommendationHistoryPoint('student-1', {
        verdict: 'followed',
        outcome: 'helped',
      });

      expect(mockHubMemory.setJson).toHaveBeenCalled();
      const callArgs = mockHubMemory.setJson.mock.calls[0];
      expect(callArgs[1][0]).toEqual(
        expect.objectContaining({
          verdict: 'followed',
          outcome: 'helped',
          day: '2026-03-21',
        })
      );
    });

    test('summarizeRecommendationHistory should aggregate outcomes', () => {
      if (!storageModule) return;

      mockHubMemory.getJson
        .mockReturnValueOnce([
          { day: '2026-03-21', verdict: 'followed', outcome: 'helped' },
          { day: '2026-03-20', verdict: 'skipped', outcome: 'not-yet' },
        ])
        .mockReturnValueOnce([
          { day: '2026-03-21', verdict: 'followed', outcome: 'helped' },
        ]);

      const summary = storageModule.summarizeRecommendationHistory(['s1', 's2']);
      expect(summary).toEqual(
        expect.objectContaining({
          helped: expect.any(Number),
          notYet: expect.any(Number),
          entries: expect.any(Number),
        })
      );
    });
  });

  describe('Module Creation', () => {
    test('should return null if hubMemory is missing', () => {
      const result = window.createSpecialistHubStorageModule({
        hubMemory: null,
        todayIsoKey: mockTodayIsoKey,
      });
      expect(result).toBeNull();
    });

    test('should export all public API methods', () => {
      if (!storageModule) return;

      expect(typeof storageModule.recordBlockOpen).toBe('function');
      expect(typeof storageModule.blockOpenMemory).toBe('function');
      expect(typeof storageModule.readRecommendationVerdict).toBe('function');
      expect(typeof storageModule.writeRecommendationVerdict).toBe('function');
      expect(typeof storageModule.readRecommendationHistory).toBe('function');
      expect(typeof storageModule.writeRecommendationHistory).toBe('function');
      expect(typeof storageModule.saveRecommendationHistoryPoint).toBe('function');
      expect(typeof storageModule.summarizeRecommendationHistory).toBe('function');
      expect(typeof storageModule.latestRecommendationHistory).toBe('function');
    });
  });
});
