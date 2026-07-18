'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase/client'

type Stage = 'form' | 'sent'

export default function SignupPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) {
        setError('Auth not configured.')
        return
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setSentEmail(email)
      setStage('sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes su-fade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes su-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .su-page {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          padding: 24px 20px;
        }
        .su-card {
          width: 100%;
          max-width: 420px;
          animation: su-fade 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .su-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        .su-logo-mark {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg, #FF8FAB, #7B9CF4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .su-logo-name {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #111;
          letter-spacing: -0.01em;
        }
        .su-headline {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: clamp(26px, 5vw, 34px);
          font-weight: 600;
          color: #111;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .su-sub {
          font-size: 15px;
          color: #888;
          margin-bottom: 36px;
          line-height: 1.5;
        }
        .su-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 7px;
        }
        .su-input {
          width: 100%;
          height: 48px;
          border: 1.5px solid #e8e8e8;
          border-radius: 12px;
          padding: 0 16px;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 15px;
          color: #111;
          background: #fafafa;
          outline: none;
          transition: border-color 0.18s ease, background 0.18s ease;
          box-sizing: border-box;
        }
        .su-input:focus {
          border-color: #FF8FAB;
          background: #fff;
        }
        .su-field {
          margin-bottom: 18px;
        }
        .su-error {
          font-size: 13px;
          color: #e53e3e;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: #fff5f5;
          border-radius: 8px;
          border-left: 3px solid #fc8181;
        }
        .su-btn {
          width: 100%;
          height: 50px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF8FAB, #9B7CF8);
          color: #fff;
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.18s ease, transform 0.12s ease;
          margin-top: 6px;
        }
        .su-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .su-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .su-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 26px 0;
        }
        .su-divider-line {
          flex: 1;
          height: 1px;
          background: #ececec;
        }
        .su-divider-text {
          font-size: 12px;
          color: #bbb;
        }
        .su-footer {
          text-align: center;
          font-size: 14px;
          color: #888;
        }
        .su-footer a {
          color: #9B7CF8;
          text-decoration: none;
          font-weight: 500;
        }
        .su-footer a:hover {
          text-decoration: underline;
        }

        /* Sent state */
        .su-sent {
          text-align: center;
          animation: su-fade 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .su-sent-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF8FAB22, #9B7CF822);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
          font-size: 32px;
        }
        .su-sent-title {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #111;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .su-sent-body {
          font-size: 15px;
          color: #666;
          line-height: 1.65;
          margin-bottom: 32px;
        }
        .su-sent-email {
          font-weight: 600;
          color: #111;
        }
        .su-sent-note {
          font-size: 13px;
          color: #aaa;
          margin-top: 20px;
        }
        .su-sent-note a {
          color: #9B7CF8;
          text-decoration: none;
        }
        .su-sent-note a:hover {
          text-decoration: underline;
        }
        .su-loading-dot {
          display: inline-block;
          animation: su-pulse 1.2s ease-in-out infinite;
        }

        @media (prefers-color-scheme: dark) {
          .su-page { background: #0f0f0f; }
          .su-logo-name { color: #f0f0f0; }
          .su-headline { color: #f0f0f0; }
          .su-sub { color: #666; }
          .su-label { color: #999; }
          .su-input { background: #1a1a1a; border-color: #2a2a2a; color: #f0f0f0; }
          .su-input:focus { border-color: #FF8FAB; background: #1f1f1f; }
          .su-error { background: #1a0808; border-left-color: #c53030; }
          .su-divider-line { background: #2a2a2a; }
          .su-footer { color: #555; }
          .su-sent-title { color: #f0f0f0; }
          .su-sent-body { color: #888; }
          .su-sent-email { color: #f0f0f0; }
          .su-sent-note { color: #555; }
        }
      `}</style>

      <div className="su-page">
        <div className="su-card">

          {stage === 'form' && (
            <>
              <div className="su-logo">
                <div className="su-logo-mark">
                  <svg width="20" height="20" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 110,54 C 96,28 68,20 44,30 C 20,40 14,66 28,86 C 38,100 56,104 72,108 C 88,112 106,120 112,136" stroke="white" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 60,34 C 60,24 74,20 84,26 C 94,32 96,44 88,54 C 82,62 68,64 62,72 C 54,82 54,96 62,106 C 70,116 84,120 96,116" stroke="rgba(255,255,255,0.5)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="su-logo-name">Stayscape</span>
              </div>

              <h1 className="su-headline">Create your account.</h1>
              <p className="su-sub">Start discovering travel the way it was meant to be.</p>

              {error && <div className="su-error">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="su-field">
                  <label className="su-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    className="su-input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="su-field">
                  <label className="su-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="su-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="su-field">
                  <label className="su-label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    className="su-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Same password again"
                  />
                </div>

                <button className="su-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>Creating account<span className="su-loading-dot">...</span></>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="su-divider">
                <div className="su-divider-line" />
                <span className="su-divider-text">already have one?</span>
                <div className="su-divider-line" />
              </div>

              <div className="su-footer">
                <Link href="/login">Sign in to your account</Link>
              </div>
            </>
          )}

          {stage === 'sent' && (
            <div className="su-sent">
              <div className="su-sent-icon">✉️</div>
              <div className="su-sent-title">Check your inbox.</div>
              <p className="su-sent-body">
                We sent a confirmation link to{' '}
                <span className="su-sent-email">{sentEmail}</span>.
                Click it to verify your account and start your first trip.
              </p>
              <button
                className="su-btn"
                type="button"
                onClick={() => router.push('/login')}
              >
                Back to sign in
              </button>
              <p className="su-sent-note">
                Didn&apos;t get it? Check spam, or{' '}
                <a href="#" onClick={e => { e.preventDefault(); setStage('form'); }}>
                  try again
                </a>
                .
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
