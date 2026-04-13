'use client';

import { useCallback, useEffect } from 'react';

export function useErrorReporter() {
  // Report manual errors
  const reportError = useCallback((error: Error, componentName?: string) => {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        componentName,
        severity: 'medium',
      }),
    }).catch(() => {}); // Fire and forget
  }, []);

  // Catch unhandled errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href,
          severity: 'high',
        }),
      }).catch(() => {});
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          stack: event.reason instanceof Error ? event.reason.stack : undefined,
          url: window.location.href,
          severity: 'high',
        }),
      }).catch(() => {});
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return { reportError };
}
