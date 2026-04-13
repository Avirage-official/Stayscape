/**
 * GET /api/curations
 *
 * Returns AI-generated curations for a stay.
 *
 * Query parameters:
 *   stay_id  — UUID of the stay (required)
 *   type     — optional CurationType filter (e.g. "default_itinerary")
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCurationsForStay,
  getCuration,
} from '@/lib/supabase/curation-repository';
import type { CurationType } from '@/types/pms';
import { applyRateLimit } from '@/lib/rate-limit';

const VALID_TYPES: CurationType[] = [
  'default_itinerary',
  'recommended_places',
  'regional_activities',
  'safety_tips',
];

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const { searchParams } = request.nextUrl;
  const stayId = searchParams.get('stay_id');
  const typeParam = searchParams.get('type');

  if (!stayId) {
    return NextResponse.json(
      { error: 'Missing required query parameter: stay_id' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  if (typeParam && !VALID_TYPES.includes(typeParam as CurationType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400, headers: rateLimit.headers },
    );
  }

  try {
    if (typeParam) {
      const curation = await getCuration(stayId, typeParam as CurationType);
      return NextResponse.json(
        { data: curation ? [curation] : [] },
        { headers: rateLimit.headers },
      );
    }

    const curations = await getCurationsForStay(stayId);
    return NextResponse.json({ data: curations }, { headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
