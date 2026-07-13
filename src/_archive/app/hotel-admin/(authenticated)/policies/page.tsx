'use client';

/**
 * /hotel-admin/policies
 *
 * Rebuilt policies page with:
 * - Per-service toggles (enabled/disabled)
 * - Structured time fields enforced per service
 * - Conditional fields only show when service is enabled
 * - Stay Info + General Policies always visible
 */

import { useEffect, useRef, useState } from 'react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PoliciesForm {
  // Stay info (always shown)
  checkin_time: string;
  checkout_time: string;
  wifi_name: string;
  wifi_password: string;

  // General policies (always shown)
  cancellation_policy: string;
  pet_policy: string;
  smoking_policy: string;

  // Concierge
  concierge_enabled: boolean;
  concierge_hours_start: string;
  concierge_hours_end: string;

  // Housekeeping
  housekeeping_enabled: boolean;
  housekeeping_start: string;
  housekeeping_end: string;
  turndown_enabled: boolean;
  turndown_start: string;
  turndown_end: string;

  // Room Service
  room_service_enabled: boolean;
  room_service_start: string;
  room_service_end: string;
  room_service_last_order: string;

  // Laundry
  laundry_enabled: boolean;
  laundry_pickup_start: string;
  laundry_pickup_cutoff: string;
  laundry_return_time: string;
  laundry_express_enabled: boolean;
  laundry_express_hours: string;
  laundry_policy: string;

  // Maintenance
  maintenance_enabled: boolean;
  maintenance_start: string;
  maintenance_end: string;
  maintenance_emergency_24hr: boolean;

  // Transport
  transport_enabled: boolean;
  transport_hours_start: string;
  transport_hours_end: string;
  transport_advance_notice_mins: string;

  // Luggage Pickup
  luggage_pickup_enabled: boolean;
  luggage_pickup_start: string;
  luggage_pickup_end: string;
  luggage_pickup_fee: string;

  // Late Checkout
  late_checkout_enabled: boolean;
  late_checkout_max_time: string;
  late_checkout_free_if_available: boolean;
  late_checkout_fee: string;
  late_checkout_policy: string;

  // Restaurants
  restaurant_enabled: boolean;
  restaurant_reservation_enabled: boolean;
}

