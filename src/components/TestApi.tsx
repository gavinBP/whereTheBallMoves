import { useState } from 'react';
import { fetchAllBalloonData } from '../services/windborneApi';
import { reconstructBalloonTracks } from '../utils/trackReconstruction';
import { fetchWindDataForAltitude } from '../services/openMeteoApi';
import { altitudeToPressureLevel, pressureLevelToAltitude } from '../utils/altitudeMapping';
import { calculateNowcast } from '../utils/nowcast';
import { correlateWindWithTrack } from '../utils/windCorrelation';
import type { BalloonDataCollection } from '../types/balloon';
import type { TrackReconstructionResult } from '../types/track';

export function TestApi() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalloonDataCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackReconstructionResult | null>(null);
  const [reconstructing, setReconstructing] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllBalloonData();
      setData(result);
      console.log('Fetched data:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>WindBorne API Test</h2>
      <button
        onClick={handleFetch}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Fetching...' : 'Fetch Balloon Data'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '20px' }}>
          <h3>Results:</h3>
          <p>
            <strong>Success:</strong> {data.successCount} / 24 endpoints
          </p>
          <p>
            <strong>Failed:</strong> {data.failureCount} / 24 endpoints
          </p>
          <p>
            <strong>Fetched at:</strong> {data.fetchedAt.toLocaleString()}
          </p>

          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer' }}>
              View Detailed Results (click to expand)
            </summary>
            <div style={{ marginTop: '10px', maxHeight: '400px', overflow: 'auto' }}>
              {data.results.map((result) => (
                <div
                  key={result.hour}
                  style={{
                    padding: '5px',
                    margin: '5px 0',
                    backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                    border: '1px solid',
                    borderColor: result.success ? '#c3e6cb' : '#f5c6cb',
                  }}
                >
                  <strong>Hour {result.hour}:</strong>{' '}
                  {result.success ? (
                    <>
                      ✓ Success - {result.data?.length || 0} balloons
                    </>
                  ) : (
                    <>✗ Failed - {result.error}</>
                  )}
                </div>
              ))}
            </div>
          </details>

          {data.successCount > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Sample Data (from first successful endpoint):</h4>
              {(() => {
                const firstSuccess = data.results.find((r) => r.success && r.data);
                if (firstSuccess && firstSuccess.data) {
                  return (
                    <pre
                      style={{
                        backgroundColor: '#f4f4f4',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '200px',
                      }}
                    >
                      {JSON.stringify(firstSuccess.data.slice(0, 5), null, 2)}
                      {firstSuccess.data.length > 5 && (
                        <div>... and {firstSuccess.data.length - 5} more positions</div>
                      )}
                    </pre>
                  );
                }
                return <p>No successful data to display</p>;
              })()}
            </div>
          )}
        </div>
      )}

      {data && data.successCount > 0 && (
        <div style={{ marginTop: '30px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
          <h3>Track Reconstruction Test</h3>
          <button
            onClick={() => {
              setReconstructing(true);
              try {
                const result = reconstructBalloonTracks(data);
                setTracks(result);
                console.log('Track reconstruction result:', result);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Reconstruction failed');
                console.error('Track reconstruction error:', err);
              } finally {
                setReconstructing(false);
              }
            }}
            disabled={reconstructing || !data}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: reconstructing ? 'not-allowed' : 'pointer',
              marginTop: '10px',
            }}
          >
            {reconstructing ? 'Reconstructing Tracks...' : 'Reconstruct Balloon Tracks'}
          </button>

          {tracks && (
            <div style={{ marginTop: '20px' }}>
              <h4>Reconstruction Results:</h4>
              <p>
                <strong>Total Tracks Found:</strong> {tracks.tracks.length}
              </p>
              <p>
                <strong>Total Matches:</strong> {tracks.matchStatistics.totalMatches}
              </p>
              <p>
                <strong>Average Match Distance:</strong>{' '}
                {tracks.matchStatistics.averageDistanceKm.toFixed(2)} km
              </p>
              <p>
                <strong>Average Match Confidence:</strong>{' '}
                {(tracks.matchStatistics.averageConfidence * 100).toFixed(1)}%
              </p>
              <p>
                <strong>Unmatched Hours:</strong> {tracks.unmatchedPoints.length}
              </p>

              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  View Track Details (click to expand)
                </summary>
                <div style={{ marginTop: '10px', maxHeight: '400px', overflow: 'auto' }}>
                  {tracks.tracks.slice(0, 10).map((track) => (
                    <div
                      key={track.trackId}
                      style={{
                        padding: '10px',
                        margin: '5px 0',
                        backgroundColor: '#e7f3ff',
                        border: '1px solid #b3d9ff',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>{track.trackId}:</strong>
                      <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        <li>Points: {track.points.length}</li>
                        <li>Duration: {track.durationHours.toFixed(2)} hours</li>
                        <li>Distance: {track.totalDistanceKm.toFixed(2)} km</li>
                        <li>Avg Speed: {track.averageSpeedKmh.toFixed(2)} km/h</li>
                        <li>
                          Altitude: {track.minAltitudeKm.toFixed(2)} -{' '}
                          {track.maxAltitudeKm.toFixed(2)} km
                        </li>
                      </ul>
                    </div>
                  ))}
                  {tracks.tracks.length > 10 && (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                      ... and {tracks.tracks.length - 10} more tracks
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Task 3.0 Testing Section */}
      <div style={{ marginTop: '40px', borderTop: '3px solid #007bff', paddingTop: '20px' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>Task 3.0: Open-Meteo Integration Test</h2>
        
        {/* Wind Data Fetching Test */}
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
          <h3>Test Wind Data Fetching</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
              type="number"
              id="test-lat"
              placeholder="Latitude (e.g., 40.7128)"
              step="0.0001"
              style={{ padding: '8px', width: '150px' }}
              defaultValue="40.7128"
            />
            <input
              type="number"
              id="test-lon"
              placeholder="Longitude (e.g., -74.006)"
              step="0.0001"
              style={{ padding: '8px', width: '150px' }}
              defaultValue="-74.006"
            />
            <input
              type="number"
              id="test-alt"
              placeholder="Altitude (km, e.g., 10)"
              step="0.1"
              style={{ padding: '8px', width: '120px' }}
              defaultValue="10"
            />
            <button
              onClick={async () => {
                const lat = parseFloat((document.getElementById('test-lat') as HTMLInputElement)?.value || '40.7128');
                const lon = parseFloat((document.getElementById('test-lon') as HTMLInputElement)?.value || '-74.006');
                const alt = parseFloat((document.getElementById('test-alt') as HTMLInputElement)?.value || '10');
                
                setError(null);
                try {
                  const pressureLevel = altitudeToPressureLevel(alt);
                  const result = await fetchWindDataForAltitude(lat, lon, alt);
                  
                  if (result.success && result.data) {
                    alert(`Success!\n\nAltitude: ${alt} km\nPressure Level: ${pressureLevel} hPa\nWind Data Points: ${result.data.dataPoints.length}\n\nCheck console for full data.`);
                    console.log('Wind Data Result:', result);
                    console.log('Sample wind data:', result.data.dataPoints.slice(0, 3));
                  } else {
                    alert(`Failed: ${result.error || 'Unknown error'}`);
                  }
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                  setError(errorMessage);
                  alert(`Error: ${errorMessage}`);
                }
              }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Fetch Wind Data
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Enter coordinates and altitude, then click to fetch wind data from Open-Meteo API
          </p>
        </div>

        {/* Altitude Mapping Test */}
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
          <h3>Test Altitude to Pressure Level Mapping</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
              type="number"
              id="map-alt"
              placeholder="Altitude (km)"
              step="0.1"
              style={{ padding: '8px', width: '150px' }}
              defaultValue="10"
            />
            <button
              onClick={() => {
                const alt = parseFloat((document.getElementById('map-alt') as HTMLInputElement)?.value || '10');
                const pressureLevel = altitudeToPressureLevel(alt);
                const backToAlt = pressureLevelToAltitude(pressureLevel);
                alert(`Altitude: ${alt} km\n→ Pressure Level: ${pressureLevel} hPa\n→ Back to Altitude: ${backToAlt.toFixed(2)} km`);
              }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Test Mapping
            </button>
          </div>
        </div>

        {/* Nowcast Test with Real Track */}
        {tracks && tracks.tracks.length > 0 && (
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px' }}>
            <h3>Test Nowcast Prediction</h3>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              Select a track to test 1-hour nowcast prediction:
            </p>
            <select
              id="track-select"
              style={{ padding: '8px', width: '200px', marginBottom: '10px' }}
            >
              {tracks.tracks.slice(0, 10).map((track) => (
                <option key={track.trackId} value={track.trackId}>
                  {track.trackId} ({track.points.length} points)
                </option>
              ))}
            </select>
            <br />
            <button
              onClick={async () => {
                const trackId = (document.getElementById('track-select') as HTMLSelectElement)?.value;
                const track = tracks.tracks.find((t) => t.trackId === trackId);
                
                if (!track || track.points.length === 0) {
                  alert('No track selected or track has no points');
                  return;
                }

                const currentPoint = track.points[track.points.length - 1];
                
                try {
                  // Fetch wind data for current position
                  const windResult = await fetchWindDataForAltitude(
                    currentPoint.latitude,
                    currentPoint.longitude,
                    currentPoint.altitudeKm
                  );

                  if (windResult.success && windResult.data) {
                    const windAtTime = windResult.data.dataPoints.find(
                      (p) => Math.abs(p.timestamp.getTime() - currentPoint.timestamp.getTime()) < 60 * 60 * 1000
                    );

                    const nowcast = calculateNowcast(track, windAtTime || null);
                    
                    if (nowcast) {
                      const message = `Nowcast Prediction for ${trackId}:\n\n` +
                        `Current Position: ${currentPoint.latitude.toFixed(4)}, ${currentPoint.longitude.toFixed(4)}\n` +
                        `Predicted Position: ${nowcast.predictedPosition.latitude.toFixed(4)}, ${nowcast.predictedPosition.longitude.toFixed(4)}\n` +
                        `Predicted Distance: ${nowcast.predictedDistanceKm.toFixed(2)} km\n` +
                        `Uncertainty Radius: ${nowcast.uncertaintyRadiusKm.toFixed(2)} km\n` +
                        `Confidence: ${(nowcast.confidence * 100).toFixed(1)}%\n` +
                        (nowcast.windVector ? `Wind: ${nowcast.windVector.windSpeedKmh.toFixed(1)} km/h at ${nowcast.windVector.windDirectionDeg.toFixed(0)}°` : 'No wind data');
                      
                      alert(message);
                      console.log('Nowcast Result:', nowcast);
                    } else {
                      alert('Could not calculate nowcast (insufficient data)');
                    }
                  } else {
                    alert(`Failed to fetch wind data: ${windResult.error || 'Unknown error'}`);
                  }
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                  alert(`Error: ${errorMessage}`);
                  console.error('Nowcast error:', err);
                }
              }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Calculate Nowcast
            </button>
          </div>
        )}

        {/* Wind Correlation Test */}
        {tracks && tracks.tracks.length > 0 && (
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
            <h3>Test Wind Correlation</h3>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              Select a track to correlate with wind data:
            </p>
            <select
              id="correlate-track-select"
              style={{ padding: '8px', width: '200px', marginBottom: '10px' }}
            >
              {tracks.tracks.slice(0, 10).map((track) => (
                <option key={track.trackId} value={track.trackId}>
                  {track.trackId} ({track.points.length} points)
                </option>
              ))}
            </select>
            <br />
            <button
              onClick={async () => {
                const trackId = (document.getElementById('correlate-track-select') as HTMLSelectElement)?.value;
                const track = tracks.tracks.find((t) => t.trackId === trackId);
                
                if (!track || track.points.length === 0) {
                  alert('No track selected or track has no points');
                  return;
                }

                try {
                  // Get a sample point from the track
                  const samplePoint = track.points[Math.floor(track.points.length / 2)];
                  
                  // Fetch wind data
                  const windResult = await fetchWindDataForAltitude(
                    samplePoint.latitude,
                    samplePoint.longitude,
                    samplePoint.altitudeKm
                  );

                  if (windResult.success && windResult.data) {
                    const correlations = correlateWindWithTrack(track, windResult.data);
                    const withWind = correlations.filter((c) => c.windAvailable).length;
                    const withoutWind = correlations.filter((c) => !c.windAvailable).length;
                    
                    const message = `Wind Correlation for ${trackId}:\n\n` +
                      `Total Points: ${correlations.length}\n` +
                      `Points with Wind Data: ${withWind}\n` +
                      `Points without Wind Data: ${withoutWind}\n\n` +
                      `Check console for detailed correlation data.`;
                    
                    alert(message);
                    console.log('Wind Correlations:', correlations);
                    console.log('Sample correlations:', correlations.slice(0, 5));
                  } else {
                    alert(`Failed to fetch wind data: ${windResult.error || 'Unknown error'}`);
                  }
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                  alert(`Error: ${errorMessage}`);
                  console.error('Correlation error:', err);
                }
              }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Correlate Wind Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

