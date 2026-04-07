'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useCountUp({
  end,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.8,
}: {
  end: number
  decimals?: number
  suffix?: string
  prefix?: string
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

  const formatted = prefix + (prefersReducedMotion && started ? end : value).toFixed(decimals) + suffix

  return { ref, formatted }
}

function useInView(threshold = 0.15) {
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

function useSequentialReveal(count: number, interval = 200) {
  const { ref, visible } = useInView(0.1)
  const [revealed, setRevealed] = useState<boolean[]>(new Array(count).fill(false))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) return
    let idx = 0
    const tick = () => {
      setRevealed((prev) => {
        const next = [...prev]
        next[idx] = true
        return next
      })
      idx++
      if (idx < count) {
        timerRef.current = setTimeout(tick, interval)
      }
    }
    tick()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, count, interval])

  return { ref, revealed }
}

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: string }) {
  return (
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
      {children}
    </p>
  )
}

function SectionWrap({
  children,
  id,
  className = '',
}: {
  children: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <section
      id={id}
      className={`w-full ${className}`}
      style={{
        background: '#0f0e0d',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-12 md:px-20 md:py-32 lg:px-28">
        {children}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 1 — Headline Frame                                         */
/* ------------------------------------------------------------------ */

const HEADLINE_LINE1 = ['Travel', 'is', 'growing', '—', 'but', 'the', 'system', 'is']
const HEADLINE_BROKEN = 'broken.'
const HEADLINE_LINE2 = ['Startups', 'fixing', 'discovery', '+', 'experience', 'win.']

function HeadlineFrame() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className="relative flex min-h-screen w-full flex-col justify-center"
      style={{ background: '#0f0e0d' }}
    >
      {/* Subtle broken-path line graphic */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          viewBox="0 0 1200 600"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '100%', maxWidth: 1200, opacity: 0.04 }}
          fill="none"
        >
          <motion.path
            d="M0 300 Q200 300 350 250 L400 250 M450 350 Q600 350 700 300 Q900 200 1200 300"
            stroke="#c9a96e"
            strokeWidth="1.5"
            initial={prefersReducedMotion ? {} : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 2.5, ease: 'easeInOut', delay: 1.2 }
            }
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-12 md:px-20 lg:px-28">
        {/* Line 1 */}
        <h1
          className="flex flex-wrap gap-x-[0.35em]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#e8e4dc',
          }}
        >
          {HEADLINE_LINE1.map((word, i) => (
            <motion.span
              key={`l1-${i}`}
              initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 0.8, ease: REVEAL_EASE, delay: i * 0.06 }
              }
              style={{ display: 'inline-block' }}
            >
              {word}
            </motion.span>
          ))}

          {/* "broken." — visual contrast treatment */}
          <motion.span
            initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 0)' }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.9, ease: REVEAL_EASE, delay: HEADLINE_LINE1.length * 0.06 }
            }
            style={{
              display: 'inline-block',
              color: '#c9a96e',
              fontStyle: 'italic',
              position: 'relative',
            }}
          >
            {HEADLINE_BROKEN}
            <motion.span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '55%',
                height: 2,
                background: 'rgba(201,169,110,0.35)',
              }}
              initial={prefersReducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 0.6, ease: REVEAL_EASE, delay: 1.0 }
              }
            />
          </motion.span>
        </h1>

        {/* Line 2 — resolution */}
        <h2
          className="mt-2 flex flex-wrap gap-x-[0.35em]"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#e8e4dc',
          }}
        >
          {HEADLINE_LINE2.map((word, i) => {
            const isHighlight = word === 'discovery' || word === 'experience' || word === 'win.'
            return (
              <motion.span
                key={`l2-${i}`}
                initial={prefersReducedMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
                animate={{ clipPath: 'inset(0 0 0 0)' }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: 0.8,
                        ease: REVEAL_EASE,
                        delay: (HEADLINE_LINE1.length + 1) * 0.06 + i * 0.06,
                      }
                }
                style={{
                  display: 'inline-block',
                  color: isHighlight ? '#c9a96e' : undefined,
                }}
              >
                {word}
              </motion.span>
            )
          })}
        </h2>

        {/* Support line */}
        <motion.p
          className="mt-8"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            color: '#8a8580',
            lineHeight: 1.6,
            maxWidth: '64ch',
          }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.7, ease: REVEAL_EASE, delay: 1.3 }
          }
        >
          Demand is rising, but the hotel journey is fragmented, invisible, and leaking revenue.
        </motion.p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 2 — The Problem Stayscape Solves                           */
