/**
 * POST /api/admin/hotels/[propertyId]/invite-admin
 *
 * Creates a hotel admin invite record and sends an onboarding email.
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { isValidEmail } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface InviteAdminBody {
  admin_name: string;
  admin_email: string;
  admin_phone?: string;
}

function checkAuth(request: NextRequest): boolean {
  const saSession = request.cookies.get('sa_session');
  return Boolean(saSession?.value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId } = await params;

  let body: InviteAdminBody;
  try {
    body = (await request.json()) as InviteAdminBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { admin_name, admin_email, admin_phone } = body;

  if (!admin_name?.trim()) {
    return NextResponse.json({ error: 'admin_name is required' }, { status: 400 });
  }
  if (!admin_email?.trim() || !isValidEmail(admin_email)) {
    return NextResponse.json({ error: 'Valid admin_email is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch the hotel name
  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .select('name')
    .eq('id', propertyId)
    .maybeSingle();

  if (propertyError || !propertyData) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
  }

  const hotelName = (propertyData as { name: string }).name;

  // Generate a secure invite token
  const inviteToken = randomBytes(32).toString('hex');

  // Insert into hotel_admins
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: insertError } = await supabase.from('hotel_admins').insert({
    property_id: propertyId,
    name: admin_name.trim(),
    email: admin_email.trim().toLowerCase(),
    phone: admin_phone?.trim() || null,
    invite_token: inviteToken,
    invite_expires_at: inviteExpiresAt,
    status: 'pending',
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send onboarding email via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const onboardUrl = `${appUrl}/hotel-admin/onboard?token=${inviteToken}`;

  if (!resendApiKey) {
    console.warn('[invite-admin] RESEND_API_KEY not configured — skipping email send');
    return NextResponse.json({
      success: true,
      warning: 'Email not sent — RESEND_API_KEY not configured',
    });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Stayscape <noreply@stayscape.io>',
      to: admin_email.trim(),
      subject: `You're invited to manage ${hotelName} on Stayscape`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0d0d0d;color:#e5e5e5;padding:40px 20px;margin:0">
  <div style="max-width:520px;margin:0 auto">
    <p style="color:#C9A84C;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:24px">Stayscape</p>
    <h1 style="font-size:22px;font-weight:600;margin-bottom:12px">Welcome, ${admin_name}</h1>
    <p style="font-size:14px;color:#a0a0a0;line-height:1.6;margin-bottom:24px">
      You've been invited to manage <strong style="color:#e5e5e5">${hotelName}</strong> on Stayscape.
      Complete your account setup to get started.
    </p>
    <a href="${onboardUrl}"
       style="display:inline-block;background:#C9A84C;color:#000;font-size:13px;font-weight:600;
              padding:12px 24px;border-radius:8px;text-decoration:none;">
      Complete Setup
    </a>
    <p style="font-size:12px;color:#555;margin-top:32px">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`,
      text: `Welcome, ${admin_name}!\n\nYou've been invited to manage ${hotelName} on Stayscape.\n\nComplete your account setup here:\n${onboardUrl}\n\nIf you didn't expect this invitation, you can safely ignore this email.`,
    });
  } catch (emailError) {
    console.error('[invite-admin] Failed to send email:', emailError);
    // Don't fail the whole request — the record is already inserted
    return NextResponse.json({
      success: true,
      warning: 'Invite record created but email delivery failed',
    });
  }

  return NextResponse.json({ success: true });
}
