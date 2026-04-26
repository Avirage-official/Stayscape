/**
 * Admin — Hotel detail page
 *
 * Shows branding, policies, amenities, and PMS config for a single property.
 * Server component — no 'use client'.
 */

import Link from 'next/link';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/* ── Types ─────────────────────────────────────────────────────── */

interface PropertyRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  region_id: string | null;
}

interface BrandingRow {
  logo_url: string | null;
  accent_color: string;
  hero_image_url: string | null;
  welcome_message: string | null;
  subdomain_slug: string | null;
}

interface PoliciesRow {
  checkin_time: string | null;
  checkout_time: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  cancellation_policy: string | null;
  pet_policy: string | null;
  smoking_policy: string | null;
}

interface AmenityRow {
  id: string;
  category: string;
  name: string;
  availability_hours: string | null;
  location_hint: string | null;
  description: string | null;
}

interface PmsRow {
  provider: string;
  is_active: boolean;
  last_synced_at: string | null;
}

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDate(date: string | null): string {
  if (!date) return 'Never';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NullValue() {
  return <span className="text-white/30">Not set</span>;
}

function PolicyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">{label}</p>
      <p className="text-[13px] text-white/70">{value ?? <NullValue />}</p>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */

export default async function AdminHotelDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = getSupabaseAdmin();

  const [propertyRes, brandingRes, policiesRes, amenitiesRes, pmsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, city, country, address, region_id')
      .eq('id', propertyId)
      .maybeSingle(),
    supabase
      .from('hotel_branding')
      .select('logo_url, accent_color, hero_image_url, welcome_message, subdomain_slug')
      .eq('property_id', propertyId)
      .maybeSingle(),
    supabase
      .from('hotel_policies')
      .select(
        'checkin_time, checkout_time, wifi_name, wifi_password, cancellation_policy, pet_policy, smoking_policy',
      )
      .eq('property_id', propertyId)
      .maybeSingle(),
    supabase
      .from('hotel_amenities')
      .select('id, category, name, availability_hours, location_hint, description')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('pms_config')
      .select('provider, is_active, last_synced_at')
      .eq('property_id', propertyId)
      .maybeSingle(),
  ]);

  const property = propertyRes.data as PropertyRow | null;

  if (!property) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/properties"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors"
        >
          <span>←</span> Back to Hotels
        </Link>
        <p className="text-white/50 text-sm">Property not found.</p>
      </div>
    );
  }

  const branding = brandingRes.data as BrandingRow | null;
  const policies = policiesRes.data as PoliciesRow | null;
  const amenities = (amenitiesRes.data ?? []) as AmenityRow[];
  const pms = pmsRes.data as PmsRow | null;

  const pageTitle = [property.name, property.city].filter(Boolean).join(' — ');

  /* Group amenities by category */
  const amenityGroups = amenities.reduce<Record<string, AmenityRow[]>>((acc, item) => {
    const cat = item.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categoryCount = Object.keys(amenityGroups).length;

  const cardClass = 'rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4';

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/properties"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white/80 transition-colors mb-4"
        >
          <span>←</span> Back to Hotels
        </Link>
        <SectionHeader title={pageTitle} />
      </div>

      {/* ── Section 1: Branding ── */}
      <section className={cardClass}>
        <h3 className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]">
          Branding
        </h3>

        {branding ? (
          <div className="space-y-3">
            {/* Accent color */}
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1">
                Accent color
              </p>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded border border-white/20 flex-shrink-0"
                  style={{ background: branding.accent_color }}
                />
                <span className="text-[13px] text-white/70 font-mono">{branding.accent_color}</span>
              </div>
            </div>

            {/* Welcome message */}
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Welcome message
              </p>
              <p className="text-[13px] text-white/70">
                {branding.welcome_message ?? <NullValue />}
              </p>
            </div>

            {/* Subdomain slug */}
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Subdomain slug
              </p>
              <p className="text-[13px] text-white/70">
                {branding.subdomain_slug ?? <NullValue />}
              </p>
            </div>

            {/* Logo URL */}
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Logo URL
              </p>
              {branding.logo_url ? (
                <span className="text-[12px] text-emerald-400">Set</span>
              ) : (
                <span className="text-[12px] text-amber-400">Not set</span>
              )}
            </div>

            {/* Hero image */}
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Hero image
              </p>
              {branding.hero_image_url ? (
                <span className="text-[12px] text-emerald-400">Set</span>
              ) : (
                <span className="text-[12px] text-amber-400">Not set</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-amber-400">No branding configured yet</p>
        )}

        <p className="text-[11px] text-white/25 pt-2 border-t border-white/[0.06]">
          Edit branding via Supabase for now — UI editor coming soon
        </p>
      </section>

      {/* ── Section 2: Policies ── */}
      <section className={cardClass}>
        <h3 className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]">
          Policies
        </h3>

        {policies ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <PolicyField label="Check-in" value={policies.checkin_time} />
            <PolicyField label="Check-out" value={policies.checkout_time} />
            <PolicyField label="WiFi name" value={policies.wifi_name} />
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                WiFi password
              </p>
              <p className="text-[13px] text-white/70">
                {policies.wifi_password ? '••••••' : <NullValue />}
              </p>
            </div>
            <PolicyField label="Cancellation policy" value={policies.cancellation_policy} />
            <PolicyField label="Pet policy" value={policies.pet_policy} />
            <PolicyField label="Smoking policy" value={policies.smoking_policy} />
          </div>
        ) : (
          <p className="text-[12px] text-amber-400">No policies configured yet</p>
        )}

        <p className="text-[11px] text-white/25 pt-2 border-t border-white/[0.06]">
          Edit policies via Supabase for now — UI editor coming soon
        </p>
      </section>

      {/* ── Section 3: Amenities ── */}
      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]">
            Amenities
          </h3>
          {amenities.length > 0 && (
            <span className="text-[11px] text-white/35">
              {amenities.length} amenit{amenities.length === 1 ? 'y' : 'ies'} across{' '}
              {categoryCount} categor{categoryCount === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>

        {amenities.length > 0 ? (
          <div className="space-y-5">
            {Object.entries(amenityGroups).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] text-[#C9A84C]/60 uppercase tracking-[0.14em] mb-2">
                  {category}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2"
                    >
                      <p className="text-[13px] text-white/75 font-medium">{item.name}</p>
                      {item.availability_hours && (
                        <p className="text-[11px] text-white/40 mt-0.5">{item.availability_hours}</p>
                      )}
                      {item.location_hint && (
                        <p className="text-[11px] text-white/35 mt-0.5">{item.location_hint}</p>
                      )}
                      {item.description && (
                        <p className="text-[11px] text-white/30 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-amber-400">No amenities configured yet</p>
        )}

        <p className="text-[11px] text-white/25 pt-2 border-t border-white/[0.06]">
          Manage amenities via Supabase for now — UI editor coming soon
        </p>
      </section>

      {/* ── Section 4: PMS Config ── */}
      <section className={cardClass}>
        <h3 className="text-[11px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.16em]">
          PMS Config
        </h3>

        {pms ? (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Provider
              </p>
              <p className="text-[13px] text-white/70">{pms.provider}</p>
            </div>

            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-1">
                Status
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${pms.is_active ? 'bg-emerald-400' : 'bg-amber-400'}`}
                />
                <span className="text-[13px] text-white/70">
                  {pms.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-[0.14em] mb-0.5">
                Last synced
              </p>
              <p className="text-[13px] text-white/70">{formatDate(pms.last_synced_at)}</p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-amber-400">No PMS configured</p>
        )}

        <p className="text-[11px] text-white/25 pt-2 border-t border-white/[0.06]">
          PMS configuration managed by Stayscape team
        </p>
      </section>
    </div>
  );
}
