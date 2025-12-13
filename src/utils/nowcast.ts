import type { TrackPoint, BalloonTrack } from '../types/track';
import type { WindDataPoint } from '../types/wind';
import { calculateDistanceKm } from './distance';

/**
 * Nowcast prediction result
 */
export interface NowcastPrediction {
  currentPosition: TrackPoint;
  predictedPosition: {
    latitude: number;
    longitude: number;
    altitudeKm: number;
  };
  windVector: WindDataPoint | null;
  predictedDistanceKm: number; // Distance from current to predicted position
  uncertaintyRadiusKm: number; // Estimated uncertainty radius
  confidence: number; // 0-1, higher is more confident
}

/**
 * Calculate 1-hour nowcast prediction for a balloon
 * 
 * @param track Balloon track
 * @param windData Current wind data at balloon's position and altitude
 * @returns Prediction result
 */
export function calculateNowcast(
  track: BalloonTrack,
  windData: WindDataPoint | null
): NowcastPrediction | null {
  if (track.points.length === 0) {
    return null;
  }

  const currentPoint = track.points[track.points.length - 1];

  if (!windData) {
    // No wind data available - use simple extrapolation based on recent movement
    if (track.points.length < 2) {
      return null;
    }

    const prevPoint = track.points[track.points.length - 2];
    const timeDiffHours =
      (currentPoint.timestamp.getTime() - prevPoint.timestamp.getTime()) /
      (1000 * 60 * 60);

    if (timeDiffHours === 0) {
      return null;
    }

    // Calculate velocity from last two points
    const distanceKm = calculateDistanceKm(
      { latitude: prevPoint.latitude, longitude: prevPoint.longitude },
      { latitude: currentPoint.latitude, longitude: currentPoint.longitude }
    );
    const velocityKmh = distanceKm / timeDiffHours;

    // Simple linear extrapolation (assume constant velocity)
    const heading = Math.atan2(
      currentPoint.longitude - prevPoint.longitude,
      currentPoint.latitude - prevPoint.latitude
    );

    const predictedLat =
      currentPoint.latitude +
      (Math.cos(heading) * velocityKmh * 1) / 111.0; // Approximate km per degree
    const predictedLon =
      currentPoint.longitude +
      (Math.sin(heading) * velocityKmh * 1) / (111.0 * Math.cos((currentPoint.latitude * Math.PI) / 180));

    return {
      currentPosition: currentPoint,
      predictedPosition: {
        latitude: predictedLat,
        longitude: predictedLon,
        altitudeKm: currentPoint.altitudeKm,
      },
      windVector: null,
      predictedDistanceKm: velocityKmh * 1, // Distance in 1 hour
      uncertaintyRadiusKm: velocityKmh * 0.3, // 30% uncertainty
      confidence: 0.5, // Lower confidence without wind data
    };
  }

  // Use wind data for prediction
  const windDirectionRad = (windData.windDirectionDeg * Math.PI) / 180;

  // Calculate wind displacement in 1 hour
  // Wind speed is in km/h, so distance in 1 hour = speed
  const windDistanceKm = windData.windSpeedKmh * 1; // Distance in 1 hour

  // Calculate displacement in lat/lon
  // Approximate: 1 degree latitude ≈ 111 km
  const latDisplacementKm = Math.cos(windDirectionRad) * windDistanceKm;
  const lonDisplacementKm = Math.sin(windDirectionRad) * windDistanceKm;

  const predictedLat = currentPoint.latitude + latDisplacementKm / 111.0;
  const predictedLon =
    currentPoint.longitude +
    lonDisplacementKm / (111.0 * Math.cos((currentPoint.latitude * Math.PI) / 180));

  // Calculate uncertainty based on wind variability
  // If we have historical wind data, we could calculate variability
  // For now, use a simple estimate: 20% of wind speed
  const uncertaintyRadiusKm = windData.windSpeedKmh * 0.2;

  // Confidence is higher if wind speed is reasonable (not too low, not too high)
  let confidence = 0.8;
  if (windData.windSpeedKmh < 5) {
    confidence = 0.6; // Low wind = less reliable
  } else if (windData.windSpeedKmh > 100) {
    confidence = 0.7; // Very high wind = more variable
  }

  return {
    currentPosition: currentPoint,
    predictedPosition: {
      latitude: predictedLat,
      longitude: predictedLon,
      altitudeKm: currentPoint.altitudeKm, // Assume constant altitude
    },
    windVector: windData,
    predictedDistanceKm: windDistanceKm,
    uncertaintyRadiusKm,
    confidence,
  };
}

/**
 * Calculate uncertainty for nowcast based on wind variability
 * (This would ideally use historical wind data to calculate actual variability)
 * 
 * @param windData Current wind data
 * @param historicalWindData Optional historical wind data for variability calculation
 * @returns Uncertainty radius in km
 */
export function calculateNowcastUncertainty(
  windData: WindDataPoint,
  historicalWindData?: WindDataPoint[]
): number {
  if (historicalWindData && historicalWindData.length > 1) {
    // Calculate standard deviation of wind speed
    const speeds = historicalWindData.map((d) => d.windSpeedKmh);
    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance =
      speeds.reduce((sum, speed) => sum + Math.pow(speed - mean, 2), 0) /
      speeds.length;
    const stdDev = Math.sqrt(variance);

    // Uncertainty is proportional to variability
    return stdDev * 0.5; // 0.5 hour of variability
  }

  // Default: 20% of current wind speed
  return windData.windSpeedKmh * 0.2;
}