/* ------------------------------------------------------------------ */

const DISCOVERY_CHANNELS = [
  { label: 'TikTok' },
  { label: 'AI Search' },
  { label: 'Social' },
  { label: 'OTA' },
  { label: 'Maps' },
  { label: 'Hotel Site' },
]

const OUTCOMES = [
  { label: 'Invisible hotels' },
  { label: 'Overwhelmed users' },
  { label: 'Low conversion' },
]

const JOURNEY_STEPS = [
  { label: 'Social', dropoff: null },
  { label: 'OTA', dropoff: '34% drop-off' },
  { label: 'Website', dropoff: 'Bad UX' },
  { label: 'Maps', dropoff: 'Lost revenue' },
]

function ProblemSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref: channelRef, revealed: channelRevealed } = useSequentialReveal(
    DISCOVERY_CHANNELS.length,
    250,
  )
  const { ref: outcomeRef, revealed: outcomeRevealed } = useSequentialReveal(
    OUTCOMES.length,
    300,
  )
  const { ref: journeyRef, revealed: journeyRevealed } = useSequentialReveal(
    JOURNEY_STEPS.length,
    350,
  )

  return (
    <SectionWrap>
      <SectionLabel>THE PROBLEM</SectionLabel>

      {/* --- Fragmented Discovery Map --- */}
      <div className="mb-20">
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            fontWeight: 700,
            color: '#e8e4dc',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: 12,
          }}
        >
          Discovery is no longer one channel.
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            color: '#8a8580',
            lineHeight: 1.6,
            maxWidth: '52ch',
            marginBottom: 40,
          }}
        >
          Guests find hotels across six or more fragmented surfaces. None of
          them talk to each other. Small hotels become invisible.
        </p>

        {/* Discovery channel pills */}
        <div ref={channelRef} className="relative" style={{ minHeight: 200 }}>
          {/* Source channels — top row with scattered positioning */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {DISCOVERY_CHANNELS.map((ch, i) => (
              <div
                key={ch.label}
                style={{
                  background: '#1a1917',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '10px 18px',
                  opacity: channelRevealed[i] ? 1 : 0,
                  transform: channelRevealed[i]
                    ? 'translateY(0) rotate(0deg)'
                    : `translateY(-20px) rotate(${(i % 2 === 0 ? -1 : 1) * 4}deg)`,
                  transition: prefersReducedMotion
                    ? 'none'
                    : `opacity 0.5s ease-out, transform 0.5s ease-out`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#e8e4dc',
                  }}
                >
                  {ch.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scattered connection lines — SVG */}
          <div className="my-6 flex justify-center" aria-hidden="true">
            <svg width="100%" height="60" viewBox="0 0 600 60" style={{ maxWidth: 600 }}>
              {[0, 100, 200, 300, 400, 500].map((x, i) => (
                <motion.line
                  key={i}
                  x1={x + 30}
                  y1={0}
                  x2={x + 50 + (i % 2 === 0 ? 40 : -30)}
                  y2={60}
                  stroke="rgba(201,169,110,0.12)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  initial={prefersReducedMotion ? {} : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : { duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }
                  }
                />
              ))}
            </svg>
          </div>

          {/* Outcome pills — bottom */}
          <div ref={outcomeRef} className="flex flex-wrap gap-3 justify-center md:justify-end">
            {OUTCOMES.map((o, i) => (
              <div
                key={o.label}
                style={{
                  background: 'rgba(180,80,60,0.08)',
                  border: '1px solid rgba(180,80,60,0.15)',
                  borderRadius: 6,
                  padding: '10px 18px',
                  opacity: outcomeRevealed[i] ? 1 : 0,
                  transform: outcomeRevealed[i] ? 'translateY(0)' : 'translateY(16px)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'opacity 0.5s ease-out, transform 0.5s ease-out',
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#c47a6a',
                  }}
                >
                  {o.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Broken Booking Journey --- */}
      <div>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
            fontWeight: 700,
            color: '#e8e4dc',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: 32,
          }}
        >
          The booking journey leaks at every step.
        </h3>

        <div ref={journeyRef} className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
          {JOURNEY_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start sm:flex-1">
              {/* Step node */}
              <div
                className="flex flex-col items-center"
                style={{
                  opacity: journeyRevealed[i] ? 1 : 0,
                  transform: journeyRevealed[i] ? 'scale(1)' : 'scale(0.8)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'opacity 0.4s ease-out, transform 0.4s ease-out',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: journeyRevealed[i]
                      ? i === 0
                        ? 'rgba(201,169,110,0.12)'
                        : 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.4s ease-out',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: i === 0 ? '#c9a96e' : '#6b6560',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#e8e4dc',
                    marginTop: 8,
                  }}
                >
                  {step.label}
                </span>
                {step.dropoff && (
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: '#c47a6a',
                      marginTop: 4,
                      opacity: journeyRevealed[i] ? 1 : 0,
                      transition: prefersReducedMotion ? 'none' : 'opacity 0.6s ease-out 0.3s',
                    }}
                  >
                    {step.dropoff}
                  </span>
                )}
              </div>

              {/* Arrow connector */}
              {i < JOURNEY_STEPS.length - 1 && (
                <div
                  className="hidden sm:flex items-center justify-center"
                  style={{
                    width: 40,
                    marginTop: 22,
                    opacity: journeyRevealed[i + 1] ? 1 : 0,
                    transition: prefersReducedMotion ? 'none' : 'opacity 0.4s ease-out',
                  }}
                  aria-hidden="true"
                >
                  <svg width="24" height="8" viewBox="0 0 24 8" fill="none">
                    <path
                      d="M0 4H20M20 4L16 1M20 4L16 7"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <p
          className="mt-12"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            color: '#8a8580',
            lineHeight: 1.6,
            maxWidth: '54ch',
          }}
        >
          This fragmented path is exactly the problem Stayscape is built to
          remove.
        </p>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 3 — Where Investment Is Going in 2026                      */
/* ------------------------------------------------------------------ */

const INVESTMENT_LANES = [
  {
    title: 'AI travel + itinerary engines',
    description:
      'Automated planning, real-time recommendations, disruption handling.',
    fit: 'Adjacent',
    emphasized: false,
  },
  {
    title: 'Experience discovery platforms',
    description:
      'Real-time activities, personalised search, experience packaging.',
    fit: 'Core fit',
    emphasized: true,
  },
  {
    title: 'Travel super-layer platforms',
    description:
      'Planning, discovery, booking, reduced friction end-to-end.',
    fit: 'Core fit',
    emphasized: true,
  },
  {
    title: 'Guest personalisation systems',
    description:
      'Targeting, upselling, data-driven guest experiences.',
    fit: 'Adjacent',
    emphasized: false,
  },
]

function InvestmentSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref, revealed } = useSequentialReveal(INVESTMENT_LANES.length, 300)

  return (
    <SectionWrap>
      <SectionLabel>WHERE INVESTMENT IS GOING — 2026</SectionLabel>

      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 700,
          color: '#e8e4dc',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginBottom: 40,
          maxWidth: '40ch',
        }}
      >
        Four lanes are attracting capital. Stayscape sits at the
        intersection of two.
      </h3>

      <div ref={ref} className="flex flex-col" style={{ gap: 0 }}>
        {INVESTMENT_LANES.map((lane, i) => (
          <div
            key={lane.title}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 24,
              padding: '24px 0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              opacity: revealed[i] ? 1 : 0,
              transform: revealed[i] ? 'translateX(0)' : 'translateX(-24px)',
              transition: prefersReducedMotion
                ? 'none'
                : 'opacity 0.5s ease-out, transform 0.5s ease-out',
            }}
          >
            <div>
              <h4
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: lane.emphasized ? 18 : 16,
                  fontWeight: 700,
                  color: lane.emphasized ? '#e8e4dc' : '#8a8580',
                  marginBottom: 4,
                }}
              >
                {lane.title}
              </h4>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#6b6560',
                  lineHeight: 1.5,
                }}
              >
                {lane.description}
              </p>
            </div>

            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: lane.emphasized ? '#c9a96e' : '#6b6560',
                background: lane.emphasized
                  ? 'rgba(201,169,110,0.1)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${lane.emphasized ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 4,
                padding: '6px 14px',
                whiteSpace: 'nowrap',
              }}
            >
              {lane.fit}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 24,
          marginTop: 8,
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: '#6b6560',
          }}
        >
          Framework based on publicly reported travel-tech funding trends,
          2024–2026.
        </p>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 4 — Massive Opportunity                                    */
