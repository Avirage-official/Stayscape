import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { fetchAndStoreGooglePlaceImage } from '@/lib/services/google-places-image';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 503 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: place, error } = await supabase
    .from('places')
    .select('id, name, city, country_code')
    .eq('id', id)
    .single();

  if (error || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }

  try {
    const imageUrls = await fetchAndStoreGooglePlaceImage(
      supabase,
      place.id as string,
      place.name as string,
      (place.city as string | null) ?? '',
      (place.country_code as string | null) ?? '',
    );

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'No image found' }, { status: 404 });
    }

    await supabase
      .from('places')
      .update({ image_url: imageUrls[0], image_urls: imageUrls, updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ ok: true, image_url: imageUrls[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
