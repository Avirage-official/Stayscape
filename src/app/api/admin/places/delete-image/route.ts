/**
 * POST /api/admin/places/delete-image
 *
 * Removes a single image from a place's gallery.
 *
 * Body:
 *   placeId  — place UUID
 *   url      — the image URL to remove
 *   slot     — "primary" | "extra"
 *
 * If the URL points to our Supabase storage bucket the file is also deleted.
 * The place record (image_url / image_urls) is updated in the same request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

const BUCKET = 'place-images';

function storagePathFromUrl(url: string): string | null {
  // Supabase public URLs look like:
  // https://<project>.supabase.co/storage/v1/object/public/place-images/<path>
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    placeId?: string;
    url?: string;
    slot?: string;
  } | null;

  if (!body?.placeId || !body?.url) {
    return NextResponse.json({ error: 'placeId and url are required' }, { status: 400 });
  }

  const { placeId, url, slot } = body;
  const supabase = getSupabaseAdmin();

  // Fetch current place images
  const { data: place, error: fetchError } = await supabase
    .from('places')
    .select('image_url, image_urls')
    .eq('id', placeId)
    .single();

  if (fetchError || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }

  const currentImageUrls = (place.image_urls as string[] | null) ?? [];

  let newImageUrl = place.image_url as string | null;
  let newImageUrls = [...currentImageUrls];

  if (slot === 'primary') {
    // Promote first extra image to primary, or clear primary
    newImageUrl = newImageUrls[0] ?? null;
    newImageUrls = newImageUrls.slice(1);
  } else {
    newImageUrls = newImageUrls.filter((u) => u !== url);
  }

  // Update place record
  const { error: updateError } = await supabase
    .from('places')
    .update({
      image_url: newImageUrl,
      image_urls: newImageUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', placeId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Best-effort: delete file from storage if it lives in our bucket
  const storagePath = storagePathFromUrl(url);
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  return NextResponse.json({
    ok: true,
    image_url: newImageUrl,
    image_urls: newImageUrls,
  });
}
