'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useItinerary, type ItineraryItem } from '@/components/ItineraryContext';
import { format, isSameDay, addDays, isToday, differenceInDays } from 'date-fns';
import { sendChatMessage } from '@/lib/ai/chat';

export interface ItineraryExperienceProps {
  stayId?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guestName?: string | null;
}

/* ─── Helpers ─── */

function generateStayDays(checkIn?: string | null, checkOut?: string | null): Date[] {
  if (!checkIn || !checkOut) return [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  const days: Date[] = [];
  let d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

function formatDuration(hours: number): string {
  if (hours === 0.5) return '30m';
  if (Number.isInteger(hours)) return `${hours}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ─── Sub-components ─── */

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(193,127,58,0.06)',
          border: '1px solid rgba(193,127,58,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="6" width="20" height="18" rx="2.5" stroke="#C17F3A" strokeWidth="1.2" opacity="0.5" />
          <line x1="4" y1="11" x2="24" y2="11" stroke="#C17F3A" strokeWidth="1.2" opacity="0.35" />
          <line x1="10" y1="6" x2="10" y2="3" stroke="#C17F3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="18" y1="6" x2="18" y2="3" stroke="#C17F3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
      <h3
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 300,
          fontSize: 20,
          color: '#1C1A17',
          margin: '0 0 8px',
        }}
      >
        Your itinerary is empty
      </h3>
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          color: '#6B6158',
          margin: 0,
          maxWidth: 240,
          lineHeight: 1.6,
        }}
      >
        Discover places and add them here to craft your perfect stay.
      </p>
    </div>
  );
}

const AI_PROMPTS = [
  '✦ Balance my days more evenly',
  '✦ Add a relaxed morning on Day 1',
  '✦ Suggest a dinner spot for tonight',
  '✦ Make the last day more leisurely',
];

/* ─── Main component ─── */

export default function ItineraryExperience({
  stayId,
  checkIn,
  checkOut,
  guestName,
}: ItineraryExperienceProps) {
  const { items, removeItem } = useItinerary();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [promptFocused, setPromptFocused] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [aiReply, setAiReply] = useState('');

  /* Stay days */
  const stayDays = useMemo(() => generateStayDays(checkIn, checkOut), [checkIn, checkOut]);

  /* Nights */
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return stayDays.length > 0 ? stayDays.length - 1 : 0;
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.max(0, differenceInDays(e, s));
  }, [checkIn, checkOut, stayDays.length]);

  /* Total hours */
  const totalHours = useMemo(
    () => items.reduce((sum, i) => sum + i.durationHours, 0),
    [items],
  );

  /* Date range label */
  const dateRangeLabel = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    return `${format(s, 'd MMM')} – ${format(e, 'd MMM')}`;
  }, [checkIn, checkOut]);

  /* Group items by date, sorted by time within each group */
  const groupedByDate = useMemo(() => {
    const groups: { date: Date; items: ItineraryItem[] }[] = [];
    const sorted = [...items].sort(
      (a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time),
    );
    for (const item of sorted) {
      const existing = groups.find((g) => isSameDay(g.date, item.date));
      if (existing) existing.items.push(item);
      else groups.push({ date: item.date, items: [item] });
    }
    return groups;
  }, [items]);

  /* Scroll left panel to selected day — simple filter for right-panel sync */
  const visibleGroups = useMemo(() => {
    if (!selectedDay) return groupedByDate;
    return groupedByDate.filter((g) => isSameDay(g.date, selectedDay));
  }, [groupedByDate, selectedDay]);

  const handleRemove = useCallback(
    (id: string) => removeItem(id),
    [removeItem],
  );

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        background: '#FAF8F5',
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* ── LEFT: Timeline (55%) ── */}
      <div
        style={{
          flex: '0 0 55%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid #EDE8E1',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: '#9E9389',
                margin: '0 0 6px',
              }}
            >
              Your trip · {nights} night{nights !== 1 ? 's' : ''}
            </p>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontWeight: 300,
                fontSize: 28,
                color: '#1C1A17',
                margin: '0 0 6px',
                lineHeight: 1.2,
              }}
            >
              Your Itinerary
            </h1>
            {(dateRangeLabel || guestName) && (
              <p style={{ fontSize: 13, color: '#6B6158', margin: 0 }}>
                {[dateRangeLabel, guestName].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {totalHours > 0 && (
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(193,127,58,0.08)',
                  color: '#C17F3A',
                  borderRadius: 4,
                  padding: '4px 10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDuration(totalHours)} planned
              </span>
            )}
          </div>
        </div>

        {/* Scrollable timeline */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 28px 24px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#EDE8E1 transparent',
          }}
        >
          {visibleGroups.length === 0 ? (
            <EmptyState />
          ) : (
            visibleGroups.map((group, groupIdx) => {
              const dayIndex = stayDays.findIndex((d) => isSameDay(d, group.date));
              const dayNumber = dayIndex >= 0 ? dayIndex + 1 : groupIdx + 1;
              const today = isToday(group.date);

              return (
                <div key={format(group.date, 'yyyy-MM-dd')}>
                  {/* Day header row */}
                  <div
                    style={{
                      marginTop: groupIdx === 0 ? 24 : 28,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Day circle */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: today ? 'none' : '1px solid #EDE8E1',
                        background: today ? '#C17F3A' : '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          textTransform: 'uppercase',
                          color: today ? '#FAF8F5' : '#9E9389',
                          lineHeight: 1,
                        }}
                      >
                        {format(group.date, 'EEE')}
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 500,
                          color: today ? '#FAF8F5' : '#1C1A17',
                          lineHeight: 1.15,
                        }}
                      >
                        {format(group.date, 'd')}
                      </span>
                    </div>

                    {/* Day label */}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1C1A17',
                        flex: 1,
                      }}
                    >
                      Day {dayNumber}: {format(group.date, 'MMMM d')}
                    </span>
                  </div>

                  {/* Timeline items */}
                  <div style={{ position: 'relative', paddingLeft: 0 }}>
                    {group.items.map((item, itemIdx) => {
                      const isLast = itemIdx === group.items.length - 1;
                      return (
                        <TimelineItem
                          key={item.id}
                          item={item}
                          isLast={isLast}
                          onRemove={handleRemove}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Smart panel (45%) ── */}
      <div
        style={{
          flex: '0 0 45%',
          borderLeft: '1px solid #EDE8E1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Day selector */}
        <div
          style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid #EDE8E1',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#9E9389',
              margin: '0 0 12px',
            }}
          >
            Jump to day
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <DayPill
              label="All"
              active={selectedDay === null}
              hasItems={items.length > 0}
              onClick={() => setSelectedDay(null)}
            />
            {stayDays.map((day) => {
              const hasItems = items.some((i) => isSameDay(i.date, day));
              return (
                <DayPill
                  key={format(day, 'yyyy-MM-dd')}
                  label={format(day, 'MMM d')}
                  active={selectedDay !== null && isSameDay(day, selectedDay)}
                  hasItems={hasItems}
                  onClick={() => setSelectedDay(day)}
                />
              );
            })}
          </div>
        </div>

        {/* AI Curator */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#EDE8E1 transparent',
          }}
        >
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#9E9389',
              margin: '0 0 6px',
            }}
          >
            AI Curator
          </p>
          <h3
            style={{
              fontFamily: 'Georgia, serif',
              fontWeight: 300,
              fontSize: 20,
              color: '#1C1A17',
              margin: '0 0 6px',
              lineHeight: 1.3,
            }}
          >
            Refine your plans
          </h3>
          <p style={{ fontSize: 13, color: '#6B6158', margin: '0 0 20px', lineHeight: 1.6 }}>
            Tell me how you&apos;d like to adjust your itinerary.
          </p>

          {/* Quick prompts */}
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AI_PROMPTS.map((s) => (
              <QuickPromptButton key={s} label={s} onClick={() => setAiPrompt(s)} />
            ))}
          </div>

          {/* Text area */}
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Add a relaxing morning on Day 2…"
            style={{
              width: '100%',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#1C1A17',
              background: '#fff',
              border: `1px solid ${promptFocused ? 'rgba(193,127,58,0.5)' : '#EDE8E1'}`,
              borderRadius: 8,
              padding: '12px',
              resize: 'vertical',
              minHeight: 80,
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
            onFocus={() => setPromptFocused(true)}
            onBlur={() => setPromptFocused(false)}
          />

          <button
            type="button"
            disabled={!aiPrompt.trim() || isRefining}
            onClick={async () => {
              if (!aiPrompt.trim() || isRefining) return;
              setIsRefining(true);
              try {
                const reply = await sendChatMessage(aiPrompt, stayId, [], 'itinerary');
                setAiReply(reply);
              } finally {
                setIsRefining(false);
              }
            }}
            style={{
              marginTop: 10,
              width: '100%',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              background: aiPrompt.trim() && !isRefining ? '#C17F3A' : 'rgba(193,127,58,0.3)',
              border: 'none',
              borderRadius: 8,
              padding: '11px 16px',
              cursor: aiPrompt.trim() && !isRefining ? 'pointer' : 'default',
              transition: 'background 200ms',
            }}
          >
            {isRefining ? 'Refining…' : 'Refine itinerary →'}
          </button>

          {aiReply && (
            <div
              style={{
                marginTop: 12,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#1C1A17',
                background: '#fff',
                border: '1px solid #EDE8E1',
                borderRadius: 8,
                padding: '12px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {aiReply}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Timeline item ─── */

function TimelineItem({
  item,
  isLast,
  onRemove,
}: {
  item: ItineraryItem;
  isLast: boolean;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
      {/* Time column */}
      <div
        style={{
          width: 48,
          textAlign: 'right',
          flexShrink: 0,
          paddingTop: 4,
          paddingRight: 12,
        }}
      >
        <div style={{ fontSize: 10, color: '#9E9389', lineHeight: 1.4 }}>{item.time}</div>
        <div style={{ fontSize: 9, color: '#B8B0A7', lineHeight: 1.4 }}>
          {formatDuration(item.durationHours)}
        </div>
      </div>

      {/* Dot + vertical line */}
      <div
        style={{
          width: 16,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#C17F3A',
            border: '2px solid #FAF8F5',
            boxShadow: '0 0 0 1px #C17F3A',
            flexShrink: 0,
            zIndex: 1,
            marginTop: 4,
          }}
        />
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 1,
              bottom: -12,
              background: '#EDE8E1',
            }}
          />
        )}
      </div>

      {/* Card */}
      <ItemCard item={item} onRemove={onRemove} />
    </div>
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
  const [hovered, setHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        marginLeft: 16,
        background: '#FFFFFF',
        border: `1px solid ${hovered ? 'rgba(193,127,58,0.4)' : '#EDE8E1'}`,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'border-color 200ms, transform 200ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div
        style={{
          width: 72,
          flexShrink: 0,
          position: 'relative',
          background: '#F0EDE8',
          minHeight: 60,
        }}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="72px"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C17F3A"
              strokeWidth="1.2"
              opacity={0.4}
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div
        style={{
          flex: 1,
          padding: '10px 12px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: '#1C1A17',
            margin: '0 0 3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            color: '#9E9389',
            margin: 0,
          }}
        >
          {item.category}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        style={{
          padding: '0 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: removeHovered ? '#ef4444' : '#C0B8B1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 200ms',
        }}
        onMouseEnter={() => setRemoveHovered(true)}
        onMouseLeave={() => setRemoveHovered(false)}
        aria-label={`Remove ${item.name}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 3H10M4.5 3V2H7.5V3M5 5.5V8.5M7 5.5V8.5M3 3V10H9V3"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
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
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        background: active ? '#C17F3A' : hovered ? '#FDF6EE' : '#fff',
        color: active ? '#fff' : '#6B6158',
        border: `1px solid ${active ? '#C17F3A' : hovered ? 'rgba(193,127,58,0.4)' : '#EDE8E1'}`,
        borderRadius: 6,
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 200ms',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
      {hasItems && (
        <span
          style={{
            display: 'inline-block',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: active ? 'rgba(255,255,255,0.7)' : '#C17F3A',
          }}
        />
      )}
    </button>
  );
}

/* ─── Quick prompt button ─── */

function QuickPromptButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
        color: hovered ? '#1C1A17' : '#6B6158',
        background: '#fff',
        border: `1px solid ${hovered ? '#C17F3A' : '#EDE8E1'}`,
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'border-color 200ms, color 200ms',
      }}
    >
      {label}
    </button>
  );
}
