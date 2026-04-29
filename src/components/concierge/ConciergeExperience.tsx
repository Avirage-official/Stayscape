'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Cormorant_Garamond } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { isSameDay, differenceInCalendarDays } from 'date-fns';
import { useItinerary } from '@/components/ItineraryContext';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { GuestPreference, PreferenceType } from '@/types/pms';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '600'],
  display: 'swap',
});

const GOLD = '#C17F3A';
const BG_LINEN = '250,248,245';

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

/* ─── Preference sections ────────────────────────────────────── */

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
    chips: ['Early breakfast','Late breakfast','Early dinner','Late dinner','In-house dining','Room service'],
  },
  {
    title: 'Housekeeping',
    prefType: 'room_service',
    bgImage: '/images/hotels/mbs-hero.jpg',
    chips: ['Light cleanup','Top-up','Full service','Morning clean','Afternoon clean','Laundry','Shoe cleaning','Ironing','Pressing'],
  },
  {
    title: 'Your vibe',
    prefType: 'general',
    bgImage: '/images/ui/empty-discover.jpg',
    chips: ['Luxury','Fun','Shopping','Business','Family','Solo','Educational'],
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}

function calcNights(checkIn?: string | null, checkOut?: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const diff = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  return Math.max(0, diff);
}

function isCurrentlyStaying(checkIn?: string | null, checkOut?: string | null): boolean {
  if (!checkIn || !checkOut) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ci = new Date(checkIn + 'T00:00:00');
  const co = new Date(checkOut + 'T00:00:00');
  return today >= ci && today <= co;
}

/* ─── Typing indicator ───────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '8px 12px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '16px 16px 16px 4px', width: 'fit-content',
    }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }}
        />
      ))}
    </div>
  );
}

/* ─── Left panel ─────────────────────────────────────────────── */

