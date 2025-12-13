/**
 * Error tracking and reporting types
 */

export interface DataFileError {
  hour: number; // 0-23
  error: string;
  timestamp: Date;
  retryCount?: number;
}

export interface TrackError {
  trackId: string;
  issue: 'incomplete' | 'missing_points' | 'no_wind_data' | 'reconstruction_failed';
  description: string;
  timestamp: Date;
}

export interface ApiError {
  type: 'network' | 'rate_limit' | 'timeout' | 'parse' | 'unknown';
  message: string;
  timestamp: Date;
  endpoint?: string;
  retryCount?: number;
}

export interface ErrorReport {
  dataFileErrors: DataFileError[];
  trackErrors: TrackError[];
  apiErrors: ApiError[];
  lastSuccessfulFetch: Date | null;
  totalErrors: number;
  generatedAt: Date;
}

export interface ErrorTrackingState {
  dataFileErrors: Map<number, DataFileError>; // Key: hour
  trackErrors: Map<string, TrackError>; // Key: trackId
  apiErrors: ApiError[];
  lastSuccessfulFetch: Date | null;
}

