const APPEARANCE_PREFS_KEY = 'myfinancebro_appearance_prefs';

export const AppearanceService = {
  /**
   * Get appearance preferences
   * @returns {Promise<object>}
   */
  async getPreferences() {
    try {
      const data = localStorage.getItem(APPEARANCE_PREFS_KEY);
      return data ? JSON.parse(data) : {
        theme: 'system', // system, light, dark
        currencyDisplay: 'symbol', // symbol, code
      };
    } catch (error) {
      console.error('Error reading appearance preferences:', error);
      return {
        theme: 'system',
        currencyDisplay: 'symbol',
      };
    }
  },

  /**
   * Save appearance preferences
   * @param {object} prefs
   * @returns {Promise<void>}
   */
  async savePreferences(prefs) {
    try {
      localStorage.setItem(APPEARANCE_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving appearance preferences:', error);
    }
  },

  /**
   * Apply theme to document
   * @param {string} theme - 'system', 'light', 'dark'
   */
  applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  },
};