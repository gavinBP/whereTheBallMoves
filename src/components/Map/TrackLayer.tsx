import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BalloonTrack } from '../../types/track';

interface TrackLayerProps {
  tracks: BalloonTrack[];
  selectedTrackId: string | null;
  selectedTime: number | null; // null = full history, number = hours ago
  onTrackClick?: (track: BalloonTrack) => void;
}

/**
 * Get color based on altitude (blue → green → yellow → red)
 */
function getAltitudeColor(altitudeKm: number): string {
  // Normalize altitude to 0-1 range (assuming 0-30 km range)
  const normalized = Math.max(0, Math.min(1, altitudeKm / 30));

  if (normalized < 0.33) {
    // Blue to green
    const t = normalized / 0.33;
    const r = Math.round(0 + t * 0);
    const g = Math.round(0 + t * 255);
    const b = Math.round(255 - t * 0);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0.67) {
    // Green to yellow
    const t = (normalized - 0.33) / 0.34;
    const r = Math.round(0 + t * 255);
    const g = 255;
    const b = Math.round(0 - t * 255);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to red
    const t = (normalized - 0.67) / 0.33;
    const r = 255;
    const g = Math.round(255 - t * 255);
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Component to render balloon tracks as colored paths on the map
 */
export function TrackLayer({
  tracks,
  selectedTrackId,
  selectedTime,
  onTrackClick,
}: TrackLayerProps) {
  const map = useMap();

  useEffect(() => {
    const polylines: L.Polyline[] = [];

    tracks.forEach((track) => {
      // Filter points based on selected time
      let pointsToShow = track.points;

      if (selectedTime !== null) {
        // Show only points up to the selected time
        const now = new Date();
        const targetTime = new Date(now.getTime() - selectedTime * 60 * 60 * 1000);
        pointsToShow = track.points.filter((p) => p.timestamp <= targetTime);
      }

      if (pointsToShow.length < 2) {
        return; // Need at least 2 points to draw a line
      }

      // Create polyline with altitude-based color
      const latlngs = pointsToShow.map((point) => [point.latitude, point.longitude] as [number, number]);

      // Use average altitude for the track segment color
      const avgAltitude =
        pointsToShow.reduce((sum, p) => sum + p.altitudeKm, 0) / pointsToShow.length;
      const color = getAltitudeColor(avgAltitude);

      const isSelected = selectedTrackId === track.trackId;
      const polyline = L.polyline(latlngs, {
        color,
        weight: isSelected ? 2.6 : 1.3, // Reduced by 35% from original (4→2.6, 2→1.3)
        opacity: isSelected ? 0.9 : 0.6,
        interactive: true,
      }).addTo(map);

      // Add click handler
      if (onTrackClick) {
        polyline.on('click', () => {
          onTrackClick(track);
        });
      }

      // Add hover effect
      polyline.on('mouseover', function (e) {
        const target = e.target as L.Polyline;
        target.setStyle({
          weight: 3.25, // Reduced by 35% from original (5→3.25)
          opacity: 1,
        });
      });

      polyline.on('mouseout', function (e) {
        const target = e.target as L.Polyline;
        target.setStyle({
          weight: isSelected ? 2.6 : 1.3, // Reduced by 35% from original
          opacity: isSelected ? 0.9 : 0.6,
        });
      });

      polylines.push(polyline);
    });

    return () => {
      polylines.forEach((polyline) => map.removeLayer(polyline));
    };
  }, [map, tracks, selectedTrackId, selectedTime, onTrackClick]);

  return null;
}

