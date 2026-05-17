/**
 * POST /api/hotel-admin/integrations/test
 *
 * Runs a live connection test against the configured PMS for the
 * authenticated hotel admin's property. Calls testConnection() on the
 * adapter and returns the result.
 *
 * Returns: { data: { ok: boolean; error?: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { getAdapterForProperty } from '@/lib/pms/router';

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

export async function POST(request: NextRequest) {
  const propertyId = await resolvePropertyId(request);
  if (!propertyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adapter = await getAdapterForProperty(propertyId);

    if (!adapter) {
      // Manual provider — no PMS to test
      return NextResponse.json({
        data: { ok: false, error: 'No PMS integration configured (manual mode).' },
      });
    }

    const result = await adapter.testConnection();
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ data: { ok: false, error: message } });
  }
}
