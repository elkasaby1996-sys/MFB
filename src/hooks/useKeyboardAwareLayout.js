import { useEffect } from 'react';
import { isIOS, isNativePlatform, resetKeyboardInset, setKeyboardInset } from '@/lib/native';

const KEYBOARD_THRESHOLD = 120;
const INPUT_SELECTOR = 'input, textarea, select, [contenteditable="true"], [role="textbox"]';
const KEYBOARD_SCROLL_PADDING = 24;

const isKeyboardTarget = (element) =>
  element instanceof HTMLElement && element.matches(INPUT_SELECTOR);

const getScrollableParent = (element) => {
  let current = element?.parentElement;

  while (current && current !== document.body) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }

  return document.scrollingElement || document.documentElement;
};

const ensureVisibleInViewport = (element) => {
  if (!(element instanceof HTMLElement)) return;

  const keyboardOffset = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--keyboard-offset'),
  ) || 0;

  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const rect = element.getBoundingClientRect();
  const visibleBottom = viewportHeight - keyboardOffset - KEYBOARD_SCROLL_PADDING;
  const visibleTop = (window.visualViewport?.offsetTop || 0) + KEYBOARD_SCROLL_PADDING;

  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) {
    return;
  }

  const scrollParent = getScrollableParent(element);
  const delta = rect.bottom > visibleBottom
    ? rect.bottom - visibleBottom
    : rect.top - visibleTop;

  if (scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body) {
    window.scrollBy({ top: delta, behavior: 'smooth' });
    return;
  }

  scrollParent.scrollBy({ top: delta, behavior: 'smooth' });
};

export function useKeyboardAwareLayout() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let frameId = null;
    let focusTimer = null;
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

      if (keyboardOpen && focusedInput) {
        ensureVisibleInViewport(activeElement);
      }
    };

    const scheduleSync = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(syncViewportKeyboard);
    };

    const handleFocusIn = (event) => {
      if (!isKeyboardTarget(event.target)) return;

      document.body.classList.add('input-focused');
      scheduleSync();

      if (focusTimer) window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        ensureVisibleInViewport(event.target);
      }, isIOS() ? 280 : 140);
    };

    const handleFocusOut = () => {
      document.body.classList.remove('input-focused');
      if (focusTimer) window.clearTimeout(focusTimer);
      window.setTimeout(scheduleSync, 60);
    };

    viewport?.addEventListener('resize', scheduleSync);
    viewport?.addEventListener('scroll', scheduleSync);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('orientationchange', scheduleSync);

    scheduleSync();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (focusTimer) window.clearTimeout(focusTimer);
      viewport?.removeEventListener('resize', scheduleSync);
      viewport?.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('orientationchange', scheduleSync);
      document.body.classList.remove('input-focused');
      resetKeyboardInset();
    };
  }, []);
}
