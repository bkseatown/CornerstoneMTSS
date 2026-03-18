/**
 * load-tester.spec.js
 *
 * Unit tests for LoadTester
 * Validates performance benchmarking and load testing suite
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase D: Load Testing
 */

const LoadTester = require('../js/scaling/load-tester.js');

describe('LoadTester', () => {
  let tester;
  let mockDashboard;
  let mockActionLogger;
  let mockReport;

  beforeEach(() => {
    mockDashboard = {
      recommender: {
        recommendIntervention: jest.fn().mockResolvedValue({
          studentId: 'S001',
          action: 'Action',
          urgency: 2,
        }),
        recommendInterventionBatch: jest.fn().mockResolvedValue([]),
      },
    };

    mockActionLogger = {
      logAction: jest.fn().mockResolvedValue('ACTION_LOG_001'),
    };

    mockReport = {};

    tester = new LoadTester(mockDashboard, mockActionLogger, mockReport);
  });

  describe('single-student latency', () => {
    it('should measure single-student recommendation latency', async () => {
      const result = await tester._testSingleStudentLatency(3);

      expect(result.name).toBe('Single-Student Latency');
      expect(result.iterations).toBe(3);
      expect(result.times.length).toBe(3);
      expect(result.mean).toBeDefined();
      expect(result.median).toBeDefined();
      expect(result.p95).toBeDefined();
      expect(result.p99).toBeDefined();
    });

    it('should compute latency statistics', async () => {
      const result = await tester._testSingleStudentLatency(5);

      expect(result.mean).toBeGreaterThan(0);
      expect(result.min).toBeLessThanOrEqual(result.median);
      expect(result.median).toBeLessThanOrEqual(result.max);
      expect(result.p95).toBeLessThanOrEqual(result.p99);
    });

    it('should pass if mean latency < 1000ms', async () => {
      const result = await tester._testSingleStudentLatency(3);

      expect(result.passed).toBe(true); // Mock should be fast
    });
  });

  describe('batch latency', () => {
    it('should measure batch recommendation latency', async () => {
      const result = await tester._testBatchLatency(50, 2);

      expect(result.name).toContain('Batch Latency');
      expect(result.studentCount).toBe(50);
      expect(result.iterations).toBe(2);
      expect(result.times.length).toBe(2);
    });

    it('should scale results by student count', async () => {
      const result1 = await tester._testBatchLatency(10, 1);
      const result2 = await tester._testBatchLatency(100, 1);

      expect(result1.name).toContain('10');
      expect(result2.name).toContain('100');
    });

    it('should pass if mean latency < 5000ms', async () => {
      const result = await tester._testBatchLatency(50, 2);

      expect(result.passed).toBe(true); // Mock should be fast
    });
  });

  describe('concurrent teacher load', () => {
    it('should measure concurrent teacher performance', async () => {
      const result = await tester._testConcurrentTeachers(20, 5);

      expect(result.name).toContain('Concurrent Teachers');
      expect(result.teacherCount).toBe(5);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.avgTimePerTeacher).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
    });

    it('should compute throughput (teachers/sec)', async () => {
      const result = await tester._testConcurrentTeachers(20, 10);

      expect(result.throughput).toBeGreaterThan(0);
    });
  });

  describe('action logging throughput', () => {
    it('should measure action logging throughput', async () => {
      const result = await tester._testActionLoggingThroughput(50);

      expect(result.name).toBe('Action Logging Throughput');
      expect(result.actionCount).toBe(50);
      expect(result.throughput).toBeGreaterThan(0);
    });

    it('should pass if throughput > 100 actions/sec', async () => {
      const result = await tester._testActionLoggingThroughput(100);

      expect(result.passed).toBe(true); // Mock should be fast
    });

    it('should vary action type in test', async () => {
      await tester._testActionLoggingThroughput(30);

      // Check that logAction was called with different action types
      const calls = mockActionLogger.logAction.mock.calls;
      const actionTypes = calls.map(c => c[0].actionType);
      const uniqueTypes = new Set(actionTypes);

      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });

  describe('full test suite', () => {
    it('should run full suite and return summary', async () => {
      const result = await tester.runFullSuite({
        studentCounts: [10, 50],
        iterations: 2,
        logDetails: false,
      });

      expect(result.timestamp).toBeDefined();
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTests).toBeGreaterThan(0);
    });

    it('should prevent concurrent suite runs', async () => {
      tester.isRunning = true;

      await expect(
        tester.runFullSuite({ studentCounts: [10], iterations: 1 })
      ).rejects.toThrow();
    });

    it('should compute summary statistics', async () => {
      const result = await tester.runFullSuite({
        studentCounts: [10],
        iterations: 1,
        logDetails: false,
      });

      expect(result.summary.totalTests).toBeDefined();
      expect(result.summary.passedTests).toBeDefined();
      expect(result.summary.failedTests).toBeDefined();
      expect(result.summary.allPassed).toBeDefined();
    });

    it('should reset isRunning flag after completion', async () => {
      await tester.runFullSuite({ studentCounts: [10], iterations: 1 });

      expect(tester.isRunning).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should compute mean correctly', () => {
      const mean = tester._mean([10, 20, 30]);

      expect(mean).toBe(20);
    });

    it('should compute median correctly', () => {
      const median = tester._median([10, 20, 30]);

      expect(median).toBe(20);
    });

    it('should compute median for even-length array', () => {
      const median = tester._median([10, 20, 30, 40]);

      expect(median).toBe(25);
    });

    it('should compute percentile correctly', () => {
      const p95 = tester._percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95);

      expect(p95).toBeGreaterThanOrEqual(9);
    });
  });

  describe('result retrieval', () => {
    it('should return test results', async () => {
      await tester.runFullSuite({ studentCounts: [10], iterations: 1 });

      const results = tester.getResults();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
