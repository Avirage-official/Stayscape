/**
 * GET /api/hotel-admin/me
 *
 * Validates that the authenticated user has an active hotel_admins record.
 * Accepts a Supabase JWT via the Authorization: Bearer <token> header.
 *
 * Returns:
 *   200 { property_id, hotel_name, admin_name }
 *   401 { error: 'Unauthorized' }
 *   404 { error: 'No hotel admin account found' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('hotel_admins')
    .select('name, property_id, properties(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'No hotel admin account found' }, { status: 404 });
  }

  const row = data as unknown as {
    name: string;
    property_id: string;
    properties: { name: string } | null;
  };

  return NextResponse.json({
    property_id: row.property_id,
    hotel_name: row.properties?.name ?? '',
    admin_name: row.name,
  });
}
