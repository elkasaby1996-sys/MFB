import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, invalid, onFocus, onBlur, ...props }, ref) => {
  const isInvalid = invalid ?? props['aria-invalid'];

  return (
    <textarea
      data-invalid={isInvalid ? 'true' : 'false'}
      className={cn(
        'ui-input ui-textarea flex min-h-[120px] w-full rounded-[18px] border border-white/10 bg-[var(--field-surface)] px-[var(--space-4)] py-[var(--space-4)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)] text-foreground shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,background-color,transform] duration-200 placeholder:text-[color:var(--field-placeholder)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
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
Textarea.displayName = 'Textarea';

export { Textarea };
