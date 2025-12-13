import type {
  BalloonDataCollection,
  ParsedBalloonPosition,
} from '../types/balloon';
import { parseBalloonPosition } from '../services/windborneApi';
import type { TrackPoint, BalloonTrack, TrackMatch, TrackReconstructionResult } from '../types/track';
import {
  calculateBalloonDistanceKm,
  calculateAltitudeDeltaKm,
} from './distance';

// Configuration constants
const MAX_DISTANCE_KM_PER_HOUR = 600; // Maximum reasonable distance a balloon can travel in 1 hour
const MAX_ALTITUDE_DELTA_KM_PER_HOUR = 5; // Maximum reasonable altitude change in 1 hour

/**
 * Parse a snapshot into structured positions, filtering out invalid entries
 */
function parseSnapshot(
  snapshot: any[] | null
): ParsedBalloonPosition[] {
  if (!snapshot || !Array.isArray(snapshot)) {
    return [];
  }

  return snapshot
    .map((pos) => parseBalloonPosition(pos))
    .filter((pos): pos is ParsedBalloonPosition => pos !== null);
}

/**
 * Calculate match cost between two positions
 * Lower cost = better match
 */
function calculateMatchCost(
  pos1: ParsedBalloonPosition,
  pos2: ParsedBalloonPosition
): number {
  const distanceKm = calculateBalloonDistanceKm(pos1, pos2);
  const altitudeDeltaKm = calculateAltitudeDeltaKm(pos1, pos2);

  // Weighted cost: distance is primary factor, altitude change is secondary
  return distanceKm + altitudeDeltaKm * 10;
}

/**
 * Find best matches between two consecutive hours using greedy matching
 * Returns array of matches: [fromIndex, toIndex, cost]
 */
function findMatches(
  fromPositions: ParsedBalloonPosition[],
  toPositions: ParsedBalloonPosition[]
): TrackMatch[] {
  const matches: TrackMatch[] = [];
  const usedToIndices = new Set<number>();

  // Create all possible match candidates with costs
  const candidates: Array<{
    fromIndex: number;
    toIndex: number;
    cost: number;
    distanceKm: number;
    altitudeDeltaKm: number;
  }> = [];

  for (let i = 0; i < fromPositions.length; i++) {
    for (let j = 0; j < toPositions.length; j++) {
      const fromPos = fromPositions[i];
      const toPos = toPositions[j];
      const distanceKm = calculateBalloonDistanceKm(fromPos, toPos);
      const altitudeDeltaKm = calculateAltitudeDeltaKm(fromPos, toPos);

      // Apply gating: reject matches that exceed thresholds
      if (
        distanceKm > MAX_DISTANCE_KM_PER_HOUR ||
        altitudeDeltaKm > MAX_ALTITUDE_DELTA_KM_PER_HOUR
      ) {
        continue;
      }

      const cost = calculateMatchCost(fromPos, toPos);
      candidates.push({
        fromIndex: i,
        toIndex: j,
        cost,
        distanceKm,
        altitudeDeltaKm,
      });
    }
  }

  // Sort by cost (best matches first)
  candidates.sort((a, b) => a.cost - b.cost);

  // Greedy assignment: take best matches that don't conflict
  for (const candidate of candidates) {
    if (!usedToIndices.has(candidate.toIndex)) {
      matches.push({
        fromIndex: candidate.fromIndex,
        toIndex: candidate.toIndex,
        distanceKm: candidate.distanceKm,
        altitudeDeltaKm: candidate.altitudeDeltaKm,
        confidence: 1 - Math.min(candidate.cost / (MAX_DISTANCE_KM_PER_HOUR * 2), 1),
      });
      usedToIndices.add(candidate.toIndex);
    }
  }

  return matches;
}

/**
 * Reconstruct tracks from matched points across all hours
 */
