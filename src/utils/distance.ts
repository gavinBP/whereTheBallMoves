import type { ParsedBalloonPosition } from '../types/balloon';

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula
 * @param point1 First point (latitude, longitude)
 * @param point2 Second point (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance between two balloon positions (including altitude)
 * Returns only horizontal distance (ignores altitude difference)
 */
export function calculateBalloonDistanceKm(
  pos1: ParsedBalloonPosition,
  pos2: ParsedBalloonPosition
): number {
  return calculateDistanceKm(
    { latitude: pos1.latitude, longitude: pos1.longitude },
    { latitude: pos2.latitude, longitude: pos2.longitude }
  );
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the altitude difference between two positions
 */
export function calculateAltitudeDeltaKm(
  pos1: ParsedBalloonPosition,
  pos2: ParsedBalloonPosition
): number {
  return Math.abs(pos2.altitudeKm - pos1.altitudeKm);
}

