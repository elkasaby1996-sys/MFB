import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Mobile-first form sheet component
 * Provides a full-screen modal on mobile with:
 * - Fixed header
 * - Scrollable content
 * - Sticky footer for CTA
 * - Safe-area handling
 * - Keyboard-safe behavior
 */
export default function MobileFormSheet({ 
  open, 
  onOpenChange,
  title,
  children,
  footer,
  className
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        hideClose
        className={cn(
          "bg-slate-900 border-slate-800 text-white",
          "w-full h-[100dvh] sm:h-auto sm:max-h-[90vh]",
          "sm:rounded-t-3xl",
          className
        )}
      >
        {/* Fixed Header */}
        <SheetHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-slate-800">
          <SheetTitle className="text-xl font-bold text-white">{title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-6 py-4 pb-safe">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}