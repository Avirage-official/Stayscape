'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import ProfileOnboardingFlow from '@/components/profile/ProfileOnboardingFlow'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace('/signup')
      return
    }

    // Check if profile already completed — get session token from Supabase
    const supabase = getSupabaseBrowser()
    if (!supabase) { setChecking(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token
      if (!token) { setChecking(false); return }

      fetch('/api/customer/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then((data: { completed?: boolean }) => {
          if (data.completed) {
            router.replace('/dashboard')
          } else {
            setChecking(false)
          }
        })
        .catch(() => setChecking(false))
    })
  }, [user, isLoading, router])

  if (isLoading || checking) {
    return (
      <div style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        color: '#999',
        fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  if (!user) return null

  return (
    <ProfileOnboardingFlow
      userId={user.id}
      onCompleted={() => router.replace('/dashboard')}
    />
  )
}
