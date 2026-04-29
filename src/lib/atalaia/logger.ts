import type { SupabaseClient } from '@supabase/supabase-js';

interface LogEntry {
  business_id?: string | null;
  endpoint: string;
  channel?: string | null;
  tokens_used?: number;
  latency_ms?: number;
  status_code: number;
  error?: unknown;
}

// Keep free-text errors short and never persist stack traces or request bodies
// (they can contain phone numbers, customer message content, API keys).
const MAX_ERROR_LEN = 400;

function sanitizeError(err: unknown): string | null {
  if (err === null || err === undefined) return null;
  if (typeof err === 'string') return err.slice(0, MAX_ERROR_LEN);
  if (err instanceof Error) {
    return (err.message || err.name || 'error').slice(0, MAX_ERROR_LEN);
  }
  try {
    const s = JSON.stringify(err);
    return s.slice(0, MAX_ERROR_LEN);
  } catch {
    return 'unserializable error';
  }
}

export async function logAtalaia(
  supabase: SupabaseClient,
  entry: LogEntry
): Promise<void> {
  try {
    await supabase.from('atalaia_logs').insert({
      business_id: entry.business_id ?? null,
      endpoint: entry.endpoint,
      channel: entry.channel ?? null,
      tokens_used: entry.tokens_used ?? 0,
      latency_ms: entry.latency_ms ?? 0,
      status_code: entry.status_code,
      error: sanitizeError(entry.error),
    });
  } catch {
    // Logging must never break the caller. Swallow by design.
  }
}
