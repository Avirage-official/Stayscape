'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

/* ── Shared styles (match dark admin theme) ─────────────────────── */

const labelClass =
  'block text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1';
const inputClass =
  'bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white/80 w-full focus:outline-none focus:border-[#C9A84C]/40';
const cardClass =
  'rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5 w-full max-w-md';
const primaryBtn =
  'bg-[#C9A84C] text-black text-[13px] font-medium rounded-lg px-4 py-2.5 w-full hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed';

/* ── Token data type ────────────────────────────────────────────── */

interface TokenData {
  hotel_name: string;
  admin_name: string;
  property_id: string;
  status: 'pending' | 'active';
}

/* ── Inner component (uses useSearchParams) ─────────────────────── */

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('No invite token provided.');
      setLoading(false);
      return;
    }

    fetch(`/api/hotel-admin/onboard?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((json: TokenData & { error?: string }) => {
        if (json.error) {
          setTokenError(json.error);
        } else {
          setTokenData(json);
          setName(json.admin_name);
        }
      })
      .catch(() => setTokenError('Failed to validate invite token.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel-admin/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !json.success) {
        setFormError(json.error ?? 'An unexpected error occurred.');
        return;
      }

      router.push('/hotel-admin/dashboard');
    } catch {
      setFormError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-white/40 text-[13px]">Validating invite…</p>
    );
  }

  if (tokenError) {
    return (
      <div className={cardClass}>
        <h2 className="text-[13px] font-medium text-red-400">Invite Invalid</h2>
        <p className="text-[13px] text-white/50">{tokenError}</p>
      </div>
    );
  }

  if (tokenData?.status === 'active') {
    return (
      <div className={cardClass}>
        <h2 className="text-[13px] font-medium text-[#C9A84C]">Already Set Up</h2>
        <p className="text-[13px] text-white/50">
          This invite has already been used. Your account for{' '}
          <span className="text-white/80">{tokenData.hotel_name}</span> is active.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div>
        <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1">
          {tokenData?.hotel_name}
        </p>
        <h1 className="text-[18px] font-semibold text-white">Complete Your Setup</h1>
        <p className="text-[13px] text-white/40 mt-1">
          Set up your account to start managing this hotel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClass}>
            Password <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className={labelClass}>
            Confirm Password <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {formError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
            {formError}
          </div>
        )}

        <button type="submit" className={primaryBtn} disabled={submitting}>
          {submitting ? 'Setting up…' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function HotelAdminOnboardPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <p className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]">
          Stayscape
        </p>
      </div>
      <Suspense fallback={<p className="text-white/40 text-[13px]">Loading…</p>}>
        <OnboardForm />
      </Suspense>
    </div>
  );
}
