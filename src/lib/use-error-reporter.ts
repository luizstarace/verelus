'use client';

import { useCallback, useEffect } from 'react';

// Module-level state to prevent duplicate global listeners
let listenerRefCount = 0;
let listenersRegistered = false;

function handleError(event: ErrorEvent) {
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
}

function handleRejection(event: PromiseRejectionEvent) {
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
}

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

  // Register global listeners only once across all hook instances
  useEffect(() => {
    listenerRefCount++;
    if (!listenersRegistered) {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);
      listenersRegistered = true;
    }
    return () => {
      listenerRefCount--;
      if (listenerRefCount === 0 && listenersRegistered) {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
        listenersRegistered = false;
      }
    };
  }, []);

  return { reportError };
}
