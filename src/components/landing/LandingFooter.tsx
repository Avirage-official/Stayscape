'use client'

export default function LandingFooter() {
  return (
    <footer
      className="px-6 py-6"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

        {/* Logo */}
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Stayscape
        </span>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          {[
            { label: 'For Hotels', href: '#benefits' },
            { label: 'The App',    href: '/dashboard' },
            { label: 'Contact',    href: 'mailto:hello@stayscape.app' },
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

        {/* Copyright */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          © 2026 Stayscape
        </span>

      </div>

      <style jsx>{`
        .footer-link:hover {
          color: var(--text-primary);
        }
      `}</style>
    </footer>
  )
}
