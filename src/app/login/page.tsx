'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<'guest' | 'staff'>('guest');
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
    } else {
      router.push(mode === 'guest' ? '/dashboard' : '/admin');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-[var(--gold)] tracking-[0.04em] mb-2">
            Stayscape
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] tracking-wide">
            {mode === 'guest'
              ? 'Sign in to your guest account'
              : 'Hotel Staff Portal'}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 sm:p-8">
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('guest');
                setError(null);
              }}
              aria-pressed={mode === 'guest'}
              className={`h-10 rounded-full text-[12px] font-medium tracking-wide transition-all ${
                mode === 'guest'
                  ? 'bg-[var(--gold)] text-[var(--background)]'
                  : 'border border-white/15 text-white/50 hover:border-white/25 hover:text-white/70'
              }`}
            >
              Guest
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('staff');
                setError(null);
              }}
              aria-pressed={mode === 'staff'}
              className={`h-10 rounded-full text-[12px] font-medium tracking-wide transition-all ${
                mode === 'staff'
                  ? 'bg-[var(--gold)] text-[var(--background)]'
                  : 'border border-white/15 text-white/50 hover:border-white/25 hover:text-white/70'
              }`}
            >
              Hotel Staff
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--gold)]/50 focus:ring-1 focus:ring-[var(--gold)]/20 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--gold)]/50 focus:ring-1 focus:ring-[var(--gold)]/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-[12px] text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[var(--gold)] text-[var(--background)] text-[13px] font-semibold tracking-wide hover:bg-[var(--gold-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials notice */}
        <div className="mt-6 rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 flex-shrink-0 text-[var(--gold)]"
              aria-label="Demo mode information"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-wider">
                {mode === 'guest' ? 'Demo Mode' : 'Hotel Staff'}
              </p>
              {mode === 'guest' ? (
                <>
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                    Email:{' '}
                    <code
                      aria-label="Demo email address"
                      className="text-[var(--text-secondary)] not-italic"
                    >
                      ben.test@stayscape-demo.com
                    </code>
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)]">
                    Password:{' '}
                    <code
                      aria-label="Demo password"
                      className="text-[var(--text-secondary)] not-italic"
                    >
                      Demo1234!
                    </code>
                  </p>
                </>
              ) : (
                <>
                  {/* TODO Phase 2: replace with role-based auth check — for now any Supabase user on staff toggle redirects to /admin */}
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                    Email:{' '}
                    <code
                      aria-label="Staff demo email address"
                      className="text-[var(--text-secondary)] not-italic"
                    >
                      staff@stayscape-demo.com
                    </code>
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)]">
                    Password:{' '}
                    <code
                      aria-label="Staff demo password"
                      className="text-[var(--text-secondary)] not-italic"
                    >
                      Staff1234!
                    </code>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Skip to App */}
        <div className="mt-4 text-center">
          <a
            href="/dashboard"
            className="inline-block text-[12px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors tracking-wide"
          >
            Explore without signing in →
          </a>
        </div>

        {/* Footer hint */}
        <p className="text-center mt-5 text-[11px] text-[var(--text-faint)]">
          Premium guest experience by Stayscape
        </p>
      </div>
    </div>
  );
}
