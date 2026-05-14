'use client'

import { useRef, useEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
  useMotionValue,
} from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const ARIA_MESSAGES = [
  { role: 'user' as const,  text: 'What time is the pool open tonight?' },
  { role: 'aria' as const,  text: 'The rooftop pool is open until 10 PM. Shall I set a reminder?' },
  { role: 'user' as const,  text: 'Yes — and can you send extra towels to 412?' },
  { role: 'aria' as const,  text: 'Done. Towels on the way, reminder set. Enjoy your evening.' },
] as const

/* ── Kinetic letter reveal — each char clips up individually ── */
function SplitReveal({
  text,
  delay = 0,
  style,
  className,
}: {
  text: string
  delay?: number
  style?: React.CSSProperties
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <span style={style} className={className}>{text}</span>

  return (
    <span
      aria-label={text}
      style={{ display: 'inline', ...style }}
      className={className}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, y: '0.35em', rotateX: -40 }}
          animate={{ opacity: 1, y: '0em', rotateX: 0 }}
          transition={{
            duration: 0.65,
            ease: EASE,
            delay: delay + i * 0.018,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

/* ── Magnetic cursor tracker for the CTA buttons ── */
function MagneticBtn({
  children,
  href,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  children: React.ReactNode
  href: string
  className?: string
  style?: React.CSSProperties
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 280, damping: 22 })
  const springY = useSpring(y, { stiffness: 280, damping: 22 })
  const reduced = useReducedMotion()

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.28)
    y.set((e.clientY - cy) * 0.28)
  }

  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    x.set(0)
    y.set(0)
    onMouseLeave?.(e)
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ ...style, x: reduced ? 0 : springX, y: reduced ? 0 : springY }}
      onMouseMove={handleMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.a>
  )
}

