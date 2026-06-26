import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'place-images';

/**
 * Fetch up to maxImages photos for a place via Google Places API, download
 * them, and persist each in Supabase Storage. Returns an array of stable
 * public URLs (empty array on any failure or missing key).
 *
 * Files are stored as: {placeDbId}.jpg, {placeDbId}_2.jpg, ... {placeDbId}_6.jpg
 */
export async function fetchAndStoreGooglePlaceImage(
  supabase: SupabaseClient,
  placeDbId: string,
  name: string,
  city: string,
  countryCode: string,
  maxImages = 6,
): Promise<string[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];

  try {
    // 1. Text search → photo references (first result can have up to 10)
    const query = city ? `${name} ${city}` : `${name} ${countryCode}`;
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(query)}&key=${key}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!searchRes.ok) return [];

    const searchData = (await searchRes.json()) as {
      results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
    };

    const photoRefs = (searchData.results?.[0]?.photos ?? [])
      .slice(0, maxImages)
      .map(p => p.photo_reference)
      .filter(Boolean);

    if (photoRefs.length === 0) return [];

    // 2. Download + upload each photo
    const urls: string[] = [];

    for (let i = 0; i < photoRefs.length; i++) {
      const photoRef = photoRefs[i];

      const photoRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo` +
          `?maxwidth=4800&photoreference=${encodeURIComponent(photoRef)}&key=${key}`,
        { redirect: 'follow', signal: AbortSignal.timeout(15000) },
      );
      if (!photoRes.ok) continue;

      const buffer = Buffer.from(await photoRes.arrayBuffer());
      if (buffer.length === 0) continue;

      const contentType = photoRes.headers.get('content-type') ?? 'image/jpeg';
      const ext = contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : 'jpg';

      // Primary image keeps clean name; additional images get an index suffix
      const filename = i === 0 ? `${placeDbId}.${ext}` : `${placeDbId}_${i + 1}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, { contentType, upsert: true });

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(filename);

      urls.push(publicUrl);
    }

    return urls;
  } catch {
    return [];
  }
}
