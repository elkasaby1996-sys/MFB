import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Non-scrollable screen container with safe area support
 * Use for screens with fixed layouts or internal scroll views
 */
export default function ScreenContainer({ children, className }) {
  return (
    <div className={cn(
      "min-h-screen bg-slate-950",
      "pt-[env(safe-area-inset-top)]",
      "pb-[env(safe-area-inset-bottom)]",
      className
    )}>
      {children}
    </div>
  );
}