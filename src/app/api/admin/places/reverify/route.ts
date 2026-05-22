/**
 * POST /api/admin/places/reverify
 *
 * Re-runs Claude enrichment on already-active places for a region.
 * Used to keep stories fresh and catch places that have closed or
 * degraded in quality. Places whose score drops below 4 are flagged
 * (is_active set to false) for admin review — not auto-deleted.
 *
 * Body:
 *   region_id  — required, which region to re-verify
 *   limit?     — max places to process (default 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { enrichPlace } from '@/lib/services/ai/enrichment';
import type { InternalPlace } from '@/types/database';
import { applyRateLimit } from '@/lib/rate-limit';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1200;

interface ReverifyBody {
  region_id: string;
  limit?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ReverifyBody;

    if (!body.region_id) {
      return NextResponse.json({ error: 'region_id is required' }, { status: 400 });
    }

    const limit = Math.min(body.limit ?? 30, 100);
    const supabase = getSupabaseAdmin();

    // Fetch active, enriched places for this region — oldest editorial_summary first
    const { data: places, error } = await supabase
      .from('places')
      .select('*')
      .eq('region_id', body.region_id)
      .eq('is_active', true)
      .not('editorial_summary', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    if (!places || places.length === 0) {
      return NextResponse.json({ data: { reverified: 0, flagged: 0, failed: 0, message: 'No active places to re-verify' } });
    }

    let reverified = 0;
    let flagged = 0;
    let failed = 0;

    for (let i = 0; i < places.length; i += BATCH_SIZE) {
      const batch = places.slice(i, i + BATCH_SIZE);

      for (const place of batch) {
        try {
          const result = await enrichPlace(supabase, place as unknown as InternalPlace);

          // If Claude now scores below threshold, flag for human review
          if (result.quality_score !== undefined && result.quality_score < 4) {
            await supabase
              .from('places')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('id', place.id);
            flagged++;
          } else {
            reverified++;
          }
        } catch {
          failed++;
        }
      }

      if (i + BATCH_SIZE < places.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      data: { reverified, flagged, failed, total: places.length },
    }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
