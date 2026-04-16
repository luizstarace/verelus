'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  placeholder?: string;
  inputType?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({ open, title, message, placeholder, inputType = 'text', confirmLabel = 'Salvar', onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-brand-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-brand-muted mb-4">{message}</p>
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-green/40 transition-colors mb-4"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onConfirm(value.trim()); }}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (value.trim()) onConfirm(value.trim()); }}
            disabled={!value.trim()}
            className="px-4 py-2 rounded-lg bg-brand-green text-black text-sm font-bold hover:brightness-110 transition disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
