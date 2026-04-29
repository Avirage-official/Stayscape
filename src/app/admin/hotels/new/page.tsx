'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────── */

interface Region {
  id: string;
  name: string;
  country_code: string;
}

interface FormData {
  // Step 1
  name: string;
  city: string;
  country: string;
  timezone: string;
  address: string;
  region_id: string;
  booking_url: string;

  // Step 2
  concierge_name: string;
  concierge_tone: string;
  accent_color: string;
  welcome_message: string;
  logo_url: string;
  hero_image_url: string;

  // Step 3
  checkin_time: string;
  checkout_time: string;
  wifi_name: string;
  wifi_password: string;
  cancellation_policy: string;
  pet_policy: string;
  smoking_policy: string;

  // Step 4
  pms_provider: string;
  webhook_secret: string;
  pms_is_active: boolean;

  // Step 5
  admin_name: string;
  admin_email: string;
  admin_phone: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  city: '',
  country: '',
  timezone: 'UTC',
  address: '',
  region_id: '',
  booking_url: '',
  concierge_name: 'Aria',
  concierge_tone: 'warm',
  accent_color: '#C9A96E',
  welcome_message: '',
  logo_url: '',
  hero_image_url: '',
  checkin_time: '',
  checkout_time: '',
  wifi_name: '',
  wifi_password: '',
  cancellation_policy: '',
  pet_policy: '',
  smoking_policy: '',
  pms_provider: 'manual',
  webhook_secret: '',
  pms_is_active: false,
  admin_name: '',
  admin_email: '',
  admin_phone: '',
};

/* ── Shared styles ─────────────────────────────────────────────── */

const labelClass =
  'block text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1';
const inputClass =
  'bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white/80 w-full focus:outline-none focus:border-[#C9A84C]/40';
const cardClass =
  'rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4';
const primaryBtn =
  'bg-[#C9A84C] text-black text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryBtn =
  'border border-white/15 text-white/60 text-[13px] rounded-lg px-4 py-2 hover:border-white/30';
const sectionHeaderClass =
  'text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]';

