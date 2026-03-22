import React from 'react';
import { cn } from '@/lib/utils';

export function BottomTabBar({ children, compact = false, className }) {
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const duration = '380ms';

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn('bottom-tab-bar fixed inset-x-0 z-50 px-safe', className)}
      style={{ bottom: 'max(12px, calc(var(--safe-bottom) + 8px))' }}
    >
      <div
        className="bottom-tab-bar__surface"
        style={{
          margin: compact ? '0 var(--space-5)' : '0 var(--space-3)',
          transition: `margin ${duration} ${ease}`,
          willChange: 'margin',
        }}
      >
        <div className="bottom-tab-bar__grid">{children}</div>
      </div>
    </nav>
  );
}

export function BottomTabBarItem({ active = false, compact = false, className, children, ...props }) {
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const duration = '380ms';

  return (
    <button
      type="button"
      className={cn('bottom-tab-bar__item', active && 'bottom-tab-bar__item--active', className)}
      {...props}
    >
      <span
        className="bottom-tab-bar__icon-wrap"
        style={{
          width: compact ? '30px' : '34px',
          height: compact ? '30px' : '34px',
          transition: `width ${duration} ${ease}, height ${duration} ${ease}`,
          willChange: 'width, height',
        }}
      >
        {typeof children === 'function' ? children({ active, compact, duration, ease }) : children}
      </span>
    </button>
  );
}

export function BottomTabBarAction({ className, children, ...props }) {
  return (
    <button type="button" className={cn('bottom-tab-bar__action', className)} {...props}>
      {children}
    </button>
  );
}
