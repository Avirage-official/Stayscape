import { createClient } from '@supabase/supabase-js'
import SupportPageClient from './SupportPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

// Create a fresh client per request — never reuse the module singleton.
// This guarantees no in-memory query cache between requests.
function makeFreshAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: 'no-store' }),
    },
  })
}

async function fetchTiers(): Promise<Tier[]> {
  try {
    const supabase = makeFreshAdminClient()
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
    const supabase = makeFreshAdminClient()
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
