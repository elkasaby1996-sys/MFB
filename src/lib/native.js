import { Capacitor } from '@capacitor/core';

const isNativePlatform = () => Capacitor.isNativePlatform();
const isIOS = () => Capacitor.getPlatform() === 'ios';
const plugins = Capacitor?.Plugins ?? {};
const statusBar = plugins.StatusBar;
const keyboard = plugins.Keyboard;
const splashScreen = plugins.SplashScreen;
const haptics = plugins.Haptics;

export async function setupNativeShell() {
  if (!isNativePlatform()) return;

  document.documentElement.classList.add('native-shell');
  document.documentElement.dataset.platform = Capacitor.getPlatform();

  if (splashScreen?.hide) {
    try {
      await splashScreen.hide();
    } catch {}
  }

  if (statusBar) {
    try {
      await statusBar.setOverlaysWebView?.({ overlay: false });
      await statusBar.setStyle?.({
        style: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT',
      });
      await statusBar.setBackgroundColor?.({ color: '#020617' });
    } catch {}
  }

  if (keyboard) {
    try {
      await keyboard.setResizeMode?.({ mode: 'body' });
      await keyboard.setScroll?.({ isDisabled: false });
      await keyboard.setAccessoryBarVisible?.({ isVisible: true });
    } catch {}
  }

  if (isIOS()) {
    document.body.classList.add('platform-ios');
    document.documentElement.style.setProperty('background-color', '#020617');
    document.body.style.setProperty('background-color', '#020617');
  }
}

export async function syncStatusBarStyle(isDarkMode) {
  if (!isNativePlatform()) return;

  if (statusBar?.setStyle) {
    try {
      await statusBar.setStyle({
        style: isDarkMode ? 'DARK' : 'LIGHT',
      });
    } catch {}
  }
}

async function impact(style = 'LIGHT') {
  try {
    if (isNativePlatform() && haptics?.impact) {
      await haptics.impact({ style });
      return;
    }

    if (navigator.vibrate) navigator.vibrate(10);
  } catch {}
}

export const nativeHaptics = {
  tap: () => impact('LIGHT'),
  success: () => impact('MEDIUM'),
  heavy: () => impact('HEAVY'),
};

export { isIOS, isNativePlatform };
