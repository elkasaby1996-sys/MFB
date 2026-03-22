import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { cn } from '@/lib/utils';

export default function SubPageHeader({ title, subtitle, rightContent, className }) {
  const { goBack, backLabel } = useNavigation();

  return (
    <header className={cn('sticky top-0 z-[60] border-b border-white/6 bg-slate-950/88 backdrop-blur-xl', className)}>
      <div className="mx-auto flex w-full max-w-lg items-end gap-3 px-[var(--screen-gutter)] pb-3 pt-[max(calc(var(--safe-top)+8px),18px)]">
        <button
          onClick={goBack}
          className="inline-flex h-10 min-w-[44px] items-center gap-1 rounded-full px-2.5 text-slate-200 transition-colors active:bg-white/[0.05]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-slate-200" />
          <span className="max-w-[88px] truncate text-[13px] font-medium text-slate-400">{backLabel}</span>
        </button>

        <div className="min-w-0 flex-1 pb-0.5">
          <h1 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-white">{title}</h1>
          {subtitle ? <p className="mt-0.5 truncate text-[13px] text-slate-500">{subtitle}</p> : null}
        </div>

        <div className="flex min-w-[44px] items-center justify-end">{rightContent ?? null}</div>
      </div>
    </header>
  );
}
