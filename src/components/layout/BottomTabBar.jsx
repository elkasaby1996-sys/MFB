import React from 'react';
import { cn } from '@/lib/utils';

export function BottomTabBar({ children, compact = false, className }) {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const duration = '280ms';

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn('bottom-tab-bar fixed inset-x-0 z-50 px-safe', className)}
      style={{ bottom: 'max(10px, calc(var(--safe-bottom) + 6px))' }}
      data-compact={compact ? 'true' : 'false'}
    >
      <div
        className="bottom-tab-bar__surface"
        style={{
          margin: compact ? '0 var(--space-5)' : '0 var(--space-4)',
          transition: `margin ${duration} ${ease}, transform ${duration} ${ease}`,
          willChange: 'margin, transform',
          transform: compact ? 'translateY(2px)' : 'translateY(0)',
        }}
      >
        <div className="bottom-tab-bar__grid">{children}</div>
      </div>
    </nav>
  );
}

export function BottomTabBarItem({ active = false, compact = false, className, children, ...props }) {
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const duration = '280ms';

  return (
    <button
      type="button"
      className={cn('bottom-tab-bar__item', active && 'bottom-tab-bar__item--active', className)}
      data-compact={compact ? 'true' : 'false'}
      {...props}
    >
      <span
        className="bottom-tab-bar__icon-wrap"
        style={{
          width: compact ? '32px' : '34px',
          height: compact ? '32px' : '34px',
          transition: `width ${duration} ${ease}, height ${duration} ${ease}, transform ${duration} ${ease}`,
          willChange: 'width, height, transform',
          transform: active ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        {typeof children === 'function' ? children({ active, compact, duration, ease }) : children}
      </span>
    </button>
  );
}

export function BottomTabBarAction({ className, children, compact = false, ...props }) {
  return (
    <button
      type="button"
      className={cn('bottom-tab-bar__action', className)}
      data-compact={compact ? 'true' : 'false'}
      {...props}
    >
      {children}
    </button>
  );
}
