import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

function guardAdmin(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const guard = guardAdmin(request);
  if (guard) return guard;

  const { id } = await params;

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  // Whitelist only editable fields — never allow id, region_id, external_source, etc.
  const allowed = [
    'name', 'category', 'city', 'address', 'phone', 'website', 'booking_url',
    'image_url', 'image_urls', 'editorial_summary', 'description',
    'rating', 'price_level', 'is_featured', 'vibes', 'best_for', 'recommended_duration',
  ];

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('places').update(update).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
