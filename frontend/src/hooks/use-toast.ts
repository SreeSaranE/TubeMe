import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4500;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastState = {
  toasts: ToasterToast[];
};

let memoryState: ToastState = { toasts: [] };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function dispatch(action: {
  type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
  toast?: ToasterToast;
  toastId?: string;
}) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        memoryState = {
          toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
        };
      }
      break;
    case 'UPDATE_TOAST':
      if (action.toast) {
        memoryState = {
          toasts: memoryState.toasts.map((t) =>
            t.id === action.toast!.id ? { ...t, ...action.toast } : t
          ),
        };
      }
      break;
    case 'DISMISS_TOAST':
      memoryState = {
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
      break;
    case 'REMOVE_TOAST':
      memoryState = {
        toasts:
          action.toastId === undefined
            ? []
            : memoryState.toasts.filter((t) => t.id !== action.toastId),
      };
      break;
  }
  notify();
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId();

  const dismiss = () => {
    dispatch({ type: 'DISMISS_TOAST', toastId: id });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', toastId: id });
    }, 400);
  };

  const update = (updatedProps: ToasterToast) =>
    dispatch({ type: 'UPDATE_TOAST', toast: { ...updatedProps, id } });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Automatically dismiss after TOAST_REMOVE_DELAY
  setTimeout(() => {
    dismiss();
  }, TOAST_REMOVE_DELAY);

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const state = React.useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => memoryState,
    () => memoryState
  );

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => {
      dispatch({ type: 'DISMISS_TOAST', toastId });
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', toastId });
      }, 400);
    },
  };
}
