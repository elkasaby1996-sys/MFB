import React from 'react';
import { cn } from '@/lib/utils';
import { nativeHaptics } from '@/lib/native';

export default function SegmentedControl({
  value,
  onValueChange,
  options,
  className,
  optionClassName,
  size = 'md',
  fullWidth = false,
  haptic = 'selection',
  ariaLabel,
}) {
  const sizes = {
    sm: {
      container: 'min-h-10 p-1',
      item: 'min-h-8 px-3 text-xs',
    },
    md: {
      container: 'min-h-12 p-1',
      item: 'min-h-10 px-4 text-sm',
    },
    lg: {
      container: 'min-h-14 p-1.5',
      item: 'min-h-11 px-4 text-sm',
    },
  };

  const currentSize = sizes[size] || sizes.md;

  const handleSelect = (nextValue, disabled) => {
    if (disabled || nextValue === value) return;
    nativeHaptics[haptic]?.();
    onValueChange?.(nextValue);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-full items-stretch gap-1.5 rounded-[20px] border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(15,23,42,0.28)] backdrop-blur-xl',
        currentSize.container,
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(option.value, option.disabled)}
            disabled={option.disabled}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-[16px] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-40',
              fullWidth && 'flex-1',
              currentSize.item,
              isActive
                ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.92)_100%)] text-slate-950 shadow-[0_1px_1px_rgba(255,255,255,0.65)_inset,0_10px_25px_rgba(15,23,42,0.24)]'
                : 'text-slate-300 hover:text-white hover:bg-white/6 active:scale-[0.985]',
              optionClassName,
              option.className
            )}
          >
            {option.icon && <option.icon className={cn('h-4 w-4', isActive ? 'text-current' : 'text-slate-400')} />}
            {option.label && <span>{option.label}</span>}
            {option.badge && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-300'
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
