'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const HERO_WORDS = [
  'Guests',
  'have',
  'already',
  'changed.',
  'Most',
  'hotels',
  "haven\u2019t.",
]

const GAP_STATS: {
  end: number
  decimals: number
  suffix: string
  prefix: string
  label: string
}[] = [
  {
    end: 57,
    decimals: 0,
    suffix: '%',
    prefix: '',
    label:
      'of hotel guests say local recommendations from the hotel feel generic or unhelpful',
  },
  {
    end: 3.2,
    decimals: 1,
    suffix: '×',
    prefix: '',
    label:
      'more likely to rate their stay excellent if they discovered something local during the visit',
  },
  {
    end: 38,
    decimals: 0,
    suffix: '',
    prefix: '€',
    label:
      'average additional spend per guest when an activity or experience is recommended during the stay',
  },
]

const EDITORIAL_ROWS = [
  {
    tag: 'Discovery',
    heading: 'Guests discover your city, through your brand',
    body: 'Stayscape replaces generic Google searches and static PDFs with a curated, hotel-branded local discovery feed. Every recommendation reflects the character of your property — not a travel aggregator.',
    visual: 'discover',
  },
  {
    tag: 'Itinerary',
    heading: 'Their day, planned inside your experience',
    body: 'Guests build a personal itinerary from your curated content. They feel guided, not overwhelmed. They spend less time on TripAdvisor and more time engaged with what your hotel recommends.',
    visual: 'itinerary',
  },
  {
    tag: 'Data & Insight',
    heading: 'You learn what your guests actually want',
    body: 'Every interaction — what guests browse, save, add, and act on — becomes insight your team can use. Better curation, better recommendations, stronger repeat experience.',
    visual: 'data',
  },
]

const BENEFIT_CARDS = [
  {
    heading: 'A branded local experience',
    body: "Your guests discover the city through your hotel\u2019s voice, not through Google.",
  },
  {
    heading: 'Higher in-stay engagement',
    body: 'Guests who plan activities are more present, more satisfied, and more likely to return.',
  },
  {
    heading: 'Additional revenue per stay',
    body: 'Guided guests spend more — on local partners, activities, and curated experiences you recommend.',
  },
  {
    heading: 'Reduced front-desk load',
    body: 'Common guest questions about local activities and transport are answered before they are asked.',
  },
  {
    heading: 'Real behavioural data',
    body: 'You see what guests are interested in, not just what they complained about after checkout.',
  },
  {
    heading: 'A pilot with no heavy lifting',
    body: 'We handle setup, content, and curation. Your team does not need to manage anything new.',
  },
]

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useCountUpSimple({
  end,
  decimals = 0,
  suffix = '',
  duration = 1.8,
}: {
  end: number
  decimals?: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const durationMs = prefersReducedMotion ? 0 : duration * 1000
    let startTime: number | null = null
    let frameId: number

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = durationMs === 0 ? 1 : Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * end)
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [started, end, duration, prefersReducedMotion])

  const formatted = (prefersReducedMotion && started ? end : value).toFixed(decimals) + suffix

  return { ref, formatted }
}

function useIntersectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

