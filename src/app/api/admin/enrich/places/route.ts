/**
 * POST /api/admin/enrich/places
 *
 * Admin endpoint to trigger AI enrichment for places that have no
 * editorial_summary yet. Processes in batches with a delay between
 * calls to avoid hitting rate limits.
 *
 * Body:
 *   region_id? — only enrich places in this region
 *   limit?     — max number of places to process (default 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getUnenrichedPlaces } from '@/lib/supabase/places-repository';
import { enrichPlace } from '@/lib/services/ai/enrichment';
import type { InternalPlace } from '@/types/database';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

interface EnrichPlacesBody {
  region_id?: string;
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

  try {
    const body = (await request.json().catch(() => ({}))) as EnrichPlacesBody;

    const limit = Math.min(body.limit ?? 50, 200);
    const supabase = getSupabaseAdmin();

    const places = await getUnenrichedPlaces(supabase, {
      region_id: body.region_id,
      limit,
    });

    if (places.length === 0) {
      return NextResponse.json({
        data: { enriched: 0, failed: 0, message: 'No unenriched places found' },
      });
    }

    let enriched = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < places.length; i += BATCH_SIZE) {
      const batch = places.slice(i, i + BATCH_SIZE);

      for (const place of batch) {
        try {
          await enrichPlace(supabase, place as InternalPlace);
          enriched++;
        } catch {
          failed++;
        }
      }

      // Delay between batches to respect API rate limits
      if (i + BATCH_SIZE < places.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      data: {
        enriched,
        failed,
        total: places.length,
      },
    }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
