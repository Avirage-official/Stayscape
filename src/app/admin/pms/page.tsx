/**
 * /admin/pms
 *
 * Super-admin PMS integration overview.
 * Shows every property's PMS status at a glance — provider, health, credentials,
 * last sync, and a link to the hotel detail page.
 */

import Link from 'next/link';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface PmsRow {
  property_id: string;
  provider: string;
  is_active: boolean;
  health_status: string | null;
  last_health_check: string | null;
  last_synced_at: string | null;
  api_key_encrypted: string | null;
  webhook_secret: string | null;
  mews_enterprise_id: string | null;
}

interface PropertyRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
}

interface Row {
  property: PropertyRow;
  pms: PmsRow | null;
}

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

function HealthBadge({ status }: { status: string | null }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        OK
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-white/25">
      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
      Unknown
    </span>
  );
}

async function getRows(): Promise<Row[]> {
  const supabase = getSupabaseAdmin();

  const [propertiesRes, pmsRes] = await Promise.all([
    supabase.from('properties').select('id, name, city, country').order('name'),
    supabase
      .from('pms_config')
      .select(
        'property_id, provider, is_active, health_status, last_health_check, last_synced_at, api_key_encrypted, webhook_secret, mews_enterprise_id',
      ),
  ]);

  const properties = (propertiesRes.data ?? []) as PropertyRow[];
  const pmsMap = new Map<string, PmsRow>(
    ((pmsRes.data ?? []) as PmsRow[]).map((r) => [r.property_id, r]),
  );

  return properties.map((p) => ({ property: p, pms: pmsMap.get(p.id) ?? null }));
}

export default async function AdminPmsPage() {
  const rows = await getRows();

  const totalActive = rows.filter((r) => r.pms?.is_active).length;
  const totalError = rows.filter((r) => r.pms?.health_status === 'error').length;
  const totalUnconfigured = rows.filter((r) => !r.pms || !r.pms.api_key_encrypted).length;

  return (
    <div className="space-y-6">
      <SectionHeader title="PMS Integrations" />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active syncs', value: totalActive, color: 'text-emerald-400' },
          { label: 'Health errors', value: totalError, color: 'text-red-400' },
          { label: 'Unconfigured', value: totalUnconfigured, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Property', 'Provider', 'Sync', 'Health', 'Credentials', 'Last synced', ''].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left text-[10px] font-medium text-white/30 uppercase tracking-[0.12em]"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ property, pms }) => (
              <tr
                key={property.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-white/80 font-medium">{property.name}</p>
                  {(property.city || property.country) && (
                    <p className="text-[11px] text-white/30">
                      {[property.city, property.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3 text-white/60 capitalize">
                  {pms?.provider ?? <span className="text-white/25">—</span>}
                </td>

                <td className="px-4 py-3">
                  {pms ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        pms.is_active ? 'text-emerald-400' : 'text-white/25'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pms.is_active ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                      />
                      {pms.is_active ? 'Active' : 'Inactive'}
                    </span>
                  ) : (
                    <span className="text-white/25 text-[11px]">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <HealthBadge status={pms?.health_status ?? null} />
                </td>

                <td className="px-4 py-3">
                  {pms ? (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={pms.api_key_encrypted ? 'text-emerald-400' : 'text-amber-400'}
                      >
                        {pms.api_key_encrypted ? '✓ API key' : '✗ API key'}
                      </span>
                      <span
                        className={pms.webhook_secret ? 'text-emerald-400' : 'text-white/25'}
                      >
                        {pms.webhook_secret ? '✓ Webhook' : '✗ Webhook'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-amber-400 text-[11px]">Not configured</span>
                  )}
                </td>

                <td className="px-4 py-3 text-white/40 text-[12px]">
                  {formatDate(pms?.last_synced_at ?? null)}
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/admin/hotels/${property.id}`}
                    className="text-[11px] text-white/30 hover:text-[#C9A84C] transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/30 text-[13px]">
                  No properties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-white/20">
        Last health check times reflect when the drift canary or test-connection last ran per property.
        Hotel admins configure credentials via their Integrations page.
      </p>
    </div>
  );
}
