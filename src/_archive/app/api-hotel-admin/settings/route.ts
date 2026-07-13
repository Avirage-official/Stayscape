/**
 * GET  /api/hotel-admin/settings  — load property + branding for settings page
 * PATCH /api/hotel-admin/settings  — save a section (property | timezone | branding)
 *
 * Body for PATCH: { section: 'property' | 'timezone' | 'branding', ...fields }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// ── Auth helper ──────────────────────────────────────────────────────────────

async function resolveAdmin(request: NextRequest): Promise<
  { propertyId: string; error: null } | { propertyId: null; error: NextResponse }
> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  if (!token) return { propertyId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { propertyId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: admin } = await supabase
    .from('hotel_admins')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!admin) return { propertyId: null, error: NextResponse.json({ error: 'Not a hotel admin' }, { status: 403 }) };
  return { propertyId: admin.property_id, error: null };
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await resolveAdmin(request);
  if (auth.error) return auth.error;
  const { propertyId } = auth;

  const supabase = getSupabaseAdmin();

  const [propRes, brandRes] = await Promise.all([
    supabase.from('properties').select('name, city, country, address, timezone').eq('id', propertyId).maybeSingle(),
    supabase.from('hotel_branding').select('concierge_name, concierge_tone, accent_color').eq('property_id', propertyId).maybeSingle(),
  ]);

  const p = propRes.data  ?? {};
  const b = brandRes.data ?? {};

  return NextResponse.json({
    name:            (p as Record<string,unknown>).name            ?? '',
    city:            (p as Record<string,unknown>).city            ?? '',
    country:         (p as Record<string,unknown>).country         ?? '',
    address:         (p as Record<string,unknown>).address         ?? '',
    timezone:        (p as Record<string,unknown>).timezone        ?? 'Asia/Singapore',
    concierge_name:  (b as Record<string,unknown>).concierge_name  ?? 'Aria',
    concierge_tone:  (b as Record<string,unknown>).concierge_tone  ?? 'warm',
    accent_color:    (b as Record<string,unknown>).accent_color    ?? '#C9A84C',
  });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

interface PatchBody {
  section: 'property' | 'timezone' | 'branding';
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  timezone?: string;
  concierge_name?: string;
  concierge_tone?: string;
  accent_color?: string;
}

export async function PATCH(request: NextRequest) {
  const auth = await resolveAdmin(request);
  if (auth.error) return auth.error;
  const { propertyId } = auth;

  let body: PatchBody;
  try { body = (await request.json()) as PatchBody; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (body.section === 'property') {
    const { name, city, country, address } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 });
    const { error } = await supabase.from('properties').update({
      name: name.trim(),
      city: city?.trim() ?? '',
      country: country?.trim() ?? '',
      address: address?.trim() ?? null,
      updatedat: now,
    }).eq('id', propertyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.section === 'timezone') {
    const { timezone } = body;
    if (!timezone) return NextResponse.json({ error: 'Timezone is required' }, { status: 400 });
    // Validate it's a real IANA timezone
    try { Intl.DateTimeFormat(undefined, { timeZone: timezone }); } catch {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }
    const { error } = await supabase.from('properties').update({ timezone, updatedat: now }).eq('id', propertyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.section === 'branding') {
    const { concierge_name, concierge_tone, accent_color } = body;
    // Validate accent colour is a hex string
    if (accent_color && !/^#[0-9A-Fa-f]{3,6}$/.test(accent_color)) {
      return NextResponse.json({ error: 'Invalid accent colour — must be a hex value like #C9A84C' }, { status: 400 });
    }
    // Upsert so a hotel without a branding row yet still works
    const { error } = await supabase.from('hotel_branding').upsert({
      property_id:     propertyId,
      concierge_name:  concierge_name?.trim() || 'Aria',
      concierge_tone:  concierge_tone ?? 'warm',
      accent_color:    accent_color   ?? '#C9A84C',
      updated_at:      now,
    }, { onConflict: 'property_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown section' }, { status: 400 });
}
