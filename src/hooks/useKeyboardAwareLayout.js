import { useEffect } from 'react';
import { isIOS, isNativePlatform, resetKeyboardInset, setKeyboardInset } from '@/lib/native';

const KEYBOARD_THRESHOLD = 120;
const INPUT_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

const isKeyboardTarget = (element) =>
  element instanceof HTMLElement && element.matches(INPUT_SELECTOR);

export function useKeyboardAwareLayout() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = null;
    const viewport = window.visualViewport;

    const syncViewportKeyboard = () => {
      if (!viewport || isNativePlatform()) return;

      const activeElement = document.activeElement;
      const focusedInput = isKeyboardTarget(activeElement);
      const keyboardHeight = focusedInput
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      const keyboardOpen = focusedInput && keyboardHeight > KEYBOARD_THRESHOLD;

      if (keyboardOpen) {
        setKeyboardInset(keyboardHeight, true);
      } else {
        resetKeyboardInset();
      }
    };

    const scheduleSync = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(syncViewportKeyboard);
    };

    const handleFocusIn = (event) => {
      if (!isKeyboardTarget(event.target)) return;

      scheduleSync();
      window.setTimeout(() => {
        event.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, isIOS() ? 250 : 100);
    };

    const handleFocusOut = () => {
      window.setTimeout(scheduleSync, 50);
    };

    viewport?.addEventListener('resize', scheduleSync);
    viewport?.addEventListener('scroll', scheduleSync);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('orientationchange', scheduleSync);

    scheduleSync();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      viewport?.removeEventListener('resize', scheduleSync);
      viewport?.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('orientationchange', scheduleSync);
      resetKeyboardInset();
    };
  }, []);
}
