"use client";

import { useCallback, useEffect, useRef } from "react";

interface TrackingEvent {
  event_name: string;
  event_category: string;
  properties?: Record<string, unknown>;
  session_id?: string;
}

const BATCH_INTERVAL_MS = 5_000;
const BATCH_SIZE_LIMIT = 10;
const PAGE_VIEW_DEBOUNCE_MS = 1_000;

/**
 * Client-side analytics hook.
 *
 * Returns a `track` function that queues events and flushes them
 * in batches to `/api/track` (every 5 s or when 10 events are queued).
 *
 * Page-view events are debounced so rapid navigations don't double-fire.
 */
export function useTracking() {
  const queueRef = useRef<TrackingEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushing = useRef(false);
  const sessionId = useRef<string>(getOrCreateSessionId());

  const flush = useCallback(async () => {
    if (isFlushing.current || queueRef.current.length === 0) return;
    isFlushing.current = true;

    const batch = queueRef.current.splice(0);

    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
        // Fire-and-forget — don't block the UI on analytics
        keepalive: true,
      });
    } catch {
      // Silently drop on failure; analytics should never break the app
    } finally {
      isFlushing.current = false;
    }
  }, []);

  // Schedule periodic flush
  const scheduleFlush = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flush();
    }, BATCH_INTERVAL_MS);
  }, [flush]);

  // Flush on unmount and on page hide (tab close / navigation away)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush]);

  const enqueue = useCallback(
    (event: TrackingEvent) => {
      queueRef.current.push({ ...event, session_id: sessionId.current });

      if (queueRef.current.length >= BATCH_SIZE_LIMIT) {
        flush();
      } else {
        scheduleFlush();
      }
    },
    [flush, scheduleFlush]
  );

  const track = useCallback(
    (
      name: string,
      category: string,
      properties?: Record<string, unknown>
    ) => {
      // Debounce page_view events
      if (category === "page_view") {
        if (pageViewTimerRef.current) {
          clearTimeout(pageViewTimerRef.current);
        }
        pageViewTimerRef.current = setTimeout(() => {
          pageViewTimerRef.current = null;
          enqueue({
            event_name: name,
            event_category: category,
            properties,
          });
        }, PAGE_VIEW_DEBOUNCE_MS);
        return;
      }

      enqueue({
        event_name: name,
        event_category: category,
        properties,
      });
    },
    [enqueue]
  );

  return { track };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const KEY = "atalaia_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
