import {
  calculateDistanceKm,
  calculateBalloonDistanceKm,
  calculateAltitudeDeltaKm,
} from './distance';
import type { ParsedBalloonPosition } from '../types/balloon';

describe('distance utilities', () => {
  describe('calculateDistanceKm', () => {
    it('should calculate distance between two points', () => {
      // New York to Los Angeles (approximately 3936 km)
      const ny = { latitude: 40.7128, longitude: -74.006 };
      const la = { latitude: 34.0522, longitude: -118.2437 };
      const distance = calculateDistanceKm(ny, la);
      expect(distance).toBeCloseTo(3936, 0);
    });

    it('should return 0 for identical points', () => {
      const point = { latitude: 40.7128, longitude: -74.006 };
      expect(calculateDistanceKm(point, point)).toBe(0);
    });

    it('should handle points on opposite sides of the globe', () => {
      const point1 = { latitude: 0, longitude: 0 };
      const point2 = { latitude: 0, longitude: 180 };
      const distance = calculateDistanceKm(point1, point2);
      // Should be approximately half the Earth's circumference
      expect(distance).toBeCloseTo(20015, 0);
    });
  });

  describe('calculateBalloonDistanceKm', () => {
    it('should calculate horizontal distance ignoring altitude', () => {
      const pos1: ParsedBalloonPosition = {
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 10,
      };
      const pos2: ParsedBalloonPosition = {
        latitude: 34.0522,
        longitude: -118.2437,
        altitudeKm: 20, // Different altitude, but distance should be same
      };
      const distance = calculateBalloonDistanceKm(pos1, pos2);
      expect(distance).toBeCloseTo(3936, 0);
    });
  });

  describe('calculateAltitudeDeltaKm', () => {
    it('should calculate absolute altitude difference', () => {
      const pos1: ParsedBalloonPosition = {
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 10,
      };
      const pos2: ParsedBalloonPosition = {
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 15,
      };
      expect(calculateAltitudeDeltaKm(pos1, pos2)).toBe(5);
    });

    it('should return absolute value', () => {
      const pos1: ParsedBalloonPosition = {
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 15,
      };
      const pos2: ParsedBalloonPosition = {
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 10,
      };
      expect(calculateAltitudeDeltaKm(pos1, pos2)).toBe(5);
    });
  });
});

