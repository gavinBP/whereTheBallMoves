/**
 * Wind data from Open-Meteo API
 */

/**
 * Wind vector with speed and direction
 */
export interface WindVector {
  speedKmh: number; // Wind speed in km/h
  directionDeg: number; // Wind direction in degrees (0-360, where 0 is North)
}

/**
 * Wind data at a specific pressure level and time
 */
export interface WindDataPoint {
  latitude: number;
  longitude: number;
  pressureLevelHpa: number;
  altitudeKm: number; // Approximate altitude corresponding to pressure level
  windSpeedKmh: number;
  windDirectionDeg: number;
  timestamp: Date;
}

/**
 * Historical wind data for a location over time
 */
export interface WindDataSeries {
  latitude: number;
  longitude: number;
  pressureLevelHpa: number;
  altitudeKm: number;
  dataPoints: WindDataPoint[];
  startTime: Date;
  endTime: Date;
}

/**
 * Open-Meteo API response structure for hourly wind data
 */
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[]; // ISO 8601 timestamps
    [key: string]: string[] | number[] | undefined; // Dynamic keys for different pressure levels
  };
  hourly_units: {
    [key: string]: string | undefined;
  };
}

/**
 * Result of fetching wind data from Open-Meteo
 */
export interface WindDataResult {
  success: boolean;
  data: WindDataSeries | null;
  error?: string;
  fetchedAt: Date;
}

/**
 * Cache entry for wind data
 */
export interface WindDataCacheEntry {
  key: string; // Format: "lat_lon_pressureLevel"
  data: WindDataSeries;
  fetchedAt: Date;
  expiresAt: Date;
}

