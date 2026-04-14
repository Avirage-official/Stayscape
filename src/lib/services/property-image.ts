/**
 * Property Image Service
 *
 * Auto-fetches a relevant hotel/property photo when a new property is created
 * without an image_url.
 *
 * Strategies (in priority order):
 * 1. Google Places API  — requires GOOGLE_PLACES_API_KEY env var
 * 2. Unsplash API       — requires UNSPLASH_ACCESS_KEY env var
 * 3. Graceful skip      — logs a warning, never breaks the booking pipeline
 *
 * This service is idempotent: if the property already has an image_url in the
 * database, it will skip the fetch unless `force` is set to true.
 *
 * Never throws — all errors are caught and logged.
 */

import { getSupabaseAdmin } from '@/lib/supabase/client';

/* ── Types ───────────────────────────────────────────────────── */

export interface PropertyImageResult {
  property_id: string;
  image_url: string | null;
  source: 'google_places' | 'unsplash' | 'skipped' | 'already_set';
}

/* ── Main entry point ────────────────────────────────────────── */

/**
 * Fetch a relevant image for a property and persist it to the database.
 *
 * @param propertyId   - UUID of the property record in the `properties` table.
 * @param propertyName - Hotel / property name used for the image search query.
 * @param city         - City the property is in (used to refine the query).
 * @param country      - Country (used for context, optional).
 * @param force        - When true, overwrite an existing image_url. Default: false.
 *
 * @returns The fetched image URL, or null if unavailable.
 */
export async function fetchAndUpdatePropertyImage(
  propertyId: string,
  propertyName: string,
  city: string | null,
  country: string | null,
  force = false,
): Promise<PropertyImageResult> {
  try {
    // Check if the property already has an image (skip unless force=true)
    if (!force) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('properties')
        .select('image_url')
        .eq('id', propertyId)
        .maybeSingle();

      if (data?.image_url) {
        return { property_id: propertyId, image_url: data.image_url as string, source: 'already_set' };
      }
    }

    // Try Google Places first, then Unsplash
    const googleResult = await fetchGooglePlacesImage(propertyName, city);
    if (googleResult) {
      await persistImageUrl(propertyId, googleResult);
      return { property_id: propertyId, image_url: googleResult, source: 'google_places' };
    }

    const unsplashResult = await fetchUnsplashImage(propertyName, city, country);
    if (unsplashResult) {
      await persistImageUrl(propertyId, unsplashResult);
      return { property_id: propertyId, image_url: unsplashResult, source: 'unsplash' };
    }

    // Neither API is configured or returned a result
    const hasGoogleKey = !!process.env.GOOGLE_PLACES_API_KEY;
    const hasUnsplashKey = !!process.env.UNSPLASH_ACCESS_KEY;
    if (!hasGoogleKey && !hasUnsplashKey) {
      console.warn(
        '[property-image] Auto-image-fetch is disabled — set GOOGLE_PLACES_API_KEY or UNSPLASH_ACCESS_KEY to enable.',
      );
    }

    return { property_id: propertyId, image_url: null, source: 'skipped' };
  } catch (err) {
    // Never let image-fetching break the booking pipeline
    console.error('[property-image] Unexpected error during image fetch:', err);
    return { property_id: propertyId, image_url: null, source: 'skipped' };
  }
}

/* ── Strategy 1: Google Places ───────────────────────────────── */

/**
 * Search Google Places for the hotel and return a photo URL.
 *
 * Required env var: GOOGLE_PLACES_API_KEY
 */
async function fetchGooglePlacesImage(
  propertyName: string,
  city: string | null,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const query = city ? `${propertyName} ${city}` : propertyName;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=lodging&key=${apiKey}`;

    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!searchRes.ok) {
      console.warn('[property-image] Google Places search failed:', searchRes.status);
      return null;
    }

    const searchData = (await searchRes.json()) as {
      results?: Array<{ photos?: Array<{ photo_reference: string }> }>;
    };

    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return null;

    // Construct the photo URL — this redirects to Google's CDN image
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${encodeURIComponent(photoRef)}&key=${apiKey}`;

    // Follow the redirect to get a stable CDN URL for storage/display
    const photoRes = await fetch(photoUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!photoRes.ok) return null;

    // Return the final redirected URL so next/image can load it without
    // needing maps.googleapis.com in remotePatterns
    return photoRes.url ?? null;
  } catch (err) {
    console.warn('[property-image] Google Places fetch error:', err);
    return null;
  }
}

/* ── Strategy 2: Unsplash ────────────────────────────────────── */

/**
 * Search Unsplash for a hotel photo using the property name + city.
 * Falls back to "{city} hotel" if no specific result is found.
 *
 * Required env var: UNSPLASH_ACCESS_KEY
 */
async function fetchUnsplashImage(
  propertyName: string,
  city: string | null,
  country: string | null,
): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  // Try specific query first, then progressively broader fallbacks
  const queries = [
    city ? `${propertyName} ${city}` : propertyName,
    city ? `${city} hotel` : null,
    country ? `${country} hotel` : null,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&order_by=relevant`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn('[property-image] Unsplash search failed:', res.status);
        continue;
      }

      const data = (await res.json()) as {
        results?: Array<{ urls?: { regular?: string; full?: string } }>;
      };

      const imageUrl = data.results?.[0]?.urls?.regular ?? data.results?.[0]?.urls?.full;
      if (imageUrl) return imageUrl;
    } catch (err) {
      console.warn('[property-image] Unsplash fetch error for query:', query, err);
    }
  }

  return null;
}

/* ── DB update ───────────────────────────────────────────────── */

async function persistImageUrl(propertyId: string, imageUrl: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('properties')
    .update({ image_url: imageUrl })
    .eq('id', propertyId);

  if (error) {
    console.warn('[property-image] Failed to persist image URL:', error.message);
  } else {
    console.log('[property-image] Image URL saved for property:', propertyId, '→', imageUrl);
  }
}
