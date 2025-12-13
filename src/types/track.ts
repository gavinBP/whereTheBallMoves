import type { ParsedBalloonPosition } from './balloon';

/**
 * A single point in a balloon track with timestamp
 */
export interface TrackPoint extends ParsedBalloonPosition {
  timestamp: Date;
  hour: number; // Hours ago (0 = current, 23 = 23 hours ago)
}

/**
 * A reconstructed balloon track
 */
export interface BalloonTrack {
  trackId: string;
  points: TrackPoint[];
  startTime: Date;
  endTime: Date;
  durationHours: number;
  totalDistanceKm: number;
  averageSpeedKmh: number;
  minAltitudeKm: number;
  maxAltitudeKm: number;
  altitudeRangeKm: number;
}

/**
 * Match result between two consecutive hours
 */
export interface TrackMatch {
  fromIndex: number; // Index in hour h-1
  toIndex: number; // Index in hour h
  distanceKm: number;
  altitudeDeltaKm: number;
  confidence: number; // 0-1, higher is better match
}

/**
 * Result of track reconstruction process
 */
export interface TrackReconstructionResult {
  tracks: BalloonTrack[];
  unmatchedPoints: {
    hour: number;
    indices: number[];
  }[];
  matchStatistics: {
    totalMatches: number;
    averageDistanceKm: number;
    averageConfidence: number;
  };
}

