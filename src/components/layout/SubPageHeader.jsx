import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { cn } from '@/lib/utils';

/**
 * Global sub-page header.
 * - Uses the NavigationProvider tab stack for back navigation.
 * - Falls back to navigate(-1) if no stack entry exists.
 * - `rightContent` lets pages inject an action button on the right.
 */
export default function SubPageHeader({ title, rightContent, className }) {
  const { goBack, canGoBack, backLabel } = useNavigation();

  return (
    <div
      className={cn(
        'flex items-center gap-2 pt-safe px-4 py-3 sticky top-0 z-[60]',
        'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50',
        className
      )}
    >
      <button
        onClick={goBack}
        className="flex items-center gap-1 text-cyan-400 min-h-[44px] min-w-[44px] -ml-2 px-2 active:opacity-70 transition-opacity"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium truncate max-w-[80px]">{backLabel}</span>
      </button>

      <h1 className="text-white font-semibold text-base flex-1 text-center truncate">
        {title}
      </h1>

      {/* Right slot — same width as back button to keep title centred */}
      <div className="min-w-[44px] flex justify-end">
        {rightContent ?? null}
      </div>
    </div>
  );
}