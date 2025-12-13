import axios from 'axios';
import type {
  BalloonSnapshot,
  BalloonPosition,
  BalloonDataResult,
  BalloonDataCollection,
  ParsedBalloonPosition,
} from '../types/balloon';

// Base URL for WindBorne API
// In development (browser with localhost), Vite proxy handles CORS via /api/windborne
// In production (Vercel), rewrites in vercel.json handle CORS via /api/windborne
// In tests, use direct URL (tests run in Node.js, not browser)
// Check if we're in test environment (Node.js with jsdom)
const isTest = typeof window === 'undefined' || 
  (window.navigator?.userAgent?.includes('jsdom') ?? false);

const WINDBORNE_BASE_URL = isTest
  ? 'https://a.windbornesystems.com/treasure'  // Direct URL for tests
  : '/api/windborne';  // Use proxy in browser (dev and production via Vercel rewrites)

/**
 * Parse a raw position array into a structured object
 */
function parsePosition(position: BalloonPosition): ParsedBalloonPosition | null {
  if (!Array.isArray(position) || position.length !== 3) {
    return null;
  }

  const [lat, lon, alt] = position;

  // Validate coordinate ranges
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    typeof alt !== 'number' ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    alt < 0 ||
    alt > 50 // Reasonable altitude limit for weather balloons
  ) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lon,
    altitudeKm: alt,
  };
}

/**
 * Validate that a snapshot contains valid position data
 */
function validateSnapshot(data: unknown): data is BalloonSnapshot {
  if (!Array.isArray(data)) {
    return false;
  }

  // Check that all entries are valid positions
  return data.every((pos) => {
    if (!Array.isArray(pos) || pos.length !== 3) {
      return false;
    }
    return parsePosition(pos as BalloonPosition) !== null;
  });
}

/**
 * Fetch balloon data for a specific hour (0 = current, 23 = 23 hours ago)
 */
export async function fetchBalloonData(
  hour: number
): Promise<BalloonDataResult> {
  if (hour < 0 || hour > 23) {
    return {
      hour,
      data: null,
      success: false,
      error: `Invalid hour: ${hour}. Must be between 0 and 23.`,
      timestamp: new Date(),
    };
  }

  const hourStr = hour < 10 ? `0${hour}` : String(hour);
  const url = `${WINDBORNE_BASE_URL}/${hourStr}.json`;

  try {
    const response = await axios.get<BalloonSnapshot>(url, {
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status === 200, // Only accept 200
    });

    // Validate the response data structure
    if (!validateSnapshot(response.data)) {
      return {
        hour,
        data: null,
        success: false,
        error: 'Invalid data format: expected array of [lat, lon, alt] arrays',
        timestamp: new Date(),
      };
    }

    return {
      hour,
      data: response.data,
      success: true,
      timestamp: new Date(),
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
      hour,
      data: null,
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch all 24 hours of balloon data in parallel
 */
export async function fetchAllBalloonData(): Promise<BalloonDataCollection> {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const results = await Promise.all(hours.map((hour) => fetchBalloonData(hour)));

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    results,
    successCount,
    failureCount,
    fetchedAt: new Date(),
  };
}

/**
 * Parse a raw position array into a structured object (exported for use in other modules)
 */
export function parseBalloonPosition(
  position: BalloonPosition
): ParsedBalloonPosition | null {
  return parsePosition(position);
}

