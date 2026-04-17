'use client';

import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastEntry } from '@/lib/use-toast';

const VARIANT_CLASS: Record<ToastEntry['variant'], string> = {
  success: 'bg-brand-green/10 border-brand-green/30 text-brand-green',
  error: 'bg-red-500/10 border-red-500/30 text-red-300',
  info: 'bg-white/5 border-white/20 text-white',
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
