'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      className="sticky top-0 z-50 w-full"
      animate={{
        backgroundColor: scrolled ? 'rgba(15, 14, 13, 0.8)' : 'rgba(15, 14, 13, 0)',
        backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
        borderBottomColor: scrolled
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(255, 255, 255, 0)',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ borderBottomWidth: 1, borderBottomStyle: 'solid' }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="24" height="24" rx="4" stroke="#c9a96e" strokeWidth="2" />
            <rect x="8" y="8" width="12" height="12" rx="2" fill="#c9a96e" />
          </svg>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: '#e8e4dc' }}
          >
            Stayscape
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <a
            href="#benefits"
            className="hidden text-sm transition-colors duration-200 sm:inline"
            style={{ color: '#8a8580' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
          >
            For Hotels
          </a>
          <a
            href="/why-it-works"
            className="hidden text-sm transition-colors duration-200 sm:inline"
            style={{ color: '#8a8580' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
          >
            Why It Works
          </a>
          <a
            href="/login"
            className="text-sm font-medium"
            style={{
              backgroundColor: '#c9a96e',
              color: '#0f0e0d',
              borderRadius: 4,
              padding: '8px 20px',
            }}
          >
            Try the App
          </a>
        </div>
      </nav>
    </motion.header>
  )
}
