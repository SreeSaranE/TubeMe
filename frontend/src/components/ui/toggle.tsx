import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
    variant?: 'default' | 'outline';
    size?: 'default' | 'sm' | 'lg';
  }
>(({ className, variant = 'outline', size = 'default', ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
      variant === 'default' &&
        'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] data-[state=on]:bg-[var(--primary)] data-[state=on]:text-[var(--primary-foreground)]',
      variant === 'outline' &&
        'border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] data-[state=on]:border-[var(--primary)] data-[state=on]:bg-[var(--primary)] data-[state=on]:text-[var(--primary-foreground)]',
      size === 'default' && 'h-9.5 px-3',
      size === 'sm' && 'h-8 px-2.5 text-xs',
      size === 'lg' && 'h-10 px-4 text-sm',
      className
    )}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
