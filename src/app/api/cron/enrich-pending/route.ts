/**
 * POST /api/cron/enrich-pending
 *
 * Vercel Cron Job: Daily AI enrichment backfill at 4am UTC
 * Calls the admin enrich endpoint to process places where ai_enriched_at IS NULL.
 *
 * Auth: Vercel CRON_SECRET (Bearer token in Authorization header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/verify-cron-secret';
import { getAdminSyncKey } from '@/lib/env';

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

    const response = await fetch(`${baseUrl}/api/admin/enrich/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminSyncKey,
      },
      body: JSON.stringify({
        limit: 100,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Enrichment failed: ${data.error || response.statusText}` },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI enrichment completed',
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] enrich-pending error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
