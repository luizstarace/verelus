'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/atalaia/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'dashboard',
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold text-brand-text">Erro no painel</h1>
        <p className="text-brand-muted text-sm">
          Tivemos um problema ao carregar esta tela. Já fomos notificados.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-brand-cta text-white font-medium px-4 py-2 rounded-lg hover:brightness-110 transition"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard/atalaia"
            className="bg-brand-surface border border-brand-border text-brand-text font-medium px-4 py-2 rounded-lg hover:bg-brand-border/50 transition"
          >
            Voltar ao painel
          </a>
        </div>
      </div>
    </div>
  );
}
