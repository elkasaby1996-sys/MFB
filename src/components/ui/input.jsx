import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const inputMode = type === 'number' ? 'decimal' : undefined;

  return (
    <input
      type={type}
      inputMode={inputMode}
      className={cn(
        'ui-input flex min-h-[var(--control-height-lg)] w-full rounded-[var(--control-radius)] border border-input bg-background/70 px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)] shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,background-color] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
