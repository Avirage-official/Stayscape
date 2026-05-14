'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion'
import type { ReactElement } from 'react'

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/* Per-pillar colour palette */
const PILLAR_PALETTE = {
  aria:     { accent: '#C17F3A', bg: 'rgba(193,127,58,0.06)',  border: 'rgba(193,127,58,0.18)',  label: '#C17F3A' },
  requests: { accent: '#2D5A3D', bg: 'rgba(45,90,61,0.06)',    border: 'rgba(45,90,61,0.18)',    label: '#4A7C59' },
  discover: { accent: '#3A3028', bg: 'rgba(58,48,40,0.06)',    border: 'rgba(58,48,40,0.18)',    label: '#7A6A5A' },
} as const

const TABS = [
  {
    id: 'aria',
    label: 'Ask Aria',
    headline: 'Natural conversation. No menus, no forms.',
    body: 'Aria knows your hotel, your room, and your stay context. Ask anything — from what time the restaurant opens, to getting extra pillows sent up — and it just happens.',
  },
  {
    id: 'requests',
    label: 'Service Requests',
    headline: 'Track every request, from ask to done.',
    body: "Every request you make — towels, wake-up calls, room service — lives in one place. You can see what's pending, what's been fulfilled, and send new ones without picking up a phone.",
  },
  {
    id: 'discover',
    label: 'Discover',
    headline: 'Curated places, right where you are.',
    body: "Every hotel unlocks a guide to what's around it — restaurants, experiences, hidden gems — surfaced by Aria and tailored to your trip, not just your location.",
  },
] as const

type TabId = (typeof TABS)[number]['id']

function AriaScreen() {
  const messages = [
    { role: 'user' as const, text: 'Can I get a late checkout tomorrow?' },
    { role: 'aria' as const, text: "Of course — I've requested a 1 PM checkout for you. You'll receive a confirmation shortly." },
    { role: 'user' as const, text: "Perfect. What's good for dinner nearby?" },
    { role: 'aria' as const, text: "Given you're here for the weekend, I'd suggest Lola's — 5 min walk, great pasta, reservations available at 7:30 tonight." },
  ]
  return (
    <div className="flex h-full flex-col" style={{ background: '#FAF8F5' }}>
      <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderBottom: '1px solid #EDE8E1', background: '#FFFFFF' }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px]" style={{ background: 'rgba(193,127,58,0.10)', color: '#C17F3A' }}>✦</div>
        <div>
          <p className="text-[10px] font-semibold" style={{ color: '#1C1A17' }}>Aria</p>
          <p className="text-[8px]" style={{ color: '#C17F3A' }}>Online · Room 412</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#4A7C59' }} />
          <span className="text-[8px]" style={{ color: '#9E9389' }}>Live</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 py-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[82%] rounded-xl px-2.5 py-2 text-[9px] leading-[1.5]"
              style={
                msg.role === 'user'
                  ? { background: '#C17F3A', color: '#FAF8F5', borderBottomRightRadius: '3px' }
                  : { background: '#FFFFFF', color: '#1C1A17', border: '1px solid #EDE8E1', borderBottomLeftRadius: '3px' }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 pb-4 pt-2" style={{ borderTop: '1px solid #EDE8E1' }}>
        <div className="flex-1 rounded-lg px-2.5 py-2 text-[9px]" style={{ background: '#FFFFFF', border: '1px solid #EDE8E1', color: '#C4BBB2' }}>Ask Aria anything…</div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: '#C17F3A' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg>
        </div>
      </div>
    </div>
  )
}

