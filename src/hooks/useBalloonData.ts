import { useState, useCallback } from 'react';
import { fetchAllBalloonData } from '../services/windborneApi';
import { reconstructBalloonTracks } from '../utils/trackReconstruction';
import type { BalloonDataCollection } from '../types/balloon';
import type { TrackReconstructionResult } from '../types/track';

interface UseBalloonDataReturn {
  data: BalloonDataCollection | null;
  tracks: TrackReconstructionResult | null;
  loading: boolean;
  error: string | null;
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllBalloonData();
      setData(result);

      if (result.successCount > 0) {
        const reconstructed = reconstructBalloonTracks(result);
        setTracks(reconstructed);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching balloon data:', err);
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
    fetchData,
    refreshData,
  };
}

