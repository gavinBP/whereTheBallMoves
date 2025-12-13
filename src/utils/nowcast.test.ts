import { calculateNowcast, calculateNowcastUncertainty } from './nowcast';
import type { BalloonTrack, TrackPoint } from '../types/track';
import type { WindDataPoint } from '../types/wind';

describe('nowcast', () => {
  const createTrackPoint = (
    lat: number,
    lon: number,
    alt: number,
    hoursAgo: number
  ): TrackPoint => {
    const now = new Date();
    return {
      latitude: lat,
      longitude: lon,
      altitudeKm: alt,
      timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
      hour: hoursAgo,
    };
  };

  const createWindData = (
    speedKmh: number,
    directionDeg: number
  ): WindDataPoint => ({
    latitude: 40.7128,
    longitude: -74.006,
    pressureLevelHpa: 500,
    altitudeKm: 5.5,
    windSpeedKmh: speedKmh,
    windDirectionDeg: directionDeg,
    timestamp: new Date(),
  });

  describe('calculateNowcast', () => {
    it('should return null for empty track', () => {
      const track: BalloonTrack = {
        trackId: 'test-1',
        points: [],
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 0,
        totalDistanceKm: 0,
        averageSpeedKmh: 0,
        minAltitudeKm: 0,
        maxAltitudeKm: 0,
        altitudeRangeKm: 0,
      };

      const result = calculateNowcast(track, null);
      expect(result).toBeNull();
    });

    it('should predict position using wind data', () => {
      const track: BalloonTrack = {
        trackId: 'test-1',
        points: [createTrackPoint(40.7128, -74.006, 5.5, 1)],
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 0,
        totalDistanceKm: 0,
        averageSpeedKmh: 0,
        minAltitudeKm: 5.5,
        maxAltitudeKm: 5.5,
        altitudeRangeKm: 0,
      };

      const windData = createWindData(50, 270); // 50 km/h, westerly wind

      const result = calculateNowcast(track, windData);

      expect(result).not.toBeNull();
      expect(result?.windVector).toEqual(windData);
      expect(result?.predictedDistanceKm).toBeCloseTo(50, 1); // 50 km/h * 1 hour
      expect(result?.confidence).toBeGreaterThan(0.5);
    });

    it('should use velocity extrapolation when wind data is unavailable', () => {
      const track: BalloonTrack = {
        trackId: 'test-1',
        points: [
          createTrackPoint(40.7128, -74.006, 5.5, 2), // 2 hours ago
          createTrackPoint(40.7228, -74.016, 5.5, 1), // 1 hour ago (moved ~1.4 km)
        ],
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 1,
        totalDistanceKm: 1.4,
        averageSpeedKmh: 1.4,
        minAltitudeKm: 5.5,
        maxAltitudeKm: 5.5,
        altitudeRangeKm: 0,
      };

      const result = calculateNowcast(track, null);

      expect(result).not.toBeNull();
      expect(result?.windVector).toBeNull();
      expect(result?.predictedDistanceKm).toBeCloseTo(1.4, 0.5); // Similar to last hour's movement
      expect(result?.confidence).toBe(0.5); // Lower confidence without wind
    });

    it('should return null if track has only one point and no wind data', () => {
      const track: BalloonTrack = {
        trackId: 'test-1',
        points: [createTrackPoint(40.7128, -74.006, 5.5, 1)],
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 0,
        totalDistanceKm: 0,
        averageSpeedKmh: 0,
        minAltitudeKm: 5.5,
        maxAltitudeKm: 5.5,
        altitudeRangeKm: 0,
      };

      const result = calculateNowcast(track, null);
      expect(result).toBeNull();
    });

    it('should calculate uncertainty radius', () => {
      const track: BalloonTrack = {
        trackId: 'test-1',
        points: [createTrackPoint(40.7128, -74.006, 5.5, 1)],
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 0,
        totalDistanceKm: 0,
        averageSpeedKmh: 0,
        minAltitudeKm: 5.5,
        maxAltitudeKm: 5.5,
        altitudeRangeKm: 0,
      };

      const windData = createWindData(50, 270);
      const result = calculateNowcast(track, windData);

      expect(result).not.toBeNull();
      expect(result?.uncertaintyRadiusKm).toBeGreaterThan(0);
      expect(result?.uncertaintyRadiusKm).toBeCloseTo(10, 1); // 20% of 50 km/h
    });
  });

  describe('calculateNowcastUncertainty', () => {
    it('should calculate uncertainty from historical wind data', () => {
      const windData = createWindData(50, 270);
      const historicalData: WindDataPoint[] = [
        createWindData(45, 270),
        createWindData(50, 270),
        createWindData(55, 270),
      ];

      const uncertainty = calculateNowcastUncertainty(windData, historicalData);
      expect(uncertainty).toBeGreaterThan(0);
    });

    it('should use default uncertainty when no historical data', () => {
      const windData = createWindData(50, 270);
      const uncertainty = calculateNowcastUncertainty(windData);

      expect(uncertainty).toBeCloseTo(10, 1); // 20% of 50 km/h
    });
  });
});

