/**
 * POST /api/admin/places/fetch-images
 *
 * Fetches up to 3 Foursquare images for places in a region that
 * currently have no image_url, and updates the places table with
 * image_url + image_urls. Only affects places where
 *   external_source = 'foursquare'.
 *
 * Body:
 *   region_id  — required, which region to update
 *   limit?     — max places to process (default 30, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdminKey } from '@/lib/auth/require-admin-key';
import { getPlacePhotoUrls } from '@/lib/services/foursquare';

interface FetchImagesBody {
  region_id: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as FetchImagesBody;

    if (!body.region_id) {
      return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
    }

    const limit = Math.min(body.limit ?? 30, 100);
    const supabase = getSupabaseAdmin();

    // Find Foursquare places in this region with no images yet
    const { data: places, error } = await supabase
      .from('places')
      .select('id, external_id, image_url, image_urls')
      .eq('region_id', body.region_id)
      .eq('external_source', 'foursquare')
      .is('image_url', null)
      .limit(limit);

    if (error) throw new Error(error.message);

    if (!places || places.length === 0) {
      return NextResponse.json({ data: { updated: 0, skipped: 0, failed: 0, total: 0, message: 'No Foursquare places without images' } }, { headers: rateLimit.headers });
    }

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const place of places) {
      const fsqId = place.external_id as string | null;
      if (!fsqId) {
        skipped++;
        continue;
      }

      try {
        const urls = await getPlacePhotoUrls(fsqId, 3);
        if (!urls || urls.length === 0) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('places')
          .update({ image_url: urls[0], image_urls: urls })
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

    return NextResponse.json({
      data: { updated, skipped, failed, total: places.length },
    }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
