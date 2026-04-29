'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="text-brand-muted text-sm">
          Tivemos um erro inesperado. Já fomos notificados. Você pode tentar novamente ou voltar ao início.
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
            href="/"
            className="bg-brand-surface border border-brand-border text-brand-text font-medium px-4 py-2 rounded-lg hover:bg-brand-border/50 transition"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}
