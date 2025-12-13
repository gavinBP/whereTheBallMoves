import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  callback: () => void | Promise<void>;
  intervalMs: number; // Interval in milliseconds (e.g., 7 * 60 * 1000 for 7 minutes)
  enabled?: boolean; // Whether auto-refresh is enabled (default: true)
  immediate?: boolean; // Whether to call immediately on mount (default: true)
}

/**
 * Custom hook for auto-refresh functionality
 * Calls a callback function at regular intervals
 * 
 * @param options Configuration options
 */
export function useAutoRefresh({
  callback,
  intervalMs,
  enabled = true,
  immediate = true,
}: UseAutoRefreshOptions): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Call immediately if requested
    if (immediate) {
      callbackRef.current();
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, immediate, intervalMs]);
}

