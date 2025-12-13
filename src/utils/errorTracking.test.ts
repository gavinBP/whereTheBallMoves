import { ErrorTracker } from './errorTracking';
import type { BalloonDataCollection, BalloonDataResult } from '../types/balloon';
import type { TrackReconstructionResult } from '../types/track';

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    tracker = new ErrorTracker();
  });

  describe('Data File Errors', () => {
    it('should record data file errors', () => {
      tracker.recordDataFileError(5, 'Network error', 2);
      const report = tracker.generateErrorReport();

      expect(report.dataFileErrors).toHaveLength(1);
      expect(report.dataFileErrors[0].hour).toBe(5);
      expect(report.dataFileErrors[0].error).toBe('Network error');
      expect(report.dataFileErrors[0].retryCount).toBe(2);
    });

    it('should clear data file errors', () => {
      tracker.recordDataFileError(5, 'Network error');
      tracker.clearDataFileError(5);
      const report = tracker.generateErrorReport();

      expect(report.dataFileErrors).toHaveLength(0);
    });

    it('should track multiple data file errors', () => {
      tracker.recordDataFileError(5, 'Error 1');
      tracker.recordDataFileError(10, 'Error 2');
      tracker.recordDataFileError(15, 'Error 3');
      const report = tracker.generateErrorReport();

      expect(report.dataFileErrors).toHaveLength(3);
    });
  });

  describe('Track Errors', () => {
    it('should record track errors', () => {
      tracker.recordTrackError('track-1', 'incomplete', 'Track has only 1 point');
      const report = tracker.generateErrorReport();

      expect(report.trackErrors).toHaveLength(1);
      expect(report.trackErrors[0].trackId).toBe('track-1');
      expect(report.trackErrors[0].issue).toBe('incomplete');
      expect(report.trackErrors[0].description).toBe('Track has only 1 point');
    });

    it('should clear track errors', () => {
      tracker.recordTrackError('track-1', 'incomplete', 'Description');
      tracker.clearTrackError('track-1');
      const report = tracker.generateErrorReport();

      expect(report.trackErrors).toHaveLength(0);
    });

    it('should track multiple track errors', () => {
      tracker.recordTrackError('track-1', 'incomplete', 'Description 1');
      tracker.recordTrackError('track-2', 'missing_points', 'Description 2');
      const report = tracker.generateErrorReport();

      expect(report.trackErrors).toHaveLength(2);
    });
  });

  describe('API Errors', () => {
    it('should record API errors', () => {
      tracker.recordApiError('network', 'Connection failed', 'windborne-api', 1);
      const report = tracker.generateErrorReport();

      expect(report.apiErrors).toHaveLength(1);
      expect(report.apiErrors[0].type).toBe('network');
      expect(report.apiErrors[0].message).toBe('Connection failed');
      expect(report.apiErrors[0].endpoint).toBe('windborne-api');
      expect(report.apiErrors[0].retryCount).toBe(1);
    });

    it('should limit API errors to 50', () => {
      for (let i = 0; i < 60; i++) {
        tracker.recordApiError('network', `Error ${i}`);
      }
      const report = tracker.generateErrorReport();

      expect(report.apiErrors.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Successful Fetch', () => {
    it('should record successful fetch', () => {
      tracker.recordSuccessfulFetch();
      const report = tracker.generateErrorReport();

      expect(report.lastSuccessfulFetch).not.toBeNull();
      expect(report.lastSuccessfulFetch).toBeInstanceOf(Date);
    });
  });

  describe('Data Collection Analysis', () => {
    it('should analyze data collection and track failures', () => {
      const data: BalloonDataCollection = {
        results: [
          { hour: 0, data: [[40, -74, 10]], success: true, timestamp: new Date() },
          { hour: 1, data: null, success: false, error: 'Network error', timestamp: new Date() },
          { hour: 2, data: [[35, -120, 15]], success: true, timestamp: new Date() },
        ],
        successCount: 2,
        failureCount: 1,
        fetchedAt: new Date(),
      };

      tracker.analyzeDataCollection(data);
      const report = tracker.generateErrorReport();

      expect(report.dataFileErrors).toHaveLength(1);
      expect(report.dataFileErrors[0].hour).toBe(1);
      expect(report.lastSuccessfulFetch).not.toBeNull();
    });

    it('should clear errors for successful data files', () => {
      // Record an error first
      tracker.recordDataFileError(5, 'Previous error');

      const data: BalloonDataCollection = {
        results: [
          { hour: 5, data: [[40, -74, 10]], success: true, timestamp: new Date() },
        ],
        successCount: 1,
        failureCount: 0,
        fetchedAt: new Date(),
      };

      tracker.analyzeDataCollection(data);
      const report = tracker.generateErrorReport();

      // Error should be cleared
      expect(report.dataFileErrors).toHaveLength(0);
    });
  });

  describe('Track Reconstruction Analysis', () => {
    it('should analyze tracks and identify incomplete ones', () => {
      const tracks: TrackReconstructionResult = {
        tracks: [
          {
            trackId: 'track-1',
            points: [
              {
                latitude: 40,
                longitude: -74,
                altitudeKm: 10,
                timestamp: new Date(),
                hour: 0,
              },
            ],
            startTime: new Date(),
            endTime: new Date(),
            durationHours: 1,
            totalDistanceKm: 0,
            averageSpeedKmh: 0,
            minAltitudeKm: 10,
            maxAltitudeKm: 10,
            altitudeRangeKm: 0,
          },
          {
            trackId: 'track-2',
            points: [
              {
                latitude: 40,
                longitude: -74,
                altitudeKm: 10,
                timestamp: new Date(),
                hour: 0,
              },
              {
                latitude: 41,
                longitude: -75,
                altitudeKm: 12,
                timestamp: new Date(),
                hour: 1,
              },
            ],
            startTime: new Date(),
            endTime: new Date(),
            durationHours: 1,
            totalDistanceKm: 100,
            averageSpeedKmh: 100,
            minAltitudeKm: 10,
            maxAltitudeKm: 12,
            altitudeRangeKm: 2,
          },
        ],
        unmatchedPoints: [],
        matchStatistics: {
          totalMatches: 0,
          averageDistanceKm: 0,
          averageConfidence: 0,
        },
      };

      tracker.analyzeTrackReconstruction(tracks);
      const report = tracker.generateErrorReport();

      expect(report.trackErrors).toHaveLength(1);
      expect(report.trackErrors[0].trackId).toBe('track-1');
      expect(report.trackErrors[0].issue).toBe('incomplete');
    });

    it('should clear errors for tracks that become complete', () => {
      // Record an error first
      tracker.recordTrackError('track-1', 'incomplete', 'Previous error');

      const tracks: TrackReconstructionResult = {
        tracks: [
          {
            trackId: 'track-1',
            points: [
              {
                latitude: 40,
                longitude: -74,
                altitudeKm: 10,
                timestamp: new Date(),
                hour: 0,
              },
              {
                latitude: 41,
                longitude: -75,
                altitudeKm: 12,
                timestamp: new Date(),
                hour: 1,
              },
            ],
            startTime: new Date(),
            endTime: new Date(),
            durationHours: 1,
            totalDistanceKm: 100,
            averageSpeedKmh: 100,
            minAltitudeKm: 10,
            maxAltitudeKm: 12,
            altitudeRangeKm: 2,
          },
        ],
        unmatchedPoints: [],
        matchStatistics: {
          totalMatches: 0,
          averageDistanceKm: 0,
          averageConfidence: 0,
        },
      };

      tracker.analyzeTrackReconstruction(tracks);
      const report = tracker.generateErrorReport();

      // Error should be cleared
      expect(report.trackErrors).toHaveLength(0);
    });
  });

  describe('Error Report Generation', () => {
    it('should generate complete error report', () => {
      tracker.recordDataFileError(5, 'Error 1');
      tracker.recordTrackError('track-1', 'incomplete', 'Description');
      tracker.recordApiError('network', 'Network error');
      tracker.recordSuccessfulFetch();

      const report = tracker.generateErrorReport();

      expect(report.dataFileErrors).toHaveLength(1);
      expect(report.trackErrors).toHaveLength(1);
      expect(report.apiErrors).toHaveLength(1);
      expect(report.totalErrors).toBe(3);
      expect(report.lastSuccessfulFetch).not.toBeNull();
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should calculate total errors correctly', () => {
      tracker.recordDataFileError(1, 'Error 1');
      tracker.recordDataFileError(2, 'Error 2');
      tracker.recordTrackError('track-1', 'incomplete', 'Description');
      tracker.recordApiError('network', 'Error 1');
      tracker.recordApiError('timeout', 'Error 2');

      const report = tracker.generateErrorReport();

      expect(report.totalErrors).toBe(5);
    });
  });

  describe('Error State Management', () => {
    it('should check if there are errors', () => {
      expect(tracker.hasErrors()).toBe(false);

      tracker.recordDataFileError(5, 'Error');
      expect(tracker.hasErrors()).toBe(true);
    });

    it('should clear all errors', () => {
      tracker.recordDataFileError(5, 'Error');
      tracker.recordTrackError('track-1', 'incomplete', 'Description');
      tracker.recordApiError('network', 'Error');
      tracker.recordSuccessfulFetch();

      const beforeClear = tracker.getState();
      expect(beforeClear.dataFileErrors.size).toBe(1);
      expect(beforeClear.trackErrors.size).toBe(1);
      expect(beforeClear.apiErrors.length).toBe(1);

      tracker.clearAll();

      const afterClear = tracker.getState();
      expect(afterClear.dataFileErrors.size).toBe(0);
      expect(afterClear.trackErrors.size).toBe(0);
      expect(afterClear.apiErrors.length).toBe(0);
      // Should preserve last successful fetch
      expect(afterClear.lastSuccessfulFetch).not.toBeNull();
    });
  });
});

