import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { WindDataPoint } from '../../types/wind';

interface WindLayerProps {
  windData: WindDataPoint[];
  showAll?: boolean; // If false, only show wind for selected location
}

/**
 * Component to render wind vectors/arrows on the map
 */
export function WindLayer({ windData, showAll = false }: WindLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (windData.length === 0) {
      return;
    }

    const arrows: L.Marker[] = [];

    windData.forEach((wind) => {
      // Create arrow marker for wind vector
      const speedKmh = wind.windSpeedKmh;

      // Scale arrow size based on wind speed (normalize to 0-100 km/h)
      const arrowLength = Math.min(50, (speedKmh / 100) * 50);
      const arrowWidth = Math.min(20, (speedKmh / 100) * 20);

      // Create custom icon with arrow
      const arrowIcon = L.divIcon({
        className: 'wind-arrow',
        html: `
          <div style="
            transform: rotate(${wind.windDirectionDeg}deg);
            width: ${arrowLength}px;
            height: ${arrowWidth}px;
            position: relative;
          ">
            <div style="
              width: 0;
              height: 0;
              border-left: ${arrowWidth / 2}px solid transparent;
              border-right: ${arrowWidth / 2}px solid transparent;
              border-bottom: ${arrowLength}px solid rgba(0, 150, 255, 0.7);
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
            "></div>
          </div>
        `,
        iconSize: [arrowLength, arrowWidth],
        iconAnchor: [arrowLength / 2, arrowWidth / 2],
      });

      const marker = L.marker([wind.latitude, wind.longitude], {
        icon: arrowIcon,
        interactive: true,
        zIndexOffset: 1000,
      }).addTo(map);

      // Add popup with wind info
      marker.bindPopup(
        `<strong>Wind Data</strong><br/>` +
          `Speed: ${speedKmh.toFixed(1)} km/h<br/>` +
          `Direction: ${wind.windDirectionDeg.toFixed(0)}°<br/>` +
          `Altitude: ${wind.altitudeKm.toFixed(2)} km<br/>` +
          `Pressure: ${wind.pressureLevelHpa} hPa`
      );

      arrows.push(marker);
    });

    return () => {
      arrows.forEach((arrow) => map.removeLayer(arrow));
    };
  }, [map, windData, showAll]);

  return null;
}

