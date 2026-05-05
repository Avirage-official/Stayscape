'use client';

/**
 * ItineraryExperience — redesigned for the espresso palette.
 *
 * Layout:
 *   LEFT (~62%)  — Trip header + day-grouped item cards
 *   RIGHT (~38%) — Map preview (top), Notes thread (below)
 *
 * Real data: items + coords from useItinerary (joined via places).
 *            notes from /api/stays/[stayId]/notes.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { addDays, differenceInDays, format, isSameDay } from 'date-fns';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

import { useItinerary, type ItineraryItem } from '@/components/ItineraryContext';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { getMapboxToken } from '@/lib/mapbox/config';

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

interface Note {
  id: string;
  stayid: string;
  userid: string;
  itinerary_item_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

interface ItineraryExperienceProps {
  stayId: string;
  checkIn: string | null;
  checkOut: string | null;
  guestName?: string | null;
  /** Optional title (e.g. "Paris Trip" or property name). */
  tripTitle?: string | null;
}

/* ─── Helpers ─── */

function generateStayDays(checkIn: string | null, checkOut: string | null): Date[] {
  if (!checkIn || !checkOut) return [];
  const s = new Date(checkIn);
  const e = new Date(checkOut);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];
  const days: Date[] = [];
  let d = new Date(s);
  while (d <= e) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return format(new Date(iso), 'd MMM');
}

function formatDuration(hours: number): string {
  if (hours === 0.5) return '30m';
  if (Number.isInteger(hours)) return `${hours}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

/* ─── Static Mapbox preview ─── */

function buildStaticMapUrl(
  items: ItineraryItem[],
  width = 600,
  height = 320,
): string | null {
  const token = getMapboxToken();
  if (!token) return null;

  const withCoords = items.filter(
    (i) => typeof i.lat === 'number' && typeof i.lng === 'number',
  );
  if (withCoords.length === 0) return null;

  // Build pin overlays — `pin-s+C9A875(lng,lat)` per pin (max 100 chars per overlay segment but plenty here)
  const pins = withCoords
    .slice(0, 12)
    .map((i) => `pin-s+c9a875(${i.lng},${i.lat})`)
    .join(',');

  // `auto` zoom fits all pins
  return (
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pins}/auto/${width}x${height}@2x` +
    `?access_token=${token}&padding=40`
  );
}

/* ─── Day pill ─── */

function DayPill({
  label,
  active,
  hasItems,
  onClick,
}: {
  label: string;
  active: boolean;
  hasItems: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={dmSans.className}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: active ? '1px solid var(--gold)' : '1px solid var(--border)',
        background: active
          ? 'linear-gradient(180deg, rgba(201, 168, 117, 0.18) 0%, rgba(201, 168, 117, 0.10) 100%)'
          : 'var(--surface)',
        color: active ? 'var(--gold)' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: active
          ? 'inset 0 1px 0 rgba(245, 230, 204, 0.10), 0 0 16px rgba(201, 168, 117, 0.18)'
          : 'inset 0 1px 0 rgba(245, 230, 204, 0.04)',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {label}
      {hasItems && !active && (
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--gold)',
            opacity: 0.8,
          }}
        />
      )}
    </button>
  );
}

/* ─── Item card ─── */

