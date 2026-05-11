/**
 * POST /api/admin/hotels/signup
 *
 * Hotel admin self-signup endpoint.
 * Creates a new property and links it to the authenticated user as a hotel admin.
 *
 * Auth: Requires Supabase JWT token via the Authorization: Bearer <token> header.
 *
 * Body:
 *   hotel_name: string (required)    — property name
 *   city: string (required)
 *   country: string (required)
 *   contact_name: string (required)  — admin's display name
 *   contact_email: string (required) — admin's contact email
 *   description: string | null (optional, currently unused server-side)
 *
 * Returns:
 *   201 { property_id, hotel_name }
 *   400 { error }
 *   401 { error: 'Unauthorized' }
 *   409 { error } — user already has an active hotel admin record
 *   500 { error }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface SignupBody {
  hotel_name?: string;
  city?: string;
  country?: string;
  contact_name?: string;
  contact_email?: string;
  description?: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .split('-')
    .filter(Boolean)
    .join('-');
  // Append short timestamp suffix to avoid collisions on duplicate names
  const suffix = Date.now().toString(36).slice(-6);
  return base ? `${base}-${suffix}` : suffix;
}

export async function POST(request: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

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

  // ── 2. Parse + validate body ─────────────────────────────
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { hotel_name, city, country, contact_name, contact_email } = body;

  if (!hotel_name?.trim()) {
    return NextResponse.json({ error: 'hotel_name is required' }, { status: 400 });
  }
  if (!city?.trim()) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 });
  }
  if (!country?.trim()) {
    return NextResponse.json({ error: 'country is required' }, { status: 400 });
  }
  if (!contact_name?.trim()) {
    return NextResponse.json({ error: 'contact_name is required' }, { status: 400 });
  }
  if (!contact_email?.trim() || !isValidEmail(contact_email)) {
    return NextResponse.json({ error: 'Valid contact_email is required' }, { status: 400 });
  }

  // ── 3. Pre-check: does this user already have an active admin record? ──
  // Block early so we don't create an orphan property.
  const { data: existingAdmin, error: existingError } = await supabase
    .from('hotel_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingAdmin) {
    return NextResponse.json(
      { error: 'You already have an active hotel admin account.' },
      { status: 409 },
    );
  }

  // ── 4. Create property ───────────────────────────────────
  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .insert({
      name: hotel_name.trim(),
      slug: generateSlug(hotel_name.trim()),
      city: city.trim(),
      country: country.trim(),
      timezone: 'UTC',
    })
    .select('id, name')
    .single();

  if (propertyError || !propertyData) {
    return NextResponse.json(
      { error: propertyError?.message ?? 'Failed to create property' },
      { status: 500 },
    );
  }

  const propertyId = (propertyData as { id: string; name: string }).id;

  // ── 5. Create hotel_admins record ────────────────────────
  const nowIso = new Date().toISOString();
  const { error: adminError } = await supabase.from('hotel_admins').insert({
    user_id: user.id,
    property_id: propertyId,
    name: contact_name.trim(),
    email: contact_email.trim().toLowerCase(),
    role: 'hotel_admin',
    status: 'active',
    is_active: true,
    accepted_at: nowIso,
    onboarded_at: nowIso,
  });

  if (adminError) {
    // Rollback: delete the property we just created
    await supabase.from('properties').delete().eq('id', propertyId);
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  // ── 6. Success ───────────────────────────────────────────
  return NextResponse.json(
    {
      property_id: propertyId,
      hotel_name: (propertyData as { name: string }).name,
    },
    { status: 201 },
  );
}
