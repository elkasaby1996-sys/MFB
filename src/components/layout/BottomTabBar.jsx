import React from 'react';
import { cn } from '@/lib/utils';

export function BottomTabBar({ children, compact = false, className }) {
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn('bottom-tab-bar fixed inset-x-0 z-50 px-safe', className)}
      style={{ bottom: 'max(6px, calc(var(--safe-bottom) + 4px))' }}
      data-compact={compact ? 'true' : 'false'}
    >
      <div className="bottom-tab-bar__surface">
        <div className="bottom-tab-bar__grid">{children}</div>
      </div>
    </nav>
  );
}

export function BottomTabBarItem({ active = false, compact = false, label, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn('bottom-tab-bar__item', active && 'bottom-tab-bar__item--active', className)}
      data-compact={compact ? 'true' : 'false'}
      {...props}
    >
      <span className="bottom-tab-bar__icon-wrap">
        {typeof children === 'function' ? children({ active, compact }) : children}
      </span>
      {label ? <span className="bottom-tab-bar__label">{label}</span> : null}
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
