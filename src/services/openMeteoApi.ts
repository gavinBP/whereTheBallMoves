import axios from 'axios';
import type {
  WindDataResult,
  WindDataSeries,
  WindDataPoint,
  OpenMeteoResponse,
} from '../types/wind';
import { altitudeToPressureLevel, pressureLevelToAltitude } from '../utils/altitudeMapping';
import { parseISO } from 'date-fns';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Cache for wind data to reduce redundant API calls
 */
const windDataCache = new Map<string, { data: WindDataSeries; expiresAt: Date }>();

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate cache key for wind data request
 */
function getCacheKey(
  latitude: number,
  longitude: number,
  pressureLevelHpa: number
): string {
  // Round to 2 decimal places for cache key
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  return `${lat}_${lon}_${pressureLevelHpa}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(expiresAt: Date): boolean {
  return expiresAt > new Date();
}

/**
 * Parse Open-Meteo response into WindDataSeries
 */
function parseWindDataResponse(
  response: OpenMeteoResponse,
  pressureLevelHpa: number
): WindDataSeries {
  const altitudeKm = pressureLevelToAltitude(pressureLevelHpa);
  const windSpeedKey = `wind_speed_${pressureLevelHpa}hPa` as keyof typeof response.hourly;
  const windDirectionKey = `wind_direction_${pressureLevelHpa}hPa` as keyof typeof response.hourly;

  const times = response.hourly.time || [];
  const windSpeeds = (response.hourly[windSpeedKey] as number[]) || [];
  const windDirections = (response.hourly[windDirectionKey] as number[]) || [];

  const dataPoints: WindDataPoint[] = times.map((timeStr, index) => {
    const timestamp = parseISO(timeStr);
    return {
      latitude: response.latitude,
      longitude: response.longitude,
      pressureLevelHpa,
      altitudeKm,
      windSpeedKmh: windSpeeds[index] || 0,
      windDirectionDeg: windDirections[index] || 0,
      timestamp,
    };
  });

  return {
    latitude: response.latitude,
    longitude: response.longitude,
    pressureLevelHpa,
    altitudeKm,
    dataPoints,
    startTime: dataPoints.length > 0 ? dataPoints[0].timestamp : new Date(),
    endTime:
      dataPoints.length > 0
        ? dataPoints[dataPoints.length - 1].timestamp
        : new Date(),
  };
}

/**
 * Fetch wind data for a specific location and pressure level
 * 
 * @param latitude Latitude in degrees
 * @param longitude Longitude in degrees
 * @param pressureLevelHpa Pressure level in hPa (e.g., 500, 300, 50)
 * @param pastDays Number of past days to include (default: 1 for 24 hours)
 * @returns Wind data series
 */
export async function fetchWindData(
  latitude: number,
  longitude: number,
  pressureLevelHpa: number,
  pastDays: number = 1
): Promise<WindDataResult> {
  // Check cache first
  const cacheKey = getCacheKey(latitude, longitude, pressureLevelHpa);
  const cached = windDataCache.get(cacheKey);
  if (cached && isCacheValid(cached.expiresAt)) {
    return {
      success: true,
      data: cached.data,
      fetchedAt: new Date(),
    };
  }

  try {
    const url = `${OPEN_METEO_BASE_URL}`;
    const params = {
      latitude,
      longitude,
      hourly: [
        `wind_speed_${pressureLevelHpa}hPa`,
        `wind_direction_${pressureLevelHpa}hPa`,
      ].join(','),
      past_days: pastDays,
      timezone: 'UTC',
    };

    const response = await axios.get<OpenMeteoResponse>(url, {
      params,
      timeout: 10000,
    });

    const windData = parseWindDataResponse(response.data, pressureLevelHpa);

    // Cache the result
    windDataCache.set(cacheKey, {
      data: windData,
      expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
    });

    return {
      success: true,
      data: windData,
      fetchedAt: new Date(),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Network error: No response received';
      } else {
        errorMessage = `Request error: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      data: null,
      error: errorMessage,
      fetchedAt: new Date(),
    };
  }
}

/**
 * Fetch wind data for a balloon position (automatically maps altitude to pressure level)
 * 
 * @param latitude Latitude in degrees
 * @param longitude Longitude in degrees
 * @param altitudeKm Altitude in kilometers
 * @param pastDays Number of past days to include (default: 1 for 24 hours)
 * @returns Wind data series
 */
export async function fetchWindDataForAltitude(
  latitude: number,
  longitude: number,
  altitudeKm: number,
  pastDays: number = 1
): Promise<WindDataResult> {
  const pressureLevelHpa = altitudeToPressureLevel(altitudeKm);
  return fetchWindData(latitude, longitude, pressureLevelHpa, pastDays);
}

/**
 * Get wind data at a specific timestamp from a wind data series
 * 
 * @param windData Wind data series
 * @param timestamp Target timestamp
 * @returns Wind data point closest to the timestamp, or null if not found
 */
export function getWindDataAtTime(
  windData: WindDataSeries,
  timestamp: Date
): WindDataPoint | null {
  if (windData.dataPoints.length === 0) {
    return null;
  }

  // Find the closest data point to the target timestamp
  let closest = windData.dataPoints[0];
  let minDiff = Math.abs(closest.timestamp.getTime() - timestamp.getTime());

  for (const point of windData.dataPoints) {
    const diff = Math.abs(point.timestamp.getTime() - timestamp.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  // Only return if within 1 hour of the target time
  if (minDiff > 60 * 60 * 1000) {
    return null;
  }

  return closest;
}

/**
 * Clear the wind data cache
 */
export function clearWindDataCache(): void {
  windDataCache.clear();
}

