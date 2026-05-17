'use client';

/**
 * /hotel-admin/settings
 *
 * Phase 1 Settings — four sections:
 *   1. Property Identity  — name, city, country, address (PATCH /api/hotel-admin/settings/property)
 *   2. Timezone           — IANA timezone dropdown        (PATCH /api/hotel-admin/settings/property)
 *   3. Aria Concierge     — name + tone                  (PATCH /api/hotel-admin/settings/branding)
 *   4. Accent Colour      — hex colour picker             (PATCH /api/hotel-admin/settings/branding)
 */

import { useEffect, useState } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Check, Loader2, Globe, Palette, Bot, Building2 } from 'lucide-react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], display: 'swap' });
const dmSans    = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });

// IANA timezones most relevant for a hotel platform — full list kept concise
const TIMEZONES = [
  { label: 'Singapore (UTC+8)',         value: 'Asia/Singapore' },
  { label: 'Kuala Lumpur (UTC+8)',       value: 'Asia/Kuala_Lumpur' },
  { label: 'Jakarta (UTC+7)',            value: 'Asia/Jakarta' },
  { label: 'Bangkok (UTC+7)',            value: 'Asia/Bangkok' },
  { label: 'Ho Chi Minh City (UTC+7)',   value: 'Asia/Ho_Chi_Minh' },
  { label: 'Manila (UTC+8)',             value: 'Asia/Manila' },
  { label: 'Hong Kong (UTC+8)',          value: 'Asia/Hong_Kong' },
  { label: 'Tokyo (UTC+9)',              value: 'Asia/Tokyo' },
  { label: 'Seoul (UTC+9)',              value: 'Asia/Seoul' },
  { label: 'Shanghai / Beijing (UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Dubai (UTC+4)',              value: 'Asia/Dubai' },
  { label: 'Mumbai (UTC+5:30)',          value: 'Asia/Kolkata' },
  { label: 'Colombo (UTC+5:30)',         value: 'Asia/Colombo' },
  { label: 'Dhaka (UTC+6)',              value: 'Asia/Dhaka' },
  { label: 'Bali (UTC+8)',               value: 'Asia/Makassar' },
  { label: 'Sydney (UTC+10/11)',         value: 'Australia/Sydney' },
  { label: 'Auckland (UTC+12/13)',       value: 'Pacific/Auckland' },
  { label: 'London (UTC+0/1)',           value: 'Europe/London' },
  { label: 'Paris / Berlin (UTC+1/2)',   value: 'Europe/Paris' },
  { label: 'New York (UTC-5/-4)',        value: 'America/New_York' },
  { label: 'Los Angeles (UTC-8/-7)',     value: 'America/Los_Angeles' },
  { label: 'UTC',                        value: 'UTC' },
];

const ARIA_TONES = [
  { value: 'warm',    label: 'Warm',    desc: 'Friendly, personal, like a trusted concierge' },
  { value: 'formal',  label: 'Formal',  desc: 'Polished and professional, five-star hotel tone' },
  { value: 'playful', label: 'Playful', desc: 'Light and breezy, perfect for boutique hotels' },
];

const PRESET_COLOURS = [
  '#C9A84C', '#B8860B', '#D4AF37',  // Golds
  '#01696F', '#0891B2', '#0369A1',  // Teals / Blues
  '#7C3AED', '#9333EA', '#A855F7',  // Purples
  '#DC2626', '#E11D48', '#F97316',  // Reds / Orange
  '#16A34A', '#059669',              // Greens
  '#374151', '#1F2937',              // Dark neutrals
];

interface Settings {
  // property
  name: string;
  city: string;
  country: string;
  address: string;
  timezone: string;
  // branding
  concierge_name: string;
  concierge_tone: string;
  accent_color: string;
}

async function getToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  return (await sb.auth.getSession()).data.session?.access_token ?? null;
}

