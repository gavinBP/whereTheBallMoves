/**
 * Represents a single balloon position from the WindBorne API
 * Format: [latitude, longitude, altitude_km]
 */
export type BalloonPosition = [number, number, number];

/**
 * Raw data from a single WindBorne API endpoint (hour snapshot)
 * Array of balloon positions without identifiers
 */
export type BalloonSnapshot = BalloonPosition[];

/**
 * Parsed balloon position with explicit fields
 */
export interface ParsedBalloonPosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
}

/**
 * Result of fetching a single endpoint
 */
export interface BalloonDataResult {
  hour: number;
  data: BalloonSnapshot | null;
  success: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Result of fetching all 24 endpoints
 */
export interface BalloonDataCollection {
  results: BalloonDataResult[];
  successCount: number;
  failureCount: number;
  fetchedAt: Date;
}

