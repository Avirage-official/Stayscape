'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STEPS = [
  {
    number: '01',
    label: 'Discover',
    headline: 'A curated city, waiting.',
    body: 'Guests open the Discover tab and see a cinematic, Netflix-style carousel of places and activities — not a list of Google Maps links.',
  },
  {
    number: '02',
    label: 'Explore',
    headline: 'Every place, beautifully told.',
    body: 'Tap any card and get a rich editorial detail view — what to bring, what to look out for, the story of the place.',
  },
  {
    number: '03',
    label: 'Plan',
    headline: 'Built into their stay.',
    body: 'Guests add activities to their itinerary, pick a date and time, and their whole trip takes shape — within their check-in to check-out window.',
  },
  {
    number: '04',
    label: 'Remember',
    headline: 'Every day, beautifully organized.',
    body: 'The Itinerary tab groups everything by day — clean, visual, with free-time awareness.',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Phone screen placeholders                                         */
/* ------------------------------------------------------------------ */

function DiscoverScreen() {
  return (
    <div className="flex h-full flex-col" style={{ background: '#0E0F14' }}>
      {/* Search bar */}
      <div className="px-4 pt-6 pb-3">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: '#1D2030' }}
        >
          <div className="h-4 w-4 rounded-full" style={{ background: '#C8A85A' }} />
          <div className="h-3 flex-1 rounded" style={{ background: '#2a2c3a' }} />
        </div>
      </div>
      {/* Section label */}
      <div className="px-4 pt-2 pb-3">
        <div className="h-2 w-16 rounded" style={{ background: '#C8A85A', opacity: 0.5 }} />
        <div className="mt-1.5 h-3 w-28 rounded" style={{ background: '#E8E6E1' }} />
      </div>
      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-hidden px-4 pb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 overflow-hidden rounded-2xl"
            style={{
              width: 140,
              height: 190,
              background: `linear-gradient(180deg, #1D2030 0%, #151724 100%)`,
            }}
          >
            <div
              className="h-[60%] w-full"
              style={{
                background: `linear-gradient(135deg, ${
                  ['#2a3040', '#302a3a', '#2a3530'][i]
                }, #1D2030)`,
              }}
            />
            <div className="p-2.5">
              <div className="h-2 w-[70%] rounded" style={{ background: '#E8E6E1' }} />
              <div className="mt-1.5 h-1.5 w-[50%] rounded" style={{ background: '#8a8580' }} />
            </div>
          </div>
        ))}
      </div>
      {/* Bottom nav */}
      <div className="mt-auto flex justify-around px-4 py-3" style={{ borderTop: '1px solid #1D2030' }}>
        {[true, false, false, false].map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: active ? '#C8A85A' : '#2a2c3a' }}
            />
            <div className="h-1 w-5 rounded" style={{ background: active ? '#C8A85A' : '#2a2c3a' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ExploreScreen() {
  return (
    <div className="flex h-full flex-col" style={{ background: '#0E0F14' }}>
      {/* Hero image */}
      <div
        className="relative w-full"
        style={{
          height: '45%',
          background: 'linear-gradient(135deg, #2a3040, #1D2030)',
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: 'linear-gradient(to top, #0E0F14, transparent)' }}
        />
        {/* Back button */}
        <div className="absolute top-4 left-4 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'rgba(14,15,20,0.6)' }}>
          <div className="h-2.5 w-2.5 rotate-45 border-b-2 border-l-2" style={{ borderColor: '#E8E6E1' }} />
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col px-4 -mt-4 relative">
        <div className="h-4 w-[80%] rounded" style={{ background: '#E8E6E1' }} />
        <div className="mt-2 h-2 w-[60%] rounded" style={{ background: '#C8A85A', opacity: 0.6 }} />
        <div className="mt-4 space-y-1.5">
          <div className="h-1.5 w-full rounded" style={{ background: '#8a8580', opacity: 0.4 }} />
          <div className="h-1.5 w-[90%] rounded" style={{ background: '#8a8580', opacity: 0.4 }} />
          <div className="h-1.5 w-[70%] rounded" style={{ background: '#8a8580', opacity: 0.4 }} />
        </div>
        {/* CTA buttons */}
        <div className="mt-auto flex gap-2 pb-6">
          <div className="flex-1 rounded-xl py-2.5 text-center" style={{ background: '#C8A85A' }}>
            <div className="mx-auto h-2 w-14 rounded" style={{ background: '#0E0F14' }} />
          </div>
          <div className="flex-1 rounded-xl py-2.5 text-center" style={{ border: '1px solid #C8A85A' }}>
            <div className="mx-auto h-2 w-14 rounded" style={{ background: '#C8A85A' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanScreen() {
  return (
    <div className="flex h-full flex-col" style={{ background: '#0E0F14' }}>
      <div className="px-4 pt-6 pb-3">
        <div className="h-3 w-24 rounded" style={{ background: '#E8E6E1' }} />
        <div className="mt-1 h-2 w-36 rounded" style={{ background: '#8a8580', opacity: 0.5 }} />
      </div>
      {/* Date picker */}
      <div className="mx-4 rounded-xl p-3" style={{ background: '#1D2030' }}>
        <div className="flex justify-between pb-2" style={{ borderBottom: '1px solid #2a2c3a' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[8px]" style={{ color: '#8a8580' }}>{d}</span>
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full text-[8px]"
                style={{
                  background: i === 2 ? '#C8A85A' : 'transparent',
                  color: i === 2 ? '#0E0F14' : '#E8E6E1',
                }}
              >
                {15 + i}
              </div>
            </div>
          ))}
        </div>
        {/* Time slots */}
        <div className="mt-3 space-y-2">
          {['9:00 AM', '11:30 AM', '2:00 PM'].map((time, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: i === 1 ? 'rgba(200,168,90,0.1)' : '#161825' }}>
              <span className="text-[8px]" style={{ color: i === 1 ? '#C8A85A' : '#8a8580' }}>{time}</span>
              <div className="h-1.5 flex-1 rounded" style={{ background: i === 1 ? '#C8A85A' : '#2a2c3a', opacity: i === 1 ? 0.4 : 1 }} />
            </div>
          ))}
        </div>
      </div>
      {/* Add button */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-center rounded-xl py-2.5" style={{ background: '#C8A85A' }}>
          <div className="h-2 w-24 rounded" style={{ background: '#0E0F14' }} />
        </div>
      </div>
    </div>
  )
}

function ItineraryScreen() {
  return (
    <div className="flex h-full flex-col" style={{ background: '#0E0F14' }}>
      <div className="px-4 pt-6 pb-3">
        <div className="h-3 w-28 rounded" style={{ background: '#E8E6E1' }} />
      </div>
      {/* Day chips */}
      <div className="flex gap-2 px-4 pb-3">
        {['Day 1', 'Day 2', 'Day 3'].map((day, i) => (
          <div
            key={i}
            className="rounded-full px-3 py-1"
            style={{
              background: i === 0 ? '#C8A85A' : '#1D2030',
              color: i === 0 ? '#0E0F14' : '#8a8580',
              fontSize: 9,
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {day}
          </div>
        ))}
      </div>
      {/* Activity cards */}
      <div className="space-y-2.5 px-4">
        {[
          { time: '9:00 AM', title: 'Beach Walk', color: '#2a3530' },
          { time: '12:30 PM', title: 'Lunch at Marina', color: '#302a3a' },
          { time: '3:00 PM', title: 'Historic Tour', color: '#2a3040' },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: '#1D2030' }}
          >
            <div
              className="h-10 w-10 flex-shrink-0 rounded-lg"
              style={{ background: item.color }}
            />
            <div className="flex-1">
              <span className="block text-[8px]" style={{ color: '#C8A85A' }}>
                {item.time}
              </span>
              <div className="mt-0.5 h-2 w-[70%] rounded" style={{ background: '#E8E6E1' }} />
              <div className="mt-1 h-1.5 w-[50%] rounded" style={{ background: '#8a8580', opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PHONE_SCREENS = [DiscoverScreen, ExploreScreen, PlanScreen, ItineraryScreen]

/* ------------------------------------------------------------------ */
/*  Phone mockup                                                       */
/* ------------------------------------------------------------------ */

function PhoneMockup({
  activeIndex,
  prefersReducedMotion,
}: {
  activeIndex: number
  prefersReducedMotion: boolean | null
}) {
  const clampedIndex = Math.min(Math.max(activeIndex, 0), PHONE_SCREENS.length - 1)
  const Screen = PHONE_SCREENS[clampedIndex]

  return (
    <div
      className="relative mx-auto"
      style={{
        width: 280,
        aspectRatio: '9 / 19.5',
        borderRadius: 40,
        border: '3px solid #2a2a2a',
        background: '#0E0F14',
        overflow: 'hidden',
        boxShadow:
          '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,169,110,0.08)',
      }}
    >
      {/* Dynamic island / notch */}
      <div
        className="absolute top-3 left-1/2 z-10 -translate-x-1/2"
        style={{
          width: 80,
          height: 22,
          borderRadius: 12,
          background: '#0E0F14',
          border: '1px solid #1a1a1a',
        }}
      />
      {/* Screen content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, scale: 0.98 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            prefersReducedMotion
              ? undefined
              : { opacity: 0, scale: 0.98 }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.5, ease: REVEAL_EASE }
          }
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ProductWalkthrough() {
  const containerRef = useRef<HTMLElement>(null)
  const { activeIndex, prefersReducedMotion } = useScrollProgress({
    containerRef,
  })

  return (
    <section
      id="walkthrough"
      ref={containerRef}
      className="relative"
      style={{
        minHeight: '300vh',
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Grain texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Section header */}
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 sm:px-12 md:px-20 lg:px-28">
        <p
          className="text-xs font-medium uppercase"
          style={{
            letterSpacing: '0.08em',
            color: '#c9a96e',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          The Product
        </p>
        <h2
          className="mt-3 text-3xl font-bold md:text-4xl"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: '#e8e4dc',
            letterSpacing: '-0.02em',
          }}
        >
          What Stayscape Does
        </h2>
      </div>

      {/* Desktop layout */}
      <div className="relative mx-auto hidden max-w-7xl px-6 sm:px-12 md:grid md:grid-cols-2 md:gap-12 md:px-20 lg:px-28">
        {/* Left column — narrative steps */}
        <div>
          {STEPS.map((step, i) => {
            const isActive = i === activeIndex
            return (
              <div
                key={step.number}
                className="flex flex-col justify-center"
                style={{ minHeight: '75vh' }}
              >
                <motion.div
                  animate={{ opacity: isActive ? 1 : 0.2 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.5, ease: REVEAL_EASE }
                  }
                >
                  <p
                    className="text-xs font-medium uppercase"
                    style={{
                      letterSpacing: '0.08em',
                      color: '#c9a96e',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {step.number} — {step.label}
                  </p>
                  <h3
                    className="mt-4 text-3xl font-bold md:text-4xl"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: '#e8e4dc',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.headline}
                  </h3>
                  <p
                    className="mt-4 text-base leading-relaxed md:text-lg"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#8a8580',
                      maxWidth: 420,
                      lineHeight: 1.7,
                    }}
                  >
                    {step.body}
                  </p>
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Right column — sticky phone mockup */}
        <div className="relative">
          <div
            className="flex items-center justify-center"
            style={{
              position: 'sticky',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <PhoneMockup
              activeIndex={activeIndex}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="relative mx-auto max-w-7xl space-y-16 px-6 pb-20 md:hidden">
        {STEPS.map((step, i) => (
          <div key={step.number} className="space-y-8">
            <div>
              <p
                className="text-xs font-medium uppercase"
                style={{
                  letterSpacing: '0.08em',
                  color: '#c9a96e',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {step.number} — {step.label}
              </p>
              <h3
                className="mt-4 text-3xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: '#e8e4dc',
                  letterSpacing: '-0.02em',
                }}
              >
                {step.headline}
              </h3>
              <p
                className="mt-4 text-base leading-relaxed"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#8a8580',
                  maxWidth: 420,
                  lineHeight: 1.7,
                }}
              >
                {step.body}
              </p>
            </div>
            <PhoneMockup activeIndex={i} prefersReducedMotion={prefersReducedMotion} />
          </div>
        ))}
      </div>
    </section>
  )
}
