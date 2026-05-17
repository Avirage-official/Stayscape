'use client';

/**
 * /stay/[propertySlug]/[stayId]/home
 *
 * Hotel-branded home screen. Service tiles are built dynamically from
 * GET /api/customer/policies — only services the hotel has enabled are shown.
 *
 * Time-gate: if the hotel has set operating hours for a service, tapping the
 * tile outside those hours shows a full, dramatic unavailability dialog
 * with warm hospitality copy and a clear "resumes at X" badge.
 * No send button is shown — only a "Got it" dismiss.
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

// ─── Types ───

interface ServiceFlags {
  housekeeping_enabled: boolean;
  room_service_enabled: boolean;
  laundry_enabled: boolean;
  maintenance_enabled: boolean;
  transport_enabled: boolean;
  luggage_pickup_enabled: boolean;
  late_checkout_enabled: boolean;
  restaurant_enabled: boolean;
  restaurant_reservation_enabled: boolean;
}

interface PolicyText {
  laundry_policy: string | null;
  late_checkout_policy: string | null;
  late_checkout_fee: string | null;
  late_checkout_max_time: string | null;
  late_checkout_free_if_available: boolean;
  luggage_pickup_fee: string | null;
  transport_advance_notice_mins: number | null;
}

interface ServiceHourEntry {
  start?: string | null;
  end?: string | null;
  last_order?: string | null;
  pickup_start?: string | null;
  pickup_cutoff?: string | null;
  emergency_24hr?: boolean;
}

type ServiceHours = Partial<Record<string, ServiceHourEntry>>;

type TileAction =
  | { kind: 'request'; task_type: string; title: string }
  | { kind: 'info'; body: string };

interface Tile {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: TileAction;
  alwaysShow?: boolean;
}

interface TileFields {
  laundryTime?: string;
  laundryNotes?: string;
  restaurantNotes?: string;
  transportTime?: string;
  transportDest?: string;
  wakeupTime?: string;
  roomServiceNotes?: string;
  maintenanceIssue?: string;
  maintenanceNotes?: string;
  lateCheckoutTime?: string;
  luggageNotes?: string;
}

// ─── All possible tiles ───

const ALL_TILES: (Tile & { toggleKey?: keyof ServiceFlags })[] = [
  { id: 'housekeeping',    label: 'Housekeeping',       icon: <IconBed />,      action: { kind: 'request', task_type: 'housekeeping',          title: 'Housekeeping requested' },                      toggleKey: 'housekeeping_enabled' },
  { id: 'room_service',    label: 'Room Service',        icon: <IconFork />,     action: { kind: 'request', task_type: 'room_service',           title: 'Room service requested' },                      toggleKey: 'room_service_enabled' },
  { id: 'restaurants_bars',label: 'Restaurants & Bars',  icon: <IconFork />,     action: { kind: 'request', task_type: 'restaurant_reservation', title: 'Restaurant or bar reservation requested' },     toggleKey: 'restaurant_enabled' },
  { id: 'laundry',         label: 'Laundry',             icon: <IconLaundry />,  action: { kind: 'request', task_type: 'laundry',                title: 'Laundry pickup requested' },                    toggleKey: 'laundry_enabled' },
  { id: 'maintenance',     label: 'Maintenance',         icon: <IconWrench />,   action: { kind: 'request', task_type: 'maintenance',            title: 'Maintenance requested' },                       toggleKey: 'maintenance_enabled' },
  { id: 'transport',       label: 'Transportation',      icon: <IconCar />,      action: { kind: 'request', task_type: 'taxi_booking',           title: 'Transportation requested' },                    toggleKey: 'transport_enabled' },
  { id: 'luggage_pickup',  label: 'Luggage Pickup',      icon: <IconLuggage />,  action: { kind: 'request', task_type: 'luggage_pickup',         title: 'Luggage pickup requested' },                    toggleKey: 'luggage_pickup_enabled' },
  { id: 'late_checkout',   label: 'Late Checkout',       icon: <IconKey />,      action: { kind: 'request', task_type: 'late_checkout',          title: 'Late checkout requested' },                     toggleKey: 'late_checkout_enabled' },
  { id: 'wakeup',          label: 'Wake-up Call',        icon: <IconClock />,    action: { kind: 'request', task_type: 'wakeup_call',            title: 'Wake-up call requested' },                      alwaysShow: true },
  { id: 'call_staff',      label: 'Call Staff',          icon: <IconStaff />,    action: { kind: 'request', task_type: 'other',                  title: 'Guest requesting staff assistance' },            alwaysShow: true },
  { id: 'facilities',      label: 'Facilities',          icon: <IconDumbbell />, action: { kind: 'info', body: 'Pool, gym, sauna, and lounge access details are sent with your welcome message at check-in.' }, alwaysShow: true },
  { id: 'information',     label: 'Information',         icon: <IconInfo />,     action: { kind: 'info', body: "Need anything else? Tap Ask Aria — she's your AI concierge and knows the hotel inside out." },    alwaysShow: true },
];

// ─── Time-gate helpers ───

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(t: string | null | undefined): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getUnavailableReason(tileId: string, hours: ServiceHours): string | null {
  const entry = hours[tileId];
  if (!entry) return null;
  if (tileId === 'maintenance' && entry.emergency_24hr) return null;

  let start: string | null | undefined;
  let end: string | null | undefined;

  if (tileId === 'laundry') {
    start = entry.pickup_start;
    end   = entry.pickup_cutoff;
  } else if (tileId === 'room_service') {
    start = entry.start;
    end   = entry.last_order ?? entry.end;
  } else {
    start = entry.start;
    end   = entry.end;
  }

  const startMin = toMinutes(start);
  const endMin   = toMinutes(end);
  if (startMin === null || endMin === null) return null;

  const now = nowMinutes();
  if (now >= startMin && now < endMin) return null;
  if (now < startMin) return `resumes at ${fmt(start)}`;
  return `resumes tomorrow at ${fmt(start)}`;
}

// ─── Unavailability copy ───

const UNAVAILABLE_COPY: Record<string, { headline: string; subline: string; body: (r: string) => string }> = {
  housekeeping: {
    headline: 'Housekeeping is resting',
    subline:  'Our team will be back with you very soon.',
    body: (r) => `We completely understand how important a freshened room is, and we wish we could help right now. Our housekeeping team ${r} — please reach out then and we will take wonderful care of you.`,
  },
  room_service: {
    headline: 'Our kitchen is closed',
    subline:  'In-room dining will return shortly.',
    body: (r) => `We are so sorry — in-room dining ${r}. We know that is never the answer you want to hear, especially when hunger strikes. Our team will be ready to prepare something delicious for you very soon.`,
  },
  laundry: {
    headline: 'Laundry pickup has closed',
    subline:  'Our laundry team will be back with you soon.',
    body: (r) => `We apologise for the inconvenience. Our laundry team ${r}, and we will make sure your items receive the full care they deserve. Thank you so much for your patience.`,
  },
  maintenance: {
    headline: 'Maintenance is off-duty',
    subline:  'For urgent issues, please call the front desk.',
    body: (r) => `We are truly sorry you are experiencing an issue. Our maintenance team ${r}. If this is urgent, please call the front desk directly — we will do everything we can to help you right now.`,
  },
  transport: {
    headline: 'Transportation is unavailable',
    subline:  'Our transport service will return shortly.',
    body: (r) => `We apologise — our transport service ${r}. We hope this has not caused too much disruption to your plans. Please check back then and we will arrange everything for you.`,
  },
  luggage_pickup: {
    headline: 'Luggage pickup is closed',
    subline:  'Our bell team will return shortly.',
    body: (r) => `We are sorry for the inconvenience. Our bell team ${r} — they will be more than happy to assist you with your bags when they return.`,
  },
  restaurants_bars: {
    headline: 'Reservations are closed',
    subline:  'Our team will be ready to take your booking soon.',
    body: (r) => `We wish we could lock in your table right this moment. Our reservations team ${r} and will be delighted to help you plan a memorable meal.`,
  },
  late_checkout: {
    headline: 'Late checkout requests are paused',
    subline:  'Our front desk will be back to assist you soon.',
    body: (r) => `We are sorry — our front desk team processes late checkout requests ${r}. We will do our very best to accommodate you when we open.`,
  },
  default: {
    headline: 'This service is currently unavailable',
    subline:  'Our team will be ready to help you very soon.',
    body: (r) => `We sincerely apologise. This service ${r}. Thank you so much for your understanding — we look forward to being of service.`,
  },
};

function getUnavailableCopy(tileId: string, resumesAt: string) {
  const copy = UNAVAILABLE_COPY[tileId] ?? UNAVAILABLE_COPY.default;
  return { headline: copy.headline, subline: copy.subline, body: copy.body(resumesAt) };
}

// ─── Helpers ───

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

async function getBearerToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.access_token ?? null;
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

const policyBoxStyle: React.CSSProperties = {
  background: 'rgba(201, 168, 117, 0.07)',
  border: '1px solid rgba(201, 168, 117, 0.18)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--text-muted)',
  fontWeight: 300,
};

// ─── Main page ───

export default function StayHomePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const stayCtx = useContext(StayContext);

  const propertySlug = typeof params.propertySlug === 'string' ? params.propertySlug : Array.isArray(params.propertySlug) ? params.propertySlug[0] : '';
  const stayId       = typeof params.stayId === 'string'       ? params.stayId       : Array.isArray(params.stayId)       ? params.stayId[0]       : '';

  const stay         = stayCtx?.stay ?? null;
  const firstName    = (user?.email && user.email.split('@')[0].split('.')[0]) || 'Guest';
  const propertyName = stay?.property?.name ?? 'your hotel';
  const regionId     = stay?.property?.region_id ?? null;

  // ── Policies ──
  const [services, setServices]         = useState<ServiceFlags | null>(null);
  const [policyText, setPolicyText]     = useState<PolicyText>({
    laundry_policy: null, late_checkout_policy: null, late_checkout_fee: null,
    late_checkout_max_time: null, late_checkout_free_if_available: false,
    luggage_pickup_fee: null, transport_advance_notice_mins: null,
  });
  const [serviceHours, setServiceHours] = useState<ServiceHours>({});
  const [policiesLoading, setPoliciesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getBearerToken();
        const res = await fetch('/api/customer/policies', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          services: ServiceFlags;
          policy_text: PolicyText;
          service_hours?: ServiceHours;
        };
        if (!cancelled) {
          setServices(json.services);
          setPolicyText(json.policy_text);
          setServiceHours(json.service_hours ?? {});
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setPoliciesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Visible tiles ──
  const visibleTiles = useMemo(() => ALL_TILES.filter((tile) => {
    if (tile.alwaysShow) return true;
    if (!tile.toggleKey) return true;
    if (services === null) return false;
    return services[tile.toggleKey] === true;
  }), [services]);

  // ── Discovery places ──
  const [places, setPlaces] = useState<DiscoveryPlaceCard[]>([]);
  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    fetch(`/api/discovery/places?region_id=${regionId}&limit=4`)
      .then((r) => r.json())
      .then((body: { data?: DiscoveryPlaceCard[] }) => { if (!cancelled) setPlaces(body?.data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [regionId]);

  // ── Dialog state ──
  const [activeTile, setActiveTile]             = useState<Tile | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [fields, setFields]                     = useState<TileFields>({});
  const [submitting, setSubmitting]             = useState(false);
  const [toast, setToast]                       = useState<string | null>(null);

  const openTile = (tile: Tile) => {
    setFields({});
    const reason = tile.action.kind === 'request' ? getUnavailableReason(tile.id, serviceHours) : null;
    setUnavailableReason(reason);
    setActiveTile(tile);
  };

  const closeDialog = () => {
    if (submitting) return;
    setActiveTile(null);
    setFields({});
    setUnavailableReason(null);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const buildDescription = (tile: Tile): string | undefined => {
    switch (tile.id) {
      case 'housekeeping':
      case 'room_service':    return fields.roomServiceNotes  ? `Notes: ${fields.roomServiceNotes}`         : undefined;
      case 'restaurants_bars':return fields.restaurantNotes   ? `Details: ${fields.restaurantNotes}`        : undefined;
      case 'laundry': {
        const parts = [fields.laundryTime ? `Preferred pickup time: ${fields.laundryTime}` : null, fields.laundryNotes ? `Notes: ${fields.laundryNotes}` : null].filter(Boolean);
        return parts.length ? parts.join(' | ') : undefined;
      }
      case 'transport':       return [fields.transportTime ? `Pickup time: ${fields.transportTime}` : null, fields.transportDest ? `Destination: ${fields.transportDest}` : null].filter(Boolean).join(' | ') || undefined;
      case 'wakeup':          return fields.wakeupTime         ? `Wake-up time: ${fields.wakeupTime}`       : undefined;
      case 'maintenance':     return [fields.maintenanceIssue ? `Issue: ${fields.maintenanceIssue}` : null, fields.maintenanceNotes ? `Details: ${fields.maintenanceNotes}` : null].filter(Boolean).join(' | ') || undefined;
      case 'late_checkout':   return fields.lateCheckoutTime  ? `Desired checkout time: ${fields.lateCheckoutTime}` : undefined;
      case 'luggage_pickup':  return fields.luggageNotes      ? `Notes: ${fields.luggageNotes}`            : undefined;
      default:                return undefined;
    }
  };

  const canSubmit = (tile: Tile): boolean => {
    if (unavailableReason) return false;
    switch (tile.id) {
      case 'restaurants_bars': return !!fields.restaurantNotes?.trim();
      case 'transport':        return !!fields.transportTime?.trim() && !!fields.transportDest?.trim();
      case 'wakeup':           return !!fields.wakeupTime?.trim();
      case 'maintenance':      return !!fields.maintenanceIssue?.trim();
      case 'late_checkout':    return !!fields.lateCheckoutTime?.trim();
      default:                 return true;
    }
  };

  const submitRequest = async (tile: Tile) => {
    if (tile.action.kind !== 'request' || !stayId) return;
    setSubmitting(true);
    try {
      const token = await getBearerToken();
      const res = await fetch('/api/customer/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ task_type: tile.action.task_type, title: tile.action.title, description: buildDescription(tile) ?? null }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to send request');
      }
      setActiveTile(null); setFields({}); setUnavailableReason(null);
      showToast(`${tile.label} request sent to the team.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const greeting = useMemo(() => getGreeting(), []);

  const unavailableCopy = useMemo(() => {
    if (!activeTile || !unavailableReason) return null;
    return getUnavailableCopy(activeTile.id, unavailableReason);
  }, [activeTile, unavailableReason]);

  return (
    <div className={dmSans.className} style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--text-primary)', padding: '28px 28px 48px' }}>
      <style>{`
        .stay-home-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1024px) { .stay-home-grid { grid-template-columns: minmax(0, 1fr) 320px; gap: 28px; } }
        .tile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        @media (min-width: 640px)  { .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; } }
        @media (min-width: 900px)  { .tile-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (min-width: 1200px) { .tile-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
        .tile {
          aspect-ratio: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; padding: 12px;
          color: var(--text-primary); cursor: pointer; border-radius: 14px;
          border: 1px solid var(--border); background: var(--surface);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .tile:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .tile:active { transform: scale(0.97); }
        .tile-label  { font-size: 11px; font-weight: 500; color: var(--text-secondary); text-align: center; line-height: 1.3; letter-spacing: 0.01em; }
        .tile-icon   { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; color: var(--gold); }
        .amenity-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        @media (min-width: 900px) { .amenity-row { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .amenity-card { overflow: hidden; cursor: pointer; }
        .sh-input:focus, .sh-textarea:focus { border-color: var(--gold) !important; }
        @keyframes hd-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hd-scale { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .tile-skeleton {
          aspect-ratio: 1; border-radius: 14px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%; animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* ─── Time-gate dialog styles ─── */
        .unavail-overlay {
          position: fixed; inset: 0; z-index: 110;
          display: flex; align-items: flex-end;
          background: rgba(10, 8, 6, 0.72);
          backdrop-filter: blur(12px);
          animation: hd-fade 0.22s ease;
        }
        .unavail-sheet {
          width: 100%;
          background: var(--surface);
          border-radius: 28px 28px 0 0;
          padding: 10px 28px 40px;
          box-shadow: 0 -24px 80px rgba(0,0,0,0.4);
          border-top: 1px solid var(--border);
          animation: hd-scale 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @media (min-width: 520px) {
          .unavail-overlay { align-items: center; }
          .unavail-sheet {
            max-width: 480px;
            margin: auto;
            border-radius: 28px;
            padding: 32px 36px 36px;
          }
        }
        .unavail-pill {
          width: 40px; height: 4px; border-radius: 99px;
          background: var(--border); margin: 0 auto 28px;
        }
        @media (min-width: 520px) { .unavail-pill { display: none; } }
        .unavail-icon-ring {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(135deg, rgba(201,168,117,0.14), rgba(201,168,117,0.04));
          border: 1px solid rgba(201,168,117,0.2);
          color: var(--gold);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
        }
        .unavail-headline {
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 400; line-height: 1.15;
          color: var(--text-primary);
          margin: 0 0 6px;
        }
        .unavail-subline {
          font-size: 14px; color: var(--text-muted); font-weight: 300;
          margin: 0 0 18px; line-height: 1.5;
        }
        .unavail-body {
          font-size: 13px; line-height: 1.7;
          color: var(--text-muted); font-weight: 300;
          margin: 0 0 22px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .unavail-resume-badge {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, rgba(201,168,117,0.12), rgba(201,168,117,0.05));
          border: 1px solid rgba(201,168,117,0.25);
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 24px;
        }
        .unavail-resume-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--gold); margin: 0 0 2px;
        }
        .unavail-resume-time {
          font-size: 18px; font-weight: 500;
          color: var(--text-primary); margin: 0;
          line-height: 1.1;
        }
      `}</style>

      {/* Greeting */}
      <p className={cormorant.className} style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, lineHeight: 1.15 }}>
        {greeting},{' '}
        <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
          {firstName.charAt(0).toUpperCase() + firstName.slice(1)}.
        </span>
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)', fontWeight: 300 }}>
        How can we help at {propertyName}?
      </p>

      <div className="stay-home-grid" style={{ marginTop: 28 }}>
        {/* LEFT: tiles */}
        <div>
          {policiesLoading ? (
            <div className="tile-grid">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tile-skeleton" />)}
            </div>
          ) : (
            <div className="tile-grid">
              {visibleTiles.map((tile) => (
                <div key={tile.id} className="tile" role="button" tabIndex={0}
                  onClick={() => openTile(tile)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTile(tile); } }}
                >
                  <div className="tile-icon">{tile.icon}</div>
                  <p className="tile-label">{tile.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: weather + discover CTA */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Weather Today</p>
          <div className="ss-card-raised" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(201,168,117,0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCloud />
              </div>
              <div>
                <p className={cormorant.className} style={{ margin: 0, fontSize: 28, fontWeight: 400, lineHeight: 1, color: 'var(--text-primary)' }}>Coming soon</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{stay?.property?.city ?? 'Your destination'}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)} className="ss-pill"
            style={{ marginTop: 14, width: '100%', height: 48, borderRadius: 14, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
            See local attractions nearby
            <span style={{ color: 'var(--gold)' }}>→</span>
          </button>
        </div>
      </div>

      {/* Hotel Amenities */}
      {places.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Hotel Amenities For You</p>
            <span role="button" tabIndex={0}
              onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/stay/${propertySlug}/${stayId}/discover`); } }}
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--gold)', cursor: 'pointer' }}
            >See all activities →</span>
          </div>
          <div className="amenity-row">
            {places.slice(0, 4).map((p) => {
              const img = p.image_url ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format&fit=crop';
              return (
                <div key={p.id} className="amenity-card ss-card-raised" role="button" tabIndex={0}
                  onClick={() => router.push(`/stay/${propertySlug}/${stayId}/discover`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/stay/${propertySlug}/${stayId}/discover`); } }}
                >
                  <div style={{ width: '100%', aspectRatio: '4 / 3', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ padding: '12px 14px 14px' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    {p.category && <p style={{ margin: '2px 0 0', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{p.category}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TIME-GATE DIALOG — bottom sheet on mobile, centred card on desktop ─── */}
      {activeTile && unavailableReason && unavailableCopy && (
        <div className="unavail-overlay" role="dialog" aria-modal="true" onClick={closeDialog}>
          <div className="unavail-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="unavail-pill" />

            <div className="unavail-icon-ring">
              <IconMoon size={32} />
            </div>

            <p className={`${cormorant.className} unavail-headline`}>
              {unavailableCopy.headline}
            </p>
            <p className="unavail-subline">{unavailableCopy.subline}</p>

            <p className="unavail-body">{unavailableCopy.body}</p>

            {/* Resumption time badge — the key info, big and gold */}
            <div className="unavail-resume-badge">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,168,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                <IconClock2 size={18} />
              </div>
              <div>
                <p className="unavail-resume-label">Next available</p>
                <p className="unavail-resume-time">
                  {unavailableReason.charAt(0).toUpperCase() + unavailableReason.slice(1)}
                </p>
              </div>
            </div>

            <button type="button" onClick={closeDialog} className="ss-gold-btn"
              style={{ width: '100%', height: 50, borderRadius: 16, fontSize: 14, fontWeight: 600 }}>
              Got it, thank you
            </button>
          </div>
        </div>
      )}

      {/* ─── NORMAL REQUEST / INFO DIALOG ─── */}
      {activeTile && !unavailableReason && (
        <div role="dialog" aria-modal="true" onClick={closeDialog}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.55)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'hd-fade 0.2s ease' }}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: 22, padding: 26, maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(201,168,117,0.12)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {activeTile.icon}
            </div>
            <p className={cormorant.className} style={{ margin: 0, fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' }}>
              {activeTile.label}
            </p>

            {activeTile.action.kind === 'info' && (
              <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>{activeTile.action.body}</p>
            )}

            {activeTile.id === 'housekeeping' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>Your room will be attended to shortly.</p>
                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea className="sh-textarea" rows={2} placeholder="e.g. extra towels, more hangers…" value={fields.roomServiceNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, roomServiceNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'room_service' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>In-room dining request. Let us know what you&apos;d like and the team will confirm your order shortly.</p>
                <div>
                  <label style={labelStyle}>What would you like? (optional)</label>
                  <textarea className="sh-textarea" rows={3} placeholder="e.g. burger and fries, sparkling water…" value={fields.roomServiceNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, roomServiceNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'restaurants_bars' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>Let us know your preferred restaurant, date, time, and number of guests. We will confirm shortly.</p>
                <div>
                  <label style={labelStyle}>Reservation details <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <textarea className="sh-textarea" rows={3} placeholder="e.g. The Grill Room, tonight at 7:30pm, 2 guests" value={fields.restaurantNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, restaurantNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'laundry' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>Leave your laundry bag outside the door and we&apos;ll collect it at your preferred time.</p>
                {policyText.laundry_policy && <div style={policyBoxStyle}>{policyText.laundry_policy}</div>}
                <div>
                  <label style={labelStyle}>Preferred pickup time (optional)</label>
                  <input className="sh-input" type="time" value={fields.laundryTime ?? ''} onChange={(e) => setFields((f) => ({ ...f, laundryTime: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Special instructions (optional)</label>
                  <textarea className="sh-textarea" rows={2} placeholder="e.g. delicate items, no tumble dry…" value={fields.laundryNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, laundryNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'maintenance' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>Our maintenance team will attend to the issue promptly.</p>
                <div>
                  <label style={labelStyle}>Type of issue <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <select className="sh-input" value={fields.maintenanceIssue ?? ''} onChange={(e) => setFields((f) => ({ ...f, maintenanceIssue: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="">Select an issue…</option>
                    <option>AC not working</option><option>Heating not working</option>
                    <option>Light bulb out</option><option>Plumbing / leaking tap</option>
                    <option>TV / remote issue</option><option>Door lock issue</option>
                    <option>Safe not opening</option><option>No hot water</option>
                    <option>Blocked drain</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Additional details (optional)</label>
                  <textarea className="sh-textarea" rows={2} placeholder="Any extra detail that helps the team…" value={fields.maintenanceNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, maintenanceNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'transport' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {policyText.transport_advance_notice_mins != null && (
                  <div style={policyBoxStyle}>Please book at least {policyText.transport_advance_notice_mins} minutes in advance.</div>
                )}
                <div>
                  <label style={labelStyle}>Pickup time <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input className="sh-input" type="time" value={fields.transportTime ?? ''} onChange={(e) => setFields((f) => ({ ...f, transportTime: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Destination <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input className="sh-input" type="text" placeholder="e.g. Changi Airport, Orchard Road" value={fields.transportDest ?? ''} onChange={(e) => setFields((f) => ({ ...f, transportDest: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            )}

            {activeTile.id === 'luggage_pickup' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {policyText.luggage_pickup_fee && <div style={policyBoxStyle}>Fee: {policyText.luggage_pickup_fee}</div>}
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>A member of the team will collect your bags from your room.</p>
                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea className="sh-textarea" rows={2} placeholder="e.g. number of bags, ready time…" value={fields.luggageNotes ?? ''} onChange={(e) => setFields((f) => ({ ...f, luggageNotes: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {activeTile.id === 'wakeup' && (
              <div style={{ margin: '14px 0 18px' }}>
                <label style={labelStyle}>Wake-up time <span style={{ color: 'var(--gold)' }}>*</span></label>
                <input className="sh-input" type="time" value={fields.wakeupTime ?? ''} onChange={(e) => setFields((f) => ({ ...f, wakeupTime: e.target.value }))} style={inputStyle} />
              </div>
            )}

            {activeTile.id === 'call_staff' && (
              <p style={{ margin: '8px 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>A member of the team will be with you shortly.</p>
            )}

            {activeTile.id === 'late_checkout' && (
              <div style={{ margin: '14px 0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 300 }}>Request a late checkout and we&apos;ll confirm availability with you.</p>
                <div style={policyBoxStyle}>
                  {policyText.late_checkout_policy
                    ? policyText.late_checkout_policy
                    : policyText.late_checkout_free_if_available
                      ? 'Late checkout is complimentary when availability allows.'
                      : 'Late checkout is subject to availability and may incur a fee.'}
                  {policyText.late_checkout_fee && (
                    <span style={{ display: 'block', marginTop: 4, fontWeight: 500, color: 'var(--text-primary)' }}>Fee: {policyText.late_checkout_fee}</span>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Desired checkout time <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input className="sh-input" type="time" max={policyText.late_checkout_max_time ?? undefined} value={fields.lateCheckoutTime ?? ''} onChange={(e) => setFields((f) => ({ ...f, lateCheckoutTime: e.target.value }))} style={inputStyle} />
                  {policyText.late_checkout_max_time && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 300 }}>Latest available: {policyText.late_checkout_max_time}</p>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={closeDialog} disabled={submitting} className="ss-pill"
                style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 13, fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>
                {activeTile.action.kind === 'info' ? 'Close' : 'Cancel'}
              </button>
              {activeTile.action.kind === 'request' && (
                <button type="button" onClick={() => void submitRequest(activeTile)} disabled={submitting || !canSubmit(activeTile)} className="ss-gold-btn"
                  style={{ flex: 1, height: 46, borderRadius: 14, fontSize: 13, fontWeight: 600, opacity: !canSubmit(activeTile) ? 0.4 : 1 }}>
                  {submitting ? 'Sending…' : 'Send request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 24px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'var(--surface)', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200, boxShadow: '0 12px 32px rgba(0,0,0,0.2)', animation: 'hd-fade 0.25s ease', maxWidth: 'calc(100% - 40px)', textAlign: 'center' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Icons ───

function svgProps(size = 22) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}
function IconBed()      { return <svg {...svgProps()}><path d="M3 18v-7a3 3 0 013-3h12a3 3 0 013 3v7" /><path d="M3 14h18" /><path d="M3 18h18" /></svg>; }
function IconFork()     { return <svg {...svgProps()}><path d="M7 2v8a3 3 0 003 3v9" /><path d="M11 2v6" /><path d="M3 2v6a4 4 0 004 4" /><path d="M17 2v20M17 2c2 0 3 2 3 5v6h-3" /></svg>; }
function IconDumbbell() { return <svg {...svgProps()}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></svg>; }
function IconLaundry()  { return <svg {...svgProps()}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 6h.01M11 6h.01" /></svg>; }
function IconCar()      { return <svg {...svgProps()}><path d="M5 17h14M6 17l1-5h10l1 5M7 12l1.5-4h7L17 12" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>; }
function IconLuggage()  { return <svg {...svgProps()}><rect x="6" y="7" width="12" height="14" rx="2" /><path d="M9 7V5a2 2 0 014 0v2" /><path d="M12 11v4" /><path d="M10 13h4" /></svg>; }
function IconClock()    { return <svg {...svgProps()}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M5 4l-2 2M19 4l2 2" /></svg>; }
function IconClock2({ size = 22 }: { size?: number }) { return <svg {...svgProps(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>; }
function IconStaff()    { return <svg {...svgProps()}><circle cx="12" cy="9" r="3" /><path d="M5 21v-1a7 7 0 0114 0v1" /></svg>; }
function IconWrench()   { return <svg {...svgProps()}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>; }
function IconKey()      { return <svg {...svgProps()}><circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L21 8l-3-3" /></svg>; }
function IconInfo()     { return <svg {...svgProps()}><circle cx="12" cy="12" r="9" /><path d="M12 8v.01M12 11v5" /></svg>; }
function IconCloud()    { return <svg {...svgProps()}><path d="M17 18a4 4 0 000-8 6 6 0 00-11.5 2A4 4 0 006 18z" /></svg>; }
function IconMoon({ size = 22 }: { size?: number }) { return <svg {...svgProps(size)}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>; }