/* ------------------------------------------------------------------ */

function OpportunitySection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref: statRef, formatted: expectFormatted } = useCountUp({
    end: 91,
    suffix: '%',
    duration: 2,
  })
  const { ref: statRef2, formatted: deliverFormatted } = useCountUp({
    end: 23,
    suffix: '%',
    duration: 2,
  })
  const { ref: wrapRef, visible } = useInView(0.1)

  return (
    <SectionWrap>
      <SectionLabel>THE OPPORTUNITY GAP</SectionLabel>

      {/* 91% vs 23% — split stat comparison */}
      <div
        ref={wrapRef}
        className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-8"
        style={{ marginBottom: 48 }}
      >
        {/* Expectation */}
        <div
          style={{
            opacity: visible || prefersReducedMotion ? 1 : 0,
            transform: visible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
            transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out',
          }}
        >
          <span
            ref={statRef}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(4rem, 8vw, 7rem)',
              fontWeight: 700,
              color: '#c9a96e',
              lineHeight: 1,
              display: 'block',
            }}
          >
            {expectFormatted}
          </span>
          <p
            className="mt-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: '#e8e4dc',
              fontWeight: 600,
            }}
          >
            expect personalisation
          </p>
          {/* Bar visual */}
          <div
            style={{
              marginTop: 16,
              height: 6,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: '#c9a96e',
                borderRadius: 3,
              }}
              initial={prefersReducedMotion ? { width: '91%' } : { width: '0%' }}
              whileInView={{ width: '91%' }}
              viewport={{ once: true }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 1.6, ease: REVEAL_EASE, delay: 0.3 }
              }
            />
          </div>
        </div>

        {/* Delivery */}
        <div
          style={{
            opacity: visible || prefersReducedMotion ? 1 : 0,
            transform: visible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
            transition: prefersReducedMotion ? 'none' : 'all 0.6s ease-out 0.2s',
          }}
        >
          <span
            ref={statRef2}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(4rem, 8vw, 7rem)',
              fontWeight: 700,
              color: '#4a4540',
              lineHeight: 1,
              display: 'block',
            }}
          >
            {deliverFormatted}
          </span>
          <p
            className="mt-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: '#8a8580',
              fontWeight: 600,
            }}
          >
            feel they get it
          </p>
          {/* Bar visual */}
          <div
            style={{
              marginTop: 16,
              height: 6,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: '#4a4540',
                borderRadius: 3,
              }}
              initial={prefersReducedMotion ? { width: '23%' } : { width: '0%' }}
              whileInView={{ width: '23%' }}
              viewport={{ once: true }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 1.6, ease: REVEAL_EASE, delay: 0.5 }
              }
            />
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          color: '#8a8580',
          lineHeight: 1.6,
          maxWidth: '56ch',
          marginBottom: 56,
        }}
      >
        Hotels know guests expect relevance, but most still operate with
        siloed, unusable data.
      </p>

      {/* OTA Dependence — ledger comparison */}
      <div>
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            fontWeight: 700,
            color: '#e8e4dc',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            marginBottom: 24,
          }}
        >
          OTA dependence is unsustainable.
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              metric: 'Commission',
              problem: '15–25% per booking',
              icon: '↗',
            },
            {
              metric: 'Guest data',
              problem: 'Owned by the OTA',
              icon: '✕',
            },
            {
              metric: 'Demand control',
              problem: 'Algorithmically gated',
              icon: '⊘',
            },
          ].map((item) => (
            <OTACard key={item.metric} {...item} />
          ))}
        </div>
      </div>
    </SectionWrap>
  )
}

