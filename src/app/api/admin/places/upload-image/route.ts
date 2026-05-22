/**
 * POST /api/admin/places/upload-image
 *
 * Uploads a hero image for a place to the `place-images` Supabase
 * storage bucket and updates places.image_url with the public URL.
 *
 * Form fields:
 *   file     — the image file (JPEG / PNG / WebP)
 *   placeId  — the place UUID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { requireAdminKey } from '@/lib/auth/require-admin-key';

const BUCKET = 'place-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const placeId = form.get('placeId') as string | null;

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
    const path = `${placeId}/hero.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();

    // Remove any existing hero images for this place
    await supabase.storage.from(BUCKET).remove([
      `${placeId}/hero.jpg`,
      `${placeId}/hero.png`,
      `${placeId}/hero.webp`,
    ]);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Update the place record
    const { error: updateError } = await supabase
      .from('places')
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', placeId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ url: publicUrl, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
