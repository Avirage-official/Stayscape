'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

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
    body: 'Every request you make — towels, wake-up calls, room service — lives in one place. You can see what\'s pending, what\'s been fulfilled, and send new ones without picking up a phone.',
  },
  {
    id: 'discover',
    label: 'Discover',
    headline: 'Curated places, right where you are.',
    body: 'Every hotel unlocks a guide to what\'s around it — restaurants, experiences, hidden gems — surfaced by Aria and tailored to your trip, not just your location.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

/* ── Screen: Ask Aria ─────────────────────────────────────────────── */
function AriaScreen() {
  const messages = [
    { role: 'user' as const, text: 'Can I get a late checkout tomorrow?' },
    { role: 'aria' as const, text: 'Of course — I\'ve requested a 1 PM checkout for you. You\'ll get a confirmation shortly.' },
    { role: 'user' as const, text: 'Perfect. And what\'s good for dinner nearby?' },
    { role: 'aria' as const, text: 'Given you\'re here for the weekend, I\'d suggest Lola\'s — 5 min walk, great pasta, reservations available at 7:30 tonight.' },
  ]

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: '#FAF8F5' }}
    >
      {/* App header */}
      <div
        className="flex items-center gap-2.5 px-3 py-3"
        style={{ borderBottom: '1px solid #EDE8E1', background: '#FFFFFF' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
          style={{ background: 'rgba(193,127,58,0.10)', color: '#C17F3A' }}
        >
          ✦
        </div>
        <div>
          <p
            className="text-[10px] font-semibold"
            style={{ color: '#1C1A17' }}
          >
            Aria
          </p>
          <p
            className="text-[8px]"
            style={{ color: '#C17F3A' }}
          >
            Online · Room 412
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: '#4A7C59' }}
          />
          <span className="text-[8px]" style={{ color: '#9E9389' }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 py-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[82%] rounded-xl px-2.5 py-2 text-[9px] leading-[1.5]"
              style={
                msg.role === 'user'
                  ? {
                      background: '#C17F3A',
                      color: '#FAF8F5',
                      borderBottomRightRadius: '3px',
                    }
                  : {
                      background: '#FFFFFF',
                      color: '#1C1A17',
                      border: '1px solid #EDE8E1',
                      borderBottomLeftRadius: '3px',
                    }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-2 px-3 pb-4 pt-2"
        style={{ borderTop: '1px solid #EDE8E1' }}
      >
        <div
          className="flex-1 rounded-lg px-2.5 py-2 text-[9px]"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EDE8E1',
            color: '#C4BBB2',
          }}
        >
          Ask Aria anything…
        </div>
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: '#C17F3A' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ── Screen: Service Requests ─────────────────────────────────────── */
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
      {/* Header */}
      <div
        className="px-3 py-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #EDE8E1' }}
      >
        <p className="text-[11px] font-semibold" style={{ color: '#1C1A17' }}>
          My Requests
        </p>
        <p className="text-[9px]" style={{ color: '#9E9389' }}>
          Room 412 · 4 requests
        </p>
      </div>

      {/* Request list */}
      <div className="flex flex-col gap-2 px-3 py-3">
        {requests.map((req, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EDE8E1',
            }}
          >
            <div className="flex-1">
              <p className="text-[9px] font-medium" style={{ color: '#1C1A17' }}>
                {req.label}
              </p>
              <p className="text-[8px]" style={{ color: '#9E9389' }}>
                {req.time}
              </p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[8px] font-medium"
              style={{
                background: statusColor[req.status].bg,
                color: statusColor[req.status].text,
              }}
            >
              {req.status}
            </span>
          </div>
        ))}
      </div>

      {/* New request button */}
      <div className="mx-3 mt-auto mb-4">
        <div
          className="flex items-center justify-center rounded-xl py-2.5"
          style={{ background: '#C17F3A' }}
        >
          <p className="text-[9px] font-semibold" style={{ color: '#FAF8F5' }}>
            + New Request
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Screen: Discover ─────────────────────────────────────────────── */
function DiscoverScreen() {
  const places = [
    { name: "Lola's Kitchen", tag: 'Italian · 5 min walk', color: '#D4956A' },
    { name: 'The Harbour Bar', tag: 'Cocktails · 8 min', color: '#C17F3A' },
    { name: 'Sunday Market', tag: 'Weekend · 12 min', color: '#B8956A' },
  ]

  return (
    <div className="flex h-full flex-col" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div
        className="px-3 py-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #EDE8E1' }}
      >
        <p className="text-[11px] font-semibold" style={{ color: '#1C1A17' }}>
          Discover
        </p>
        <p className="text-[9px]" style={{ color: '#9E9389' }}>
          Near The Grand · Curated by Aria
        </p>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-3 pt-3 pb-1">
        {['All', 'Dining', 'Experiences', 'Nightlife'].map((cat, i) => (
          <span
            key={cat}
            className="rounded-full px-2 py-0.5 text-[8px] font-medium"
            style={{
              background: i === 0 ? '#C17F3A' : '#FFFFFF',
              color: i === 0 ? '#FAF8F5' : '#9E9389',
              border: i === 0 ? 'none' : '1px solid #EDE8E1',
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Place cards */}
      <div className="flex flex-col gap-2 px-3 pt-2">
        {places.map((place, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl p-2.5"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EDE8E1',
            }}
          >
            <div
              className="h-10 w-10 flex-shrink-0 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${place.color}, #E8C9A8)` }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="truncate text-[9px] font-semibold"
                style={{ color: '#1C1A17' }}
              >
                {place.name}
              </p>
              <p className="text-[8px]" style={{ color: '#9E9389' }}>
                {place.tag}
              </p>
            </div>
            <div
              className="flex-shrink-0 rounded-lg px-2 py-1 text-[8px] font-medium"
              style={{
                background: 'rgba(193,127,58,0.08)',
                color: '#C17F3A',
                border: '1px solid rgba(193,127,58,0.2)',
              }}
            >
              Save
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS: Record<TabId, () => JSX.Element> = {
  aria: AriaScreen,
  requests: RequestsScreen,
  discover: DiscoverScreen,
}

/* ── Phone shell ──────────────────────────────────────────────────── */
function PhoneMockup({
  activeTab,
  reduced,
}: {
  activeTab: TabId
  reduced: boolean | null
}) {
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
        boxShadow:
          '0 24px 56px rgba(28,26,23,0.12), 0 4px 16px rgba(28,26,23,0.06)',
      }}
    >
      {/* Dynamic island */}
      <div
        className="absolute top-2.5 left-1/2 z-10 -translate-x-1/2"
        style={{
          width: 72,
          height: 18,
          borderRadius: 10,
          background: '#1C1A17',
        }}
      />

      {/* Screen content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.4, ease: REVEAL_EASE }
          }
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function ProductWalkthrough() {
  const [activeTab, setActiveTab] = useState<TabId>('aria')
  const reduced = useReducedMotion()

  const activeData = TABS.find((t) => t.id === activeTab)!

  return (
    <section
      id="walkthrough"
      style={{
        background: 'var(--background)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">

        {/* Section header */}
        <div className="mb-12">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--gold)' }}
          >
            See it in action
          </p>
          <h2
            className="max-w-[460px] leading-[1.2] tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Everything your stay needs, in one conversation.
          </h2>
        </div>

        {/* Tab nav */}
        <div
          className="mb-12 flex gap-1 rounded-xl p-1 w-fit"
          style={{ background: '#F5F2EE', border: '1px solid var(--border)' }}
          role="tablist"
          aria-label="Product features"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as TabId)}
              className="relative rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors duration-200"
              style={{
                color:
                  activeTab === tab.id
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 1px 4px rgba(28,26,23,0.08)',
                  }}
                  transition={{ duration: 0.25, ease: REVEAL_EASE }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop: two-column */}
        <div className="hidden items-center gap-16 lg:grid lg:grid-cols-2">
          {/* Left: description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              initial={reduced ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -12 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.4, ease: REVEAL_EASE }
              }
            >
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
              <p
                className="leading-[1.8]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  maxWidth: '44ch',
                }}
              >
                {activeData.body}
              </p>

              {/* Dot indicators */}
              <div className="mt-10 flex gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    aria-label={`View ${tab.label}`}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: activeTab === tab.id ? '24px' : '6px',
                      background:
                        activeTab === tab.id
                          ? 'var(--gold)'
                          : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right: phone mockup */}
          <div className="flex justify-center">
            <PhoneMockup activeTab={activeTab} reduced={reduced} />
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="space-y-12 lg:hidden">
          {TABS.map((tab) => (
            <div key={tab.id} className="space-y-8">
              <div>
                <p
                  className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: 'var(--gold)' }}
                >
                  {tab.label}
                </p>
                <h3
                  className="mb-4 leading-[1.25] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1.6rem, 4vw, 2rem)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {tab.headline}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                  }}
                >
                  {tab.body}
                </p>
              </div>
              <PhoneMockup activeTab={tab.id as TabId} reduced={reduced} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
