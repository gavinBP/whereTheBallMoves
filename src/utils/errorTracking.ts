import type {
  ErrorTrackingState,
  TrackError,
  ApiError,
  ErrorReport,
  DataFileError,
} from '../types/errors';
import type { BalloonDataCollection } from '../types/balloon';
import type { TrackReconstructionResult } from '../types/track';

/**
 * Error tracking utility
 * Manages error state and generates error reports
 */
export class ErrorTracker {
  private state: ErrorTrackingState;

  constructor() {
    this.state = {
      dataFileErrors: new Map(),
      trackErrors: new Map(),
      apiErrors: [],
      lastSuccessfulFetch: null,
    };
  }

  /**
   * Record a data file error
   */
  recordDataFileError(hour: number, error: string, retryCount?: number): void {
    const dataFileError: DataFileError = {
      hour,
      error,
      timestamp: new Date(),
      retryCount,
    };
    this.state.dataFileErrors.set(hour, dataFileError);
  }

  /**
   * Clear a data file error (when it's resolved)
   */
  clearDataFileError(hour: number): void {
    this.state.dataFileErrors.delete(hour);
  }

  /**
   * Record a track error
   */
  recordTrackError(
    trackId: string,
    issue: TrackError['issue'],
    description: string
  ): void {
    this.state.trackErrors.set(trackId, {
      trackId,
      issue,
      description,
      timestamp: new Date(),
    });
  }

  /**
   * Clear a track error
   */
  clearTrackError(trackId: string): void {
    this.state.trackErrors.delete(trackId);
  }

  /**
   * Record an API error
   */
  recordApiError(
    type: ApiError['type'],
    message: string,
    endpoint?: string,
    retryCount?: number
  ): void {
    this.state.apiErrors.push({
      type,
      message,
      timestamp: new Date(),
      endpoint,
      retryCount,
    });

    // Keep only the last 50 API errors to prevent memory issues
    if (this.state.apiErrors.length > 50) {
      this.state.apiErrors = this.state.apiErrors.slice(-50);
    }
  }

  /**
   * Mark a successful fetch
   */
  recordSuccessfulFetch(): void {
    this.state.lastSuccessfulFetch = new Date();
  }

  /**
   * Analyze data collection and track errors
   */
  analyzeDataCollection(data: BalloonDataCollection): void {
    // Track failed data files
    for (const result of data.results) {
      if (!result.success) {
        this.recordDataFileError(result.hour, result.error || 'Unknown error');
      } else {
        // Clear error if it was previously recorded
        this.clearDataFileError(result.hour);
      }
    }

    // If we have successful data, record successful fetch
    if (data.successCount > 0) {
      this.recordSuccessfulFetch();
    }
  }

  /**
   * Analyze track reconstruction and track errors
   */
  analyzeTrackReconstruction(tracks: TrackReconstructionResult): void {
    // Track incomplete tracks (tracks with very few points)
    for (const track of tracks.tracks) {
      if (track.points.length < 2) {
        this.recordTrackError(
          track.trackId,
          'incomplete',
          `Track has only ${track.points.length} point(s), expected at least 2`
        );
      } else {
        // Clear error if track is now complete
        this.clearTrackError(track.trackId);
      }
    }

    // Track unmatched points as potential issues
    if (tracks.unmatchedPoints.length > 0) {
      // We could create a summary error for unmatched points
      // For now, we'll track individual track errors if needed
    }
  }

  /**
   * Generate error report
   */
  generateErrorReport(): ErrorReport {
    const dataFileErrors = Array.from(this.state.dataFileErrors.values());
    const trackErrors = Array.from(this.state.trackErrors.values());
    const totalErrors = dataFileErrors.length + trackErrors.length + this.state.apiErrors.length;

    return {
      dataFileErrors,
      trackErrors,
      apiErrors: [...this.state.apiErrors], // Copy array
      lastSuccessfulFetch: this.state.lastSuccessfulFetch,
      totalErrors,
      generatedAt: new Date(),
    };
  }

  /**
   * Get current error state
   */
  getState(): Readonly<ErrorTrackingState> {
    return {
      dataFileErrors: new Map(this.state.dataFileErrors),
      trackErrors: new Map(this.state.trackErrors),
      apiErrors: [...this.state.apiErrors],
      lastSuccessfulFetch: this.state.lastSuccessfulFetch,
    };
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.state = {
      dataFileErrors: new Map(),
      trackErrors: new Map(),
      apiErrors: [],
      lastSuccessfulFetch: this.state.lastSuccessfulFetch, // Keep last successful fetch
    };
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return (
      this.state.dataFileErrors.size > 0 ||
      this.state.trackErrors.size > 0 ||
      this.state.apiErrors.length > 0
    );
  }
}

