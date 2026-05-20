"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { API_URL } from "@/lib/api";

type LifeOsRealtimeContextValue = {
  epoch: number;
  /** Bump to refetch screens that listen to `useLifeOsRealtimeEpoch`. */
  bump: () => void;
};

const LifeOsRealtimeContext = createContext<LifeOsRealtimeContextValue>({
  epoch: 0,
  bump: () => {}
});

export function useLifeOsRealtimeEpoch(): number {
  return useContext(LifeOsRealtimeContext).epoch;
}

export function useBumpLifeOsData(): () => void {
  return useContext(LifeOsRealtimeContext).bump;
}

/**
 * Single shared EventSource to `/events/stream`. Bumps an epoch on each `app_update` so screens refetch.
 * Reconnects with exponential backoff (cap 30s) after errors — no polling loop.
 */
export function LifeOsRealtimeProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    setEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let retryMs = 1000;

    const streamUrl = `${API_URL.replace(/\/$/, "")}/events/stream`;

    function clearTimer() {
      if (reconnectTimerRef.current != null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      clearTimer();
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, retryMs);
      retryMs = Math.min(retryMs * 2, 30000);
    }

    function connect() {
      if (cancelled) return;
      es?.close();
      es = new EventSource(streamUrl);

      es.onopen = () => {
        retryMs = 1000;
      };

      es.onmessage = (ev: MessageEvent<string>) => {
        try {
          const json = JSON.parse(ev.data) as { type?: string };
          if (json?.type === "connected") return;
          bump();
        } catch {
          bump();
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!cancelled) scheduleReconnect();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimer();
      es?.close();
    };
  }, [bump]);

  const value = useMemo(() => ({ epoch, bump }), [epoch, bump]);

  return <LifeOsRealtimeContext.Provider value={value}>{children}</LifeOsRealtimeContext.Provider>;
}
