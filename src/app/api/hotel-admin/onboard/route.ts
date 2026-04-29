/**
 * GET  /api/hotel-admin/onboard?token=xxx  — validate invite token
 * POST /api/hotel-admin/onboard             — complete onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { isTokenExpired } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/* ── GET ────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('hotel_admins')
    .select('name, email, property_id, status, invite_expires_at, properties(name)')
    .eq('invite_token', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  const row = data as unknown as {
    name: string;
    email: string;
    property_id: string;
    status: string;
    invite_expires_at: string | null;
    properties: { name: string } | null;
  };

  if (row.status === 'pending' && isTokenExpired(row.invite_expires_at)) {
    return NextResponse.json({ error: 'Invite token has expired' }, { status: 410 });
  }

  return NextResponse.json({
    admin_name: row.name,
    hotel_name: row.properties?.name ?? '',
    property_id: row.property_id,
    status: row.status,
  });
}

/* ── POST ───────────────────────────────────────────────────────── */

interface OnboardBody {
  token: string;
  name: string;
  password: string;
}

export async function POST(request: NextRequest) {
  let body: OnboardBody;
  try {
    body = (await request.json()) as OnboardBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { token, name, password } = body;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Look up the pending invite (also check not expired)
  const { data: adminRow, error: lookupError } = await supabase
    .from('hotel_admins')
    .select('id, email, status, invite_expires_at')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .maybeSingle();

  if (lookupError || !adminRow) {
    return NextResponse.json({ error: 'Invalid or already used token' }, { status: 404 });
  }

  const row = adminRow as { id: string; email: string; status: string; invite_expires_at: string | null };

  if (isTokenExpired(row.invite_expires_at)) {
    return NextResponse.json({ error: 'Invite token has expired' }, { status: 410 });
  }

  // Create Supabase Auth user
  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true,
  });

  if (createUserError) {
    return NextResponse.json({ error: createUserError.message }, { status: 500 });
  }

  const authUserId = createdUser.user!.id;

  // Parse name into first/last
  const trimmedName = name.trim();
  const spaceIndex = trimmedName.indexOf(' ');
  const firstName = spaceIndex === -1 ? trimmedName : trimmedName.slice(0, spaceIndex);
  const lastName = spaceIndex === -1 ? null : trimmedName.slice(spaceIndex + 1);

  // Insert into public.users
  // public.users row is auto-created from auth.users via DB trigger, so update it
  const { error: usersUpdateError } = await supabase
    .from('users')
    .update({
      firstname: firstName,
      lastname: lastName,
      email: row.email,
    })
    .eq('id', authUserId);

  if (usersUpdateError) {
    // Roll back the auth user to avoid an orphan
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId);
    if (authDeleteError) {
      console.error('[onboard] Failed to roll back auth user after users update failure:', authDeleteError);
    }
    return NextResponse.json({ error: usersUpdateError.message }, { status: 500 });
  }

  // Mark the invite as active and link the auth user
  const { error: updateError } = await supabase
    .from('hotel_admins')
    .update({
      user_id: authUserId,
      status: 'active',
      is_active: true,
      accepted_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
      name: trimmedName,
    })
    .eq('id', row.id);

  if (updateError) {
    // Delete the auth user to avoid an orphan; public.users should be cleaned up by FK/trigger behavior
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId);
    if (authDeleteError) {
      console.error('[onboard] Failed to roll back auth user after hotel_admins update failure:', authDeleteError);
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
