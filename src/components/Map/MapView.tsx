import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Component to add lat/lon grid overlay to the map
 */
function GridOverlay() {
  const map = useMap();

  useEffect(() => {
    // Create grid lines
    const gridLines: L.Polyline[] = [];

    // Latitude lines (horizontal)
    for (let lat = -90; lat <= 90; lat += 10) {
      const line = L.polyline(
        [
          [lat, -180],
          [lat, 180],
        ],
        {
          color: '#cccccc',
          weight: 1,
          opacity: 0.5,
          interactive: false,
        }
      ).addTo(map);
      gridLines.push(line);
    }

    // Longitude lines (vertical)
    for (let lon = -180; lon <= 180; lon += 10) {
      const line = L.polyline(
        [
          [-90, lon],
          [90, lon],
        ],
        {
          color: '#cccccc',
          weight: 1,
          opacity: 0.5,
          interactive: false,
        }
      ).addTo(map);
      gridLines.push(line);
    }

    return () => {
      gridLines.forEach((line) => map.removeLayer(line));
    };
  }, [map]);

  return null;
}

interface MapViewProps {
  children?: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  onMouseMove?: (lat: number, lon: number) => void;
}

/**
 * Component to handle mouse move events and report coordinates
 */
function MouseCoordinateTracker({ onMouseMove }: { onMouseMove?: (lat: number, lon: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onMouseMove) {
      return;
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMouseMove(lat, lng);
    };

    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, onMouseMove]);

  return null;
}

/**
 * Main map view component using Leaflet
 */
export function MapView({ children, center = [0, 0], zoom = 2, onMouseMove }: MapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        worldCopyJump={true}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        minZoom={2}
        maxZoom={10}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GridOverlay />
        <MouseCoordinateTracker onMouseMove={onMouseMove} />
        {children}
      </MapContainer>
    </div>
  );
}

