/**
 * POST /api/customer/profile
 *
 * Saves a user's travel profile (answers collected by ProfileOnboardingFlow),
 * and derives persona scores (Cartographer, Epicurean, etc.) into user_profiles.extra.
 *
 * Auth: Bearer token (Supabase session).
 * Body: { name?, age_band?, location_city?, location_country?, novelty?, vibe?,
 *         discovery?, food?, planning?, spend?, dealbreakers? }
 * Reply: { ok: true } | { error }
 *
 * GET /api/customer/profile
 *
 * Returns whether the authed user has completed their profile.
 * Reply: { completed: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { derivePersonaScores } from '@/lib/services/ai/derive-personas';

export const dynamic = 'force-dynamic';

const AGE_BANDS = new Set(['under_20', '20_25', '26_30', '31_40', '41_55', '56_plus']);
const NOVELTY_VALUES = new Set(['pioneer', 'explorer', 'homebody']);
const VIBE_VALUES = new Set(['city', 'culture', 'nature', 'beach']);
const DISCOVERY_VALUES = new Set(['word_of_mouth', 'deep_research', 'spontaneous', 'curated_lists']);
const FOOD_VALUES = new Set(['local_markets', 'neighbourhood_gems', 'destination_dining', 'fuel_not_ritual']);
const PLANNING_VALUES = new Set(['planner', 'loose_plan', 'first_day', 'full_improv']);
const SPEND_VALUES = new Set(['value_first', 'comfort_floor', 'quality_always', 'no_limits']);
const DEALBREAKER_VALUES = new Set(['rushed', 'crowds', 'bad_food', 'downtime', 'overspending', 'chaos']);

function validateEnum(
  value: unknown,
  allowed: Set<string>,
  fieldName: string,
): { value: string | null; error?: string } {
  if (value === undefined || value === null) return { value: null };
  const cleaned = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!cleaned) return { value: null };
  if (!allowed.has(cleaned)) return { value: null, error: `Invalid ${fieldName}: ${cleaned}` };
  return { value: cleaned };
}

// ── GET — profile completion check ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('completed')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[profile GET] Failed to fetch user_profiles:', error.message);
    return NextResponse.json(
      { error: 'Failed to check profile' },
      { status: 500, headers: rateLimit.headers },
    );
  }

  const completed = data?.completed === true;
  return NextResponse.json({ completed }, { headers: rateLimit.headers });
}

// ── POST — save profile ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // ── Validate enum fields ──────────────────────────────────────────────────

  const age_band_result = validateEnum(body.age_band, AGE_BANDS, 'age_band');
  if (age_band_result.error) {
    return NextResponse.json({ error: age_band_result.error }, { status: 400, headers: rateLimit.headers });
  }

  const novelty_result = validateEnum(body.novelty, NOVELTY_VALUES, 'novelty');
  if (novelty_result.error) {
    return NextResponse.json({ error: novelty_result.error }, { status: 400, headers: rateLimit.headers });
  }

  // ── Validate vibe (array, max 2) ─────────────────────────────────────────

  let vibes: string[] = [];
  if (body.vibe !== undefined && body.vibe !== null) {
    if (!Array.isArray(body.vibe)) {
      return NextResponse.json(
        { error: 'vibe must be an array' },
        { status: 400, headers: rateLimit.headers },
      );
    }
    const rawVibes = (body.vibe as unknown[])
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const dedupedVibes = Array.from(new Set(rawVibes));
    const invalidVibe = dedupedVibes.find((v) => !VIBE_VALUES.has(v));
    if (invalidVibe) {
      return NextResponse.json(
        { error: `Invalid vibe: ${invalidVibe}` },
        { status: 400, headers: rateLimit.headers },
      );
    }
    if (dedupedVibes.length > 2) {
      return NextResponse.json(
        { error: 'vibe may contain at most 2 values' },
        { status: 400, headers: rateLimit.headers },
      );
    }
    vibes = dedupedVibes;
  }

  const discovery_result = validateEnum(body.discovery, DISCOVERY_VALUES, 'discovery');
  if (discovery_result.error) {
    return NextResponse.json({ error: discovery_result.error }, { status: 400, headers: rateLimit.headers });
  }

  const food_result = validateEnum(body.food, FOOD_VALUES, 'food');
  if (food_result.error) {
    return NextResponse.json({ error: food_result.error }, { status: 400, headers: rateLimit.headers });
  }

  const planning_result = validateEnum(body.planning, PLANNING_VALUES, 'planning');
  if (planning_result.error) {
    return NextResponse.json({ error: planning_result.error }, { status: 400, headers: rateLimit.headers });
  }

  const spend_result = validateEnum(body.spend, SPEND_VALUES, 'spend');
  if (spend_result.error) {
    return NextResponse.json({ error: spend_result.error }, { status: 400, headers: rateLimit.headers });
  }

  // ── Validate dealbreakers ─────────────────────────────────────────────────

  let dealbreakers: string[] = [];
  if (body.dealbreakers !== undefined && body.dealbreakers !== null) {
    if (!Array.isArray(body.dealbreakers)) {
      return NextResponse.json(
        { error: 'dealbreakers must be an array' },
        { status: 400, headers: rateLimit.headers },
      );
    }
    const raw = (body.dealbreakers as unknown[])
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const deduped = Array.from(new Set(raw));
    const invalid = deduped.find((v) => !DEALBREAKER_VALUES.has(v));
    if (invalid) {
      return NextResponse.json(
        { error: `Invalid dealbreaker: ${invalid}` },
        { status: 400, headers: rateLimit.headers },
      );
    }
    if (deduped.length > 2) {
      return NextResponse.json(
        { error: 'dealbreakers may contain at most 2 values' },
        { status: 400, headers: rateLimit.headers },
      );
    }
    dealbreakers = deduped;
  }

  // ── Free-form fields ──────────────────────────────────────────────────────

  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const location_city = typeof body.location_city === 'string' ? body.location_city.trim() || null : null;
  const location_country =
    typeof body.location_country === 'string' ? body.location_country.trim() || null : null;
  const now = new Date().toISOString();

  // ── Write 1: update users.firstname if name provided ─────────────────────

  if (name) {
    const { error: nameError } = await supabase
      .from('users')
      .update({ firstname: name })
      .eq('id', user.id);

    if (nameError) {
      console.error('[profile] Failed to update firstname:', nameError.message);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500, headers: rateLimit.headers },
      );
    }
  }

  // ── Derive persona scores from answers ────────────────────────────────────

  // NOTE: trip_type + guestcount are not part of this payload; they will be
  // wired in later from the most recent stay if needed. For now we pass null
  // / 1 so derivePersonaScores still returns a stable vector.
  const personaScores = derivePersonaScores({
    novelty: (novelty_result.value as any) ?? null,
    discovery: (discovery_result.value as any) ?? null,
    food: (food_result.value as any) ?? null,
    planning: (planning_result.value as any) ?? null,
    spend: (spend_result.value as any) ?? null,
    vibes,
    trip_type: null,
    guestcount: 1,
  });

  // ── Write 2: upsert user_profiles ─────────────────────────────────────────

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        age_band: age_band_result.value,
        location_city,
        location_country,
        novelty: novelty_result.value,
        vibe: vibes,
        discovery: discovery_result.value,
        food: food_result.value,
        planning: planning_result.value,
        spend: spend_result.value,
        dealbreakers,
        completed: true,
        completed_at: now,
        extra: { persona_scores: personaScores },
      },
      { onConflict: 'user_id' },
    );

  if (profileError) {
    console.error('[profile] Failed to upsert user_profiles:', profileError.message);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500, headers: rateLimit.headers },
    );
  }

  return NextResponse.json({ ok: true }, { headers: rateLimit.headers });
}
