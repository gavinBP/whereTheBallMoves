import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock Leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  }),
}));

jest.mock('leaflet', () => ({
  icon: jest.fn(),
  divIcon: jest.fn(),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  circleMarker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  polyline: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
  })),
  Marker: {
    prototype: {
      options: {},
    },
  },
}));

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Where The Ball Moves/i)).toBeInTheDocument();
    });
  });

  it('renders the refresh button', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Refresh Data/i)).toBeInTheDocument();
    });
  });
});

