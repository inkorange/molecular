import type { Metadata } from 'next'
import { ElementsExplorer } from '@/src/elements/ElementsExplorer'

const PAGE_TITLE = 'Periodic Table of Elements'
const PAGE_DESCRIPTION =
  'Explore the periodic table in interactive 3D. Tap any element to see its atom — protons and neutrons swirling inside a translucent nucleus, electrons orbiting on shells — plus discovery, common uses, and everyday examples.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'periodic table',
    'elements',
    '3D periodic table',
    'interactive periodic table',
    'chemistry for students',
    'atomic structure',
    'electrons',
    'protons',
    'neutrons',
    'chemistry education',
  ],
  alternates: { canonical: '/elements' },
  openGraph: {
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
    url: '/elements',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
  },
}

export default function ElementsIndexPage() {
  return <ElementsExplorer initialSlug={null} />
}
