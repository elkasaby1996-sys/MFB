import { Capacitor } from '@capacitor/core';

const isNativePlatform = () => Capacitor.isNativePlatform();
const isIOS = () => Capacitor.getPlatform() === 'ios';
const plugins = Capacitor?.Plugins ?? {};
const statusBar = plugins.StatusBar;
const keyboard = globalThis?.Capacitor?.Plugins?.Keyboard ?? plugins.Keyboard;
const splashScreen = plugins.SplashScreen;
const haptics = plugins.Haptics;

let keyboardListenersAttached = false;

const getSafeBottomInset = () => {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
  return Number.parseFloat(raw) || 0;
};

export function setKeyboardInset(height = 0, isOpen = false) {
  if (typeof document === 'undefined') return;

  const normalizedHeight = Math.max(0, Math.round(height));
  const keyboardOffset = Math.max(0, normalizedHeight - getSafeBottomInset());

  document.documentElement.style.setProperty('--keyboard-height', `${normalizedHeight}px`);
  document.documentElement.style.setProperty('--keyboard-offset', `${keyboardOffset}px`);
  document.body.classList.toggle('keyboard-open', isOpen && normalizedHeight > 0);
}

export function resetKeyboardInset() {
  setKeyboardInset(0, false);
}

function attachKeyboardListeners() {
  if (!keyboard || keyboardListenersAttached || !isNativePlatform() || !isIOS()) return;

  keyboardListenersAttached = true;

  keyboard.addListener?.('keyboardWillShow', ({ keyboardHeight }) => {
    setKeyboardInset(keyboardHeight, true);
  });
  keyboard.addListener?.('keyboardDidShow', ({ keyboardHeight }) => {
    setKeyboardInset(keyboardHeight, true);
  });
  keyboard.addListener?.('keyboardWillHide', () => {
    resetKeyboardInset();
  });
  keyboard.addListener?.('keyboardDidHide', () => {
    resetKeyboardInset();
  });
}

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
      attachKeyboardListeners();
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
