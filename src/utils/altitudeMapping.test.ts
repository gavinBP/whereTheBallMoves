import {
  altitudeToPressureLevel,
  pressureLevelToAltitude,
  getAvailablePressureLevels,
} from './altitudeMapping';

describe('altitudeMapping', () => {
  describe('altitudeToPressureLevel', () => {
    it('should map low altitude to high pressure level', () => {
      expect(altitudeToPressureLevel(0)).toBe(1000);
      expect(altitudeToPressureLevel(1.5)).toBe(850);
    });

    it('should map mid altitude to mid pressure level', () => {
      expect(altitudeToPressureLevel(10)).toBe(250);
      expect(altitudeToPressureLevel(15)).toBe(100);
    });

    it('should map high altitude to low pressure level', () => {
      expect(altitudeToPressureLevel(20)).toBe(50);
      expect(altitudeToPressureLevel(25)).toBe(30);
    });

    it('should handle edge cases', () => {
      expect(altitudeToPressureLevel(-10)).toBe(1000); // Negative altitude -> surface
      expect(altitudeToPressureLevel(50)).toBe(10); // Very high altitude -> highest level
    });

    it('should return reasonable pressure levels for typical balloon altitudes', () => {
      // Typical weather balloon altitudes
      expect(altitudeToPressureLevel(2)).toBe(850); // Lower troposphere
      expect(altitudeToPressureLevel(10)).toBe(250); // Upper troposphere
      expect(altitudeToPressureLevel(20)).toBe(50); // Lower stratosphere
    });
  });

  describe('pressureLevelToAltitude', () => {
    it('should map pressure level to approximate altitude', () => {
      expect(pressureLevelToAltitude(1000)).toBeCloseTo(0.1, 1);
      expect(pressureLevelToAltitude(850)).toBeCloseTo(1.5, 1);
      expect(pressureLevelToAltitude(50)).toBeCloseTo(20.5, 1);
    });

    it('should handle edge cases', () => {
      expect(pressureLevelToAltitude(2000)).toBe(0); // Above max
      expect(pressureLevelToAltitude(5)).toBe(35); // Below min
    });
  });

  describe('getAvailablePressureLevels', () => {
    it('should return array of available pressure levels', () => {
      const levels = getAvailablePressureLevels();
      expect(levels.length).toBeGreaterThan(0);
      expect(levels).toContain(850);
      expect(levels).toContain(500);
      expect(levels).toContain(300);
      expect(levels).toContain(50);
    });

    it('should return levels in descending order', () => {
      const levels = getAvailablePressureLevels();
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i - 1]).toBeGreaterThan(levels[i]);
      }
    });
  });
});

