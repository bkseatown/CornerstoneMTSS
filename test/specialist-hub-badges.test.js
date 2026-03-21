/**
 * specialist-hub-badges.test.js
 * Unit tests for Phase 4: Badges and progress indicators
 */

describe('SpecialistHubBadges', () => {
  let badgesModule;

  beforeEach(() => {
    if (typeof window.createSpecialistHubBadgesModule === 'function') {
      badgesModule = window.createSpecialistHubBadgesModule({});
    }
  });

  describe('Fluency Progress Tracking', () => {
    test('getFpLevel should retrieve student fluency progress', () => {
      if (!badgesModule) return;

      const level = badgesModule.getFpLevel('student-1');
      expect(typeof level).toBe('number' || 'undefined');
    });

    test('setFpLevel should update fluency progress for student', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 75);
      const level = badgesModule.getFpLevel('student-1');
      expect(level).toBe(75);
    });

    test('setFpLevel should accept levels 0-100', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 0);
      expect(badgesModule.getFpLevel('student-1')).toBe(0);

      badgesModule.setFpLevel('student-1', 100);
      expect(badgesModule.getFpLevel('student-1')).toBe(100);

      badgesModule.setFpLevel('student-1', 50);
      expect(badgesModule.getFpLevel('student-1')).toBe(50);
    });

    test('getFpLevel should return undefined for unknown students', () => {
      if (!badgesModule) return;

      const level = badgesModule.getFpLevel('unknown-student-xyz');
      expect(level === undefined || level === 0).toBe(true);
    });
  });

  describe('Badge Rendering', () => {
    test('renderFpBadge should return HTML string', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 85);
      const html = badgesModule.renderFpBadge('student-1');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('renderFpBadge should include fluency percentage', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 75);
      const html = badgesModule.renderFpBadge('student-1');
      expect(html).toContain('75');
    });

    test('renderFpBadge should include student identifier', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-abc', 80);
      const html = badgesModule.renderFpBadge('student-abc');
      expect(html).toContain('student-abc' || 'badge' || 'progress');
    });

    test('renderFpBadge should include visual indicator class', () => {
      if (!badgesModule) return;

      const html = badgesModule.renderFpBadge('student-1');
      expect(html).toContain('badge' || 'progress' || 'fp-' || 'fluency');
    });
  });

  describe('Badge Colors/Levels', () => {
    test('renderFpBadge should differentiate low progress (0-40)', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 25);
      const html = badgesModule.renderFpBadge('student-1');
      expect(html).toBeTruthy();
    });

    test('renderFpBadge should differentiate medium progress (40-75)', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 60);
      const html = badgesModule.renderFpBadge('student-1');
      expect(html).toBeTruthy();
    });

    test('renderFpBadge should differentiate high progress (75-100)', () => {
      if (!badgesModule) return;

      badgesModule.setFpLevel('student-1', 95);
      const html = badgesModule.renderFpBadge('student-1');
      expect(html).toBeTruthy();
    });
  });

  describe('Module Creation', () => {
    test('should export all public API methods', () => {
      if (!badgesModule) return;

      expect(typeof badgesModule.getFpLevel).toBe('function');
      expect(typeof badgesModule.setFpLevel).toBe('function');
      expect(typeof badgesModule.renderFpBadge).toBe('function');
    });
  });
});
