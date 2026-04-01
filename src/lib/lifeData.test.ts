import { describe, it, expect } from 'vitest';
import { 
  getExactAge, 
  getBiologyStats, 
  getCosmicStats, 
  getLifeInNumbers,
  getChineseZodiac
} from './lifeData';
import { DEFAULT_AVERAGES } from '../types';

describe('lifeData lib', () => {
  const birthDate = new Date('1990-01-01T00:00:00');
  const nowDate = new Date('2024-01-01T12:30:30');

  it('calculates exact age correctly', () => {
    const age = getExactAge(birthDate, nowDate);
    expect(age.years).toBe(34);
    expect(age.months).toBe(0);
    expect(age.days).toBe(0);
    expect(age.hours).toBe(12);
    expect(age.minutes).toBe(30);
    expect(age.seconds).toBe(30);
  });

  it('calculates biology stats correctly', () => {
    const stats = getBiologyStats(birthDate, nowDate, DEFAULT_AVERAGES);
    // 34 years * 365.25 days * 24 * 60 = 17,882,640 minutes
    // Plus 12.5 hours * 60 = 750 minutes
    // Total approx 17,883,390 minutes
    expect(stats.heartbeats).toBeGreaterThan(1000000000); // 1.2 billion+
    expect(stats.yearsSlept).toBeCloseTo(11.3, 0);
  });

  it('calculates cosmic stats correctly', () => {
    const stats = getCosmicStats(birthDate, nowDate);
    expect(stats.orbitsAroundSun).toBeCloseTo(34.0, 1);
    expect(stats.sunrises).toBeGreaterThan(12000);
  });

  it('calculates life in numbers correctly', () => {
    const stats = getLifeInNumbers(birthDate, nowDate, DEFAULT_AVERAGES);
    expect(stats.mealsEaten).toBeGreaterThan(37000); // 34 * 365 * 3
  });

  it('returns correct chinese zodiac', () => {
    expect(getChineseZodiac(1990).animal).toBe('Horse');
    expect(getChineseZodiac(1991).animal).toBe('Goat');
    expect(getChineseZodiac(2024).animal).toBe('Dragon');
  });
});
