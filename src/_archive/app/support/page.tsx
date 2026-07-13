import { getSupabaseAdmin } from '@/lib/supabase/client'
import SupportPageClient from './SupportPageClient'

export const dynamic = 'force-dynamic'

export interface EarlyProgress {
  total_pledged_sgd: number
  total_backers: number
  goal_sgd: number
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
  const progress = await fetchProgress()
  return <SupportPageClient initialProgress={progress} />
}
