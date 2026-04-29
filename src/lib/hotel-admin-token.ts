import { getSupabaseBrowser } from '@/lib/supabase/client';

export async function getHotelAdminToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
