import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TrackPoint, BalloonTrack } from '../../types/track';

interface MarkerLayerProps {
  tracks: BalloonTrack[];
  selectedTrackId: string | null;
  selectedTime: number | null; // null = full history, number = hours ago
  onMarkerClick?: (point: TrackPoint, track: BalloonTrack) => void;
}

/**
 * Get marker size based on altitude
 */
function getMarkerSize(altitudeKm: number): number {
  // Larger markers for higher altitudes
  // Range: 3.2px (low) to 6.4px (high) - reduced by 60% from original
  const normalized = Math.max(0, Math.min(1, altitudeKm / 30));
  return 3.2 + normalized * 3.2;
}

/**
 * Component to render balloon positions as markers on the map
 */
export function MarkerLayer({
  tracks,
  selectedTrackId,
  selectedTime,
  onMarkerClick,
}: MarkerLayerProps) {
  const map = useMap();

  useEffect(() => {
    const markers: L.CircleMarker[] = [];

    tracks.forEach((track) => {
      // Determine which point(s) to show
      let pointsToShow: TrackPoint[] = [];

      if (selectedTime === null) {
        // Show only the most recent point for each track
        if (track.points.length > 0) {
          pointsToShow = [track.points[track.points.length - 1]];
        }
      } else {
        // Show point at the selected time
        const now = new Date();
        const targetTime = new Date(now.getTime() - selectedTime * 60 * 60 * 1000);
        
        // Find closest point to target time
        let closest: TrackPoint | null = null;
        let minDiff = Infinity;

        for (const point of track.points) {
          const diff = Math.abs(point.timestamp.getTime() - targetTime.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closest = point;
          }
        }

        if (closest && minDiff < 60 * 60 * 1000) {
          // Only show if within 1 hour of target time
          pointsToShow = [closest];
        }
      }

      pointsToShow.forEach((point) => {
        const isSelected = selectedTrackId === track.trackId;
        const size = getMarkerSize(point.altitudeKm);
        const color = isSelected ? '#ff0000' : '#0066cc';

        const marker = L.circleMarker([point.latitude, point.longitude], {
          radius: size,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);

        // Add popup with basic info
        marker.bindPopup(
          `<strong>${track.trackId}</strong><br/>` +
            `Altitude: ${point.altitudeKm.toFixed(2)} km<br/>` +
            `Time: ${point.timestamp.toLocaleString()}`
        );

        // Add click handler
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(point, track);
          });
        }

        markers.push(marker);
      });
    });

    return () => {
      markers.forEach((marker) => {
        map.removeLayer(marker);
      });
    };
  }, [map, tracks, selectedTrackId, selectedTime, onMarkerClick]);

  return null;
}

