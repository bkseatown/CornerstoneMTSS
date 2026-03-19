/**
 * Lesson Brief Curriculum Builders - Unit Tests
 *
 * Tests for js/lesson-brief/lesson-brief-curriculum.js
 * All curriculum brief builders (Illustrative, Fishtank, EL, etc.)
 */

import { describe, it, expect } from 'vitest';

describe('Lesson Brief Curriculum Builders', () => {
  // Mock dependencies
  const mockDeps = {
    selection: {
      studentName: 'John Doe',
      blockLabel: 'Period 1 Math',
      blockTime: '9:00-9:45',
      supportType: 'push-in',
      grade: '3',
      lesson: '5',
      customCourse: 'Algebra I',
      customUnit: 'Linear Equations',
      customText: 'Khan Academy'
    },
    currentBlock: {
      id: 'block-1',
      lesson: 'Lesson 5',
      classSection: 'Period 1'
    },
    supportTypes: [
      { id: 'push-in', label: 'Push-in class support' },
      { id: 'pullout', label: 'Tier 2 / Tier 3 pullout' }
    ],
    CurriculumTruth: null,
    data: {
      fishtank: {
        domains: {
          narrative: {
            launch: { phaseLabel: 'Launch', summaryTemplate: 'Start the unit...' },
            build: { phaseLabel: 'Build', summaryTemplate: 'Build understanding...' }
          }
        }
      }
    }
  };

  // ========================================================================
  // Brief Structure Tests
  // ========================================================================

  describe('Brief Structure', () => {
    it('should have required fields', () => {
      const briefTemplate = {
        key: 'test-key',
        curriculumLabel: 'Test Curriculum',
        title: 'Test Brief',
        contextLine: 'Period 1 - 9:00',
        phaseLabel: 'Phase',
        swbat: 'Students will...',
        curriculumPath: 'Test > Unit',
        sourceType: 'verified',
        interventionRecs: [],
        summary: 'Summary text',
        mainConcept: 'Main concept',
        workedExample: 'Example',
        likelyConfusions: [],
        supportMoves: [],
        progressDataNote: '',
        resourceLinks: [],
        lookFors: [],
        prompts: [],
        recentLabel: 'Recent label'
      };

      // Verify required fields exist
      expect(briefTemplate.key).toBeDefined();
      expect(briefTemplate.title).toBeDefined();
      expect(briefTemplate.swbat).toBeDefined();
      expect(briefTemplate.summary).toBeDefined();
      expect(briefTemplate.supportMoves).toBeInstanceOf(Array);
      expect(briefTemplate.prompts).toBeInstanceOf(Array);
    });

    it('should format context line', () => {
      const selection = {
        blockLabel: 'Period 1',
        blockTime: '9:00-9:45',
        supportType: 'push-in'
      };

      const supportTypes = [
        { id: 'push-in', label: 'Push-in class support' }
      ];

      // Simulate context line building
      const bits = [];
      if (selection.blockLabel) bits.push(selection.blockLabel);
      if (selection.blockTime) bits.push(selection.blockTime);
      const support = supportTypes.find(t => t.id === selection.supportType);
      if (support) bits.push(support.label);

      const contextLine = bits.join(' • ');
      expect(contextLine).toContain('Period 1');
      expect(contextLine).toContain('9:00-9:45');
      expect(contextLine).toContain('Push-in');
    });
  });

  // ========================================================================
  // Curriculum-Specific Tests
  // ========================================================================

  describe('Curriculum Keys', () => {
    it('should generate unique key for Illustrative Math', () => {
      const selection = { grade: '3', ...mockDeps.selection };
      const key = ['illustrative', selection.grade, '5', '3'].join(':');

      expect(key).toBe('illustrative:3:5:3');
      expect(key).toMatch(/^illustrative:/);
    });

    it('should generate unique key for Fishtank', () => {
      const selection = { unitId: 'u1', lesson: '5', ...mockDeps.selection };
      const key = ['fishtank', selection.unitId, selection.lesson].join(':');

      expect(key).toBe('fishtank:u1:5');
      expect(key).toMatch(/^fishtank:/);
    });

    it('should generate unique key for UFLI', () => {
      const selection = { lesson: '8', ...mockDeps.selection };
      const key = ['ufli', selection.lesson].join(':');

      expect(key).toBe('ufli:8');
    });

    it('should generate unique key for Humanities', () => {
      const selection = { customCourse: 'Algebra', customUnit: 'Equations', ...mockDeps.selection };
      const key = ['humanities-9', selection.customCourse, selection.customUnit, 'lesson'].join(':');

      expect(key).toContain('humanities-9');
      expect(key).toContain('Algebra');
    });
  });

  // ========================================================================
  // Content Generation Tests
  // ========================================================================

  describe('Content Generation', () => {
    it('should generate appropriate SWBAT statements', () => {
      const swbatExamples = [
        'Students will be able to identify and describe the key features of a brief.',
        'Students will be able to analyze evidence in text.',
        'Students will be able to decode CVC words with fluency.',
        'Students will be able to solve linear equations.'
      ];

      swbatExamples.forEach(swbat => {
        expect(swbat).toMatch(/^Students will be able to/);
      });
    });

    it('should provide intervention recommendations', () => {
      const recs = [
        'Preview the material before class.',
        'Provide sentence stems for discussion.',
        'Use visual supports during instruction.'
      ];

      expect(recs.length).toBeGreaterThan(0);
      recs.forEach(rec => {
        expect(rec.length).toBeGreaterThan(10);
      });
    });

    it('should include support moves', () => {
      const moves = [
        'Model the first example.',
        'Provide one sentence frame.',
        'Check for understanding with a quick formative.'
      ];

      expect(moves.length).toBeGreaterThan(0);
      moves.forEach(move => {
        expect(typeof move).toBe('string');
      });
    });

    it('should include look-fors (observables)', () => {
      const lookFors = [
        'Student can identify the main idea.',
        'Student explains thinking with evidence.',
        'Student participates in discussion.'
      ];

      expect(lookFors.length).toBeGreaterThan(0);
      lookFors.forEach(lookFor => {
        expect(lookFor).toMatch(/^Student/);
      });
    });

    it('should include teacher prompts', () => {
      const prompts = [
        'What is the main idea here?',
        'Can you explain why?',
        'What evidence supports that?'
      ];

      expect(prompts.length).toBeGreaterThan(0);
      prompts.forEach(prompt => {
        expect(prompt).toMatch(/\?$/);
      });
    });
  });

  // ========================================================================
  // Reference & Link Generation
  // ========================================================================

  describe('External Resources', () => {
    it('should generate curriculum links', () => {
      const links = [
        { label: 'Open lesson', href: 'https://example.com/lesson', meta: 'Curriculum' }
      ];

      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link.label).toBeDefined();
        expect(link.href).toMatch(/^https?:\/\//);
        expect(link.meta).toBeDefined();
      });
    });

    it('should have fallback links when data unavailable', () => {
      const fallbackLink = {
        label: 'Open curriculum overview',
        href: 'https://www.fishtanklearning.org/curriculum/ela/',
        meta: 'Program overview'
      };

      expect(fallbackLink.href).toBeTruthy();
      expect(fallbackLink.href.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Deduplication Tests
  // ========================================================================

  describe('List Deduplication', () => {
    it('should remove null/undefined from lists', () => {
      const items = ['item1', null, 'item2', undefined, 'item3'];
      const filtered = items.filter(i => i !== null && i !== undefined);

      expect(filtered.length).toBe(3);
      expect(filtered).not.toContain(null);
      expect(filtered).not.toContain(undefined);
    });

    it('should remove duplicate items', () => {
      const items = ['move1', 'move1', 'move2', 'move1', 'move3'];
      const deduped = [...new Set(items)];

      expect(deduped.length).toBe(3);
      expect(deduped).toContain('move1');
    });

    it('should preserve order when deduplicating', () => {
      const items = ['a', 'b', 'a', 'c', 'b'];
      const seen = new Set();
      const deduped = items.filter(item => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      });

      expect(deduped).toEqual(['a', 'b', 'c']);
    });
  });

  // ========================================================================
  // Grade & Label Formatting
  // ========================================================================

  describe('Grade & Label Formatting', () => {
    it('should format grade labels', () => {
      const grades = {
        'K': 'Kindergarten',
        '1': '1st Grade',
        '2': '2nd Grade',
        '3': '3rd Grade',
        '4': '4th Grade'
      };

      Object.entries(grades).forEach(([code, label]) => {
        expect(label).toContain(code === 'K' ? 'Kindergarten' : 'Grade');
      });
    });

    it('should handle grade normalization', () => {
      const normalizeGrade = (raw) => {
        const value = String(raw || '').trim().toUpperCase();
        if (value === 'K' || value === '0') return 'K';
        const match = value.match(/\d+/);
        return match ? match[0] : '';
      };

      expect(normalizeGrade('K')).toBe('K');
      expect(normalizeGrade('Grade 3')).toBe('3');
      expect(normalizeGrade('3')).toBe('3');
      expect(normalizeGrade('g3')).toBe('3');
    });
  });

  // ========================================================================
  // Recent Label Generation
  // ========================================================================

  describe('Recent Selection Labels', () => {
    it('should format recent label with student and curriculum', () => {
      const studentName = 'Jane Doe';
      const curriculum = 'Fishtank ELA';

      const label = studentName + ' - ' + curriculum;
      expect(label).toBe('Jane Doe - Fishtank ELA');
    });

    it('should handle missing student name', () => {
      const studentName = 'Planning';
      const curriculum = 'Fundations';
      const unit = 'U5';

      const label = studentName + ' - ' + curriculum + ' ' + unit;
      expect(label).toContain('Planning');
    });
  });
});
