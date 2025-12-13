import axios from 'axios';
import {
  fetchWindData,
  fetchWindDataForAltitude,
  getWindDataAtTime,
  clearWindDataCache,
} from './openMeteoApi';
import type { OpenMeteoResponse } from '../types/wind';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock date-fns
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn(),
  subHours: jest.fn(),
  parseISO: jest.fn((dateStr: string) => new Date(dateStr)),
}));

describe('openMeteoApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearWindDataCache();
  });

  describe('fetchWindData', () => {
    it('should successfully fetch wind data', async () => {
      const mockResponse: OpenMeteoResponse = {
        latitude: 40.7128,
        longitude: -74.006,
        hourly: {
          time: ['2025-12-12T00:00', '2025-12-12T01:00'],
          wind_speed_500hPa: [25.5, 26.2],
          wind_direction_500hPa: [270, 275],
        },
        hourly_units: {
          wind_speed_500hPa: 'km/h',
          wind_direction_500hPa: '°',
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchWindData(40.7128, -74.006, 500);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.dataPoints).toHaveLength(2);
      expect(result.data?.dataPoints[0].windSpeedKmh).toBe(25.5);
      expect(result.data?.dataPoints[0].windDirectionDeg).toBe(270);
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse: OpenMeteoResponse = {
        latitude: 40.7128,
        longitude: -74.006,
        hourly: {
          time: ['2025-12-12T00:00'],
          wind_speed_500hPa: [25.5],
          wind_direction_500hPa: [270],
        },
        hourly_units: {},
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // First call
      const result1 = await fetchWindData(40.7128, -74.006, 500);
      expect(result1.success).toBe(true);

      // Second call should use cache
      const result2 = await fetchWindData(40.7128, -74.006, 500);
      expect(result2.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        request: {},
        message: 'Network Error',
      });

      const result = await fetchWindData(40.7128, -74.006, 500);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include past_days parameter', async () => {
      const mockResponse: OpenMeteoResponse = {
        latitude: 40.7128,
        longitude: -74.006,
        hourly: {
          time: ['2025-12-12T00:00'],
          wind_speed_500hPa: [25.5],
          wind_direction_500hPa: [270],
        },
        hourly_units: {},
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await fetchWindData(40.7128, -74.006, 500, 2);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            past_days: 2,
          }),
        })
      );
    });
  });

  describe('fetchWindDataForAltitude', () => {
    it('should map altitude to pressure level and fetch data', async () => {
      const mockResponse: OpenMeteoResponse = {
        latitude: 40.7128,
        longitude: -74.006,
        hourly: {
          time: ['2025-12-12T00:00'],
          wind_speed_250hPa: [30.0], // 10km altitude maps to ~250hPa
          wind_direction_250hPa: [270],
        },
        hourly_units: {},
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchWindDataForAltitude(40.7128, -74.006, 10.0);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Should have requested 250hPa (approximate for 10km)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            hourly: expect.stringContaining('250hPa'),
          }),
        })
      );
    });
  });

  describe('getWindDataAtTime', () => {
    it('should return closest wind data point to timestamp', () => {
      const windData = {
        latitude: 40.7128,
        longitude: -74.006,
        pressureLevelHpa: 500,
        altitudeKm: 5.5,
        dataPoints: [
          {
            latitude: 40.7128,
            longitude: -74.006,
            pressureLevelHpa: 500,
            altitudeKm: 5.5,
            windSpeedKmh: 25.0,
            windDirectionDeg: 270,
            timestamp: new Date('2025-12-12T00:00:00Z'),
          },
          {
            latitude: 40.7128,
            longitude: -74.006,
            pressureLevelHpa: 500,
            altitudeKm: 5.5,
            windSpeedKmh: 26.0,
            windDirectionDeg: 275,
            timestamp: new Date('2025-12-12T01:00:00Z'),
          },
        ],
        startTime: new Date('2025-12-12T00:00:00Z'),
        endTime: new Date('2025-12-12T01:00:00Z'),
      };

      const result = getWindDataAtTime(
        windData,
        new Date('2025-12-12T00:30:00Z')
      );

      expect(result).toBeDefined();
      expect(result?.windSpeedKmh).toBe(25.0); // Closer to first point
    });

    it('should return null if timestamp is too far from data', () => {
      const windData = {
        latitude: 40.7128,
        longitude: -74.006,
        pressureLevelHpa: 500,
        altitudeKm: 5.5,
        dataPoints: [
          {
            latitude: 40.7128,
            longitude: -74.006,
            pressureLevelHpa: 500,
            altitudeKm: 5.5,
            windSpeedKmh: 25.0,
            windDirectionDeg: 270,
            timestamp: new Date('2025-12-12T00:00:00Z'),
          },
        ],
        startTime: new Date('2025-12-12T00:00:00Z'),
        endTime: new Date('2025-12-12T00:00:00Z'),
      };

      const result = getWindDataAtTime(
        windData,
        new Date('2025-12-12T03:00:00Z') // 3 hours away
      );

      expect(result).toBeNull();
    });

    it('should return null for empty data points', () => {
      const windData = {
        latitude: 40.7128,
        longitude: -74.006,
        pressureLevelHpa: 500,
        altitudeKm: 5.5,
        dataPoints: [],
        startTime: new Date(),
        endTime: new Date(),
      };

      const result = getWindDataAtTime(windData, new Date());
      expect(result).toBeNull();
    });
  });

  describe('clearWindDataCache', () => {
    it('should clear the cache', async () => {
      const mockResponse: OpenMeteoResponse = {
        latitude: 40.7128,
        longitude: -74.006,
        hourly: {
          time: ['2025-12-12T00:00'],
          wind_speed_500hPa: [25.5],
          wind_direction_500hPa: [270],
        },
        hourly_units: {},
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // First call
      await fetchWindData(40.7128, -74.006, 500);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second call uses cache
      await fetchWindData(40.7128, -74.006, 500);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Clear cache
      clearWindDataCache();

      // Third call should fetch again
      await fetchWindData(40.7128, -74.006, 500);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});

