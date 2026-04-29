import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { loadConversation } from '@/lib/supabase/aria-conversation-repository';

interface StayOwnerRow {
  id: string;
}

export async function GET(request: NextRequest) {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') ?? null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimit.headers },
    );
  }

  const stayId = request.nextUrl.searchParams.get('stayId');
  if (!stayId) {
    return NextResponse.json(
      { error: 'Missing stayId' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // Verify the stay belongs to the authenticated user
  const { data: stay } = await supabase
    .from('stays')
    .select('id')
    .eq('id', stayId)
    .eq('userid', user.id)
    .maybeSingle<StayOwnerRow>();

  if (!stay) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: rateLimit.headers },
    );
  }

  const messages = await loadConversation(stayId);
  return NextResponse.json({ messages }, { headers: rateLimit.headers });
}
