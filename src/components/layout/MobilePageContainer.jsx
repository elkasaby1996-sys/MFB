import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Mobile-first page container with safe-area handling
 * Ensures consistent spacing, max-width, and safe-area insets across all pages
 */
export default function MobilePageContainer({ 
  children, 
  className,
  withBottomNav = false,
  maxWidth = "lg" // sm, md, lg, xl
}) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth];

  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6",
      maxWidthClass,
      withBottomNav ? "pb-24" : "pb-8",
      className
    )}>
      {children}
    </div>
  );
}