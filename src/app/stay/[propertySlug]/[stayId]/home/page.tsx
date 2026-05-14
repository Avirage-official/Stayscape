'use client';

/**
 * /stay/[propertySlug]/[stayId]/home
 *
 * Hotel-branded home screen. Quick-action tiles fire real service_tasks
 * via POST /api/stays/[stayId]/services/request.
 *
 * Tiles tied to backend (insert service_tasks row):
 *   Room Service, Restaurants & Bars, Laundry, Transportation,
 *   Wake-up Call, Call Staff, Maintenance, Late Checkout
 *
 * Tiles that are info-only (no insert):
 *   Facilities, Amenities, Information
 */

import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { StayContext } from '../stay-context';
import type { DiscoveryPlaceCard } from '@/types/database';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

/* ─── Tile configuration ─── */

type TileAction =
  | { kind: 'request'; task_type: string; title: string }
  | { kind: 'info'; body: string };

interface Tile {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: TileAction;
}

const TILES: Tile[] = [
  {
    id: 'room_service',
    label: 'Room Service',
    icon: <IconBed />,
    action: { kind: 'request', task_type: 'room_service', title: 'Room service requested' },
  },
  {
    id: 'restaurants_bars',
    label: 'Restaurants & Bars',
    icon: <IconFork />,
    action: { kind: 'request', task_type: 'restaurant_reservation', title: 'Restaurant or bar reservation requested' },
  },
  {
    id: 'facilities',
    label: 'Facilities',
    icon: <IconDumbbell />,
    action: {
      kind: 'info',
      body: 'Pool, gym, sauna, and lounge access details are sent with your welcome message at check-in.',
    },
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: <IconCup />,
    action: {
      kind: 'info',
      body: 'Robes, slippers, kettles, and minibar are stocked daily. For anything missing, tap Room Service.',
    },
  },
  {
    id: 'laundry',
    label: 'Laundry',
    icon: <IconLaundry />,
    action: { kind: 'request', task_type: 'laundry', title: 'Laundry pickup requested' },
  },
  {
    id: 'transport',
    label: 'Transportation',
    icon: <IconCar />,
    action: { kind: 'request', task_type: 'taxi_booking', title: 'Transportation requested' },
  },
  {
    id: 'wakeup',
    label: 'Wake-up Call',
    icon: <IconClock />,
    action: { kind: 'request', task_type: 'wakeup_call', title: 'Wake-up call requested' },
  },
  {
    id: 'call_staff',
    label: 'Call Staff',
    icon: <IconStaff />,
    action: { kind: 'request', task_type: 'other', title: 'Guest requesting staff assistance' },
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: <IconWrench />,
    action: { kind: 'request', task_type: 'maintenance', title: 'Maintenance requested' },
  },
  {
    id: 'late_checkout',
    label: 'Late Checkout',
    icon: <IconKey />,
    action: { kind: 'request', task_type: 'late_checkout', title: 'Late checkout requested' },
  },
  {
    id: 'information',
    label: 'Information',
    icon: <IconInfo />,
    action: {
      kind: 'info',
      body: "Need anything else? Tap Ask Aria — she's your AI concierge and knows the hotel inside out.",
    },
  },
];

/* ─── Per-tile extra fields ─── */

interface TileFields {
  restaurantNotes?: string;    // Restaurants & Bars: reservation details
  laundryTime?: string;        // Laundry: preferred pickup time
  transportTime?: string;      // Transportation: pickup time
  transportDest?: string;      // Transportation: destination
  wakeupTime?: string;         // Wake-up Call: time
  roomServiceNotes?: string;   // Room Service: optional notes
  maintenanceNotes?: string;   // Maintenance: describe the issue
  lateCheckoutTime?: string;   // Late Checkout: desired checkout time
}

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--background)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 6,
  display: 'block',
};

/* ─── Main page ─── */

