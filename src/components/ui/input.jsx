import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, invalid, onFocus, onBlur, ...props }, ref) => {
  const inputMode = type === 'number' ? 'decimal' : undefined;
  const isInvalid = invalid ?? props['aria-invalid'];

  return (
    <input
      type={type}
      inputMode={inputMode}
      data-invalid={isInvalid ? 'true' : 'false'}
      className={cn(
        'ui-input flex min-h-[var(--control-height-lg)] w-full rounded-[18px] border border-white/10 bg-[var(--field-surface)] px-[var(--space-4)] py-[calc(var(--space-3)+1px)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)] text-foreground shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,background-color,transform] duration-200 placeholder:text-[color:var(--field-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      onFocus={(event) => {
        event.currentTarget.dataset.focused = 'true';
        onFocus?.(event);
      }}
      onBlur={(event) => {
        event.currentTarget.dataset.focused = 'false';
        onBlur?.(event);
      }}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
