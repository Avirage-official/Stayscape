'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<'guest' | 'hotel'>('guest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (mode === 'guest') {
      router.push('/dashboard');
      return;
    }

    try {
      const supabase = getSupabaseBrowser();
      const token = supabase
        ? (await supabase.auth.getSession()).data.session?.access_token
        : null;

      const res = await fetch('/api/hotel-admin/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        setError('No hotel admin account found for this email.');
        setIsSubmitting(false);
        return;
      }

      router.push('/hotel-admin/dashboard');
    } catch {
      setError('No hotel admin account found for this email.');
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideIndicator {
          from { opacity: 0; transform: scaleX(0.6); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        @keyframes fieldIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-card {
          animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        .anim-brand {
          animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0s both;
        }
        .anim-overlay {
          animation: fadeIn 1.2s ease both;
        }
        .field-row {
          animation: fieldIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        .field-row:nth-child(1) { animation-delay: 0.05s; }
        .field-row:nth-child(2) { animation-delay: 0.12s; }
        .field-row:nth-child(3) { animation-delay: 0.19s; }

        .login-input {
          width: 100%;
          height: 44px;
          padding: 0 16px;
          border-radius: 8px;
          background: rgba(250,248,245,0.06);
          border: 1px solid rgba(250,248,245,0.12);
          color: #FAF8F5;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .login-input::placeholder { color: rgba(250,248,245,0.25); }
        .login-input:focus {
          border-color: rgba(193,127,58,0.55);
          background: rgba(250,248,245,0.09);
          box-shadow: 0 0 0 3px rgba(193,127,58,0.1);
        }

        .mode-btn {
          position: relative;
          flex: 1;
          height: 36px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: color 0.25s;
          font-family: inherit;
        }
        .mode-btn.active  { color: #FAF8F5; }
        .mode-btn.inactive { color: rgba(250,248,245,0.35); }
        .mode-btn.inactive:hover { color: rgba(250,248,245,0.6); }

        .mode-pill {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          background: rgba(193,127,58,0.22);
          border: 1px solid rgba(193,127,58,0.35);
          animation: slideIndicator 0.3s cubic-bezier(0.16,1,0.3,1) both;
          pointer-events: none;
        }

        .submit-btn {
          width: 100%;
          height: 44px;
          border-radius: 8px;
          background: #C17F3A;
          color: #FAF8F5;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.07em;
          border: none;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) { background: #D6A252; }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .demo-box {
          border: 1px solid rgba(193,127,58,0.2);
          background: rgba(193,127,58,0.06);
          border-radius: 10px;
          padding: 14px 18px;
          margin-top: 16px;
          animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #F87171;
          font-size: 12px;
          animation: fieldIn 0.3s ease both;
        }

        .signup-link {
          text-align: center;
          margin-top: 20px;
          animation: fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.45s both;
        }

        .signup-link a {
          color: #C17F3A;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }

        .signup-link a:hover {
          color: #D6A252;
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center px-4">

        {/* ── Video background ── */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          >
            <source src="/videos/login.mp4" type="video/mp4" />
          </video>
          {/* Dark base overlay */}
          <div className="anim-overlay absolute inset-0" style={{ background: 'rgba(8,6,4,0.62)' }} />
          {/* Radial vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(4,2,0,0.65) 100%)' }} />
          {/* Gold top rule */}
          <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(193,127,58,0.6) 30%, rgba(214,162,82,0.85) 50%, rgba(193,127,58,0.6) 70%, transparent)' }} />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 w-full max-w-[400px]">

          {/* Brand */}
          <div className="anim-brand text-center mb-10">
            <a href="/admin" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2rem',
              color: '#C17F3A',
              letterSpacing: '0.06em',
              fontWeight: 400,
              margin: '0 0 6px',
            }}>
              StayScape
            </h1>
          </a>
            <p style={{ fontSize: '12px', color: 'rgba(250,248,245,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {mode === 'guest' ? 'Guest Access' : 'Hotel Admin Portal'}
            </p>
          </div>

          {/* Card */}
          <div
            className="anim-card"
            style={{
              background: 'rgba(10,8,6,0.7)',
              border: '1px solid rgba(250,248,245,0.1)',
              borderRadius: '16px',
              padding: '28px',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(193,127,58,0.1) inset',
            }}
          >
            {/* Mode toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(250,248,245,0.05)',
                border: '1px solid rgba(250,248,245,0.08)',
                borderRadius: '8px',
                padding: '3px',
                marginBottom: '24px',
              }}
            >
              {(['guest', 'hotel'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  aria-pressed={mode === m}
                  className={`mode-btn ${mode === m ? 'active' : 'inactive'}`}
                  style={{ textTransform: 'uppercase' }}
                >
                  {mode === m && <span className="mode-pill" />}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {m === 'guest' ? 'Guest' : 'Hotel'}
                  </span>
                </button>
              ))}
            </div>

            {/* Fields */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div className="field-row">
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.35)', marginBottom: '8px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="login-input"
                  />
                </div>

                <div className="field-row">
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.35)', marginBottom: '8px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                  />
                </div>

                {error && (
                  <div className="error-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="field-row">
                  <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                        </svg>
                        Signing in…
                      </span>
                    ) : 'Sign In'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Hotel signup CTA */}
          {mode === 'hotel' && (
            <div className="signup-link">
              <p style={{ fontSize: '12px', color: 'rgba(250,248,245,0.45)', marginBottom: '8px' }}>
                New to Stayscape?
              </p>
              <Link href="/hotel/signup">
                Sign up your hotel
              </Link>
            </div>
          )}

          {/* Demo box */}
          <div className="demo-box">
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C17F3A', marginBottom: '8px' }}>
              {mode === 'guest' ? 'Demo Credentials' : 'Hotel Admin'}
            </p>
            {mode === 'guest' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(250,248,245,0.45)' }}>
                  Email: <code style={{ color: 'rgba(250,248,245,0.7)', fontFamily: 'monospace' }}>ben.test@stayscape-demo.com</code>
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(250,248,245,0.45)' }}>
                  Password: <code style={{ color: 'rgba(250,248,245,0.7)', fontFamily: 'monospace' }}>Demo1234!</code>
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(250,248,245,0.45)', lineHeight: 1.6 }}>
                  Use the credentials from your Stayscape onboarding invite, or sign up your hotel.
                </p>
                
                  href="/hotel/signup"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: '#C17F3A',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D6A252')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#C17F3A')}
                >
                  Sign up your hotel
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>→</span>
                </a>
              </div>
            )}
          </div>

          {/* Skip link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a
              href="/dashboard"
              style={{ fontSize: '12px', color: 'rgba(250,248,245,0.25)', letterSpacing: '0.05em', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(250,248,245,0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,248,245,0.25)')}
            >
              Explore without signing in →
            </a>
          </div>
        </div>

        {/* ── Superadmin — very discreet ── */}
        <a
          href="/admin"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '20px',
            fontSize: '10px',
            color: 'rgba(250,248,245,0.18)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            transition: 'color 0.2s',
            zIndex: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(193,127,58,0.6)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,248,245,0.18)')}
        >
          ·
        </a>
      </div>
    </>
  );
}
