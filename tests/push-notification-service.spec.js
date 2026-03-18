/**
 * push-notification-service.spec.js
 *
 * Unit tests for PushNotificationService
 * Validates notification triggers, preferences, and queue handling
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase D: Push Notifications
 */

describe('PushNotificationService', () => {
  let notificationService;

  beforeEach(() => {
    // Mock Notification API
    global.Notification = jest.fn();
    global.Notification.permission = 'granted';

    const PushNotificationService = require('../js/scaling/push-notification-service.js');
    notificationService = new PushNotificationService();
    notificationService.isSupported = true;
  });

  describe('initialization', () => {
    it('should initialize with default preferences', () => {
      expect(notificationService.preferences.urgencyFilter).toBe('HIGH');
      expect(notificationService.preferences.quietHoursStart).toBe(20);
      expect(notificationService.preferences.quietHoursEnd).toBe(8);
    });

    it('should detect Notification API support', () => {
      expect(notificationService.isSupported).toBe(true);
    });

    it('should set enabled flag when permission granted', async () => {
      notificationService.isSupported = true;
      global.Notification.permission = 'granted';

      const result = await notificationService.initialize();

      expect(result).toBe(true);
      expect(notificationService.isEnabled).toBe(true);
    });

    it('should set disabled flag when permission denied', async () => {
      global.Notification.permission = 'denied';

      const result = await notificationService.initialize();

      expect(result).toBe(false);
      expect(notificationService.isEnabled).toBe(false);
    });
  });

  describe('alert sending', () => {
    beforeEach(async () => {
      notificationService.isEnabled = true;
      global.Notification = jest.fn(() => ({
        addEventListener: jest.fn(),
      }));
    });

    it('should send alert for CRITICAL urgency', async () => {
      await notificationService.sendAlert({
        studentId: 'S001',
        studentName: 'Alex',
        urgency: 'CRITICAL',
        action: 'Phonics intensive',
        classId: 'C1',
      });

      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Object)
      );
    });

    it('should respect urgency filter', async () => {
      notificationService.setPreferences({ urgencyFilter: 'CRITICAL' });

      await notificationService.sendAlert({
        studentId: 'S001',
        studentName: 'Alex',
        urgency: 'HIGH',
        action: 'Action',
        classId: 'C1',
      });

      expect(global.Notification).not.toHaveBeenCalled();
    });

    it('should queue notification if outside working hours', async () => {
      // Mock date to be 9 PM (20:00, within quiet hours)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);

      notificationService.setPreferences({ onlyWorkHours: true });

      await notificationService.sendAlert({
        studentId: 'S001',
        studentName: 'Alex',
        urgency: 'HIGH',
        action: 'Action',
        classId: 'C1',
      });

      expect(notificationService.notificationQueue.length).toBe(1);
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('preferences', () => {
    it('should set preferences', () => {
      notificationService.setPreferences({
        urgencyFilter: 'MEDIUM',
        quietHoursStart: 22,
      });

      expect(notificationService.preferences.urgencyFilter).toBe('MEDIUM');
      expect(notificationService.preferences.quietHoursStart).toBe(22);
    });

    it('should get preferences', () => {
      notificationService.setPreferences({ urgencyFilter: 'LOW' });
      const prefs = notificationService.getPreferences();

      expect(prefs.urgencyFilter).toBe('LOW');
    });

    it('should persist preferences to localStorage', () => {
      notificationService.setPreferences({ urgencyFilter: 'CRITICAL' });

      const stored = JSON.parse(
        localStorage.getItem('cornerstone-notification-prefs')
      );
      expect(stored.urgencyFilter).toBe('CRITICAL');
    });
  });

  describe('queue processing', () => {
    it('should process queued notifications', async () => {
      notificationService.isEnabled = true;
      global.Notification = jest.fn(() => ({
        addEventListener: jest.fn(),
      }));

      notificationService.notificationQueue = [
        {
          studentId: 'S001',
          studentName: 'Alex',
          urgency: 'CRITICAL',
          action: 'Action',
          classId: 'C1',
        },
        {
          studentId: 'S002',
          studentName: 'Blake',
          urgency: 'LOW',
          action: 'Action',
          classId: 'C1',
        },
      ];

      notificationService.setPreferences({ urgencyFilter: 'CRITICAL' });

      const sent = await notificationService.processQueue();

      expect(sent).toBe(1); // Only CRITICAL passed filter
      expect(notificationService.notificationQueue.length).toBe(0);
    });

    it('should clear queue after processing', async () => {
      notificationService.isEnabled = true;
      global.Notification = jest.fn(() => ({
        addEventListener: jest.fn(),
      }));

      notificationService.notificationQueue = [
        {
          studentId: 'S001',
          studentName: 'Alex',
          urgency: 'CRITICAL',
          action: 'Action',
          classId: 'C1',
        },
      ];

      await notificationService.processQueue();

      expect(notificationService.notificationQueue.length).toBe(0);
    });
  });

  describe('enable/disable', () => {
    it('should disable notifications', () => {
      notificationService.isEnabled = true;

      notificationService.disable();

      expect(notificationService.isEnabled).toBe(false);
    });

    it('should enable notifications if permission granted', async () => {
      notificationService.isEnabled = false;
      global.Notification.permission = 'granted';

      const result = await notificationService.enable();

      expect(result).toBe(true);
      expect(notificationService.isEnabled).toBe(true);
    });

    it('should fail to enable if permission denied', async () => {
      global.Notification.permission = 'denied';

      const result = await notificationService.enable();

      expect(result).toBe(false);
    });
  });
});
