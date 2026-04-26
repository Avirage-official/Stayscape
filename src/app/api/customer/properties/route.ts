/**
 * GET /api/customer/properties
 *
 * Returns all active properties with their booking URLs for the
 * no-booking discovery screen.
 *
 * No auth required — property listing is not sensitive.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('properties')
      .select('id, name, city, country, image_url, booking_url')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    const properties = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      city: row.city as string,
      country: row.country as string,
      image_url: (row.image_url ?? null) as string | null,
      booking_url: (row.booking_url ?? null) as string | null,
    }));

    return NextResponse.json({ properties }, { headers: rateLimit.headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
