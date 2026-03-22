import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { cn } from '@/lib/utils';

/**
 * Global sub-page header.
 */
export default function SubPageHeader({ title, rightContent, className }) {
  const { goBack, backLabel } = useNavigation();

  return (
    <div
      className={cn(
        'sticky top-0 z-[60] border-b border-white/6 bg-slate-950/82 pt-[var(--safe-top)] backdrop-blur-xl safe-x',
        className,
      )}
    >
      <div className="mx-auto grid min-h-[56px] w-full max-w-lg grid-cols-[minmax(44px,auto)_1fr_minmax(44px,auto)] items-center gap-2 px-4 py-2">
        <button
          onClick={goBack}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-start gap-1 rounded-2xl px-2 text-slate-200 transition-colors active:bg-white/[0.05]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-cyan-300" />
          <span className="max-w-[84px] truncate text-sm font-medium text-slate-300">{backLabel}</span>
        </button>

        <h1 className="truncate text-center text-[15px] font-semibold tracking-[0.01em] text-white">
          {title}
        </h1>

        <div className="flex min-h-[44px] min-w-[44px] items-center justify-end">
          {rightContent ?? null}
        </div>
      </div>
    </div>
  );
}
