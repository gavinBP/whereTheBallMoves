import { useState, useCallback, useRef } from 'react';
import { fetchAllBalloonData } from '../services/windborneApi';
import { reconstructBalloonTracks } from '../utils/trackReconstruction';
import { ErrorTracker } from '../utils/errorTracking';
import { retryWithBackoff, isRetryableError } from '../utils/retry';
import type { BalloonDataCollection } from '../types/balloon';
import type { TrackReconstructionResult } from '../types/track';
import type { ErrorReport } from '../types/errors';

interface UseBalloonDataReturn {
  data: BalloonDataCollection | null;
  tracks: TrackReconstructionResult | null;
  loading: boolean;
  error: string | null;
  errorReport: ErrorReport | null;
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for managing balloon data state
 */
export function useBalloonData(): UseBalloonDataReturn {
  const [data, setData] = useState<BalloonDataCollection | null>(null);
  const [tracks, setTracks] = useState<TrackReconstructionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorReport, setErrorReport] = useState<ErrorReport | null>(null);
  const errorTrackerRef = useRef<ErrorTracker>(new ErrorTracker());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use retry logic for fetching data
      const result = await retryWithBackoff(
        async (retryCount) => {
          try {
            return await fetchAllBalloonData();
          } catch (err) {
            // Record API error
            if (isRetryableError(err)) {
              errorTrackerRef.current.recordApiError(
                'network',
                err instanceof Error ? err.message : 'Network error',
                'windborne-api',
                retryCount
              );
            } else {
              errorTrackerRef.current.recordApiError(
                'unknown',
                err instanceof Error ? err.message : 'Unknown error',
                'windborne-api',
                retryCount
              );
            }
            throw err;
          }
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          retryable: isRetryableError,
        }
      );

      setData(result);

      // Analyze data for errors
      errorTrackerRef.current.analyzeDataCollection(result);

      if (result.successCount > 0) {
        const reconstructed = reconstructBalloonTracks(result);
        setTracks(reconstructed);

        // Analyze tracks for errors
        errorTrackerRef.current.analyzeTrackReconstruction(reconstructed);
      } else {
        // No successful data
        errorTrackerRef.current.recordApiError(
          'unknown',
          'No data files were successfully fetched',
          'windborne-api'
        );
      }

      // Generate error report
      setErrorReport(errorTrackerRef.current.generateErrorReport());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching balloon data:', err);

      // Generate error report even on failure
      setErrorReport(errorTrackerRef.current.generateErrorReport());
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    tracks,
    loading,
    error,
    errorReport,
    fetchData,
    refreshData,
  };
}

