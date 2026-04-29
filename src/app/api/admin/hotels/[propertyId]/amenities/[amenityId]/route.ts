/**
 * DELETE /api/admin/hotels/[propertyId]/amenities/[amenityId]
 *
 * Deletes a single amenity, verifying ownership (property_id must match).
 * Auth: requires `sa_session` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string; amenityId: string }> },
) {
  const saSession = request.cookies.get('sa_session');
  if (!saSession?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { propertyId, amenityId } = await params;
  const supabase = getSupabaseAdmin();

  try {
    const { error } = await supabase
      .from('hotel_amenities')
      .delete()
      .eq('id', amenityId)
      .eq('property_id', propertyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
