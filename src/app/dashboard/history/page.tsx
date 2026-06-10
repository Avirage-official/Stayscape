'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import GuestArrivalSkeleton from '@/components/guest-lounge/GuestArrivalSkeleton';

/* ── Fonts ─────────────────────────────────────────────── */

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300', '400', '600'],
  style: ['normal', 'italic'], display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap',
});

/* ── Types ──────────────────────────────────────────────── */

interface TripRegion {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  country_name: string | null;
  flag_emoji: string | null;
  image_url: string | null;
}

interface Trip {
  id: string;
  title: string | null;
  startdate: string | null;
  enddate: string | null;
  cover_image: string | null;
  item_count: number;
  is_past: boolean;
  is_upcoming: boolean;
  is_active: boolean;
  region: TripRegion | null;
}

interface Country {
  country_code: string;
  country_name: string | null;
  flag_emoji: string | null;
}

interface Patterns {
  avg_trip_days: number | null;
  avg_gap_days: number | null;
  most_visited_region: { name: string; count: number } | null;
  favourite_season: string | null;
  total_days_travelled: number | null;
}

interface HistoryData {
  stats: { total_trips: number; cities: number; countries: number };
  countries: Country[];
  upcoming: Trip[];
  past: Trip[];
  patterns: Patterns;
}

interface RegionOption {
  id: string;
  name: string;
  flag_emoji: string | null;
  country_name: string | null;
}

/* ── Helpers ────────────────────────────────────────────── */

async function getBearerToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session?.access_token ?? null;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShort(d: string | null): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

function getYear(d: string | null): string {
  if (!d) return 'Unknown';
  return new Date(d + 'T00:00:00').getFullYear().toString();
}

/* ── Sub-components ─────────────────────────────────────── */

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      animation: 'ht-shimmer 1.6s ease-in-out infinite',
      borderRadius: 10, ...style,
    }} />
  );
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 20px', minWidth: 80,
      borderRadius: 16,
      border: '1px solid rgba(253,249,242,0.09)',
      background: 'rgba(10,8,6,0.45)',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ fontSize: 26, fontWeight: 300, color: '#FAF8F5', lineHeight: 1, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)', marginTop: 5 }}>
        {label}
      </span>
    </div>
  );
}

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const duration = trip.startdate && trip.enddate
    ? Math.max(1, Math.round((new Date(trip.enddate).getTime() - new Date(trip.startdate).getTime()) / 86_400_000))
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
      }}
    >
      <div
        className="ht-trip-card"
        style={{
          display: 'flex', gap: 14, alignItems: 'center',
          padding: '14px 20px',
          borderRadius: 16,
          border: '1px solid rgba(253,249,242,0.08)',
          background: 'rgba(10,8,6,0.40)',
          backdropFilter: 'blur(12px)',
          transition: 'background 150ms ease, border-color 150ms ease',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          overflow: 'hidden', position: 'relative',
          background: 'rgba(193,127,58,0.10)',
          border: '1px solid rgba(193,127,58,0.15)',
        }}>
          {trip.cover_image || trip.region?.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={(trip.cover_image ?? trip.region?.image_url)!}
              alt={trip.region?.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>{trip.region?.flag_emoji ?? '🌍'}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#FAF8F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.title ?? trip.region?.name ?? 'Untitled trip'}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 300, color: 'rgba(253,249,242,0.45)' }}>
            {trip.startdate && trip.enddate
              ? `${fmtShort(trip.startdate)} – ${fmtShort(trip.enddate)}`
              : 'No dates'
            }
            {duration ? `  ·  ${duration}d` : ''}
          </p>
        </div>

        {/* Region chip */}
        {trip.region && (
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(253,249,242,0.06)',
            border: '1px solid rgba(253,249,242,0.10)',
          }}>
            {trip.region.flag_emoji && <span style={{ fontSize: 13 }}>{trip.region.flag_emoji}</span>}
            <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(253,249,242,0.60)' }}>{trip.region.name}</span>
          </div>
        )}

        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'rgba(253,249,242,0.20)', flexShrink: 0 }} aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </div>
    </button>
  );
}

/* ── Add Past Trip Modal ─────────────────────────────────── */

