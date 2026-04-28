/**
 * GET /api/customer/properties
 *
 * Returns all properties with their booking URLs for the
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
      .order('name', { ascending: true });

    if (error) throw error;

    const properties = (data ?? [])
      .filter(
        (row: Record<string, unknown>) =>
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.city === 'string' &&
          typeof row.country === 'string',
      )
      .map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        city: row.city as string,
        country: row.country as string,
        image_url: typeof row.image_url === 'string' ? row.image_url : null,
        booking_url: typeof row.booking_url === 'string' ? row.booking_url : null,
      }));

    return NextResponse.json({ properties }, { headers: rateLimit.headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
