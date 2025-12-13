import { useState } from 'react';
import { fetchAllBalloonData } from '../services/windborneApi';
import { reconstructBalloonTracks } from '../utils/trackReconstruction';
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
    </div>
  );
}

