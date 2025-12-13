import { useRef, useCallback } from 'react';

/**
 * Custom hook for throttling function calls
 * Ensures a function is called at most once per specified time period
 * 
 * @param callback Function to throttle
 * @param delayMs Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (timeSinceLastCall >= delayMs) {
        // Enough time has passed, call immediately
        lastCallTime.current = now;
        callback(...args);
      } else {
        // Schedule call for when enough time has passed
        const remainingTime = delayMs - timeSinceLastCall;
        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          callback(...args);
          timeoutRef.current = null;
        }, remainingTime);
      }
    },
    [callback, delayMs]
  ) as T;

  return throttledCallback;
}

