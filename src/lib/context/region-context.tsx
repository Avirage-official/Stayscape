'use client';

/**
 * Region Context
 *
 * Stores the user's selected region in localStorage and makes it
 * available to all components via React context.
 *
 * Selected region provides: id, name, latitude, longitude,
 * radius_km, country_code, slug.
 */

import { createContext, useContext, useState, useCallback } from 'react';

export interface SelectedRegion {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  country_code: string;
}

interface RegionContextValue {
  region: SelectedRegion | null;
  setRegion: (region: SelectedRegion) => void;
  clearRegion: () => void;
}

const STORAGE_KEY = 'stayscape_region';

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState<SelectedRegion | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SelectedRegion) : null;
    } catch {
      return null;
    }
  });

  const setRegion = useCallback((r: SelectedRegion) => {
    setRegionState(r);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, []);

  const clearRegion = useCallback(() => {
    setRegionState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <RegionContext.Provider value={{ region, setRegion, clearRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error('useRegion must be used inside <RegionProvider>');
  }
  return ctx;
}
