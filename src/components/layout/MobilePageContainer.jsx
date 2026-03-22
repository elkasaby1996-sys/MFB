import React from 'react';
import { cn } from '@/lib/utils';
import ScreenShell from '@/components/layout/ScreenShell';

/**
 * Mobile-first page container with safe-area handling
 * Ensures consistent spacing, max-width, and safe-area insets across all pages
 */
export default function MobilePageContainer({
  children,
  className,
  withBottomNav = false,
  maxWidth = 'lg',
  safeTop = false,
}) {
  return (
    <ScreenShell
      maxWidth={maxWidth}
      safeTop={safeTop}
      includeTabBarOffset={withBottomNav}
      contentClassName={cn(className)}
    >
      {children}
    </ScreenShell>
  );
}
