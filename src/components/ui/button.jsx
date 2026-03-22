import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--control-radius)] text-[length:var(--font-size-label)] font-semibold leading-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.99]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[var(--shadow-button)] hover:brightness-110',
        destructive: 'bg-destructive text-destructive-foreground shadow-[var(--shadow-button)] hover:brightness-110',
        outline: 'border border-input bg-background/80 text-foreground shadow-[var(--shadow-soft)] hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:brightness-105',
        ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'h-auto min-h-0 rounded-none px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[var(--control-height-md)] px-[var(--space-4)] py-[var(--space-3)] [&_svg]:size-4',
        sm: 'min-h-[var(--control-height-sm)] px-[var(--space-3)] py-2 text-[length:var(--font-size-caption)] [&_svg]:size-4',
        lg: 'min-h-[var(--control-height-lg)] px-[var(--space-5)] py-[var(--space-4)] text-[length:var(--font-size-body)] [&_svg]:size-5',
        icon: 'h-[var(--control-height-md)] w-[var(--control-height-md)] px-0 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
