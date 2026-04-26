/**
 * GET /api/hotel/context?propertyId=<id>
 *
 * Returns hotel context (amenities + policies + branding) for a given property.
 * Used by the guest-facing UI to display live amenity data.
 *
 * Reply: { context: HotelContext | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getHotelContext } from '@/lib/supabase/hotel-repository';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json(
      { error: 'Missing required query parameter: propertyId' },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const context = await getHotelContext(supabase, propertyId);
    return NextResponse.json({ context });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