/* ------------------------------------------------------------------ */
/*  Visual Components (device mockups, data art)                       */
/* ------------------------------------------------------------------ */

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 280 }}>
      {/* Warm glow */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.08) 0%, transparent 70%)',
          transform: 'scale(1.5)',
        }}
      />
      {/* Device frame */}
      <div
        style={{
          background: '#1a1917',
          borderRadius: 32,
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            background: '#0f0e0d',
            borderRadius: 22,
            overflow: 'hidden',
            aspectRatio: '9/16',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function DiscoverVisual() {
  return (
    <PhoneMockup>
      <div className="flex h-full flex-col" style={{ padding: 16, gap: 12 }}>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span style={{ color: '#e8e4dc', fontSize: 14, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Discover</span>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(201,169,110,0.15)' }} />
        </div>
        {/* Search */}
        <div style={{ background: '#1a1917', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ color: '#8a8580', fontSize: 11 }}>Search local experiences…</span>
        </div>
        {/* Cards */}
        {['Rooftop Dining', 'Wine Tasting', 'Old Town Walk'].map((label, i) => (
          <div key={label} style={{
            background: '#171613',
            borderRadius: 10,
            padding: 12,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ background: `rgba(201,169,110,${0.06 + i * 0.03})`, borderRadius: 6, height: 60, marginBottom: 8 }} />
            <span style={{ color: '#e8e4dc', fontSize: 12, fontWeight: 500 }}>{label}</span>
            <p style={{ color: '#8a8580', fontSize: 10, marginTop: 2 }}>Curated by your hotel</p>
          </div>
        ))}
      </div>
    </PhoneMockup>
  )
}

function ItineraryVisual() {
  return (
    <PhoneMockup>
      <div className="flex h-full flex-col" style={{ padding: 16, gap: 8 }}>
        <span style={{ color: '#e8e4dc', fontSize: 14, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Today&apos;s Plan</span>
        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
          {[
            { time: '09:00', label: 'Breakfast at Terrazza', active: true },
            { time: '11:00', label: 'Walking Tour — Old Quarter', active: true },
            { time: '13:30', label: 'Lunch — Chef\'s Choice', active: false },
            { time: '15:00', label: 'Wine Cellar Visit', active: false },
            { time: '19:00', label: 'Sunset Dinner Cruise', active: false },
          ].map((item, i) => (
            <div key={i} className="flex" style={{ gap: 12, minHeight: 44 }}>
              {/* Timeline line */}
              <div className="flex flex-col items-center" style={{ width: 20 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: item.active ? '#c9a96e' : '#3a3835',
                  marginTop: 4,
                  flexShrink: 0,
                }} />
                {i < 4 && <div style={{ width: 1, flexGrow: 1, background: '#2a2825' }} />}
              </div>
              <div style={{ paddingBottom: 12 }}>
                <span style={{ color: '#8a8580', fontSize: 10 }}>{item.time}</span>
                <p style={{ color: '#e8e4dc', fontSize: 12, marginTop: 1 }}>{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneMockup>
  )
}

function DataVisual() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 360 }}>
      {/* Warm glow */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.06) 0%, transparent 70%)',
          transform: 'scale(1.3)',
        }}
      />
      <div style={{
        background: '#1a1917',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ color: '#8a8580', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Guest Interest Map</span>
        {/* Abstract data visualization */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {[65, 40, 80, 55, 90, 35, 72, 48, 85, 60, 45, 75].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                background: `linear-gradient(to top, rgba(201,169,110,${0.15 + (h / 100) * 0.4}), rgba(201,169,110,0.05))`,
                borderRadius: '3px 3px 0 0',
              }}
            />
          ))}
        </div>
        {/* Labels */}
        <div className="flex justify-between" style={{ marginTop: 12 }}>
          <span style={{ color: '#8a8580', fontSize: 10 }}>Dining</span>
          <span style={{ color: '#8a8580', fontSize: 10 }}>Culture</span>
          <span style={{ color: '#8a8580', fontSize: 10 }}>Nature</span>
        </div>
        {/* Stat row */}
        <div className="flex justify-between" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Interests tracked', value: '1,247' },
            { label: 'Top category', value: 'Dining' },
            { label: 'Save rate', value: '34%' },
          ].map((stat) => (
            <div key={stat.label}>
              <span style={{ color: '#c9a96e', fontSize: 16, fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif" }}>{stat.value}</span>
              <p style={{ color: '#8a8580', fontSize: 9, marginTop: 2 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section Components                                                 */
/* ------------------------------------------------------------------ */

/** Section 1 — Hero */
function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="relative flex min-h-screen w-full flex-col justify-center" style={{ background: '#0f0e0d' }}>
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-12 md:px-20 lg:px-28">
        {/* Headline — word-by-word staggered clip-path reveal */}
        <h1
          className="flex flex-wrap gap-x-[0.35em]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#e8e4dc',
          }}
        >
          {HERO_WORDS.map((word, i) => (
            <motion.span
              key={i}
              initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 0.8, ease: REVEAL_EASE, delay: i * 0.08 }
              }
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Supporting line */}
        <motion.p
          className="mt-6"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            color: '#8a8580',
            lineHeight: 1.6,
            maxWidth: '72ch',
          }}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.7, ease: REVEAL_EASE, delay: 0.8 }
          }
        >
          The gap between what guests expect and what hotels deliver is a
          measurable problem — and a solvable one.
        </motion.p>
      </div>
    </section>
  )
}

/** Section 2 — The Problem (oversized stat row) */
function ProblemSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="w-full"
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {/* Section label */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#c9a96e',
            marginBottom: 48,
          }}
        >
          THE GAP
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-12">
          {GAP_STATS.map((stat, i) => (
            <StatBlock key={i} {...stat} index={i} reducedMotion={!!prefersReducedMotion} />
          ))}
        </div>

        {/* Sources */}
        <p
          className="mt-20"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: '#6b6560',
            lineHeight: 1.5,
          }}
        >
          Sources: Oracle Hospitality Report 2024, EHL Hospitality Insights, Skift Research
        </p>
      </div>
    </section>
  )
}

