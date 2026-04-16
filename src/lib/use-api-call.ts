'use client';

import { useState, useCallback } from 'react';

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiCallReturn<T> extends ApiCallState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useApiCall<T>(
  fn: (...args: unknown[]) => Promise<T>
): UseApiCallReturn<T> {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: unknown[]) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await fn(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setState((s) => ({ ...s, loading: false, error: msg }));
      return null;
    }
  }, [fn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((s) => ({ ...s, data }));
  }, []);

  return { ...state, execute, reset, setData };
}

interface FetchJsonOptions {
  method?: string;
  body?: unknown;
}

export async function fetchJson<T>(url: string, opts?: FetchJsonOptions): Promise<T> {
  const res = await fetch(url, {
    method: opts?.method ?? 'GET',
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json() as T & { error?: string };
  if (!res.ok) {
    throw new Error(json.error || `Erro ${res.status}`);
  }
  return json;
}
