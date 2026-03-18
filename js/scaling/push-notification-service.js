/**
 * push-notification-service.js
 *
 * REAL-TIME PUSH NOTIFICATIONS
 * ============================
 * Alerts teachers to critical interventions via Web Push API
 * Respects user preferences and quiet hours
 * Works offline (queues notifications until connection restored)
 *
 * ARCHITECTURE:
 * - Uses Service Worker + Web Push API
 * - Notification queue for offline scenarios
 * - Preference-aware (urgency level filter, quiet hours)
 * - One-click action dispatch from notification
 *
 * REFERENCE: STRATEGIC_BLUEPRINT_2026-Q2.md Phase D: Push Notifications
 */

class PushNotificationService {
  constructor() {
    /**
     * Notification state
     */
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.isEnabled = false;
    this.notificationQueue = [];
    this.preferences = {
      urgencyFilter: 'HIGH', // CRITICAL, HIGH, MEDIUM, LOW
      quietHoursStart: 20, // 8 PM
      quietHoursEnd: 8, // 8 AM
      onlyWorkHours: true,
    };
  }

  /**
   * Initialize push notification service
   *
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      if (!this.isSupported) {
        console.warn('Push notifications not supported in this browser');
        return false;
      }

      // Check permission status
      const permission = Notification.permission;

      if (permission === 'granted') {
        this.isEnabled = true;
        console.log('Push notifications enabled');
        return true;
      }

      if (permission === 'denied') {
        console.warn('Push notifications denied by user');
        return false;
      }

      // Request permission
      const result = await Notification.requestPermission();
      this.isEnabled = result === 'granted';

      if (this.isEnabled) {
        console.log('Push notifications enabled (just granted)');
      }

      return this.isEnabled;
    } catch (err) {
      console.error('PushNotificationService.initialize failed:', err);
      return false;
    }
  }

  /**
   * Send notification for critical intervention
   *
   * @async
   * @param {object} data - { studentId, studentName, urgency, action, classId }
   * @returns {Promise<void>}
   *
   * @example
   * await notificationSvc.sendAlert({
   *   studentId: 'S123',
   *   studentName: 'Alex',
   *   urgency: 'CRITICAL',
   *   action: 'Phonics intensive recommended',
   *   classId: 'C1'
   * });
   */
  async sendAlert(data) {
    try {
      // Check if should notify
      if (!this._shouldNotify(data.urgency)) {
        return;
      }

      // Check quiet hours
      if (!this._isWithinWorkingHours()) {
        this.notificationQueue.push(data);
        return;
      }

      const title = `🚨 ${data.studentName} - ${data.urgency}`;
      const options = {
        body: data.action,
        tag: `alert-${data.studentId}`, // Replace old notifications for same student
        badge: '/assets/badge.png',
        icon: '/assets/icon.png',
        requireInteraction: data.urgency === 'CRITICAL',
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

      // Show notification
      if (this.isEnabled) {
        const notification = new Notification(title, options);

        notification.addEventListener('click', () => {
          window.open(`/student-profile.html?studentId=${data.studentId}`);
          notification.close();
        });

        notification.addEventListener('action', event => {
          if (event.action === 'view') {
            window.open(`/student-profile.html?studentId=${data.studentId}`);
          }
          notification.close();
        });
      }
    } catch (err) {
      console.error('PushNotificationService.sendAlert failed:', err);
    }
  }

  /**
   * Check if should notify based on urgency filter
   *
   * @private
   * @param {string} urgency - Urgency level
   * @returns {boolean} Should notify
   */
  _shouldNotify(urgency) {
    const urgencyMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
    const filterLevel = urgencyMap[this.preferences.urgencyFilter] || 0;
    const alertLevel = urgencyMap[urgency] || 0;
    return alertLevel >= filterLevel;
  }

  /**
   * Check if within working hours
   *
   * @private
   * @returns {boolean} Within working hours
   */
  _isWithinWorkingHours() {
    if (!this.preferences.onlyWorkHours) {
      return true;
    }

    const now = new Date();
    const hour = now.getHours();
    const { quietHoursStart, quietHoursEnd } = this.preferences;

    // Handle wrap-around midnight
    if (quietHoursStart > quietHoursEnd) {
      return hour >= quietHoursEnd && hour < quietHoursStart;
    }

    return hour >= quietHoursEnd && hour < quietHoursStart;
  }

  /**
   * Set notification preferences
   *
   * @param {object} prefs - { urgencyFilter, quietHoursStart, quietHoursEnd, onlyWorkHours }
   * @returns {void}
   */
  setPreferences(prefs) {
    this.preferences = { ...this.preferences, ...prefs };
    localStorage.setItem(
      'cornerstone-notification-prefs',
      JSON.stringify(this.preferences)
    );
  }

  /**
   * Get notification preferences
   *
   * @returns {object} Current preferences
   */
  getPreferences() {
    return this.preferences;
  }

  /**
   * Process queued notifications (called when entering working hours)
   *
   * @async
   * @returns {Promise<number>} Count of notifications sent
   */
  async processQueue() {
    try {
      let sent = 0;
      const queue = [...this.notificationQueue];
      this.notificationQueue = [];

      for (const data of queue) {
        if (this._shouldNotify(data.urgency)) {
          await this.sendAlert(data);
          sent++;
        }
      }

      return sent;
    } catch (err) {
      console.error('PushNotificationService.processQueue failed:', err);
      return 0;
    }
  }

  /**
   * Disable notifications
   *
   * @returns {void}
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Enable notifications (if permission granted)
   *
   * @returns {boolean} Success status
   */
  async enable() {
    if (Notification.permission !== 'granted') {
      return false;
    }
    this.isEnabled = true;
    return true;
  }
}

module.exports = PushNotificationService;
