/**
 * Maps balloon altitude (in km) to Open-Meteo pressure levels (in hPa)
 * 
 * Standard atmosphere model approximation:
 * - Pressure decreases approximately exponentially with altitude
 * - Common pressure levels used in meteorology
 */

/**
 * Standard pressure levels and their approximate altitudes
 * Based on International Standard Atmosphere (ISA)
 */
const PRESSURE_LEVELS = [
  { pressureHpa: 1000, altitudeKm: 0.1 }, // Surface
  { pressureHpa: 850, altitudeKm: 1.5 }, // Lower troposphere
  { pressureHpa: 700, altitudeKm: 3.0 },
  { pressureHpa: 500, altitudeKm: 5.5 },
  { pressureHpa: 400, altitudeKm: 7.2 },
  { pressureHpa: 300, altitudeKm: 9.2 }, // Upper troposphere
  { pressureHpa: 250, altitudeKm: 10.4 },
  { pressureHpa: 200, altitudeKm: 11.8 },
  { pressureHpa: 150, altitudeKm: 13.6 },
  { pressureHpa: 100, altitudeKm: 16.2 }, // Lower stratosphere
  { pressureHpa: 70, altitudeKm: 18.4 },
  { pressureHpa: 50, altitudeKm: 20.5 }, // Mid stratosphere
  { pressureHpa: 30, altitudeKm: 23.5 },
  { pressureHpa: 20, altitudeKm: 26.5 },
  { pressureHpa: 10, altitudeKm: 31.2 }, // Upper stratosphere
] as const;

/**
 * Maps altitude (km) to the nearest Open-Meteo pressure level (hPa)
 * 
 * @param altitudeKm Altitude in kilometers
 * @returns Pressure level in hPa that Open-Meteo uses
 */
export function altitudeToPressureLevel(altitudeKm: number): number {
  if (altitudeKm < 0) {
    return 1000; // Surface level
  }

  if (altitudeKm > 35) {
    return 10; // Highest available level
  }

  // Find the pressure level with the closest altitude
  let closest: { pressureHpa: number; altitudeKm: number } = PRESSURE_LEVELS[0];
  let minDiff = Math.abs(PRESSURE_LEVELS[0].altitudeKm - altitudeKm);

  for (const level of PRESSURE_LEVELS) {
    const diff = Math.abs(level.altitudeKm - altitudeKm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = level;
    }
  }

  return closest.pressureHpa;
}

/**
 * Gets the approximate altitude (km) for a given pressure level (hPa)
 * 
 * @param pressureLevelHpa Pressure level in hPa
 * @returns Approximate altitude in kilometers
 */
export function pressureLevelToAltitude(pressureLevelHpa: number): number {
  const level = PRESSURE_LEVELS.find((p) => p.pressureHpa === pressureLevelHpa);
  
  if (level) {
    return level.altitudeKm;
  }

  // If exact match not found, interpolate between closest levels
  // For simplicity, return a linear approximation
  if (pressureLevelHpa > 1000) return 0;
  if (pressureLevelHpa < 10) return 35;

  // Linear interpolation in log space (pressure decreases exponentially)
  const logP = Math.log(pressureLevelHpa);
  const logP1 = Math.log(1000);
  const logP2 = Math.log(10);
  const alt1 = 0;
  const alt2 = 35;
  
  const ratio = (logP - logP1) / (logP2 - logP1);
  return alt1 + ratio * (alt2 - alt1);
}

/**
 * Gets all available pressure levels that Open-Meteo supports
 * 
 * @returns Array of pressure levels in hPa
 */
export function getAvailablePressureLevels(): number[] {
  return PRESSURE_LEVELS.map((level) => level.pressureHpa);
}

