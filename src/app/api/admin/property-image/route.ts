/**
 * POST /api/admin/property-image
 *
 * Manually trigger an image fetch for a specific property.
 * Useful for back-filling images on properties created before auto-fetch
 * was enabled, or for refreshing stale images.
 *
 * Body: { property_id: string, force?: boolean }
 *   - property_id: UUID of the property to fetch an image for.
 *   - force: When true, overwrites an existing image_url (default: false).
 *
 * Required env vars (at least one must be set to actually fetch images):
 *   GOOGLE_PLACES_API_KEY — for Google Places photo lookup
 *   UNSPLASH_ACCESS_KEY   — for Unsplash photo search
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAndUpdatePropertyImage } from '@/lib/services/property-image';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';

interface PropertyImageBody {
  property_id: string;
  force?: boolean;
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as PropertyImageBody;

    if (!body.property_id) {
      return NextResponse.json(
        { error: 'Missing required field: property_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Look up the property to get name/city/country for the search query
    const supabase = getSupabaseAdmin();
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, city, country')
      .eq('id', body.property_id)
      .maybeSingle();

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404, headers: rateLimit.headers },
      );
    }

    const result = await fetchAndUpdatePropertyImage(
      property.id as string,
      property.name as string,
      (property.city as string | null) ?? null,
      (property.country as string | null) ?? null,
      body.force ?? false,
    );

    return NextResponse.json({ data: result }, { status: 200, headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500, headers: rateLimit.headers });
  }
}
