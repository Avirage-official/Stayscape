'use client';

/**
 * /hotel-admin/policies
 *
 * Hotel admin Policies page.
 * Lets hotel admins configure:
 *   - Stay info  (check-in/out times, Wi-Fi)
 *   - Laundry policy
 *   - Late checkout policy and fee
 *   - Other policies  (cancellation, pets, smoking)
 *
 * Data is read from / written to:
 *   hotel_policies columns  -> checkin_time, checkout_time, wifi_name, wifi_password,
 *                              cancellation_policy, pet_policy, smoking_policy
 *   extra_policies jsonb    -> laundry_policy, late_checkout_policy, late_checkout_fee
 */

import { useEffect, useRef, useState } from 'react';
import { useHotelAdmin } from '@/lib/context/hotel-admin-context';
import { getSupabaseBrowser } from '@/lib/supabase/client';

// --- Types ---

interface PoliciesForm {
  checkin_time: string;
  checkout_time: string;
  wifi_name: string;
  wifi_password: string;
  laundry_policy: string;
  late_checkout_policy: string;
  late_checkout_fee: string;
  cancellation_policy: string;
  pet_policy: string;
  smoking_policy: string;
}

const EMPTY: PoliciesForm = {
  checkin_time: '',
  checkout_time: '',
  wifi_name: '',
  wifi_password: '',
  laundry_policy: '',
  late_checkout_policy: '',
  late_checkout_fee: '',
  cancellation_policy: '',
  pet_policy: '',
  smoking_policy: '',
};

// --- Helpers ---

async function getToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.access_token ?? null;
}

// --- Shared style atoms ---

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/20 transition-colors resize-none';

const labelCls = 'block text-[11px] font-medium tracking-widest uppercase text-white/40 mb-2';

const sectionCls =
  'rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col gap-5';

const sectionHeadCls = 'text-[13px] font-semibold text-white/80 mb-1';
const sectionSubCls = 'text-[12px] text-white/35 mb-4 leading-relaxed';

// --- Component ---

export default function PoliciesPage() {
  // useHotelAdmin gives access to propertyId, hotelName, adminName
  // from HotelAdminProvider in the authenticated layout.
  // We don't need propertyId here directly -- the API resolves it
  // from the auth token server-side -- but the hook validates we're
  // inside the provider.
  useHotelAdmin();

  const [form, setForm] = useState<PoliciesForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const json = (await res.json()) as {
          policies: Record<string, unknown>;
        };
        const p = json.policies ?? {};
        const extra = (p.extra_policies ?? {}) as Record<string, unknown>;
        if (!cancelled) {
          setForm({
            checkin_time: (p.checkin_time as string) ?? '',
            checkout_time: (p.checkout_time as string) ?? '',
            wifi_name: (p.wifi_name as string) ?? '',
            wifi_password: (p.wifi_password as string) ?? '',
            laundry_policy: (extra.laundry_policy as string) ?? '',
            late_checkout_policy: (extra.late_checkout_policy as string) ?? '',
            late_checkout_fee: (extra.late_checkout_fee as string) ?? '',
            cancellation_policy: (p.cancellation_policy as string) ?? '',
            pet_policy: (p.pet_policy as string) ?? '',
            smoking_policy: (p.smoking_policy as string) ?? '',
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

  function field<K extends keyof PoliciesForm>(key: K) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function showToast(msg: string, ok: boolean) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

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
          These settings are shown to guests when they request services. Keep them up to date.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Stay Info */}
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
              <input
                type="text"
                placeholder="e.g. StayScape_Guest"
                className={inputCls}
                {...field('wifi_name')}
              />
            </div>
            <div>
              <label className={labelCls}>Wi-Fi password</label>
              <input
                type="text"
                placeholder="e.g. welcome2025"
                className={inputCls}
                {...field('wifi_password')}
              />
            </div>
          </div>
        </section>

        {/* Laundry */}
        <section className={sectionCls}>
          <div>
            <p className={sectionHeadCls}>Laundry Policy</p>
            <p className={sectionSubCls}>
              Shown to guests before they submit a laundry request - pricing, turnaround time,
              and any notes about delicate items.
            </p>
          </div>
          <div>
            <label className={labelCls}>Policy text</label>
            <textarea
              rows={4}
              placeholder="e.g. Standard turnaround is 24 hours. Express (4-hour) service available at RM 15 extra. Delicate items handled separately. Pricing from RM 5 per item."
              className={inputCls}
              {...field('laundry_policy')}
            />
          </div>
        </section>

        {/* Late Checkout */}
        <section className={sectionCls}>
          <div>
            <p className={sectionHeadCls}>Late Checkout</p>
            <p className={sectionSubCls}>
              Guests see this before requesting a late checkout. Be specific about conditions,
              fees, and availability so expectations are clear.
            </p>
          </div>
          <div>
            <label className={labelCls}>Policy text</label>
            <textarea
              rows={4}
              placeholder="e.g. Late checkout until 2pm is complimentary if the room is not pre-booked. Beyond 2pm a half-day rate applies. Subject to availability."
              className={inputCls}
              {...field('late_checkout_policy')}
            />
          </div>
          <div>
            <label className={labelCls}>Fee (if applicable)</label>
            <input
              type="text"
              placeholder="e.g. RM 80 per hour / RM 150 half-day rate"
              className={inputCls}
              {...field('late_checkout_fee')}
            />
          </div>
        </section>

        {/* Other Policies */}
        <section className={sectionCls}>
          <div>
            <p className={sectionHeadCls}>Other Policies</p>
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

      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-[13px] font-medium z-50 shadow-xl transition-all ${
            toast.ok
              ? 'bg-white/90 text-[#0d0d0d]'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
