'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  endpoint: string;
  channel: string | null;
  tokens_used: number;
  latency_ms: number;
  status_code: number | null;
  error: string | null;
  created_at: string;
}

type FilterMode = 'all' | 'errors';

const ENDPOINT_LABELS: Record<string, string> = {
  '/api/atalaia/chat': 'Chat',
  '/api/atalaia/voice': 'Voz',
  '/api/atalaia/whatsapp/webhook': 'WhatsApp',
  '/api/atalaia/widget': 'Widget',
};

export default function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [endpointFilter, setEndpointFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter === 'errors') params.set('only_errors', '1');
    if (endpointFilter) params.set('endpoint', endpointFilter);

    setLoading(true);
    setError(null);

    fetch(`/api/atalaia/logs?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar logs');
        setLogs(data.logs || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter, endpointFilter]);

  const endpoints = Array.from(new Set(logs.map((l) => l.endpoint))).sort();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Logs</h1>
        <p className="text-brand-muted text-sm mt-1">
          Últimas requisições ao seu atendente. Erros aparecem em vermelho.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="inline-flex rounded-lg border border-brand-border overflow-hidden text-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 ${
              filter === 'all' ? 'bg-brand-trust text-white' : 'bg-white text-brand-muted hover:text-brand-text'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('errors')}
            className={`px-3 py-1.5 border-l border-brand-border ${
              filter === 'errors' ? 'bg-brand-error text-white' : 'bg-white text-brand-muted hover:text-brand-text'
            }`}
          >
            Só erros
          </button>
        </div>

        {endpoints.length > 0 && (
          <select
            value={endpointFilter}
            onChange={(e) => setEndpointFilter(e.target.value)}
            className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white text-brand-text"
          >
            <option value="">Todos os endpoints</option>
            {endpoints.map((ep) => (
              <option key={ep} value={ep}>
                {ENDPOINT_LABELS[ep] || ep}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-brand-error/10 border border-brand-error/30 rounded-lg p-4 text-sm text-brand-error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-brand-muted text-sm">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-brand-muted text-sm">Nenhum log encontrado.</p>
      ) : (
        <div className="bg-white border border-brand-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface border-b border-brand-border">
              <tr className="text-left text-brand-muted text-xs uppercase">
                <th className="px-4 py-2 font-medium">Quando</th>
                <th className="px-4 py-2 font-medium">Endpoint</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Latência</th>
                <th className="px-4 py-2 font-medium text-right">Tokens</th>
                <th className="px-4 py-2 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isError = (log.status_code ?? 0) >= 400;
                return (
                  <tr
                    key={log.id}
                    className={`border-b border-brand-border/50 last:border-b-0 ${
                      isError ? 'bg-brand-error/5' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-brand-muted whitespace-nowrap">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="px-4 py-2 text-brand-text">
                      {ENDPOINT_LABELS[log.endpoint] || log.endpoint}
                    </td>
                    <td className="px-4 py-2 text-brand-muted">{log.channel || '—'}</td>
                    <td className="px-4 py-2">
                      <StatusPill code={log.status_code} />
                    </td>
                    <td className="px-4 py-2 text-right text-brand-muted tabular-nums">
                      {log.latency_ms > 0 ? `${log.latency_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-brand-muted tabular-nums">
                      {log.tokens_used > 0 ? log.tokens_used : '—'}
                    </td>
                    <td className="px-4 py-2 text-brand-error text-xs max-w-xs truncate" title={log.error || ''}>
                      {log.error || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ code }: { code: number | null }) {
  if (code === null) return <span className="text-brand-muted">—</span>;
  const isError = code >= 400;
  const isWarn = code >= 300 && code < 400;
  const cls = isError
    ? 'bg-brand-error/10 text-brand-error'
    : isWarn
    ? 'bg-brand-cta/10 text-brand-cta'
    : 'bg-brand-success/10 text-brand-success';
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono tabular-nums ${cls}`}>{code}</span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
