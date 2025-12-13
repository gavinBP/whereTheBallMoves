import { render, screen } from '@testing-library/react';
import { DetailsPanel } from './DetailsPanel';
import type { BalloonTrack, TrackPoint } from '../../types/track';
import type { WindDataPoint, WindDataSeries } from '../../types/wind';
import type { NowcastPrediction } from '../../utils/nowcast';

// Mock the wind layer transitions utility
jest.mock('../../utils/windLayerTransitions', () => ({
  countWindLayerTransitions: jest.fn(() => 3),
}));

describe('DetailsPanel', () => {
  const mockTrack: BalloonTrack = {
    trackId: 'track-1',
    points: [
      {
        latitude: 40.7128,
        longitude: -74.0060,
        altitudeKm: 10,
        timestamp: new Date('2024-01-01T12:00:00Z'),
        hour: 0,
      },
    ],
    startTime: new Date('2024-01-01T00:00:00Z'),
    endTime: new Date('2024-01-01T12:00:00Z'),
    durationHours: 12,
    totalDistanceKm: 500,
    averageSpeedKmh: 41.67,
    minAltitudeKm: 5,
    maxAltitudeKm: 15,
    altitudeRangeKm: 10,
  };

  const mockPoint: TrackPoint = {
    latitude: 40.7128,
    longitude: -74.0060,
    altitudeKm: 10,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    hour: 0,
  };

  const mockWindData: WindDataPoint = {
    latitude: 40.7128,
    longitude: -74.0060,
    altitudeKm: 10,
    pressureLevelHpa: 250,
    windSpeedKmh: 50,
    windDirectionDeg: 180,
    timestamp: new Date('2024-01-01T12:00:00Z'),
  };

  const mockWindDataSeries: WindDataSeries = {
    latitude: 40.7128,
    longitude: -74.0060,
    pressureLevelHpa: 250,
    altitudeKm: 10,
    dataPoints: [mockWindData],
    startTime: new Date('2024-01-01T00:00:00Z'),
    endTime: new Date('2024-01-01T12:00:00Z'),
  };

  const mockNowcast: NowcastPrediction = {
    currentPosition: mockPoint,
    predictedPosition: {
      latitude: 40.8,
      longitude: -74.1,
      altitudeKm: 10,
    },
    windVector: mockWindData,
    predictedDistanceKm: 100,
    uncertaintyRadiusKm: 20,
    confidence: 0.8,
  };

  it('renders placeholder message when no track is selected', () => {
    render(
      <DetailsPanel
        track={null}
        currentPoint={null}
        windData={null}
        windDataSeries={null}
        nowcast={null}
      />
    );

    expect(screen.getByText(/Select a balloon track to view details/i)).toBeInTheDocument();
  });

  it('renders track information when track is provided', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={null}
        windDataSeries={null}
        nowcast={null}
      />
    );

    expect(screen.getByText('track-1')).toBeInTheDocument();
    expect(screen.getByText(/Track Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Distance/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Speed/i)).toBeInTheDocument();
  });

  it('renders current position when provided', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={null}
        windDataSeries={null}
        nowcast={null}
      />
    );

    expect(screen.getByText(/Current Position/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Latitude/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Longitude/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Altitude/i).length).toBeGreaterThan(0);
  });

  it('renders wind data when provided', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={mockWindData}
        windDataSeries={mockWindDataSeries}
        nowcast={null}
      />
    );

    expect(screen.getByText(/Wind Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind Speed/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind Direction/i)).toBeInTheDocument();
    expect(screen.getByText(/Pressure Level/i)).toBeInTheDocument();
  });

  it('renders nowcast prediction when provided', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={mockWindData}
        windDataSeries={mockWindDataSeries}
        nowcast={mockNowcast}
      />
    );

    expect(screen.getByText(/1-Hour Nowcast/i)).toBeInTheDocument();
    expect(screen.getByText(/Predicted Lat/i)).toBeInTheDocument();
    expect(screen.getByText(/Predicted Lon/i)).toBeInTheDocument();
    expect(screen.getByText(/Predicted Distance/i)).toBeInTheDocument();
    expect(screen.getByText(/Uncertainty/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence/i)).toBeInTheDocument();
  });

  it('renders track statistics correctly', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={null}
        windDataSeries={null}
        nowcast={null}
      />
    );

    expect(screen.getByText(/500.00 km/)).toBeInTheDocument(); // Total Distance
    expect(screen.getByText(/41.67 km\/h/)).toBeInTheDocument(); // Average Speed
    expect(screen.getByText(/12.00 hours/)).toBeInTheDocument(); // Duration
  });

  it('renders time range correctly', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={null}
        windDataSeries={null}
        nowcast={null}
      />
    );

    expect(screen.getByText(/Time Range/i)).toBeInTheDocument();
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
    expect(screen.getByText(/End/i)).toBeInTheDocument();
  });

  it('displays wind layer transitions when wind data series is provided', () => {
    render(
      <DetailsPanel
        track={mockTrack}
        currentPoint={mockPoint}
        windData={mockWindData}
        windDataSeries={mockWindDataSeries}
        nowcast={null}
      />
    );

    expect(screen.getByText(/Wind Layer Transitions/i)).toBeInTheDocument();
  });
});

