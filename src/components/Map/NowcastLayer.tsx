import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { NowcastPrediction } from '../../utils/nowcast';

interface NowcastLayerProps {
  nowcast: NowcastPrediction | null;
}

/**
 * Component to render nowcast prediction with uncertainty indicator
 */
export function NowcastLayer({ nowcast }: NowcastLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!nowcast) {
      return;
    }

    const layers: (L.Marker | L.Circle | L.Polyline)[] = [];

    // Draw uncertainty circle
    const uncertaintyCircle = L.circle(
      [nowcast.predictedPosition.latitude, nowcast.predictedPosition.longitude],
      {
        radius: nowcast.uncertaintyRadiusKm * 1000, // Convert km to meters
        color: '#ff6b6b',
        fillColor: '#ff6b6b',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5, 5',
      }
    ).addTo(map);
    layers.push(uncertaintyCircle);

    // Draw predicted position marker
    const predictedMarker = L.marker(
      [nowcast.predictedPosition.latitude, nowcast.predictedPosition.longitude],
      {
        icon: L.divIcon({
          className: 'nowcast-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #ff6b6b;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: true,
        zIndexOffset: 2000,
      }
    ).addTo(map);

    predictedMarker.bindPopup(
      `<strong>1-Hour Nowcast</strong><br/>` +
        `Predicted Position<br/>` +
        `Lat: ${nowcast.predictedPosition.latitude.toFixed(4)}°<br/>` +
        `Lon: ${nowcast.predictedPosition.longitude.toFixed(4)}°<br/>` +
        `Distance: ${nowcast.predictedDistanceKm.toFixed(2)} km<br/>` +
        `Uncertainty: ±${nowcast.uncertaintyRadiusKm.toFixed(2)} km<br/>` +
        `Confidence: ${(nowcast.confidence * 100).toFixed(1)}%`
    );

    layers.push(predictedMarker);

    // Draw line from current to predicted position
    const predictionLine = L.polyline(
      [
        [nowcast.currentPosition.latitude, nowcast.currentPosition.longitude],
        [nowcast.predictedPosition.latitude, nowcast.predictedPosition.longitude],
      ],
      {
        color: '#ff6b6b',
        weight: 2,
        opacity: 0.7,
        dashArray: '10, 5',
      }
    ).addTo(map);
    layers.push(predictionLine);

    return () => {
      layers.forEach((layer) => map.removeLayer(layer));
    };
  }, [map, nowcast]);

  return null;
}

