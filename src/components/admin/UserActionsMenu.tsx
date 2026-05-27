'use client';

import { useState, useRef, useEffect } from 'react';

interface UserActionsMenuProps {
  userId: string;
  email: string;
  ariaCredits: number;
}

export default function UserActionsMenu({ userId, email, ariaCredits }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [creditsValue, setCreditsValue] = useState(String(ariaCredits));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCredits(false);
        setMessage(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  async function handleResetPassword() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { link?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      if (data.link) {
        await navigator.clipboard.writeText(data.link);
        setMessage({ type: 'success', text: 'Reset link copied to clipboard' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCredits() {
    const credits = parseInt(creditsValue, 10);
    if (Number.isNaN(credits) || credits < 0 || credits > 100) {
      setMessage({ type: 'error', text: 'Enter a value between 0 and 100' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMessage({ type: 'success', text: `Credits set to ${credits}` });
      setShowCredits(false);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setMessage(null);
          setShowCredits(false);
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 text-lg leading-none text-white/50 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
        aria-label="User actions"
      >
        ···
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-56 rounded-xl border border-white/15 bg-[#181818] p-1 shadow-2xl">
          {message && (
            <p
              className={`px-3 py-2 text-xs ${
                message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </p>
          )}

          {!showCredits ? (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={handleResetPassword}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                Send Password Reset
              </button>
              <button
                type="button"
                onClick={() => setShowCredits(true)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white"
              >
                Adjust Credits
                <span className="ml-auto text-xs text-white/40">{ariaCredits}</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 p-3">
              <p className="text-xs text-white/50">Set Aria Credits (0–100)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={creditsValue}
                  onChange={(e) => setCreditsValue(e.target.value)}
                  className="w-16 rounded-md border border-white/15 bg-white/[0.06] px-2 py-1.5 text-sm text-white focus:border-[#C9A84C]/50 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveCredits}
                  className="rounded-md border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-1.5 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/20 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowCredits(false)}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
