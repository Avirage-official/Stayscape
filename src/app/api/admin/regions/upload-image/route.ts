import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const regionId = form.get('regionId') as string | null;

    if (!file || !regionId) {
      return NextResponse.json({ error: 'Missing file or regionId' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const path = `${regionId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('region-images')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: dbError } = await supabase
      .from('regions')
      .update({ image_path: path })
      .eq('id', regionId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ path });
  } catch (err) {
    console.error('Region image upload error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