function OTACard({
  metric,
  problem,
  icon,
}: {
  metric: string
  problem: string
  icon: string
}) {
  const { ref, visible } = useInView(0.1)

  return (
    <div
      ref={ref}
      style={{
        background: '#171613',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '24px 20px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}
    >
      <span
        style={{
          fontSize: 20,
          display: 'block',
          marginBottom: 12,
          opacity: 0.5,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <h4
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: '#e8e4dc',
          marginBottom: 4,
        }}
      >
        {metric}
      </h4>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: '#c47a6a',
          lineHeight: 1.4,
        }}
      >
        {problem}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 5 — Why Corporates Will Fund This                          */
/* ------------------------------------------------------------------ */

const PRESSURES = [
  'Rising costs & labour shortages',
  'Airbnb competition',
  'Flat revenue per guest',
]

const UNLOCKS = [
  'Upselling & experiences',
  'Guest personalisation',
  'New monetisation per stay',
]

function CorporateSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref: pressRef, revealed: pressRevealed } = useSequentialReveal(
    PRESSURES.length,
    300,
  )
  const { ref: unlockRef, revealed: unlockRevealed } = useSequentialReveal(
    UNLOCKS.length,
    300,
  )

  return (
    <SectionWrap>
      <SectionLabel>WHY CORPORATES FUND THIS</SectionLabel>

      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 700,
          color: '#e8e4dc',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginBottom: 40,
          maxWidth: '42ch',
        }}
      >
        Hotel groups do not fund this because it is interesting. They fund
        it because they need new profit and control levers.
      </h3>

      {/* Pressure → Value transformation diagram */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr]">
        {/* Left — pressures */}
        <div ref={pressRef}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#c47a6a',
              marginBottom: 20,
            }}
          >
            Market pressure
          </p>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {PRESSURES.map((p, i) => (
              <div
                key={p}
                style={{
                  background: 'rgba(180,80,60,0.06)',
                  border: '1px solid rgba(180,80,60,0.12)',
                  borderRadius: 6,
                  padding: '14px 18px',
                  opacity: pressRevealed[i] ? 1 : 0,
                  transform: pressRevealed[i]
                    ? 'translateX(0)'
                    : 'translateX(-16px)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'opacity 0.4s ease-out, transform 0.4s ease-out',
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#c47a6a',
                    fontWeight: 600,
                  }}
                >
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center — directional arrows */}
        <div
          className="hidden md:flex flex-col items-center justify-center"
          aria-hidden="true"
          style={{ minWidth: 60 }}
        >
          <motion.svg
            width="48"
            height="120"
            viewBox="0 0 48 120"
            fill="none"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.6, delay: 0.8 }
            }
          >
            <path
              d="M24 0 V100 M24 100 L16 88 M24 100 L32 88"
              stroke="rgba(201,169,110,0.3)"
              strokeWidth="1.5"
              transform="rotate(90 24 60) translate(-36, 0)"
            />
            <text
              x="24"
              y="65"
              textAnchor="middle"
              fill="#6b6560"
              fontSize="9"
              fontFamily="'DM Sans', sans-serif"
              fontWeight="600"
            >
              →
            </text>
          </motion.svg>
        </div>

        {/* Mobile arrow */}
        <div
          className="flex md:hidden items-center justify-center"
          aria-hidden="true"
          style={{ padding: '8px 0' }}
        >
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
            <path
              d="M12 0 V24 M12 24 L6 18 M12 24 L18 18"
              stroke="rgba(201,169,110,0.3)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Right — what Stayscape unlocks */}
        <div ref={unlockRef}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#c9a96e',
              marginBottom: 20,
            }}
          >
            What Stayscape unlocks
          </p>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {UNLOCKS.map((u, i) => (
              <div
                key={u}
                style={{
                  background: 'rgba(201,169,110,0.06)',
                  border: '1px solid rgba(201,169,110,0.15)',
                  borderRadius: 6,
                  padding: '14px 18px',
                  opacity: unlockRevealed[i] ? 1 : 0,
                  transform: unlockRevealed[i]
                    ? 'translateX(0)'
                    : 'translateX(16px)',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'opacity 0.4s ease-out, transform 0.4s ease-out',
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: '#c9a96e',
                    fontWeight: 600,
                  }}
                >
                  {u}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 6 — Macro Tailwind                                         */
/* ------------------------------------------------------------------ */

function MacroSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref, visible } = useInView(0.1)

  return (
    <SectionWrap>
      <SectionLabel>MACRO TAILWIND</SectionLabel>

      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
        {/* Left — demand signal */}
        <div
          ref={ref}
          style={{
            opacity: visible || prefersReducedMotion ? 1 : 0,
            transition: prefersReducedMotion ? 'none' : 'opacity 0.6s ease-out',
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 700,
              color: '#e8e4dc',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              marginBottom: 20,
            }}
          >
            Asia&apos;s middle class is the next wave.
          </h3>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: '#8a8580',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            More travellers are entering the market every year. The demand
            is structural, not cyclical.
          </p>

          {/* Abstract demand growth lines */}
          <div
            style={{
              background: '#171613',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: 24,
            }}
          >
            <svg
              viewBox="0 0 300 120"
              fill="none"
              style={{ width: '100%' }}
              aria-label="Demand growth trend"
            >
              {/* Growth lines */}
              <motion.path
                d="M0 100 C50 95 100 80 150 60 C200 40 250 25 300 10"
                stroke="#c9a96e"
                strokeWidth="2"
                initial={prefersReducedMotion ? {} : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 1.5, ease: 'easeOut', delay: 0.3 }
                }
              />
              <motion.path
                d="M0 110 C50 105 100 95 150 85 C200 75 250 65 300 55"
                stroke="rgba(201,169,110,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                initial={prefersReducedMotion ? {} : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 1.5, ease: 'easeOut', delay: 0.6 }
                }
              />
              {/* Labels */}
              <text
                x="290"
                y="8"
                textAnchor="end"
                fill="#c9a96e"
                fontSize="9"
                fontFamily="'DM Sans', sans-serif"
                fontWeight="600"
              >
                Outbound travel
              </text>
              <text
                x="290"
                y="53"
                textAnchor="end"
                fill="rgba(201,169,110,0.5)"
                fontSize="9"
                fontFamily="'DM Sans', sans-serif"
              >
                Hospitality demand
              </text>
            </svg>
          </div>
        </div>

        {/* Right — traveller expectation card */}
        <div className="flex flex-col justify-center">
          <div
            style={{
              background: '#171613',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '32px 28px',
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#c9a96e',
                marginBottom: 20,
              }}
            >
              Modern traveller
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                  fontWeight: 700,
                  color: '#c9a96e',
                }}
              >
                Experiences
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  color: '#6b6560',
                }}
              >
                &gt;
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                  fontWeight: 400,
                  color: '#4a4540',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(255,255,255,0.1)',
                }}
              >
                rooms only
              </span>
            </div>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: '#8a8580',
                lineHeight: 1.6,
              }}
            >
              Gen Z and millennials do not compare rooms. They compare what
              they can do, see, and feel during their stay.
            </p>
          </div>
        </div>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 7 — Hidden Insight                                         */
