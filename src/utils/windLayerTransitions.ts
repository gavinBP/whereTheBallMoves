import type { BalloonTrack, TrackPoint } from '../types/track';
import type { WindDataPoint } from '../types/wind';
import { getWindDataAtTime } from '../services/openMeteoApi';
import type { WindDataSeries } from '../types/wind';

/**
 * Detect when a balloon transitions between different wind layers
 * (based on significant changes in wind direction or speed)
 */
export interface WindLayerTransition {
  point: TrackPoint;
  previousWind: WindDataPoint | null;
  currentWind: WindDataPoint | null;
  transitionType: 'direction' | 'speed' | 'both' | 'none';
  directionChange: number; // Degrees
  speedChange: number; // km/h
}

/**
 * Detect wind layer transitions in a track
 * 
 * @param track Balloon track
 * @param windDataSeries Wind data series for the track
 * @returns Array of detected transitions
 */
export function detectWindLayerTransitions(
  track: BalloonTrack,
  windDataSeries: WindDataSeries
): WindLayerTransition[] {
  const transitions: WindLayerTransition[] = [];

  if (track.points.length < 2) {
    return transitions;
  }

  const DIRECTION_THRESHOLD = 30; // Degrees - significant direction change
  const SPEED_THRESHOLD = 10; // km/h - significant speed change

  let previousWind: WindDataPoint | null = null;

  for (let i = 0; i < track.points.length; i++) {
    const point = track.points[i];
    const currentWind = getWindDataAtTime(windDataSeries, point.timestamp);

    if (previousWind && currentWind) {
      const directionChange = Math.abs(
        currentWind.windDirectionDeg - previousWind.windDirectionDeg
      );
      // Normalize to 0-180 range
      const normalizedDirectionChange = Math.min(
        directionChange,
        360 - directionChange
      );
      const speedChange = Math.abs(
        currentWind.windSpeedKmh - previousWind.windSpeedKmh
      );

      if (
        normalizedDirectionChange > DIRECTION_THRESHOLD ||
        speedChange > SPEED_THRESHOLD
      ) {
        let transitionType: WindLayerTransition['transitionType'] = 'none';
        if (
          normalizedDirectionChange > DIRECTION_THRESHOLD &&
          speedChange > SPEED_THRESHOLD
        ) {
          transitionType = 'both';
        } else if (normalizedDirectionChange > DIRECTION_THRESHOLD) {
          transitionType = 'direction';
        } else if (speedChange > SPEED_THRESHOLD) {
          transitionType = 'speed';
        }

        transitions.push({
          point,
          previousWind,
          currentWind,
          transitionType,
          directionChange: normalizedDirectionChange,
          speedChange,
        });
      }
    }

    previousWind = currentWind;
  }

  return transitions;
}

/**
 * Count wind layer transitions in a track
 */
export function countWindLayerTransitions(
  track: BalloonTrack,
  windDataSeries: WindDataSeries
): number {
  return detectWindLayerTransitions(track, windDataSeries).length;
}

