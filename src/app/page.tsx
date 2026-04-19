import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import PitchStory from '@/components/landing/PitchStory'
import PainPointStats from '@/components/landing/PainPointStats'
import ProductWalkthrough from '@/components/landing/ProductWalkthrough'
import BenefitSection from '@/components/landing/BenefitSection'
import AppPreview from '@/components/landing/AppPreview'
import HowItWorks from '@/components/landing/HowItWorks'
import Testimonials from '@/components/landing/Testimonials'
import FinalCTA from '@/components/landing/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0f0e0d' }}>
      <LandingNav />
      <main>
        <HeroSection />
        <PitchStory />
        <PainPointStats />
        <ProductWalkthrough />
        <BenefitSection />
        <AppPreview />
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