/* ------------------------------------------------------------------ */

const INSIGHT_HIGHLIGHTS = [
  { text: 'fragmented travel data', highlighted: true },
  { text: ', ', highlighted: false },
  { text: 'user itineraries', highlighted: true },
  { text: ' and ', highlighted: false },
  { text: 'AI booking', highlighted: true },
  { text: ' to ', highlighted: false },
  { text: 'reduce friction', highlighted: true },
]

function InsightSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref, visible } = useInView(0.2)

  return (
    <SectionWrap>
      <SectionLabel>THE HIDDEN INSIGHT</SectionLabel>

      <div
        ref={ref}
        style={{
          background: '#171613',
          border: '1px solid rgba(201,169,110,0.12)',
          borderRadius: 8,
          padding: 'clamp(32px, 5vw, 56px)',
          maxWidth: 800,
          opacity: visible || prefersReducedMotion ? 1 : 0,
          transform: visible || prefersReducedMotion ? 'scale(1)' : 'scale(0.97)',
          transition: prefersReducedMotion
            ? 'none'
            : 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#8a8580',
            marginBottom: 20,
          }}
        >
          The market is effectively describing a startup like Stayscape:
        </p>

        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            fontWeight: 600,
            color: '#e8e4dc',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          &ldquo;A platform that combines{' '}
          {INSIGHT_HIGHLIGHTS.map((seg, i) =>
            seg.highlighted ? (
              <motion.span
                key={i}
                style={{
                  color: '#c9a96e',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  background: 'rgba(201,169,110,0.08)',
                  padding: '2px 4px',
                  borderRadius: 3,
                }}
                initial={prefersReducedMotion ? {} : { opacity: 0.3 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 0.5, delay: 0.6 + i * 0.15 }
                }
              >
                {seg.text}
              </motion.span>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
          .&rdquo;
        </p>

        <motion.p
          className="mt-8"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#c9a96e',
          }}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.5, delay: 1.4, ease: REVEAL_EASE }
          }
        >
          That is Stayscape — almost word for word.
        </motion.p>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 8 — Positioning Correction                                 */
