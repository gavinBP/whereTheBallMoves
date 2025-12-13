import { useState, useEffect, useCallback } from 'react';
import { MapView } from './components/Map/MapView';
import { TrackLayer } from './components/Map/TrackLayer';
import { MarkerLayer } from './components/Map/MarkerLayer';
import { WindLayer } from './components/Map/WindLayer';
import { NowcastLayer } from './components/Map/NowcastLayer';
import { BalloonSelector } from './components/Controls/BalloonSelector';
import { TimeSelector } from './components/Controls/TimeSelector';
import { RefreshButton } from './components/Controls/RefreshButton';
import { DetailsPanel } from './components/DetailsPanel/DetailsPanel';
import { LoadingSpinner } from './components/Loading/LoadingSpinner';
import { useBalloonData } from './hooks/useBalloonData';
import { useWindData } from './hooks/useWindData';
import { calculateNowcast } from './utils/nowcast';
import type { BalloonTrack, TrackPoint } from './types/track';
import type { WindDataPoint } from './types/wind';
import './App.css';

function App() {
  const { data, tracks, loading, error, fetchData, refreshData } = useBalloonData();
  const { fetchWindForPoint, windData: windDataSeries } = useWindData();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TrackPoint | null>(null);
  const [windData, setWindData] = useState<WindDataPoint | null>(null);
  const [nowcast, setNowcast] = useState<ReturnType<typeof calculateNowcast> | null>(null);
  const [mouseCoordinates, setMouseCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Auto-refresh every 7 minutes
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      refreshData();
    }, 7 * 60 * 1000); // 7 minutes

    return () => clearInterval(interval);
  }, [fetchData, refreshData]);

  // Get selected track
  const selectedTrack =
    selectedTrackId && tracks
      ? tracks.tracks.find((t) => t.trackId === selectedTrackId) || null
      : null;

  // Get tracks to display
  const tracksToDisplay =
    selectedTrackId && selectedTrack
      ? [selectedTrack]
      : tracks?.tracks || [];

  // Handle track selection
  const handleTrackClick = useCallback(
    async (track: BalloonTrack) => {
      setSelectedTrackId(track.trackId);
      const currentPoint = track.points[track.points.length - 1];
      setSelectedPoint(currentPoint);

      // Fetch wind data for current point
      const wind = await fetchWindForPoint(currentPoint);
      setWindData(wind);

      // Calculate nowcast
      const prediction = calculateNowcast(track, wind);
      setNowcast(prediction);
    },
    [fetchWindForPoint]
  );

  // Handle marker click
  const handleMarkerClick = useCallback(
    async (point: TrackPoint, track: BalloonTrack) => {
      setSelectedTrackId(track.trackId);
      setSelectedPoint(point);

      // Fetch wind data for clicked point
      const wind = await fetchWindForPoint(point);
      setWindData(wind);
    },
    [fetchWindForPoint]
  );

  // Update wind data and nowcast when selection changes
  useEffect(() => {
    if (selectedTrack && selectedPoint) {
      fetchWindForPoint(selectedPoint).then((wind) => {
        setWindData(wind);
        if (wind) {
          const prediction = calculateNowcast(selectedTrack, wind);
          setNowcast(prediction);
        }
      });
    }
  }, [selectedTrack, selectedPoint, fetchWindForPoint]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '15px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Where The Ball Moves</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {mouseCoordinates && (
              <div
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                }}
              >
                {mouseCoordinates.lat.toFixed(4)}°, {mouseCoordinates.lon.toFixed(4)}°
              </div>
            )}
            <RefreshButton onRefresh={refreshData} disabled={loading} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Controls Sidebar */}
        <aside
          style={{
            width: '300px',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            overflowY: 'auto',
            borderRight: '1px solid #dee2e6',
          }}
        >
          <BalloonSelector
            tracks={tracks?.tracks || []}
            selectedTrackId={selectedTrackId}
            onSelect={setSelectedTrackId}
          />
          <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} />

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {data && (
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#333333' }}>
              <p>
                <strong>Data Status:</strong> {data.successCount} / 24 endpoints successful
              </p>
              <p>
                <strong>Last Updated:</strong>{' '}
                {data.fetchedAt.toLocaleTimeString()}
              </p>
            </div>
          )}
        </aside>

        {/* Map Area */}
        <main style={{ flex: 1, position: 'relative' }}>
          {loading && !data && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LoadingSpinner message="Loading balloon data..." />
            </div>
          )}

          {tracks && tracks.tracks.length > 0 ? (
            <MapView
              center={[0, 0]}
              zoom={2}
              onMouseMove={(lat, lon) => setMouseCoordinates({ lat, lon })}
            >
              <TrackLayer
                tracks={tracksToDisplay}
                selectedTrackId={selectedTrackId}
                selectedTime={selectedTime}
                onTrackClick={handleTrackClick}
              />
              <MarkerLayer
                tracks={tracksToDisplay}
                selectedTrackId={selectedTrackId}
                selectedTime={selectedTime}
                onMarkerClick={handleMarkerClick}
              />
              {windData && selectedTrack && (
                <WindLayer windData={[windData]} showAll={false} />
              )}
              {nowcast && <NowcastLayer nowcast={nowcast} />}
            </MapView>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
              }}
            >
              {loading ? (
                <LoadingSpinner message="Loading..." />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p>No balloon data available.</p>
                  <p>Click "Refresh Data" to fetch balloon positions.</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Details Panel */}
        <aside
          style={{
            width: '350px',
            backgroundColor: '#ffffff',
            padding: '20px',
            overflowY: 'auto',
            borderLeft: '1px solid #dee2e6',
          }}
        >
          <DetailsPanel
            track={selectedTrack}
            currentPoint={selectedPoint}
            windData={windData}
            windDataSeries={windDataSeries}
            nowcast={nowcast}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
