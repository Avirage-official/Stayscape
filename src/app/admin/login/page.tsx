'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/admin';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('Invalid password.');
        setLoading(false);
        return;
      }

      router.push(redirect);
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-2xl text-[#C9A84C] font-normal tracking-wider">
            StayScape
          </h1>
          <p className="text-[11px] text-white/30 uppercase tracking-widest">
            Super Admin
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7 space-y-5">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Password
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 focus:bg-white/[0.06] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#C9A84C] hover:bg-[#d4b35f] disabled:opacity-40 text-[#0D0D0D] text-[13px] font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="text-center">
          <a href="/login" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
            ← Back to login
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
