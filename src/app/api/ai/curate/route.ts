/**
 * POST /api/ai/curate
 *
 * Triggers AI curation for a stay. Called automatically after a PMS
 * webhook creates a stay, or manually to re-generate curations.
 *
 * Body:
 *   stay_id  — UUID of the stay to curate (required)
 *   force    — Re-generate even if curations exist (optional, default false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { curateStay } from '@/lib/services/ai/stay-curation';
import { hasCurations } from '@/lib/supabase/curation-repository';
import { applyRateLimit } from '@/lib/rate-limit';

interface CurateBody {
  stay_id: string;
  force?: boolean;
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request, 'admin');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as CurateBody;

    if (!body.stay_id) {
      return NextResponse.json(
        { error: 'Missing required field: stay_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Check if curations already exist (skip if not forcing)
    if (!body.force) {
      const existing = await hasCurations(body.stay_id);
      if (existing) {
        return NextResponse.json(
          {
            data: {
              stay_id: body.stay_id,
              curations_created: 0,
              types: [],
              message: 'Curations already exist. Use force=true to regenerate.',
            },
          },
          { headers: rateLimit.headers },
        );
      }
    }

    const result = await curateStay(body.stay_id);

    return NextResponse.json(
      { data: result },
      { status: 201, headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
