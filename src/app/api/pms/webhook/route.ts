/**
 * POST /api/pms/webhook
 *
 * Receives booking confirmations from hotel PMS systems.
 * Creates/upserts the guest user, property, and stay, then
 * triggers AI curation to pre-generate curated content.
 *
 * Authentication: API key via X-PMS-API-Key header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookBooking } from '@/lib/supabase/pms-repository';
import { curateStay } from '@/lib/services/ai/stay-curation';
import { createRegionForProperty, seedPlacesForRegion } from '@/lib/services/ai/region-creation';
import type { PmsBookingPayload } from '@/types/pms';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function regionHasFreshData(regionId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - ONE_DAY_MS).toISOString();
  const { data, error } = await supabase
    .from('places')
    .select('id')
    .eq('region_id', regionId)
    .eq('is_active', true)
    .gte('last_synced_at', cutoff)
    .limit(1);

  if (error) {
    console.warn(
      '[pms webhook] Failed to check region freshness, proceeding with curation.',
      error.message,
    );
    return false;
  }
  return (data?.length ?? 0) > 0;
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
    // Validate API key
    const apiKey = request.headers.get('x-pms-api-key');
    const expectedKey = process.env.PMS_WEBHOOK_API_KEY;

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'PMS webhook not configured' },
        { status: 503, headers: rateLimit.headers },
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: rateLimit.headers },
      );
    }

    // Parse and validate payload
    const body = (await request.json()) as PmsBookingPayload;

    if (!body.booking_reference || !body.guest?.email || !body.property?.pms_property_id) {
      return NextResponse.json(
        {
          error: 'Missing required fields: booking_reference, guest.email, property.pms_property_id',
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (!body.check_in || !body.check_out) {
      return NextResponse.json(
        { error: 'Missing required fields: check_in, check_out' },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Process the webhook
    const result = await processWebhookBooking(body);

    // Trigger AI curation asynchronously (fire-and-forget), unless region data is already fresh
    let curationTriggered = false;
    let regionCreated = false;
    let curationSkippedReason: 'region_data_fresh' | null = null;

    if (result.region_id === null && result.property_id) {
      // No matching region — create one via AI, seed places, then curate
      regionCreated = true;
      curationTriggered = true;
      console.log(
        '[pms webhook] No region — creating region + seeding places for property:',
        result.property_id,
      );
      const city = body.property.city ?? null;
      const country = body.property.country ?? null;
      const stayId = result.stay_id;
      (async () => {
        try {
          const newRegionId = await createRegionForProperty(result.property_id);
          if (newRegionId && city && country) {
            await seedPlacesForRegion(newRegionId, city, country);
          }
          await curateStay(stayId).then(
            (curation) => {
              console.log(
                'Curation completed for stay:',
                stayId,
                curation.curations_created,
                'curations created',
              );
            },
            (err) => {
              console.error('Curation failed for stay:', stayId, err);
            },
          );
        } catch (err) {
          console.error('[pms webhook] Region creation / seeding failed:', err);
        }
      })();
    } else if (result.region_id) {
      const isFresh = await regionHasFreshData(result.region_id);
      if (isFresh) {
        curationSkippedReason = 'region_data_fresh';
        console.log(
          '[pms webhook] Skipping curation for stay:',
          result.stay_id,
          'reason:',
          curationSkippedReason,
        );
      } else {
        curationTriggered = true;
        curateStay(result.stay_id).then(
          (curation) => {
            console.log(
              'Curation completed for stay:',
              result.stay_id,
              curation.curations_created,
              'curations created',
            );
          },
          (err) => {
            console.error('Curation failed for stay:', result.stay_id, err);
          },
        );
      }
    }

    return NextResponse.json(
      {
        data: {
          ...result,
          message: 'Booking processed successfully',
          curation_triggered: curationTriggered,
          region_created: regionCreated,
          ...(curationSkippedReason
            ? { curation_skipped_reason: curationSkippedReason }
            : {}),
        },
      },
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
