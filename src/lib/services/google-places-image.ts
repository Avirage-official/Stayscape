import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'place-images';

/**
 * Fetch a photo for a place via Google Places API, download it, and persist it
 * in Supabase Storage. Returns the stable public Supabase URL, or null on any
 * failure (missing key, no photo found, upload error, etc.).
 *
 * Requires GOOGLE_PLACES_API_KEY env var. Safe to call when the key is absent —
 * returns null immediately so callers can fall back gracefully.
 */
export async function fetchAndStoreGooglePlaceImage(
  supabase: SupabaseClient,
  placeDbId: string,
  name: string,
  city: string,
  countryCode: string,
): Promise<string | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  try {
    // 1. Text search → photo reference
    const query = city ? `${name} ${city}` : `${name} ${countryCode}`;
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}&key=${key}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as {
      results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
    };
    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return null;

    // 2. Download image bytes (Google returns a redirect to the CDN)
    const photoRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo` +
        `?maxwidth=1600&photoreference=${encodeURIComponent(photoRef)}&key=${key}`,
      { redirect: 'follow', signal: AbortSignal.timeout(15000) },
    );
    if (!photoRes.ok) return null;

    const buffer = Buffer.from(await photoRes.arrayBuffer());
    if (buffer.length === 0) return null;

    const contentType = photoRes.headers.get('content-type') ?? 'image/jpeg';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';

    // 3. Upload to Supabase Storage
    const filename = `${placeDbId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: true });

    if (uploadError) return null;

    // 4. Return permanent public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filename);

    return publicUrl;
  } catch {
    return null;
  }
}