function StatBlock({
  end,
  decimals,
  suffix,
  prefix,
  label,
  index,
  reducedMotion,
}: {
  end: number
  decimals: number
  suffix: string
  prefix: string
  label: string
  index: number
  reducedMotion: boolean
}) {
  const { ref, formatted } = useCountUpSimple({ end, decimals, suffix, duration: 1.8 })
  const { ref: wrapRef, visible } = useIntersectionReveal()

  return (
    <div
      ref={wrapRef}
      style={{
        clipPath: reducedMotion || visible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
        transition: reducedMotion
          ? 'none'
          : `clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
      }}
    >
      <span
        ref={ref}
        className="block"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: 'clamp(3.5rem, 6vw, 5.5rem)',
          color: '#c9a96e',
          lineHeight: 1.1,
        }}
      >
        {prefix}
        {formatted}
      </span>
      <p
        className="mt-4"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: '#8a8580',
          lineHeight: 1.6,
          maxWidth: 400,
        }}
      >
        {label}
      </p>
    </div>
  )
}

/** Section 3 — How It Works (alternating editorial rows) */
function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion()

  const visuals: Record<string, React.ReactNode> = {
    discover: <DiscoverVisual />,
    itinerary: <ItineraryVisual />,
    data: <DataVisual />,
  }

  return (
    <section
      className="w-full"
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {/* Section label */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#c9a96e',
            marginBottom: 64,
          }}
        >
          HOW IT WORKS FOR YOUR PROPERTY
        </p>

        <div className="flex flex-col" style={{ gap: 80 }}>
          {EDITORIAL_ROWS.map((row, i) => (
            <EditorialRow
              key={row.tag}
              {...row}
              index={i}
              visual={visuals[row.visual]}
              reducedMotion={!!prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function EditorialRow({
  tag,
  heading,
  body,
  visual,
  index,
  reducedMotion,
}: {
  tag: string
  heading: string
  body: string
  visual: React.ReactNode
  index: number
  reducedMotion: boolean
}) {
  const { ref, visible } = useIntersectionReveal(0.1)
  const isEven = index % 2 === 0

  // On desktop: alternate image left/right. On mobile: text first, visual second.
  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16`}
    >
      {/* Text — always first on mobile; on desktop, order alternates */}
      <div className={isEven ? 'md:order-1' : 'md:order-2'}>
        <div
          style={{
            clipPath: reducedMotion || visible
              ? 'inset(0 0 0 0)'
              : isEven
                ? 'inset(0 100% 0 0)'
                : 'inset(0 0 0 100%)',
            opacity: reducedMotion || visible ? 1 : 0,
            transition: reducedMotion
              ? 'none'
              : 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#c9a96e',
              marginBottom: 16,
            }}
          >
            {tag}
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 700,
              color: '#e8e4dc',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              marginBottom: 16,
            }}
          >
            {heading}
          </h3>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: '#8a8580',
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            {body}
          </p>
        </div>
      </div>

      {/* Visual — second on mobile; on desktop, order alternates */}
      <div className={isEven ? 'md:order-2' : 'md:order-1'}>
        <div
          style={{
            clipPath: reducedMotion || visible
              ? 'inset(0 0 0 0)'
              : isEven
                ? 'inset(0 0 0 100%)'
                : 'inset(0 100% 0 0)',
            opacity: reducedMotion || visible ? 1 : 0,
            transition: reducedMotion
              ? 'none'
              : 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          }}
        >
          {visual}
        </div>
      </div>
    </div>
  )
}

/** Section 4 — Proof / Social evidence */
function ProofSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="w-full"
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {/* Section label */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#c9a96e',
            marginBottom: 48,
          }}
        >
          WHAT THE INDUSTRY IS SAYING
        </p>

        {/* Large quote */}
        <QuoteCard
          quote={`\u201cGuests do not need more options. They need better guidance \u2014 and they expect that guidance to come from the hotel, not from an algorithm.\u201d`}
          attribution="EHL Hospitality Insights, 2024"
          large
          delay={0}
          reducedMotion={!!prefersReducedMotion}
        />

        {/* Two smaller quotes */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <QuoteCard
            quote={`\u201cProperties that actively guide the in-destination experience see up to 18% higher guest satisfaction scores and meaningfully stronger repeat intent.\u201d`}
            attribution="Skift Research, Guest Experience Report"
            delay={0.1}
            reducedMotion={!!prefersReducedMotion}
          />
          <QuoteCard
            quote={`\u201cThe hotels winning on experience today are not spending more \u2014 they are removing friction between the guest and what they want to do next.\u201d`}
            attribution="Oracle Hospitality, The Connected Traveller"
            delay={0.2}
            reducedMotion={!!prefersReducedMotion}
          />
        </div>
      </div>
    </section>
  )
}

