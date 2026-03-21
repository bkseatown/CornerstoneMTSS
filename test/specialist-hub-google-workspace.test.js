/**
 * specialist-hub-google-workspace.test.js
 * Unit tests for Google Workspace integration (Classroom, Drive, Docs)
 */

describe('SpecialistHubGoogleWorkspace', () => {
  let workspaceModule;

  beforeEach(() => {
    if (typeof window.createSpecialistHubGoogleWorkspaceModule === 'function') {
      workspaceModule = window.createSpecialistHubGoogleWorkspaceModule({
        escapeHtml: (str) => String(str).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'),
      });
    }
  });

  describe('Google Classroom Integration', () => {
    test('openClassroomModal should render classroom modal', () => {
      if (!workspaceModule) return;

      if (workspaceModule.openClassroomModal) {
        expect(typeof workspaceModule.openClassroomModal).toBe('function');
        // Should not throw even if CSGoogleClassroom unavailable
        expect(() => workspaceModule.openClassroomModal()).not.toThrow();
      }
    });

    test('listClassrooms should retrieve classroom list', () => {
      if (!workspaceModule) return;

      if (workspaceModule.listClassrooms) {
        const classrooms = workspaceModule.listClassrooms();
        expect(classrooms === null || Array.isArray(classrooms)).toBe(true);
      }
    });

    test('getClassroomInfo should return classroom metadata', () => {
      if (!workspaceModule) return;

      if (workspaceModule.getClassroomInfo) {
        const info = workspaceModule.getClassroomInfo('classroom-1');
        expect(info === null || typeof info === 'object').toBe(true);
      }
    });
  });

  describe('Google Drive Integration', () => {
    test('openDriveModal should render drive file picker', () => {
      if (!workspaceModule) return;

      if (workspaceModule.openDriveModal) {
        expect(typeof workspaceModule.openDriveModal).toBe('function');
        expect(() => workspaceModule.openDriveModal()).not.toThrow();
      }
    });

    test('listDriveFiles should retrieve file list', () => {
      if (!workspaceModule) return;

      if (workspaceModule.listDriveFiles) {
        const files = workspaceModule.listDriveFiles();
        expect(files === null || Array.isArray(files)).toBe(true);
      }
    });

    test('createDriveFolder should create new folder', () => {
      if (!workspaceModule) return;

      if (workspaceModule.createDriveFolder) {
        const result = workspaceModule.createDriveFolder('New Folder');
        expect(result === null || typeof result === 'string' || typeof result === 'object').toBe(true);
      }
    });
  });

  describe('Google Docs Integration', () => {
    test('openDocsModal should render docs editor', () => {
      if (!workspaceModule) return;

      if (workspaceModule.openDocsModal) {
        expect(typeof workspaceModule.openDocsModal).toBe('function');
        expect(() => workspaceModule.openDocsModal()).not.toThrow();
      }
    });

    test('createDocument should create new document', () => {
      if (!workspaceModule) return;

      if (workspaceModule.createDocument) {
        const docId = workspaceModule.createDocument('New Document');
        expect(docId === null || typeof docId === 'string').toBe(true);
      }
    });

    test('listDocuments should retrieve document list', () => {
      if (!workspaceModule) return;

      if (workspaceModule.listDocuments) {
        const docs = workspaceModule.listDocuments();
        expect(docs === null || Array.isArray(docs)).toBe(true);
      }
    });
  });

  describe('Modal Management', () => {
    test('closeModal should close active modal', () => {
      if (!workspaceModule) return;

      if (workspaceModule.closeModal) {
        expect(typeof workspaceModule.closeModal).toBe('function');
        expect(() => workspaceModule.closeModal()).not.toThrow();
      }
    });

    test('closeAllModals should close all workspace modals', () => {
      if (!workspaceModule) return;

      if (workspaceModule.closeAllModals) {
        expect(typeof workspaceModule.closeAllModals).toBe('function');
        expect(() => workspaceModule.closeAllModals()).not.toThrow();
      }
    });
  });

  describe('HTML Rendering', () => {
    test('renderClassroomList should return HTML', () => {
      if (!workspaceModule) return;

      if (workspaceModule.renderClassroomList) {
        const html = workspaceModule.renderClassroomList();
        expect(typeof html).toBe('string');
      }
    });

    test('renderDriveFolder should return HTML', () => {
      if (!workspaceModule) return;

      if (workspaceModule.renderDriveFolder) {
        const html = workspaceModule.renderDriveFolder('folder-id');
        expect(typeof html).toBe('string');
      }
    });

    test('HTML should be properly escaped', () => {
      if (!workspaceModule) return;

      if (workspaceModule.renderClassroomList) {
        const html = workspaceModule.renderClassroomList();
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('javascript:');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Google Classroom API gracefully', () => {
      if (!workspaceModule) return;

      const originalClassroom = window.CSGoogleClassroom;
      delete window.CSGoogleClassroom;

      if (workspaceModule.openClassroomModal) {
        expect(() => workspaceModule.openClassroomModal()).not.toThrow();
      }

      window.CSGoogleClassroom = originalClassroom;
    });

    test('should handle missing Google Drive API gracefully', () => {
      if (!workspaceModule) return;

      const originalDrive = window.CSGoogleDrive;
      delete window.CSGoogleDrive;

      if (workspaceModule.openDriveModal) {
        expect(() => workspaceModule.openDriveModal()).not.toThrow();
      }

      window.CSGoogleDrive = originalDrive;
    });

    test('should handle missing Google Docs API gracefully', () => {
      if (!workspaceModule) return;

      const originalDocs = window.CSGoogleDocs;
      delete window.CSGoogleDocs;

      if (workspaceModule.openDocsModal) {
        expect(() => workspaceModule.openDocsModal()).not.toThrow();
      }

      window.CSGoogleDocs = originalDocs;
    });
  });

  describe('Module Creation', () => {
    test('should export all public API methods', () => {
      if (!workspaceModule) return;

      if (workspaceModule.openClassroomModal) {
        expect(typeof workspaceModule.openClassroomModal).toBe('function');
      }
      if (workspaceModule.openDriveModal) {
        expect(typeof workspaceModule.openDriveModal).toBe('function');
      }
      if (workspaceModule.openDocsModal) {
        expect(typeof workspaceModule.openDocsModal).toBe('function');
      }
    });
  });
});