/* ------------------------------------------------------------------ */

function PositioningSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref, visible } = useInView(0.15)

  return (
    <SectionWrap>
      <SectionLabel>POSITIONING CORRECTION</SectionLabel>

      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 700,
          color: '#e8e4dc',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginBottom: 40,
          maxWidth: '36ch',
        }}
      >
        This is not a travel app. It is an infrastructure layer.
      </h3>

      <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Weak framing — muted */}
        <div
          style={{
            background: '#131210',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: '32px 24px',
            opacity: visible || prefersReducedMotion ? 1 : 0,
            transform: visible || prefersReducedMotion ? 'translateX(0)' : 'translateX(-16px)',
            transition: prefersReducedMotion
              ? 'none'
              : 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#4a4540',
              marginBottom: 20,
            }}
          >
            Weak framing
          </p>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {['A travel app', 'Discovery only', 'Another booking platform'].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{ color: '#4a4540', fontSize: 14 }}
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15,
                      color: '#4a4540',
                      textDecoration: 'line-through',
                      textDecorationColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {item}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Strong framing — dominant */}
        <div
          style={{
            background: 'rgba(201,169,110,0.04)',
            border: '1px solid rgba(201,169,110,0.15)',
            borderRadius: 8,
            padding: '32px 24px',
            opacity: visible || prefersReducedMotion ? 1 : 0,
            transform: visible || prefersReducedMotion ? 'translateX(0)' : 'translateX(16px)',
            transition: prefersReducedMotion
              ? 'none'
              : 'opacity 0.5s ease-out 0.15s, transform 0.5s ease-out 0.15s',
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#c9a96e',
              marginBottom: 20,
            }}
          >
            Strong framing
          </p>

          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
              fontWeight: 700,
              color: '#e8e4dc',
              lineHeight: 1.3,
            }}
          >
            Infrastructure layer for hotel guest experience, discovery, and
            monetisation.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['Guest experience', 'Discovery', 'Monetisation'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#c9a96e',
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.18)',
                  borderRadius: 4,
                  padding: '4px 10px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionWrap>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 9 — Final Takeaway                                         */
