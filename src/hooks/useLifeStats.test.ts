import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLifeStats } from './useLifeStats';

describe('useLifeStats hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set "today" to 2024-01-01
    const date = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no birthdate is provided', () => {
    const { result } = renderHook(() => useLifeStats('', 80));
    expect(result.current.lifeStats).toBeNull();
  });

  it('calculates life stats correctly for a given birthdate', () => {
    // Born exactly 30 years ago (assuming 365.25 day years for simplicity in this hook's logic)
    // Actually the hook uses 52 weeks per year for totalLifeWeeks
    const birthdate = '1994-01-01';
    const totalYears = 80;
    
    const { result } = renderHook(() => useLifeStats(birthdate, totalYears));
    
    const stats = result.current.lifeStats;
    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.currentYearOfLife).toBe(30);
      expect(stats.totalLifeWeeks).toBe(80 * 52);
      expect(stats.weeksPassed).toBeGreaterThanOrEqual(30 * 52);
    }
  });

  it('updates dynamic stats on tick', () => {
    const birthdate = '1990-01-01';
    const { result } = renderHook(() => useLifeStats(birthdate, 80));
    
    const initialSeconds = result.current.dynamicStats.secondsLived;
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.dynamicStats.secondsLived).toBe(initialSeconds + 1);
  });
});
