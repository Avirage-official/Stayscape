'use client'

export default function LandingFooter() {
  return (
    <footer
      className="px-6 py-8"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6">

        {/* Logo */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Stay<span style={{ color: 'var(--gold)' }}>Scape</span>
        </span>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          {[
            { label: 'For Hotels', href: '#for-hotels' },
            { label: 'The App',    href: '/dashboard' },
            { label: 'Contact',    href: 'mailto:Obajews@hotmail.com' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="footer-link text-[13px] transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right side: LinkedIn + copyright */}
        <div className="flex items-center gap-4">
          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/yourstayscape"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="StayScape on LinkedIn"
            className="footer-link transition-colors duration-200"
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>

          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            © 2026 StayScape
          </span>
        </div>

      </div>

      <style jsx>{`
        .footer-link:hover {
          color: var(--text-primary);
        }
      `}</style>
    </footer>
  )
}
