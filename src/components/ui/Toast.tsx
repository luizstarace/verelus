'use client';

import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastEntry } from '@/lib/use-toast';

const VARIANT_CLASS: Record<ToastEntry['variant'], string> = {
  success: 'bg-brand-trust/10 border-brand-trust/30 text-brand-trust',
  error: 'bg-brand-error/10 border-brand-error/30 text-brand-error',
  info: 'bg-brand-surface border-brand-border text-brand-text',
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastEntry[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto px-4 py-3 rounded-lg border text-sm shadow-lg backdrop-blur-sm animate-slide-in-right ${VARIANT_CLASS[t.variant]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
