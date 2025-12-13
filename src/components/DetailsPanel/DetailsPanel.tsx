import { useState, useEffect } from 'react';
import type { BalloonTrack, TrackPoint } from '../../types/track';
import type { WindDataPoint, WindDataSeries } from '../../types/wind';
import { calculateNowcast } from '../../utils/nowcast';
import { countWindLayerTransitions } from '../../utils/windLayerTransitions';
import { format } from 'date-fns';

interface DetailsPanelProps {
  track: BalloonTrack | null;
  currentPoint: TrackPoint | null;
  windData: WindDataPoint | null;
  windDataSeries: WindDataSeries | null;
  nowcast: ReturnType<typeof calculateNowcast> | null;
}

/**
 * Panel showing balloon details and statistics
 */
export function DetailsPanel({
  track,
  currentPoint,
  windData,
  windDataSeries,
  nowcast,
}: DetailsPanelProps) {
  const [windTransitions, setWindTransitions] = useState<number>(0);

  useEffect(() => {
    if (track && windDataSeries) {
      const count = countWindLayerTransitions(track, windDataSeries);
      setWindTransitions(count);
    } else {
      setWindTransitions(0);
    }
  }, [track, windDataSeries]);
  if (!track) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          minHeight: '200px',
        }}
      >
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Select a balloon track to view details
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#333' }}>{track.trackId}</h3>

      {/* Current Position */}
      {currentPoint && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <h4 style={{ color: '#666', marginBottom: '10px' }}>Current Position</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#333333' }}>
            <div>
              <strong>Latitude:</strong> {currentPoint.latitude.toFixed(4)}°
            </div>
            <div>
              <strong>Longitude:</strong> {currentPoint.longitude.toFixed(4)}°
            </div>
            <div>
              <strong>Altitude:</strong> {currentPoint.altitudeKm.toFixed(2)} km
            </div>
            <div>
              <strong>Time:</strong> {format(currentPoint.timestamp, 'MMM dd, HH:mm')}
            </div>
          </div>
        </div>
      )}

      {/* Wind Data */}
      {windData && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <h4 style={{ color: '#666', marginBottom: '10px' }}>Wind Conditions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#333333' }}>
            <div>
              <strong>Wind Speed:</strong> {windData.windSpeedKmh.toFixed(1)} km/h
            </div>
            <div>
              <strong>Wind Direction:</strong> {windData.windDirectionDeg.toFixed(0)}°
            </div>
            <div>
              <strong>Pressure Level:</strong> {windData.pressureLevelHpa} hPa
            </div>
            <div>
              <strong>Altitude:</strong> {windData.altitudeKm.toFixed(2)} km
            </div>
          </div>
        </div>
      )}

      {/* Track Statistics */}
      <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h4 style={{ color: '#666', marginBottom: '10px' }}>Track Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#333333' }}>
          <div>
            <strong>Total Distance:</strong> {track.totalDistanceKm.toFixed(2)} km
          </div>
          <div>
            <strong>Average Speed:</strong> {track.averageSpeedKmh.toFixed(2)} km/h
          </div>
          <div>
            <strong>Duration:</strong> {track.durationHours.toFixed(2)} hours
          </div>
          <div>
            <strong>Points:</strong> {track.points.length}
          </div>
          <div>
            <strong>Min Altitude:</strong> {track.minAltitudeKm.toFixed(2)} km
          </div>
          <div>
            <strong>Max Altitude:</strong> {track.maxAltitudeKm.toFixed(2)} km
          </div>
          <div>
            <strong>Altitude Range:</strong> {track.altitudeRangeKm.toFixed(2)} km
          </div>
          {windTransitions > 0 && (
            <div>
              <strong>Wind Layer Transitions:</strong> {windTransitions}
            </div>
          )}
        </div>
      </div>

      {/* Nowcast Prediction */}
      {nowcast && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <h4 style={{ color: '#666', marginBottom: '10px' }}>1-Hour Nowcast</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#333333' }}>
            <div>
              <strong>Predicted Lat:</strong> {nowcast.predictedPosition.latitude.toFixed(4)}°
            </div>
            <div>
              <strong>Predicted Lon:</strong> {nowcast.predictedPosition.longitude.toFixed(4)}°
            </div>
            <div>
              <strong>Predicted Distance:</strong> {nowcast.predictedDistanceKm.toFixed(2)} km
            </div>
            <div>
              <strong>Uncertainty:</strong> ±{nowcast.uncertaintyRadiusKm.toFixed(2)} km
            </div>
            <div>
              <strong>Confidence:</strong> {(nowcast.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Time Range */}
      <div>
        <h4 style={{ color: '#666', marginBottom: '10px' }}>Time Range</h4>
        <div style={{ color: '#333333' }}>
          <div>
            <strong>Start:</strong> {format(track.startTime, 'MMM dd, yyyy HH:mm')}
          </div>
          <div>
            <strong>End:</strong> {format(track.endTime, 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}

