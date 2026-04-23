'use client';

import { useState, type FormEvent } from 'react';
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

export default function SimulateBookingPage() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auth
  const [apiKey, setApiKey] = useState('');

  // Required fields
  const [bookingReference, setBookingReference] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [pmsPropertyId, setPmsPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Optional fields
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [roomType, setRoomType] = useState('');
  const [guests, setGuests] = useState('');
  const [tripType, setTripType] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMsg('');
    setSuccessResult(null);

    const resolvedPmsPropertyId = pmsPropertyId.trim() || crypto.randomUUID();

    try {
      const res = await fetch('/api/pms/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pms-api-key': apiKey,
        },
        body: JSON.stringify({
          booking_reference: bookingReference.trim(),
          guest: {
            email: guestEmail.trim(),
            first_name: guestFirstName.trim(),
            last_name: guestLastName.trim(),
          },
          property: {
            pms_property_id: resolvedPmsPropertyId,
            name: hotelName.trim(),
            city: city.trim() || undefined,
            country: country.trim() || undefined,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
          },
          check_in: checkIn,
          check_out: checkOut,
          status: 'confirmed',
          room_type: roomType.trim() || undefined,
          guests: guests ? parseInt(guests, 10) : undefined,
          trip_type: tripType.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = (await res.json()) as { data?: SuccessResult; error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? `Request failed with status ${res.status}`);
      }

      setSuccessResult(json.data ?? {});
      setSubmitState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitState('error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Simulate Booking" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* PMS API Key */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A84C]">
            Authentication
          </p>
          <div>
            <label className={labelClassName}>PMS API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={inputClassName}
              placeholder="Enter PMS webhook API key"
              autoComplete="off"
              required
            />
          </div>
        </div>

        {/* Required fields */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A84C]">
            Required Fields
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Booking Reference <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="text"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                className={inputClassName}
                placeholder="e.g. BK-12345"
                required
              />
            </div>
            <div>
              <label className={labelClassName}>
                Guest Email <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className={inputClassName}
                placeholder="guest@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Guest First Name <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                className={inputClassName}
                placeholder="Jane"
                required
              />
            </div>
            <div>
              <label className={labelClassName}>
                Guest Last Name <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                className={inputClassName}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Hotel Name <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className={inputClassName}
                placeholder="The Grand Hotel"
                required
              />
            </div>
            <div>
              <label className={labelClassName}>
                PMS Property ID{' '}
                <span className="text-white/35 normal-case tracking-normal text-[10px]">
                  (auto-generated if blank)
                </span>
              </label>
              <input
                type="text"
                value={pmsPropertyId}
                onChange={(e) => setPmsPropertyId(e.target.value)}
                className={inputClassName}
                placeholder="Leave blank to auto-generate"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>
                Check-in <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className={labelClassName}>
                Check-out <span className="text-[#C9A84C]/60">*</span>
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>
        </div>

        {/* Optional fields */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/40">
            Optional Fields
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClassName}
                placeholder="London"
              />
            </div>
            <div>
              <label className={labelClassName}>Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClassName}
                placeholder="United Kingdom"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClassName}
                placeholder="51.5074"
              />
            </div>
            <div>
              <label className={labelClassName}>Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClassName}
                placeholder="-0.1278"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Room Type</label>
              <input
                type="text"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className={inputClassName}
                placeholder="Deluxe King"
              />
            </div>
            <div>
              <label className={labelClassName}>Guests</label>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className={inputClassName}
                placeholder="2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Trip Type</label>
              <input
                type="text"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className={inputClassName}
                placeholder="leisure, business, romantic…"
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-[13px] text-white/85 placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/40 focus:bg-white/[0.08] transition-all duration-200 resize-none"
              rows={3}
              placeholder="Any special requests or notes…"
            />
          </div>
        </div>

        {/* Result feedback */}
        {submitState === 'success' && successResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
            <p className="text-[13px] font-medium text-emerald-300">Booking simulated successfully</p>
            {successResult.stay_id && (
              <p className="text-[12px] text-white/60">
                Stay ID: <span className="text-white/85 font-mono">{successResult.stay_id}</span>
              </p>
            )}
            {successResult.booking_reference && (
              <p className="text-[12px] text-white/60">
                Booking Reference:{' '}
                <span className="text-white/85 font-mono">{successResult.booking_reference}</span>
              </p>
            )}
          </div>
        )}

        {submitState === 'error' && errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-[13px] text-red-400">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitState === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-5 py-2.5 text-[13px] font-medium text-[#C9A84C] hover:bg-[#C9A84C]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitState === 'loading' ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
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
              Sending…
            </>
          ) : (
            'Send Webhook'
          )}
        </button>
      </form>
    </div>
  );
}
