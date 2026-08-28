import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-5 right-5 z-[9999] flex max-h-screen w-full max-w-[380px] flex-col gap-2.5 p-0 outline-none pointer-events-none',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: 'default' | 'destructive' | 'success';
  }
>(({ className, variant = 'default', children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-2xl transition-all duration-200 bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border)] data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        variant === 'destructive' && 'border-rose-500/50 bg-[var(--bg-surface)] text-rose-500 shadow-rose-950/20',
        variant === 'success' && 'border-emerald-500/50 bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-emerald-950/20',
        className
      )}
      {...props}
    >
      {variant === 'success' && (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
      )}
      {variant === 'destructive' && (
        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
      )}
      {variant === 'default' && (
        <Info className="h-5 w-5 text-[var(--text-primary)] shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      <ToastPrimitives.Close className="absolute right-3 top-3 rounded-md p-1 text-[var(--text-muted)] opacity-70 transition-opacity hover:opacity-100 hover:text-[var(--text-primary)] focus:outline-none cursor-pointer">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-tight text-[var(--text-primary)]', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-xs text-[var(--text-secondary)] leading-relaxed mt-1', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

export {
  type ToastProps,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
};