function AddTripModal({
  regions,
  onClose,
  onSaved,
}: {
  regions: RegionOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [regionId, setRegionId] = useState('');
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setErr(null);
    if (!regionId) return setErr('Please select a destination.');
    if (!startdate || !enddate) return setErr('Please enter both dates.');
    if (startdate > enddate) return setErr('Start date must be before end date.');

    setSaving(true);
    try {
      const token = await getBearerToken();
      const res = await fetch('/api/customer/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ region_id: regionId, startdate, enddate, title: title || undefined }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? 'Failed to save');
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        borderRadius: '20px 20px 0 0',
        background: '#141008',
        border: '1px solid rgba(253,249,242,0.10)',
        borderBottom: 'none',
        padding: '28px 24px',
        paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, fontStyle: 'italic', color: '#FAF8F5', fontFamily: 'Cormorant Garamond, serif' }}>
            Add a past trip
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(253,249,242,0.40)', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Destination */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)', display: 'block', marginBottom: 7 }}>
            Destination
          </span>
          <select
            value={regionId}
            onChange={e => setRegionId(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px',
              background: 'rgba(253,249,242,0.06)',
              border: '1px solid rgba(253,249,242,0.12)',
              borderRadius: 12, color: regionId ? '#FAF8F5' : 'rgba(253,249,242,0.35)',
              fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              appearance: 'none',
            }}
          >
            <option value="" disabled>Select a city…</option>
            {regions.map(r => (
              <option key={r.id} value={r.id} style={{ background: '#141008' }}>
                {r.flag_emoji ? `${r.flag_emoji} ` : ''}{r.name}{r.country_name ? `, ${r.country_name}` : ''}
              </option>
            ))}
          </select>
        </label>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)', display: 'block', marginBottom: 7 }}>
              From
            </span>
            <input type="date" value={startdate} onChange={e => setStartdate(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', background: 'rgba(253,249,242,0.06)',
                border: '1px solid rgba(253,249,242,0.12)', borderRadius: 12,
                color: '#FAF8F5', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                colorScheme: 'dark',
              }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)', display: 'block', marginBottom: 7 }}>
              To
            </span>
            <input type="date" value={enddate} onChange={e => setEnddate(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', background: 'rgba(253,249,242,0.06)',
                border: '1px solid rgba(253,249,242,0.12)', borderRadius: 12,
                color: '#FAF8F5', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                colorScheme: 'dark',
              }}
            />
          </label>
        </div>

        {/* Title (optional) */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)', display: 'block', marginBottom: 7 }}>
            Trip name <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </span>
          <input
            type="text"
            placeholder="e.g. Honeymoon in Tokyo"
            maxLength={100}
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', background: 'rgba(253,249,242,0.06)',
              border: '1px solid rgba(253,249,242,0.12)', borderRadius: 12,
              color: '#FAF8F5', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
            }}
          />
        </label>

        {err && (
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#E07070', fontWeight: 400 }}>{err}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '14px',
            background: saving ? 'rgba(193,127,58,0.30)' : '#C17F3A',
            border: 'none', borderRadius: 14,
            color: '#0E0B08', fontSize: 14, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'default' : 'pointer',
            transition: 'background 180ms ease',
          }}
        >
          {saving ? 'Saving…' : 'Save trip'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [regions, setRegions] = useState<RegionOption[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/guests');
  }, [authLoading, user, router]);

  const fetchHistory = useCallback(async () => {
    const token = await getBearerToken();
    if (!token) { setIsLoading(false); return; }
    try {
      const res = await fetch('/api/customer/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load history');
      setData(await res.json() as HistoryData);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchHistory();
  }, [user, fetchHistory]);

  // Fetch region list for "add past trip" modal
  useEffect(() => {
    async function loadRegions() {
      const sb = getSupabaseBrowser();
      if (!sb) return;
      const { data: rows } = await sb
        .from('regions')
        .select('id, name, flag_emoji, country_name')
        .eq('is_active', true)
        .order('name');
      setRegions((rows ?? []).map(r => ({
        id: r.id as string,
        name: r.name as string,
        flag_emoji: (r.flag_emoji as string | null) ?? null,
        country_name: (r.country_name as string | null) ?? null,
      })));
    }
    void loadRegions();
  }, []);

  if (authLoading || !user || isLoading) return <GuestArrivalSkeleton />;

  // Group past trips by year
  const byYear: Record<string, Trip[]> = {};
  for (const t of (data?.past ?? [])) {
    const y = getYear(t.startdate);
    (byYear[y] ??= []).push(t);
  }
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  const { stats, countries, upcoming, patterns } = data ?? {
    stats: { total_trips: 0, cities: 0, countries: 0 },
    countries: [], upcoming: [], patterns: { avg_trip_days: null, avg_gap_days: null, most_visited_region: null, favourite_season: null, total_days_travelled: null },
  };

  return (
    <div
      className={dmSans.className}
      style={{ minHeight: '100dvh', background: '#0A0806', color: '#FAF8F5' }}
    >
      <style>{`
        @keyframes ht-shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
        .ht-trip-card:hover { background: rgba(253,249,242,0.07) !important; border-color: rgba(253,249,242,0.13) !important; }
        .ht-country-chip:hover { background: rgba(193,127,58,0.18) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '28px 24px 0' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)' }}>
          Your travel
        </p>
        <h1 className={cormorant.className} style={{ margin: '0 0 20px', fontSize: 'clamp(2.2rem,5vw,3.4rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1, color: '#FAF8F5' }}>
          Passport.
        </h1>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatPill value={stats.total_trips} label="Trips" />
          <StatPill value={stats.cities} label="Cities" />
          <StatPill value={stats.countries} label="Countries" />
          {patterns.total_days_travelled ? <StatPill value={patterns.total_days_travelled} label="Days away" /> : null}
        </div>

        {/* Country flag chips */}
        {countries.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {countries.map(c => (
              <button
                key={c.country_code}
                type="button"
                className="ht-country-chip"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: 'rgba(193,127,58,0.10)',
                  border: '1px solid rgba(193,127,58,0.20)',
                  color: 'rgba(253,249,242,0.75)',
                  fontSize: 12, fontWeight: 400,
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {c.flag_emoji && <span style={{ fontSize: 15 }}>{c.flag_emoji}</span>}
                <span>{c.country_name ?? c.country_code}</span>
              </button>
            ))}
          </div>
        )}

        {/* Add past trip button */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            marginBottom: 32,
            padding: '10px 16px', borderRadius: 12,
            background: 'rgba(193,127,58,0.12)',
            border: '1px solid rgba(193,127,58,0.28)',
            color: '#C17F3A', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            transition: 'background 150ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add a past trip
        </button>
      </div>

      <div style={{ padding: '0 24px 80px' }}>

        {/* ── Upcoming ── */}
        {upcoming.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)' }}>
              Upcoming
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map(t => (
                <TripCard key={t.id} trip={t} onClick={() => router.push('/dashboard/planner')} />
              ))}
            </div>
          </section>
        )}

        {/* ── Past trips by year ── */}
        {years.length > 0 ? (
          years.map(year => (
            <section key={year} style={{ marginBottom: 32 }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)' }}>
                {year}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byYear[year].map(t => (
                  <TripCard key={t.id} trip={t} onClick={() => t.region ? router.push('/dashboard/explore') : router.push('/dashboard/planner')} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p className={cormorant.className} style={{ margin: '0 0 8px', fontSize: 22, fontStyle: 'italic', fontWeight: 300, color: 'rgba(253,249,242,0.35)' }}>
              No trips recorded yet.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(253,249,242,0.28)', fontWeight: 300 }}>
              Add a past trip or plan your next one.
            </p>
          </div>
        )}

        {/* ── Travel patterns ── */}
        {stats.total_trips >= 2 && (
          <section style={{ marginTop: 8 }}>
            <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,249,242,0.40)' }}>
              Your travel style
            </p>
            <div style={{
              borderRadius: 20,
              border: '1px solid rgba(253,249,242,0.09)',
              background: 'rgba(10,8,6,0.50)',
              backdropFilter: 'blur(16px)',
              overflow: 'hidden',
            }}>
              {[
                patterns.avg_trip_days != null && { label: 'Average trip length', value: `${patterns.avg_trip_days} days` },
                patterns.avg_gap_days != null && { label: 'Time between trips', value: `Every ~${patterns.avg_gap_days} days` },
                patterns.most_visited_region && { label: 'Favourite destination', value: `${patterns.most_visited_region.name} (${patterns.most_visited_region.count}×)` },
                patterns.favourite_season && { label: 'Favourite season to travel', value: patterns.favourite_season },
              ].filter(Boolean).map((item, i, arr) => {
                const row = item as { label: string; value: string };
                return (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(253,249,242,0.06)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(253,249,242,0.55)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#FAF8F5' }}>{row.value}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {showModal && (
        <AddTripModal
          regions={regions}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            setIsLoading(true);
            void fetchHistory();
          }}
        />
      )}
    </div>
  );
}
