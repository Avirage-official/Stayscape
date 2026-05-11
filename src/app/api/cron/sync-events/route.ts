/**
 * POST /api/cron/sync-events
 *
 * Vercel Cron Job: Daily events sync every day at 3am UTC
 * Calls the admin events sync endpoint for all active regions,
 * covering the next 30 days from today.
 *
 * Auth: Vercel CRON_SECRET (Bearer token in Authorization header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/verify-cron-secret';
import { getAdminSyncKey } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Verify Vercel cron authorization
  const cronError = verifyCronSecret(request);
  if (cronError) return cronError;

  try {
    const adminSyncKey = getAdminSyncKey();
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000';

    // Get all active regions
    const supabase = getSupabaseAdmin();
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('id, latitude, longitude, radius_km')
      .eq('is_active', true)
      .order('name');

    if (regionsError) {
      throw new Error(`Failed to load active regions: ${regionsError.message}`);
    }

    if (!regions || regions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active regions to sync',
        data: { regions_processed: 0, results: [] },
      });
    }

    // Calculate date range: today through +30 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateFrom = today.toISOString().split('T')[0];

    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setUTCDate(thirtyDaysOut.getUTCDate() + 30);
    const dateTo = thirtyDaysOut.toISOString().split('T')[0];

    // Sync events for each active region
    const results = [];
    for (const region of regions) {
      try {
        const response = await fetch(`${baseUrl}/api/admin/sync/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminSyncKey,
          },
          body: JSON.stringify({
            region_id: region.id,
            latitude: region.latitude,
            longitude: region.longitude,
            radius_km: region.radius_km,
            date_from: dateFrom,
            date_to: dateTo,
          }),
        });

        const data = await response.json();

        results.push({
          region_id: region.id,
          status: response.ok ? 'ok' : 'error',
          response: data,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          region_id: region.id,
          status: 'error',
          error: message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Events sync completed',
      data: {
        regions_processed: regions.length,
        date_range: { from: dateFrom, to: dateTo },
        results,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] sync-events error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