function QuoteCard({
  quote,
  attribution,
  large,
  delay,
  reducedMotion,
}: {
  quote: string
  attribution: string
  large?: boolean
  delay: number
  reducedMotion: boolean
}) {
  const { ref, visible } = useIntersectionReveal(0.15)

  return (
    <div
      ref={ref}
      style={{
        background: '#171613',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: large ? '40px 32px' : '32px 24px',
        opacity: reducedMotion || visible ? 1 : 0,
        transform: reducedMotion || visible ? 'scale(1)' : 'scale(0.97)',
        transition: reducedMotion
          ? 'none'
          : `opacity 0.3s ease-out ${delay}s, transform 0.3s ease-out ${delay}s`,
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: 'italic',
          fontSize: large ? 'clamp(1.25rem, 2vw, 1.5rem)' : 'clamp(1rem, 1.5vw, 1.125rem)',
          color: '#e8e4dc',
          lineHeight: 1.5,
        }}
      >
        {quote}
      </p>
      <p
        className="mt-4"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#8a8580',
        }}
      >
        — {attribution}
      </p>
    </div>
  )
}

/** Section 5 — What you get as a hotel */
function BenefitsSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="w-full"
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {/* Section label */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#c9a96e',
            marginBottom: 48,
          }}
        >
          WHAT THIS MEANS FOR YOUR PROPERTY
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {BENEFIT_CARDS.map((card, i) => (
            <BenefitCard key={i} {...card} index={i} reducedMotion={!!prefersReducedMotion} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BenefitCard({
  heading,
  body,
  index,
  reducedMotion,
}: {
  heading: string
  body: string
  index: number
  reducedMotion: boolean
}) {
  const { ref, visible } = useIntersectionReveal(0.1)

  return (
    <div
      ref={ref}
      style={{
        background: '#171613',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 24px',
        clipPath: reducedMotion || visible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
        transition: reducedMotion
          ? 'none'
          : `clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s`,
      }}
    >
      <h4
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: '#e8e4dc',
          marginBottom: 8,
        }}
      >
        {heading}
      </h4>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: '#8a8580',
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
    </div>
  )
}

/** Section 6 — Final CTA */
function FinalCTASection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="relative flex min-h-[70vh] items-center justify-center"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80)',
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(15,14,13,0.95), rgba(15,14,13,0.7))',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 text-center">
        <motion.h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
            fontWeight: 700,
            color: '#e8e4dc',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
          initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0 0 0)' }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.8, ease: REVEAL_EASE }
          }
        >
          Ready to see if Stayscape fits your property?
        </motion.h2>

        <motion.p
          className="mx-auto mt-6"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 17,
            color: '#8a8580',
            lineHeight: 1.6,
            maxWidth: 520,
          }}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.6, ease: REVEAL_EASE, delay: 0.3 }
          }
        >
          We&apos;re currently selecting a small number of European hotel partners for an early pilot. No integration required. We handle the setup.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
          whileInView={{ clipPath: 'inset(0 0 0 0)' }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.8, ease: REVEAL_EASE, delay: 0.15 }
          }
        >
          <a
            href="mailto:hello@stayscape.app"
            className="inline-block text-sm font-semibold"
            style={{
              background: '#c9a96e',
              color: '#0f0e0d',
              borderRadius: 4,
              padding: '14px 32px',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            Get in touch
          </a>
          <a
            href="https://stayscape-kohl.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm"
            style={{
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#e8e4dc',
              borderRadius: 4,
              padding: '14px 32px',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            See the live app
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WhyItWorksPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0f0e0d' }}>
      {/* Back nav */}
      <div
        className="mx-auto max-w-7xl px-6 pt-6 sm:px-12 md:px-20 lg:px-28"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors duration-200"
          style={{
            color: '#8a8580',
            fontFamily: "'DM Sans', sans-serif",
            minWidth: 44,
            minHeight: 44,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
        >
          ← Back to home
        </Link>
      </div>

      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <ProofSection />
        <BenefitsSection />
        <FinalCTASection />
      </main>
    </div>
  )
}