function StayAnchor({
  propertyName, propertyImageUrl, propertyCity, propertyCountry,
  checkIn, checkOut, guestCount, guestName, bookingReference,
}: {
  propertyName?: string | null; propertyImageUrl?: string | null;
  propertyCity?: string | null; propertyCountry?: string | null;
  checkIn?: string | null; checkOut?: string | null;
  guestCount?: number | null; guestName?: string | null;
  bookingReference?: string | null;
}) {
  const nights = calcNights(checkIn, checkOut);
  const isHere = isCurrentlyStaying(checkIn, checkOut);
  const heroSrc = propertyImageUrl ?? '/images/hotels/mbs-hero.jpg';

  const avatarInitials = guestName
    ? guestName.split(' ').filter((n) => n.length > 0).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'G';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#FAF8F5' }}>

      {/* Hero — taller, more dramatic */}
      <div style={{ height: 280, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <Image
          src={heroSrc}
          alt={propertyName ?? 'Property'}
          fill
          sizes="(min-width: 768px) 30vw, 100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
        {/* Glassmorphism-style warm fade — same as home page */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, rgba(${BG_LINEN},0.05) 0%, rgba(${BG_LINEN},0.0) 30%, rgba(${BG_LINEN},0.80) 75%, #FAF8F5 100%)`,
        }} />
        {/* Status pill */}
        <div style={{ position: 'absolute', top: 14, left: 14 }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: isHere ? GOLD : 'rgba(255,255,255,0.85)',
            background: isHere ? 'rgba(193,127,58,0.12)' : 'rgba(0,0,0,0.28)',
            border: `1px solid ${isHere ? 'rgba(193,127,58,0.40)' : 'rgba(255,255,255,0.20)'}`,
            borderRadius: 99, padding: '4px 10px',
          }}>
            {isHere ? "You're here ✦" : 'Upcoming'}
          </span>
        </div>
      </div>

      {/* Property identity — overlaps hero bottom */}
      <div style={{ padding: '0 20px 12px', marginTop: -24, position: 'relative', zIndex: 1 }}>
        <h1 className={cormorant.className} style={{
          fontSize: 26, fontWeight: 300, color: '#1C1A17',
          lineHeight: 1.15, margin: '0 0 4px',
        }}>
          {propertyName ?? 'Your Stay'}
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 11,
          color: '#9E9389', margin: 0, letterSpacing: '0.04em',
        }}>
          {[propertyCity, propertyCountry].filter(Boolean).join(' · ') || 'Location unavailable'}
        </p>
      </div>

      {/* Guest identity */}
      {guestName && (
        <div style={{
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
          borderTop: '1px solid #EDE8E1',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'rgba(193,127,58,0.10)', border: '1px solid rgba(193,127,58,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: GOLD }}>
              {avatarInitials}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1C1A17', margin: 0 }}>
              {guestName}
            </p>
            {guestCount != null && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#9E9389', margin: 0 }}>
                {guestCount} guest{guestCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Boarding-pass style stats — same as home page */}
      <div style={{
        display: 'flex', borderTop: '1px solid #EDE8E1', borderBottom: '1px solid #EDE8E1',
        margin: '4px 0',
      }}>
        {[
          { label: 'CHECK-IN', value: formatDate(checkIn) },
          { label: 'CHECK-OUT', value: formatDate(checkOut) },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, padding: '12px 20px',
            borderLeft: i === 0 ? 'none' : '1px solid #EDE8E1',
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: '#9E9389', margin: '0 0 4px',
            }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1C1A17', margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #EDE8E1' }}>
        {[
          { label: 'NIGHTS', value: nights != null ? String(nights) : '—' },
          { label: 'GUESTS', value: guestCount != null ? String(guestCount) : '—' },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, padding: '12px 20px',
            borderLeft: i === 0 ? 'none' : '1px solid #EDE8E1',
          }}>
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: '#9E9389', margin: '0 0 4px',
            }}>
              {stat.label}
            </p>
            <p className={cormorant.className} style={{
              fontSize: 24, fontWeight: 300,
              color: '#1C1A17', margin: 0, lineHeight: 1,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Booking reference */}
      {bookingReference && (
        <div style={{ padding: '12px 20px' }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 10,
            color: '#9E9389', margin: 0, letterSpacing: '0.06em',
          }}>
            Ref: {bookingReference}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Section: Today ─────────────────────────────────────────── */

function SectionToday() {
  const { items } = useItinerary();
  const today = new Date();
  const todayItems = items.filter((item) => isSameDay(item.date, today));

  if (todayItems.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 300 }}>
        <Image
          src="/images/hotels/mbs-hero.jpg"
          alt="Morning"
          fill
          sizes="(min-width: 768px) 70vw, 100vw"
          style={{ objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 40%, rgba(${BG_LINEN},0.97) 100%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 32, left: 24, right: 24,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#1C1A17', fontWeight: 500, margin: 0 }}>
            Nothing locked in yet
          </p>
          <a href="?tab=discover" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: GOLD, textDecoration: 'none' }}>
            Head to Discover to find something →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
      {todayItems.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          style={{
            display: 'flex', height: 80, borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            overflow: 'hidden', cursor: 'pointer',
          }}
        >
          <div style={{ position: 'relative', width: 72, flexShrink: 0 }}>
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{
                height: '100%', background: 'var(--surface-raised)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Sans, sans-serif', fontSize: 22, color: 'var(--text-muted)', fontWeight: 600,
              }}>
                {item.category?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', gap: 3 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{item.name}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>{item.category}</p>
            {item.time && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: GOLD, margin: 0 }}>{item.time}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Section: Preferences ───────────────────────────────────── */

function SectionPreferences({ stayId }: { stayId?: string | null }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    dining: new Set(), room_service: new Set(), general: new Set(),
  });
  const [showSaved, setShowSaved] = useState(false);
  const userModifiedRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!stayId) return;
    fetch(`/api/pms/preferences?stay_id=${stayId}`)
      .then((r) => r.json())
      .then(({ data }: { data: GuestPreference[] }) => {
        if (!Array.isArray(data)) return;
        const init: Record<string, Set<string>> = {};
        for (const pref of data) {
          const chips = pref.preference_data?.selected_chips;
          if (Array.isArray(chips)) init[pref.preference_type] = new Set(chips as string[]);
        }
        if (Object.keys(init).length > 0) setSelected((prev) => ({ ...prev, ...init }));
      })
      .catch(() => {});
  }, [stayId]);

  useEffect(() => {
    if (!stayId || !userModifiedRef.current) return;
    const timer = setTimeout(() => {
      void Promise.all(
        Object.entries(selected).map(([prefType, chips]) =>
          fetch('/api/pms/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stay_id: stayId, preference_type: prefType, preference_data: { selected_chips: Array.from(chips) } }),
          }).catch(() => {})
        )
      ).then(() => {
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
      if (set.has(chip)) set.delete(chip); else set.add(chip);
      return { ...prev, [prefType]: set };
    });
  }, []);

  return (
    <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      {PREF_SECTIONS.map((section, si) => (
        <motion.div
          key={section.prefType}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: si * 0.06 }}
          style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}
        >
          <div style={{ height: 160, position: 'relative' }}>
            <Image src={section.bgImage} alt={section.title} fill sizes="(min-width: 768px) 70vw, 100vw" style={{ objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to bottom, rgba(${BG_LINEN},0) 0%, rgba(${BG_LINEN},0.95) 100%)`,
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px 16px' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {section.title}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {section.chips.map((chip) => {
                  const isActive = selected[section.prefType]?.has(chip) ?? false;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(section.prefType, chip)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: 11, padding: '5px 12px',
                        borderRadius: 6, border: `1px solid ${isActive ? GOLD : 'var(--border)'}`,
                        background: isActive ? 'rgba(193,127,58,0.06)' : 'var(--surface)',
                        color: isActive ? GOLD : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 150ms',
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

      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: GOLD,
              padding: '6px 16px', borderRadius: 99, background: 'var(--background)',
              border: '1px solid rgba(193,127,58,0.3)', zIndex: 50, whiteSpace: 'nowrap',
            }}
          >
            Saved ✦
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Section: Chat ──────────────────────────────────────────── */

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

function SectionChat({ stayId }: { stayId?: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const msgIdRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isTyping) return;
    msgIdRef.current += 1;
    setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'user', content: msg }]);
    setInput('');
    setIsTyping(true);
    try {
      const supabase = getSupabaseBrowser();
      let token: string | null = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg, mode: 'discovery', stayId: stayId ?? null,
          history: messages.map((m) => ({ role: m.role, text: m.content })),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      msgIdRef.current += 1;
      setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'assistant', content: data.reply ?? "I'm here to help with your stay." }]);
    } catch {
      msgIdRef.current += 1;
      setMessages((prev) => [...prev, { id: msgIdRef.current, role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, stayId]);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', minHeight: 0,
    }}>
      {/* Subtle blurred backdrop — reduced opacity vs before */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <Image
          src="/images/hotels/mbs-hero.jpg"
          alt=""
          fill
          sizes="(min-width: 768px) 70vw, 100vw"
          style={{ objectFit: 'cover', filter: 'blur(48px) brightness(1.05)', transform: 'scale(1.12)' }}
        />
      </div>
      {/* Lighter overlay — gives more breathing room */}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(${BG_LINEN},0.92)`, zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {messages.length === 0 && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 32, margin: 0 }}
            >
              Hi! How can I help with your stay?
            </motion.p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div style={{
                  maxWidth: '78%', padding: '10px 14px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.55,
                  ...(msg.role === 'user'
                    ? { background: GOLD, color: '#fff', borderRadius: '16px 16px 4px 16px' }
                    : { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px' }
                  ),
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><TypingIndicator /></div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 20px 16px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 24, padding: '8px 8px 8px 16px',
            boxShadow: '0 2px 12px rgba(28,26,23,0.06)',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
              placeholder="Ask about your stay…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: input.trim() && !isTyping ? GOLD : 'var(--border)',
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 150ms',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Right panel reel ───────────────────────────────────────── */

type ReelSection = 'today' | 'preferences' | 'chat';

function RightReel({ stayId }: { stayId?: string | null }) {
  const [activeSection, setActiveSection] = useState<ReelSection>('chat');

  const tabs: { id: ReelSection; label: string }[] = [
    { id: 'chat', label: 'Concierge' },
    { id: 'today', label: 'Today' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }}>
      {/* Tab nav */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 20px', borderBottom: '1px solid #EDE8E1',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 13,
              fontWeight: activeSection === tab.id ? 600 : 400,
              color: activeSection === tab.id ? GOLD : '#9E9389',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${activeSection === tab.id ? GOLD : 'transparent'}`,
              padding: '14px 14px 12px', cursor: 'pointer',
              transition: 'color 150ms, border-color 150ms',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
        >
          {activeSection === 'today' && <SectionToday />}
          {activeSection === 'preferences' && <SectionPreferences stayId={stayId} />}
          {activeSection === 'chat' && <SectionChat stayId={stayId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────── */

export default function ConciergeExperience({
  stayId, guestName, propertyName, propertyImageUrl,
  propertyCity, propertyCountry, bookingReference,
  checkIn, checkOut, guestCount,
}: ConciergeExperienceProps) {
  return (
    <>
      <style>{`
        .ce-layout{display:flex;flex-direction:column;width:100%;height:calc(100vh - 64px);background:#FAF8F5;overflow:hidden;}
        .ce-left{width:100%;flex-shrink:0;border-bottom:1px solid #EDE8E1;max-height:340px;overflow:hidden;}
        .ce-right{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
        @media(min-width:768px){
          .ce-layout{flex-direction:row;}
          .ce-left{width:30%;max-height:none;border-bottom:none;border-right:1px solid #EDE8E1;overflow:hidden;}
          .ce-right{flex:1;}
        }
        @media(min-width:1024px){
          .ce-left{width:28%;}
        }
      `}</style>

      <div className="ce-layout">
        <div className="ce-left">
          <StayAnchor
            propertyName={propertyName}
            propertyImageUrl={propertyImageUrl}
            propertyCity={propertyCity}
            propertyCountry={propertyCountry}
            checkIn={checkIn}
            checkOut={checkOut}
            guestCount={guestCount}
            guestName={guestName}
            bookingReference={bookingReference}
          />
        </div>
        <div className="ce-right">
          <RightReel stayId={stayId} />
        </div>
      </div>
    </>
  );
}
