'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [sweeping, setSweeping] = useState(false)
  const [lineWidth, setLineWidth] = useState(0)
  const [contentVisible, setContentVisible] = useState(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    // Clear any in-progress transition
    timers.current.forEach(clearTimeout)
    timers.current = []

    // 1 — Hide content, start line at 0 (deferred to avoid sync setState in effect)
    const t0 = setTimeout(() => {
      setContentVisible(false)
      setSweeping(true)
      setLineWidth(0)
    }, 0)

    // 2 — Trigger CSS transition: line sweeps to full width
    const t1 = setTimeout(() => setLineWidth(100), 32)

    // 3 — After sweep (220ms), reveal content
    const t2 = setTimeout(() => {
      setContentVisible(true)
    }, 240)

    // 4 — Fade line out after content is visible
    const t3 = setTimeout(() => {
      setSweeping(false)
      setLineWidth(0)
    }, 440)

    timers.current = [t0, t1, t2, t3]
  }, [pathname])

  return (
    <>
      {/* Gold sweep line */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '1.5px',
          width: `${lineWidth}%`,
          background: 'linear-gradient(90deg, rgba(200,168,90,0.3) 0%, #C8A85A 40%, #E8C870 70%, rgba(200,168,90,0.5) 100%)',
          boxShadow: '0 0 10px rgba(200,168,90,0.55), 0 0 28px rgba(200,168,90,0.22)',
          zIndex: 9998,
          opacity: sweeping ? 1 : 0,
          transition: sweeping
            ? `width 220ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease`
            : 'opacity 180ms ease',
          pointerEvents: 'none',
        }}
      />

      {/* Page content */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: contentVisible ? 'opacity 160ms ease-out' : 'none',
          display: 'contents',
        }}
      >
        {children}
      </div>
    </>
  )
}
