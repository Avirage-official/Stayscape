/**
 * /api/stays/[stayId]/notes
 *
 * Guest's private notes on their itinerary. Trip-level (no item link)
 * or per-item (with itinerary_item_id).
 *
 * Auth: Bearer token (Supabase session). Owner of the stay only.
 *
 * Schema (run this when ready):
 *   CREATE TABLE itinerary_notes (
 *     id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     stayid             uuid NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
 *     userid             uuid NOT NULL REFERENCES users(id),
 *     itinerary_item_id  uuid REFERENCES itineraryitems(id) ON DELETE CASCADE,
 *     body               text NOT NULL,
 *     created_at         timestamptz NOT NULL DEFAULT now(),
 *     updated_at         timestamptz NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX idx_itinerary_notes_stay ON itinerary_notes(stayid);
 *   CREATE INDEX idx_itinerary_notes_item ON itinerary_notes(itinerary_item_id);
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface CreateBody {
  body?: unknown;
  itinerary_item_id?: unknown;
}

async function authenticate(
  request: NextRequest,
  stayId: string,
): Promise<
  | { ok: true; userId: string; rateLimitHeaders: Record<string, string> }
  | { ok: false; response: NextResponse }
> {
  const rateLimit = await applyRateLimit(request);
  if (!rateLimit.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimit.headers },
      ),
    };
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: rateLimit.headers },
      ),
    };
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: rateLimit.headers },
      ),
    };
  }

  // Verify the user owns this stay
  const { data: stay } = await supabase
    .from('stays')
    .select('id, userid')
    .eq('id', stayId)
    .maybeSingle();

  if (!stay || (stay as { userid: string | null }).userid !== user.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: rateLimit.headers },
      ),
    };
  }

  return { ok: true, userId: user.id, rateLimitHeaders: rateLimit.headers };
}

/* ─── GET — list notes for the stay ─── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const { stayId } = await params;
  const auth = await authenticate(request, stayId);
  if (!auth.ok) return auth.response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('itinerary_notes')
    .select('*')
    .eq('stayid', stayId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load notes' },
      { status: 500, headers: auth.rateLimitHeaders },
    );
  }

  return NextResponse.json(
    { data: data ?? [] },
    { headers: auth.rateLimitHeaders },
  );
}

/* ─── POST — create a note ─── */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const { stayId } = await params;
  const auth = await authenticate(request, stayId);
  if (!auth.ok) return auth.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: auth.rateLimitHeaders },
    );
  }

  if (typeof body.body !== 'string' || body.body.trim().length === 0) {
    return NextResponse.json(
      { error: 'body is required' },
      { status: 400, headers: auth.rateLimitHeaders },
    );
  }

  const noteBody = body.body.trim();
  if (noteBody.length > 2000) {
    return NextResponse.json(
      { error: 'Note is too long (max 2000 characters)' },
      { status: 400, headers: auth.rateLimitHeaders },
    );
  }

  const itineraryItemId =
    typeof body.itinerary_item_id === 'string' && body.itinerary_item_id.length > 0
      ? body.itinerary_item_id
      : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('itinerary_notes')
    .insert({
      stayid: stayId,
      userid: auth.userId,
      itinerary_item_id: itineraryItemId,
      body: noteBody,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[notes/POST] insert error:', error?.message);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500, headers: auth.rateLimitHeaders },
    );
  }

  return NextResponse.json(
    { ok: true, note: data },
    { headers: auth.rateLimitHeaders },
  );
}

/* ─── DELETE — remove a note by ?id=... ─── */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> },
) {
  const { stayId } = await params;
  const auth = await authenticate(request, stayId);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const noteId = url.searchParams.get('id');
  if (!noteId) {
    return NextResponse.json(
      { error: 'Missing note id' },
      { status: 400, headers: auth.rateLimitHeaders },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('itinerary_notes')
    .delete()
    .eq('id', noteId)
    .eq('stayid', stayId)
    .eq('userid', auth.userId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500, headers: auth.rateLimitHeaders },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: auth.rateLimitHeaders },
  );
}
