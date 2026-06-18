import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { enrichPlace } from '@/lib/services/ai/enrichment';
import type { InternalPlace } from '@/types/database';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }

  try {
    // Clear previous error before retry
    await supabase
      .from('places')
      .update({ enrichment_error: null })
      .eq('id', id);

    await enrichPlace(supabase, place as InternalPlace);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('places')
      .update({ enrichment_error: message })
      .eq('id', id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