const EMPTY: PoliciesForm = {
  checkin_time: '',
  checkout_time: '',
  wifi_name: '',
  wifi_password: '',
  cancellation_policy: '',
  pet_policy: '',
  smoking_policy: '',
  concierge_enabled: true,
  concierge_hours_start: '',
  concierge_hours_end: '',
  housekeeping_enabled: true,
  housekeeping_start: '',
  housekeeping_end: '',
  turndown_enabled: false,
  turndown_start: '',
  turndown_end: '',
  room_service_enabled: false,
  room_service_start: '',
  room_service_end: '',
  room_service_last_order: '',
  laundry_enabled: false,
  laundry_pickup_start: '',
  laundry_pickup_cutoff: '',
  laundry_return_time: '',
  laundry_express_enabled: false,
  laundry_express_hours: '',
  laundry_policy: '',
  maintenance_enabled: true,
  maintenance_start: '',
  maintenance_end: '',
  maintenance_emergency_24hr: false,
  transport_enabled: false,
  transport_hours_start: '',
  transport_hours_end: '',
  transport_advance_notice_mins: '',
  luggage_pickup_enabled: false,
  luggage_pickup_start: '',
  luggage_pickup_end: '',
  luggage_pickup_fee: '',
  late_checkout_enabled: false,
  late_checkout_max_time: '',
  late_checkout_free_if_available: false,
  late_checkout_fee: '',
  late_checkout_policy: '',
  restaurant_enabled: false,
  restaurant_reservation_enabled: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.access_token ?? null;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

// ─── Style atoms ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/20 transition-colors resize-none';

const labelCls = 'block text-[11px] font-medium tracking-widest uppercase text-white/40 mb-2';

const sectionCls =
  'rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col gap-5';

const sectionHeadCls = 'text-[13px] font-semibold text-white/80';
const sectionSubCls = 'text-[12px] text-white/35 leading-relaxed mt-1';

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start justify-between w-full text-left gap-4 group"
      aria-pressed={checked}
    >
      <div>
        <p className={sectionHeadCls}>{label}</p>
        {sub && <p className={sectionSubCls}>{sub}</p>}
      </div>
      <div
        className="relative flex-shrink-0 mt-0.5"
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? '#C9A84C' : 'rgba(255,255,255,0.1)',
          transition: 'background 0.2s',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: checked ? '#0d0d0d' : 'rgba(255,255,255,0.4)',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PoliciesPage() {
  useHotelAdmin();

  const [form, setForm] = useState<PoliciesForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      try {
        const res = await fetch('/api/hotel-admin/policies', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { policies: Record<string, unknown> };
        const p = json.policies ?? {};
        const extra = (p.extra_policies ?? {}) as Record<string, unknown>;
        if (!cancelled) {
          setForm({
            checkin_time: str(p.checkin_time),
            checkout_time: str(p.checkout_time),
            wifi_name: str(p.wifi_name),
            wifi_password: str(p.wifi_password),
            cancellation_policy: str(p.cancellation_policy),
            pet_policy: str(p.pet_policy),
            smoking_policy: str(p.smoking_policy),
            concierge_enabled: bool(p.concierge_enabled, true),
            concierge_hours_start: str(p.concierge_hours_start),
            concierge_hours_end: str(p.concierge_hours_end),
            housekeeping_enabled: bool(p.housekeeping_enabled, true),
            housekeeping_start: str(p.housekeeping_start),
            housekeeping_end: str(p.housekeeping_end),
            turndown_enabled: bool(p.turndown_enabled, false),
            turndown_start: str(p.turndown_start),
            turndown_end: str(p.turndown_end),
            room_service_enabled: bool(p.room_service_enabled, false),
            room_service_start: str(p.room_service_start),
            room_service_end: str(p.room_service_end),
            room_service_last_order: str(p.room_service_last_order),
            laundry_enabled: bool(p.laundry_enabled, false),
            laundry_pickup_start: str(p.laundry_pickup_start),
            laundry_pickup_cutoff: str(p.laundry_pickup_cutoff),
            laundry_return_time: str(p.laundry_return_time),
            laundry_express_enabled: bool(p.laundry_express_enabled, false),
            laundry_express_hours: str(p.laundry_express_hours),
            laundry_policy: str(extra.laundry_policy),
            maintenance_enabled: bool(p.maintenance_enabled, true),
            maintenance_start: str(p.maintenance_start),
            maintenance_end: str(p.maintenance_end),
            maintenance_emergency_24hr: bool(p.maintenance_emergency_24hr, false),
            transport_enabled: bool(p.transport_enabled, false),
            transport_hours_start: str(p.transport_hours_start),
            transport_hours_end: str(p.transport_hours_end),
            transport_advance_notice_mins: str(p.transport_advance_notice_mins),
            luggage_pickup_enabled: bool(p.luggage_pickup_enabled, false),
            luggage_pickup_start: str(p.luggage_pickup_start),
            luggage_pickup_end: str(p.luggage_pickup_end),
            luggage_pickup_fee: str(p.luggage_pickup_fee),
            late_checkout_enabled: bool(p.late_checkout_enabled, false),
            late_checkout_max_time: str(p.late_checkout_max_time),
            late_checkout_free_if_available: bool(p.late_checkout_free_if_available, false),
            late_checkout_fee: str(extra.late_checkout_fee),
            late_checkout_policy: str(extra.late_checkout_policy),
            restaurant_enabled: bool(p.restaurant_enabled, false),
            restaurant_reservation_enabled: bool(p.restaurant_reservation_enabled, false),
          });
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Field helpers ──
  function field<K extends keyof PoliciesForm>(key: K) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function toggle<K extends keyof PoliciesForm>(key: K) {
    return (v: boolean) => setForm((f) => ({ ...f, [key]: v }));
  }

  function showToast(msg: string, ok: boolean) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { showToast('Session expired - please sign in again.', false); return; }
      const res = await fetch('/api/hotel-admin/policies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(err.error ?? 'Failed to save.', false);
      } else {
        showToast('Policies saved.', true);
      }
    } catch {
      showToast('Something went wrong.', false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-[20px] font-semibold text-white/90">Hotel Policies</h1>
        <p className="text-[13px] text-white/40 mt-1">
          Configure which services your hotel offers and set time boundaries. Guests only see services you have enabled.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Stay Info (always shown) ── */}
        <section className={sectionCls}>
          <div>
            <p className={sectionHeadCls}>Stay Info</p>
            <p className={sectionSubCls}>Displayed in the guest app welcome screen and on request confirmations.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Check-in time</label>
              <input type="time" className={inputCls} {...field('checkin_time')} />
            </div>
            <div>
              <label className={labelCls}>Check-out time</label>
              <input type="time" className={inputCls} {...field('checkout_time')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Wi-Fi network name</label>
              <input type="text" placeholder="e.g. Hotel_Guest" className={inputCls} {...field('wifi_name')} />
            </div>
            <div>
              <label className={labelCls}>Wi-Fi password</label>
              <input type="text" placeholder="e.g. welcome2026" className={inputCls} {...field('wifi_password')} />
            </div>
          </div>
        </section>

        {/* ── Concierge ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.concierge_enabled}
            onChange={toggle('concierge_enabled')}
            label="Concierge / Aria"
            sub="When enabled, guests can chat with Aria and make general requests."
          />
          {form.concierge_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/[0.05]">
              <div>
                <label className={labelCls}>Available from</label>
                <input type="time" className={inputCls} {...field('concierge_hours_start')} />
              </div>
              <div>
                <label className={labelCls}>Available until</label>
                <input type="time" className={inputCls} {...field('concierge_hours_end')} />
              </div>
            </div>
          )}
        </section>

        {/* ── Housekeeping ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.housekeeping_enabled}
            onChange={toggle('housekeeping_enabled')}
            label="Housekeeping"
            sub="Guests can request room cleaning, towels, amenities and more."
          />
          {form.housekeeping_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Service from</label>
                  <input type="time" className={inputCls} {...field('housekeeping_start')} />
                </div>
                <div>
                  <label className={labelCls}>Service until</label>
                  <input type="time" className={inputCls} {...field('housekeeping_end')} />
                </div>
              </div>
              {/* Turndown sub-toggle */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-4">
                <Toggle
                  checked={form.turndown_enabled}
                  onChange={toggle('turndown_enabled')}
                  label="Turndown service"
                  sub="Evening room preparation (pillows, towels, bed turn)."
                />
                {form.turndown_enabled && (
                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/[0.05]">
                    <div>
                      <label className={labelCls}>Turndown from</label>
                      <input type="time" className={inputCls} {...field('turndown_start')} />
                    </div>
                    <div>
                      <label className={labelCls}>Turndown until</label>
                      <input type="time" className={inputCls} {...field('turndown_end')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Room Service ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.room_service_enabled}
            onChange={toggle('room_service_enabled')}
            label="Room Service"
            sub="In-room dining. Separate from housekeeping."
          />
          {form.room_service_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/[0.05]">
              <div>
                <label className={labelCls}>Available from</label>
                <input type="time" className={inputCls} {...field('room_service_start')} />
              </div>
              <div>
                <label className={labelCls}>Available until</label>
                <input type="time" className={inputCls} {...field('room_service_end')} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Last order time</label>
                <input type="time" className={inputCls} {...field('room_service_last_order')} />
                <p className="text-[11px] text-white/30 mt-1.5">Orders placed after this time will not be accepted.</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Laundry ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.laundry_enabled}
            onChange={toggle('laundry_enabled')}
            label="Laundry"
            sub="Guests can submit laundry requests with pickup time constraints enforced."
          />
          {form.laundry_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Pickup available from</label>
                  <input type="time" className={inputCls} {...field('laundry_pickup_start')} />
                </div>
                <div>
                  <label className={labelCls}>Pickup cutoff (last pickup)</label>
                  <input type="time" className={inputCls} {...field('laundry_pickup_cutoff')} />
                  <p className="text-[11px] text-white/30 mt-1.5">Requests after this time are for next day.</p>
                </div>
              </div>
              <div>
                <label className={labelCls}>Return time (items returned by)</label>
                <input type="time" className={inputCls} {...field('laundry_return_time')} />
              </div>
              {/* Express sub-toggle */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-4">
                <Toggle
                  checked={form.laundry_express_enabled}
                  onChange={toggle('laundry_express_enabled')}
                  label="Express laundry"
                  sub="Same-day faster turnaround at an additional charge."
                />
                {form.laundry_express_enabled && (
                  <div className="pt-1 border-t border-white/[0.05]">
                    <label className={labelCls}>Express turnaround (hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      placeholder="e.g. 4"
                      className={inputCls}
                      {...field('laundry_express_hours')}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Policy notes (shown to guest)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Pricing from RM 5/item. Delicate items handled separately. No liability for pre-existing damage."
                  className={inputCls}
                  {...field('laundry_policy')}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Maintenance ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.maintenance_enabled}
            onChange={toggle('maintenance_enabled')}
            label="Maintenance"
            sub="Guests can report issues — AC, plumbing, lighting, etc."
          />
          {form.maintenance_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Service from</label>
                  <input type="time" className={inputCls} {...field('maintenance_start')} />
                </div>
                <div>
                  <label className={labelCls}>Service until</label>
                  <input type="time" className={inputCls} {...field('maintenance_end')} />
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <Toggle
                  checked={form.maintenance_emergency_24hr}
                  onChange={toggle('maintenance_emergency_24hr')}
                  label="24-hour emergency maintenance"
                  sub="Critical issues (flooding, no power) can be reported at any time."
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Transport ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.transport_enabled}
            onChange={toggle('transport_enabled')}
            label="Transport / Taxi"
            sub="Guests can request taxis or hotel transport."
          />
          {form.transport_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Available from</label>
                  <input type="time" className={inputCls} {...field('transport_hours_start')} />
                </div>
                <div>
                  <label className={labelCls}>Available until</label>
                  <input type="time" className={inputCls} {...field('transport_hours_end')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Minimum advance notice (minutes)</label>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  placeholder="e.g. 60"
                  className={inputCls}
                  {...field('transport_advance_notice_mins')}
                />
                <p className="text-[11px] text-white/30 mt-1.5">Guests cannot book transport with less than this notice.</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Luggage Pickup ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.luggage_pickup_enabled}
            onChange={toggle('luggage_pickup_enabled')}
            label="Luggage Pickup"
            sub="Staff collect bags from the guest room. Only enable if your hotel offers this."
          />
          {form.luggage_pickup_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Available from</label>
                  <input type="time" className={inputCls} {...field('luggage_pickup_start')} />
                </div>
                <div>
                  <label className={labelCls}>Available until</label>
                  <input type="time" className={inputCls} {...field('luggage_pickup_end')} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Fee</label>
                <input
                  type="text"
                  placeholder="e.g. Complimentary / RM 5 per bag"
                  className={inputCls}
                  {...field('luggage_pickup_fee')}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Late Checkout ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.late_checkout_enabled}
            onChange={toggle('late_checkout_enabled')}
            label="Late Checkout"
            sub="Guests can request to stay past the standard checkout time."
          />
          {form.late_checkout_enabled && (
            <div className="flex flex-col gap-4 pt-1 border-t border-white/[0.05]">
              <div>
                <label className={labelCls}>Latest possible checkout time</label>
                <input type="time" className={inputCls} {...field('late_checkout_max_time')} />
                <p className="text-[11px] text-white/30 mt-1.5">Guests cannot request beyond this time.</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <Toggle
                  checked={form.late_checkout_free_if_available}
                  onChange={toggle('late_checkout_free_if_available')}
                  label="Offer free late checkout when available"
                  sub="When occupancy allows, late checkout is complimentary."
                />
              </div>
              <div>
                <label className={labelCls}>Fee (if applicable)</label>
                <input
                  type="text"
                  placeholder="e.g. RM 80 per hour / RM 150 half-day"
                  className={inputCls}
                  {...field('late_checkout_fee')}
                />
              </div>
              <div>
                <label className={labelCls}>Policy notes (shown to guest)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Late checkout subject to availability. Requests made the morning of checkout only."
                  className={inputCls}
                  {...field('late_checkout_policy')}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Restaurants & Bars ── */}
        <section className={sectionCls}>
          <Toggle
            checked={form.restaurant_enabled}
            onChange={toggle('restaurant_enabled')}
            label="Restaurants & Bars"
            sub="Show venue information and menus to guests in the app."
          />
          {form.restaurant_enabled && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 border-t border-white/[0.05]">
              <Toggle
                checked={form.restaurant_reservation_enabled}
                onChange={toggle('restaurant_reservation_enabled')}
                label="Accept table reservation requests"
                sub="Guests can send reservation requests through the app to your team."
              />
            </div>
          )}
        </section>

        {/* ── General Policies (always shown) ── */}
        <section className={sectionCls}>
          <div>
            <p className={sectionHeadCls}>General Policies</p>
            <p className={sectionSubCls}>Optional. Leave blank if not applicable for your property.</p>
          </div>
          <div>
            <label className={labelCls}>Cancellation policy</label>
            <textarea
              rows={3}
              placeholder="e.g. Free cancellation up to 48 hours before arrival."
              className={inputCls}
              {...field('cancellation_policy')}
            />
          </div>
          <div>
            <label className={labelCls}>Pet policy</label>
            <textarea
              rows={2}
              placeholder="e.g. Pets are not permitted on the property."
              className={inputCls}
              {...field('pet_policy')}
            />
          </div>
          <div>
            <label className={labelCls}>Smoking policy</label>
            <textarea
              rows={2}
              placeholder="e.g. Strictly non-smoking indoors. Designated area on Level B1."
              className={inputCls}
              {...field('smoking_policy')}
            />
          </div>
        </section>

      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl text-[13px] font-semibold bg-[#C9A84C] text-[#0d0d0d] hover:bg-[#d4b56a] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save policies'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-[13px] font-medium z-50 shadow-xl transition-all ${
            toast.ok ? 'bg-white/90 text-[#0d0d0d]' : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
