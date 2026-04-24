'use client';

import { useState } from 'react';
import SectionHeader from '@/components/admin/SectionHeader';

const inputClassName =
  'w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-white/10 text-[13px] text-white/85 placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/40 focus:bg-white/[0.08] transition-all duration-200';

const labelClassName =
  'block text-[11px] font-medium text-white/55 uppercase tracking-[0.12em] mb-1.5';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface SuccessResult {
  stay_id?: string;
  booking_reference?: string;
  [key: string]: unknown;
}

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SimulateBookingPage() {
  const [apiKey, setApiKey] = useState('');

  // Per-card state for Marina Bay Sands
  const [mbsState, setMbsState] = useState<SubmitState>('idle');
  const [mbsResult, setMbsResult] = useState<SuccessResult | null>(null);
  const [mbsError, setMbsError] = useState('');
  const [mbsRef, setMbsRef] = useState('');
  const [mbsCopied, setMbsCopied] = useState(false);

  const handleFireMbs = async () => {
    const bookingReference = 'MBS-' + crypto.randomUUID().slice(0, 8).toUpperCase();
    setMbsRef(bookingReference);
    setMbsState('loading');
    setMbsError('');
    setMbsResult(null);
    setMbsCopied(false);

    try {
      const res = await fetch('/api/pms/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pms-api-key': apiKey,
        },
        body: JSON.stringify({
          booking_reference: bookingReference,
          guest: {
            email: 'ben.test@stayscape-demo.com',
            first_name: 'Ben',
            last_name: 'Demo',
            phone: '+65 9123 4567',
          },
          property: {
            pms_property_id: 'mbs-singapore-01',
            name: 'Marina Bay Sands',
            address: '10 Bayfront Avenue',
            city: 'Singapore',
            country: 'Singapore',
            latitude: 1.2834,
            longitude: 103.8607,
          },
          check_in: isoDateOffset(7),
          check_out: isoDateOffset(10),
          status: 'confirmed',
          room_type: 'Deluxe King',
          guests: 2,
          trip_type: 'leisure',
        }),
      });

      const json = (await res.json()) as { data?: SuccessResult; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? `Request failed with status ${res.status}`);
      }

      setMbsResult(json.data ?? {});
      setMbsState('success');
    } catch (err) {
      setMbsError(err instanceof Error ? err.message : 'Something went wrong');
      setMbsState('error');
    }
  };

  const handleCopyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setMbsCopied(true);
      setTimeout(() => setMbsCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Simulate Booking" />

      <p className="text-[13px] text-white/55">
        Fire a pre-built PMS webhook to create a demo guest stay. Copy the booking reference and use
        it on the guest app to begin onboarding.
      </p>

      {/* Shared API Key */}
      <div>
        <label className={labelClassName}>PMS API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className={inputClassName}
          placeholder="Enter PMS webhook API key"
          autoComplete="off"
        />
      </div>

      {/* Marina Bay Sands card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A84C]">
          Marina Bay Sands
        </p>

        <div className="space-y-1">
          <p className="text-[12px] text-white/50">
            <span className="text-white/35">Location:</span> Singapore
          </p>
          <p className="text-[12px] text-white/50">
            <span className="text-white/35">Coordinates:</span> 1.2834, 103.8607
          </p>
          <p className="text-[12px] text-white/50">
            <span className="text-white/35">Region:</span> Singapore Central
          </p>
          <p className="text-[12px] text-white/50">
            <span className="text-white/35">PMS ID:</span>{' '}
            <span className="font-mono">mbs-singapore-01</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleFireMbs}
          disabled={mbsState === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-5 py-2.5 text-[13px] font-medium text-[#C9A84C] hover:bg-[#C9A84C]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mbsState === 'loading' ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
              Sending…
            </>
          ) : (
            'Fire Webhook'
          )}
        </button>

        {mbsState === 'success' && mbsResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <p className="text-[13px] font-medium text-emerald-300">Webhook fired successfully</p>
            <div className="flex items-center gap-2">
              <p className="text-[12px] text-white/60">
                Booking Reference:{' '}
                <span className="text-white/85 font-mono">{mbsRef}</span>
              </p>
              <button
                type="button"
                onClick={() => handleCopyRef(mbsRef)}
                className="text-[11px] text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
              >
                {mbsCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {mbsResult.stay_id && (
              <p className="text-[12px] text-white/60">
                Stay ID: <span className="text-white/85 font-mono">{mbsResult.stay_id}</span>
              </p>
            )}
            <p className="text-[11px] text-white/35">
              Go to the guest app, tap Add Stay, and enter this booking reference to begin
              onboarding.
            </p>
          </div>
        )}

        {mbsState === 'error' && mbsError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-[13px] text-red-400">{mbsError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
