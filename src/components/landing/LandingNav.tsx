'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Our Belief',       href: '#our-belief' },
  { label: 'See It In Action', href: '#product-walkthrough' },
  { label: 'For Hotels',       href: '#for-hotels' },
  { label: 'How We Work',      href: '#how-it-works' },
  { label: 'Try It Out',       href: '#final-cta' },
]

// Magnetic effect — cursor gently pulls element toward pointer
function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 })
  const sy = useSpring(y, { stiffness: 220, damping: 18 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return { ref, sx, sy, onMove, onLeave }
}

// Nav link with ink-sweep underline
function NavLink({ label, href, delay }: { label: string; href: string; delay: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.a
      href={href}
      className="relative hidden text-[13px] font-medium sm:inline-block"
      style={{ color: 'var(--text-muted)', paddingBottom: 2 }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ color: 'var(--text-primary)' } as never}
    >
      {label}
      {/* Gold ink sweep underline */}
      <motion.span
        className="absolute bottom-0 left-0 h-[1.5px] rounded-full"
        style={{ background: 'var(--gold)', originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.a>
  )
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const magnetic = useMagnetic(0.28)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 w-full"
        animate={{
          backgroundColor: scrolled
            ? 'rgba(250, 248, 245, 0.92)'
            : 'rgba(250, 248, 245, 0)',
          backdropFilter: scrolled ? 'blur(14px)' : 'blur(0px)',
          borderBottomColor: scrolled ? '#EDE8E1' : 'transparent',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ borderBottomWidth: 1, borderBottomStyle: 'solid' }}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">

          {/* ── Logo ── */}
          <motion.a
            href="/"
            className="flex items-center gap-2.5"
            aria-label="StayScape home"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon tilts + scales on hover; inner square breathes on loop */}
            <motion.svg
              width="26" height="26" viewBox="0 0 26 26"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              whileHover={{ rotate: 8, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <rect
                x="1.5" y="1.5" width="23" height="23" rx="5"
                stroke="var(--gold)" strokeWidth="1.75"
              />
              <motion.rect
                x="7" y="7" width="12" height="12" rx="2.5"
                fill="var(--gold)"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.svg>

            {/* "Scape" slides up & turns gold on mount */}
            <span
              className="text-[17px] font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Stay
              <motion.span
                style={{ display: 'inline-block', color: 'var(--gold)' }}
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                Scape
              </motion.span>
            </span>
          </motion.a>

          {/* ── Desktop links ── */}
          <div className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map((link, i) => (
              <NavLink key={link.href} {...link} delay={0.08 + i * 0.06} />
            ))}
          </div>

          {/* ── Sign In + hamburger ── */}
          <div className="flex items-center gap-4">
            <motion.a
              ref={magnetic.ref}
              href="/login"
              className="text-[13px] font-semibold"
              style={{
                background: 'var(--gold)',
                color: '#FAF8F5',
                borderRadius: '6px',
                padding: '8px 20px',
                display: 'inline-block',
                x: magnetic.sx,
                y: magnetic.sy,
              } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onMouseMove={magnetic.onMove}
              onMouseLeave={magnetic.onLeave}
            >
              Sign In
            </motion.a>

            {/* Hamburger — mobile only */}
            <motion.button
              className="flex sm:hidden flex-col justify-center items-center gap-[5px] w-9 h-9"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((v) => !v)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <motion.span
                className="block h-[1.5px] w-5 rounded-full"
                style={{ background: 'var(--text-primary)', transformOrigin: 'center' }}
                animate={mobileOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.span
                className="block h-[1.5px] rounded-full"
                style={{ background: 'var(--text-primary)' }}
                animate={mobileOpen ? { opacity: 0, width: 0 } : { opacity: 1, width: 14 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-[1.5px] w-5 rounded-full"
                style={{ background: 'var(--text-primary)', transformOrigin: 'center' }}
                animate={mobileOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.button>
          </div>

        </nav>
      </motion.header>

      {/* ── Mobile fullscreen menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col sm:hidden"
            style={{ background: 'rgba(250, 248, 245, 0.97)', backdropFilter: 'blur(18px)' }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col justify-center items-center gap-8 h-full pb-16">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="text-[22px] font-semibold"
                  style={{ color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: 0.06 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setMobileOpen(false)}
                  whileTap={{ scale: 0.96 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="/login"
                className="mt-4 text-[15px] font-semibold px-8 py-3 rounded-lg"
                style={{ background: 'var(--gold)', color: '#FAF8F5' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setMobileOpen(false)}
                whileTap={{ scale: 0.97 }}
              >
                Sign In
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
