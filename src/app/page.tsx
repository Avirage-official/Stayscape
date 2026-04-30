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
