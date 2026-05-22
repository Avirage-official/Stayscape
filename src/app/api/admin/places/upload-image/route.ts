/**
 * POST /api/admin/places/upload-image
 *
 * Uploads a hero image for a place to the `place-images` Supabase
 * storage bucket and updates places.image_url with the public URL.
 *
 * Form fields:
 *   file     — the image file (JPEG / PNG / WebP)
 *   placeId  — the place UUID
 *   slot     — "primary" | "extra" (default: primary)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { verifyAdminSession } from '@/lib/auth/admin-session';

const BUCKET = 'place-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get('sa_session')?.value ?? '';
  if (!verifyAdminSession(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const placeId = form.get('placeId') as string | null;
    const slot = (form.get('slot') as string | null) ?? 'primary';

    if (!file || !placeId) {
      return NextResponse.json({ error: 'file and placeId are required' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = slot === 'primary' ? `hero.${ext}` : `extra_${Date.now()}.${ext}`;
    const path = `${placeId}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();

    if (slot === 'primary') {
      await supabase.storage.from(BUCKET).remove([
        `${placeId}/hero.jpg`,
        `${placeId}/hero.png`,
        `${placeId}/hero.webp`,
      ]);
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

    if (slot === 'primary') {
      const { error: updateError } = await supabase
        .from('places')
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', placeId);
      if (updateError) throw new Error(updateError.message);
    }

    return NextResponse.json({ url: publicUrl, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