/* ------------------------------------------------------------------ */

const FINAL_ITEMS: {
  label: string
  positive: boolean
}[] = [
  { label: 'More booking platforms', positive: false },
  { label: 'Generic travel apps', positive: false },
  { label: 'Discovery + experience layer', positive: true },
  { label: 'AI + personalisation', positive: true },
  { label: 'Helping hotels own the guest journey', positive: true },
]

function FinalSection() {
  const prefersReducedMotion = useReducedMotion()
  const { ref, revealed } = useSequentialReveal(FINAL_ITEMS.length, 250)

  return (
    <SectionWrap>
      <SectionLabel>2026 IS ABOUT</SectionLabel>

      <div ref={ref} className="flex flex-col" style={{ gap: 0, maxWidth: 640 }}>
        {FINAL_ITEMS.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 0',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              opacity: revealed[i] ? 1 : 0,
              transform: revealed[i] ? 'translateX(0)' : 'translateX(-12px)',
              transition: prefersReducedMotion
                ? 'none'
                : 'opacity 0.4s ease-out, transform 0.4s ease-out',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: item.positive ? '#c9a96e' : '#c47a6a',
                width: 32,
                textAlign: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {item.positive ? '✓' : '✕'}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: item.positive ? '#e8e4dc' : '#4a4540',
                textDecoration: item.positive ? 'none' : 'line-through',
                textDecorationColor: 'rgba(255,255,255,0.06)',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Closing statement */}
      <motion.div
        className="mt-16"
        style={{
          maxWidth: 640,
          borderTop: '1px solid rgba(201,169,110,0.15)',
          paddingTop: 32,
        }}
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 0.6, ease: REVEAL_EASE, delay: 0.3 }
        }
      >
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            fontWeight: 700,
            color: '#e8e4dc',
            lineHeight: 1.4,
          }}
        >
          Stayscape is aligned with where travel demand, hotel pressure,
          and venture attention are already moving.
        </p>
      </motion.div>

      {/* Back link */}
      <div className="mt-16">
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
    </SectionWrap>
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
        <HeadlineFrame />
        <ProblemSection />
        <InvestmentSection />
        <OpportunitySection />
        <CorporateSection />
        <MacroSection />
        <InsightSection />
        <PositioningSection />
        <FinalSection />
      </main>
    </div>
  )
}
