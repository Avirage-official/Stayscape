'use client';

/**
 * BookingReferenceGate
 *
 * Shown when a guest has a stay URL but stay_confirmed_by_guest is false.
 * This is a safety net for PMS-synced stays where the guest navigated directly
 * to the URL before verifying their booking reference.
 *
 * On success, reloads the page so the layout re-fetches the now-confirmed stay.
 */

import { useState } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Loader2, ArrowRight } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { CustomerStay } from '@/types/customer';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], display: 'swap' });
const dmSans    = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });

interface Props {
  stay: CustomerStay;
  userId: string;
  propertySlug: string;
}

async function getToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  return (await sb.auth.getSession()).data.session?.access_token ?? null;
}

export default function BookingReferenceGate({ stay, userId, propertySlug }: Props) {
  const [bookingRef, setBookingRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const hotelName = stay.property?.name ?? 'the hotel';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRef.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch('/api/customer/stays/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ booking_reference: bookingRef.trim(), user_id: userId }),
      });

      const json = (await res.json()) as { data?: { stay_id: string }; error?: string };

      if (!res.ok || !json.data) {
        setError(json.error ?? 'Booking reference not recognised. Please check your confirmation email and try again.');
        return;
      }

      // Reload to pick up the now-confirmed stay
      window.location.reload();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`${dmSans.className} min-h-screen flex flex-col items-center justify-center px-6 py-16`}
      style={{ background: 'var(--background, #0d0d0d)', color: 'white' }}
    >
      <div style={{ maxWidth: 420, width: '100%' }}>
        {/* Hotel name */}
        <p className="text-[11px] font-medium tracking-widest uppercase text-white/25 mb-2">
          {hotelName}
        </p>

        <p className={`${cormorant.className} text-[26px] font-400 text-white/90 leading-tight mb-3`}>
          Confirm your stay
        </p>

        <p className="text-[13px] text-white/40 font-light leading-relaxed mb-8">
          Enter the booking reference from your hotel confirmation email to unlock your stay.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-medium tracking-widest uppercase text-white/30 mb-1.5">
            Booking reference
          </label>
          <input
            type="text"
            value={bookingRef}
            onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
            placeholder="e.g. RES-00123456"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-3 text-[14px] text-white placeholder-white/20 outline-none focus:border-[#C9A84C]/50 transition-colors tracking-wider"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={submitting}
          />

          {error && (
            <p className="mt-3 text-[12px] text-red-400 leading-relaxed">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !bookingRef.trim()}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: submitting || !bookingRef.trim() ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.15)',
              color: submitting || !bookingRef.trim() ? 'rgba(201,168,76,0.3)' : '#C9A84C',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>Confirm my stay <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-white/20 font-light text-center leading-relaxed">
          Your booking reference is in the confirmation email sent by {hotelName}.
          <br />Having trouble?{' '}
          <a
            href={`/stay/${propertySlug}`}
            className="text-white/30 underline underline-offset-2 hover:text-white/50 transition-colors"
          >
            Try a different reference
          </a>
        </p>
      </div>
    </div>
  );
}
