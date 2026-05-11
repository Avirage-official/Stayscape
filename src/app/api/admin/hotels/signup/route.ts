/**
 * POST /api/admin/hotels/signup
 *
 * Hotel admin self-signup endpoint.
 * Creates a new property and links it to the authenticated user as a hotel admin.
 *
 * Auth: Requires Supabase JWT token via Authorization header
 *
 * Body:
 *   hotel_name: string (required) — property name
 *   city: string (required)
 *   country: string (required)
 *   contact_name: string (required) — admin's name
 *   contact_email: string (required) — admin's email
 *   description: string | null (optional)
 *
 * Returns:
 *   201 { property_id: string, hotel_name: string }
 *   400 { error: string } — validation error
 *   401 { error: 'Unauthorized' } — no token or invalid token
 *   500 { error: string } — server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

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

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Extract and validate auth token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Verify token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate required fields
  const { hotel_name, city, country, contact_name, contact_email, description } = body;

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

  try {
    // Create the property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert({
        name: hotel_name.trim(),
        city: city.trim(),
        country: country.trim(),
        timezone: 'UTC',
        slug: `${hotel_name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      })
      .select('id, name')
      .single();

    if (propertyError || !propertyData) {
      return NextResponse.json(
        { error: propertyError?.message || 'Failed to create property' },
        { status: 500 },
      );
    }

    const propertyId = propertyData.id as string;

    // Create or update hotel_admins record
    const { data: existingAdmin, error: existingError } = await supabase
      .from('hotel_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      // Unexpected error
      await supabase.from('properties').delete().eq('id', propertyId);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingAdmin) {
      // User already has an active admin record — don't create another
      // (each user should manage one property for now)
      await supabase.from('properties').delete().eq('id', propertyId);
      return NextResponse.json(
        { error: 'You already have an active hotel admin account' },
        { status: 400 },
      );
    }

    // Create new hotel_admins record
    const { error: adminError } = await supabase.from('hotel_admins').insert({
      user_id: user.id,
      property_id: propertyId,
      name: contact_name.trim(),
      email: contact_email.trim().toLowerCase(),
      status: 'active',
      is_active: true,
      role: 'hotel_admin',
    });

    if (adminError) {
      // Rollback: delete the property
      await supabase.from('properties').delete().eq('id', propertyId);
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        property_id: propertyId,
        hotel_name: hotel_name.trim(),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
