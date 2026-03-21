/**
 * specialist-hub-ui.test.js
 * Unit tests for Phase 7: Rendering and UI layer
 */

describe('SpecialistHubUI', () => {
  let uiModule;
  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');

  beforeEach(() => {
    if (typeof window.createSpecialistHubUIModule === 'function') {
      uiModule = window.createSpecialistHubUIModule({ escapeHtml });
    }
  });

  describe('Domain Progress Rendering', () => {
    test('renderDomainProgressBar should render progress for a domain', () => {
      if (!uiModule) return;

      const html = uiModule.renderDomainProgressBar('math', 75);
      expect(html).toContain('Math');
      expect(html).toContain('75%');
      expect(html).toContain('progress-bar');
    });

    test('renderDomainProgressBar should handle 0% progress', () => {
      if (!uiModule) return;

      const html = uiModule.renderDomainProgressBar('reading', 0);
      expect(html).toContain('0%');
      expect(html).toContain('Reading');
    });

    test('renderDomainProgressBar should cap at 100%', () => {
      if (!uiModule) return;

      const html = uiModule.renderDomainProgressBar('writing', 150);
      expect(html).toContain('100%');
    });

    test('renderStudentDomainProgress should render all 6 domains', () => {
      if (!uiModule) return;

      const student = {
        name: 'Test Student',
        domainProgress: {
          math: 80,
          reading: 75,
          writing: 70,
          speaking: 85,
          listening: 90,
          ef_lb: 65,
        },
      };

      const html = uiModule.renderStudentDomainProgress(student);
      expect(html).toContain('Math');
      expect(html).toContain('Reading');
      expect(html).toContain('Writing');
      expect(html).toContain('Speaking');
      expect(html).toContain('Listening');
      expect(html).toContain('Executive Function');
    });
  });

  describe('Student Card Rendering', () => {
    test('renderStudentCard should display student name', () => {
      if (!uiModule) return;

      const student = { id: 's1', name: 'Alice Johnson' };
      const html = uiModule.renderStudentCard(student);
      expect(html).toContain('Alice Johnson');
    });

    test('renderStudentCard compact mode should omit details', () => {
      if (!uiModule) return;

      const student = {
        id: 's1',
        name: 'Alice',
        tier: 'Tier 2',
        program: 'Just Words',
        notes: 'Sample note',
      };
      const html = uiModule.renderStudentCard(student, { compact: true });
      expect(html).toContain('Alice');
      expect(html).not.toContain('Sample note');
    });

    test('renderStudentCard full mode should include tier and program', () => {
      if (!uiModule) return;

      const student = {
        id: 's1',
        name: 'Bob',
        tier: 'Tier 2',
        program: 'Bridges Math',
      };
      const html = uiModule.renderStudentCard(student, { compact: false });
      expect(html).toContain('Tier 2');
      expect(html).toContain('Bridges Math');
    });
  });

  describe('Caseload List Rendering', () => {
    test('renderCaseloadList should show empty state', () => {
      if (!uiModule) return;

      const html = uiModule.renderCaseloadList([]);
      expect(html).toContain('No students');
    });

    test('renderCaseloadList should display student count', () => {
      if (!uiModule) return;

      const students = [
        { id: 's1', name: 'Student 1' },
        { id: 's2', name: 'Student 2' },
        { id: 's3', name: 'Student 3' },
      ];
      const html = uiModule.renderCaseloadList(students);
      expect(html).toContain('3 students');
      expect(html).toContain('Student 1');
      expect(html).toContain('Student 2');
      expect(html).toContain('Student 3');
    });

    test('renderCaseloadList should respect maxStudents option', () => {
      if (!uiModule) return;

      const students = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        name: `Student ${i}`,
      }));
      const html = uiModule.renderCaseloadList(students, { maxStudents: 5 });
      expect(html).toContain('Student 0');
      expect(html).not.toContain('Student 9');
    });
  });

  describe('Student Report Rendering', () => {
    test('renderStudentReport should include profile and domain progress', () => {
      if (!uiModule) return;

      const student = {
        name: 'Charlie',
        domainProgress: {
          math: 70,
          reading: 65,
          writing: 60,
          speaking: 75,
          listening: 80,
          ef_lb: 68,
        },
        interventions: [{ name: 'Just Words', startDate: 'Jan 15' }],
        goals: [{ description: 'Master CVC words', progress: 65 }],
      };

      const html = uiModule.renderStudentReport(student);
      expect(html).toContain('Charlie');
      expect(html).toContain('Progress Report');
      expect(html).toContain('Just Words');
      expect(html).toContain('Master CVC words');
    });
  });

  describe('Collective Reports', () => {
    test('renderTierDistribution should show tier breakdown', () => {
      if (!uiModule) return;

      const caseload = [
        { id: 's1', tier: 'Tier 1' },
        { id: 's2', tier: 'Tier 2' },
        { id: 's3', tier: 'Tier 2' },
        { id: 's4', tier: 'Tier 3' },
      ];

      const html = uiModule.renderTierDistribution(caseload);
      expect(html).toContain('Tier 1');
      expect(html).toContain('Tier 2');
      expect(html).toContain('Tier 3');
      expect(html).toContain('1');
      expect(html).toContain('2');
    });

    test('renderCaseloadDomainSummary should average domain progress', () => {
      if (!uiModule) return;

      const caseload = [
        {
          id: 's1',
          domainProgress: {
            math: 80,
            reading: 60,
            writing: 70,
            speaking: 80,
            listening: 90,
            ef_lb: 75,
          },
        },
        {
          id: 's2',
          domainProgress: {
            math: 60,
            reading: 80,
            writing: 70,
            speaking: 80,
            listening: 80,
            ef_lb: 75,
          },
        },
      ];

      const html = uiModule.renderCaseloadDomainSummary(caseload);
      expect(html).toContain('Math');
      expect(html).toContain('Reading');
    });
  });

  describe('Lesson Brief Rendering', () => {
    test('renderLessonBrief should display lesson details', () => {
      if (!uiModule) return;

      const lessonData = {
        title: 'Grade 4, Unit 2, Lesson 7',
        curriculum: 'Illustrative Math',
        focus: 'Understanding equivalent fractions',
        swbat: ['Identify equivalent fractions', 'Explain why fractions are equal'],
        teachingPoints: ['All parts must be equal size'],
        supportMoves: ['Use fraction strips'],
      };

      const html = uiModule.renderLessonBrief(lessonData);
      expect(html).toContain('Grade 4, Unit 2, Lesson 7');
      expect(html).toContain('Illustrative Math');
      expect(html).toContain('equivalent fractions');
      expect(html).toContain('SWBAT');
    });
  });

  describe('Block Roster Rendering', () => {
    test('renderBlockRoster should display students in block', () => {
      if (!uiModule) return;

      const students = [
        { id: 's1', name: 'Noah' },
        { id: 's2', name: 'Ava' },
      ];
      const blockInfo = { time: '8:20 Math', teacher: 'Ms. Smith' };

      const html = uiModule.renderBlockRoster(students, blockInfo);
      expect(html).toContain('8:20 Math');
      expect(html).toContain('Ms. Smith');
      expect(html).toContain('Noah');
      expect(html).toContain('Ava');
      expect(html).toContain('2 students');
    });
  });

  describe('Module Creation', () => {
    test('should export SKILL_DOMAINS constant', () => {
      if (!uiModule) return;

      const domains = uiModule.SKILL_DOMAINS;
      expect(domains.math).toBeDefined();
      expect(domains.reading).toBeDefined();
      expect(domains.writing).toBeDefined();
      expect(domains.speaking).toBeDefined();
      expect(domains.listening).toBeDefined();
      expect(domains.ef_lb).toBeDefined();
    });

    test('should export all public rendering functions', () => {
      if (!uiModule) return;

      expect(typeof uiModule.renderCaseloadList).toBe('function');
      expect(typeof uiModule.renderStudentCard).toBe('function');
      expect(typeof uiModule.renderStudentProfile).toBe('function');
      expect(typeof uiModule.renderStudentDomainProgress).toBe('function');
      expect(typeof uiModule.renderDomainProgressBar).toBe('function');
      expect(typeof uiModule.renderStudentReport).toBe('function');
      expect(typeof uiModule.renderCollectiveReportsDashboard).toBe('function');
      expect(typeof uiModule.renderTierDistribution).toBe('function');
      expect(typeof uiModule.renderCaseloadDomainSummary).toBe('function');
      expect(typeof uiModule.renderInterventionSummary).toBe('function');
      expect(typeof uiModule.renderLessonBrief).toBe('function');
      expect(typeof uiModule.renderBlockRoster).toBe('function');
    });
  });
});