export default function StayHomePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const stayCtx = useContext(StayContext);

  const propertySlug =
    typeof params.propertySlug === 'string'
      ? params.propertySlug
      : Array.isArray(params.propertySlug)
        ? params.propertySlug[0]
        : '';
  const stayId =
    typeof params.stayId === 'string'
      ? params.stayId
      : Array.isArray(params.stayId)
        ? params.stayId[0]
        : '';

  const stay = stayCtx?.stay ?? null;
  const firstName =
    (user?.email && user.email.split('@')[0].split('.')[0]) || 'Guest';
  const propertyName = stay?.property?.name ?? 'your hotel';
  const regionId = stay?.property?.region_id ?? null;

  const [places, setPlaces] = useState<DiscoveryPlaceCard[]>([]);
  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    fetch(`/api/discovery/places?region_id=${regionId}&limit=4`)
      .then((r) => r.json())
      .then((body: { data?: DiscoveryPlaceCard[] }) => {
        if (!cancelled) setPlaces(body?.data ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [regionId]);

  const [activeTile, setActiveTile] = useState<Tile | null>(null);
  const [fields, setFields] = useState<TileFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openTile = (tile: Tile) => {
    setFields({});
    setActiveTile(tile);
  };

  const closeDialog = () => {
    if (submitting) return;
    setActiveTile(null);
    setFields({});
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  /* Build description string from per-tile fields */
  const buildDescription = (tile: Tile): string | undefined => {
    switch (tile.id) {
      case 'room_service':
        return fields.roomServiceNotes ? `Notes: ${fields.roomServiceNotes}` : undefined;
      case 'restaurants_bars':
        return fields.restaurantNotes ? `Details: ${fields.restaurantNotes}` : undefined;
      case 'laundry':
        return fields.laundryTime ? `Preferred pickup time: ${fields.laundryTime}` : undefined;
      case 'transport':
        return [
          fields.transportTime ? `Pickup time: ${fields.transportTime}` : null,
          fields.transportDest ? `Destination: ${fields.transportDest}` : null,
        ]
          .filter(Boolean)
          .join(' | ') || undefined;
      case 'wakeup':
        return fields.wakeupTime ? `Wake-up time: ${fields.wakeupTime}` : undefined;
      case 'maintenance':
        return fields.maintenanceNotes ? `Issue: ${fields.maintenanceNotes}` : undefined;
      case 'late_checkout':
        return fields.lateCheckoutTime ? `Desired checkout time: ${fields.lateCheckoutTime}` : undefined;
      default:
        return undefined;
    }
  };

  /* Validate required fields before submit */
  const canSubmit = (tile: Tile): boolean => {
    switch (tile.id) {
      case 'restaurants_bars':
        return !!fields.restaurantNotes?.trim();
      case 'transport':
        return !!fields.transportTime?.trim() && !!fields.transportDest?.trim();
      case 'wakeup':
        return !!fields.wakeupTime?.trim();
      case 'maintenance':
        return !!fields.maintenanceNotes?.trim();
      case 'late_checkout':
        return !!fields.lateCheckoutTime?.trim();
      default:
        return true;
    }
  };

  const submitRequest = async (tile: Tile) => {
    if (tile.action.kind !== 'request' || !stayId) return;
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      const description = buildDescription(tile);

      const res = await fetch(`/api/stays/${encodeURIComponent(stayId)}/services/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          task_type: tile.action.task_type,
          title: tile.action.title,
          ...(description ? { description } : {}),
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to send request');
      }

      setActiveTile(null);
      setFields({});
      showToast(`${tile.label} sent to the team.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div
      className={dmSans.className}
      style={{
        background: 'var(--background)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        padding: '28px 28px 48px',
      }}
    >
      {/* Greeting */}
      <p
        className={cormorant.className}
        style={{
          margin: 0,
          fontSize: 'clamp(28px, 4vw, 38px)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: 'var(--text-primary)',
        }}
      >
        {greeting},{' '}
        <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
          {firstName.charAt(0).toUpperCase() + firstName.slice(1)}.
        </span>
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)', fontWeight: 300 }}>
        How can we help at {propertyName}?
      </p>

      {/* Main grid */}
      <div className="stay-home-grid" style={{ marginTop: 28 }}>
        <style>{`
          .stay-home-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }
          @media (min-width: 1024px) {
            .stay-home-grid {
              grid-template-columns: minmax(0, 1fr) 320px;
              gap: 28px;
            }
          }
          .tile-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          @media (min-width: 640px) {
            .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
          }
          @media (min-width: 900px) {
            .tile-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          }
          @media (min-width: 1200px) {
            .tile-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          }
          .tile {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px;
            color: var(--text-primary);
          }
          .tile-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary);
            text-align: center;
            line-height: 1.3;
            letter-spacing: 0.01em;
          }
          .tile-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .amenity-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media (min-width: 900px) {
            .amenity-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          }
          .amenity-card { overflow: hidden; }
          .sh-input:focus { border-color: var(--gold) !important; }
          .sh-textarea:focus { border-color: var(--gold) !important; }
          @keyframes hd-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* LEFT: tiles */}
        <div>
          <div className="tile-grid ss-stagger">
            {TILES.map((tile) => (
              <div
                key={tile.id}
                className="tile ss-tile"
                role="button"
                tabIndex={0}
                onClick={() => openTile(tile)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTile(tile);
                  }
                }}
              >
                <div className="tile-icon ss-icon-chip">{tile.icon}</div>
                <p className="tile-label">{tile.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: weather */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            Weather Today
          </p>
          <div className="ss-card-raised" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                className="ss-icon-chip"
                style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <IconCloud />
              </div>
              <div>
                <p
                  className={cormorant.className}
                  style={{ margin: 0, fontSize: 28, fontWeight: 400, lineHeight: 1, color: 'var(--text-primary)' }}
                >
                  Coming soon
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {stay?.property?.city ?? 'Your destination'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)}
            className="ss-pill"
            style={{
              marginTop: 14,
              width: '100%',
              height: 48,
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
            }}
          >
            See local attractions nearby
            <span style={{ color: 'var(--gold)' }}>→</span>
          </button>
        </div>
      </div>

      {/* Hotel Amenities For You */}
      {places.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
              Hotel Amenities For You
            </p>
            <span
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/stay/${propertySlug}/${stayId}/discover`);
                }
              }}
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--gold)', cursor: 'pointer' }}
            >
              See all activities →
            </span>
          </div>

          <div className="amenity-row">
            {places.slice(0, 4).map((p) => {
              const img =
                p.image_url ??
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format&fit=crop';
              return (
                <div
                  key={p.id}
                  className="amenity-card ss-card-raised"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/stay/${propertySlug}/${stayId}/discover`);
                    }
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      backgroundImage: `url(${img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ padding: '12px 14px 14px' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    {p.category ? (
                      <p style={{ margin: '2px 0 0', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {p.category}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog */}
      {activeTile && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeDialog}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 16, 12, 0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'hd-fade 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 22,
              padding: 26,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Icon + title */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(201, 168, 117, 0.12)',
                color: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {activeTile.icon}
            </div>
            <p
              className={cormorant.className}
              style={{ margin: 0, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}
            >
              {activeTile.label}
            </p>

            {/* Info-only body */}
            {activeTile.action.kind === 'info' && (
              <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                {activeTile.action.body}
              </p>
            )}

            {/* ── Per-tile input forms ── */}

            {/* Room Service */}
            {activeTile.id === 'room_service' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                  We'll send housekeeping to your room shortly.
                </p>
                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea
                    className="sh-textarea"
                    rows={2}
                    placeholder="e.g. extra towels, pillow top-up…"
                    value={fields.roomServiceNotes ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, roomServiceNotes: e.target.value }))}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Restaurants & Bars */}
            {activeTile.id === 'restaurants_bars' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                  Let us know your preferred restaurant, date, time, and number of guests.
                </p>
                <div>
                  <label style={labelStyle}>Reservation details <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <textarea
                    className="sh-textarea"
                    rows={3}
                    placeholder="e.g. The Grill Room, tonight at 7:30pm, 2 guests"
                    value={fields.restaurantNotes ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, restaurantNotes: e.target.value }))}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Laundry */}
            {activeTile.id === 'laundry' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                  Leave your laundry bag outside the door. We'll pick it up at your preferred time.
                </p>
                <div>
                  <label style={labelStyle}>Preferred pickup time (optional)</label>
                  <input
                    className="sh-input"
                    type="time"
                    value={fields.laundryTime ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, laundryTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Transportation */}
            {activeTile.id === 'transport' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Pickup time <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input
                    className="sh-input"
                    type="time"
                    value={fields.transportTime ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, transportTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Destination <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input
                    className="sh-input"
                    type="text"
                    placeholder="e.g. Changi Airport, Orchard Road"
                    value={fields.transportDest ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, transportDest: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Wake-up Call */}
            {activeTile.id === 'wakeup' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Wake-up time <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input
                    className="sh-input"
                    type="time"
                    value={fields.wakeupTime ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, wakeupTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Call Staff */}
            {activeTile.id === 'call_staff' && (
              <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                A staff member will be notified and with you shortly.
              </p>
            )}

            {/* Maintenance */}
            {activeTile.id === 'maintenance' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                  Describe the issue and our maintenance team will attend to it promptly.
                </p>
                <div>
                  <label style={labelStyle}>Describe the issue <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <textarea
                    className="sh-textarea"
                    rows={3}
                    placeholder="e.g. Air conditioning not working, leaking tap in bathroom…"
                    value={fields.maintenanceNotes ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, maintenanceNotes: e.target.value }))}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* Late Checkout */}
            {activeTile.id === 'late_checkout' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                  Request a late checkout and we'll confirm availability with you.
                </p>
                <div>
                  <label style={labelStyle}>Desired checkout time <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input
                    className="sh-input"
                    type="time"
                    value={fields.lateCheckoutTime ?? ''}
                    onChange={(e) => setFields((f) => ({ ...f, lateCheckoutTime: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="ss-pill"
                style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 13, fontWeight: 500, opacity: submitting ? 0.5 : 1 }}
              >
                {activeTile.action.kind === 'info' ? 'Close' : 'Cancel'}
              </button>
              {activeTile.action.kind === 'request' && (
                <button
                  type="button"
                  onClick={() => submitRequest(activeTile)}
                  disabled={submitting || !canSubmit(activeTile)}
                  className="ss-gold-btn"
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: !canSubmit(activeTile) ? 0.4 : 1,
                  }}
                >
                  {submitting ? 'Sending…' : 'Send request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-primary)',
            color: 'var(--surface)',
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 200,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
            animation: 'hd-fade 0.25s ease',
            maxWidth: 'calc(100% - 40px)',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Inline icons ─── */

function svgProps() {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

function IconBed() {
  return (
    <svg {...svgProps()}>
      <path d="M3 18v-7a3 3 0 013-3h12a3 3 0 013 3v7" />
      <path d="M3 14h18" />
      <path d="M3 18h18" />
    </svg>
  );
}
function IconFork() {
  return (
    <svg {...svgProps()}>
      <path d="M7 2v8a3 3 0 003 3v9" />
      <path d="M11 2v6" />
      <path d="M3 2v6a4 4 0 004 4" />
      <path d="M17 2v20M17 2c2 0 3 2 3 5v6h-3" />
    </svg>
  );
}
function IconDumbbell() {
  return (
    <svg {...svgProps()}>
      <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />
    </svg>
  );
}
function IconCup() {
  return (
    <svg {...svgProps()}>
      <path d="M5 8h11v7a4 4 0 01-4 4H9a4 4 0 01-4-4V8z" />
      <path d="M16 10h2a2 2 0 010 4h-2" />
      <path d="M8 4v2M11 3v3" />
    </svg>
  );
}
function IconLaundry() {
  return (
    <svg {...svgProps()}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M8 6h.01M11 6h.01" />
    </svg>
  );
}
function IconCar() {
  return (
    <svg {...svgProps()}>
      <path d="M5 17h14M6 17l1-5h10l1 5M7 12l1.5-4h7L17 12" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 4l-2 2M19 4l2 2" />
    </svg>
  );
}
function IconStaff() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="9" r="3" />
      <path d="M5 21v-1a7 7 0 0114 0v1" />
      <path d="M9 5a3 3 0 016 0" />
    </svg>
  );
}
function IconWrench() {
  return (
    <svg {...svgProps()}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg {...svgProps()}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L21 8l-3-3" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01M12 11v5" />
    </svg>
  );
}
function IconCloud() {
  return (
    <svg {...svgProps()}>
      <path d="M17 18a4 4 0 000-8 6 6 0 00-11.5 2A4 4 0 006 18z" />
    </svg>
  );
}
