'use client';

import React, { createContext, useContext, useCallback, useRef, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  getOrCreateItinerary,
  insertItineraryItem,
  updateItineraryItem as dbUpdateItem,
  removeItineraryItem as dbRemoveItem,
  fetchItineraryItems,
} from '@/lib/supabase/itinerary-repository';
import { useAuth } from '@/lib/context/auth-context';

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
  loadFromDb: () => void;
}

const ItineraryContext = createContext<ItineraryContextType | null>(null);

export function useItinerary() {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error('useItinerary must be used within ItineraryProvider');
  return ctx;
}

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const counterRef = useRef(0);
  const dbLoadedRef = useRef<boolean | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);

  const loadFromDb = useCallback(() => {
    if (!user) return;
    fetchItineraryItems(user.id)
      .then((dbItems) => {
        if (dbItems && dbItems.length > 0) {
          const mapped: ItineraryItem[] = dbItems.map((row) => ({
            id: row.id,
            placeId: row.discoveritemid,
            name: row.name,
            category: row.category,
            image: row.image,
            date: new Date(row.scheduleddate),
            time: row.starttime,
            durationHours: row.durationhours,
          }));
          setItems(mapped);
        }
      })
      .catch(() => {
        // Supabase unavailable — keep local state
      });
  }, [user]);

  // Load from DB on first render (using null-check pattern for eslint refs rule)
  if (dbLoadedRef.current == null) {
    dbLoadedRef.current = true;
    loadFromDb();
  }

  const addItem = useCallback((item: Omit<ItineraryItem, 'id'>) => {
    counterRef.current += 1;
    const localId = `itin-${counterRef.current}-${item.placeId}`;
    const newItem: ItineraryItem = { ...item, id: localId };

    // Optimistically add to local state
    setItems((prev) => [...prev, newItem]);

    if (!user) return;

    // Persist to Supabase in the background
    getOrCreateItinerary(user.id)
      .then((itineraryId) => {
        if (!itineraryId) return;
        return insertItineraryItem(itineraryId, {
          discoveritemid: item.placeId,
          name: item.name,
          category: item.category,
          image: item.image,
          scheduleddate: format(item.date, 'yyyy-MM-dd'),
          starttime: item.time,
          durationhours: item.durationHours,
        });
      })
      .then((dbId) => {
        if (dbId) {
          // Replace local id with real DB id
          setItems((prev) =>
            prev.map((i) => (i.id === localId ? { ...i, id: dbId } : i)),
          );
        }
      })
      .catch(() => {
        // Write failed — local state still has the item
      });
  }, [user]);

  const updateItem = useCallback((id: string, updates: Partial<Omit<ItineraryItem, 'id'>>) => {
    // Optimistically update local state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );

    // Persist to Supabase in the background
    const dbUpdates: Record<string, unknown> = {};
    if (updates.date) dbUpdates.scheduleddate = format(updates.date, 'yyyy-MM-dd');
    if (updates.time) dbUpdates.starttime = updates.time;
    if (updates.durationHours != null) dbUpdates.durationhours = updates.durationHours;

    if (Object.keys(dbUpdates).length > 0) {
      dbUpdateItem(id, dbUpdates as { scheduleddate?: string; starttime?: string; durationhours?: number })
        .catch(() => {
          // Write failed — local state is still updated
        });
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    // Optimistically remove from local state
    setItems((prev) => prev.filter((i) => i.id !== id));

    // Remove from Supabase in the background
    dbRemoveItem(id).catch(() => {
      // Delete failed — item already removed from UI
    });
  }, []);

  const value = useMemo(
    () => ({ items, addItem, updateItem, removeItem, loadFromDb }),
    [items, addItem, updateItem, removeItem, loadFromDb],
  );

  return (
    <ItineraryContext value={value}>
      {children}
    </ItineraryContext>
  );
}
