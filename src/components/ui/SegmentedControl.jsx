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
    sm: { container: 'min-h-9 p-1', item: 'min-h-7.5 px-3 text-xs' },
    md: { container: 'min-h-11 p-1', item: 'min-h-9 px-3.5 text-sm' },
    lg: { container: 'min-h-12 p-1', item: 'min-h-10 px-4 text-sm' },
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
        'inline-flex w-full items-stretch gap-1 rounded-[18px] border border-white/8 bg-white/[0.04] backdrop-blur-md',
        currentSize.container,
        className,
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
              'relative flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-40',
              fullWidth && 'flex-1',
              currentSize.item,
              isActive
                ? 'bg-white text-slate-950 shadow-[0_1px_1px_rgba(255,255,255,0.7)_inset,0_6px_16px_rgba(15,23,42,0.16)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] active:scale-[0.985]',
              optionClassName,
              option.className,
            )}
          >
            {option.icon && <option.icon className={cn('h-4 w-4', isActive ? 'text-current' : 'text-slate-500')} />}
            {option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
