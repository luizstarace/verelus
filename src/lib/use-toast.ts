'use client';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: string;
  variant: ToastVariant;
  message: string;
}

type Listener = (toasts: ToastEntry[]) => void;

let toasts: ToastEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

function push(variant: ToastVariant, message: string) {
  const id = Math.random().toString(36).slice(2, 10);
  toasts = [...toasts, { id, variant, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2000);
}

export function useToast() {
  return {
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
  };
}

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  l([...toasts]);
  return () => {
    listeners.delete(l);
  };
}