/* ── Liquid shimmer on the gold bar ── */
function GoldBar() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 z-[5] h-[2px] overflow-hidden"
    >
      <motion.div
        style={{
          width: '200%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(193,127,58,0.3) 20%, rgba(214,162,82,1) 50%, rgba(193,127,58,0.3) 80%, transparent 100%)',
        }}
        animate={{ x: ['-50%', '0%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 1 }}
      />
    </div>
  )
}

/* ── Typing cursor for Aria card ── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2.5 py-2" style={{ background: 'rgba(250,248,245,0.08)', border: '1px solid rgba(250,248,245,0.08)', borderRadius: '12px 12px 12px 3px', width: 'fit-content' }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span
          key={i}
          style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(250,248,245,0.35)', display: 'block' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 0.35])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  /* Aria card message reveal */
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    if (reduced) { setVisibleMsgs(ARIA_MESSAGES.length); return }
    const timings = [1400, 2600, 3900, 5300]
    const typingDelays = [800, 2000, 3300, 4700]
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i < ARIA_MESSAGES.length; i++) {
      const td = typingDelays[i]
      const mt = timings[i]
      if (ARIA_MESSAGES[i].role === 'aria') {
        timers.push(setTimeout(() => setShowTyping(true), td))
        timers.push(setTimeout(() => { setShowTyping(false); setVisibleMsgs(i + 1) }, mt))
      } else {
        timers.push(setTimeout(() => setVisibleMsgs(i + 1), mt))
      }
    }
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      style={{ perspective: '1200px' }}
    >
      {/* Video background */}
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

      <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(10,8,6,0.52)' }} />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,4,2,0.55) 100%)' }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-[3] bg-black"
        style={{ opacity: reduced ? 0 : overlayOpacity }}
      />

      <GoldBar />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-[4] h-[45%]"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(10,8,6,0.7) 60%, #FAF8F5 100%)' }}
      />

      <motion.div
        className="relative z-[5] flex min-h-screen flex-col justify-end px-6 pb-24 sm:px-8 md:px-12 lg:px-20"
        style={{ y: reduced ? 0 : contentY }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">

            {/* Left: Text */}
            <div className="lg:col-span-6">

              <motion.div {...stagger(0)} className="mb-6 flex items-center gap-3">
                <div style={{ width: '32px', height: '1px', background: 'rgba(193,127,58,0.7)' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(214,162,82,0.9)' }}>
                  Your stay, reimagined
                </span>
              </motion.div>

              {/* Headline — kinetic per-character reveal */}
              <div className="mb-6" style={{ perspective: '800px' }}>
                <h1
                  className="block leading-[1.06] tracking-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3rem, 5.5vw, 5.2rem)',
                    letterSpacing: '-0.025em',
                    textShadow: '0 2px 32px rgba(0,0,0,0.45)',
                  }}
                >
                  <SplitReveal text="The concierge your" delay={0.3} style={{ color: '#FAF8F5', display: 'block' }} />
                  <SplitReveal text="guests deserve." delay={0.65} style={{ color: '#FAF8F5', display: 'block' }} />
                  <SplitReveal
                    text="Now in every room."
                    delay={1.05}
                    style={{ color: 'var(--gold, #C17F3A)', fontStyle: 'italic', display: 'block', textShadow: '0 2px 32px rgba(193,127,58,0.3)' }}
                  />
                </h1>
              </div>

              {/* Divider — draws itself in */}
              <motion.div
                className="mb-7"
                style={{
                  width: '48px',
                  height: '1px',
                  background: 'rgba(193,127,58,0.55)',
                  transformOrigin: 'left center',
                }}
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 1.5 }}
              />

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
                Hospitality has always been about people — focusing on
                the experience rather than just the operations.
              </motion.p>

              {/* CTAs — magnetic + separated */}
              <motion.div
                className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
                {...stagger(5)}
              >
                <MagneticBtn
                  href="#product-walkthrough"
                  className="inline-flex h-12 items-center rounded-lg text-[13px] font-semibold tracking-wide"
                  style={{
                    background: 'var(--gold, #C17F3A)',
                    color: '#FAF8F5',
                    padding: '0 32px',
                    letterSpacing: '0.04em',
                    transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.background = '#D6A252' }}
                  onMouseLeave={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold, #C17F3A)' }}
                >
                  Explore Your Stay
                </MagneticBtn>

                <MagneticBtn
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-lg text-[13px] font-medium tracking-wide"
                  style={{
                    border: '1px solid rgba(250,248,245,0.25)',
                    color: 'rgba(250,248,245,0.8)',
                    padding: '0 28px',
                    transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
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
                </MagneticBtn>
              </motion.div>

              <motion.p
                className="mt-5 text-[11px] tracking-wide"
                style={{ color: 'rgba(250,248,245,0.35)', letterSpacing: '0.08em' }}
                {...stagger(6)}
              >
                AVAILABLE AT PARTNER HOTELS · NO APP DOWNLOAD REQUIRED
              </motion.p>
            </div>

            {/* Right: Aria chat card — live animated */}
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
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(193,127,58,0.1) inset',
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(193,127,58,0.12)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[13px]" style={{ background: 'rgba(193,127,58,0.15)', color: '#C17F3A' }}>✦</div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: '#FAF8F5' }}>Aria</p>
                    <p className="text-[10px]" style={{ color: 'rgba(193,127,58,0.8)' }}>Your concierge · Room 412</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <motion.span
                      className="h-2 w-2 rounded-full"
                      style={{ background: '#4A7C59' }}
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-[10px]" style={{ color: 'rgba(250,248,245,0.45)' }}>Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-3 px-5 py-5" style={{ minHeight: 240 }}>
                  {ARIA_MESSAGES.slice(0, visibleMsgs).map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      <div
                        className="max-w-[82%] rounded-xl px-3.5 py-2.5 text-[12px] leading-[1.55]"
                        style={
                          msg.role === 'user'
                            ? { background: '#C17F3A', color: '#FAF8F5', borderBottomRightRadius: '4px' }
                            : { background: 'rgba(250,248,245,0.08)', color: 'rgba(250,248,245,0.88)', border: '1px solid rgba(250,248,245,0.08)', borderBottomLeftRadius: '4px' }
                        }
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {showTyping && (
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(193,127,58,0.12)' }}>
                  <div
                    className="flex-1 rounded-lg px-3.5 py-2.5 text-[12px]"
                    style={{ background: 'rgba(250,248,245,0.06)', border: '1px solid rgba(250,248,245,0.1)', color: 'rgba(250,248,245,0.3)' }}
                  >
                    Ask Aria anything…
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: '#C17F3A' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  )
}