/**
 * Lesson Brief State Management - Unit Tests
 *
 * Tests for js/lesson-brief/lesson-brief-state.js
 * Selection persistence, context tracking, storage operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as state from '../js/lesson-brief/lesson-brief-state.js';

describe('Lesson Brief State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ========================================================================
  // Selection Management
  // ========================================================================

  describe('Selection Persistence', () => {
    it('should load default selection when storage is empty', () => {
      const selection = state.loadSelection();
      expect(selection).toBeDefined();
      expect(selection.blockId).toBe('');
      expect(selection.programId).toBe('');
      expect(selection.area).toBe('ela');
    });

    it('should save selection to localStorage', () => {
      const selection = state.getSelection();
      state.updateSelection({ blockId: 'block-123', programId: 'fishtank-ela' });
      state.saveSelection();

      const stored = JSON.parse(localStorage.getItem('cs.lessonBrief.selection.v2'));
      expect(stored.blockId).toBe('block-123');
      expect(stored.programId).toBe('fishtank-ela');
    });

    it('should preserve selection across load/save cycles', () => {
      state.updateSelection({ blockId: 'b1', grade: '3', area: 'math' });
      state.saveSelection();

      const reloaded = state.loadSelection();
      expect(reloaded.blockId).toBe('b1');
      expect(reloaded.grade).toBe('3');
      expect(reloaded.area).toBe('math');
    });

    it('should merge partial updates', () => {
      state.updateSelection({ blockId: 'b1' });
      state.updateSelection({ grade: '2' });

      const selection = state.getSelection();
      expect(selection.blockId).toBe('b1');
      expect(selection.grade).toBe('2');
    });

    it('should clear selection to defaults', () => {
      state.updateSelection({ blockId: 'b1', programId: 'fishtank-ela' });
      state.clearSelection();

      const selection = state.getSelection();
      expect(selection.blockId).toBe('');
      expect(selection.programId).toBe('');
    });
  });

  // ========================================================================
  // Context Management
  // ========================================================================

  describe('Context Tracking', () => {
    it('should get and set context', () => {
      const context = {
        caseload: [{ id: 's1', name: 'Alice' }],
        studentId: 's1',
        grade: '2'
      };

      state.setContext(context);
      const retrieved = state.getContext();

      expect(retrieved.caseload.length).toBe(1);
      expect(retrieved.studentId).toBe('s1');
      expect(retrieved.grade).toBe('2');
    });

    it('should set student', () => {
      state.setStudent('student-123', 'John Doe');
      const context = state.getContext();

      expect(context.studentId).toBe('student-123');
    });

    it('should set caseload', () => {
      const students = [
        { id: 's1', name: 'Alice' },
        { id: 's2', name: 'Bob' }
      ];

      state.setCaseload(students);
      const context = state.getContext();

      expect(context.caseload.length).toBe(2);
    });

    it('should set roster', () => {
      const students = [{ id: 's1', name: 'Alice' }];
      state.setRoster(students);
      const context = state.getContext();

      expect(context.roster.length).toBe(1);
    });

    it('should handle invalid context gracefully', () => {
      state.setContext(null);
      state.setContext(undefined);
      state.setContext('invalid');

      const context = state.getContext();
      expect(context).toBeDefined();
      expect(typeof context).toBe('object');
    });
  });

  // ========================================================================
  // Google Integration State
  // ========================================================================

  describe('Google Integration State', () => {
    it('should track Google state', () => {
      state.setGoogleStatus('Connected');
      state.setGoogleBusy(true);
      state.setGoogleDriveResults([{ id: 'f1', name: 'File 1' }]);

      const googleState = state.getGoogleState();
      expect(googleState.status).toBe('Connected');
      expect(googleState.busy).toBe(true);
      expect(googleState.driveResults.length).toBe(1);
    });

    it('should set last created file', () => {
      const file = { id: 'file-1', name: 'My Doc', url: 'https://...' };
      state.setLastCreatedFile(file);

      const googleState = state.getGoogleState();
      expect(googleState.lastCreated.id).toBe('file-1');
    });

    it('should clear Google state', () => {
      state.setGoogleStatus('Connected');
      state.setGoogleBusy(true);
      state.clearGoogleState();

      const googleState = state.getGoogleState();
      expect(googleState.status).toBe('');
      expect(googleState.busy).toBe(false);
      expect(googleState.driveResults.length).toBe(0);
    });
  });

  // ========================================================================
  // Curriculum Data
  // ========================================================================

  describe('Curriculum Data Management', () => {
    it('should get and set curriculum data', () => {
      const data = { fishtank: { units: [] }, curricula: [] };
      state.setData(data);

      const retrieved = state.getData();
      expect(retrieved.fishtank).toBeDefined();
    });

    it('should manage Fishtank units', () => {
      const units = [{ id: 'u1', title: 'Unit 1' }];
      state.setFishtankUnits(units);

      const retrieved = state.getFishtankUnits();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('u1');
    });

    it('should manage curriculum metadata', () => {
      const meta = { 'fishtank-ela': { label: 'Fishtank ELA' } };
      state.setCurriculumMeta(meta);

      const retrieved = state.getCurriculumMeta();
      expect(retrieved['fishtank-ela']).toBeDefined();
    });
  });

  // ========================================================================
  // Storage Utilities
  // ========================================================================

  describe('Storage Utilities', () => {
    it('should safely parse JSON', () => {
      const obj = { name: 'test', value: 123 };
      const json = JSON.stringify(obj);

      const parsed = state.safeJsonParse(json);
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(123);
    });

    it('should return fallback on JSON parse error', () => {
      const result = state.safeJsonParse('invalid json', { default: true });
      expect(result.default).toBe(true);
    });

    it('should read from storage', () => {
      localStorage.setItem('test-key', JSON.stringify({ data: 'value' }));

      const result = state.readStorage('test-key');
      expect(result.data).toBe('value');
    });

    it('should return fallback when storage key missing', () => {
      const result = state.readStorage('nonexistent', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should write to storage', () => {
      state.writeStorage('test-write', { key: 'value' });

      const retrieved = JSON.parse(localStorage.getItem('test-write'));
      expect(retrieved.key).toBe('value');
    });

    it('should handle storage write errors gracefully', () => {
      // Simulate storage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage full');
      };

      expect(() => {
        state.writeStorage('test', { data: 'value' });
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  // ========================================================================
  // Selection Merging
  // ========================================================================

  describe('Selection Merging', () => {
    it('should merge selection with defaults', () => {
      const base = { blockId: 'b1', programId: 'fishtank-ela' };
      const patch = { grade: '3' };

      const merged = state.mergeSelection(base, patch);
      expect(merged.blockId).toBe('b1');
      expect(merged.grade).toBe('3');
      expect(merged.area).toBe('ela'); // Default preserved
    });

    it('should override with patch values', () => {
      const base = { blockId: 'b1', area: 'ela' };
      const patch = { area: 'math' };

      const merged = state.mergeSelection(base, patch);
      expect(merged.area).toBe('math');
    });

    it('should handle null patches', () => {
      const base = { blockId: 'b1' };
      const merged = state.mergeSelection(base, null);

      expect(merged.blockId).toBe('b1');
    });
  });
});
