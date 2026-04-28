'use client';

export default function LandingFooter() {
  return (
    <footer
      style={{
        background: '#0a0a09',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
      className="py-6 px-6"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <span className="text-sm font-medium" style={{ color: '#8a8580' }}>
          Stayscape
        </span>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          <a
            href="#benefits"
            className="text-sm transition-colors duration-200"
            style={{ color: '#8a8580' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
          >
            For Hotels
          </a>
          <a
            href="/dashboard"
            className="text-sm transition-colors duration-200"
            style={{ color: '#8a8580' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
          >
            The App
          </a>
          <a
            href="mailto:hello@stayscape.app"
            className="text-sm transition-colors duration-200"
            style={{ color: '#8a8580' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
          >
            Contact
          </a>
        </nav>

        {/* Copyright */}
        <span className="text-xs" style={{ color: '#6b6560' }}>
          © 2025 Stayscape
        </span>
      </div>
    </footer>
  );
}
