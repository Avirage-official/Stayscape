'use client';

import { useEffect, useState, useCallback } from 'react';
import { BedDouble } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/* ── Types ──────────────────────────────────────────────────────── */

type RoomStatus = 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'maintenance' | 'out_of_order';

interface PropertyRoom {
  id: string;
  propertyid: string;
  room_number: string;
  floor: string | null;
  room_type: string | null;
  bed_config: string | null;
  max_occupancy: number | null;
  status: RoomStatus;
  notes: string | null;
  createdat: string;
  updatedat: string;
}

type FilterTab = 'all' | RoomStatus;

/* ── Helpers ────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<RoomStatus, string> = {
  vacant_clean: 'Vacant Clean',
  vacant_dirty: 'Vacant Dirty',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  out_of_order: 'Out of Order',
};

const STATUS_STYLES: Record<RoomStatus, string> = {
  vacant_clean: 'bg-green-500/10 text-green-400 border border-green-500/20',
  vacant_dirty: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  occupied: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  maintenance: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  out_of_order: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

/* ── Status badge ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ── Loading skeleton ───────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse space-y-3">
      <div className="h-5 bg-white/[0.06] rounded w-1/2" />
      <div className="h-3 bg-white/[0.04] rounded w-2/3" />
      <div className="h-5 bg-white/[0.06] rounded w-1/3" />
      <div className="h-3 bg-white/[0.04] rounded w-1/2" />
      <div className="h-8 bg-white/[0.04] rounded w-full mt-3" />
    </div>
  );
}

/* ── Filter tabs ────────────────────────────────────────────────── */

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'vacant_clean', label: 'Vacant Clean' },
  { key: 'vacant_dirty', label: 'Vacant Dirty' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'maintenance', label: 'Maintenance' },
];

const SUMMARY_STATUSES: RoomStatus[] = [
  'vacant_clean',
  'vacant_dirty',
  'occupied',
  'maintenance',
  'out_of_order',
];

/* ── Main page ──────────────────────────────────────────────────── */

export default function RoomsPage() {
  useHotelAdmin(); // ensure we're inside the provider

  const [rooms, setRooms] = useState<PropertyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchRooms = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : null;

    if (!token) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel-admin/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to load rooms');
        return;
      }

      const data = (await res.json()) as { rooms: PropertyRoom[] };
      setRooms(data.rooms);
      setError(null);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  async function handleStatusChange(room: PropertyRoom, newStatus: RoomStatus) {
    // Optimistic update
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, status: newStatus } : r)),
    );

    const supabase = getSupabaseBrowser();
    const token = supabase
      ? (await supabase.auth.getSession()).data.session?.access_token
      : null;

    if (!token) return;

    try {
      const res = await fetch(`/api/hotel-admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert optimistic update on failure
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, status: room.status } : r)),
        );
      } else {
        const data = (await res.json()) as { room: PropertyRoom };
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? data.room : r)),
        );
      }
    } catch {
      // Revert optimistic update on error
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, status: room.status } : r)),
      );
    }
  }

  // Counts
  const counts: Record<FilterTab, number> = {
    all: rooms.length,
    vacant_clean: rooms.filter((r) => r.status === 'vacant_clean').length,
    vacant_dirty: rooms.filter((r) => r.status === 'vacant_dirty').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
    out_of_order: rooms.filter((r) => r.status === 'out_of_order').length,
  };

  const filteredRooms =
    activeTab === 'all' ? rooms : rooms.filter((r) => r.status === activeTab);

  return (
    <div className="px-5 py-8 md:px-8 space-y-6">
      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-white">Rooms</h1>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {SUMMARY_STATUSES.map((status) => (
          <span
            key={status}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium ${STATUS_STYLES[status]}`}
          >
            <span className="text-[15px] font-semibold">{counts[status]}</span>
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive ? 'text-[#C9A84C]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span
                  className={`ml-1.5 text-[11px] ${isActive ? 'text-[#C9A84C]/70' : 'text-white/20'}`}
                >
                  {counts[key]}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A84C] rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <BedDouble size={32} className="text-white/20" />
          <p className="text-[13px] text-white/30">No rooms added yet</p>
        </div>
      )}

      {/* Room grid */}
      {!loading && filteredRooms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
            >
              {/* Room number */}
              <p className="text-[18px] font-semibold text-white">{room.room_number}</p>

              {/* Floor + room type */}
              <p className="text-[11px] text-white/40 mt-0.5">
                {[room.floor ? `Floor ${room.floor}` : null, room.room_type]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>

              {/* Status badge */}
              <div className="mt-2">
                <StatusBadge status={room.status} />
              </div>

              {/* Bed config + max occupancy */}
              <p className="text-[11px] text-white/30 mt-2">
                {[room.bed_config, room.max_occupancy ? `Max ${room.max_occupancy}` : null]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>

              {/* Status selector */}
              <select
                value={room.status}
                onChange={(e) => void handleStatusChange(room, e.target.value as RoomStatus)}
                className="bg-[#1a1a1a] border border-white/10 text-[12px] text-white/60 rounded-lg px-2 py-1 w-full mt-3 cursor-pointer"
              >
                <option value="vacant_clean">Vacant Clean</option>
                <option value="vacant_dirty">Vacant Dirty</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
