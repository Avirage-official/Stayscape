'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

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

  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 0.35])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  const stagger = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, ease: EASE, delay: 0.15 + i * 0.18 },
        }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* ── Video background ── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ── Cinematic dark base overlay ── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'rgba(10,8,6,0.52)' }}
      />

      {/* ── Warm vignette — edges only ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(6,4,2,0.55) 100%)',
        }}
      />

      {/* ── Scroll-driven extra dimming ── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-[3] bg-black"
        style={{ opacity: reduced ? 0 : overlayOpacity }}
      />

      {/* ── Thin gold top border ── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-[5] h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(193,127,58,0.7) 30%, rgba(214,162,82,0.9) 50%, rgba(193,127,58,0.7) 70%, transparent 100%)',
        }}
      />

      {/* ── Bottom fade into page ── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[4] h-[45%]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(10,8,6,0.7) 60%, #FAF8F5 100%)',
        }}
      />

      {/* ── Content ── */}
      <motion.div
        className="relative z-[5] flex min-h-screen flex-col justify-end px-6 pb-24 sm:px-8 md:px-12 lg:px-20"
        style={{ y: reduced ? 0 : contentY }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">

            {/* ── Left: Text ── */}
            <div className="lg:col-span-6">

              {/* Eyebrow pill */}
              <motion.div {...stagger(0)} className="mb-6 flex items-center gap-3">
                <div
                  style={{
                    width: '32px',
                    height: '1px',
                    background: 'rgba(193,127,58,0.7)',
                  }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: 'rgba(214,162,82,0.9)' }}
                >
                  Your stay, reimagined
                </span>
              </motion.div>

              {/* Headline */}
              <div className="mb-6">
                <motion.h1
                  className="block leading-[1.06] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3rem, 5.5vw, 5.2rem)',
                    color: '#FAF8F5',
                    letterSpacing: '-0.025em',
                    textShadow: '0 2px 32px rgba(0,0,0,0.45)',
                  }}
                  {...stagger(1)}
                >
                  The concierge your
                </motion.h1>
                <motion.h1
                  className="block leading-[1.06] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3rem, 5.5vw, 5.2rem)',
                    color: '#FAF8F5',
                    letterSpacing: '-0.025em',
                    textShadow: '0 2px 32px rgba(0,0,0,0.45)',
                  }}
                  {...stagger(2)}
                >
                  guests deserved.
                </motion.h1>
                <motion.h1
                  className="block leading-[1.06] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3rem, 5.5vw, 5.2rem)',
                    color: 'var(--gold, #C17F3A)',
                    letterSpacing: '-0.025em',
                    fontStyle: 'italic',
                    textShadow: '0 2px 32px rgba(193,127,58,0.3)',
                  }}
                  {...stagger(3)}
                >
                  Now in every room.
                </motion.h1>
              </div>

              {/* Divider */}
              <motion.div
                className="mb-7"
                style={{ width: '48px', height: '1px', background: 'rgba(193,127,58,0.55)' }}
                {...stagger(4)}
              />

              {/* Subline */}
              <motion.p
                className="mb-8 max-w-[480px] leading-[1.8]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px',
                  color: 'rgba(250,248,245,0.7)',
                  letterSpacing: '0.01em',
                }}
                {...stagger(4)}
              >
                The gap between a good stay and a great one is usually
                just knowing who to ask.
              </motion.p>

              {/* CTAs */}
              <motion.div
                className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
                {...stagger(5)}
              >
                <a
                  href="#product-walkthrough"
                  className="inline-flex h-12 items-center rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200"
                  style={{
                    background: 'var(--gold, #C17F3A)',
                    color: '#FAF8F5',
                    padding: '0 32px',
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = '#D6A252'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold, #C17F3A)'
                  }}
                >
                  Explore Your Stay
                </a>

                <a
                  href="#product-walkthrough"
                  className="inline-flex h-12 items-center gap-2 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-200"
                  style={{
                    border: '1px solid rgba(250,248,245,0.25)',
                    color: 'rgba(250,248,245,0.8)',
                    padding: '0 28px',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'rgba(193,127,58,0.6)'
                    el.style.color = '#FAF8F5'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'rgba(250,248,245,0.25)'
                    el.style.color = 'rgba(250,248,245,0.8)'
                  }}
                >
                  See it in action
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 19l7-7-7-7M5 12h14" />
                  </svg>
                </a>
              </motion.div>

              {/* Trust note */}
              <motion.p
                className="mt-5 text-[11px] tracking-wide"
                style={{ color: 'rgba(250,248,245,0.35)', letterSpacing: '0.08em' }}
                {...stagger(6)}
              >
                AVAILABLE AT PARTNER HOTELS · NO APP DOWNLOAD REQUIRED
              </motion.p>
            </div>

            {/* ── Right: Aria chat card ── */}
            <motion.div
              className="hidden lg:col-span-5 lg:col-start-8 lg:block lg:pb-2"
              initial={reduced ? undefined : { opacity: 0, y: 32, scale: 0.96 }}
              animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={reduced ? undefined : { duration: 0.9, ease: EASE, delay: 0.7 }}
            >
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background: 'rgba(10,8,6,0.72)',
                  border: '1px solid rgba(193,127,58,0.2)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow:
                    '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(193,127,58,0.15) inset',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: '1px solid rgba(193,127,58,0.12)' }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base"
                    style={{
                      background: 'rgba(193,127,58,0.12)',
                      color: '#D6A252',
                      border: '1px solid rgba(193,127,58,0.2)',
                    }}
                    aria-hidden="true"
                  >
                    ✦
                  </div>
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: '#FAF8F5' }}
                    >
                      Aria
                    </p>
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: '#D6A252' }}
                    >
                      Your concierge · Online
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full animate-gentle-pulse"
                      style={{ background: '#4CAF7D' }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[11px]"
                      style={{ color: 'rgba(250,248,245,0.4)' }}
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
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-[1.6]"
                        style={
                          msg.role === 'user'
                            ? {
                                background: '#C17F3A',
                                color: '#FAF8F5',
                                borderBottomRightRadius: '4px',
                              }
                            : {
                                background: 'rgba(250,248,245,0.07)',
                                color: 'rgba(250,248,245,0.85)',
                                border: '1px solid rgba(250,248,245,0.08)',
                                borderBottomLeftRadius: '4px',
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
                      background: 'rgba(250,248,245,0.06)',
                      border: '1px solid rgba(250,248,245,0.1)',
                      color: 'rgba(250,248,245,0.3)',
                    }}
                  >
                    Ask Aria anything…
                  </div>
                  <button
                    aria-label="Send message"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity duration-150 hover:opacity-85"
                    style={{ background: '#C17F3A', color: '#FAF8F5' }}
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
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-7 left-1/2 z-[6] -translate-x-1/2"
        animate={reduced ? {} : { y: [0, 8, 0] }}
        transition={reduced ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ color: 'rgba(250,248,245,0.35)' }}
      >
        <svg
          width="18"
          height="26"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="1.5" />
          <motion.circle
            cx="10" cy="9" r="2.5" fill="currentColor"
            animate={reduced ? {} : { cy: [9, 17, 9] }}
            transition={reduced ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </section>
  )
}
