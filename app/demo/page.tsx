import type { Metadata } from 'next'
import { DemoPicker } from '@/src/demo/DemoPicker'

const PAGE_TITLE = 'Chemistry Demonstrations'
const PAGE_DESCRIPTION =
  'Pick a chemistry demonstration to play with your class. Step-by-step 3D reactions with animation effects keyed to the reaction type — synthesis, combustion, decomposition, neutralization, and displacement. Designed for elementary and advanced audiences.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'chemistry demonstrations',
    'chemistry for kids',
    'chemistry for students',
    'chemistry teacher tools',
    'chemistry classroom',
    'chemistry simulations',
    'reaction animations',
    'synthesis reaction',
    'combustion reaction',
    'decomposition reaction',
    'neutralization reaction',
    'displacement reaction',
  ],
  alternates: { canonical: '/demo' },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: '/demo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

export default function DemoIndexPage() {
  return <DemoPicker />
}
