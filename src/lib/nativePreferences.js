import { Capacitor } from '@capacitor/core';

const plugins = Capacitor?.Plugins ?? {};
const preferences = globalThis?.Capacitor?.Plugins?.Preferences ?? plugins.Preferences;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const nativePreferences = {
  async get(key) {
    try {
      if (Capacitor.isNativePlatform() && preferences?.get) {
        const { value } = await preferences.get({ key });
        return value;
      }

      return getStorage()?.getItem(key) ?? null;
    } catch {
      return getStorage()?.getItem(key) ?? null;
    }
  },

  async set(key, value) {
    const normalizedValue = String(value);

    try {
      if (Capacitor.isNativePlatform() && preferences?.set) {
        await preferences.set({ key, value: normalizedValue });
      }
    } finally {
      getStorage()?.setItem(key, normalizedValue);
    }
  },

  async remove(key) {
    try {
      if (Capacitor.isNativePlatform() && preferences?.remove) {
        await preferences.remove({ key });
      }
    } finally {
      getStorage()?.removeItem(key);
    }
  },
};
