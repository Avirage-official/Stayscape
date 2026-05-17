/**
 * GET  /api/hotel-admin/integrations  — load current PMS config
 * PUT  /api/hotel-admin/integrations  — save PMS config
 *
 * Scoped to the authenticated hotel admin's property only.
 * API credentials are never returned to the client; only boolean indicators
 * (has_credentials, has_webhook_secret) are exposed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SUPPORTED_PROVIDERS } from '@/lib/pms/router';

async function resolvePropertyId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const { data } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  return (data?.property_id as string) ?? null;
}

export async function GET(request: NextRequest) {
  const propertyId = await resolvePropertyId(request);
  if (!propertyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pms_config')
    .select('provider, api_endpoint, api_key_encrypted, webhook_secret, is_active, health_status, last_health_check, mews_enterprise_id')
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load integration config' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      data: {
        provider: 'manual',
        api_endpoint: null,
        has_credentials: false,
        has_webhook_secret: false,
        is_active: false,
        health_status: null,
        last_health_check: null,
        mews_enterprise_id: null,
      },
    });
  }

  const row = data as {
    provider: string;
    api_endpoint: string | null;
    api_key_encrypted: string | null;
    webhook_secret: string | null;
    is_active: boolean;
    health_status: string | null;
    last_health_check: string | null;
    mews_enterprise_id: string | null;
  };

  return NextResponse.json({
    data: {
      provider: row.provider,
      api_endpoint: row.api_endpoint,
      has_credentials: !!row.api_key_encrypted,
      has_webhook_secret: !!row.webhook_secret,
      is_active: row.is_active,
      health_status: row.health_status,
      last_health_check: row.last_health_check,
      mews_enterprise_id: row.mews_enterprise_id,
    },
  });
}

export async function PUT(request: NextRequest) {
  const propertyId = await resolvePropertyId(request);
  if (!propertyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    provider?: string;
    is_active?: boolean;
    api_endpoint?: string;
    client_token?: string;
    access_token?: string;
    webhook_secret?: string;
    mews_enterprise_id?: string;
  };

  if (!body.provider || !(SUPPORTED_PROVIDERS as readonly string[]).includes(body.provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${SUPPORTED_PROVIDERS.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Build the update payload
  const update: Record<string, unknown> = {
    provider: body.provider,
    is_active: body.is_active ?? false,
    api_endpoint: body.api_endpoint?.trim() || null,
    mews_enterprise_id: body.mews_enterprise_id?.trim() || null,
  };

  // Only update credentials if new ones were supplied
  if (body.client_token && body.access_token) {
    update.api_key_encrypted = JSON.stringify({
      ClientToken: body.client_token.trim(),
      AccessToken: body.access_token.trim(),
    });
  }

  if (body.webhook_secret !== undefined) {
    update.webhook_secret = body.webhook_secret.trim() || null;
  }

  // Upsert — creates the row if it doesn't exist yet
  const { error } = await supabase
    .from('pms_config')
    .upsert(
      { property_id: propertyId, ...update },
      { onConflict: 'property_id' },
    );

  if (error) {
    console.error('[hotel-admin/integrations] upsert error:', error.message);
    return NextResponse.json({ error: 'Failed to save integration config' }, { status: 500 });
  }

  return NextResponse.json({ data: { saved: true } });
}
