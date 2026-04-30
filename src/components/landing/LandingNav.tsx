'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
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

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5" aria-label="Stayscape home">
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="1.5" y="1.5" width="23" height="23" rx="5"
              stroke="var(--gold)"
              strokeWidth="1.75"
            />
            <rect x="7" y="7" width="12" height="12" rx="2.5" fill="var(--gold)" />
          </svg>
          <span
            className="text-[17px] font-semibold tracking-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Stayscape
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="hidden text-[13px] font-medium transition-colors duration-200 sm:inline"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            How it works
          </a>
          <a
            href="#for-hotels"
            className="hidden text-[13px] font-medium transition-colors duration-200 sm:inline"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            For Hotels
          </a>
          <a
            href="/login"
            className="text-[13px] font-semibold transition-all duration-200"
            style={{
              background: 'var(--gold)',
              color: '#FAF8F5',
              borderRadius: '6px',
              padding: '8px 20px',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background =
                'var(--gold-soft)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background =
                'var(--gold)')
            }
          >
            Sign In
          </a>
        </div>

      </nav>
    </motion.header>
  )
}
