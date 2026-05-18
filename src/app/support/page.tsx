import { getSupabaseAdmin } from '@/lib/supabase/client'
import SupportPageClient from './SupportPageClient'

export interface Tier {
  slug: string
  name: string
  price_sgd: number
  tagline: string
  perks: string[]
  is_limited: boolean
  total_spots: number | null
  stripe_payment_link: string
  display_order: number
}

export interface EarlyProgress {
  total_pledged_sgd: number
  total_backers: number
  goal_sgd: number
}

async function fetchTiers(): Promise<Tier[]> {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('early_tiers')
      .select(
        'slug, name, price_sgd, tagline, perks, is_limited, total_spots, stripe_payment_link, display_order',
      )
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error || !data) return []
    return data as Tier[]
  } catch {
    return []
  }
}

async function fetchProgress(): Promise<EarlyProgress> {
  const fallback: EarlyProgress = {
    total_pledged_sgd: 0,
    total_backers: 0,
    goal_sgd: 15000,
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('early_progress')
      .select('total_pledged_sgd, total_backers, goal_sgd')
      .single()

    if (error || !data) return fallback
    return data as EarlyProgress
  } catch {
    return fallback
  }
}

export default async function SupportPage() {
  const [tiers, progress] = await Promise.all([fetchTiers(), fetchProgress()])

  return <SupportPageClient tiers={tiers} initialProgress={progress} />
}
