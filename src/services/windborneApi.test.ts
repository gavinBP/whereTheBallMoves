import axios from 'axios';
import { fetchBalloonData, fetchAllBalloonData, parseBalloonPosition } from './windborneApi';
import type { BalloonSnapshot } from '../types/balloon';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('windborneApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBalloonData', () => {
    it('should successfully fetch valid data', async () => {
      const mockData: BalloonSnapshot = [
        [40.7128, -74.006, 15.5],
        [34.0522, -118.2437, 12.3],
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchBalloonData(0);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.hour).toBe(0);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://a.windbornesystems.com/treasure/00.json',
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should handle invalid hour values', async () => {
      const result1 = await fetchBalloonData(-1);
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Invalid hour');

      const result2 = await fetchBalloonData(24);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Invalid hour');
    });

    it('should handle network errors', async () => {
      const networkError: any = new Error('Network Error');
      networkError.request = {};
      networkError.isAxiosError = true;
      mockedAxios.get.mockRejectedValueOnce(networkError);

      const result = await fetchBalloonData(0);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).not.toBe('Unknown error');
    });

    it('should handle invalid data format', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { invalid: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchBalloonData(0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data format');
    });

    it('should handle corrupted position data', async () => {
      const mockData: any = [
        [40.7128, -74.006, 15.5],
        [999, -74.006, 15.5], // Invalid latitude
        [40.7128, -74.006], // Missing altitude
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchBalloonData(0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data format');
    });

    it('should format hour with leading zero', async () => {
      const mockData: BalloonSnapshot = [[40.7128, -74.006, 15.5]];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await fetchBalloonData(5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://a.windbornesystems.com/treasure/05.json',
        expect.any(Object)
      );
    });
  });

  describe('fetchAllBalloonData', () => {
    it('should fetch all 24 hours in parallel', async () => {
      const mockData: BalloonSnapshot = [[40.7128, -74.006, 15.5]];

      mockedAxios.get.mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await fetchAllBalloonData();

      expect(result.results).toHaveLength(24);
      expect(result.successCount).toBe(24);
      expect(result.failureCount).toBe(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(24);
    });

    it('should track failures correctly', async () => {
      const mockData: BalloonSnapshot = [[40.7128, -74.006, 15.5]];

      // Make some requests fail
      mockedAxios.get
        .mockResolvedValueOnce({
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        })
        .mockRejectedValueOnce({ request: {}, message: 'Network Error' })
        .mockResolvedValue({
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      const result = await fetchAllBalloonData();

      expect(result.successCount).toBe(23);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('parseBalloonPosition', () => {
    it('should parse valid position', () => {
      const position: [number, number, number] = [40.7128, -74.006, 15.5];
      const parsed = parseBalloonPosition(position);

      expect(parsed).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        altitudeKm: 15.5,
      });
    });

    it('should reject invalid latitude', () => {
      const position = [999, -74.006, 15.5] as any;
      const parsed = parseBalloonPosition(position);
      expect(parsed).toBeNull();
    });

    it('should reject invalid longitude', () => {
      const position = [40.7128, -999, 15.5] as any;
      const parsed = parseBalloonPosition(position);
      expect(parsed).toBeNull();
    });

    it('should reject invalid altitude', () => {
      const position = [40.7128, -74.006, -10] as any;
      const parsed = parseBalloonPosition(position);
      expect(parsed).toBeNull();
    });

    it('should reject wrong array length', () => {
      const position = [40.7128, -74.006] as any;
      const parsed = parseBalloonPosition(position);
      expect(parsed).toBeNull();
    });
  });
});

