/**
 * POST /api/admin/places/set-primary-image
 *
 * Promotes an extra image to primary. The current primary image is
 * moved to the front of image_urls[].
 *
 * Body:
 *   placeId — place UUID
 *   url     — the extra image URL to promote
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    placeId?: string;
    url?: string;
  } | null;

  if (!body?.placeId || !body?.url) {
    return NextResponse.json({ error: 'placeId and url are required' }, { status: 400 });
  }

  const { placeId, url } = body;
  const supabase = getSupabaseAdmin();

  const { data: place, error: fetchError } = await supabase
    .from('places')
    .select('image_url, image_urls')
    .eq('id', placeId)
    .single();

  if (fetchError || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }

  const currentPrimary = place.image_url as string | null;
  const currentExtras = (place.image_urls as string[] | null) ?? [];

  // New extras: old primary (if exists) + remaining extras (without the promoted URL)
  const remaining = currentExtras.filter((u) => u !== url);
  const newImageUrls = currentPrimary ? [currentPrimary, ...remaining] : remaining;

  const { error: updateError } = await supabase
    .from('places')
    .update({
      image_url: url,
      image_urls: newImageUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', placeId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, image_url: url, image_urls: newImageUrls });
}
