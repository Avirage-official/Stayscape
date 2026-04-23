import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getStayById } from '@/lib/supabase/customer-repository';
import { upsertStayPreference } from '@/lib/supabase/preferences-repository';
import { curateStay } from '@/lib/services/ai/stay-curation';
import { applyRateLimit } from '@/lib/rate-limit';
import type { PreferenceType } from '@/types/pms';

const TRIP_TYPES = new Set(['solo', 'couple', 'family', 'friends', 'business', 'celebration']);
const INTEREST_VALUES = new Set([
  'food',
  'sightseeing',
  'shopping',
  'nightlife',
  'nature',
  'wellness',
  'culture',
  'family_activities',
]);
const PACE_VALUES = new Set(['relaxed', 'balanced', 'packed']);
const FOOD_VALUES = new Set([
  'local_food',
  'fine_dining',
  'cafes',
  'bars',
  'vegetarian',
  'halal',
  'family_friendly',
]);

type OnboardingAction =
  | { action: 'confirm_stay'; confirmed: boolean }
  | { action: 'set_trip_type'; trip_type: string }
  | { action: 'set_preference'; preference_type: PreferenceType; preference_data: Record<string, unknown> }
  | {
      action: 'complete_onboarding';
      /** Optional — when provided, saved as a single stay_onboarding preference row. */
      trip_type?: string;
      interests?: unknown;
      pace?: unknown;
      food_preferences?: unknown;
    }
  | { action: 'retry_curation' };

function toCanonicalStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const userId = new URL(request.url).searchParams.get('userId');
  const { stayId } = await params;

  if (!userId || !stayId) {
    return NextResponse.json({ error: 'userId and stayId are required' }, { status: 400, headers: rateLimit.headers });
  }

  const stay = await getStayById(userId, stayId);
  if (!stay) {
    return NextResponse.json({ error: 'Stay not found' }, { status: 404, headers: rateLimit.headers });
  }

  const body = (await request.json()) as OnboardingAction;
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    if (body.action === 'confirm_stay') {
      const confirmed = !!body.confirmed;
      const { error } = await supabase
        .from('stays')
        .update({
          stay_confirmed_by_guest: confirmed,
          stay_confirmation_status: confirmed ? 'confirmed' : 'incorrect',
        })
        .eq('id', stayId)
        .eq('userid', stay.user_id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ data: { stay_id: stayId, confirmed } }, { headers: rateLimit.headers });
    }

    if (body.action === 'set_trip_type') {
      const tripType = body.trip_type.trim().toLowerCase();
      if (!TRIP_TYPES.has(tripType)) {
        return NextResponse.json({ error: 'Invalid trip type' }, { status: 400, headers: rateLimit.headers });
      }

      const { error } = await supabase
        .from('stays')
        .update({ trip_type: tripType })
        .eq('id', stayId)
        .eq('userid', stay.user_id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ data: { stay_id: stayId, trip_type: tripType } }, { headers: rateLimit.headers });
    }

    if (body.action === 'set_preference') {
      const preferenceType = body.preference_type;
      if (!['interests', 'pace', 'food_preferences'].includes(preferenceType)) {
        return NextResponse.json({ error: 'Invalid preference type' }, { status: 400, headers: rateLimit.headers });
      }

      let canonicalPreferenceData: Record<string, unknown> | null = null;

      if (preferenceType === 'pace') {
        const pace = String((body.preference_data?.value ?? '')).trim().toLowerCase();
        if (!PACE_VALUES.has(pace)) {
          return NextResponse.json({ error: 'Invalid pace value' }, { status: 400, headers: rateLimit.headers });
        }
        canonicalPreferenceData = { value: pace };
      } else {
        const values = toCanonicalStringArray(body.preference_data?.values);
        const allowed = preferenceType === 'interests' ? INTEREST_VALUES : FOOD_VALUES;
        const filtered = Array.from(new Set(values.filter((value) => allowed.has(value))));
        canonicalPreferenceData = { values: filtered };
      }

      const preferenceId = await upsertStayPreference(
        stayId,
        preferenceType,
        canonicalPreferenceData,
      );

      return NextResponse.json({
        data: { stay_id: stayId, preference_id: preferenceId, preference_type: preferenceType },
      }, { headers: rateLimit.headers });
    }

    if (body.action === 'complete_onboarding' || body.action === 'retry_curation') {
      const markOnboardingComplete = body.action === 'complete_onboarding';

      if (markOnboardingComplete) {
        // If the payload includes onboarding answers, save them as a single
        // stay_onboarding preference row before marking the stay complete.
        const hasPreferencePayload =
          body.action === 'complete_onboarding' &&
          (body.trip_type !== undefined ||
            body.interests !== undefined ||
            body.pace !== undefined ||
            body.food_preferences !== undefined);

        if (hasPreferencePayload) {
          const rawTripType = typeof body.trip_type === 'string' ? body.trip_type.trim().toLowerCase() : null;
          const canonicalTripType = rawTripType && TRIP_TYPES.has(rawTripType) ? rawTripType : null;

          const rawInterests = toCanonicalStringArray(body.interests);
          const canonicalInterests = Array.from(new Set(rawInterests.filter((v) => INTEREST_VALUES.has(v)))).slice(0, 3);

          const rawPace = typeof body.pace === 'string' ? body.pace.trim().toLowerCase() : null;
          const canonicalPace = rawPace && PACE_VALUES.has(rawPace) ? rawPace : null;

          const rawFood = toCanonicalStringArray(body.food_preferences);
          const canonicalFood = Array.from(new Set(rawFood.filter((v) => FOOD_VALUES.has(v)))).slice(0, 3);

          // Persist trip_type directly on the stay if provided.
          if (canonicalTripType) {
            const { error: tripTypeError } = await supabase
              .from('stays')
              .update({ trip_type: canonicalTripType })
              .eq('id', stayId)
              .eq('userid', stay.user_id);
            if (tripTypeError) throw new Error(tripTypeError.message);
          }

          // Save ONE combined preference row.
          await upsertStayPreference(stayId, 'stay_onboarding', {
            interests: canonicalInterests,
            pace: canonicalPace,
            food_preferences: canonicalFood,
          });
        }

        const { error } = await supabase
          .from('stays')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: now,
            curation_status: 'in_progress',
          })
          .eq('id', stayId)
          .eq('userid', stay.user_id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('stays')
          .update({ curation_status: 'in_progress' })
          .eq('id', stayId)
          .eq('userid', stay.user_id);

        if (error) throw new Error(error.message);
      }

      // Fire curation as fire-and-forget — respond to the client immediately
      // so the serverless function is not blocked by the long-running Claude calls.
      curateStay(stayId).then(
        (result) => {
          const curatedAt = new Date().toISOString();
          supabase
            .from('stays')
            .update({ curation_status: 'completed', curated_at: curatedAt })
            .eq('id', stayId)
            .eq('userid', stay.user_id)
            .then(
              ({ error }) => {
                if (error) {
                  console.error('[onboarding] Failed to mark curation as completed', error.message);
                } else {
                  console.log(
                    '[onboarding] Curation completed for stay:',
                    stayId,
                    result.curations_created,
                    'curations created',
                  );
                }
              },
              (err: unknown) => {
                console.error('[onboarding] Unexpected error marking curation completed', err);
              },
            );
        },
        (err: unknown) => {
          console.error('[onboarding] Curation failed for stay:', stayId, err);
          supabase
            .from('stays')
            .update({ curation_status: 'failed' })
            .eq('id', stayId)
            .eq('userid', stay.user_id)
            .then(
              ({ error }) => {
                if (error) {
                  console.error('[onboarding] Failed to mark curation as failed', error.message);
                }
              },
              (dbErr: unknown) => {
                console.error('[onboarding] Unexpected error marking curation failed', dbErr);
              },
            );
        },
      );

      return NextResponse.json({
        data: {
          stay_id: stayId,
          curation_status: 'in_progress',
        },
      }, { headers: rateLimit.headers });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500, headers: rateLimit.headers });
  }
}
