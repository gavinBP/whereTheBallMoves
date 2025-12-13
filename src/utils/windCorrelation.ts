import type { TrackPoint, BalloonTrack } from '../types/track';
import type { WindDataPoint, WindDataSeries } from '../types/wind';
import { getWindDataAtTime } from '../services/openMeteoApi';

/**
 * Correlate wind data with a balloon track point
 */
export interface WindCorrelation {
  trackPoint: TrackPoint;
  windData: WindDataPoint | null;
  windAvailable: boolean;
}

/**
 * Correlate wind vectors with balloon positions at corresponding timestamps
 * 
 * @param track Balloon track
 * @param windDataSeries Wind data series for the track's location
 * @returns Array of correlations between track points and wind data
 */
export function correlateWindWithTrack(
  track: BalloonTrack,
  windDataSeries: WindDataSeries
): WindCorrelation[] {
  return track.points.map((point) => {
    const windData = getWindDataAtTime(windDataSeries, point.timestamp);
    return {
      trackPoint: point,
      windData,
      windAvailable: windData !== null,
    };
  });
}

/**
 * Calculate the angle difference between balloon heading and wind direction
 * 
 * @param balloonHeadingDeg Balloon heading in degrees (0-360)
 * @param windDirectionDeg Wind direction in degrees (0-360)
 * @returns Angle difference in degrees (-180 to 180, positive = wind to the right)
 */
export function calculateHeadingWindAngle(
  balloonHeadingDeg: number,
  windDirectionDeg: number
): number {
  let diff = windDirectionDeg - balloonHeadingDeg;
  
  // Normalize to -180 to 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  
  return diff;
}

/**
 * Calculate balloon heading from two consecutive track points
 * 
 * @param point1 First point
 * @param point2 Second point
 * @returns Heading in degrees (0-360, where 0 is North)
 */
export function calculateBalloonHeading(
  point1: TrackPoint,
  point2: TrackPoint
): number {
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const heading = Math.atan2(y, x);
  const headingDeg = (heading * 180) / Math.PI;

  // Normalize to 0-360
  return (headingDeg + 360) % 360;
}

