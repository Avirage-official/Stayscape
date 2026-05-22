'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, X, User, BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getHotelAdminToken } from '@/lib/hotel-admin-token';

/* ── Types ──────────────────────────────────────────── */

type StayStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'pending';

interface Stay {
  id: string;
  booking_reference: string;
  guest_name: string;
  checkindate: string;
  checkoutdate: string;
  guestcount: number;
  room_number: string | null;
  status: StayStatus;
  notes: string | null;
  booking_source: string;
}

type FilterTab = 'all' | 'confirmed' | 'checked_in' | 'checked_out';

interface NewStayForm {
  guest_name: string;
  checkindate: string;
  checkoutdate: string;
  guestcount: number;
  room_number: string;
  notes: string;
}

const EMPTY_FORM: NewStayForm = {
  guest_name: '',
  checkindate: '',
  checkoutdate: '',
  guestcount: 1,
  room_number: '',
  notes: '',
};

const PAGE_LIMIT = 20;

/* ── Helpers ────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function nightsBetween(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/* ── Status badge ─────────────────────────────────────── */

function StatusBadge({ status }: { status: StayStatus }) {
  const styles: Record<StayStatus, string> = {
    pending:     'bg-white/[0.04] text-white/40 border border-white/10',
    confirmed:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    checked_in:  'bg-green-500/10 text-green-400 border border-green-500/20',
    checked_out: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    cancelled:   'bg-white/[0.04] text-white/30 border border-white/10',
  };

  const labels: Record<StayStatus, string> = {
    pending:     'Pending',
    confirmed:   'Confirmed',
    checked_in:  'Checked In',
    checked_out: 'Checked Out',
    cancelled:   'Cancelled',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/* ── Loading skeleton ───────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/[0.06] rounded w-1/3" />
        <div className="h-3 bg-white/[0.04] rounded w-1/4" />
      </div>
      <div className="h-6 bg-white/[0.06] rounded w-20" />
    </div>
  );
}

/* ── Add Stay Modal ─────────────────────────────────────── */

function AddStayModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewStayForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof NewStayForm, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const token = await getHotelAdminToken();
    if (!token) {
      setError('Session expired. Please sign in again.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel-admin/stays', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          room_number: form.room_number || null,
          notes: form.notes || null,
          guestcount: Number(form.guestcount),
        }),
      });

      const body = await res.json() as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Failed to create stay');
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 md:pb-0">
      <div className="bg-[#161614] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-white">Add Stay</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

          {/* Guest name */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40 font-medium">Guest Name *</label>
            <input
              type="text"
              required
              value={form.guest_name}
              onChange={(e) => update('guest_name', e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-white/40 font-medium">Check-in *</label>
              <input
                type="date"
                required
                value={form.checkindate}
                onChange={(e) => update('checkindate', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-white/40 font-medium">Check-out *</label>
              <input
                type="date"
                required
                value={form.checkoutdate}
                onChange={(e) => update('checkoutdate', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
          </div>

          {/* Room + Guest count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-white/40 font-medium">Room Number</label>
              <input
                type="text"
                value={form.room_number}
                onChange={(e) => update('room_number', e.target.value)}
                placeholder="e.g. 201"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-white/40 font-medium">Guests</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.guestcount}
                onChange={(e) => update('guestcount', parseInt(e.target.value, 10))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40 font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any special requests or notes..."
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-[13px] font-medium text-white/40 hover:text-white/60 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg py-2.5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-[13px] font-medium text-[#0d0d0d] bg-[#C9A84C] hover:bg-[#d4b35f] disabled:opacity-50 rounded-lg py-2.5 transition-colors"
            >
              {saving ? 'Saving…' : 'Add Stay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'confirmed',   label: 'Confirmed' },
  { key: 'checked_in',  label: 'In-House' },
  { key: 'checked_out', label: 'Checked Out' },
];

export default function StaysPage() {
  useHotelAdmin();

  const [stays, setStays]           = useState<Stay[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<FilterTab>('all');
  const [showModal, setShowModal]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_LIMIT));

  const fetchStays = useCallback(async (page: number, tab: FilterTab) => {
    setLoading(true);
    const token = await getHotelAdminToken();
    if (!token) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_LIMIT),
      });
      if (tab !== 'all') params.set('status', tab);

      const res = await fetch(`/api/hotel-admin/stays?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Failed to load stays');
        return;
      }

      const json = (await res.json()) as {
        data: Stay[];
        meta: { total: number; page: number; limit: number };
      };
      setStays(json.data);
      setTotalCount(json.meta.total);
      setError(null);
    } catch {
      setError('Failed to load stays');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever page or tab changes
  useEffect(() => {
    void fetchStays(currentPage, activeTab);
  }, [fetchStays, currentPage, activeTab]);

  // Reset to page 1 when switching tabs
  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  async function handleCancel(stay: Stay) {
    if (!confirm(`Cancel stay for ${stay.guest_name}?`)) return;

    setStays((prev) =>
      prev.map((s) => (s.id === stay.id ? { ...s, status: 'cancelled' } : s)),
    );

    const token = await getHotelAdminToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/hotel-admin/stays?id=${stay.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setStays((prev) =>
          prev.map((s) => (s.id === stay.id ? { ...s, status: stay.status } : s)),
        );
      } else {
        // Refresh the current page so count stays accurate
        void fetchStays(currentPage, activeTab);
      }
    } catch {
      setStays((prev) =>
        prev.map((s) => (s.id === stay.id ? { ...s, status: stay.status } : s)),
      );
    }
  }

  return (
    <div className="px-5 py-8 md:px-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-white">Stays</h1>
          {totalCount > 0 && (
            <p className="text-[12px] text-white/30 mt-0.5">{totalCount} total</p>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-[13px] font-medium text-[#0d0d0d] bg-[#C9A84C] hover:bg-[#d4b35f] rounded-lg px-4 py-2 transition-colors"
        >
          <Plus size={15} />
          Add Stay
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive ? 'text-[#C9A84C]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {label}
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

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && stays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CalendarDays size={32} className="text-white/20" />
          <p className="text-[13px] text-white/30">No stays yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-[12px] text-[#C9A84C] hover:text-[#d4b35f] transition-colors"
          >
            Add your first stay →
          </button>
        </div>
      )}

      {/* Stays list */}
      {!loading && stays.length > 0 && (
        <div className="space-y-3">
          {stays.map((stay) => (
            <div
              key={stay.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4"
            >
              {/* Left: info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium text-white truncate">
                    {stay.guest_name}
                  </span>
                  <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md shrink-0 font-mono">
                    {stay.booking_reference}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-white/30 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} />
                    {formatDate(stay.checkindate)} → {formatDate(stay.checkoutdate)}
                    <span className="text-white/20">
                      ({nightsBetween(stay.checkindate, stay.checkoutdate)}n)
                    </span>
                  </span>
                  {stay.room_number && (
                    <span className="flex items-center gap-1">
                      <BedDouble size={11} />
                      Room {stay.room_number}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {stay.guestcount} {stay.guestcount === 1 ? 'guest' : 'guests'}
                  </span>
                </div>
              </div>

              {/* Right: status + cancel */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={stay.status} />
                {stay.status !== 'cancelled' && stay.status !== 'checked_out' && (
                  <button
                    onClick={() => void handleCancel(stay)}
                    className="text-[12px] font-medium text-white/30 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[12px] text-white/30">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-[12px] font-medium text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-[12px] font-medium text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add Stay modal */}
      {showModal && (
        <AddStayModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setCurrentPage(1);
            void fetchStays(1, activeTab);
          }}
        />
      )}
    </div>
  );
}
