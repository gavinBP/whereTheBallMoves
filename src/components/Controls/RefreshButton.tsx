import { useState, useCallback } from 'react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Refresh button with throttling and debouncing
 */
export function RefreshButton({ onRefresh, disabled = false }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const THROTTLE_MS = 30000; // 30 seconds minimum between refreshes
  const DEBOUNCE_MS = 500; // 500ms debounce

  const handleClick = useCallback(() => {
    // Clear any existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Debounce: wait before processing
    const timer = setTimeout(async () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;

      // Throttle: check if enough time has passed
      if (timeSinceLastRefresh < THROTTLE_MS) {
        const remainingSeconds = Math.ceil((THROTTLE_MS - timeSinceLastRefresh) / 1000);
        alert(`Please wait ${remainingSeconds} more second(s) before refreshing again.`);
        return;
      }

      setIsRefreshing(true);
      setLastRefreshTime(now);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, DEBOUNCE_MS);

    setDebounceTimer(timer);
  }, [onRefresh, lastRefreshTime, debounceTimer]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isRefreshing}
      style={{
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 'bold',
        backgroundColor: disabled || isRefreshing ? '#ccc' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled || isRefreshing ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    </button>
  );
}

