/**
 * POST /api/admin/places/fetch-images
 *
 * For each place in a region that has no image_url, fetches a photo via the
 * Google Places API, downloads it, and stores it in the Supabase `place-images`
 * storage bucket. The resulting permanent public URL is written back to the
 * places table.
 *
 * Body:
 *   region_id  — required
 *   limit?     — max places to process (default 30, max 100)
 *
 * Requires GOOGLE_PLACES_API_KEY to be set; returns 503 otherwise.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdminKey } from '@/lib/auth/require-admin-key';
import { fetchAndStoreGooglePlaceImage } from '@/lib/services/google-places-image';

interface FetchImagesBody {
  region_id: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY is not configured' },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as FetchImagesBody;

    if (!body.region_id) {
      return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
    }

    const limit = Math.min(body.limit ?? 30, 100);
    const supabase = getSupabaseAdmin();

    // Find places in this region that have no image yet
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, city, country_code')
      .eq('region_id', body.region_id)
      .is('image_url', null)
      .limit(limit);

    if (error) throw new Error(error.message);

    if (!places || places.length === 0) {
      return NextResponse.json(
        { data: { updated: 0, skipped: 0, failed: 0, total: 0, message: 'No places without images' } },
        { headers: rateLimit.headers },
      );
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const place of places) {
      try {
        const imageUrls = await fetchAndStoreGooglePlaceImage(
          supabase,
          place.id as string,
          place.name as string,
          (place.city as string | null) ?? '',
          (place.country_code as string | null) ?? '',
        );

        if (imageUrls.length === 0) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('places')
          .update({
            image_url: imageUrls[0],
            image_urls: imageUrls,
            updated_at: new Date().toISOString(),
          })
          .eq('id', place.id);

        if (updateError) {
          failed++;
        } else {
          updated++;
        }
      } catch {
        failed++;
      }
    }

    return NextResponse.json(
      { data: { updated, skipped, failed, total: places.length } },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
