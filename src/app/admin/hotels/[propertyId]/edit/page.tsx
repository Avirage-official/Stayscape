'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

/* ── Types ─────────────────────────────────────────────────────── */

interface Region {
  id: string;
  name: string;
  country_code: string;
}

interface Amenity {
  id: string;
  category: string;
  name: string;
  description: string | null;
  availability_hours: string | null;
  location_hint: string | null;
  is_active: boolean;
  sort_order: number | null;
}

interface BasicsForm {
  name: string;
  city: string;
  country: string;
  timezone: string;
  address: string;
  region_id: string;
  booking_url: string;
}

interface BrandingForm {
  concierge_name: string;
  concierge_tone: string;
  accent_color: string;
  welcome_message: string;
  logo_url: string;
  hero_image_url: string;
}

interface PoliciesForm {
  checkin_time: string;
  checkout_time: string;
  wifi_name: string;
  wifi_password: string;
  cancellation_policy: string;
  pet_policy: string;
  smoking_policy: string;
}

interface PmsForm {
  pms_provider: string;
  webhook_secret: string;
  pms_is_active: boolean;
}

interface AmenityForm {
  category: string;
  name: string;
  description: string;
  availability_hours: string;
  location_hint: string;
}

/* ── Shared styles ─────────────────────────────────────────────── */

const labelClass = 'block text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1';
const inputClass =
  'bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white/80 w-full focus:outline-none focus:border-[#C9A84C]/40';
const cardClass = 'rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4';
const primaryBtnClass =
  'bg-[#C9A84C] text-black text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-[#C9A84C]/90 disabled:opacity-50 disabled:cursor-not-allowed';
const sectionHeaderClass =
  'text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]';

/* ── SaveStatus indicator ───────────────────────────────────────── */

type SaveStatus = 'idle' | 'saving' | 'ok' | 'error';

