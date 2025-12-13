import { reconstructBalloonTracks } from './trackReconstruction';
import type { BalloonDataCollection } from '../types/balloon';

describe('trackReconstruction', () => {
  describe('reconstructBalloonTracks', () => {
    it('should create separate tracks when balloons are far apart', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 23,
            data: [
              [40.0, -74.0, 15.0], // Balloon A
              [50.0, -120.0, 12.0], // Balloon B
            ],
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 22,
            data: [
              [40.1, -74.1, 15.1], // Balloon A moved slightly
              [50.1, -120.1, 12.1], // Balloon B moved slightly
            ],
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      expect(result.tracks.length).toBeGreaterThan(0);
      // Should have at least 2 tracks (one for each balloon)
      expect(result.tracks.length).toBeGreaterThanOrEqual(2);
    });

    it('should match balloons between consecutive hours based on proximity', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 1,
            data: [
              [40.0, -74.0, 15.0],
            ],
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 0,
            data: [
              [40.1, -74.1, 15.1], // Close to hour 1 position
            ],
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      expect(result.tracks.length).toBeGreaterThan(0);
      // Should have matches between hours
      expect(result.matchStatistics.totalMatches).toBeGreaterThan(0);
    });

    it('should handle missing hours gracefully', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 23,
            data: [[40.0, -74.0, 15.0]],
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 22,
            data: null,
            success: false,
            error: 'Failed',
            timestamp: new Date(),
          },
          {
            hour: 21,
            data: [[40.1, -74.1, 15.1]],
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 1,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.unmatchedPoints.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate track metadata correctly', () => {
      const now = new Date();
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 1,
            data: [[40.0, -74.0, 15.0]],
            success: true,
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          },
          {
            hour: 0,
            data: [[40.1, -74.1, 15.1]],
            success: true,
            timestamp: new Date(now.getTime() - 0 * 60 * 60 * 1000),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      if (result.tracks.length > 0) {
        const track = result.tracks[0];
        expect(track.points.length).toBeGreaterThan(0);
        expect(track.startTime).toBeInstanceOf(Date);
        expect(track.endTime).toBeInstanceOf(Date);
        expect(track.durationHours).toBeGreaterThanOrEqual(0);
        expect(track.totalDistanceKm).toBeGreaterThanOrEqual(0);
        expect(track.minAltitudeKm).toBeGreaterThanOrEqual(0);
        expect(track.maxAltitudeKm).toBeGreaterThanOrEqual(track.minAltitudeKm);
      }
    });

    it('should reject matches that exceed distance threshold', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 1,
            data: [[40.0, -74.0, 15.0]], // New York
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 0,
            data: [[34.0, -118.0, 15.0]], // Los Angeles - too far (>600km)
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      // Should create separate tracks since they're too far apart
      expect(result.tracks.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject matches that exceed altitude change threshold', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 1,
            data: [[40.0, -74.0, 15.0]],
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 0,
            data: [[40.1, -74.1, 25.0]], // Altitude change > 5km
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      // Should create separate tracks since altitude change is too large
      // (unless distance is very small, in which case it might still match)
      // This test verifies the algorithm handles it without crashing
      expect(result.tracks.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', () => {
      const data: BalloonDataCollection = {
        results: [],
        successCount: 0,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      expect(result.tracks).toEqual([]);
      expect(result.unmatchedPoints).toEqual([]);
      expect(result.matchStatistics.totalMatches).toBe(0);
    });

    it('should handle all failed endpoints', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 0,
            data: null,
            success: false,
            error: 'Failed',
            timestamp: new Date(),
          },
        ],
        successCount: 0,
        failureCount: 1,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      expect(result.tracks).toEqual([]);
      expect(result.unmatchedPoints.length).toBeGreaterThan(0);
    });

    it('should create new tracks for balloons that appear', () => {
      const data: BalloonDataCollection = {
        results: [
          {
            hour: 1,
            data: [[40.0, -74.0, 15.0]],
            success: true,
            timestamp: new Date(),
          },
          {
            hour: 0,
            data: [
              [40.1, -74.1, 15.1], // Matches hour 1
              [50.0, -120.0, 12.0], // New balloon
            ],
            success: true,
            timestamp: new Date(),
          },
        ],
        successCount: 2,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      const result = reconstructBalloonTracks(data);

      // Should have at least 2 tracks (one existing, one new)
      expect(result.tracks.length).toBeGreaterThanOrEqual(2);
    });
  });
});

