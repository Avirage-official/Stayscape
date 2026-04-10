import { describe, it, expect } from 'vitest';
import { haversineMetres, formatDistanceDisplay } from '@/lib/mapbox/geocoding';

describe('haversineMetres', () => {
  it('returns 0 for the same point', () => {
    expect(haversineMetres(1.2897, 103.8501, 1.2897, 103.8501)).toBe(0);
  });

  it('calculates the approximate distance between NYC and LA', () => {
    // New York: 40.7128° N, 74.0060° W  →  Los Angeles: 34.0522° N, 118.2437° W
    // Known geodesic distance ≈ 3,940 km
    const metres = haversineMetres(40.7128, -74.006, 34.0522, -118.2437);
    expect(metres).toBeGreaterThan(3_900_000);
    expect(metres).toBeLessThan(4_000_000);
  });

  it('is symmetric — distance A→B equals distance B→A', () => {
    const d1 = haversineMetres(1.28, 103.85, 1.30, 103.87);
    const d2 = haversineMetres(1.30, 103.87, 1.28, 103.85);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe('formatDistanceDisplay', () => {
  it('formats distances below 1000 m as whole metres', () => {
    expect(formatDistanceDisplay(0)).toBe('0 m');
    expect(formatDistanceDisplay(500)).toBe('500 m');
    expect(formatDistanceDisplay(999)).toBe('999 m');
  });

  it('formats distances at or above 1000 m as kilometres with one decimal', () => {
    expect(formatDistanceDisplay(1000)).toBe('1.0 km');
    expect(formatDistanceDisplay(1500)).toBe('1.5 km');
    expect(formatDistanceDisplay(10000)).toBe('10.0 km');
  });
});
