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
  /** Maps to itineraryitems.place_id (FK → places.id). */
  placeId: string;
  /** Display name — either titleoverride, the cached `name` column, or places.name. */
  name: string;
  /** Display category — cached on item, or from places.category. */
  category: string;
  /** Display image — cached on item, or from places.image_url. */
  image: string;
  /** Optional coordinates (from joined places row) — used for map preview. */
  lat?: number | null;
  lng?: number | null;
  date: Date;
  time: string;
  durationHours: number;
  /** Optional per-item note. */
  notes?: string | null;
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

export function ItineraryProvider({
  children,
  stayId,
}: {
  children: React.ReactNode;
  stayId?: string | null;
}) {
  const { user } = useAuth();
  const counterRef = useRef(0);
  const dbLoadedRef = useRef<boolean | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);

  const loadFromDb = useCallback(() => {
    if (!user) return;
    fetchItineraryItems(user.id, stayId ?? undefined)
      .then((dbItems) => {
        if (dbItems && dbItems.length > 0) {
          const mapped: ItineraryItem[] = dbItems.map((row) => ({
            id: row.id,
            placeId: row.place_id ?? '',
            name:
              row.titleoverride ??
              row.name ??
              row.places?.name ??
              '',
            category: row.category ?? row.places?.category ?? '',
            image: row.image ?? row.places?.image_url ?? '',
            lat: row.places?.latitude ?? null,
            lng: row.places?.longitude ?? null,
            date: new Date(row.scheduleddate),
            time: row.starttime ?? '',
            durationHours: row.durationhours ?? 1,
            notes: row.notes ?? null,
          }));
          setItems(mapped);
        }
      })
      .catch(() => {
        // Supabase unavailable — keep local state
      });
  }, [user, stayId]);

  // Load from DB on first render
  if (dbLoadedRef.current == null) {
    dbLoadedRef.current = true;
    loadFromDb();
  }

  const addItem = useCallback(
    (item: Omit<ItineraryItem, 'id'>) => {
      counterRef.current += 1;
      const localId = `itin-${counterRef.current}-${item.placeId}`;
      const newItem: ItineraryItem = { ...item, id: localId };

      // Optimistically add
      setItems((prev) => [...prev, newItem]);

      if (!user) return;

      getOrCreateItinerary(user.id, stayId ?? undefined)
        .then((itineraryId) => {
          if (!itineraryId) return;
          return insertItineraryItem(itineraryId, {
            place_id: item.placeId || null,
            titleoverride: item.name || null,
            scheduleddate: format(item.date, 'yyyy-MM-dd'),
            starttime: item.time,
            durationhours: item.durationHours,
            name: item.name || null,
            category: item.category || null,
            image: item.image || null,
          });
        })
        .then((dbId) => {
          if (dbId) {
            setItems((prev) =>
              prev.map((i) => (i.id === localId ? { ...i, id: dbId } : i)),
            );
          }
        })
        .catch(() => {
          // Write failed — local state still has the item
        });
    },
    [user, stayId],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<ItineraryItem, 'id'>>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      );

      const dbUpdates: {
        scheduleddate?: string;
        starttime?: string;
        durationhours?: number;
        notes?: string;
      } = {};
      if (updates.date) dbUpdates.scheduleddate = format(updates.date, 'yyyy-MM-dd');
      if (updates.time) dbUpdates.starttime = updates.time;
      if (updates.durationHours != null) dbUpdates.durationhours = updates.durationHours;
      if (updates.notes != null) dbUpdates.notes = updates.notes;

      if (Object.keys(dbUpdates).length > 0) {
        dbUpdateItem(id, dbUpdates).catch(() => {
          // Write failed — local state already updated
        });
      }
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    dbRemoveItem(id).catch(() => {
      // Delete failed — item already removed from UI
    });
  }, []);

  const value = useMemo(
    () => ({ items, addItem, updateItem, removeItem, loadFromDb }),
    [items, addItem, updateItem, removeItem, loadFromDb],
  );

  return <ItineraryContext value={value}>{children}</ItineraryContext>;
}
