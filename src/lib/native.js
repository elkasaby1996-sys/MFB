import { Capacitor } from '@capacitor/core';

const isNativePlatform = () => Capacitor.isNativePlatform();
const isIOS = () => Capacitor.getPlatform() === 'ios';

export async function setupNativeShell() {}

export async function syncStatusBarStyle() {}

async function impact() {
  try {
    if (!isIOS() && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {}
}

export const nativeHaptics = {
  tap: () => impact(),
  success: () => impact(),
  heavy: () => impact(),
};

export { isIOS, isNativePlatform };
