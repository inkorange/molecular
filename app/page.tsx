import { FeatureCards } from '@/src/landing/FeatureCards'
import { Footer } from '@/src/landing/Footer'
import { HeroCopy } from '@/src/landing/HeroCopy'
import { HomepageReel } from '@/src/landing/HomepageReel'
import { HowItWorks } from '@/src/landing/HowItWorks'

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-dvh overflow-hidden">
        <HomepageReel />
        <HeroCopy />
      </section>
      <FeatureCards />
      <HowItWorks />
      <Footer />
    </>
  )
}
