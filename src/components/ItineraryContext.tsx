'use client';

import React, { createContext, useContext, useCallback, useRef, useMemo, useState } from 'react';

export interface ItineraryItem {
  id: string;
  placeId: string;
  name: string;
  category: string;
  image: string;
  date: Date;
  time: string;
  durationHours: number;
}

interface ItineraryContextType {
  items: ItineraryItem[];
  addItem: (item: Omit<ItineraryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<Omit<ItineraryItem, 'id'>>) => void;
  removeItem: (id: string) => void;
}

const ItineraryContext = createContext<ItineraryContextType | null>(null);

export function useItinerary() {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error('useItinerary must be used within ItineraryProvider');
  return ctx;
}

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  const counterRef = useRef(0);
  const [items, setItems] = useState<ItineraryItem[]>([]);

  const addItem = useCallback((item: Omit<ItineraryItem, 'id'>) => {
    counterRef.current += 1;
    const newItem: ItineraryItem = {
      ...item,
      id: `itin-${counterRef.current}-${item.placeId}`,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<ItineraryItem, 'id'>>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value = useMemo(
    () => ({ items, addItem, updateItem, removeItem }),
    [items, addItem, updateItem, removeItem],
  );

  return (
    <ItineraryContext value={value}>
      {children}
    </ItineraryContext>
  );
}
