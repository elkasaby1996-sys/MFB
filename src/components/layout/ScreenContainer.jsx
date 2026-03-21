import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Non-scrollable screen container with safe area support
 * Use for screens with fixed layouts or internal scroll views
 */
export default function ScreenContainer({ children, className }) {
  return (
    <div className={cn(
      "app-screen bg-slate-950 safe-top safe-bottom safe-x",
      className
    )}>
      {children}
    </div>
  );
}
