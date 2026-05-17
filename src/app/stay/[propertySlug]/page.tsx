'use client';

/**
 * /stay/[propertySlug]
 *
 * Hotel entry page — shown when a guest arrives via a hotel's link or QR code
 * before they have a stay linked to their account.
 *
 * The guest enters their booking reference (from their hotel confirmation email).
 * On success, the activate endpoint links the stay to their account and redirects
 * them to the full stay experience at /stay/[propertySlug]/[stayId].
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], display: 'swap' });
const dmSans    = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });

interface PropertyInfo {
  name: string;
  image_url: string | null;
  city: string | null;
  country: string | null;
}

async function getToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  return (await sb.auth.getSession()).data.session?.access_token ?? null;
}

export default function HotelEntryPage() {
  const params       = useParams();
  const router       = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const propertySlug = typeof params.propertySlug === 'string'
    ? params.propertySlug
    : Array.isArray(params.propertySlug) ? params.propertySlug[0] : '';

  const [property, setProperty]   = useState<PropertyInfo | null>(null);
  const [propLoading, setPropLoading] = useState(true);

  const [bookingRef, setBookingRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/stay/${propertySlug}`);
    }
  }, [authLoading, user, router, propertySlug]);

  // Load property info by slug
  useEffect(() => {
    if (!propertySlug) return;
    void (async () => {
      try {
        const sb = getSupabaseBrowser();
        if (!sb) return;
        const { data } = await sb
          .from('properties')
          .select('name, image_url, city, country')
          .eq('slug', propertySlug)
          .single();
        if (data) setProperty(data as PropertyInfo);
      } catch { /* silent */ }
      finally { setPropLoading(false); }
    })();
  }, [propertySlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingRef.trim()) return;

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
        body: JSON.stringify({ booking_reference: bookingRef.trim(), user_id: user.id }),
      });

      const json = (await res.json()) as {
        data?: { stay_id: string; property_slug: string | null };
        error?: string;
      };

      if (!res.ok || !json.data) {
        setError(json.error ?? 'We couldn\'t find that booking reference. Please check and try again.');
        return;
      }

      const slug = json.data.property_slug ?? propertySlug;
      router.replace(`/stay/${slug}/${json.data.stay_id}/home`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div
      className={`${dmSans.className} min-h-screen flex flex-col`}
      style={{ background: 'var(--background, #0d0d0d)', color: 'white' }}
    >
      {/* Hero — hotel image or dark gradient */}
      <div
        style={{
          position: 'relative',
          height: 220,
          background: property?.image_url
            ? `url(${property.image_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a1a18, #111)',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,13,0.95))' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
          {propLoading ? (
            <div style={{ height: 28, width: 160, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
          ) : (
            <>
              <p className={`${cormorant.className} text-[26px] font-400 text-white leading-tight`}>
                {property?.name ?? propertySlug}
              </p>
              {(property?.city || property?.country) && (
                <p className="text-[12px] text-white/40 font-light mt-0.5">
                  {[property.city, property.country].filter(Boolean).join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <p className={`${cormorant.className} text-[22px] font-400 text-white/90 mb-2`}>
          Find your stay
        </p>
        <p className="text-[13px] text-white/40 font-light leading-relaxed mb-8">
          Enter the booking reference from your hotel confirmation email to access your personalised stay experience.
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
              <>Access my stay <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-white/20 font-light text-center leading-relaxed">
          Your booking reference is found in the confirmation email from{' '}
          {property?.name ?? 'the hotel'}.
        </p>
      </div>
    </div>
  );
}
