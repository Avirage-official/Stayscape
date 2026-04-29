/**
 * Admin — Hotels list page
 *
 * Server component that lists all properties with their branding and region.
 */

import Link from 'next/link';
import SectionHeader from '@/components/admin/SectionHeader';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface HotelRow {
  id: string;
  name: string;
  city: string;
  country: string;
  concierge_name: string;
  region: string;
}

async function getHotels(): Promise<HotelRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('properties')
      .select(
        'id, name, city, country, regions:region_id(name), branding:hotel_branding(concierge_name)',
      )
      .order('name');

    return (data ?? []).map((row) => {
      const regionRaw = row.regions as { name?: string } | null;
      const brandingRaw = row.branding as
        | { concierge_name?: string }
        | Array<{ concierge_name?: string }>
        | null;

      let concierge = '—';
      if (Array.isArray(brandingRaw)) {
        concierge = brandingRaw[0]?.concierge_name ?? '—';
      } else if (brandingRaw) {
        concierge = brandingRaw.concierge_name ?? '—';
      }

      return {
        id: (row.id as string) ?? '',
        name: (row.name as string) ?? '—',
        city: (row.city as string) ?? '—',
        country: (row.country as string) ?? '—',
        concierge_name: concierge,
        region: regionRaw?.name ?? '—',
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminHotelsPage() {
  const hotels = await getHotels();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="Hotels" />
        <Link
          href="/admin/hotels/new"
          className="bg-[#C9A84C] text-black text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-[#C9A84C]/90 flex-shrink-0"
        >
          Add Hotel
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                City
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Country
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Concierge
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Region
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-[#C9A84C]/70 uppercase tracking-[0.14em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[13px] text-white/30"
                >
                  No hotels yet.{' '}
                  <Link
                    href="/admin/hotels/new"
                    className="text-[#C9A84C]/70 hover:text-[#C9A84C] underline"
                  >
                    Add the first one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              hotels.map((hotel, idx) => (
                <tr
                  key={hotel.id}
                  className={`border-b border-white/[0.05] hover:bg-white/[0.015] transition-colors ${
                    idx === hotels.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-white/80 font-medium">{hotel.name}</td>
                  <td className="px-4 py-3 text-white/55">{hotel.city}</td>
                  <td className="px-4 py-3 text-white/55">{hotel.country}</td>
                  <td className="px-4 py-3 text-white/55">{hotel.concierge_name}</td>
                  <td className="px-4 py-3 text-white/55">{hotel.region}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/hotels/${hotel.id}/edit`}
                        className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-white/60 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/hotels/${hotel.id}/requests`}
                        className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-white/60 hover:border-white/30 hover:text-white/80 transition-colors"
                      >
                        Requests
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
