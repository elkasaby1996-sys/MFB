import React from 'react';
import { cn } from '@/lib/utils';

const widthMap = {
  full: 'max-w-none',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function ScreenShell({
  children,
  className,
  contentClassName,
  maxWidth = 'lg',
  padded = true,
  safeTop = true,
  safeBottom = false,
  includeTabBarOffset = false,
  as: Component = 'div',
}) {
  return (
    <Component
      className={cn(
        'screen-shell bg-background text-foreground',
        safeTop && 'safe-top',
        safeBottom && 'safe-bottom',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          widthMap[maxWidth],
          padded && 'screen-shell__content',
          includeTabBarOffset && 'screen-shell--with-tabbar',
          contentClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
}
