import React from 'react';
import { cn } from '@/lib/utils';
import ScreenShell from '@/components/layout/ScreenShell';

/**
 * Non-scrollable screen container with safe area support
 * Use for screens with fixed layouts or internal scroll views
 */
export default function ScreenContainer({ children, className, contentClassName, ...props }) {
  return (
    <ScreenShell
      className={cn('app-screen min-h-[100dvh]', className)}
      contentClassName={contentClassName}
      safeBottom
      {...props}
    >
      {children}
    </ScreenShell>
  );
}
