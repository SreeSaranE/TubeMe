import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'muted';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border select-none';
  
  const variants = {
    default: 'border-transparent bg-foreground text-background font-semibold',
    secondary: 'border-border bg-secondary text-secondary-foreground',
    outline: 'border-border text-foreground bg-transparent',
    muted: 'border-transparent bg-muted text-muted-foreground',
  };

  return <div className={cn(baseStyles, variants[variant], className)} {...props} />;
}

export { Badge };
