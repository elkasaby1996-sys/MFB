import { nativePreferences } from '@/lib/nativePreferences';

const ONBOARDING_KEY = 'myfinancebro_onboarding_completed';

export const OnboardingService = {
  /**
   * Check if onboarding has been completed
   * @returns {Promise<boolean>}
   */
  async getCompleted() {
    try {
      const value = await nativePreferences.get(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading onboarding status:', error);
      return false;
    }
  },

  /**
   * Set onboarding completion status
   * @param {boolean} value
   * @returns {Promise<void>}
   */
  async setCompleted(value) {
    try {
      await nativePreferences.set(ONBOARDING_KEY, value.toString());
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  /**
   * Reset onboarding (for testing or user request)
   * @returns {Promise<void>}
   */
  async reset() {
    try {
      await nativePreferences.remove(ONBOARDING_KEY);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },
};