function RequestsScreen() {
  const requests = [
    { label: 'Extra towels × 2', status: 'Done', time: '2:14 PM' },
    { label: 'Wake-up call at 7 AM', status: 'Confirmed', time: '2:18 PM' },
    { label: 'Late checkout · 1 PM', status: 'Pending', time: '2:31 PM' },
    { label: 'Dinner reservation · 7:30', status: 'Pending', time: '2:33 PM' },
  ]
  const statusColor: Record<string, { bg: string; text: string }> = {
    Done:      { bg: 'rgba(74,124,89,0.12)',   text: '#4A7C59' },
    Confirmed: { bg: 'rgba(193,127,58,0.12)',  text: '#C17F3A' },
    Pending:   { bg: 'rgba(158,147,137,0.12)', text: '#9E9389' },
  }
  return (
    <div className="flex h-full flex-col" style={{ background: '#FAF8F5' }}>
      <div className="px-3 py-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #EDE8E1' }}>
        <p className="text-[11px] font-semibold" style={{ color: '#1C1A17' }}>My Requests</p>
        <p className="text-[9px]" style={{ color: '#9E9389' }}>Room 412 · 4 requests</p>
      </div>
      <div className="flex flex-col gap-2 px-3 py-3">
        {requests.map((req, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E1' }}>
            <div className="flex-1">
              <p className="text-[9px] font-medium" style={{ color: '#1C1A17' }}>{req.label}</p>
              <p className="text-[8px]" style={{ color: '#9E9389' }}>{req.time}</p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[8px] font-medium" style={{ background: statusColor[req.status].bg, color: statusColor[req.status].text }}>{req.status}</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-auto mb-4">
        <div className="flex items-center justify-center rounded-xl py-2.5" style={{ background: '#C17F3A' }}>
          <p className="text-[9px] font-semibold" style={{ color: '#FAF8F5' }}>+ New Request</p>
        </div>
      </div>
    </div>
  )
}

function DiscoverScreen() {
  const places = [
    { name: "Lola's Kitchen", tag: 'Italian · 5 min walk', color: '#D4956A' },
    { name: 'The Harbour Bar', tag: 'Cocktails · 8 min', color: '#C17F3A' },
    { name: 'Sunday Market', tag: 'Weekend · 12 min', color: '#B8956A' },
  ]
  return (
    <div className="flex h-full flex-col" style={{ background: '#FAF8F5' }}>
      <div className="px-3 py-3" style={{ background: '#FFFFFF', borderBottom: '1px solid #EDE8E1' }}>
        <p className="text-[11px] font-semibold" style={{ color: '#1C1A17' }}>Discover</p>
        <p className="text-[9px]" style={{ color: '#9E9389' }}>Near The Grand · Curated by Aria</p>
      </div>
      <div className="flex gap-1.5 px-3 pt-3 pb-1">
        {['All', 'Dining', 'Experiences', 'Nightlife'].map((cat, i) => (
          <span key={cat} className="rounded-full px-2 py-0.5 text-[8px] font-medium" style={{ background: i === 0 ? '#C17F3A' : '#FFFFFF', color: i === 0 ? '#FAF8F5' : '#9E9389', border: i === 0 ? 'none' : '1px solid #EDE8E1' }}>{cat}</span>
        ))}
      </div>
      <div className="flex flex-col gap-2 px-3 pt-2">
        {places.map((place, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: '#FFFFFF', border: '1px solid #EDE8E1' }}>
            <div className="h-10 w-10 flex-shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${place.color}, #E8C9A8)` }} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-[9px] font-semibold" style={{ color: '#1C1A17' }}>{place.name}</p>
              <p className="text-[8px]" style={{ color: '#9E9389' }}>{place.tag}</p>
            </div>
            <div className="flex-shrink-0 rounded-lg px-2 py-1 text-[8px] font-medium" style={{ background: 'rgba(193,127,58,0.08)', color: '#C17F3A', border: '1px solid rgba(193,127,58,0.2)' }}>Save</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS: Record<TabId, () => ReactElement> = {
  aria: AriaScreen,
  requests: RequestsScreen,
  discover: DiscoverScreen,
}

function PhoneMockup({ activeTab, reduced }: { activeTab: TabId; reduced: boolean | null }) {
  const Screen = SCREENS[activeTab]
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 260,
        aspectRatio: '9 / 19.5',
        borderRadius: 38,
        border: '2px solid #EDE8E1',
        background: '#FAF8F5',
        overflow: 'hidden',
        boxShadow: '0 24px 56px rgba(28,26,23,0.12), 0 4px 16px rgba(28,26,23,0.06)',
      }}
    >
      <div className="absolute top-2.5 left-1/2 z-10 -translate-x-1/2" style={{ width: 72, height: 18, borderRadius: 10, background: '#1C1A17' }} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: REVEAL_EASE }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PillarTab({ tab, active, onClick }: { tab: typeof TABS[number]; active: boolean; onClick: () => void }) {
  const palette = PILLAR_PALETTE[tab.id as TabId]
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-controls={`panel-${tab.id}`}
      onClick={onClick}
      className="relative px-5 py-2.5 text-[13px] font-medium"
      style={{
        color: active ? palette.label : 'var(--text-muted)',
        background: active ? palette.bg : 'transparent',
        border: active ? `1px solid ${palette.border}` : '1px solid transparent',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'color 200ms, background 200ms, border-color 200ms',
      }}
    >
      {tab.label}
      {active && (
        <motion.div
          layoutId="tab-underline"
          style={{
            position: 'absolute',
            bottom: -1,
            left: '20%',
            right: '20%',
            height: 2,
            borderRadius: 2,
            background: palette.accent,
          }}
          transition={{ duration: 0.3, ease: REVEAL_EASE }}
        />
      )}
    </button>
  )
}

export default function ProductWalkthrough() {
  const [activeTab, setActiveTab] = useState<TabId>('aria')
  const reduced = useReducedMotion()

  const activeData = TABS.find((t) => t.id === activeTab)!
  const activePalette = PILLAR_PALETTE[activeTab]

  return (
    <section
      id="product-walkthrough"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        overflow: 'hidden',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">

        <motion.div
          className="mb-14"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: REVEAL_EASE }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--gold)' }}>The product</p>
          <h2
            className="max-w-[460px] leading-[1.2] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Everything your stay needs,{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>in one conversation.</span>
          </h2>
        </motion.div>

        <div className="mb-14 flex gap-2 flex-wrap" role="tablist" aria-label="Product features">
          {TABS.map((tab) => (
            <PillarTab key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id as TabId)} />
          ))}
        </div>

        {/* Desktop: two-column */}
        <div className="hidden items-center gap-16 lg:grid lg:grid-cols-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              initial={reduced ? false : { opacity: 0, x: -16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={reduced ? undefined : { opacity: 0, x: -16, filter: 'blur(4px)' }}
              transition={reduced ? { duration: 0 } : { duration: 0.45, ease: REVEAL_EASE }}
            >
              <motion.div
                style={{ width: 36, height: 2, borderRadius: 2, background: activePalette.accent, marginBottom: 20 }}
                layoutId="pillar-accent"
                transition={{ duration: 0.35, ease: REVEAL_EASE }}
              />
              <h3
                className="mb-5 leading-[1.25] tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {activeData.headline}
              </h3>
              <p className="leading-[1.8]" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '44ch' }}>
                {activeData.body}
              </p>
              <div className="mt-10 flex gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    aria-label={`View ${tab.label}`}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: activeTab === tab.id ? '24px' : '6px', background: activeTab === tab.id ? activePalette.accent : 'var(--border)' }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="flex justify-center"
            animate={reduced ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PhoneMockup activeTab={activeTab} reduced={reduced} />
          </motion.div>
        </div>

        {/* Mobile: stacked */}
        <div className="space-y-12 lg:hidden">
          {TABS.map((tab) => {
            const palette = PILLAR_PALETTE[tab.id as TabId]
            return (
              <div key={tab.id} className="space-y-8">
                <div>
                  <div style={{ width: 28, height: 2, borderRadius: 2, background: palette.accent, marginBottom: 14 }} />
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: palette.label }}>{tab.label}</p>
                  <h3 className="mb-4 leading-[1.25] tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {tab.headline}
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{tab.body}</p>
                </div>
                <PhoneMockup activeTab={tab.id as TabId} reduced={reduced} />
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}