/* ── Step indicator ────────────────────────────────────────────── */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium border transition-colors ${
                isActive
                  ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]'
                  : isDone
                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]/60'
                    : 'border-white/15 bg-white/[0.03] text-white/30'
              }`}
            >
              {isDone ? '✓' : step}
            </div>
            {step < total && (
              <div
                className={`h-px w-8 ${isDone ? 'bg-[#C9A84C]/30' : 'bg-white/10'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1 — Hotel Basics ─────────────────────────────────────── */

function Step1({
  data,
  regions,
  regionsFetchError,
  onChange,
}: {
  data: FormData;
  regions: Region[];
  regionsFetchError: boolean;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className={sectionHeaderClass}>Hotel Basics</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Hotel Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Grand Hotel"
          />
        </div>

        <div>
          <label className={labelClass}>
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Paris"
          />
        </div>

        <div>
          <label className={labelClass}>
            Country <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={data.country}
            onChange={(e) => onChange('country', e.target.value)}
            placeholder="France"
          />
        </div>

        <div>
          <label className={labelClass}>Timezone</label>
          <input
            type="text"
            className={inputClass}
            value={data.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            placeholder="UTC"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address</label>
          <input
            type="text"
            className={inputClass}
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="12 Rue de Rivoli"
          />
        </div>

        <div>
          <label className={labelClass}>Region</label>
          {regionsFetchError ? (
            <p className="text-[12px] text-amber-400">Could not load regions</p>
          ) : (
            <select
              className={inputClass}
              value={data.region_id}
              onChange={(e) => onChange('region_id', e.target.value)}
            >
              <option value="">— Select region —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.country_code})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>Booking URL</label>
          <input
            type="url"
            className={inputClass}
            value={data.booking_url}
            onChange={(e) => onChange('booking_url', e.target.value)}
            placeholder="https://book.hotel.com"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 2 — Branding & Aria ──────────────────────────────────── */

function Step2({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className={sectionHeaderClass}>Branding &amp; Aria</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Concierge Name</label>
          <input
            type="text"
            className={inputClass}
            value={data.concierge_name}
            onChange={(e) => onChange('concierge_name', e.target.value)}
            placeholder="Aria"
          />
        </div>

        <div>
          <label className={labelClass}>Concierge Tone</label>
          <select
            className={inputClass}
            value={data.concierge_tone}
            onChange={(e) => onChange('concierge_tone', e.target.value)}
          >
            <option value="warm">Warm</option>
            <option value="poetic">Poetic</option>
            <option value="efficient">Efficient</option>
            <option value="playful">Playful</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Accent Color</label>
          <input
            type="text"
            className={inputClass}
            value={data.accent_color}
            onChange={(e) => onChange('accent_color', e.target.value)}
            placeholder="#C9A96E"
          />
        </div>

        <div>
          <label className={labelClass}>Logo URL</label>
          <input
            type="url"
            className={inputClass}
            value={data.logo_url}
            onChange={(e) => onChange('logo_url', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Hero Image URL</label>
          <input
            type="url"
            className={inputClass}
            value={data.hero_image_url}
            onChange={(e) => onChange('hero_image_url', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Welcome Message</label>
          <textarea
            className={inputClass}
            rows={3}
            value={data.welcome_message}
            onChange={(e) => onChange('welcome_message', e.target.value)}
            placeholder="Welcome to our hotel…"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 3 — Policies ─────────────────────────────────────────── */

function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className={sectionHeaderClass}>Policies</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Check-in Time</label>
          <input
            type="text"
            className={inputClass}
            value={data.checkin_time}
            onChange={(e) => onChange('checkin_time', e.target.value)}
            placeholder="15:00"
          />
        </div>

        <div>
          <label className={labelClass}>Check-out Time</label>
          <input
            type="text"
            className={inputClass}
            value={data.checkout_time}
            onChange={(e) => onChange('checkout_time', e.target.value)}
            placeholder="11:00"
          />
        </div>

        <div>
          <label className={labelClass}>WiFi Name</label>
          <input
            type="text"
            className={inputClass}
            value={data.wifi_name}
            onChange={(e) => onChange('wifi_name', e.target.value)}
            placeholder="HotelGuest"
          />
        </div>

        <div>
          <label className={labelClass}>WiFi Password</label>
          <input
            type="text"
            className={inputClass}
            value={data.wifi_password}
            onChange={(e) => onChange('wifi_password', e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Cancellation Policy</label>
          <textarea
            className={inputClass}
            rows={2}
            value={data.cancellation_policy}
            onChange={(e) => onChange('cancellation_policy', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Pet Policy</label>
          <textarea
            className={inputClass}
            rows={2}
            value={data.pet_policy}
            onChange={(e) => onChange('pet_policy', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Smoking Policy</label>
          <textarea
            className={inputClass}
            rows={2}
            value={data.smoking_policy}
            onChange={(e) => onChange('smoking_policy', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 4 — PMS & Confirm ────────────────────────────────────── */

function Step4({
  data,
  onChange,
  onToggle,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onToggle: (field: keyof FormData, value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>PMS Configuration</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>PMS Provider</label>
            <select
              className={inputClass}
              value={data.pms_provider}
              onChange={(e) => onChange('pms_provider', e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="mews">Mews</option>
              <option value="opera">Opera</option>
              <option value="cloudbeds">Cloudbeds</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Webhook Secret</label>
            <input
              type="text"
              className={inputClass}
              value={data.webhook_secret}
              onChange={(e) => onChange('webhook_secret', e.target.value)}
              placeholder="whsec_..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggle('pms_is_active', !data.pms_is_active)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border transition-colors ${
                data.pms_is_active
                  ? 'border-[#C9A84C]/60 bg-[#C9A84C]/30'
                  : 'border-white/15 bg-white/[0.04]'
              }`}
              aria-checked={data.pms_is_active}
              role="switch"
            >
              <span
                className={`inline-block h-3.5 w-3.5 translate-y-[3px] rounded-full transition-transform ${
                  data.pms_is_active
                    ? 'translate-x-[18px] bg-[#C9A84C]'
                    : 'translate-x-[3px] bg-white/30'
                }`}
              />
            </button>
            <span className="text-[13px] text-white/60">PMS Active</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className={labelClass}>Hotel</p>
            <p className="text-white/70">{data.name || '—'}</p>
          </div>
          <div>
            <p className={labelClass}>Location</p>
            <p className="text-white/70">
              {[data.city, data.country].filter(Boolean).join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className={labelClass}>Concierge</p>
            <p className="text-white/70">
              {data.concierge_name || 'Aria'} ({data.concierge_tone})
            </p>
          </div>
          <div>
            <p className={labelClass}>Accent Color</p>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 flex-shrink-0 rounded border border-white/20"
                style={{ background: data.accent_color }}
              />
              <span className="font-mono text-white/70">{data.accent_color}</span>
            </div>
          </div>
          <div>
            <p className={labelClass}>Check-in / Check-out</p>
            <p className="text-white/70">
              {[data.checkin_time, data.checkout_time].filter(Boolean).join(' / ') || '—'}
            </p>
          </div>
          <div>
            <p className={labelClass}>PMS Provider</p>
            <p className="text-white/70">{data.pms_provider}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 5 — Hotel Admin ───────────────────────────────────────── */

function Step5({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <h2 className={sectionHeaderClass}>Hotel Admin</h2>
      <p className="text-[12px] text-white/40">
        An onboarding email will be sent to this address after the hotel is created.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>
            Admin Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            value={data.admin_name}
            onChange={(e) => onChange('admin_name', e.target.value)}
            placeholder="Jane Smith"
          />
          {errors.admin_name && (
            <p className="mt-1 text-[11px] text-red-400">{errors.admin_name}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Admin Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            className={inputClass}
            value={data.admin_email}
            onChange={(e) => onChange('admin_email', e.target.value)}
            placeholder="jane@example.com"
          />
          {errors.admin_email && (
            <p className="mt-1 text-[11px] text-red-400">{errors.admin_email}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Admin Phone</label>
          <input
            type="tel"
            className={inputClass}
            value={data.admin_phone}
            onChange={(e) => onChange('admin_phone', e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main wizard ───────────────────────────────────────────────── */

export default function AddHotelPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsFetchError, setRegionsFetchError] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    fetch('/api/admin/regions')
      .then((res) => res.json())
      .then((json: { regions?: Region[] }) => {
        if (json.regions) setRegions(json.regions);
        else setRegionsFetchError(true);
      })
      .catch(() => {
        setRegionsFetchError(true);
      });
  }, []);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleToggle(field: keyof FormData, value: boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep1(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Hotel name is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep5(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.admin_name.trim()) newErrors.admin_name = 'Admin name is required';
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!form.admin_email.trim() || !emailRegex.test(form.admin_email.trim())) {
      newErrors.admin_email = 'Valid admin email is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!validateStep5()) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          city: form.city,
          country: form.country,
          timezone: form.timezone || 'UTC',
          address: form.address || null,
          region_id: form.region_id || null,
          booking_url: form.booking_url || null,
          logo_url: form.logo_url || null,
          accent_color: form.accent_color || '#C9A96E',
          hero_image_url: form.hero_image_url || null,
          welcome_message: form.welcome_message || null,
          concierge_name: form.concierge_name || 'Aria',
          concierge_tone: form.concierge_tone || 'warm',
          checkin_time: form.checkin_time || null,
          checkout_time: form.checkout_time || null,
          wifi_name: form.wifi_name || null,
          wifi_password: form.wifi_password || null,
          cancellation_policy: form.cancellation_policy || null,
          pet_policy: form.pet_policy || null,
          smoking_policy: form.smoking_policy || null,
          pms_provider: form.pms_provider || 'manual',
          webhook_secret: form.webhook_secret || null,
          pms_is_active: form.pms_is_active,
        }),
      });

      const json = (await res.json()) as { propertyId?: string; error?: string };

      if (!res.ok || !json.propertyId) {
        setSubmitError(json.error ?? 'An unexpected error occurred');
        return;
      }

      // Send hotel admin invite
      const inviteRes = await fetch(
        `/api/admin/hotels/${json.propertyId}/invite-admin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_name: form.admin_name,
            admin_email: form.admin_email,
            admin_phone: form.admin_phone || undefined,
          }),
        },
      );

      const inviteJson = (await inviteRes.json()) as {
        success?: boolean;
        warning?: string;
        error?: string;
      };

      if (!inviteRes.ok || !inviteJson.success) {
        // Hotel was created but invite failed — redirect with an error note in query param
        router.push(
          `/admin/hotels?notice=created&warn=${encodeURIComponent(inviteJson.error ?? 'Invite could not be sent')}`,
        );
      } else {
        router.push(
          `/admin/hotels?notice=invited&email=${encodeURIComponent(form.admin_email)}`,
        );
      }
    } catch {
      setSubmitError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em] mb-1">
          Add Hotel
        </h1>
        <p className="text-white/40 text-[13px]">
          Complete all steps to create a new hotel property.
        </p>
      </div>

      <StepIndicator current={step} total={5} />

      {step === 1 && (
        <>
          <Step1 data={form} regions={regions} regionsFetchError={regionsFetchError} onChange={handleChange} />
          {(errors.name || errors.city || errors.country) && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
              {errors.name ?? errors.city ?? errors.country}
            </div>
          )}
        </>
      )}

      {step === 2 && <Step2 data={form} onChange={handleChange} />}

      {step === 3 && <Step3 data={form} onChange={handleChange} />}

      {step === 4 && <Step4 data={form} onChange={handleChange} onToggle={handleToggle} />}

      {step === 5 && (
        <>
          <Step5 data={form} errors={errors} onChange={handleChange} />
          {submitError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
              {submitError}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 1 && (
            <button type="button" className={secondaryBtn} onClick={handleBack}>
              Back
            </button>
          )}
        </div>
        <div>
          {step < 5 ? (
            <button type="button" className={primaryBtn} onClick={handleNext}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className={primaryBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create Hotel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
