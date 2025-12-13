import { useState, useCallback } from 'react';
import { fetchWindDataForAltitude, getWindDataAtTime } from '../services/openMeteoApi';
import type { WindDataSeries, WindDataPoint } from '../types/wind';
import type { TrackPoint } from '../types/track';

interface UseWindDataReturn {
  windData: WindDataSeries | null;
  loading: boolean;
  error: string | null;
  fetchWindForPoint: (point: TrackPoint) => Promise<WindDataPoint | null>;
}

/**
 * Custom hook for managing wind data state
 */
export function useWindData(): UseWindDataReturn {
  const [windData, setWindData] = useState<WindDataSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWindForPoint = useCallback(async (point: TrackPoint): Promise<WindDataPoint | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWindDataForAltitude(
        point.latitude,
        point.longitude,
        point.altitudeKm
      );

      if (result.success && result.data) {
        // Only update windDataSeries if it's different (to avoid unnecessary re-renders)
        setWindData((prev) => {
          if (
            prev &&
            prev.latitude === result.data!.latitude &&
            prev.longitude === result.data!.longitude &&
            prev.pressureLevelHpa === result.data!.pressureLevelHpa
          ) {
            return prev; // Same location, keep existing
          }
          return result.data!;
        });
        const windAtTime = getWindDataAtTime(result.data, point.timestamp);
        return windAtTime;
      } else {
        setError(result.error || 'Failed to fetch wind data');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    windData,
    loading,
    error,
    fetchWindForPoint,
  };
}

