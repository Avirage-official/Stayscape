import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      propertiesCount,
      regionsCount,
      placesCount,
      enrichedPlacesCount,
      staysCount,
      recentSyncRuns,
      recentStays,
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('regions').select('id', { count: 'exact', head: true }),
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('places')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('editorial_summary', 'is', null)
        .neq('editorial_summary', ''),
      supabase.from('stays').select('id', { count: 'exact', head: true }),
      supabase
        .from('sync_runs')
        .select('id, status, started_at, completed_at, records_fetched, records_created, records_updated, records_deactivated, error_message, regions:region_id(name)')
        .order('started_at', { ascending: false })
        .limit(5),
      supabase
        .from('stays')
        .select('id, booking_reference, checkindate, checkoutdate, status, users:userid(firstname, lastname, email), properties:propertyid(name)')
        .order('createdat', { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      data: {
        counts: {
          properties: propertiesCount.count ?? 0,
          regions: regionsCount.count ?? 0,
          places: placesCount.count ?? 0,
          enriched_places: enrichedPlacesCount.count ?? 0,
          stays: staysCount.count ?? 0,
        },
        recent_sync_runs: recentSyncRuns.data ?? [],
        recent_stays: recentStays.data ?? [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
