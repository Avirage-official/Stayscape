'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const

const ARIA_MESSAGES = [
  { role: 'user' as const,  text: 'What time is the pool open tonight?' },
  { role: 'aria' as const,  text: 'The rooftop pool is open until 10 PM. Shall I set a reminder?' },
  { role: 'user' as const,  text: 'Yes — and can you send extra towels to 412?' },
  { role: 'aria' as const,  text: 'Done. Towels on the way, reminder set. Enjoy your evening.' },
] as const

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])

  const lineVariants = {
    hidden: { clipPath: 'inset(100% 0 0 0)' },
    visible: (i: number) => ({
      clipPath: 'inset(0 0 0 0)',
      transition: {
        duration: 0.85,
        ease: REVEAL_EASE,
        delay: 0.1 + i * 0.22,
      },
    }),
  }

  const fadeIn = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, ease: REVEAL_EASE, delay },
        }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Background photo — parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: reduced ? 0 : bgY }}
      >
        <div
          className="absolute inset-0 h-[125%] w-full bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80)',
          }}
        />
      </motion.div>

      {/* Warm parchment overlay — The Hoxton effect */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'rgba(250,248,245,0.60)' }}
      />

      {/* Bottom gradient — bleeds into the page below */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[2] h-[50%]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(250,248,245,0.88) 65%, #FAF8F5 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-[3] flex min-h-screen flex-col justify-end px-6 pb-24 sm:px-8 md:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">

            {/* ── Left: Text ─────────────────────────────────────── */}
            <div className="lg:col-span-6">

              {/* Eyebrow */}
              <motion.span
                className="mb-5 inline-flex items-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em]"
                style={{
                  color: 'var(--gold)',
                  background: 'rgba(193,127,58,0.10)',
                  padding: '5px 14px',
                  border: '1px solid rgba(193,127,58,0.25)',
                }}
                {...fadeIn(0.2)}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--gold)' }}
                  aria-hidden="true"
                />
                Your stay, reimagined
              </motion.span>

              {/* Headline — clip-path line reveal */}
              <div className="mb-5 overflow-hidden">
                <motion.h1
                  className="block leading-[1.08] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2.8rem, 5.2vw, 4.8rem)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                  custom={0}
                  variants={lineVariants}
                  initial={reduced ? 'visible' : 'hidden'}
                  animate="visible"
                >
                  Less managing.
                </motion.h1>
                <motion.h1
                  className="block leading-[1.08] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(2.8rem, 5.2vw, 4.8rem)',
                    color: 'var(--gold)',
                    letterSpacing: '-0.02em',
                    fontStyle: 'italic',
                  }}
                  custom={1}
                  variants={lineVariants}
                  initial={reduced ? 'visible' : 'hidden'}
                  animate="visible"
                >
                  More living.
                </motion.h1>
              </div>

              {/* Subline */}
              <motion.p
                className="mb-8 max-w-[520px] leading-[1.75]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '17px',
                  color: 'var(--text-secondary)',
                }}
                {...fadeIn(0.85)}
              >
                The gap between a good stay and a great one is usually
                just knowing who to ask.
              </motion.p>

              {/* CTAs */}
              <motion.div
                className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
                {...fadeIn(1.05)}
              >
                <a
                  href="/login"
                  className="inline-flex h-11 items-center rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200"
                  style={{
                    background: 'var(--gold)',
                    color: '#FAF8F5',
                    padding: '0 28px',
                    boxShadow: '0 4px 16px rgba(193,127,58,0.32)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'var(--gold-soft)'
                    el.style.boxShadow = '0 6px 22px rgba(193,127,58,0.40)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'var(--gold)'
                    el.style.boxShadow = '0 4px 16px rgba(193,127,58,0.32)'
                  }}
                >
                  Sign In to Your Stay
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex h-11 items-center rounded-lg text-[13px] font-medium transition-all duration-200"
                  style={{
                    border: '1px solid rgba(193,127,58,0.35)',
                    color: 'var(--text-secondary)',
                    padding: '0 24px',
                    background: 'rgba(250,248,245,0.70)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'var(--gold)'
                    el.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'rgba(193,127,58,0.35)'
                    el.style.color = 'var(--text-secondary)'
                  }}
                >
                  How it works ↓
                </a>
              </motion.div>

              {/* Trust note */}
              <motion.p
                className="mt-5 text-[12px]"
                style={{ color: 'var(--text-muted)' }}
                {...fadeIn(1.25)}
              >
                Available at partner hotels · No app download required
              </motion.p>
            </div>

            {/* ── Right: Aria chat card ───────────────────────────── */}
            <motion.div
              className="hidden lg:col-span-5 lg:col-start-8 lg:block lg:pb-2"
              initial={
                reduced ? undefined : { opacity: 0, y: 28, scale: 0.97 }
              }
              animate={
                reduced ? undefined : { opacity: 1, y: 0, scale: 1 }
              }
              transition={
                reduced
                  ? undefined
                  : { duration: 0.8, ease: REVEAL_EASE, delay: 0.65 }
              }
            >
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--card-border)',
                  boxShadow:
                    '0 20px 56px rgba(28,26,23,0.13), 0 4px 16px rgba(28,26,23,0.06)',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base"
                    style={{
                      background: 'rgba(193,127,58,0.10)',
                      color: 'var(--gold)',
                    }}
                    aria-hidden="true"
                  >
                    ✦
                  </div>
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Aria
                    </p>
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--gold)' }}
                    >
                      Your concierge · Online
                    </p>
                  </div>
                  {/* Live indicator */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full animate-gentle-pulse"
                      style={{ background: 'var(--success)' }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Live
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-2.5 px-4 py-4">
                  {ARIA_MESSAGES.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-[1.55]"
                        style={
                          msg.role === 'user'
                            ? {
                                background: 'var(--gold)',
                                color: '#FAF8F5',
                                borderBottomRightRadius: '5px',
                              }
                            : {
                                background: '#F5F2EE',
                                color: 'var(--text-primary)',
                                borderBottomLeftRadius: '5px',
                              }
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fake input bar */}
                <div className="flex items-center gap-2 px-4 pb-4">
                  <div
                    className="flex-1 rounded-lg px-3 py-2.5 text-[12px]"
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-faint)',
                    }}
                  >
                    Ask Aria anything…
                  </div>
                  <button
                    aria-label="Send message"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity duration-150 hover:opacity-85"
                    style={{ background: 'var(--gold)', color: '#FAF8F5' }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-7 left-1/2 z-[4] -translate-x-1/2"
        animate={reduced ? {} : { y: [0, 8, 0] }}
        transition={
          reduced
            ? undefined
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ color: 'var(--text-faint)', opacity: 0.6 }}
      >
        <svg
          width="18"
          height="26"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="1" y="1" width="18" height="26" rx="9"
            stroke="currentColor" strokeWidth="1.5"
          />
          <motion.circle
            cx="10" cy="9" r="2.5" fill="currentColor"
            animate={reduced ? {} : { cy: [9, 17, 9] }}
            transition={
              reduced
                ? undefined
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        </svg>
      </motion.div>
    </section>
  )
}
