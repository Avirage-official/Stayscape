'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Cormorant_Garamond } from 'next/font/google';
import {
  motion,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion';
import { isSameDay, differenceInCalendarDays } from 'date-fns';
import { useItinerary } from '@/components/ItineraryContext';
import type { GuestPreference, PreferenceType } from '@/types/pms';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '600'],
  display: 'swap',
});

const GOLD = '#C17F3A';
const WORLD_COUNT = 4;

/* ─── Props ─────────────────────────────────────────────────── */

export interface ConciergeExperienceProps {
  stayId?: string | null;
  guestName?: string | null;
  propertyName?: string | null;
  propertyImageUrl?: string | null;
  propertyCity?: string | null;
  propertyCountry?: string | null;
  bookingReference?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guestCount?: number | null;
  userId?: string | null;
}

/* ─── Preference sections config ────────────────────────────── */

interface PrefSection {
  title: string;
  prefType: PreferenceType;
  bgImage: string;
  chips: string[];
}

const PREF_SECTIONS: PrefSection[] = [
  {
    title: 'Dining',
    prefType: 'dining',
    bgImage: '/images/ui/onboarding-bg.jpg',
    chips: [
      'Early breakfast',
      'Late breakfast',
      'Early dinner',
      'Late dinner',
      'In-house dining',
      'Room service',
    ],
  },
  {
    title: 'Housekeeping',
    prefType: 'room_service',
    bgImage: '/images/hotels/mbs-hero.jpg',
    chips: [
      'Light cleanup',
      'Top-up',
      'Full service',
      'Morning clean',
      'Afternoon clean',
      'Laundry',
      'Shoe cleaning',
      'Ironing',
      'Pressing',
    ],
  },
  {
    title: 'Your vibe',
    prefType: 'general',
    bgImage: '/images/ui/empty-discover.jpg',
    chips: ['Luxury', 'Fun', 'Shopping', 'Business', 'Family', 'Solo', 'Educational'],
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function calcNights(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): number | null {
  if (!checkIn || !checkOut) return null;
  const diff = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  return Math.max(0, diff);
}

function isCurrentlyStaying(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): boolean {
  if (!checkIn || !checkOut) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  ci.setHours(0, 0, 0, 0);
  co.setHours(0, 0, 0, 0);
  return today >= ci && today <= co;
}

/* ─── Dot Indicator ──────────────────────────────────────────── */

function DotIndicator({
  total,
  active,
  onDotClick,
}: {
  total: number;
  active: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-3 flex-shrink-0"
      style={{ background: 'var(--background)' }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <motion.button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          animate={{
            width: i === active ? 20 : 6,
            backgroundColor: i === active ? GOLD : '#EDE8E1',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            height: 6,
            borderRadius: 3,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Typing Indicator ───────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px 16px 16px 4px',
        width: 'fit-content',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity }}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--text-muted)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── World 1: Your Stay ─────────────────────────────────────── */

function WorldStay({
  propertyName,
  propertyImageUrl,
  propertyCity,
  propertyCountry,
  checkIn,
  checkOut,
  guestCount,
  bookingReference,
}: {
  propertyName?: string | null;
  propertyImageUrl?: string | null;
  propertyCity?: string | null;
  propertyCountry?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guestCount?: number | null;
  bookingReference?: string | null;
}) {
  const nights = calcNights(checkIn, checkOut);
  const isHere = isCurrentlyStaying(checkIn, checkOut);
  const heroSrc = propertyImageUrl ?? '/images/hotels/mbs-hero.jpg';

  const statItems = [
    { label: 'CHECK-IN', value: formatDate(checkIn) },
    { label: 'CHECK-OUT', value: formatDate(checkOut) },
    { label: 'NIGHTS', value: nights != null ? String(nights) : '—' },
    { label: 'GUESTS', value: guestCount != null ? String(guestCount) : '—' },
  ];

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: 'calc(100vh - 144px)',
        background: 'var(--background)',
      }}
    >
      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-shrink-0"
        style={{ height: '38vh' }}
      >
        <Image
          src={heroSrc}
          alt={propertyName ?? 'Property'}
          fill
          sizes="(min-width: 1024px) 38vw, 100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, var(--background) 100%)',
          }}
        />
      </motion.div>

      {/* Content below image */}
      <div className="px-5 pb-6 flex flex-col gap-3" style={{ marginTop: -24 }}>
        <h1
          className={cormorant.className}
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {propertyName ?? 'Your Stay'}
        </h1>

        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          {[propertyCity, propertyCountry].filter(Boolean).join(' · ') || 'Location unavailable'}
        </p>

        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-2" style={{ marginTop: 4 }}>
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Status badge */}
        <div>
          {isHere ? (
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 11,
                color: GOLD,
              }}
            >
              {"You're here ✦"}
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Coming up
            </span>
          )}
        </div>

        {/* Booking reference */}
        {bookingReference && (
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            Ref: {bookingReference}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── World 2: Today ─────────────────────────────────────────── */

function WorldToday() {
  const { items } = useItinerary();
  const today = new Date();
  const todayItems = items.filter((item) => isSameDay(item.date, today));

  if (todayItems.length === 0) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 144px)',
          background: 'var(--background)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="relative flex-1 flex items-end"
          style={{ minHeight: 280 }}
        >
          <Image
            src="/images/hotels/mbs-hero.jpg"
            alt="Morning"
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            style={{ objectFit: 'cover' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 40%, var(--background) 100%)',
            }}
          />
          <div className="relative z-10 px-5 pb-8 flex flex-col gap-1">
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 16,
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              Nothing locked in yet
            </p>
            <a
              href="?tab=discover"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: GOLD,
                textDecoration: 'none',
              }}
            >
              Head to Discover to find something →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 144px)',
        background: 'var(--background)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--text-muted)',
          margin: '0 0 4px 0',
        }}
      >
        Today
      </h2>
      {todayItems.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          whileHover={{ y: -2 }}
          style={{
            display: 'flex',
            width: '100%',
            height: 160,
            borderRadius: 16,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* Image */}
          <div className="relative flex-shrink-0" style={{ width: 80 }}>
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="flex items-center justify-center h-full"
                style={{
                  background: 'var(--background)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 24,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                {item.category?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center px-3 py-3 gap-1">
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {item.name}
            </p>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
              }}
            >
              {item.category}
            </p>
            {item.time && (
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: GOLD,
                }}
              >
                {item.time}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── World 3: Preferences ───────────────────────────────────── */

function WorldPreferences({ stayId }: { stayId?: string | null }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    dining: new Set(),
    room_service: new Set(),
    general: new Set(),
  });
  const [showSaved, setShowSaved] = useState(false);
  const userModifiedRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing preferences on mount
  useEffect(() => {
    if (!stayId) return;
    fetch(`/api/pms/preferences?stay_id=${stayId}`)
      .then((r) => r.json())
      .then(({ data }: { data: GuestPreference[] }) => {
        if (!Array.isArray(data)) return;
        const init: Record<string, Set<string>> = {};
        for (const pref of data) {
          const chips = pref.preference_data?.selected_chips;
          if (Array.isArray(chips)) {
            init[pref.preference_type] = new Set(chips as string[]);
          }
        }
        if (Object.keys(init).length > 0) {
          setSelected((prev) => ({ ...prev, ...init }));
        }
      })
      .catch(() => {});
  }, [stayId]);

  // Debounced save
  useEffect(() => {
    if (!stayId || !userModifiedRef.current) return;
    const timer = setTimeout(() => {
      const saves = Object.entries(selected).map(([prefType, chips]) =>
        fetch('/api/pms/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stay_id: stayId,
            preference_type: prefType,
            preference_data: { selected_chips: Array.from(chips) },
          }),
        }).catch(() => {}),
      );
      void Promise.all(saves).then(() => {
        setShowSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [selected, stayId]);

  const toggleChip = useCallback((prefType: string, chip: string) => {
    userModifiedRef.current = true;
    setSelected((prev) => {
      const set = new Set(prev[prefType] ?? []);
      if (set.has(chip)) set.delete(chip);
      else set.add(chip);
      return { ...prev, [prefType]: set };
    });
  }, []);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 144px)',
        background: 'var(--background)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {PREF_SECTIONS.map((section, si) => (
        <motion.div
          key={section.prefType}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: si * 0.06 }}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          <div className="relative" style={{ height: 200 }}>
            <Image
              src={section.bgImage}
              alt={section.title}
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              style={{ objectFit: 'cover' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(250,248,245,0) 0%, rgba(250,248,245,0.95) 100%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end px-4 pb-4">
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                {section.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {section.chips.map((chip) => {
                  const isActive = selected[section.prefType]?.has(chip) ?? false;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(section.prefType, chip)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 12,
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: `1px solid ${isActive ? GOLD : 'var(--border)'}`,
                        background: isActive ? 'rgba(193,127,58,0.06)' : 'var(--surface)',
                        color: isActive ? GOLD : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 150ms',
                      }}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Saved toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: GOLD,
              padding: '6px 16px',
              borderRadius: 99,
              background: 'var(--background)',
              border: '1px solid rgba(193,127,58,0.3)',
              zIndex: 50,
              whiteSpace: 'nowrap',
            }}
          >
            Saved ✦
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── World 4: Chat ──────────────────────────────────────────── */

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

function WorldChat({ stayId }: { stayId?: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const msgIdRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isTyping) return;

    msgIdRef.current += 1;
    const userMsg: ChatMessage = { id: msgIdRef.current, role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          stayId: stayId ?? null,
          history: messages.map((m) => ({ role: m.role, text: m.content })),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      msgIdRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: msgIdRef.current,
          role: 'assistant',
          content: data.reply ?? "I'm here to help with your stay.",
        },
      ]);
    } catch {
      msgIdRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: msgIdRef.current,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, stayId]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 144px)',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Image
          src="/images/hotels/mbs-hero.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 38vw, 100vw"
          style={{
            objectFit: 'cover',
            filter: 'blur(40px) brightness(1.1)',
            transform: 'scale(1.1)',
          }}
        />
      </div>

      {/* Semi-transparent overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(250,248,245,0.88)', zIndex: 1 }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col"
        style={{ zIndex: 2, height: '100%', flex: 1 }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <h2
            className={cormorant.className}
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Concierge
          </h2>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 2,
              marginBottom: 0,
            }}
          >
            Ask anything about your stay or the city
          </p>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3"
          style={{ minHeight: 0 }}
        >
          {messages.length === 0 && (
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                paddingTop: 24,
              }}
            >
              {"Hi! How can I help with your stay?"}
            </p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 13,
                    lineHeight: 1.5,
                    ...(msg.role === 'user'
                      ? {
                          background: GOLD,
                          color: '#fff',
                          borderRadius: '16px 16px 4px 16px',
                        }
                      : {
                          background: 'var(--surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px 16px 16px 4px',
                        }),
                  }}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ background: 'transparent' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '8px 8px 8px 16px',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask about your stay…"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: input.trim() && !isTyping ? GOLD : 'var(--border)',
                border: 'none',
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 150ms',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function ConciergeExperience({
  stayId,
  propertyName,
  propertyImageUrl,
  propertyCity,
  propertyCountry,
  bookingReference,
  checkIn,
  checkOut,
  guestCount,
}: ConciergeExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentWorld, setCurrentWorld] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (containerWidth === 0) return;
      const threshold = containerWidth * 0.2;
      const { offset, velocity } = info;
      if (offset.x < -threshold || velocity.x < -300) {
        setCurrentWorld((prev) => Math.min(prev + 1, WORLD_COUNT - 1));
      } else if (offset.x > threshold || velocity.x > 300) {
        setCurrentWorld((prev) => Math.max(prev - 1, 0));
      }
    },
    [containerWidth],
  );

  const goToWorld = useCallback((i: number) => {
    setCurrentWorld(Math.max(0, Math.min(i, WORLD_COUNT - 1)));
  }, []);

  const effectiveWidth = containerWidth > 0 ? containerWidth : 320;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Worlds strip */}
      <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{
            left: -(WORLD_COUNT - 1) * effectiveWidth,
            right: 0,
          }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: -currentWorld * effectiveWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          style={{
            display: 'flex',
            width: WORLD_COUNT * effectiveWidth,
            height: '100%',
          }}
        >
          {/* World 1 — Your Stay */}
          <div
            style={{
              width: effectiveWidth,
              flexShrink: 0,
              overflowY: 'auto',
              height: '100%',
            }}
          >
            <WorldStay
              propertyName={propertyName}
              propertyImageUrl={propertyImageUrl}
              propertyCity={propertyCity}
              propertyCountry={propertyCountry}
              checkIn={checkIn}
              checkOut={checkOut}
              guestCount={guestCount}
              bookingReference={bookingReference}
            />
          </div>

          {/* World 2 — Today */}
          <div
            style={{
              width: effectiveWidth,
              flexShrink: 0,
              overflowY: 'auto',
              height: '100%',
            }}
          >
            <WorldToday />
          </div>

          {/* World 3 — Preferences */}
          <div
            style={{
              width: effectiveWidth,
              flexShrink: 0,
              overflowY: 'auto',
              height: '100%',
            }}
          >
            <WorldPreferences stayId={stayId} />
          </div>

          {/* World 4 — Chat */}
          <div
            style={{
              width: effectiveWidth,
              flexShrink: 0,
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <WorldChat stayId={stayId} />
          </div>
        </motion.div>
      </div>

      {/* Dot navigation */}
      <DotIndicator total={WORLD_COUNT} active={currentWorld} onDotClick={goToWorld} />
    </div>
  );
}