export default function SettingsPage() {
  const { propertyId } = useHotelAdmin();

  const [settings, setSettings] = useState<Settings>({
    name: '', city: '', country: '', address: '', timezone: 'Asia/Singapore',
    concierge_name: 'Aria', concierge_tone: 'warm', accent_color: '#C9A84C',
  });
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null); // section key
  const [saved,  setSaved]            = useState<string | null>(null);
  const [error,  setError]            = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/hotel-admin/settings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as Partial<Settings>;
        if (!cancelled) setSettings((s) => ({ ...s, ...data }));
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  const flash = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2400);
  };

  const patch = async (section: string, body: Partial<Settings>) => {
    setSaving(section); setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/hotel-admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ section, ...body }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'Save failed');
      }
      flash(section);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(null);
    }
  };

  const field = (key: keyof Settings) => ({
    value: settings[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSettings((s) => ({ ...s, [key]: e.target.value })),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="animate-spin text-white/20" />
      </div>
    );
  }

  const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-[#C9A84C]/50 transition-colors';
  const labelCls = 'block text-[11px] font-medium tracking-widest uppercase text-white/30 mb-1.5';

  return (
    <div className={`${dmSans.className} p-6 md:p-8 max-w-2xl`}>
      {/* Header */}
      <div className="mb-8">
        <p className={`${cormorant.className} text-[28px] font-400 text-white/90 leading-tight`}>Settings</p>
        <p className="text-[13px] text-white/30 font-light mt-1">Manage your property identity, timezone, and Aria concierge.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>
      )}

      {/* ── Section 1: Property Identity ── */}
      <Section icon={<Building2 size={15} />} title="Property Identity" desc="Basic details shown to guests and staff.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Hotel Name</label>
            <input className={inputCls} type="text" placeholder="The Grand Marina" {...field('name')} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} type="text" placeholder="Singapore" {...field('city')} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} type="text" placeholder="Singapore" {...field('country')} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Address</label>
            <input className={inputCls} type="text" placeholder="1 Marina Boulevard, Singapore 018989" {...field('address')} />
          </div>
        </div>
        <SaveRow
          saving={saving === 'property'}
          saved={saved === 'property'}
          onSave={() => patch('property', { name: settings.name, city: settings.city, country: settings.country, address: settings.address })}
        />
      </Section>

      {/* ── Section 2: Timezone ── */}
      <Section icon={<Globe size={15} />} title="Timezone" desc="All service hours (room service, housekeeping, etc.) are evaluated in this timezone. Guests see availability in the hotel's local time regardless of where they are browsing from.">
        <div>
          <label className={labelCls}>Hotel Timezone</label>
          <select
            className={`${inputCls} appearance-none cursor-pointer`}
            value={settings.timezone}
            onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-white/20 leading-relaxed">
            Current hotel time: <span className="text-white/40 font-medium">{new Intl.DateTimeFormat('en-GB', { timeZone: settings.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, weekday: 'short' }).format(new Date())}</span>
          </p>
        </div>
        <SaveRow
          saving={saving === 'timezone'}
          saved={saved === 'timezone'}
          onSave={() => patch('timezone', { timezone: settings.timezone })}
        />
      </Section>

      {/* ── Section 3: Aria Concierge ── */}
      <Section icon={<Bot size={15} />} title="Aria Concierge" desc="Personalise how your AI concierge introduces herself to guests.">
        <div className="mb-4">
          <label className={labelCls}>Concierge Name</label>
          <input className={inputCls} type="text" placeholder="Aria" maxLength={32} {...field('concierge_name')} />
          <p className="mt-1.5 text-[11px] text-white/20">Guests will see this name in the chat header. Keep it to one word.</p>
        </div>
        <div>
          <label className={labelCls}>Tone of Voice</label>
          <div className="flex flex-col gap-2">
            {ARIA_TONES.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, concierge_tone: tone.value }))}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  settings.concierge_tone === tone.value
                    ? 'border-[#C9A84C]/40 bg-[#C9A84C]/08'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                  settings.concierge_tone === tone.value ? 'border-[#C9A84C] bg-[#C9A84C]' : 'border-white/20'
                }`}>
                  {settings.concierge_tone === tone.value && <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white/80">{tone.label}</p>
                  <p className="text-[12px] text-white/30 font-light mt-0.5">{tone.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <SaveRow
          saving={saving === 'branding'}
          saved={saved === 'branding'}
          onSave={() => patch('branding', { concierge_name: settings.concierge_name, concierge_tone: settings.concierge_tone, accent_color: settings.accent_color })}
        />
      </Section>

      {/* ── Section 4: Accent Colour ── */}
      <Section icon={<Palette size={15} />} title="Accent Colour" desc="The gold highlight colour used throughout the guest app. Shown on buttons, icons, and active states.">
        {/* Presets */}
        <div className="mb-4">
          <label className={labelCls}>Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, accent_color: c }))}
                style={{ background: c }}
                className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                  settings.accent_color === c ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#0d0d0d] scale-110' : ''
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        {/* Custom hex */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/10" style={{ background: settings.accent_color }} />
          <div className="flex-1">
            <label className={labelCls}>Custom Hex</label>
            <input
              className={inputCls}
              type="text"
              placeholder="#C9A84C"
              value={settings.accent_color}
              onChange={(e) => setSettings((s) => ({ ...s, accent_color: e.target.value }))}
              maxLength={7}
            />
          </div>
          <input
            type="color"
            value={settings.accent_color}
            onChange={(e) => setSettings((s) => ({ ...s, accent_color: e.target.value }))}
            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            aria-label="Pick colour"
          />
        </div>
        <SaveRow
          saving={saving === 'branding'}
          saved={saved === 'branding'}
          onSave={() => patch('branding', { concierge_name: settings.concierge_name, concierge_tone: settings.concierge_tone, accent_color: settings.accent_color })}
        />
      </Section>
    </div>
  );
}

// ── Sub-components ──

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/30">{icon}</span>
        <p className="text-[13px] font-semibold text-white/70">{title}</p>
      </div>
      <p className="text-[12px] text-white/25 font-light leading-relaxed mb-5">{desc}</p>
      {children}
    </div>
  );
}

function SaveRow({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end mt-5 pt-4 border-t border-white/[0.06]">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
        style={{ background: saved ? 'rgba(22,163,74,0.15)' : 'rgba(201,168,76,0.12)', color: saved ? '#4ade80' : '#C9A84C', border: `1px solid ${saved ? 'rgba(22,163,74,0.25)' : 'rgba(201,168,76,0.2)'}` }}
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
      </button>
    </div>
  );
}