function ItemCard({
  item,
  onRemove,
}: {
  item: ItineraryItem;
  onRemove: (id: string) => void;
}) {
  const placeholder =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80&auto=format&fit=crop';

  return (
    <div
      className="ss-card-raised"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        padding: 12,
        gap: 14,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 14,
          backgroundImage: `url(${item.image || placeholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0,
          border: '1px solid var(--border)',
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.name || 'Untitled'}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{item.time || '—'}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ textTransform: 'capitalize' }}>
            {item.category || 'Activity'}
          </span>
          {item.durationHours > 0 && (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{formatDuration(item.durationHours)}</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          transition: 'background 0.18s ease, color 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(245, 230, 204, 0.06)';
          e.currentTarget.style.color = 'var(--gold)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Empty state ─── */

function EmptyTimeline() {
  return (
    <div
      className="ss-mount-up"
      style={{
        textAlign: 'center',
        padding: '60px 24px',
        color: 'var(--text-muted)',
      }}
    >
      <div
        className="ss-breathe"
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background:
            'radial-gradient(120% 100% at 50% 0%, rgba(201, 168, 117, 0.20) 0%, rgba(201, 168, 117, 0.05) 100%)',
          border: '1px solid rgba(201, 168, 117, 0.20)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
          marginBottom: 18,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p
        className={cormorant.className}
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 400,
          color: 'var(--text-primary)',
        }}
      >
        Your itinerary is empty
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>
        Head to <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Discover</span> to add your first activity.
      </p>
    </div>
  );
}

/* ─── Main component ─── */

export default function ItineraryExperience({
  stayId,
  checkIn,
  checkOut,
  guestName,
  tripTitle,
}: ItineraryExperienceProps) {
  const { items, removeItem } = useItinerary();
  const { user: _user } = useAuth();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  /* Stay derived */
  const stayDays = useMemo(
    () => generateStayDays(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return Math.max(0, stayDays.length - 1);
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.max(0, differenceInDays(e, s));
  }, [checkIn, checkOut, stayDays.length]);

  const dateRangeLabel = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`;
  }, [checkIn, checkOut]);

  /* Group items by date */
  const groupedByDate = useMemo(() => {
    const groups: { date: Date; items: ItineraryItem[] }[] = [];
    const sorted = [...items].sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() ||
        a.time.localeCompare(b.time),
    );
    for (const item of sorted) {
      const existing = groups.find((g) => isSameDay(g.date, item.date));
      if (existing) existing.items.push(item);
      else groups.push({ date: item.date, items: [item] });
    }
    return groups;
  }, [items]);

  const visibleGroups = useMemo(() => {
    if (!selectedDay) return groupedByDate;
    return groupedByDate.filter((g) => isSameDay(g.date, selectedDay));
  }, [groupedByDate, selectedDay]);

  /* Map URL */
  const mapUrl = useMemo(() => buildStaticMapUrl(items, 600, 320), [items]);

  /* Notes */
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const notesLoaded = useRef(false);

  const loadNotes = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token ?? null
        : null;
      if (!token) return;

      const res = await fetch(
        `/api/stays/${encodeURIComponent(stayId)}/notes`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const json = (await res.json()) as { data?: Note[] };
      setNotes(json.data ?? []);
    } catch {
      // table may not exist yet — silent
    }
  }, [stayId]);

  useEffect(() => {
    if (notesLoaded.current) return;
    notesLoaded.current = true;
    void loadNotes();
  }, [loadNotes]);

  const submitNote = async () => {
    const body = noteInput.trim();
    if (!body || submittingNote) return;
    setSubmittingNote(true);
    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token ?? null
        : null;
      if (!token) return;

      const res = await fetch(
        `/api/stays/${encodeURIComponent(stayId)}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body }),
        },
      );

      if (res.ok) {
        const json = (await res.json()) as { note: Note };
        setNotes((prev) => [json.note, ...prev]);
        setNoteInput('');
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token ?? null
        : null;
      if (!token) return;

      await fetch(
        `/api/stays/${encodeURIComponent(stayId)}/notes?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch {
      // silent — UI already removed
    }
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitNote();
    }
  };

  return (
    <div
      className={dmSans.className}
      style={{
        background: 'var(--background)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        padding: '24px 24px 48px',
      }}
    >
      <style>{`
        .itin-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .itin-grid {
            grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
            gap: 28px;
            align-items: start;
          }
        }
      `}</style>

      <div className="itin-grid">
        {/* ── LEFT: Trip + timeline ── */}
        <div className="ss-mount-up">
          {/* Header */}
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            Your trip · {nights} {nights === 1 ? 'night' : 'nights'}
          </p>
          <h1
            className={cormorant.className}
            style={{
              margin: '8px 0 6px',
              fontSize: 'clamp(30px, 4.5vw, 44px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            {tripTitle ? tripTitle : 'Your Itinerary'}
          </h1>
          {(dateRangeLabel || guestName) && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontWeight: 300,
              }}
            >
              {[dateRangeLabel, guestName].filter(Boolean).join(' · ')}
            </p>
          )}
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: 'var(--gold)',
              fontWeight: 500,
            }}
          >
            {items.length === 0
              ? 'No places saved yet'
              : `${items.length} ${items.length === 1 ? 'place' : 'places'} saved`}
          </p>

          {/* Day pills */}
          {stayDays.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 22,
                marginBottom: 4,
              }}
            >
              <DayPill
                label="All days"
                active={selectedDay === null}
                hasItems={items.length > 0}
                onClick={() => setSelectedDay(null)}
              />
              {stayDays.map((day) => {
                const hasItems = items.some((i) => isSameDay(i.date, day));
                return (
                  <DayPill
                    key={format(day, 'yyyy-MM-dd')}
                    label={format(day, 'd MMM')}
                    active={selectedDay !== null && isSameDay(day, selectedDay)}
                    hasItems={hasItems}
                    onClick={() => setSelectedDay(day)}
                  />
                );
              })}
            </div>
          )}

          {/* Timeline */}
          <div style={{ marginTop: 22 }}>
            {visibleGroups.length === 0 ? (
              <EmptyTimeline />
            ) : (
              visibleGroups.map((group, groupIdx) => {
                const dayIdx = stayDays.findIndex((d) =>
                  isSameDay(d, group.date),
                );
                const dayLabel = dayIdx >= 0 ? `Day ${dayIdx + 1}` : `Day ${groupIdx + 1}`;
                const groupHours = group.items.reduce(
                  (s, i) => s + i.durationHours,
                  0,
                );

                return (
                  <div
                    key={format(group.date, 'yyyy-MM-dd')}
                    className="ss-mount-up"
                    style={{ marginTop: groupIdx === 0 ? 0 : 28 }}
                  >
                    {/* Day header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <p
                          className={cormorant.className}
                          style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 400,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {dayLabel}
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {format(group.date, 'EEE, d MMM')}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'place' : 'places'} ·{' '}
                        <span style={{ color: 'var(--gold)' }}>
                          {formatDuration(groupHours)}
                        </span>
                      </p>
                    </div>

                    {/* Items */}
                    {group.items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Map preview + Notes ── */}
        <div
          className="ss-mount-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'sticky',
            top: 16,
          }}
        >
          {/* Map preview */}
          <div
            className="ss-card-raised"
            style={{
              padding: 0,
              overflow: 'hidden',
              minHeight: 200,
              position: 'relative',
            }}
          >
            {mapUrl ? (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 10',
                  backgroundImage: `url(${mapUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, transparent 60%, rgba(20, 16, 13, 0.4) 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 14,
                    right: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#F5E6CC',
                    fontSize: 11,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span style={{ opacity: 0.85 }}>
                    {items.filter((i) => i.lat && i.lng).length} pinned
                  </span>
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>
                    Trip overview
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  aspectRatio: '16 / 10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  color: 'var(--text-muted)',
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <p style={{ margin: 0, fontSize: 12 }}>
                  Add places to see them on the map
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div
            className="ss-card-raised"
            style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="ss-icon-chip"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  Notes
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  Just for you — private to this trip
                </p>
              </div>
            </div>

            {/* Notes list */}
            {notes.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  maxHeight: 280,
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
              >
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '10px 12px',
                      position: 'relative',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                        fontWeight: 400,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        paddingRight: 22,
                      }}
                    >
                      {note.body}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {relativeTime(note.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        aria-label="Delete note"
                        style={{
                          width: 22,
                          height: 22,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.18s ease, background 0.18s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--gold)';
                          e.currentTarget.style.background = 'rgba(245, 230, 204, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notes.length === 0 && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                No notes yet. Jot down anything you want to remember.
              </p>
            )}

            {/* Note input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '8px 8px 8px 12px',
                marginTop: 4,
              }}
            >
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                placeholder="Add a note…"
                rows={1}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  padding: '6px 0',
                  maxHeight: 120,
                  minHeight: 22,
                }}
              />
              <button
                type="button"
                onClick={() => void submitNote()}
                disabled={!noteInput.trim() || submittingNote}
                aria-label="Send note"
                className={
                  noteInput.trim() && !submittingNote ? 'ss-gold-btn' : ''
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(noteInput.trim() && !submittingNote
                    ? {}
                    : {
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed',
                        boxShadow: 'none',
                      }),
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