function reconstructTracks(
  parsedSnapshots: Map<number, ParsedBalloonPosition[]>,
  allMatches: Map<number, TrackMatch[]>
): BalloonTrack[] {
  const tracks: Map<string, TrackPoint[]> = new Map();
  let nextTrackId = 1;

  // Process hours from oldest to newest (23 to 0)
  const hours = Array.from(parsedSnapshots.keys()).sort((a, b) => b - a);

  for (let i = 0; i < hours.length; i++) {
    const hour = hours[i];
    const positions = parsedSnapshots.get(hour) || [];

    if (i === 0) {
      // First hour: create new tracks for all positions
      for (let j = 0; j < positions.length; j++) {
        const trackId = `track-${nextTrackId++}`;
        const now = new Date();
        const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000);

        tracks.set(trackId, [
          {
            latitude: positions[j].latitude,
            longitude: positions[j].longitude,
            altitudeKm: positions[j].altitudeKm,
            timestamp,
            hour,
          },
        ]);
      }
    } else {
      // Subsequent hours: match to previous hour's tracks
      const prevHour = hours[i - 1];
      const matches = allMatches.get(prevHour) || [];

      // Map of toIndex (current hour) -> trackId
      const matchedToTracks = new Map<number, string>();

      for (const match of matches) {
        // Find which track contains the fromIndex point
        let matchedTrackId: string | null = null;
        for (const [trackId, points] of tracks.entries()) {
          const lastPoint = points[points.length - 1];
          if (lastPoint.hour === prevHour) {
            // This is a candidate - check if it matches the fromIndex
            // We need to track which position in prevHour corresponds to which track
            // For simplicity, we'll match based on position similarity
            const prevPositions = parsedSnapshots.get(prevHour) || [];
            if (match.fromIndex < prevPositions.length) {
              const prevPos = prevPositions[match.fromIndex];
              if (
                Math.abs(lastPoint.latitude - prevPos.latitude) < 0.001 &&
                Math.abs(lastPoint.longitude - prevPos.longitude) < 0.001
              ) {
                matchedTrackId = trackId;
                break;
              }
            }
          }
        }

        if (matchedTrackId) {
          // Add new point to existing track
          const track = tracks.get(matchedTrackId)!;
          const now = new Date();
          const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000);
          const newPos = positions[match.toIndex];

          track.push({
            latitude: newPos.latitude,
            longitude: newPos.longitude,
            altitudeKm: newPos.altitudeKm,
            timestamp,
            hour,
          });

          matchedToTracks.set(match.toIndex, matchedTrackId);
        }
      }

      // Create new tracks for unmatched positions in current hour
      for (let j = 0; j < positions.length; j++) {
        if (!matchedToTracks.has(j)) {
          const trackId = `track-${nextTrackId++}`;
          const now = new Date();
          const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000);

          tracks.set(trackId, [
            {
              latitude: positions[j].latitude,
              longitude: positions[j].longitude,
              altitudeKm: positions[j].altitudeKm,
              timestamp,
              hour,
            },
          ]);
        }
      }
    }
  }

  // Convert track points to BalloonTrack objects with metadata
  const resultTracks: BalloonTrack[] = [];

  for (const [trackId, points] of tracks.entries()) {
    if (points.length === 0) continue;

    // Sort points by timestamp (oldest first)
    points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const startTime = points[0].timestamp;
    const endTime = points[points.length - 1].timestamp;
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Calculate total distance
    let totalDistanceKm = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistanceKm += calculateBalloonDistanceKm(points[i - 1], points[i]);
    }

    const averageSpeedKmh =
      durationHours > 0 ? totalDistanceKm / durationHours : 0;

    const altitudes = points.map((p) => p.altitudeKm);
    const minAltitudeKm = Math.min(...altitudes);
    const maxAltitudeKm = Math.max(...altitudes);
    const altitudeRangeKm = maxAltitudeKm - minAltitudeKm;

    resultTracks.push({
      trackId,
      points,
      startTime,
      endTime,
      durationHours,
      totalDistanceKm,
      averageSpeedKmh,
      minAltitudeKm,
      maxAltitudeKm,
      altitudeRangeKm,
    });
  }

  return resultTracks;
}

/**
 * Main function to reconstruct balloon tracks from raw API data
 */
export function reconstructBalloonTracks(
  data: BalloonDataCollection
): TrackReconstructionResult {
  // Parse all successful snapshots
  const parsedSnapshots = new Map<number, ParsedBalloonPosition[]>();
  const unmatchedHours: number[] = [];

  for (const result of data.results) {
    if (result.success && result.data) {
      const parsed = parseSnapshot(result.data);
      if (parsed.length > 0) {
        parsedSnapshots.set(result.hour, parsed);
      } else {
        unmatchedHours.push(result.hour);
      }
    } else {
      unmatchedHours.push(result.hour);
    }
  }

  // Find matches between consecutive hours
  const allMatches = new Map<number, TrackMatch[]>();
  const hours = Array.from(parsedSnapshots.keys()).sort((a, b) => b - a);

  for (let i = 1; i < hours.length; i++) {
    const prevHour = hours[i - 1];
    const currentHour = hours[i];

    const prevPositions = parsedSnapshots.get(prevHour) || [];
    const currentPositions = parsedSnapshots.get(currentHour) || [];

    if (prevPositions.length > 0 && currentPositions.length > 0) {
      const matches = findMatches(prevPositions, currentPositions);
      allMatches.set(prevHour, matches);
    }
  }

  // Reconstruct tracks
  const tracks = reconstructTracks(parsedSnapshots, allMatches);

  // Calculate match statistics
  let totalMatches = 0;
  let totalDistance = 0;
  let totalConfidence = 0;

  for (const matches of allMatches.values()) {
    totalMatches += matches.length;
    for (const match of matches) {
      totalDistance += match.distanceKm;
      totalConfidence += match.confidence;
    }
  }

  const averageDistanceKm =
    totalMatches > 0 ? totalDistance / totalMatches : 0;
  const averageConfidence =
    totalMatches > 0 ? totalConfidence / totalMatches : 0;

  // Find unmatched points
  const unmatchedPoints: Array<{ hour: number; indices: number[] }> = [];
  for (const hour of unmatchedHours) {
    unmatchedPoints.push({ hour, indices: [] });
  }

  return {
    tracks,
    unmatchedPoints,
    matchStatistics: {
      totalMatches,
      averageDistanceKm,
      averageConfidence,
    },
  };
}

