/**
 * POST /api/pms/preferences
 *
 * Pushes guest preferences captured from the concierge/map back to
 * the hotel PMS via the callback URL stored on the stay record.
 *
 * Body:
 *   stay_id — UUID of the stay (required)
 *
 * Also supports saving a new preference:
 *   stay_id          — UUID of the stay (required)
 *   preference_type  — Type of preference (required when saving)
 *   preference_data  — Structured preference data (required when saving)
 *   push             — Whether to also push to PMS after saving (optional)
 *
 * GET /api/pms/preferences?stay_id=UUID
 *   Returns all preferences for a stay.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  savePreference,
  getPreferencesForStay,
  pushPreferencesToPms,
} from '@/lib/supabase/preferences-repository';
import type { PreferenceType } from '@/types/pms';
import { applyRateLimit } from '@/lib/rate-limit';

interface SavePreferenceBody {
  stay_id: string;
  preference_type?: PreferenceType;
  preference_data?: Record<string, unknown>;
  push?: boolean;
}

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const stayId = request.nextUrl.searchParams.get('stay_id');

    if (!stayId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: stay_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const preferences = await getPreferencesForStay(stayId);

    return NextResponse.json(
      { data: preferences },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const body = (await request.json()) as SavePreferenceBody;

    if (!body.stay_id) {
      return NextResponse.json(
        { error: 'Missing required field: stay_id' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    let savedId: string | null = null;

    // Save preference if type and data are provided
    if (body.preference_type && body.preference_data) {
      savedId = await savePreference(
        body.stay_id,
        body.preference_type,
        body.preference_data,
      );
    }

    // Push to PMS if requested (or if no preference to save, just push)
    let pushResult = null;
    if (body.push || (!body.preference_type && !body.preference_data)) {
      pushResult = await pushPreferencesToPms(body.stay_id);
    }

    return NextResponse.json(
      {
        data: {
          preference_id: savedId,
          push_result: pushResult,
          message: savedId
            ? 'Preference saved' + (pushResult ? ' and pushed to PMS' : '')
            : pushResult
              ? `Pushed ${pushResult.synced} preferences to PMS`
              : 'No action taken',
        },
      },
      { status: savedId ? 201 : 200, headers: rateLimit.headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
