import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Hotels — Elevate Your Guest Experience',
  description: 'Give your guests a smarter stay. Stayscape connects hotels with travellers through an AI-powered concierge — requests, recommendations, and real-time communication in one place.',
  openGraph: {
    title: 'For Hotels — Elevate Your Guest Experience | Stayscape',
    description: 'Give your guests a smarter stay. Stayscape connects hotels with travellers through an AI-powered concierge.',
    url: 'https://www.thestayscape.com/hotels',
  },
  twitter: {
    title: 'For Hotels — Elevate Your Guest Experience | Stayscape',
    description: 'Give your guests a smarter stay. Stayscape connects hotels with travellers through an AI-powered concierge.',
  },
}

import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import PitchStory from '@/components/landing/PitchStory'
import ProductWalkthrough from '@/components/landing/ProductWalkthrough'
import BenefitSection from '@/components/landing/BenefitSection'
import HowItWorks from '@/components/landing/HowItWorks'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <LandingNav />
      <main>
        <HeroSection />
        <PitchStory />
        <ProductWalkthrough />
        <BenefitSection />
        <HowItWorks />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
