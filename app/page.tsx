import type { Metadata } from 'next'
import { DemoShowcase } from '@/src/landing/DemoShowcase'
import { FeatureCards } from '@/src/landing/FeatureCards'
import { Footer } from '@/src/landing/Footer'
import { HeroCopy } from '@/src/landing/HeroCopy'
import { HomepageReel } from '@/src/landing/HomepageReel'
import { HowItWorks } from '@/src/landing/HowItWorks'

export const metadata: Metadata = {
  // `absolute` skips the layout's "%s · Molecular" template — the home
  // title is already the long-form site title.
  title: { absolute: 'Molecular — Build atoms, form molecules, run reactions in 3D' },
  description:
    'A free, interactive 3D chemistry playground for students and teachers. Browse a curated molecule library, build atoms with a drag-and-snap interface, run guided reaction demonstrations, and explore the periodic table with an AI tutor.',
  alternates: { canonical: '/' },
}

// JSON-LD structured data — schema.org WebApplication helps Google
// understand the site is an interactive education tool and unlocks
// richer search results (App, EducationalAudience).
const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Molecular',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web Browser',
  description:
    'A free, interactive 3D chemistry playground for students and teachers. Build atoms, run reactions, and explore the periodic table.',
  educationalUse: ['Demonstration', 'Activity', 'Exploration'],
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: ['student', 'teacher'],
  },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function HomePage() {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted constant JSON-LD payload */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted constant JSON-LD payload
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <section className="relative min-h-dvh overflow-hidden">
        <HomepageReel />
        <HeroCopy />
      </section>
      <FeatureCards />
      <DemoShowcase />
      <HowItWorks />
      <Footer />
    </>
  )
}
