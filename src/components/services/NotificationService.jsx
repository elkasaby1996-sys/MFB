const NOTIFICATION_PREFS_KEY = 'myfinancebro_notification_prefs';

export const NotificationService = {
  /**
   * Get notification preferences
   * @returns {Promise<object>}
   */
  async getPreferences() {
    try {
      const data = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      return data ? JSON.parse(data) : {
        dailyReminder: false,
        weeklyReminder: false,
        dailyReminderTime: '20:00',
        weeklyReminderDay: 0, // Sunday
      };
    } catch (error) {
      console.error('Error reading notification preferences:', error);
      return {
        dailyReminder: false,
        weeklyReminder: false,
        dailyReminderTime: '20:00',
        weeklyReminderDay: 0,
      };
    }
  },

  /**
   * Save notification preferences
   * @param {object} prefs
   * @returns {Promise<void>}
   */
  async savePreferences(prefs) {
    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  },

  /**
   * Request notification permission
   * @returns {Promise<boolean>}
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  /**
   * Check if notifications are supported and permitted
   * @returns {boolean}
   */
  isSupported() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  /**
   * Schedule a test notification
   */
  scheduleTestNotification() {
    if (!this.isSupported()) return;

    new Notification('MyFinanceBro', {
      body: "Don't forget to log today's expenses! 💰",
      icon: '/icon.png',
    });
  },
};