'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  content: React.ReactNode;
  label?: string;
}

export function HelpTooltip({ content, label = 'Ajuda' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <span ref={ref} className="inline-block relative align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={label}
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-white/10 text-white/60 text-[10px] font-bold leading-none inline-flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 max-w-[80vw] z-50 bg-brand-surface border border-white/10 rounded-lg p-3 text-xs text-white/90 leading-relaxed shadow-xl whitespace-normal"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </span>
      )}
    </span>
  );
}