function SaveIndicator({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <span className="text-[12px] text-white/40">Saving…</span>;
  if (status === 'ok') return <span className="text-[12px] text-emerald-400">Saved ✓</span>;
  return <span className="text-[12px] text-rose-400">{error ?? 'Error saving'}</span>;
}

/* ── Main page ──────────────────────────────────────────────────── */

export default function EditHotelPage() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = params.propertyId;

  const [hotelName, setHotelName] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  // Section forms
  const [basics, setBasics] = useState<BasicsForm>({
    name: '',
    city: '',
    country: '',
    timezone: 'UTC',
    address: '',
    region_id: '',
    booking_url: '',
  });
  const [branding, setBranding] = useState<BrandingForm>({
    concierge_name: 'Aria',
    concierge_tone: 'warm',
    accent_color: '#C9A96E',
    welcome_message: '',
    logo_url: '',
    hero_image_url: '',
  });
  const [policies, setPolicies] = useState<PoliciesForm>({
    checkin_time: '',
    checkout_time: '',
    wifi_name: '',
    wifi_password: '',
    cancellation_policy: '',
    pet_policy: '',
    smoking_policy: '',
  });
  const [pms, setPms] = useState<PmsForm>({
    pms_provider: 'manual',
    webhook_secret: '',
    pms_is_active: false,
  });

  // Save statuses
  const [basicsSave, setBasicsSave] = useState<SaveStatus>('idle');
  const [basicsErr, setBasicsErr] = useState('');
  const [brandingSave, setBrandingSave] = useState<SaveStatus>('idle');
  const [brandingErr, setBrandingErr] = useState('');
  const [policiesSave, setPoliciesSave] = useState<SaveStatus>('idle');
  const [policiesErr, setPoliciesErr] = useState('');
  const [pmsSave, setPmsSave] = useState<SaveStatus>('idle');
  const [pmsErr, setPmsErr] = useState('');

  // Amenity form
  const [amenityForm, setAmenityForm] = useState<AmenityForm>({
    category: '',
    name: '',
    description: '',
    availability_hours: '',
    location_hint: '',
  });
  const [amenitySave, setAmenitySave] = useState<SaveStatus>('idle');
  const [amenityErr, setAmenityErr] = useState('');

  /* ── Load data ──────────────────────────────────────────────── */

  const loadData = useCallback(async () => {
    try {
      const [hotelRes, regionsRes] = await Promise.all([
        fetch(`/api/admin/hotels/${propertyId}`),
        fetch('/api/admin/regions'),
      ]);

      if (hotelRes.ok) {
        const data = (await hotelRes.json()) as {
          property: {
            name?: string;
            city?: string;
            country?: string;
            timezone?: string;
            address?: string | null;
            region_id?: string | null;
            booking_url?: string | null;
          } | null;
          branding: {
            concierge_name?: string;
            concierge_tone?: string;
            accent_color?: string;
            welcome_message?: string | null;
            logo_url?: string | null;
            hero_image_url?: string | null;
          } | null;
          policies: {
            checkin_time?: string | null;
            checkout_time?: string | null;
            wifi_name?: string | null;
            wifi_password?: string | null;
            cancellation_policy?: string | null;
            pet_policy?: string | null;
            smoking_policy?: string | null;
          } | null;
          pms: {
            provider?: string;
            webhook_secret?: string | null;
            is_active?: boolean;
          } | null;
          amenities: Amenity[];
        };

        if (data.property) {
          setHotelName(data.property.name ?? '');
          setBasics({
            name: data.property.name ?? '',
            city: data.property.city ?? '',
            country: data.property.country ?? '',
            timezone: data.property.timezone ?? 'UTC',
            address: data.property.address ?? '',
            region_id: data.property.region_id ?? '',
            booking_url: data.property.booking_url ?? '',
          });
        }

        if (data.branding) {
          setBranding({
            concierge_name: data.branding.concierge_name ?? 'Aria',
            concierge_tone: data.branding.concierge_tone ?? 'warm',
            accent_color: data.branding.accent_color ?? '#C9A96E',
            welcome_message: data.branding.welcome_message ?? '',
            logo_url: data.branding.logo_url ?? '',
            hero_image_url: data.branding.hero_image_url ?? '',
          });
        }

        if (data.policies) {
          setPolicies({
            checkin_time: data.policies.checkin_time ?? '',
            checkout_time: data.policies.checkout_time ?? '',
            wifi_name: data.policies.wifi_name ?? '',
            wifi_password: data.policies.wifi_password ?? '',
            cancellation_policy: data.policies.cancellation_policy ?? '',
            pet_policy: data.policies.pet_policy ?? '',
            smoking_policy: data.policies.smoking_policy ?? '',
          });
        }

        if (data.pms) {
          setPms({
            pms_provider: data.pms.provider ?? 'manual',
            webhook_secret: data.pms.webhook_secret ?? '',
            pms_is_active: data.pms.is_active ?? false,
          });
        }

        setAmenities(data.amenities ?? []);
      }

      if (regionsRes.ok) {
        const regData = (await regionsRes.json()) as { regions: Region[] };
        setRegions(regData.regions ?? []);
      }
    } catch {
      // ignore load errors — form will just be empty
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ── Save helpers ───────────────────────────────────────────── */

  async function saveSection(
    payload: object,
    setStatus: (s: SaveStatus) => void,
    setErr: (e: string) => void,
  ) {
    setStatus('saving');
    setErr('');
    try {
      const res = await fetch(`/api/admin/hotels/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus('ok');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const data = (await res.json()) as { error?: string };
        setErr(data.error ?? 'Save failed');
        setStatus('error');
      }
    } catch {
      setErr('Network error');
      setStatus('error');
    }
  }

  async function handleDeleteAmenity(amenityId: string) {
    try {
      const res = await fetch(`/api/admin/hotels/${propertyId}/amenities/${amenityId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAmenities((prev) => prev.filter((a) => a.id !== amenityId));
      }
    } catch {
      // ignore
    }
  }

  async function handleAddAmenity(e: React.FormEvent) {
    e.preventDefault();
    if (!amenityForm.name) return;

    setAmenitySave('saving');
    setAmenityErr('');
    try {
      const res = await fetch(`/api/admin/hotels/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: amenityForm.category || 'General',
          name: amenityForm.name,
          description: amenityForm.description || null,
          availability_hours: amenityForm.availability_hours || null,
          location_hint: amenityForm.location_hint || null,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { amenity: Amenity };
        setAmenities((prev) => [...prev, data.amenity]);
        setAmenityForm({
          category: '',
          name: '',
          description: '',
          availability_hours: '',
          location_hint: '',
        });
        setAmenitySave('ok');
        setTimeout(() => setAmenitySave('idle'), 3000);
      } else {
        const data = (await res.json()) as { error?: string };
        setAmenityErr(data.error ?? 'Failed to add amenity');
        setAmenitySave('error');
      }
    } catch {
      setAmenityErr('Network error');
      setAmenitySave('error');
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-white/40 text-[13px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <Link
          href="/admin/hotels"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors mb-3"
        >
          <span>←</span> Back to Hotels
        </Link>
        <h2 className="font-serif text-2xl text-white">{hotelName || 'Edit Hotel'}</h2>
      </div>

      {/* ── Section 1: Hotel Basics ── */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h3 className={sectionHeaderClass}>Hotel Basics</h3>
          <div className="flex items-center gap-3">
            <SaveIndicator status={basicsSave} error={basicsErr} />
            <button
              type="button"
              disabled={basicsSave === 'saving'}
              onClick={() => saveSection(basics, setBasicsSave, setBasicsErr)}
              className={primaryBtnClass}
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Hotel Name *</label>
            <input
              type="text"
              value={basics.name}
              onChange={(e) => setBasics((p) => ({ ...p, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input
              type="text"
              value={basics.city}
              onChange={(e) => setBasics((p) => ({ ...p, city: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country *</label>
            <input
              type="text"
              value={basics.country}
              onChange={(e) => setBasics((p) => ({ ...p, country: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Timezone</label>
            <input
              type="text"
              value={basics.timezone}
              onChange={(e) => setBasics((p) => ({ ...p, timezone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={basics.address}
              onChange={(e) => setBasics((p) => ({ ...p, address: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Region</label>
            <select
              value={basics.region_id}
              onChange={(e) => setBasics((p) => ({ ...p, region_id: e.target.value }))}
              className={inputClass}
            >
              <option value="">— none —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Booking URL</label>
            <input
              type="url"
              value={basics.booking_url}
              onChange={(e) => setBasics((p) => ({ ...p, booking_url: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Branding & Aria ── */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h3 className={sectionHeaderClass}>Branding &amp; Aria</h3>
          <div className="flex items-center gap-3">
            <SaveIndicator status={brandingSave} error={brandingErr} />
            <button
              type="button"
              disabled={brandingSave === 'saving'}
              onClick={() => saveSection(branding, setBrandingSave, setBrandingErr)}
              className={primaryBtnClass}
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Concierge Name</label>
            <input
              type="text"
              value={branding.concierge_name}
              onChange={(e) => setBranding((p) => ({ ...p, concierge_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Concierge Tone</label>
            <select
              value={branding.concierge_tone}
              onChange={(e) => setBranding((p) => ({ ...p, concierge_tone: e.target.value }))}
              className={inputClass}
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
              value={branding.accent_color}
              onChange={(e) => setBranding((p) => ({ ...p, accent_color: e.target.value }))}
              className={inputClass}
              placeholder="#C9A96E"
            />
          </div>
          <div>
            <label className={labelClass}>Logo URL</label>
            <input
              type="url"
              value={branding.logo_url}
              onChange={(e) => setBranding((p) => ({ ...p, logo_url: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Hero Image URL</label>
            <input
              type="url"
              value={branding.hero_image_url}
              onChange={(e) => setBranding((p) => ({ ...p, hero_image_url: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Welcome Message</label>
            <textarea
              value={branding.welcome_message}
              onChange={(e) => setBranding((p) => ({ ...p, welcome_message: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 3: Policies ── */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h3 className={sectionHeaderClass}>Policies</h3>
          <div className="flex items-center gap-3">
            <SaveIndicator status={policiesSave} error={policiesErr} />
            <button
              type="button"
              disabled={policiesSave === 'saving'}
              onClick={() => saveSection(policies, setPoliciesSave, setPoliciesErr)}
              className={primaryBtnClass}
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Check-in Time</label>
            <input
              type="text"
              value={policies.checkin_time}
              onChange={(e) => setPolicies((p) => ({ ...p, checkin_time: e.target.value }))}
              className={inputClass}
              placeholder="e.g. 15:00"
            />
          </div>
          <div>
            <label className={labelClass}>Check-out Time</label>
            <input
              type="text"
              value={policies.checkout_time}
              onChange={(e) => setPolicies((p) => ({ ...p, checkout_time: e.target.value }))}
              className={inputClass}
              placeholder="e.g. 11:00"
            />
          </div>
          <div>
            <label className={labelClass}>WiFi Name</label>
            <input
              type="text"
              value={policies.wifi_name}
              onChange={(e) => setPolicies((p) => ({ ...p, wifi_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>WiFi Password</label>
            <input
              type="text"
              value={policies.wifi_password}
              onChange={(e) => setPolicies((p) => ({ ...p, wifi_password: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Cancellation Policy</label>
            <textarea
              value={policies.cancellation_policy}
              onChange={(e) => setPolicies((p) => ({ ...p, cancellation_policy: e.target.value }))}
              rows={3}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pet Policy</label>
            <textarea
              value={policies.pet_policy}
              onChange={(e) => setPolicies((p) => ({ ...p, pet_policy: e.target.value }))}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Smoking Policy</label>
            <textarea
              value={policies.smoking_policy}
              onChange={(e) => setPolicies((p) => ({ ...p, smoking_policy: e.target.value }))}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section 4: PMS Config ── */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h3 className={sectionHeaderClass}>PMS Config</h3>
          <div className="flex items-center gap-3">
            <SaveIndicator status={pmsSave} error={pmsErr} />
            <button
              type="button"
              disabled={pmsSave === 'saving'}
              onClick={() => saveSection(pms, setPmsSave, setPmsErr)}
              className={primaryBtnClass}
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>PMS Provider</label>
            <select
              value={pms.pms_provider}
              onChange={(e) => setPms((p) => ({ ...p, pms_provider: e.target.value }))}
              className={inputClass}
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
              value={pms.webhook_secret}
              onChange={(e) => setPms((p) => ({ ...p, webhook_secret: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className={labelClass + ' mb-0'}>Active</label>
            <button
              type="button"
              onClick={() => setPms((p) => ({ ...p, pms_is_active: !p.pms_is_active }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                pms.pms_is_active ? 'bg-[#C9A84C]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  pms.pms_is_active ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-[13px] text-white/50">
              {pms.pms_is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 5: Amenities Manager ── */}
      <section className={cardClass}>
        <h3 className={sectionHeaderClass}>Amenities</h3>

        {/* Amenities list */}
        {amenities.length > 0 ? (
          <div className="space-y-2">
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-white/80 font-medium truncate">{amenity.name}</p>
                  <p className="text-[11px] text-white/40">
                    {amenity.category}
                    {amenity.availability_hours ? ` · ${amenity.availability_hours}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteAmenity(amenity.id)}
                  className="ml-3 flex-shrink-0 text-white/30 hover:text-rose-400 transition-colors text-[16px] leading-none"
                  aria-label={`Delete ${amenity.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-white/30">No amenities yet.</p>
        )}

        {/* Add amenity form */}
        <div className="pt-4 border-t border-white/[0.06] space-y-4">
          <h4 className="text-[11px] font-medium text-white/50 uppercase tracking-[0.14em]">
            Add Amenity
          </h4>
          <form onSubmit={(e) => void handleAddAmenity(e)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  value={amenityForm.category}
                  onChange={(e) =>
                    setAmenityForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. Spa"
                />
              </div>
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={amenityForm.name}
                  onChange={(e) => setAmenityForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={amenityForm.description}
                  onChange={(e) =>
                    setAmenityForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Hours</label>
                <input
                  type="text"
                  value={amenityForm.availability_hours}
                  onChange={(e) =>
                    setAmenityForm((p) => ({ ...p, availability_hours: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. 09:00–21:00"
                />
              </div>
              <div>
                <label className={labelClass}>Location Hint</label>
                <input
                  type="text"
                  value={amenityForm.location_hint}
                  onChange={(e) =>
                    setAmenityForm((p) => ({ ...p, location_hint: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. Floor 3"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={amenitySave === 'saving' || !amenityForm.name}
                className={primaryBtnClass}
              >
                Add Amenity
              </button>
              <SaveIndicator status={amenitySave} error={amenityErr} />
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
